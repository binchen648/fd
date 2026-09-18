import { createHash } from 'node:crypto';
import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';

import * as rules from '../src/index';
import type { GameState } from '../src/schema/game';
import { createSeededGameState } from '../src/tools/seeded-state';

const F1_COMMIT = '59f145434695d29bdd17e4cb3adc887e84182377';
const REFERENCE_COMMIT = 'b2f9fa15fba07c63530bbf4612b03b8b704755f9';
const FULL_TEXT_SHA = '33c9377158b49fad67a503f1368f81efa65b97cff870c2331c8ca4ee69937446';
const LINE1_SHA = '553fdbcf7626fff5a498ed55e850e13260030b9c3d911adcbaa43a578a39c2c5';
const LINE2_SHA = '2137380f5f57233a98494f45a9d12a848f3d1cf710101c60462c523ea3f1624f';

const members = [
  ['servant.gilles', 'servant.gilles.skill.sc-gilles-2', 'sc_gilles_2'],
  ['servant.medea', 'servant.medea.skill.sc-medea-2', 'sc_medea_2'],
] as const;

function readArchive(ownerId: string): any {
  return JSON.parse(readFileSync(`data/authoring/servants/${ownerId}.json`, 'utf8'));
}

function sha(value: string): string {
  return createHash('sha256').update(value, 'utf8').digest('hex');
}

function selectedCard(ownerId: string, cardId: string): any {
  const card = readArchive(ownerId).cards.find((candidate: any) => candidate.id === cardId);
  if (!card) throw new Error(`Missing Territory variant card ${cardId}`);
  return card;
}

function setup(ownerId = 'servant.gilles', cardId = 'servant.gilles.skill.sc-gilles-2'): { state: GameState; sourceId: string } {
  const pack = rules.loadAuthoringJson(readArchive(ownerId));
  expect(pack.report).toEqual([]);
  const state = createSeededGameState({ activeSeats: [1, 2] });
  state.cards = [];
  state.players[0]!.servantCardId = ownerId;
  state.players[0]!.locationId = 'magic_workshop';
  state.players[1]!.locationId = 'shinto';
  state.players[0]!.mana = 4;
  state.players[0]!.vp = 1;
  rules.initializeAbilityRuntime(state, pack, { seed: 20260918 });
  const sourceId = 'fm05-territory-variant-source';
  state.cards.push({
    instanceId: sourceId,
    definitionId: cardId,
    ownerPlayerId: 'p1',
    controllerPlayerId: 'p1',
    zone: 'skill',
    visibility: { scope: 'owner_only', ownerPlayerId: 'p1' },
  });
  state.abilityRuntime!.cardState[sourceId] = {
    active: true,
    faceDown: false,
    playedRound: state.round.roundNumber,
  };
  return { state, sourceId };
}

function deploy(state: GameState, id: string, playerId = 'p1', locationId = 'magic_workshop'): void {
  rules.processAbilityEvent(state, {
    id,
    type: 'after_player_deployed_to_battlefield',
    playerId,
    locationId,
  });
}

describe('P3-FM05 Territory Creation typography variant extension', () => {
  it('contains exactly the two dispatched identities with exact frozen source evidence', () => {
    expect(new Set(members.map(([, cardId]) => cardId)).size).toBe(2);
    for (const [ownerId, cardId, legacyId] of members) {
      const archive = readArchive(ownerId);
      expect(archive.id).toBe(ownerId);
      expect(archive.class).toBe('Caster');
      expect(archive.cards).toHaveLength(1);
      const card = selectedCard(ownerId, cardId);
      expect(card.legacyId).toBe(legacyId);
      expect(card.cardType).toBe('servant_skill');
      expect(sha(card.printedText)).toBe(FULL_TEXT_SHA);
      expect(card.phase3Evidence.f1Commit).toBe(F1_COMMIT);
      expect(card.phase3Evidence.sourceTextSha256).toBe(FULL_TEXT_SHA);
      expect(card.phase3Evidence.f1ClauseSources.map((source: any) => source.sha256)).toEqual([LINE1_SHA, LINE2_SHA]);
      expect(card.abilities.map((ability: any) => ability.printedClause).join('\n')).toBe(card.printedText);
    }
  });

  it('reuses the accepted FM05 authoring decomposition without runtime expansion', () => {
    const expectedFormula = {
      op: 'add',
      args: [16, { op: 'multiply', args: [-2, { var: 'game.round_number' }] }],
    };
    for (const [ownerId, cardId] of members) {
      const card = selectedCard(ownerId, cardId);
      expect(card.cardFace).toMatchObject({
        typeLabel: '魔术',
        attributes: ['魔术'],
        cost: 0,
        basePower: { printedExpression: 'X', formula: expectedFormula },
      });
      expect(card.playTiming).toEqual({ phase: 'action', window: 'controller_play_card_window' });
      expect(card.playRequirements).toEqual([{ type: 'skill_zone_mana_at_least', value: 8 }]);
      expect(card.phase3Evidence).toMatchObject({
        referenceStaticMetadata: {
          commit: REFERENCE_COMMIT,
          cost: 0,
          basePower: 2,
          legacyRequirement: 0,
          typeLabel: '魔术',
        },
        canonicalSkillZoneManaRequirement: { value: 8, authority: 'final_rules_9.4' },
        acceptedContracts: {
          roundPower: 'P3-R33/FB2-11',
          deploymentReward: 'P3-R19/FB2-02',
          familyPrecedent: 'P3-R34/FM05',
        },
      });

      const pack = rules.loadAuthoringJson(readArchive(ownerId));
      expect(pack.report).toEqual([]);
      const compiled = pack.cards[cardId];
      expect(compiled).toBeDefined();
      expect(compiled!.abilities).toHaveLength(2);
      const reward = compiled!.abilities.find((ability) => ability.kind === 'forced_trigger');
      expect(reward).toBeDefined();
      expect(rules.isDeploymentResourceRewardSemantic(reward!)).toBe(true);
    }
  });

  it('computes X from authoritative round state as 14/8/2/0', () => {
    const { state, sourceId } = setup();
    for (const [round, expected] of [[1, 14], [4, 8], [7, 2], [8, 0]] as const) {
      state.round.roundNumber = round;
      expect(rules.calculateCardPower(state, sourceId).value).toBe(expected);
    }
  });

  it('settles the accepted Magic Workshop deployment reward and rejects wrong provenance', () => {
    const positive = setup().state;
    deploy(positive, 'territory-variant-positive');
    expect(positive.players[0]).toMatchObject({ mana: 5, vp: 3 });
    expect(positive.abilityRuntime!.events).toEqual(expect.arrayContaining([
      expect.objectContaining({ type: 'mana_adjusted', playerId: 'p1', delta: 1, before: 4, after: 5 }),
      expect.objectContaining({ type: 'victory_points_adjusted', playerId: 'p1', delta: 2, before: 1, after: 3 }),
    ]));

    const wrongLocation = setup().state;
    deploy(wrongLocation, 'territory-variant-wrong-location', 'p1', 'shinto');
    expect(wrongLocation.players[0]).toMatchObject({ mana: 4, vp: 1 });

    const otherPlayer = setup().state;
    deploy(otherPlayer, 'territory-variant-other-player', 'p2', 'magic_workshop');
    expect(otherPlayer.players[0]).toMatchObject({ mana: 4, vp: 1 });
  });
});
