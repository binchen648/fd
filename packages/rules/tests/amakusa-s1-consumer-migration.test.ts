import { createHash } from 'node:crypto';
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { describe, expect, it } from 'vitest';

import * as rules from '../src/index';
import type { GameState } from '../src/schema/game';
import { createSeededGameState } from '../src/tools/seeded-state';

const ROOT = resolve('.');
const OWNER = 'master.amakusa';
const ID = 'master.amakusa.skill.s1';
const SOURCE = 'amakusa-s1-source';
const CLAUSE_SHA = '0bef7042f91686e4653ddb4d8ed0bfb6dff4d37cbe32de201aeb84e5ebaa4b1f';
const FULL_SHA = '7eab2353f1342bcc8cf643a44d16c9bdf923f8c66ffa993059334ff37766c320';

function hash(text: string): string {
  return createHash('sha256').update(text, 'utf8').digest('hex');
}

function rawArchive(): any {
  return JSON.parse(readFileSync(resolve(ROOT, 'data/authoring/masters/master.amakusa.json'), 'utf8'));
}

function setup(
  controllerId = 'p2',
  activeSeats: number[] = [1, 2, 3, 4, 5, 6, 7],
  ownerPlayerId = controllerId,
): GameState {
  const pack = rules.loadAuthoringJson(rawArchive());
  expect(pack.report).toEqual([]);
  const state = createSeededGameState({ activeSeats });
  state.cards = [{
    instanceId: SOURCE,
    definitionId: ID,
    ownerPlayerId,
    controllerPlayerId: controllerId,
    zone: 'skill',
    visibility: { scope: 'owner_only', ownerPlayerId },
  }];
  rules.initializeAbilityRuntime(state, pack, { seed: 20260920 });
  return state;
}

function start(state: GameState, id = 'amakusa-game-start'): void {
  rules.processAbilityEvent(state, { id, type: 'game_start' });
}

describe('P3 S R82 Amakusa s1 consumer migration', () => {
  it('materializes exactly the frozen card with F1 hashes, Reference metadata, and accepted FB2-39 semantics', () => {
    const raw = rawArchive();
    expect(raw).toMatchObject({
      schemaVersion: 'fd-card-authoring-v1',
      archiveType: 'master_skill_card_archive',
      id: OWNER,
      class: 'Master',
      sourcePolicy: {
        phase3EvidenceCommit: '59f145434695d29bdd17e4cb3adc887e84182377',
        referenceMetadataCommit: 'b2f9fa15fba07c63530bbf4612b03b8b704755f9',
      },
    });
    expect(raw.cards.map((card: any) => card.id)).toEqual([ID]);
    const authored = raw.cards[0];
    expect(authored).toMatchObject({
      id: ID,
      aliases: ['s1'],
      legacyId: 's1',
      cardType: 'master_skill',
      owner: { type: 'master', id: OWNER },
      cardFace: { attributes: [], cost: 0, basePower: 0 },
      playTiming: { phase: 'action', window: 'controller_play_card_window' },
      playRequirements: [],
      phase3Evidence: {
        f1Commit: '59f145434695d29bdd17e4cb3adc887e84182377',
        f1ClauseSources: [{ sha256: CLAUSE_SHA }],
        f1FullPrintedTextSha256: FULL_SHA,
        referenceStaticMetadata: {
          commit: 'b2f9fa15fba07c63530bbf4612b03b8b704755f9',
          legacySkillId: 's1', class: 'Master', cost: 0, basePower: 0,
          legacyRequirement: null, attributes: [],
        },
        acceptedContracts: { gameStartPlayerStatusAssignment: 'P3-R82/FB2-39' },
      },
    });
    expect(hash(authored.printedText)).toBe(FULL_SHA);
    expect(hash(authored.abilities[0].printedClause)).toBe(CLAUSE_SHA);

    const pack = rules.loadAuthoringJson(raw);
    expect(pack.report).toEqual([]);
    const card = pack.cards[ID]!;
    expect(card.mode).toBe('automatic');
    expect(card.abilities).toHaveLength(1);
    expect(card.abilities[0]).toMatchObject({
      id: 'doctrine-assign-roles',
      kind: 'forced_trigger',
      activation: { trigger: 'game_start' },
      conditions: [{ type: 'source_owned' }],
      effects: [
        { type: 'add_status', target: 'controller', status: 'role:red-team-leader' },
        { type: 'add_status', target: { scope: 'turn_order_next_player' }, status: 'role:god-servant' },
        { type: 'add_status', target: { scope: 'turn_order_next_player' }, status: 'history:god-servant' },
      ],
      execution: { mode: 'automatic', allowedOperations: [] },
    });
    expect(rules.isGameStartPlayerStatusAssignmentSemantic(card.abilities[0]!)).toBe(true);
  });

  it('assigns the leader to the controller and both servant keys to the circular next active seat', () => {
    const state = setup('p2', [2, 4, 7]);
    const playerStateStatuses = state.players.map((player) => player.status);
    state.players = [state.players[6]!, state.players[3]!, state.players[1]!, state.players[0]!, state.players[5]!, state.players[2]!, state.players[4]!];
    start(state);
    expect(rules.playerStatusKeys(state, 'p2')).toEqual(['role:red-team-leader']);
    expect(rules.playerStatusKeys(state, 'p4')).toEqual(['role:god-servant', 'history:god-servant']);
    expect(rules.playerStatusKeys(state, 'p7')).toEqual([]);
    expect([...state.players].sort((a, b) => a.seat - b.seat).map((player) => player.status)).toEqual(playerStateStatuses);
  });

  it('wraps, skips eliminated seats, and deduplicates repeated authoritative events', () => {
    const state = setup('p7', [1, 4, 7]);
    start(state);
    start(state, 'amakusa-game-start-replayed-with-new-id');
    expect(rules.turnOrderNextActivePlayerId(state, 'p7')).toBe('p1');
    expect(rules.playerStatusKeys(state, 'p7')).toEqual(['role:red-team-leader']);
    expect(rules.playerStatusKeys(state, 'p1')).toEqual(['role:god-servant', 'history:god-servant']);
    expect(rules.playerStatusKeys(state, 'p4')).toEqual([]);
  });

  it('fails closed atomically for non-owned source or topology with no valid other active player', () => {
    const notOwned = setup('p2', [1, 2, 4], 'p1');
    start(notOwned);
    expect(notOwned.abilityRuntime!.playerStatusKeysByPlayer).toEqual({});

    const onlySelf = setup('p2', [2]);
    expect(rules.collectTriggeredAbilities(onlySelf, { id: 'probe', type: 'game_start' })).toEqual([]);
    start(onlySelf);
    expect(onlySelf.abilityRuntime!.playerStatusKeysByPlayer).toEqual({});
  });

  it('keeps the standalone migration outside product pack/generated outputs', () => {
    const manifest = readFileSync(resolve(ROOT, 'data/packs/fd-playtest-v1/pack.json'), 'utf8');
    const generated = readFileSync(resolve(ROOT, 'data/generated/fd-playtest-v1.content-library.json'), 'utf8');
    expect(manifest).not.toContain('data/authoring/masters/master.amakusa.json');
    expect(manifest).not.toContain(ID);
    expect(generated).not.toContain(ID);
  });
});
