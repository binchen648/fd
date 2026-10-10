import assert from 'node:assert/strict';
import {execFileSync} from 'node:child_process';
import {readFileSync} from 'node:fs';
import {createHash} from 'node:crypto';
import {resolve} from 'node:path';
import {pathToFileURL} from 'node:url';
const HEAD='0af5064fc9894e3db3896a631db8c9beb8fb1485',BASE='8f2c8141c33da0ac30a3468a068c9ab1715e15ce';
const git=(...a)=>execFileSync('git',a,{encoding:'utf8',maxBuffer:30000000}).trim();
const json=(sha,p)=>JSON.parse(git('show',`${sha}:${p}`).replace(/^\uFEFF/,''));
assert.equal(git('rev-parse','HEAD'),HEAD);
const mod=p=>import(pathToFileURL(resolve(p)).href);
const rules=await mod('packages/rules/src/ability/interpreter.ts');
const {loadAuthoringJson}=await mod('packages/rules/src/ability/loader.ts');
const {createSeededGameState}=await mod('packages/rules/src/tools/seeded-state.ts');
const {createMatchSession}=await mod('packages/rules/src/match-session.ts');
const {getEffectiveCardAttributes}=await mod('packages/rules/src/ability/card-instance-state.ts');
const mechanics=await mod('packages/rules/src/ability/revealed-card-mechanics.ts');
const content=await mod('packages/content/src/playtest-pack-loader.ts');
const raw=JSON.parse(readFileSync('data/authoring/servants/servant.sigurd.json','utf8'));
const skill=n=>`servant.sigurd.skill.sc-sigurd-${n}`;
const results=[];function check(name,fn){try{results.push({name,pass:true,observations:fn()});}catch(e){results.push({name,pass:false,detail:String(e)});}}
function setup(){const s=createSeededGameState();s.cards=[];s.players[0].servantCardId='servant.sigurd';s.players[0].locationId=s.players[1].locationId='shinto';s.players[0].mana=s.players[1].mana=30;s.players[0].vp=10;s.round.activePhase='action';s.round.prioritySeat=1;const pack=loadAuthoringJson(raw);assert.deepEqual(pack.report,[]);rules.initializeAbilityRuntime(s,pack,{seed:462});return s;}
function card(s,id,owner='p1',zone='skill'){const c={instanceId:`${id}:${s.cards.length}`,definitionId:id,ownerPlayerId:owner,controllerPlayerId:owner,zone,visibility:{scope:'owner_only',ownerPlayerId:owner}};s.cards.push(c);s.abilityRuntime.cardState[c.instanceId]={active:zone==='attack_area',faceDown:false,playedRound:s.round.roundNumber};return c;}
function basic(s,id,owner='p1',cost=0){s.abilityRuntime.pack.cards[id]={id,name:id,cardType:'basic_attack',cardFace:{cost,basePower:4,attributes:['力量']},playTiming:{phase:'action',window:'controller_play_card_window'},playRequirements:[],abilities:[],mode:'automatic'};return card(s,id,owner,'hand');}
function play(s,owner,c){s.round.prioritySeat=s.players.find(p=>p.id===owner).seat;const out=rules.dispatchAbilityCommand(s,owner,{type:'play_card',cardInstanceId:c.instanceId});assert.equal(out.ok,true,JSON.stringify(out));}
check('Exact source/clause hashes/task and129->132 unique material;runtime unchanged',()=>{
  const inv=json(BASE,'data/phase3/full-roster-ability-inventory.json'),rows=[...inv.staticSkills,...inv.dynamicSkills],frozen=new Set(rows.map(r=>r.canonicalAbilityId));assert.equal(frozen.size,944);
  let quoteOnlyDifferences=0;for(const c of raw.cards){const r=rows.find(r=>r.canonicalAbilityId===c.id);if(c.printedText!==r.printedText)quoteOnlyDifferences++;const normalize=text=>text.replace(/[‘’“”]/g,'"');assert.equal(normalize(c.printedText),normalize(r.printedText));for(const cl of r.clauses)assert.equal(createHash('sha256').update(cl.text).digest('hex'),cl.source.sha256);}
  const ids=sha=>git('ls-tree','-r','--name-only',sha,'data/authoring').split('\n').filter(p=>p.endsWith('.json')).flatMap(p=>(json(sha,p).cards??[]).map(c=>c.id)).filter(id=>frozen.has(id)).sort();const before=ids(BASE),after=ids(HEAD);assert.equal(before.length,129);assert.equal(after.length,132);assert.equal(new Set(after).size,132);assert.deepEqual(after.filter(id=>!before.includes(id)),[1,2,3].map(skill));
  assert.equal(git('diff','--name-only',BASE,HEAD,'packages/rules/src'),'');assert.equal(git('merge-base',BASE,HEAD),BASE);assert.equal(git('rev-list','--count',`${BASE}..${HEAD}`),'1');assert.ok(git('show',`${BASE}:docs/agents/PHASE3-TASK-INDEX.md`).includes('## TASK P3-S-OWNER-SIGURD-COMPLETE-MIGRATION'));return {before:129,after:132,credit:0,commits:1,quoteOnlyDifferences};
});
check('F1 actual product Sigurd curses skipped by real session starter;direct control loses2VP',()=>{
  let session,pair;for(let seed=1;seed<=256;seed++){const candidate=createMatchSession({seed,humanPlayerIds:['p1']}),found=candidate.pairings.find(p=>p.servant.id==='servant.sigurd');if(!found)continue;const s=candidate.state,p=s.players.find(p=>p.id===found.playerId);p.mana=30;p.vp=10;p.locationId='shinto';s.round.activePhase='action';s.round.prioritySeat=p.seat;const actions=rules.getLegalActions(s,p.id);if([1,2].every(n=>actions.some(a=>a.type==='play_card'&&s.cards.find(c=>c.instanceId===a.cardInstanceId)?.definitionId===skill(n)&&!a.faceDown))){session=candidate;pair=found;break;}}
  assert.ok(session);assert.equal(new Set(session.pairings.map(p=>p.servant.id)).size,7);const s=session.state,owner=pair.playerId,p=s.players.find(p=>p.id===owner);p.mana=30;p.vp=10;p.locationId='shinto';s.round.activePhase='action';s.round.prioritySeat=p.seat;
  for(const n of [1,2]){const c=s.cards.find(c=>c.ownerPlayerId===owner&&c.definitionId===skill(n));assert.ok(c);play(s,owner,c);assert.ok(mechanics.physicalCardWasRevealed(s,c.instanceId));}
  const direct=structuredClone(s);rules.advanceAbilityPhase(direct,'preparation',2);assert.equal(direct.players.find(p=>p.id===owner).vp,8);
  session.startRound(2);assert.equal(session.state.round.roundNumber,2);assert.equal(session.state.players.find(p=>p.id===owner).vp,10);assert.ok(!session.state.abilityRuntime.processedEvents.some(id=>id.includes('round-start')));
  return {actualProductArchive:true,sevenUniqueServants:true,realSessionVp:10,directApiVp:8,inheritedEngineDefect:true};
});
check('Real authoring cost boundaries/refund paid5 and same-battle target control',()=>{
  const s=setup(),gram=card(s,skill(1));s.players[0].mana=10;const before=structuredClone(s);assert.equal(rules.dispatchAbilityCommand(s,'p1',{type:'play_card',cardInstanceId:gram.instanceId}).ok,false);assert.deepEqual(s,before);s.players[0].mana=11;play(s,'p1',gram);assert.equal(s.players[0].mana,0);assert.ok(s.abilityRuntime.revealedServants.includes('p1'));
  const attack=basic(s,'fixture.refund','p2',5);play(s,'p2',attack);s.players[0].mana=1;rules.processAbilityEvent(s,{id:'battle-phase:1:after_battle_ended',type:'after_battle_ended',battlePhaseResolutionId:'battle-phase:1',battleParticipantIds:['p1','p2']});const d=s.abilityRuntime.pendingDecision;assert.deepEqual(d.candidates,[attack.instanceId]);assert.equal(rules.dispatchAbilityCommand(s,'p1',{type:'choose_target',decisionId:d.id,selectedIds:[attack.instanceId]}).ok,true);assert.equal(s.players[0].mana,6);return {threshold:11,paid:11,refund:5,finalMana:6};
});
check('Real Blade Storm doubling/removal and Ridill additional-play/conditional attributes',()=>{
  const solo=setup(),rid=card(solo,skill(3));assert.throws(()=>rules.playAbilityCardBatch(solo,'p1',[{cardInstanceId:rid.instanceId}]));
  const s=setup(),gram=card(s,skill(1)),blade=card(s,skill(2)),sword=card(s,skill(3)),a=basic(s,'fixture.double');assert.deepEqual(getEffectiveCardAttributes(s,sword.instanceId),['力量']);play(s,'p1',blade);assert.deepEqual(getEffectiveCardAttributes(s,sword.instanceId),['力量','迅捷']);play(s,'p1',gram);assert.deepEqual(getEffectiveCardAttributes(s,sword.instanceId),['力量','迅捷','魔术']);
  s.round.roundNumber++;s.round.activePhase='action';s.round.prioritySeat=1;rules.playAbilityCardBatch(s,'p1',[{cardInstanceId:a.instanceId},{cardInstanceId:sword.instanceId}]);const mana=s.players[0].mana;assert.equal(rules.dispatchAbilityCommand(s,'p1',{type:'activate_ability',cardInstanceId:a.instanceId,abilityId:mechanics.GRANTED_BASIC_DOUBLE_REMOVE_ABILITY_ID}).ok,true);assert.equal(s.players[0].mana,mana-2);assert.equal(rules.calculateCardPower(s,a.instanceId).value,8);
  rules.processAbilityEvent(s,{id:'fake',type:'after_battle_ended'});assert.equal(s.cards.find(c=>c.instanceId===a.instanceId).zone,'attack_area');rules.processAbilityEvent(s,{id:'battle-phase:2:after_battle_ended',type:'after_battle_ended',battlePhaseResolutionId:'battle-phase:2',battleParticipantIds:['p1']});assert.equal(s.cards.find(c=>c.instanceId===a.instanceId).zone,'removed_from_game');return {additionalPlay:true,attributes:3,paid:2,power:8,canonicalRemoval:true};
});
check('Consumer grant and attribute widened markers fail closed',()=>{for(const c of [1,2]){const input=structuredClone(raw),a=input.cards[c].abilities[1];a.effects[0].extra=true;assert.ok(loadAuthoringJson(input).report.some(r=>r.abilityId===a.id&&r.status==='unsupported'));}return {variants:2};});
check('Generated evidence mismatch is only absent external images',()=>{
  const loaded=content.loadPlaytestContentPack(resolve('data/packs/fd-playtest-v1/pack.json'),{workspaceRoot:resolve('.')});const fresh=content.compileLoadedPlaytestPack(loaded,content.validateLoadedPlaytestPack(loaded,{workspaceRoot:resolve('.')})).evidenceReport,old=json(HEAD,'data/generated/fd-playtest-v1.evidence-report.json');const missing=fresh.issues.filter(i=>!old.issues.some(j=>j.entityId===i.entityId&&j.code===i.code));assert.ok(missing.every(i=>i.code==='SOURCE_ASSET_UNVERIFIED'&&!i.blocking));const norm=structuredClone(fresh);norm.issues=norm.issues.filter(i=>!missing.some(m=>m.entityId===i.entityId&&m.code===i.code));for(const row of norm.entities)if(missing.some(m=>m.entityId===row.entityId))row.issueCodes=row.issueCodes.filter(c=>c!=='SOURCE_ASSET_UNVERIFIED');assert.deepEqual(norm,old);return {local:fresh.issues.length,checkedIn:old.issues.length,missing:missing.length,otherDifferences:0,strictVerifierPassed:false};
});
process.stdout.write(`${JSON.stringify({pr:462,targetSha:HEAD,results},null,2)}\n`);process.exitCode=results.some(r=>!r.pass)?1:0;
