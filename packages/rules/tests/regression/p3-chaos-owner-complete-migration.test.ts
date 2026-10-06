import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';

import * as rules from '../../src/index';
import { createSeededGameState } from '../../src/tools/seeded-state';

const ROOT = 'master.chaos';
const PATH = 'data/authoring/masters/master.chaos.json';
const ASC = `${ROOT}.skill.ascension`;
const S1 = `${ROOT}.skill.s1`;
const S17 = `${ROOT}.skill.s17`;
const BEASTS = Array.from({ length: 15 }, (_, index) => `${ROOT}.skill.s${index + 2}`);
const IDS = [ASC, S1, S17, ...BEASTS];
const raw = JSON.parse(readFileSync(PATH, 'utf8'));
const loaded = rules.loadAuthoringJson(raw);
const card = (id: string) => loaded.cards[id]!;

describe('P3 Chaos owner-complete migration', () => {
  it('materializes exactly the frozen 18-identity owner scope with locked metadata', () => {
    expect(raw.id).toBe(ROOT);
    expect(raw.name).toBe('尼禄·卡欧斯');
    expect(raw.publicInformation).toEqual({ type: 'master_package', initialMana: 4 });
    expect(raw.cards.map((entry: any) => entry.id).sort()).toEqual([...IDS].sort());
    expect(Object.keys(loaded.cards).sort()).toEqual([...IDS].sort());
    expect(loaded.report.filter((entry) => entry.status === 'unsupported')).toEqual([]);

    expect(card(`${ROOT}.skill.s2`).cardFace).toMatchObject({ typeLabel: '力量', cost: 0, basePower: 0 });
    expect(card(`${ROOT}.skill.s7`).cardFace).toMatchObject({ typeLabel: '力量', cost: 2, basePower: 3 });
    expect(card(`${ROOT}.skill.s15`).cardFace).toMatchObject({ typeLabel: '特殊', cost: 3, basePower: 4 });
    expect(raw.cards.find((entry: any) => entry.id === ASC).initialPlacement).toBe('outside_game');
    for (const id of BEASTS) {
      expect(raw.cards.find((entry: any) => entry.id === id).initialPlacement).toBe('outside_game');
    }
  });

  it('consumes the accepted complete-owner readiness family without identity-specific runtime routes', () => {
    const effects = IDS.flatMap((id) => card(id).abilities.flatMap((ability) => ability.effects));
    expect(effects.map((effect) => effect.type).sort()).toEqual([
      'definition_side_deck_setup',
      'definition_side_deck_mana_draw_rule',
      'definition_side_deck_play_action',
      'source_opponent_count_power',
      'definition_side_deck_discard_for_mana',
      'definition_side_deck_delayed_draw_discard',
      'entering_opponent_power_penalty_round',
      'definition_side_deck_battle_loss_draw',
      'battle_win_vp_swing',
      'defeat_engaged_definition_controller',
      'same_battlefield_definition_power_zero',
      'double_controller_terrain_this_round',
      'definition_side_deck_virtual_command_seal',
      'forward_move_source_power',
      'discard_location_event_by_vp',
      'controller_attribute_power_bonus',
      'unsealed_engaged_opponent_power_penalty',
      'definition_side_deck_discard_all_source_power',
      'definition_side_deck_one_shot_choice',
      'definition_side_deck_unlimited_play',
      'definition_side_deck_pay_mana_draw',
    ].sort());
    expect(card(`${ROOT}.skill.s8`).abilities[0]!.effects[0]).toMatchObject({ requiredControlledDefinitionId: 'basic.preparation' });
    expect(card(`${ROOT}.skill.s9`).abilities[0]!.effects[0]).toMatchObject({ targetDefinitionId: 'basic.luck' });
    expect(card(`${ROOT}.skill.s14`).abilities[0]!.effects[0]).toMatchObject({ attribute: '宝具' });
  });

  it('integrates Chaos exactly once after Celenike in the canonical playtest master sequence', () => {
    const pack = JSON.parse(readFileSync('data/packs/fd-playtest-v1/pack.json', 'utf8'));
    expect(pack.authoringMasterFiles.filter((entry: string) => entry === PATH)).toHaveLength(1);
    const index = pack.authoringMasterFiles.indexOf(PATH);
    expect(pack.authoringMasterFiles[index - 1]).toBe('data/authoring/masters/master.celenike.json');
  });

  it('initializes the canonical 15-definition Beast side deck from the migrated s1 provider', () => {
    const state = createSeededGameState({ activeSeats: [1, 2, 3] });
    state.cards = [];
    rules.initializeAbilityRuntime(state, loaded, { seed: 20261006 });
    state.players[0]!.masterCardId = ROOT;
    const instanceId = 'chaos:s1:p1';
    state.cards.push({
      instanceId,
      definitionId: S1,
      ownerPlayerId: 'p1',
      controllerPlayerId: 'p1',
      zone: 'skill',
      visibility: { scope: 'owner_only', ownerPlayerId: 'p1' },
    } as any);
    state.abilityRuntime!.cardState[instanceId] = { active: false, faceDown: false, playedRound: 1 };
    rules.processAbilityEvent(state, { id: 'chaos-game-start', type: 'game_start', playerId: 'p1' });
    const side = rules.definitionSideDeckState(state, 'p1', 'master.chaos.beasts');
    expect(side?.definitionIds).toEqual(BEASTS);
    expect(side?.drawPile).toHaveLength(15);
    expect(new Set(side?.drawPile)).toHaveLength(15);
    expect(state.cards.filter((entry) => entry.definitionSideDeckKey === 'master.chaos.beasts')).toHaveLength(15);
  });

  it('keeps production runtime authority free of Chaos identity, printed names, and legacy handler routes', () => {
    const production = [
      'packages/rules/src/ability/definition-side-deck-capability.ts',
      'packages/rules/src/ability/interpreter.ts',
      'packages/rules/src/ability/loader.ts',
      'packages/rules/src/match-session.ts',
    ].map((file) => readFileSync(file, 'utf8')).join('\n').toLowerCase();
    for (const needle of ['master.chaos', '尼禄·卡欧斯', '兽王之巢', '争夺令咒', 'core.chaos-']) {
      expect(production).not.toContain(needle.toLowerCase());
    }
  });
});
