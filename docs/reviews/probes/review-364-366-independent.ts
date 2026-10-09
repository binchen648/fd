import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { execFileSync } from 'node:child_process';
import { resolve } from 'node:path';
import { pathToFileURL } from 'node:url';

async function main() {
  const root = process.cwd();
  const head = execFileSync('git', ['rev-parse', 'HEAD'], { encoding: 'utf8' }).trim();
  const isMhx = head === 'edfe2ee2e21b484d2b01824f6117d364d1af835b';
  if (!isMhx && head !== 'beb472cd2c8e02d8d06bca5a6159865d16391aa5') throw new Error('Wrong exact candidate checkout');
  const rules = await import(pathToFileURL(resolve(root, 'packages/rules/src/index.ts')).href);
  const seeded = await import(pathToFileURL(resolve(root, 'packages/rules/src/tools/seeded-state.ts')).href);
  const content = await import(pathToFileURL(resolve(root, 'packages/content/src/index.ts')).href);
  const read = (path: string) => JSON.parse(readFileSync(resolve(root, path), 'utf8'));
  const results: Array<{name: string; pass: boolean; detail?: string}> = [];
  const check = (name: string, fn: () => void) => {
    try { fn(); results.push({name, pass: true}); }
    catch (error) { results.push({name, pass: false, detail: String(error)}); }
  };
  const f1 = JSON.parse(execFileSync('git', ['show', '59f145434695d29bdd17e4cb3adc887e84182377:data/phase3/full-roster-ability-inventory.json'], {encoding:'utf8', maxBuffer:20_000_000}));
  const mhxId = 'servant.mhx.skill.sc-mhx-3';
  if (isMhx) {
    const raw = read('data/authoring/servants/servant.mhx.json');
    check('MHX exact frozen printed text, clauses and source references', () => {
      const row = f1.staticSkills.find((row: any) => row.canonicalCardId === mhxId);
      assert.equal(raw.cards[0].printedText, row.printedText);
      assert.deepEqual(raw.cards[0].abilities.map((a: any) => a.printedClause), row.clauses.map((c: any) => c.text));
      assert.deepEqual(raw.cards[0].phase3Evidence.f1SourceReferences, row.sources);
    });
    const setup = (ownCost = 4, opponentCost = 6) => {
      const fixture=structuredClone(raw);
      for (const [id,cost] of [['fixture.own-np',ownCost],['fixture.opponent-np',opponentCost]] as const) fixture.cards.push({id,name:id,cardType:'basic_attack',cardFace:{attributes:['\u5b9d\u5177'],cost,basePower:1},playTiming:{phase:'action',window:'controller_play_card_window'},playRequirements:[],abilities:[]});
      const pack=rules.loadAuthoringJson(fixture);assert.deepEqual(pack.report,[]);
      const state = seeded.createSeededGameState({activeSeats:[1,2,3]});
      state.cards = [];
      state.round.activePhase = 'battle';
      state.players[0].servantCardId = raw.id;
      state.players[0].vp = 0;
      state.players[0].locationId = state.players[1].locationId = 'shinto';
      state.players[2].locationId = 'miyama_town';
      rules.initializeAbilityRuntime(state, pack, {seed:364});
      state.cards.push({instanceId:'mhx-source',definitionId:mhxId,ownerPlayerId:'p1',controllerPlayerId:'p1',zone:'skill',visibility:{scope:'owner_only',ownerPlayerId:'p1'}});
      for (const [playerId,definitionId,cost] of [['p1','fixture.own-np',ownCost],['p2','fixture.opponent-np',opponentCost]] as const) {
        if (!cost) continue;
        state.round.activePhase='action';state.round.prioritySeat=playerId==='p1'?1:2;
        state.players.find((p:any)=>p.id===playerId).mana=20;
        state.cards.push({instanceId:definitionId,definitionId,ownerPlayerId:playerId,controllerPlayerId:playerId,zone:'hand',visibility:{scope:'owner_only',ownerPlayerId:playerId}});
        assert.equal(rules.dispatchAbilityCommand(state,playerId,{type:'play_card',cardInstanceId:definitionId}).ok,true);
      }
      state.round.activePhase='battle';state.round.prioritySeat=1;
      const event = {id:'result',type:'after_battle_result_determined',battlePhaseResolutionId:'phase',battleId:'shinto-battle',resultId:'result',battlefieldId:'shinto',battleParticipantIds:['p1','p2'],battleResult:{winners:['p2'],loserIds:['p1']}};
      return {state,event};
    };
    const resolveResponses = (state: any) => {
      for (let i=0;i<4;i++) {
        const action = rules.getLegalActions(state,'p1').find((a:any)=>a.type==='resolve_response');
        if (!action) break;
        assert.equal(rules.dispatchAbilityCommand(state,'p1',action).ok,true);
      }
    };
    check('No bloom when controller played no NP',()=>{const {state,event}=setup(0);rules.processAbilityEvent(state,event);assert.equal(state.abilityRuntime.responseWindows.length,0);});
    check('Different battlefield result excluded',()=>{const {state,event}=setup();event.battleParticipantIds=['p2','p3'];rules.processAbilityEvent(state,event);assert.equal(state.abilityRuntime.responseWindows.length,0);});
    check('Cost 3 gives base +1 without threshold bonus and replay duplicates',()=>{const {state,event}=setup(3,2);rules.processAbilityEvent(state,event);resolveResponses(state);assert.equal(state.players[0].vp,1);rules.processAbilityEvent(state,event);resolveResponses(state);assert.equal(state.players[0].vp,1);});
    check('Opponent cost 6 outranks controller cost 4: no base or extra reward',()=>{const {state,event}=setup();rules.processAbilityEvent(state,event);resolveResponses(state);assert.equal(state.players[0].vp,0);});
    check('Missing battle-result provenance must not open bloom',()=>{const {state}=setup();rules.processAbilityEvent(state,{id:'unbound',type:'after_battle_result_determined'});assert.equal(state.abilityRuntime.responseWindows.length,0);});
    check('7 mana rejects MHX play; 8 pays 3 and activates',()=>{
      const {state}=setup();state.round.activePhase='action';state.round.prioritySeat=1;
      state.players[0].mana=7;
      assert.equal(rules.dispatchAbilityCommand(state,'p1',{type:'play_card',cardInstanceId:'mhx-source'}).ok,false);
      state.players[0].mana=8;
      assert.equal(rules.dispatchAbilityCommand(state,'p1',{type:'play_card',cardInstanceId:'mhx-source'}).ok,true);
      assert.equal(state.players[0].mana,5);assert.equal(state.abilityRuntime.cardState['mhx-source'].active,true);
    });
  } else {
    const loaded = content.loadPlaytestContentPack(resolve(root,'data/packs/fd-playtest-v1/pack.json'),{workspaceRoot:root});
    const library = content.compileLoadedPlaytestPack(loaded).library;
    const compiler=await import(pathToFileURL(resolve(root,'packages/rules/src/ability/executable-card-pack.ts')).href);
    const pack = compiler.compileExecutableCardPack(library);
    for (const owner of ['master.ciel','master.shiki-ryougi','master.shirou-emiya']) {
      const raw = read(`data/authoring/masters/${owner}.json`);
      const source = raw.cards[0], target = raw.cards[1];
      check(`${owner}: exact F1 source and unchanged accepted target`,()=>{
        const row=f1.staticSkills.find((r:any)=>r.canonicalCardId===source.id);
        assert.equal(source.printedText,row.printedText);assert.deepEqual(source.phase3Evidence.f1SourceReferences,row.sources);
        const base=JSON.parse(execFileSync('git',['show',`ddbbf36726d44eedcc808f5f6b4ab7d5e48d8e6e:data/authoring/masters/${owner}.json`],{encoding:'utf8'}));
        assert.deepEqual(target,base.cards[0]);
      });
      const setup=()=>{
        const state=seeded.createSeededGameState({activeSeats:[1,2]});state.cards=[];state.players[0].masterCardId=owner;
        rules.initializeAbilityRuntime(state,pack,{seed:366});
        state.cards.push({instanceId:'source',definitionId:source.id,ownerPlayerId:'p1',controllerPlayerId:'p1',zone:'skill',visibility:{scope:'owner_only',ownerPlayerId:'p1'}});
        return state;
      };
      check(`${owner}: deferred absence, exact create provenance, restored replay and zero mana cost`,()=>{
        const state=setup();assert.equal(state.cards.some((c:any)=>c.definitionId===target.id),false);const mana=state.players[0].mana;
        rules.processAbilityEvent(state,{id:'start',type:'game_start'});
        const created=state.cards.filter((c:any)=>c.definitionId===target.id);assert.equal(created.length,1);
        assert.equal(created[0].generatedBy,'source');assert.equal(created[0].ownerPlayerId,'p1');assert.equal(created[0].controllerPlayerId,'p1');
        assert.deepEqual(created[0].visibility,{scope:'owner_only',ownerPlayerId:'p1'});assert.equal(created[0].zone,'skill');
        assert.equal(state.abilityRuntime.cardState[created[0].instanceId].active,false);assert.equal(state.players[0].mana,mana);
        const restored=structuredClone(state);rules.processAbilityEvent(restored,{id:'new-start-id',type:'game_start'});
        assert.equal(restored.cards.filter((c:any)=>c.definitionId===target.id).length,1);
        assert.equal(restored.abilityRuntime.events.filter((e:any)=>e.type==='card_created').length,1);
      });
      check(`${owner}: wrong master, foreign ownership and wrong source zone fail closed`,()=>{
        for (const mutate of [(s:any)=>s.players[0].masterCardId='master.other',(s:any)=>s.cards[0].ownerPlayerId='p2',(s:any)=>s.cards[0].zone='discard']) {
          const state=setup();mutate(state);rules.processAbilityEvent(state,{id:'invalid',type:'game_start'});
          assert.equal(state.cards.some((c:any)=>c.definitionId===target.id),false);
        }
      });
      check(`${owner}: no playable/fallback/deck/presentation exposure`,()=>{
        assert.equal(pack.characters[owner],undefined);assert.equal(pack.fallbackCommandSpells[owner],undefined);assert.equal(pack.decks[owner],undefined);
        assert.equal(loaded.masters.some((m:any)=>m.id===owner),false);assert.equal(loaded.cards.some((c:any)=>c.id===source.id||c.id===target.id),false);
      });
      if(owner==='master.shirou-emiya') check('Shirou provisioned target: standalone rejection, 7/8-mana boundary and aggregate paid additional play',()=>{
        const state=setup();rules.processAbilityEvent(state,{id:'start',type:'game_start'});
        const created=state.cards.find((c:any)=>c.definitionId===target.id);
        state.round.activePhase='action';state.round.prioritySeat=1;state.players[0].mana=8;
        assert.equal(rules.dispatchAbilityCommand(state,'p1',{type:'play_card',cardInstanceId:created.instanceId}).ok,false);
        const basic=Object.values(pack.cards).find((d:any)=>d.cardType==='basic_attack'&&Number(d.cardFace.cost??0)<=1) as any;
        assert.ok(basic);
        for(const instanceId of ['normal-1','normal-2'])state.cards.push({instanceId,definitionId:basic.id,ownerPlayerId:'p1',controllerPlayerId:'p1',zone:'hand',visibility:{scope:'owner_only',ownerPlayerId:'p1'}});
        const batch=[{cardInstanceId:'normal-1'},{cardInstanceId:'normal-2'},{cardInstanceId:created.instanceId}];
        state.players[0].mana=7;assert.throws(()=>rules.playAbilityCardBatch(state,'p1',batch));assert.equal(created.zone,'skill');
        state.players[0].mana=8;rules.playAbilityCardBatch(state,'p1',batch);
        assert.equal(state.players[0].mana,8-1-2*Number(basic.cardFace.cost??0));assert.equal(state.cards.find((c:any)=>c.instanceId===created.instanceId).zone,'attack_area');
        assert.equal(state.abilityRuntime.cardState[created.instanceId].active,true);
      });
    }
  }
  const base=isMhx?'362c799c9c3b92a1e2af3f1e4597d5cfcba532ac':'ddbbf36726d44eedcc808f5f6b4ab7d5e48d8e6e';
  const frozen=new Set([...f1.staticSkills,...f1.dynamicSkills].map((r:any)=>r.canonicalCardId));
  const recount=(ref:string)=>{
    const files=execFileSync('git',['ls-tree','-r','--name-only',ref,'--','data/authoring'],{encoding:'utf8'}).trim().split('\n').filter(p=>p.endsWith('.json'));
    const ids:string[]=[];
    for (const path of files) {
      const archive=JSON.parse(ref==='HEAD'?readFileSync(resolve(root,path),'utf8'):execFileSync('git',['show',`${ref}:${path}`],{encoding:'utf8',maxBuffer:10_000_000}));
      for(const card of archive.cards??[]) ids.push(card.id);
    }
    const matches=ids.filter(id=>frozen.has(id));
    return {cards:ids.length,overlap:matches.length,duplicates:matches.length-new Set(matches).size,ids:matches};
  };
  const before=recount(base),after=recount('HEAD');
  const additions=after.ids.filter(id=>!before.ids.includes(id)),removals=before.ids.filter(id=>!after.ids.includes(id));
  console.log(JSON.stringify({accounting:{denominator:frozen.size,base:{cards:before.cards,overlap:before.overlap},candidate:{cards:after.cards,overlap:after.overlap,duplicates:after.duplicates},additions,removals}},null,2));
  console.log(JSON.stringify({head:execFileSync('git',['rev-parse','HEAD'],{encoding:'utf8'}).trim(),results},null,2));
  process.exitCode=results.some(r=>!r.pass)?1:0;
}
main();
