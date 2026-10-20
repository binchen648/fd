import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';
import * as rules from '../../src/index';
import type { GameState } from '../../src/schema/game';

const archive = JSON.parse(readFileSync('data/authoring/masters/master.sion.json', 'utf8'));
const inventory = JSON.parse(readFileSync('data/phase3/full-roster-ability-inventory.json', 'utf8'));
function setup(): { state: GameState; pack: ReturnType<typeof rules.loadAuthoringJson> } {
  const pack = rules.loadAuthoringJson(archive);
  const state = rules.createSeededGameState(); state.cards = [];
  state.players[0]!.masterCardId = 'master.sion'; state.players[0]!.locationId = 'shinto'; state.round.activePhase = 'action'; state.round.prioritySeat = state.players[0]!.seat;
  rules.initializeAbilityRuntime(state, pack, { seed: 20261020 });
  return { state, pack };
}
function add(state: GameState, definitionId: string, zone: string, active = true): string {
  const instanceId = `${definitionId}:${state.cards.length}`;
  state.cards.push({ instanceId, definitionId, ownerPlayerId: 'p1', controllerPlayerId: 'p1', zone, visibility: zone === 'field' || zone === 'attack_area' ? { scope: 'public' } : { scope: 'owner_only', ownerPlayerId: 'p1' } });
  state.abilityRuntime!.cardState[instanceId] = { active, faceDown: false, playedRound: state.round.roundNumber };
  return instanceId;
}

describe('P3 owner-complete master.sion', () => {
  it('preserves all 18 canonical printed texts, clause hashes, and has no loader blockers', () => {
    expect((archive.cards as Array<{ id: string }>).length).toBe(18);
    expect(packIds()).toEqual(new Set(inventory.staticSkills.filter((entry: any) => entry.ownerId === 'master.sion').map((entry: any) => entry.canonicalAbilityId)));
    const loaded = rules.loadAuthoringJson(archive);
    expect(loaded.report.filter((entry) => entry.status === 'unsupported')).toEqual([]);
    for (const row of inventory.staticSkills.filter((entry: any) => entry.ownerId === 'master.sion')) {
      const card = archive.cards.find((entry: any) => entry.id === row.canonicalAbilityId);
      expect(card?.printedText).toBe(row.printedText);
      expect(archive.sourcePolicy.sourceLocators.legacy[row.canonicalAbilityId]).toContain(`master/master.sion/${row.canonicalAbilityId.split('.').at(-1)}`);
      for (const clause of row.clauses) expect(archive.sourcePolicy.sourceLocators.generated[row.canonicalAbilityId]).toContain(clause.source.sha256);
    }
  });

  it('provisions New Chaldea skills only for the source owner and applies gym basic-power bonus', () => {
    const { state } = setup(); const source = add(state, 'master.sion.skill.ascension', 'skill', true);
    rules.processAbilityEvent(state, { id: 'sion-game-start', type: 'game_start' });
    expect(state.cards.filter((card) => card.ownerPlayerId === 'p1' && /^master\.sion\.skill\.s(?:5|6|7|8|10|11)$/.test(card.definitionId))).toHaveLength(6);
    const gym = add(state, 'master.sion.skill.s4', 'field', true);
    const basic = { id: 'fixture.sion.basic', name: 'basic', cardType: 'basic_attack', cardFace: { attributes: ['力量'], cost: 0, basePower: 2 }, playTiming: { phase: 'action', window: 'controller_play_card_window' }, playRequirements: [], abilities: [], mode: 'automatic' as const };
    state.abilityRuntime!.pack.cards[basic.id] = basic;
    const attack = add(state, basic.id, 'attack_area', true);
    expect(rules.calculateCardPower(state, attack).value).toBe(3);
    expect(source).toBeTruthy(); expect(gym).toBeTruthy();
  });

  it('enforces Avenger’s authoritative VP payment before replaying discard', () => {
    const { state } = setup(); const source = add(state, 'master.sion.skill.s13', 'field', true);
    state.players[0]!.vp = 1;
    expect(rules.dispatchAbilityCommand(state, 'p1', { type: 'activate_ability', cardInstanceId: source, abilityId: 'sion.s13.avenger' }).ok).toBe(false);
    const paid = setup(); const paidSource = add(paid.state, 'master.sion.skill.s13', 'field', true);
    paid.state.players[0]!.vp = 2;
    expect(rules.dispatchAbilityCommand(paid.state, 'p1', { type: 'activate_ability', cardInstanceId: paidSource, abilityId: 'sion.s13.avenger' }).ok).toBe(true);
    expect(paid.state.players[0]!.vp).toBe(0);
  });

  it('keeps Chaldea training and source execution owner/zone scoped', () => {
    const { state } = setup();
    const source = add(state, 'master.sion.skill.s1', 'field', true);
    const servantSkill = add(state, 'servant.fixture.skill', 'skill', true);
    const ability = state.abilityRuntime!.pack.cards['master.sion.skill.s1']!.abilities.find((candidate) => candidate.id === 'sion.s1.training')!;
    rules.executeAbility(state, { controllerId: 'p1', sourceCardId: source, abilityId: ability.id, variables: {}, selections: {} });
    expect(state.cards.filter((card) => card.definitionId.startsWith('master.sion.skill.s')).map((card) => card.definitionId)).toEqual(expect.arrayContaining([
      'master.sion.skill.s2', 'master.sion.skill.s3', 'master.sion.skill.s4',
    ]));
    expect(state.abilityRuntime!.sion?.covered[servantSkill]).toBeTruthy();

    const foreign = add(state, 'master.sion.skill.s13', 'field', true);
    const before = JSON.stringify(state);
    expect(() => rules.executeAbility(state, {
      controllerId: 'p2', sourceCardId: foreign, abilityId: 'sion.s13.avenger', variables: {}, selections: {},
    })).toThrow();
    expect(JSON.stringify(state)).toBe(before);
    const outOfZone = add(state, 'master.sion.skill.s13', 'hand', true);
    state.players[0]!.vp = 2;
    expect(() => rules.executeAbility(state, {
      controllerId: 'p1', sourceCardId: outOfZone, abilityId: 'sion.s13.avenger', variables: {}, selections: {},
    })).toThrow();
  });

  it('settles territory wins through battle events and removes concealment on loss', () => {
    const { state } = setup();
    state.players[0]!.locationId = 'magic_workshop';
    const territory = add(state, 'master.sion.skill.s9', 'field', true);
    const basic = { id: 'fixture.sion.basic.territory', name: 'basic', cardType: 'basic_attack', cardFace: { attributes: ['力量'], cost: 0, basePower: 2 }, playTiming: { phase: 'action', window: 'controller_play_card_window' }, playRequirements: [], abilities: [], mode: 'automatic' as const };
    state.abilityRuntime!.pack.cards[basic.id] = basic;
    const attack = add(state, basic.id, 'attack_area', true);
    expect(rules.calculateCardPower(state, attack).value).toBe(2);
    rules.processAbilityEvent(state, { id: 'sion-territory-win', type: 'after_controller_wins_battle', playerId: 'p1' });
    expect(rules.calculateCardPower(state, attack).value).toBe(3);

    const concealment = add(state, 'master.sion.skill.s10', 'field', true);
    rules.processAbilityEvent(state, { id: 'sion-concealment-loss', type: 'after_controller_loses_battle', playerId: 'p1' });
    expect(state.cards.find((card) => card.instanceId === concealment)?.zone).toBe('removed_from_game');
    expect(state.abilityRuntime!.cardState[concealment]?.active).toBe(false);
    expect(state.cards.find((card) => card.instanceId === territory)?.zone).toBe('field');
  });
});

function packIds(): Set<string> {
  return new Set((archive.cards as Array<{ id: string }>).map((entry) => entry.id));
}
