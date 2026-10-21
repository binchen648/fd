import { describe, expect, it } from 'vitest';
import { readFileSync } from 'node:fs';
import * as rules from '../../src/index';
import { createSeededGameState } from '../../src/tools/seeded-state';
import { createMatchSession, restoreMatchSession } from '../../src/match-session';

const raw = JSON.parse(readFileSync('data/authoring/servants/servant.abigail.json', 'utf8')) as any;
const sourceDefinition = 'servant.abigail.skill.sc-abigail-4';
const releaseAbilityId = 'servant.abigail.skill.sc-abigail-4.true-name-release';
const cleanupAbilityId = 'servant.abigail.skill.sc-abigail-4.recycle-to-abigail-discard';
const generatedBy = 'servant.abigail.skill.sc-abigail-1';

function setup() {
  const state = createSeededGameState({ activeSeats: [1, 2] });
  state.cards = [];
  state.round.activePhase = 'action';
  state.players[0]!.servantCardId = 'servant.abigail';
  state.players[0]!.locationId = 'miyama_town';
  state.players[1]!.locationId = 'miyama_town';
  rules.initializeAbilityRuntime(state, rules.loadAuthoringJson(raw), { seed: 42 });
  return state;
}

function addSource(state: ReturnType<typeof setup>, controllerId = 'p2', marker = generatedBy) {
  const instanceId = `abigail-s4-${state.cards.length}`;
  state.cards.push({ instanceId, definitionId: sourceDefinition, ownerPlayerId: 'p1', controllerPlayerId: controllerId,
    zone: 'attack_area', visibility: { scope: 'public' }, generatedBy: marker });
  state.abilityRuntime!.cardState[instanceId] = { active: true, faceDown: false, playedRound: state.round.roundNumber };
  return instanceId;
}

function useEvent(sourceCardId: string) {
  return { id: `use:${sourceCardId}`, type: 'on_use_declared' as const, sourceCardId };
}

function terminalEvent() {
  return { id: 'battle-phase:1:after_battle_ended', type: 'after_battle_ended' as const,
    battlePhaseResolutionId: 'battle-phase:1', battleIds: [], resultIds: [], scoringReceiptIds: [],
    battleParticipantIds: ['p1', 'p2'], battleOutcomes: [] };
}

describe('Abigail s4 source-bound true-name release', () => {
  it('compiles exact source clauses and the generated live pack contract', () => {
    const pack = rules.loadAuthoringJson(raw);
    expect(pack.report).toEqual([]);
    const card = pack.cards[sourceDefinition];
    expect(rules.isAbigailS4ReleaseSemantic(card.abilities.find((a) => a.id === releaseAbilityId)!)).toBe(true);
    expect(rules.isAbigailS4CleanupSemantic(card.abilities.find((a) => a.id === cleanupAbilityId)!)).toBe(true);
    expect(raw.cards[3].phase3Evidence.f1ClauseSources).toEqual(expect.arrayContaining([
      expect.objectContaining({ locator: 'servants[178].skills[3].text#line=2', sha256: '6a848e72c9475916be224140aae1bd920e23d7716e82ced6b7c039321ea54a60' }),
      expect.objectContaining({ locator: 'servants[178].skills[3].text#line=3', sha256: '04d91af3bd1b263a8e9a2ed8d6562257fc21cdb07810c9344230caa419ad1231' }),
    ]));
    const session = createMatchSession({ seed: 20261022, humanPlayerId: 'p1' });
    expect(session.state.abilityRuntime?.pack.cards[sourceDefinition]?.abilities.map((a) => a.id)).toEqual(
      expect.arrayContaining([releaseAbilityId, cleanupAbilityId]));
  });

  it('installs one +6 envelope per distinct player and applies it to combat totals', () => {
    const state = setup();
    const source = addSource(state, 'p2');
    rules.processAbilityEvent(state, useEvent(source));
    const envelope = state.ruleOverrides?.abigailTrueNamePowerBySource?.[source];
    expect(envelope).toMatchObject({ sourceCardId: source, abilityId: releaseAbilityId, controllerId: 'p2', abigailPlayerId: 'p1', amount: 6 });
    expect(envelope?.targetPlayerIds).toEqual(['p2', 'p1']);
    expect(state.abilityRuntime!.revealedServants).toContain('p1');
    const participants = rules.deriveBattleParticipantsFromState(state, 'miyama_town');
    expect(participants.find((entry) => entry.playerId === 'p1')?.totalPower).toBe(6);
    expect(participants.find((entry) => entry.playerId === 'p2')?.totalPower).toBe(6);
    const before = JSON.stringify(state);
    rules.processAbilityEvent(state, useEvent(source));
    expect(JSON.stringify(state)).toBe(before);
  });

  it('does not double the bonus when Abigail is the controller', () => {
    const state = setup();
    const source = addSource(state, 'p1');
    rules.processAbilityEvent(state, useEvent(source));
    expect(state.ruleOverrides?.abigailTrueNamePowerBySource?.[source]?.targetPlayerIds).toEqual(['p1']);
    expect(rules.deriveBattleParticipantsFromState(state, 'miyama_town').find((entry) => entry.playerId === 'p1')?.totalPower).toBe(6);
  });

  it('atomically moves the active source to Abigail discard and rejects forged/stale replay', () => {
    const state = setup();
    const source = addSource(state, 'p2');
    rules.processAbilityEvent(state, useEvent(source));
    rules.processAbilityEvent(state, terminalEvent());
    const moved = state.cards.find((card) => card.instanceId === source)!;
    expect(moved.zone).toBe('discard');
    expect(moved.ownerPlayerId).toBe('p1');
    expect(moved.controllerPlayerId).toBe('p1');
    expect(state.ruleOverrides?.abigailTrueNamePowerBySource).toBeUndefined();
    expect(state.abilityRuntime!.cardState[source]?.active).toBe(false);
    const snapshot = JSON.stringify(state);
    rules.processAbilityEvent(state, terminalEvent());
    expect(JSON.stringify(state)).toBe(snapshot);

    const forged = setup();
    const forgedSource = addSource(forged, 'p2', 'forged-source');
    const forgedBefore = JSON.stringify(forged);
    expect(() => rules.processAbilityEvent(forged, useEvent(forgedSource))).toThrow();
    expect(JSON.stringify(forged)).toBe(forgedBefore);
  });

  it('is order-independent with Abigail s3b terminal cleanup in the same battle event', () => {
    const state = setup();
    state.round.activePhase = 'action';
    state.round.prioritySeat = 1;
    const s3Source = 'abigail-s3-source';
    state.cards.push({ instanceId: s3Source, definitionId: 'servant.abigail.skill.sc-abigail-3', ownerPlayerId: 'p1', controllerPlayerId: 'p1',
      zone: 'skill', visibility: { scope: 'owner_only', ownerPlayerId: 'p1' } });
    expect(rules.dispatchAbilityCommand(state, 'p1', { type: 'play_card', cardInstanceId: s3Source }).ok).toBe(true);
    const s4Source = addSource(state, 'p1');
    rules.processAbilityEvent(state, useEvent(s4Source));
    rules.processAbilityEvent(state, terminalEvent());
    expect(state.cards.find((card) => card.instanceId === s4Source)?.zone).toBe('discard');
    expect(state.cards.find((card) => card.instanceId === s4Source)?.ownerPlayerId).toBe('p1');
    expect(state.cards.find((card) => card.instanceId === s4Source)?.zone).not.toBe('deck');
    expect(state.ruleOverrides?.abigailTrueNamePowerBySource).toBeUndefined();
  });

  it('rejects malformed source-specific ability shapes', () => {
    const ability = structuredClone(raw.cards[3].abilities[0]);
    ability.visibility.revealScope = 'card_only';
    expect(rules.isAbigailS4ReleaseSemantic(rules.loadAuthoringJson({ ...raw, cards: raw.cards.map((card: any, i: number) => i === 3 ? { ...card, abilities: [ability] } : card) }).cards[sourceDefinition].abilities[0]!)).toBe(false);
  });

  it('rejects a true-name declaration outside the authored action phase without mutation', () => {
    const state = setup();
    const source = addSource(state, 'p1');
    state.round.activePhase = 'round_end';
    const before = JSON.stringify(state);
    rules.processAbilityEvent(state, useEvent(source));
    expect(JSON.stringify(state)).toBe(before);
  });

  it('restores only an exact active-source power envelope', () => {
    const session = createMatchSession({ seed: 20261022, humanPlayerId: 'p1' });
    session.state.players[0]!.servantCardId = 'servant.abigail';
    const owner = session.state.players[0]!;
    const controller = session.state.players[1]!;
    const source = `abigail-s4-restore-${owner.id}`;
    session.state.cards.push({ instanceId: source, definitionId: sourceDefinition, ownerPlayerId: owner.id, controllerPlayerId: controller.id,
      zone: 'attack_area', visibility: { scope: 'public' }, generatedBy });
    session.state.abilityRuntime!.cardState[source] = { active: true, faceDown: false, playedRound: session.state.round.roundNumber };
    session.state.ruleOverrides ??= {};
    session.state.ruleOverrides.abigailTrueNamePowerBySource = {
      [source]: { sourceCardId: source, abilityId: releaseAbilityId, controllerId: controller.id, abigailPlayerId: owner.id,
        targetPlayerIds: [controller.id, owner.id], amount: 6 },
    };
    const snapshot = session.serializeSession();
    const restored = restoreMatchSession(snapshot);
    expect(restored.state.ruleOverrides?.abigailTrueNamePowerBySource?.[source]?.amount).toBe(6);
    const forgedTargets = structuredClone(snapshot);
    (forgedTargets.state.ruleOverrides!.abigailTrueNamePowerBySource![source] as any).targetPlayerIds.push('p3');
    expect(() => restoreMatchSession(forgedTargets)).toThrow();
    const forged = structuredClone(snapshot);
    (forged.state.cards.find((card) => card.instanceId === source) as any).generatedBy = 'forged-source';
    expect(() => restoreMatchSession(forged)).toThrow();
  });
});
