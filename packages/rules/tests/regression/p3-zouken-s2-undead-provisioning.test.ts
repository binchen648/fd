import { describe, expect, it } from 'vitest';

import generatedContent from '../../../../data/generated/fd-playtest-v1.content-library.json';
import authoringContent from '../../../../data/authoring/masters/master.zouken.json';
import * as rules from '../../src/index';

const SOURCE_DEFINITION = 'master.zouken.skill.s2';
const TARGETS = ['master.zouken.skill.s3', 'master.zouken.skill.s4'] as const;
const SOURCE_INSTANCE = 'p1-zouken-s2';

type Session = ReturnType<typeof rules.createMatchSession>;

function sessionWithZouken(): Session {
  const session = rules.createMatchSession({ seed: 20261029, humanPlayerId: 'p1', humanPlayerIds: ['p1', 'p2', 'p3', 'p4', 'p5', 'p6', 'p7'] });
  const state = session.state;
  state.players[0]!.masterCardId = 'master.zouken';
  state.abilityRuntime!.manaCaps = {};
  state.abilityRuntime!.manaCapProvenance = {};
  state.cards.push({
    instanceId: SOURCE_INSTANCE, definitionId: SOURCE_DEFINITION, ownerPlayerId: 'p1', controllerPlayerId: 'p1', zone: 'skill',
    visibility: { scope: 'owner_only', ownerPlayerId: 'p1' },
  });
  state.abilityRuntime!.cardState[SOURCE_INSTANCE] = { active: false, faceDown: false, playedRound: state.round.roundNumber };
  return session;
}

function start(session: Session, id = 'zouken-s2-game-start'): void {
  rules.processAbilityEvent(session.state, { id, type: 'game_start' });
}

function provisioned(state: Session['state'], definitionId: string) {
  return state.cards.filter((card) => card.definitionId === definitionId);
}

describe('P3 Zouken s2 五百年的活尸 authoritative game-start provisioning', () => {
  it('binds the canonical source and defers s3 then s4 in a real seven-player MatchSession', () => {
    const source = generatedContent.rules.cards[SOURCE_DEFINITION];
    const sourceAuthoring = authoringContent.cards.find((card) => card.id === SOURCE_DEFINITION)!;
    expect(sourceAuthoring.phase3Evidence.sourceTextSha256).toBe('8b8f4b24424a8600807fd42c0965fad94bd6f9dcdc9917efe10f1bff8b17f3e3');
    expect(source.abilities[0]!.effects[0]).toMatchObject({ type: 'provision_skill_cards', atomic: true, targetDefinitionIds: [...TARGETS] });
    expect(generatedContent.rules.cards[TARGETS[0]].initialZone).toBeUndefined();
    expect(generatedContent.rules.cards[TARGETS[1]].initialZone).toBeUndefined();

    const session = sessionWithZouken();
    start(session);
    const created = session.state.cards.filter((card) => TARGETS.includes(card.definitionId as typeof TARGETS[number]));
    expect(created.map((card) => card.definitionId)).toEqual([...TARGETS]);
    expect(created).toEqual([
      expect.objectContaining({ ownerPlayerId: 'p1', controllerPlayerId: 'p1', zone: 'skill', generatedBy: SOURCE_INSTANCE,
        visibility: { scope: 'owner_only', ownerPlayerId: 'p1' } }),
      expect.objectContaining({ ownerPlayerId: 'p1', controllerPlayerId: 'p1', zone: 'skill', generatedBy: SOURCE_INSTANCE,
        visibility: { scope: 'owner_only', ownerPlayerId: 'p1' } }),
    ]);
    expect(session.state.abilityRuntime!.events.filter((event) => event.type === 'card_created' && event.sourceCardId === SOURCE_INSTANCE)
      .map((event) => event.cardInstanceId)).toEqual(created.map((card) => card.instanceId));
    const beforeReplay = created.map((card) => ({ ...card }));
    const beforeCreatedEventCount = session.state.abilityRuntime!.events.filter((event) => event.type === 'card_created' && event.sourceCardId === SOURCE_INSTANCE).length;
    start(session, 'zouken-s2-replay');
    expect(session.state.cards.filter((card) => TARGETS.includes(card.definitionId as typeof TARGETS[number]))).toEqual(beforeReplay);
    expect(session.state.abilityRuntime!.events.filter((event) => event.type === 'card_created' && event.sourceCardId === SOURCE_INSTANCE)).toHaveLength(beforeCreatedEventCount);
    expect(rules.isDeferredAbilityRuntimeProvenanceValidForRestore(session.state)).toBe(true);
    const restored = rules.restoreMatchSession(session.serializeSession());
    expect(provisioned(restored.state, TARGETS[0])).toHaveLength(1);
    expect(provisioned(restored.state, TARGETS[1])).toHaveLength(1);
  });

  it.each([
    ['reversed target order', (session: Session) => {
      session.state.abilityRuntime!.pack.cards[SOURCE_DEFINITION]!.abilities[0]!.effects[0]!.targetDefinitionIds = [...TARGETS].reverse();
    }],
    ['cross-owner source', (session: Session) => { session.state.cards.find((card) => card.instanceId === SOURCE_INSTANCE)!.ownerPlayerId = 'p2'; }],
    ['cross-owner target', (session: Session) => session.state.cards.push({
      instanceId: 'foreign-s3', definitionId: TARGETS[0], ownerPlayerId: 'p2', controllerPlayerId: 'p2', zone: 'skill',
      visibility: { scope: 'owner_only', ownerPlayerId: 'p2' }, generatedBy: SOURCE_INSTANCE,
    })],
    ['missing target definition', (session: Session) => { delete session.state.abilityRuntime!.pack.cards[TARGETS[1]]; }],
    ['inert target definition', (session: Session) => { session.state.abilityRuntime!.pack.cards[TARGETS[1]]!.mode = 'unsupported'; }],
    ['non-game-start envelope', (session: Session) => { session.state.abilityRuntime!.pack.cards[SOURCE_DEFINITION]!.abilities[0]!.activation = { trigger: 'round_end' }; }],
    ['partial compatible target', (session: Session) => session.state.cards.push({
      instanceId: 'partial-s3', definitionId: TARGETS[0], ownerPlayerId: 'p1', controllerPlayerId: 'p1', zone: 'skill',
      visibility: { scope: 'owner_only', ownerPlayerId: 'p1' }, generatedBy: SOURCE_INSTANCE,
      })],
    ['duplicate compatible targets', (session: Session) => {
      for (const suffix of ['one', 'two']) session.state.cards.push({
        instanceId: `duplicate-s3-${suffix}`, definitionId: TARGETS[0], ownerPlayerId: 'p1', controllerPlayerId: 'p1', zone: 'skill',
        visibility: { scope: 'owner_only', ownerPlayerId: 'p1' }, generatedBy: SOURCE_INSTANCE,
      });
    }],
    ['forged target provenance', (session: Session) => {
      for (const definitionId of TARGETS) session.state.cards.push({
        instanceId: `forged-${definitionId}`, definitionId, ownerPlayerId: 'p1', controllerPlayerId: 'p1', zone: 'skill',
        visibility: { scope: 'owner_only', ownerPlayerId: 'p1' }, generatedBy: 'forged-source',
      });
    }],
  ] as Array<[string, (session: Session) => void]>)('fails closed before mutation for %s', (_label, mutate) => {
    const session = sessionWithZouken();
    mutate(session);
    const before = structuredClone(session.state);
    expect(() => start(session, `zouken-s2-negative-${_label}`)).toThrow();
    expect(session.state).toEqual(before);
  });

  it('rejects incomplete or forged serialized envelopes and accepts the complete replay envelope', () => {
    const session = sessionWithZouken();
    start(session);
    const valid = session.serializeSession();
    expect(rules.restoreMatchSession(valid).state.cards).toEqual(session.state.cards);

    const missingEvent = structuredClone(valid);
    missingEvent.state.abilityRuntime!.events = missingEvent.state.abilityRuntime!.events.filter((event) =>
      !(event.type === 'card_created' && event.sourceCardId === SOURCE_INSTANCE && event.cardInstanceId === provisioned(session.state, TARGETS[1])[0]!.instanceId));
    expect(() => rules.restoreMatchSession(missingEvent)).toThrow(/Invalid deferred ability runtime provenance/);

    const forgedGeneratedBy = structuredClone(valid);
    forgedGeneratedBy.state.cards.find((card) => card.definitionId === TARGETS[0])!.generatedBy = 'forged-source';
    expect(() => rules.restoreMatchSession(forgedGeneratedBy)).toThrow(/Invalid deferred ability runtime provenance/);

    const partial = structuredClone(valid);
    partial.state.cards = partial.state.cards.filter((card) => card.definitionId !== TARGETS[1]);
    expect(() => rules.restoreMatchSession(partial)).toThrow(/Invalid deferred ability runtime provenance/);
  });

  it.each([
    ['s3 cardState missing', TARGETS[0], (state: Session['state']) => { delete state.abilityRuntime!.cardState[provisioned(state, TARGETS[0])[0]!.instanceId]; }],
    ['s4 cardState missing', TARGETS[1], (state: Session['state']) => { delete state.abilityRuntime!.cardState[provisioned(state, TARGETS[1])[0]!.instanceId]; }],
    ['s3 cardState active', TARGETS[0], (state: Session['state']) => { state.abilityRuntime!.cardState[provisioned(state, TARGETS[0])[0]!.instanceId]!.active = true; }],
    ['s4 cardState faceDown', TARGETS[1], (state: Session['state']) => { state.abilityRuntime!.cardState[provisioned(state, TARGETS[1])[0]!.instanceId]!.faceDown = true; }],
  ] as Array<[string, typeof TARGETS[number], (state: Session['state']) => void]>)('rejects %s without mutating the serialized bytes or replay state', (_label, definitionId, mutate) => {
    const session = sessionWithZouken();
    start(session);
    const snapshot = session.serializeSession();
    mutate(snapshot.state);
    const bytesBeforeRestore = JSON.stringify(snapshot);
    expect(() => rules.restoreMatchSession(snapshot)).toThrow(/Invalid deferred ability runtime provenance/);
    expect(JSON.stringify(snapshot)).toBe(bytesBeforeRestore);

    const replay = rules.restoreMatchSession(session.serializeSession());
    mutate(replay.state);
    const beforeReplay = structuredClone(replay.state);
    expect(() => start(replay, `zouken-s2-forged-card-state-${definitionId}`)).toThrow();
    expect(replay.state).toEqual(beforeReplay);
  });
});
