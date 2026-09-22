import { createHash } from 'node:crypto';
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { describe, expect, it } from 'vitest';

import * as rules from '../src/index';
import type { GameState } from '../src/schema/game';
import { createSeededGameState } from '../src/tools/seeded-state';

const ROOT = resolve('.');
const MEMBERS = [
  { owner: 'servant.abigail', id: 'servant.abigail.skill.sc-abigail-4', sha: 'c067eaf714c63dc3cb08957261a643c8107e21ebd66fc2981008ac075957e940', className: 'Foreigner', requirement: 1 },
  { owner: 'servant.clytie', id: 'servant.clytie.skill.sc-clytie-4', sha: '146c26d2ca823f92c1a758e9e23c37f6d8f88c54e3818164b153af19260d464f', className: 'Foreigner', requirement: 0 },
  { owner: 'servant.hokusai', id: 'servant.hokusai.skill.sc-hokusai-4', sha: 'e0c05d4411c50ccc67a2354a8d856c79014a6a6e63d41f32b59d364b471326f3', className: 'Foreigner', requirement: 1 },
  { owner: 'servant.molay', id: 'servant.molay.skill.sc-molay-4', sha: '9aa41b08e14ff5d692af6b91a7f653b0626c3419b3a847611da5fa2a750cf97f', className: 'Saber', requirement: 1 },
  { owner: 'servant.voyager', id: 'servant.voyager.skill.sc-voyager-4', sha: 'd0ba9965338bcd719d3631256f57144ff71363113069c44dfb4225af5296d0bd', className: 'Foreigner', requirement: 0 },
] as const;

function archive(owner: string): any {
  return JSON.parse(readFileSync(resolve(ROOT, `data/authoring/servants/${owner}.json`), 'utf8'));
}
function hash(text: string): string {
  return createHash('sha256').update(text, 'utf8').digest('hex');
}
function loadMember(member = MEMBERS[0]) {
  const raw = archive(member.owner);
  const pack = rules.loadAuthoringJson(raw);
  expect(pack.report).toEqual([]);
  (pack.cards[member.id] as any).ownerId = member.owner;
  return { raw, pack, card: pack.cards[member.id]! };
}
function setup(member = MEMBERS[0], controller = 'p1', ownerPlayer = 'p2', instance = `${member.id}.instance`) {
  const { pack, card } = loadMember(member);
  const state = createSeededGameState({ activeSeats: [1, 2, 3] });
  state.cards = [{
    instanceId: instance,
    definitionId: member.id,
    ownerPlayerId: controller,
    controllerPlayerId: controller,
    zone: 'attack_area',
    visibility: { scope: 'public' },
  }];
  state.round.activePhase = 'battle';
  state.round.prioritySeat = state.players.find((player) => player.id === controller)!.seat;
  state.players[0]!.locationId = 'miyama_town';
  state.players[1]!.locationId = 'miyama_town';
  state.players[2]!.locationId = 'shinto';
  state.players.find((player) => player.id === ownerPlayer)!.servantCardId = member.owner;
  rules.initializeAbilityRuntime(state, pack, { seed: 20260919 });
  (state as any).modeState = { stagedAttacks: {} };
  state.abilityRuntime!.cardState[instance] = { active: true, faceDown: false, playedRound: state.round.roundNumber };
  return { state, pack, card, instance, abilityId: card.abilities[0]!.id };
}
function activate(state: GameState, playerId: string, instance: string, abilityId: string) {
  return rules.dispatchAbilityCommand(state, playerId, { type: 'activate_ability', cardInstanceId: instance, abilityId });
}
function terminal(id = 'outer-consumer-terminal') {
  return {
    id,
    type: 'after_battle_ended',
    battlePhaseResolutionId: 'outer-consumer-phase',
    battleIds: ['b1'], resultIds: ['r1'], scoringReceiptIds: ['s1'],
    battleParticipantIds: ['p1', 'p2'],
    battleOutcomes: [{ battlefieldId: 'miyama_town', winnerPlayerIds: ['p1'] }],
  } as const;
}

describe('P3 R67 Outer-God-Life consumer migration', () => {
  it('contains exactly the five F1-grounded standalone definitions and each matches the accepted structural contract', () => {
    const ids: string[] = [];
    for (const member of MEMBERS) {
      const { raw, card } = loadMember(member);
      expect(raw).toMatchObject({
        archiveType: 'servant_skill_card_archive', id: member.owner, class: member.className,
        sourcePolicy: {
          phase3EvidenceCommit: '59f145434695d29bdd17e4cb3adc887e84182377',
          referenceMetadataCommit: 'b2f9fa15fba07c63530bbf4612b03b8b704755f9',
        },
      });
      expect(raw.cards).toHaveLength(1);
      const authored = raw.cards[0];
      ids.push(authored.id);
      expect(authored).toMatchObject({
        id: member.id,
        name: '领域外生命',
        cardType: 'servant_skill',
        owner: { type: 'servant', id: member.owner },
        cardFace: { typeLabel: '特殊', attributes: ['特殊'], cost: 1, basePower: 0, semanticCategory: 'outer_god_life' },
        phase3Evidence: {
          sourceTextSha256: member.sha,
          referenceStaticMetadata: { legacyRequirement: member.requirement },
          acceptedContracts: { outerGodLifeSubsystem: 'P3-R67/FB2-29' },
        },
      });
      expect(hash(authored.printedText)).toBe(member.sha);
      expect(rules.isOuterGodLifeAbilitySemantic(card.abilities[0]!)).toBe(true);
    }
    expect(ids).toEqual(MEMBERS.map((member) => member.id));
    expect(new Set(ids).size).toBe(5);

    const manifest = readFileSync(resolve(ROOT, 'data/packs/fd-playtest-v1/pack.json'), 'utf8');
    const generated = readFileSync(resolve(ROOT, 'data/generated/fd-playtest-v1.content-library.json'), 'utf8');
    for (const member of MEMBERS) {
      expect(manifest).not.toContain(`data/authoring/servants/${member.owner}.json`);
      expect(generated).not.toContain(member.id);
    }
  });

  it('executes every real migrated definition through the same structural relation without an identity special case', () => {
    for (const member of MEMBERS) {
      const { state, instance, abilityId } = setup(member);
      expect(activate(state, 'p1', instance, abilityId).ok).toBe(true);
      expect(state.abilityRuntime!.roundTotalPowerAdjustments.byPlayer).toEqual({ p1: 6, p2: 6 });
      expect(state.abilityRuntime!.pendingSourceCardReturns).toEqual([
        expect.objectContaining({ sourceCardId: instance, recipientPlayerId: 'p2' }),
      ]);
    }

    const same = setup(MEMBERS[3], 'p1', 'p1');
    expect(activate(same.state, 'p1', same.instance, same.abilityId).ok).toBe(true);
    expect(same.state.abilityRuntime!.roundTotalPowerAdjustments.byPlayer).toEqual({ p1: 6 });
  });

  it('requires exactly one live owner at use time and ignores eliminated duplicate matches transactionally', () => {
    const eliminated = setup(MEMBERS[0]);
    eliminated.state.players[1]!.status = 'eliminated';
    const before = structuredClone(eliminated.state);
    const rejected = activate(eliminated.state, 'p1', eliminated.instance, eliminated.abilityId);
    expect(rejected.ok).toBe(false);
    expect(rejected.rejection?.code).toBe('resolution_failed');
    expect(eliminated.state).toEqual(before);

    const duplicate = setup(MEMBERS[1]);
    duplicate.state.players[2]!.servantCardId = MEMBERS[1].owner;
    duplicate.state.players[2]!.status = 'eliminated';
    expect(activate(duplicate.state, 'p1', duplicate.instance, duplicate.abilityId).ok).toBe(true);
    expect(duplicate.state.abilityRuntime!.roundTotalPowerAdjustments.byPlayer).toEqual({ p1: 6, p2: 6 });
    expect(duplicate.state.abilityRuntime!.pendingSourceCardReturns[0]!.recipientPlayerId).toBe('p2');

    const ambiguous = setup(MEMBERS[2]);
    ambiguous.state.players[2]!.servantCardId = MEMBERS[2].owner;
    const ambiguousBefore = structuredClone(ambiguous.state);
    expect(activate(ambiguous.state, 'p1', ambiguous.instance, ambiguous.abilityId).ok).toBe(false);
    expect(ambiguous.state).toEqual(ambiguousBefore);
  });

  it('keeps an established physical return after later owner elimination and terminal replay is idempotent', () => {
    const { state, instance, abilityId } = setup(MEMBERS[4]);
    expect(activate(state, 'p1', instance, abilityId).ok).toBe(true);
    state.players[1]!.status = 'eliminated';
    rules.processAbilityEvent(state, terminal());
    expect(state.cards[0]).toMatchObject({
      instanceId: instance,
      ownerPlayerId: 'p2', controllerPlayerId: 'p2', zone: 'discard',
      visibility: { scope: 'owner_only', ownerPlayerId: 'p2' },
    });
    expect(state.abilityRuntime!.cardState[instance]).toMatchObject({ active: false, faceDown: false });
    expect(state.abilityRuntime!.pendingSourceCardReturns).toEqual([]);
    const snapshot = structuredClone(state);
    rules.processAbilityEvent(state, terminal());
    expect(state).toEqual(snapshot);
  });

  it('stacks independent physical sources, feeds production combat power, expires by round identity, and skips derived returns', () => {
    const stacked = setup(MEMBERS[2]);
    const second = `${stacked.instance}.second`;
    stacked.state.cards.push({
      instanceId: second, definitionId: MEMBERS[2].id, ownerPlayerId: 'p1', controllerPlayerId: 'p1',
      zone: 'attack_area', visibility: { scope: 'public' },
    });
    stacked.state.abilityRuntime!.cardState[second] = { active: true, faceDown: false, playedRound: stacked.state.round.roundNumber };
    expect(activate(stacked.state, 'p1', stacked.instance, stacked.abilityId).ok).toBe(true);
    expect(activate(stacked.state, 'p1', second, stacked.abilityId).ok).toBe(true);
    expect(stacked.state.abilityRuntime!.roundTotalPowerAdjustments.byPlayer).toEqual({ p1: 12, p2: 12 });
    const battle = rules.resolveBattlefield(stacked.state, { battlefieldId: 'miyama_town' }).nextState;
    const power = Object.fromEntries(battle.battleResults.at(-1)!.participantBreakdowns.map((entry) => [entry.playerId, entry.effectivePower]));
    expect(power.p1).toBe(12);
    expect(power.p2).toBe(12);
    rules.advanceAbilityPhase(stacked.state, 'round_start', 2);
    expect(rules.roundTotalPowerAdjustment(stacked.state, 'p1')).toBe(0);

    const derived = setup(MEMBERS[3]);
    derived.state.cards[0]!.generatedBy = 'another-source';
    expect(activate(derived.state, 'p1', derived.instance, derived.abilityId).ok).toBe(true);
    expect(derived.state.abilityRuntime!.pendingSourceCardReturns).toEqual([]);
  });
});