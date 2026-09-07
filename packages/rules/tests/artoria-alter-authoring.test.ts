import { existsSync, readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';
import * as rules from '../src/index';
import { createSeededGameState } from '../src/tools/seeded-state';

const archivePath = 'data/authoring/servants/servant.artoria-alt.json';
const oldArchivePath = 'data/authoring/servants/servant.artoria-alter.json';
const skill = (n: number) => `servant.artoria-alt.skill.sc-artoria-alt-${n}`;
function archive() { return JSON.parse(readFileSync(archivePath, 'utf8')); }
function setup() {
  const raw = archive();
  const s = createSeededGameState(); s.cards = []; s.round.activePhase = 'action';
  s.players[0]!.mana = 12; s.players[0]!.servantCardId = 'servant.artoria-alt';
  rules.initializeAbilityRuntime(s, rules.loadAuthoringJson(raw), { seed: 42 });
  return s;
}
function add(s: ReturnType<typeof setup>, definitionId: string, zone = 'hand', owner = 'p1') {
  const instanceId = `c-${s.cards.length}`;
  s.cards.push({ instanceId, definitionId, ownerPlayerId: owner, controllerPlayerId: owner,
    zone, visibility: { scope: 'owner_only', ownerPlayerId: owner } });
  return instanceId;
}

describe('Artoria Alter evidence-backed archive', () => {
  it('preserves canonical ID, aliases, three ordered skills, image text, costs and separate play/ability timing', () => {
    expect(existsSync(archivePath), 'Artoria Alter authoring archive must exist').toBe(true);
    expect(existsSync(oldArchivePath), 'old local-id archive must be removed after canonical rename').toBe(false);
    const raw = archive();
    expect(raw.id).toBe('servant.artoria-alt');
    expect(raw.aliases).toContain('servant.artoria-alter');
    expect(raw.cards.map((c: { id: string }) => c.id)).toEqual([skill(1), skill(2), skill(3)]);
    expect(raw.cards.map((c: { name: string }) => c.name)).toEqual(['誓约胜利之剑', '黑化诅咒', '对魔力（saber class）']);
    expect(raw.cards.map((c: any) => c.aliases)).toEqual([
      expect.arrayContaining(['servant.artoria-alter.skill.sc-artoria-alter-3']),
      expect.arrayContaining(['servant.artoria-alter.skill.sc-artoria-alter-1']),
      expect.arrayContaining(['servant.artoria-alter.skill.sc-artoria-alter-2']),
    ]);
    expect(raw.cards.map((c: { id: string }) => c.id)).toEqual([skill(1), skill(2), skill(3)]);
    for (const c of raw.cards) {
      expect(c.printedText.length).toBeGreaterThan(30);
      expect(c.evidence.some((e: any) => e.type === 'original_card_image' && existsSync(e.path))).toBe(true);
      expect(c.evidence.some((e: any) => e.type === 'chm_association' && e.path.endsWith('阿尔托莉雅·潘德拉贡[Alter.htm') && existsSync(e.path))).toBe(true);
      expect(c.playTiming).toMatchObject({ phase: 'action', window: 'controller_play_card_window' });
      if (c.cardFace.cost > 0) {
        expect(c.playRequirements).toContainEqual({ type: 'skill_zone_mana_at_least', value: 8 });
      }
      expect(c.abilities.every((a: any) => c.printedText.includes(a.printedClause))).toBe(true);
    }
    expect(raw.verification).toMatchObject({
      htmImageOrderStatus: 'reviewed_against_chm',
      canonicalIdStatus: 'matched_main_repo_legacy_content',
      christmasAlterExcluded: true,
    });
  });

  it('reports all abilities as automatically executable', () => {
    const raw = archive();
    const pack = rules.loadAuthoringJson(raw);
    expect(pack.report.filter(r => r.status === 'unsupported')).toEqual([]);
    expect(Object.values(pack.cards).every(card => card.mode === 'automatic' && card.abilities.every(a => a.execution.mode === 'automatic'))).toBe(true);
  });

  it('generates adapter report with correct summary', () => {
    const raw = archive();
    const pack = rules.loadAuthoringJson(raw);
    const report = rules.buildAuthoringAdapterReport(pack, raw, archivePath);
    expect(report.summary.cards).toBe(3);
    expect(report.summary.executableCards).toBe(3);
    expect(report.summary.unsupported).toBe(0);
  });

  it('plays former unsupported cards and still fails closed for unknown requirements', () => {
    const s = setup(); const c = add(s, skill(1), 'skill');
    expect(rules.getLegalActions(s, 'p1')).toEqual(expect.arrayContaining([{ type: 'play_card', cardInstanceId: c }]));
    expect(rules.dispatchAbilityCommand(s, 'p1', { type: 'play_card', cardInstanceId: c }).ok).toBe(true);

    const raw = archive();
    raw.cards[0].playRequirements = [{ type: 'unknown_requirement' }];
    const blocked = setup();
    const blockedCard = add(blocked, skill(1), 'skill');
    blocked.abilityRuntime!.pack = rules.loadAuthoringJson(raw);
    expect(() => rules.getLegalActions(blocked, 'p1')).not.toThrow();
    expect(rules.dispatchAbilityCommand(blocked, 'p1', { type: 'play_card', cardInstanceId: blockedCard }).rejection?.code).toBe('unsupported');

    const playable = setup();
    playable.players[0]!.mana = 4;
    const curse = add(playable, skill(2), 'skill');
    expect(rules.getLegalActions(playable, 'p1')).toEqual(expect.arrayContaining([{ type: 'play_card', cardInstanceId: curse }]));
    expect(rules.dispatchAbilityCommand(playable, 'p1', { type: 'play_card', cardInstanceId: curse }).ok).toBe(true);
  });

  it('keeps supported true-name reveal nodes available on the fully supported card', () => {
    const raw = archive();
    const pack = rules.loadAuthoringJson(raw);
    const reveal = pack.cards[skill(1)]!.abilities.find(a => a.id === 'sc-artoria-alt-1.true-name-release')!;
    expect(reveal.execution.mode).toBe('automatic');
    expect(reveal.visibility).toMatchObject({
      revealsTrueName: true,
      revealTiming: 'on_use_declared',
      revealScope: 'servant_package',
    });
    expect(pack.report.some(r => r.cardId === skill(1) && r.status === 'unsupported')).toBe(false);
  });
});
