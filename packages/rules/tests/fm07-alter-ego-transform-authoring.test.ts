import { createHash } from 'node:crypto';
import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';

import * as rules from '../src/index';
import type { GameState } from '../src/schema/game';
import { createSeededGameState } from '../src/tools/seeded-state';

const F1_COMMIT = '59f145434695d29bdd17e4cb3adc887e84182377';
const REFERENCE_COMMIT = 'b2f9fa15fba07c63530bbf4612b03b8b704755f9';
const REGULAR_SHA = 'b6c74ac37a50b671ded913dbc6ae6736f2057904fe4c02924d79f84971cebbdf';
const SION_SHA = '43c84de7cf6532ee6b561d8cfa35ddbdeac52850f6105684b23a82121636a892';

const members = [
  ['servant.douman', 'servant.douman.skill.sc-douman-3', 'servant', 'Alterego', 'sc_douman_3', '被动'],
  ['servant.koyanskaya', 'servant.koyanskaya.skill.sc-koyanskaya-1', 'servant', 'Alterego', 'sc_koyanskaya_1', '被动'],
  ['servant.mechaeli', 'servant.mechaeli.skill.sc-mechaeli-3', 'servant', 'Alterego', 'sc_mechaeli_3', '被动'],
  ['servant.meltryllis', 'servant.meltryllis.skill.sc-meltryllis-3', 'servant', 'Alterego', 'sc_meltryllis_3', '被动'],
  ['servant.muramasa', 'servant.muramasa.skill.sc-muramasa-3', 'servant', 'Alterego', 'sc_muramasa_3', '被动'],
  ['servant.okita-alt', 'servant.okita-alt.skill.sc-okita-alt-1', 'servant', 'Alterego', 'sc_okita_alt_1', '被动'],
  ['servant.passionlip', 'servant.passionlip.skill.sc-passionlip-1', 'servant', 'Alterego', 'sc_passionlip_1', '特殊'],
  ['servant.sitonai', 'servant.sitonai.skill.sc-sitonai-3', 'servant', 'Alterego', 'sc_sitonai_3', '被动'],
  ['servant.taisui', 'servant.taisui.skill.sc-taisui-1', 'servant', 'Alterego', 'sc_taisui_1', '被动'],
  ['master.sion', 'master.sion.skill.s12', 'master', 'Master', 's12', '特殊'],
] as const;

function archivePath(ownerId: string, ownerType: 'servant' | 'master'): string {
  return `data/authoring/${ownerType === 'master' ? 'masters' : 'servants'}/${ownerId}.json`;
}
function readArchive(ownerId: string, ownerType: 'servant' | 'master'): any {
  return JSON.parse(readFileSync(archivePath(ownerId, ownerType), 'utf8'));
}
function card(ownerId: string, cardId: string, ownerType: 'servant' | 'master'): any {
  const found = readArchive(ownerId, ownerType).cards.find((candidate: any) => candidate.id === cardId);
  if (!found) throw new Error(`Missing FM07 card ${cardId}`);
  return found;
}
function sha(text: string): string {
  return createHash('sha256').update(text, 'utf8').digest('hex');
}

function setup(ownerId: string, cardId: string, ownerType: 'servant' | 'master', mana = 10): { state: GameState; sourceId: string; targetId: string; abilityId: string } {
  const pack = rules.loadAuthoringJson(readArchive(ownerId, ownerType));
  expect(pack.report).toEqual([]);
  const state = createSeededGameState({ activeSeats: [1, 2] });
  state.cards = [];
  state.round.activePhase = 'action';
  state.round.prioritySeat = 1;
  state.players[0]!.mana = mana;
  if (ownerType === 'master') state.players[0]!.masterCardId = ownerId;
  else state.players[0]!.servantCardId = ownerId;
  rules.initializeAbilityRuntime(state, pack, { seed: 20260916 });
  const sourceId = 'fm07-source';
  const targetId = 'fm07-target';
  for (const instanceId of [sourceId, targetId]) {
    state.cards.push({
      instanceId, definitionId: cardId, ownerPlayerId: 'p1', controllerPlayerId: 'p1',
      zone: 'attack_area', visibility: { scope: 'public' },
    });
    state.abilityRuntime!.cardState[instanceId] = {
      active: true, faceDown: false, playedRound: state.round.roundNumber,
    };
  }
  return { state, sourceId, targetId, abilityId: pack.cards[cardId]!.abilities[0]!.id };
}

function playEvent(state: GameState, targetId: string, eventId = 'fm07-play') {
  const definitionId = state.cards.find((candidate) => candidate.instanceId === targetId)!.definitionId;
  return {
    id: eventId,
    type: 'on_card_played' as const,
    playerId: 'p1',
    sourceCardId: targetId,
    playedCards: [{
      instanceId: targetId,
      controllerId: 'p1',
      cardType: state.abilityRuntime!.pack.cards[definitionId]!.cardType,
      faceDown: false,
    }],
  };
}

function response(state: GameState, sourceId: string, abilityId: string) {
  return rules.getLegalActions(state, 'p1').find((action) =>
    action.type === 'resolve_response' && action.cardInstanceId === sourceId && action.abilityId === abilityId);
}

function choose(state: GameState, selectedIds: string[]) {
  const action = rules.getLegalActions(state, 'p1').find((candidate) => candidate.type === 'choose_target');
  expect(action).toBeDefined();
  return rules.dispatchAbilityCommand(state, 'p1', {
    type: 'choose_target', decisionId: action!.decisionId, selectedIds,
  });
}

describe('P3-FM07 exact ten-member Alter Ego transform migration', () => {
  it('contains exactly the ten authorized minimal archives with locked owner/static identity', () => {
    expect(new Set(members.map(([, cardId]) => cardId)).size).toBe(10);
    for (const [ownerId, cardId, ownerType, expectedClass, legacyId, typeLabel] of members) {
      const raw = readArchive(ownerId, ownerType);
      expect(raw.id).toBe(ownerId);
      expect(raw.class).toBe(expectedClass);
      const matches = raw.cards.filter((card: any) => card.id === cardId);
      expect(matches).toHaveLength(1);
      if (ownerId !== 'servant.mechaeli') expect(raw.cards).toHaveLength(1);
      const selected = matches[0];
      expect(selected.id).toBe(cardId);
      expect(selected.legacyId).toBe(legacyId);
      expect(selected.aliases).toContain(legacyId);
      expect(selected.owner).toEqual({ type: ownerType, id: ownerId });
      expect(selected.cardType).toBe(ownerType === 'master' ? 'master_skill' : 'servant_skill');
      expect(selected.cardFace.typeLabel).toBe(typeLabel);
      expect(selected.cardFace.cost).toBe(ownerType === 'master' ? 3 : 2);
      expect(selected.cardFace.basePower).toBe(3);
      expect(selected.phase3Evidence.referenceStaticMetadata).toMatchObject({
        commit: REFERENCE_COMMIT,
        legacySkillId: legacyId,
        cost: ownerType === 'master' ? 3 : 2,
        basePower: 3,
        legacyRequirement: ownerType === 'master' ? 3 : 2,
        typeLabel,
      });
    }
  });

  it('preserves frozen F1 text/evidence and final skill-zone play threshold', () => {
    for (const [ownerId, cardId, ownerType] of members) {
      const selected = card(ownerId, cardId, ownerType);
      const expectedSha = cardId === 'master.sion.skill.s12' ? SION_SHA : REGULAR_SHA;
      expect(sha(selected.printedText)).toBe(expectedSha);
      expect(selected.abilities).toHaveLength(1);
      expect(selected.abilities[0].printedClause).toBe(selected.printedText);
      expect(selected.playRequirements).toEqual([{ type: 'skill_zone_mana_at_least', value: 8 }]);
      expect(selected.phase3Evidence).toMatchObject({
        f1Commit: F1_COMMIT,
        sourceTextSha256: expectedSha,
        canonicalSkillZoneManaRequirement: { value: 8, authority: 'final_rules_9.4' },
        acceptedContracts: { alterEgoTransform: 'P3-R37/FB2-13' },
      });
      expect(selected.phase3Evidence.f1ClauseSources).toHaveLength(1);
      expect(selected.phase3Evidence.f1ClauseSources[0].sha256).toBe(expectedSha);
    }
  });

  it('loads all ten blocker-free and maps only to the accepted regular/EX FB2-13 structures', () => {
    for (const [ownerId, cardId, ownerType] of members) {
      const pack = rules.loadAuthoringJson(readArchive(ownerId, ownerType));
      expect(pack.report).toEqual([]);
      const ability = pack.cards[cardId]!.abilities[0]!;
      expect(rules.isAlterEgoTransformSemantic(ability)).toBe(true);
      expect(rules.classifyAlterEgoTransformVariant(ability)).toBe(cardId === 'master.sion.skill.s12' ? 'ex' : 'regular');
      expect(ability.targets).toEqual([]);
      expect(ability.conditions).toEqual([]);
      expect(ability.responseWindow).toEqual({ opens: 'on_card_played', order: 'turn_order', passBehavior: 'decline_this_window' });
      if (cardId === 'master.sion.skill.s12') {
        expect(ability.cost).toEqual([{ type: 'pay_mana', player: 'controller', amount: 3 }]);
        expect(ability.effects).toEqual([{ type: 'transform_event_source_card' }]);
        expect(ability.limit).toEqual({ type: 'per_round', uses: 1, scope: 'this_card' });
      } else {
        expect(ability.cost).toEqual([]);
        expect(ability.effects).toEqual([{ type: 'transform_event_source_card' }, { type: 'close_source_card' }]);
        expect(ability.limit).toEqual({});
      }
    }
  });

  it('runs migrated Douman through regular transform and closes only the source after choice', () => {
    const ownerId = 'servant.douman';
    const cardId = 'servant.douman.skill.sc-douman-3';
    const { state, sourceId, targetId, abilityId } = setup(ownerId, cardId, 'servant');
    rules.processAbilityEvent(state, playEvent(state, targetId));
    const action = response(state, sourceId, abilityId);
    expect(action).toBeDefined();
    expect(rules.dispatchAbilityCommand(state, 'p1', action!).ok).toBe(true);
    expect(state.abilityRuntime!.pendingDecision?.candidates).toEqual(['力量', '迅捷', '魔术']);
    expect(choose(state, ['力量', '魔术']).ok).toBe(true);
    expect(rules.getEffectiveCardAttributes(state, targetId)).toEqual(['力量', '魔术']);
    expect(state.cards.find((candidate) => candidate.instanceId === sourceId)!.zone).toBe('skill');
    expect(state.abilityRuntime!.cardState[sourceId]!.active).toBe(false);
    expect(state.cards.find((candidate) => candidate.instanceId === targetId)!.zone).toBe('attack_area');
  });

  it('runs migrated Sion EX with deferred fixed-3 payment, no close and one success per round', () => {
    const ownerId = 'master.sion';
    const cardId = 'master.sion.skill.s12';
    const { state, sourceId, targetId, abilityId } = setup(ownerId, cardId, 'master', 7);
    rules.processAbilityEvent(state, playEvent(state, targetId));
    const action = response(state, sourceId, abilityId);
    expect(action).toBeDefined();
    expect(rules.dispatchAbilityCommand(state, 'p1', action!).ok).toBe(true);
    expect(state.players[0]!.mana).toBe(7);
    expect(choose(state, ['迅捷']).ok).toBe(true);
    expect(state.players[0]!.mana).toBe(4);
    expect(rules.getEffectiveCardAttributes(state, targetId)).toEqual(['迅捷']);
    expect(state.cards.find((candidate) => candidate.instanceId === sourceId)!.zone).toBe('attack_area');
    expect(state.abilityRuntime!.cardState[sourceId]!.active).toBe(true);

    const secondTarget = 'fm07-target-2';
    state.cards.push({
      instanceId: secondTarget, definitionId: cardId, ownerPlayerId: 'p1', controllerPlayerId: 'p1',
      zone: 'attack_area', visibility: { scope: 'public' },
    });
    state.abilityRuntime!.cardState[secondTarget] = { active: true, faceDown: false, playedRound: state.round.roundNumber };
    rules.processAbilityEvent(state, playEvent(state, secondTarget, 'fm07-play-2'));
    expect(response(state, sourceId, abilityId)).toBeUndefined();
  });

  it('keeps the skill-zone threshold distinct from printed card cost', () => {
    const ownerId = 'servant.douman';
    const cardId = 'servant.douman.skill.sc-douman-3';
    const pack = rules.loadAuthoringJson(readArchive(ownerId, 'servant'));
    const state = createSeededGameState({ activeSeats: [1, 2] });
    state.cards = [];
    state.round.activePhase = 'action';
    state.round.prioritySeat = state.players[0]!.seat;
    state.players[0]!.servantCardId = ownerId;
    rules.initializeAbilityRuntime(state, pack, { seed: 20260916 });
    state.cards.push({
      instanceId: 'fm07-skill-zone', definitionId: cardId, ownerPlayerId: 'p1', controllerPlayerId: 'p1',
      zone: 'skill', visibility: { scope: 'owner_only', ownerPlayerId: 'p1' },
    });
    state.abilityRuntime!.cardState['fm07-skill-zone'] = { active: false, faceDown: false, playedRound: 0 };
    state.players[0]!.mana = 7;
    expect(rules.getLegalActions(state, 'p1').some((action) => action.type === 'play_card' && action.cardInstanceId === 'fm07-skill-zone')).toBe(false);
    state.players[0]!.mana = 8;
    const action = rules.getLegalActions(state, 'p1').find((candidate) => candidate.type === 'play_card' && candidate.cardInstanceId === 'fm07-skill-zone');
    expect(action).toBeDefined();
    expect(rules.dispatchAbilityCommand(state, 'p1', action!).ok).toBe(true);
    expect(state.players[0]!.mana).toBe(6);
  });
});
