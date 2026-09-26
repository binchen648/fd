import { createHash } from 'node:crypto';
import { readFileSync, readdirSync } from 'node:fs';
import { join, resolve } from 'node:path';
import { describe, expect, it } from 'vitest';

import * as rules from '../src/index';
import { createSeededGameState } from '../src/tools/seeded-state';

const ROOT = resolve('.');
const OWNER = 'master.darnic';
const ID = 'master.darnic.skill.s1a';
const SOURCE = 'darnic-soul-eater-source';
const TEXT = '当你赢得一场战斗后，你可以将你的魔力设为4点。\n回合结束时，若你的魔力小于等于2，失去2点战果。';
const TEXT_SHA = '088a6c3e26174bb98ead15d585dc8cc408d6925acd3b0405dd4f62ab1c10653e';
const WIN_CLAUSE = '当你赢得一场战斗后，你可以将你的魔力设为4点。';
const WIN_SHA = '464fd9246076fc8c86029d2c63bbbbe81df7d31390196595f2e3b94c4a79a02b';
const END_CLAUSE = '回合结束时，若你的魔力小于等于2，失去2点战果。';
const END_SHA = '7a159e392ad4e1dcb5ad3edf73800151c33353a2bb39da2f01eebeb92bdf64b4';

function hash(text: string): string {
  return createHash('sha256').update(text, 'utf8').digest('hex');
}

function rawArchive(): any {
  return JSON.parse(readFileSync(resolve(ROOT, 'data/authoring/masters/master.darnic.json'), 'utf8'));
}

function setup() {
  const pack = rules.loadAuthoringJson(rawArchive());
  expect(pack.report).toEqual([]);
  const state = createSeededGameState({ activeSeats: [1, 2] });
  state.cards.push({
    instanceId: SOURCE,
    definitionId: ID,
    ownerPlayerId: 'p1',
    controllerPlayerId: 'p1',
    zone: 'skill',
    visibility: { scope: 'owner_only', ownerPlayerId: 'p1' },
  });
  state.players[0]!.masterCardId = OWNER;
  rules.initializeAbilityRuntime(state, pack, { seed: 20260920 });
  return state;
}

function authoringJsonFiles(dir: string): string[] {
  return readdirSync(dir, { withFileTypes: true }).flatMap((entry) => {
    const full = join(dir, entry.name);
    return entry.isDirectory() ? authoringJsonFiles(full) : entry.name.endsWith('.json') ? [full] : [];
  });
}

describe('P3 S R93 Darnic s1a consumer migration', () => {
  it('materializes the exact frozen card text, hashes, owner, and Locked Reference static metadata', () => {
    const raw = rawArchive();
    expect(raw).toMatchObject({
      schemaVersion: 'fd-card-authoring-v1',
      archiveType: 'master_skill_card_archive',
      id: OWNER,
      name: '达尼克·普雷斯通',
      class: 'Master',
      sourcePolicy: {
        phase3EvidenceCommit: '59f145434695d29bdd17e4cb3adc887e84182377',
        referenceMetadataCommit: 'b2f9fa15fba07c63530bbf4612b03b8b704755f9',
      },
    });
    expect(raw.cards.map((card: any) => card.id)).toEqual([ID]);
    const card = raw.cards[0];
    expect(card).toMatchObject({
      id: ID,
      aliases: ['s1a'],
      legacyId: 's1a',
      name: '噬魂者',
      cardType: 'master_skill',
      owner: { type: 'master', id: OWNER },
      cardFace: { typeLabel: '被动', attributes: [], cost: 0, basePower: 0 },
      playRequirements: [],
      phase3Evidence: {
        f1Commit: '59f145434695d29bdd17e4cb3adc887e84182377',
        f1ClauseSources: [{ sha256: WIN_SHA }, { sha256: END_SHA }],
        f1FullPrintedTextSha256: TEXT_SHA,
        referenceStaticMetadata: {
          commit: 'b2f9fa15fba07c63530bbf4612b03b8b704755f9',
          legacySkillId: 's1a', class: 'Master', cost: 0, basePower: 0,
          legacyRequirement: null, typeLabel: '被动', attributes: [],
        },
      },
    });
    expect(card.printedText).toBe(TEXT);
    expect(card.abilities.map((ability: any) => ability.printedClause)).toEqual([WIN_CLAUSE, END_CLAUSE]);
    expect(hash(card.printedText)).toBe(TEXT_SHA);
    expect(hash(WIN_CLAUSE)).toBe(WIN_SHA);
    expect(hash(END_CLAUSE)).toBe(END_SHA);
  });

  it('loads blocker-free as exactly two automatic generic abilities', () => {
    const pack = rules.loadAuthoringJson(rawArchive());
    expect(pack.report).toEqual([]);
    const card = pack.cards[ID]!;
    expect(card.mode).toBe('automatic');
    expect(card.abilities).toHaveLength(2);
    expect(card.abilities.map((ability) => [ability.id, ability.kind, ability.execution.mode])).toEqual([
      ['soul-eater-win-set-mana', 'optional_trigger', 'automatic'],
      ['soul-eater-round-end-loss', 'forced_trigger', 'automatic'],
    ]);
    expect(card.abilities[0]).toMatchObject({
      activation: { trigger: 'after_controller_wins_battle' },
      conditions: [{ type: 'source_owned' }],
      effects: [{ type: 'set_mana', player: 'controller', amount: 4 }],
      responseWindow: { opens: 'after_controller_wins_battle', order: 'turn_order', passBehavior: 'decline_this_window' },
    });
    expect(card.abilities[1]).toMatchObject({
      activation: { trigger: 'round_end' },
      conditions: [
        { type: 'source_owned' },
        { type: 'lte', left: { var: 'controller.availableMana' }, right: { op: 'const', value: 2 } },
      ],
      effects: [{ type: 'adjust_victory_points', player: 'controller', amount: -2 }],
    });
  });

  it('opens the optional response from the authoritative battle-result producer and sets mana to four when accepted', () => {
    const state = setup();
    state.players[0]!.mana = 1;
    rules.processAbilityEvent(state, {
      id: 'darnic-battle-result-win',
      type: 'after_battle_result_determined',
      playerId: 'p1',
      battleParticipantIds: ['p1', 'p2'],
      battleResult: { winners: ['p1'], loserIds: ['p2'] },
    });
    const legal = rules.getLegalActions(state, 'p1');
    const response = legal.find((action) => action.type === 'resolve_response');
    expect(response).toMatchObject({ type: 'resolve_response', cardInstanceId: SOURCE, abilityId: 'soul-eater-win-set-mana' });
    expect(rules.dispatchAbilityCommand(state, 'p1', response!)).toMatchObject({ ok: true });
    expect(state.players[0]!.mana).toBe(4);
    expect(state.abilityRuntime!.responseWindows).toEqual([]);
  });

  it('allows declining the win response and does not offer it when the controller did not win', () => {
    const declineState = setup();
    declineState.players[0]!.mana = 1;
    rules.processAbilityEvent(declineState, {
      id: 'darnic-battle-result-decline', type: 'after_battle_result_determined', playerId: 'p1',
      battleParticipantIds: ['p1', 'p2'], battleResult: { winners: ['p1'], loserIds: ['p2'] },
    });
    const decline = rules.getLegalActions(declineState, 'p1').find((action) => action.type === 'decline_this_window');
    expect(rules.dispatchAbilityCommand(declineState, 'p1', decline!)).toMatchObject({ ok: true });
    expect(declineState.players[0]!.mana).toBe(1);

    const lossState = setup();
    rules.processAbilityEvent(lossState, {
      id: 'darnic-battle-result-loss', type: 'after_battle_result_determined', playerId: 'p2',
      battleParticipantIds: ['p1', 'p2'], battleResult: { winners: ['p2'], loserIds: ['p1'] },
    });
    expect(lossState.abilityRuntime!.responseWindows.some((window) =>
      window.controllerId === 'p1' && window.choices.some((choice) => choice.abilityId === 'soul-eater-win-set-mana'))).toBe(false);
  });

  it('loses exactly two VP at round end when mana is at most two', () => {
    for (const mana of [0, 1, 2]) {
      const state = setup();
      state.players[0]!.mana = mana;
      state.players[0]!.vp = 5;
      rules.processAbilityEvent(state, { id: `darnic-round-end-low-${mana}`, type: 'round_end' });
      expect(state.players[0]!.vp).toBe(3);
    }
  });

  it('does not lose VP at round end when mana is above two', () => {
    const state = setup();
    state.players[0]!.mana = 3;
    state.players[0]!.vp = 5;
    rules.processAbilityEvent(state, { id: 'darnic-round-end-high', type: 'round_end' });
    expect(state.players[0]!.vp).toBe(5);
  });

  it('stays standalone outside product pack/generated outputs', () => {
    const manifest = readFileSync(resolve(ROOT, 'data/packs/fd-playtest-v1/pack.json'), 'utf8');
    const generated = readFileSync(resolve(ROOT, 'data/generated/fd-playtest-v1.content-library.json'), 'utf8');
    expect(manifest).not.toContain('data/authoring/masters/master.darnic.json');
    expect(manifest).not.toContain(ID);
    expect(generated).not.toContain(ID);
  });

  it('keeps Darnic s1a authored exactly once with no duplicate frozen ids', () => {
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
    expect(counts.get(ID)).toBe(1);
  });
});