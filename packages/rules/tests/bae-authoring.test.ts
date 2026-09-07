import { existsSync, readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';
import * as rules from '../src/index';
import { createSeededGameState } from '../src/tools/seeded-state';

const archivePath = 'data/authoring/servants/servant.tomoe.json';
const skill = (n: number) => `servant.tomoe.skill.sc-tomoe-${n}`;
function archive() { return JSON.parse(readFileSync(archivePath, 'utf8')); }
function setup() {
  const raw = archive();
  const s = createSeededGameState(); s.cards = []; s.round.activePhase = 'action';
  s.players[0]!.mana = 12; s.players[0]!.servantCardId = 'servant.tomoe';
  rules.initializeAbilityRuntime(s, rules.loadAuthoringJson(raw), { seed: 42 });
  return s;
}

describe('Tomoe evidence-backed archive', () => {
  it('preserves canonical id, alias, skill order, image text, costs and separate play/ability timing', () => {
    expect(existsSync(archivePath), 'Tomoe authoring archive must exist').toBe(true);
    const raw = archive();
    expect(raw.id).toBe('servant.tomoe');
    expect(raw.aliases).toContain('servant.bae');
    expect(raw.cards.map((c: { id: string }) => c.id)).toEqual([skill(1), skill(2), skill(3)]);
    expect(raw.cards.map((c: { name: string }) => c.name)).toEqual([
      '单独行动（Archer Class）',
      '鬼种之魔',
      '真言·圣观世音菩萨',
    ]);
    expect(raw.cards.map((c: any) => c.evidence.find((e: any) => e.type === 'original_card_image').imageIndexInChmPage))
      .toEqual([3, 2, 4]);
    for (const c of raw.cards) {
      expect(c.printedText.length).toBeGreaterThan(30);
      expect(c.evidence.some((e: any) => e.type === 'original_card_image' && existsSync(e.path))).toBe(true);
      expect(c.evidence.some((e: any) => e.type === 'chm_association' && e.path.endsWith('/巴御前.htm'))).toBe(true);
      expect(c.evidence.every((e: any) => !e.path.includes('巴御前(Saber).htm'))).toBe(true);
      expect(c.playTiming).toMatchObject({ phase: 'action', window: 'controller_play_card_window' });
      expect(c.playRequirements).toContainEqual({ type: 'skill_zone_mana_at_least', value: 8 });
      expect(c.abilities.every((a: any) => c.printedText.includes(a.printedClause))).toBe(true);
    }
  });

  it('reports unsupported abilities for complex mechanics', () => {
    const raw = archive();
    const pack = rules.loadAuthoringJson(raw);
    // All abilities should now be supported
    expect(pack.report.filter(r => r.status === 'unsupported').length).toBe(0);
    expect(pack.report.some(r => r.status === 'text_unconfirmed')).toBe(false);
  });

  it('generates adapter report with correct summary', () => {
    const raw = archive();
    const pack = rules.loadAuthoringJson(raw);
    const report = rules.buildAuthoringAdapterReport(pack, raw, archivePath);
    expect(report.summary.cards).toBe(3);
    // All abilities should now be supported
    expect(report.summary.unsupported).toBe(0);
    expect(report.openQuestions).toEqual(raw.openQuestions);
  });

  it('loads the supported true-name reveal node through the official dispatch entry', () => {
    const s = setup();
    const cardInstanceId = 'tomoe-np';
    s.cards.push({
      instanceId: cardInstanceId,
      definitionId: skill(3),
      ownerPlayerId: 'p1',
      controllerPlayerId: 'p1',
      zone: 'skill',
      visibility: { scope: 'owner_only', ownerPlayerId: 'p1' },
    });
    // Card should now be playable since all abilities are supported
    expect(rules.dispatchAbilityCommand(s, 'p1', { type: 'play_card', cardInstanceId }).ok).toBe(true);

    const raw = archive();
    raw.cards[2].abilities = raw.cards[2].abilities.filter((a: any) => a.id === 'sc-tomoe-3.true-name-release');
    raw.cards[2].verification = { implementationStatus: 'complete' };
    const isolated = setup();
    isolated.abilityRuntime!.pack = rules.loadAuthoringJson(raw);
    isolated.cards.push({
      instanceId: cardInstanceId,
      definitionId: skill(3),
      ownerPlayerId: 'p1',
      controllerPlayerId: 'p1',
      zone: 'skill',
      visibility: { scope: 'owner_only', ownerPlayerId: 'p1' },
    });
    expect(rules.dispatchAbilityCommand(isolated, 'p1', { type: 'play_card', cardInstanceId }).ok).toBe(true);
    expect(rules.projectAbilityState(isolated, 'p2').players[0]!.servantPackage?.id).toBe('servant.tomoe');
  });
});
