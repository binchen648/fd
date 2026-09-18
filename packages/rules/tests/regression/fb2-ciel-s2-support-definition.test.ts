import { createHash } from 'node:crypto';
import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';

import * as rules from '../../src/index';
import type { GameState } from '../../src/schema/game';
import { currentDeploymentBonus } from '../../src/core/terrain-advantage';
import { createSeededGameState } from '../../src/tools/seeded-state';

type Archive = any;

const F1_COMMIT = '59f145434695d29bdd17e4cb3adc887e84182377';
const REFERENCE_COMMIT = 'b2f9fa15fba07c63530bbf4612b03b8b704755f9';
const EXORCISM_SHA = '232427277ebaef014071cc298108bdae588937e0a1cad95e09bfeb2be825f676';
const CLERICAL_SHA = 'aa9c706b41223a3a1ce19a89093bf5f533af1ae483ce352319e94a7081869b57';

function sha(text: string): string {
  return createHash('sha256').update(text, 'utf8').digest('hex');
}
function archive(): Archive {
  return JSON.parse(readFileSync('data/authoring/masters/master.ciel.json', 'utf8'));
}
function setup(): GameState {
  const raw = archive();
  const state = createSeededGameState();
  state.cards = [];
  state.round.activePhase = 'action';
  state.round.prioritySeat = 1;
  state.players[0]!.masterCardId = raw.id;
  state.players[0]!.mana = 1;
  state.players[0]!.locationId = 'recon';
  rules.initializeAbilityRuntime(state, rules.loadAuthoringJson(raw), { seed: 42 });
  return state;
}
function addCiel(state: GameState): string {
  const instanceId = 'ciel-s2';
  state.cards.push({
    instanceId,
    definitionId: 'master.ciel.skill.s2',
    ownerPlayerId: 'p1',
    controllerPlayerId: 'p1',
    zone: 'skill',
    visibility: { scope: 'owner_only', ownerPlayerId: 'p1' },
  });
  return instanceId;
}

describe('P3-FB2-22 recovery Ciel s2 support definition', () => {
  it('keeps exact frozen provenance, static metadata, and support-only archive shape', () => {
    const raw = archive();
    expect(raw).toMatchObject({
      schemaVersion: 'fd-card-authoring-v1',
      archiveType: 'master_support_definition_archive',
      id: 'master.ciel',
      sourcePolicy: { phase3EvidenceCommit: F1_COMMIT, referenceMetadataCommit: REFERENCE_COMMIT },
    });
    expect(raw).not.toHaveProperty('publicInformation');
    expect(raw).not.toHaveProperty('deck');
    expect(raw.cards).toHaveLength(1);
    const card = raw.cards[0];
    expect(card).toMatchObject({
      id: 'master.ciel.skill.s2',
      owner: { type: 'master', id: 'master.ciel' },
      cardType: 'master_skill',
      initialPlacement: 'outside_game',
      cardFace: { typeLabel: '特殊', cost: 1, basePower: 4, attributes: ['特殊'] },
      playRequirements: [{ type: 'skill_zone_mana_at_least', value: 0 }],
    });
    expect(card.phase3Evidence).toMatchObject({
      f1Commit: F1_COMMIT,
      referenceStaticMetadata: {
        commit: REFERENCE_COMMIT,
        legacySkillId: 's2', cost: 1, basePower: 4, legacyRequirement: 0, typeLabel: '特殊',
      },
      acceptedContracts: {
        outsideGameInitialPlacement: 'P3-R43/FB2-18',
        masterSupportOnlyRegistration: 'P3-R44/FB2-19',
        terrainDeploymentBonusMetric: 'P3-R46/FB2-21',
      },
    });
    expect(card.phase3Evidence.f1ClauseSources.map((entry: any) => entry.sha256)).toEqual([EXORCISM_SHA, CLERICAL_SHA]);
    expect(card.abilities.map((ability: any) => sha(ability.printedClause))).toEqual([EXORCISM_SHA, CLERICAL_SHA]);
  });

  it('loads with zero adapter blockers and compiles as outside-game support without initialZone', () => {
    const loaded = rules.loadAuthoringJson(archive());
    expect(loaded.report.filter((entry) => entry.status === 'unsupported')).toEqual([]);
    const card = loaded.cards['master.ciel.skill.s2'];
    expect(card).toMatchObject({ cardType: 'master_skill', initialPlacement: 'outside_game', mode: 'automatic' });
    expect(card).not.toHaveProperty('initialZone');
  });

  it('can be played below the ordinary eight-mana skill gate while paying printed cost 1', () => {
    const state = setup();
    const instanceId = addCiel(state);
    const result = rules.dispatchAbilityCommand(state, 'p1', { type: 'play_card', cardInstanceId: instanceId });
    expect(result.ok).toBe(true);
    expect(state.players[0]!.mana).toBe(0);
    expect(state.abilityRuntime!.cardState[instanceId]).toMatchObject({ active: true, faceDown: false });
  });

  it('executes the scouting combat action for exactly +2 mana from the active card', () => {
    const state = setup();
    const instanceId = addCiel(state);
    expect(rules.dispatchAbilityCommand(state, 'p1', { type: 'play_card', cardInstanceId: instanceId }).ok).toBe(true);
    rules.advanceAbilityPhase(state, 'battle');
    const action = rules.getLegalActions(state, 'p1').find((candidate) =>
      candidate.type === 'activate_ability' && candidate.cardInstanceId === instanceId && candidate.abilityId === 'clerical-convenience');
    expect(action).toBeTruthy();
    expect(rules.dispatchAbilityCommand(state, 'p1', action!).ok).toBe(true);
    expect(state.players[0]!.mana).toBe(2);
  });

  it('does not offer the scouting action outside recon', () => {
    const state = setup();
    const instanceId = addCiel(state);
    expect(rules.dispatchAbilityCommand(state, 'p1', { type: 'play_card', cardInstanceId: instanceId }).ok).toBe(true);
    state.players[0]!.locationId = 'shinto';
    rules.advanceAbilityPhase(state, 'battle');
    expect(rules.getLegalActions(state, 'p1').some((candidate) =>
      candidate.type === 'activate_ability' && candidate.cardInstanceId === instanceId && candidate.abilityId === 'clerical-convenience')).toBe(false);
  });

  it('uses the accepted shared deployment-bonus metric for an uncontested win', () => {
    const state = setup();
    const instanceId = addCiel(state);
    expect(rules.dispatchAbilityCommand(state, 'p1', { type: 'play_card', cardInstanceId: instanceId }).ok).toBe(true);
    state.players[0]!.locationId = 'miyama_town';
    for (const opponent of state.players.slice(1)) opponent.locationId = 'shinto';
    state.map.locations.find((location) => location.id === 'miyama_town')!.terrainBonuses = [3, 1];
    (state as unknown as { modeState: { terrainAssignments: Record<string, string[]>; terrainMultipliers: Array<{ playerId: string; multiplier: number }> } }).modeState = {
      terrainAssignments: { miyama_town: ['p1'] },
      terrainMultipliers: [{ playerId: 'p1', multiplier: 2 }],
    };
    expect(currentDeploymentBonus(state, 'p1')).toBe(6);
    rules.advanceAbilityPhase(state, 'battle');
    rules.processAbilityEvent(state, {
      id: 'ciel-uncontested-win', type: 'after_controller_wins_battle', playerId: 'p1',
      battleResult: { winners: ['p1'], loserIds: [] },
    });
    expect(state.players[0]!.vp).toBe(6);
  });

  it('does not grant the uncontested-win reward while another active player shares the battlefield', () => {
    const state = setup();
    const instanceId = addCiel(state);
    expect(rules.dispatchAbilityCommand(state, 'p1', { type: 'play_card', cardInstanceId: instanceId }).ok).toBe(true);
    state.players[0]!.locationId = 'miyama_town';
    state.players[1]!.locationId = 'miyama_town';
    state.map.locations.find((location) => location.id === 'miyama_town')!.terrainBonuses = [3, 1];
    (state as unknown as { modeState: { terrainAssignments: Record<string, string[]> } }).modeState = {
      terrainAssignments: { miyama_town: ['p1', 'p2'] },
    };
    rules.advanceAbilityPhase(state, 'battle');
    rules.processAbilityEvent(state, {
      id: 'ciel-contested-win', type: 'after_controller_wins_battle', playerId: 'p1',
      battleResult: { winners: ['p1'], loserIds: ['p2'] },
    });
    expect(state.players[0]!.vp).toBe(0);
  });
});
