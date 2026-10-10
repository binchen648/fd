import assert from 'node:assert/strict';
import { execFileSync } from 'node:child_process';
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { pathToFileURL } from 'node:url';
const HEAD = 'f52f458a192f363ffa0e6430e6639abc657e91e8';
const BASE = '24ce42298ca41b142356424c0ed60ed5b9ca9bc7';
const git = (...args) => execFileSync('git', args, { encoding: 'utf8', maxBuffer: 30000000 }).trim();
const json = (sha, path) => JSON.parse(git('show', `${sha}:${path}`).replace(/^\uFEFF/, ''));
assert.equal(git('rev-parse', 'HEAD'), HEAD);
const mod = (path) => import(pathToFileURL(resolve(path)).href);
const { createSeededGameState } = await mod('packages/rules/src/tools/seeded-state.ts');
const { loadAuthoringJson } = await mod('packages/rules/src/ability/loader.ts');
const { initializeAbilityRuntime, resolveEffect, calculateCardPower, getLegalActions, dispatchAbilityCommand } = await mod('packages/rules/src/ability/interpreter.ts');
const { resolveBattlefield, deriveBattleParticipantsFromState } = await mod('packages/rules/src/core/combat-resolver.ts');
const linked = await mod('packages/rules/src/ability/linked-owner-combat.ts');
const { terrainAdvantageAtLocation } = await mod('packages/rules/src/ability/terrain-advantage-override.ts');
const { clearTransientCardTransformState } = await mod('packages/rules/src/ability/card-instance-state.ts');
const { compileExecutableCardPack } = await mod('packages/rules/src/ability/executable-card-pack.ts');
const { compileLoadedPlaytestPack, loadPlaytestContentPack, validateLoadedPlaytestPack } = await mod('packages/content/src/index.ts');
const raw = JSON.parse(readFileSync('data/authoring/servants/servant.mash.json', 'utf8'));
const skill = (n) => `servant.mash.skill.sc-mash-${n}`;
const field = 'miyama_town';
function fixture() {
  const s = createSeededGameState(); s.cards = []; s.eventPlacements = []; s.currentSituationModifiers = [];
  for (const p of s.players) p.locationId = 'magic_workshop';
  for (const p of s.players.slice(0, 4)) p.locationId = field;
  s.players[0].servantCardId = 'servant.mash'; s.players[0].commandSpells = 3;
  s.round.activePhase = 'action';
  initializeAbilityRuntime(s, loadAuthoringJson(raw), { seed: 457 });
  s.modeState = { terrainAssignments: { [field]: ['p1', 'p2'] } };
  return s;
}
function card(s, id, owner = 'p1', controller = owner) {
  const c = { instanceId: `${id}:${s.cards.length}`, definitionId: id, ownerPlayerId: owner,
    controllerPlayerId: controller, zone: 'attack_area', visibility: { scope: 'public' } };
  s.cards.push(c); s.abilityRuntime.cardState[c.instanceId] = { active: true, faceDown: false }; return c;
}
function effect(s, source, selections = {}) {
  const a = s.abilityRuntime.pack.cards[source.definitionId].abilities[0];
  resolveEffect(s, { controllerId: 'p1', sourceCardId: source.instanceId, abilityId: a.id, variables: {}, selections }, a.effects[0]);
}
function selectThroughDispatch(s, source, abilityId, playerId) {
  s.round.prioritySeat=s.players[0].seat;
  assert.equal(dispatchAbilityCommand(s,'p1',{type:'activate_ability',cardInstanceId:source.instanceId,abilityId}).ok,true);
  const d=s.abilityRuntime.pendingDecision; assert.ok(d);
  assert.equal(dispatchAbilityCommand(s,'p1',{type:'choose_target',decisionId:d.id,selectedIds:[playerId]}).ok,true);
}
function attack(s, player, power) {
  const id = `test.attack.${player}`;
  s.abilityRuntime.pack.cards[id] = { id, name: id, cardType: 'basic_attack', cardFace: { basePower: power, attributes: ['力量'] },
    playTiming: {}, playRequirements: [], abilities: [], mode: 'automatic' };
  return card(s, id, player);
}
const results = [];
function check(name, fn) { try { results.push({ name, pass: true, observations: fn() }); } catch (e) { results.push({ name, pass: false, detail: String(e) }); } }
check('Exact scope/source clause bindings and material 112->116,not formal credit', () => {
  const inv = json(BASE, 'data/phase3/full-roster-ability-inventory.json');
  const rows = [...inv.staticSkills, ...inv.dynamicSkills]; const frozen = new Set(rows.map(r => r.canonicalAbilityId)); assert.equal(frozen.size, 944);
  for (const id of [1, 2, 3, 4].map(skill)) {
    const row = rows.find(r => r.canonicalAbilityId === id); assert.ok(row);
    const c = raw.cards.find(c => c.id === id); assert.equal(c.printedText, row.printedText);
    for (const clause of c.phase3Evidence.f1ClauseSources) assert.ok(row.clauses.some(r => r.source.sha256 === clause.sha256 && r.source.locator === clause.locator));
  }
  const material = (sha) => git('ls-tree', '-r', '--name-only', sha, 'data/authoring').split('\n').filter(p => p.endsWith('.json'))
    .flatMap(p => (json(sha, p).cards ?? []).map(c => c.id)).filter(id => frozen.has(id)).sort();
  const before = material(BASE), after = material(HEAD); assert.equal(before.length, 112); assert.equal(after.length, 116);
  assert.equal(new Set(after).size, 116); assert.deepEqual(after.filter(id => !before.includes(id)), [1, 2, 3, 4].map(skill));
  assert.ok(git('show', `${BASE}:docs/agents/PHASE3-TASK-INDEX.md`).includes('## TASK P3-S-OWNER-MASH-COMPLETE-MIGRATION'));
  assert.equal(git('merge-base', BASE, HEAD), BASE); assert.equal(git('rev-list', '--count', `${BASE}..${HEAD}`), '3');
  return { materialBefore: 112, materialAfter: 116, formalCreditGranted: 0, commitsAboveBase: 3 };
});
check('Product compiler retains outside-game catalogue and two Guard copies;foreign deck rejected', () => {
  const input = compileLoadedPlaytestPack(loadPlaytestContentPack(resolve('data/packs/fd-playtest-v1/pack.json'), { workspaceRoot: resolve('.') })).library;
  const pack = compileExecutableCardPack(input);
  assert.equal(pack.cards[skill(4)].initialZone, undefined);
  const a = input.rules.archives.find(a => a.id === 'servant.mash');
  assert.equal(a.deck.filter(e => e.cardId === 'card.x-guard').reduce((n,e) => n + e.count, 0), 2);
  const foreign = input.rules.archives.flatMap(a => a.cards).find(c => c.cardType === 'servant_deck_card' && c.owner?.id !== 'servant.mash');
  assert.ok(foreign); a.deck[0].cardId = foreign.id;
  assert.throws(() => compileExecutableCardPack(input), /Foreign servant deck card/);
  return { outsideGameInitialZone: false, guardCopies: 2, foreignDeckRejected: true };
});
check('F1 reproduce:no-slot selected player has stored terrain4 but real resolver applies0', () => {
  const s = fixture(); const source = card(s, skill(1)); selectThroughDispatch(s,source,'distant-utopia-terrain','p3');
  assert.equal(terrainAdvantageAtLocation(s, 'p3', field), 4);
  const participants = deriveBattleParticipantsFromState(s, field); assert.equal(participants.find(p => p.playerId === 'p3').terrainSlotIndex, undefined);
  const before = structuredClone(s); const next = resolveBattlefield(s, { battlefieldId: field }).nextState;
  const p = next.battleResults.at(-1).participantBreakdowns.find(p => p.playerId === 'p3');
  assert.equal(p.effectivePower, 0); assert.equal(p.modifiers.filter(m => m.payload?.targetTag === 'terrain').length, 0);
  assert.deepEqual(s, before);
  return { selectedPlayer: 'p3', storedTerrain: 4, appliedTerrain: 0, expectedTerrain: 4, inputMutated: false };
});
check('Normal terrain-slot control and Preparation composition remain10/20', () => {
  const s = fixture(); effect(s, card(s, skill(1)), { 'chosen-player': ['p1'] });
  assert.equal(terrainAdvantageAtLocation(s, 'p1', field), 10);
  let next = resolveBattlefield(structuredClone(s), { battlefieldId: field }).nextState;
  assert.equal(next.battleResults.at(-1).participantBreakdowns.find(p => p.playerId === 'p1').modifiers.find(m => m.payload?.targetTag === 'terrain').value, 10);
  card(s, 'basic.preparation', 'p1'); next = resolveBattlefield(s, { battlefieldId: field }).nextState;
  assert.equal(next.battleResults.at(-1).participantBreakdowns.find(p => p.playerId === 'p1').modifiers.find(m => m.payload?.targetTag === 'terrain').value, 20);
  return { plain: 10, withPreparation: 20 };
});
check('F2 reproduce:two legal loans change battle winners when card array order reverses', () => {
  const s = fixture(); s.modeState.terrainAssignments = {};
  s.round.prioritySeat=s.players[0].seat;
  for (const borrower of ['p2','p3']) {
    const g=card(s,'card.x-guard');
    assert.ok(getLegalActions(s,'p1').some(a=>a.cardInstanceId===g.instanceId&&a.abilityId==='lend-linked-owner-card'));
    assert.equal(dispatchAbilityCommand(s,'p1',{type:'activate_ability',cardInstanceId:g.instanceId,abilityId:'lend-linked-owner-card'}).ok,true);
    const d=s.abilityRuntime.pendingDecision; assert.ok(d);
    assert.equal(dispatchAbilityCommand(s,'p1',{type:'choose_target',decisionId:d.id,selectedIds:[borrower]}).ok,true);
    assert.equal(s.cards.find(c=>c.instanceId===g.instanceId).controllerPlayerId,borrower);
  }
  attack(s, 'p1', 1); attack(s, 'p2', 1); attack(s, 'p3', 5); attack(s, 'p4', 8);
  const before = structuredClone(s);
  const a = resolveBattlefield(structuredClone(s), { battlefieldId: field }).nextState.battleResults.at(-1);
  const reverse = structuredClone(s); reverse.cards.reverse();
  const b = resolveBattlefield(reverse, { battlefieldId: field }).nextState.battleResults.at(-1);
  const powers = r => Object.fromEntries(r.participantBreakdowns.map(p => [p.playerId,p.effectivePower]));
  assert.deepEqual(powers(a), { p3: 10, p1: 10, p4: 8, p2: 6 });
  assert.deepEqual(powers(b), { p1: 10, p2: 10, p3: 10, p4: 8 });
  assert.deepEqual([...a.winnerPlayerIds].sort(), ['p1','p3']); assert.deepEqual([...b.winnerPlayerIds].sort(), ['p1','p2','p3']);
  assert.deepEqual(s, before);
  return { forwardPower: powers(a), reversedPower: powers(b), forwardWinners: a.winnerPlayerIds, reversedWinners: b.winnerPlayerIds,
    dispatchAcceptedLoans: 2, inputMutated: false };
});
check('Single Guard shares/immune;owner-absent close and loss-return controls', () => {
  const s = fixture(); const g = card(s, 'card.x-guard', 'p1', 'p2');
  assert.ok(linked.playerHasLinkedOwnerLossImmunity(s, 'p1', field)); assert.ok(linked.playerHasLinkedOwnerLossImmunity(s, 'p2', field));
  const r = resolveBattlefield(s, { battlefieldId: field, participants: [{playerId:'p1',totalPower:4},{playerId:'p2',totalPower:8},{playerId:'p3',totalPower:12}] }).nextState;
  assert.equal(r.battleResults[0].participantBreakdowns.find(p => p.playerId === 'p1').effectivePower, 8);
  assert.equal(linked.settleLinkedOwnerCardsAfterBattles(r, r.battleResults).cards.find(c=>c.instanceId===g.instanceId).zone, 'hand');
  const absent = structuredClone(s); absent.players[0].locationId = 'magic_workshop';
  assert.equal(linked.prepareLinkedOwnerCardsForBattle(absent, field).cards.find(c=>c.instanceId===g.instanceId).zone, 'discard');
  return { lossReturn: 'hand', ownerAbsent: 'discard', sharedPower: 8, immunityBoth: true };
});
check('Snowflake hidden/revealed and transient round/leave controls', () => {
  const s = fixture(); const source = card(s, skill(2)); const a = attack(s, 'p2', 6); effect(s, source);
  assert.equal(calculateCardPower(s,a.instanceId).value,3); s.round.roundNumber++;
  assert.equal(calculateCardPower(s,a.instanceId).value,6); clearTransientCardTransformState(s,a.instanceId); assert.equal(a.powerModifiers,undefined);
  s.abilityRuntime.revealedServants.push('p1'); const b = attack(s,'p3',6); effect(s, source);
  assert.equal(calculateCardPower(s,b.instanceId).value,2);
  return { hidden: 3, staleRound: 6, revealed: 2, leaveCleanup: true };
});
check('Ortenaus no-seal suppression/double and borrower cannot relend', () => {
  const s = fixture(); const g = card(s, 'card.x-guard'); s.players[0].commandSpells=0;
  assert.ok(linked.servantRevealForbiddenByNoCommandSeals(s,'p1')); assert.equal(calculateCardPower(s,g.instanceId).value,10);
  assert.ok(!getLegalActions(s,'p1').some(a=>a.abilityId==='lend-linked-owner-card'));
  s.players[0].commandSpells=3; g.controllerPlayerId='p2'; s.round.prioritySeat=s.players[1].seat;
  assert.ok(!getLegalActions(s,'p2').some(a=>a.abilityId==='lend-linked-owner-card'));
  return { noSealPower:10, revealSuppressed:true, lendingUnavailable:true, borrowerRelend:false };
});
check('Bounded linked rule extra-field rejected', () => {
  const input=structuredClone(raw); input.cards.find(c=>c.id==='card.x-guard').abilities[1].effects[0].extra=true;
  assert.ok(loadAuthoringJson(input).report.some(r=>r.cardId==='card.x-guard'&&r.status==='unsupported'));
  return { malformedRuleDisabled:true };
});
check('Generated evidence mismatch isolated to absent newly registered source images', () => {
  const loaded=loadPlaytestContentPack(resolve('data/packs/fd-playtest-v1/pack.json'),{workspaceRoot:resolve('.')});
  const fresh=compileLoadedPlaytestPack(loaded,validateLoadedPlaytestPack(loaded,{workspaceRoot:resolve('.')})).evidenceReport;
  const old=json(HEAD,'data/generated/fd-playtest-v1.evidence-report.json');
  const missing=fresh.issues.filter(i=>!old.issues.some(j=>j.entityId===i.entityId&&j.code===i.code));
  assert.equal(missing.length,7); assert.ok(missing.every(i=>i.code==='SOURCE_ASSET_UNVERIFIED'&&!i.blocking));
  const normalized=structuredClone(fresh); normalized.issues=normalized.issues.filter(i=>!missing.some(m=>m.entityId===i.entityId&&m.code===i.code));
  for(const row of normalized.entities) if(missing.some(m=>m.entityId===row.entityId)) row.issueCodes=row.issueCodes.filter(c=>c!=='SOURCE_ASSET_UNVERIFIED');
  assert.deepEqual(normalized,old);
  return { checkedInIssues:93,localIssues:100,missingNewImages:7,otherEvidenceDifferences:0,strictVerifierPassed:false };
});
process.stdout.write(`${JSON.stringify({pr:457,targetSha:HEAD,results},null,2)}\n`);
process.exitCode=results.some(r=>!r.pass)?1:0;
