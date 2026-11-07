import { processAbilityEvent } from '../../src/ability/interpreter';
import { readFileSync } from 'node:fs';
import { createMatchSession } from '../../src/match-session';
import { describe, it, expect } from 'vitest';
import { applyDefeatStatus } from '../../src/phases/battle-phase';
import { restoreMatchSession } from '../../src/match-session';
import { fixture, active, player, playPair, rejectAtomically } from './runtime-convergence/helpers';

describe('A intake A3 real Session ordinary loss versus assigned defeat', () => {
  it('keeps Luck normal loss, first-loss trigger and restored results exactly once', () => {
    const f = fixture('master.shinji.skill.clown');
    const s = f.session;
    s.state.round.activePhase = 'battle';
    const actor = player(s, f.playerId);
    actor.commandSpells = 3;
    const opponent = s.state.players.find(p => p.id !== f.playerId && p.masterCardId !== 'master.olga-marie')!;
    for (const p of s.state.players) p.locationId = 'magic_workshop';
    actor.locationId = opponent.locationId = 'miyama_town';
    const luck = s.state.cards.find(c => c.controllerPlayerId === actor.id && c.definitionId === 'basic.luck')!;
    const attack = s.state.cards.find(c => c.controllerPlayerId === opponent.id && ['hand','deck'].includes(c.zone))!;
    expect(luck).toBeDefined(); expect(attack).toBeDefined();
    attack.definitionId = 'basic.magecraft.5';
    active(s, luck.instanceId); active(s, attack.instanceId);
    const restored = restoreMatchSession(s.serializeSession());
    // Bounded fixture enters the genuine Session settlement method; no synthetic result event.
    (restored as unknown as { resolveBattlePhase(): void }).resolveBattlePhase();
    const result = restored.battleHistory.find(b => b.battlefieldId === 'miyama_town')!;
    expect(result.winnerPlayerIds).toEqual([opponent.id]);
    expect(result.lossEffectSuppressedPlayerIds ?? []).not.toContain(actor.id);
    expect(player(restored, actor.id).commandSpells).toBe(2);
    // An actual winner response may suspend the queue ahead of first-loss.
    for (let step = 0; step < 20 && restored.state.abilityRuntime!.responseWindows.length; step++) {
      const owner = restored.state.players.find(p => restored.getPlayerView(p.id).legalActions.some(a => a.type === 'decline_this_window'))!;
      expect(owner).toBeDefined();
      const decline = restored.getPlayerView(owner.id).legalActions.find(a => a.type === 'decline_this_window')!;
      expect(restored.dispatchPlayerAction(owner.id, decline).ok).toBe(true);
      (restored as unknown as { resolveBattlePhase(): void }).resolveBattlePhase();
    }
    const firstLoss = restored.logs.filter(l => l.type === 'battle_first_loss_event_dispatched' && l.payload?.playerId === actor.id);
    expect(firstLoss).toHaveLength(1);
    const again = restoreMatchSession(restored.serializeSession());
    expect(player(again, actor.id).commandSpells).toBe(2);
    expect(again.battleHistory).toEqual(restored.battleHistory);
    expect(again.logs.filter(l => l.type === 'battle_first_loss_event_dispatched' && l.payload?.playerId === actor.id)).toHaveLength(1);
  });

  it('still blocks assigned defeat only while the declared Luck source is active', () => {
    const f = fixture('master.shinji.skill.clown');
    const luck = f.session.state.cards.find(c => c.controllerPlayerId === f.playerId && c.definitionId === 'basic.luck')!;
    active(f.session, luck.instanceId);
    const immune = applyDefeatStatus(f.session.state, f.playerId);
    expect(immune.players.find(p => p.id === f.playerId)!.statusEffects ?? []).not.toContain('defeated');
    expect(immune.log.at(-1)!.type).toBe('defeat_status_immune');
    f.session.state.abilityRuntime!.cardState[luck.instanceId]!.active = false;
    const ordinary = applyDefeatStatus(f.session.state, f.playerId);
    expect(ordinary.players.find(p => p.id === f.playerId)!.statusEffects).toContain('defeated');
  });
});


describe('Current seven-roster registration audit (not execution credit)', () => {
  it('keeps 14 archives and 94 unique ability identities compiled into the actual Session pack', () => {
    const manifest = JSON.parse(readFileSync('data/packs/fd-playtest-v1/pack.json', 'utf8'));
    const ids = ['master.kayneth','master.shinji','master.kiritsugu','master.maiya','master.gatou','master.irisviel','master.olga-marie',
      'servant.artoriac','servant.drake','servant.achilles','servant.artoria-alt','servant.ereshkigal','servant.tomoe','servant.kintoki'];
    const archives = [...manifest.authoringMasterFiles, ...manifest.authoringServantFiles]
      .map((p: string) => JSON.parse(readFileSync(p, 'utf8'))).filter(a => ids.includes(a.id));
    expect(archives).toHaveLength(14);
    expect(new Set(archives.map(a => a.id)).size).toBe(14);
    const identities = archives.flatMap(a => a.cards.flatMap((c: any) => c.abilities.map((ability: any) => `${a.id}/${c.id}/${ability.id}`)));
    expect(identities).toHaveLength(94);
    expect(new Set(identities).size).toBe(94);
    const runtime = createMatchSession({ seed: 20260907 }).state.abilityRuntime!;
    for (const a of archives) for (const c of a.cards) for (const ability of c.abilities) {
      expect(runtime.pack.cards[c.id]?.abilities.some(b => b.id === ability.id), `${c.id}/${ability.id}`).toBe(true);
    }
    // Generated fallback seals are separate production consumers, outside the 94-row source inventory.
    for (const master of ['kayneth','shinji','kiritsugu','maiya','irisviel']) {
      const d = runtime.pack.cards[`master.${master}.command-spell`];
      expect(d?.cardType).toBe('command_spell');
      for (const id of ['command-spell.gain-mana','command-spell.power-victory','command-spell.free-move']) {
        expect(d!.abilities.some(a => a.id === id)).toBe(true);
      }
    }
  });
});


describe('Live static attribute prohibition reader boundaries', () => {
  function aura(nonSkill = false) {
    const f = fixture('servant.artoria-alt.skill.sc-artoria-alt-2');
    player(f.session, f.playerId).mana = 7;
    playPair(f.session, f.playerId, f.sourceId);
    const target = f.session.state.cards.find(c => c.definitionId === 'servant.ereshkigal.skill.sc-ereshkigal-3')!;
    if (nonSkill) {
      // Typed-schema boundary probe; this is not a newly admitted production card.
      f.session.state.abilityRuntime!.pack.cards[target.definitionId]!.cardType = 'master_deck_card';
      target.zone = 'hand';
    }
    player(f.session, target.controllerPlayerId).locationId = 'miyama_town';
    f.session.state.round.prioritySeat = player(f.session, target.controllerPlayerId).seat;
    expect(f.session.dispatchPlayerAction(target.controllerPlayerId, { type: 'skip_normal_move' }).ok).toBe(true);
    const ability = f.session.state.abilityRuntime!.pack.cards['servant.artoria-alt.skill.sc-artoria-alt-2']!.abilities
      .find(a => a.id === 'sc-artoria-alt-2.forbid-noble-phantasm-when-low-mana')!;
    const offered = () => f.session.getPlayerView(target.controllerPlayerId).legalActions.some(a =>
      a.type === 'stage_attack_card' && a.cardInstanceId === target.instanceId && !a.faceDown);
    return { ...f, target, ability, offered };
  }

  it.each([false, true])('reads current mana and location for a noble, including non-skill=%s', nonSkill => {
    const f = aura(nonSkill);
    expect(f.offered()).toBe(false);
    rejectAtomically(f.session, f.target.controllerPlayerId, { type: 'stage_attack_card', cardInstanceId: f.target.instanceId });
    player(f.session, f.playerId).mana = 8;
    expect(f.offered()).toBe(true);
    player(f.session, f.playerId).mana = 7;
    player(f.session, f.target.controllerPlayerId).locationId = 'shinto';
    expect(f.offered()).toBe(true);
    player(f.session, f.target.controllerPlayerId).locationId = 'miyama_town';
    expect(f.offered()).toBe(false);
    f.session.state.cards.find(c => c.instanceId === f.sourceId)!.zone = 'removed_from_game';
    expect(f.offered()).toBe(true);
  });

  it('does not latch an anonymous modifier after mana rises or widen an unsupported response window', () => {
    const f = aura();
    delete f.ability.ruleModifiers[0]!.id;
    processAbilityEvent(f.session.state, { id: 'anonymous-live-aura', type: 'while_active' });
    expect(f.offered()).toBe(false);
    player(f.session, f.playerId).mana = 8;
    expect(f.offered()).toBe(true);
    player(f.session, f.playerId).mana = 7;
    f.session.state.abilityRuntime!.pack.cards['servant.artoria-alt.skill.sc-artoria-alt-2']!.abilities
      .find(a => a.id === f.ability.id)!.responseWindow.opens = 'unsupported_extra_window';
    expect(f.offered()).toBe(true);
  });

  it.each(['visibility', 'execution', 'response', 'condition'] as const)('does not widen an unsupported %s contract', dimension => {
    const f = aura();
    if (dimension === 'visibility') f.ability.visibility.extra_condition = 'unaccepted';
    if (dimension === 'execution') f.ability.execution.allowedOperations = ['not-allowlisted'] as any;
    if (dimension === 'response') f.ability.responseWindow.opens = 'different_window';
    if (dimension === 'condition') f.ability.conditions[0]!.onlyDefinitionId = 'unaccepted_selector';
    expect(f.offered()).toBe(true);
  });

  it('does not suppress a separate installed ability that reuses a modifier ID', () => {
    const f = aura();
    const r = f.session.state.abilityRuntime!;
    const extra = structuredClone(f.ability);
    extra.id = 'bounded-separate-declared-effect';
    extra.activation = { trigger: 'on_card_played' };
    r.pack.cards['servant.artoria-alt.skill.sc-artoria-alt-2']!.abilities.push(extra);
    r.ongoingEffects.push({ id: 'separate-installed-effect', sourceCardId: f.sourceId, abilityId: extra.id,
      controllerId: f.playerId, starts: 'immediate', duration: 'this_round', startRound: 1,
      expiresAtRound: 2, cleanup: 'expire_after_duration', publicZones: [], ruleModifiers: [{
        sourceCardId: f.sourceId, controllerId: f.playerId, definition: extra.ruleModifiers[0]!,
      }] });
    player(f.session, f.playerId).mana = 8;
    expect(f.offered()).toBe(false);
    r.ongoingEffects = r.ongoingEffects.filter(o => o.id !== 'separate-installed-effect');
    expect(f.offered()).toBe(true);
  });
});
