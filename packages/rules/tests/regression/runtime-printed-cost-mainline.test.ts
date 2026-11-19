import {readFileSync} from 'node:fs';
import {expect, it} from 'vitest';
import {compileLoadedPlaytestPack, loadPlaytestContentPack} from '@fd/content';
import {compileExecutableCardPack} from '../../src/ability/executable-card-pack';
import {loadAuthoringJson} from '../../src/ability/loader';
import {cardManaCost, initializeAbilityRuntime} from '../../src/ability/interpreter';
import {createMatchSession} from '../../src/match-session';

const archive = JSON.parse(readFileSync('packages/rules/tests/fixtures/b-kinggil-cannon-bc44a310.json', 'utf8'));
const constructionId = 'servant.kinggil.skill.sc-kinggil-1';

it.each([[1, 14], [6, 4], [8, 0], [10, 0]])('quotes, projects and pays the frozen Construction cost in round %i', (round, expected) => {
  const exact = {...archive, cards: archive.cards.filter((card: {id: string}) => card.id === constructionId)};
  const loaded = loadAuthoringJson(exact);
  expect(loaded.report).toEqual([]);
  const session = createMatchSession({seed: 20260907});
  const state = session.state;
  const canonical = state.abilityRuntime!.pack;
  delete state.abilityRuntime;
  initializeAbilityRuntime(state, {...canonical, cards: {...canonical.cards, ...loaded.cards}});
  state.cards = state.cards.filter(card => card.ownerPlayerId !== 'p1' || !['hand','skill','field','attack_area'].includes(card.zone));
  state.cards.push({instanceId:'construction', definitionId:constructionId, ownerPlayerId:'p1',
    controllerPlayerId:'p1', zone:'skill', visibility:{scope:'owner_only', ownerPlayerId:'p1'}});
  const player = state.players.find(player => player.id === 'p1')!;
  player.locationId = 'shinto';
  player.mana = 20;
  state.round.roundNumber = round;
  state.round.activePhase = 'action';
  state.round.prioritySeat = 1;
  expect(session.dispatchPlayerAction('p1', {type: 'skip_normal_move'}).ok).toBe(true);
  const before = session.getState();
  expect(cardManaCost(state, 'construction')).toBe(expected);
  expect(session.getPlayerView('p1').cards.find(card => card.instanceId === 'construction')?.currentManaCost).toBe(expected);
  expect(session.getState()).toEqual(before);
  const play = {type:'play_card', cardInstanceId:'construction', faceDown:false} as const;
  if (expected > 0) {
    state.players.find(player => player.id === 'p1')!.mana = expected - 1;
    const unpaid = session.getState();
    expect(session.dispatchPlayerAction('p1', play).ok).toBe(false);
    expect(session.getState()).toEqual(unpaid);
    state.players.find(player => player.id === 'p1')!.mana = 20;
  }
  const result = session.dispatchPlayerAction('p1', play);
  expect(result.ok, JSON.stringify(result.rejection)).toBe(true);
  expect(state.players.find(player => player.id === 'p1')!.mana).toBe(20 - expected);
  expect(state.abilityRuntime!.cardState.construction!.paidManaOnPlay).toBe(expected);
});

it('compiles unchanged Construction and Cannon together with the actual Kinggil deck', () => {
  const input = compileLoadedPlaytestPack(loadPlaytestContentPack('data/packs/fd-playtest-v1/pack.json', {
    workspaceRoot: process.cwd(),
  })).library;
  const kinggil = structuredClone(archive);
  // Treasury's separate candidate supplies its own reviewed consumer; this fixture verifies Construction and Cannon.
  kinggil.cards.find((card: {id: string}) => card.id.endsWith('sc-kinggil-2')).abilities = [];
  input.rules.archives.push(kinggil);
  const compiled = compileExecutableCardPack(input);
  expect(compiled.decks['servant.kinggil']).toHaveLength(12);
  expect(compiled.cards[constructionId]?.cardFace.cost).toMatchObject({formula: {op: 'add'}});
  expect(compiled.cards['servant.kinggil.skill.sc-kinggil-3']?.abilities).toHaveLength(2);
});

it.each([
  {op: 'const'},
  {op: 'count_cards', zone: 'hand'},
  {op: 'add', var: 'round.number', args: [2, 3]},
])('rejects unsupported or malformed printed cost expressions: %j', formula => {
  const input = structuredClone(archive);
  input.cards = input.cards.filter((card: {id: string}) => card.id === constructionId);
  input.cards[0].cardFace.cost.formula = formula;
  expect(loadAuthoringJson(input).report.some(issue => issue.path.startsWith('cardFace.cost'))).toBe(true);
});
