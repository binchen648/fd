import assert from 'node:assert/strict';
import {execFileSync} from 'node:child_process';
import {readFileSync} from 'node:fs';
import {createHash} from 'node:crypto';
import {resolve} from 'node:path';
import {pathToFileURL} from 'node:url';
const HEAD='e912ad973314cb032adb0e4eb1e0b9141cc322d9',BASE='3412aac11f14d9e8012e4aa8c4761fccbf58e581';
const git=(...a)=>execFileSync('git',a,{encoding:'utf8',maxBuffer:30000000}).trim();
const json=(sha,p)=>JSON.parse(git('show',`${sha}:${p}`).replace(/^\uFEFF/,''));
assert.equal(git('rev-parse','HEAD'),HEAD);
const mod=p=>import(pathToFileURL(resolve(p)).href);
const rules=await mod('packages/rules/src/ability/interpreter.ts');
const {loadAuthoringJson}=await mod('packages/rules/src/ability/loader.ts');
const {createSeededGameState}=await mod('packages/rules/src/tools/seeded-state.ts');
const {deriveBattleParticipantsFromState}=await mod('packages/rules/src/core/combat-resolver.ts');
const {executeResolution}=await mod('packages/rules/src/ability/resolution-dataflow.ts');
const content=await mod('packages/content/src/playtest-pack-loader.ts');
const raw=JSON.parse(readFileSync('data/authoring/servants/servant.siegfried.json','utf8'));
const shuten=JSON.parse(readFileSync('data/authoring/servants/servant.shuten.json','utf8'));
const skill=n=>`servant.siegfried.skill.sc-siegfried-${n}`;
const results=[];function check(name,fn){try{results.push({name,pass:true,observations:fn()});}catch(e){results.push({name,pass:false,detail:String(e)});}}
function basic(id,power=4){return {id,name:id,cardType:'basic_attack',cardFace:{cost:1,basePower:power,attributes:[]},playTiming:{phase:'action',window:'controller_play_card_window'},playRequirements:[],abilities:[],mode:'automatic'};}
function setup(){const s=createSeededGameState();s.cards=[];s.players[0].servantCardId='servant.siegfried';s.players[1].servantCardId='servant.shuten';s.players[0].mana=s.players[1].mana=30;s.players[0].vp=10;
  s.players[0].locationId=s.players[1].locationId='shinto';s.round.activePhase='action';s.round.prioritySeat=1;
  const pack=loadAuthoringJson({...raw,cards:[...raw.cards,...shuten.cards]});assert.deepEqual(pack.report,[]);rules.initializeAbilityRuntime(s,pack,{seed:460});return s;}
function card(s,id,owner='p1',zone='attack_area'){const c={instanceId:`${id}:${s.cards.length}`,definitionId:id,ownerPlayerId:owner,controllerPlayerId:owner,zone,visibility:zone==='hand'||zone==='skill'?{scope:'owner_only',ownerPlayerId:owner}:{scope:'public'}};
  s.cards.push(c);s.abilityRuntime.cardState[c.instanceId]={active:zone==='attack_area'||zone==='field',faceDown:false,playedRound:s.round.roundNumber};return c;}
function activate(s,owner,c,id){s.round.prioritySeat=s.players.find(p=>p.id===owner).seat;const out=rules.dispatchAbilityCommand(s,owner,{type:'activate_ability',cardInstanceId:c.instanceId,abilityId:id});assert.equal(out.ok,true,JSON.stringify(out));}
function cloak(s){const c=card(s,skill(1));activate(s,'p1',c,'sc-siegfried-1.invisibility-cloak');return c;}
check('Exact source/task/three-commit lineage and126->129 material only',()=>{
  const i=json(BASE,'data/phase3/full-roster-ability-inventory.json'),rows=[...i.staticSkills,...i.dynamicSkills],frozen=new Set(rows.map(r=>r.canonicalAbilityId));assert.equal(frozen.size,944);
  for(const c of raw.cards){const r=rows.find(r=>r.canonicalAbilityId===c.id);assert.equal(c.printedText,r.printedText);for(const cl of r.clauses)assert.equal(createHash('sha256').update(cl.text).digest('hex'),cl.source.sha256);}
  const ids=sha=>git('ls-tree','-r','--name-only',sha,'data/authoring').split('\n').filter(p=>p.endsWith('.json')).flatMap(p=>(json(sha,p).cards??[]).map(c=>c.id)).filter(id=>frozen.has(id)).sort();
  const before=ids(BASE),after=ids(HEAD);assert.equal(before.length,126);assert.equal(after.length,129);assert.equal(new Set(after).size,129);assert.deepEqual(after.filter(id=>!before.includes(id)),[1,2,3].map(skill));
  assert.ok(git('show',`${BASE}:docs/agents/PHASE3-TASK-INDEX.md`).includes('## TASK P3-S-OWNER-SIEGFRIED-COMPLETE-MIGRATION'));assert.equal(git('merge-base',BASE,HEAD),BASE);assert.equal(git('rev-list','--count',`${BASE}..${HEAD}`),'3');
  return {before:126,after:129,credit:0,commits:3};
});
check('F1 reproduce:actual Banquet aura still taxes same-location cloaked controller',()=>{
  const s=setup(),banquet=card(s,'servant.shuten.skill.sc-shuten-1','p2','skill');s.round.activePhase='preparation';
  activate(s,'p2',banquet,'sc-shuten-1.place-banquet');const d=s.abilityRuntime.pendingDecision;assert.equal(rules.dispatchAbilityCommand(s,'p2',{type:'choose_target',decisionId:d.id,selectedIds:['shinto']}).ok,true);
  s.round.activePhase='action';const id='fixture.taxable';s.abilityRuntime.pack.cards[id]=basic(id);const target=card(s,id,'p1','hand');
  assert.equal(rules.effectiveCardPlayCost(s,'p1',target.instanceId),3);cloak(s);
  assert.equal(rules.effectiveCardPlayCost(s,'p1',target.instanceId),3);
  const mana=s.players[0].mana;assert.equal(rules.dispatchAbilityCommand(s,'p1',{type:'play_card',cardInstanceId:target.instanceId}).ok,true);assert.equal(mana-s.players[0].mana,3);
  return {normalPrintedCost:1,cloakedPaidCost:3,actualAuthoredAura:true};
});
check('F2 reproduce:loader-admitted hostile card selection/move bypasses cloak immunity',()=>{
  const s=setup(),protectedCard=cloak(s);const hostile=structuredClone(raw.cards[0]);hostile.id='fixture.hostile';hostile.owner={type:'servant',id:'servant.shuten'};
  const a=structuredClone(raw.cards[0].abilities[1]);a.id='fixture.card-target';a.targets=[{id:'victim',type:'card_instance',scope:{controller:'any',owner:'any',zone:'attack_area'},count:{min:1,max:1},constraints:[]}];
  a.effects=[{type:'move_card',target:'victim',to:{zone:'discard'}}];a.ruleModifiers=[];a.lifecycle={};a.limit={};hostile.abilities=[a];
  const loaded=loadAuthoringJson({...raw,cards:[hostile]});assert.deepEqual(loaded.report,[]);s.abilityRuntime.pack.cards[hostile.id]=loaded.cards[hostile.id];
  const source=card(s,hostile.id,'p2');activate(s,'p2',source,a.id);const d=s.abilityRuntime.pendingDecision;assert.ok(d.candidates.includes(protectedCard.instanceId));
  assert.equal(rules.dispatchAbilityCommand(s,'p2',{type:'choose_target',decisionId:d.id,selectedIds:[protectedCard.instanceId]}).ok,true);
  assert.equal(s.cards.find(c=>c.instanceId===protectedCard.instanceId).zone,'discard');
  return {admitted:true,protectedCardSelectable:true,hostileMoveApplied:true,fixtureNotFormalConsumer:true};
});
check('R1/R2 concealment preserves hidden and revealed baselines through both reveal routes',()=>{
  for(const originallyRevealed of [false,true]){const s=setup();if(originallyRevealed)s.abilityRuntime.revealedServants.push('p1');const c=cloak(s),armor=card(s,skill(2),'p1','skill');
    assert.equal(rules.dispatchAbilityCommand(s,'p1',{type:'play_card',cardInstanceId:armor.instanceId}).ok,true);assert.ok(!s.abilityRuntime.revealedServants.includes('p1'));
    const out=executeResolution({state:s,controllerId:'p1',sourceCardId:c.instanceId,abilityId:'fixture.reveal',resolutionId:'fixture.reveal',effects:[{id:'reveal',type:'reveal_servant_package'}]});
    assert.equal(out.results[0].status,'no_op');assert.ok(!out.nextState.abilityRuntime.revealedServants.includes('p1'));rules.processAbilityEvent(out.nextState,{id:'end',type:'round_end'});assert.equal(out.nextState.abilityRuntime.revealedServants.includes('p1'),originallyRevealed);}
  return {baselines:2,interpreterAndTyped:true};
});
check('R1 total bonus consumed once across two active9-power attacks;round expiry',()=>{
  const s=setup(),sword=card(s,skill(3));card(s,skill(2));for(let n=0;n<3;n++){const id=`fixture.power.${n}`;s.abilityRuntime.pack.cards[id]=basic(id);card(s,id,'p1','hand');}
  assert.equal(deriveBattleParticipantsFromState(s,'shinto').find(p=>p.playerId==='p1').totalPower,18);activate(s,'p1',sword,'sc-siegfried-3.reveal-hand-power');assert.equal(deriveBattleParticipantsFromState(s,'shinto').find(p=>p.playerId==='p1').totalPower,24);
  assert.equal(rules.calculateCardPower(s,sword.instanceId).value,9);s.round.roundNumber++;assert.equal(deriveBattleParticipantsFromState(s,'shinto').find(p=>p.playerId==='p1').totalPower,18);return {before:18,after:24,expired:18};
});
check('New mechanic/immunity extra-key shapes rejected',()=>{
  for(const [c,a,k] of [[0,0,'effects'],[0,1,'effects'],[0,1,'ruleModifiers'],[2,1,'effects']]){const input=structuredClone(raw),ab=input.cards[c].abilities[a];ab[k][0].extra=true;assert.ok(loadAuthoringJson(input).report.some(r=>r.abilityId===ab.id&&r.status==='unsupported'));}return {variants:4};
});
check('Generated evidence mismatch is missing external images only',()=>{
  const loaded=content.loadPlaytestContentPack(resolve('data/packs/fd-playtest-v1/pack.json'),{workspaceRoot:resolve('.')});const fresh=content.compileLoadedPlaytestPack(loaded,content.validateLoadedPlaytestPack(loaded,{workspaceRoot:resolve('.')})).evidenceReport,old=json(HEAD,'data/generated/fd-playtest-v1.evidence-report.json');
  const missing=fresh.issues.filter(i=>!old.issues.some(j=>j.entityId===i.entityId&&j.code===i.code));assert.ok(missing.every(i=>i.code==='SOURCE_ASSET_UNVERIFIED'&&!i.blocking));
  const norm=structuredClone(fresh);norm.issues=norm.issues.filter(i=>!missing.some(m=>m.entityId===i.entityId&&m.code===i.code));for(const row of norm.entities)if(missing.some(m=>m.entityId===row.entityId))row.issueCodes=row.issueCodes.filter(c=>c!=='SOURCE_ASSET_UNVERIFIED');assert.deepEqual(norm,old);return {local:fresh.issues.length,checkedIn:old.issues.length,missing:missing.length,otherDifferences:0,strictVerifierPassed:false};
});
process.stdout.write(`${JSON.stringify({pr:460,targetSha:HEAD,results},null,2)}\n`);process.exitCode=results.some(r=>!r.pass)?1:0;
