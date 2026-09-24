import { readFileSync, readdirSync } from 'node:fs';
import { join, resolve } from 'node:path';
import { describe, expect, it } from 'vitest';
import * as rules from '../src/index';
import type { AuthoringAbility, AuthoringCard } from '../src/ability/types';
import type { GameState } from '../src/schema/game';
import { createSeededGameState } from '../src/tools/seeded-state';

const ROOT = resolve('.');
const LOCKED_REFERENCE = 'b2f9fa15fba07c63530bbf4612b03b8b704755f9';
const BATCH = 'P3-F4-M50-01-50-SKILL-MACRO-MIGRATION-BATCH';
const ARAYA = 'master.araya.skill.s1a';
const LEONIDAS = 'servant.leonidas.skill.sc-leonidas-2';
const VALKYRIE = 'servant.valkyrie.skill.sc-valkyrie-3';
const COMMANDER = 'card.x-commanderortlinde';

function json(path: string): any {
  return JSON.parse(readFileSync(resolve(ROOT, path), 'utf8').replace(/^\uFEFF/, ''));
}
function authoringJsonFiles(dir: string): string[] {
  return readdirSync(dir, { withFileTypes: true }).flatMap((entry) => {
    const full = join(dir, entry.name);
    return entry.isDirectory() ? authoringJsonFiles(full) : entry.name.endsWith('.json') ? [full] : [];
  });
}
function batchFiles(): string[] {
  return authoringJsonFiles(resolve(ROOT, 'data/authoring')).filter((file) => file.endsWith('.p3-m50-01.json'));
}
function compiledAttack(id: string, basePower: number, abilities: AuthoringAbility[] = []): AuthoringCard {
  return {
    id, name: id, cardType: 'servant_attack',
    cardFace: { typeLabel: 'fixture', attributes: ['力量'], cost: 0, basePower },
    playTiming: { phase: 'action', window: 'controller_play_card_window' }, playRequirements: [], mode: 'automatic', abilities,
  } as AuthoringCard;
}
function compiledBasicAttack(id: string, cost: number): AuthoringCard {
  return {
    id, name: id, cardType: 'basic_attack',
    cardFace: { typeLabel: 'fixture', attributes: ['力量'], cost, basePower: 2 },
    playTiming: { phase: 'action', window: 'controller_play_card_window' }, playRequirements: [], mode: 'automatic', abilities: [],
  } as AuthoringCard;
}
function automaticOnPlayMana(amount: number): AuthoringAbility {
  return {
    id: 'fixture-on-play-mana', kind: 'forced_trigger', printedClause: 'fixture', activation: { trigger: 'on_card_played' },
    conditions: [], targets: [], effects: [{ type: 'gain_mana', target: 'controller', amount }], cost: [], ruleModifiers: [], creates: [],
    lifecycle: {}, responseWindow: { order: 'turn_order', passBehavior: 'decline_this_window' }, limit: {}, visibility: {},
    execution: { mode: 'automatic', allowedOperations: [] },
  } as AuthoringAbility;
}
function setupFromArchive(path: string, sourceDefinitionId: string, sourceInstanceId: string, phase: 'action' | 'battle'): GameState {
  const raw = json(path); const pack: any = rules.loadAuthoringJson(raw); expect(pack.report).toEqual([]);
  const state = createSeededGameState({ activeSeats: [1, 2] });
  state.players[0]!.mana = 12; state.players[0]!.locationId = 'miyama_town'; state.players[1]!.locationId = 'miyama_town';
  state.round.activePhase = phase; state.round.prioritySeat = state.players[0]!.seat;
  state.cards = [{ instanceId: sourceInstanceId, definitionId: sourceDefinitionId, ownerPlayerId: 'p1', controllerPlayerId: 'p1', zone: 'attack_area', visibility: { scope: 'public' } }];
  rules.initializeAbilityRuntime(state, pack, { seed: 5001 });
  state.abilityRuntime!.cardState[sourceInstanceId] = { active: true, faceDown: false, playedRound: state.round.roundNumber };
  return state;
}
function choose(state: GameState, selectedIds: string[]) {
  const decision = state.abilityRuntime!.pendingDecision!;
  return rules.dispatchAbilityCommand(state, decision.controllerId, { type: 'choose_target', decisionId: decision.id, selectedIds });
}
function terminalEvent(id: string) {
  return {
    id,
    type: 'after_battle_ended' as const,
    battlePhaseResolutionId: `battle-phase:${id}`,
    battleIds: [`battle-phase:${id}:battle:miyama_town:1`],
    resultIds: [`battle-phase:${id}:battle:miyama_town:1:result`],
    scoringReceiptIds: [`battle-phase:${id}:score:miyama_town`],
    battleParticipantIds: ['p1', 'p2'],
  };
}

describe('P3 F4 M50-01 50-skill macro-batch', () => {
  it('materializes exactly 50 unique frozen skills in 41 blocker-free batch archives', () => {
    const files = batchFiles(); expect(files).toHaveLength(41);
    const ids: string[] = [];
    for (const file of files) {
      const raw = JSON.parse(readFileSync(file, 'utf8').replace(/^\uFEFF/, ''));
      expect(raw.sourcePolicy?.referenceMetadataCommit).toBe(LOCKED_REFERENCE);
      const pack = rules.loadAuthoringJson(raw); expect(pack.report).toEqual([]);
      for (const card of raw.cards ?? []) {
        expect(card.phase3Evidence).toMatchObject({ lockedReferenceCommit: LOCKED_REFERENCE, macroBatch: BATCH });
        ids.push(String(card.id));
      }
    }
    expect(ids).toHaveLength(50); expect(new Set(ids).size).toBe(50);
    const inventory = json('data/phase3/full-roster-ability-inventory.json');
    const frozen = new Set<string>([...inventory.staticSkills, ...inventory.dynamicSkills].map((entry: any) => String(entry.canonicalAbilityId)));
    expect(frozen.size).toBe(944); expect(ids.every((id) => frozen.has(id))).toBe(true);
  });

  it('raises frozen material authoring overlap from 165 to exactly 215 with zero duplicate frozen ids', () => {
    const inventory = json('data/phase3/full-roster-ability-inventory.json');
    const frozen = new Set<string>([...inventory.staticSkills, ...inventory.dynamicSkills].map((entry: any) => String(entry.canonicalAbilityId)));
    const counts = new Map<string, number>();
    for (const file of authoringJsonFiles(resolve(ROOT, 'data/authoring')).filter((file) => !/\.p3-m50-\d+\.json$/.test(file) || file.endsWith('.p3-m50-01.json'))) {
      const raw = JSON.parse(readFileSync(file, 'utf8').replace(/^\uFEFF/, ''));
      for (const card of raw.cards ?? []) if (frozen.has(String(card.id))) counts.set(String(card.id), (counts.get(String(card.id)) ?? 0) + 1);
    }
    expect(frozen.size).toBe(944); expect(counts.size).toBe(215);
    expect([...counts.entries()].filter(([, count]) => count !== 1)).toEqual([]);
    const batchIds = batchFiles().flatMap((file) => JSON.parse(readFileSync(file, 'utf8')).cards.map((card: any) => String(card.id)));
    expect(batchIds).toHaveLength(50); expect(batchIds.every((id) => counts.get(id) === 1)).toBe(true);
  });

  it('keeps all M50-01 material outside the product-pack manifest', () => {
    const manifest = readFileSync(resolve(ROOT, 'data/packs/fd-playtest-v1/pack.json'), 'utf8');
    expect(manifest).not.toContain('.p3-m50-01.json');
    for (const file of batchFiles()) expect(manifest).not.toContain(file.replaceAll('\\', '/').split('/data/authoring/')[1]!);
  });

  it('treats Araya battle-end with zero active basic attacks as a legal no-op', () => {
    const state = setupFromArchive('data/authoring/masters/master.araya.p3-m50-01.json', ARAYA, 'araya-source', 'battle');
    state.players[0]!.mana = 1;
    const beforeCards = structuredClone(state.cards);
    const event = terminalEvent('araya-empty');
    expect(rules.collectTriggeredAbilities(state, event).filter((entry) => entry.abilityId === 'origin-stillness-combat-end')).toEqual([]);
    rules.processAbilityEvent(state, event);
    expect(state.abilityRuntime!.pendingDecision).toBeUndefined();
    expect(state.players[0]!.mana).toBe(1);
    expect(state.cards).toEqual(beforeCards);
  });

  it('returns one active basic attack for Araya and grants twice its printed mana cost', () => {
    const state = setupFromArchive('data/authoring/masters/master.araya.p3-m50-01.json', ARAYA, 'araya-source', 'battle');
    const pack: any = state.abilityRuntime!.pack;
    pack.cards['fixture.basic.attack'] = compiledBasicAttack('fixture.basic.attack', 3);
    state.cards.push({ instanceId: 'araya-basic', definitionId: 'fixture.basic.attack', ownerPlayerId: 'p1', controllerPlayerId: 'p1', zone: 'attack_area', visibility: { scope: 'public' } });
    state.abilityRuntime!.cardState['araya-basic'] = { active: true, faceDown: false, playedRound: state.round.roundNumber };
    state.players[0]!.mana = 1;

    const event = terminalEvent('araya-one');
    expect(rules.collectTriggeredAbilities(state, event)).toEqual(expect.arrayContaining([expect.objectContaining({ cardInstanceId: 'araya-source', abilityId: 'origin-stillness-combat-end' })]));
    rules.processAbilityEvent(state, event);
    const window = state.abilityRuntime!.responseWindows[0]!;
    expect(window.choices).toEqual(expect.arrayContaining([expect.objectContaining({ cardInstanceId: 'araya-source', abilityId: 'origin-stillness-combat-end' })]));
    expect(rules.dispatchAbilityCommand(state, 'p1', { type: 'resolve_response', windowId: window.id, cardInstanceId: 'araya-source', abilityId: 'origin-stillness-combat-end' }).ok).toBe(true);
    expect(state.abilityRuntime!.pendingDecision?.candidates).toEqual(['araya-basic']);
    expect(choose(state, ['araya-basic']).ok).toBe(true);
    expect(state.cards.find((card) => card.instanceId === 'araya-basic')?.zone).toBe('deck');
    expect(state.players[0]!.mana).toBe(7);
  });

  it('captures an opponent attack power at selection time and applies that exact payload next round', () => {
    const state = setupFromArchive('data/authoring/servants/servant.leonidas.p3-m50-01.json', LEONIDAS, 'leonidas-source', 'battle');
    const pack: any = state.abilityRuntime!.pack; pack.cards['fixture.enemy.attack'] = compiledAttack('fixture.enemy.attack', 7);
    state.cards.push({ instanceId: 'enemy-attack', definitionId: 'fixture.enemy.attack', ownerPlayerId: 'p2', controllerPlayerId: 'p2', zone: 'attack_area', visibility: { scope: 'public' } });
    state.abilityRuntime!.cardState['enemy-attack'] = { active: true, faceDown: false, playedRound: state.round.roundNumber };

    expect(rules.dispatchAbilityCommand(state, 'p1', { type: 'activate_ability', cardInstanceId: 'leonidas-source', abilityId: 'warrior-roar' }).ok).toBe(true);
    expect(state.abilityRuntime!.pendingDecision?.candidates).toEqual(['enemy-attack']);
    expect(choose(state, ['enemy-attack']).ok).toBe(true);
    expect(state.abilityRuntime!.structuredScheduledEffects).toEqual([expect.objectContaining({ targetAbilityId: 'warrior-roar-next-round', triggerRound: state.round.roundNumber + 1, variables: { amount: 7 } })]);

    pack.cards['fixture.enemy.attack'].cardFace.basePower = 99;
    state.abilityRuntime!.cardState['enemy-attack']!.active = false;
    rules.advanceAbilityPhase(state, 'preparation', state.round.roundNumber + 1);
    expect(state.abilityRuntime!.structuredScheduledEffects).toEqual([]);
    expect(state.abilityRuntime!.roundTotalPowerAdjustments.byPlayer.p1).toBe(7);
  });

  it('revalidates Leonidas selection provenance and rejects a stale opponent attack atomically', () => {
    const state = setupFromArchive('data/authoring/servants/servant.leonidas.p3-m50-01.json', LEONIDAS, 'leonidas-source', 'battle');
    const pack: any = state.abilityRuntime!.pack; pack.cards['fixture.enemy.attack'] = compiledAttack('fixture.enemy.attack', 7);
    state.cards.push({ instanceId: 'enemy-attack', definitionId: 'fixture.enemy.attack', ownerPlayerId: 'p2', controllerPlayerId: 'p2', zone: 'attack_area', visibility: { scope: 'public' } });
    state.abilityRuntime!.cardState['enemy-attack'] = { active: true, faceDown: false, playedRound: state.round.roundNumber };
    expect(rules.dispatchAbilityCommand(state, 'p1', { type: 'activate_ability', cardInstanceId: 'leonidas-source', abilityId: 'warrior-roar' }).ok).toBe(true);
    state.abilityRuntime!.cardState['enemy-attack']!.active = false;
    const before = structuredClone(state); const result = choose(state, ['enemy-attack']);
    expect(result.ok).toBe(false); expect(state).toEqual(before);
  });

  it('re-triggers only active matching commander on-play automation without ordinary replay cost', () => {
    const state = setupFromArchive('data/authoring/servants/servant.valkyrie.p3-m50-01.json', VALKYRIE, 'valkyrie-source', 'action');
    const pack: any = state.abilityRuntime!.pack; pack.cards[COMMANDER] = compiledAttack(COMMANDER, 3, [automaticOnPlayMana(2)]);
    state.cards.push({ instanceId: 'commander-active', definitionId: COMMANDER, ownerPlayerId: 'p1', controllerPlayerId: 'p1', zone: 'attack_area', visibility: { scope: 'public' } });
    state.cards.push({ instanceId: 'commander-inactive', definitionId: COMMANDER, ownerPlayerId: 'p1', controllerPlayerId: 'p1', zone: 'attack_area', visibility: { scope: 'public' } });
    state.abilityRuntime!.cardState['commander-active'] = { active: true, faceDown: false, playedRound: state.round.roundNumber };
    state.abilityRuntime!.cardState['commander-inactive'] = { active: false, faceDown: true, playedRound: state.round.roundNumber };
    state.players[0]!.mana = 8; const mana = state.players[0]!.mana;
    expect(rules.dispatchAbilityCommand(state, 'p1', { type: 'activate_ability', cardInstanceId: 'valkyrie-source', abilityId: 'false-gungnir-retrigger-commanders' }).ok).toBe(true);
    expect(state.players[0]!.mana).toBe(mana + 2);
    expect(state.cards.find((card) => card.instanceId === 'commander-active')?.zone).toBe('attack_area');
    expect(state.abilityRuntime!.cardState['commander-inactive']).toMatchObject({ active: false, faceDown: true });
  });
});
