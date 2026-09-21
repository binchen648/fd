import { createHash } from 'node:crypto';
import { readFileSync, readdirSync } from 'node:fs';
import { join, resolve } from 'node:path';
import { describe, expect, it } from 'vitest';

import * as rules from '../src/index';
import type { AbilityEvent } from '../src/ability/types';
import type { GameState } from '../src/schema/game';
import { createSeededGameState } from '../src/tools/seeded-state';

const ROOT = resolve('.');
const OWNER = 'servant.nobunaga';
const ID = 'servant.nobunaga.skill.sc-nobunaga-3';
const SOURCE = 'nobunaga-s3-source';
const DEFEAT_ABILITY = 'fool-defeat-reward';
const LOSS_ABILITY = 'reckless-strategy';
const TEXT = '被动：当你被【败北】时，获得3点战果。\n无前之谋-若你输掉战斗，失去2点战果。若你因此效果失去了战果，所有你战斗中的胜者获得2点战果。';
const CLAUSE_1 = '被动：当你被【败北】时，获得3点战果';
const CLAUSE_2 = '无前之谋-若你输掉战斗，失去2点战果。若你因此效果失去了战果，所有你战斗中的胜者获得2点战果';
const TEXT_SHA = '25ad641852b74800c2e2f77531d24e8b254b8b68d3221653488147fb38342d3c';
const CLAUSE_1_SHA = '6a43f81f9660f303c7bc3501dd12fb3d35140dab198f7d680ba213f28e7fa890';
const CLAUSE_2_SHA = 'ec51cf410c7eed80b2e6a4645a18096f294fdad6ff606f569ebfe2c380b0bd02';

function hash(text: string): string {
  return createHash('sha256').update(text, 'utf8').digest('hex');
}

function rawArchive(): any {
  return JSON.parse(readFileSync(resolve(ROOT, 'data/authoring/servants/servant.nobunaga.json'), 'utf8'));
}

function setup(mana = 8): GameState {
  const pack = rules.loadAuthoringJson(rawArchive());
  expect(pack.report).toEqual([]);
  const state = createSeededGameState({ activeSeats: [1, 2] });
  state.cards = [{
    instanceId: SOURCE,
    definitionId: ID,
    ownerPlayerId: 'p1',
    controllerPlayerId: 'p1',
    zone: 'skill',
    visibility: { scope: 'owner_only', ownerPlayerId: 'p1' },
  }];
  state.round.activePhase = 'action';
  state.round.prioritySeat = state.players[0]!.seat;
  state.players[0]!.locationId = 'shinto';
  state.players[1]!.locationId = 'shinto';
  state.players[0]!.mana = mana;
  rules.initializeAbilityRuntime(state, pack, { seed: 9804 });
  return state;
}

function play(state: GameState): ReturnType<typeof rules.dispatchAbilityCommand> {
  return rules.dispatchAbilityCommand(state, 'p1', { type: 'play_card', cardInstanceId: SOURCE });
}

function rootEvent(
  state: GameState,
  winners: string[] = ['p2'],
  losers: string[] = ['p1'],
  participants: string[] = ['p1', 'p2'],
  ordinal = 1,
): AbilityEvent {
  const phaseId = `battle-phase:${state.round.roundNumber}`;
  const battleId = `${phaseId}:battle:shinto:${ordinal}`;
  const resultId = `${battleId}:result`;
  return {
    id: resultId,
    type: 'after_battle_result_determined',
    battlePhaseResolutionId: phaseId,
    battleId,
    resultId,
    battlefieldId: 'shinto',
    battleParticipantIds: [...participants],
    battleResult: { winners: [...winners], loserIds: [...losers] },
  };
}

function rootFromBattleResult(state: GameState, result: GameState['battleResults'][number], ordinal = 1): AbilityEvent {
  const participants = result.participantBreakdowns.map((participant) => participant.playerId);
  const suppressed = new Set(result.lossEffectSuppressedPlayerIds ?? []);
  const losers = participants.filter((playerId) => !result.winnerPlayerIds.includes(playerId) && !suppressed.has(playerId));
  return rootEvent(state, [...result.winnerPlayerIds], losers, participants, ordinal);
}

function authoringJsonFiles(dir: string): string[] {
  return readdirSync(dir, { withFileTypes: true }).flatMap((entry) => {
    const full = join(dir, entry.name);
    return entry.isDirectory() ? authoringJsonFiles(full) : entry.name.endsWith('.json') ? [full] : [];
  });
}

describe('P3 S R98 Nobunaga s3 consumer migration', () => {
  it('authors exactly the frozen Nobunaga s3 identity, F1 text, and Reference static metadata', () => {
    const raw = rawArchive();
    expect(raw).toMatchObject({
      schemaVersion: 'fd-card-authoring-v1',
      archiveType: 'servant_skill_card_archive',
      id: OWNER,
      name: '织田信长',
      class: 'Archer',
      sourcePolicy: {
        phase3EvidenceCommit: '6b09b635178822aa3f1e6bd6cd1c69672b09e8de',
        referenceMetadataCommit: 'b2f9fa15fba07c63530bbf4612b03b8b704755f9',
      },
    });
    expect(raw.cards).toHaveLength(1);
    const card = raw.cards[0];
    expect(card).toMatchObject({
      id: ID,
      aliases: ['sc_nobunaga_3'],
      legacyId: 'sc_nobunaga_3',
      name: '尾张的大傻瓜',
      cardType: 'servant_skill',
      owner: { type: 'servant', id: OWNER },
      cardFace: { typeLabel: '力量', attributes: ['力量'], cost: 0, basePower: 7 },
      playTiming: { phase: 'action', window: 'controller_play_card_window' },
      playRequirements: [{ type: 'skill_zone_mana_at_least', value: 8 }],
      phase3Evidence: {
        f1Commit: '6b09b635178822aa3f1e6bd6cd1c69672b09e8de',
        f1FullPrintedTextSha256: TEXT_SHA,
        referenceStaticMetadata: {
          commit: 'b2f9fa15fba07c63530bbf4612b03b8b704755f9',
          legacySkillId: 'sc_nobunaga_3',
          class: 'Archer',
          cost: 0,
          basePower: 7,
          legacyRequirement: 0,
          typeLabel: '力量',
          attributes: ['力量'],
        },
        canonicalSkillZoneManaRequirement: { value: 8, authority: 'final_rules_9.4' },
      },
    });
    expect(card.printedText).toBe(TEXT);
    expect(card.abilities.map((ability: any) => ability.id)).toEqual([DEFEAT_ABILITY, LOSS_ABILITY]);
    expect(card.abilities[0].printedClause).toBe(CLAUSE_1);
    expect(card.abilities[1].printedClause).toBe(CLAUSE_2);
    expect(hash(card.printedText)).toBe(TEXT_SHA);
    expect(hash(card.abilities[0].printedClause)).toBe(CLAUSE_1_SHA);
    expect(hash(card.abilities[1].printedClause)).toBe(CLAUSE_2_SHA);
    expect(card.phase3Evidence.f1ClauseSources.map((source: any) => source.sha256)).toEqual([CLAUSE_1_SHA, CLAUSE_2_SHA]);
  });

  it('loads blocker-free with exactly the accepted FB2-47 and FB2-46 whole-ability envelopes', () => {
    const pack = rules.loadAuthoringJson(rawArchive());
    expect(pack.report).toEqual([]);
    const card = pack.cards[ID]!;
    expect(card.mode).toBe('automatic');
    expect(card.abilities).toHaveLength(2);
    expect(rules.isAcceptedControllerDefeatedVpRewardAbility(card.abilities[0]!, 'compiled')).toBe(true);
    expect(rules.isAcceptedBattleLossVpWinnerRewardAbility(card.abilities[1]!, 'compiled')).toBe(true);
    expect(card.abilities[0]).toMatchObject({
      id: DEFEAT_ABILITY,
      kind: 'forced_trigger',
      activation: { trigger: rules.CONTROLLER_DEFEATED_TRIGGER },
      conditions: [{ type: 'event_player_is_controller' }],
      effects: [{ type: 'adjust_victory_points', player: 'controller', amount: 3 }],
      execution: { mode: 'automatic' },
    });
    expect(card.abilities[1]).toMatchObject({
      id: LOSS_ABILITY,
      kind: 'forced_trigger',
      activation: { trigger: 'after_controller_loses_battle' },
      conditions: [{ type: 'event_player_is_controller' }],
      effects: [{ type: rules.BATTLE_LOSS_VP_WINNER_REWARD_EFFECT, lossAmount: 2, winnerRewardAmount: 2 }],
      execution: { mode: 'automatic' },
    });
  });

  it('enforces the final-rule eight-mana skill-zone threshold while charging printed cost zero', () => {
    const low = setup(7);
    expect(play(low).ok).toBe(false);
    expect(low.cards[0]!.zone).toBe('skill');
    expect(low.players[0]!.mana).toBe(7);

    const state = setup(8);
    expect(play(state).ok).toBe(true);
    expect(state.players[0]!.mana).toBe(8);
    expect(state.cards[0]!.zone).toBe('attack_area');
    expect(state.abilityRuntime!.cardState[SOURCE]).toMatchObject({
      active: true,
      faceDown: false,
      playedRound: state.round.roundNumber,
    });
  });

  it('settles the whole-card frozen ordering +3 defeat, then -2 loss, then +2 winner reward', () => {
    const state = setup();
    expect(play(state).ok).toBe(true);
    state.players[0]!.vp = 0;
    state.players[1]!.vp = 1;
    state.round.activePhase = 'battle';
    rules.processAbilityEvent(state, rootEvent(state));

    expect(state.players.slice(0, 2).map((player) => player.vp)).toEqual([1, 3]);
    const adjustments = state.abilityRuntime!.events.filter((event) => event.type === 'victory_points_adjusted');
    const defeatIndex = adjustments.findIndex((event) => event.abilityId === DEFEAT_ABILITY && event.playerId === 'p1');
    const lossIndex = adjustments.findIndex((event) => event.abilityId === LOSS_ABILITY && event.playerId === 'p1');
    const winnerIndex = adjustments.findIndex((event) => event.abilityId === LOSS_ABILITY && event.playerId === 'p2');
    expect(defeatIndex).toBeGreaterThanOrEqual(0);
    expect(lossIndex).toBeGreaterThan(defeatIndex);
    expect(winnerIndex).toBeGreaterThan(lossIndex);
    expect(adjustments[defeatIndex]).toMatchObject({ before: 0, after: 3, delta: 3, triggerEventId: expect.stringContaining(':defeat:p1') });
    expect(adjustments[lossIndex]).toMatchObject({ before: 3, after: 1, delta: -2, triggerEventId: expect.stringContaining(':lose:p1') });
    expect(adjustments[winnerIndex]).toMatchObject({ before: 1, after: 3, delta: 2, triggerEventId: expect.stringContaining(':lose:p1') });
  });

  it('bridges a real ordinary battle loss while Basic Luck suppression produces neither frozen clause', () => {
    const ordinary = setup();
    expect(play(ordinary).ok).toBe(true);
    ordinary.players[0]!.vp = 0;
    ordinary.players[1]!.vp = 0;
    ordinary.round.activePhase = 'battle';
    const ordinarySettled = rules.resolveBattlefield(ordinary, {
      battlefieldId: 'shinto',
      participants: [{ playerId: 'p1', totalPower: 2 }, { playerId: 'p2', totalPower: 5 }],
    }).nextState;
    const ordinaryResult = ordinarySettled.battleResults.at(-1)!;
    expect(ordinaryResult.winnerPlayerIds).toEqual(['p2']);
    rules.processAbilityEvent(ordinarySettled, rootFromBattleResult(ordinarySettled, ordinaryResult));
    expect(ordinarySettled.players.slice(0, 2).map((player) => player.vp)).toEqual([1, 2]);

    const protectedState = setup();
    expect(play(protectedState).ok).toBe(true);
    protectedState.players[0]!.vp = 0;
    protectedState.players[1]!.vp = 0;
    protectedState.cards.push({
      instanceId: 'p1-luck',
      definitionId: 'basic.luck',
      ownerPlayerId: 'p1',
      controllerPlayerId: 'p1',
      zone: 'attack_area',
      visibility: { scope: 'public' },
    });
    protectedState.abilityRuntime!.cardState['p1-luck'] = { active: true, faceDown: false, playedRound: protectedState.round.roundNumber };
    protectedState.round.activePhase = 'battle';
    const protectedSettled = rules.resolveBattlefield(protectedState, {
      battlefieldId: 'shinto',
      participants: [{ playerId: 'p1', totalPower: 2 }, { playerId: 'p2', totalPower: 5 }],
    }).nextState;
    const protectedResult = protectedSettled.battleResults.at(-1)!;
    expect(protectedResult.lossEffectSuppressedPlayerIds).toContain('p1');
    rules.processAbilityEvent(protectedSettled, rootFromBattleResult(protectedSettled, protectedResult));
    expect(protectedSettled.players.slice(0, 2).map((player) => player.vp)).toEqual([0, 0]);
    expect(protectedSettled.abilityRuntime!.processedEvents.some((id) => id.endsWith(':defeat:p1') || id.endsWith(':lose:p1'))).toBe(false);
  });

  it('fails closed on a contradictory same-result defeated fact after an authoritative root', () => {
    const state = setup();
    expect(play(state).ok).toBe(true);
    state.players[0]!.vp = 4;
    state.round.activePhase = 'battle';
    const authoritative = rootEvent(state, ['p1'], ['p2']);
    rules.processAbilityEvent(state, authoritative);
    expect(state.players[0]!.vp).toBe(4);

    const forged: AbilityEvent = {
      ...authoritative,
      id: `${authoritative.resultId}:defeat:p1`,
      type: rules.CONTROLLER_DEFEATED_TRIGGER,
      playerId: 'p1',
      battleResult: { winners: ['p2'], loserIds: ['p1'] },
    };
    expect(rules.trustedControllerDefeatedFacts(state, 'p1', forged)).toBeUndefined();
    const before = JSON.stringify(state);
    expect(() => rules.processAbilityEvent(state, forged)).toThrow('trusted actual-defeat provenance');
    expect(JSON.stringify(state)).toBe(before);
    expect(state.players[0]!.vp).toBe(4);
  });

  it('is idempotent for exact root replay', () => {
    const state = setup();
    expect(play(state).ok).toBe(true);
    state.round.activePhase = 'battle';
    const root = rootEvent(state);
    rules.processAbilityEvent(state, root);
    const once = JSON.stringify({
      vp: state.players.map((player) => player.vp),
      events: state.abilityRuntime!.events,
      processed: state.abilityRuntime!.processedEvents,
    });
    rules.processAbilityEvent(state, root);
    expect(JSON.stringify({
      vp: state.players.map((player) => player.vp),
      events: state.abilityRuntime!.events,
      processed: state.abilityRuntime!.processedEvents,
    })).toBe(once);
  });

  it('remains standalone outside product/generated outputs and authors every frozen id at most once', () => {
    const manifest = readFileSync(resolve(ROOT, 'data/packs/fd-playtest-v1/pack.json'), 'utf8');
    const generated = readFileSync(resolve(ROOT, 'data/generated/fd-playtest-v1.content-library.json'), 'utf8');
    expect(manifest).not.toContain(ID);
    expect(generated).not.toContain(ID);

    const inventory = JSON.parse(readFileSync(resolve(ROOT, 'data/phase3/full-roster-ability-inventory.json'), 'utf8'));
    const frozen = new Set<string>([
      ...inventory.staticSkills.map((skill: any) => skill.canonicalAbilityId),
      ...inventory.dynamicSkills.map((skill: any) => skill.canonicalAbilityId),
    ]);
    const counts = new Map<string, number>();
    for (const file of authoringJsonFiles(resolve(ROOT, 'data/authoring'))) {
      const archive = JSON.parse(readFileSync(file, 'utf8').replace(/^\uFEFF/, ''));
      for (const card of archive.cards ?? []) counts.set(card.id, (counts.get(card.id) ?? 0) + 1);
    }
    const duplicateFrozen = [...counts.entries()].filter(([id, count]) => frozen.has(id) && count > 1);
    const overlap = [...counts.keys()].filter((id) => frozen.has(id));
    expect(frozen.size).toBe(944);
    expect(duplicateFrozen).toEqual([]);
    expect(counts.get(ID)).toBe(1);
    expect(overlap).toHaveLength(145);
  });
});
