import {readFileSync} from 'node:fs';
import {expect, it} from 'vitest';
import {loadAuthoringJson} from '../../src/ability/loader';
import {initializeAbilityRuntime} from '../../src/ability/interpreter';
import {createMatchSession} from '../../src/match-session';
import {restoreTrustedAuthoringFixtureSession} from '../trusted-authoring-fixture';

const archive = JSON.parse(readFileSync('packages/rules/tests/fixtures/b-medea-ca6b4252.json','utf8'));
const sourceId = 'servant.medea.skill.sc-medea-2';
const source = archive.cards.find((card: {id: string}) => card.id === sourceId);
const workshop = source.abilities.find((ability: {id: string}) => ability.id.endsWith('.workshop-reward'));

function fixture(battleProbe = false) {
  const session = createMatchSession({seed: 20260907});
  const state = session.state;
  const canonical = state.abilityRuntime!.pack;
  // Source is already active. Isolate the unchanged triggered clause from its printed cost dependency.
  const ability = battleProbe ? {...workshop, id:'fixture.battle-loss-location',
    activation:{trigger:'after_controller_loses_battle',requiresSourceState:'active'},
    conditions:[{type:'event_location_is',locationId:'shinto'}], effects:[{type:'adjust_mana',amount:1}]} : workshop;
  const loaded = loadAuthoringJson({...archive, cards:[{...source, cardFace:{...source.cardFace,cost:0,basePower:1}, abilities:[ability]}]});
  expect(loaded.report).toEqual([]);
  delete state.abilityRuntime;
  initializeAbilityRuntime(state, {...canonical,cards:{...canonical.cards, ...loaded.cards}});
  state.cards.push({instanceId:'workshop-source',definitionId:sourceId,ownerPlayerId:'p1',controllerPlayerId:'p1',
    zone:'attack_area',visibility:{scope:'public'}});
  state.abilityRuntime!.cardState['workshop-source'] = {active:true,faceDown:false,playedRound:1};
  for(const player of state.players) delete player.locationId;
  state.round.activePhase = 'advance';
  return session;
}

it.each([['p1','magic_workshop',1,2],['p2','magic_workshop',0,0],['p1','miyama_town',0,0]] as const)(
  'uses the actual deployment controller and location (%s, %s)', (deployer,location,extraMana,extraVp) => {
    const session = restoreTrustedAuthoringFixtureSession(fixture().serializeSession());
    const state = session.state;
    const controller = state.players.find(player => player.id==='p1')!;
    const before = {mana:controller.mana,vp:controller.vp};
    state.round.prioritySeat = state.players.find(player => player.id===deployer)!.seat;
    const result = session.dispatchPlayerAction(deployer,{type:'deploy_player',locationId:location});
    expect(result.ok,JSON.stringify(result.rejection)).toBe(true);
    const settled = state.players.find(player=>player.id==='p1')!;
    const baseline = deployer==='p1' && location==='magic_workshop' ? 2 : 0;
    expect(settled.mana-before.mana).toBe(baseline+extraMana);
    expect(settled.vp-before.vp).toBe(extraVp);
  });

it('uses authoritative post-scoring battlefield location and validates signed queued restore', () => {
  const session = fixture(true);
  const state = session.state;
  const runtime = state.abilityRuntime!;
  const p1 = state.players[0]!, p2 = state.players[1]!;
  p1.locationId = p2.locationId = 'shinto';
  // Deterministic earlier play precondition; the battle result itself is produced by MatchSession.
  const other = Object.values(runtime.pack.cards).find(definition =>
    definition.cardType === 'basic_attack' && typeof definition.cardFace.basePower === 'number' && definition.cardFace.basePower > 1)!;
  expect(other).toBeDefined();
  state.cards.push({instanceId:'opposing-attack', definitionId:other.id, ownerPlayerId:'p2',controllerPlayerId:'p2',
    zone:'attack_area',visibility:{scope:'public'}});
  runtime.cardState['opposing-attack'] = {active:true,faceDown:false,playedRound:1};
  state.round.activePhase='battle';
  state.round.prioritySeat=p1.seat;
  state.eventPlacements=[]; state.currentSituationModifiers=[];
  const bridge = session as unknown as {flushPostScoringBattleEvents:()=>void};
  bridge.flushPostScoringBattleEvents=()=>{};
  for(let i=0;i<state.players.length && !session.state.abilityRuntime!.pendingPostBattleEvents?.length;i++){
    const result = session.passPriority(session.getClientProjection().priorityPlayerId);
    expect(result.ok,JSON.stringify(result.rejection)).toBe(true);
  }
  const queued = session.state.abilityRuntime!.pendingPostBattleEvents!;
  expect(queued.length).toBeGreaterThan(0);
  expect(queued.every(event => event.battlefieldId==='shinto' && event.locationId==='shinto')).toBe(true);
  const restored = restoreTrustedAuthoringFixtureSession(session.serializeSession());
  const manaBefore = restored.state.players[0]!.mana;
  expect(restored.state.abilityRuntime!.pendingPostBattleEvents).toEqual(queued);
  const historical = restoreTrustedAuthoringFixtureSession(session.serializeSession());
  for(const event of historical.state.abilityRuntime!.pendingPostBattleEvents!) delete event.locationId;
  const oldRestored = restoreTrustedAuthoringFixtureSession(historical.serializeSession());
  (oldRestored as unknown as typeof bridge).flushPostScoringBattleEvents();
  expect(oldRestored.state.players[0]!.mana).toBe(manaBefore+1);
  const corrupted = restoreTrustedAuthoringFixtureSession(session.serializeSession());
  corrupted.state.abilityRuntime!.pendingPostBattleEvents![0]!.locationId='miyama_town';
  expect(() => restoreTrustedAuthoringFixtureSession(corrupted.serializeSession())).toThrow();
  (restored as unknown as typeof bridge).flushPostScoringBattleEvents();
  expect(restored.state.players[0]!.mana).toBe(manaBefore+1);
});
