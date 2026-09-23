import { readFileSync, readdirSync } from 'node:fs';
import { join, resolve } from 'node:path';
import { describe, expect, it } from 'vitest';
import * as rules from '../src/index';
import type { AbilityEvent, GameState } from '../src/index';
import { createSeededGameState } from '../src/tools/seeded-state';

const ROOT = resolve('.');
const ATALANTA_S1 = 'servant.atalanta.skill.sc-atalanta-1';
const ATALANTA_S3 = 'servant.atalanta.skill.sc-atalanta-3';
const MECHA_S2 = 'servant.mechaeli.skill.sc-mechaeli-2';
const GORGON_S2 = 'servant.gorgon.skill.sc-gorgon-2';
const IBARAKI_S1 = 'servant.ibaraki.skill.sc-ibaraki-1';
const BATTLEFIELD = 'shinto';

function raw(file: string): any {
  return JSON.parse(readFileSync(resolve(ROOT, file), 'utf8').replace(/^\uFEFF/, ''));
}
function compiled(file: string): any {
  const pack = rules.loadAuthoringJson(raw(file));
  expect(pack.report).toEqual([]);
  return pack;
}
function simpleAttack(id: string, ownerId: string, cost = 2, basePower = 3): any {
  return {
    id, name: id, cardType: 'servant_attack', ownerId,
    cardFace: { typeLabel: '力量', cost, basePower, attributes: ['力量'] },
    playTiming: { phase: 'action', window: 'controller_play_card_window' },
    playRequirements: [], abilities: [], mode: 'automatic', playKind: 'attack', destinationZone: 'attack_area',
  };
}
function instance(instanceId: string, definitionId: string, owner = 'p1', zone = 'hand'): any {
  return { instanceId, definitionId, ownerPlayerId: owner, controllerPlayerId: owner, zone, visibility: { scope: zone === 'hand' || zone === 'skill' ? 'owner_only' : 'public', ...(zone === 'hand' || zone === 'skill' ? { ownerPlayerId: owner } : {}) } };
}
function active(state: GameState, id: string): void {
  state.abilityRuntime!.cardState[id] = { active: true, faceDown: false, playedRound: state.round.roundNumber };
}
function authoringFiles(dir: string): string[] {
  return readdirSync(dir, { withFileTypes: true }).flatMap((entry) => {
    const full = join(dir, entry.name);
    return entry.isDirectory() ? authoringFiles(full) : entry.name.endsWith('.json') ? [full] : [];
  });
}

function setupAtalanta(): GameState {
  const pack = compiled('data/authoring/servants/servant.atalanta.json');
  pack.cards['servant.atalanta.attack.test'] = simpleAttack('servant.atalanta.attack.test', 'servant.atalanta', 2, 3);
  pack.cards['servant.other.attack.test'] = simpleAttack('servant.other.attack.test', 'servant.other', 2, 3);
  const state = createSeededGameState({ activeSeats: [1, 2] });
  state.round.activePhase = 'action'; state.round.prioritySeat = state.players[0]!.seat;
  state.players[0]!.mana = 20; state.players[0]!.locationId = BATTLEFIELD; state.players[1]!.locationId = BATTLEFIELD;
  state.cards = [
    instance('atalanta-s1-source', ATALANTA_S1, 'p1', 'attack_area'),
    instance('atalanta-s3-source', ATALANTA_S3, 'p1', 'attack_area'),
    instance('atalanta-attack', 'servant.atalanta.attack.test'),
    instance('other-attack', 'servant.other.attack.test'),
  ];
  rules.initializeAbilityRuntime(state, pack, { seed: 2301 });
  active(state, 'atalanta-s1-source'); active(state, 'atalanta-s3-source');
  return state;
}

function setupGorgon(zone = 'attack_area'): GameState {
  const pack = compiled('data/authoring/servants/servant.gorgon.json');
  pack.cards['fixture.other.attack'] = simpleAttack('fixture.other.attack', 'servant.gorgon', 1, 2);
  const state = createSeededGameState({ activeSeats: [1, 2, 3] });
  state.round.activePhase = 'action'; state.round.prioritySeat = state.players[0]!.seat;
  state.players[0]!.mana = 20;
  for (const p of state.players) p.locationId = BATTLEFIELD;
  state.cards = [instance('gorgon-source', GORGON_S2, 'p1', zone), instance('gorgon-other', 'fixture.other.attack')];
  rules.initializeAbilityRuntime(state, pack, { seed: 2302 });
  if (zone === 'attack_area') active(state, 'gorgon-source');
  return state;
}

function battleEvent(participants: string[]): AbilityEvent {
  const resultId = 'phase-b01:battle:shinto:1:result';
  const powers = Object.fromEntries(participants.map((id, index) => [id, 10 - index]));
  return {
    id: resultId, type: 'after_battle_result_determined', battlePhaseResolutionId: 'phase-b01',
    battleId: 'phase-b01:battle:shinto:1', resultId, battlefieldId: BATTLEFIELD,
    battleParticipantIds: participants, battleParticipantPowers: powers,
    battleResult: { winners: [participants[0]!], loserIds: participants.slice(1) },
  };
}

function setupMecha(): GameState {
  const pack = compiled('data/authoring/servants/servant.mechaeli.json');
  const state = createSeededGameState({ activeSeats: [1, 2] });
  for (const p of state.players) p.locationId = BATTLEFIELD;
  state.cards = [instance('mecha-s2-source', MECHA_S2, 'p1', 'attack_area')];
  rules.initializeAbilityRuntime(state, pack, { seed: 2303 });
  active(state, 'mecha-s2-source');
  return state;
}

describe('P3 F4 B01 batch-first passive/modifier migrations', () => {
  it('loads all three consumer archives with exact new identities and no loader blockers', () => {
    const atalanta = compiled('data/authoring/servants/servant.atalanta.json');
    const mecha = compiled('data/authoring/servants/servant.mechaeli.json');
    const gorgon = compiled('data/authoring/servants/servant.gorgon.json');
    const ibaraki = compiled('data/authoring/servants/servant.ibaraki.json');
    expect(atalanta.cards[ATALANTA_S1]).toBeDefined();
    expect(mecha.cards[MECHA_S2]).toBeDefined();
    expect(gorgon.cards[GORGON_S2]).toBeDefined();
    expect(ibaraki.cards[IBARAKI_S1]).toBeDefined();
    expect(rules.isAcceptedRoundActiveAttackPaidCostCombatPowerAbility(ibaraki.cards[IBARAKI_S1]!.abilities[0] as any, 'compiled')).toBe(true);
  });

  it('Atalanta S1 applies +4 only to other Atalanta attacks, adds printed base Power to mana cost, and forbids Independent Action while active', () => {
    const state = setupAtalanta();
    expect(rules.calculateCardPower(state, 'atalanta-attack').value).toBe(7);
    expect(rules.calculateCardPower(state, 'other-attack').value).toBe(3);
    expect(rules.getLegalActions(state, 'p1').some((action) => action.type === 'activate_ability' && action.cardInstanceId === 'atalanta-s3-source')).toBe(false);
    const manaBefore = state.players[0]!.mana;
    rules.playAbilityCardBatch(state, 'p1', [{ cardInstanceId: 'atalanta-attack' }]);
    expect(state.players[0]!.mana).toBe(manaBefore - 5);
    expect(state.cards.find((card) => card.instanceId === 'atalanta-attack')!.zone).toBe('attack_area');
  });

  it('Atalanta S1 source liveness removes the shared power/cost/skill-use restrictions', () => {
    const state = setupAtalanta();
    state.abilityRuntime!.cardState['atalanta-s1-source']!.active = false;
    expect(rules.calculateCardPower(state, 'atalanta-attack').value).toBe(3);
    expect(rules.getLegalActions(state, 'p1').some((action) => action.type === 'activate_ability' && action.cardInstanceId === 'atalanta-s3-source')).toBe(true);
    const manaBefore = state.players[0]!.mana;
    rules.playAbilityCardBatch(state, 'p1', [{ cardInstanceId: 'atalanta-attack' }]);
    expect(state.players[0]!.mana).toBe(manaBefore - 2);
  });

  it('Gorgon S2 can be played alone but atomically rejects a multi-card batch containing itself', () => {
    const solo = setupGorgon('skill');
    const beforeMana = solo.players[0]!.mana;
    rules.playAbilityCardBatch(solo, 'p1', [{ cardInstanceId: 'gorgon-source' }]);
    expect(solo.players[0]!.mana).toBe(beforeMana - 1);
    expect(solo.cards.find((card) => card.instanceId === 'gorgon-source')!.zone).toBe('attack_area');

    const batch = setupGorgon('skill');
    const before = structuredClone(batch);
    expect(() => rules.playAbilityCardBatch(batch, 'p1', [{ cardInstanceId: 'gorgon-source' }, { cardInstanceId: 'gorgon-other' }])).toThrow(/played alone/);
    expect(batch).toEqual(before);
  });

  it('Gorgon S2 ignores battle-loss effects only while the physical source is active', () => {
    const protectedState = setupGorgon();
    protectedState.round.activePhase = 'battle';
    const protectedResult = rules.resolveBattlefield(protectedState, {
      battlefieldId: BATTLEFIELD,
      participants: [{ playerId: 'p1', totalPower: 1 }, { playerId: 'p2', totalPower: 5 }],
    }).nextState.battleResults.at(-1)!;
    expect(protectedResult.militaryAdjustments.find((entry) => entry.playerId === 'p1')?.delta).toBe(0);
    expect(protectedResult.lossEffectSuppressedPlayerIds ?? []).toContain('p1');

    const normal = setupGorgon(); normal.abilityRuntime!.cardState['gorgon-source']!.active = false; normal.round.activePhase = 'battle';
    const normalResult = rules.resolveBattlefield(normal, {
      battlefieldId: BATTLEFIELD,
      participants: [{ playerId: 'p1', totalPower: 1 }, { playerId: 'p2', totalPower: 5 }],
    }).nextState.battleResults.at(-1)!;
    expect(normalResult.militaryAdjustments.find((entry) => entry.playerId === 'p1')?.delta).toBeLessThan(0);
  });

  it('Gorgon S2 closes only from an exact trusted crowded battle root with at least two opponents', () => {
    const crowded = setupGorgon();
    rules.processAbilityEvent(crowded, battleEvent(['p1', 'p2', 'p3']));
    expect(crowded.abilityRuntime!.cardState['gorgon-source']!.active).toBe(false);

    const duel = setupGorgon();
    rules.processAbilityEvent(duel, battleEvent(['p1', 'p2']));
    expect(duel.abilityRuntime!.cardState['gorgon-source']!.active).toBe(true);
  });

  it('Mecha Eli S2 consumes accepted FB2-54 entry and uncontested-win routes', () => {
    const state = setupMecha();
    expect(rules.calculateCardPower(state, 'mecha-s2-source').value).toBe(13);
    rules.processAuthoritativeEntryAbilityEvent(state, { id: 'b01-entry', type: 'after_controller_enters_location', playerId: 'p2', locationId: BATTLEFIELD });
    expect(rules.calculateCardPower(state, 'mecha-s2-source').value).toBe(15);
    const beforeVp = state.players[0]!.vp;
    const resultId = 'b01-solo-result';
    rules.processAbilityEvent(state, {
      id: resultId, type: 'after_battle_result_determined', battlePhaseResolutionId: 'b01-phase',
      battleId: 'b01-phase:battle:shinto:1', resultId, battlefieldId: BATTLEFIELD,
      battleParticipantIds: ['p1'], battleParticipantPowers: { p1: 15 }, battleResult: { winners: ['p1'], loserIds: [] },
    });
    expect(state.players[0]!.vp).toBe(beforeVp + 4);
  });

  it('keeps frozen IDs unique and raises material overlap by exactly the four B01 consumers', () => {
    const inventory = JSON.parse(readFileSync(resolve(ROOT, 'data/phase3/full-roster-ability-inventory.json'), 'utf8'));
    const frozen = new Set<string>([...inventory.staticSkills.map((x: any) => x.canonicalAbilityId), ...inventory.dynamicSkills.map((x: any) => x.canonicalAbilityId)]);
    const counts = new Map<string, number>();
    for (const file of authoringFiles(resolve(ROOT, 'data/authoring'))) {
      const archive = JSON.parse(readFileSync(file, 'utf8').replace(/^\uFEFF/, ''));
      for (const card of archive.cards ?? []) counts.set(card.id, (counts.get(card.id) ?? 0) + 1);
    }
    expect(frozen.size).toBe(944);
    expect([...counts.entries()].filter(([id, count]) => frozen.has(id) && count > 1)).toEqual([]);
    for (const id of [ATALANTA_S1, MECHA_S2, GORGON_S2, IBARAKI_S1]) expect(counts.get(id)).toBe(1);
    const overlap = [...frozen].filter((id) => counts.has(id)).length;
    expect(overlap).toBe(155);
  });
});
