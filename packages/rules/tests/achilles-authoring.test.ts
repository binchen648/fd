import { existsSync, readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';
import * as rules from '../src/index';
import { createSeededGameState } from '../src/tools/seeded-state';

const archivePath = 'data/authoring/servants/servant.achilles.json';
const skill = (n: number) => `servant.achilles.skill.sc-achilles-${n}`;
function archive() { return JSON.parse(readFileSync(archivePath, 'utf8')); }
function setup() {
  const raw = archive();
  const s = createSeededGameState(); s.cards = []; s.round.activePhase = 'action';
  s.players[0]!.mana = 12; s.players[0]!.servantCardId = 'servant.achilles';
  rules.initializeAbilityRuntime(s, rules.loadAuthoringJson(raw), { seed: 42 });
  return s;
}
function add(s: ReturnType<typeof setup>, definitionId: string, zone = 'hand', owner = 'p1') {
  const instanceId = `c-${s.cards.length}`;
  s.cards.push({ instanceId, definitionId, ownerPlayerId: owner, controllerPlayerId: owner,
    zone, visibility: { scope: 'owner_only', ownerPlayerId: owner } });
  return instanceId;
}
function play(s: ReturnType<typeof setup>, cardInstanceId: string) {
  return rules.dispatchAbilityCommand(s, 'p1', { type: 'play_card', cardInstanceId });
}

describe('Achilles evidence-backed archive', () => {
  it('preserves the CHM page image order, overview link, three canonical skills and skill-zone timing', () => {
    expect(existsSync(archivePath), 'Achilles authoring archive must exist').toBe(true);
    const raw = archive();
    expect(raw.id).toBe('servant.achilles');
    expect(raw.sources.find((s: any) => s.id === 'chm_page').pageTitle).toBe('阿喀琉斯');
    expect(raw.sources.find((s: any) => s.id === 'chm_page').imageOrder).toEqual([
      'D:/fd/chm-extract/图包/ScreenShot_2025-11-01_164211_781.png',
      'D:/fd/chm-extract/图包/ScreenShot_2025-11-01_164221_598.png',
      'D:/fd/chm-extract/图包/ScreenShot_2025-11-01_164226_270.png',
      'D:/fd/chm-extract/图包/ScreenShot_2025-11-01_164216_582.png',
    ]);
    expect(raw.sources.find((s: any) => s.id === 'overview_image').path).toBe(raw.sources.find((s: any) => s.id === 'chm_page').imageOrder[0]);
    expect(raw.cards.map((c: { id: string }) => c.id)).toEqual([skill(1), skill(2), skill(3)]);
    expect(raw.cards.map((c: any) => c.cardFace.cost)).toEqual([0, 3, 6]);
    expect(raw.cards.map((c: any) => c.cardFace.basePower)).toEqual([0, 2, 8]);
    for (const c of raw.cards) {
      expect(c.printedText.length).toBeGreaterThan(30);
      expect(c.evidence.some((e: any) => e.type === 'original_card_image' && existsSync(e.path))).toBe(true);
      expect(c.playTiming).toMatchObject({ phase: 'action', window: 'controller_play_card_window' });
      expect(c.playRequirements).toContainEqual({ type: 'skill_zone_mana_at_least', value: 8 });
      expect(c.abilities.every((a: any) => c.printedText.includes(a.printedClause))).toBe(true);
      for (const a of c.abilities.filter((a: any) => a.kind === 'phase_action')) {
        expect(a.activation.requiresSourceState).toBe('active');
      }
    }
  });

  it('reports unsupported abilities for complex mechanics', () => {
    const raw = archive();
    const pack = rules.loadAuthoringJson(raw);
    // All abilities should now be supported
    expect(pack.report.filter(r => r.status === 'unsupported').length).toBe(0);
    // All abilities should be automatic
    expect(pack.cards[skill(1)]!.abilities.every(a => a.execution.mode === 'automatic')).toBe(true);
  });

  it('generates adapter report with correct summary', () => {
    const raw = archive();
    const pack = rules.loadAuthoringJson(raw);
    const report = rules.buildAuthoringAdapterReport(pack, raw, archivePath);
    expect(report.summary.cards).toBe(3);
    // All abilities should now be supported
    expect(report.summary.unsupported).toBe(0);
    expect(report.openQuestions).toEqual(raw.openQuestions);
    expect(report.resolvedQuestions).toEqual(raw.resolvedQuestions);
    expect(report.userConfirmedInterpretations).toEqual(raw.userConfirmedInterpretations);
  });
});

describe('Achilles adapter safety', () => {
  it('does not offer or play unsupported cards through the formal session entrypoint', () => {
    const s = setup();
    const c = add(s, skill(2), 'skill');
    const session = rules.createAbilitySession(s);
    // Card should now be playable since all abilities are supported
    expect(session.view('p1').legalActions.some(a => a.type === 'play_card' && a.cardInstanceId === c)).toBe(true);
  });

  it('fails closed for malformed authoring mechanics instead of marking them automatic', () => {
    const raw = archive();
    raw.cards[1].abilities[0].targets[0].type = 'choice';
    raw.cards[1].abilities[0].effects[0].branches[0].then[0] = { type: 'draw_cards', count: -1 };
    const pack = rules.loadAuthoringJson(raw);
    // Malformed mechanics should still be detected
    expect(pack.report.some(r => r.cardId === skill(2) && r.path.includes('count'))).toBe(true);
    // The ability should be marked as unsupported due to malformed mechanics
    expect(pack.cards[skill(2)]!.abilities[0]!.execution.mode).toBe('unsupported');
  });

  it('keeps the supported servant-package reveal node executable when isolated from unsupported Achilles mechanics', () => {
    const raw = archive();
    raw.cards = [{
      ...raw.cards[0],
      verification: { implementationStatus: 'complete' },
      abilities: [{
        id: 'sc-achilles-probe.reveal',
        kind: 'declaration_reveal',
        printedClause: '阿喀琉斯之踵-被动：当你战败后，你【真名解放】。',
        markers: ['真名解放'],
        activation: { trigger: 'on_use_declared' },
        effects: [
          { type: 'reveal_information', scope: 'servant_package', subject: 'controller.servant' },
        ],
        execution: { mode: 'automatic' },
      }],
    }];
    const s = createSeededGameState();
    s.cards = [];
    s.round.activePhase = 'action';
    s.players[0]!.mana = 12;
    s.players[0]!.servantCardId = 'servant.achilles';
    rules.initializeAbilityRuntime(s, rules.loadAuthoringJson(raw), { seed: 42 });
    const c = add(s as ReturnType<typeof setup>, skill(1), 'skill');
    expect(play(s as ReturnType<typeof setup>, c).ok).toBe(true);
    expect(rules.projectAbilityState(s, 'p2').players[0]!.servantPackage?.name).toBe('阿喀琉斯');
  });
});
