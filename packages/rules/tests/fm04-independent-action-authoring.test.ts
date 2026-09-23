import { createHash } from 'node:crypto';
import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';

import * as rules from '../src/index';
import type { GameState } from '../src/schema/game';
import { createSeededGameState } from '../src/tools/seeded-state';

const F1_COMMIT = '59f145434695d29bdd17e4cb3adc887e84182377';
const REFERENCE_COMMIT = 'b2f9fa15fba07c63530bbf4612b03b8b704755f9';
const FULL_TEXT_SHA = '792fe5ed9a320b58e58103d05aaf9ae27755c5940c159bf47733f04d36da7bc5';
const LINE1_SHA = '7c6de07a6a417f713775f4b60e841702f277911a2cf4be6c44eb3a94daf890eb';
const LINE2_SHA = '776f615275054afec79151bd37488df2ec5bbc5cc74adc3a48e5355ed8456a14';
const LINE3_SHA = 'f3d42c4920cb6e66da0ad331c8cd2e994d01969a299881245db781a2fc24d4b5';

const family = [
  ['servant.atalanta', 'servant.atalanta.skill.sc-atalanta-3'],
  ['servant.baobhan', 'servant.baobhan.skill.sc-baobhan-3'],
  ['servant.chiron', 'servant.chiron.skill.sc-chiron-1'],
  ['servant.emiya-alt', 'servant.emiya-alt.skill.sc-emiya-alt-1'],
  ['servant.euryale', 'servant.euryale.skill.sc-euryale-1'],
  ['servant.gil', 'servant.gil.skill.sc-gil-1'],
  ['servant.ishtar', 'servant.ishtar.skill.sc-ishtar-3'],
  ['servant.napoleon', 'servant.napoleon.skill.sc-napoleon-3'],
  ['servant.robin', 'servant.robin.skill.sc-robin-1'],
  ['servant.tomoe', 'servant.tomoe.skill.sc-tomoe-1'],
  ['servant.tristan', 'servant.tristan.skill.sc-tristan-3'],
] as const;

const newMembers = family.filter(([owner]) => owner !== 'servant.tomoe');

function sha(value: string): string {
  return createHash('sha256').update(value, 'utf8').digest('hex');
}

function readArchive(ownerId: string): any {
  return JSON.parse(readFileSync(`data/authoring/servants/${ownerId}.json`, 'utf8'));
}

function selectedCard(ownerId: string, cardId: string): any {
  const card = readArchive(ownerId).cards.find((candidate: any) => candidate.id === cardId);
  if (!card) throw new Error(`Missing FM04 card ${cardId}`);
  return card;
}

function abilityIds(cardId: string): { action: string; penalty: string } {
  const suffix = cardId.split('.skill.')[1]!;
  return { action: `${suffix}.independent-action`, penalty: `${suffix}.penalty-on-defeat` };
}

function setupAtalanta(phase: 'action' | 'battle', vp: number): { state: GameState; sourceId: string; actionId: string; penaltyId: string } {
  const ownerId = 'servant.atalanta';
  const cardId = 'servant.atalanta.skill.sc-atalanta-3';
  const archive = readArchive(ownerId);
  const pack = rules.loadAuthoringJson(archive);
  expect(pack.report).toEqual([]);
  const state = createSeededGameState({ activeSeats: [1, 2] });
  state.cards = [];
  state.round.activePhase = phase;
  state.round.prioritySeat = 1;
  state.players[0]!.servantCardId = ownerId;
  state.players[0]!.vp = vp;
  state.players[1]!.vp = 0;
  rules.initializeAbilityRuntime(state, pack, { seed: 20260916 });
  const sourceId = 'fm04-atalanta-source';
  state.cards.push({
    instanceId: sourceId,
    definitionId: cardId,
    ownerPlayerId: 'p1',
    controllerPlayerId: 'p1',
    zone: 'field',
    visibility: { scope: 'public' },
  });
  state.abilityRuntime!.cardState[sourceId] = { active: true, faceDown: false, playedRound: state.round.roundNumber };
  const ids = abilityIds(cardId);
  return { state, sourceId, actionId: ids.action, penaltyId: ids.penalty };
}

function lossEvent(id = 'fm04-loss') {
  return {
    id,
    type: 'after_battle_result_determined' as const,
    battlePhaseResolutionId: 'battle-phase:fm04',
    battleId: 'battle-phase:fm04:battle:shinto:1',
    resultId: id,
    battleParticipantIds: ['p1', 'p2'],
    battlefieldId: 'shinto',
    battleResult: { winners: ['p2'], loserIds: ['p1'] },
  };
}

describe('P3-FM04 exact Archer Independent Action migration', () => {
  it('freezes exactly the accepted eleven-member family while adding only ten minimal archives', () => {
    expect(new Set(family.map(([, cardId]) => cardId)).size).toBe(11);
    expect(newMembers).toHaveLength(10);
    for (const [ownerId, cardId] of newMembers) {
      const raw = readArchive(ownerId);
      expect(raw.id).toBe(ownerId);
      expect(raw.class).toBe('Archer');
      const matches = raw.cards.filter((card: any) => card.id === cardId);
      expect(matches).toHaveLength(1);
      if (ownerId !== 'servant.atalanta') expect(raw.cards).toHaveLength(1);
    }
    const tomoe = readArchive('servant.tomoe');
    expect(tomoe.cards.length).toBeGreaterThan(1);
    expect(tomoe.cards.some((card: any) => card.id === 'servant.tomoe.skill.sc-tomoe-1')).toBe(true);
  });

  it('preserves the frozen full text and exact three source clauses for all eleven', () => {
    for (const [ownerId, cardId] of family) {
      const card = selectedCard(ownerId, cardId);
      expect(sha(card.printedText)).toBe(FULL_TEXT_SHA);
      const [action, penalty] = card.abilities;
      expect(`${action.printedClause}\n${penalty.printedClause}`).toBe(card.printedText);
      const [line1, line2] = action.printedClause.split('\n');
      expect(sha(line1)).toBe(LINE1_SHA);
      expect(sha(line2)).toBe(LINE2_SHA);
      expect(sha(penalty.printedClause)).toBe(LINE3_SHA);
    }
  });

  it('preserves uniform static metadata and final 8-mana skill-zone threshold', () => {
    for (const [ownerId, cardId] of newMembers) {
      const card = selectedCard(ownerId, cardId);
      expect(card.cardFace).toEqual({ typeLabel: '特殊', attributes: ['特殊'], cost: 0, basePower: 6 });
      expect(card.playRequirements).toContainEqual({ type: 'skill_zone_mana_at_least', value: 8 });
      expect(card.phase3Evidence).toMatchObject({
        f1Commit: F1_COMMIT,
        sourceTextSha256: FULL_TEXT_SHA,
        referenceStaticMetadata: {
          commit: REFERENCE_COMMIT,
          cost: 0,
          basePower: 6,
          legacyRequirement: 0,
          typeLabel: '特殊',
        },
        canonicalSkillZoneManaRequirement: { value: 8, authority: 'final_rules_9.4' },
        acceptedContracts: { independentAction: 'P3-R31/TO08', penaltyOnDefeat: 'P3-R31/B21/R15' },
      });
      expect(card.phase3Evidence.f1ClauseSources.map((source: any) => source.sha256)).toEqual([LINE1_SHA, LINE2_SHA, LINE3_SHA]);
    }
  });

  it('loads all eleven into exactly the two independently accepted semantic contracts', () => {
    for (const [ownerId, cardId] of family) {
      const pack = rules.loadAuthoringJson(readArchive(ownerId));
      const errors = pack.report.filter((entry) => entry.cardId === cardId && entry.status === 'unsupported');
      expect(errors).toEqual([]);
      const compiled = pack.cards[cardId];
      expect(compiled).toBeDefined();
      expect(compiled!.abilities).toHaveLength(2);
      expect(rules.isResourceNumericDirectActionSemantic(compiled!.abilities[0]!)).toBe(true);
      expect(rules.isBattleLossUnpreventableVpTriggerSemantic(compiled!.abilities[1]!)).toBe(true);
    }
  });

  it('runs newly migrated Atalanta through legal first-half +3 VP and unpreventable post-loss -5 VP', () => {
    const actionSetup = setupAtalanta('action', 1);
    const legal = rules.getLegalActions(actionSetup.state, 'p1').find((candidate) =>
      candidate.type === 'activate_ability' && candidate.cardInstanceId === actionSetup.sourceId && candidate.abilityId === actionSetup.actionId);
    expect(legal).toBeDefined();
    expect(rules.dispatchAbilityCommand(actionSetup.state, 'p1', legal!).ok).toBe(true);
    expect(actionSetup.state.players[0]!.vp).toBe(4);
    expect(actionSetup.state.abilityRuntime!.events).toContainEqual(expect.objectContaining({
      type: 'victory_points_adjusted', playerId: 'p1', abilityId: actionSetup.actionId, delta: 3, before: 1, after: 4,
    }));

    const lossSetup = setupAtalanta('battle', 7);
    lossSetup.state.abilityRuntime!.preventEffects = true;
    rules.processAbilityEvent(lossSetup.state, lossEvent());
    expect(lossSetup.state.players[0]!.vp).toBe(2);
    expect(lossSetup.state.abilityRuntime!.events).toContainEqual(expect.objectContaining({
      type: 'victory_points_adjusted', playerId: 'p1', abilityId: lossSetup.penaltyId,
      delta: -5, before: 7, after: 2, unpreventable: true,
    }));
    expect(lossSetup.state.abilityRuntime!.events.some((event) => event.type === 'effect_prevented' && event.abilityId === lossSetup.penaltyId)).toBe(false);
  });
});
