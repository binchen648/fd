import { createHash } from 'node:crypto';
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { describe, expect, it } from 'vitest';

import * as rules from '../src/index';
import type { AbilityEvent } from '../src/ability/types';
import type { GameState } from '../src/schema/game';
import { createSeededGameState } from '../src/tools/seeded-state';

const ROOT = resolve('.');
const OWNER = 'servant.nero';
const ID = 'servant.nero.skill.sc-nero-1';
const SOURCE = 'nero-golden-theater-source';
const REWARD_SHA = '107c5565a029baec317ec995e49c5936aaa9bae2be0d093e1d895507d31fb7c3';
const CLOSE_SHA = 'f70b15b49681932cb6a636e3efcaf38fc8456c1a1167f4fc61ee405e9ef6a3c9';
const FULL_SHA = '037586179bc5beaa08b9722fefcd87fc11137eee9b469d6493cb11e4e08b74b2';

function hash(text: string): string {
  return createHash('sha256').update(text, 'utf8').digest('hex');
}

function rawArchive(): any {
  return JSON.parse(readFileSync(resolve(ROOT, 'data/authoring/servants/servant.nero.json'), 'utf8'));
}

function setup(playedRound = 1, currentRound = 1): GameState {
  const pack = rules.loadAuthoringJson(rawArchive());
  expect(pack.report).toEqual([]);
  const state = createSeededGameState({ activeSeats: [1, 2, 3, 4] });
  state.round.roundNumber = currentRound;
  state.round.activePhase = 'battle';
  state.cards = [{
    instanceId: SOURCE,
    definitionId: ID,
    ownerPlayerId: 'p1',
    controllerPlayerId: 'p1',
    zone: 'field',
    visibility: { scope: 'public' },
  }];
  rules.initializeAbilityRuntime(state, pack, { seed: 20260920 });
  state.abilityRuntime!.cardState[SOURCE] = { active: true, faceDown: false, playedRound };
  return state;
}

function battleEvent(
  state: GameState,
  winners: string[],
  losers: string[],
  battlefieldId = 'miyama_town',
  ordinal = 1,
  participants: string[] = [...winners, ...losers],
): AbilityEvent {
  const phaseId = `battle-phase:${state.round.roundNumber}`;
  const battleId = `${phaseId}:battle:${battlefieldId}:${ordinal}`;
  const resultId = `${battleId}:result`;
  return {
    id: resultId,
    type: 'after_battle_result_determined',
    battlePhaseResolutionId: phaseId,
    battleId,
    resultId,
    battlefieldId,
    battleParticipantIds: [...participants],
    battleResult: { winners: [...winners], loserIds: [...losers] },
  };
}

function roundEnd(state: GameState, id: string): void {
  state.round.activePhase = 'round_end';
  rules.processAbilityEvent(state, { id, type: 'round_end' });
}

function sourceActive(state: GameState): boolean | undefined {
  return state.abilityRuntime!.cardState[SOURCE]?.active;
}

describe('P3 S R86 Nero s1 consumer migration', () => {
  it('materializes exactly the frozen card with F1 hashes, Reference metadata, and accepted contracts', () => {
    const raw = rawArchive();
    expect(raw).toMatchObject({
      schemaVersion: 'fd-card-authoring-v1',
      archiveType: 'servant_skill_card_archive',
      id: OWNER,
      class: 'Saber',
      sourcePolicy: {
        phase3EvidenceCommit: '59f145434695d29bdd17e4cb3adc887e84182377',
        referenceMetadataCommit: 'b2f9fa15fba07c63530bbf4612b03b8b704755f9',
      },
    });
    expect(raw.cards.map((card: any) => card.id)).toEqual([ID]);
    const authored = raw.cards[0];
    expect(authored).toMatchObject({
      id: ID,
      aliases: ['sc_nero_1'],
      legacyId: 'sc_nero_1',
      cardType: 'servant_skill',
      owner: { type: 'servant', id: OWNER },
      cardFace: { typeLabel: '特殊/宝具', attributes: ['特殊', '宝具'], cost: 7, basePower: 6 },
      playTiming: { phase: 'action', window: 'controller_play_card_window' },
      playRequirements: [{ type: 'skill_zone_mana_at_least', value: 8 }],
      phase3Evidence: {
        f1Commit: '59f145434695d29bdd17e4cb3adc887e84182377',
        f1ClauseSources: [{ sha256: REWARD_SHA }, { sha256: CLOSE_SHA }],
        f1FullPrintedTextSha256: FULL_SHA,
        referenceStaticMetadata: {
          commit: 'b2f9fa15fba07c63530bbf4612b03b8b704755f9',
          legacySkillId: 'sc_nero_1', class: 'Saber', cost: 7, basePower: 6,
          legacyRequirement: 8, typeLabel: '特殊/宝具', attributes: ['特殊', '宝具'],
        },
        acceptedContracts: {
          sourceActiveRoundCount: 'P3-R84/FB2-40',
          currentRoundCombatWinAbsence: 'P3-R85/FB2-41',
          closeSourceCard: 'CARD_ACTION_CLOSE',
        },
      },
    });
    expect(hash(authored.printedText)).toBe(FULL_SHA);
    expect(hash(authored.abilities[0].printedClause)).toBe(REWARD_SHA);
    expect(hash(authored.abilities[1].printedClause)).toBe(CLOSE_SHA);
    expect(rules.definitionHasStructuralTrueNameRelease(authored)).toBe(true);
  });

  it('loads as one automatic zero-gap card with exact reward and no-win-close semantics', () => {
    const pack = rules.loadAuthoringJson(rawArchive());
    expect(pack.report).toEqual([]);
    const card = pack.cards[ID]!;
    expect(card.mode).toBe('automatic');
    expect(card.abilities).toHaveLength(2);
    expect(card.abilities[0]).toMatchObject({
      id: 'golden-theater-win-reward',
      kind: 'residual',
      activation: { trigger: 'after_controller_wins_battle', requiresSourceState: 'active' },
      conditions: [{ type: 'source_active' }],
      effects: [{ type: 'adjust_victory_points', player: 'controller', amount: { var: 'source_card_active_round_count' } }],
      lifecycle: { duration: 'while_active', starts: 'immediate', cleanup: 'remain_active' },
      visibility: { revealsTrueName: true, revealTiming: 'on_use_declared', revealScope: 'servant_package' },
      execution: { mode: 'automatic' },
    });
    expect(card.abilities[1]).toMatchObject({
      id: 'golden-theater-close-on-no-win',
      kind: 'residual',
      activation: { trigger: 'round_end', requiresSourceState: 'active' },
      conditions: [
        { type: 'source_active' },
        { type: 'player_flag_number_not_current_round', key: 'combatWinRound' },
      ],
      effects: [{ type: 'close_source_card' }],
      lifecycle: { duration: 'while_active', cleanup: 'remain_active' },
      execution: { mode: 'automatic' },
    });
  });

  it('awards one VP in the activation round, records the win, and stays active at round end', () => {
    const state = setup(1, 1);
    rules.processAbilityEvent(state, battleEvent(state, ['p1'], ['p2']));
    expect(state.players.find((player) => player.id === 'p1')!.vp).toBe(1);
    expect(state.abilityRuntime!.combatWinRoundByPlayer).toEqual({ p1: 1 });
    expect(sourceActive(state)).toBe(true);
    roundEnd(state, 'nero-round-1-end');
    expect(sourceActive(state)).toBe(true);
  });

  it('uses inclusive source active-round count on every later-round battle win', () => {
    const state = setup(1, 3);
    rules.processAbilityEvent(state, battleEvent(state, ['p1'], ['p2'], 'miyama_town', 1));
    rules.processAbilityEvent(state, battleEvent(state, ['p1'], ['p3'], 'shinto', 2));
    expect(state.players.find((player) => player.id === 'p1')!.vp).toBe(6);
    expect(state.abilityRuntime!.combatWinRoundByPlayer).toEqual({ p1: 3 });
    roundEnd(state, 'nero-round-3-end');
    expect(sourceActive(state)).toBe(true);
  });

  it('closes at authoritative round end when there is no win in the current round, including a prior-round-only win', () => {
    const noWin = setup(1, 2);
    roundEnd(noWin, 'nero-no-win-r2');
    expect(sourceActive(noWin)).toBe(false);

    const priorWin = setup(1, 1);
    rules.processAbilityEvent(priorWin, battleEvent(priorWin, ['p1'], ['p2']));
    expect(sourceActive(priorWin)).toBe(true);
    priorWin.round.roundNumber = 2;
    roundEnd(priorWin, 'nero-prior-win-only-r2');
    expect(sourceActive(priorWin)).toBe(false);
  });

  it('preserves the real winner reward when loser-side loss effects are suppressed by the game-loop producer', () => {
    const state = setup(1, 2);
    state.battleResults = [{
      battlefieldId: 'miyama_town',
      winnerPlayerIds: ['p1'],
      tied: false,
      winnerPlayerId: 'p1',
      margin: 0,
      vpReward: 0,
      militaryAdjustments: [],
      lossEffectSuppressedPlayerIds: ['p2'],
      participantBreakdowns: ['p1', 'p2'].map((playerId) => ({
        playerId, basePower: 0, totalModifier: 0, effectivePower: 0, modifiers: [],
      })),
    }];
    const advanced = rules.stepGameLoop(state).nextState;
    expect(advanced.players.find((player) => player.id === 'p1')!.vp).toBe(2);
    expect(advanced.abilityRuntime!.combatWinRoundByPlayer).toEqual({ p1: 2 });
    expect(advanced.abilityRuntime!.cardState[SOURCE]?.active).toBe(true);
  });

  it('keeps the standalone migration outside product pack/generated outputs', () => {
    const manifest = readFileSync(resolve(ROOT, 'data/packs/fd-playtest-v1/pack.json'), 'utf8');
    const generated = readFileSync(resolve(ROOT, 'data/generated/fd-playtest-v1.content-library.json'), 'utf8');
    expect(manifest).not.toContain('data/authoring/servants/servant.nero.json');
    expect(manifest).not.toContain(ID);
    expect(generated).not.toContain(ID);
  });
});
