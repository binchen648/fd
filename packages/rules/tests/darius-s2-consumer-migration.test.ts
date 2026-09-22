import { createHash } from 'node:crypto';
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { describe, expect, it } from 'vitest';

import * as rules from '../src/index';
import type { GameState } from '../src/schema/game';
import { createSeededGameState } from '../src/tools/seeded-state';

const ROOT = resolve('.');
const OWNER = 'servant.darius';
const ID = 'servant.darius.skill.sc-darius-2';
const S1 = 'servant.darius.skill.sc-darius-1';
const TEXT = '【真名解放】打开冥府之门-行动阶段：你控制的【不死兵】获得+1威力且于本回合不会被关闭。';
const TEXT_SHA = '9306d30ca4244bde6326a78944a19e633f1dd3735f5cf4d2b33c4215ac794c01';
const UNDEAD = [
  'servant.darius.skill.sc-darius-4',
  'card.skill.servant.darius.skill.sc-darius-4',
  'card.x-immortal',
] as const;

function hash(text: string): string {
  return createHash('sha256').update(text, 'utf8').digest('hex');
}

function rawArchive(): any {
  return JSON.parse(readFileSync(resolve(ROOT, 'data/authoring/servants/servant.darius.json'), 'utf8'));
}

function syntheticTarget(id: string): any {
  return {
    id, name: id, cardType: 'servant_skill', owner: { type: 'servant', id: OWNER },
    cardFace: { typeLabel: '特殊', attributes: ['特殊'], cost: 0, basePower: 2 },
    playTiming: { phase: 'action', window: 'controller_play_card_window' }, playRequirements: [],
    abilities: [], mode: 'automatic',
  };
}

function setup() {
  const pack: any = rules.loadAuthoringJson(rawArchive());
  expect(pack.report).toEqual([]);
  for (const id of UNDEAD) pack.cards[id] = syntheticTarget(id);
  pack.cards['test.unrelated'] = syntheticTarget('test.unrelated');

  const state = createSeededGameState({ activeSeats: [1, 2] });
  state.cards = [];
  state.round.roundNumber = 3;
  state.round.activePhase = 'action';
  state.round.prioritySeat = 1;
  state.players[0]!.servantCardId = OWNER;
  state.players[0]!.mana = 12;
  const add = (instanceId: string, definitionId: string, controllerPlayerId = 'p1') => {
    state.cards.push({
      instanceId, definitionId, ownerPlayerId: controllerPlayerId, controllerPlayerId,
      zone: 'field', visibility: { scope: 'public' },
    });
  };
  add('darius-gate', ID);
  UNDEAD.forEach((id, index) => add(`undead-${index + 1}`, id));
  add('unrelated', 'test.unrelated');
  add('enemy-undead', UNDEAD[0], 'p2');
  rules.initializeAbilityRuntime(state, pack, { seed: 20260920 });
  for (const card of state.cards) {
    state.abilityRuntime!.cardState[card.instanceId] = { active: true, faceDown: false, playedRound: 1 };
  }
  return state;
}

function openGate(state: GameState): void {
  rules.executeAbility(state, {
    sourceCardId: 'darius-gate', abilityId: 'open-underworld-gate', controllerId: 'p1', variables: {}, selections: {},
  });
}

function power(state: GameState, instanceId: string): number {
  return rules.calculateCardPower(state, instanceId).value;
}

describe('P3 S R88 Darius s2 consumer migration', () => {
  it('adds exactly Darius s2 beside the accepted s1 with frozen hashes and Reference static metadata', () => {
    const raw = rawArchive();
    expect(raw.cards.map((card: any) => card.id)).toEqual([S1, ID]);
    const authored = raw.cards[1];
    expect(authored).toMatchObject({
      id: ID, aliases: ['sc_darius_2'], legacyId: 'sc_darius_2', name: '巴比伦之门',
      cardType: 'servant_skill', owner: { type: 'servant', id: OWNER },
      cardFace: { typeLabel: '特殊/宝具', attributes: ['特殊', '宝具'], cost: 4, basePower: 0 },
      playTiming: { phase: 'action', window: 'controller_play_card_window' },
      playRequirements: [{ type: 'skill_zone_mana_at_least', value: 8 }],
      phase3Evidence: {
        f1Commit: '59f145434695d29bdd17e4cb3adc887e84182377',
        f1ClauseSources: [{ locator: 'skillCards[21].abilities[0].printedClause', sha256: TEXT_SHA }],
        f1FullPrintedTextSha256: TEXT_SHA,
        referenceStaticMetadata: {
          commit: 'b2f9fa15fba07c63530bbf4612b03b8b704755f9', legacySkillId: 'sc_darius_2', class: 'Berserker',
          cost: 4, basePower: 0, legacyRequirement: 8, typeLabel: '特殊/宝具', attributes: ['特殊', '宝具'],
        },
      },
    });
    expect(authored.printedText).toBe(TEXT);
    expect(authored.abilities[0].printedClause).toBe(TEXT);
    expect(hash(authored.printedText)).toBe(TEXT_SHA);
    expect(hash(authored.abilities[0].printedClause)).toBe(TEXT_SHA);
  });

  it('loads the complete card automatically with the exact normalized modifier set and visibility', () => {
    const pack = rules.loadAuthoringJson(rawArchive());
    expect(pack.report).toEqual([]);
    const card = pack.cards[ID]!;
    expect(card.mode).toBe('automatic');
    expect(card.abilities).toHaveLength(1);
    const ability = card.abilities[0]!;
    expect(ability).toMatchObject({
      id: 'open-underworld-gate', kind: 'phase_action',
      activation: { phase: 'action', opens: 'controller_action_window', requiresSourceState: 'active' },
      conditions: [{ type: 'source_active' }], lifecycle: { duration: 'this_round' },
      visibility: { revealsTrueName: true, revealTiming: 'on_use_declared', revealScope: 'servant_package' },
      execution: { mode: 'automatic' },
    });
    expect(ability.ruleModifiers).toHaveLength(6);
    for (const id of UNDEAD) {
      expect(ability.ruleModifiers).toEqual(expect.arrayContaining([
        expect.objectContaining({ operation: 'add', rule: 'card.currentPower', value: 1, scope: { controller: 'self', constraints: [{ type: 'has_card_id', cardId: id }] }, lifecycle: { duration: 'this_round' } }),
        expect.objectContaining({ operation: 'forbid', rule: 'card_close', scope: { controller: 'self', constraints: [{ type: 'has_card_id', cardId: id }] }, lifecycle: { duration: 'this_round' } }),
      ]));
    }
  });

  it('grants +1 power and close protection only to all three matching controller-owned undead definitions', () => {
    const state = setup();
    expect(['undead-1', 'undead-2', 'undead-3', 'unrelated', 'enemy-undead'].map((id) => power(state, id))).toEqual([2, 2, 2, 2, 2]);
    openGate(state);
    expect(state.abilityRuntime!.ongoingEffects).toHaveLength(1);
    expect(['undead-1', 'undead-2', 'undead-3', 'unrelated', 'enemy-undead'].map((id) => power(state, id))).toEqual([3, 3, 3, 2, 2]);
    expect(['undead-1', 'undead-2', 'undead-3', 'unrelated', 'enemy-undead'].map((id) => rules.isCardCloseForbidden(state, id))).toEqual([true, true, true, false, false]);
  });

  it('rejects a protected typed close atomically, then expires both effects exactly next round', () => {
    const state = setup();
    openGate(state);
    const before = structuredClone(state);
    expect(() => rules.executeResolution({
      state, controllerId: 'p1', sourceCardId: 'undead-1', abilityId: 'test-close',
      effects: [{ id: 'close-undead', type: 'close_source_card' }], resolutionId: 'darius-s2-protected-close', causationId: 'darius-s2-test',
    })).toThrow(/forbidden by a live rule modifier/);
    expect(state).toEqual(before);

    state.round.roundNumber = 4;
    expect(['undead-1', 'undead-2', 'undead-3'].map((id) => power(state, id))).toEqual([2, 2, 2]);
    expect(['undead-1', 'undead-2', 'undead-3'].map((id) => rules.isCardCloseForbidden(state, id))).toEqual([false, false, false]);
    const closed = rules.executeResolution({
      state, controllerId: 'p1', sourceCardId: 'undead-1', abilityId: 'test-close',
      effects: [{ id: 'close-undead-after-expiry', type: 'close_source_card' }], resolutionId: 'darius-s2-expired-close', causationId: 'darius-s2-test',
    }).nextState;
    expect(closed.cards.find((card) => card.instanceId === 'undead-1')).toMatchObject({ zone: 'skill' });
    expect(closed.abilityRuntime!.cardState['undead-1']).toMatchObject({ active: false, faceDown: false });
  });

  it('drops both modifier families when the Gate source is no longer active', () => {
    const state = setup();
    openGate(state);
    const gate = state.cards.find((card) => card.instanceId === 'darius-gate')!;
    gate.zone = 'skill';
    state.abilityRuntime!.cardState['darius-gate']!.active = false;
    expect(power(state, 'undead-1')).toBe(2);
    expect(rules.isCardCloseForbidden(state, 'undead-1')).toBe(false);
  });
});
