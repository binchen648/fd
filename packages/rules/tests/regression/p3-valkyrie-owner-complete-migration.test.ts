import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';
import * as rules from '../../src/index';
import { createSeededGameState } from '../../src/tools/seeded-state';
import type { GameState } from '../../src/schema/game';

const OWNER = 'servant.valkyrie';
const SC1 = `${OWNER}.skill.sc-valkyrie-1`;
const SC2 = `${OWNER}.skill.sc-valkyrie-2`;
const SC3 = `${OWNER}.skill.sc-valkyrie-3`;
const COMMANDERS = ['card.x-commanderortlinde', 'card.x-commanderhildr', 'card.x-commanderthrud'] as const;

function archive() { return JSON.parse(readFileSync('data/authoring/servants/servant.valkyrie.json', 'utf8')); }
function loadedPack() { return rules.loadAuthoringJson(archive()); }
function add(state: GameState, definitionId: string, instanceId: string, zone: string, active = false, faceDown = false) {
  state.cards.push({ instanceId, definitionId, ownerPlayerId: 'p1', controllerPlayerId: 'p1', zone,
    visibility: zone === 'attack_area' ? { scope: 'public' } : { scope: 'owner_only', ownerPlayerId: 'p1' } } as any);
  state.abilityRuntime!.cardState[instanceId] = { active, faceDown, playedRound: state.round.roundNumber };
  return instanceId;
}
function setup() {
  const loaded = loadedPack();
  const state = createSeededGameState({ activeSeats: [1, 2, 3] });
  state.cards = [];
  state.round.prioritySeat = 1;
  state.players[0]!.servantCardId = OWNER;
  state.players[0]!.mana = 12;
  rules.initializeAbilityRuntime(state, loaded, { seed: 20260930 });
  return { state, loaded };
}
function activate(state: GameState, source: string, abilityId: string) {
  const action = rules.getLegalActions(state, 'p1').find((entry) => entry.type === 'activate_ability' && entry.cardInstanceId === source && entry.abilityId === abilityId);
  expect(action).toBeDefined();
  const out = rules.dispatchAbilityCommand(state, 'p1', action!);
  expect(out, JSON.stringify(out)).toMatchObject({ ok: true });
}
function choose(state: GameState, selectedIds: string[]) {
  const pending = state.abilityRuntime!.pendingDecision;
  expect(pending).toBeDefined();
  const out = rules.dispatchAbilityCommand(state, 'p1', { type: 'choose_target', decisionId: pending!.id, selectedIds });
  expect(out, JSON.stringify(out)).toMatchObject({ ok: true });
}

describe('P3 Valkyrie owner-complete migration', () => {
  it('loads exactly three canonical skill cards plus the three zero-credit Commander dependencies and the frozen 12-card deck', () => {
    const raw = archive();
    const loaded = rules.loadAuthoringJson(raw);
    expect(loaded.report.filter((entry) => entry.status === 'unsupported')).toEqual([]);
    const skills = Object.values(loaded.cards).filter((card) => card.cardType === 'servant_skill');
    expect(skills.map((card) => card.id)).toEqual([SC1, SC2, SC3]);
    for (const id of [SC1, SC2, SC3]) {
      expect(loaded.cards[id]!.playRequirements).toEqual([{ type: 'skill_zone_mana_at_least', value: 8 }]);
      expect(loaded.cards[id]!.abilities.every((ability) => ability.execution.mode === 'automatic')).toBe(true);
    }
    for (const id of COMMANDERS) {
      expect(loaded.cards[id]!.cardType).toBe('servant_deck_card');
      expect(loaded.cards[id]!.abilities).toHaveLength(1);
      expect(loaded.cards[id]!.abilities[0]!.activation.trigger).toBe('on_card_played');
    }
    expect(raw.deck).toEqual([
      { cardId: 'card.cardb1' }, { cardId: 'card.cardb2' }, { cardId: 'card.cardq1', count: 2 }, { cardId: 'card.cardq3' },
      { cardId: COMMANDERS[0] }, { cardId: COMMANDERS[1] }, { cardId: COMMANDERS[2] },
      { cardId: 'card.carda1' }, { cardId: 'card.carda2' }, { cardId: 'card.cardluck', count: 2 },
    ]);
  });

  it('executes sc1 against the real Commander definitions with independent destinations and no card-play semantics', () => {
    const { state } = setup();
    const source = add(state, SC1, 'valkyrie-sc1', 'skill');
    const a = add(state, COMMANDERS[0], 'ortlinde', 'removed_from_game');
    const b = add(state, COMMANDERS[1], 'hildr', 'discard');
    const c = add(state, COMMANDERS[2], 'thrud', 'deck');
    state.round.activePhase = 'advance';
    activate(state, source, 'sc-valkyrie-1.maiden-descent');
    choose(state, [`${COMMANDERS[0]}::attack_area`, `${COMMANDERS[1]}::hand`, `${COMMANDERS[2]}::attack_area`]);
    expect(state.cards.find((x) => x.instanceId === a)!.zone).toBe('attack_area');
    expect(state.cards.find((x) => x.instanceId === b)!.zone).toBe('hand');
    expect(state.cards.find((x) => x.instanceId === c)!.zone).toBe('attack_area');
    expect(state.abilityRuntime!.cardState[a]!.active).toBe(true);
    expect(state.abilityRuntime!.cardState[b]!.active).toBe(false);
    expect(state.abilityRuntime!.cardPlayCountByInstance?.[a] ?? 0).toBe(0);
    expect(state.abilityRuntime!.cardPlayCountByInstance?.[c] ?? 0).toBe(0);
    expect(state.abilityRuntime!.ongoingEffects.filter((effect) => [a, c].includes(effect.sourceCardId))).toEqual([]);
  });

  it('executes both directed movement windows and Steel Shield through the accepted generic runtime', () => {
    const { state } = setup();
    const source = add(state, SC2, 'valkyrie-sc2', 'attack_area', true);
    state.players[0]!.locationId = state.map.locations.find((location) => location.movementLinks.length > 0)!.id;
    const next = state.map.locations.find((location) => location.id === state.players[0]!.locationId)!.movementLinks[0]!;
    state.round.activePhase = 'action';
    activate(state, source, 'sc-valkyrie-2.forward-action');
    expect(state.abilityRuntime!.pendingDecision!.candidates).toContain(next);
    choose(state, [next]);
    expect(state.players[0]!.locationId).toBe(next);
    state.round.activePhase = 'combat';
    expect(rules.getLegalActions(state, 'p1').some((entry) => entry.type === 'activate_ability' && entry.cardInstanceId === source && entry.abilityId === 'sc-valkyrie-2.forward-combat')).toBe(true);

    const physical = state.cards.find((card) => card.instanceId === source)!;
    physical.zone = 'skill'; physical.visibility = { scope: 'owner_only', ownerPlayerId: 'p1' };
    state.abilityRuntime!.cardState[source]!.active = false;
    const commander = add(state, COMMANDERS[1], 'hildr', 'attack_area', true);
    state.players[0]!.mana = 5;
    activate(state, source, 'sc-valkyrie-2.steel-shield');
    expect(state.abilityRuntime!.pendingDecision!.candidates).toEqual([commander]);
    choose(state, [commander]);
    expect(state.players[0]!.mana).toBe(3);
    expect(state.cards.find((card) => card.instanceId === commander)!.zone).toBe('hand');
    expect(state.cards.find((card) => card.instanceId === source)!.zone).toBe('attack_area');
    expect(state.abilityRuntime!.cardPlayCountByInstance?.[source] ?? 0).toBe(0);
  });

  it('executes sc3 against real Commander on-play Power effects without replaying cards or incrementing play counts', () => {
    const { state } = setup();
    const source = add(state, SC3, 'valkyrie-sc3', 'skill');
    const a = add(state, COMMANDERS[0], 'ortlinde', 'attack_area', true);
    const b = add(state, COMMANDERS[1], 'hildr', 'attack_area', true);
    const c = add(state, COMMANDERS[2], 'thrud', 'attack_area', true);
    state.abilityRuntime!.cardPlayCountByInstance = { [a]: 1, [b]: 2, [c]: 3 };
    state.round.activePhase = 'action';
    activate(state, source, 'false-gungnir-retrigger-commanders');
    const effects = state.abilityRuntime!.ongoingEffects.filter((effect) => [a, b, c].includes(effect.sourceCardId));
    expect(effects).toHaveLength(3);
    expect(effects.map((effect) => Number(effect.ruleModifiers[0]?.definition.value))).toEqual([2, 3, 6]);
    expect(state.abilityRuntime!.cardPlayCountByInstance).toMatchObject({ [a]: 1, [b]: 2, [c]: 3 });
    expect(state.cards.find((x) => x.instanceId === a)!.zone).toBe('attack_area');
    expect(state.cards.find((x) => x.instanceId === b)!.zone).toBe('attack_area');
    expect(state.cards.find((x) => x.instanceId === c)!.zone).toBe('attack_area');
    expect(state.abilityRuntime!.revealedServants).toContain('p1');
  });

  it('integrates Valkyrie immediately after Ushiwakamaru and keeps production generic runtime free of Valkyrie identity routing', () => {
    const manifest = JSON.parse(readFileSync('data/packs/fd-playtest-v1/pack.json', 'utf8'));
    const u = manifest.authoringServantFiles.indexOf('data/authoring/servants/servant.ushiwakamaru.json');
    expect(u).toBeGreaterThanOrEqual(0);
    expect(manifest.authoringServantFiles[u + 1]).toBe('data/authoring/servants/servant.valkyrie.json');
    const production = [
      'packages/rules/src/ability/commander-card-lifecycle-capability.ts',
      'packages/rules/src/ability/interpreter.ts',
      'packages/rules/src/ability/loader.ts',
    ].map((path) => readFileSync(path, 'utf8')).join('\n');
    for (const needle of ['servant.valkyrie', 'sc-valkyrie', '瓦尔基里', '终末幻想', '天鹅礼装', '伪·大神宣言', 'core.valkyrie']) expect(production).not.toContain(needle);
  });
});