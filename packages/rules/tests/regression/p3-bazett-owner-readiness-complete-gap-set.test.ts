import { describe, expect, it } from 'vitest';
import { createSeededGameState } from '../../src/tools/seeded-state';
import { loadAuthoringJson } from '../../src/ability/loader';
import {
  executeAbility,
  initializeAbilityRuntime,
  isDeferredAbilityRuntimeProvenanceValidForRestore,
  playAbilityCardBatch,
  processAbilityEvent,
} from '../../src/ability/interpreter';
import {
  logicalDayCycleAwake,
  logicalDayCycleMatches,
  logicalDayDefinitionPerGamePlayLimitIgnored,
  logicalDayDefinitionPlayRequirementWaived,
  sourceBoundDefinitionResidualGranted,
} from '../../src/ability/logical-day-countermeasure-capability';
import type { GameState } from '../../src/schema/game';

const ROOT = 'master.fixture-logical-day';
const CYCLE = 'fixture.logical-day';
const TRACK = `${ROOT}.tracker`;
const RESET = `${ROOT}.reset`;
const DAY4 = `${ROOT}.day4`;
const DAY3 = `${ROOT}.day3`;
const COUNTER = `${ROOT}.counter`;
const ASC = `${ROOT}.ascension`;
const AWAKE = `${ROOT}.awake`;
const OPP_NP = 'servant.fixture-opponent.skill.np';

const INIT = 'fixture.logical-day.init';
const ADVANCE = 'fixture.logical-day.advance';
const SCHEDULE = 'fixture.logical-day.schedule-reset';
const RESETTER = 'fixture.logical-day.resolve-reset';
const AWAKEN = 'fixture.logical-day.awaken';
const DAY2_OVERRIDE = 'fixture.logical-day.day2-override';
const ASC_OVERRIDE = 'fixture.logical-day.ascension-override';
const ARM = 'fixture.logical-day.arm-counter';
const AWAKE_SETTLE = 'fixture.logical-day.awake-settle';
const JOIN = 'fixture.logical-day.join-zero';
const LIMIT = 'fixture.logical-day.counter-limit';
const CLIMAX_REWARD = 'fixture.logical-day.climax-reward';
const OPP_ABILITY = 'fixture.opponent-np.action';

function base(id: string, kind = 'passive') {
  return {
    id, kind, printedClause: id, activation: {}, conditions: [], targets: [], effects: [], cost: [], ruleModifiers: [], creates: [],
    lifecycle: {}, responseWindow: { order: 'turn_order', passBehavior: 'decline_this_window' }, limit: {}, visibility: {},
    execution: { mode: 'automatic', allowedOperations: [] },
  } as any;
}
function forced(id: string, trigger: string, effect: any, conditions: any[] = []) {
  const ability = base(id, 'forced_trigger');
  ability.activation = { trigger }; ability.conditions = conditions; ability.effects = [effect];
  return ability;
}
function marker(id: string, effect: any) { const ability = base(id); ability.effects = [effect]; return ability; }
function phaseAction(id: string, effect: any) {
  const ability = base(id, 'phase_action'); ability.activation = { phase: 'action', opens: 'controller_action_window' }; ability.effects = [effect]; return ability;
}
function card(id: string, abilities: any[], opts: { attributes?: string[]; cost?: number; requirements?: any[] } = {}) {
  return {
    id, name: id, cardType: 'master_skill', owner: { type: 'master', id: ROOT },
    cardFace: { attributes: opts.attributes ?? [], cost: opts.cost ?? 0, basePower: 0 },
    playTiming: { phase: 'action', window: 'controller_play_card_window' }, playRequirements: opts.requirements ?? [],
    abilities, verification: { implementationStatus: 'complete' },
  };
}
function archive() {
  const init = forced(INIT, 'game_start', {
    type: 'logical_day_cycle_initialize', cycleKey: CYCLE, initialDay: 1, maxDay: 4,
    stageDefinitionId: DAY3, stageDay: 3, awakenDefinitionId: AWAKE,
  });
  const advance = forced(ADVANCE, 'round_end', { type: 'logical_day_cycle_advance', cycleKey: CYCLE });
  const schedule = forced(SCHEDULE, 'after_controller_loses_battle', { type: 'logical_day_cycle_schedule_reset', cycleKey: CYCLE });
  const reset = forced(RESETTER, 'round_start', { type: 'logical_day_cycle_resolve_reset', cycleKey: CYCLE, rewardVp: 1, closeDefinitionId: COUNTER });
  const awaken = forced(AWAKEN, 'after_controller_wins_battle', { type: 'logical_day_cycle_awaken', cycleKey: CYCLE, day: 4 });
  const day2 = marker(DAY2_OVERRIDE, {
    type: 'logical_day_definition_play_override', cycleKey: CYCLE, day: 2, targetDefinitionId: COUNTER,
    requirementType: 'skill_zone_mana_at_least', requirementValue: 8, ignorePerGamePlayLimit: true,
  });
  const asc = marker(ASC_OVERRIDE, {
    type: 'source_bound_definition_persistence_override', targetDefinitionId: COUNTER, ignorePerGamePlayLimit: true, grantResidual: true,
  });
  const arm = forced(ARM, 'on_card_played', { type: 'arm_next_opponent_attribute_use_defeat', attribute: '宝具', requireSameLocation: true },
    [{ type: 'source_active' }, { type: 'event_source_card_is_source' }]);
  const limiter = base(LIMIT); limiter.limit = { type: 'per_game', scope: 'this_card', uses: 1 };
  const awake = forced(AWAKE_SETTLE, 'after_logical_day_cycle_awakened', {
    type: 'restore_command_seals_return_definition_to_skill', cycleKey: CYCLE, definitionId: COUNTER, commandSeals: 3,
  });
  const join = phaseAction(JOIN, { type: 'join_source_skill_card_to_attack_zero_cost', cycleKey: CYCLE, day: 3 });
  const climaxReward = forced(CLIMAX_REWARD, 'after_controller_wins_battle', { type: 'adjust_victory_points', amount: 2 },
    [{ type: 'logical_day_is', cycleKey: CYCLE, day: 2 }, { type: 'round_is_climax' }]);
  const opponentAbility = phaseAction(OPP_ABILITY, { type: 'adjust_mana', amount: 0 });
  return {
    schemaVersion: 'fd-card-authoring-v1', id: ROOT,
    cards: [
      card(TRACK, [init, advance, schedule, day2, climaxReward]),
      card(RESET, [reset]),
      card(DAY4, [awaken]),
      card(DAY3, [join]),
      card(COUNTER, [arm, limiter], { attributes: ['宝具'], cost: 2, requirements: [{ type: 'skill_zone_mana_at_least', value: 8 }] }),
      card(ASC, [asc]),
      card(AWAKE, [awake]),
      card(OPP_NP, [opponentAbility], { attributes: ['宝具'] }),
    ],
  } as any;
}
function add(state: GameState, definitionId: string, owner = 'p1', zone = 'skill', active = false) {
  const instanceId = `${definitionId}:${owner}:${state.cards.length}`;
  state.cards.push({
    instanceId, definitionId, ownerPlayerId: owner, controllerPlayerId: owner, zone,
    visibility: ['field', 'attack_area'].includes(zone) ? { scope: 'public' } : { scope: 'owner_only', ownerPlayerId: owner },
  } as any);
  state.abilityRuntime!.cardState[instanceId] = { active, faceDown: false, playedRound: state.round.roundNumber };
  return instanceId;
}
function setup() {
  const pack = loadAuthoringJson(archive());
  expect(pack.report.filter((entry) => entry.status === 'unsupported')).toEqual([]);
  const state = createSeededGameState({ activeSeats: [1, 2, 3] });
  state.cards = [];
  initializeAbilityRuntime(state, pack, { seed: 20261005 });
  const p1 = state.players[0]!; const p2 = state.players[1]!;
  p1.masterCardId = ROOT; p1.mana = 20; p1.vp = 0; p1.locationId = 'miyama_town'; (p1 as any).commandSpells = 1;
  p2.locationId = 'miyama_town';
  const ids = {
    track: add(state, TRACK), reset: add(state, RESET), day4: add(state, DAY4), counter: add(state, COUNTER),
    asc: add(state, ASC), opponentNp: add(state, OPP_NP, 'p2', 'skill'),
  };
  processAbilityEvent(state, { id: 'fixture-game-start', type: 'game_start', playerId: 'p1' });
  return { state, pack, ids };
}
function exec(state: GameState, sourceCardId: string, abilityId: string, controllerId = 'p1', event?: any) {
  executeAbility(state, { controllerId, sourceCardId, abilityId, variables: {}, selections: {}, ...(event ? { event } : {}) });
}
function roundEnd(state: GameState, id: string) { processAbilityEvent(state, { id, type: 'round_end', playerId: 'p1' }); }
function win(state: GameState, id: string) {
  processAbilityEvent(state, { id, type: 'after_controller_wins_battle', playerId: 'p1', battleResult: { winners: ['p1'], loserIds: ['p2'] } });
}
function loss(state: GameState, id: string) {
  processAbilityEvent(state, { id, type: 'after_controller_loses_battle', playerId: 'p1', battleResult: { winners: ['p2'], loserIds: ['p1'] } });
}

describe('P3 Bazett owner-readiness complete identity-free gap set', () => {
  it('accepts every exact readiness shape and fails closed when a privileged cycle shape is widened', () => {
    const good = loadAuthoringJson(archive());
    expect(good.report.filter((entry) => entry.status === 'unsupported')).toEqual([]);
    const bad = archive();
    bad.cards[0].abilities.find((ability: any) => ability.id === INIT).effects[0].maxDay = 5;
    const loaded = loadAuthoringJson(bad);
    expect(loaded.cards[TRACK]!.abilities.find((ability) => ability.id === INIT)!.execution.mode).toBe('unsupported');
    expect(loaded.report.some((entry) => entry.reason.includes('Logical-day/countermeasure'))).toBe(true);
  });

  it('runs Day1→Day2→Day3, provisions the Day3 skill, and blocks ordinary play of its activation-only route', () => {
    const { state } = setup();
    expect(logicalDayCycleMatches(state, 'p1', CYCLE, 1)).toBe(true);
    roundEnd(state, 'round-end-1');
    expect(logicalDayCycleMatches(state, 'p1', CYCLE, 2)).toBe(true);
    roundEnd(state, 'round-end-2');
    expect(logicalDayCycleMatches(state, 'p1', CYCLE, 3)).toBe(true);
    const staged = state.cards.find((entry) => entry.ownerPlayerId === 'p1' && entry.definitionId === DAY3 && entry.zone === 'skill');
    expect(staged).toBeTruthy();
    state.round.activePhase = 'action'; state.round.prioritySeat = state.players[0]!.seat;
    expect(() => playAbilityCardBatch(state, 'p1', [{ cardInstanceId: staged!.instanceId }])).toThrow(/Card cannot be played/);
    exec(state, staged!.instanceId, JOIN);
    expect(state.cards.find((entry) => entry.instanceId === staged!.instanceId)).toMatchObject({ zone: 'attack_area' });
    expect(state.abilityRuntime!.cardState[staged!.instanceId]).toMatchObject({ active: true, faceDown: false, paidManaOnPlay: 0 });
  });

  it('restages the same Day3 physical from discard on the second Lost-in-Time cycle', () => {
    const { state } = setup();
    roundEnd(state, 'cycle1-to-day2');
    roundEnd(state, 'cycle1-to-day3');
    const first = state.cards.find((entry) => entry.ownerPlayerId === 'p1' && entry.definitionId === DAY3 && entry.zone === 'skill');
    expect(first).toBeTruthy();
    exec(state, first!.instanceId, JOIN);
    expect(state.cards.find((entry) => entry.instanceId === first!.instanceId)!.zone).toBe('attack_area');

    const used = state.cards.find((entry) => entry.instanceId === first!.instanceId)!;
    used.zone = 'discard';
    used.controllerPlayerId = 'p1';
    used.visibility = { scope: 'public' };
    state.abilityRuntime!.cardState[used.instanceId]!.active = false;

    roundEnd(state, 'cycle1-to-day4');
    loss(state, 'cycle1-day4-loss');
    state.round.roundNumber += 1;
    processAbilityEvent(state, { id: 'cycle1-reset-start', type: 'round_start', playerId: 'p1' });
    expect(logicalDayCycleMatches(state, 'p1', CYCLE, 1)).toBe(true);

    roundEnd(state, 'cycle2-to-day2');
    roundEnd(state, 'cycle2-to-day3');
    expect(logicalDayCycleMatches(state, 'p1', CYCLE, 3)).toBe(true);
    const restaged = state.cards.find((entry) => entry.instanceId === first!.instanceId)!;
    expect(restaged).toMatchObject({ zone: 'skill', controllerPlayerId: 'p1', generatedBy: state.cards.find((entry) => entry.definitionId === TRACK)!.instanceId });
    expect(state.cards.filter((entry) => entry.ownerPlayerId === 'p1' && entry.definitionId === DAY3 && entry.zone !== 'removed_from_game')).toHaveLength(1);
    expect(state.abilityRuntime!.cardState[restaged.instanceId]).toMatchObject({ active: false, faceDown: false, playedRound: state.round.roundNumber });
  });

  it('fails closed if an existing staged definition has foreign provenance or a live non-discard zone', () => {
    const foreign = setup();
    roundEnd(foreign.state, 'foreign-to-day2');
    const fakeId = add(foreign.state, DAY3, 'p1', 'discard');
    foreign.state.cards.find((entry) => entry.instanceId === fakeId)!.generatedBy = 'forged-provider';
    expect(() => roundEnd(foreign.state, 'foreign-to-day3')).toThrow(/LOGICAL_DAY_STAGE_PROVENANCE_INVALID/);

    const live = setup();
    roundEnd(live.state, 'live-to-day2');
    const liveId = add(live.state, DAY3, 'p1', 'field', true);
    live.state.cards.find((entry) => entry.instanceId === liveId)!.generatedBy = live.ids.track;
    expect(() => roundEnd(live.state, 'live-to-day3')).toThrow(/LOGICAL_DAY_STAGE_ZONE_INVALID/);
  });

  it('schedules loss reset for the next round, returns to Day1, gains exactly 1 VP, and closes the configured counter definition', () => {
    const { state, ids } = setup();
    roundEnd(state, 'to-day2'); roundEnd(state, 'to-day3');
    const counter = state.cards.find((entry) => entry.instanceId === ids.counter)!;
    counter.zone = 'field'; counter.visibility = { scope: 'public' }; state.abilityRuntime!.cardState[ids.counter] = { active: true, faceDown: false, playedRound: state.round.roundNumber };
    loss(state, 'lost-day3');
    expect(logicalDayCycleMatches(state, 'p1', CYCLE, 3)).toBe(true);
    state.round.roundNumber += 1;
    processAbilityEvent(state, { id: 'next-round-start', type: 'round_start', playerId: 'p1' });
    expect(logicalDayCycleMatches(state, 'p1', CYCLE, 1)).toBe(true);
    expect(state.players[0]!.vp).toBe(1);
    expect(state.cards.find((entry) => entry.instanceId === ids.counter)).toMatchObject({ zone: 'skill', controllerPlayerId: 'p1' });
    expect(state.abilityRuntime!.cardState[ids.counter]!.active).toBe(false);
  });

  it('awakens only on a Day4 win, restores all normal command seals, returns the owned counter, and stops further day advancement', () => {
    const { state, ids } = setup();
    roundEnd(state, 'd2'); roundEnd(state, 'd3'); roundEnd(state, 'd4');
    expect(logicalDayCycleMatches(state, 'p1', CYCLE, 4)).toBe(true);
    const counter = state.cards.find((entry) => entry.instanceId === ids.counter)!;
    counter.zone = 'field'; counter.visibility = { scope: 'public' }; state.abilityRuntime!.cardState[ids.counter] = { active: true, faceDown: false, playedRound: state.round.roundNumber };
    win(state, 'day4-win');
    expect(logicalDayCycleAwake(state, 'p1', CYCLE)).toBe(true);
    expect((state.players[0] as any).commandSpells).toBe(3);
    expect(state.cards.find((entry) => entry.instanceId === ids.counter)).toMatchObject({ zone: 'skill', controllerPlayerId: 'p1' });
    expect(state.cards.some((entry) => entry.ownerPlayerId === 'p1' && entry.definitionId === AWAKE && entry.zone === 'skill')).toBe(true);
    roundEnd(state, 'awake-round-end');
    expect(logicalDayCycleAwake(state, 'p1', CYCLE)).toBe(true);
    expect(state.ruleOverrides!.logicalDayByPlayer!.p1).toBe(4);
  });

  it('waives only the exact Day2 mana requirement and per-game play limit while preserving printed mana cost', () => {
    const { state, ids } = setup();
    expect(logicalDayDefinitionPlayRequirementWaived(state, 'p1', COUNTER, 'skill_zone_mana_at_least', 8)).toBe(false);
    roundEnd(state, 'to-day2');
    expect(logicalDayDefinitionPlayRequirementWaived(state, 'p1', COUNTER, 'skill_zone_mana_at_least', 8)).toBe(true);
    expect(logicalDayDefinitionPerGamePlayLimitIgnored(state, 'p1', COUNTER)).toBe(true);
    state.round.activePhase = 'action'; state.round.prioritySeat = state.players[0]!.seat; state.players[0]!.mana = 2;
    state.abilityRuntime!.abilityUsage[`play:${ids.counter}:${LIMIT}`] = 1;
    playAbilityCardBatch(state, 'p1', [{ cardInstanceId: ids.counter }]);
    expect(state.players[0]!.mana).toBe(0);
    expect(state.cards.find((entry) => entry.instanceId === ids.counter)!.zone).toBe('field');
  });

  it('keeps the source-bound persistence override live only while its exact provider remains owned and present', () => {
    const { state, ids } = setup();
    expect(logicalDayDefinitionPerGamePlayLimitIgnored(state, 'p1', COUNTER)).toBe(true);
    expect(sourceBoundDefinitionResidualGranted(state, 'p1', COUNTER)).toBe(true);
    state.cards.find((entry) => entry.instanceId === ids.asc)!.zone = 'removed_from_game';
    expect(logicalDayDefinitionPerGamePlayLimitIgnored(state, 'p1', COUNTER)).toBe(false);
    expect(sourceBoundDefinitionResidualGranted(state, 'p1', COUNTER)).toBe(false);
  });

  it('arms on the exact active source play, ignores off-location/non-matching use, then defeats exactly the next same-location opponent Noble-Phantasm ability use once', () => {
    const { state, ids } = setup();
    const counter = state.cards.find((entry) => entry.instanceId === ids.counter)!;
    counter.zone = 'field'; counter.visibility = { scope: 'public' }; state.abilityRuntime!.cardState[ids.counter] = { active: true, faceDown: false, playedRound: 1 };
    processAbilityEvent(state, { id: 'counter-play', type: 'on_card_played', playerId: 'p1', sourceCardId: ids.counter,
      playedCards: [{ instanceId: ids.counter, controllerId: 'p1', cardType: 'master_skill', faceDown: false }] });
    const ordinary = add(state, `${ROOT}.ordinary-opponent`, 'p2', 'field', true);
    state.abilityRuntime!.pack.cards[`${ROOT}.ordinary-opponent`] = { ...state.abilityRuntime!.pack.cards[OPP_NP]!, id: `${ROOT}.ordinary-opponent`, cardFace: { attributes: [], cost: 0, basePower: 0 } } as any;
    processAbilityEvent(state, { id: 'ordinary-use', type: 'on_ability_used', playerId: 'p2', sourceCardId: ordinary, abilityId: 'ordinary' });
    expect(state.abilityRuntime!.events.filter((entry) => entry.type === 'player_defeated_by_effect')).toHaveLength(0);
    state.players[1]!.locationId = 'shinto';
    processAbilityEvent(state, { id: 'np-away', type: 'on_ability_used', playerId: 'p2', sourceCardId: ids.opponentNp, abilityId: OPP_ABILITY });
    expect(state.abilityRuntime!.events.filter((entry) => entry.type === 'player_defeated_by_effect')).toHaveLength(0);
    state.players[1]!.locationId = 'miyama_town';
    processAbilityEvent(state, { id: 'np-hit', type: 'on_ability_used', playerId: 'p2', sourceCardId: ids.opponentNp, abilityId: OPP_ABILITY });
    expect(state.abilityRuntime!.events.filter((entry) => entry.type === 'player_defeated_by_effect')).toHaveLength(1);
    expect(state.abilityRuntime!.events.find((entry) => entry.type === 'player_defeated_by_effect')).toMatchObject({ playerId: 'p2', controllerId: 'p1', sourceCardId: ids.counter });
    expect(state.cards.find((entry) => entry.instanceId === ids.counter)!.zone).toBe('skill');
    processAbilityEvent(state, { id: 'np-second', type: 'on_ability_used', playerId: 'p2', sourceCardId: ids.opponentNp, abilityId: OPP_ABILITY });
    expect(state.abilityRuntime!.events.filter((entry) => entry.type === 'player_defeated_by_effect')).toHaveLength(1);
  });

  it('emits the trusted ability-use semantic from a real opponent phase action so the armed counter observes card-or-ability use, not only card play', () => {
    const { state, ids } = setup();
    const counter = state.cards.find((entry) => entry.instanceId === ids.counter)!;
    counter.zone = 'field'; counter.visibility = { scope: 'public' }; state.abilityRuntime!.cardState[ids.counter] = { active: true, faceDown: false, playedRound: 1 };
    processAbilityEvent(state, { id: 'counter-play-real', type: 'on_card_played', playerId: 'p1', sourceCardId: ids.counter,
      playedCards: [{ instanceId: ids.counter, controllerId: 'p1', cardType: 'master_skill', faceDown: false }] });
    state.cards.find((entry) => entry.instanceId === ids.opponentNp)!.zone = 'field';
    state.abilityRuntime!.cardState[ids.opponentNp] = { active: true, faceDown: false, playedRound: 1 };
    exec(state, ids.opponentNp, OPP_ABILITY, 'p2');
    expect(state.abilityRuntime!.events.some((entry) => entry.type === 'player_defeated_by_effect' && entry.playerId === 'p2')).toBe(true);
  });

  it('evaluates the new logical-day and climax conditions without broadening ordinary trigger semantics', () => {
    const { state } = setup();
    roundEnd(state, 'climax-to-day2');
    (state as any).modeState = { ...((state as any).modeState ?? {}), currentSituationIsClimax: false };
    win(state, 'day2-regular-win');
    expect(state.players[0]!.vp).toBe(0);
    (state as any).modeState.currentSituationIsClimax = true;
    win(state, 'day2-climax-win');
    expect(state.players[0]!.vp).toBe(2);
  });

  it('rejects forged restored cycle provider and armed-counter provenance', () => {
    const { state, ids } = setup();
    expect(isDeferredAbilityRuntimeProvenanceValidForRestore(state)).toBe(true);
    const forgedProvider = structuredClone(state);
    forgedProvider.abilityRuntime!.structuredPlayerFlagsByPlayer!.p1![`__fd_logical_day_cycle:${CYCLE}:providerSource`] = 'forged-source';
    expect(isDeferredAbilityRuntimeProvenanceValidForRestore(forgedProvider)).toBe(false);

    const counter = state.cards.find((entry) => entry.instanceId === ids.counter)!;
    counter.zone = 'field'; counter.visibility = { scope: 'public' }; state.abilityRuntime!.cardState[ids.counter] = { active: true, faceDown: false, playedRound: 1 };
    processAbilityEvent(state, { id: 'counter-play-restore', type: 'on_card_played', playerId: 'p1', sourceCardId: ids.counter,
      playedCards: [{ instanceId: ids.counter, controllerId: 'p1', cardType: 'master_skill', faceDown: false }] });
    expect(isDeferredAbilityRuntimeProvenanceValidForRestore(state)).toBe(true);
    const forgedArm = structuredClone(state);
    const bag = forgedArm.abilityRuntime!.structuredPlayerFlagsByPlayer!.p1!;
    const armKey = Object.keys(bag).find((entry) => entry.startsWith('__fd_armed_attribute_use:'))!;
    bag[armKey] = JSON.stringify({ sourceCardId: ids.counter, abilityId: 'forged-ability', attribute: '宝具' });
    expect(isDeferredAbilityRuntimeProvenanceValidForRestore(forgedArm)).toBe(false);
  });

  it('keeps the production readiness capability identity-free', () => {
    const fs = require('node:fs');
    const source = fs.readFileSync('packages/rules/src/ability/logical-day-countermeasure-capability.ts', 'utf8');
    for (const needle of ['master.bazett', 'bazett', '巴泽特', 'Fragarach', '斩击战神之剑']) expect(source).not.toContain(needle);
  });
});
