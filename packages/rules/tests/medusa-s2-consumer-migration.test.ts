import { createHash } from 'node:crypto';
import { readFileSync, readdirSync } from 'node:fs';
import { join, resolve } from 'node:path';
import { describe, expect, it } from 'vitest';

import * as rules from '../src/index';
import type { GameState } from '../src/schema/game';
import { createSeededGameState } from '../src/tools/seeded-state';

const ROOT = resolve('.');
const OWNER = 'servant.medusa';
const EXISTING_ID = 'servant.medusa.skill.sc-medusa-1';
const ID = 'servant.medusa.skill.sc-medusa-2';
const SOURCE = 'medusa-s2-source';
const ABILITY = 'mystic-eyes-petrification';
const SWIFT = 'probe.medusa.swift';
const POWER = 'probe.medusa.power';
const TEXT = '【真名解放】\n行动阶段：在战斗阶段开始前，若与你进行战斗的对手本回合没有打出/加入迅捷属性攻击，则其【败北】。';
const TEXT_SHA = 'fe34566fb9dbea83e43f7f97dc56a97f5176e07e8a124ee1816aa5645bf770ff';

function hash(text: string): string {
  return createHash('sha256').update(text, 'utf8').digest('hex');
}

function rawArchive(): any {
  return JSON.parse(readFileSync(resolve(ROOT, 'data/authoring/servants/servant.medusa.json'), 'utf8'));
}

function probeArchive(): any {
  const archive = rawArchive();
  archive.cards.push(
    {
      id: SWIFT,
      name: 'Medusa swift probe',
      cardType: 'servant_attack',
      owner: { type: 'servant', id: OWNER },
      cardFace: { typeLabel: '迅捷', attributes: ['迅捷'], cost: 0, basePower: 4 },
      playTiming: { phase: 'action', window: 'controller_play_card_window' },
      playRequirements: [],
      abilities: [],
    },
    {
      id: POWER,
      name: 'Medusa power probe',
      cardType: 'servant_attack',
      owner: { type: 'servant', id: OWNER },
      cardFace: { typeLabel: '力量', attributes: ['力量'], cost: 0, basePower: 4 },
      playTiming: { phase: 'action', window: 'controller_play_card_window' },
      playRequirements: [],
      abilities: [],
    },
  );
  return archive;
}

function setup(): GameState {
  const pack = rules.loadAuthoringJson(probeArchive());
  expect(pack.report).toEqual([]);
  const state = createSeededGameState({ activeSeats: [1, 2, 3] });
  state.cards = [{
    instanceId: SOURCE,
    definitionId: ID,
    ownerPlayerId: 'p1',
    controllerPlayerId: 'p1',
    zone: 'skill',
    visibility: { scope: 'owner_only', ownerPlayerId: 'p1' },
  }];
  state.round.activePhase = 'action';
  state.round.prioritySeat = state.players[0]!.seat;
  state.players[0]!.locationId = 'shinto';
  state.players[1]!.locationId = 'shinto';
  state.players[2]!.locationId = 'miyama_town';
  for (const player of state.players) player.mana = 20;
  rules.initializeAbilityRuntime(state, pack, { seed: 9502 });
  return state;
}

function playMedusa(state: GameState): void {
  const result = rules.dispatchAbilityCommand(state, 'p1', { type: 'play_card', cardInstanceId: SOURCE });
  expect(result.ok).toBe(true);
}

function activateMedusa(state: GameState): void {
  state.round.activePhase = 'action';
  state.round.prioritySeat = state.players[0]!.seat;
  const action = rules.getLegalActions(state, 'p1').find((candidate) =>
    candidate.type === 'activate_ability' && candidate.cardInstanceId === SOURCE && candidate.abilityId === ABILITY);
  expect(action).toBeDefined();
  expect(rules.dispatchAbilityCommand(state, 'p1', action!).ok).toBe(true);
}

function addCard(
  state: GameState,
  playerId: string,
  definitionId: string,
  zone: 'hand' | 'attack_area' = 'hand',
  faceDown = false,
): string {
  const id = `${playerId}-${definitionId}-${state.cards.length}`;
  state.cards.push({
    instanceId: id,
    definitionId,
    ownerPlayerId: playerId,
    controllerPlayerId: playerId,
    zone,
    visibility: faceDown
      ? { scope: 'owner_only', ownerPlayerId: playerId }
      : zone === 'hand'
        ? { scope: 'owner_only', ownerPlayerId: playerId }
        : { scope: 'public' },
  });
  if (zone === 'attack_area') {
    state.abilityRuntime!.cardState[id] = { active: true, faceDown, playedRound: state.round.roundNumber };
  }
  return id;
}

function settle(state: GameState): GameState {
  state.round.activePhase = 'battle';
  return rules.resolveBattlefield(state, {
    battlefieldId: 'shinto',
    participants: [
      { playerId: 'p1', totalPower: 5 },
      { playerId: 'p2', totalPower: 10 },
    ],
  }).nextState;
}

function authoringJsonFiles(dir: string): string[] {
  return readdirSync(dir, { withFileTypes: true }).flatMap((entry) => {
    const full = join(dir, entry.name);
    return entry.isDirectory() ? authoringJsonFiles(full) : entry.name.endsWith('.json') ? [full] : [];
  });
}

describe('P3 S R95 Medusa s2 consumer migration', () => {
  it('appends exactly the frozen Medusa s2 card beside the preserved s1 with exact F1 and Reference metadata', () => {
    const raw = rawArchive();
    expect(raw).toMatchObject({
      schemaVersion: 'fd-card-authoring-v1',
      archiveType: 'servant_skill_card_archive',
      id: OWNER,
      name: '美杜莎',
      class: 'Rider',
      sourcePolicy: {
        phase3EvidenceCommit: '59f145434695d29bdd17e4cb3adc887e84182377',
        referenceMetadataCommit: 'b2f9fa15fba07c63530bbf4612b03b8b704755f9',
      },
    });
    expect(raw.cards.map((card: any) => card.id)).toEqual([EXISTING_ID, ID]);
    const authored = raw.cards.find((card: any) => card.id === ID);
    expect(authored).toMatchObject({
      id: ID,
      aliases: ['sc_medusa_2'],
      legacyId: 'sc_medusa_2',
      name: '石化之魔眼',
      cardType: 'servant_skill',
      owner: { type: 'servant', id: OWNER },
      cardFace: { typeLabel: '魔术', attributes: ['魔术'], cost: 4, basePower: 1 },
      playTiming: { phase: 'action', window: 'controller_play_card_window' },
      playRequirements: [{ type: 'skill_zone_mana_at_least', value: 4 }],
      phase3Evidence: {
        f1Commit: '59f145434695d29bdd17e4cb3adc887e84182377',
        f1ClauseSources: [{ sha256: TEXT_SHA }],
        f1FullPrintedTextSha256: TEXT_SHA,
        referenceStaticMetadata: {
          commit: 'b2f9fa15fba07c63530bbf4612b03b8b704755f9',
          legacySkillId: 'sc_medusa_2',
          class: 'Rider',
          cost: 4,
          basePower: 1,
          legacyRequirement: 4,
          typeLabel: '魔术',
          attributes: ['魔术'],
        },
      },
    });
    expect(authored.printedText).toBe(TEXT);
    expect(authored.abilities).toHaveLength(1);
    expect(authored.abilities[0].printedClause).toBe(TEXT);
    expect(hash(authored.printedText)).toBe(TEXT_SHA);
    expect(hash(authored.abilities[0].printedClause)).toBe(TEXT_SHA);
  });

  it('loads blocker-free as the exact automatic FB2-45 whole-card composition', () => {
    const pack = rules.loadAuthoringJson(rawArchive());
    expect(pack.report).toEqual([]);
    const card = pack.cards[ID]!;
    expect(card.mode).toBe('automatic');
    expect(card.abilities).toHaveLength(1);
    expect(card.abilities[0]).toMatchObject({
      id: ABILITY,
      kind: 'phase_action',
      activation: { phase: 'action', opens: 'controller_action_window' },
      conditions: [{ type: 'source_active' }],
      effects: [{
        type: 'defeat_player',
        target: {
          scope: 'engaged_opponents',
          where: [{ type: 'no_attack_played_this_round_with_attribute', attribute: '迅捷' }],
        },
      }],
      visibility: { revealsTrueName: true, revealTiming: 'on_use_declared', revealScope: 'servant_package' },
      execution: { mode: 'automatic' },
    });
    expect(rules.isAcceptedPreBattleDefeatAbility(card.abilities[0]!, 'compiled')).toBe(true);
    expect(rules.definitionHasStructuralTrueNameRelease(card)).toBe(true);
  });

  it('plays through the real card path, pays four mana, reveals on ability declaration, defeats at settlement, and consumes the intent', () => {
    const state = setup();
    playMedusa(state);
    expect(state.players[0]!.mana).toBe(16);
    expect(state.cards.find((card) => card.instanceId === SOURCE)?.zone).toBe('attack_area');
    expect(state.abilityRuntime!.cardState[SOURCE]).toMatchObject({
      active: true,
      faceDown: false,
      playedRound: state.round.roundNumber,
    });
    expect(state.abilityRuntime!.revealedServants).not.toContain('p1');

    activateMedusa(state);
    expect(state.abilityRuntime!.revealedServants).toContain('p1');
    expect(state.abilityRuntime!.pendingPreBattleDefeats).toEqual([
      expect.objectContaining({ round: state.round.roundNumber, battlefieldId: 'shinto', targetPlayerIds: ['p2'] }),
    ]);

    const settled = settle(state);
    expect(settled.battleResults.at(-1)!.winnerPlayerIds).toEqual(['p1']);
    expect(settled.battleResults.at(-1)!.excludedPlayerIds).toContain('p2');
    expect(settled.abilityRuntime!.pendingPreBattleDefeats).toEqual([]);
    expect(settled.log).toContainEqual(expect.objectContaining({ type: 'prebattle_defeat_applied' }));
  });

  it('a real ordinary current-round swift attack protects, while non-swift and previous-round swift do not', () => {
    const protectedState = setup();
    playMedusa(protectedState);
    const swift = addCard(protectedState, 'p2', SWIFT);
    protectedState.round.prioritySeat = protectedState.players[1]!.seat;
    expect(rules.dispatchAbilityCommand(protectedState, 'p2', { type: 'play_card', cardInstanceId: swift }).ok).toBe(true);
    expect(protectedState.abilityRuntime!.cardState[swift]).toMatchObject({ playedRound: protectedState.round.roundNumber });
    activateMedusa(protectedState);
    expect(protectedState.abilityRuntime!.pendingPreBattleDefeats).toEqual([]);
    expect(settle(protectedState).battleResults.at(-1)!.winnerPlayerIds).toEqual(['p2']);

    const defeatedState = setup();
    playMedusa(defeatedState);
    addCard(defeatedState, 'p2', POWER, 'attack_area');
    const oldSwift = addCard(defeatedState, 'p2', SWIFT, 'attack_area');
    defeatedState.abilityRuntime!.cardState[oldSwift]!.playedRound = defeatedState.round.roundNumber - 1;
    activateMedusa(defeatedState);
    expect(defeatedState.abilityRuntime!.pendingPreBattleDefeats![0]!.targetPlayerIds).toEqual(['p2']);
  });

  it('the accepted Maiya add-to-attack gateway writes current-round swift provenance for the engaged opponent', () => {
    const state = setup();
    playMedusa(state);
    const maiyaRaw = JSON.parse(readFileSync(resolve(ROOT, 'data/authoring/masters/master.maiya.json'), 'utf8'));
    const maiyaPack = rules.loadAuthoringJson(maiyaRaw);
    expect(maiyaPack.report).toEqual([]);
    Object.assign(state.abilityRuntime!.pack.cards, maiyaPack.cards);

    state.players[2]!.locationId = 'recon';
    state.players[2]!.mana = 4;
    state.cards.push(
      {
        instanceId: 'maiya-source',
        definitionId: 'master.maiya.skill.military',
        ownerPlayerId: 'p3',
        controllerPlayerId: 'p3',
        zone: 'skill',
        visibility: { scope: 'public' },
      },
      {
        instanceId: 'maiya-support',
        definitionId: 'master.maiya.deck.support-shot',
        ownerPlayerId: 'p3',
        controllerPlayerId: 'p3',
        zone: 'skill',
        visibility: { scope: 'public' },
      },
    );
    state.abilityRuntime!.cardState['maiya-source'] = { active: true, faceDown: false };
    state.abilityRuntime!.cardState['maiya-support'] = { active: false, faceDown: false };
    state.round.activePhase = 'advance';
    rules.executeAbility(state, {
      controllerId: 'p3',
      sourceCardId: 'maiya-source',
      abilityId: 'military.attach-support-shot',
      selections: { supported_player: ['p2'] },
      variables: {},
    });
    expect(state.cards.find((card) => card.instanceId === 'maiya-support')).toMatchObject({
      controllerPlayerId: 'p2',
      zone: 'attack_area',
    });
    expect(state.abilityRuntime!.cardState['maiya-support']).toMatchObject({ playedRound: state.round.roundNumber });

    activateMedusa(state);
    expect(state.abilityRuntime!.pendingPreBattleDefeats).toEqual([]);
  });

  it('face-down swift protects server-side and another battlefield is never targeted', () => {
    const hidden = setup();
    playMedusa(hidden);
    addCard(hidden, 'p2', SWIFT, 'attack_area', true);
    activateMedusa(hidden);
    expect(hidden.abilityRuntime!.pendingPreBattleDefeats).toEqual([]);

    const otherLocation = setup();
    playMedusa(otherLocation);
    activateMedusa(otherLocation);
    expect(otherLocation.abilityRuntime!.pendingPreBattleDefeats![0]!.targetPlayerIds).toEqual(['p2']);
    expect(otherLocation.abilityRuntime!.pendingPreBattleDefeats![0]!.targetPlayerIds).not.toContain('p3');
  });

  it('Basic Luck ignores the defeat while consuming the intent; repeated activation is idempotent and round advance clears stale intent', () => {
    const lucky = setup();
    playMedusa(lucky);
    lucky.cards.push({
      instanceId: 'p2-luck',
      definitionId: 'basic.luck',
      ownerPlayerId: 'p2',
      controllerPlayerId: 'p2',
      zone: 'attack_area',
      visibility: { scope: 'public' },
    });
    lucky.abilityRuntime!.cardState['p2-luck'] = {
      active: true,
      faceDown: false,
      playedRound: lucky.round.roundNumber,
    };
    activateMedusa(lucky);
    const first = structuredClone(lucky.abilityRuntime!.pendingPreBattleDefeats);
    rules.executeAbility(lucky, {
      controllerId: 'p1',
      sourceCardId: SOURCE,
      abilityId: ABILITY,
      selections: {},
      variables: {},
    });
    expect(lucky.abilityRuntime!.pendingPreBattleDefeats).toEqual(first);
    const settled = settle(lucky);
    expect(settled.battleResults.at(-1)!.winnerPlayerIds).toEqual(['p2']);
    expect(settled.abilityRuntime!.pendingPreBattleDefeats).toEqual([]);
    expect(settled.log).toContainEqual(expect.objectContaining({ type: 'prebattle_defeat_ignored' }));

    const stale = setup();
    playMedusa(stale);
    activateMedusa(stale);
    expect(stale.abilityRuntime!.pendingPreBattleDefeats).toHaveLength(1);
    rules.advanceAbilityPhase(stale, 'action', stale.round.roundNumber + 1);
    expect(stale.abilityRuntime!.pendingPreBattleDefeats).toEqual([]);
  });

  it('stays standalone outside product pack and generated outputs', () => {
    const manifest = readFileSync(resolve(ROOT, 'data/packs/fd-playtest-v1/pack.json'), 'utf8');
    const generated = readFileSync(resolve(ROOT, 'data/generated/fd-playtest-v1.content-library.json'), 'utf8');
    expect(manifest).not.toContain(ID);
    expect(generated).not.toContain(ID);
  });

  it('keeps both Medusa frozen ids authored exactly once with no duplicate frozen ids', () => {
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
    expect(frozen.size).toBe(944);
    expect(duplicateFrozen).toEqual([]);
    expect(counts.get(EXISTING_ID)).toBe(1);
    expect(counts.get(ID)).toBe(1);
  });
});
