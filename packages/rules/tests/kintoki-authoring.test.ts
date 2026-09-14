import { existsSync, readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';
import * as rules from '../src/index';
import { createSeededGameState } from '../src/tools/seeded-state';

const archivePath = 'data/authoring/servants/servant.kintoki.json';
const htmPath = 'chm-extract/坂田金时.htm';
const skill = (n: number) => `servant.kintoki.skill.sc-kintoki-${n}`;
function archive() { return JSON.parse(readFileSync(archivePath, 'utf8')); }
function setup(raw = archive()) {
  const s = createSeededGameState(); s.cards = []; s.round.activePhase = 'action';
  s.players[0]!.mana = 12; s.players[0]!.servantCardId = 'servant.kintoki';
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

describe('Kintoki evidence-backed archive', () => {
  it('preserves three canonical skills, duplicate HTM image evidence, costs and separate play/ability timing', () => {
    expect(existsSync(archivePath), 'Kintoki authoring archive must exist').toBe(true);
    const raw = archive();
    expect(raw.id).toBe('servant.kintoki');
    expect(raw.cards.map((c: { id: string }) => c.id)).toEqual([skill(1), skill(2), skill(3)]);
    expect(raw.cards.map((c: { name: string }) => c.name)).toEqual(['黄金冲击', '黄金冲击', '黄金噬者']);
    expect(raw.cards.map((c: any) => c.cardFace.cost)).toEqual([0, 0, 5]);
    expect(raw.cards.map((c: any) => c.cardFace.basePower)).toEqual([11, 11, 0]);
    const htm = readFileSync(htmPath, 'utf8');
    const imageRefs = [...htm.matchAll(/ScreenShot_2025-11-02_\d+_\d+\.png/g)].map(m => m[0]);
    expect(imageRefs.slice(2, 4)).toEqual([
      'ScreenShot_2025-11-02_112053_949.png',
      'ScreenShot_2025-11-02_112053_949.png',
    ]);
    expect(raw.sources).toContainEqual(expect.objectContaining({
      id: 'chm_duplicate_skill_image',
      type: 'chm_duplicate_image_reference',
      path: 'D:/fd/chm-extract/坂田金时.htm',
    }));
    expect(raw.cards[0].evidence).toContainEqual(expect.objectContaining({ htmImageIndex: 3, duplicateOfHtmImageIndex: 4 }));
    expect(raw.cards[1].evidence).toContainEqual(expect.objectContaining({ htmImageIndex: 4, duplicateOfHtmImageIndex: 3 }));
    expect(raw.cards[0].id).not.toBe(raw.cards[1].id);
    for (const c of raw.cards) {
      expect(c.printedText.length).toBeGreaterThan(30);
      expect(c.evidence.some((e: any) => e.type === 'original_card_image' && existsSync(e.path))).toBe(true);
      expect(c.playTiming).toMatchObject({ phase: 'action', window: 'controller_play_card_window' });
      expect(c.abilities.every((a: any) => c.printedText.includes(a.printedClause))).toBe(true);
    }
  });

  it('reports all Kintoki abilities as automatically executable', () => {
    const raw = archive();
    const pack = rules.loadAuthoringJson(raw);
    expect(pack.report.filter(r => r.status === 'unsupported')).toEqual([]);
    expect(Object.values(pack.cards).every(card => card.mode === 'automatic' && card.abilities.every(a => a.execution.mode === 'automatic'))).toBe(true);
  });

  it('plays Golden Impact once per game and executes supported reveal nodes through the formal entry', () => {
    const s = setup();
    const impact = add(s, skill(1));
    expect(rules.getLegalActions(s, 'p1')).toEqual(expect.arrayContaining([{ type: 'play_card', cardInstanceId: impact }]));
    expect(play(s, impact).ok).toBe(true);
    s.cards.find(c => c.instanceId === impact)!.zone = 'skill';
    expect(play(s, impact).rejection?.code).toBe('card_limit_reached');

    const supportedOnly = archive();
    supportedOnly.cards = [structuredClone(supportedOnly.cards[2])];
    supportedOnly.cards[0].abilities = [supportedOnly.cards[0].abilities[0]];
    supportedOnly.cards[0].verification.implementationStatus = 'complete';
    const revealState = setup(supportedOnly);
    const eater = add(revealState, skill(3));
    expect(rules.getLegalActions(revealState, 'p1')).toEqual(expect.arrayContaining([{ type: 'play_card', cardInstanceId: eater }]));
    expect(play(revealState, eater).ok).toBe(true);
    expect(rules.projectAbilityState(revealState, 'p2').players[0]!.servantPackage?.id).toBe('servant.kintoki');
  });

  it('resolves Golden Eater by collecting targets before paying and counting actual moved Golden Impacts', () => {
    const s = setup();
    s.players[0]!.locationId = 'miyama_town';
    const eater = add(s, skill(3));
    const firstImpact = add(s, skill(1), 'removed_from_game');
    const secondImpact = add(s, skill(2), 'removed_from_game');
    expect(play(s, eater).ok).toBe(true);
    rules.advanceAbilityPhase(s, 'battle');

    let action = rules.getLegalActions(s, 'p1').find(a => a.type === 'activate_ability' && a.cardInstanceId === eater && a.abilityId === 'sc-kintoki-3.golden-eater');
    expect(action).toBeTruthy();
    expect(rules.dispatchAbilityCommand(s, 'p1', { type: 'activate_ability', cardInstanceId: eater, abilityId: 'sc-kintoki-3.golden-eater' }).ok).toBe(true);

    let decision = rules.projectAbilityState(s, 'p1').pendingDecision!;
    expect(decision.candidates).toEqual(expect.arrayContaining([firstImpact, secondImpact]));
    expect(rules.dispatchAbilityCommand(s, 'p1', { type: 'choose_target', decisionId: decision.id, selectedIds: [firstImpact] }).ok).toBe(true);
    expect(s.cards.find(c => c.instanceId === firstImpact)!.zone).toBe('skill');

    decision = rules.projectAbilityState(s, 'p1').pendingDecision!;
    expect(decision.min).toBe(0);
    expect(decision.candidates).toEqual([secondImpact]);
    expect(rules.dispatchAbilityCommand(s, 'p1', { type: 'choose_target', decisionId: decision.id, selectedIds: [secondImpact] }).ok).toBe(true);

    expect(s.cards.find(c => c.instanceId === firstImpact)!.zone).toBe('skill');
    expect(s.cards.find(c => c.instanceId === secondImpact)!.zone).toBe('skill');
    expect(s.players[0]!.mana).toBe(0);
    expect(s.players[0]!.vp).toBe(4);
  });

  it('generates adapter report with correct summary', () => {
    const raw = archive();
    const pack = rules.loadAuthoringJson(raw);
    const report = rules.buildAuthoringAdapterReport(pack, raw, archivePath);
    expect(report.summary.cards).toBe(3);
    expect(report.summary.executableCards).toBe(3);
    expect(report.summary.unsupported).toBe(0);
    expect(report.notes.join(' ')).toContain('HTM 第 3、4 张图片重复');
  });
});
