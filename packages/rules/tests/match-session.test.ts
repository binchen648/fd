import { describe, expect, it } from 'vitest';

import contentLibrary from '../../../data/generated/fd-playtest-v1.content-library.json';
import { createMatchSession, restoreSession } from '../src/match-session';
import { projectAbilityState } from '../src/ability/interpreter';
import { resolveBattlefield } from '../src/core/combat-resolver';
import { applyBattleScoring } from '../src/core/scoring-resolver';

describe('MatchSession semi-auto runtime', () => {
  it('starts a 7-player match and exposes the first human decision', () => {
    const session = createMatchSession({ seed: 20260904, humanPlayerId: 'p1' });
    const reason = session.runUntilHumanInputOrRoundEnd();
    const projected = session.projectToClientState('p1');

    expect(reason).toBe('human_input');
    expect(projected.view.players).toHaveLength(7);
    expect(projected.priorityPlayerId).toBe('p1');
    expect(projected.phase).toBe('preparation');
    expect(projected.zones.find((zone) => zone.id === 'hand')?.count).toBe(3);
    expect(projected.zones.find((zone) => zone.id === 'servant_deck')?.count).toBe(9);
    expect(projected.zones.map((zone) => zone.id)).toEqual(expect.arrayContaining([
      'hand',
      'servant_deck',
      'master_skill',
      'servant_skill',
      'command_spell',
      'ascension_skill',
      'field',
      'discard',
      'removed_from_game',
      'event_deck',
      'event_placements',
      'event_discard',
      'situation_deck',
      'current_situation',
      'independent_deck',
      'unowned_servant_pool',
      'host_directive_queue',
    ]));
    const p1BasicCards = session.state.cards.filter((card) => card.ownerPlayerId === 'p1' && ['hand', 'deck'].includes(card.zone));
    const p1BasicDefinitionIds = p1BasicCards.map((card) => card.definitionId);
    expect(p1BasicCards).toHaveLength(12);
    const servantId = session.pairings.find((pairing) => pairing.playerId === 'p1')!.servant.id;
    expect(p1BasicDefinitionIds.sort()).toEqual([...contentLibrary.rules.decks[servantId]!].sort());
    expect(p1BasicDefinitionIds).not.toContain('basic.special.2');
    expect(projected.view.players.find((player) => player.id === 'p1')?.locationId).toBeUndefined();
    expect(projected.view.legalActions).not.toContainEqual({ type: 'deploy_player', locationId: 'magic_workshop' });
  });

  it('only exposes deployment during the advance phase and awards magic workshop mana', () => {
    const session = createMatchSession({ seed: 20260904, humanPlayerId: 'p1', humanPlayerIds: ['p1', 'p2'] });
    expect(session.runUntilHumanInputOrRoundEnd()).toBe('human_input');
    const before = session.state.players.find((player) => player.id === 'p1')!.mana;
    const controller = session as unknown as { advanceToNextDecision: () => void };

    expect(session.projectToClientState('p1').phase).toBe('preparation');
    expect(session.projectToClientState('p1').view.legalActions).not.toContainEqual({ type: 'deploy_player', locationId: 'magic_workshop' });
    expect(session.dispatchPlayerCommand('p1', { type: 'deploy_player', locationId: 'magic_workshop' }).ok).toBe(false);
    for (let index = 0; index < 7; index++) controller.advanceToNextDecision();

    expect(session.projectToClientState('p1').phase).toBe('advance');
    expect(session.projectToClientState('p1').view.legalActions).toContainEqual({ type: 'deploy_player', locationId: 'magic_workshop' });

    const result = session.dispatchPlayerCommand('p1', { type: 'deploy_player', locationId: 'magic_workshop' });

    expect(result.ok).toBe(true);
    expect(session.state.players.find((player) => player.id === 'p1')?.locationId).toBe('magic_workshop');
    expect(session.state.players.find((player) => player.id === 'p1')?.mana).toBe(before + 2);
    expect(session.projectToClientState('p2').priorityPlayerId).toBe('p2');
    expect(session.projectToClientState('p1').logs.some((entry) => entry.type === 'player_deployed')).toBe(true);
    expect(session.projectToClientState('p1').logs.some((entry) => entry.type === 'workshop_deployment_mana_awarded')).toBe(true);
  });

  it('filters Kayneth deployment choices through Pride when a lower-VP lone battlefield is available', () => {
    const session = createMatchSession({ seed: 20260904, humanPlayerId: 'p1' });
    const kayneth = session.pairings.find((pairing) => pairing.master.id === 'master.kayneth')!;
    session.state.round.activePhase = 'advance';
    session.state.round.prioritySeat = kayneth.seat;
    for (const player of session.state.players) {
      delete player.locationId;
      player.vp = 0;
    }
    const player = session.state.players.find((candidate) => candidate.id === kayneth.playerId)!;
    const lowerLone = session.state.players.find((candidate) => candidate.id !== kayneth.playerId)!;
    const crowdedA = session.state.players.find((candidate) => ![kayneth.playerId, lowerLone.id].includes(candidate.id))!;
    const crowdedB = session.state.players.find((candidate) => ![kayneth.playerId, lowerLone.id, crowdedA.id].includes(candidate.id))!;
    const higherLone = session.state.players.find((candidate) => ![kayneth.playerId, lowerLone.id, crowdedA.id, crowdedB.id].includes(candidate.id))!;
    player.vp = 5;
    lowerLone.vp = 2;
    lowerLone.locationId = 'shinto';
    crowdedA.vp = 1;
    crowdedA.locationId = 'miyama_town';
    crowdedB.vp = 1;
    crowdedB.locationId = 'miyama_town';
    higherLone.vp = 8;
    higherLone.locationId = 'recon';

    expect(session.projectToClientState(kayneth.playerId).view.legalActions.filter((action) => action.type === 'deploy_player')).toEqual([
      { type: 'deploy_player', locationId: 'shinto' },
    ]);
  });

  it('instantiates Ereshkigal starting deck from the reviewed servant overview', () => {
    const session = createMatchSession({ seed: 20260904, humanPlayerId: 'p1' });
    const ereshPairing = session.pairings.find((pairing) => pairing.servant.id === 'servant.ereshkigal')!;
    const ids = session.state.cards
      .filter((card) => card.ownerPlayerId === ereshPairing.playerId && ['hand', 'deck'].includes(card.zone))
      .map((card) => card.definitionId)
      .sort();

    expect(ids).toEqual([
      'basic.agility.2',
      'basic.agility.3',
      'basic.agility.3',
      'basic.agility.4',
      'basic.luck',
      'basic.magecraft.2',
      'basic.magecraft.4',
      'basic.magecraft.5',
      'basic.preparation',
      'basic.preparation',
      'basic.strength.2',
      'basic.strength.4',
    ].sort());
  });

  it('uses reviewed special basic attack powers', () => {
    const session = createMatchSession({ seed: 20260904, humanPlayerId: 'p1' });

    expect(session.rawCards.get('basic.preparation')?.cardFace?.basePower).toBe(2);
    expect(session.rawCards.get('basic.surveil')?.cardFace?.basePower).toBe(3);
    expect(session.rawCards.get('basic.luck')?.cardFace?.basePower).toBe(4);
  });

  it('instantiates a command spell card in every master command spell zone', () => {
    const session = createMatchSession({ seed: 20260904, humanPlayerId: 'p1' });

    for (const pairing of session.pairings) {
      const commandSpells = session.state.cards.filter((card) =>
        card.ownerPlayerId === pairing.playerId &&
        card.zone === 'skill' &&
        session.rawCards.get(card.definitionId)?.cardType === 'command_spell');
      expect(commandSpells, pairing.master.name).toHaveLength(1);
      expect(session.projectToClientState(pairing.playerId).zones.find((zone) => zone.id === 'command_spell')?.count).toBe(1);
    }
  });

  it('moves Surveil one step during its authored action-phase target window', () => {
    const session = createMatchSession({ seed: 20260904, humanPlayerId: 'p1', humanPlayerIds: ['p1'] });
    const player = session.state.players.find((candidate) => candidate.id === 'p1')!;
    const surveil = session.state.cards.find((card) => card.ownerPlayerId === 'p1' && card.definitionId === 'basic.surveil')!;
    player.locationId = 'miyama_town';
    session.state.round.activePhase = 'action';
    session.state.round.prioritySeat = player.seat;
    surveil.zone = 'attack_area';
    surveil.visibility = { scope: 'public' };
    session.state.abilityRuntime!.cardState[surveil.instanceId] = { active: true, faceDown: false, playedRound: 1 };

    const result = session.dispatchPlayerCommand('p1', {
      type: 'activate_ability',
      cardInstanceId: surveil.instanceId,
      abilityId: 'basic.surveil.battle-dash',
    });

    expect(result.ok).toBe(true);
    const window = session.projectToClientState('p1').interactionWindows.find((candidate) => candidate.kind === 'target');
    expect(window?.candidates?.map((candidate) => candidate.id)).toEqual(['shinto']);

    const move = session.dispatchPlayerCommand('p1', {
      type: 'choose_target',
      decisionId: window!.id,
      selectedIds: ['shinto'],
    });

    expect(move.ok).toBe(true);
    expect(session.state.players.find((candidate) => candidate.id === 'p1')?.locationId).toBe('shinto');
  });

  it('lets Luck stay in the attack area for battle power and ignore defeat effects', () => {
    const session = createMatchSession({ seed: 20260904, humanPlayerId: 'p1', humanPlayerIds: ['p1', 'p2'] });
    session.state.round.activePhase = 'battle';
    session.state.eventPlacements = [];
    session.state.currentSituationModifiers = [];
    for (const player of session.state.players) {
      player.locationId = ['p1', 'p2'].includes(player.id) ? 'miyama_town' : 'recon';
      player.militaryResult = 0;
    }
    const luck = session.state.cards.find((card) => card.ownerPlayerId === 'p1' && card.definitionId === 'basic.luck')!;
    const strength = session.state.cards.find((card) => card.ownerPlayerId === 'p2' && ['hand', 'deck'].includes(card.zone))!;
    luck.zone = 'attack_area';
    luck.visibility = { scope: 'public' };
    session.state.abilityRuntime!.cardState[luck.instanceId] = { active: true, faceDown: false, playedRound: 1 };
    strength.definitionId = 'basic.magecraft.5';
    strength.zone = 'attack_area';
    strength.visibility = { scope: 'public' };
    session.state.abilityRuntime!.cardState[strength.instanceId] = { active: true, faceDown: false, playedRound: 1 };

    const result = resolveBattlefield(session.state, { battlefieldId: 'miyama_town', revealHiddenEvents: true });
    const battle = result.nextState.battleResults.at(-1)!;

    expect(battle.winnerPlayerId).toBe('p2');
    expect(battle.participantBreakdowns.find((entry) => entry.playerId === 'p1')?.basePower).toBe(4);
    expect(battle.militaryAdjustments.find((entry) => entry.playerId === 'p1')?.delta).toBe(0);
    expect(result.nextState.log.some((entry) => entry.type === 'battle_loss_effect_ignored')).toBe(true);
  });

  it('moves round attack-area basic cards to the owner discard pile at cleanup', () => {
    const session = createMatchSession({ seed: 20260904, humanPlayerId: 'p1' });
    const luck = session.state.cards.find((card) => card.ownerPlayerId === 'p1' && card.definitionId === 'basic.luck')!;
    luck.zone = 'attack_area';
    luck.visibility = { scope: 'public' };
    session.state.abilityRuntime!.cardState[luck.instanceId] = { active: true, faceDown: false, playedRound: 1 };

    (session as unknown as { discardRoundAttackAreaCards: () => void }).discardRoundAttackAreaCards();

    expect(luck.zone).toBe('discard');
    expect(luck.visibility).toEqual({ scope: 'owner_only', ownerPlayerId: 'p1' });
    expect(session.projectToClientState('p1').zones.find((zone) => zone.id === 'discard')?.cardIds).toContain(luck.instanceId);
  });

  it('uses Irisviel proxy text to expose command spells during the advance phase', () => {
    const session = createMatchSession({ seed: 20260904, humanPlayerId: 'p1' });
    const pairing = session.pairings.find((candidate) => candidate.master.id === 'master.irisviel')!;
    const player = session.state.players.find((candidate) => candidate.id === pairing.playerId)!;
    const commandSpell = session.state.cards.find((card) =>
      card.ownerPlayerId === pairing.playerId &&
      session.rawCards.get(card.definitionId)?.cardType === 'command_spell')!;
    session.state.round.prioritySeat = player.seat;
    session.state.round.activePhase = 'action';
    expect(projectAbilityState(session.state, pairing.playerId).legalActions.some((action) =>
      action.type === 'activate_ability' && action.cardInstanceId === commandSpell.instanceId)).toBe(false);

    session.state.round.activePhase = 'advance';
    expect(projectAbilityState(session.state, pairing.playerId).legalActions.some((action) =>
      action.type === 'activate_ability' && action.cardInstanceId === commandSpell.instanceId)).toBe(true);
  });

  it('lets Kiritsugu choose one deck card to replace with Origin Bullet during preparation', () => {
    const session = createMatchSession({ seed: 20260904, humanPlayerId: 'p6' });
    const kiritsuguPairing = session.pairings.find((pairing) => pairing.master.id === 'master.kiritsugu')!;
    session.state.round.prioritySeat = kiritsuguPairing.seat;
    const skill = session.state.cards.find((card) =>
      card.ownerPlayerId === kiritsuguPairing.playerId &&
      card.definitionId === 'master.kiritsugu.skill.magus-killer');
    const deckTarget = session.state.cards.find((card) =>
      card.ownerPlayerId === kiritsuguPairing.playerId &&
      card.zone === 'deck' &&
      card.definitionId !== 'master.kiritsugu.deck.origin-bullet');

    expect(skill).toBeTruthy();
    expect(deckTarget).toBeTruthy();
    expect(session.dispatchPlayerCommand(kiritsuguPairing.playerId, {
      type: 'activate_ability',
      cardInstanceId: skill!.instanceId,
      abilityId: 'magus-killer.setup',
    }).ok).toBe(true);
    const projected = session.projectToClientState(kiritsuguPairing.playerId);
    const targetWindow = projected.interactionWindows.find((window) => window.kind === 'target');
    expect(targetWindow).toMatchObject({ min: 1, max: 1 });
    expect(targetWindow?.candidates?.some((candidate) => candidate.id === deckTarget!.instanceId)).toBe(true);
    expect(session.dispatchPlayerCommand(kiritsuguPairing.playerId, {
      type: 'choose_target',
      decisionId: targetWindow!.id,
      selectedIds: [deckTarget!.instanceId],
    }).ok).toBe(true);
    const activeDeck = session.state.cards.filter((card) =>
      card.ownerPlayerId === kiritsuguPairing.playerId &&
      ['hand', 'deck'].includes(card.zone),
    );
    expect(activeDeck).toHaveLength(12);
    expect(session.state.cards.find((card) => card.instanceId === deckTarget!.instanceId)?.definitionId).toBe('master.kiritsugu.deck.origin-bullet');
    expect(session.projectToClientState(kiritsuguPairing.playerId).logs.some((entry) =>
      entry.type === 'directive_recorded' &&
      entry.message === 'replace_one_deck_card_with_origin_bullet',
    )).toBe(true);
  });

  it('caps magic workshop deployment to one player when the climax situation requires it', () => {
    const session = createMatchSession({ seed: 20260904, humanPlayerId: 'p1', humanPlayerIds: ['p1', 'p2'] });
    const controller = session as unknown as { startRound: (round: number) => void };
    controller.startRound(10);
    const advancer = session as unknown as { advanceToNextDecision: () => void };
    for (let index = 0; index < 7; index++) advancer.advanceToNextDecision();

    expect(session.dispatchPlayerCommand('p1', { type: 'deploy_player', locationId: 'magic_workshop' }).ok).toBe(true);
    expect(session.projectToClientState('p2').view.legalActions).not.toContainEqual({ type: 'deploy_player', locationId: 'magic_workshop' });
    expect(session.dispatchPlayerCommand('p2', { type: 'deploy_player', locationId: 'magic_workshop' }).ok).toBe(false);
  });

  it('runs one semi-auto round through the same dispatch path', () => {
    const session = createMatchSession({ seed: 20260904, humanPlayerId: 'p1' });
    const reason = session.runFullMatch({ maxRounds: 1 });
    const projected = session.projectToClientState('p1');

    expect(reason).toBe('match_complete');
    expect(projected.round).toBe(1);
    expect(projected.phase).toBe('round_end');
    expect(projected.logs.some((entry) => entry.type === 'dispatch_ok')).toBe(true);
    expect(projected.battleBreakdowns.length).toBeGreaterThan(0);
  });

  it('serializes and restores a playable session snapshot', () => {
    const session = createMatchSession({ seed: 20260904, humanPlayerId: 'p1' });
    const firstReason = session.runUntilHumanInputOrRoundEnd();
    const snapshot = session.serializeSession();
    const restored = restoreSession(snapshot);

    expect(firstReason).toBe('human_input');
    expect(restored.getState().round).toEqual(session.getState().round);
    expect(restored.getClientProjection('p1').view.legalActions).toEqual(session.getClientProjection('p1').view.legalActions);
  });

  it('lets the current human end their action decision and advances priority to the next seat', () => {
    const session = createMatchSession({ seed: 20260904, humanPlayerId: 'p1', humanPlayerIds: ['p1', 'p2'] });
    expect(session.runUntilHumanInputOrRoundEnd()).toBe('human_input');

    const result = session.passPriority('p1');

    expect(result.ok).toBe(true);
    expect(session.projectToClientState('p2').priorityPlayerId).toBe('p2');
    expect(session.projectToClientState('p1').logs.some((entry) => entry.type === 'player_passed')).toBe(true);
  });

  it('projects response window source and available response choices for the active viewer', () => {
    const session = createMatchSession({ seed: 20260904, humanPlayerId: 'p1' });
    const responseCard = session.state.cards.find((card) => card.ownerPlayerId === 'p1' && card.zone === 'skill')!;
    const abilityId = session.state.abilityRuntime!.pack.cards[responseCard.definitionId!]!.abilities[0]!.id;
    session.state.abilityRuntime!.responseWindows.push({
      id: 'test-response-window',
      kind: 'choose_unique_trigger',
      controllerId: 'p1',
      opens: 'after_battle_result_determined',
      choices: [{ cardInstanceId: responseCard.instanceId, abilityId, controllerId: 'p1' }],
      event: { id: 'test-event', type: 'after_battle_result_determined' },
      passBehavior: 'decline_this_window',
      order: 'turn_order',
      group: { groupId: 'test-group', policy: 'only_one_effect_may_activate_per_window' },
    });

    const window = session.projectToClientState('p1').interactionWindows.find((candidate) => candidate.id === 'test-response-window');

    expect(window).toMatchObject({
      kind: 'response',
      title: '唯一触发选择',
      sourceLabel: 'after_battle_result_determined',
    });
    expect(window?.candidates?.[0]).toMatchObject({
      id: `${responseCard.instanceId}:${abilityId}`,
      kind: 'option',
      zone: responseCard.zone,
    });
  });

  it('prepares the official situation deck by burning two non-climax situations', () => {
    const session = createMatchSession({ seed: 20260904, humanPlayerId: 'p1' });

    expect(session.state.burnedSituationCardIds).toHaveLength(2);
    expect(session.state.burnedSituationCardIds?.every((id) => ![
      'situation.fate_night',
      'situation.gate_of_hell',
      'situation.heavens_cup',
    ].includes(id))).toBe(true);
    expect(session.state.situationDeck?.slice(-3)).toEqual([
      'situation.fate_night',
      'situation.gate_of_hell',
      'situation.heavens_cup',
    ]);
    expect(session.projectToClientState('p1').logs.some((entry) => entry.type === 'situation_pre_discard')).toBe(true);
  });

  it('uses event deck draws, reveals Shinto events at action start, and keeps printed event VP', () => {
    const session = createMatchSession({ seed: 20260904, humanPlayerId: 'p1' });
    const shintoEvents = session.state.eventPlacements.filter((event) => event.locationId === 'shinto');

    expect(session.state.eventDeck).toHaveLength(18);
    expect(session.state.eventPlacements).toHaveLength(2);
    expect(shintoEvents.length).toBeGreaterThan(0);
    expect(shintoEvents.every((event) => event.visibility.scope === 'hidden_until_trigger')).toBe(true);
    const controller = session as unknown as { advanceToNextDecision: () => void };
    for (let index = 0; index < 14; index++) controller.advanceToNextDecision();
    const revealedShintoEvents = session.state.eventPlacements.filter((event) => event.locationId === 'shinto');
    expect(session.state.round.activePhase).toBe('action');
    expect(revealedShintoEvents.every((event) => event.visibility.scope === 'public')).toBe(true);
    expect(revealedShintoEvents.every((event) => event.visibility.revealReason === 'action_start')).toBe(true);
    expect(session.state.eventPlacements.every((event) => typeof event.victoryPoints === 'number')).toBe(true);
    expect(session.projectToClientState('p1').logs.some((entry) => entry.type === 'event_revealed')).toBe(true);
  });

  it('recycles the event discard pile when the event deck is exhausted', () => {
    const session = createMatchSession({ seed: 20260904, humanPlayerId: 'p1' });
    const controller = session as unknown as { drawEventCard: (state: typeof session.state) => string | undefined };
    session.state.eventDeck = [];
    session.state.eventDiscardPile = [{
      locationId: 'miyama_town',
      eventCardId: 'event.waxing_moon_ritual.bloody_sunset',
      victoryPoints: 3,
      visibility: { scope: 'public' },
    }];

    const drawn = controller.drawEventCard(session.state);

    expect(drawn).toBe('event.waxing_moon_ritual.bloody_sunset');
    expect(session.state.eventDiscardPile).toEqual([]);
    expect(session.projectToClientState('p1').logs.some((entry) => entry.type === 'event_deck_recycled')).toBe(true);
  });

  it('scores battle VP from all events at that battlefield plus competition VP', () => {
    const session = createMatchSession({ seed: 20260904, humanPlayerId: 'p1' });
    session.state.round.activePhase = 'battle';
    session.state.currentSituationModifiers = [];
    session.state.eventPlacements = [
      { locationId: 'miyama_town', eventCardId: 'event.test.one', victoryPoints: 3, visibility: { scope: 'public' } },
      { locationId: 'miyama_town', eventCardId: 'event.test.two', victoryPoints: 2, visibility: { scope: 'public' } },
    ];
    session.state.players.find((player) => player.id === 'p1')!.locationId = 'miyama_town';
    session.state.players.find((player) => player.id === 'p2')!.locationId = 'miyama_town';
    for (const player of session.state.players.filter((candidate) => !['p1', 'p2'].includes(candidate.id))) {
      player.locationId = 'recon';
    }
    const p1Attack = session.state.cards.find((card) => card.ownerPlayerId === 'p1' && card.definitionId === 'servant.tomoe.skill.sc-tomoe-2')!;
    p1Attack.zone = 'field';
    p1Attack.visibility = { scope: 'public' };
    session.state.abilityRuntime!.cardState[p1Attack.instanceId] = { active: true, faceDown: false, playedRound: 1 };

    const result = resolveBattlefield(session.state, { battlefieldId: 'miyama_town', revealHiddenEvents: true });

    const battle = result.nextState.battleResults.at(-1)!;
    expect(battle.winnerPlayerId).toBe('p1');
    expect(battle.vpReward).toBe(5);
    expect(battle.vpAdjustments).toContainEqual({
      playerId: 'p1',
      delta: 2,
      source: 'competition_vp',
      label: 'miyama_town.competition',
    });
    expect(applyBattleScoring(result.nextState).nextState.players.find((player) => player.id === 'p1')?.vp).toBe(7);
  });

  it('places two events per battlefield in the first two climax rounds and three Miyama events in the final round', () => {
    const session = createMatchSession({ seed: 20260904, humanPlayerId: 'p1' });
    const controller = session as unknown as { startRound: (round: number) => void };

    controller.startRound(9);
    expect(session.state.eventPlacements.filter((event) => event.locationId === 'miyama_town')).toHaveLength(2);
    expect(session.state.eventPlacements.filter((event) => event.locationId === 'shinto')).toHaveLength(2);
    expect(session.state.eventPlacements.filter((event) => event.locationId === 'shinto' && event.visibility.scope === 'hidden_until_trigger')).toHaveLength(1);

    controller.startRound(10);
    expect(session.state.eventPlacements.filter((event) => event.locationId === 'miyama_town')).toHaveLength(2);
    expect(session.state.eventPlacements.filter((event) => event.locationId === 'shinto')).toHaveLength(2);
    expect((session.state as unknown as { modeState?: { deploymentLimitOnly?: Record<string, number> } }).modeState?.deploymentLimitOnly?.magic_workshop).toBe(1);

    controller.startRound(11);
    expect(session.state.eventPlacements.filter((event) => event.locationId === 'miyama_town')).toHaveLength(3);
    expect(session.state.eventPlacements.filter((event) => event.locationId === 'shinto')).toHaveLength(0);
    expect((session.state as unknown as { modeState?: { closedLocations?: string[] } }).modeState?.closedLocations).toContain('shinto');
  });

  it('applies situation noble phantasm forbids through backend legal actions', () => {
    const session = createMatchSession({ seed: 20260904, humanPlayerId: 'p1' });
    const noble = session.state.cards.find((card) => card.ownerPlayerId === 'p1' && card.definitionId === 'servant.tomoe.skill.sc-tomoe-3')!;
    const player = session.state.players.find((candidate) => candidate.id === 'p1')!;
    player.mana = 12;
    session.state.round.prioritySeat = player.seat;

    const legalActions = projectAbilityState(session.state, 'p1').legalActions;

    expect(session.state.currentSituationCardId).toBe('situation.angra_mainyu_shadow');
    expect(legalActions.some((action) => action.type === 'play_card' && action.cardInstanceId === noble.instanceId)).toBe(false);
  });

  it('adds same-attribute situation power in battle breakdowns', () => {
    const session = createMatchSession({ seed: 20260904, humanPlayerId: 'p1' });
    const controller = session as unknown as { startRound: (round: number) => void };
    session.state.situationDeck = ['situation.longing_for_future'];
    controller.startRound(1);
    session.state.round.activePhase = 'battle';
    session.state.eventPlacements = [];
    session.state.players.find((player) => player.id === 'p6')!.locationId = 'miyama_town';
    for (const card of session.state.cards.filter((card) => card.ownerPlayerId === 'p6' && ['servant.kintoki.skill.sc-kintoki-1', 'servant.kintoki.skill.sc-kintoki-2'].includes(card.definitionId))) {
      card.zone = 'field';
      card.visibility = { scope: 'public' };
      session.state.abilityRuntime!.cardState[card.instanceId] = { active: true, faceDown: false, playedRound: 1 };
    }

    const result = resolveBattlefield(session.state, { battlefieldId: 'miyama_town', revealHiddenEvents: true });
    const p6 = result.nextState.battleResults.at(-1)?.participantBreakdowns.find((entry) => entry.playerId === 'p6');

    expect(p6?.modifiers).toContainEqual(expect.objectContaining({
      source: 'situation',
      label: 'situation.longing_for_future.same_attribute',
      value: 3,
    }));
  });

  it('restores a replay checkpoint by id', () => {
    const session = createMatchSession({ seed: 20260904, humanPlayerId: 'p1' });
    const firstCheckpoint = session.projectToClientState('p1').replay[0]!;
    session.runFullMatch({ maxRounds: 1 });

    const restored = session.restoreToCheckpoint(firstCheckpoint.id);

    expect(restored).toBe(true);
    expect(session.projectToClientState('p1').replay).toContainEqual(firstCheckpoint);
    expect(session.projectToClientState('p1').logs.at(-1)?.type).toBe('replay_restored');
  });

  it('runs a three-round event smoke with revealable battle breakdowns', () => {
    const session = createMatchSession({ seed: 20260904, humanPlayerId: 'p1' });
    const reason = session.runFullMatch({ maxRounds: 3 });
    const projected = session.projectToClientState('p1');

    expect(reason).toBe('match_complete');
    expect(projected.round).toBe(3);
    expect(projected.logs.some((entry) => entry.type === 'battle_resolved')).toBe(true);
    expect(projected.battleBreakdowns.some((battle) =>
      battle.participantBreakdowns.some((participant) =>
        participant.modifiers.some((modifier) => modifier.source === 'event'),
      ),
    )).toBe(true);
    expect(projected.replay.length).toBeGreaterThanOrEqual(3);
  });

  it('runs eleven rounds or pauses with an explicit handled reason', () => {
    const session = createMatchSession({ seed: 20260904, humanPlayerId: 'p1' });
    const reason = session.runFullMatch({ maxRounds: 11 });
    const projected = session.projectToClientState('p1');

    expect([
      'match_complete',
      'host_directive',
      'backend_rejection',
      'state_loop',
      'no_legal_action',
    ]).toContain(reason);
    expect(projected.stopReason).toBe(reason);
    if (reason === 'match_complete') {
      expect(projected.finalRanking).toHaveLength(7);
      expect(projected.logs.some((entry) => entry.type === 'final_scoring')).toBe(true);
    }
  });
});
