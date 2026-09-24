import { describe, expect, it } from 'vitest';
import * as rules from '../src/index';
import { createMatchSession } from '../src/match-session';

const SOURCE = 'master.fixture.skill.titan';

function titanAbility() {
  return {
    id: 'titan-form', kind: 'passive', printedClause: 'fixture', markers: ['m50_structured_v1'], activation: {},
    conditions: [{ type: 'source_owned' }], targets: [], effects: [], cost: [], creates: [],
    ruleModifiers: [
      { id: 'no-workshop-deploy', operation: 'forbid', rule: 'deployment_destinations', scope: { subject: 'controller', locationIds: ['workshop'] }, lifecycle: { duration: 'permanent' } },
      { id: 'no-workshop-move', operation: 'forbid', rule: 'movement_destinations', scope: { subject: 'controller', toLocationIds: ['workshop'] }, lifecycle: { duration: 'permanent' } },
      { id: 'ignore-card-play-prevention', operation: 'ignore', rule: 'card_play', scope: { subject: 'controller' }, lifecycle: { duration: 'permanent' } },
      { id: 'basic-cost', operation: 'add', rule: 'card_cost', scope: { subject: 'controller', cards: { basic: true } }, value: 3, lifecycle: { duration: 'permanent' } },
      { id: 'basic-power', operation: 'add', rule: 'card_power', scope: { subject: 'controller', cards: { basic: true } }, value: 5, lifecycle: { duration: 'permanent' } },
    ],
    lifecycle: {}, responseWindow: {}, limit: {}, visibility: {}, execution: { mode: 'automatic', allowedOperations: [] },
  } as any;
}
function archive(a: any = titanAbility()) {
  return { schemaVersion: 'fd-card-authoring-v1', archiveType: 'master_skill_card_archive', id: 'master.fixture', name: 'fixture', class: 'Master', cards: [{
    id: SOURCE, name: SOURCE, cardType: 'master_skill', owner: { type: 'master', id: 'master.fixture' },
    cardFace: { cost: 0, basePower: 0, attributes: [] }, playTiming: { phase: 'action', window: 'controller_play_card_window' },
    playRequirements: [], abilities: [a], mode: 'automatic',
  }] } as any;
}
function setup() {
  const pack = rules.loadAuthoringJson(archive());
  expect(pack.report).toEqual([]);
  const session = createMatchSession({ seed: 20260924, humanPlayerId: 'p1' });
  const actor = session.state.players.find((p) => p.id === 'p1')!;
  session.state.abilityRuntime!.pack.cards[SOURCE] = pack.cards[SOURCE]!;
  session.state.cards.push({ instanceId: 'titan-source', definitionId: SOURCE, ownerPlayerId: actor.id, controllerPlayerId: actor.id, zone: 'skill', visibility: { scope: 'owner_only', ownerPlayerId: actor.id } });
  session.state.abilityRuntime!.cardState['titan-source'] = { active: false, faceDown: false };
  const basic = session.state.cards.find((card) => card.ownerPlayerId === actor.id && card.zone === 'hand' && session.state.abilityRuntime!.pack.cards[card.definitionId]?.cardType === 'basic_attack')!;
  expect(basic).toBeTruthy();
  return { session, actor, basic };
}

describe('M50-02 source-owned permanent player-rule bundle', () => {
  it('loads the exact five-rule bundle and fails closed for widened selector/lifecycle shapes', () => {
    const exact = rules.loadAuthoringJson(archive());
    expect(exact.report).toEqual([]);
    const widened = titanAbility();
    widened.ruleModifiers[0].scope.extra = true;
    widened.ruleModifiers[1].lifecycle = { duration: 'this_round' };
    const rejected = rules.loadAuthoringJson(archive(widened));
    expect(rejected.report.some((entry: any) => entry.status === 'unsupported')).toBe(true);
  });

  it('forbids workshop deployment and regular movement while the owned source exists', () => {
    const { session, actor } = setup();
    session.state.round.activePhase = 'advance';
    session.state.round.prioritySeat = actor.seat;
    for (const p of session.state.players) delete p.locationId;
    expect(session.legalDeploymentActions(actor.id)).not.toContainEqual({ type: 'deploy_player', locationId: 'magic_workshop' });

    actor.locationId = 'shinto';
    actor.mana = 20;
    session.state.round.activePhase = 'action';
    const moved = rules.movePlayer(session.state, { playerId: actor.id, to: 'magic_workshop', movementKind: 'normal' });
    expect(moved.moved).toBe(false);
    expect(moved.reason).toBe('destination_blocked');
  });

  it('adds +3 play cost and +5 power to controller basic attacks only', () => {
    const { session, actor, basic } = setup();
    const definition = session.state.abilityRuntime!.pack.cards[basic.definitionId]!;
    const printedPower = Number(definition.cardFace.basePower ?? 0);
    const printedCost = Number(definition.cardFace.cost ?? 0);
    expect(rules.m50AdditiveCardAdjustment(session.state, basic.instanceId)).toEqual({ power: 5, cost: 3 });
    expect(rules.calculateCardPower(session.state, basic.instanceId).value).toBe(printedPower + 5);

    session.state.round.activePhase = 'action';
    session.state.round.prioritySeat = actor.seat;
    actor.mana = printedCost + 2;
    expect(rules.getLegalActions(session.state, actor.id)).not.toContainEqual({ type: 'play_card', cardInstanceId: basic.instanceId });
    actor.mana = printedCost + 3;
    expect(rules.getLegalActions(session.state, actor.id)).toContainEqual({ type: 'play_card', cardInstanceId: basic.instanceId });
  });

  it('ignores authored card-play forbids only, without bypassing base timing', () => {
    const { session, actor, basic } = setup();
    const definition = session.state.abilityRuntime!.pack.cards[basic.definitionId]!;
    const attribute = (definition.cardFace.attributes as string[])[0]!;
    (session.state as any).modeState = { ...((session.state as any).modeState ?? {}), cardPlayForbids: [{ sourceId: 'card-rule', sourceType: 'card', attribute, rule: 'card_play' }] };
    actor.mana = 20;
    session.state.round.activePhase = 'action';
    session.state.round.prioritySeat = actor.seat;
    expect(rules.m50IgnoresCardEffectPlayRestrictions(session.state, actor.id)).toBe(true);
    expect(rules.getLegalActions(session.state, actor.id)).toContainEqual({ type: 'play_card', cardInstanceId: basic.instanceId });

    session.state.round.activePhase = 'advance';
    expect(rules.getLegalActions(session.state, actor.id)).not.toContainEqual({ type: 'play_card', cardInstanceId: basic.instanceId });
  });

  it('stops applying all five source-owned rules when ownership/source state becomes invalid', () => {
    const { session, actor, basic } = setup();
    const source = session.state.cards.find((card) => card.instanceId === 'titan-source')!;
    source.zone = 'removed_from_game';
    expect(rules.m50AdditiveCardAdjustment(session.state, basic.instanceId)).toEqual({ power: 0, cost: 0 });
    expect(rules.m50IgnoresCardEffectPlayRestrictions(session.state, actor.id)).toBe(false);
    expect(rules.m50DeploymentDestinationForbidden(session.state, actor.id, 'magic_workshop')).toBe(false);
    expect(rules.m50MovementDestinationForbidden(session.state, actor.id, 'magic_workshop')).toBe(false);
  });
});
