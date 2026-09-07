import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';

import * as rules from '../../src/index';
import type { GameState } from '../../src/schema/game';
import { createSeededGameState } from '../../src/tools/seeded-state';

type Archive = Parameters<typeof rules.loadAuthoringJson>[0];

interface GoldenPlayCase {
  label: string;
  archivePath: string;
  definitionIds: [string, string];
}

const goldenPlayCases: GoldenPlayCase[] = [
  {
    label: 'Caster sword plus pilgrim',
    archivePath: 'data/authoring/servants/servant.artoriac.json',
    definitionIds: [
      'servant.artoriac.skill.sc-artoriac-1',
      'servant.artoriac.skill.sc-artoriac-4',
    ],
  },
  {
    label: 'Drake Golden Hind plus Voyager',
    archivePath: 'data/authoring/servants/servant.drake.json',
    definitionIds: [
      'servant.drake.skill.sc-drake-2',
      'servant.drake.skill.sc-drake-3',
    ],
  },
  {
    label: 'Ereshkigal Battle Continuation plus Netherworld Protection',
    archivePath: 'data/authoring/servants/servant.ereshkigal.json',
    definitionIds: [
      'servant.ereshkigal.skill.sc-ereshkigal-1',
      'servant.ereshkigal.skill.sc-ereshkigal-2',
    ],
  },
  {
    label: 'Kintoki two physical Golden Impact copies',
    archivePath: 'data/authoring/servants/servant.kintoki.json',
    definitionIds: [
      'servant.kintoki.skill.sc-kintoki-1',
      'servant.kintoki.skill.sc-kintoki-2',
    ],
  },
  {
    label: 'Tomoe Independent Action plus Inferno Fire',
    archivePath: 'data/authoring/servants/servant.tomoe.json',
    definitionIds: [
      'servant.tomoe.skill.sc-tomoe-1',
      'servant.tomoe.skill.sc-tomoe-2',
    ],
  },
];

function archive(path: string): Archive {
  return JSON.parse(readFileSync(path, 'utf8')) as Archive;
}

function setup(testCase: GoldenPlayCase): GameState {
  const raw = archive(testCase.archivePath);
  const state = createSeededGameState();
  state.cards = [];
  state.round.activePhase = 'action';
  state.round.prioritySeat = state.players[0]!.seat;
  state.players[0]!.mana = 20;
  state.players[0]!.locationId = 'recon';
  state.players[0]!.servantCardId = String((raw as { id?: string }).id ?? '');
  rules.initializeAbilityRuntime(state, rules.loadAuthoringJson(raw), { seed: 42 });
  return state;
}

function add(state: GameState, definitionId: string, zone: 'hand' | 'skill' = 'skill'): string {
  const instanceId = `regression-${state.cards.length}-${definitionId}`;
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

describe('explicit attack/play classification regressions', () => {
  it.each(goldenPlayCases)('$label plays as one legal two-card batch', (testCase) => {
    const state = setup(testCase);
    const cards = testCase.definitionIds.map((definitionId) => add(state, definitionId));

    expect(() => rules.playAbilityCardBatch(state, 'p1', cards.map((cardInstanceId) => ({ cardInstanceId })))).not.toThrow();
    expect(cards.map((id) => state.cards.find((card) => card.instanceId === id)?.zone)).toEqual([
      'attack_area',
      'attack_area',
    ]);
    expect((state.abilityRuntime as typeof state.abilityRuntime & { playCounters?: unknown })?.playCounters).toMatchObject({
      round: state.round.roundNumber,
      cardsPlayedByPlayer: { p1: 2 },
      attacksDeclaredByPlayer: { p1: 2 },
    });
    expect(rules.projectAbilityState(state, 'p1').playSummary).toEqual({
      cardsPlayedThisRound: 2,
      attacksDeclaredThisRound: 2,
      attackAreaOccupancy: 2,
      attackAllowance: 2,
    });
  });

  it('stages two attacks, confirms the shared batch, and rejects a third attack', () => {
    const testCase = goldenPlayCases[0]!;
    const state = setup(testCase);
    const ids = [
      add(state, 'servant.artoriac.skill.sc-artoriac-4', 'hand'),
      add(state, 'servant.artoriac.skill.sc-artoriac-5', 'hand'),
      add(state, 'servant.artoriac.skill.sc-artoriac-6', 'hand'),
    ];

    expect(rules.dispatchAbilityCommand(state, 'p1', { type: 'stage_attack_card', cardInstanceId: ids[0]! }).ok).toBe(true);
    expect(rules.getLegalActions(state, 'p1')).toContainEqual({ type: 'stage_attack_card', cardInstanceId: ids[1] });
    expect(rules.dispatchAbilityCommand(state, 'p1', { type: 'stage_attack_card', cardInstanceId: ids[1]! }).ok).toBe(true);
    expect(rules.dispatchAbilityCommand(state, 'p1', { type: 'confirm_staged_attack' }).ok).toBe(true);

    const third = rules.dispatchAbilityCommand(state, 'p1', { type: 'play_card', cardInstanceId: ids[2]! });
    expect(third.ok).toBe(false);
    expect(third.rejection?.code).toBe('attack_play_limit_reached');
    const counters = (state.abilityRuntime as typeof state.abilityRuntime & {
      playCounters: { attacksDeclaredByPlayer: Record<string, number> };
    }).playCounters;
    expect(counters.attacksDeclaredByPlayer.p1).toBe(2);
  });

  it.each([
    { label: 'wrong phase', caseIndex: 0, definitionId: 'servant.artoriac.skill.sc-artoriac-4', phase: 'battle' as const, mana: 20, expected: 'illegal_timing' },
    { label: 'insufficient mana', caseIndex: 1, definitionId: 'servant.drake.skill.sc-drake-1', phase: 'action' as const, mana: 2, expected: 'insufficient_mana' },
  ])('keeps diagnostics, offers, and dispatch aligned for $label', ({ caseIndex, definitionId, phase, mana, expected }) => {
    const testCase = goldenPlayCases[caseIndex]!;
    const state = setup(testCase);
    state.round.activePhase = phase;
    state.players[0]!.mana = mana;
    const cardInstanceId = add(state, definitionId, 'hand');

    const view = rules.projectAbilityState(state, 'p1') as ReturnType<typeof rules.projectAbilityState> & {
      playDiagnostics?: Array<{ cardInstanceId: string; faceDown: boolean; reasonCode?: string }>;
    };
    expect(view.playDiagnostics).toContainEqual(expect.objectContaining({
      cardInstanceId,
      faceDown: false,
      reasonCode: expected,
    }));
    expect(view.legalActions).not.toContainEqual(expect.objectContaining({ type: 'play_card', cardInstanceId }));

    const result = rules.dispatchAbilityCommand(state, 'p1', { type: 'play_card', cardInstanceId });
    expect(result.ok).toBe(false);
    expect(result.rejection?.code).toBe(expected);
  });

  it('routes a zero-power servant skill by card type, not power heuristics', () => {
    const testCase = goldenPlayCases[3]!;
    const state = setup(testCase);
    const cardInstanceId = add(state, 'servant.kintoki.skill.sc-kintoki-3');

    const result = rules.dispatchAbilityCommand(state, 'p1', { type: 'play_card', cardInstanceId });
    expect(result.ok).toBe(true);
    expect(state.cards.find((card) => card.instanceId === cardInstanceId)?.zone).toBe('attack_area');
  });

  it('keeps the legacy classifier and one-attack quota available as a rollback version', () => {
    const testCase = goldenPlayCases[3]!;
    const raw = archive(testCase.archivePath);
    const state = createSeededGameState();
    state.cards = [];
    state.round.activePhase = 'action';
    state.round.prioritySeat = state.players[0]!.seat;
    state.players[0]!.mana = 20;
    rules.initializeAbilityRuntime(state, rules.loadAuthoringJson(raw), {
      seed: 42,
      playRulesVersion: 'legacy-v0',
    });
    const first = add(state, testCase.definitionIds[0]);
    const second = add(state, testCase.definitionIds[1]);

    expect(rules.dispatchAbilityCommand(state, 'p1', { type: 'play_card', cardInstanceId: first }).ok).toBe(true);
    expect(rules.dispatchAbilityCommand(state, 'p1', { type: 'play_card', cardInstanceId: second }).rejection?.code)
      .toBe('attack_play_limit_reached');
  });

  it('tracks effect plays without consuming the regular attack declaration allowance', () => {
    const testCase = goldenPlayCases[1]!;
    const state = setup(testCase);
    for (const [id, basePower] of [['fixture.basic-2', 2], ['fixture.basic-3', 3]] as const) {
      state.abilityRuntime!.pack.cards[id] = {
        id,
        name: id,
        cardType: 'basic_attack',
        cardFace: { cost: 0, basePower, attributes: ['力量'] },
        playTiming: { phase: 'action', window: 'controller_play_card_window' },
        playRequirements: [],
        abilities: [],
        mode: 'automatic',
      };
    }
    const riding = add(state, 'servant.drake.skill.sc-drake-1');
    const first = add(state, 'fixture.basic-2', 'hand');
    const second = add(state, 'fixture.basic-3', 'hand');

    expect(rules.dispatchAbilityCommand(state, 'p1', { type: 'play_card', cardInstanceId: riding }).ok).toBe(true);
    const activation = rules.getLegalActions(state, 'p1').find((action) =>
      action.type === 'activate_ability' && action.cardInstanceId === riding && action.abilityId === 'sc-drake-1.mount-summon');
    expect(activation).toBeDefined();
    expect(rules.dispatchAbilityCommand(state, 'p1', activation!).ok).toBe(true);
    const decision = rules.projectAbilityState(state, 'p1').pendingDecision!;
    expect(rules.dispatchAbilityCommand(state, 'p1', {
      type: 'choose_target',
      decisionId: decision.id,
      selectedIds: [first, second],
    }).ok).toBe(true);

    expect(rules.projectAbilityState(state, 'p1').playSummary).toEqual({
      cardsPlayedThisRound: 3,
      attacksDeclaredThisRound: 1,
      attackAreaOccupancy: 3,
      attackAllowance: 2,
    });
  });
});
