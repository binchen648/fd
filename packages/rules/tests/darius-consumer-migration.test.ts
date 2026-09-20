import { createHash } from 'node:crypto';
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { describe, expect, it } from 'vitest';

import * as rules from '../src/index';
import type { AbilityEvent } from '../src/ability/types';
import type { GameState } from '../src/schema/game';
import { createSeededGameState } from '../src/tools/seeded-state';

const ROOT = resolve('.');
const OWNER = 'servant.darius';
const ID = 'servant.darius.skill.sc-darius-1';
const CLAUSE = '残留：于战斗阶段结束后关闭此牌，除非你本回合战败';
const CLAUSE_SHA = 'e3afc162cc4676b9e3b6ca9aad41daed4aae8e22780705a608960a8d018fc88f';
const FULL_SHA = '140fbed2b3d455403639cbd3987c20b25279fdd61a28daedaac19892a34ec9e6';

function hash(text: string): string {
  return createHash('sha256').update(text, 'utf8').digest('hex');
}

function rawArchive(): any {
  return JSON.parse(readFileSync(resolve(ROOT, 'data/authoring/servants/servant.darius.json'), 'utf8'));
}

function result(battlefieldId: string, participants: string[], winners: string[]) {
  return {
    battlefieldId,
    winnerPlayerIds: winners,
    tied: winners.length > 1,
    winnerPlayerId: winners.length === 1 ? winners[0]! : null,
    margin: 0,
    vpReward: 0,
    militaryAdjustments: [],
    lossEffectSuppressedPlayerIds: [],
    participantBreakdowns: participants.map((playerId) => ({ playerId, basePower: 0, totalModifier: 0, effectivePower: 0, modifiers: [] })),
  } as any;
}

function terminalEvent(state: GameState, results: GameState['battleResults']): AbilityEvent {
  const phaseId = `battle-phase:${state.round.roundNumber}`;
  const battleIds = results.map((entry, index) => `${phaseId}:battle:${entry.battlefieldId}:${index + 1}`);
  return {
    id: `${phaseId}:after_battle_ended`,
    type: 'after_battle_ended',
    battlePhaseResolutionId: phaseId,
    battleIds,
    resultIds: battleIds.map((battleId) => `${battleId}:result`),
    scoringReceiptIds: results.map((entry) => `${phaseId}:score:${entry.battlefieldId}`),
    battleParticipantIds: [...new Set(results.flatMap((entry) => entry.participantBreakdowns.map((participant) => participant.playerId)))],
    battleOutcomes: results.map((entry) => ({
      battlefieldId: entry.battlefieldId,
      participantPlayerIds: [...new Set(entry.participantBreakdowns.map((participant) => participant.playerId))],
      winnerPlayerIds: [...new Set(entry.winnerPlayerIds)],
    })),
  };
}

function setup() {
  const pack = rules.loadAuthoringJson(rawArchive());
  expect(pack.report).toEqual([]);
  const state = createSeededGameState({ activeSeats: [1, 2, 3, 4] });
  state.cards = [{
    instanceId: 'darius-source', definitionId: ID, ownerPlayerId: 'p1', controllerPlayerId: 'p1',
    zone: 'attack_area', visibility: { scope: 'public' },
  }];
  state.round.activePhase = 'battle';
  rules.initializeAbilityRuntime(state, pack, { seed: 20260920 });
  state.abilityRuntime!.cardState['darius-source'] = { active: true, faceDown: false, playedRound: state.round.roundNumber };
  return state;
}

function settle(state: GameState, snapshot: GameState['battleResults'], event = terminalEvent(state, snapshot)) {
  state.battleResults = structuredClone(snapshot);
  const scored = rules.applyBattleScoring(state).nextState;
  expect(scored.battleResults).toEqual([]);
  rules.processAbilityEvent(scored, event);
  return scored;
}

function expectOpen(state: GameState) {
  expect(state.cards.find((card) => card.instanceId === 'darius-source')).toMatchObject({ zone: 'attack_area' });
  expect(state.abilityRuntime!.cardState['darius-source']).toMatchObject({ active: true, faceDown: false });
}

function expectClosed(state: GameState) {
  expect(state.cards.find((card) => card.instanceId === 'darius-source')).toMatchObject({ zone: 'skill' });
  expect(state.abilityRuntime!.cardState['darius-source']).toMatchObject({ active: false, faceDown: false });
}

describe('P3 S R81 Darius consumer migration', () => {
  it('materializes exactly the frozen Darius card with F1 hashes, Reference metadata, and accepted semantics', () => {
    const raw = rawArchive();
    expect(raw).toMatchObject({
      schemaVersion: 'fd-card-authoring-v1', archiveType: 'servant_skill_card_archive', id: OWNER,
      name: '大流士三世', class: 'Berserker',
      sourcePolicy: {
        phase3EvidenceCommit: '59f145434695d29bdd17e4cb3adc887e84182377',
        referenceMetadataCommit: 'b2f9fa15fba07c63530bbf4612b03b8b704755f9',
      },
    });
    expect(raw.cards.map((card: any) => card.id)).toEqual([ID]);
    const authored = raw.cards[0];
    expect(authored).toMatchObject({
      id: ID, aliases: ['sc_darius_1'], legacyId: 'sc_darius_1', name: '阿契美尼德的荣耀',
      cardType: 'servant_skill', owner: { type: 'servant', id: OWNER },
      cardFace: { typeLabel: '力量', attributes: ['力量'], cost: 2, basePower: 5 },
      playTiming: { phase: 'action', window: 'controller_play_card_window' },
      playRequirements: [{ type: 'skill_zone_mana_at_least', value: 0 }],
      phase3Evidence: {
        f1ClauseSources: [{ sha256: CLAUSE_SHA }], f1FullPrintedTextSha256: FULL_SHA,
        referenceStaticMetadata: {
          legacySkillId: 'sc_darius_1', class: 'Berserker', cost: 2, basePower: 5, legacyRequirement: 0,
          typeLabel: '力量', attributes: ['力量'],
        },
      },
    });
    expect(hash(authored.printedText)).toBe(FULL_SHA);
    expect(hash(authored.abilities[0].printedClause)).toBe(CLAUSE_SHA);
    expect(authored.abilities[0].printedClause).toBe(CLAUSE);

    const pack = rules.loadAuthoringJson(raw);
    expect(pack.report).toEqual([]);
    const card = pack.cards[ID]!;
    expect(card.mode).toBe('automatic');
    expect(card.abilities).toHaveLength(1);
    expect(card.abilities[0]).toMatchObject({
      id: 'achaemenid-glory-residual', kind: 'residual',
      activation: { phase: 'combat', trigger: 'after_battle_ended', requiresSourceState: 'active' },
      conditions: [
        { type: 'source_active' },
        { type: 'player_flag_number_not_current_round', key: 'combatLossRound' },
      ],
      effects: [{ type: 'close_source_card' }],
      lifecycle: { duration: 'while_active', starts: 'immediate', cleanup: 'remain_active' },
      execution: { mode: 'automatic' },
    });
    expect(rules.isAcceptedCurrentRoundCombatLossAbsenceCondition(card.abilities[0]!.conditions[1]!)).toBe(true);
  });

  it('closes the active source after production-order scoring when the controller has no loss', () => {
    const state = setup();
    const settled = settle(state, [
      result('miyama_town', ['p1', 'p2'], ['p1']),
      result('shinto', ['p3', 'p4'], ['p3']),
    ]);
    expectClosed(settled);
    expect(settled.abilityRuntime!.events).toContainEqual(expect.objectContaining({
      type: 'effect_resolved', playerId: 'p1', sourceCardId: 'darius-source', abilityId: 'achaemenid-glory-residual',
    }));
  });

  it('preserves the source when the controller lost any represented battle, including loss-effect suppression independence', () => {
    const state = setup();
    const lost = result('miyama_town', ['p1', 'p2'], ['p2']);
    lost.lossEffectSuppressedPlayerIds = ['p1'];
    const settled = settle(state, [lost]);
    expectOpen(settled);
    expect(settled.abilityRuntime!.events).not.toContainEqual(expect.objectContaining({
      type: 'effect_resolved', abilityId: 'achaemenid-glory-residual',
    }));
  });

  it('does not count non-participation as a loss and closes the source on a valid zero-loss terminal', () => {
    const state = setup();
    const settled = settle(state, [result('shinto', ['p3', 'p4'], ['p3'])]);
    expectClosed(settled);
  });

  it('fails closed for stale/non-terminal provenance without closing or throwing', () => {
    for (const mutate of [
      (event: AbilityEvent) => ({ ...event, battlePhaseResolutionId: 'battle-phase:999' }),
      (event: AbilityEvent) => ({ ...event, type: 'after_battle_result_determined' as const }),
      (event: AbilityEvent) => ({ ...event, resultIds: [] }),
    ]) {
      const state = setup();
      const snapshot = [result('miyama_town', ['p1', 'p2'], ['p1'])];
      const event = mutate(terminalEvent(state, snapshot)) as AbilityEvent;
      let settled: GameState | undefined;
      expect(() => {
        settled = settle(state, snapshot, event);
      }).not.toThrow();
      expect(settled).toBeDefined();
      expectOpen(settled!);
    }
  });
});
