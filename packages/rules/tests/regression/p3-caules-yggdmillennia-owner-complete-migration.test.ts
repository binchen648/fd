import { createHash } from 'node:crypto';
import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';

import * as rules from '../../src/index';
import type { ExecutableCardPack } from '../../src/ability/executable-card-pack';
import type { GameState } from '../../src/schema/game';
import { createSeededGameState } from '../../src/tools/seeded-state';

const ARCHIVE_PATH = 'data/authoring/masters/master.caules-yggdmillennia.json';
const GENERATED_PATH = 'data/generated/fd-playtest-v1.content-library.json';
const OWNER = 'master.caules-yggdmillennia';
const IDS = {
  ascension: `${OWNER}.skill.ascension`,
  s1: `${OWNER}.skill.s1`,
  s1a: `${OWNER}.skill.s1a`,
  s2: `${OWNER}.skill.s2`,
  s3: `${OWNER}.skill.s3`,
} as const;
const EXPECTED_SOURCE_SHA = {
  ascension: '3d47013f151e984bb50139967a85d16f0a70a825d4e2865d3f5a781f8151881b',
  s1: '04f3937163428e7c889372d1ddf5061b721739030740d043d1f65daa66ea60bc',
  s1a: '44c7ec6f62cf2b231c95e05fdb4e32694be7a774eb777db95ceaf07ad24c15f5',
  s2: '3b220e60b2d59c8430594def46e0db5f7efcbfea91d7090a03d899c594006f8a',
  s3: 'a33323cef1f83bcf541c9c60aea118587c56ad5f4a92b958228630d5018be6df',
} as const;
const DECK = [
  'basic.strength.3', 'basic.strength.3', 'basic.strength.4', 'basic.strength.4', 'basic.strength.4',
  'basic.agility.3', 'basic.agility.3', 'basic.agility.4', 'basic.agility.4', 'basic.agility.4',
  'basic.luck', 'basic.surveil',
];

function readArchive(): any { return JSON.parse(readFileSync(ARCHIVE_PATH, 'utf8')); }
function generatedPack(): ExecutableCardPack {
  const content = JSON.parse(readFileSync(GENERATED_PATH, 'utf8')) as { rules: ExecutableCardPack };
  return structuredClone(content.rules);
}
function add(state: GameState, definitionId: string, zone: string, instanceId = `${definitionId}:p1:${state.cards.length}`): string {
  state.cards.push({ instanceId, definitionId, ownerPlayerId: 'p1', controllerPlayerId: 'p1', zone,
    visibility: ['field', 'attack_area'].includes(zone) ? { scope: 'public' } : { scope: 'owner_only', ownerPlayerId: 'p1' } } as any);
  state.abilityRuntime!.cardState[instanceId] = { active: false, faceDown: false, playedRound: state.round.roundNumber };
  return instanceId;
}
function setup(): { state: GameState; source: Record<keyof typeof IDS, string> } {
  const state = createSeededGameState({ activeSeats: [1, 2, 3] });
  state.cards = [];
  state.players[0]!.masterCardId = OWNER;
  state.players[0]!.mana = 8;
  state.players[0]!.locationId = 'miyama_town';
  state.players[1]!.locationId = 'miyama_town';
  const pack = generatedPack();
  rules.initializeAbilityRuntime(state, pack, { seed: 20261028 });
  const source = {
    ascension: add(state, IDS.ascension, 'skill', 'caules-ascension'),
    s1: add(state, IDS.s1, 'skill', 'caules-s1'),
    s1a: add(state, IDS.s1a, 'skill', 'caules-s1a'),
    s2: '', s3: '',
  };
  rules.processAbilityEvent(state, { id: 'caules-owner-game-start', type: 'game_start' });
  source.s2 = state.cards.find((card) => card.definitionId === IDS.s2)!.instanceId;
  source.s3 = state.cards.find((card) => card.definitionId === IDS.s3)!.instanceId;
  return { state, source };
}
function installBasic(state: GameState, id = 'owner-test.basic'): string {
  return add(state, 'basic.strength.3', 'hand', id);
}

describe('P3 Caules Yggdmillennia exact five-card owner Candidate', () => {
  it('registers exactly the frozen five IDs, receipts, and the ordered FB2-15 provision envelope', () => {
    const archive = readArchive();
    expect(archive.id).toBe(OWNER);
    expect(archive.cards.map((card: any) => card.id)).toEqual([IDS.s1, IDS.s1a, IDS.s2, IDS.s3, IDS.ascension]);
    expect(archive.cards).toHaveLength(5);
    for (const [key, id] of Object.entries(IDS)) {
      const card = archive.cards.find((candidate: any) => candidate.id === id);
      expect(card.owner).toEqual({ type: 'master', id: OWNER });
      expect(card.phase3Evidence.sourceTextSha256).toBe(EXPECTED_SOURCE_SHA[key as keyof typeof EXPECTED_SOURCE_SHA]);
      expect(createHash('sha256').update(card.printedText, 'utf8').digest('hex')).toBe(card.phase3Evidence.sourceTextSha256);
    }
    const s1 = archive.cards.find((card: any) => card.id === IDS.s1);
    expect(s1.abilities).toHaveLength(1);
    expect(s1.abilities[0].effects).toEqual([{ type: 'provision_skill_cards', player: 'controller', targetDefinitionIds: [IDS.s2, IDS.s3] }]);
    expect(s1.abilities[0].effects[0]).not.toHaveProperty('provision_definition_skill');
    const loaded = rules.loadAuthoringJson(archive);
    expect(loaded.report).toEqual([]);
    expect(rules.isGameStartSkillProvisioningSemantic(loaded.cards[IDS.s1]!.abilities[0]!)).toBe(true);
  });

  it('creates s2 then s3 in exact order, preserves generatedBy provenance, and resets s3', () => {
    const { state, source } = setup();
    const created = state.abilityRuntime!.events.filter((event) => event.type === 'card_created')
      .map((event) => state.cards.find((card) => card.instanceId === event.cardInstanceId)!.definitionId);
    expect(created).toEqual([IDS.s2, IDS.s3]);
    expect(state.cards.find((card) => card.instanceId === source.s2)).toMatchObject({ generatedBy: source.s1, zone: 'skill', visibility: { scope: 'owner_only' } });
    expect(state.cards.find((card) => card.instanceId === source.s3)).toMatchObject({ generatedBy: source.s1, zone: 'skill', visibility: { scope: 'owner_only' } });
    state.abilityRuntime!.cardState[source.s3]!.active = true;
    rules.processAbilityEvent(state, { id: 'caules-owner-round-end', type: 'round_end', playerId: 'p1' });
    expect(state.abilityRuntime!.cardState[source.s3]!.active).toBe(false);
  });

  it.each(['missing target definition', 'wrong target owner', 'duplicate target', 'forged target provenance'] as const)(
    'fails closed for %s before any restored game-start provisioning', (variant) => {
      const { state, source } = setup();
      const target = state.cards.find((card) => card.instanceId === source.s2)!;
      if (variant === 'missing target definition') delete state.abilityRuntime!.pack.cards[IDS.s3];
      if (variant === 'wrong target owner') {
        target.ownerPlayerId = 'p2'; target.controllerPlayerId = 'p2';
        target.visibility = { scope: 'owner_only', ownerPlayerId: 'p2' };
      }
      if (variant === 'duplicate target') {
        const duplicate = { ...target, instanceId: 'forged-duplicate-s2' };
        state.cards.push(duplicate);
        state.abilityRuntime!.cardState[duplicate.instanceId] = { active: false, faceDown: false, playedRound: state.round.roundNumber };
      }
      if (variant === 'forged target provenance') target.generatedBy = 'forged-source-instance';
      const restored = structuredClone(state);
      rules.processAbilityEvent(restored, { id: `caules-owner-invalid-${variant}`, type: 'game_start' });
      expect(restored.abilityRuntime!.events.filter((event) => event.type === 'card_created')).toHaveLength(2);
    },
  );

  it('runs s2 deployment choices and battlefield activation against real owner definitions', () => {
    const { state, source } = setup();
    state.round.activePhase = 'advance';
    state.players[0]!.locationId = 'magic_workshop';
    state.players[0]!.mana = 5;
    rules.processAbilityEvent(state, { id: 'caules-owner-workshop', type: 'after_player_deployed_to_location', playerId: 'p1', locationId: 'magic_workshop' });
    expect(state.abilityRuntime!.pendingDecision?.candidates).toEqual(['gain_mana', 'ignore_defeat']);
    const decision = state.abilityRuntime!.pendingDecision!;
    expect(rules.dispatchAbilityCommand(state, 'p1', { type: 'choose_target', decisionId: decision.id, selectedIds: ['ignore_defeat'] }).ok).toBe(true);
    expect(state.players[0]!.mana).toBe(3);
    expect(state.abilityRuntime!.battleLossIgnoreRoundByPlayer!.p1).toBe(state.round.roundNumber);
    state.players[0]!.locationId = 'miyama_town';
    rules.processAbilityEvent(state, { id: 'caules-owner-battlefield', type: 'after_player_deployed_to_battlefield', playerId: 'p1', locationId: 'miyama_town' });
    expect(state.abilityRuntime!.cardState[source.s3]!.active).toBe(true);
  });

  it('enforces s3 declaration/combat authority and ascension private reveal plus exact deck rebuild', () => {
    const { state, source } = setup();
    state.abilityRuntime!.cardState[source.s3]!.active = true;
    state.abilityRuntime!.cardState[source.ascension]!.active = true;
    rules.processAbilityEvent(state, { id: 'caules-owner-ascension', type: 'after_master_ascension_unlocked', playerId: 'p1', sourceCardId: source.ascension });
    expect(state.abilityRuntime!.pendingExactDeckRebuilds).toHaveLength(1);
    const basic = installBasic(state);
    state.round.activePhase = 'action';
    state.round.prioritySeat = state.players[0]!.seat;
    rules.playAbilityCardBatch(state, 'p1', [{ cardInstanceId: basic }, { cardInstanceId: source.s3, declaredAttribute: '力量' }]);
    expect(rules.projectAbilityState(state, 'p1').cards.find((card) => card.instanceId === source.s3)?.declaredAttribute).toBe('力量');
    expect(rules.projectAbilityState(state, 'p2').cards.find((card) => card.instanceId === source.s3)?.declaredAttribute).toBeUndefined();
    expect(state.abilityRuntime!.events.find((event) => event.type === 'card_attribute_declared_secret')).not.toHaveProperty('attribute');
    state.round.activePhase = 'battle';
    rules.processAbilityEvent(state, { id: 'caules-owner-reveal', type: 'controller_combat_action_window', playerId: 'p1' });
    expect(rules.projectAbilityState(state, 'p2').cards.find((card) => card.instanceId === source.s3)?.declaredAttribute).toBe('力量');
    rules.advanceAbilityPhase(state, 'preparation', 2);
    expect(state.cards.filter((card) => card.ownerPlayerId === 'p1' && card.zone === 'deck').map((card) => card.definitionId).sort()).toEqual([...DECK].sort());
    expect(state.cards.find((card) => card.instanceId === source.s3)?.zone).toBe('attack_area');
  });

  it('redacts a real dispatched staged declaration from opponents while preserving owner view', () => {
    const { state, source } = setup();
    state.abilityRuntime!.cardState[source.s3]!.active = true;
    state.abilityRuntime!.cardState[source.ascension]!.active = true;
    const basic = installBasic(state, 'owner-test.staged-basic');
    state.round.activePhase = 'action';
    state.round.prioritySeat = state.players[0]!.seat;
    expect(rules.dispatchAbilityCommand(state, 'p1', { type: 'stage_attack_card', cardInstanceId: basic }).ok).toBe(true);
    expect(rules.dispatchAbilityCommand(state, 'p1', { type: 'stage_attack_card', cardInstanceId: source.s3, declaredAttribute: '力量' }).ok).toBe(true);
    for (const id of [basic, source.s3]) {
      const physical = state.cards.find((card) => card.instanceId === id)!;
      physical.zone = 'attack_area'; physical.visibility = { scope: 'public' };
    }
    expect(rules.projectAbilityState(state, 'p1').stagedAttacks?.[0]?.cards.some((card) => card.declaredAttribute === '力量')).toBe(true);
    expect(JSON.stringify(rules.projectAbilityState(state, 'p2'))).not.toContain('力量');
  });
});
