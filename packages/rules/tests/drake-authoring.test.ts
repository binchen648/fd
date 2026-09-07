import { existsSync, readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';
import * as rules from '../src/index';
import { createSeededGameState } from '../src/tools/seeded-state';

const archivePath = 'data/authoring/servants/servant.drake.json';
const skill = (n: number) => `servant.drake.skill.sc-drake-${n}`;
function archive() { return JSON.parse(readFileSync(archivePath, 'utf8')); }
function setup() {
  const raw = archive();
  // Content-layer fixture: explicit definitions, never guessed from an ID prefix.
  raw.cards.push(...[2, 3, 4].map(power => ({ id: `fixture.basic-${power}`, name: `基础攻击${power}`,
    cardType: 'basic_attack', cardFace: { cost: power, basePower: power },
    playTiming: { phase: 'action', window: 'controller_play_card_window' }, abilities: [] })));
  const s = createSeededGameState(); s.cards = []; s.round.activePhase = 'action';
  s.players[0]!.mana = 12; s.players[0]!.servantCardId = 'servant.drake';
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
function activate(s: ReturnType<typeof setup>, cardInstanceId: string, abilityId: string) {
  return rules.dispatchAbilityCommand(s, 'p1', { type: 'activate_ability', cardInstanceId, abilityId });
}

describe('Drake evidence-backed archive', () => {
  it('preserves three canonical skills, image text, costs and separate play/ability timing', () => {
    expect(existsSync(archivePath), 'Drake authoring archive must exist').toBe(true);
    const raw = archive();
    expect(raw.id).toBe('servant.drake');
    expect(raw.cards.map((c: { id: string }) => c.id)).toEqual([skill(1), skill(2), skill(3)]);
    expect(raw.cards.map((c: any) => c.cardFace.cost)).toEqual([3, 7, 2]);
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
    expect(raw.cards[0].cardFace.basePower).toBe(0);
    expect(raw.cards[1].cardFace.basePower).toBe(13);
    expect(raw.resolvedQuestions).toBeDefined();
    expect(raw.resolvedQuestions.map((q: any) => q.id)).toEqual(expect.arrayContaining(['drake-movement-distance', 'drake-plunder-count', 'drake-battlefield-only']));
    const pack = rules.loadAuthoringJson(raw);
    expect(pack.report.some(r => r.cardId === skill(3) && r.status === 'unsupported')).toBe(false);
  });
  it('retains the confirmed distance examples and non-deduplicated plunder policy', () => {
    const confirmations = archive().userConfirmedInterpretations;
    expect(confirmations).toBeDefined();
    const distance = confirmations.find((c: any) => c.field === 'movement_distance_this_round');
    expect(distance.unit).toBe('route_segment');
    expect(distance.examples).toEqual([
      { from: 'magic_workshop', to: 'miyama_town', distance: 1 },
      { from: 'miyama_town', to: 'shinto', distance: 1 },
      { from: 'shinto', to: 'recon', distance: 1 },
      { from: 'magic_workshop', to: 'shinto', distance: 2 },
      { from: 'magic_workshop', to: 'recon', distance: 3 },
    ]);
    const plunder = confirmations.find((c: any) => c.field === 'battlefields_passed_or_stayed_this_round');
    expect(plunder).toMatchObject({ countRepeatedVisits: true, mergePassAndStay: false });
    expect(archive().cards[2].abilities.filter((a: any) => ['sc-drake-3.movement-power', 'sc-drake-3.plunder'].includes(a.id))
      .every((a: any) => a.execution.mode === 'automatic')).toBe(true);
  });
});

describe('Riding interpreter integration', () => {
  it('plays from skill at 8 mana, draws only with a basic attack in the SAME batch', () => {
    const s = setup(); const riding = add(s, skill(1), 'skill');
    const attack = add(s, 'fixture.basic-2'); const draw = add(s, 'hidden-draw', 'deck');
    s.players[0]!.mana = 7;
    expect(play(s, riding).rejection?.code).toBe('play_requirement');
    s.players[0]!.mana = 8;
    expect(rules).toHaveProperty('playAbilityCardBatch', expect.any(Function));
    rules.playAbilityCardBatch(s, 'p1', [{ cardInstanceId: riding }, { cardInstanceId: attack }]);
    expect(s.players[0]!.mana).toBe(3);
    expect(s.cards.find(c => c.instanceId === draw)!.zone).toBe('hand');
    expect(JSON.stringify(rules.projectAbilityState(s, 'p2'))).not.toContain('hidden-draw');
  });
  it('separate plays do not satisfy played-together and a skill moved to hand has no skill-zone gate', () => {
    const s = setup(); const riding = add(s, skill(1)); const attack = add(s, 'fixture.basic-2');
    const draw = add(s, 'hidden-draw', 'deck'); s.players[0]!.mana = 7;
    expect(play(s, attack).ok).toBe(true); expect(play(s, riding).ok).toBe(true);
    expect(s.cards.find(c => c.instanceId === draw)!.zone).toBe('deck');
  });
  it('selects 0–3 low-base-power hand cards privately and plays them face up with normal aggregate cost', () => {
    const s = setup(); const riding = add(s, skill(1), 'skill');
    const a = add(s, 'fixture.basic-2'); const b = add(s, 'fixture.basic-3');
    const high = add(s, 'fixture.basic-4'); const enemy = add(s, 'fixture.basic-2', 'hand', 'p2');
    expect(play(s, riding).ok).toBe(true);
    expect(activate(s, riding, 'sc-drake-1.mount-summon').ok).toBe(true);
    const d = rules.projectAbilityState(s, 'p1').pendingDecision!;
    expect(d).toMatchObject({ min: 0, max: 3, candidates: [a, b] });
    expect(d.candidates).not.toContain(high); expect(d.candidates).not.toContain(enemy);
    expect(rules.projectAbilityState(s, 'p2').waitingLabel).toBe('等待响应结算');
    expect(rules.dispatchAbilityCommand(s, 'p1', { type: 'choose_target', decisionId: d.id, selectedIds: [a, b] }).ok).toBe(true);
    expect(s.players[0]!.mana).toBe(4);
    expect(s.abilityRuntime!.cardState[a]).toMatchObject({ active: true, faceDown: false });
    expect(s.abilityRuntime!.cardState[b]).toMatchObject({ active: true, faceDown: false });
    expect(activate(s, riding, 'sc-drake-1.mount-summon').ok).toBe(false);
  });
  it('rejects an unaffordable selection atomically and permits choosing zero', () => {
    const s = setup(); const riding = add(s, skill(1), 'skill'); const a = add(s, 'fixture.basic-3');
    const b = add(s, 'fixture.basic-3'); s.players[0]!.mana = 8; play(s, riding);
    expect(activate(s, riding, 'sc-drake-1.mount-summon').ok).toBe(true);
    const d = rules.projectAbilityState(s, 'p1').pendingDecision!; const before = JSON.stringify(s);
    expect(rules.dispatchAbilityCommand(s, 'p1', { type: 'choose_target', decisionId: d.id, selectedIds: [a, b] }).ok).toBe(false);
    expect(JSON.stringify(s)).toBe(before);
    expect(rules.dispatchAbilityCommand(s, 'p1', { type: 'choose_target', decisionId: d.id, selectedIds: [] }).ok).toBe(true);
    expect(s.players[0]!.mana).toBe(5);
  });
  it('draws from a reshuffled discard when the deck is empty, never from another player', () => {
    const s = setup(); const riding = add(s, skill(1), 'skill'); const attack = add(s, 'fixture.basic-2');
    const draw = add(s, 'own-secret', 'discard'); const other = add(s, 'enemy-secret', 'deck', 'p2');
    expect(rules).toHaveProperty('playAbilityCardBatch', expect.any(Function));
    rules.playAbilityCardBatch(s, 'p1', [{ cardInstanceId: riding }, { cardInstanceId: attack }]);
    expect(s.cards.find(c => c.instanceId === draw)!.zone).toBe('hand');
    expect(s.cards.find(c => c.instanceId === other)!.zone).toBe('deck');
  });
});

describe('Golden Hind interpreter integration', () => {
  it.each(['magic_workshop', 'recon'] as const)('never claims event VP at the non-battlefield %s', locationId => {
    const s = setup(); const c = add(s, skill(2), 'skill'); play(s, c);
    s.players[0]!.locationId = locationId;
    // Deliberately malformed placement proves the condition checks location kind, not just presence of an event.
    s.eventPlacements = [{ locationId, eventCardId: 'non-battlefield-event', victoryPoints: 9, visibility: { scope: 'public' } }];
    rules.advanceAbilityPhase(s, 'battle');
    expect(activate(s, c, 'sc-drake-2.reward-and-move').ok).toBe(true);
    expect(s.players[0]!.vp).toBe(locationId === 'recon' ? 2 : 0);
    expect(s.eventPlacements).toHaveLength(1);
    expect(s.eventDiscardPile ?? []).toHaveLength(0);
  });
  it('treats Moon Grail as a battlefield only when the optional location is enabled', () => {
    const s = setup(); const c = add(s, skill(2), 'skill'); play(s, c);
    s.locationConfig.enabledLocationIds = ['moon_holy_grail']; s.players[0]!.locationId = 'moon_holy_grail';
    s.eventPlacements = [{ locationId: 'moon_holy_grail', eventCardId: 'moon-fixture', victoryPoints: 3, visibility: { scope: 'public' } }];
    rules.advanceAbilityPhase(s, 'battle');
    expect(activate(s, c, 'sc-drake-2.reward-and-move').ok).toBe(true);
    expect(s.players[0]!.vp).toBe(3);
    expect(s.eventPlacements).toHaveLength(0);
    expect(setup().locationConfig.enabledLocationIds).not.toContain('moon_holy_grail');
  });
  it('requires prior action play, reveals the servant, and offers its ability only in combat', () => {
    const s = setup(); const c = add(s, skill(2), 'skill');
    expect(activate(s, c, 'sc-drake-2.reward-and-move').ok).toBe(false);
    expect(play(s, c).ok).toBe(true);
    expect(rules.projectAbilityState(s, 'p2').players[0]!.servantPackage?.name).toBe('弗朗西斯·德雷克');
    expect(activate(s, c, 'sc-drake-2.reward-and-move').ok).toBe(false);
    rules.advanceAbilityPhase(s, 'battle');
    expect(play(s, c).ok).toBe(false);
    expect(rules.calculateCardPower(s, c).value).toBe(13);
  });
  it('claims every current battlefield event once, discards them, then moves for free', () => {
    const s = setup(); const c = add(s, skill(2), 'skill'); play(s, c);
    s.players[0]!.locationId = 'miyama_town';
    for (const p of s.players.slice(1)) p.locationId = 'magic_workshop';
    s.eventPlacements = [
      { locationId: 'miyama_town', eventCardId: 'event-a', victoryPoints: 2, visibility: { scope: 'public' } },
      { locationId: 'miyama_town', eventCardId: 'event-b', victoryPoints: 3, visibility: { scope: 'public' } },
      { locationId: 'shinto', eventCardId: 'event-c', victoryPoints: 9, visibility: { scope: 'public' } },
    ];
    rules.advanceAbilityPhase(s, 'battle');
    const result = activate(s, c, 'sc-drake-2.reward-and-move');
    expect(result.ok).toBe(true); expect(s.players[0]!.vp).toBe(5);
    expect(result.calculations).toContainEqual({ label: '当前战场事件牌战果合计', value: 5 });
    expect(s.eventPlacements.map(e => e.eventCardId)).toEqual(['event-c']);
    expect(s.eventDiscardPile?.map(e => e.eventCardId)).toEqual(['event-a', 'event-b']);
    const d = rules.projectAbilityState(s, 'p1').pendingDecision!;
    expect(d.candidates).not.toContain('miyama_town'); expect(d.candidates).not.toContain('moon_holy_grail');
    const mana = s.players[0]!.mana;
    expect(rules.dispatchAbilityCommand(s, 'p1', { type: 'choose_target', decisionId: d.id, selectedIds: ['shinto'] }).ok).toBe(true);
    expect(s.players[0]!.mana).toBe(mana); expect(s.players[0]!.locationId).toBe('shinto');
    expect(activate(s, c, 'sc-drake-2.reward-and-move').ok).toBe(false);
  });
  it('an opponent prevents event reward, but not the subsequent free movement', () => {
    const s = setup(); const c = add(s, skill(2), 'skill'); play(s, c);
    s.players[0]!.locationId = 'miyama_town'; s.players[1]!.locationId = 'miyama_town';
    s.eventPlacements = [{ locationId: 'miyama_town', eventCardId: 'event-a', victoryPoints: 2, visibility: { scope: 'public' } }];
    rules.advanceAbilityPhase(s, 'battle');
    expect(activate(s, c, 'sc-drake-2.reward-and-move').ok).toBe(true);
    expect(s.players[0]!.vp).toBe(0); expect(s.eventPlacements).toHaveLength(1);
    expect(rules.projectAbilityState(s, 'p1').pendingDecision).toBeDefined();
  });
  it('recon grants 2 VP and full/disabled destinations are excluded; off-board is not movement', () => {
    const s = setup(); const c = add(s, skill(2), 'skill'); play(s, c);
    s.players[0]!.locationId = 'recon'; s.ruleOverrides = { occupancyLimitByLocation: { shinto: 0 } };
    rules.advanceAbilityPhase(s, 'battle');
    expect(activate(s, c, 'sc-drake-2.reward-and-move').ok).toBe(true);
    expect(s.players[0]!.vp).toBe(2);
    expect(rules.projectAbilityState(s, 'p1').pendingDecision!.candidates).not.toContain('shinto');
  });
  it('missing event VP fails closed without paying/rewarding/discarding or consuming ability', () => {
    const s = setup(); const c = add(s, skill(2), 'skill'); play(s, c);
    s.players[0]!.locationId = 'miyama_town'; for (const p of s.players.slice(1)) p.locationId = 'magic_workshop';
    s.eventPlacements = [{ locationId: 'miyama_town', eventCardId: 'unknown', visibility: { scope: 'public' } }];
    rules.advanceAbilityPhase(s, 'battle'); const before = JSON.stringify(s);
    expect(activate(s, c, 'sc-drake-2.reward-and-move').rejection?.code).toBe('missing_event_vp');
    expect(JSON.stringify(s)).toBe(before);
  });
});

describe('Drake adapter safety and missing wiring', () => {
  it('does not crash discovery on an unsupported archive condition', () => {
    const s = setup(); const raw = archive();
    raw.cards[0].playRequirements = [{ type: 'unknown_requirement' }];
    s.abilityRuntime!.pack = rules.loadAuthoringJson(raw); const c = add(s, skill(1), 'skill');
    expect(() => rules.getLegalActions(s, 'p1')).not.toThrow();
    expect(play(s, c).rejection?.code).toBe('unsupported');
  });
  it('rejects unbound formula metrics at load time and includes completed low-power Voyager candidates', () => {
    const raw = archive(); raw.cards[0].cardFace.basePower = { var: 'made_up_counter' };
    expect(rules.loadAuthoringJson(raw).report.some(r => r.cardId === skill(1) && r.path.includes('basePower'))).toBe(true);
    const s = setup(); const c = add(s, skill(1), 'skill'); const voyager = add(s, skill(3));
    expect(play(s, c).ok).toBe(true);
    expect(activate(s, c, 'sc-drake-1.mount-summon').ok).toBe(true);
    expect(rules.projectAbilityState(s, 'p1').pendingDecision!.candidates).toContain(voyager);
  });
  it('rejects invalid batch costs and duplicate cards without changing authority', () => {
    const s = setup(); const c = add(s, skill(1), 'skill'); const a = add(s, 'fixture.basic-2');
    const b = add(s, 'fixture.basic-4'); s.players[0]!.mana = 8; const before = JSON.stringify(s);
    expect(() => rules.playAbilityCardBatch(s, 'p1', [{ cardInstanceId: c }, { cardInstanceId: a }, { cardInstanceId: b }])).toThrow();
    expect(JSON.stringify(s)).toBe(before);
    expect(() => rules.playAbilityCardBatch(s, 'p1', [{ cardInstanceId: c }, { cardInstanceId: c }])).toThrow();
    expect(JSON.stringify(s)).toBe(before);
  });
  it('a face-down companion cannot expose its basic identity to trigger Riding', () => {
    const s = setup(); const c = add(s, skill(1), 'skill'); const a = add(s, 'fixture.basic-2');
    const draw = add(s, 'secret', 'deck');
    rules.playAbilityCardBatch(s, 'p1', [{ cardInstanceId: c }, { cardInstanceId: a, faceDown: true }]);
    expect(s.cards.find(c => c.instanceId === draw)!.zone).toBe('deck');
    expect(s.players[0]!.mana).toBe(9);
  });
  it('rechecks destination capacity at submission and prevents off-board teleportation', () => {
    const s = setup(); const c = add(s, skill(2), 'skill'); play(s, c);
    s.players[0]!.locationId = 'miyama_town'; rules.advanceAbilityPhase(s, 'battle');
    expect(activate(s, c, 'sc-drake-2.reward-and-move').ok).toBe(true);
    const d = rules.projectAbilityState(s, 'p1').pendingDecision!;
    s.players[1]!.locationId = 'recon'; const before = JSON.stringify(s);
    expect(rules.dispatchAbilityCommand(s, 'p1', { type: 'choose_target', decisionId: d.id, selectedIds: ['recon'] }).ok).toBe(false);
    expect(JSON.stringify(s)).toBe(before);
    const off = setup(); const oc = add(off, skill(2), 'skill'); play(off, oc); rules.advanceAbilityPhase(off, 'battle');
    const offBefore = JSON.stringify(off);
    expect(activate(off, oc, 'sc-drake-2.reward-and-move').ok).toBe(false);
    expect(JSON.stringify(off)).toBe(offBefore);
  });
  it('keeps authoritative event VP through the scheduled draw pipeline, including zero', () => {
    const s = setup(); s.round.activePhase = 'round_end';
    s.contentRuntime = { situations: [], eventDraws: [
      { round: 2, locationId: 'miyama_town', eventCardId: 'zero-vp', victoryPoints: 0 },
      { round: 2, locationId: 'shinto', eventCardId: 'three-vp', victoryPoints: 3 },
    ] };
    const next = rules.stepGameLoop(s).nextState;
    expect(next.eventPlacements.map(e => e.victoryPoints)).toEqual([0, 3]);
  });
  it('offers Voyager after movement metrics are owned by ability runtime and rejects fabricated client metrics', () => {
    const s = setup(); const c = add(s, skill(3), 'skill');
    expect(rules.getLegalActions(s, 'p1').some(a => a.type === 'play_card' && a.cardInstanceId === c)).toBe(true);
    const before = JSON.stringify(s);
    expect(rules.dispatchAbilityCommand(s, 'p1', { type: 'set_movement_distance', value: 999 } as never).ok).toBe(false);
    expect(JSON.stringify(s)).toBe(before);
  });
  it('rejects malformed new mechanics instead of marking them automatic', () => {
    const raw = archive();
    raw.cards[0].abilities[0].effects[0].count = -1;
    raw.cards[0].abilities[1].effects[0].target = 'undeclared_target';
    raw.cards[0].abilities[1].targets[0].constraints[0].value = 'three';
    raw.cards[1].abilities[1].targets[0].constraints.push({ type: 'has_attribute', attribute: '特殊' });
    const pack = rules.loadAuthoringJson(raw);
    expect(pack.report.filter(r => r.cardId === skill(1)).length).toBeGreaterThanOrEqual(3);
    expect(pack.report.some(r => r.cardId === skill(2) && r.path.includes('constraints'))).toBe(true);
  });
  it('reports per-card blocked status, unresolved questions and actual archive size', () => {
    const raw = archive(); const pack = rules.loadAuthoringJson(raw);
    expect(rules).toHaveProperty('buildAuthoringAdapterReport', expect.any(Function));
    const report = rules.buildAuthoringAdapterReport(pack, raw, archivePath);
    expect(report.summary.cards).toBe(3);
    expect(report.cards.find(c => c.id === skill(1))!.status).toBe('automatic');
    expect(report.cards.find(c => c.id === skill(3))!.status).toBe('automatic');
    expect(report.openQuestions).toEqual(raw.openQuestions);
    expect(report.userConfirmedInterpretations).toEqual(raw.userConfirmedInterpretations);
    expect(report.resolvedQuestions).toEqual(raw.resolvedQuestions);
    expect(report.notes.join(' ')).not.toContain('six');
  });
});

describe('Stormy Voyager completed adapter', () => {
  it('uses backend movement counters for power and plunder rewards', () => {
    const s = setup(); const hind = add(s, skill(2), 'skill'); const voyager = add(s, skill(3), 'skill');
    s.players[0]!.locationId = 'magic_workshop';
    expect(play(s, hind).ok).toBe(true);
    rules.advanceAbilityPhase(s, 'battle');
    expect(activate(s, hind, 'sc-drake-2.reward-and-move').ok).toBe(true);
    const decision = rules.projectAbilityState(s, 'p1').pendingDecision!;
    expect(rules.dispatchAbilityCommand(s, 'p1', { type: 'choose_target', decisionId: decision.id, selectedIds: ['shinto'] }).ok).toBe(true);

    s.round.activePhase = 'action';
    s.round.prioritySeat = 1;
    s.players[0]!.mana = 12;
    expect(play(s, voyager).ok).toBe(true);
    expect(rules.calculateCardPower(s, voyager).value).toBe(8);
    rules.advanceAbilityPhase(s, 'battle');
    const beforeVp = s.players[0]!.vp;
    expect(activate(s, voyager, 'sc-drake-3.plunder').ok).toBe(true);
    expect(s.players[0]!.vp).toBe(beforeVp + 2);
  });
});
