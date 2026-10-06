import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';

import * as rules from '../../src/index';
import type { GameState } from '../../src/schema/game';
import { createSeededGameState } from '../../src/tools/seeded-state';

const ROOT = 'master.ciel';
const PATH = 'data/authoring/masters/master.ciel.json';
const S1 = `${ROOT}.skill.s1`;
const S1A = `${ROOT}.skill.s1a`;
const S1B = `${ROOT}.skill.s1b`;
const S2 = `${ROOT}.skill.s2`;
const S3 = `${ROOT}.skill.s3`;
const ASC = `${ROOT}.skill.ascension`;
const IDS = [S1, S1A, S1B, S2, S3, ASC];

const raw = JSON.parse(readFileSync(PATH, 'utf8'));
const loaded = rules.loadAuthoringJson(raw);
const card = (id: string) => loaded.cards[id]!;

function addSkill(state: GameState, definitionId: string, active = false) {
  const instanceId = `ciel:${definitionId.split('.').at(-1)}:${state.cards.length}`;
  state.cards.push({
    instanceId,
    definitionId,
    ownerPlayerId: 'p1',
    controllerPlayerId: 'p1',
    zone: 'skill',
    visibility: { scope: 'owner_only', ownerPlayerId: 'p1' },
  } as any);
  state.abilityRuntime!.cardState[instanceId] = {
    active,
    faceDown: false,
    playedRound: state.round.roundNumber,
  };
  return instanceId;
}

function setup() {
  for (const definition of Object.values(loaded.cards) as any[]) definition.ownerId = ROOT;
  const state = createSeededGameState({ activeSeats: [1, 2, 3] });
  state.cards = [];
  rules.initializeAbilityRuntime(state, loaded, { seed: 20261007 });
  state.players[0]!.masterCardId = ROOT;
  return state;
}

describe('P3 Ciel owner-complete migration', () => {
  it('materializes exactly the frozen six-identity owner scope with locked metadata', () => {
    expect(raw.id).toBe(ROOT);
    expect(raw.name).toBe('希耶尔');
    expect(raw.publicInformation).toEqual({ type: 'master_package', initialMana: 4 });
    expect(raw.cards.map((entry: any) => entry.id)).toEqual(IDS);
    expect(Object.keys(loaded.cards).sort()).toEqual([...IDS].sort());
    expect(loaded.report.filter((entry) => entry.status === 'unsupported')).toEqual([]);

    expect(card(S1).cardFace).toMatchObject({ typeLabel: '被动', cost: 0, basePower: 0 });
    expect(card(S1A).cardFace).toMatchObject({ typeLabel: '被动', cost: 0, basePower: 0 });
    expect(card(S1B).cardFace).toMatchObject({ typeLabel: '被动', cost: 0, basePower: 0 });
    expect(card(S2).cardFace).toMatchObject({ typeLabel: '特殊', cost: 1, basePower: 4, attributes: ['特殊'] });
    expect(card(S3).cardFace).toMatchObject({ typeLabel: '力量', cost: 3, basePower: 7, attributes: ['力量'] });
    expect(card(ASC).cardFace).toMatchObject({ typeLabel: '升华技', cost: 0, basePower: 0, attributes: [] });

    expect(raw.cards.find((entry: any) => entry.id === S2).initialPlacement).toBe('outside_game');
    expect(raw.cards.find((entry: any) => entry.id === S3).initialPlacement).toBe('outside_game');
    expect(raw.cards.find((entry: any) => entry.id === ASC).initialPlacement).toBe('outside_game');
    expect(card(S2).playRequirements).toEqual([{ type: 'skill_zone_mana_at_least', value: 0 }]);
    expect(card(S3).playRequirements).toEqual([{ type: 'skill_zone_mana_at_least', value: 8 }]);
  });

  it('wires every Ciel consumer to the synchronized identity-free readiness seams', () => {
    expect(rules.isAcceptedRegularMovementEngagementAbility(card(S1).abilities[0]!)).toBe(true);
    expect(card(S1A).abilities[0]!.effects[0]).toEqual({
      type: 'provision_skill_cards',
      player: 'controller',
      targetDefinitionIds: [S2],
    });
    expect(rules.isAcceptedOpponentRoundVpGainThresholdAbility(card(S1B).abilities[0]!, 'compiled')).toBe(true);
    expect(card(S1B).abilities[0]!.effects[0]).toMatchObject({
      type: 'return_card_by_definition',
      definitionId: S3,
      destination: 'master-skills',
      createIfMissing: true,
      active: false,
    });

    expect(card(S2).abilities[0]!.effects[0]).toEqual({
      type: 'adjust_victory_points',
      player: 'controller',
      amount: { var: 'controller.deployment_bonus' },
    });
    expect(card(S2).abilities[1]!.effects[0]).toEqual({
      type: 'adjust_mana',
      player: 'controller',
      amount: 2,
    });

    expect(card(S3).abilities[0]!.limit).toEqual({ type: 'per_game', uses: 1, scope: 'this_card' });
    expect(rules.isAcceptedNextRoundSituationBenefitSuppressionAbility(card(S3).abilities[1]!, 'compiled')).toBe(true);

    const asc = card(ASC);
    expect(rules.isAcceptedConditionalAdditionalPlayAbility(asc.abilities[0]!)).toBe(true);
    expect(rules.isAcceptedNextRoundSituationBenefitSuppressionAbility(asc.abilities[1]!, 'compiled')).toBe(true);
    expect(rules.isAcceptedConditionalAdditionalPlayAbility(asc.abilities[2]!)).toBe(true);
    expect(asc.abilities[0]!.effects[0]).toEqual({
      type: 'controller_attack_attribute_power_bonus',
      attribute: '力量',
      amount: 4,
    });
    expect(asc.abilities[2]!.effects[0]).toEqual({
      type: 'conditional_definition_additional_play',
      definitionId: S2,
      minimumControllerMana: 8,
      additionalManaCost: 2,
    });
  });

  it('provisions the canonical 火葬式典 definition at game start from s1a', () => {
    const state = setup();
    addSkill(state, S1A);
    expect(state.cards.some((entry) => entry.definitionId === S2)).toBe(false);

    rules.processAbilityEvent(state, { id: 'ciel-game-start', type: 'game_start', playerId: 'p1' });

    const provisioned = state.cards.filter((entry) => entry.definitionId === S2);
    expect(provisioned).toHaveLength(1);
    expect(provisioned[0]).toMatchObject({
      ownerPlayerId: 'p1',
      controllerPlayerId: 'p1',
      zone: 'skill',
    });
    expect(state.abilityRuntime!.cardState[provisioned[0]!.instanceId]).toMatchObject({
      active: false,
      faceDown: false,
    });
  });

  it('applies the exact regular-movement engagement waiver from the migrated s1 provider', () => {
    const state = setup();
    state.players[0]!.locationId = 'miyama_town';
    state.players[1]!.locationId = 'miyama_town';
    state.players[2]!.locationId = 'shinto';
    addSkill(state, S1);

    expect(rules.regularMovementEngagementIgnored(state, 'p1')).toBe(true);
    expect(rules.regularMovementEngagementIgnored(state, 'p2')).toBe(true);

    state.players[2]!.locationId = 'miyama_town';
    expect(rules.regularMovementEngagementIgnored(state, 'p2')).toBe(false);
  });

  it('registers Ciel exactly once after Chaos in the canonical playtest master sequence', () => {
    const pack = JSON.parse(readFileSync('data/packs/fd-playtest-v1/pack.json', 'utf8'));
    expect(pack.authoringMasterFiles.filter((entry: string) => entry === PATH)).toHaveLength(1);
    const index = pack.authoringMasterFiles.indexOf(PATH);
    expect(pack.authoringMasterFiles[index - 1]).toBe('data/authoring/masters/master.chaos.json');
  });

  it('keeps production runtime authority free of Ciel identity and printed-name branches', () => {
    const production = [
      'packages/rules/src/ability/regular-movement-engagement-capability.ts',
      'packages/rules/src/ability/opponent-round-vp-gain-threshold.ts',
      'packages/rules/src/ability/next-round-situation-benefit-suppression.ts',
      'packages/rules/src/ability/conditional-additional-play-capability.ts',
      'packages/rules/src/ability/interpreter.ts',
      'packages/rules/src/core/terrain-advantage.ts',
    ].map((file) => readFileSync(file, 'utf8')).join('\n').toLowerCase();

    for (const needle of ['master.ciel', '希耶尔', '第七圣典', '火葬式典', 'core.ciel-']) {
      expect(production).not.toContain(needle.toLowerCase());
    }
  });
});
