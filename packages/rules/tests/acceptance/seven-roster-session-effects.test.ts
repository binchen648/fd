import { describe, expect, it } from 'vitest';
import { advanceAbilityPhase, calculateCardPower, processAbilityEvent } from '../../src/ability/interpreter';
import { projectCurrentPlayerPowers } from '../../src/core/combat-resolver';
import { active, activate, card, choose, dispatch, fixture, playPair, player, rejectAtomically } from './seven-roster-test-helpers';

describe('A-ACCEPT-06 production seven-roster bounded Session witnesses', () => {
  it.each([7, 8])('Alter curse forbids a real same-field opponent noble iff controller mana %i < 8', mana => {
    const { session, playerId, sourceId } = fixture('servant.artoria-alt.skill.sc-artoria-alt-2');
    player(session, playerId).mana = mana;
    playPair(session, playerId, sourceId);
    const noble = session.state.cards.find(c => c.definitionId === 'servant.ereshkigal.skill.sc-ereshkigal-3')!;
    player(session, noble.controllerPlayerId).locationId = 'miyama_town';
    session.state.round.prioritySeat = player(session, noble.controllerPlayerId).seat;
    dispatch(session, noble.controllerPlayerId, { type: 'skip_normal_move' });
    const command = { type: 'stage_attack_card' as const, cardInstanceId: noble.instanceId };
    const offered = session.getPlayerView(noble.controllerPlayerId).legalActions.some(a => a.type === command.type && a.cardInstanceId === noble.instanceId && !a.faceDown);
    expect(offered).toBe(mana >= 8);
    if (mana < 8) rejectAtomically(session, noble.controllerPlayerId, command);
    else dispatch(session, noble.controllerPlayerId, command);
  });

  it.each(['elsewhere', 'inactive', 'face-down'] as const)('Alter curse does not forbid an opponent noble when %s', boundary => {
    const { session, playerId, sourceId } = fixture('servant.artoria-alt.skill.sc-artoria-alt-2');
    player(session, playerId).mana = 7;
    playPair(session, playerId, sourceId);
    const noble = session.state.cards.find(c => c.definitionId === 'servant.ereshkigal.skill.sc-ereshkigal-3')!;
    player(session, noble.controllerPlayerId).locationId = boundary === 'elsewhere' ? 'shinto' : 'miyama_town';
    if (boundary === 'inactive') session.state.abilityRuntime!.cardState[sourceId]!.active = false;
    if (boundary === 'face-down') session.state.abilityRuntime!.cardState[sourceId]!.faceDown = true;
    session.state.round.prioritySeat = player(session, noble.controllerPlayerId).seat;
    dispatch(session, noble.controllerPlayerId, { type: 'skip_normal_move' });
    dispatch(session, noble.controllerPlayerId, { type: 'stage_attack_card', cardInstanceId: noble.instanceId });
  });

  it('Alter low-mana prohibition also rejects a forged direct noble staging command', () => {
    const { session, playerId, sourceId } = fixture('servant.artoria-alt.skill.sc-artoria-alt-2');
    player(session, playerId).mana = 7;
    playPair(session, playerId, sourceId);
    const noble = session.state.cards.find(c => c.definitionId === 'servant.ereshkigal.skill.sc-ereshkigal-3')!;
    player(session, noble.controllerPlayerId).locationId = 'miyama_town';
    session.state.round.prioritySeat = player(session, noble.controllerPlayerId).seat;
    dispatch(session, noble.controllerPlayerId, { type: 'skip_normal_move' });
    rejectAtomically(session, noble.controllerPlayerId, { type: 'stage_attack_card', cardInstanceId: noble.instanceId });
  });

  it.each(['absent', 'same', 'other'] as const)('Eresh blooming handles Protection %s without broadening its printed condition', location => {
    const { session, playerId, sourceId } = fixture('servant.ereshkigal.skill.sc-ereshkigal-3');
    const protection = session.state.cards.find(c => c.definitionId === 'servant.ereshkigal.skill.sc-ereshkigal-2')!;
    if (location !== 'absent') {
      player(session, playerId).locationId = location === 'same' ? 'miyama_town' : 'shinto';
      playPair(session, playerId, protection.instanceId);
      expect((session.state as any).modeState.reversedModifierLocations).toContainEqual(expect.objectContaining({
        sourceControllerId: playerId, locationId: location === 'same' ? 'miyama_town' : 'shinto',
      }));
      // Bounded post-movement starting state. The placement itself comes from
      // real play, NOT a fabricated CardInstance.locationId (which doesn't exist).
      player(session, playerId).locationId = 'miyama_town';
    }
    active(session, sourceId);
    const before = projectCurrentPlayerPowers(session.state, [playerId])[playerId]!;
    activate(session, playerId, sourceId, 'sc-ereshkigal-3.blooming-netherworld');
    if (location === 'absent') expect(card(session, protection.instanceId).zone).toBe('field');
    else expect(projectCurrentPlayerPowers(session.state, [playerId])[playerId]! - before).toBe(location === 'same' ? 6 : 0);
  });

  it('Caster special bonus persists for two rounds, excludes its source and expires on the third', () => {
    const { session, playerId, sourceId } = fixture('servant.artoriac.skill.sc-artoriac-1');
    playPair(session, playerId, sourceId);
    const attack = session.state.cards.find(c => c.controllerPlayerId === playerId && c.definitionId === 'servant.artoriac.skill.sc-artoriac-4')!;
    expect(attack).toBeDefined();
    active(session, attack.instanceId);
    const base = Number(session.state.abilityRuntime!.pack.cards[attack.definitionId]!.cardFace.basePower);
    expect(calculateCardPower(session.state, attack.instanceId).value).toBe(base + 2);
    const sourcePower = calculateCardPower(session.state, sourceId).value;
    advanceAbilityPhase(session.state, 'action', 2);
    expect(calculateCardPower(session.state, attack.instanceId).value).toBe(base + 2);
    expect(calculateCardPower(session.state, sourceId).value).toBe(sourcePower);
    advanceAbilityPhase(session.state, 'action', 3);
    expect(calculateCardPower(session.state, attack.instanceId).value).toBe(base);
  });

  it.each(['discard_hand', 'forbid_skills', 'hide_true_name'])('Achilles Blue Sky executes %s rather than merely listing it', option => {
    const { session, playerId, sourceId } = fixture('servant.achilles.skill.sc-achilles-2');
    active(session, sourceId);
    session.state.abilityRuntime!.revealedServants.push(playerId);
    const opponent = session.state.cards.find(c => c.definitionId === 'servant.ereshkigal.skill.sc-ereshkigal-1')!;
    const opponentId = opponent.controllerPlayerId;
    player(session, opponentId).locationId = 'miyama_town';
    const beforeHand = session.state.cards.filter(c => c.controllerPlayerId === opponentId && c.zone === 'hand').length;
    const beforeMana = player(session, playerId).mana;
    activate(session, playerId, sourceId, 'sc-achilles-2.blue-sky');
    choose(session, playerId, [option]);
    if (option === 'hide_true_name') {
      expect(player(session, playerId).mana).toBe(beforeMana - 3);
      expect(session.state.abilityRuntime!.revealedServants).not.toContain(playerId);
    } else if (option === 'discard_hand') {
      expect(session.state.cards.filter(c => c.controllerPlayerId === opponentId && c.zone === 'hand')).toHaveLength(beforeHand - 1);
    } else {
      session.state.round.prioritySeat = player(session, opponentId).seat;
      dispatch(session, opponentId, { type: 'skip_normal_move' });
      rejectAtomically(session, opponentId, { type: 'stage_attack_card', cardInstanceId: opponent.instanceId });
    }
  });

  it.each([1, 2])('Kintoki Golden Impact copy %i plays below eight and cannot be replayed', copy => {
    const { session, playerId, sourceId } = fixture(`servant.kintoki.skill.sc-kintoki-${copy}`);
    player(session, playerId).mana = 4;
    playPair(session, playerId, sourceId);
    expect(session.state.abilityRuntime!.revealedServants).toContain(playerId);
    card(session, sourceId).zone = 'skill';
    // New round fixture removes ordinary-turn quotas, not the per-game usage record.
    advanceAbilityPhase(session.state, 'action', 2);
    session.state.round.prioritySeat = player(session, playerId).seat;
    dispatch(session, playerId, { type: 'skip_normal_move' });
    player(session, playerId).mana = 4;
    rejectAtomically(session, playerId, { type: 'stage_attack_card', cardInstanceId: sourceId });
  });

  it('Kayneth low-mana exception applies to his servant skill, without waiving its printed cost', () => {
    const { session, playerId } = fixture('master.kayneth.skill.double-master');
    const candidate = session.state.cards.find(c => {
      const d = session.state.abilityRuntime!.pack.cards[c.definitionId];
      return c.controllerPlayerId === playerId && d?.cardType === 'servant_skill' &&
        typeof d.cardFace.cost === 'number' && d.cardFace.cost > 0 && d.cardFace.cost <= 7 &&
        !d.abilities.some(a => a.ruleModifiers.some(m => m.operation === 'ignore' && ['skill_zone_mana_requirement', 'skill_zone_mana_at_least'].includes(String(m.rule))));
    });
    expect(candidate).toBeDefined();
    const cost = Number(session.state.abilityRuntime!.pack.cards[candidate!.definitionId]!.cardFace.cost);
    player(session, playerId).mana = cost - 1;
    rejectAtomically(session, playerId, { type: 'stage_attack_card', cardInstanceId: candidate!.instanceId });
    player(session, playerId).mana = 7;
    dispatch(session, playerId, { type: 'stage_attack_card', cardInstanceId: candidate!.instanceId });
  });

  it.each([0, 1, 4])('Irisviel Conversion Magic discards exactly %i physical hand cards and pays actual count', count => {
    const { session, playerId, sourceId } = fixture('master.irisviel.skill.conversion-magic');
    session.state.round.activePhase = 'advance';
    const own = session.state.cards.filter(c => c.controllerPlayerId === playerId && c.instanceId !== sourceId);
    for (const c of own) if (c.zone === 'hand') c.zone = 'deck';
    const hand = own.filter(c => session.state.abilityRuntime!.pack.cards[c.definitionId]?.cardType !== 'master_skill').slice(0, count);
    for (const c of hand) c.zone = 'hand';
    player(session, playerId).mana = 2;
    activate(session, playerId, sourceId, 'conversion-magic.preparation');
    expect(hand.map(c => card(session, c.instanceId).zone)).toEqual(Array(count).fill('discard'));
    expect(session.state.cards.filter(c => c.controllerPlayerId === playerId && c.zone === 'hand')).toHaveLength(0);
    expect(player(session, playerId).mana).toBe(2 + count);
  });

  it('Irisviel rejects a different player activating her Conversion Magic atomically', () => {
    const { session, playerId, sourceId } = fixture('master.irisviel.skill.conversion-magic');
    const other = session.state.players.find(p => p.id !== playerId)!.id;
    session.state.round.activePhase = 'advance';
    session.state.round.prioritySeat = player(session, other).seat;
    rejectAtomically(session, other, { type: 'activate_ability', cardInstanceId: sourceId, abilityId: 'conversion-magic.preparation' });
  });

  it('Kayneth draws an actual Volumen once in his action window and rejects a duplicate activation', () => {
    const { session, playerId, sourceId } = fixture('master.kayneth.skill.alchemist');
    const count = () => session.state.cards.filter(c => c.controllerPlayerId === playerId && c.definitionId === 'master.kayneth.deck.volumen-hydrargyrum' && c.zone === 'hand').length;
    const before = count();
    activate(session, playerId, sourceId, 'alchemist.draw-volumen');
    expect(count()).toBe(before + 1);
    rejectAtomically(session, playerId, { type: 'activate_ability', cardInstanceId: sourceId, abilityId: 'alchemist.draw-volumen' });
  });

  it.each([0, 1, 2, 3, 4])('Caster star computes power from %i actual Luck cards, capped at fifteen', count => {
    const { session, playerId, sourceId } = fixture('servant.artoriac.skill.sc-artoriac-3');
    expect(session.state.abilityRuntime!.pack.cards['basic.luck']).toBeDefined();
    // Explicit physical-card fixture using a production definition, not a
    // synthetic formula/modifier. Natural acquisition is covered separately.
    for (let i = 0; i < count; i++) session.state.cards.push({
      instanceId: `a06-luck-${i}`, definitionId: 'basic.luck', ownerPlayerId: playerId,
      controllerPlayerId: playerId, zone: 'discard', visibility: { scope: 'owner_only', ownerPlayerId: playerId },
    });
    playPair(session, playerId, sourceId);
    expect(calculateCardPower(session.state, sourceId).value).toBe(Math.min(count * 5, 15));
  });

  it.each([10, 11, 12])('Caster respite distinguishes real mana gain from VP fallback at mana %i', mana => {
    const { session, playerId, sourceId } = fixture('servant.artoriac.skill.sc-artoriac-5');
    active(session, sourceId);
    player(session, playerId).mana = mana;
    const beforeVp = player(session, playerId).vp;
    activate(session, playerId, sourceId, 'sc-artoriac-5.gain-mana-or-vp');
    expect(player(session, playerId).mana).toBe(Math.min(12, mana + 2));
    expect(player(session, playerId).vp).toBe(beforeVp + (mana === 12 ? 2 : 0));
  });

  it.each([0, 1, 3])('Caster staff X=%i pays X and keeps X+2 looked cards private', x => {
    const { session, playerId, sourceId } = fixture('servant.artoriac.skill.sc-artoriac-2');
    playPair(session, playerId, sourceId);
    const before = player(session, playerId).mana;
    dispatch(session, playerId, { type: 'activate_ability', cardInstanceId: sourceId, abilityId: 'sc-artoriac-2.pay-x-look-x-plus-two', variables: { X: x } });
    expect(player(session, playerId).mana).toBe(before - x);
    const decision = session.getPlayerView(playerId).pendingDecision!;
    expect(decision.candidates).toHaveLength(x + 2);
    const other = session.state.players.find(p => p.id !== playerId)!.id;
    expect(session.getPlayerView(other).pendingDecision).toBeUndefined();
    choose(session, playerId, decision.candidates.slice(0, 1));
    expect(card(session, decision.candidates[0]!).zone).toBe('hand');
    expect(decision.candidates.slice(1).every(id => card(session, id).zone === 'discard')).toBe(true);
  });

  it.each([0, 1])('Tomoe first-half condition uses current clockwise order (last=%i)', last => {
    const { session, playerId, sourceId } = fixture('servant.tomoe.skill.sc-tomoe-1');
    active(session, sourceId);
    const seat = player(session, playerId).seat;
    session.state.round.startingSeat = last ? seat % 7 + 1 : seat;
    const command = { type: 'activate_ability' as const, cardInstanceId: sourceId, abilityId: 'sc-tomoe-1.independent-action' };
    if (last) rejectAtomically(session, playerId, command);
    else {
      const vp = player(session, playerId).vp;
      dispatch(session, playerId, command);
      expect(player(session, playerId).vp).toBe(vp + 3);
    }
  });

  it('Shinji enters Miyama through normal movement, gains one mana, and retains his setup book', () => {
    const { session, playerId } = fixture('master.shinji.skill.drain-command');
    advanceAbilityPhase(session.state, 'action', 2);
    session.state.round.prioritySeat = player(session, playerId).seat;
    player(session, playerId).locationId = 'magic_workshop';
    player(session, playerId).mana = 8;
    const move = session.getPlayerView(playerId).legalActions.find(a => a.type === 'normal_move' && a.locationId === 'miyama_town');
    expect(move?.type).toBe('normal_move');
    const paid = move!.type === 'normal_move' ? move!.manaCost : NaN;
    dispatch(session, playerId, move! as any);
    expect(player(session, playerId).mana).toBe(8 - paid + 1);
    expect(session.state.cards).toContainEqual(expect.objectContaining({ definitionId: 'master.shinji.skill.false-attendant-book', ownerPlayerId: playerId }));
  });

  it('Shinji loss trigger removes one of three seals without invoking the excluded empty-seals branch', () => {
    const { session, playerId } = fixture('master.shinji.skill.clown');
    (player(session, playerId) as any).commandSpells = 3;
    processAbilityEvent(session.state, {
      id: 'a06-bounded-shinji-loss', type: 'after_controller_loses_battle', playerId,
      battleResult: { winners: [session.state.players.find(p => p.id !== playerId)!.id], loserIds: [playerId] },
    });
    expect((player(session, playerId) as any).commandSpells).toBe(2);
    expect(player(session, playerId).masterCardId).toBe('master.shinji');
    expect(session.state.log.some(l => l.type === 'replacement_missing_master_asset')).toBe(false);
  });

  it.each(['kayneth', 'shinji', 'kiritsugu', 'maiya', 'gatou', 'irisviel', 'olga-marie'])('master %s command seal restores four mana in its actual phase', master => {
    const { session, playerId, sourceId } = fixture(`master.${master}.command-spell`);
    session.state.round.activePhase = master === 'irisviel' ? 'advance' : 'action';
    player(session, playerId).mana = 4;
    const beforeSeals = Number((player(session, playerId) as any).commandSpells ?? 3);
    activate(session, playerId, sourceId, 'command-spell.gain-mana');
    expect(player(session, playerId).mana).toBe(8);
    expect((player(session, playerId) as any).commandSpells).toBe(beforeSeals - 1);
    expect(player(session, playerId).masterCardId).toBe(`master.${master}`);
  });

  it.each(['kayneth', 'shinji', 'kiritsugu', 'maiya', 'gatou', 'irisviel', 'olga-marie'])('master %s power seal grants two TOTAL power across two attacks', master => {
    const { session, playerId, sourceId } = fixture(`master.${master}.command-spell`);
    session.state.round.activePhase = master === 'irisviel' ? 'advance' : 'action';
    const attacks = session.state.cards.filter(c => c.controllerPlayerId === playerId && c.zone === 'hand').slice(0, 2);
    expect(attacks).toHaveLength(2);
    for (const c of attacks) active(session, c.instanceId);
    const before = projectCurrentPlayerPowers(session.state, [playerId])[playerId]!;
    activate(session, playerId, sourceId, 'command-spell.power-victory');
    expect(projectCurrentPlayerPowers(session.state, [playerId])[playerId]! - before).toBe(2);
  });

  it.each(['kayneth', 'shinji', 'kiritsugu', 'maiya', 'gatou', 'irisviel', 'olga-marie'])('master %s movement seal offers an executable destination, not just a directive', master => {
    const { session, playerId, sourceId } = fixture(`master.${master}.command-spell`);
    session.state.round.activePhase = master === 'irisviel' ? 'advance' : 'action';
    activate(session, playerId, sourceId, 'command-spell.free-move');
    const decision = session.getPlayerView(playerId).pendingDecision;
    expect(decision, 'Automatic free movement must let its player choose a destination').toBeDefined();
    expect(decision!.candidates).toContain('shinto');
    const mana = player(session, playerId).mana;
    choose(session, playerId, ['shinto']);
    expect(player(session, playerId).locationId).toBe('shinto');
    expect(player(session, playerId).mana).toBe(mana);
  });
});
