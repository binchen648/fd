import { createHash } from 'node:crypto';
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { describe, expect, it } from 'vitest';

import * as rules from '../src/index';
import { createSeededGameState } from '../src/tools/seeded-state';

const ROOT = resolve('.');
const OWNER = 'servant.stheno';
const ID = 'servant.stheno.skill.sc-stheno-2';
const FULL_SHA = 'edc8e5b95f81153ebace50f23ed1e9a1342bd380891b07b35f74c1948eaac702';
const CLAUSE_SHAS = [
  '34d0686e0a3e32928564917e173f901363e57039d02d16fb7d63a4003209ab4c',
  '45fbb637d015849fc9403a5e28561b067a07b92a583e324a1175bbc300da79d6',
  'd975b3ebb616a10292d326140d2d1fe5d510bb7b80092d57465c0637b0e13d72',
] as const;

function hash(text: string): string {
  return createHash('sha256').update(text, 'utf8').digest('hex');
}

function rawArchive(): any {
  return JSON.parse(readFileSync(resolve(ROOT, 'data/authoring/servants/servant.stheno.json'), 'utf8'));
}

function loadedPack() {
  const pack = rules.loadAuthoringJson(rawArchive());
  expect(pack.report).toEqual([]);
  return pack;
}

function battleState(options: { controller?: string; active?: boolean; faceDown?: boolean } = {}) {
  const controller = options.controller ?? 'p1';
  const pack = loadedPack();
  const state = createSeededGameState({ activeSeats: [1, 2, 3] });
  state.round.activePhase = 'battle';
  for (const player of state.players) {
    if (['p1', 'p2', 'p3'].includes(player.id)) player.locationId = 'miyama_town';
  }
  const location = state.map.locations.find((entry) => entry.id === 'miyama_town');
  if (!location) throw new Error('missing miyama_town');
  location.vpRewardRules = { ...(location.vpRewardRules ?? {}), battle: 1, competition: 2, location: 6 };
  state.eventPlacements = [{
    eventCardId: 'event.stheno.reward', locationId: 'miyama_town', victoryPoints: 4,
    visibility: { scope: 'public' },
  }];
  state.cards = [{
    instanceId: 'stheno-source', definitionId: ID, ownerPlayerId: controller, controllerPlayerId: controller,
    zone: 'field', visibility: { scope: 'public' },
  }];
  rules.initializeAbilityRuntime(state, pack, { seed: 20260920 });
  state.abilityRuntime!.cardState['stheno-source'] = {
    active: options.active !== false,
    faceDown: options.faceDown === true,
    playedRound: state.round.roundNumber,
  };
  return state;
}

function resolveTie(state: ReturnType<typeof battleState>) {
  return rules.resolveBattlefield(state, {
    battlefieldId: 'miyama_town',
    participants: [
      { playerId: 'p1', totalPower: 10 },
      { playerId: 'p2', totalPower: 10 },
      { playerId: 'p3', totalPower: 5 },
    ],
  }).nextState.battleResults.at(-1)!;
}

describe('P3 S R73 Stheno consumer migration', () => {
  it('materializes exactly the frozen Stheno card with F1 hashes, Reference metadata, and accepted compiled semantics', () => {
    const raw = rawArchive();
    expect(raw).toMatchObject({
      schemaVersion: 'fd-card-authoring-v1',
      archiveType: 'servant_skill_card_archive',
      id: OWNER,
      class: 'Assassin',
      sourcePolicy: {
        phase3EvidenceCommit: '59f145434695d29bdd17e4cb3adc887e84182377',
        referenceMetadataCommit: 'b2f9fa15fba07c63530bbf4612b03b8b704755f9',
      },
    });
    expect(raw.cards.map((card: any) => card.id)).toEqual([
      'servant.stheno.skill.sc-stheno-1',
      ID,
    ]);
    const authored = raw.cards.find((card: any) => card.id === ID)!;
    expect(authored).toMatchObject({
      id: ID,
      legacyId: 'sc_stheno_2',
      cardType: 'servant_skill',
      owner: { type: 'servant', id: OWNER },
      cardFace: { cost: 0, basePower: 3 },
      playTiming: { phase: 'action', window: 'controller_play_card_window' },
      playRequirements: [{ type: 'skill_zone_mana_at_least', value: 8 }],
      phase3Evidence: {
        sourceTextSha256: FULL_SHA,
        referenceStaticMetadata: {
          legacySkillId: 'sc_stheno_2', class: 'Assassin', cost: 0, basePower: 3, legacyRequirement: 8,
        },
      },
    });
    expect(hash(authored.printedText)).toBe(FULL_SHA);
    expect(authored.abilities).toHaveLength(3);
    expect(authored.abilities.map((ability: any) => hash(ability.printedClause))).toEqual(CLAUSE_SHAS);

    const pack = loadedPack();
    const card = pack.cards[ID]!;
    expect(card.mode).toBe('automatic');
    expect(card.abilities.every((ability) => ability.execution.mode === 'automatic')).toBe(true);
    const reveal = card.abilities.find((ability) => ability.id === 'true-name-release')!;
    expect(reveal.visibility).toMatchObject({
      revealsTrueName: true,
      revealTiming: 'on_use_declared',
      revealScope: 'servant_package',
    });
    const distribution = card.abilities.find((ability) => ability.id === 'goddess-smile-reward-distribution')!;
    expect(rules.isAcceptedStaticCombatRewardDistributionAbility(distribution as any, 'compiled')).toBe(true);
    const reward = card.abilities.find((ability) => ability.id === 'goddess-smile-win-reward')!;
    expect(reward).toMatchObject({
      kind: 'forced_trigger',
      activation: { trigger: 'after_controller_wins_battle', requiresSourceState: 'active' },
      conditions: [],
      effects: [{ type: 'adjust_victory_points', player: 'controller', amount: 1 }],
    });
  });

  it('uses the real migrated definition to give every tied winner the full shared reward pools', () => {
    const full = resolveTie(battleState({ controller: 'p1' }));
    expect(full.winnerPlayerIds).toEqual(['p1', 'p2']);
    expect(full).toMatchObject({ vpReward: 4, baseVpPerWinner: 6, eventVpPool: 4, competitionVpPool: 2 });
    expect(full.vpAdjustments).toEqual(expect.arrayContaining([
      expect.objectContaining({ playerId: 'p1', delta: 2, source: 'competition_vp' }),
      expect.objectContaining({ playerId: 'p2', delta: 2, source: 'competition_vp' }),
      expect.objectContaining({ playerId: 'p1', delta: 6, source: 'location_vp' }),
      expect.objectContaining({ playerId: 'p2', delta: 6, source: 'location_vp' }),
    ]));
  });

  it('fails closed for a losing, inactive, or face-down migrated source', () => {
    for (const state of [
      battleState({ controller: 'p3' }),
      battleState({ controller: 'p1', active: false }),
      battleState({ controller: 'p1', faceDown: true }),
    ]) {
      const battle = resolveTie(state);
      expect(battle.vpReward).toBe(2);
      expect(battle.baseVpPerWinner).toBe(3);
      expect(battle.vpAdjustments).toEqual(expect.arrayContaining([
        expect.objectContaining({ playerId: 'p1', delta: 1, source: 'competition_vp' }),
        expect.objectContaining({ playerId: 'p1', delta: 3, source: 'location_vp' }),
      ]));
    }
  });

  it('settles the normalized win reward exactly once for the winning controller and rejects non-owner/inactive events', () => {
    const state = battleState({ controller: 'p1' });
    expect(state.players.find((p) => p.id === 'p1')!.vp).toBe(0);
    const win = { id: 'stheno-win-1', type: 'after_controller_wins_battle', playerId: 'p1' } as const;
    rules.processAbilityEvent(state, win);
    expect(state.players.find((p) => p.id === 'p1')!.vp).toBe(1);
    const snapshot = structuredClone(state);
    rules.processAbilityEvent(state, win);
    expect(state).toEqual(snapshot);

    const wrong = battleState({ controller: 'p1' });
    rules.processAbilityEvent(wrong, { id: 'stheno-win-p2', type: 'after_controller_wins_battle', playerId: 'p2' });
    expect(wrong.players.find((p) => p.id === 'p1')!.vp).toBe(0);

    const inactive = battleState({ controller: 'p1', active: false });
    rules.processAbilityEvent(inactive, { id: 'stheno-inactive-win', type: 'after_controller_wins_battle', playerId: 'p1' });
    expect(inactive.players.find((p) => p.id === 'p1')!.vp).toBe(0);
  });

  it('keeps the standalone migration out of the production pack/generated product', () => {
    const manifest = readFileSync(resolve(ROOT, 'data/packs/fd-playtest-v1/pack.json'), 'utf8');
    const generated = readFileSync(resolve(ROOT, 'data/generated/fd-playtest-v1.content-library.json'), 'utf8');
    expect(manifest).not.toContain('data/authoring/servants/servant.stheno.json');
    expect(generated).not.toContain(ID);
  });
});

