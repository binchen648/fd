import { createHash } from 'node:crypto';
import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';

import * as rules from '../../src/index';
import type { GameState } from '../../src/schema/game';
import { createSeededGameState } from '../../src/tools/seeded-state';

const ROOT = 'master.fiore';
const PATH = 'data/authoring/masters/master.fiore.json';
const S1 = ROOT + '.skill.s1';
const S1A = ROOT + '.skill.s1a';
const S2 = ROOT + '.skill.s2';
const S3 = ROOT + '.skill.s3';
const S4 = ROOT + '.skill.s4';
const S5 = ROOT + '.skill.s5';
const S6 = ROOT + '.skill.s6';
const S7 = ROOT + '.skill.s7';
const ASC = ROOT + '.skill.ascension';
const IDS = [S1, S1A, S2, S3, S4, S5, S6, S7, ASC];

const raw = JSON.parse(readFileSync(PATH, 'utf8'));
const loaded = rules.loadAuthoringJson(raw);
const card = (id: string) => loaded.cards[id]!;

function setup(activeSeats = [1, 2, 3]): GameState {
  for (const definition of Object.values(loaded.cards) as any[]) definition.ownerId = ROOT;
  const state = createSeededGameState({ activeSeats });
  state.cards = [];
  state.players[0]!.masterCardId = ROOT;
  state.players[0]!.mana = 12;
  state.players[0]!.vp = 2;
  state.players[0]!.locationId = 'miyama_town';
  state.players[1]!.vp = 5;
  state.players[1]!.locationId = 'miyama_town';
  if (state.players[2]) {
    state.players[2]!.vp = 1;
    state.players[2]!.locationId = 'shinto';
  }
  state.round.prioritySeat = state.players[0]!.seat;
  rules.initializeAbilityRuntime(state, loaded, { seed: 20261007 });
  return state;
}

function add(state: GameState, definitionId: string, zone = 'skill', active = false): string {
  const instanceId = 'fiore-owner:' + definitionId.split('.').at(-1) + ':' + state.cards.length;
  state.cards.push({
    instanceId,
    definitionId,
    ownerPlayerId: 'p1',
    controllerPlayerId: 'p1',
    zone,
    visibility: ['field', 'attack_area'].includes(zone)
      ? { scope: 'public' }
      : { scope: 'owner_only', ownerPlayerId: 'p1' },
  } as any);
  state.abilityRuntime!.cardState[instanceId] = {
    active,
    faceDown: false,
    playedRound: state.round.roundNumber,
  };
  return instanceId;
}

function action(state: GameState, cardInstanceId: string, abilityId: string) {
  return rules.getLegalActions(state, 'p1').find((entry) =>
    entry.type === 'activate_ability' &&
    entry.cardInstanceId === cardInstanceId &&
    entry.abilityId === abilityId);
}

function hashCard(id: string): string {
  const entry = raw.cards.find((candidate: any) => candidate.id === id);
  return createHash('sha256').update(JSON.stringify(entry)).digest('hex');
}

describe('P3 Fiore owner-complete migration', () => {
  it('materializes exact 9/9 owner scope and preserves accepted FM08 s2/s3/s4 objects', () => {
    expect(raw.id).toBe(ROOT);
    expect(raw.name).toBe('菲奥蕾·弗尔维吉');
    expect(raw.publicInformation).toEqual({ type: 'master_package', initialMana: 4 });
    expect(raw.cards.map((entry: any) => entry.id)).toEqual(IDS);
    expect(Object.keys(loaded.cards).sort()).toEqual([...IDS].sort());
    expect(loaded.report.filter((entry) => entry.status === 'unsupported')).toEqual([]);

    expect(hashCard(S2)).toBe('1bda7cebbae2167a86871e0ebc2e20c63ee65ec1f05228e248931e4cfc0e586c');
    expect(hashCard(S3)).toBe('1e1bd3109e39f59fea5b9c6813c71bcccc456acfc2f706aa6e32274130f2baa4');
    expect(hashCard(S4)).toBe('2af4dad6ba63323cf96e32a3e81350ef0d3bc5a0f387c09d65baa239fdada828');

    for (const id of [S5, S6, S7, ASC]) {
      expect(raw.cards.find((entry: any) => entry.id === id).initialPlacement).toBe('outside_game');
    }
  });

  it('routes every privileged Fiore consumer through the accepted identity-free readiness capability', () => {
    const privileged = [
      ...card(S1A).abilities,
      card(S5).abilities.find((ability) => ability.id === 'fiore.neuromechanics.terrain')!,
      card(S6).abilities[0]!,
      card(S7).abilities.find((ability) => ability.id === 'fiore.clever-mind.reinforcement')!,
      ...card(ASC).abilities,
    ];
    for (const ability of privileged) {
      expect(rules.containsRoundSkillProfilePrivilegedNode(ability)).toBe(true);
      expect(rules.isAcceptedRoundSkillProfileAbility(ability)).toBe(true);
    }

    expect(card(S1).abilities[0]!.effects).toEqual([]);
    expect(card(S5).cardFace).toMatchObject({
      typeLabel: '力量/特殊',
      attributes: ['力量', '特殊'],
      cost: 1,
      basePower: 3,
    });
    expect(card(S7).cardFace).toMatchObject({
      typeLabel: '魔术',
      attributes: ['魔术'],
      cost: 0,
      basePower: 1,
    });
  });

  it('executes migrated Transcend into Clever Mind and enforces exact once-per-round reinforcement', () => {
    const state = setup([1, 2]);
    const transcend = add(state, S1A);
    state.round.activePhase = 'advance';

    const circuit = action(state, transcend, 'fiore.transcend.advance.circuit');
    expect(circuit).toBeDefined();
    expect(rules.dispatchAbilityCommand(state, 'p1', circuit!).ok).toBe(true);

    const clever = state.cards.find((entry) => entry.definitionId === S7 && entry.ownerPlayerId === 'p1');
    expect(clever).toMatchObject({ zone: 'skill', generatedBy: transcend });

    clever!.zone = 'attack_area';
    state.abilityRuntime!.cardState[clever!.instanceId] = {
      active: true,
      faceDown: false,
      playedRound: state.round.roundNumber,
    };
    state.round.activePhase = 'action';

    const mana = state.players[0]!.mana;
    const first = action(state, clever!.instanceId, 'fiore.clever-mind.reinforcement');
    expect(first).toBeDefined();
    expect(rules.dispatchAbilityCommand(state, 'p1', first!).ok).toBe(true);
    expect(state.players[0]!.mana).toBe(mana - 1);
    expect(rules.roundSkillCardPowerBonus(state, 'p1')).toBe(1);
    expect(action(state, clever!.instanceId, 'fiore.clever-mind.reinforcement')).toBeUndefined();
    expect(rules.isRoundSkillProfileRuntimeProvenanceValidForRestore(structuredClone(state))).toBe(true);
  });

  it('executes Full Recovery through the same profile transaction and charges -2 VP once on controller loss', () => {
    const state = setup([1, 2]);
    const ascension = add(state, ASC);
    state.round.activePhase = 'action';
    const before = state.players[0]!.vp;

    const fullRecovery = action(state, ascension, 'fiore.full-recovery.circuit');
    expect(fullRecovery).toBeDefined();
    expect(rules.dispatchAbilityCommand(state, 'p1', fullRecovery!).ok).toBe(true);
    expect(rules.isRoundSkillProfileRuntimeProvenanceValidForRestore(structuredClone(state))).toBe(true);

    rules.settleRoundSkillProfileEvent(state, {
      type: 'after_battle_result_determined',
      battleParticipantIds: ['p1', 'p2'],
      battleResult: { winners: ['p2'], loserIds: ['p1'] },
    });
    expect(state.players[0]!.vp).toBe(before - 2);

    rules.settleRoundSkillProfileEvent(state, {
      type: 'after_battle_result_determined',
      battleParticipantIds: ['p1', 'p2'],
      battleResult: { winners: ['p2'], loserIds: ['p1'] },
    });
    expect(state.players[0]!.vp).toBe(before - 2);
  });

  it('keeps production runtime authority free of Fiore identity and printed-name branches', () => {
    const production = [
      'packages/rules/src/ability/round-skill-profile-capability.ts',
      'packages/rules/src/ability/interpreter.ts',
      'packages/rules/src/ability/loader.ts',
      'packages/rules/src/core/game-loop.ts',
      'packages/rules/src/match-session.ts',
    ].map((file) => readFileSync(file, 'utf8')).join('\n').toLowerCase();

    for (const needle of [
      'master.fiore',
      '菲奥蕾',
      '超越',
      '瘫痪',
      '温顺',
      '回路不良',
      '神经机械学',
      '决意',
      '聪慧头脑',
      '完全恢复',
      'core.fiore-',
    ]) {
      expect(production).not.toContain(needle.toLowerCase());
    }
  });
});
