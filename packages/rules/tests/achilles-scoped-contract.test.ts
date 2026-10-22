import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';
import * as rules from '../src/index';
import { createSeededGameState } from '../src/tools/seeded-state';

const skill = (n: number) => `servant.achilles.skill.sc-achilles-${n}`;
const ability = (n: number, suffix: string) => `sc-achilles-${n}.${suffix}`;
function setup() {
  const raw = JSON.parse(readFileSync('data/authoring/servants/servant.achilles.json', 'utf8'));
  const s = createSeededGameState(); s.cards = []; s.round.activePhase = 'action'; s.round.prioritySeat = 1;
  s.players[0]!.servantCardId = 'servant.achilles'; s.players[0]!.mana = 12; s.players[0]!.locationId = 'miyama_town';
  s.players[1]!.locationId = 'miyama_town'; s.players[2]!.locationId = 'shinto';
  rules.initializeAbilityRuntime(s, rules.loadAuthoringJson(raw), { seed: 42 });
  return s;
}
function add(s: ReturnType<typeof setup>, definitionId: string, zone: string, owner: string) {
  const instanceId = `${definitionId}:${s.cards.length}`;
  s.cards.push({ instanceId, definitionId, ownerPlayerId: owner, controllerPlayerId: owner, zone, visibility: { scope: zone === 'attack_area' ? 'public' : 'owner_only', ...(zone === 'attack_area' ? {} : { ownerPlayerId: owner }) } as any });
  return instanceId;
}
function addKnownNonAgility(s: ReturnType<typeof setup>, zone: string, owner: string) {
  s.abilityRuntime!.pack.cards['known.non-agility'] ??= {
    id: 'known.non-agility', name: 'Known non-agility', cardType: 'servant_attack', mode: 'automatic',
    cardFace: { attributes: ['力量'], basePower: 1, cost: 0 }, abilities: [], activation: {},
    execution: { mode: 'automatic' }, targets: [], effects: [], creates: [], cost: [], ruleModifiers: [], lifecycle: {},
    responseWindow: {}, visibility: {}, conditions: [],
  } as any;
  return add(s, 'known.non-agility', zone, owner);
}
function activate(s: ReturnType<typeof setup>, sourceCardId: string, abilityId: string) {
  return rules.dispatchAbilityCommand(s, 'p1', { type: 'activate_ability', cardInstanceId: sourceCardId, abilityId });
}

describe('Achilles accepted source-bound contract', () => {
  it('S1 requires authoritative post-scoring loser facts and reveals idempotently', () => {
    const s = setup(); const source = add(s, skill(1), 'attack_area', 'p1');
    s.abilityRuntime!.cardState[source] = { active: true, faceDown: false, playedRound: 1 };
    const malformed = { id: 'bad-loss', type: 'after_controller_loses_battle' as const, playerId: 'p1' };
    rules.processAbilityEvent(s, malformed);
    expect(s.abilityRuntime!.revealedServants).not.toContain('p1');
    const event = {
      id: 'battle-phase:1:battle:miyama_town:1:result:lose:p1', type: 'after_controller_loses_battle' as const,
      playerId: 'p1', sourceCardId: source, battlefieldId: 'miyama_town', battlePhaseResolutionId: 'battle-phase:1',
      battleId: 'battle-phase:1:battle:miyama_town:1', resultId: 'battle-phase:1:battle:miyama_town:1:result',
      battleParticipantIds: ['p1', 'p2'], battleResult: { winners: ['p2'], loserIds: ['p1'] },
    };
    rules.processAbilityEvent(s, event);
    expect(s.abilityRuntime!.revealedServants).toEqual(['p1']);
    const revision = s.abilityRuntime!.revision; rules.processAbilityEvent(s, event);
    expect(s.abilityRuntime!.revision).toBe(revision);
  });

  it('S1 random discard is server-owned, once per battle, and fails closed for blocked unselected-card classification', () => {
    const s = setup(); const source = add(s, skill(1), 'attack_area', 'p1');
    s.abilityRuntime!.cardState[source] = { active: true, faceDown: false, playedRound: 1 };
    s.round.activePhase = 'battle'; s.battleDeclarations = [{ battlefieldId: 'miyama_town' }];
    const luck = add(s, 'basic.luck', 'hand', 'p2'); const ordinary = add(s, 'ordinary-card', 'hand', 'p2');
    const result = activate(s, source, ability(1, 'gale-advance'));
    expect(result.ok).toBe(true);
    expect([luck, ordinary].some((id) => s.cards.find((c) => c.instanceId === id)!.zone === 'discard')).toBe(true);
    expect(s.abilityRuntime!.events.some((event) => event.type === 'achilles_battle_power_zero')).toBe(true);
    expect(Object.keys(s.abilityRuntime!.achillesBattlePowerZeroByBattlefield ?? {})).toEqual(['battle-phase:1:battle:miyama_town:1']);
    expect(s.abilityRuntime!.achillesBattlePowerZeroByBattlefield!['battle-phase:1:battle:miyama_town:1']!.targetPlayerIds).toEqual([]);
    const second = activate(s, source, ability(1, 'gale-advance'));
    expect(second.ok).toBe(false);
    expect(s.cards.filter((c) => c.ownerPlayerId === 'p2' && c.zone === 'discard')).toHaveLength(1);
  });

  it('S1 consumes only the source-bound battle-local power-zero receipt during settlement', () => {
    const s = setup(); const source = add(s, skill(1), 'attack_area', 'p1');
    s.abilityRuntime!.cardState[source] = { active: true, faceDown: false, playedRound: 1 };
    const attackDefinition = 'scoped-test-attack';
    s.abilityRuntime!.pack.cards[attackDefinition] = {
      id: attackDefinition, name: 'Scoped test attack', cardType: 'servant_attack', mode: 'automatic',
      cardFace: { attributes: ['力量'], basePower: 5, cost: 0 }, abilities: [],
      activation: {}, execution: { mode: 'automatic' }, targets: [], effects: [], creates: [], cost: [],
      ruleModifiers: [], lifecycle: {}, responseWindow: {}, visibility: {}, conditions: [],
    } as any;
    const attack = add(s, attackDefinition, 'attack_area', 'p2');
    s.abilityRuntime!.cardState[attack] = { active: true, faceDown: false, playedRound: 1 };
    s.round.activePhase = 'battle'; s.battleDeclarations = [{ battlefieldId: 'miyama_town' }];
    addKnownNonAgility(s, 'hand', 'p2');
    expect(activate(s, source, ability(1, 'gale-advance')).ok).toBe(true);
    expect(rules.deriveBattleParticipantsFromState(s, 'miyama_town').find((entry) => entry.playerId === 'p2')!.totalPower).toBe(0);
    expect(s.abilityRuntime!.achillesBattlePowerZeroByBattlefield!['battle-phase:1:battle:miyama_town:1']!.targetPlayerIds).toEqual(['p2']);
  });

  it('S1 binds receipts to battle/result identity, clears on settlement, and allows a distinct same-round battle', () => {
    const s = setup(); const source = add(s, skill(1), 'attack_area', 'p1');
    s.abilityRuntime!.cardState[source] = { active: true, faceDown: false, playedRound: 1 };
    s.round.activePhase = 'battle'; s.battleDeclarations = [{ battlefieldId: 'miyama_town' }];
    addKnownNonAgility(s, 'hand', 'p2');
    expect(activate(s, source, ability(1, 'gale-advance')).ok).toBe(true);
    const first = s.abilityRuntime!.achillesBattlePowerZeroByBattlefield!['battle-phase:1:battle:miyama_town:1']!;
    expect(first).toMatchObject({
      battlePhaseResolutionId: 'battle-phase:1',
      battleId: 'battle-phase:1:battle:miyama_town:1',
      resultId: 'battle-phase:1:battle:miyama_town:1:result',
      settlementId: 'battle-phase:1:battle:miyama_town:1:result:settlement',
    });
    Object.assign(s, rules.resolveBattlefield(s, { battlefieldId: 'miyama_town' }).nextState);
    expect(s.abilityRuntime!.achillesBattlePowerZeroByBattlefield).toEqual({});

    addKnownNonAgility(s, 'hand', 'p2');
    expect(activate(s, source, ability(1, 'gale-advance')).ok).toBe(true);
    expect(Object.keys(s.abilityRuntime!.achillesBattlePowerZeroByBattlefield ?? {})).toEqual(['battle-phase:1:battle:miyama_town:2']);
    const forged = structuredClone(s);
    forged.abilityRuntime!.achillesBattlePowerZeroByBattlefield!['battle-phase:1:battle:miyama_town:2']!.resultId = 'forged-result';
    expect(rules.isDeferredAbilityRuntimeProvenanceValidForRestore(forged)).toBe(false);
    const selfConsistentForgery = structuredClone(s);
    const forgedReceipt = selfConsistentForgery.abilityRuntime!.achillesBattlePowerZeroByBattlefield!['battle-phase:1:battle:miyama_town:2']!;
    delete selfConsistentForgery.abilityRuntime!.achillesBattlePowerZeroByBattlefield!['battle-phase:1:battle:miyama_town:2'];
    forgedReceipt.battlePhaseResolutionId = 'battle-phase:1';
    forgedReceipt.battleId = 'battle-phase:1:battle:miyama_town:999';
    forgedReceipt.resultId = 'battle-phase:1:battle:miyama_town:999:result';
    forgedReceipt.settlementId = 'battle-phase:1:battle:miyama_town:999:result:settlement';
    selfConsistentForgery.abilityRuntime!.achillesBattlePowerZeroByBattlefield![forgedReceipt.battleId] = forgedReceipt;
    expect(rules.isDeferredAbilityRuntimeProvenanceValidForRestore(selfConsistentForgery)).toBe(false);
    expect(rules.resolveBattlefield(selfConsistentForgery, { battlefieldId: 'miyama_town' }).nextState).toBe(selfConsistentForgery);
    Object.assign(s, rules.resolveBattlefield(s, { battlefieldId: 'miyama_town' }).nextState);
    expect(s.abilityRuntime!.achillesBattlePowerZeroByBattlefield).toEqual({});
  });

  it('S2 accepts branch 1 and 3, rejects branch 2, and restores a previously revealed name at round end', () => {
    const s = setup(); const source = add(s, skill(2), 'attack_area', 'p1');
    s.abilityRuntime!.cardState[source] = { active: true, faceDown: false, playedRound: 1 };
    add(s, 'ordinary-card', 'hand', 'p2');
    expect(activate(s, source, ability(2, 'blue-sky')).ok).toBe(true);
    const decision = s.abilityRuntime!.pendingDecision!;
    expect(decision.candidates).toEqual(['discard_hand', 'forbid_skills', 'hide_true_name']);
    expect(rules.isCanonicalGenericPendingDecisionForRestore(s, decision)).toBe(true);
    const forged = structuredClone(decision); forged.candidates = ['forbid_skills'];
    expect(rules.isCanonicalGenericPendingDecisionForRestore(s, forged)).toBe(false);
    const blocked = rules.dispatchAbilityCommand(s, 'p1', { type: 'choose_target', decisionId: decision.id, selectedIds: ['forbid_skills'] });
    expect(blocked.ok).toBe(false);
    expect(s.abilityRuntime!.pendingDecision?.id).toBe(decision.id);
    const accepted = rules.dispatchAbilityCommand(s, 'p1', { type: 'choose_target', decisionId: decision.id, selectedIds: ['discard_hand'] });
    expect(accepted.ok).toBe(true);

    const hidden = setup(); const hiddenSource = add(hidden, skill(2), 'attack_area', 'p1');
    hidden.abilityRuntime!.cardState[hiddenSource] = { active: true, faceDown: false, playedRound: 1 };
    hidden.abilityRuntime!.revealedServants = ['p1'];
    expect(activate(hidden, hiddenSource, ability(2, 'blue-sky')).ok).toBe(true);
    const hideDecision = hidden.abilityRuntime!.pendingDecision!;
    expect(rules.dispatchAbilityCommand(hidden, 'p1', { type: 'choose_target', decisionId: hideDecision.id, selectedIds: ['hide_true_name'] }).ok).toBe(true);
    expect(hidden.players[0]!.mana).toBe(9); expect(hidden.abilityRuntime!.revealedServants).toEqual([]);
    expect(rules.isDeferredAbilityRuntimeProvenanceValidForRestore(hidden)).toBe(true);
    const forgedHidden = structuredClone(hidden); forgedHidden.abilityRuntime!.achillesHiddenServantsByPlayer!.p1!.sourceCardId = 'forged-source';
    expect(rules.isDeferredAbilityRuntimeProvenanceValidForRestore(forgedHidden)).toBe(false);
    rules.advanceAbilityPhase(hidden, 'round_end');
    expect(hidden.abilityRuntime!.revealedServants).toEqual(['p1']);
  });

  it('S3 records only an exact-one player pair and never installs persistent locks or immunity', () => {
    const s = setup(); const source = add(s, skill(3), 'attack_area', 'p1');
    s.abilityRuntime!.cardState[source] = { active: true, faceDown: false, playedRound: 1 };
    expect(activate(s, source, ability(3, 'hero-duel')).ok).toBe(true);
    expect(s.abilityRuntime!.achillesScopedPairReceipts).toEqual([expect.objectContaining({ controllerId: 'p1', opponentId: 'p2', battlefieldId: 'miyama_town' })]);
    expect(s.abilityRuntime!.ongoingEffects).toHaveLength(0);
  });
});
