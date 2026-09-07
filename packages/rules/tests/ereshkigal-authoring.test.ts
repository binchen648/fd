import { existsSync, readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';
import * as rules from '../src/index';
import { createSeededGameState } from '../src/tools/seeded-state';

const archivePath = 'data/authoring/servants/servant.ereshkigal.json';
const skill = (n: number) => `servant.ereshkigal.skill.sc-ereshkigal-${n}`;
function archive() { return JSON.parse(readFileSync(archivePath, 'utf8')); }
function setup() {
  const raw = archive();
  const s = createSeededGameState(); s.cards = []; s.round.activePhase = 'action';
  s.players[0]!.mana = 12; s.players[0]!.servantCardId = 'servant.ereshkigal';
  rules.initializeAbilityRuntime(s, rules.loadAuthoringJson(raw), { seed: 42 });
  return s;
}
function add(s: ReturnType<typeof setup>, definitionId: string, zone = 'skill') {
  const instanceId = `c-${s.cards.length}`;
  s.cards.push({ instanceId, definitionId, ownerPlayerId: 'p1', controllerPlayerId: 'p1',
    zone, visibility: { scope: 'owner_only', ownerPlayerId: 'p1' } });
  return instanceId;
}
function play(s: ReturnType<typeof setup>, cardInstanceId: string) {
  return rules.dispatchAbilityCommand(s, 'p1', { type: 'play_card', cardInstanceId });
}

describe('Ereshkigal evidence-backed archive', () => {
  it('preserves three canonical skills, image text, costs and separate play/ability timing', () => {
    expect(existsSync(archivePath), 'Ereshkigal authoring archive must exist').toBe(true);
    const raw = archive();
    expect(raw.id).toBe('servant.ereshkigal');
    expect(raw.cards.map((c: { id: string }) => c.id)).toEqual([skill(1), skill(2), skill(3)]);
    expect(raw.cards.map((c: { name: string }) => c.name)).toEqual([
      '战斗续行（Lancer Class）',
      '冥界佑护',
      '灵峰踏抱冥府之鞴',
    ]);
    expect(raw.cards.map((c: any) => c.cardFace.cost)).toEqual([3, 0, 7]);
    expect(raw.cards.map((c: any) => c.cardFace.basePower)).toEqual([5, 0, 7]);
    expect(raw.cards.map((c: any) => c.evidence.find((e: any) => e.type === 'original_card_image')?.path)).toEqual([
      'D:/fd/chm-extract/图包/ScreenShot_2025-10-30_192743_490.png',
      'D:/fd/chm-extract/图包/ScreenShot_2025-11-01_111916_240.png',
      'D:/fd/chm-extract/图包/ScreenShot_2025-11-01_111911_088.png',
    ]);
    for (const c of raw.cards) {
      expect(c.printedText.length).toBeGreaterThan(10);
      expect(c.evidence.some((e: any) => e.type === 'original_card_image' && existsSync(e.path))).toBe(true);
      expect(c.playTiming).toMatchObject({ phase: 'action', window: 'controller_play_card_window' });
      expect(c.playRequirements).toContainEqual({ type: 'controller_mana_at_least', value: 8 });
      expect(c.abilities.every((a: any) => c.printedText.includes(a.printedClause))).toBe(true);
    }
  });

  it('records the CHM page image order without importing sibling HTM pages', () => {
    const raw = archive();
    expect(raw.sources.find((s: any) => s.id === 'chm_page')).toMatchObject({
      path: 'D:/fd/chm-extract/埃列什基伽勒.htm',
    });
    expect(JSON.stringify(raw)).not.toContain('埃列什基伽勒1.htm');
    expect(JSON.stringify(raw)).not.toContain('埃列什基伽勒2.htm');
    expect(raw.pageImageOrder).toEqual([
      { role: 'overview', path: 'D:/fd/chm-extract/图包/ScreenShot_2025-11-01_111906_400.png' },
      { role: 'skill', name: '冥界佑护', canonicalCardId: skill(2), path: 'D:/fd/chm-extract/图包/ScreenShot_2025-11-01_111916_240.png' },
      { role: 'skill', name: '战斗续行（Lancer Class）', canonicalCardId: skill(1), path: 'D:/fd/chm-extract/图包/ScreenShot_2025-10-30_192743_490.png' },
      { role: 'skill', name: '灵峰踏抱冥府之鞴', canonicalCardId: skill(3), path: 'D:/fd/chm-extract/图包/ScreenShot_2025-11-01_111911_088.png' },
    ]);
  });

  it('reports all abilities as automatically executable', () => {
    const raw = archive();
    const pack = rules.loadAuthoringJson(raw);
    expect(pack.report.filter(r => r.status === 'unsupported')).toEqual([]);
    expect(Object.values(pack.cards).every(card => card.mode === 'automatic' && card.abilities.every(a => a.execution.mode === 'automatic'))).toBe(true);
  });

  it('plays former unsupported cards and still fails closed for unknown mechanics', () => {
    const s = setup(); const battleContinuation = add(s, skill(1)); const noblePhantasm = add(s, skill(3));
    expect(rules.getLegalActions(s, 'p1')).toEqual(expect.arrayContaining([
      { type: 'play_card', cardInstanceId: battleContinuation },
      { type: 'play_card', cardInstanceId: noblePhantasm },
    ]));
    expect(play(s, battleContinuation).ok).toBe(true);
    expect(play(s, noblePhantasm).ok).toBe(true);

    const raw = archive();
    raw.cards[0].playRequirements = [{ type: 'unknown_requirement' }];
    const blocked = setup(); const blockedCard = add(blocked, skill(1));
    blocked.abilityRuntime!.pack = rules.loadAuthoringJson(raw);
    expect(() => rules.getLegalActions(blocked, 'p1')).not.toThrow();
    expect(play(blocked, blockedCard).rejection?.code).toBe('unsupported');
  });

  it('keeps supported true-name reveal executable through a formal session when isolated from unfinished branches', () => {
    const raw = archive();
    raw.cards = [structuredClone(raw.cards[2])];
    raw.cards[0].verification.implementationStatus = 'complete';
    raw.cards[0].abilities = raw.cards[0].abilities.filter((a: any) => a.id === 'sc-ereshkigal-3.true-name-release');
    const s = createSeededGameState(); s.cards = []; s.round.activePhase = 'action';
    s.players[0]!.mana = 12; s.players[0]!.servantCardId = 'servant.ereshkigal';
    rules.initializeAbilityRuntime(s, rules.loadAuthoringJson(raw), { seed: 42 });
    const c = add(s as ReturnType<typeof setup>, skill(3));
    const session = rules.createAbilitySession(s);
    expect(session.dispatch('p1', { type: 'play_card', cardInstanceId: c }).ok).toBe(true);
    expect(session.view('p2').players[0]!.servantPackage?.id).toBe('servant.ereshkigal');
  });

  it('generates adapter report with correct summary', () => {
    const raw = archive();
    const pack = rules.loadAuthoringJson(raw);
    const report = rules.buildAuthoringAdapterReport(pack, raw, archivePath);
    expect(report.summary.cards).toBe(3);
    expect(report.summary.executableCards).toBe(3);
    expect(report.summary.unsupported).toBe(0);
    expect(report.openQuestions).toEqual(raw.openQuestions);
    expect(report.resolvedQuestions).toEqual(raw.resolvedQuestions);
  });
});
