import { createHash } from 'node:crypto';
import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';

import * as rules from '../src/index';
import type { AuthoringPack } from '../src/ability/types';
import type { GameState } from '../src/schema/game';
import { createSeededGameState } from '../src/tools/seeded-state';

const ids = [
  'servant.benkei.skill.sc-benkei-1',
  'servant.bradamante.skill.sc-bradamante-1',
  'servant.brynhildr.skill.sc-brynhildr-1',
  'servant.cu.skill.sc-cu-2',
  'servant.diarmuid.skill.sc-diarmuid-3',
  'servant.donquixote.skill.sc-donquixote-3',
  'servant.enkidu.skill.sc-enkidu-3',
  'servant.jaguarman.skill.sc-jaguarman-1',
  'servant.kagetora.skill.sc-kagetora-3',
  'servant.lishuwen.skill.sc-lishuwen-3',
  'servant.romulus.skill.sc-romulus-3',
  'servant.vlad.skill.sc-vlad-3',
] as const;

const sourceTextSha = '5d3fd4e656083f54831c208f2e7b3c9a4ffd5977776e3a3b5214c868596ca1c0';

function ownerId(cardId: string): string {
  return cardId.split('.skill.')[0]!;
}

function archivePath(cardId: string): string {
  return `data/authoring/servants/${ownerId(cardId)}.json`;
}

function rawArchive(cardId: string): any {
  return JSON.parse(readFileSync(archivePath(cardId), 'utf8'));
}

function loaded(cardId: string): AuthoringPack {
  return rules.loadAuthoringJson(rawArchive(cardId));
}

function setupBenkei(): { state: GameState; sourceId: string; abilityId: string } {
  const cardId = ids[0];
  const pack = loaded(cardId);
  expect(pack.report).toEqual([]);
  const state = createSeededGameState({ activeSeats: [1, 2, 3] });
  state.cards = [];
  state.round.activePhase = 'action';
  state.round.prioritySeat = 1;
  state.players[0]!.locationId = 'miyama_town';
  state.players[1]!.locationId = 'magic_workshop';
  state.players[2]!.locationId = 'magic_workshop';
  rules.initializeAbilityRuntime(state, pack, { seed: 20260916 });
  const sourceId = 'fm02-benkei-source';
  state.cards.push({
    instanceId: sourceId,
    definitionId: cardId,
    ownerPlayerId: 'p1',
    controllerPlayerId: 'p1',
    zone: 'field',
    visibility: { scope: 'public' },
  });
  state.abilityRuntime!.cardState[sourceId] = {
    active: true,
    faceDown: false,
    playedRound: state.round.roundNumber,
  };
  return { state, sourceId, abilityId: pack.cards[cardId]!.abilities[0]!.id };
}

describe('P3-FM02 exact 12-member Movement authoring migration', () => {
  it('contains exactly the authorized 12 minimal archives and no sibling skill cards', () => {
    expect(new Set(ids).size).toBe(12);
    for (const cardId of ids) {
      const raw = rawArchive(cardId);
      expect(raw.id).toBe(ownerId(cardId));
      expect(raw.cards).toHaveLength(1);
      expect(raw.cards[0].id).toBe(cardId);
    }
  });

  it('preserves the frozen F1 source text hash for all 12 identities', () => {
    for (const cardId of ids) {
      const card = rawArchive(cardId).cards[0];
      expect(createHash('sha256').update(card.printedText, 'utf8').digest('hex')).toBe(sourceTextSha);
      expect(card.phase3Evidence.sourceTextSha256).toBe(sourceTextSha);
      expect(card.abilities).toHaveLength(1);
      expect(card.abilities[0].printedClause).toBe(card.printedText);
    }
  });

  it('preserves static card metadata while using the final 8-mana skill-zone requirement', () => {
    for (const cardId of ids) {
      const card = rawArchive(cardId).cards[0];
      expect(card.cardFace.cost).toBe(3);
      expect(card.cardFace.basePower).toBe(5);
      expect(card.cardFace.typeLabel).toBe(card.phase3Evidence.referenceStaticMetadata.typeLabel);
      expect(card.cardFace.attributes).toEqual(card.cardFace.typeLabel.split('/'));
      expect(card.phase3Evidence.referenceStaticMetadata.legacyRequirement).toBe(3);
      expect(card.playRequirements).toContainEqual({ type: 'skill_zone_mana_at_least', value: 8 });
      expect(card.phase3Evidence.canonicalSkillZoneManaRequirement.value).toBe(8);
    }
  });

  it('loads all 12 without adapter blockers and matches only the accepted FB2-09 semantic', () => {
    for (const cardId of ids) {
      const pack = loaded(cardId);
      expect(pack.report).toEqual([]);
      const ability = pack.cards[cardId]!.abilities[0]!;
      expect(rules.isAnyLocationExceptWorkshopMovementCandidate(ability)).toBe(true);
      expect(rules.isAnyLocationExceptWorkshopMovementSemantic(ability)).toBe(true);
      expect(ability.effects).toEqual([{ type: 'move_player', player: 'controller', to: 'destination' }]);
    }
  });

  it('runs a newly migrated Benkei representative end-to-end through typed movement', () => {
    const { state, sourceId, abilityId } = setupBenkei();
    const activation = rules.getLegalActions(state, 'p1').find((action) =>
      action.type === 'activate_ability' && action.cardInstanceId === sourceId && action.abilityId === abilityId);
    expect(activation).toBeDefined();
    expect(rules.dispatchAbilityCommand(state, 'p1', activation!).ok).toBe(true);
    const decision = rules.projectAbilityState(state, 'p1').pendingDecision!;
    expect(decision.candidates).toContain('shinto');
    expect(decision.candidates).not.toContain('miyama_town');
    expect(decision.candidates).not.toContain('magic_workshop');
    const beforeEvents = state.abilityRuntime!.events.length;
    expect(rules.dispatchAbilityCommand(state, 'p1', {
      type: 'choose_target', decisionId: decision.id, selectedIds: ['shinto'],
    }).ok).toBe(true);
    expect(state.players[0]!.locationId).toBe('shinto');
    expect(state.abilityRuntime!.events.slice(beforeEvents)).toContainEqual(expect.objectContaining({
      type: 'effect_resolved', sourceCardId: sourceId, abilityId, resultId: expect.stringContaining('.effects[0]'),
    }));
  });
});
