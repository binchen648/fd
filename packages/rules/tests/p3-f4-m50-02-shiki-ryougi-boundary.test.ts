import { describe, expect, it } from 'vitest';

import * as rules from '../src/index';
import type { AuthoringCard } from '../src/ability/types';
import type { GameState } from '../src/schema/game';
import { createSeededGameState } from '../src/tools/seeded-state';

const ASC_DEF = 'master.fixture.ryougi.ascension';
const QUICK_DEF = 'fixture.ryougi.quick';
const OTHER_DEF = 'fixture.ryougi.other';
const SOURCE = 'ryougi-boundary-source';
const QUICK = 'ryougi-quick-attack';
const GRANT = 'ryougi-boundary-bottom-discard';

function granted(): any {
  return {
    id: GRANT,
    kind: 'phase_action',
    printedClause: 'Combat: discard the bottom card of a player in this fight.',
    activation: { phase: 'combat', opens: 'controller_combat_action_window', requiresSourceState: 'active' },
    conditions: [],
    targets: [{
      id: 'boundary_target', type: 'player', count: { min: 1, max: 1 },
      constraints: [
        { type: 'same_battlefield_as_controller' },
        { type: 'card_count_at_least', target: 'controller', zone: 'deck', value: 1 },
      ],
    }],
    cost: [], effects: [{ type: 'discard_bottom_card', target: 'boundary_target' }], creates: [], ruleModifiers: [],
    lifecycle: {}, responseWindow: {}, limit: { type: 'per_round', uses: 1, scope: 'this_card' }, visibility: {},
    execution: { mode: 'automatic', allowedOperations: [] },
  };
}

function boundaryAbility(): any {
  return {
    id: 'boundary-of-emptiness', kind: 'passive', printedClause: 'Agility +2 and granted bottom discard.',
    markers: ['m50_structured_v1'], activation: {}, conditions: [{ type: 'source_owned' }], targets: [], effects: [], cost: [], creates: [],
    ruleModifiers: [{
      id: 'ryougi-boundary-agility-power', operation: 'add', rule: 'card_power',
      scope: { subject: 'controller', cards: { attributesAny: ['迅捷'] } }, value: 2, lifecycle: { duration: 'permanent' },
    }],
    transforms: [{
      id: 'ryougi-boundary-agility-ability', type: 'card', target: { subject: 'controller', cards: { attributesAny: ['迅捷'] } },
      grantAbilities: [granted()], lifecycle: { duration: 'permanent' },
    }],
    lifecycle: {}, responseWindow: {}, limit: {}, visibility: {}, execution: { mode: 'automatic', allowedOperations: [] },
  };
}

function attack(id: string, attrs: string[]): AuthoringCard {
  return {
    id, name: id, cardType: 'basic_attack', cardFace: { cost: 0, basePower: 2, attributes: attrs },
    playTiming: { phase: 'action', window: 'controller_play_card_window' }, playRequirements: [], abilities: [], mode: 'automatic',
  };
}

function archive(ability = boundaryAbility()): any {
  return {
    schemaVersion: 'fd-card-authoring-v1', archiveType: 'master_skill_card_archive', id: 'master.fixture.ryougi', name: 'fixture', class: 'Master',
    cards: [{
      id: ASC_DEF, name: 'Boundary', cardType: 'master_skill', owner: { type: 'master', id: 'master.fixture.ryougi' },
      cardFace: { typeLabel: 'passive', cost: 0, basePower: 0, attributes: [] }, playTiming: { phase: 'action', window: 'controller_play_card_window' },
      playRequirements: [], abilities: [ability],
    }],
  };
}

function pack(): any {
  const loaded = rules.loadAuthoringJson(archive()); expect(loaded.report).toEqual([]);
  loaded.cards[QUICK_DEF] = attack(QUICK_DEF, ['迅捷']);
  loaded.cards[OTHER_DEF] = attack(OTHER_DEF, ['力量']);
  return loaded;
}

function setup(): GameState {
  const s = createSeededGameState({ activeSeats: [1, 2] });
  s.cards = [];
  s.players[0]!.locationId = 'miyama_town'; s.players[1]!.locationId = 'miyama_town';
  s.round.activePhase = 'battle'; s.round.prioritySeat = s.players[0]!.seat;
  rules.initializeAbilityRuntime(s, pack(), { seed: 20260924 });
  s.cards.push({ instanceId: SOURCE, definitionId: ASC_DEF, ownerPlayerId: 'p1', controllerPlayerId: 'p1', zone: 'skill', visibility: { scope: 'owner_only', ownerPlayerId: 'p1' } });
  s.cards.push({ instanceId: QUICK, definitionId: QUICK_DEF, ownerPlayerId: 'p1', controllerPlayerId: 'p1', zone: 'attack_area', visibility: { scope: 'public' } });
  s.abilityRuntime!.cardState[SOURCE] = { active: false, faceDown: false, playedRound: 0 };
  s.abilityRuntime!.cardState[QUICK] = { active: true, faceDown: false, playedRound: s.round.roundNumber };
  return s;
}

function addDeck(s: GameState, owner: string, id: string): void {
  s.cards.push({ instanceId: id, definitionId: OTHER_DEF, ownerPlayerId: owner, controllerPlayerId: owner, zone: 'deck', visibility: { scope: 'owner_only', ownerPlayerId: owner } });
}

function activate(s: GameState) {
  return rules.dispatchAbilityCommand(s, 'p1', { type: 'activate_ability', cardInstanceId: QUICK, abilityId: GRANT });
}

function choose(s: GameState, playerId: string) {
  const d = rules.projectAbilityState(s, 'p1').pendingDecision!;
  return rules.dispatchAbilityCommand(s, 'p1', { type: 'choose_target', decisionId: d.id, selectedIds: [playerId] });
}

describe('P3 F4 M50-02 Ryougi Boundary of Emptiness', () => {
  it('accepts only the exact source-owned Agility +2 transform/grant envelope', () => {
    const loaded = rules.loadAuthoringJson(archive()); expect(loaded.report).toEqual([]);
    expect(rules.isAcceptedM50GrantedCardAbilitySource(loaded.cards[ASC_DEF]!.abilities[0]!)).toBe(true);
    const widened = boundaryAbility(); widened.transforms[0].target.cards.attributesAny.push('力量');
    expect(rules.loadAuthoringJson(archive(widened)).report.length).toBeGreaterThan(0);
    const badGrant = boundaryAbility(); badGrant.transforms[0].grantAbilities[0].limit.uses = 2;
    expect(rules.loadAuthoringJson(archive(badGrant)).report.length).toBeGreaterThan(0);
  });

  it('adds +2 only to controller Agility attacks and grants the combat action only to matching active cards', () => {
    const s = setup();
    const other = 'other-attack';
    s.cards.push({ instanceId: other, definitionId: OTHER_DEF, ownerPlayerId: 'p1', controllerPlayerId: 'p1', zone: 'attack_area', visibility: { scope: 'public' } });
    s.abilityRuntime!.cardState[other] = { active: true, faceDown: false, playedRound: s.round.roundNumber };
    expect(rules.calculateCardPower(s, QUICK).value).toBe(4);
    expect(rules.calculateCardPower(s, other).value).toBe(2);
    addDeck(s, 'p2', 'p2-bottom');
    expect(rules.getLegalActions(s, 'p1')).toContainEqual(expect.objectContaining({ type: 'activate_ability', cardInstanceId: QUICK, abilityId: GRANT }));
    expect(rules.getLegalActions(s, 'p1')).not.toContainEqual(expect.objectContaining({ type: 'activate_ability', cardInstanceId: other, abilityId: GRANT }));
  });

  it('offers only same-battlefield players with a nonempty deck and discards the actual bottom card', () => {
    const s = setup();
    addDeck(s, 'p2', 'p2-top'); addDeck(s, 'p2', 'p2-bottom');
    const opened = activate(s);
    expect(opened).toMatchObject({ ok: true });
    expect(rules.projectAbilityState(s, 'p1').pendingDecision?.candidates).toEqual(['p2']);
    expect(choose(s, 'p2').ok).toBe(true);
    expect(s.cards.find((card) => card.instanceId === 'p2-bottom')!.zone).toBe('discard');
    expect(s.cards.find((card) => card.instanceId === 'p2-top')!.zone).toBe('deck');
    expect(activate(s).ok).toBe(false);
  });

  it('revalidates target liveness and deck state at settlement without consuming the once-per-round use', () => {
    const s = setup(); addDeck(s, 'p2', 'only-card');
    expect(activate(s).ok).toBe(true);
    s.cards.find((card) => card.instanceId === 'only-card')!.zone = 'discard';
    const before = structuredClone(s);
    expect(choose(s, 'p2').ok).toBe(false);
    expect(s).toEqual(before);
  });

  it('removes both the power aura and dynamic grant when the Ascension source is no longer owned/live', () => {
    const s = setup(); addDeck(s, 'p2', 'p2-bottom');
    s.cards.find((card) => card.instanceId === SOURCE)!.zone = 'removed_from_game';
    expect(rules.calculateCardPower(s, QUICK).value).toBe(2);
    expect(rules.getLegalActions(s, 'p1')).not.toContainEqual(expect.objectContaining({ type: 'activate_ability', cardInstanceId: QUICK, abilityId: GRANT }));
  });
});
