import { createHash } from 'node:crypto';
import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';

import * as rules from '../src/index';
import type { GameState } from '../src/schema/game';
import { createSeededGameState } from '../src/tools/seeded-state';

const F1_COMMIT = '59f145434695d29bdd17e4cb3adc887e84182377';
const REFERENCE_COMMIT = 'b2f9fa15fba07c63530bbf4612b03b8b704755f9';
const FULL_TEXT_SHA = '29b3f6c71d8bc5eb6f004d930e5b753f44ee766fb2e47ea6b9f0d89f5fa9643f';
const CLAUSE_SHAS = [
  'ee2d737d979d2141319a55ff72d275847a90be89e5173c3f5030e2083d4dc4cb',
  '1e518f04fe63700d7a456ca83de546eb681dd9993f483be7598e5bdac7830b25',
  '0484d7c0b9f4cef66623fdfe67831240d883b04f3203f2acc7e2d6151c2a8217',
  '1f105508aace520b9a8b6703d50633c174f754856c10c4040b05570cfca0b871',
];

const members = [
  ['servant.corday', 'servant.corday.skill.sc-corday-1', 'Assassin', 'sc_corday_1'],
  ['servant.danzou', 'servant.danzou.skill.sc-danzou-3', 'Assassin', 'sc_danzou_3'],
  ['servant.hassan', 'servant.hassan.skill.sc-hassan-1', 'Assassin', 'sc_hassan_1'],
  ['servant.hassanhf', 'servant.hassanhf.skill.sc-hassanhf-3', 'Assassin', 'sc_hassanHF_3'],
  ['servant.hassanser', 'servant.hassanser.skill.sc-hassanser-1', 'Assassin', 'sc_hassanSer_1'],
  ['servant.izou', 'servant.izou.skill.sc-izou-3', 'Assassin', 'sc_izou_3'],
  ['servant.jekyll', 'servant.jekyll.skill.sc-jekyll-3', 'Assassin', 'sc_jekyll_3'],
  ['servant.kama', 'servant.kama.skill.sc-kama-3', 'Assassin', 'sc_kama_3'],
  ['servant.kiritsugu', 'servant.kiritsugu.skill.sc-kiritsugu-1', 'Master', 'sc_kiritsugu_1'],
  ['servant.kotarou', 'servant.kotarou.skill.sc-kotarou-1', 'Assassin', 'sc_kotarou_1'],
  ['servant.semiramis', 'servant.semiramis.skill.sc-semiramis-1', 'Assassin', 'sc_semiramis_1'],
  ['servant.stheno', 'servant.stheno.skill.sc-stheno-1', 'Assassin', 'sc_stheno_1'],
] as const;

function readArchive(ownerId: string): any {
  return JSON.parse(readFileSync(`data/authoring/servants/${ownerId}.json`, 'utf8'));
}
function selectedCard(ownerId: string, cardId: string): any {
  const card = readArchive(ownerId).cards.find((candidate: any) => candidate.id === cardId);
  if (!card) throw new Error(`Missing FM06 card ${cardId}`);
  return card;
}
function sha(value: string): string {
  return createHash('sha256').update(value, 'utf8').digest('hex');
}

function setupRealCorday(): { state: GameState; sourceId: string; cardId: string } {
  const ownerId = 'servant.corday';
  const cardId = 'servant.corday.skill.sc-corday-1';
  const pack = rules.loadAuthoringJson(readArchive(ownerId));
  expect(pack.report).toEqual([]);
  const state = createSeededGameState({ activeSeats: [1, 2, 3] });
  state.cards = [];
  state.round.activePhase = 'battle';
  state.round.prioritySeat = 1;
  for (const player of state.players.slice(0, 3)) player.locationId = 'shinto';
  state.players[0]!.servantCardId = ownerId;
  rules.initializeAbilityRuntime(state, pack, { seed: 20260916 });
  const sourceId = 'fm06-presence-source';
  state.cards.push({
    instanceId: sourceId, definitionId: cardId, ownerPlayerId: 'p1', controllerPlayerId: 'p1',
    zone: 'attack_area', visibility: { scope: 'public' },
  });
  state.abilityRuntime!.cardState[sourceId] = { active: true, faceDown: false, playedRound: state.round.roundNumber };
  return { state, sourceId, cardId };
}

function battle(state: GameState, powers: [number, number, number]) {
  return rules.resolveBattlefield(state, {
    battlefieldId: 'shinto',
    participants: [
      { playerId: 'p1', totalPower: powers[0] },
      { playerId: 'p2', totalPower: powers[1] },
      { playerId: 'p3', totalPower: powers[2] },
    ],
  }).nextState;
}

describe('P3-FM06 exact twelve-member Presence Concealment migration', () => {
  it('preserves exact frozen text, four clause sources, owner class and legacy identity for all twelve', () => {
    expect(new Set(members.map(([, cardId]) => cardId)).size).toBe(12);
    for (const [ownerId, cardId, expectedClass, legacyId] of members) {
      const raw = readArchive(ownerId);
      expect(raw.id).toBe(ownerId);
      expect(raw.class).toBe(expectedClass);
      const card = selectedCard(ownerId, cardId);
      expect(card.legacyId).toBe(legacyId);
      expect(card.aliases).toContain(legacyId);
      expect(sha(card.printedText)).toBe(FULL_TEXT_SHA);
      expect(card.phase3Evidence).toMatchObject({
        f1Commit: F1_COMMIT,
        sourceTextSha256: FULL_TEXT_SHA,
        referenceStaticMetadata: { commit: REFERENCE_COMMIT, legacySkillId: legacyId },
      });
      expect(card.phase3Evidence.f1ClauseSources.map((source: any) => source.sha256)).toEqual(CLAUSE_SHAS);
      expect(card.abilities.map((ability: any) => ability.printedClause).join('\n')).toBe(card.printedText);
    }
  });

  it('preserves locked static metadata and uses only the accepted FB2-12 structural semantic', () => {
    for (const [ownerId, cardId] of members) {
      const card = selectedCard(ownerId, cardId);
      expect(card.cardType).toBe('servant_skill');
      expect(card.cardFace).toMatchObject({ typeLabel: '迅捷', attributes: ['迅捷'], cost: 3, basePower: 4 });
      expect(card.playTiming).toEqual({ phase: 'action', window: 'controller_play_card_window' });
      expect(card.playRequirements).toEqual([{ type: 'skill_zone_mana_at_least', value: 8 }]);
      expect(card.phase3Evidence.referenceStaticMetadata).toMatchObject({ cost: 3, basePower: 4, legacyRequirement: 3, typeLabel: '迅捷' });
      expect(card.phase3Evidence.canonicalSkillZoneManaRequirement).toMatchObject({ value: 8, authority: 'final_rules_9.4' });
      expect(card.phase3Evidence.acceptedContracts).toEqual({ presenceConcealment: 'P3-R35/FB2-12' });

      const pack = rules.loadAuthoringJson(readArchive(ownerId));
      expect(pack.report).toEqual([]);
      const compiled = pack.cards[cardId]!;
      const ability = compiled.abilities.find((candidate) => candidate.id.endsWith('.presence-concealment'))!;
      expect(ability).toBeDefined();
      expect(rules.isPresenceConcealmentAssassinationSemantic(ability)).toBe(true);
      expect(ability).toMatchObject({
        kind: 'optional_trigger',
        activation: { phase: 'combat', trigger: 'after_battle_power_calculated', requiresSourceState: 'active' },
        conditions: [{ type: 'controller_strict_second_battle_power' }],
        effects: [{ type: 'defeat_highest_power_opponents' }],
        responseWindow: { opens: 'post_power_response', order: 'turn_order', passBehavior: 'decline_this_window' },
        limit: { type: 'per_round', uses: 1, scope: 'this_card' },
      });
      expect(ability.targets).toEqual([]);
      expect(ability.cost).toEqual([]);
    }
  });

  it('preserves the existing Semiramis FM05 card while adding Presence Concealment', () => {
    const raw = readArchive('servant.semiramis');
    expect(raw.cards.map((card: any) => card.id)).toEqual([
      'servant.semiramis.skill.sc-semiramis-1',
      'servant.semiramis.skill.sc-semiramis-2',
    ]);
    const pack = rules.loadAuthoringJson(raw);
    expect(pack.report).toEqual([]);
    expect(pack.cards['servant.semiramis.skill.sc-semiramis-2']).toBeDefined();
    expect(pack.cards['servant.semiramis.skill.sc-semiramis-1']).toBeDefined();
  });

  it('uses the final 8-mana skill-zone gate while paying the locked printed cost 3', () => {
    const ownerId = 'servant.corday';
    const cardId = 'servant.corday.skill.sc-corday-1';
    const pack = rules.loadAuthoringJson(readArchive(ownerId));
    const state = createSeededGameState({ activeSeats: [1, 2] });
    state.cards = [];
    state.round.activePhase = 'action';
    state.round.prioritySeat = state.players[0]!.seat;
    rules.initializeAbilityRuntime(state, pack, { seed: 20260916 });
    state.cards.push({
      instanceId: 'fm06-skill-zone-source', definitionId: cardId, ownerPlayerId: 'p1', controllerPlayerId: 'p1',
      zone: 'skill', visibility: { scope: 'owner_only', ownerPlayerId: 'p1' },
    });
    state.abilityRuntime!.cardState['fm06-skill-zone-source'] = { active: false, faceDown: false, playedRound: 0 };

    state.players[0]!.mana = 7;
    expect(rules.getLegalActions(state, 'p1').some((action) => action.type === 'play_card' && action.cardInstanceId === 'fm06-skill-zone-source')).toBe(false);
    state.players[0]!.mana = 8;
    const action = rules.getLegalActions(state, 'p1').find((candidate) => candidate.type === 'play_card' && candidate.cardInstanceId === 'fm06-skill-zone-source')!;
    expect(action).toBeDefined();
    expect(rules.dispatchAbilityCommand(state, 'p1', action).ok).toBe(true);
    expect(state.players[0]!.mana).toBe(5);
  });

  it('runs a real migrated card through the accepted frozen-Power pre-scoring response', () => {
    const { state, sourceId, cardId } = setupRealCorday();
    const pending = battle(state, [5, 10, 10]);
    expect(pending.battleResults).toHaveLength(0);
    const response = rules.getLegalActions(pending, 'p1').find((action) =>
      action.type === 'resolve_response' && action.cardInstanceId === sourceId && action.abilityId === `${cardId.split('.skill.')[1]}.presence-concealment`)!;
    expect(response).toBeDefined();
    expect(rules.dispatchAbilityCommand(pending, 'p1', response).ok).toBe(true);
    const settled = battle(pending, [5, 10, 10]);
    expect(settled.battleResults[0]!.winnerPlayerIds).toEqual(['p1']);
    expect(settled.battleResults[0]!.presenceConcealmentDefeatedPlayerIds).toEqual(['p2', 'p3']);
  });
});
