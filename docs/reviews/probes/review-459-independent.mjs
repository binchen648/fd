import assert from 'node:assert/strict';
import {execFileSync} from 'node:child_process';
import {readFileSync} from 'node:fs';
import {createHash} from 'node:crypto';
import {resolve} from 'node:path';
import {pathToFileURL} from 'node:url';
const HEAD='da831ab2dd399de974c881bc9ea6aa4336d5b093',BASE='0ea4c4d97225cab3931cdf13d8453b21116d760e';
const git=(...a)=>execFileSync('git',a,{encoding:'utf8',maxBuffer:30000000}).trim();
const json=(sha,p)=>JSON.parse(git('show',`${sha}:${p}`).replace(/^\uFEFF/,''));
assert.equal(git('rev-parse','HEAD'),HEAD);
const mod=p=>import(pathToFileURL(resolve(p)).href);
const rules=await mod('packages/rules/src/ability/interpreter.ts');
const {loadAuthoringJson}=await mod('packages/rules/src/ability/loader.ts');
const {createSeededGameState}=await mod('packages/rules/src/tools/seeded-state.ts');
const content=await mod('packages/content/src/playtest-pack-loader.ts');
const raw=JSON.parse(readFileSync('data/authoring/servants/servant.shuten.json','utf8'));
const skill=n=>`servant.shuten.skill.sc-shuten-${n}`;
function definition(id,cost=0){return {id,name:id,cardType:'basic_attack',cardFace:{cost,basePower:3,attributes:['力量']},playTiming:{phase:'action',window:'controller_play_card_window'},playRequirements:[],abilities:[],mode:'automatic'};}
function setup(deck=0){const s=createSeededGameState();s.cards=[];s.players[0].servantCardId='servant.shuten';s.players[0].mana=20;s.players[1].mana=20;
  s.players[0].locationId=s.players[1].locationId='shinto';s.round.prioritySeat=s.players[0].seat;
  const pack=loadAuthoringJson(raw);for(let i=0;i<deck;i++){const id=`fixture.deck.${i}`;pack.cards[id]=definition(id);s.cards.push({instanceId:id,definitionId:id,ownerPlayerId:'p2',controllerPlayerId:'p2',zone:'deck',visibility:{scope:'owner_only',ownerPlayerId:'p2'}});}
  rules.initializeAbilityRuntime(s,pack,{seed:459});return s;}
function card(s,id,owner='p1',zone='skill'){const c={instanceId:`${id}:${s.cards.length}`,definitionId:id,ownerPlayerId:owner,controllerPlayerId:owner,zone,visibility:{scope:'public'}};
  s.cards.push(c);s.abilityRuntime.cardState[c.instanceId]={active:['field','attack_area'].includes(zone),faceDown:false,playedRound:s.round.roundNumber};return c;}
function basic(s,id,owner='p1',zone='hand',cost=0){s.abilityRuntime.pack.cards[id]=definition(id,cost);return card(s,id,owner,zone);}
function select(s,source,abilityId,target){assert.equal(rules.dispatchAbilityCommand(s,'p1',{type:'activate_ability',cardInstanceId:source.instanceId,abilityId}).ok,true);
  const d=s.abilityRuntime.pendingDecision;assert.ok(d);assert.equal(rules.dispatchAbilityCommand(s,'p1',{type:'choose_target',decisionId:d.id,selectedIds:[target]}).ok,true);}
const results=[];function check(name,fn){try{results.push({name,pass:true,observations:fn()});}catch(e){results.push({name,pass:false,detail:String(e)});}}
check('Exact source texts/clause hashes/task/lineage and material123->126',()=>{
  const i=json(BASE,'data/phase3/full-roster-ability-inventory.json');const rows=[...i.staticSkills,...i.dynamicSkills],frozen=new Set(rows.map(r=>r.canonicalAbilityId));assert.equal(frozen.size,944);
  for(const c of raw.cards){const r=rows.find(r=>r.canonicalAbilityId===c.id);assert.equal(c.printedText,r.printedText);for(const cl of r.clauses)assert.equal(createHash('sha256').update(cl.text).digest('hex'),cl.source.sha256);}
  const ids=sha=>git('ls-tree','-r','--name-only',sha,'data/authoring').split('\n').filter(p=>p.endsWith('.json')).flatMap(p=>(json(sha,p).cards??[]).map(c=>c.id)).filter(id=>frozen.has(id)).sort();
  const before=ids(BASE),after=ids(HEAD);assert.equal(before.length,123);assert.equal(after.length,126);assert.equal(new Set(after).size,126);assert.deepEqual(after.filter(id=>!before.includes(id)),[1,2,3].map(skill));
  assert.ok(git('show',`${BASE}:docs/agents/PHASE3-TASK-INDEX.md`).includes('## TASK P3-S-OWNER-SHUTEN-COMPLETE-MIGRATION'));assert.equal(git('merge-base',BASE,HEAD),BASE);assert.equal(git('rev-list','--count',`${BASE}..${HEAD}`),'2');
  return {materialBefore:123,materialAfter:126,creditGranted:0,commitsAboveBase:2};
});
check('F1 reproduce:legal additional Sake at Recon prevents transactional battle advance',()=>{
  const s=setup();s.players[0].locationId='recon';s.round.activePhase='action';s.players[0].mana=4;
  const a=basic(s,'fixture.recon.attack'),sake=card(s,skill(2));
  rules.playAbilityCardBatch(s,'p1',[{cardInstanceId:a.instanceId},{cardInstanceId:sake.instanceId}]);assert.equal(s.players[0].mana,2);
  const before=structuredClone(s);assert.throws(()=>rules.advanceAbilityPhase(s,'battle'),/Basic-attack limit grant requires the controller to be at a battlefield/);assert.deepEqual(s,before);assert.equal(s.round.activePhase,'action');
  return {location:'recon',legalBatchPlayed:true,phaseAdvanceRejected:true,inputRolledBack:true};
});
check('Normal battlefield OPG snapshots pre-grant plays then permits exactly one future use',()=>{
  const s=setup();s.round.activePhase='action';s.players[0].mana=4;const a=basic(s,'fixture.fight.attack'),sake=card(s,skill(2));
  rules.playAbilityCardBatch(s,'p1',[{cardInstanceId:a.instanceId},{cardInstanceId:sake.instanceId}]);rules.advanceAbilityPhase(s,'battle');
  assert.equal(s.abilityRuntime.grantedPerGamePlayLimitBaselineByCardId[a.instanceId],1);
  let c=s.cards.find(c=>c.instanceId===a.instanceId);c.zone='hand';s.abilityRuntime.cardState[c.instanceId].active=false;s.round.roundNumber++;s.round.activePhase='action';
  assert.equal(rules.dispatchAbilityCommand(s,'p1',{type:'play_card',cardInstanceId:a.instanceId}).ok,true);
  c=s.cards.find(c=>c.instanceId===a.instanceId);c.zone='hand';s.abilityRuntime.cardState[c.instanceId].active=false;
  assert.ok(!rules.getLegalActions(s,'p1').some(x=>x.type==='play_card'&&x.cardInstanceId===c.instanceId));return {grantBaseline:1,futureUses:1};
});
check('Banquet placement,tax/source-deactivation and eliminated-owner cleanup',()=>{
  const s=setup();s.round.activePhase='preparation';const source=card(s,skill(1)),target=basic(s,'fixture.tax','p2','hand',1);
  select(s,source,'sc-shuten-1.place-banquet','shinto');assert.equal(s.players[0].mana,18);assert.equal(rules.effectiveCardPlayCost(s,'p2',target.instanceId),3);
  s.players[0].status='eliminated';assert.equal(rules.effectiveCardPlayCost(s,'p2',target.instanceId),1);
  rules.processAbilityEvent(s,{id:'round-end',type:'round_end',playerId:'p1'});assert.equal(s.cards.find(c=>c.instanceId===source.instanceId).zone,'skill');assert.equal(s.abilityRuntime.cardState[source.instanceId].placedAtLocationId,undefined);
  return {paidMana:2,taxedCost:3,eliminatedOwnerCost:1,cleanupSucceeded:true};
});
check('Bone Collector uses starting cardinality after prior draw;empty deck causes defeat',()=>{
  const s=setup(12);const deck=s.cards.filter(c=>c.zone==='deck');for(const c of deck.slice(2))c.zone='discard';const source=card(s,skill(3),'p1','attack_area');s.round.activePhase='combat';
  select(s,source,'sc-shuten-3.bone-collector','p2');assert.equal(s.cards.filter(c=>c.zone==='removed_from_game').length,2);assert.equal(s.abilityRuntime.startingDeckSizeByPlayer.p2,12);assert.equal(s.abilityRuntime.battleDefeatRoundByPlayer.p2,s.round.roundNumber);
  return {startingDeck:12,remainingBefore:2,removed:2,defeated:true};
});
check('Every new primitive rejects extra fields through loader',()=>{
  const locators=[[0,0,'targets'],[0,0,'effects'],[0,1,'ruleModifiers'],[0,2,'effects'],[0,3,'effects'],[1,2,'effects'],[2,1,'effects']];
  for(const [c,a,key] of locators){const input=structuredClone(raw),ab=input.cards[c].abilities[a];const n=key==='targets'?ab.targets[0].constraints[0]:ab[key][0];n.extra=true;assert.ok(loadAuthoringJson(input).report.some(r=>r.abilityId===ab.id&&r.status==='unsupported'));}
  return {rejectedPrimitives:7};
});
check('Generated evidence discrepancy is absent external images only',()=>{
  const loaded=content.loadPlaytestContentPack(resolve('data/packs/fd-playtest-v1/pack.json'),{workspaceRoot:resolve('.')});const fresh=content.compileLoadedPlaytestPack(loaded,content.validateLoadedPlaytestPack(loaded,{workspaceRoot:resolve('.')})).evidenceReport,old=json(HEAD,'data/generated/fd-playtest-v1.evidence-report.json');
  const missing=fresh.issues.filter(i=>!old.issues.some(j=>j.entityId===i.entityId&&j.code===i.code));assert.ok(missing.every(i=>i.code==='SOURCE_ASSET_UNVERIFIED'&&!i.blocking));
  const norm=structuredClone(fresh);norm.issues=norm.issues.filter(i=>!missing.some(m=>m.entityId===i.entityId&&m.code===i.code));for(const row of norm.entities)if(missing.some(m=>m.entityId===row.entityId))row.issueCodes=row.issueCodes.filter(c=>c!=='SOURCE_ASSET_UNVERIFIED');assert.deepEqual(norm,old);
  return {localIssues:fresh.issues.length,checkedInIssues:old.issues.length,missingImages:missing.length,otherDifferences:0,strictVerifierPassed:false};
});
process.stdout.write(`${JSON.stringify({pr:459,targetSha:HEAD,results},null,2)}\n`);process.exitCode=results.some(r=>!r.pass)?1:0;
