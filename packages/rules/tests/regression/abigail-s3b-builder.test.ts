import { describe, expect, it } from 'vitest';
import { readFileSync } from 'node:fs';
import * as rules from '../../src/index';
import { createSeededGameState } from '../../src/tools/seeded-state';
import { createMatchSession } from '../../src/match-session';

const raw = JSON.parse(readFileSync('data/authoring/servants/servant.abigail.json', 'utf8')) as any;
const sourceDefinition = 'servant.abigail.skill.sc-abigail-3';
const outsideLifeDefinition = 'servant.abigail.skill.sc-abigail-4';
const actionAbilityId = 'servant.abigail.skill.sc-abigail-3.play-outside-life';
const cleanupAbilityId = 'servant.abigail.skill.sc-abigail-3.recycle-active-outside-life';
const generatedBy = 'servant.abigail.skill.sc-abigail-1';

function setup() {
  const state = createSeededGameState({ activeSeats: [1, 2] });
  state.cards = [];
  state.round.activePhase = 'action';
  state.round.prioritySeat = 1;
  state.players[0]!.mana = 10;
  state.players[0]!.servantCardId = 'servant.abigail';
  rules.initializeAbilityRuntime(state, rules.loadAuthoringJson(raw), { seed: 42 });
  return state;
}

function add(state: ReturnType<typeof setup>, definitionId: string, zone: string, marker = generatedBy) {
  const instanceId = `abigail-s3b-${state.cards.length}`;
  state.cards.push({ instanceId, definitionId, ownerPlayerId: 'p1', controllerPlayerId: 'p1', zone,
    visibility: ['field', 'attack_area'].includes(zone) ? { scope: 'public' } : { scope: 'owner_only', ownerPlayerId: 'p1' }, generatedBy: marker });
  return instanceId;
}

function playSource(state: ReturnType<typeof setup>) {
  const source = add(state, sourceDefinition, 'skill', generatedBy);
  expect(rules.dispatchAbilityCommand(state, 'p1', { type: 'play_card', cardInstanceId: source }).ok).toBe(true);
  return source;
}

function terminalEvent(id = 'battle-phase:1:after_battle_ended') {
  return {
    id,
    type: 'after_battle_ended' as const,
    battlePhaseResolutionId: 'battle-phase:1',
    battleIds: [], resultIds: [], scoringReceiptIds: [], battleParticipantIds: ['p1'], battleOutcomes: [],
  };
}

describe('Abigail s3b source-bound second clause', () => {
  it('compiles the exact discard-play and terminal recycle contracts with source provenance', () => {
    const pack = rules.loadAuthoringJson(raw);
    expect(pack.report).toEqual([]);
    expect(rules.isAbigailS3bActionSemantic(pack.cards[sourceDefinition].abilities.find((a: any) => a.id === actionAbilityId)!)).toBe(true);
    expect(rules.isAbigailS3bCleanupSemantic(pack.cards[sourceDefinition].abilities.find((a: any) => a.id === cleanupAbilityId)!)).toBe(true);
    expect(raw.cards[2].phase3Evidence.f1ClauseSources).toEqual(expect.arrayContaining([
      expect.objectContaining({ locator: 'servants[178].skills[2].text#line=2', sha256: 'a68c200c1a14a2a22a091514c57ab1ae24a8aff0ae94becd97fe139eb9d9c208' }),
    ]));
    expect(raw.cards[3].provenance).toMatchObject({ canonicalIdentity: 'outside-life', generatedBy, sourceBound: true });
  });

  it('selects any number of canonical discard cards and pays their printed costs atomically', () => {
    const state = setup();
    const source = playSource(state);
    const first = add(state, outsideLifeDefinition, 'discard');
    const second = add(state, outsideLifeDefinition, 'discard');
    const forged = add(state, outsideLifeDefinition, 'discard', 'forged-source');
    expect(rules.dispatchAbilityCommand(state, 'p1', { type: 'activate_ability', cardInstanceId: source, abilityId: actionAbilityId }).ok).toBe(true);
    const pending = state.abilityRuntime!.pendingDecision!;
    expect(pending.candidates).toEqual([first, second]);
    expect(pending.min).toBe(0);
    expect(pending.max).toBe(2);
    expect(rules.dispatchAbilityCommand(state, 'p1', { type: 'choose_target', decisionId: pending.id, selectedIds: [first, second] }).ok).toBe(true);
    expect(state.players[0]!.mana).toBe(8);
    expect(state.cards.find((card) => card.instanceId === first)?.zone).toBe('attack_area');
    expect(state.cards.find((card) => card.instanceId === second)?.zone).toBe('attack_area');
    expect(state.cards.find((card) => card.instanceId === forged)?.zone).toBe('discard');

    const insufficient = setup();
    const insufficientSource = playSource(insufficient);
    insufficient.players[0]!.mana = 1;
    const one = add(insufficient, outsideLifeDefinition, 'discard');
    const two = add(insufficient, outsideLifeDefinition, 'discard');
    expect(rules.dispatchAbilityCommand(insufficient, 'p1', { type: 'activate_ability', cardInstanceId: insufficientSource, abilityId: actionAbilityId }).ok).toBe(true);
    const pendingInsufficient = insufficient.abilityRuntime!.pendingDecision!;
    const before = JSON.stringify(insufficient);
    expect(rules.dispatchAbilityCommand(insufficient, 'p1', { type: 'choose_target', decisionId: pendingInsufficient.id, selectedIds: [one, two] }).ok).toBe(false);
    expect(JSON.stringify(insufficient)).toBe(before);
  });

  it('rejects stale/forged pending targets and restores only exact continuation envelopes', () => {
    const state = setup();
    const source = playSource(state);
    const target = add(state, outsideLifeDefinition, 'discard');
    expect(rules.dispatchAbilityCommand(state, 'p1', { type: 'activate_ability', cardInstanceId: source, abilityId: actionAbilityId }).ok).toBe(true);
    const pending = structuredClone(state.abilityRuntime!.pendingDecision!);
    pending.target.scope.zone = 'hand';
    expect(rules.isCanonicalGenericPendingDecisionForRestore(state, pending)).toBe(false);
    const forgedSelections = structuredClone(state.abilityRuntime!.pendingDecision!);
    forgedSelections.context.selections.injected = ['nonexistent-card'];
    expect(rules.isCanonicalGenericPendingDecisionForRestore(state, forgedSelections)).toBe(false);
    const forgedEvent = structuredClone(state.abilityRuntime!.pendingDecision!) as any;
    forgedEvent.context.event = { id: 'forged', type: 'after_battle_ended', battlePhaseResolutionId: 'fake' };
    expect(rules.isCanonicalGenericPendingDecisionForRestore(state, forgedEvent)).toBe(false);
    const forgedExtra = structuredClone(state.abilityRuntime!.pendingDecision!) as any;
    forgedExtra.context.injected = 'forged';
    expect(rules.isCanonicalGenericPendingDecisionForRestore(state, forgedExtra)).toBe(false);
    const live = state.abilityRuntime!.pendingDecision!;
    state.cards.find((card) => card.instanceId === target)!.zone = 'attack_area';
    const before = JSON.stringify(state);
    expect(rules.dispatchAbilityCommand(state, 'p1', { type: 'choose_target', decisionId: live.id, selectedIds: [target] }).ok).toBe(false);
    expect(JSON.stringify(state)).toBe(before);
  });

  it('recycles only active canonical Outside-Life cards at the terminal battle event and dedupes replay', () => {
    const state = setup();
    const source = playSource(state);
    const activeOutsideLife = add(state, outsideLifeDefinition, 'attack_area');
    state.abilityRuntime!.cardState[activeOutsideLife] = { active: true, faceDown: false, playedRound: state.round.roundNumber };
    const inactiveOutsideLife = add(state, outsideLifeDefinition, 'discard');
    const forgedActive = add(state, outsideLifeDefinition, 'attack_area', 'forged-source');
    state.abilityRuntime!.cardState[forgedActive] = { active: true, faceDown: false, playedRound: state.round.roundNumber };
    rules.processAbilityEvent(state, terminalEvent() as any);
    expect(state.cards.find((card) => card.instanceId === source)?.zone).toBe('attack_area');
    expect(state.cards.find((card) => card.instanceId === activeOutsideLife)?.zone).toBe('deck');
    expect(state.abilityRuntime!.cardState[activeOutsideLife]?.active).toBe(false);
    expect(state.cards.find((card) => card.instanceId === inactiveOutsideLife)?.zone).toBe('discard');
    expect(state.cards.find((card) => card.instanceId === forgedActive)?.zone).toBe('attack_area');
    const snapshot = JSON.stringify(state);
    rules.processAbilityEvent(state, terminalEvent() as any);
    expect(JSON.stringify(state)).toBe(snapshot);
    expect(state.abilityRuntime!.events).toContainEqual(expect.objectContaining({ type: 'abigail_s3b_active_outside_life_recycled', movedCount: 1 }));
  });

  it('is present in the generated live MatchSession pack', () => {
    const session = createMatchSession({ seed: 20261022, humanPlayerId: 'p1' });
    const source = session.state.abilityRuntime?.pack.cards[sourceDefinition];
    expect(source?.abilities.map((ability) => ability.id)).toEqual(expect.arrayContaining([actionAbilityId, cleanupAbilityId]));
    expect(session.state.abilityRuntime?.pack.cards[outsideLifeDefinition]).toBeTruthy();
  });
});
