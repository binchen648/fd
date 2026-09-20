import { createHash } from 'node:crypto';
import { readFileSync, readdirSync } from 'node:fs';
import { join, resolve } from 'node:path';
import { describe, expect, it } from 'vitest';

import * as rules from '../src/index';
import { stepGameLoop } from '../src/core/game-loop';
import { createSeededGameState } from '../src/tools/seeded-state';

const ROOT = resolve('.');
const OWNER = 'servant.siegfried';
const ID = 'servant.siegfried.skill.sc-siegfried-2';
const SOURCE = 'siegfried-armor-source';
const TEXT = '【真名解放】\n若你的真名已经公开并处于交战状态，当一名对手移动至你所在的战场时，关闭此牌。';
const TEXT_SHA = '7203c9276b4653d632bec22e8c81567db4b26e4e1c9db2d60f4031989990eacb';

function hash(text: string): string {
  return createHash('sha256').update(text, 'utf8').digest('hex');
}

function rawArchive(): any {
  return JSON.parse(readFileSync(resolve(ROOT, 'data/authoring/servants/servant.siegfried.json'), 'utf8'));
}

function setup(options: { revealed?: boolean; controllerLocation?: string; active?: boolean } = {}) {
  const pack = rules.loadAuthoringJson(rawArchive());
  expect(pack.report).toEqual([]);
  const state = createSeededGameState({ activeSeats: [1, 2] });
  state.round.activePhase = 'action';
  state.cards = [{
    instanceId: SOURCE,
    definitionId: ID,
    ownerPlayerId: 'p1',
    controllerPlayerId: 'p1',
    zone: 'field',
    visibility: { scope: 'public' },
  }];
  state.players[0]!.locationId = options.controllerLocation ?? 'miyama_town';
  state.players[1]!.locationId = 'magic_workshop';
  state.players[1]!.mana = 5;
  rules.initializeAbilityRuntime(state, pack, { seed: 20260920 });
  state.abilityRuntime!.cardState[SOURCE] = { active: options.active ?? true, faceDown: false };
  if (options.revealed ?? true) state.abilityRuntime!.revealedServants.push('p1');
  return state;
}

function enterEvent(locationId: string, playerId = 'p2') {
  return { id: `enter-${playerId}-${locationId}`, type: 'after_controller_enters_location', playerId, locationId };
}

function sourceClosed(state: ReturnType<typeof setup>): boolean {
  return state.cards.find((card) => card.instanceId === SOURCE)?.zone === 'skill' &&
    state.abilityRuntime!.cardState[SOURCE]?.active === false;
}

function authoringJsonFiles(dir: string): string[] {
  return readdirSync(dir, { withFileTypes: true }).flatMap((entry) => {
    const full = join(dir, entry.name);
    return entry.isDirectory() ? authoringJsonFiles(full) : entry.name.endsWith('.json') ? [full] : [];
  });
}

describe('P3 S R90 Siegfried s2 consumer migration', () => {
  it('materializes exactly the frozen card with F1 hash, Reference static metadata, and accepted contracts', () => {
    const raw = rawArchive();
    expect(raw).toMatchObject({
      schemaVersion: 'fd-card-authoring-v1',
      archiveType: 'servant_skill_card_archive',
      id: OWNER,
      name: '齐格飞',
      class: 'Saber',
      sourcePolicy: {
        phase3EvidenceCommit: '59f145434695d29bdd17e4cb3adc887e84182377',
        referenceMetadataCommit: 'b2f9fa15fba07c63530bbf4612b03b8b704755f9',
      },
    });
    expect(raw.cards.map((card: any) => card.id)).toEqual([ID]);
    const authored = raw.cards[0];
    expect(authored).toMatchObject({
      id: ID,
      aliases: ['sc_siegfried_2'],
      legacyId: 'sc_siegfried_2',
      name: '恶龙之血铠',
      cardType: 'servant_skill',
      owner: { type: 'servant', id: OWNER },
      cardFace: { typeLabel: '宝具', attributes: ['宝具'], cost: 3, basePower: 9 },
      playTiming: { phase: 'action', window: 'controller_play_card_window' },
      playRequirements: [{ type: 'skill_zone_mana_at_least', value: 8 }],
      phase3Evidence: {
        f1Commit: '59f145434695d29bdd17e4cb3adc887e84182377',
        f1ClauseSources: [{ sha256: TEXT_SHA }],
        f1FullPrintedTextSha256: TEXT_SHA,
        referenceStaticMetadata: {
          commit: 'b2f9fa15fba07c63530bbf4612b03b8b704755f9', legacySkillId: 'sc_siegfried_2',
          class: 'Saber', cost: 3, basePower: 9, legacyRequirement: 8, typeLabel: '宝具', attributes: ['宝具'],
        },
        acceptedContracts: { eventPlayerOpponent: 'P3-R70/FB2-31', eventLocationEqualsController: 'P3-R90/FB2-43' },
      },
    });
    expect(authored.printedText).toBe(TEXT);
    expect(authored.abilities[0].printedClause).toBe(TEXT);
    expect(hash(authored.printedText)).toBe(TEXT_SHA);
    expect(hash(authored.abilities[0].printedClause)).toBe(TEXT_SHA);
    expect(rules.definitionHasStructuralTrueNameRelease(authored)).toBe(true);
  });

  it('loads blocker-free as the exact automatic normalized whole-card composition', () => {
    const pack = rules.loadAuthoringJson(rawArchive());
    expect(pack.report).toEqual([]);
    const card = pack.cards[ID]!;
    expect(card.mode).toBe('automatic');
    expect(card.abilities).toHaveLength(1);
    expect(card.abilities[0]).toMatchObject({
      id: 'armor-of-fafnir', kind: 'forced_trigger',
      activation: { trigger: 'after_controller_enters_location', requiresSourceState: 'active' },
      conditions: [
        { type: 'source_active' },
        { type: 'controller_servant_revealed' },
        { type: 'at_battlefield' },
        { type: 'event_player_is_opponent' },
        { type: 'event_location_equals_controller' },
      ],
      effects: [{ type: 'close_source_card' }],
      visibility: { revealsTrueName: true, revealTiming: 'on_use_declared', revealScope: 'servant_package' },
      execution: { mode: 'automatic' },
    });
  });

  it('closes through the real movement producer when an opponent enters the revealed controller battlefield', () => {
    const state = setup();
    const result = stepGameLoop(state, { action: { type: 'move', playerId: 'p2', to: 'miyama_town', movementKind: 'normal' } });
    expect(result.nextState.players.find((player) => player.id === 'p2')?.locationId).toBe('miyama_town');
    expect(result.nextState.abilityRuntime!.processedEvents.some((id) => id.startsWith('enter-location-'))).toBe(true);
    expect(sourceClosed(result.nextState as ReturnType<typeof setup>)).toBe(true);
  });

  it('fails closed for another location, self movement, unrevealed servant, non-battlefield controller, or inactive source', () => {
    const elsewhere = setup();
    expect(rules.collectTriggeredAbilities(elsewhere, enterEvent('shinto'))).toEqual([]);

    const selfMove = setup();
    expect(rules.collectTriggeredAbilities(selfMove, enterEvent('miyama_town', 'p1'))).toEqual([]);

    const unrevealed = setup({ revealed: false });
    expect(rules.collectTriggeredAbilities(unrevealed, enterEvent('miyama_town'))).toEqual([]);

    const nonBattlefield = setup({ controllerLocation: 'magic_workshop' });
    expect(rules.collectTriggeredAbilities(nonBattlefield, enterEvent('magic_workshop'))).toEqual([]);

    const inactive = setup({ active: false });
    expect(rules.collectTriggeredAbilities(inactive, enterEvent('miyama_town'))).toEqual([]);
  });

  it('stays a standalone migration outside product pack/generated outputs', () => {
    const manifest = readFileSync(resolve(ROOT, 'data/packs/fd-playtest-v1/pack.json'), 'utf8');
    const generated = readFileSync(resolve(ROOT, 'data/generated/fd-playtest-v1.content-library.json'), 'utf8');
    expect(manifest).not.toContain('data/authoring/servants/servant.siegfried.json');
    expect(manifest).not.toContain(ID);
    expect(generated).not.toContain(ID);
  });

  it('keeps Siegfried s2 authored exactly once with no duplicate frozen ids', () => {
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
