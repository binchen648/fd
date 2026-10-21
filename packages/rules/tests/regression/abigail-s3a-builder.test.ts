import { describe, expect, it } from 'vitest';
import { readFileSync } from 'node:fs';
import * as rules from '../../src/index';
import { createSeededGameState } from '../../src/tools/seeded-state';
import { createMatchSession } from '../../src/match-session';

const raw = JSON.parse(readFileSync('data/authoring/servants/servant.abigail.json', 'utf8')) as any;
const sourceDefinition = 'servant.abigail.skill.sc-abigail-3';
const outsideLifeDefinition = 'servant.abigail.skill.sc-abigail-4';
const abilityId = 'servant.abigail.skill.sc-abigail-3.banish-outside-life';

function setup() {
  const state = createSeededGameState();
  state.cards = [];
  state.round.activePhase = 'action';
  state.round.prioritySeat = 1;
  state.players[0]!.mana = 4;
  state.players[0]!.servantCardId = 'servant.abigail';
  rules.initializeAbilityRuntime(state, rules.loadAuthoringJson(raw), { seed: 42 });
  return state;
}

function add(state: ReturnType<typeof setup>, definitionId: string, zone: string, generatedBy?: string) {
  const instanceId = `abigail-${state.cards.length}`;
  state.cards.push({ instanceId, definitionId, ownerPlayerId: 'p1', controllerPlayerId: 'p1', zone,
    visibility: { scope: 'owner_only', ownerPlayerId: 'p1' }, ...(generatedBy ? { generatedBy } : {}) });
  return instanceId;
}

describe('Abigail s3a source-bound first clause', () => {
  it('compiles canonical provenance and exposes only the implemented clause', () => {
    const pack = rules.loadAuthoringJson(raw);
    expect(pack.report).toEqual([]);
    expect(raw.cards[2].phase3Evidence.f1ClauseSources[0]).toMatchObject({
      locator: 'servants[178].skills[2].text#line=1',
      sha256: '967eb0e8af3fde249604483793fb7d414e2e702dc7f37dff62ebd122b3675838',
    });
    expect(pack.cards[sourceDefinition].abilities.map((a: any) => a.id)).toEqual([abilityId]);
    expect(raw.cards[3].provenance).toMatchObject({
      canonicalIdentity: 'outside-life', generatedBy: 'servant.abigail.skill.sc-abigail-1', sourceBound: true,
    });
  });

  it('banishes exactly one canonical hand card and grants two mana atomically', () => {
    const state = setup();
    const source = add(state, sourceDefinition, 'skill');
    const target = add(state, outsideLifeDefinition, 'hand', 'servant.abigail.skill.sc-abigail-1');
    const played = rules.dispatchAbilityCommand(state, 'p1', { type: 'play_card', cardInstanceId: source });
    expect(played.ok).toBe(true);
    const activation = rules.dispatchAbilityCommand(state, 'p1', { type: 'activate_ability', cardInstanceId: source, abilityId });
    expect(activation.ok).toBe(true);
    const pending = rules.projectAbilityState(state, 'p1').pendingDecision!;
    expect(pending.candidates).toEqual([target]);
    const resolved = rules.dispatchAbilityCommand(state, 'p1', { type: 'choose_target', decisionId: pending.id, selectedIds: [target] });
    expect(resolved.ok).toBe(true);
    expect(state.cards.find((card) => card.instanceId === target)?.zone).toBe('removed_from_game');
    expect(state.players[0]!.mana).toBe(6);
  });

  it('rejects forged, duplicate/stale targets without mutating state and restore validation is fail-closed', () => {
    const state = setup();
    const source = add(state, sourceDefinition, 'skill');
    const forged = add(state, outsideLifeDefinition, 'hand', 'forged-source');
    expect(rules.dispatchAbilityCommand(state, 'p1', { type: 'play_card', cardInstanceId: source }).ok).toBe(true);
    expect(rules.dispatchAbilityCommand(state, 'p1', { type: 'activate_ability', cardInstanceId: source, abilityId }).ok).toBe(false);
    expect(state.players[0]!.mana).toBe(4);
    expect(state.cards.find((card) => card.instanceId === forged)?.zone).toBe('hand');

    const valid = add(state, outsideLifeDefinition, 'hand', 'servant.abigail.skill.sc-abigail-1');
    expect(rules.dispatchAbilityCommand(state, 'p1', { type: 'activate_ability', cardInstanceId: source, abilityId }).ok).toBe(true);
    const pending = state.abilityRuntime!.pendingDecision!;
    const before = JSON.stringify(state);
    state.cards.find((card) => card.instanceId === valid)!.zone = 'discard';
    expect(rules.dispatchAbilityCommand(state, 'p1', { type: 'choose_target', decisionId: pending.id, selectedIds: [valid] }).ok).toBe(false);
    expect(state.players[0]!.mana).toBe(4);
    expect(state.abilityRuntime!.pendingDecision).toBeTruthy();
    expect(JSON.stringify(state).replace('"zone":"discard"', '"zone":"hand"')).toBe(before);
    const decision = structuredClone(state.abilityRuntime!.pendingDecision!);
    expect(rules.isCanonicalGenericPendingDecisionForRestore(state, decision)).toBe(false);

    const clean = setup();
    const cleanSource = add(clean, sourceDefinition, 'skill');
    const cleanTarget = add(clean, outsideLifeDefinition, 'hand', 'servant.abigail.skill.sc-abigail-1');
    expect(rules.dispatchAbilityCommand(clean, 'p1', { type: 'play_card', cardInstanceId: cleanSource }).ok).toBe(true);
    expect(rules.dispatchAbilityCommand(clean, 'p1', { type: 'activate_ability', cardInstanceId: cleanSource, abilityId }).ok).toBe(true);
    const tampered = structuredClone(clean.abilityRuntime!.pendingDecision!);
    tampered.target.scope.zone = 'discard';
    expect(tampered.candidates).toContain(cleanTarget);
    expect(rules.isCanonicalGenericPendingDecisionForRestore(clean, tampered)).toBe(false);
  });

  it('is present in the generated live MatchSession pack/deck', () => {
    const session = createMatchSession({ seed: 20261022, humanPlayerId: 'p1' });
    expect(session.state.abilityRuntime?.pack.cards[sourceDefinition]).toBeTruthy();
    expect(session.state.abilityRuntime?.pack.cards[outsideLifeDefinition]).toBeTruthy();
    expect(session.pairings.some((pairing) => pairing.servant.id === 'servant.abigail')).toBe(false);
  });
});
