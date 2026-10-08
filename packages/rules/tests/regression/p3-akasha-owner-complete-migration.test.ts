import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';
import { loadAuthoringJson } from '../../src/ability/loader';

const ROOT = 'master.akasha';
const IDS = [
  'master.akasha.skill.ascension', 'master.akasha.skill.s1', 'master.akasha.skill.s1a', 'master.akasha.skill.s2',
  'master.akasha.skill.s3', 'master.akasha.skill.s4', 'master.akasha.skill.s5', 'master.akasha.skill.s6',
];
const path = 'data/authoring/masters/master.akasha.json';
const raw = JSON.parse(readFileSync(path, 'utf8'));
const loaded = loadAuthoringJson(raw);
const card = (id: string) => loaded.cards[id]!;

function effectTypes(id: string) {
  return card(id).abilities.flatMap((ability) => ability.effects.map((effect) => effect.type));
}

describe('P3 Akasha owner-complete migration', () => {
  it('materializes exactly the complete frozen eight-identity owner scope', () => {
    expect(raw.id).toBe(ROOT);
    expect(raw.name).toBe('阿卡夏之蛇');
    expect(raw.publicInformation.initialMana).toBe(4);
    expect(raw.cards.map((entry: any) => entry.id).sort()).toEqual([...IDS].sort());
    expect(Object.keys(loaded.cards).sort()).toEqual([...IDS].sort());
    expect(loaded.report.filter((entry) => entry.status === 'unsupported')).toEqual([]);
  });

  it('preserves frozen names and static Overload metadata', () => {
    expect(raw.cards.map((entry: any) => [entry.id, entry.name])).toEqual([
      ['master.akasha.skill.s1', '命理'],
      ['master.akasha.skill.s1a', '无限转生者'],
      ['master.akasha.skill.s2', '转生'],
      ['master.akasha.skill.s3', '米切尔·罗亚·巴尔丹姆杨'],
      ['master.akasha.skill.s4', '艾蕾西亚'],
      ['master.akasha.skill.s5', '远野四季（容器）'],
      ['master.akasha.skill.s6', '过负荷'],
      ['master.akasha.skill.ascension', '最终形态'],
    ]);
    expect(raw.cards.find((entry: any) => entry.id === 'master.akasha.skill.s6').initialPlacement).toBe('outside_game');
    expect(raw.cards.find((entry: any) => entry.id === 'master.akasha.skill.ascension').initialPlacement).toBe('outside_game');
    expect(card('master.akasha.skill.s6').cardFace).toMatchObject({ cost: 1, basePower: 0 });
    expect(card('master.akasha.skill.s6').playRequirements).toEqual([{ type: 'skill_zone_mana_at_least', value: 8 }]);
  });

  it('consumes the accepted identity-free Vessel-cycle and provisioning shapes', () => {
    expect(effectTypes('master.akasha.skill.s1')).toEqual([
      'provision_skill_cards', 'vessel_cycle_game_start_battlefield_provision',
    ]);
    expect(effectTypes('master.akasha.skill.s1a')).toEqual([
      'vessel_cycle_initialize', 'vessel_cycle_schedule_reincarnation',
    ]);
    expect(effectTypes('master.akasha.skill.s2')).toEqual(['vessel_cycle_resolve_reincarnation']);
    expect(effectTypes('master.akasha.skill.s3')).toEqual(['vessel_cycle_recon_vp_bonus']);
    expect(effectTypes('master.akasha.skill.s4')).toEqual(['vessel_cycle_skill_aura']);
    expect(effectTypes('master.akasha.skill.s5')).toEqual([
      'vessel_cycle_definition_play_exception', 'vessel_cycle_double_active_definition_base_power',
    ]);
    expect(effectTypes('master.akasha.skill.s6')).toEqual([
      'append_only_rule', 'vessel_cycle_played_definition_lifecycle', 'vessel_cycle_join_location_definition_cards',
    ]);
    expect(effectTypes('master.akasha.skill.ascension')).toEqual(['vessel_cycle_ascension_round_start']);
  });

  it('keeps the exact s1 authority split and exact target definition', () => {
    const s1 = card('master.akasha.skill.s1');
    expect(s1.abilities[0]!.effects[0]).toEqual({
      type: 'provision_skill_cards', player: 'controller', targetDefinitionIds: ['master.akasha.skill.s6'],
    });
    expect(s1.abilities[1]!.effects[0]).toEqual({
      type: 'vessel_cycle_game_start_battlefield_provision', cycleKey: 'akasha.vessel-cycle',
      targetDefinitionId: 'master.akasha.skill.s6', temporaryAtEachBattlefield: true,
    });
  });

  it('integrates Akasha exactly once in the canonical playtest master sequence', () => {
    const pack = JSON.parse(readFileSync('data/packs/fd-playtest-v1/pack.json', 'utf8'));
    expect(pack.authoringMasterFiles.filter((entry: string) => entry === path)).toHaveLength(1);
    const index = pack.authoringMasterFiles.indexOf(path); expect(index).toBeGreaterThanOrEqual(0); expect(pack.authoringMasterFiles[index + 1]).toBe('data/authoring/masters/master.akiha.json');
  });

  it('does not add Akasha identity routing to production runtime source', () => {
    const files = [
      'packages/rules/src/ability/vessel-cycle-capability.ts',
      'packages/rules/src/ability/interpreter.ts',
      'packages/rules/src/ability/loader.ts',
    ];
    const production = files.map((file) => readFileSync(file, 'utf8')).join('\n');
    for (const needle of ['master.akasha', '阿卡夏', '命理', '无限转生者', '米切尔·罗亚', '艾蕾西亚', '远野四季', '过负荷', 'core.akasha-']) {
      expect(production).not.toContain(needle);
    }
  });
});
