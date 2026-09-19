import { createHash } from 'node:crypto';
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { describe, expect, it } from 'vitest';

import * as rules from '../src/index';
import type { GameState } from '../src/schema/game';
import { createSeededGameState } from '../src/tools/seeded-state';

const ROOT = resolve('.');
const OWNER = 'servant.ibaraki';
const ID = 'servant.ibaraki.skill.sc-ibaraki-1';
const SOURCE_INSTANCE = 'ibaraki-source';
const FULL_SHA = '1ed4b6ca04b7bec829e082e897fa5d5a1a23d3cc7215d2a8865261218e24f14d';
const P1_ATTACK = 'fixture.ibaraki.p1-attack';
const P2_ATTACK = 'fixture.ibaraki.p2-attack';
const P3_ATTACK = 'fixture.ibaraki.p3-attack';
const SUPPORT = 'fixture.ibaraki.support';

function hash(text: string): string {
  return createHash('sha256').update(text, 'utf8').digest('hex');
}

function rawArchive(): any {
  return JSON.parse(readFileSync(resolve(ROOT, 'data/authoring/servants/servant.ibaraki.json'), 'utf8'));
}

function testArchive(): any {
  const raw = rawArchive();
  const attack = (id: string, cost: number, basePower: number) => ({
    id, name: id, cardType: 'basic_attack',
    cardFace: { cost, basePower, attributes: ['力量'] },
    playTiming: { phase: 'action', window: 'controller_play_card_window' },
    playRequirements: [], abilities: [],
  });
  return {
    ...raw,
    cards: [
      ...raw.cards,
      attack(P1_ATTACK, 3, 1),
      attack(P2_ATTACK, 2, 4),
      attack(P3_ATTACK, 0, 2),
      {
        id: SUPPORT, name: 'support', cardType: 'event',
        cardFace: { cost: 9, basePower: 0, attributes: [] },
        playTiming: { phase: 'action', window: 'controller_play_card_window' },
        playRequirements: [],
        abilities: [{
          id: 'support.move-self', kind: 'residual', printedClause: 'fixture',
          activation: { trigger: 'on_card_played' }, conditions: [], targets: [],
          effects: [{ type: 'move_card', target: 'this_card', to: { zone: 'attack_area' } }],
          cost: [], creates: [], lifecycle: {}, responseWindow: {}, limit: {}, visibility: {}, ruleModifiers: [],
          execution: { mode: 'automatic', allowedOperations: [] },
        }],
      },
    ],
  };
}

function add(state: GameState, instanceId: string, definitionId: string, playerId: string, zone: 'hand' | 'skill' = 'hand') {
  state.cards.push({
    instanceId, definitionId, ownerPlayerId: playerId, controllerPlayerId: playerId, zone,
    visibility: zone === 'skill' ? { scope: 'public' } : { scope: 'owner_only', ownerPlayerId: playerId },
  });
}

function setup() {
  const pack = rules.loadAuthoringJson(testArchive());
  expect(pack.report).toEqual([]);
  const state = createSeededGameState({ activeSeats: [1, 2, 3] });
  state.cards = [];
  state.round.activePhase = 'action';
  for (const player of state.players) {
    if (['p1', 'p2', 'p3'].includes(player.id)) {
      player.locationId = 'miyama_town';
      player.mana = 20;
    }
  }
  add(state, SOURCE_INSTANCE, ID, 'p1', 'skill');
  add(state, 'p1-attack', P1_ATTACK, 'p1');
  add(state, 'p2-attack', P2_ATTACK, 'p2');
  add(state, 'p3-attack', P3_ATTACK, 'p3');
  rules.initializeAbilityRuntime(state, pack, { seed: 20260920 });
  return state;
}

function play(state: GameState, playerId: string, cardInstanceId: string) {
  state.round.prioritySeat = state.players.find((candidate) => candidate.id === playerId)!.seat;
  rules.playAbilityCardBatch(state, playerId, [{ cardInstanceId }]);
}

function battle(state: GameState) {
  state.round.activePhase = 'battle';
  return rules.resolveBattlefield(state, { battlefieldId: 'miyama_town' }).nextState.battleResults.at(-1)!;
}

function power(result: GameState['battleResults'][number], playerId: string) {
  return result.participantBreakdowns.find((entry) => entry.playerId === playerId)!.effectivePower;
}

describe('P3 S R75 Ibaraki consumer migration', () => {
  it('materializes exactly the frozen card with exact evidence and accepted compiled semantics', () => {
    const raw = rawArchive();
    expect(raw).toMatchObject({
      schemaVersion: 'fd-card-authoring-v1', archiveType: 'servant_skill_card_archive',
      id: OWNER, class: 'Berserker',
      sourcePolicy: {
        phase3EvidenceCommit: '59f145434695d29bdd17e4cb3adc887e84182377',
        referenceMetadataCommit: 'b2f9fa15fba07c63530bbf4612b03b8b704755f9',
      },
    });
    expect(raw.cards.map((card: any) => card.id)).toEqual([ID]);
    const authored = raw.cards[0];
    expect(authored).toMatchObject({
      id: ID, legacyId: 'sc_ibaraki_1', cardType: 'servant_skill',
      owner: { type: 'servant', id: OWNER },
      cardFace: { typeLabel: '被动', attributes: [], cost: 0, basePower: 0 },
      playTiming: { phase: 'action', window: 'controller_play_card_window' },
      playRequirements: [],
      phase3Evidence: {
        sourceTextSha256: FULL_SHA,
        referenceStaticMetadata: {
          legacySkillId: 'sc_ibaraki_1', class: 'Berserker', cost: 0, basePower: 0, legacyRequirement: 0, typeLabel: '被动',
        },
      },
    });
    expect(hash(authored.printedText)).toBe(FULL_SHA);
    expect(hash(authored.abilities[0].printedClause)).toBe(FULL_SHA);
    expect(authored.abilities).toHaveLength(1);

    const pack = rules.loadAuthoringJson(raw);
    expect(pack.report).toEqual([]);
    const card = pack.cards[ID]!;
    expect(card.mode).toBe('automatic');
    expect(card.abilities).toHaveLength(1);
    expect(rules.isAcceptedRoundActiveAttackPaidCostCombatPowerAbility(card.abilities[0] as any, 'compiled')).toBe(true);
  });

  it('uses the real migrated definition to add +6 to the unique highest paid-cost participant before winner selection without changing card power', () => {
    const state = setup();
    play(state, 'p1', 'p1-attack');
    play(state, 'p2', 'p2-attack');
    expect(rules.calculateCardPower(state, 'p1-attack').value).toBe(1);
    const result = battle(state);
    expect(power(result, 'p1')).toBe(7);
    expect(power(result, 'p2')).toBe(4);
    expect(result.winnerPlayerIds).toEqual(['p1']);
    expect(rules.calculateCardPower(state, 'p1-attack').value).toBe(1);
  });

  it('preserves highest-paid ties, treats a paid-zero attack as real, and excludes a player with no qualifying attack', () => {
    const tied = setup();
    tied.abilityRuntime!.pack.cards[P2_ATTACK]!.cardFace.cost = 3;
    play(tied, 'p1', 'p1-attack');
    play(tied, 'p2', 'p2-attack');
    const tieResult = battle(tied);
    expect(power(tieResult, 'p1')).toBe(7);
    expect(power(tieResult, 'p2')).toBe(10);
    expect(tieResult.participantBreakdowns.find((entry) => entry.playerId === 'p3')!.totalModifier).toBe(0);

    const zero = setup();
    play(zero, 'p3', 'p3-attack');
    expect(power(battle(zero), 'p3')).toBe(8);
  });

  it('excludes paid non-attacks moved into attack_area and fails closed for invalid source ownership/battlefield relation', () => {
    const support = setup();
    add(support, 'p1-support', SUPPORT, 'p1');
    play(support, 'p1', 'p1-support');
    play(support, 'p2', 'p2-attack');
    const supportResult = battle(support);
    expect(power(supportResult, 'p1')).toBe(0);
    expect(power(supportResult, 'p2')).toBe(10);

    const cases: Array<(state: GameState) => void> = [
      (state) => { state.cards.find((card) => card.instanceId === SOURCE_INSTANCE)!.ownerPlayerId = 'p2'; },
      (state) => { state.players.find((player) => player.id === 'p1')!.locationId = 'recon'; },
    ];
    for (const mutate of cases) {
      const state = setup();
      play(state, 'p2', 'p2-attack');
      mutate(state);
      expect(power(battle(state), 'p2')).toBe(4);
    }
  });

  it('keeps the standalone migration out of production pack/generated product', () => {
    const manifest = readFileSync(resolve(ROOT, 'data/packs/fd-playtest-v1/pack.json'), 'utf8');
    const generated = readFileSync(resolve(ROOT, 'data/generated/fd-playtest-v1.content-library.json'), 'utf8');
    expect(manifest).not.toContain('data/authoring/servants/servant.ibaraki.json');
    expect(generated).not.toContain(ID);
  });
});
