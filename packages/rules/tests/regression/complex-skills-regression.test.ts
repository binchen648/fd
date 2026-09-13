import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';

import * as rules from '../../src/index';
import type { GameState } from '../../src/schema/game';
import { createSeededGameState } from '../../src/tools/seeded-state';

type Archive = {
  id: string;
  name: string;
  cards: Array<{
    id: string;
    name: string;
    cardType: string;
    abilities: Array<{ id: string; kind: string; effects?: Array<{ type?: string }> }>;
  }>;
};

type RegressionCase = {
  roleId: string;
  archivePath: string;
  abilityId: string;
  tier: 'strong' | 'entry' | 'directive';
  tags: Array<'payment' | 'target' | 'response' | 'battle_modifier' | 'resource' | 'directive' | 'visibility'>;
};

const servantCases: RegressionCase[] = [
  {
    roleId: 'servant.artoriac',
    archivePath: 'data/authoring/servants/servant.artoriac.json',
    abilityId: 'sc-artoriac-2.pay-x-look-x-plus-two',
    tier: 'strong',
    tags: ['payment', 'target', 'visibility'],
  },
  {
    roleId: 'servant.drake',
    archivePath: 'data/authoring/servants/servant.drake.json',
    abilityId: 'sc-drake-2.reward-and-move',
    tier: 'strong',
    tags: ['target', 'resource'],
  },
  {
    roleId: 'servant.achilles',
    archivePath: 'data/authoring/servants/servant.achilles.json',
    abilityId: 'sc-achilles-2.blue-sky',
    tier: 'strong',
    tags: ['target', 'battle_modifier'],
  },
  {
    roleId: 'servant.artoria-alt',
    archivePath: 'data/authoring/servants/servant.artoria-alt.json',
    abilityId: 'sc-artoria-alt-3.noble-bloom',
    tier: 'strong',
    tags: ['response', 'resource'],
  },
  {
    roleId: 'servant.ereshkigal',
    archivePath: 'data/authoring/servants/servant.ereshkigal.json',
    abilityId: 'sc-ereshkigal-2.netherworld-protection',
    tier: 'strong',
    tags: ['battle_modifier'],
  },
  {
    roleId: 'servant.tomoe',
    archivePath: 'data/authoring/servants/servant.tomoe.json',
    abilityId: 'sc-tomoe-2.inferno-fire',
    tier: 'strong',
    tags: ['battle_modifier'],
  },
  {
    roleId: 'servant.kintoki',
    archivePath: 'data/authoring/servants/servant.kintoki.json',
    abilityId: 'sc-kintoki-3.golden-eater',
    tier: 'strong',
    tags: ['target', 'resource'],
  },
];

const masterCases: RegressionCase[] = [
  {
    roleId: 'master.kayneth',
    archivePath: 'data/authoring/masters/master.kayneth.json',
    abilityId: 'alchemist.draw-volumen',
    tier: 'strong',
    tags: ['resource', 'directive'],
  },
  {
    roleId: 'master.shinji',
    archivePath: 'data/authoring/masters/master.shinji.json',
    abilityId: 'clown.lose-command-seal',
    tier: 'strong',
    tags: ['resource'],
  },
  {
    roleId: 'master.kiritsugu',
    archivePath: 'data/authoring/masters/master.kiritsugu.json',
    abilityId: 'time-alter.action',
    tier: 'entry',
    tags: ['target'],
  },
  {
    roleId: 'master.maiya',
    archivePath: 'data/authoring/masters/master.maiya.json',
    abilityId: 'military.attach-support-shot',
    tier: 'directive',
    tags: ['payment', 'directive'],
  },
  {
    roleId: 'master.gatou',
    archivePath: 'data/authoring/masters/master.gatou.json',
    abilityId: 'command-spell.gain-mana',
    tier: 'strong',
    tags: ['resource', 'directive'],
  },
  {
    roleId: 'master.irisviel',
    archivePath: 'data/authoring/masters/master.irisviel.json',
    abilityId: 'conversion-magic.preparation',
    tier: 'strong',
    tags: ['resource'],
  },
  {
    roleId: 'master.olga-marie',
    archivePath: 'data/authoring/masters/master.olga-marie.json',
    abilityId: 'chaldeas.swap-before-resolve',
    tier: 'directive',
    tags: ['directive'],
  },
];

const matrix = [...servantCases, ...masterCases];

const strongServantAbilityIds = [
  'sc-achilles-1.achilles-heel',
  'sc-achilles-1.gale-advance',
  'sc-achilles-2.blue-sky',
  'sc-achilles-3.hero-duel',
  'sc-artoria-alt-1.true-name-release',
  'sc-artoria-alt-1.ignore-situation-restrictions',
  'sc-artoria-alt-1.chain-of-wind-king',
  'sc-artoria-alt-2.low-mana-play-override',
  'sc-artoria-alt-2.angra-mainyu-embrace',
  'sc-artoria-alt-2.forbid-noble-phantasm-when-low-mana',
  'sc-artoria-alt-3.noble-bloom',
  'sc-artoria-alt-3.noble-bloom-extra-vp',
  'sc-artoria-alt-3.magic-resistance',
  'sc-artoriac-1.true-name-release',
  'sc-artoriac-1.residual-special-power-bonus',
  'sc-artoriac-1.return-current-round-attack',
  'sc-artoriac-2.pay-x-look-x-plus-two',
  'sc-artoriac-3.discard-public-and-power-formula',
  'sc-artoriac-3.conditional-true-name-release',
  'sc-artoriac-3.shuffle-discard-on-victory',
  'sc-artoriac-4.unique-passive-luck-on-win',
  'sc-artoriac-4.recon-gain-vp-and-move',
  'sc-artoriac-5.unique-passive-luck-on-win',
  'sc-artoriac-5.gain-mana-or-vp',
  'sc-artoriac-6.unique-passive-luck-on-win',
  'sc-artoriac-6.gain-vp-if-not-sole-winner',
  'sc-drake-1.draw',
  'sc-drake-1.mount-summon',
  'sc-drake-2.reveal',
  'sc-drake-2.reward-and-move',
  'sc-drake-3.reveal',
  'sc-drake-3.movement-power',
  'sc-drake-3.reverse-dash',
  'sc-drake-3.plunder',
  'sc-ereshkigal-1.battle-continuation',
  'sc-ereshkigal-2.netherworld-protection',
  'sc-ereshkigal-2.gain-mana-on-deploy',
  'sc-ereshkigal-2.self-exempt',
  'sc-ereshkigal-2.return-to-skill-zone',
  'sc-ereshkigal-3.true-name-release',
  'sc-ereshkigal-3.blooming-netherworld',
  'sc-kintoki-1.true-name-release',
  'sc-kintoki-1.ignore-skill-zone-mana-requirement',
  'sc-kintoki-1.ignore-situation-play-forbid',
  'sc-kintoki-1.once-per-game',
  'sc-kintoki-2.true-name-release',
  'sc-kintoki-2.ignore-skill-zone-mana-requirement',
  'sc-kintoki-2.ignore-situation-play-forbid',
  'sc-kintoki-2.once-per-game',
  'sc-kintoki-3.true-name-release',
  'sc-kintoki-3.golden-eater',
  'sc-tomoe-1.independent-action',
  'sc-tomoe-1.penalty-on-defeat',
  'sc-tomoe-2.inferno-fire',
  'sc-tomoe-2.double-terrain',
  'sc-tomoe-3.true-name-release',
  'sc-tomoe-3.rain-of-fire',
] as const;

const strongMasterAbilityIds = [
  // Kayneth (6)
  'double-master.passive',
  'alchemist.setup',
  'alchemist.draw-volumen',
  'pride.must-deploy',
  'volumen.extra-play',
  'volumen.slash',
  // Shinji (4)
  'drain-command.enter-miyama',
  'useless-person.setup',
  'clown.lose-command-seal',
  'false-attendant-book.first-empty-seals',
  // Kiritsugu (4)
  'magus-killer.setup',
  'time-alter.action',
  'square-accel.combat',
  'origin-bullet.cut-bind',
  // Maiya (4)
  'military.has-support-shot',
  'military.attach-support-shot',
  'support-shot.append-only',
  'support-shot.suppress',
  // Gatou (5)
  'seeker.battle-end-reward',
  'seeker.meditation',
  'command-spell.gain-mana',
  'command-spell.power-victory',
  'command-spell.free-move',
  // Irisviel (2)
  'proxy-master.command-spell-timing',
  'conversion-magic.preparation',
  // Olga-Marie (6, command-spell abilities shared with Gatou)
  'astronomical-science.has-chaldeas',
  'astronomical-science.first-loss',
  'chaldeas.peek-bottoms',
  'chaldeas.swap-before-resolve',
  'trismegistus.soul-drag',
  'trismegistus.loss-transform',
  'trismegistus.return-silence',
] as const;

function archive(path: string): Archive {
  return JSON.parse(readFileSync(path, 'utf8')) as Archive;
}

function setup(raw: Archive, options: { phase?: GameState['round']['activePhase']; servantId?: string; masterId?: string } = {}) {
  const state = createSeededGameState();
  state.cards = [];
  state.round.activePhase = options.phase ?? 'action';
  state.round.prioritySeat = 1;
  state.players[0]!.mana = 12;
  state.players[0]!.locationId = 'recon';
  if (options.servantId) state.players[0]!.servantCardId = options.servantId;
  if (options.masterId) state.players[0]!.masterCardId = options.masterId;
  (state.players[0] as unknown as { commandSpells: number }).commandSpells = 3;
  rules.initializeAbilityRuntime(state, rules.loadAuthoringJson(raw), { seed: 42 });
  return state;
}

function add(state: GameState, definitionId: string, zone = 'skill', owner = 'p1') {
  const instanceId = `case-card-${state.cards.length}`;
  state.cards.push({
    instanceId,
    definitionId,
    ownerPlayerId: owner,
    controllerPlayerId: owner,
    zone,
    visibility: { scope: 'owner_only', ownerPlayerId: owner },
  });
  return instanceId;
}

function play(state: GameState, cardInstanceId: string) {
  return rules.dispatchAbilityCommand(state, 'p1', { type: 'play_card', cardInstanceId });
}

function playFor(state: GameState, playerId: string, cardInstanceId: string, faceDown = false) {
  return rules.dispatchAbilityCommand(state, playerId, { type: 'play_card', cardInstanceId, ...(faceDown ? { faceDown } : {}) });
}

function activate(state: GameState, cardInstanceId: string, abilityId: string, variables: Record<string, number> = {}) {
  return rules.dispatchAbilityCommand(state, 'p1', {
    type: 'activate_ability',
    cardInstanceId,
    abilityId,
    ...(Object.keys(variables).length ? { variables } : {}),
  });
}

function activateFor(state: GameState, playerId: string, cardInstanceId: string, abilityId: string, variables: Record<string, number> = {}) {
  return rules.dispatchAbilityCommand(state, playerId, {
    type: 'activate_ability',
    cardInstanceId,
    abilityId,
    ...(Object.keys(variables).length ? { variables } : {}),
  });
}

function modeDirectives(state: GameState): Array<Record<string, unknown>> {
  return ((state as unknown as { modeState?: { masterDirectives?: Array<Record<string, unknown>> } }).modeState?.masterDirectives) ?? [];
}

function expectDirective(
  state: GameState,
  directive: string,
  expected: Record<string, unknown> = {},
) {
  expect(modeDirectives(state)).toContainEqual(expect.objectContaining({ directive, ...expected }));
}

function markActive(state: GameState, cardInstanceId: string, faceDown = false) {
  state.abilityRuntime!.cardState[cardInstanceId] = { active: true, faceDown, playedRound: state.round.roundNumber };
}

function commandSpells(state: GameState, playerIndex = 0) {
  return (state.players[playerIndex] as unknown as { commandSpells: number }).commandSpells;
}

function installPlayForbid(state: GameState, rule: 'situation_restrictions' | 'situation_play_forbid') {
  const sourceCardId = add(state, `fixture.${rule}.source`, 'field');
  state.abilityRuntime!.cardState[sourceCardId] = { active: true, faceDown: false, playedRound: state.round.roundNumber };
  state.abilityRuntime!.ongoingEffects.push({
    id: `fixture:${rule}`,
    sourceCardId,
    abilityId: `fixture.${rule}.ability`,
    controllerId: 'p1',
    starts: 'immediate',
    duration: 'this_round',
    startRound: state.round.roundNumber,
    expiresAtRound: state.round.roundNumber + 1,
    cleanup: 'expire_after_duration',
    ruleModifiers: [{
      sourceCardId,
      controllerId: 'p1',
      definition: { operation: 'forbid', rule, scope: { object: 'all_players' } },
    }],
    publicZones: [],
  });
}

describe('complex skills regression matrix', () => {
  it('covers the confirmed seven servants and seven masters with existing ability ids', () => {
    expect(servantCases.map((entry) => entry.roleId).sort()).toEqual([
      'servant.achilles',
      'servant.artoria-alt',
      'servant.artoriac',
      'servant.drake',
      'servant.ereshkigal',
      'servant.kintoki',
      'servant.tomoe',
    ]);
    expect(masterCases.map((entry) => entry.roleId).sort()).toEqual([
      'master.gatou',
      'master.irisviel',
      'master.kayneth',
      'master.kiritsugu',
      'master.maiya',
      'master.olga-marie',
      'master.shinji',
    ]);
    expect(matrix.filter((entry) => entry.tier === 'strong').length).toBeGreaterThanOrEqual(11);
    expect(new Set(matrix.flatMap((entry) => entry.tags))).toEqual(new Set([
      'payment',
      'target',
      'response',
      'battle_modifier',
      'resource',
      'directive',
      'visibility',
    ]));

    for (const entry of matrix) {
      const raw = archive(entry.archivePath);
      expect(raw.id).toBe(entry.roleId);
      expect(raw.cards.flatMap((card) => card.abilities).map((ability) => ability.id)).toContain(entry.abilityId);
    }
  });

  it('keeps the seven-servant strong assertion manifest aligned with authoring ability ids', () => {
    const authoredIds = servantCases
      .flatMap((entry) => archive(entry.archivePath).cards)
      .flatMap((card) => card.abilities)
      .map((ability) => ability.id)
      .sort();

    expect([...strongServantAbilityIds].sort()).toEqual(authoredIds);
    expect(new Set(strongServantAbilityIds).size).toBe(strongServantAbilityIds.length);
  });

  it('keeps the seven-master strong assertion manifest aligned with authoring ability ids', () => {
    const masterArchives = [
      'data/authoring/masters/master.kayneth.json',
      'data/authoring/masters/master.shinji.json',
      'data/authoring/masters/master.kiritsugu.json',
      'data/authoring/masters/master.maiya.json',
      'data/authoring/masters/master.gatou.json',
      'data/authoring/masters/master.irisviel.json',
      'data/authoring/masters/master.olga-marie.json',
    ];
    const authoredIds = [...new Set(
      masterArchives
        .flatMap((path) => archive(path).cards)
        .flatMap((card) => card.abilities)
        .map((ability) => ability.id)
    )].sort();

    expect([...strongMasterAbilityIds].sort()).toEqual(authoredIds);
    expect(new Set(strongMasterAbilityIds).size).toBe(strongMasterAbilityIds.length);
  });
});

describe('complex servant skill regressions', () => {
  it('keeps Artoria Caster staff X payment, target min/max, and private looked-card flow on dispatch', () => {
    const raw = archive('data/authoring/servants/servant.artoriac.json');
    const state = setup(raw, { servantId: raw.id });
    const staff = add(state, 'servant.artoriac.skill.sc-artoriac-2', 'skill');
    for (let index = 0; index < 6; index++) add(state, `fixture.secret-${index}`, 'deck');

    expect(play(state, staff).ok).toBe(true);
    const action = rules.getLegalActions(state, 'p1').find((candidate) =>
      candidate.type === 'activate_ability' &&
      candidate.cardInstanceId === staff &&
      candidate.abilityId === 'sc-artoriac-2.pay-x-look-x-plus-two');
    expect(action).toMatchObject({
      type: 'activate_ability',
      variableCosts: [{ name: 'X', min: 0, max: 9 }],
    });

    expect(activate(state, staff, 'sc-artoriac-2.pay-x-look-x-plus-two', { X: 2 }).ok).toBe(true);
    const ownerView = rules.projectAbilityState(state, 'p1');
    const otherView = rules.projectAbilityState(state, 'p2');
    expect(ownerView.pendingDecision).toMatchObject({ min: 0, max: 1 });
    expect(ownerView.pendingDecision!.candidates).toHaveLength(4);
    expect(JSON.stringify(otherView)).not.toContain('fixture.secret-');
    expect(otherView.waitingLabel).toBe('等待响应结算');

    const decision = ownerView.pendingDecision!;
    expect(rules.dispatchAbilityCommand(state, 'p1', {
      type: 'choose_target',
      decisionId: decision.id,
      selectedIds: decision.candidates.slice(0, 1),
    }).ok).toBe(true);
    expect(state.players[0]!.mana).toBe(7);
    expect(state.cards.filter((card) => card.zone === 'looked_cards')).toHaveLength(0);
  });

  it('keeps Drake reward movement as a backend location target decision', () => {
    const raw = archive('data/authoring/servants/servant.drake.json');
    const state = setup(raw, { servantId: raw.id });
    const goldenHind = add(state, 'servant.drake.skill.sc-drake-2', 'skill');
    state.players[0]!.locationId = 'miyama_town';
    for (const player of state.players.slice(1)) player.locationId = 'magic_workshop';
    state.eventPlacements = [
      { locationId: 'miyama_town', eventCardId: 'event-a', victoryPoints: 2, visibility: { scope: 'public' } },
    ];

    expect(play(state, goldenHind).ok).toBe(true);
    rules.advanceAbilityPhase(state, 'battle');
    expect(activate(state, goldenHind, 'sc-drake-2.reward-and-move').ok).toBe(true);

    const decision = rules.projectAbilityState(state, 'p1').pendingDecision!;
    expect(decision).toMatchObject({ min: 1, max: 1 });
    expect(decision.candidates).toEqual(expect.arrayContaining(['shinto', 'recon']));
    expect(decision.candidates).not.toContain('miyama_town');

    expect(rules.dispatchAbilityCommand(state, 'p1', {
      type: 'choose_target',
      decisionId: decision.id,
      selectedIds: ['shinto'],
    }).ok).toBe(true);
    expect(state.players[0]!.vp).toBe(2);
    expect(state.players[0]!.locationId).toBe('shinto');
    expect(state.eventDiscardPile?.map((event) => event.eventCardId)).toEqual(['event-a']);
  });

  it('keeps Artoria Caster pilgrim cards in one unique response window with hidden choices for others', () => {
    const raw = archive('data/authoring/servants/servant.artoriac.json');
    const state = setup(raw, { servantId: raw.id });
    add(state, 'servant.artoriac.skill.sc-artoriac-4', 'hand');
    add(state, 'servant.artoriac.skill.sc-artoriac-5', 'hand');
    add(state, 'servant.artoriac.skill.sc-artoriac-6', 'hand');

    rules.advanceAbilityPhase(state, 'battle');
    rules.processAbilityEvent(state, {
      id: 'complex-regression-win',
      type: 'after_controller_wins_battle',
      playerId: 'p1',
      battleResult: { winners: ['p1'], loserIds: ['p2'] },
    });

    const ownerActions = rules.getLegalActions(state, 'p1').filter((action) => action.type === 'resolve_response');
    const ownerView = rules.projectAbilityState(state, 'p1');
    const otherView = rules.projectAbilityState(state, 'p2');
    expect(ownerActions).toHaveLength(3);
    expect(ownerActions.map((action) => action.type === 'resolve_response' ? action.abilityId : '')).toEqual([
      'sc-artoriac-4.unique-passive-luck-on-win',
      'sc-artoriac-5.unique-passive-luck-on-win',
      'sc-artoriac-6.unique-passive-luck-on-win',
    ]);
    expect(ownerView.responseWindow).toMatchObject({ kind: 'choose_unique_trigger' });
    expect(otherView.legalActions).toEqual([]);
    expect(otherView.responseWindow).toBeUndefined();
    expect(otherView.waitingLabel).toBe('等待响应结算');

    expect(rules.dispatchAbilityCommand(state, 'p1', ownerActions[0]!).ok).toBe(true);
    expect(rules.getLegalActions(state, 'p1').filter((action) => action.type === 'resolve_response')).toHaveLength(0);
    expect(state.cards.filter((card) => card.zone === 'removed_from_game')).toHaveLength(1);
  });

  it('keeps Artoria Caster sword, star, recon, respite, and destiny branches fully automatic', () => {
    const raw = archive('data/authoring/servants/servant.artoriac.json');
    const state = setup(raw, { servantId: raw.id });
    const sword = add(state, 'servant.artoriac.skill.sc-artoriac-1', 'skill');
    const staff = add(state, 'servant.artoriac.skill.sc-artoriac-2', 'skill');
    const star = add(state, 'servant.artoriac.skill.sc-artoriac-3', 'skill');
    const specialAttack = add(state, 'servant.artoriac.skill.sc-artoriac-4', 'hand');
    const summon = add(state, 'servant.artoriac.skill.sc-artoriac-4', 'skill');
    const respite = add(state, 'servant.artoriac.skill.sc-artoriac-5', 'skill');
    const destiny = add(state, 'servant.artoriac.skill.sc-artoriac-6', 'skill');

    expect(play(state, sword).ok).toBe(true);
    expect(rules.projectAbilityState(state, 'p2').players[0]!.servantPackage?.id).toBe('servant.artoriac');
    expect(play(state, specialAttack).ok).toBe(true);
    expect(rules.calculateCardPower(state, specialAttack).value).toBe(6);
    rules.advanceAbilityPhase(state, 'battle');
    expect(activate(state, sword, 'sc-artoriac-1.return-current-round-attack').ok).toBe(true);
    let decision = rules.projectAbilityState(state, 'p1').pendingDecision!;
    expect(decision.candidates).toContain(specialAttack);
    expect(rules.dispatchAbilityCommand(state, 'p1', {
      type: 'choose_target',
      decisionId: decision.id,
      selectedIds: [specialAttack],
    }).ok).toBe(true);
    expect(state.cards.find((card) => card.instanceId === specialAttack)!.zone).toBe('hand');

    rules.advanceAbilityPhase(state, 'action', 2);
    state.round.prioritySeat = 1;
    state.players[0]!.mana = 12;
    expect(play(state, staff).ok).toBe(true);
    expect(play(state, star).ok).toBe(true);
    add(state, 'card.luck', 'discard');
    add(state, 'card.luck', 'discard');
    rules.processAbilityEvent(state, { id: 'caster-formula-check', type: 'resources_changed', playerId: 'p1' });
    expect(rules.calculateCardPower(state, star).value).toBe(10);
    expect(rules.projectAbilityState(state, 'p2').players[0]!.servantPackage?.id).toBe('servant.artoriac');

    rules.advanceAbilityPhase(state, 'action', 3);
    state.round.prioritySeat = 1;
    expect(play(state, summon).ok).toBe(true);
    expect(activate(state, summon, 'sc-artoriac-4.recon-gain-vp-and-move').ok).toBe(true);
    decision = rules.projectAbilityState(state, 'p1').pendingDecision!;
    expect(decision).toMatchObject({ min: 0, max: 1 });
    expect(rules.dispatchAbilityCommand(state, 'p1', {
      type: 'choose_target',
      decisionId: decision.id,
      selectedIds: decision.candidates.slice(0, 1),
    }).ok).toBe(true);
    expect(state.players[0]!.vp).toBe(2);

    state.players[0]!.mana = 12;
    expect(play(state, respite).ok).toBe(true);
    expect(activate(state, respite, 'sc-artoriac-5.gain-mana-or-vp').ok).toBe(true);
    expect(state.players[0]!.vp).toBe(4);

    rules.advanceAbilityPhase(state, 'action', 4);
    state.round.prioritySeat = 1;
    expect(play(state, destiny).ok).toBe(true);
    rules.advanceAbilityPhase(state, 'battle');
    rules.processAbilityEvent(state, {
      id: 'caster-shared-win',
      type: 'after_battle_result_determined',
      playerId: 'p1',
      battleResult: { winners: ['p1', 'p2'], loserIds: ['p3'] },
    });
    expect(state.players[0]!.vp).toBe(6);
  });

  it('keeps Artoria Caster victory shuffle unpreventable and idempotent', () => {
    const raw = archive('data/authoring/servants/servant.artoriac.json');
    const state = setup(raw, { servantId: raw.id });
    const star = add(state, 'servant.artoriac.skill.sc-artoriac-3', 'skill');
    const luck = add(state, 'card.luck', 'discard');

    expect(play(state, star).ok).toBe(true);
    state.abilityRuntime!.preventEffects = true;
    const event = { id: 'caster-victory-shuffle', type: 'after_controller_gains_victory', playerId: 'p1' };
    rules.processAbilityEvent(state, event);
    expect(state.cards.find((card) => card.instanceId === luck)!.zone).toBe('deck');
    expect(state.abilityRuntime!.events.some((entry) => entry.type === 'effect_resolved' && entry.unpreventable)).toBe(true);
    const before = JSON.stringify(state);
    rules.processAbilityEvent(state, event);
    expect(JSON.stringify(state)).toBe(before);
  });

  it('keeps Achilles hidden-name combat action discarding an engaged opponent hand card', () => {
    const raw = archive('data/authoring/servants/servant.achilles.json');
    const state = setup(raw, { servantId: raw.id });
    const heel = add(state, 'servant.achilles.skill.sc-achilles-1', 'skill');
    const opponentHand = add(state, 'fixture.opponent-secret', 'hand', 'p2');
    state.players[0]!.locationId = 'miyama_town';
    state.players[1]!.locationId = 'miyama_town';

    expect(play(state, heel).ok).toBe(true);
    rules.advanceAbilityPhase(state, 'battle');
    expect(activate(state, heel, 'sc-achilles-1.gale-advance').ok).toBe(true);

    expect(state.cards.find((card) => card.instanceId === opponentHand)).toMatchObject({
      zone: 'discard',
      visibility: { scope: 'public' },
    });
    expect(rules.projectAbilityState(state, 'p2').players[0]!.servantPackage).toBeUndefined();
  });

  it('keeps Achilles Blue Sky choice as a backend choice window with mana-paid hide branch', () => {
    const raw = archive('data/authoring/servants/servant.achilles.json');
    const state = setup(raw, { servantId: raw.id });
    const blueSky = add(state, 'servant.achilles.skill.sc-achilles-2', 'skill');

    expect(play(state, blueSky).ok).toBe(true);
    expect(activate(state, blueSky, 'sc-achilles-2.blue-sky').ok).toBe(true);
    const decision = rules.projectAbilityState(state, 'p1').pendingDecision!;
    expect(decision).toMatchObject({ min: 1, max: 1 });
    expect(decision.candidates).toEqual(['discard_hand', 'forbid_skills', 'hide_true_name']);

    state.abilityRuntime!.revealedServants.push('p1');
    expect(rules.dispatchAbilityCommand(state, 'p1', {
      type: 'choose_target',
      decisionId: decision.id,
      selectedIds: ['hide_true_name'],
    }).ok).toBe(true);
    expect(state.players[0]!.mana).toBe(6);
    expect(state.abilityRuntime!.revealedServants).not.toContain('p1');
  });

  it('keeps Achilles defeat reveal and hero duel movement lock plus terrain immunity', () => {
    const raw = archive('data/authoring/servants/servant.achilles.json');
    const state = setup(raw, { servantId: raw.id });
    const heel = add(state, 'servant.achilles.skill.sc-achilles-1', 'skill');
    const duel = add(state, 'servant.achilles.skill.sc-achilles-3', 'skill');
    state.players[0]!.locationId = 'miyama_town';
    state.players[1]!.locationId = 'miyama_town';
    state.map.locations.find((location) => location.id === 'miyama_town')!.terrainBonuses = [3];

    rules.processAbilityEvent(state, {
      id: 'achilles-loss',
      type: 'after_controller_loses_battle',
      playerId: 'p1',
      battleResult: { winners: ['p2'], loserIds: ['p1'] },
    });
    expect(state.abilityRuntime!.revealedServants).toContain('p1');

    expect(play(state, duel).ok).toBe(true);
    expect(activate(state, duel, 'sc-achilles-3.hero-duel').ok).toBe(true);
    expect(state.abilityRuntime!.ongoingEffects.some((effect) =>
      effect.ruleModifiers.some((modifier) => modifier.definition.rule === 'enter_or_leave_current_battlefield'))).toBe(true);

    const battle = rules.resolveBattlefield(state, {
      battlefieldId: 'miyama_town',
      participants: [
        { playerId: 'p1', totalPower: 1, attackTags: ['特殊'], terrainSlotIndex: 0 },
        { playerId: 'p2', totalPower: 2, attackTags: ['特殊'], terrainSlotIndex: 0 },
      ],
    }).nextState.battleResults.at(-1)!;
    expect(battle.participantBreakdowns.flatMap((participant) => participant.modifiers).some((modifier) => modifier.source === 'location')).toBe(false);
  });

  it('keeps Artoria Alter fixed payment, created power modifier, and low-mana play override executable', () => {
    const raw = archive('data/authoring/servants/servant.artoria-alt.json');
    const state = setup(raw, { servantId: raw.id });
    const sword = add(state, 'servant.artoria-alt.skill.sc-artoria-alt-1', 'skill');
    const curse = add(state, 'servant.artoria-alt.skill.sc-artoria-alt-2', 'skill');

    expect(play(state, sword).ok).toBe(true);
    expect(rules.projectAbilityState(state, 'p2').players[0]!.servantPackage?.id).toBe('servant.artoria-alt');
    expect(activate(state, sword, 'sc-artoria-alt-1.chain-of-wind-king').ok).toBe(true);
    expect(state.players[0]!.mana).toBe(6);
    expect(rules.calculateCardPower(state, sword).value).toBe(9);

    state.players[0]!.mana = 4;
    expect(play(state, curse).ok).toBe(true);
    expect(state.cards.find((card) => card.instanceId === curse)!.zone).toBe('attack_area');
    expect(raw.cards.flatMap((card) => card.abilities).map((ability) => ability.id)).toEqual(expect.arrayContaining([
      'sc-artoria-alt-2.low-mana-play-override',
      'sc-artoria-alt-2.angra-mainyu-embrace',
    ]));
    const noble = add(state, 'servant.artoria-alt.skill.sc-artoria-alt-3', 'skill');
    state.players[0]!.mana = 12;
    rules.advanceAbilityPhase(state, 'action', 2);
    expect(play(state, noble).ok).toBe(true);
    expect(state.cards.find((card) => card.instanceId === curse)!.zone).toBe('attack_area');
  });

  it('keeps Artoria Alter situation restriction exception scoped to Excalibur Morgan', () => {
    const raw = archive('data/authoring/servants/servant.artoria-alt.json');
    const state = setup(raw, { servantId: raw.id });
    const sword = add(state, 'servant.artoria-alt.skill.sc-artoria-alt-1', 'skill');
    const resistance = add(state, 'servant.artoria-alt.skill.sc-artoria-alt-3', 'skill');
    installPlayForbid(state, 'situation_restrictions');

    expect(play(state, sword).ok).toBe(true);
    expect(play(state, resistance).rejection?.code).toBe('play_forbidden');
    expect(raw.cards.flatMap((card) => card.abilities).map((ability) => ability.id)).toContain('sc-artoria-alt-1.ignore-situation-restrictions');
  });

  it('keeps Artoria Alter optional noble bloom responses granting VP from tracked noble phantasm cost', () => {
    const raw = archive('data/authoring/servants/servant.artoria-alt.json');
    const state = setup(raw, { servantId: raw.id, phase: 'battle' });
    const resistance = add(state, 'servant.artoria-alt.skill.sc-artoria-alt-3', 'skill');
    state.abilityRuntime!.noblePhantasmCostsThisRound.p1 = [{ cardId: resistance, cost: 4 }];

    rules.processAbilityEvent(state, {
      id: 'alter-noble-bloom',
      type: 'after_battle_result_determined',
      playerId: 'p1',
      battleResult: { winners: ['p1'], loserIds: ['p2'] },
    });

    let action = rules.getLegalActions(state, 'p1').find((candidate) =>
      candidate.type === 'resolve_response' &&
      candidate.abilityId === 'sc-artoria-alt-3.noble-bloom');
    expect(action).toBeTruthy();
    expect(rules.dispatchAbilityCommand(state, 'p1', action!).ok).toBe(true);

    action = rules.getLegalActions(state, 'p1').find((candidate) =>
      candidate.type === 'resolve_response' &&
      candidate.abilityId === 'sc-artoria-alt-3.noble-bloom-extra-vp');
    expect(action).toBeTruthy();
    expect(rules.dispatchAbilityCommand(state, 'p1', action!).ok).toBe(true);
    expect(state.players[0]!.vp).toBe(2);
  });

  it('keeps Artoria Alter magic resistance and low-mana noble phantasm forbid automatic', () => {
    const raw = archive('data/authoring/servants/servant.artoria-alt.json');
    raw.cards.push({
      id: 'fixture.magic-attack',
      name: '魔术攻击',
      cardType: 'basic_attack',
      cardFace: { cost: 0, basePower: 5, attributes: ['魔术'] },
      playTiming: { phase: 'action', window: 'controller_play_card_window' },
      abilities: [],
    } as never);
    const state = setup(raw, { servantId: raw.id });
    const curse = add(state, 'servant.artoria-alt.skill.sc-artoria-alt-2', 'skill');
    const resistance = add(state, 'servant.artoria-alt.skill.sc-artoria-alt-3', 'skill');
    const opponentMagic = add(state, 'fixture.magic-attack', 'field', 'p2');
    state.abilityRuntime!.cardState[opponentMagic] = { active: true, faceDown: false, playedRound: 1 };
    state.players[0]!.locationId = 'miyama_town';
    state.players[1]!.locationId = 'miyama_town';

    expect(play(state, resistance).ok).toBe(true);
    rules.advanceAbilityPhase(state, 'battle');
    expect(activate(state, resistance, 'sc-artoria-alt-3.magic-resistance').ok).toBe(true);
    expect(rules.calculateCardPower(state, opponentMagic).value).toBe(0);

    state.round.activePhase = 'action';
    state.round.prioritySeat = 1;
    state.players[0]!.mana = 4;
    expect(play(state, curse).ok).toBe(true);
    expect(state.cards.find((card) => card.instanceId === curse)!.zone).toBe('attack_area');
    rules.processAbilityEvent(state, { id: 'alter-while-active', type: 'while_active', playerId: 'p1' });
    expect(raw.cards.flatMap((card) => card.abilities).map((ability) => ability.id)).toContain('sc-artoria-alt-2.forbid-noble-phantasm-when-low-mana');
    state.round.prioritySeat = 2;
    expect(rules.getLegalActions(state, 'p2').some((action) =>
      action.type === 'play_card' && action.cardInstanceId === opponentMagic)).toBe(false);
  });

  it('keeps Drake Riding draw and mount summon target selection on backend dispatch', () => {
    const raw = archive('data/authoring/servants/servant.drake.json');
    raw.cards.push(
      {
        id: 'fixture.basic-2',
        name: '基础攻击2',
        cardType: 'basic_attack',
        cardFace: { cost: 2, basePower: 2 },
        playTiming: { phase: 'action', window: 'controller_play_card_window' },
        abilities: [],
      } as never,
      {
        id: 'fixture.basic-5',
        name: '基础攻击5',
        cardType: 'basic_attack',
        cardFace: { cost: 5, basePower: 5 },
        playTiming: { phase: 'action', window: 'controller_play_card_window' },
        abilities: [],
      } as never,
    );
    const state = setup(raw, { servantId: raw.id });
    const riding = add(state, 'servant.drake.skill.sc-drake-1', 'skill');
    const lowPower = add(state, 'fixture.basic-2', 'hand');
    const highPower = add(state, 'fixture.basic-5', 'hand');
    const deckCard = add(state, 'fixture.basic-2', 'deck');

    rules.playAbilityCardBatch(state, 'p1', [{ cardInstanceId: riding }, { cardInstanceId: lowPower }]);
    expect(state.cards.find((card) => card.instanceId === deckCard)!.zone).toBe('hand');
    expect(raw.cards.flatMap((card) => card.abilities).map((ability) => ability.id)).toContain('sc-drake-1.draw');

    const second = setup(raw, { servantId: raw.id });
    const secondRiding = add(second, 'servant.drake.skill.sc-drake-1', 'skill');
    const secondLow = add(second, 'fixture.basic-2', 'hand');
    const secondHigh = add(second, 'fixture.basic-5', 'hand');
    expect(play(second, secondRiding).ok).toBe(true);
    expect(activate(second, secondRiding, 'sc-drake-1.mount-summon').ok).toBe(true);
    const decision = rules.projectAbilityState(second, 'p1').pendingDecision!;
    expect(decision.candidates).toContain(secondLow);
    expect(decision.candidates).not.toContain(secondHigh);
  });

  it('keeps Drake movement counters powering Voyager and plunder VP', () => {
    const raw = archive('data/authoring/servants/servant.drake.json');
    const state = setup(raw, { servantId: raw.id });
    const goldenHind = add(state, 'servant.drake.skill.sc-drake-2', 'skill');
    const voyager = add(state, 'servant.drake.skill.sc-drake-3', 'skill');
    state.players[0]!.locationId = 'magic_workshop';

    expect(play(state, goldenHind).ok).toBe(true);
    expect(rules.projectAbilityState(state, 'p2').players[0]!.servantPackage?.id).toBe('servant.drake');
    rules.advanceAbilityPhase(state, 'battle');
    expect(activate(state, goldenHind, 'sc-drake-2.reward-and-move').ok).toBe(true);
    const decision = rules.projectAbilityState(state, 'p1').pendingDecision!;
    expect(rules.dispatchAbilityCommand(state, 'p1', {
      type: 'choose_target',
      decisionId: decision.id,
      selectedIds: ['shinto'],
    }).ok).toBe(true);

    state.round.activePhase = 'action';
    state.round.prioritySeat = 1;
    state.players[0]!.mana = 12;
    expect(play(state, voyager).ok).toBe(true);
    expect(rules.calculateCardPower(state, voyager).value).toBe(8);
    rules.advanceAbilityPhase(state, 'battle');
    expect(activate(state, voyager, 'sc-drake-3.plunder').ok).toBe(true);
    expect(state.players[0]!.vp).toBe(2);
  });

  it('keeps Drake Voyager reveal and reverse-dash movement legality automatic', () => {
    const raw = archive('data/authoring/servants/servant.drake.json');
    const state = setup(raw, { servantId: raw.id });
    const voyager = add(state, 'servant.drake.skill.sc-drake-3', 'skill');

    expect(play(state, voyager).ok).toBe(true);
    expect(rules.projectAbilityState(state, 'p2').players[0]!.servantPackage?.id).toBe('servant.drake');
    state.map.locations.find((location) => location.id === 'recon')!.movementLinks = [];
    state.map.locations.find((location) => location.id === 'shinto')!.movementLinks = [];
    state.map.locations.find((location) => location.id === 'miyama_town')!.movementLinks = ['recon'];
    state.players[0]!.locationId = 'recon';
    expect(rules.getReachableLocationsAlongArrows(state, 'recon', 1, 'p1')).toEqual(['miyama_town']);
  });

  it('keeps Ereshkigal movement, Netherworld reversal state, deploy mana, and battle-end return', () => {
    const raw = archive('data/authoring/servants/servant.ereshkigal.json');
    const state = setup(raw, { servantId: raw.id });
    const continuation = add(state, 'servant.ereshkigal.skill.sc-ereshkigal-1', 'skill');
    const protection = add(state, 'servant.ereshkigal.skill.sc-ereshkigal-2', 'skill');
    state.players[0]!.locationId = 'miyama_town';

    expect(play(state, continuation).ok).toBe(true);
    expect(activate(state, continuation, 'sc-ereshkigal-1.battle-continuation').ok).toBe(true);
    let decision = rules.projectAbilityState(state, 'p1').pendingDecision!;
    expect(decision.candidates).not.toContain('magic_workshop');
    expect(rules.dispatchAbilityCommand(state, 'p1', {
      type: 'choose_target',
      decisionId: decision.id,
      selectedIds: ['shinto'],
    }).ok).toBe(true);
    expect(state.players[0]!.locationId).toBe('shinto');

    state.players[0]!.mana = 8;
    expect(play(state, protection).ok).toBe(true);
    expect((state as unknown as { modeState?: { reversedModifierLocations?: unknown[] } }).modeState?.reversedModifierLocations?.length).toBeGreaterThan(0);

    rules.processAbilityEvent(state, { id: 'eresh-deploy', type: 'after_player_deployed_to_battlefield', playerId: 'p1' });
    expect(state.players[0]!.mana).toBe(9);
    rules.advanceAbilityPhase(state, 'battle');
    rules.processAbilityEvent(state, { id: 'eresh-battle-end', type: 'after_battle_ended', playerId: 'p1' });
    expect(state.cards.find((card) => card.instanceId === protection)!.zone).toBe('skill');
    expect(raw.cards.flatMap((card) => card.abilities).map((ability) => ability.id)).toEqual(expect.arrayContaining([
      'sc-ereshkigal-2.gain-mana-on-deploy',
      'sc-ereshkigal-2.return-to-skill-zone',
    ]));
  });

  it('keeps Ereshkigal Battle Continuation able to move to every non-workshop destination except the current location', () => {
    const raw = archive('data/authoring/servants/servant.ereshkigal.json');
    const cases: Array<[string, string[]]> = [
      ['magic_workshop', ['miyama_town', 'shinto', 'recon']],
      ['miyama_town', ['shinto', 'recon']],
      ['shinto', ['miyama_town', 'recon']],
      ['recon', ['miyama_town', 'shinto']],
    ];

    for (const [from, expected] of cases) {
      const state = setup(raw, { servantId: raw.id });
      const continuation = add(state, 'servant.ereshkigal.skill.sc-ereshkigal-1', 'field');
      state.players[0]!.locationId = from;
      markActive(state, continuation);

      expect(activate(state, continuation, 'sc-ereshkigal-1.battle-continuation').ok).toBe(true);
      const decision = rules.projectAbilityState(state, 'p1').pendingDecision!;
      expect(decision.candidates.sort()).toEqual(expected.sort());
      expect(decision.candidates).not.toContain('magic_workshop');
    }
  });

  it('keeps Ereshkigal noble phantasm moving Netherworld Protection into play when absent', () => {
    const raw = archive('data/authoring/servants/servant.ereshkigal.json');
    const state = setup(raw, { servantId: raw.id });
    const protection = add(state, 'servant.ereshkigal.skill.sc-ereshkigal-2', 'skill');
    const noble = add(state, 'servant.ereshkigal.skill.sc-ereshkigal-3', 'skill');

    expect(play(state, noble).ok).toBe(true);
    expect(rules.projectAbilityState(state, 'p2').players[0]!.servantPackage?.id).toBe('servant.ereshkigal');
    expect(activate(state, noble, 'sc-ereshkigal-3.blooming-netherworld').ok).toBe(true);
    expect(state.cards.find((card) => card.instanceId === protection)!.zone).toBe('field');
  });

  it('keeps Ereshkigal Netherworld reversing event and situation battle modifiers except herself', () => {
    const raw = archive('data/authoring/servants/servant.ereshkigal.json');
    const state = setup(raw, { servantId: raw.id });
    const protection = add(state, 'servant.ereshkigal.skill.sc-ereshkigal-2', 'skill');
    state.players[0]!.locationId = 'shinto';
    state.players[1]!.locationId = 'shinto';
    state.currentSituationModifiers = [{ sourceId: 'situation-test', targetTag: '魔术', value: 2 }];
    state.eventPlacements = [{
      locationId: 'shinto',
      eventCardId: 'event-test',
      victoryPoints: 0,
      visibility: { scope: 'public' },
      battleModifiers: [{ sourceId: 'event-test', targetTag: '魔术', value: 2 }],
    }];

    expect(play(state, protection).ok).toBe(true);
    const result = rules.resolveBattlefield(state, {
      battlefieldId: 'shinto',
      participants: [
        { playerId: 'p1', totalPower: 1, attackTags: ['魔术'] },
        { playerId: 'p2', totalPower: 10, attackTags: ['魔术'] },
      ],
    }).nextState.battleResults.at(-1)!;
    expect(result.participantBreakdowns.find((participant) => participant.playerId === 'p1')!.totalModifier).toBe(4);
    expect(result.participantBreakdowns.find((participant) => participant.playerId === 'p2')!.totalModifier).toBe(-4);
    expect(raw.cards.flatMap((card) => card.abilities).map((ability) => ability.id)).toContain('sc-ereshkigal-2.self-exempt');
  });

  it('counts active residual cards in the attack area as attacks even when printed power is zero', () => {
    const raw = archive('data/authoring/servants/servant.ereshkigal.json');
    const state = setup(raw, { servantId: raw.id });
    const protection = add(state, 'servant.ereshkigal.skill.sc-ereshkigal-2', 'skill');
    state.players[0]!.locationId = 'miyama_town';
    state.currentSituationModifiers = [{ sourceId: 'situation-special-test', targetTag: '特殊', value: 2 }];

    expect(play(state, protection).ok).toBe(true);
    expect(state.cards.find((card) => card.instanceId === protection)).toMatchObject({
      zone: 'attack_area',
      visibility: { scope: 'public' },
    });
    const participant = rules.deriveBattleParticipantsFromState(state, 'miyama_town').find((entry) => entry.playerId === 'p1')!;
    expect(participant.totalPower).toBe(0);
    expect(participant.attackTags).toContain('特殊');
    const battle = rules.resolveBattlefield(state, { battlefieldId: 'miyama_town' }).nextState.battleResults.at(-1)!;
    expect(battle.participantBreakdowns.find((entry) => entry.playerId === 'p1')!.effectivePower).toBe(2);
  });

  it('keeps Kintoki low-mana Golden Impact play, true-name reveal, and per-game limit', () => {
    const raw = archive('data/authoring/servants/servant.kintoki.json');
    const state = setup(raw, { servantId: raw.id });
    state.players[0]!.mana = 4;
    const impact = add(state, 'servant.kintoki.skill.sc-kintoki-1', 'skill');

    expect(play(state, impact).ok).toBe(true);
    expect(rules.projectAbilityState(state, 'p2').players[0]!.servantPackage?.id).toBe('servant.kintoki');
    state.cards.find((card) => card.instanceId === impact)!.zone = 'skill';
    expect(play(state, impact).rejection?.code).toBe('card_limit_reached');
  });

  it('keeps Kintoki Golden Impact ignoring situation play forbid while Golden Eater is blocked', () => {
    const raw = archive('data/authoring/servants/servant.kintoki.json');
    const state = setup(raw, { servantId: raw.id });
    const impact = add(state, 'servant.kintoki.skill.sc-kintoki-1', 'skill');
    const eater = add(state, 'servant.kintoki.skill.sc-kintoki-3', 'skill');
    installPlayForbid(state, 'situation_play_forbid');

    expect(play(state, impact).ok).toBe(true);
    expect(play(state, eater).rejection?.code).toBe('play_forbidden');
    expect(raw.cards.flatMap((card) => card.abilities).map((ability) => ability.id)).toEqual(expect.arrayContaining([
      'sc-kintoki-1.ignore-situation-play-forbid',
      'sc-kintoki-1.ignore-skill-zone-mana-requirement',
      'sc-kintoki-2.ignore-situation-play-forbid',
      'sc-kintoki-2.ignore-skill-zone-mana-requirement',
    ]));
  });

  it('keeps both Kintoki Golden Impact copies independently limited once per game', () => {
    const raw = archive('data/authoring/servants/servant.kintoki.json');
    const state = setup(raw, { servantId: raw.id });
    state.players[0]!.mana = 4;
    const firstImpact = add(state, 'servant.kintoki.skill.sc-kintoki-1', 'skill');
    const secondImpact = add(state, 'servant.kintoki.skill.sc-kintoki-2', 'skill');

    expect(play(state, firstImpact).ok).toBe(true);
    expect(play(state, secondImpact).ok).toBe(true);
    expect(rules.projectAbilityState(state, 'p2').players[0]!.servantPackage?.id).toBe('servant.kintoki');
    state.cards.find((card) => card.instanceId === firstImpact)!.zone = 'skill';
    state.cards.find((card) => card.instanceId === secondImpact)!.zone = 'skill';
    expect(play(state, firstImpact).rejection?.code).toBe('card_limit_reached');
    expect(play(state, secondImpact).rejection?.code).toBe('card_limit_reached');
  });

  it('keeps Tomoe action VP, unpreventable defeat penalty, and Inferno status creation', () => {
    const raw = archive('data/authoring/servants/servant.tomoe.json');
    const state = setup(raw, { servantId: raw.id });
    const solo = add(state, 'servant.tomoe.skill.sc-tomoe-1', 'skill');
    const inferno = add(state, 'servant.tomoe.skill.sc-tomoe-2', 'skill');
    state.players[0]!.seat = 1;

    expect(play(state, solo).ok).toBe(true);
    expect(activate(state, solo, 'sc-tomoe-1.independent-action').ok).toBe(true);
    expect(state.players[0]!.vp).toBe(3);

    state.abilityRuntime!.preventEffects = true;
    rules.processAbilityEvent(state, {
      id: 'tomoe-loss',
      type: 'after_controller_loses_battle',
      playerId: 'p1',
      battleResult: { winners: ['p2'], loserIds: ['p1'] },
    });
    expect(state.players[0]!.vp).toBe(0);
    expect(state.abilityRuntime!.events.some((event) => event.type === 'effect_resolved' && event.unpreventable)).toBe(true);

    state.abilityRuntime!.preventEffects = false;
    expect(play(state, inferno).ok).toBe(true);
    expect(activate(state, inferno, 'sc-tomoe-2.inferno-fire').ok).toBe(true);
    expect((state as unknown as { activeStatuses?: Array<Record<string, unknown>> }).activeStatuses).toContainEqual(expect.objectContaining({
      id: 'inferno_fire',
      sourceControllerId: 'p1',
    }));
  });

  it('keeps Tomoe terrain multiplier and rain of fire opponent power reduction in battle math', () => {
    const raw = archive('data/authoring/servants/servant.tomoe.json');
    raw.cards.push({
      id: 'fixture.force-attack',
      name: '力量攻击',
      cardType: 'basic_attack',
      cardFace: { cost: 0, basePower: 6, attributes: ['力量'] },
      playTiming: { phase: 'action', window: 'controller_play_card_window' },
      abilities: [],
    } as never);
    const state = setup(raw, { servantId: raw.id });
    const demon = add(state, 'servant.tomoe.skill.sc-tomoe-2', 'skill');
    const rain = add(state, 'servant.tomoe.skill.sc-tomoe-3', 'skill');
    const opponentAttack = add(state, 'fixture.force-attack', 'field', 'p2');
    state.abilityRuntime!.cardState[opponentAttack] = { active: true, faceDown: false, playedRound: 1 };
    state.players[0]!.locationId = 'miyama_town';
    state.players[1]!.locationId = 'miyama_town';
    state.map.locations.find((location) => location.id === 'miyama_town')!.terrainBonuses = [3];

    expect(play(state, demon).ok).toBe(true);
    rules.advanceAbilityPhase(state, 'battle');
    expect(activate(state, demon, 'sc-tomoe-2.double-terrain').ok).toBe(true);
    const doubled = rules.resolveBattlefield(state, {
      battlefieldId: 'miyama_town',
      participants: [{ playerId: 'p1', totalPower: 0, attackTags: ['力量'], terrainSlotIndex: 0 }],
    }).nextState.battleResults.at(-1)!;
    expect(doubled.participantBreakdowns[0]!.modifiers).toContainEqual(expect.objectContaining({
      source: 'location',
      value: 6,
    }));

    state.round.activePhase = 'action';
    state.round.prioritySeat = 1;
    expect(play(state, rain).ok).toBe(true);
    expect(rules.projectAbilityState(state, 'p2').players[0]!.servantPackage?.id).toBe('servant.tomoe');
    rules.advanceAbilityPhase(state, 'battle');
    expect(activate(state, rain, 'sc-tomoe-3.rain-of-fire').ok).toBe(true);
    expect(rules.calculateCardPower(state, opponentAttack).value).toBe(1);
  });
});

describe('complex master and session regressions', () => {
  it('keeps Kayneth passives, independent deck, Volumen response, and slash modifier on backend paths', () => {
    const raw = archive('data/authoring/masters/master.kayneth.json');
    const state = setup(raw, { masterId: raw.id });
    const doubleMaster = add(state, 'master.kayneth.skill.double-master', 'skill');
    const alchemist = add(state, 'master.kayneth.skill.alchemist', 'skill');
    const pride = add(state, 'master.kayneth.skill.pride', 'skill');

    rules.processAbilityEvent(state, { id: 'kayneth-passives', type: 'while_active' });
    expectDirective(state, 'low_mana_skill_cards_allowed', {
      controllerId: 'p1',
      sourceCardId: doubleMaster,
      abilityId: 'double-master.passive',
    });
    expect(pride).toBeTruthy();
    expect(modeDirectives(state)).not.toContainEqual(expect.objectContaining({
      directive: 'must_deploy_to_lower_vp_lone_battlefield',
    }));

    rules.processAbilityEvent(state, { id: 'complex-regression-game-start', type: 'game_start' });
    expect(state.cards.filter((card) => card.zone === 'independent_deck')).toHaveLength(6);
    expectDirective(state, 'create_independent_deck', {
      controllerId: 'p1',
      sourceCardId: alchemist,
      abilityId: 'alchemist.setup',
      deckId: 'kayneth-volumen',
      quantity: 6,
    });

    expect(activate(state, alchemist, 'alchemist.draw-volumen').ok).toBe(true);
    const volumen = state.cards.find((card) =>
      card.zone === 'hand' &&
      card.definitionId === 'master.kayneth.deck.volumen-hydrargyrum')!;
    expect(volumen).toBeTruthy();
    expectDirective(state, 'draw_from_independent_deck', {
      controllerId: 'p1',
      sourceCardId: alchemist,
      abilityId: 'alchemist.draw-volumen',
      deckId: 'kayneth-volumen',
      moved: 1,
    });

    state.round.activePhase = 'battle';
    state.players[0]!.mana = 5;
    rules.processAbilityEvent(state, { id: 'kayneth-volumen-combat-window', type: 'controller_combat_action_window' });
    const response = rules.getLegalActions(state, 'p1').find((candidate) =>
      candidate.type === 'resolve_response' &&
      candidate.cardInstanceId === volumen.instanceId &&
      candidate.abilityId === 'volumen.extra-play');
    expect(response).toBeTruthy();
    expect(rules.dispatchAbilityCommand(state, 'p1', response!).ok).toBe(true);
    expect(state.players[0]!.mana).toBe(3);
    expect(state.cards.find((card) => card.instanceId === volumen.instanceId)).toMatchObject({ zone: 'attack_area' });
    expect(state.abilityRuntime!.cardState[volumen.instanceId]).toMatchObject({ active: true, faceDown: false });
    expect(modeDirectives(state)).not.toContainEqual(expect.objectContaining({
      directive: 'play_this_card_from_hand_in_battle',
    }));

    state.round.activePhase = 'action';
    const activeVolumen = add(state, 'master.kayneth.deck.volumen-hydrargyrum', 'field');
    markActive(state, activeVolumen);
    expect(activate(state, activeVolumen, 'volumen.slash').ok).toBe(true);
    expect(rules.calculateCardPower(state, activeVolumen).value).toBe(4);
  });

  it('keeps Shinji location mana, setup-created False Attendant Book, seal loss, and replacement automatic', () => {
    const raw = archive('data/authoring/masters/master.shinji.json');
    const state = setup(raw, { masterId: raw.id });
    const drain = add(state, 'master.shinji.skill.drain-command', 'skill');
    const useless = add(state, 'master.shinji.skill.useless-person', 'skill');
    const clown = add(state, 'master.shinji.skill.clown', 'skill');
    const book = add(state, 'master.shinji.skill.false-attendant-book', 'skill');

    state.players[0]!.mana = 4;
    rules.processAbilityEvent(state, { id: 'shinji-enter-miyama', type: 'after_controller_enters_location', playerId: 'p1', locationId: 'miyama_town' });
    expect(state.players[0]!.mana).toBe(5);
    expect(state.abilityRuntime!.events).toContainEqual(expect.objectContaining({
      type: 'effect_resolved',
      sourceCardId: drain,
      abilityId: 'drain-command.enter-miyama',
    }));

    rules.processAbilityEvent(state, { id: 'shinji-game-start', type: 'game_start' });
    expect(state.cards).toContainEqual(expect.objectContaining({
      definitionId: 'master.shinji.skill.false-attendant-book',
      ownerPlayerId: 'p1',
      zone: 'skill',
      generatedBy: useless,
    }));
    expect(state.abilityRuntime!.events).toContainEqual(expect.objectContaining({
      type: 'effect_resolved',
      sourceCardId: useless,
      abilityId: 'useless-person.setup',
    }));

    (state.players[0] as unknown as { commandSpells: number }).commandSpells = 3;
    rules.processAbilityEvent(state, {
      id: 'shinji-loses-battle',
      type: 'after_controller_loses_battle',
      playerId: 'p1',
      battleResult: { winners: ['p2'], loserIds: ['p1'] },
    });
    expect(commandSpells(state)).toBe(2);
    expectDirective(state, 'lose_command_seal_after_battle_loss', {
      controllerId: 'p1',
      sourceCardId: clown,
      abilityId: 'clown.lose-command-seal',
      commandSpells: 2,
    });

    rules.processAbilityEvent(state, {
      id: 'shinji-empty-seals',
      type: 'after_controller_loses_all_command_seals',
      playerId: 'p1',
    });
    expect((state.players[0] as unknown as { commandSpells: number }).commandSpells).toBe(2);
    expect(state.players[0]!.mana).toBe(4);
    expect(state.log).toContainEqual(expect.objectContaining({
      type: 'replacement_missing_master_asset',
      payload: expect.objectContaining({ playerId: 'p1', requestedMasterId: 'master.sakura', preserveVictoryPoints: true }),
    }));
  });

  it('keeps Kiritsugu deck replacement directive, face-down attack action, and combat directives backend-owned', () => {
    const raw = archive('data/authoring/masters/master.kiritsugu.json');
    raw.cards.push({
      id: 'fixture.kiritsugu-basic-attack',
      name: '测试攻击',
      cardType: 'basic_attack',
      cardFace: { cost: 0, basePower: 1 },
      playTiming: { phase: 'action', window: 'controller_play_card_window' },
      abilities: [],
    } as never);
    const state = setup(raw, { masterId: raw.id });
    const killer = add(state, 'master.kiritsugu.skill.magus-killer', 'skill');
    const timeAlter = add(state, 'master.kiritsugu.skill.time-alter', 'skill');
    const squareAccel = add(state, 'master.kiritsugu.skill.square-accel', 'skill');
    const origin = add(state, 'master.kiritsugu.deck.origin-bullet', 'field');
    const attack = add(state, 'fixture.kiritsugu-basic-attack', 'hand');
    const deckCard = add(state, 'fixture.kiritsugu-basic-attack', 'deck');
    markActive(state, origin);

    state.round.activePhase = 'preparation';
    expect(activate(state, killer, 'magus-killer.setup').ok).toBe(true);
    let replaceDecision = rules.projectAbilityState(state, 'p1').pendingDecision!;
    expect(replaceDecision).toMatchObject({ min: 1, max: 1 });
    expect(replaceDecision.candidates).toContain(deckCard);
    expect(rules.dispatchAbilityCommand(state, 'p1', {
      type: 'choose_target',
      decisionId: replaceDecision.id,
      selectedIds: [deckCard],
    }).ok).toBe(true);
    expectDirective(state, 'replace_one_deck_card_with_origin_bullet', {
      controllerId: 'p1',
      sourceCardId: killer,
      abilityId: 'magus-killer.setup',
    });
    expect(state.cards.find((card) => card.instanceId === deckCard)?.definitionId).toBe('master.kiritsugu.deck.origin-bullet');

    state.round.activePhase = 'action';
    expect(activate(state, timeAlter, 'time-alter.action').ok).toBe(true);
    const targetAction = rules.getLegalActions(state, 'p1').find((candidate) =>
      candidate.type === 'choose_target' &&
      candidate.candidates.includes(attack));
    expect(targetAction).toMatchObject({ type: 'choose_target', min: 1, max: 1 });
    expect(rules.dispatchAbilityCommand(state, 'p1', {
      type: 'choose_target',
      decisionId: targetAction!.decisionId,
      selectedIds: [attack],
    }).ok).toBe(true);
    expect(state.cards.find((card) => card.instanceId === attack)).toMatchObject({ zone: 'attack_area' });
    expect(state.abilityRuntime!.cardState[attack]).toMatchObject({ active: false, faceDown: true });
    expect(state.cards.find((card) => card.instanceId === deckCard)).toMatchObject({ zone: 'hand' });

    rules.advanceAbilityPhase(state, 'battle');
    expect(activate(state, squareAccel, 'square-accel.combat').ok).toBe(true);
    expectDirective(state, 'close_active_attack_activate_face_down_origin_bullet', {
      controllerId: 'p1',
      sourceCardId: squareAccel,
      abilityId: 'square-accel.combat',
    });
    expect(activate(state, origin, 'origin-bullet.cut-bind').ok).toBe(true);
    expectDirective(state, 'engaged_opponent_loses_one_third_mana_then_source_gains_twice_lost_power', {
      controllerId: 'p1',
      sourceCardId: origin,
      abilityId: 'origin-bullet.cut-bind',
    });
  });

  it('keeps Maiya Support Shot creation, advance attachment, append-only rule, and suppress terrain multiplier', () => {
    const raw = archive('data/authoring/masters/master.maiya.json');
    const state = setup(raw, { masterId: raw.id, phase: 'advance' });
    state.players[0]!.locationId = 'recon';
    state.players[0]!.mana = 6;
    const military = add(state, 'master.maiya.skill.military', 'skill');

    rules.processAbilityEvent(state, { id: 'maiya-game-start', type: 'game_start' });
    const supportShot = state.cards.find((card) => card.definitionId === 'master.maiya.deck.support-shot')!;
    expect(supportShot).toMatchObject({ ownerPlayerId: 'p1', zone: 'skill', generatedBy: military });
    expect(state.abilityRuntime!.events).toContainEqual(expect.objectContaining({
      type: 'effect_resolved',
      sourceCardId: military,
      abilityId: 'military.has-support-shot',
    }));

    expect(activate(state, military, 'military.attach-support-shot').ok).toBe(true);
    const targetAction = rules.getLegalActions(state, 'p1').find((candidate) =>
      candidate.type === 'choose_target' &&
      candidate.candidates.includes('p2'))!;
    expect(targetAction).toMatchObject({ min: 1, max: 1 });
    expect(rules.dispatchAbilityCommand(state, 'p1', {
      type: 'choose_target',
      decisionId: targetAction.decisionId,
      selectedIds: ['p2'],
    }).ok).toBe(true);
    expect(state.players[0]!.mana).toBe(4);
    expect(state.cards.find((card) => card.instanceId === supportShot.instanceId)).toMatchObject({
      ownerPlayerId: 'p1',
      controllerPlayerId: 'p2',
      zone: 'attack_area',
      visibility: { scope: 'public' },
    });
    expect((state as unknown as { modeState?: { supportShotAttachments?: Array<Record<string, unknown>> } }).modeState?.supportShotAttachments).toContainEqual(expect.objectContaining({
      sourceOwnerId: 'p1',
      targetPlayerId: 'p2',
      cardInstanceId: supportShot.instanceId,
      sourceCardId: military,
      abilityId: 'military.attach-support-shot',
    }));
    expect((state as unknown as { activeStatuses?: Array<Record<string, unknown>> }).activeStatuses).toContainEqual(expect.objectContaining({
      id: 'maiya_cannot_win_battle_this_round',
      sourceControllerId: 'p1',
    }));

    rules.processAbilityEvent(state, { id: 'maiya-support-passive', type: 'while_active' });
    expect(playFor(state, 'p2', supportShot.instanceId).ok).toBe(false);

    state.round.activePhase = 'action';
    state.round.prioritySeat = 2;
    state.players[0]!.vp = 0;
    state.players[1]!.vp = 3;
    markActive(state, supportShot.instanceId);
    expect(activateFor(state, 'p2', supportShot.instanceId, 'support-shot.suppress').ok).toBe(true);
    expect((state as unknown as { modeState?: { terrainMultipliers?: Array<Record<string, unknown>> } }).modeState?.terrainMultipliers).toContainEqual(expect.objectContaining({
      playerId: 'p2',
      multiplier: 2,
      sourceCardId: supportShot.instanceId,
      abilityId: 'support-shot.suppress',
    }));
    expect(state.players[0]!.vp).toBe(2);
    expect(state.players[1]!.vp).toBe(1);
  });

  it('keeps Gatou seeker directives and command-spell state changes executable', () => {
    const raw = archive('data/authoring/masters/master.gatou.json');
    const state = setup(raw, { masterId: raw.id });
    const seeker = add(state, 'master.gatou.skill.seeker', 'skill');
    state.players[0]!.mana = 4;
    const commandSpell = add(state, 'master.gatou.command-spell', 'skill');

    rules.processAbilityEvent(state, { id: 'gatou-passive', type: 'while_active' });
    expectDirective(state, 'ignore_other_player_abilities_after_command_spell_this_round', {
      controllerId: 'p1',
      sourceCardId: seeker,
      abilityId: 'seeker.meditation',
    });
    rules.processAbilityEvent(state, { id: 'gatou-battle-ended', type: 'after_battle_ended', playerId: 'p1' });
    expectDirective(state, 'gatou_battle_end_mobile_players_reward', {
      controllerId: 'p1',
      sourceCardId: seeker,
      abilityId: 'seeker.battle-end-reward',
    });

    expect(activate(state, commandSpell, 'command-spell.gain-mana').ok).toBe(true);
    expect(state.players[0]!.mana).toBe(8);
    expect(commandSpells(state)).toBe(2);
    expectDirective(state, 'spend_command_spell', {
      controllerId: 'p1',
      sourceCardId: commandSpell,
      abilityId: 'command-spell.gain-mana',
      commandSpells: 2,
    });

    expect(activate(state, commandSpell, 'command-spell.power-victory').ok).toBe(true);
    expect(commandSpells(state)).toBe(1);
    expect(state.abilityRuntime!.ongoingEffects).toContainEqual(expect.objectContaining({
      sourceCardId: commandSpell,
      abilityId: 'command-spell.power-victory',
      controllerId: 'p1',
      ruleModifiers: expect.arrayContaining([expect.objectContaining({
        definition: expect.objectContaining({
          operation: 'add',
          rule: 'card.currentPower',
          scope: { controller: 'self' },
          value: 2,
        }),
      })]),
    }));
    expectDirective(state, 'gain_2_vp_for_each_battle_won_this_round', {
      controllerId: 'p1',
      sourceCardId: commandSpell,
      abilityId: 'command-spell.power-victory',
    });

    expect(activate(state, commandSpell, 'command-spell.free-move').ok).toBe(true);
    expect(commandSpells(state)).toBe(0);
    expectDirective(state, 'move_from_shinto_or_miyama_to_any_location_ignore_engagement', {
      controllerId: 'p1',
      sourceCardId: commandSpell,
      abilityId: 'command-spell.free-move',
    });
  });

  it('keeps Irisviel proxy timing directive and conversion-magic advance resource conversion', () => {
    const raw = archive('data/authoring/masters/master.irisviel.json');
    const state = setup(raw, { masterId: raw.id, phase: 'advance' });
    state.players[0]!.mana = 4;
    const proxy = add(state, 'master.irisviel.skill.proxy-master', 'skill');
    const conversion = add(state, 'master.irisviel.skill.conversion-magic', 'skill');
    add(state, 'fixture.irisviel-hand-1', 'hand');
    add(state, 'fixture.irisviel-hand-2', 'hand');

    rules.processAbilityEvent(state, { id: 'irisviel-passive', type: 'while_active' });
    expectDirective(state, 'command_spells_used_in_preparation_phase', {
      controllerId: 'p1',
      sourceCardId: proxy,
      abilityId: 'proxy-master.command-spell-timing',
    });
    expect(activate(state, conversion, 'conversion-magic.preparation').ok).toBe(true);
    expect(state.players[0]!.mana).toBe(6);
    expect(state.cards.filter((card) => card.ownerPlayerId === 'p1' && card.zone === 'hand')).toHaveLength(0);
    expect(state.cards.filter((card) => card.ownerPlayerId === 'p1' && card.zone === 'discard')).toHaveLength(2);
  });

  it('keeps Olga-Marie Chaldeas setup, swap response limit, Trismegistus activation, and command spells per card instance', () => {
    const raw = archive('data/authoring/masters/master.olga-marie.json');
    const state = setup(raw, { masterId: raw.id });
    const astronomy = add(state, 'master.olga-marie.skill.astronomical-science', 'skill');
    const trismegistus = add(state, 'master.olga-marie.skill.trismegistus-grief', 'skill');
    const commandSpell = add(state, 'master.olga-marie.command-spell', 'skill');
    state.players[0]!.mana = 4;

    rules.processAbilityEvent(state, { id: 'olga-game-start', type: 'game_start' });
    const chaldeas = state.cards.find((card) => card.definitionId === 'master.olga-marie.skill.chaldeas')!;
    expect(chaldeas).toMatchObject({ ownerPlayerId: 'p1', zone: 'skill', generatedBy: astronomy });
    expect(state.abilityRuntime!.events).toContainEqual(expect.objectContaining({
      type: 'effect_resolved',
      sourceCardId: astronomy,
      abilityId: 'astronomical-science.has-chaldeas',
    }));

    rules.processAbilityEvent(state, { id: 'olga-first-loss', type: 'after_controller_first_loses_battle', playerId: 'p1' });
    expect(state.cards.find((card) => card.instanceId === trismegistus)).toMatchObject({
      zone: 'field',
      visibility: { scope: 'public' },
    });
    expectDirective(state, 'activate_card_by_id', {
      controllerId: 'p1',
      sourceCardId: astronomy,
      abilityId: 'astronomical-science.first-loss',
      definitionId: 'master.olga-marie.skill.trismegistus-grief',
      activated: 1,
    });

    rules.processAbilityEvent(state, { id: 'olga-passives', type: 'while_active' });
    expect((state as unknown as { modeState?: { lookedMatchDeckBottoms?: Record<string, unknown> } }).modeState?.lookedMatchDeckBottoms).toMatchObject({
      controllerId: 'p1',
      sourceCardId: chaldeas.instanceId,
      abilityId: 'chaldeas.peek-bottoms',
    });
    expect(state.abilityRuntime!.ongoingEffects).toContainEqual(expect.objectContaining({
      sourceCardId: trismegistus,
      abilityId: 'trismegistus.soul-drag',
      controllerId: 'p1',
    }));
    expect((state as unknown as { modeState?: { returnSilencePlayers?: string[] } }).modeState?.returnSilencePlayers).toContain('p1');

    state.currentSituationCardId = 'situation.current';
    state.situationDeck = ['situation.top', 'situation.bottom'];
    rules.processAbilityEvent(state, {
      id: 'olga-revealed-card',
      type: 'before_situation_or_event_resolves',
      playerId: 'p1',
      revealedKind: 'situation',
      revealedId: 'situation.current',
    });
    const swap = rules.getLegalActions(state, 'p1').find((candidate) =>
      candidate.type === 'resolve_response' &&
      candidate.cardInstanceId === chaldeas.instanceId &&
      candidate.abilityId === 'chaldeas.swap-before-resolve');
    expect(swap).toBeTruthy();
    expect(rules.dispatchAbilityCommand(state, 'p1', swap!).ok).toBe(true);
    expect((state as unknown as { modeState?: { chaldeasSwaps?: Array<Record<string, unknown>> } }).modeState?.chaldeasSwaps).toContainEqual(expect.objectContaining({
      controllerId: 'p1',
      kind: 'situation',
      sourceCardId: chaldeas.instanceId,
      abilityId: 'chaldeas.swap-before-resolve',
    }));
    rules.processAbilityEvent(state, { id: 'olga-revealed-card-again', type: 'before_situation_or_event_resolves', playerId: 'p1' });
    expect(rules.getLegalActions(state, 'p1').some((candidate) =>
      candidate.type === 'resolve_response' &&
      candidate.abilityId === 'chaldeas.swap-before-resolve')).toBe(false);

    expect(activate(state, commandSpell, 'command-spell.gain-mana').ok).toBe(true);
    expect(state.players[0]!.mana).toBe(8);
    expect(commandSpells(state)).toBe(2);
    expectDirective(state, 'spend_command_spell', {
      controllerId: 'p1',
      sourceCardId: commandSpell,
      abilityId: 'command-spell.gain-mana',
    });
    expect(activate(state, commandSpell, 'command-spell.power-victory').ok).toBe(true);
    expect(commandSpells(state)).toBe(1);
    expectDirective(state, 'gain_2_vp_if_win_this_round', {
      controllerId: 'p1',
      sourceCardId: commandSpell,
      abilityId: 'command-spell.power-victory',
    });
    expect(activate(state, commandSpell, 'command-spell.free-move').ok).toBe(true);
    expect(commandSpells(state)).toBe(0);
    expectDirective(state, 'move_from_shinto_or_miyama_to_any_location_ignore_engagement', {
      controllerId: 'p1',
      sourceCardId: commandSpell,
      abilityId: 'command-spell.free-move',
    });
  });

  it('projects and consumes host directives in MatchSession without allowing AI to skip the pause', () => {
    const session = rules.createMatchSession({ seed: 20260904, humanPlayerId: 'p1' });
    session.state.abilityRuntime!.hostRequests.push({
      controllerId: 'p2',
      sourceCardId: 'fixture-host-card',
      abilityId: 'fixture-host-ability',
      allowedOperations: ['skip-ability'],
    });

    expect(session.runUntilHumanInputOrRoundEnd()).toBe('host_directive');
    const projection = session.projectToClientState('p1');
    expect(projection.directives).toContainEqual(expect.objectContaining({
      id: 'host:1',
      controllerId: 'p2',
      kind: 'host_adjudicated',
      status: 'pending',
    }));
    expect(projection.zones.find((zone) => zone.id === 'host_directive_queue')).toMatchObject({
      count: 1,
      status: 'host_adjudicated',
    });

    expect(session.consumeDirective('host:1')).toBe(true);
    expect(session.projectToClientState('p1').logs.at(-1)).toMatchObject({ type: 'directive_consumed' });
  });

  it('keeps event and situation modifier sources in three-round MatchSession battle breakdown logs', () => {
    const session = rules.createMatchSession({ seed: 20260904, humanPlayerId: 'p1' });

    expect(session.runFullMatch({ maxRounds: 3 })).toBe('match_complete');
    const projection = session.projectToClientState('p1');
    expect(projection.logs.some((entry) => entry.type === 'battle_resolved')).toBe(true);
    expect(projection.battleBreakdowns.some((battle) =>
      battle.participantBreakdowns.some((participant) =>
        participant.modifiers.some((modifier) => modifier.source === 'event' || modifier.source === 'situation'),
      ),
    )).toBe(true);
    expect(projection.replay.length).toBeGreaterThanOrEqual(3);
  });
});
