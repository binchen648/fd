import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';

import * as rules from '../../src/index';
import type { GameState } from '../../src/schema/game';
import { createSeededGameState } from '../../src/tools/seeded-state';

const ROOT = 'master.fou';
const MARK = ROOT + '.skill.s1';
const RESCUE = ROOT + '.skill.ascension';
const PATH = 'data/authoring/masters/master.fou.json';

const raw = JSON.parse(readFileSync(PATH, 'utf8'));
const loaded = rules.loadAuthoringJson(raw);
const card = (id: string) => loaded.cards[id]!;

function setup(): GameState {
  for (const definition of Object.values(loaded.cards) as any[]) definition.ownerId = ROOT;
  const state = createSeededGameState({ activeSeats: [1, 2, 3] });
  state.cards = [];
  state.players[0]!.masterCardId = ROOT;
  state.players[0]!.mana = 12;
  state.players[0]!.vp = 2;
  state.players[1]!.vp = 7;
  state.players[2]!.vp = 1;
  rules.initializeAbilityRuntime(state, loaded, { seed: 20261008 });
  return state;
}

function add(state: GameState, definitionId: string): string {
  const instanceId = 'fou-owner:' + definitionId.split('.').at(-1) + ':' + state.cards.length;
  state.cards.push({
    instanceId,
    definitionId,
    ownerPlayerId: 'p1',
    controllerPlayerId: 'p1',
    zone: 'skill',
    visibility: { scope: 'owner_only', ownerPlayerId: 'p1' },
  } as any);
  state.abilityRuntime!.cardState[instanceId] = {
    active: false,
    faceDown: false,
    playedRound: state.round.roundNumber,
  };
  return instanceId;
}

function eliminationBattle(targetPlayerId: string) {
  return {
    battlefieldId: 'miyama_town',
    winnerPlayerIds: ['p1'],
    winnerPlayerId: 'p1',
    tied: false,
    margin: 1,
    vpReward: 0,
    militaryAdjustments: [{ playerId: targetPlayerId, delta: -1 }],
    participantBreakdowns: [],
  } as any;
}

describe('P3 Fou owner-complete migration', () => {
  it('materializes exact 2/2 owner scope, pack registration, static metadata, and accepted capability shapes', () => {
    expect(raw.id).toBe(ROOT);
    expect(raw.name).toBe('芙芙');
    expect(raw.publicInformation).toEqual({ type: 'master_package', initialMana: 4 });
    expect(raw.cards.map((entry: any) => entry.id)).toEqual([MARK, RESCUE]);
    expect(Object.keys(loaded.cards).sort()).toEqual([MARK, RESCUE].sort());
    expect(loaded.report.filter((entry) => entry.status === 'unsupported')).toEqual([]);
    expect(raw.cards.find((entry: any) => entry.id === RESCUE).initialPlacement).toBe('outside_game');

    expect(rules.isAcceptedPermanentReturnedSkillTuningAbility(card(MARK).abilities[0]!)).toBe(true);
    expect(rules.isAcceptedEliminationRescueSharedVictoryAbility(card(RESCUE).abilities[0]!)).toBe(true);

    const pack = JSON.parse(readFileSync('data/packs/fd-playtest-v1/pack.json', 'utf8'));
    expect(pack.authoringMasterFiles.filter((path: string) => path.endsWith('/master.fou.json'))).toHaveLength(1);
  });

  it('executes migrated Mark of the Beast through round-end interpreter target selection', () => {
    const state = setup();
    state.round.roundNumber = 3;
    const source = add(state, MARK);
    const target = add(state, RESCUE);
    const ability = card(MARK).abilities[0]!;

    rules.markCommandSealSpent(state, 'p1', 3, 2, { sourceCardId: source, abilityId: ability.id });
    rules.recordSkillReturnedToSkillZone(state, target, 'attack_area');
    rules.processAbilityEvent(state, { id: 'fou-owner-round-end', type: 'round_end', playerId: 'p1' });

    const pending = state.abilityRuntime!.pendingDecision!;
    expect(pending.controllerId).toBe('p1');
    expect(pending.candidates).toContain(target);
    expect(rules.dispatchAbilityCommand(state, 'p1', {
      type: 'choose_target',
      decisionId: pending.id,
      selectedIds: [target],
    }).ok).toBe(true);

    expect(rules.calculateCardPower(state, target).value).toBe(1);
    expect(rules.effectiveCardPlayCost(state, 'p1', target)).toBe(0);
    expect(rules.isPermanentSkillTuningRuntimeProvenanceValidForRestore(structuredClone(state))).toBe(true);
  });

  it('executes migrated Force of Providence for opponent rescue, exact one-time VP swap, and shared victory', () => {
    const state = setup();
    add(state, RESCUE);
    state.round.roundNumber = 8;
    state.players[1]!.militaryResult = -7;
    state.battleResults = [eliminationBattle('p2')];

    expect(rules.stageEliminationRescueChoice(state, ['p2'])).toBe(true);
    const decision = structuredClone(state.abilityRuntime!.pendingDecision!);
    expect(rules.resolveEliminationRescueDecision(state, decision, ['p2'])).toBe(true);

    const scored = rules.applyBattleScoring(state).nextState;
    expect(scored.players[1]!.status).toBe('active');
    const beforeController = scored.players[0]!.vp;
    const beforeTarget = scored.players[1]!.vp;

    expect(rules.settleEliminationRescueAfterScoring(scored)).toHaveLength(2);
    expect(scored.players[0]!.vp).toBe(beforeTarget);
    expect(scored.players[1]!.vp).toBe(beforeController);
    expect(rules.settleEliminationRescueAfterScoring(scored)).toEqual([]);

    const ranking = rules.expandSharedVictoryRanking(scored, [
      { playerId: 'p1', rank: 1 },
      { playerId: 'p2', rank: 2 },
      { playerId: 'p3', rank: 3 },
    ]);
    expect(ranking.find((entry) => entry.playerId === 'p2')?.rank).toBe(1);
    expect(rules.isEliminationRescueRuntimeProvenanceValidForRestore(structuredClone(scored))).toBe(true);
  });

  it('keeps production runtime identity-free for Fou consumers', () => {
    const production = [
      'packages/rules/src/ability/permanent-skill-tuning-capability.ts',
      'packages/rules/src/ability/elimination-rescue-link-capability.ts',
      'packages/rules/src/ability/interpreter.ts',
      'packages/rules/src/core/scoring-resolver.ts',
      'packages/rules/src/match-session.ts',
    ].map((path) => readFileSync(path, 'utf8')).join('\n').toLowerCase();

    for (const needle of ['master.fou', '芙芙', '兽之印记', '苍天之力', 'core.fou-']) {
      expect(production).not.toContain(needle.toLowerCase());
    }
  });
});
