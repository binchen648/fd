import assert from 'node:assert/strict';
import { execFileSync } from 'node:child_process';
import { readFileSync } from 'node:fs';
import { createHash } from 'node:crypto';
import { resolve } from 'node:path';
import { pathToFileURL } from 'node:url';
const HEAD='cf8b8cc019c014cf0c1e187b6cbd2212c6e3a030';
const BASE='83d3f6dcc9476390aa8bc11d1dc5b5e15f077a63';
const git=(...a)=>execFileSync('git',a,{encoding:'utf8',maxBuffer:30000000}).trim();
const json=(sha,p)=>JSON.parse(git('show',`${sha}:${p}`).replace(/^\uFEFF/,''));
assert.equal(git('rev-parse','HEAD'),HEAD);
const mod=p=>import(pathToFileURL(resolve(p)).href);
const rules=await mod('packages/rules/src/ability/interpreter.ts');
const {loadAuthoringJson}=await mod('packages/rules/src/ability/loader.ts');
const {createSeededGameState}=await mod('packages/rules/src/tools/seeded-state.ts');
const {createMatchSession}=await mod('packages/rules/src/match-session.ts');
const {resolveBattlefield}=await mod('packages/rules/src/core/combat-resolver.ts');
const {deductionRecordAttribute}=await mod('packages/rules/src/ability/deduction-record.ts');
const {isAcceptedOpponentCloseOneNonResidualAbility}=await mod('packages/rules/src/ability/opponent-close-to-one.ts');
const {compileExecutableCardPack}=await mod('packages/rules/src/ability/executable-card-pack.ts');
const content=await mod('packages/content/src/playtest-pack-loader.ts');
const raw=JSON.parse(readFileSync('data/authoring/servants/servant.sherlock.json','utf8'));
const skill=n=>`servant.sherlock.skill.sc-sherlock-${n}`;
const attrs=['力量','迅捷','魔术','特殊'];
function setup(){
  const s=createSeededGameState();s.cards=[];s.eventPlacements=[];s.currentSituationModifiers=[];
  for(const p of s.players)p.locationId='magic_workshop';
  s.players[0].servantCardId='servant.sherlock';s.players[0].mana=20;
  s.players[0].locationId=s.players[1].locationId='miyama_town';
  s.round.activePhase='advance';s.round.prioritySeat=s.players[0].seat;
  rules.initializeAbilityRuntime(s,loadAuthoringJson(raw),{seed:458});
  return s;
}
function card(s,id,owner='p1',zone='attack_area',faceDown=false){
  const c={instanceId:`${id}:${s.cards.length}`,definitionId:id,ownerPlayerId:owner,controllerPlayerId:owner,zone,
    visibility:zone==='hand'||faceDown?{scope:'owner_only',ownerPlayerId:owner}:{scope:'public'}};
  s.cards.push(c);s.abilityRuntime.cardState[c.instanceId]={active:zone==='attack_area'&&!faceDown,faceDown,playedRound:s.round.roundNumber};return c;
}
function attack(s,id,owner,attributes,cardType='basic_attack',zone='hand',faceDown=false){
  s.abilityRuntime.pack.cards[id]={id,name:id,cardType,cardFace:{cost:0,basePower:3,attributes},playTiming:{phase:'action',window:'controller_play_card_window'},playRequirements:[],abilities:[],mode:'automatic'};
  return card(s,id,owner,zone,faceDown);
}
function choose(s,controller,attribute){
  const d=s.abilityRuntime.pendingDecision;assert.ok(d);
  const r=rules.dispatchAbilityCommand(s,controller,{type:'choose_target',decisionId:d.id,selectedIds:attribute?[attribute]:[]});
  assert.equal(r.ok,true,JSON.stringify(r.rejection));return r;
}
function memory(s,attribute='力量'){
  const c=s.cards.find(c=>c.definitionId===skill(2))??card(s,skill(2));
  s.round.activePhase='advance';s.round.prioritySeat=s.players[0].seat;
  const r=rules.dispatchAbilityCommand(s,'p1',{type:'activate_ability',cardInstanceId:c.instanceId,abilityId:'sc-sherlock-2.memory-palace'});
  assert.equal(r.ok,true,JSON.stringify(r.rejection));choose(s,'p1',attribute);
  assert.equal(s.abilityRuntime.deductionRecordsByPlayer.p1.attribute,attribute);
}
const results=[];
function check(name,fn){try{results.push({name,pass:true,observations:fn()});}catch(e){results.push({name,pass:false,detail:String(e)});}}
check('Exact seven source texts/task/two-commit ancestry and material116->123',()=>{
  const i=json(BASE,'data/phase3/full-roster-ability-inventory.json');const rows=[...i.staticSkills,...i.dynamicSkills];
  const frozen=new Set(rows.map(r=>r.canonicalAbilityId));assert.equal(frozen.size,944);
  for(const c of raw.cards){const r=rows.find(r=>r.canonicalAbilityId===c.id);assert.ok(r);assert.equal(c.printedText,r.printedText);assert.ok(r.reference.hasConfirmedOverride);
    for(const clause of r.clauses)assert.equal(createHash('sha256').update(clause.text).digest('hex'),clause.source.sha256);
  }
  const ids=sha=>git('ls-tree','-r','--name-only',sha,'data/authoring').split('\n').filter(p=>p.endsWith('.json')).flatMap(p=>(json(sha,p).cards??[]).map(c=>c.id)).filter(id=>frozen.has(id)).sort();
  const a=ids(BASE),b=ids(HEAD);assert.equal(a.length,116);assert.equal(b.length,123);assert.equal(new Set(b).size,123);
  assert.deepEqual(b.filter(id=>!a.includes(id)),[1,2,3,4,5,6,7].map(skill));
  assert.ok(git('show',`${BASE}:docs/agents/PHASE3-TASK-INDEX.md`).includes('## TASK P3-S-OWNER-SHERLOCK-COMPLETE-MIGRATION'));
  assert.equal(git('merge-base',BASE,HEAD),BASE);assert.equal(git('rev-list','--count',`${BASE}..${HEAD}`),'2');
  return {sourceTexts:7,materialBefore:116,materialAfter:123,creditGranted:0};
});
check('Four exact deferred record definitions and malformed marker/exception rejection',()=>{
  const p=loadAuthoringJson(raw);assert.deepEqual(p.report,[]);
  assert.deepEqual([4,5,6,7].map(n=>deductionRecordAttribute(p.cards[skill(n)])),attrs);
  const loaded=content.loadPlaytestContentPack(resolve('data/packs/fd-playtest-v1/pack.json'),{workspaceRoot:resolve('.')});
  const pack=compileExecutableCardPack(content.compileLoadedPlaytestPack(loaded).library);
  for(const n of [4,5,6,7])assert.equal(pack.cards[skill(n)].initialZone,undefined);
  for(const widen of [r=>r.cards[3].abilities[0].markers.push('extra'),r=>{r.cards[2].abilities[0].conditions.at(-1).extra=true;}]){
    const r=structuredClone(raw);widen(r);assert.ok(loadAuthoringJson(r).report.some(i=>i.status==='unsupported'));
  }
  return {deferredRecords:4,malformedVariantsRejected:2};
});
check('F4 reproduce:generic marker preservation breaks unchanged compiled M50-02 contract',()=>{
  const ability={id:'fixture.close',kind:'phase_action',printedClause:'fixture',markers:['m50_structured_v1'],
    activation:{phase:'combat',opens:'controller_combat_action_window',requiresSourceState:'active'},
    conditions:[{type:'target_count_equals',scope:'same_battlefield_opponents',count:1}],targets:[],
    effects:[{type:'opponent_close_one_non_residual'}],cost:[],creates:[],ruleModifiers:[],lifecycle:{},responseWindow:{},limit:{},visibility:{},execution:{mode:'automatic',allowedOperations:[]}};
  assert.equal(isAcceptedOpponentCloseOneNonResidualAbility(ability,'authoring'),true);
  const pack=loadAuthoringJson({schemaVersion:'fd-card-authoring-v1',archiveType:'servant_skill_card_archive',id:'servant.fixture',name:'fixture',class:'Lancer',cards:[
    {id:'servant.fixture.skill.close',name:'fixture',cardType:'servant_skill',owner:{type:'servant',id:'servant.fixture'},
      cardFace:{cost:0,basePower:1,attributes:[]},playTiming:{phase:'action',window:'controller_play_card_window'},playRequirements:[],abilities:[ability]}]});
  assert.deepEqual(pack.report,[]);const compiled=pack.cards['servant.fixture.skill.close'].abilities[0];
  assert.deepEqual(compiled.markers,['m50_structured_v1']);assert.equal(isAcceptedOpponentCloseOneNonResidualAbility(compiled,'compiled'),false);
  const control=structuredClone(compiled);delete control.markers;assert.equal(isAcceptedOpponentCloseOneNonResidualAbility(control,'compiled'),true);
  const path='packages/rules/src/ability/opponent-close-to-one.ts';assert.equal(git('show',`${BASE}:${path}`),git('show',`${HEAD}:${path}`));
  return {authoringAccepted:true,loaderReportEmpty:true,compiledAccepted:false,onlyRemovingPreservedMarkerRestoresContract:true,contractHelperUnchanged:true};
});
check('F1 reproduce:Elementary cannot reveal an opponent without a deduction record',()=>{
  const s=setup();const c=card(s,skill(1));attack(s,'fixture.hidden','p2',['力量']);
  s.round.activePhase='combat';assert.equal(s.abilityRuntime.deductionRecordsByPlayer.p1,undefined);
  assert.ok(!rules.getLegalActions(s,'p1').some(a=>a.abilityId==='sc-sherlock-1.elementary'));
  const before=structuredClone(s);const r=rules.dispatchAbilityCommand(s,'p1',{type:'activate_ability',cardInstanceId:c.instanceId,abilityId:'sc-sherlock-1.elementary'});
  assert.equal(r.ok,false);assert.equal(r.rejection.code,'illegal_action');assert.deepEqual(s,before);
  assert.equal(s.abilityRuntime.events.filter(e=>e.type==='deduction_cards_revealed').length,0);
  return {recordRequiredBySourceText:false,legalActionAvailable:false,rejectedWithoutMutation:true};
});
check('F2 reproduce:owner view identical for different persistent secret records',()=>{
  const s=setup();memory(s,'力量');const a=structuredClone(s),b=structuredClone(s);
  b.abilityRuntime.deductionRecordsByPlayer.p1={definitionId:skill(5),attribute:'迅捷',recordedRound:s.round.roundNumber};
  assert.deepEqual(rules.projectAbilityState(a,'p1'),rules.projectAbilityState(b,'p1'));
  assert.deepEqual(rules.projectAbilityState(a,'p2'),rules.projectAbilityState(b,'p2'));
  assert.equal(a.abilityRuntime.events.find(e=>e.type==='deduction_record_set').attribute,undefined);
  return {ownerCanDistinguishPersistentRecord:false,opponentCanDistinguish:false,currentRecordNotInSafeSetEvent:true};
});
check('Dynamic payment and actual opponent play resolve one hit;duplicate event id idempotent',()=>{
  const cost=setup(),source=card(cost,skill(2),'p1','skill');cost.round.activePhase='action';cost.round.roundNumber=4;
  assert.equal(rules.effectiveCardPlayCost(cost,'p1',source.instanceId),3);const mana=cost.players[0].mana;
  assert.equal(rules.dispatchAbilityCommand(cost,'p1',{type:'play_card',cardInstanceId:source.instanceId}).ok,true);
  assert.equal(cost.players[0].mana,mana-3);assert.equal(cost.abilityRuntime.cardState[source.instanceId].paidManaOnPlay,3);
  const s=setup();card(s,skill(3));memory(s,'力量');s.round.activePhase='action';s.round.prioritySeat=s.players[1].seat;
  const played=attack(s,'fixture.basic','p2',['力量']);const vp=s.players[0].vp;
  const r=rules.dispatchAbilityCommand(s,'p2',{type:'play_card',cardInstanceId:played.instanceId});assert.equal(r.ok,true,JSON.stringify(r.rejection));
  assert.equal(s.players[0].vp,vp+1);assert.ok(s.abilityRuntime.pendingDecision);choose(s,'p1');
  return {paidMana:3,actualPlayAward:1,optionalDecline:true};
});
check('Ordinary nonbasic rejected,noble matching accepted,expiry floors at zero',()=>{
  const s=setup();card(s,skill(3));memory(s,'魔术');s.round.activePhase='action';
  const ordinary=attack(s,'fixture.ordinary','p2',['魔术'],'servant_skill','attack_area');
  const event=(id,c)=>({id,type:'on_card_played',playerId:'p2',sourceCardId:c.instanceId,playedCards:[{instanceId:c.instanceId,controllerId:'p2',faceDown:false,cardType:'servant_skill'}]});
  rules.processAbilityEvent(s,event('ordinary',ordinary));assert.equal(s.players[0].vp,0);
  const noble=attack(s,'fixture.noble','p2',['魔术','宝具'],'servant_skill','attack_area');
  const e=event('noble',noble);rules.processAbilityEvent(s,e);assert.equal(s.players[0].vp,1);
  const revision=s.abilityRuntime.revision;rules.processAbilityEvent(s,e);assert.equal(s.players[0].vp,1);assert.equal(s.abilityRuntime.revision,revision);
  choose(s,'p1','迅捷');rules.processAbilityEvent(s,{id:'round-end',type:'round_end',playerId:'p1'});
  assert.equal(s.players[0].vp,0);assert.equal(s.abilityRuntime.deductionRecordsByPlayer.p1,undefined);
  return {ordinaryAward:0,nobleAward:1,idempotent:true,expiryFloor:0};
});
check('F3 reproduce:owner-only revealed cards leak through real MatchSession shared client logs',()=>{
  let session,pair;
  for(const seed of [20260904,1,2,3,4]){session=createMatchSession({seed,humanPlayerIds:['p1','p2','p3','p4','p5','p6','p7']});pair=session.pairings.find(p=>p.servant.id==='servant.sherlock');if(pair)break;}
  assert.ok(pair);const s=session.state,owner=pair.playerId,target=s.players.find(p=>p.id!==owner).id,viewer=s.players.find(p=>p.id!==owner&&p.id!==target).id;
  const player=s.players.find(p=>p.id===owner);player.locationId=s.players.find(p=>p.id===target).locationId='miyama_town';player.mana=20;
  s.round.prioritySeat=player.seat;s.round.activePhase='advance';
  for(const n of [1,2,3]){const c=s.cards.find(c=>c.definitionId===skill(n));assert.ok(c);c.zone='attack_area';c.visibility={scope:'public'};s.abilityRuntime.cardState[c.instanceId]={active:true,faceDown:false,playedRound:s.round.roundNumber};}
  const sc2=s.cards.find(c=>c.definitionId===skill(2));
  assert.equal(session.dispatchPlayerCommand(owner,{type:'activate_ability',cardInstanceId:sc2.instanceId,abilityId:'sc-sherlock-2.memory-palace'}).ok,true);
  let d=s.abilityRuntime.pendingDecision;assert.equal(session.dispatchPlayerCommand(owner,{type:'choose_target',decisionId:d.id,selectedIds:['特殊']}).ok,true);
  const hidden=attack(s,'fixture.secret.hand',target,['特殊']);
  s.round.activePhase='combat';const sc1=s.cards.find(c=>c.definitionId===skill(1));
  assert.equal(session.dispatchPlayerCommand(owner,{type:'activate_ability',cardInstanceId:sc1.instanceId,abilityId:'sc-sherlock-1.elementary'}).ok,true);
  d=s.abilityRuntime.pendingDecision;const result=session.dispatchPlayerCommand(owner,{type:'choose_target',decisionId:d.id,selectedIds:[target]});assert.equal(result.ok,true);
  const privateEvent=s.abilityRuntime.events.find(e=>e.type==='deduction_cards_revealed');assert.equal(privateEvent.visibility,owner);assert.ok(privateEvent.revealedCardInstanceIds.includes(hidden.instanceId));
  const projected=session.projectToClientState(viewer);
  assert.ok(!projected.view.cards.some(c=>c.instanceId===hidden.instanceId||c.definitionId===hidden.definitionId));
  const leaked=projected.logs.flatMap(l=>l.payload?.events??[]).find(e=>e.type==='deduction_cards_revealed');assert.ok(leaked);
  assert.ok(leaked.revealedCardInstanceIds.includes(hidden.instanceId));assert.ok(leaked.revealedCardDefinitionIds.includes(hidden.definitionId));assert.equal(leaked.visibility,undefined);
  const badPass=session.passPriority(viewer);assert.equal(badPass.ok,false);
  assert.ok(badPass.events.some(e=>e.type==='deduction_cards_revealed'&&e.visibility===owner));
  return {normalCardProjectionHidden:true,thirdPlayerSharedLogContainsSecret:true,logVisibilityTagStripped:true,rejectedPassLeaksHistoricalPrivateEvent:true};
});
check('Elementary matched opponent excluded from real battle winners',()=>{
  const s=setup();memory(s,'力量');const source=card(s,skill(1));attack(s,'fixture.match','p2',['力量']);
  s.round.activePhase='combat';assert.equal(rules.dispatchAbilityCommand(s,'p1',{type:'activate_ability',cardInstanceId:source.instanceId,abilityId:'sc-sherlock-1.elementary'}).ok,true);
  choose(s,'p1','p2');choose(s,'p1');
  const r=resolveBattlefield(s,{battlefieldId:'miyama_town',participants:[{playerId:'p1',totalPower:1},{playerId:'p2',totalPower:20}]}).nextState.battleResults.at(-1);
  assert.deepEqual(r.winnerPlayerIds,['p1']);assert.ok(r.excludedPlayerIds.includes('p2'));return {highestPowerOpponentExcluded:true};
});
check('Generated evidence mismatch is only asset-dependent diagnostics',()=>{
  const loaded=content.loadPlaytestContentPack(resolve('data/packs/fd-playtest-v1/pack.json'),{workspaceRoot:resolve('.')});
  const fresh=content.compileLoadedPlaytestPack(loaded,content.validateLoadedPlaytestPack(loaded,{workspaceRoot:resolve('.')})).evidenceReport;
  const old=json(HEAD,'data/generated/fd-playtest-v1.evidence-report.json');
  const missing=fresh.issues.filter(i=>!old.issues.some(j=>j.entityId===i.entityId&&j.code===i.code));
  assert.ok(missing.length>0&&missing.every(i=>i.code==='SOURCE_ASSET_UNVERIFIED'&&!i.blocking));
  const norm=structuredClone(fresh);norm.issues=norm.issues.filter(i=>!missing.some(m=>m.entityId===i.entityId&&m.code===i.code));
  for(const row of norm.entities)if(missing.some(m=>m.entityId===row.entityId))row.issueCodes=row.issueCodes.filter(c=>c!=='SOURCE_ASSET_UNVERIFIED');
  assert.deepEqual(norm,old);return {localIssues:fresh.issues.length,checkedInIssues:old.issues.length,missingExternalImages:missing.length,otherDifferences:0,strictVerifierPassed:false};
});
process.stdout.write(`${JSON.stringify({pr:458,targetSha:HEAD,results},null,2)}\n`);process.exitCode=results.some(r=>!r.pass)?1:0;
