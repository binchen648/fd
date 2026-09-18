import { createHash } from 'node:crypto';
import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';

import * as rules from '../src/index';
import type { GameState } from '../src/schema/game';
import { createSeededGameState } from '../src/tools/seeded-state';

const F1_COMMIT = '59f145434695d29bdd17e4cb3adc887e84182377';
const REFERENCE_COMMIT = 'b2f9fa15fba07c63530bbf4612b03b8b704755f9';

const members = [
  ['master.iliya.json', 'master.iliya', 'master.iliya.skill.s1', '伊莉雅斯菲尔', '人工生命体', 6, 'iliya.homunculus.initial-mana', '681da5eab6814317aeb7428ffedec22af430a9b4f889ef2950a7f04ef6a12335'],
  ['master.taiga.json', 'master.taiga', 'master.taiga.skill.s1', '藤村大河', '带着她的头号帮手', 3, 'taiga.helper.initial-mana', 'ab00e7ecf418b26b1a697eaede5ef229bfa9ad00707630efd97fd9c1b5352951'],
] as const;

function readArchive(fileName: string): any {
  return JSON.parse(readFileSync(`data/authoring/masters/${fileName}`, 'utf8'));
}
function sha(text: string): string {
  return createHash('sha256').update(text, 'utf8').digest('hex');
}
function setup(fileName: string, ownerId: string, cardId: string, startMana = 4): GameState {
  const pack = rules.loadAuthoringJson(readArchive(fileName));
  expect(pack.report).toEqual([]);
  const state = createSeededGameState({ activeSeats: [1, 2] });
  state.cards = [];
  state.players[0]!.masterCardId = ownerId;
  state.players[0]!.mana = startMana;
  state.players[1]!.mana = 4;
  rules.initializeAbilityRuntime(state, pack, { seed: 20260918 });
  state.cards.push({
    instanceId: `initial-mana:${cardId}`, definitionId: cardId,
    ownerPlayerId: 'p1', controllerPlayerId: 'p1', zone: 'skill',
    visibility: { scope: 'owner_only', ownerPlayerId: 'p1' },
  });
  return state;
}

describe('P3 FB2-25 initial-Mana consumer migration', () => {
  it('contains exactly two standalone canonical master-skill archives with locked static metadata', () => {
    expect(members).toHaveLength(2);
    for (const [fileName, ownerId, cardId, ownerName, skillName] of members) {
      const raw = readArchive(fileName);
      expect(raw).toMatchObject({ schemaVersion: 'fd-card-authoring-v1', archiveType: 'master_skill_card_archive', id: ownerId, name: ownerName, class: 'Master' });
      expect(raw.cards).toHaveLength(1);
      const card = raw.cards[0];
      expect(card).toMatchObject({ id: cardId, name: skillName, aliases: ['s1'], legacyId: 's1', cardType: 'master_skill', owner: { type: 'master', id: ownerId } });
      expect(card.cardFace).toEqual({ typeLabel: '被动', attributes: [], cost: 0, basePower: 0 });
      expect(card.playRequirements).toEqual([]);
      expect(card).not.toHaveProperty('initialPlacement');
      expect(card.phase3Evidence.referenceStaticMetadata).toEqual({ commit: REFERENCE_COMMIT, legacySkillId: 's1', cost: 0, basePower: 0, legacyRequirement: null, typeLabel: '被动' });
    }
  });

  it('preserves exact F1 text hashes, source ability ids, and accepted contract evidence', () => {
    for (const [fileName, , cardId, , , amount, abilityId, expectedSha] of members) {
      const card = readArchive(fileName).cards[0];
      expect(card.id).toBe(cardId);
      expect(sha(card.printedText)).toBe(expectedSha);
      expect(card.phase3Evidence).toMatchObject({
        f1Commit: F1_COMMIT, sourceTextSha256: expectedSha,
        acceptedContracts: { fixedControllerSetMana: 'P3-R22/FB2-05', gameStartFixedSetMana: 'P3-R51/FB2-25' },
      });
      expect(card.phase3Evidence.f1ClauseSources).toContainEqual(expect.objectContaining({ sha256: expectedSha }));
      expect(card.abilities).toHaveLength(1);
      expect(card.abilities[0]).toMatchObject({ id: abilityId, printedClause: card.printedText, effects: [{ type: 'set_mana', player: 'controller', amount }] });
    }
  });

  it('loads both cards blocker-free into only the accepted FB2-25 semantic envelope', () => {
    for (const [fileName, , cardId] of members) {
      const pack = rules.loadAuthoringJson(readArchive(fileName));
      expect(pack.report).toEqual([]);
      const ability = pack.cards[cardId]!.abilities[0]!;
      expect(rules.isGameStartFixedControllerManaSetSemantic(ability)).toBe(true);
      expect(ability.kind).toBe('forced_trigger');
      expect(ability.activation).toEqual({ trigger: 'game_start' });
      expect(ability.conditions).toEqual([]);
      expect(ability.targets).toEqual([]);
      expect(ability.cost).toEqual([]);
      expect(ability.creates).toEqual([]);
      expect(ability.ruleModifiers).toEqual([]);
      expect(ability.lifecycle).toEqual({});
      expect(ability.limit).toEqual({});
      expect(ability.visibility).toEqual({});
      expect(ability.responseWindow).toEqual({ order: 'turn_order', passBehavior: 'decline_this_window' });
      expect(ability.execution).toEqual({ mode: 'automatic', allowedOperations: [] });
    }
  });

  it('sets only controller Mana to the exact frozen target and emits typed evidence', () => {
    for (const [fileName, ownerId, cardId, , , amount] of members) {
      const state = setup(fileName, ownerId, cardId);
      const beforeEvents = state.abilityRuntime!.events.length;
      rules.processAbilityEvent(state, { id: `start:${cardId}`, type: 'game_start' });
      expect(state.players[0]!.mana).toBe(amount);
      expect(state.players[1]!.mana).toBe(4);
      const emitted = state.abilityRuntime!.events.slice(beforeEvents).filter((event) => event.type === 'mana_adjusted');
      expect(emitted).toContainEqual(expect.objectContaining({ controllerId: 'p1', resource: 'mana', before: 4, after: amount, delta: amount - 4 }));
    }
  });

  it('is same-event replay idempotent and keeps the playtest manifest isolated', () => {
    for (const [fileName, ownerId, cardId, , , amount] of members) {
      const state = setup(fileName, ownerId, cardId);
      const event = { id: `replay:${cardId}`, type: 'game_start' as const };
      rules.processAbilityEvent(state, event);
      const snapshot = JSON.stringify(state);
      rules.processAbilityEvent(state, event);
      expect(JSON.stringify(state)).toBe(snapshot);
      expect(state.players[0]!.mana).toBe(amount);
    }
    const manifest = JSON.parse(readFileSync('data/packs/fd-playtest-v1/pack.json', 'utf8'));
    const listed = [...(manifest.authoringMasterFiles ?? []), ...(manifest.authoringMasterSupportFiles ?? [])];
    expect(listed.some((entry: string) => entry.endsWith('/master.iliya.json'))).toBe(false);
    expect(listed.some((entry: string) => entry.endsWith('/master.taiga.json'))).toBe(false);
  });
});
