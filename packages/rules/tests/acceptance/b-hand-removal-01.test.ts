import { describe, expect, it } from 'vitest';
import { compileLoadedPlaytestPack, loadPlaytestContentPack } from '@fd/content';
import { compileExecutableCardPack } from '../../src/ability/executable-card-pack';
import { createMatchSession, restoreMatchSession } from '../../src/match-session';
import { dispatchAbilityCommand, initializeAbilityRuntime, projectAbilityState } from '../../src/ability/interpreter';
import { loadAuthoringJson } from '../../src/ability/loader';
import { createSeededGameState } from '../../src/tools/seeded-state';

const replacement = { from: 'hand', requestedDestination: 'removed_from_game', replacementDestination: 'discard' };
const fixtureId = 'master.hand-removal-conformance';
const targetId = 'fixture.hand-removal-protected';
const timing = { phase: 'action', window: 'controller_play_card_window' };
function archive(zone = 'hand', all = false, destination = 'removed_from_game') {
  return {
    schemaVersion: 'fd-card-authoring-v1', id: fixtureId, name: 'Mechanism conformance fixture',
    cards: [
      { id: fixtureId + '.source', name: 'Removal source', cardType: 'master_skill',
        owner: { type: 'master', id: fixtureId }, cardFace: { cost: 0, basePower: 0 }, playTiming: timing,
        abilities: [{ id: 'remove', kind: 'phase_action', printedClause: 'mechanism fixture',
          activation: { phase: 'action', opens: 'controller_action_window', requiresSourceState: 'active' },
          targets: [{ id: 'victim', type: 'card_instance', scope: { zone, owner: 'any', controller: 'any' },
            count: { min: 1, max: 1 } }],
          cost: [{ type: 'pay_mana', amount: 2 }],
          effects: all
            ? [{ type: 'move_all_remaining', from: zone, to: { zone: destination } }]
            : [{ type: 'move_card', target: 'victim', to: { zone: destination } }],
          execution: { mode: 'automatic' } }] },
      { id: targetId, name: 'Protected hand card', cardType: 'servant_deck_card',
        cardFace: { cost: 0, basePower: 0 }, playTiming: timing, abilities: [], zoneMoveReplacement: { ...replacement } },
      { id: 'fixture.ordinary', name: 'Ordinary card', cardType: 'basic_attack',
        cardFace: { cost: 0, basePower: 1, attributes: ['力量'] }, playTiming: timing, abilities: [] },
    ],
  };
}
function setup(zone = 'hand', all = false, destination = 'removed_from_game', owner = 'p1') {
  const pack = loadAuthoringJson(archive(zone, all, destination));
  expect(pack.report).toEqual([]);
  const s = createSeededGameState();
  s.cards = [];
  s.round = { roundNumber: 1, activePhase: 'action', prioritySeat: 1 };
  s.players[0]!.masterCardId = fixtureId;
  s.players[0]!.mana = 4;
  s.players[0]!.locationId = 'miyama_town';
  s.players[1]!.locationId = 'miyama_town';
  s.cards.push(
    { instanceId: 'source', definitionId: fixtureId + '.source', ownerPlayerId: 'p1', controllerPlayerId: 'p1',
      zone: 'field', visibility: { scope: 'public' } },
    { instanceId: 'protected', definitionId: targetId, ownerPlayerId: owner, controllerPlayerId: owner,
      zone, visibility: { scope: 'owner_only', ownerPlayerId: owner } },
    { instanceId: 'ordinary', definitionId: 'fixture.ordinary', ownerPlayerId: owner, controllerPlayerId: owner,
      zone, visibility: { scope: 'owner_only', ownerPlayerId: owner } },
  );
  initializeAbilityRuntime(s, pack);
  s.abilityRuntime!.cardState.source = { active: true, faceDown: false, playedRound: 1, boardLocationId: 'miyama_town' };
  return s;
}
type State = ReturnType<typeof setup>;
const activate = (s: State) => dispatchAbilityCommand(s, 'p1',
  { type: 'activate_ability', cardInstanceId: 'source', abilityId: 'remove' });
const choose = (s: State, id = 'protected') => dispatchAbilityCommand(s, 'p1',
  { type: 'choose_target', decisionId: s.abilityRuntime!.pendingDecision!.id, selectedIds: [id] });
const at = (s: State, id = 'protected') => s.cards.find(c => c.instanceId === id)!;

describe('B-HAND-REMOVAL-01 L1 production compatibility', () => {
  it('uses the real production roster, normal Session commands and restoration', () => {
    const source = compileLoadedPlaytestPack(loadPlaytestContentPack('data/packs/fd-playtest-v1/pack.json',
      { workspaceRoot: process.cwd() })).library;
    const pack = compileExecutableCardPack(source);
    expect(Object.values(pack.characters).filter(c => c.kind === 'servant')).toHaveLength(7);
    expect(Object.values(pack.characters).filter(c => c.kind === 'master')).toHaveLength(7);
    const session = createMatchSession({ seed: 20260904, humanPlayerIds: ['p1', 'p2', 'p3', 'p4', 'p5', 'p6', 'p7'] });
    expect(session.runUntilHumanInputOrRoundEnd()).toBe('human_input');
    expect(session.state.players).toHaveLength(7);
    for (const player of session.state.players) {
      const cards = session.state.cards.filter(c => c.ownerPlayerId === player.id && ['deck', 'hand'].includes(c.zone));
      expect(cards).toHaveLength(12);
      const servant = session.pairings.find(p => p.playerId === player.id)!.servant.id;
      expect(cards.map(c => c.definitionId).sort()).toEqual([...pack.decks[servant]!].sort());
    }
    const window = session.state.players.flatMap(player => session.getPlayerView(player.id).legalActions
      .filter(action => action.type === 'decline_this_window').map(action => ({ playerId: player.id, action })))[0]!;
    expect(session.dispatchPlayerCommand(window.playerId, window.action).ok).toBe(true);
    const restored = restoreMatchSession(JSON.parse(JSON.stringify(session.serializeSession())));
    expect(restored.getPlayerView('p2')).toEqual(session.getPlayerView('p2'));
    expect(restored.state.players).toEqual(session.state.players);
    expect(Object.values(restored.state.abilityRuntime!.pack.cards).every(c => !c.zoneMoveReplacement)).toBe(true);
  });
});

describe('B-HAND-REMOVAL-01 L2 bounded mechanism conformance', () => {
  it.each(['hand', 'discard', 'deck'])('redirects only the hand source zone, current zone %s', zone => {
    const s = setup(zone);
    expect(activate(s).ok).toBe(true);
    expect(choose(s).ok).toBe(true);
    expect(at(s).zone).toBe(zone === 'hand' ? 'discard' : 'removed_from_game');
    expect(s.players[0]!.mana).toBe(2);
  });
  it('keeps ordinary cards removable in the same whole-hand effect', () => {
    const s = setup('hand', true);
    expect(activate(s).ok).toBe(true);
    expect(at(s).zone).toBe('discard');
    expect(at(s, 'ordinary').zone).toBe('removed_from_game');
  });
  it('keeps the card owner and controller when another player removes it', () => {
    const s = setup('hand', false, 'removed_from_game', 'p2');
    expect(activate(s).ok).toBe(true);
    expect(choose(s).ok).toBe(true);
    expect(at(s)).toMatchObject({ zone: 'discard', ownerPlayerId: 'p2', controllerPlayerId: 'p2' });
  });
  it('retains ordinary discard behavior', () => {
    const s = setup('hand', false, 'discard');
    expect(activate(s).ok).toBe(true);
    expect(choose(s).ok).toBe(true);
    expect(at(s).zone).toBe('discard');
  });
  it('retains pending selection after invalid submission and does not repay on retry', () => {
    const s = setup();
    expect(activate(s).ok).toBe(true);
    const before = structuredClone(s);
    expect(choose(s, 'not-a-card').ok).toBe(false);
    expect(s).toEqual(before);
    expect(choose(s).ok).toBe(true);
    expect(s.players[0]!.mana).toBe(2);
    const completed = structuredClone(s);
    expect(activate(s).ok).toBe(false);
    expect(s).toEqual(completed);
  });
  it('rejects inadequate payment and inactive sources before mutation', () => {
    const s = setup();
    s.players[0]!.mana = 1;
    const before = structuredClone(s);
    expect(activate(s).ok).toBe(false);
    expect(s).toEqual(before);
    s.players[0]!.mana = 4;
    s.abilityRuntime!.cardState.source!.active = false;
    const inactive = structuredClone(s);
    expect(activate(s).ok).toBe(false);
    expect(s).toEqual(inactive);
  });
  it('revalidates the selected card zone before allowing the replacement', () => {
    const s = setup();
    expect(activate(s).ok).toBe(true);
    at(s).zone = 'deck';
    const before = structuredClone(s);
    expect(choose(s).ok).toBe(false);
    expect(s).toEqual(before);
  });
  it('restores a paid pending fixture without changing its card-level rule', () => {
    const session = createMatchSession({ seed: 20260904, humanPlayerId: 'p1', restorePackKind: 'trusted_authoring_fixture' });
    Object.assign(session.state, setup());
    expect(session.dispatchPlayerCommand('p1', { type: 'activate_ability', cardInstanceId: 'source', abilityId: 'remove' }).ok).toBe(true);
    const restored = restoreMatchSession(JSON.parse(JSON.stringify(session.serializeSession())), { restorePackKind: 'trusted_authoring_fixture' });
    expect(choose(restored.state).ok).toBe(true);
    expect(at(restored.state).zone).toBe('discard');
    expect(restored.state.players[0]!.mana).toBe(2);
  });
  it('pays a source-card removal cost by actually removing the source from the game', () => {
    const s = setup();
    const raw = archive();
    const source = raw.cards[0]!;
    Object.assign(source, { zoneMoveReplacement: replacement });
    Object.assign(source.abilities![0]!, {
      activation: { phase: 'action', opens: 'controller_action_window' },
      targets: [],
      cost: [{ type: 'move_source_card', from: { zone: 'hand' }, to: { zone: 'removed_from_game' } }],
      effects: [{ type: 'adjust_mana', amount: 1 }],
    });
    const pack = loadAuthoringJson(raw);
    expect(pack.report).toEqual([]);
    s.abilityRuntime!.pack = pack;
    const instance = at(s, 'source');
    instance.zone = 'hand';
    instance.visibility = { scope: 'owner_only', ownerPlayerId: 'p1' };
    s.abilityRuntime!.cardState.source = { active: false, faceDown: false, playedRound: 0 };
    expect(activate(s).ok).toBe(true);
    expect(at(s, 'source').zone).toBe('removed_from_game');
    expect(s.players[0]!.mana).toBe(5);
  });
  it('rejects a broadened runtime rule atomically at selection', () => {
    const s = setup();
    expect(activate(s).ok).toBe(true);
    const malformed = s.abilityRuntime!.pack.cards[targetId]!.zoneMoveReplacement as unknown as Record<string, unknown>;
    malformed.from = 'deck';
    const before = structuredClone(s);
    const result = choose(s);
    expect(result.ok).toBe(false);
    expect(result.rejection?.code).toBe('invalid_card_replacement');
    expect(s).toEqual(before);
  });
  it('preserves existing protection from another player’s ability', () => {
    const s = setup('hand', false, 'removed_from_game', 'p2');
    const raw = archive();
    const shield = { id: 'fixture.shield', name: 'Opponent ability protection', cardType: 'master_skill',
      owner: { type: 'master', id: fixtureId }, cardFace: { cost: 0, basePower: 0 }, playTiming: timing,
      abilities: [{ id: 'protect', kind: 'passive', printedClause: 'conformance protection',
        activation: { trigger: 'while_active' },
        ruleModifiers: [{ rule: 'opponent_ability_effects', operation: 'ignore', scope: { subject: 'controller' } }],
        execution: { mode: 'automatic' } }] };
    const pack = loadAuthoringJson({ ...raw, cards: [...raw.cards, shield] });
    expect(pack.report).toEqual([]);
    s.abilityRuntime!.pack = pack;
    s.cards.push({ instanceId: 'shield', definitionId: 'fixture.shield', ownerPlayerId: 'p2',
      controllerPlayerId: 'p2', zone: 'field', visibility: { scope: 'public' } });
    s.abilityRuntime!.cardState.shield = { active: true, faceDown: false, playedRound: 1, boardLocationId: 'miyama_town' };
    expect(activate(s).ok).toBe(true);
    expect(choose(s).ok).toBe(true);
    expect(at(s).zone).toBe('hand');
  });
  it('preserves the field in executable compilation without adding a production role', () => {
    const input = compileLoadedPlaytestPack(loadPlaytestContentPack('data/packs/fd-playtest-v1/pack.json',
      { workspaceRoot: process.cwd() })).library;
    input.rules.archives.push(archive() as unknown as (typeof input.rules.archives)[number]);
    const pack = compileExecutableCardPack(input);
    expect(pack.cards[targetId]!.zoneMoveReplacement).toEqual(replacement);
    expect(Object.values(pack.characters).filter(c => c.kind === 'servant')).toHaveLength(7);
  });
  it.each([
    null, true, [], { ...replacement, from: 'deck' },
    { ...replacement, replacementDestination: 'hand' }, { ...replacement, extra: true },
  ])('rejects malformed or broader replacement data %#', invalid => {
    const raw = archive();
    (raw.cards[1] as unknown as Record<string, unknown>).zoneMoveReplacement = invalid;
    expect(loadAuthoringJson(raw).report.some(r => r.path === 'zoneMoveReplacement')).toBe(true);
  });
});
