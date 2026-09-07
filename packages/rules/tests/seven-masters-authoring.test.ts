import { existsSync, readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';
import * as rules from '../src/index';
import { createSeededGameState } from '../src/tools/seeded-state';

const cases = [
  {
    archivePath: 'data/authoring/masters/master.kayneth.json',
    htmPath: 'D:/fd/chm-extract/肯尼斯·阿其波卢德.htm',
    id: 'master.kayneth',
    name: '肯尼斯·阿其波卢德',
    cardCount: 4,
    excluded: '流体力学',
  },
  {
    archivePath: 'data/authoring/masters/master.shinji.json',
    htmPath: 'D:/fd/chm-extract/间桐慎二.htm',
    id: 'master.shinji',
    name: '间桐慎二',
    cardCount: 4,
    excluded: '圣杯核心',
  },
  {
    archivePath: 'data/authoring/masters/master.kiritsugu.json',
    htmPath: 'D:/fd/chm-extract/卫宫切嗣.htm',
    id: 'master.kiritsugu',
    name: '卫宫切嗣',
    cardCount: 4,
    excluded: '冷血杀手',
  },
  {
    archivePath: 'data/authoring/masters/master.maiya.json',
    htmPath: 'D:/fd/chm-extract/久宇舞弥.htm',
    id: 'master.maiya',
    name: '久宇舞弥',
    cardCount: 2,
    excluded: '甜品狂热者',
  },
  {
    archivePath: 'data/authoring/masters/master.gatou.json',
    htmPath: 'D:/fd/chm-extract/卧藤门司.htm',
    id: 'master.gatou',
    name: '卧藤门司',
    cardCount: 2,
    excluded: '豪快战意',
  },
  {
    archivePath: 'data/authoring/masters/master.irisviel.json',
    htmPath: 'D:/fd/chm-extract/爱丽丝菲尔·冯·爱因兹贝伦.htm',
    id: 'master.irisviel',
    name: '爱丽丝菲尔·冯·爱因兹贝伦',
    cardCount: 2,
    excluded: '生命赋予',
  },
  {
    archivePath: 'data/authoring/masters/master.olga-marie.json',
    htmPath: 'D:/fd/chm-extract/奥尔加玛丽·阿尼姆斯菲亚.htm',
    id: 'master.olga-marie',
    name: '奥尔加玛丽·阿尼姆斯菲亚',
    cardCount: 4,
    excluded: '橄榄枝',
  },
] as const;

function archive(path: string) {
  return JSON.parse(readFileSync(path, 'utf8'));
}

describe('seven master authoring archives', () => {
  it.each(cases)('loads $name with ascension excluded from adapter scope', spec => {
    expect(existsSync(spec.archivePath), `${spec.archivePath} must exist`).toBe(true);
    expect(existsSync(spec.htmPath), `${spec.htmPath} must exist`).toBe(true);
    const raw = archive(spec.archivePath);
    expect(raw.id).toBe(spec.id);
    expect(raw.name).toBe(spec.name);
    expect(raw.class).toBe('Master');
    expect(raw.sources.find((s: any) => s.id === 'chm_page')).toMatchObject({ path: spec.htmPath });
    expect(raw.cards).toHaveLength(spec.cardCount);
    expect(raw.cards.some((card: any) => card.name === spec.excluded)).toBe(false);
    expect(raw.excludedCards).toContainEqual(expect.objectContaining({ name: spec.excluded, reason: 'user_scope_excluded_ascension' }));

    for (const card of raw.cards) {
      expect(card.abilities.length).toBeGreaterThan(0);
      expect(card.abilities.every((ability: any) => card.printedText.includes(ability.printedClause))).toBe(true);
      expect(card.abilities.every((ability: any) => ability.execution?.mode === 'automatic')).toBe(true);
      expect(card.evidence.every((e: any) => !e.path || existsSync(e.path))).toBe(true);
    }

    const pack = rules.loadAuthoringJson(raw);
    const report = rules.buildAuthoringAdapterReport(pack, raw, spec.archivePath);
    expect(report.summary.cards).toBe(spec.cardCount);
    expect(report.summary.unsupported).toBe(0);
    expect(report.summary.hostAdjudicated).toBe(0);
    expect(report.summary.textUnconfirmed).toBe(0);
    expect(report.cards.every(card => card.status === 'automatic')).toBe(true);
  });
});

describe('seven master targeted interpreter behavior', () => {
  function setup(raw: any) {
    const state = createSeededGameState();
    state.cards = [];
    state.round.activePhase = 'action';
    state.players[0]!.mana = 4;
    state.players[0]!.masterCardId = raw.id;
    rules.initializeAbilityRuntime(state, rules.loadAuthoringJson(raw), { seed: 42 });
    return state;
  }

  function add(state: ReturnType<typeof setup>, definitionId: string, zone = 'skill') {
    const instanceId = `c-${state.cards.length}`;
    state.cards.push({
      instanceId,
      definitionId,
      ownerPlayerId: 'p1',
      controllerPlayerId: 'p1',
      zone,
      visibility: { scope: 'owner_only', ownerPlayerId: 'p1' },
    });
    return instanceId;
  }

  it('Kayneth creates and draws from the independent Volumen deck', () => {
    const raw = archive('data/authoring/masters/master.kayneth.json');
    const state = setup(raw);
    add(state, 'master.kayneth.skill.alchemist');
    rules.processAbilityEvent(state, { id: 'game-start', type: 'game_start' });
    expect(state.cards.filter(card => card.zone === 'independent_deck')).toHaveLength(6);

    const action = rules.projectAbilityState(state, 'p1').legalActions.find(action =>
      action.type === 'activate_ability' && action.abilityId === 'alchemist.draw-volumen');
    expect(action).toBeTruthy();
    const result = rules.dispatchAbilityCommand(state, 'p1', action as any);
    expect(result.ok).toBe(true);
    expect(state.cards.filter(card => card.zone === 'hand' && card.definitionId === 'master.kayneth.deck.volumen-hydrargyrum')).toHaveLength(1);
  });

  it('Kiritsugu chooses one deck card to replace with Origin Bullet during preparation', () => {
    const raw = archive('data/authoring/masters/master.kiritsugu.json');
    const state = setup(raw);
    state.round.activePhase = 'preparation';
    add(state, 'master.kiritsugu.skill.magus-killer');
    const first = add(state, 'fixture.basic.attack.1', 'deck');
    const second = add(state, 'fixture.basic.attack.2', 'deck');

    rules.processAbilityEvent(state, { id: 'game-start', type: 'game_start' });
    expect(state.cards.filter(card => card.zone === 'deck' && card.definitionId === 'master.kiritsugu.deck.origin-bullet')).toHaveLength(0);

    const action = rules.projectAbilityState(state, 'p1').legalActions.find(action =>
      action.type === 'activate_ability' && action.abilityId === 'magus-killer.setup');
    expect(action).toBeTruthy();
    expect(rules.dispatchAbilityCommand(state, 'p1', action as any).ok).toBe(true);
    const decision = rules.projectAbilityState(state, 'p1').pendingDecision!;
    expect(decision.candidates).toEqual([first, second]);
    expect(rules.dispatchAbilityCommand(state, 'p1', {
      type: 'choose_target',
      decisionId: decision.id,
      selectedIds: [second],
    }).ok).toBe(true);

    expect(state.cards.filter(card => card.zone === 'deck' && card.definitionId === 'master.kiritsugu.deck.origin-bullet')).toHaveLength(1);
    expect(state.cards.find(card => card.instanceId === second)?.definitionId).toBe('master.kiritsugu.deck.origin-bullet');
    expect(state.cards.find(card => card.instanceId === first)?.definitionId).toBe('fixture.basic.attack.1');
    expect(state.cards.filter(card => card.zone === 'deck')).toHaveLength(2);
  });

  it('Irisviel converts every hand card into mana during advance', () => {
    const raw = archive('data/authoring/masters/master.irisviel.json');
    const state = setup(raw);
    state.round.activePhase = 'advance';
    add(state, 'master.irisviel.skill.conversion-magic');
    add(state, 'dummy.attack.1', 'hand');
    add(state, 'dummy.attack.2', 'hand');
    add(state, 'dummy.attack.3', 'hand');

    const action = rules.projectAbilityState(state, 'p1').legalActions.find(action =>
      action.type === 'activate_ability' && action.abilityId === 'conversion-magic.preparation');
    expect(action).toBeTruthy();
    const result = rules.dispatchAbilityCommand(state, 'p1', action as any);
    expect(result.ok).toBe(true);
    expect(state.players[0]!.mana).toBe(7);
    expect(state.cards.filter(card => card.ownerPlayerId === 'p1' && card.zone === 'hand')).toHaveLength(0);
  });

  it('Shinji loses one command seal after losing a battle', () => {
    const raw = archive('data/authoring/masters/master.shinji.json');
    const state = setup(raw);
    add(state, 'master.shinji.skill.clown');
    (state.players[0] as any).commandSpells = 3;

    rules.processAbilityEvent(state, {
      id: 'battle-result',
      type: 'after_battle_result_determined',
      battleResult: { winners: ['p2'], loserIds: ['p1'] },
    });

    expect((state.players[0] as any).commandSpells).toBe(2);
  });
});
