import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';
import { createMatchSession } from '../../src/match-session';
import { advanceAbilityPhase, initializeAbilityRuntime } from '../../src/ability/interpreter';
import { restoreTrustedAuthoringFixtureSession } from '../trusted-authoring-fixture';
import { compileLoadedPlaytestPack, loadPlaytestContentPack } from '@fd/content';
import { compileExecutableCardPack } from '../../src/ability/executable-card-pack';
import { loadAuthoringJson } from '../../src/ability/loader';

const frozen = JSON.parse(readFileSync('packages/rules/tests/fixtures/b-kinggil-cannon-bc44a310.json', 'utf8'));
const cannonId = 'servant.kinggil.skill.sc-kinggil-3';
const cannonArchive = {...frozen, cards: frozen.cards.filter((card: {id: string}) => card.id === cannonId)};

const constructionId = 'servant.kinggil.skill.sc-kinggil-1';

function setup(owner = 'p1', controller = 'p1') {
  const session = createMatchSession({seed: 20260907});
  const state = session.state;
  const candidate = loadAuthoringJson(cannonArchive);
  expect(candidate.report).toEqual([]);
  const pack = state.abilityRuntime!.pack;
  const constructionFixture = {...candidate.cards[cannonId]!, id: constructionId, abilities: [], playRequirements: []};
  delete state.abilityRuntime;
  initializeAbilityRuntime(state, {...pack, cards: {...pack.cards, ...candidate.cards, [constructionId]: constructionFixture}});
  state.cards = state.cards.filter(card => card.ownerPlayerId !== 'p1' || !['hand','skill','field','attack_area'].includes(card.zone));
  state.cards.push(
    {instanceId: 'cannon', definitionId: cannonId, ownerPlayerId: 'p1', controllerPlayerId: 'p1', zone: 'skill', visibility: {scope: 'owner_only', ownerPlayerId: 'p1'}},
    {instanceId: 'construction', definitionId: constructionId, ownerPlayerId: owner, controllerPlayerId: controller, zone: 'attack_area', visibility: {scope: 'public'}},
  );
  state.abilityRuntime!.cardState.construction = {active: true, faceDown: false, playedRound: 1};
  state.players.find(player => player.id === 'p1')!.mana = 15;
  state.players.find(player => player.id === 'p1')!.locationId = 'shinto';
  state.round.activePhase = 'action';
  state.round.prioritySeat = 1;
  expect(session.dispatchPlayerAction('p1', {type: 'skip_normal_move'}).ok).toBe(true);
  return session;
}

const playCannon = {type: 'play_card', cardInstanceId: 'cannon', faceDown: false} as const;
const hand = (session: ReturnType<typeof setup>) => session.state.cards.filter(card => card.ownerPlayerId === 'p1' && card.zone === 'hand');

describe("King's Cannon signed Runtime contract", () => {
  it('loads the exact paid-play prerequisite and next-round commitment', () => {
    const loaded = loadAuthoringJson(cannonArchive);
    expect(loaded.report).toEqual([]);
    expect(loaded.cards[cannonId]!.abilities).toHaveLength(2);
  });
  it('rejects a close prerequisite nested in a read-only condition', () => {
    const input = structuredClone(cannonArchive);
    const card = input.cards[0];
    const closeRequirement = card.playRequirements[1];
    card.playRequirements.push({type: 'not', condition: closeRequirement});
    const report = loadAuthoringJson(input).report;
    expect(report).toContainEqual(expect.objectContaining({reason: 'Invalid active-card close play requirement'}));
  });

  it('passes the real compiler for the unchanged Cannon skill', () => {
    const input = compileLoadedPlaytestPack(loadPlaytestContentPack('data/packs/fd-playtest-v1/pack.json', {
      workspaceRoot: process.cwd(),
    })).library;
    const exactSkill = cannonArchive.cards[0];
    // Both companion definitions are fixture-only; the Cannon skill itself is unchanged.
    const companions = [1, 2].map(index => ({
      ...exactSkill, id: index === 1 ? constructionId : 'servant.kinggil.skill.sc-kinggil-2',
      name: `Fixture companion ${index}`, playRequirements: [], abilities: [],
    }));
    input.rules.archives = input.rules.archives.filter(archive => archive.id !== 'servant.kinggil');
    input.rules.archives.push({...cannonArchive, cards: [exactSkill, ...companions]});
    const compiled = compileExecutableCardPack(input);
    expect(compiled.cards[cannonId]!.abilities).toHaveLength(2);
    companions[0]!.id = 'servant.kinggil.fixture-missing-construction';
    expect(() => compileExecutableCardPack(input)).toThrow(constructionId);
  });

  it('pays and closes a controlled active prerequisite, including a borrowed one', () => {
    const session = setup('p2', 'p1');
    const before = session.getState();
    session.getPlayerView('p1');
    expect(session.getState()).toEqual(before);
    const result = session.dispatchPlayerAction('p1', playCannon);
    expect(result.ok, JSON.stringify(result.rejection)).toBe(true);
    expect(session.state.players.find(player => player.id === 'p1')!.mana).toBe(11);
    expect(session.state.cards.find(card => card.instanceId === 'construction')).toMatchObject({zone: 'skill', controllerPlayerId: 'p2'});
    expect(session.state.abilityRuntime!.roundPlayBonuses).toEqual([
      expect.objectContaining({beneficiaryId: 'p1', dueRound: 2, drawn: false}),
    ]);
    const after = session.getState();
    expect(session.dispatchPlayerAction('p1', playCannon).ok).toBe(false);
    expect(session.getState()).toEqual(after);
  });

  it('rejects a missing-control or unaffordable play without changing state', () => {
    const unowned = setup('p1', 'p2');
    const unpaid = setup();
    unpaid.state.players.find(player => player.id === 'p1')!.mana = 3;
    for (const session of [unowned, unpaid]) {
      const before = session.getState();
      expect(session.dispatchPlayerAction('p1', playCannon).ok).toBe(false);
      expect(session.getState()).toEqual(before);
    }
  });

  it('draws after normal preparation once, including after signed restore', () => {
    let session = setup();
    expect(session.dispatchPlayerAction('p1', playCannon).ok).toBe(true);
    expect(hand(session)).toHaveLength(0);
    session = restoreTrustedAuthoringFixtureSession(session.serializeSession());
    const carrier = session.state as unknown as {modeState: Record<string, unknown>};
    delete carrier.modeState.roundOpening;
    delete carrier.modeState.matchReveal;
    session['startRound'](2, session.state, 1);
    expect(hand(session)).toHaveLength(5);
    expect(session.state.abilityRuntime!.roundPlayBonuses).toEqual([expect.objectContaining({dueRound: 2, drawn: true})]);
    session = restoreTrustedAuthoringFixtureSession(session.serializeSession());
    const before = hand(session).map(card => card.instanceId);
    if (session.state.round.activePhase === 'round_start') session['startRound'](2, session.state, 1);
    expect(hand(session).map(card => card.instanceId)).toEqual(before);
    advanceAbilityPhase(session.state, 'action', 2);
    expect(session.state.abilityRuntime!.roundPlayBonuses![0]!.drawn).toBe(true);
  });
  it.each([2, 3])('allows a regular batch of %i cards when the bonus is available', count => {
    const session = setup();
    expect(session.dispatchPlayerAction('p1', playCannon).ok).toBe(true);
    const carrier = session.state as unknown as {modeState: Record<string, unknown>};
    delete carrier.modeState.roundOpening;
    delete carrier.modeState.matchReveal;
    session['startRound'](2, session.state, 1);
    delete carrier.modeState.matchReveal;
    session.state.abilityRuntime!.pendingDecision = undefined;
    session.state.abilityRuntime!.responseWindows = [];
    advanceAbilityPhase(session.state, 'action', 2);
    session.state.round.prioritySeat = 1;
    session.state.players.find(player => player.id === 'p1')!.locationId = 'shinto';
    expect(session.dispatchPlayerAction('p1', {type: 'skip_normal_move'}).ok).toBe(true);
    const staged = [];
    for (let index = 0; index < count; index++) {
      const action = session.getPlayerView('p1').legalActions.find(entry => entry.type === 'stage_attack_card' && !entry.faceDown);
      expect(action).toBeDefined();
      expect(session.dispatchPlayerAction('p1', action!).ok).toBe(true);
      staged.push(action);
    }
    expect(new Set(staged.map(action => action!.cardInstanceId)).size).toBe(count);
    expect(session.dispatchPlayerAction('p1', {type: 'confirm_staged_attack'}).ok).toBe(true);
    expect(session.state.abilityRuntime!.playCounters!.attacksDeclaredByPlayer.p1).toBe(count);
  });

  it('skips a late commitment and expires the unused allowance', () => {
    const session = setup();
    expect(session.dispatchPlayerAction('p1', playCannon).ok).toBe(true);
    const carrier = session.state as unknown as {modeState: Record<string, unknown>};
    delete carrier.modeState.roundOpening;
    delete carrier.modeState.matchReveal;
    session['startRound'](3, session.state, 1);
    expect(hand(session)).toHaveLength(3);
    expect(session.state.abilityRuntime!.roundPlayBonuses).toEqual([]);
  });
});
