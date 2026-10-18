import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { describe, expect, it } from 'vitest';

import * as rules from '../../src/index';
import type { GameState } from '../../src/schema/game';
import { createSeededGameState } from '../../src/tools/seeded-state';

const ARCHIVE_PATH = resolve('data/authoring/masters/master.hakuno-m.json');
const ROOT = 'master.hakuno-m';
const ASCENSION = `${ROOT}.skill.ascension`;
const S1 = `${ROOT}.skill.s1`;
const S2 = `${ROOT}.skill.s2`;
const S3 = `${ROOT}.skill.s3`;
const YOMI = 'hakuno-m.yomi';
const DEAD_FACE = 'hakuno-m.dead-face-transfer';

function rawArchive() {
  return JSON.parse(readFileSync(ARCHIVE_PATH, 'utf8')) as any;
}

function setup(phase: 'action' | 'combat' = 'action'): GameState {
  const state = createSeededGameState({ activeSeats: [1, 2, 3] });
  state.cards = [];
  state.round.activePhase = phase;
  state.players[0]!.masterCardId = ROOT;
  state.players[0]!.mana = 4;
  state.players[0]!.locationId = 'miyama_town';
  state.players[1]!.locationId = 'miyama_town';
  state.players[2]!.locationId = 'shinto';
  state.players[0]!.status = 'active';
  state.players[1]!.status = 'active';
  state.players[2]!.status = 'active';
  rules.initializeAbilityRuntime(state, rules.loadAuthoringJson(rawArchive()), { seed: 20261019 });
  return state;
}

function addCard(state: GameState, definitionId: string, owner = 'p1', zone = 'skill') {
  const instanceId = `hakuno-m:${state.cards.length}:${definitionId.split('.').at(-1)}`;
  state.cards.push({
    instanceId,
    definitionId,
    ownerPlayerId: owner,
    controllerPlayerId: owner,
    zone,
    visibility: { scope: 'owner_only', ownerPlayerId: owner },
  });
  state.abilityRuntime!.cardState[instanceId] = {
    active: false,
    faceDown: false,
    playedRound: state.round.roundNumber,
  };
  return instanceId;
}

describe('P3 Hakuno-M owner readiness capability', () => {
  it('loads exactly the four frozen skills and records only the two explicit host gaps', () => {
    const loaded = rules.loadAuthoringJson(rawArchive());
    expect(loaded.report).toEqual(expect.arrayContaining([
      expect.objectContaining({ abilityId: 'hakuno-m.challenge-result', status: 'host_adjudicated' }),
      expect.objectContaining({ abilityId: 'hakuno-m.analysis', status: 'host_adjudicated' }),
      expect.objectContaining({ path: 'verification.implementationStatus', status: 'unsupported' }),
    ]));
    expect(loaded.report.some((entry) => entry.abilityId === YOMI && entry.status === 'unsupported')).toBe(false);
    expect(loaded.report.some((entry) => entry.abilityId === DEAD_FACE && entry.status === 'unsupported')).toBe(false);
    expect(Object.keys(loaded.cards).sort()).toEqual([ASCENSION, S1, S2, S3].sort());
    expect(loaded.cards[S1]!.abilities[0]!.effects[0]).toEqual({
      type: 'hakuno_m_yomi', mode: 'analysis', target: 'opponent',
    });
    expect(loaded.cards[ASCENSION]!.abilities[0]!.cost).toEqual([{ type: 'pay_mana', amount: 1 }]);
  });

  it('fails closed for widened Hakuno-M privileged shapes', () => {
    const malformed = rawArchive();
    malformed.cards[1].abilities[0].effects[0].mode = 'challenge';
    const loaded = rules.loadAuthoringJson(malformed);
    expect(loaded.report).toEqual(expect.arrayContaining([
      expect.objectContaining({ status: 'unsupported', path: 'hakunoMale.gateway' }),
    ]));
  });

  it('executes Yomi analysis branch with a -2 round adjustment and provenance-bound Analysis card', () => {
    const state = setup('combat');
    const source = addCard(state, S1);
    rules.executeAbility(state, {
      controllerId: 'p1', sourceCardId: source, abilityId: YOMI,
      variables: {}, selections: { opponent: ['p2'] },
    });

    expect(state.abilityRuntime!.roundPlayerPowerAdjustments).toContainEqual(expect.objectContaining({
      playerId: 'p1', amount: -2, sourceCardId: source, abilityId: YOMI,
    }));
    expect(state.cards).toContainEqual(expect.objectContaining({
      definitionId: S3, ownerPlayerId: 'p2', controllerPlayerId: 'p2', zone: 'skill', generatedBy: source,
    }));
  });

  it('executes Dead Face as a repeatable paid owner transfer and preserves the Analysis definition', () => {
    const state = setup('action');
    const source = addCard(state, ASCENSION);
    const analysis = addCard(state, S3, 'p2');
    const beforeMana = state.players[0]!.mana;
    rules.executeAbility(state, {
      controllerId: 'p1', sourceCardId: source, abilityId: DEAD_FACE,
      variables: {}, selections: { analysis: [analysis], recipient: ['p3'] },
    });

    const moved = state.cards.find((card) => card.instanceId === analysis)!;
    expect(state.players[0]!.mana).toBe(beforeMana - 1);
    expect(moved).toMatchObject({ definitionId: S3, ownerPlayerId: 'p3', controllerPlayerId: 'p3', zone: 'skill' });
    expect(state.abilityRuntime!.events).toContainEqual(expect.objectContaining({
      type: 'card_moved', cardInstanceId: analysis, fromZone: 'skill', toZone: 'skill', abilityId: DEAD_FACE,
    }));
  });

  it('keeps challenge-result and Analysis as explicit readiness gaps instead of claiming runtime completion', () => {
    const raw = rawArchive();
    expect(raw.sourcePolicy.note).toContain('three-round RPS continuation');
    expect(raw.sourcePolicy.note).toContain('round-end eliminated-holder handoff');
    expect(raw.cards.find((card: any) => card.id === S2).abilities[0].effects).toEqual([
      { type: 'hakuno_m_challenge_result' },
    ]);
    expect(raw.cards.find((card: any) => card.id === S3).abilities[0].effects).toEqual([
      { type: 'hakuno_m_analysis' },
    ]);
  });
});
