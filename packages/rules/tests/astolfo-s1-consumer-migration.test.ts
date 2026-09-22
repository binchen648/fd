import { createHash } from 'node:crypto';
import { readFileSync, readdirSync } from 'node:fs';
import { join, resolve } from 'node:path';
import { describe, expect, it } from 'vitest';

import * as rules from '../src/index';
import type { GameState } from '../src/schema/game';
import { createSeededGameState } from '../src/tools/seeded-state';
import {
  persistOpponentCloseToOneServerAuthority,
  restoreOpponentCloseToOneServerAuthority,
} from '../src/ability/opponent-close-to-one-authority';

const ROOT = resolve('.');
const OWNER = 'servant.astolfo';
const ID = 'servant.astolfo.skill.sc-astolfo-1';
const SOURCE = 'astolfo-s1-source';
const ABILITY = 'panic-flute-close-to-one';
const NORMAL_DEF = 'test.astolfo.normal';
const SKILL_DEF = 'test.astolfo.skill';
const RESIDUAL_DEF = 'test.astolfo.residual';
const TEXT = '【真名解放】\n战斗阶段：与你交战的对手关闭其非残留的牌直至只剩一张为止。';
const CLAUSE = '战斗阶段：与你交战的对手关闭其非残留的牌直至只剩一张为止。';
const TEXT_SHA = 'a66f9f8f2f72bea1f7b801459ea742cc4359723a847ef5a5a855501c3ac6d083';
const CLAUSE_SHA = '693e886ed5695721ec10dce30d64b978e45407eba1b81de3c7c5401f8bcb4e67';
const SECRET = 'fb2-49-persistence-secret:' + '11'.repeat(32);
const SCOPE = 'fb2-49-persistence-scope:' + '22'.repeat(32);

const hash = (text: string): string => createHash('sha256').update(text, 'utf8').digest('hex');

function rawArchive(): any {
  return JSON.parse(readFileSync(resolve(ROOT, 'data/authoring/servants/servant.astolfo.json'), 'utf8').replace(/^\uFEFF/, ''));
}

function compiledCard(id: string, cardType = 'servant_attack', residual = false): any {
  return {
    id, name: id, cardType,
    cardFace: { typeLabel: '力量', attributes: ['力量'], cost: 0, basePower: 1 },
    playTiming: { phase: 'action', window: 'controller_play_card_window' }, playRequirements: [], mode: 'automatic',
    abilities: residual ? [{
      id: `${id}.residual`, kind: 'residual', printedClause: 'residual', activation: { trigger: 'while_active' },
      conditions: [], targets: [], effects: [], cost: [], creates: [], ruleModifiers: [],
      lifecycle: { duration: 'while_active', cleanup: 'remain_active' }, responseWindow: {}, limit: {}, visibility: {},
      execution: { mode: 'automatic', allowedOperations: [] },
    }] : [],
  };
}

function setup(mana = 8): GameState {
  const pack: any = rules.loadAuthoringJson(rawArchive());
  expect(pack.report).toEqual([]);
  pack.cards[NORMAL_DEF] = compiledCard(NORMAL_DEF);
  pack.cards[SKILL_DEF] = compiledCard(SKILL_DEF, 'servant_skill');
  pack.cards[RESIDUAL_DEF] = compiledCard(RESIDUAL_DEF, 'servant_attack', true);

  const state = createSeededGameState({ activeSeats: [1, 2, 3, 4] });
  state.cards = [{
    instanceId: SOURCE, definitionId: ID, ownerPlayerId: 'p1', controllerPlayerId: 'p1',
    zone: 'skill', visibility: { scope: 'owner_only', ownerPlayerId: 'p1' },
  }];
  state.players[0]!.servantCardId = OWNER;
  state.players[0]!.locationId = 'miyama_town';
  state.players[1]!.locationId = 'miyama_town';
  state.players[2]!.locationId = 'miyama_town';
  state.players[3]!.locationId = 'shinto';
  state.players[0]!.mana = mana;
  state.round.activePhase = 'action';
  state.round.prioritySeat = state.players[0]!.seat;
  rules.initializeAbilityRuntime(state, pack, { seed: 20260922 });
  return state;
}

function play(state: GameState) {
  return rules.dispatchAbilityCommand(state, 'p1', { type: 'play_card', cardInstanceId: SOURCE });
}

function prepareCombat(state: GameState): void {
  state.round.activePhase = 'battle';
  state.round.prioritySeat = state.players[0]!.seat;
}

function activate(state: GameState) {
  return rules.dispatchAbilityCommand(state, 'p1', { type: 'activate_ability', cardInstanceId: SOURCE, abilityId: ABILITY });
}

function add(state: GameState, instanceId: string, controllerPlayerId: string, definitionId = NORMAL_DEF,
  options: { zone?: string; active?: boolean; faceDown?: boolean; ownerPlayerId?: string } = {}): void {
  state.cards.push({
    instanceId, definitionId, ownerPlayerId: options.ownerPlayerId ?? controllerPlayerId, controllerPlayerId,
    zone: options.zone ?? 'attack_area',
    visibility: options.faceDown ? { scope: 'owner_only', ownerPlayerId: options.ownerPlayerId ?? controllerPlayerId } : { scope: 'public' },
  });
  state.abilityRuntime!.cardState[instanceId] = {
    active: options.active ?? true, faceDown: options.faceDown ?? false, playedRound: state.round.roundNumber,
  };
}

function choose(state: GameState, playerId: string, selectedIds: string[]) {
  const decision = state.abilityRuntime!.pendingDecision!;
  return rules.dispatchAbilityCommand(state, playerId, { type: 'choose_target', decisionId: decision.id, selectedIds });
}

function authoringJsonFiles(dir: string): string[] {
  return readdirSync(dir, { withFileTypes: true }).flatMap((entry) => {
    const full = join(dir, entry.name);
    return entry.isDirectory() ? authoringJsonFiles(full) : entry.name.endsWith('.json') ? [full] : [];
  });
}

describe('P3 S R102 Astolfo s1 consumer migration', () => {
  it('authors exactly the frozen Astolfo s1 identity with accepted source hashes and Reference static metadata', () => {
    const raw = rawArchive();
    expect(raw).toMatchObject({
      schemaVersion: 'fd-card-authoring-v1', archiveType: 'servant_skill_card_archive', id: OWNER,
      name: '阿斯托尔福', class: 'Rider',
      sourcePolicy: {
        phase3EvidenceCommit: 'b014cada5ae30c489ca384094681cf313aa71c82',
        referenceMetadataCommit: 'b2f9fa15fba07c63530bbf4612b03b8b704755f9',
      },
    });
    expect(raw.cards).toHaveLength(1);
    const card = raw.cards[0];
    expect(card).toMatchObject({
      id: ID, aliases: ['sc_astolfo_1'], legacyId: 'sc_astolfo_1', name: '唤起恐慌之魔笛',
      cardType: 'servant_skill', owner: { type: 'servant', id: OWNER },
      cardFace: { typeLabel: '宝具', attributes: ['宝具'], cost: 4, basePower: 1 },
      playTiming: { phase: 'action', window: 'controller_play_card_window' },
      playRequirements: [{ type: 'skill_zone_mana_at_least', value: 8 }],
      phase3Evidence: {
        f1Commit: 'b014cada5ae30c489ca384094681cf313aa71c82',
        f1AuditCommit: 'b258039cc5da519cecee2129a658dd95bdb5524c',
        f1ReviewCommit: '222a8ea0e2d73d64a1138b3326df20c767f37b01',
        f1ClauseSources: [{ sourceAbilityId: ABILITY, locator: 'skillCards[58].abilities[0].printedClause', sha256: CLAUSE_SHA }],
        f1FullPrintedTextSha256: TEXT_SHA,
        referenceStaticMetadata: {
          commit: 'b2f9fa15fba07c63530bbf4612b03b8b704755f9', legacySkillId: 'sc_astolfo_1', class: 'Rider',
          cost: 4, basePower: 1, legacyRequirement: 8, typeLabel: '宝具', attributes: ['宝具'],
        },
        canonicalSkillZoneManaRequirement: { value: 8, authority: 'final_rules_9.4' },
      },
    });
    expect(card.printedText).toBe(TEXT);
    expect(card.abilities).toHaveLength(1);
    expect(card.abilities[0].printedClause).toBe(CLAUSE);
    expect(hash(card.printedText)).toBe(TEXT_SHA);
    expect(hash(card.abilities[0].printedClause)).toBe(CLAUSE_SHA);
  });

  it('loads blocker-free through exactly the accepted FB2-49 whole-ability envelope', () => {
    const pack = rules.loadAuthoringJson(rawArchive());
    expect(pack.report).toEqual([]);
    const card = pack.cards[ID]!;
    expect(card.mode).toBe('automatic');
    expect(card.abilities).toHaveLength(1);
    expect(rules.isAcceptedOpponentCloseToOneAbility(card.abilities[0]!, 'compiled')).toBe(true);
    expect(card.abilities[0]).toMatchObject({
      id: ABILITY, kind: 'phase_action', activation: { phase: 'combat', opens: 'controller_combat_action_window' },
      conditions: [{ type: 'source_owned' }, { type: 'at_battlefield' }], targets: [],
      effects: [{ type: rules.OPPONENT_CLOSE_NON_RESIDUAL_TO_ONE_EFFECT }], cost: [], creates: [], ruleModifiers: [],
      lifecycle: {}, limit: {}, visibility: { revealsTrueName: true, revealTiming: 'on_use_declared', revealScope: 'servant_package' },
      execution: { mode: 'automatic' },
    });
    const serialized = JSON.stringify(rawArchive().cards[0]);
    expect(serialized).not.toContain('choose_each_player_cards');
    expect(serialized).not.toContain('close_matching_cards_except_selected');
  });

  it('enforces the 7/8 mana skill-zone boundary and charges the printed cost 4 on real play', () => {
    const low = setup(7);
    const lowBefore = structuredClone(low);
    expect(play(low).ok).toBe(false);
    expect(low).toEqual(lowBefore);

    const state = setup(8);
    expect(play(state).ok).toBe(true);
    expect(state.players[0]!.mana).toBe(4);
    expect(state.cards.find((card) => card.instanceId === SOURCE)?.zone).toBe('attack_area');
    expect(state.abilityRuntime!.cardState[SOURCE]).toMatchObject({ active: true, faceDown: false, playedRound: state.round.roundNumber });
  });

  it('reveals true name at combat activation and serializes private non-cancellable keep-one decisions for same-battlefield opponents', () => {
    const state = setup();
    expect(play(state).ok).toBe(true);
    add(state, 'p2-a', 'p2'); add(state, 'p2-b', 'p2'); add(state, 'p2-skill', 'p2', SKILL_DEF);
    add(state, 'p2-residual', 'p2', RESIDUAL_DEF);
    add(state, 'p3-a', 'p3'); add(state, 'p3-b', 'p3');
    add(state, 'remote-a', 'p4'); add(state, 'remote-b', 'p4');
    prepareCombat(state);

    expect(activate(state).ok).toBe(true);
    expect(state.abilityRuntime!.revealedServants).toContain('p1');
    expect(rules.projectAbilityState(state, 'p1').pendingDecision).toBeUndefined();
    expect(rules.projectAbilityState(state, 'p2').pendingDecision).toMatchObject({
      min: 1, max: 1, candidates: ['p2-a', 'p2-b', 'p2-skill'], visibility: 'owner_only', cancelPolicy: 'forbidden',
    });
    expect(state.abilityRuntime!.pendingOpponentCloseToOne?.map((entry) => entry.decisionPlayerId)).toEqual(['p2', 'p3']);
    expect(choose(state, 'p2', ['p2-a']).ok).toBe(true);
    expect(state.abilityRuntime!.cardState['p2-a']).toMatchObject({ active: true, faceDown: false });
    expect(state.abilityRuntime!.cardState['p2-b']).toMatchObject({ active: false, faceDown: true });
    expect(state.cards.find((card) => card.instanceId === 'p2-skill')).toMatchObject({ zone: 'skill' });
    expect(state.abilityRuntime!.cardState['p2-residual']).toMatchObject({ active: true, faceDown: false });
    expect(state.abilityRuntime!.pendingDecision?.controllerId).toBe('p3');
    expect(choose(state, 'p3', ['p3-b']).ok).toBe(true);
    expect(state.abilityRuntime!.pendingDecision).toBeUndefined();
    expect(state.abilityRuntime!.pendingOpponentCloseToOne).toEqual([]);
    expect(state.abilityRuntime!.cardState['p3-a']!.faceDown).toBe(true);
    expect(state.abilityRuntime!.cardState['p3-b']!.active).toBe(true);
    expect(state.abilityRuntime!.cardState['remote-a']!.active).toBe(true);
    expect(state.abilityRuntime!.cardState['remote-b']!.active).toBe(true);
  });

  it('fails source ownership and battlefield conditions without mutating a played card transaction', () => {
    const borrowed = setup();
    expect(play(borrowed).ok).toBe(true);
    add(borrowed, 'p2-a', 'p2'); add(borrowed, 'p2-b', 'p2');
    prepareCombat(borrowed);
    borrowed.cards.find((card) => card.instanceId === SOURCE)!.ownerPlayerId = 'p2';
    const borrowedBefore = structuredClone(borrowed);
    expect(activate(borrowed).ok).toBe(false);
    expect(borrowed).toEqual(borrowedBefore);

    const offBattlefield = setup();
    expect(play(offBattlefield).ok).toBe(true);
    add(offBattlefield, 'p2-a', 'p2'); add(offBattlefield, 'p2-b', 'p2');
    offBattlefield.players[0]!.locationId = 'magic_workshop';
    prepareCombat(offBattlefield);
    const offBefore = structuredClone(offBattlefield);
    expect(activate(offBattlefield).ok).toBe(false);
    expect(offBattlefield).toEqual(offBefore);
  });

  it('rejects forged selections and stale frozen-card provenance mutation-free on the actual card', () => {
    const forged = setup();
    expect(play(forged).ok).toBe(true);
    add(forged, 'p2-a', 'p2'); add(forged, 'p2-b', 'p2');
    prepareCombat(forged); expect(activate(forged).ok).toBe(true);
    const forgedBefore = structuredClone(forged);
    expect(choose(forged, 'p2', ['outsider']).ok).toBe(false);
    expect(forged).toEqual(forgedBefore);

    const stale = setup();
    expect(play(stale).ok).toBe(true);
    add(stale, 'p2-a', 'p2'); add(stale, 'p2-b', 'p2');
    prepareCombat(stale); expect(activate(stale).ok).toBe(true);
    stale.abilityRuntime!.cardState['p2-b']!.faceDown = true;
    const staleBefore = structuredClone(stale);
    expect(choose(stale, 'p2', ['p2-a']).ok).toBe(false);
    expect(stale).toEqual(staleBefore);
  });

  it('round-trips live authority through authenticated persistence and rejects state/seal drift', () => {
    const state = setup();
    expect(play(state).ok).toBe(true);
    add(state, 'p2-a', 'p2'); add(state, 'p2-b', 'p2');
    prepareCombat(state); expect(activate(state).ok).toBe(true);
    const seal = persistOpponentCloseToOneServerAuthority(state, SECRET, SCOPE)!;
    expect(seal.transactionId).toMatch(/^fb2-49-transaction:[0-9a-f]{64}$/);

    const restored = structuredClone(state);
    expect(restoreOpponentCloseToOneServerAuthority(restored, seal, SECRET, SCOPE)).toBe(true);
    expect(choose(restored, 'p2', ['p2-a']).ok).toBe(true);
    expect(restored.abilityRuntime!.pendingOpponentCloseToOne).toEqual([]);

    const drifted = structuredClone(state);
    drifted.abilityRuntime!.cardState['p2-b']!.faceDown = true;
    const before = structuredClone(drifted);
    expect(restoreOpponentCloseToOneServerAuthority(drifted, seal, SECRET, SCOPE)).toBe(false);
    expect(drifted).toEqual(before);
  });

  it('stays standalone outside product/generated outputs', () => {
    const manifest = readFileSync(resolve(ROOT, 'data/packs/fd-playtest-v1/pack.json'), 'utf8');
    const generated = readFileSync(resolve(ROOT, 'data/generated/fd-playtest-v1.content-library.json'), 'utf8');
    expect(manifest).not.toContain('data/authoring/servants/servant.astolfo.json');
    expect(manifest).not.toContain(ID);
    expect(generated).not.toContain(ID);
  });

  it('preserves the accepted Astolfo frozen material identity with no duplicates', () => {
    const inventory = JSON.parse(readFileSync(resolve(ROOT, 'data/phase3/full-roster-ability-inventory.json'), 'utf8'));
    const frozen = new Set<string>([
      ...inventory.staticSkills.map((skill: any) => skill.canonicalAbilityId),
      ...inventory.dynamicSkills.map((skill: any) => skill.canonicalAbilityId),
    ]);
    const counts = new Map<string, number>();
    for (const file of authoringJsonFiles(resolve(ROOT, 'data/authoring'))) {
      const archive = JSON.parse(readFileSync(file, 'utf8').replace(/^\uFEFF/, ''));
      for (const card of archive.cards ?? []) counts.set(card.id, (counts.get(card.id) ?? 0) + 1);
    }
    const duplicateFrozen = [...counts.entries()].filter(([id, count]) => frozen.has(id) && count > 1);
    const overlap = [...counts.keys()].filter((id) => frozen.has(id));
    expect(frozen.size).toBe(944);
    expect(overlap).toContain(ID);
    expect(duplicateFrozen).toEqual([]);
    expect(counts.get(ID)).toBe(1);
    expect(counts.get('servant.spartacus.skill.sc-spartacus-2')).toBe(1);
  });
});