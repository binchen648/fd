import { createHash } from 'node:crypto';
import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';

import * as rules from '../src/index';
import type { GameState } from '../src/schema/game';
import { createSeededGameState } from '../src/tools/seeded-state';

const F1_COMMIT = '59f145434695d29bdd17e4cb3adc887e84182377';
const REFERENCE_COMMIT = 'b2f9fa15fba07c63530bbf4612b03b8b704755f9';
const members = [
  ['servant.altera', 'servant.altera.skill.sc-altera-3', '8a6da48db16868ce5d5766fa7ff05c00b2c392f715106f869cb59aaabee65ffc'],
  ['servant.arthur', 'servant.arthur.skill.sc-arthur-3', '8a6da48db16868ce5d5766fa7ff05c00b2c392f715106f869cb59aaabee65ffc'],
  ['servant.bedivere', 'servant.bedivere.skill.sc-bedivere-1', '8a6da48db16868ce5d5766fa7ff05c00b2c392f715106f869cb59aaabee65ffc'],
  ['servant.charlemagne', 'servant.charlemagne.skill.sc-charlemagne-3', '8a6da48db16868ce5d5766fa7ff05c00b2c392f715106f869cb59aaabee65ffc'],
  ['servant.gawain', 'servant.gawain.skill.sc-gawain-3', '8a6da48db16868ce5d5766fa7ff05c00b2c392f715106f869cb59aaabee65ffc'],
  ['servant.lakshmibai', 'servant.lakshmibai.skill.sc-lakshmibai-3', 'b2b1bc7cdbc3adce79362de44635ed871f652c60e3b5abe691a07e26458a8d05'],
  ['servant.mordred', 'servant.mordred.skill.sc-mordred-3', '8a6da48db16868ce5d5766fa7ff05c00b2c392f715106f869cb59aaabee65ffc'],
  ['servant.musashi', 'servant.musashi.skill.sc-musashi-3', '8a6da48db16868ce5d5766fa7ff05c00b2c392f715106f869cb59aaabee65ffc'],
  ['servant.saber', 'servant.saber.skill.sc-saber-1', '0cdfc3fafc790b59414b23e58a39fd0926dd776a7df6ccba352ce65dd3c74d22'],
  ['servant.saitou', 'servant.saitou.skill.sc-saitou-1', 'b2b1bc7cdbc3adce79362de44635ed871f652c60e3b5abe691a07e26458a8d05'],
] as const;

function readArchive(ownerId: string): any {
  return JSON.parse(readFileSync(`data/authoring/servants/${ownerId}.json`, 'utf8'));
}

function sha(value: string): string {
  return createHash('sha256').update(value, 'utf8').digest('hex');
}

function abilityIds(cardId: string) {
  const suffix = cardId.split('.skill.')[1]!;
  return {
    base: `${suffix}.noble-bloom`,
    extra: `${suffix}.noble-bloom-extra-vp`,
    resistance: `${suffix}.magic-resistance`,
  };
}

function addRuntimeCard(
  state: GameState,
  instanceId: string,
  definitionId: string,
  ownerPlayerId: string,
  zone: 'field' | 'skill' | 'attack_area',
  active = true,
): void {
  state.cards.push({
    instanceId, definitionId, ownerPlayerId, controllerPlayerId: ownerPlayerId, zone,
    visibility: zone === 'skill' ? { scope: 'owner_only', ownerPlayerId } : { scope: 'public' },
  });
  state.abilityRuntime!.cardState[instanceId] = {
    active, faceDown: false, playedRound: state.round.roundNumber,
  };
}

describe('P3-FM03 exact ten-member Saber Magic Resistance authoring migration', () => {
  it('contains exactly ten minimal selected archives and preserves each frozen F1 text hash', () => {
    expect(new Set(members.map(([, cardId]) => cardId)).size).toBe(10);
    for (const [ownerId, cardId, expectedSha] of members) {
      const raw = readArchive(ownerId);
      expect(raw.id).toBe(ownerId);
      expect(raw.cards).toHaveLength(1);
      const card = raw.cards[0];
      expect(card.id).toBe(cardId);
      expect(sha(card.printedText)).toBe(expectedSha);
      expect(card.phase3Evidence).toMatchObject({
        f1Commit: F1_COMMIT,
        sourceTextSha256: expectedSha,
        referenceStaticMetadata: {
          commit: REFERENCE_COMMIT,
          cost: 3,
          basePower: 3,
          legacyRequirement: 3,
          typeLabel: '特殊',
        },
        canonicalSkillZoneManaRequirement: { value: 8, authority: 'final_rules_9.4' },
      });
      expect(card.abilities).toHaveLength(3);
      expect(card.abilities.map((ability: any) => ability.printedClause).join('').replaceAll('\r', '').replaceAll('\n', ''))
        .toBe(card.printedText.replaceAll('\r', '').replaceAll('\n', ''));
    }
  });

  it('keeps the locked static card metadata and final 8-mana skill-zone rule for all ten', () => {
    for (const [ownerId] of members) {
      const card = readArchive(ownerId).cards[0];
      expect(card.cardType).toBe('servant_skill');
      expect(card.cardFace).toEqual({ typeLabel: '特殊', attributes: ['特殊'], cost: 3, basePower: 3 });
      expect(card.playTiming).toEqual({ phase: 'action', window: 'controller_play_card_window' });
      expect(card.playRequirements).toEqual([{ type: 'skill_zone_mana_at_least', value: 8 }]);
      expect(card.phase3Evidence.referenceStaticMetadata.legacyRequirement).toBe(3);
    }
  });

  it('loads all ten without adapter blockers and matches exactly the three accepted contracts', () => {
    for (const [ownerId, cardId] of members) {
      const pack = rules.loadAuthoringJson(readArchive(ownerId));
      expect(pack.report).toEqual([]);
      const abilities = pack.cards[cardId]!.abilities;
      expect(abilities).toHaveLength(3);
      expect(rules.isOptionalBattleResultVpTriggerSemantic(abilities[0]!)).toBe(true);
      expect(rules.isOptionalBattleResultExtraVpTriggerSemantic(abilities[1]!)).toBe(true);
      expect(rules.isMagicResistancePowerModifierCandidate(abilities[2]!)).toBe(true);
      expect(rules.isMagicResistancePowerModifierSemantic(abilities[2]!)).toBe(true);
    }
  });

  it('runs newly migrated Altera Magic Resistance through the accepted Power route', () => {
    const raw = structuredClone(readArchive('servant.altera'));
    raw.cards.push(
      {
        id: 'fixture.fm03.magic-5', name: 'Magic 5', cardType: 'basic_attack',
        cardFace: { typeLabel: '魔术', attributes: ['魔术'], cost: 0, basePower: 5 },
        playTiming: { phase: 'action', window: 'controller_play_card_window' }, playRequirements: [], abilities: [],
      },
      {
        id: 'fixture.fm03.force-4', name: 'Force 4', cardType: 'basic_attack',
        cardFace: { typeLabel: '力量', attributes: ['力量'], cost: 0, basePower: 4 },
        playTiming: { phase: 'action', window: 'controller_play_card_window' }, playRequirements: [], abilities: [],
      },
    );
    const pack = rules.loadAuthoringJson(raw);
    expect(pack.report).toEqual([]);
    const state = createSeededGameState({ activeSeats: [1, 2, 3] });
    state.cards = [];
    state.round.activePhase = 'battle';
    state.round.prioritySeat = 1;
    state.players[0]!.locationId = 'shinto';
    state.players[1]!.locationId = 'shinto';
    state.players[2]!.locationId = 'miyama_town';
    rules.initializeAbilityRuntime(state, pack, { seed: 20260916 });

    const source = 'fm03-altera-source';
    const oppMagic = 'fm03-opp-magic';
    const oppForce = 'fm03-opp-force';
    const ownMagic = 'fm03-own-magic';
    const remoteMagic = 'fm03-remote-magic';
    addRuntimeCard(state, source, 'servant.altera.skill.sc-altera-3', 'p1', 'field');
    addRuntimeCard(state, oppMagic, 'fixture.fm03.magic-5', 'p2', 'attack_area');
    addRuntimeCard(state, oppForce, 'fixture.fm03.force-4', 'p2', 'attack_area');
    addRuntimeCard(state, ownMagic, 'fixture.fm03.magic-5', 'p1', 'attack_area');
    addRuntimeCard(state, remoteMagic, 'fixture.fm03.magic-5', 'p3', 'attack_area');

    const resistanceId = abilityIds('servant.altera.skill.sc-altera-3').resistance;
    const activation = rules.getLegalActions(state, 'p1').find((action) =>
      action.type === 'activate_ability' && action.cardInstanceId === source && action.abilityId === resistanceId);
    expect(activation).toBeDefined();
    expect(rules.dispatchAbilityCommand(state, 'p1', activation!).ok).toBe(true);
    expect(rules.calculateCardPower(state, oppMagic).value).toBe(0);
    expect(rules.calculateCardPower(state, oppForce).value).toBe(4);
    expect(rules.calculateCardPower(state, ownMagic).value).toBe(5);
    expect(rules.calculateCardPower(state, remoteMagic).value).toBe(5);
  });

  it('runs newly migrated Altera Noble Bloom as two independent typed +1 VP responses', () => {
    const pack = rules.loadAuthoringJson(readArchive('servant.altera'));
    expect(pack.report).toEqual([]);
    const state = createSeededGameState({ activeSeats: [1, 2] });
    state.cards = [];
    state.round.activePhase = 'battle';
    state.players[0]!.servantCardId = 'servant.altera';
    state.players[0]!.vp = 4;
    rules.initializeAbilityRuntime(state, pack, { seed: 20260917 });
    const source = 'fm03-altera-bloom-source';
    addRuntimeCard(state, source, 'servant.altera.skill.sc-altera-3', 'p1', 'skill', false);
    state.abilityRuntime!.noblePhantasmCostsThisRound.p1 = [{ cardId: 'fm03-np', cost: 4 }];

    const ids = abilityIds('servant.altera.skill.sc-altera-3');
    const event = {
      id: 'fm03-altera-result', type: 'after_battle_result_determined' as const,
      battlePhaseResolutionId: 'fm03-battle-phase:1', battleId: 'fm03-battle:shinto:1', resultId: 'fm03-altera-result',
      battleParticipantIds: ['p1', 'p2'], battlefieldId: 'shinto',
      battleResult: { winners: ['p1'], loserIds: ['p2'] },
    };
    rules.processAbilityEvent(state, event);
    const response = (abilityId: string) => rules.getLegalActions(state, 'p1').find((action) =>
      action.type === 'resolve_response' && action.abilityId === abilityId);

    expect(response(ids.base)).toBeDefined();
    expect(rules.dispatchAbilityCommand(state, 'p1', response(ids.base)!).ok).toBe(true);
    expect(state.players[0]!.vp).toBe(5);
    expect(response(ids.extra)).toBeDefined();
    expect(rules.dispatchAbilityCommand(state, 'p1', response(ids.extra)!).ok).toBe(true);
    expect(state.players[0]!.vp).toBe(6);
    expect(state.abilityRuntime!.events).toEqual(expect.arrayContaining([
      expect.objectContaining({ type: 'victory_points_adjusted', abilityId: ids.base, playerId: 'p1', delta: 1 }),
      expect.objectContaining({ type: 'victory_points_adjusted', abilityId: ids.extra, playerId: 'p1', delta: 1 }),
    ]));
  });
});
