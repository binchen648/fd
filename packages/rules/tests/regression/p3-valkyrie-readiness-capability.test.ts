import { describe, expect, it } from 'vitest';
import { createSeededGameState } from '../../src/tools/seeded-state';
import { loadAuthoringJson } from '../../src/ability/loader';
import { dispatchAbilityCommand, getLegalActions, initializeAbilityRuntime, isCanonicalGenericPendingDecisionForRestore } from '../../src/ability/interpreter';
import type { GameState } from '../../src/schema/game';

const ROOT = 'servant.fixture-commander-lifecycle';
const SOURCE = `${ROOT}.skill.source`;
const DESCENT = 'fixture.definition-set-relocation';
const MOVE_ACTION = 'fixture.forward-action';
const MOVE_COMBAT = 'fixture.forward-combat';
const SHIELD = 'fixture.recall-and-join';
const RETRIGGER = 'fixture.retrigger-definition-set';
const IDS = ['fixture.commander.a', 'fixture.commander.b', 'fixture.commander.c'] as const;

function baseAbility(id: string, kind: 'phase_action' | 'forced_trigger' = 'phase_action') {
  return { id, kind, printedClause: id, activation: {}, conditions: [], targets: [], effects: [], cost: [], ruleModifiers: [], creates: [],
    lifecycle: {}, responseWindow: { order: 'turn_order', passBehavior: 'decline_this_window' }, limit: {}, visibility: {},
    execution: { mode: 'automatic', allowedOperations: [] } } as any;
}
function archive() {
  const descent = baseAbility(DESCENT);
  descent.activation = { phase: 'advance', opens: 'controller_action_window' };
  descent.conditions = [{ type: 'source_owned' }];
  descent.targets = [{ id: 'definition_destinations', type: 'choice', visibility: 'owner_only', count: { min: 3, max: 3 }, options: IDS.flatMap((id) => [
    { id: `${id}::hand`, label: `${id} hand` }, { id: `${id}::attack_area`, label: `${id} attack` },
  ]) }];
  descent.effects = [{ type: 'relocate_definition_set_without_play_triggers', target: 'definition_destinations', definitionIds: [...IDS] }];
  descent.limit = { type: 'per_game', uses: 1, scope: 'this_card' };
  descent.visibility = { revealsTrueName: true, revealTiming: 'on_use_declared', revealScope: 'servant_package' };

  const move = (id: string, phase: 'action' | 'combat') => {
    const a = baseAbility(id); a.activation = { phase, opens: phase === 'action' ? 'controller_action_window' : 'controller_combat_action_window', requiresSourceState: 'active' };
    a.targets = [{ id: 'destination', type: 'location', scope: { board: 'current' }, count: { min: 1, max: 1 }, required: true,
      constraints: [{ type: 'reachable_along_arrows', from: 'controller.currentLocation', maxSteps: 1 }], visibility: 'public' }];
    a.effects = [{ type: 'move_player', player: 'controller', to: 'destination' }]; return a;
  };

  const shield = baseAbility(SHIELD); shield.activation = { phase: 'combat', opens: 'controller_combat_action_window' };
  shield.conditions = [{ type: 'source_owned' }];
  shield.targets = [{ id: 'active_definition_card', type: 'card_instance', scope: { zone: 'attack_area', controller: 'self', owner: 'controller' },
    count: { min: 1, max: 1 }, visibility: 'public', constraints: [{ type: 'or', conditions: IDS.map((cardId) => ({ type: 'has_card_id', cardId })) }] }];
  shield.effects = [{ type: 'pay_source_current_cost_recall_active_definition_and_join_source', target: 'active_definition_card', definitionIds: [...IDS], sourceZone: 'skill', destinationZone: 'attack_area' }];

  const retrigger = baseAbility(RETRIGGER); retrigger.activation = { phase: 'action', opens: 'controller_action_window' };
  retrigger.conditions = [{ type: 'source_owned' }, { type: 'card_count_at_least', target: 'controller', zone: 'attack', activeOnly: true, face: 'up', definitionIds: [...IDS], value: 1 }];
  retrigger.effects = [{ type: 'retrigger_card_play_effects', definitionIds: [...IDS] }];
  retrigger.visibility = { revealsTrueName: true, revealTiming: 'on_use_declared', revealScope: 'servant_package' };

  return { schemaVersion: 'fd-card-authoring-v1', id: ROOT, cards: [{ id: SOURCE, name: SOURCE, cardType: 'servant_skill', owner: { type: 'servant', id: ROOT },
    cardFace: { attributes: ['宝具'], cost: 2, basePower: 1 }, playTiming: { phase: 'action', window: 'controller_play_card_window' }, playRequirements: [],
    abilities: [descent, move(MOVE_ACTION, 'action'), move(MOVE_COMBAT, 'combat'), shield, retrigger], verification: { implementationStatus: 'complete' } }] } as any;
}
function addCommanderDefinitions(state: GameState) {
  for (const [index, id] of IDS.entries()) {
    state.abilityRuntime!.pack.cards[id] = { id, name: id, cardType: 'servant_attack', cardFace: { attributes: ['特殊'], cost: 0, basePower: 1 },
      playTiming: { phase: 'action', window: 'controller_play_card_window' }, playRequirements: [], playKind: 'attack', destinationZone: 'attack_area',
      abilities: [{ ...baseAbility(`${id}.on-play`, 'forced_trigger'), activation: { trigger: 'on_card_played' }, effects: [{ type: 'adjust_mana', player: 'controller', amount: index + 1 }] }], mode: 'automatic' } as any;
  }
}
function addPhysical(state: GameState, definitionId: string, zone: string, active = false, faceDown = false) {
  const instanceId = `${definitionId}:${state.cards.length}`;
  state.cards.push({ instanceId, definitionId, ownerPlayerId: 'p1', controllerPlayerId: 'p1', zone, visibility: zone === 'attack_area' ? { scope: 'public' } : { scope: 'owner_only', ownerPlayerId: 'p1' } });
  state.abilityRuntime!.cardState[instanceId] = { active, faceDown, playedRound: state.round.roundNumber };
  return instanceId;
}
function setup() {
  const pack = loadAuthoringJson(archive()); expect(pack.report.filter((entry) => entry.status === 'unsupported')).toEqual([]);
  const state = createSeededGameState(); state.cards = []; state.players[0]!.servantCardId = ROOT; state.players[0]!.mana = 10;
  initializeAbilityRuntime(state, pack, { seed: 20260930 }); addCommanderDefinitions(state);
  const source = addPhysical(state, SOURCE, 'skill', false, false); state.round.prioritySeat = state.players[0]!.seat;
  return { state, source };
}
function activate(state: GameState, source: string, abilityId: string) { return dispatchAbilityCommand(state, 'p1', { type: 'activate_ability', cardInstanceId: source, abilityId }); }
function legal(state: GameState, source: string, abilityId: string) { return getLegalActions(state, 'p1').some((a) => a.type === 'activate_ability' && a.cardInstanceId === source && a.abilityId === abilityId); }

describe('P3 Valkyrie owner-readiness Commander lifecycle capability', () => {
  it('fails closed at the loader gateway for a widened privileged relocation shape', () => {
    const bad = archive(); bad.cards[0].abilities[0].effects[0].allowPlayTriggers = true;
    const pack = loadAuthoringJson(bad); expect(pack.cards[SOURCE]!.abilities[0]!.execution.mode).toBe('unsupported');
    expect(pack.report.some((entry) => entry.path === 'commanderLifecycle.gateway')).toBe(true);
  });

  it('relocates exactly one physical card per definition to independent hand/attack destinations without play triggers or play counters', () => {
    const { state, source } = setup();
    const a = addPhysical(state, IDS[0], 'removed_from_game'); const b = addPhysical(state, IDS[1], 'discard'); const c = addPhysical(state, IDS[2], 'deck');
    state.round.activePhase = 'advance'; const beforeMana = state.players[0]!.mana;
    expect(activate(state, source, DESCENT).ok).toBe(true); const pending = state.abilityRuntime!.pendingDecision!;
    expect(pending.candidates).toHaveLength(6); expect(pending.min).toBe(3); expect(pending.max).toBe(3);
    expect(dispatchAbilityCommand(state, 'p1', { type: 'choose_target', decisionId: pending.id, selectedIds: [`${IDS[0]}::attack_area`, `${IDS[1]}::hand`, `${IDS[2]}::attack_area`] }).ok).toBe(true);
    expect(state.cards.find((x) => x.instanceId === a)!.zone).toBe('attack_area'); expect(state.abilityRuntime!.cardState[a]!.active).toBe(true);
    expect(state.cards.find((x) => x.instanceId === b)!.zone).toBe('hand'); expect(state.abilityRuntime!.cardState[b]!.active).toBe(false);
    expect(state.cards.find((x) => x.instanceId === c)!.zone).toBe('attack_area'); expect(state.abilityRuntime!.cardState[c]!.active).toBe(true);
    expect(state.players[0]!.mana).toBe(beforeMana); expect(state.abilityRuntime!.cardPlayCountByInstance?.[a] ?? 0).toBe(0);
    expect(state.abilityRuntime!.processedEvents.some((id) => id.includes('play'))).toBe(false);
    expect(legal(state, source, DESCENT)).toBe(false);
  });

  it('restore-validates the exact relocation choice and rejects forged candidate authority', () => {
    const { state, source } = setup(); IDS.forEach((id) => addPhysical(state, id, 'deck')); state.round.activePhase = 'advance';
    expect(activate(state, source, DESCENT).ok).toBe(true); const pending = state.abilityRuntime!.pendingDecision!;
    expect(isCanonicalGenericPendingDecisionForRestore(state, pending)).toBe(true);
    const forged = structuredClone(pending); forged.candidates = [...forged.candidates, 'forged::hand'];
    expect(isCanonicalGenericPendingDecisionForRestore(state, forged)).toBe(false);
  });

  it('rejects duplicate destination selections atomically instead of silently omitting one definition', () => {
    const { state, source } = setup(); const ids = IDS.map((id) => addPhysical(state, id, 'deck'));
    state.round.activePhase = 'advance'; expect(activate(state, source, DESCENT).ok).toBe(true); const pending = state.abilityRuntime!.pendingDecision!;
    const result = dispatchAbilityCommand(state, 'p1', { type: 'choose_target', decisionId: pending.id, selectedIds: [`${IDS[0]}::hand`, `${IDS[0]}::attack_area`, `${IDS[1]}::hand`] });
    expect(result.ok).toBe(false); expect(ids.map((id) => state.cards.find((x) => x.instanceId === id)!.zone)).toEqual(['deck','deck','deck']);
  });

  it('reuses ordinary one-arrow movement authority in both action and combat phases while source is active', () => {
    const { state, source } = setup(); const sourceState = state.abilityRuntime!.cardState[source]!; sourceState.active = true;
    state.cards.find((x) => x.instanceId === source)!.zone = 'attack_area'; state.cards.find((x) => x.instanceId === source)!.visibility = { scope: 'public' };
    state.players[0]!.locationId = state.map.locations.find((l) => l.movementLinks.length > 0)!.id;
    const first = state.map.locations.find((l) => l.id === state.players[0]!.locationId)!.movementLinks[0]!;
    state.round.activePhase = 'action'; expect(legal(state, source, MOVE_ACTION)).toBe(true); expect(activate(state, source, MOVE_ACTION).ok).toBe(true);
    let pending = state.abilityRuntime!.pendingDecision!; expect(pending.candidates).toContain(first);
    expect(dispatchAbilityCommand(state, 'p1', { type: 'choose_target', decisionId: pending.id, selectedIds: [first] }).ok).toBe(true); expect(state.players[0]!.locationId).toBe(first);
    state.round.activePhase = 'combat'; state.abilityRuntime!.usedAbilities[`${source}:${MOVE_COMBAT}`] = state.round.roundNumber - 1;
    expect(legal(state, source, MOVE_COMBAT)).toBe(true);
  });

  it('restore-validates Steel Shield against the current live active definition-set target set', () => {
    const { state, source } = setup(); const commander = addPhysical(state, IDS[2], 'attack_area', true, false); state.round.activePhase = 'combat';
    expect(activate(state, source, SHIELD).ok).toBe(true); const pending = state.abilityRuntime!.pendingDecision!;
    expect(isCanonicalGenericPendingDecisionForRestore(state, pending)).toBe(true);
    state.abilityRuntime!.cardState[commander]!.active = false;
    expect(isCanonicalGenericPendingDecisionForRestore(state, pending)).toBe(false);
  });

  it('Steel Shield pays current source cost, recalls exactly one live definition-set card, and joins source without a play trigger', () => {
    const { state, source } = setup(); const commander = addPhysical(state, IDS[1], 'attack_area', true, false); state.round.activePhase = 'combat'; state.players[0]!.mana = 5;
    expect(legal(state, source, SHIELD)).toBe(true); expect(activate(state, source, SHIELD).ok).toBe(true); const pending = state.abilityRuntime!.pendingDecision!;
    expect(pending.candidates).toEqual([commander]); const beforeEvents = state.abilityRuntime!.processedEvents.length;
    expect(dispatchAbilityCommand(state, 'p1', { type: 'choose_target', decisionId: pending.id, selectedIds: [commander] }).ok).toBe(true);
    expect(state.players[0]!.mana).toBe(3); expect(state.cards.find((x) => x.instanceId === commander)!.zone).toBe('hand');
    expect(state.cards.find((x) => x.instanceId === source)!.zone).toBe('attack_area'); expect(state.abilityRuntime!.cardState[source]!.active).toBe(true);
    expect(state.abilityRuntime!.cardState[source]!.paidManaOnPlay).toBe(0); expect(state.abilityRuntime!.processedEvents).toHaveLength(beforeEvents);
    expect(state.abilityRuntime!.cardPlayCountByInstance?.[source] ?? 0).toBe(0);
  });

  it('Steel Shield fails before mutation when current source cost cannot be paid', () => {
    const { state, source } = setup(); const commander = addPhysical(state, IDS[0], 'attack_area', true, false); state.round.activePhase = 'combat'; state.players[0]!.mana = 1;
    const before = structuredClone({ mana: state.players[0]!.mana, sourceZone: state.cards.find((x) => x.instanceId === source)!.zone, commanderZone: state.cards.find((x) => x.instanceId === commander)!.zone });
    expect(legal(state, source, SHIELD)).toBe(false); expect(activate(state, source, SHIELD).ok).toBe(false);
    expect({ mana: state.players[0]!.mana, sourceZone: state.cards.find((x) => x.instanceId === source)!.zone, commanderZone: state.cards.find((x) => x.instanceId === commander)!.zone }).toEqual(before);
  });

  it('re-triggers on-card-play effects of every current live definition-set card without replaying or incrementing play counts', () => {
    const { state, source } = setup(); const a = addPhysical(state, IDS[0], 'attack_area', true, false); const b = addPhysical(state, IDS[2], 'attack_area', true, false);
    addPhysical(state, IDS[1], 'hand', false, false); state.round.activePhase = 'action'; state.players[0]!.mana = 0;
    state.abilityRuntime!.cardPlayCountByInstance = { [a]: 4, [b]: 2 }; const beforeZones = state.cards.map((x) => [x.instanceId, x.zone]);
    expect(legal(state, source, RETRIGGER)).toBe(true); expect(activate(state, source, RETRIGGER).ok).toBe(true);
    expect(state.players[0]!.mana).toBe(4); expect(state.abilityRuntime!.cardPlayCountByInstance[a]).toBe(4); expect(state.abilityRuntime!.cardPlayCountByInstance[b]).toBe(2);
    expect(state.cards.map((x) => [x.instanceId, x.zone])).toEqual(beforeZones);
  });

  it('requires a live active face-up definition-set card for retrigger legality', () => {
    const { state, source } = setup(); const commander = addPhysical(state, IDS[0], 'attack_area', true, true); state.round.activePhase = 'action';
    expect(legal(state, source, RETRIGGER)).toBe(false); state.abilityRuntime!.cardState[commander]!.faceDown = false; expect(legal(state, source, RETRIGGER)).toBe(true);
  });
});
