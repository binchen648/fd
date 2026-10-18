import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';

import * as rules from '../../src/index';
import { capabilityForAuthoringCard } from '../../../content/src/playtest-pack-loader';
import type { GameState } from '../../src/schema/game';
import { createSeededGameState } from '../../src/tools/seeded-state';

const ROOT = 'master.iliya';
const IDS = ['ascension', 's1', 's2', 's3', 's4'].map((skill) => `${ROOT}.skill.${skill}`);
const PATH = 'data/authoring/masters/master.iliya.json';
const archive = JSON.parse(readFileSync(PATH, 'utf8')) as any;

function addSkill(state: GameState, definitionId: string): string {
  const instanceId = `iliya:${definitionId.split('.').at(-1)}:${state.cards.length}`;
  state.cards.push({
    instanceId, definitionId, ownerPlayerId: 'p1', controllerPlayerId: 'p1', zone: 'skill',
    visibility: { scope: 'owner_only', ownerPlayerId: 'p1' },
  } as any);
  state.abilityRuntime!.cardState[instanceId] = {
    active: false, faceDown: false, playedRound: state.round.roundNumber,
  };
  return instanceId;
}

function setup(): { state: GameState; loaded: ReturnType<typeof rules.loadAuthoringJson> } {
  const loaded = rules.loadAuthoringJson(archive);
  const state = createSeededGameState({ activeSeats: [1, 2] });
  state.cards = [];
  state.players[0]!.masterCardId = ROOT;
  state.players[0]!.mana = 4;
  state.players[1]!.mana = 4;
  state.round.activePhase = 'action';
  state.round.prioritySeat = 1;
  rules.initializeAbilityRuntime(state, loaded, { seed: 20261019 });
  return { state, loaded };
}

describe('P3 Iliya owner migration boundary', () => {
  it('materializes exactly the five frozen identities and preserves source locators', () => {
    const { loaded } = setup();
    expect(archive.id).toBe(ROOT);
    expect(archive.publicInformation).toEqual({ type: 'master_package', initialMana: 4 });
    expect(archive.cards.map((card: any) => card.id)).toEqual(IDS);
    expect(Object.keys(loaded.cards).sort()).toEqual(IDS.sort());
    expect(loaded.report.filter((entry) => entry.status === 'unsupported').map((entry) => entry.cardId).sort()).toEqual(
      IDS.filter((id) => id !== `${ROOT}.skill.s1`).sort(),
    );
    expect(archive.cards.map((card: any) => card.verification.implementationStatus)).toEqual([
      'host_adjudicated', 'complete', 'host_adjudicated', 'host_adjudicated', 'host_adjudicated',
    ]);
    expect(archive.sourcePolicy.sourceLocators.legacy[`${ROOT}.skill.s1`]).toBe('legacy-content.json#master/master.iliya/s1');
    expect(archive.cards.find((card: any) => card.id === `${ROOT}.skill.ascension`).printedText).toContain('天之杯');
  });

  it('executes only the supported game-start initial-mana effect', () => {
    const { state, loaded } = setup();
    const source = addSkill(state, `${ROOT}.skill.s1`);
    expect(loaded.cards[`${ROOT}.skill.s1`]!.mode).toBe('automatic');
    rules.processAbilityEvent(state, { id: 'iliya-game-start', type: 'game_start', playerId: 'p1' });
    expect(state.players[0]!.mana).toBe(6);
    expect(state.players[1]!.mana).toBe(4);
    expect(state.abilityRuntime!.events).toContainEqual(expect.objectContaining({
      type: 'mana_adjusted', playerId: 'p1', sourceCardId: source, abilityId: 'iliya.homunculus.initial-mana',
      before: 4, after: 6, delta: 2,
    }));
    rules.processAbilityEvent(state, { id: 'iliya-game-start', type: 'game_start', playerId: 'p1' });
    expect(state.players[0]!.mana).toBe(6);
    expect(state.abilityRuntime!.events.filter((event) => event.type === 'mana_adjusted')).toHaveLength(1);
  });

  it('publishes the supported S1 capability as FULL/automatic in generated artifacts', () => {
    const library = JSON.parse(readFileSync('data/generated/fd-playtest-v1.content-library.json', 'utf8')) as any;
    const evidence = JSON.parse(readFileSync('data/generated/fd-playtest-v1.evidence-report.json', 'utf8')) as any;
    const card = library.cards.find((entry: any) => entry.id === `${ROOT}.skill.s1`);
    const ruleCard = library.rules.cards[`${ROOT}.skill.s1`];
    const evidenceRow = evidence.entities.find((entry: any) => entry.entityId === `${ROOT}.skill.s1`);
    expect(card.capability).toEqual({
      status: 'FULL',
      supportedDimensions: ['game_start_fixed_controller_mana'],
    });
    expect(ruleCard.mode).toBe('automatic');
    expect(ruleCard.abilities[0].execution.mode).toBe('automatic');
    expect(evidenceRow.capabilityStatus).toBe('FULL');
    for (const id of IDS.filter((value) => value !== `${ROOT}.skill.s1`)) {
      expect(library.cards.find((entry: any) => entry.id === id).capability.status).toBe('HOST_ADJUDICATED');
      expect(evidence.entities.find((entry: any) => entry.entityId === id).capabilityStatus).toBe('HOST_ADJUDICATED');
    }
  });

  it('keeps unsupported deck, situation, attack-history, and elimination semantics host-adjudicated', () => {
    const { state, loaded } = setup();
    for (const id of IDS.filter((value) => value !== `${ROOT}.skill.s1`)) addSkill(state, id);
    expect(loaded.cards[`${ROOT}.skill.ascension`]!.mode).toBe('host_adjudicated');
    expect(loaded.cards[`${ROOT}.skill.s2`]!.mode).toBe('host_adjudicated');
    expect(loaded.cards[`${ROOT}.skill.s3`]!.mode).toBe('host_adjudicated');
    expect(loaded.cards[`${ROOT}.skill.s4`]!.mode).toBe('host_adjudicated');
    rules.processAbilityEvent(state, { id: 'iliya-host-start', type: 'game_start', playerId: 'p1' });
    rules.processAbilityEvent(state, { id: 'iliya-host-round-start', type: 'round_start', playerId: 'p1' });
    expect((state as any).modeState?.masterDirectives ?? []).toEqual([]);
    expect(archive.cards.filter((card: any) => card.verification.implementationStatus === 'host_adjudicated')
      .every((card: any) => card.abilities.every((ability: any) => ability.effects.every((effect: any) => effect.type === 'record_master_directive')))).toBe(true);
  });

  it('rejects widened game-start set-mana shapes at the semantic gateway', () => {
    const malformed = structuredClone(archive);
    malformed.cards[1].abilities[0].effects[0].amount = 7;
    expect(rules.isGameStartFixedControllerManaSetSemantic(rules.loadAuthoringJson(malformed).cards[`${ROOT}.skill.s1`]!.abilities[0]!)).toBe(true);
    malformed.cards[1].abilities[0].effects[0].player = 'target';
    expect(rules.isGameStartFixedControllerManaSetSemantic(rules.loadAuthoringJson(malformed).cards[`${ROOT}.skill.s1`]!.abilities[0]!)).toBe(false);
  });

  it('keeps malformed fixed set-mana shapes host-adjudicated in the generated capability gate', () => {
    const malformedCases: Array<[string, (card: any) => void]> = [
      ['negative amount', (card) => { card.abilities[0].effects[0].amount = -1; }],
      ['fractional amount', (card) => { card.abilities[0].effects[0].amount = 1.5; }],
      ['unsafe amount', (card) => { card.abilities[0].effects[0].amount = Number.MAX_SAFE_INTEGER + 1; }],
      ['extra effect field', (card) => { card.abilities[0].effects[0].audit = true; }],
      ['non-empty lifecycle', (card) => { card.abilities[0].lifecycle.cleanup = 'discard_at_round_end'; }],
      ['non-empty limit', (card) => { card.abilities[0].limit.type = 'per_game'; }],
      ['non-empty visibility', (card) => { card.abilities[0].visibility.scope = 'owner_only'; }],
      ['unsupported response key', (card) => { card.abilities[0].responseWindow.opens = 'game_start'; }],
      ['invalid response order', (card) => { card.abilities[0].responseWindow.order = 'seat_order'; }],
    ];
    for (const [label, mutate] of malformedCases) {
      const malformed = structuredClone(archive);
      mutate(malformed.cards[1]);
      expect(capabilityForAuthoringCard(malformed.cards[1]), label).toEqual({
        status: 'HOST_ADJUDICATED',
        hostRulingReason: expect.any(String),
      });
      const ability = rules.loadAuthoringJson(malformed).cards[`${ROOT}.skill.s1`]!.abilities[0]!;
      expect(rules.isGameStartFixedControllerManaSetSemantic(ability), label).toBe(false);
    }
  });

  it('registers Iliya exactly once after Hisui in the canonical pack', () => {
    const pack = JSON.parse(readFileSync('data/packs/fd-playtest-v1/pack.json', 'utf8'));
    expect(pack.authoringMasterFiles.filter((entry: string) => entry === PATH)).toHaveLength(1);
    const index = pack.authoringMasterFiles.indexOf(PATH);
    expect(pack.authoringMasterFiles[index - 1]).toBe('data/authoring/masters/master.hisui-detective.json');
  });
});
