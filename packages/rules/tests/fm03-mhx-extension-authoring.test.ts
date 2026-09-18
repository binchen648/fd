import { createHash } from 'node:crypto';
import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';

import * as rules from '../src/index';
import type { GameState } from '../src/schema/game';
import { createSeededGameState } from '../src/tools/seeded-state';

const F1_COMMIT = '59f145434695d29bdd17e4cb3adc887e84182377';
const REFERENCE_COMMIT = 'b2f9fa15fba07c63530bbf4612b03b8b704755f9';
const CARD_ID = 'servant.mhx.skill.sc-mhx-3';
const OWNER_ID = 'servant.mhx';
const TEXT_SHA = '8a6da48db16868ce5d5766fa7ff05c00b2c392f715106f869cb59aaabee65ffc';
const CLAUSE_SHAS = [
  '1cef15482dd584d9d18b4e9016476b7bffb31cb0331efd38b4025a26611c84c2',
  'f0631437ce658c07be75426fc0394d6f32c6fafc10805bcb359ff17d4de97f85',
  'bd7530459d6ccd00217d1192b06509e322d48bafd44f037c383470ecbba55229',
] as const;

function readArchive(ownerId: string): any {
  return JSON.parse(readFileSync(`data/authoring/servants/${ownerId}.json`, 'utf8'));
}

function sha(value: string): string {
  return createHash('sha256').update(value, 'utf8').digest('hex');
}

function abilityIds() {
  return {
    base: 'sc-mhx-3.noble-bloom',
    extra: 'sc-mhx-3.noble-bloom-extra-vp',
    resistance: 'sc-mhx-3.magic-resistance',
  };
}

function normalizeAbility(ability: any): any {
  const copy = structuredClone(ability);
  delete copy.id;
  return copy;
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
    instanceId,
    definitionId,
    ownerPlayerId,
    controllerPlayerId: ownerPlayerId,
    zone,
    visibility: zone === 'skill' ? { scope: 'owner_only', ownerPlayerId } : { scope: 'public' },
  });
  state.abilityRuntime!.cardState[instanceId] = {
    active,
    faceDown: false,
    playedRound: state.round.roundNumber,
  };
}

describe('P3 FM03 MHX Saber Magic Resistance family extension', () => {
  it('preserves exact F1 source hashes and locked Reference static metadata', () => {
    const raw = readArchive(OWNER_ID);
    expect(raw).toMatchObject({
      archiveType: 'servant_skill_card_archive',
      id: OWNER_ID,
      name: '谜之女主角X',
      class: 'Assassin',
    });
    expect(raw.cards).toHaveLength(1);
    const card = raw.cards[0];
    expect(card).toMatchObject({
      id: CARD_ID,
      aliases: ['sc_mhx_3'],
      legacyId: 'sc_mhx_3',
      name: '对魔力（Saber Class）',
      cardType: 'servant_skill',
      owner: { type: 'servant', id: OWNER_ID },
      cardFace: { typeLabel: '特殊', attributes: ['特殊'], cost: 3, basePower: 3 },
      playTiming: { phase: 'action', window: 'controller_play_card_window' },
      playRequirements: [{ type: 'skill_zone_mana_at_least', value: 8 }],
    });
    expect(sha(card.printedText)).toBe(TEXT_SHA);
    expect(card.phase3Evidence).toMatchObject({
      f1Commit: F1_COMMIT,
      sourceTextSha256: TEXT_SHA,
      referenceStaticMetadata: {
        commit: REFERENCE_COMMIT,
        legacySkillId: 'sc_mhx_3',
        cost: 3,
        basePower: 3,
        legacyRequirement: 3,
        typeLabel: '特殊',
      },
      canonicalSkillZoneManaRequirement: { value: 8, authority: 'final_rules_9.4' },
    });
    expect(card.phase3Evidence.f1ClauseSources.map((source: any) => source.sha256)).toEqual(CLAUSE_SHAS);
  });

  it('loads blocker-free and is structurally identical to accepted FM03 semantics', () => {
    const mhx = rules.loadAuthoringJson(readArchive(OWNER_ID));
    const altera = rules.loadAuthoringJson(readArchive('servant.altera'));
    expect(mhx.report).toEqual([]);
    expect(altera.report).toEqual([]);
    const abilities = mhx.cards[CARD_ID]!.abilities;
    expect(abilities).toHaveLength(3);
    expect(rules.isOptionalBattleResultVpTriggerSemantic(abilities[0]!)).toBe(true);
    expect(rules.isOptionalBattleResultExtraVpTriggerSemantic(abilities[1]!)).toBe(true);
    expect(rules.isMagicResistancePowerModifierCandidate(abilities[2]!)).toBe(true);
    expect(rules.isMagicResistancePowerModifierSemantic(abilities[2]!)).toBe(true);
    expect(abilities.map(normalizeAbility)).toEqual(
      altera.cards['servant.altera.skill.sc-altera-3']!.abilities.map(normalizeAbility),
    );
  });

  it('runs MHX Magic Resistance through the accepted Power route only for same-battlefield opponent Magic attacks', () => {
    const raw = structuredClone(readArchive(OWNER_ID));
    raw.cards.push(
      {
        id: 'fixture.mhx.magic-5', name: 'Magic 5', cardType: 'basic_attack',
        cardFace: { typeLabel: '魔术', attributes: ['魔术'], cost: 0, basePower: 5 },
        playTiming: { phase: 'action', window: 'controller_play_card_window' }, playRequirements: [], abilities: [],
      },
      {
        id: 'fixture.mhx.force-4', name: 'Force 4', cardType: 'basic_attack',
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
    rules.initializeAbilityRuntime(state, pack, { seed: 20260918 });

    addRuntimeCard(state, 'mhx-source', CARD_ID, 'p1', 'field');
    addRuntimeCard(state, 'mhx-opp-magic', 'fixture.mhx.magic-5', 'p2', 'attack_area');
    addRuntimeCard(state, 'mhx-opp-force', 'fixture.mhx.force-4', 'p2', 'attack_area');
    addRuntimeCard(state, 'mhx-own-magic', 'fixture.mhx.magic-5', 'p1', 'attack_area');
    addRuntimeCard(state, 'mhx-remote-magic', 'fixture.mhx.magic-5', 'p3', 'attack_area');

    const activation = rules.getLegalActions(state, 'p1').find((action) =>
      action.type === 'activate_ability'
      && action.cardInstanceId === 'mhx-source'
      && action.abilityId === abilityIds().resistance);
    expect(activation).toBeDefined();
    expect(rules.dispatchAbilityCommand(state, 'p1', activation!).ok).toBe(true);
    expect(rules.calculateCardPower(state, 'mhx-opp-magic').value).toBe(0);
    expect(rules.calculateCardPower(state, 'mhx-opp-force').value).toBe(4);
    expect(rules.calculateCardPower(state, 'mhx-own-magic').value).toBe(5);
    expect(rules.calculateCardPower(state, 'mhx-remote-magic').value).toBe(5);
  });

  it('runs MHX Noble Bloom as two independent typed +1 VP responses', () => {
    const pack = rules.loadAuthoringJson(readArchive(OWNER_ID));
    expect(pack.report).toEqual([]);
    const state = createSeededGameState({ activeSeats: [1, 2] });
    state.cards = [];
    state.round.activePhase = 'battle';
    state.players[0]!.servantCardId = OWNER_ID;
    state.players[0]!.vp = 4;
    rules.initializeAbilityRuntime(state, pack, { seed: 20260919 });
    addRuntimeCard(state, 'mhx-bloom-source', CARD_ID, 'p1', 'skill', false);
    state.abilityRuntime!.noblePhantasmCostsThisRound.p1 = [{ cardId: 'mhx-np', cost: 4 }];

    rules.processAbilityEvent(state, {
      id: 'mhx-result',
      type: 'after_battle_result_determined',
      battlePhaseResolutionId: 'mhx-phase:1',
      battleId: 'mhx-battle:shinto:1',
      resultId: 'mhx-result',
      battleParticipantIds: ['p1', 'p2'],
      battlefieldId: 'shinto',
      battleResult: { winners: ['p1'], loserIds: ['p2'] },
    });

    for (const abilityId of [abilityIds().base, abilityIds().extra]) {
      const response = rules.getLegalActions(state, 'p1').find((action) =>
        action.type === 'resolve_response' && action.abilityId === abilityId);
      expect(response).toBeDefined();
      expect(rules.dispatchAbilityCommand(state, 'p1', response!).ok).toBe(true);
    }
    expect(state.players[0]!.vp).toBe(6);
    expect(state.abilityRuntime!.events).toEqual(expect.arrayContaining([
      expect.objectContaining({ type: 'victory_points_adjusted', abilityId: abilityIds().base, playerId: 'p1', delta: 1 }),
      expect.objectContaining({ type: 'victory_points_adjusted', abilityId: abilityIds().extra, playerId: 'p1', delta: 1 }),
    ]));
  });

  it('keeps MHX outside the playtest pack product surface', () => {
    const manifest = readFileSync('data/packs/fd-playtest-v1/pack.json', 'utf8');
    expect(manifest).not.toContain('servant.mhx');
    expect(manifest).not.toContain('servant.mhx.json');
  });
});
