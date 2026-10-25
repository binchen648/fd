import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';

import * as rules from '../../src/index';
import { createSeededGameState } from '../../src/tools/seeded-state';

const members = [
  ['anastasia', 'Caster', 'servant.anastasia.skill.sc-anastasia-1'],
  ['andersen', 'Caster', 'servant.andersen.skill.sc-andersen-1'],
  ['avicebron', 'Caster', 'servant.avicebron.skill.sc-avicebron-3'],
  ['kinggil', 'Caster', 'servant.kinggil.skill.sc-kinggil-1'],
  ['ladyavalon', 'Pretender', 'servant.ladyavalon.skill.sc-ladyavalon-3'],
  ['maxwell', 'Caster', 'servant.maxwell.skill.sc-maxwell-1'],
  ['mephisto', 'Caster', 'servant.mephisto.skill.sc-mephisto-1'],
  ['mozart', 'Caster', 'servant.mozart.skill.sc-mozart-3'],
  ['semiramis', 'Assassin', 'servant.semiramis.skill.sc-semiramis-2'],
  ['shakespeare', 'Caster', 'servant.shakespeare.skill.sc-shakespeare-1'],
] as const;

const printedText = 'X为16-（当前回合数×2）\n残留：当你部署于魔术工房时，获得1点魔力和2点战果。';
const sourceTextSha256 = '295a5b531db5d1031cbbb89dc677e76737b7d3b3c7ca70af59405cc84bd98c58';
const clauseSources = new Set([
  'a65ce56a69bba9214eba95ab30154209228bcd28f7fec21f6317c8a70f421847',
  '2137380f5f57233a98494f45a9d12a848f3d1cf710101c60462c523ea3f1624f',
]);

function archive(name: string): any {
  return JSON.parse(readFileSync(`data/authoring/servants/servant.${name}.json`, 'utf8'));
}

describe('P3-FM05 current-main Territory Creation authoring migration', () => {
  it('contains exactly the canonical ten IDs and preserved source evidence', () => {
    expect(members).toHaveLength(10);
    for (const [name, className, cardId] of members) {
      const raw = archive(name);
      expect(raw.class).toBe(className);
      expect(raw.cards).toHaveLength(1);
      const card = raw.cards[0];
      expect(card.id).toBe(cardId);
      expect(card.printedText).toBe(printedText);
      expect(card.cardFace.cost).toBe(0);
      expect(card.cardFace.typeLabel).toBe('魔术');
      expect(card.cardFace.attributes).toEqual(['魔术']);
      expect(card.playRequirements).toEqual([{ type: 'skill_zone_mana_at_least', value: 8 }]);
      expect(card.phase3Evidence.sourceTextSha256).toBe(sourceTextSha256);
      expect(card.phase3Evidence.f1ClauseSources).toHaveLength(2);
      expect(new Set(card.phase3Evidence.f1ClauseSources.map((x: { sha256: string }) => x.sha256))).toEqual(clauseSources);
    }
  });

  it('preserves the round formula and deployment reward contract without identity routing', () => {
    for (const [name, , cardId] of members) {
      const card = archive(name).cards[0];
      expect(card.cardFace.basePower.formula).toEqual({
        op: 'add', args: [16, { op: 'multiply', args: [-2, { var: 'game.round_number' }] }],
      });
      const reward = card.abilities.find((ability: { id: string }) => ability.id.endsWith('deployment-reward'));
      expect(reward).toMatchObject({
        kind: 'forced_trigger',
        activation: { trigger: 'after_player_deployed_to_battlefield', eventLocationId: 'magic_workshop' },
        execution: { mode: 'automatic' },
      });
      expect(reward.effects).toEqual([
        { type: 'adjust_mana', player: 'controller', amount: 1 },
        { type: 'adjust_victory_points', player: 'controller', amount: 2 },
      ]);
      expect(card.abilities).toHaveLength(2);
      expect(card.id).toBe(cardId);
    }
  });

  it('loads every archive through the canonical authoring loader', () => {
    for (const [name, , cardId] of members) {
      const pack = rules.loadAuthoringJson(archive(name));
      expect(pack.report).toEqual([]);
      expect(pack.cards[cardId]).toBeDefined();
      expect(pack.cards[cardId]!.abilities).toHaveLength(2);
    }
    const raw = archive('anastasia');
    const cardId = 'servant.anastasia.skill.sc-anastasia-1';
    const pack = rules.loadAuthoringJson(raw);
    const state = createSeededGameState({ activeSeats: [1, 2] });
    state.cards = [];
    state.players[0]!.servantCardId = raw.id;
    rules.initializeAbilityRuntime(state, pack, { seed: 20261025 });
    const sourceId = 'fm05-round-formula-source';
    state.cards.push({ instanceId: sourceId, definitionId: cardId, ownerPlayerId: 'p1', controllerPlayerId: 'p1',
      zone: 'attack_area', visibility: { scope: 'public' } });
    state.abilityRuntime!.cardState[sourceId] = { active: true, faceDown: false, playedRound: 1 };
    for (const [round, value] of [[1, 14], [4, 8], [7, 2], [8, 0]] as const) {
      state.round.roundNumber = round;
      expect(rules.calculateCardPower(state, sourceId).value).toBe(value);
    }
  });

  it('uses the shared accepted contract references', () => {
    for (const [name] of members) {
      const evidence = archive(name).cards[0].phase3Evidence;
      expect(evidence.acceptedContracts).toEqual({ roundPower: 'P3-R33/FB2-11', deploymentReward: 'P3-R19/FB2-02' });
    }
  });
});
