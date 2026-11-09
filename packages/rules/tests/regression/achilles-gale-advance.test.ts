import { describe, expect, it } from 'vitest';
import { createMatchSession } from '../../src/match-session';
import { resolveBattlefield } from '../../src/core/combat-resolver';

const abilityId = 'sc-achilles-1.gale-advance';
function setup() {
  const session = createMatchSession({ seed: 394 });
  const state = session.state;
  const achilles = state.players.find(p => p.servantCardId === 'servant.achilles')!;
  const opponents = state.players.filter(p => p.id !== achilles.id);
  const [empty, luck, agility, ordinary, quick, protectedOpponent] = opponents;
  const resistance = state.eventPlacements.find(event =>
    event.eventCardId === 'event.waxing_moon_ritual.resistance' && event.visibility.scope === 'public')!;
  const battlefieldId = resistance.locationId;
  state.round.activePhase = 'action';
  state.round.prioritySeat = achilles.seat;
  for (const p of state.players) p.locationId = 'shinto';
  for (const p of [achilles, empty!, luck!, agility!, ordinary!, quick!, protectedOpponent!]) p.locationId = battlefieldId;
  state.eventPlacements = [resistance];
  state.cards = state.cards.filter(c => c.zone !== 'hand' || c.ownerPlayerId === achilles.id);
  const add = (id: string, playerId: string, definitionId: string) => {
    state.cards.push({ instanceId: id, definitionId, ownerPlayerId: playerId, controllerPlayerId: playerId,
      zone: 'hand', visibility: { scope: 'owner_only', ownerPlayerId: playerId } });
  };
  add('luck', luck!.id, 'basic.luck');
  add('agility', agility!.id, 'basic.agility.2');
  add('ordinary', ordinary!.id, 'basic.strength.2');
  state.cards.find(card => card.instanceId === 'ordinary')!.visibility = { scope: 'public' };
  add('quick', quick!.id, 'master.kayneth.deck.volumen-hydrargyrum');
  add('protected-hand', protectedOpponent!.id, 'basic.strength.2');
  state.abilityRuntime!.ongoingEffects.push({
    id: 'meditation', sourceCardId: 'protected-hand', abilityId: 'meditation', controllerId: protectedOpponent!.id,
    starts: 'immediate', duration: 'this_round', startRound: 1, expiresAtRound: 2,
    cleanup: 'expire_after_duration', publicZones: [], sourceMustRemainActive: false,
    ruleModifiers: [{ sourceCardId: 'protected-hand', controllerId: protectedOpponent!.id,
      definition: { rule: 'opponent_ability_effects', operation: 'ignore', scope: { subject: 'controller' } } }],
  });

  const heel = state.cards.find(c => c.ownerPlayerId === achilles.id && c.definitionId === 'servant.achilles.skill.sc-achilles-1')!;
  const command = { type: 'activate_ability', cardInstanceId: heel.instanceId, abilityId } as const;
  return { session, state, achilles, empty: empty!, luck: luck!, agility: agility!, ordinary: ordinary!, quick: quick!, protectedOpponent: protectedOpponent!, heel, command, battlefieldId };
}

describe('Achilles Gale Advance', () => {
  it('projects the combat activation from the inactive skill zone and settles each opponent separately', () => {
    const { session, state, achilles, empty, luck, agility, ordinary, quick, protectedOpponent, heel, command, battlefieldId } = setup();
    state.round.activePhase = 'battle';
    expect(heel.zone).toBe('skill');
    expect(state.abilityRuntime!.cardState[heel.instanceId]?.active).not.toBe(true);
    expect(session.getClientProjection(achilles.id).view.legalActions).toContainEqual(command);
    expect(session.dispatchPlayerCommand(achilles.id, command).ok).toBe(true);
    expect(state.abilityRuntime!.revealedServants).not.toContain(achilles.id);
    expect(state.cards.find(c => c.instanceId === 'quick')!.zone).toBe('discard');
    expect(state.cards.find(c => c.instanceId === 'protected-hand')!.zone).toBe('hand');
    expect(state.cards.filter(c => ['luck', 'agility', 'ordinary'].includes(c.instanceId)).every(c => c.zone === 'discard')).toBe(true);
    expect(session.getPlayerView(achilles.id).legalActions).not.toContainEqual(command);
    const result = resolveBattlefield(state, { battlefieldId, participants: [
      { playerId: achilles.id, totalPower: 1 },
      { playerId: empty.id, totalPower: 8, terrainSlotIndex: 0 },
      { playerId: ordinary.id, totalPower: 7 },
      { playerId: luck.id, totalPower: 4 },
      { playerId: agility.id, totalPower: 3 },
      { playerId: quick.id, totalPower: 6 },
      { playerId: protectedOpponent.id, totalPower: 5 },
    ] });
    const powers = Object.fromEntries(result.nextState.battleResults.at(-1)!.participantBreakdowns!.map(p => [p.playerId, p.effectivePower]));
    expect(powers).toMatchObject({ [empty.id]: 0, [ordinary.id]: 0, [luck.id]: 4, [agility.id]: 3, [quick.id]: 0, [protectedOpponent.id]: 5 });
  });

  it('withholds the action after true-name reveal or when the source is outside its usable zones', () => {
    const { session, state, achilles, heel, command } = setup();
    state.round.activePhase = 'battle';
    state.abilityRuntime!.revealedServants.push(achilles.id);
    expect(session.getPlayerView(achilles.id).legalActions).not.toContainEqual(command);
    state.abilityRuntime!.revealedServants = [];
    heel.zone = 'removed_from_game';
    expect(session.getPlayerView(achilles.id).legalActions).not.toContainEqual(command);
  });
});

describe('Achilles Blue Sky discard', () => {
  it.each(['battlefield', 'workshop'])('uses only unprotected opponents at the same battlefield from %s', location => {
    const { session, state, achilles, luck, ordinary, protectedOpponent, battlefieldId } = setup();
    const blueSky = state.cards.find(card => card.ownerPlayerId === achilles.id &&
      card.definitionId === 'servant.achilles.skill.sc-achilles-2')!;
    blueSky.zone = 'attack_area';
    state.abilityRuntime!.cardState[blueSky.instanceId] = { active: true, faceDown: false };
    achilles.mana = 2;
    luck.locationId = 'shinto';
    if (location === 'workshop') achilles.locationId = ordinary.locationId = 'magic_workshop';
    const other = state.cards.find(card => card.instanceId === 'ordinary')!;
    if (location === 'workshop') other.visibility = { scope: 'owner_only', ownerPlayerId: ordinary.id };
    expect(session.dispatchPlayerCommand(achilles.id, { type: 'activate_ability', cardInstanceId: blueSky.instanceId,
      abilityId: 'sc-achilles-2.blue-sky' }).ok).toBe(true);
    const choice = session.getPlayerView(achilles.id).legalActions.find(action => action.type === 'choose_target')!;
    expect(choice.candidates).toEqual(['discard_hand', 'forbid_skills']);
    expect(session.dispatchPlayerCommand(achilles.id, { type: 'choose_target', decisionId: choice.decisionId,
      selectedIds: ['discard_hand'] }).ok).toBe(true);
    const zone = (id: string) => state.cards.find(card => card.instanceId === id)!.zone;
    expect(zone('ordinary')).toBe(location === 'battlefield' ? 'discard' : 'hand');
    expect(zone('protected-hand')).toBe('hand');
    expect(zone('luck')).toBe('hand');
    expect(protectedOpponent.locationId).toBe(battlefieldId);
  });
});
