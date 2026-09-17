import { createHash } from 'node:crypto';
import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';

import * as rules from '../src/index';
import type { GameState } from '../src/schema/game';
import { createSeededGameState } from '../src/tools/seeded-state';

const F1_COMMIT = '59f145434695d29bdd17e4cb3adc887e84182377';
const REFERENCE_COMMIT = 'b2f9fa15fba07c63530bbf4612b03b8b704755f9';

const members = [
  ['master.bazett.json', 'master.bazett', 'master.bazett.skill.s1b', 's1b', '9847f0953309d542a783f1553153ccbf2bf08a3c008674caadd067ef2b9e7071'],
  ['master.caules.json', 'master.caules', 'master.caules.skill.s1a', 's1a', '16dc09cc37b8a95665d4fb5301e6048b0be422af19b9836d3fff07d9ef7e3c32'],
  ['master.fiore.json', 'master.fiore', 'master.fiore.skill.s2', 's2', 'e9646624a773a5a21ca08c3d63e072da56126dad075d4842d44faac9a95ec6e9'],
  ['master.fiore.json', 'master.fiore', 'master.fiore.skill.s3', 's3', '01a78c3d1650a32f187bf1b292e15807727370e11928021d7b91e7125ce3c2ac'],
  ['master.fiore.json', 'master.fiore', 'master.fiore.skill.s4', 's4', 'b750f78e112432917ec6c612124040ca6f3c9f9a538943c2daeaea78e536364c'],
  ['master.irisviel.fm08.json', 'master.irisviel', 'master.irisviel.skill.s1', 's1', 'd880afd3807b56ddd0ae4c2ad35829fc7991428aee15438515ade2ade66bf9fd'],
  ['master.peperoncino.json', 'master.peperoncino', 'master.peperoncino.skill.s1a', 's1a', '24da87d334a23689f9ef2d6607cd74ec0e9bfde162a49835f7e453afcd282cb2'],
  ['master.sieg.json', 'master.sieg', 'master.sieg.skill.s1', 's1', '215e0d96a9ee5e00825eb43ceda139f008e0047c9b0195e733f96eaf89d0c089'],
  ['master.waver.json', 'master.waver', 'master.waver.skill.s1', 's1', 'c4004b02a61eb2cefa01526f174f4fb7815644f4267735020b2507177797058f'],
  ['master.zouken.json', 'master.zouken', 'master.zouken.skill.s5', 's5', '1bfe9fda4911dd95b0e6ef1462140b1d7e20cdacdd03df524fae374509bc668f'],
] as const;

function archivePath(fileName: string): string {
  return `data/authoring/masters/${fileName}`;
}
function readArchive(fileName: string): any {
  return JSON.parse(readFileSync(archivePath(fileName), 'utf8'));
}
function findCard(fileName: string, cardId: string): any {
  const found = readArchive(fileName).cards.find((candidate: any) => candidate.id === cardId);
  if (!found) throw new Error(`Missing FM08 card ${cardId}`);
  return found;
}
function sha(text: string): string {
  return createHash('sha256').update(text, 'utf8').digest('hex');
}
function setup(fileName: string, ownerId: string, cardId: string): GameState {
  const pack = rules.loadAuthoringJson(readArchive(fileName));
  expect(pack.report).toEqual([]);
  const state = createSeededGameState({ activeSeats: [1, 2] });
  state.cards = [];
  state.players[0]!.masterCardId = ownerId;
  rules.initializeAbilityRuntime(state, pack, { seed: 20260916 });
  state.cards.push({
    instanceId: `fm08:${cardId}`,
    definitionId: cardId,
    ownerPlayerId: 'p1',
    controllerPlayerId: 'p1',
    zone: 'skill',
    visibility: { scope: 'owner_only', ownerPlayerId: 'p1' },
  });
  rules.processAbilityEvent(state, { id: `fm08-game-start:${cardId}`, type: 'game_start' });
  return state;
}

describe('P3-FM08 exact ten-member game-start RuleOverride migration', () => {
  it('contains exactly the ten authorized canonical IDs with locked owner/static metadata', () => {
    expect(new Set(members.map(([, , cardId]) => cardId)).size).toBe(10);
    expect(members.some(([, , cardId]) => cardId.includes('leonardo'))).toBe(false);
    expect(members.some(([, , cardId]) => cardId.includes('ophelia'))).toBe(false);

    const archiveCards = new Map<string, string[]>();
    for (const [fileName, ownerId, cardId, legacyId] of members) {
      const raw = readArchive(fileName);
      expect(raw.id).toBe(ownerId);
      expect(raw.class).toBe('Master');
      if (!archiveCards.has(fileName)) archiveCards.set(fileName, raw.cards.map((candidate: any) => candidate.id));
      const selected = findCard(fileName, cardId);
      expect(selected.legacyId).toBe(legacyId);
      expect(selected.aliases).toContain(legacyId);
      expect(selected.owner).toEqual({ type: 'master', id: ownerId });
      expect(selected.cardType).toBe('master_skill');
      expect(selected.cardFace).toMatchObject({ typeLabel: '被动', cost: 0, basePower: 0 });
      expect(selected.playRequirements).toEqual([]);
      expect(selected.phase3Evidence.referenceStaticMetadata).toEqual({
        commit: REFERENCE_COMMIT,
        legacySkillId: legacyId,
        cost: 0,
        basePower: 0,
        legacyRequirement: null,
        typeLabel: '被动',
      });
    }
    expect(archiveCards.get('master.fiore.json')).toHaveLength(3);
    for (const [fileName, cardIds] of archiveCards) {
      if (fileName !== 'master.fiore.json') expect(cardIds).toHaveLength(1);
    }
  });

  it('preserves every frozen F1 source text hash and the accepted contract evidence', () => {
    for (const [fileName, , cardId, , expectedSha] of members) {
      const selected = findCard(fileName, cardId);
      expect(sha(selected.printedText)).toBe(expectedSha);
      expect(selected.phase3Evidence).toMatchObject({
        f1Commit: F1_COMMIT,
        sourceTextSha256: expectedSha,
        acceptedContracts: { gameStartRuleOverrides: 'P3-R39/FB2-14' },
      });
      expect(selected.phase3Evidence.f1SourceReferences.length).toBeGreaterThanOrEqual(2);
      expect(selected.phase3Evidence.f1ClauseSources.length).toBeGreaterThanOrEqual(1);
      expect(selected.phase3Evidence.f1ClauseSources.every((source: any) => typeof source.sha256 === 'string' && source.sha256.length === 64)).toBe(true);
    }
  });

  it('loads every real migrated ability blocker-free and maps only to the exact accepted game-start classifier', () => {
    for (const [fileName, , cardId] of members) {
      const pack = rules.loadAuthoringJson(readArchive(fileName));
      expect(pack.report).toEqual([]);
      const ability = pack.cards[cardId]!.abilities[0]!;
      expect(pack.cards[cardId]!.abilities).toHaveLength(1);
      expect(rules.isGameStartRuleOverrideSemantic(ability)).toBe(true);
      expect(ability.kind).toBe('forced_trigger');
      expect(ability.activation).toEqual({ trigger: 'game_start' });
      expect(ability.conditions).toEqual([]);
      expect(ability.targets).toEqual([]);
      expect(ability.cost).toEqual([]);
      expect(ability.creates).toEqual([]);
      expect(ability.ruleModifiers).toEqual([]);
      expect(ability.responseWindow).toEqual({ order: 'turn_order', passBehavior: 'decline_this_window' });
      expect(ability.limit).toEqual({});
      expect(ability.visibility).toEqual({});
      expect(ability.execution).toMatchObject({ mode: 'automatic' });
      expect(ability.effects.every((effect) => rules.isExactGameStartRuleOverrideEffect(effect))).toBe(true);
      expect(ability.effects).toHaveLength(cardId === 'master.fiore.skill.s4' ? 2 : 1);
    }
  });

  it('installs all ten real migrated rule contracts through trusted game_start', () => {
    expect(setup('master.bazett.json', 'master.bazett', 'master.bazett.skill.s1b').ruleOverrides).toMatchObject({ firstLogicalDayTotalPowerAdjustmentByPlayer: { p1: -2 } });
    expect(setup('master.caules.json', 'master.caules', 'master.caules.skill.s1a').ruleOverrides).toMatchObject({ nonClimaxSituationManaGainCapByPlayer: { p1: 1 } });
    expect(setup('master.fiore.json', 'master.fiore', 'master.fiore.skill.s2').ruleOverrides?.movementLockedOwnActionCombatPlayerIds).toContain('p1');
    expect(setup('master.fiore.json', 'master.fiore', 'master.fiore.skill.s3').ruleOverrides).toMatchObject({ roundTotalManaGainCapByPlayer: { p1: { regular: 2, climax: 4 } } });
    expect(setup('master.fiore.json', 'master.fiore', 'master.fiore.skill.s4').ruleOverrides).toMatchObject({
      lowerVpBattleTotalPowerAdjustmentByPlayer: { p1: -2 },
      masterSkillPowerLockIfSituationForbidsByPlayer: { p1: { attribute: '宝具', value: 0 } },
    });
    expect(setup('master.irisviel.fm08.json', 'master.irisviel', 'master.irisviel.skill.s1').ruleOverrides).toMatchObject({ commandSpellPhaseOverrideByPlayer: { p1: 'advance' } });
    expect(setup('master.peperoncino.json', 'master.peperoncino', 'master.peperoncino.skill.s1a').ruleOverrides?.viewOpponentDiscardPlayerIds).toContain('p1');
    expect(setup('master.sieg.json', 'master.sieg', 'master.sieg.skill.s1').ruleOverrides).toMatchObject({ extraAttackPlayAllowanceByManaByPlayer: { p1: { threshold: 11, amount: 1 } } });
    expect(setup('master.waver.json', 'master.waver', 'master.waver.skill.s1').ruleOverrides?.viewFaceDownEventsPlayerIds).toContain('p1');
    expect(setup('master.zouken.json', 'master.zouken', 'master.zouken.skill.s5').ruleOverrides?.ignoreSituationPlayForbidAttributesByPlayer.p1).toContain('宝具');
  });

  it('keeps the pre-existing playtest Irisviel archive untouched while materializing canonical s1 separately', () => {
    const existing = readArchive('master.irisviel.json');
    expect(existing.cards.some((candidate: any) => candidate.id === 'master.irisviel.skill.proxy-master')).toBe(true);
    expect(existing.cards.some((candidate: any) => candidate.id === 'master.irisviel.skill.conversion-magic')).toBe(true);
    const migrated = readArchive('master.irisviel.fm08.json');
    expect(migrated.cards.map((candidate: any) => candidate.id)).toEqual(['master.irisviel.skill.s1']);
  });
});
