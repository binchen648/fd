import { createHash } from 'node:crypto';
import { readFileSync, readdirSync } from 'node:fs';
import { join, resolve } from 'node:path';
import { describe, expect, it } from 'vitest';

import * as rules from '../src/index';
import type { GameState } from '../src/schema/game';
import { createSeededGameState } from '../src/tools/seeded-state';

const ROOT = resolve('.');
const OWNER = 'master.ciel';
const ID = 'master.ciel.skill.s3';
const SOURCE = 'ciel-s3-source';
const ABILITY = 'seventh-scripture-soul-crush';
const FULL_TEXT = '<每局游戏限一次>\n粉碎灵魂-战斗阶段：你的交战对手若未控制【幸运】，其下回合无法从局势牌获得魔力和威力加成。';
const CLAUSE = '粉碎灵魂-战斗阶段：你的交战对手若未控制【幸运】，其下回合无法从局势牌获得魔力和威力加成。';
const FULL_SHA = '76813acfde86242d21158d290668d0fc575b476d7aac289ec438ae302898517b';
const CLAUSE_SHA = '4e20d56d0540c3ae75b21f62b8277b79ba27aeeeeb7b503b91c384c318f3de19';
const hash = (text: string): string => createHash('sha256').update(text, 'utf8').digest('hex');

function rawArchive(): any {
  return JSON.parse(readFileSync(resolve(ROOT, 'data/authoring/masters/master.ciel.json'), 'utf8').replace(/^\uFEFF/, ''));
}
function setup(mana = 8): GameState {
  const pack: any = rules.loadAuthoringJson(rawArchive());
  expect(pack.report).toEqual([]);
  const state = createSeededGameState({ activeSeats: [1, 2, 3] });
  state.cards = [{
    instanceId: SOURCE, definitionId: ID, ownerPlayerId: 'p1', controllerPlayerId: 'p1',
    zone: 'skill', visibility: { scope: 'owner_only', ownerPlayerId: 'p1' },
  }];
  state.players[0]!.masterCardId = OWNER;
  state.players[0]!.mana = mana;
  state.players[0]!.locationId = 'miyama_town';
  state.players[1]!.locationId = 'miyama_town';
  state.players[2]!.locationId = 'miyama_town';
  state.round.activePhase = 'action';
  state.round.prioritySeat = state.players[0]!.seat;
  rules.initializeAbilityRuntime(state, pack, { seed: 10803 });
  state.abilityRuntime!.cardState[SOURCE] = { active: false, faceDown: false, playedRound: 0 };
  return state;
}
function play(state: GameState) {
  return rules.dispatchAbilityCommand(state, 'p1', { type: 'play_card', cardInstanceId: SOURCE });
}
function activate(state: GameState) {
  return rules.dispatchAbilityCommand(state, 'p1', { type: 'activate_ability', cardInstanceId: SOURCE, abilityId: ABILITY });
}
function addLuck(state: GameState, playerId: string, options: { active?: boolean; faceDown?: boolean; zone?: string } = {}): void {
  const id = `luck-${playerId}`;
  state.cards.push({
    instanceId: id, definitionId: 'basic.luck', ownerPlayerId: playerId, controllerPlayerId: playerId,
    zone: options.zone ?? 'attack_area', visibility: options.faceDown ? { scope: 'owner_only', ownerPlayerId: playerId } : { scope: 'public' },
  });
  state.abilityRuntime!.cardState[id] = {
    active: options.active ?? true,
    faceDown: options.faceDown ?? false,
    playedRound: state.round.roundNumber,
  };
}
function authoringJsonFiles(dir: string): string[] {
  return readdirSync(dir, { withFileTypes: true }).flatMap((entry) => {
    const full = join(dir, entry.name);
    return entry.isDirectory() ? authoringJsonFiles(full) : entry.name.endsWith('.json') ? [full] : [];
  });
}

describe('P3 S R108 Ciel s3 consumer migration', () => {
  it('authors exactly the frozen identity, source hashes, static metadata and accepted contracts', () => {
    const raw = rawArchive();
    expect(raw).toMatchObject({
      schemaVersion: 'fd-card-authoring-v1', archiveType: 'master_rule_definition_archive', id: OWNER, name: '希耶尔',
      sourcePolicy: {
        phase3EvidenceCommit: '59f145434695d29bdd17e4cb3adc887e84182377',
        referenceMetadataCommit: 'b2f9fa15fba07c63530bbf4612b03b8b704755f9',
      },
    });
    expect(raw.cards.map((card: any) => card.id)).toEqual([
      'master.ciel.skill.s1a', 'master.ciel.skill.s2', ID,
    ]);
    const card = raw.cards.find((candidate: any) => candidate.id === ID);
    expect(card).toMatchObject({
      id: ID, aliases: ['s3'], legacyId: 's3', name: '第七圣典', cardType: 'master_skill',
      owner: { type: 'master', id: OWNER }, initialPlacement: 'outside_game',
      cardFace: { typeLabel: '力量', attributes: ['力量'], cost: 3, basePower: 7 },
      playTiming: { phase: 'action', window: 'controller_play_card_window' },
      playRequirements: [{ type: 'skill_zone_mana_at_least', value: 8 }],
      phase3Evidence: {
        f1Commit: '59f145434695d29bdd17e4cb3adc887e84182377',
        f1ClauseSources: [{ document: 'src/content/authoring/cards.json', locator: 'skillCards[39].abilities[0].printedClause', sha256: CLAUSE_SHA }],
        f1FullPrintedTextSha256: FULL_SHA,
        referenceStaticMetadata: {
          commit: 'b2f9fa15fba07c63530bbf4612b03b8b704755f9', legacySkillId: 's3', class: 'Master',
          cost: 3, basePower: 7, legacyRequirement: 3, typeLabel: '力量', attributes: ['力量'],
        },
        acceptedContracts: {
          outsideGameInitialPlacement: 'P3-R43/FB2-18', masterSupportOnlyRegistration: 'P3-R44/FB2-19',
          nextRoundSituationBenefitSuppression: 'P3-R107/FB2-52',
        },
        canonicalSkillZoneManaRequirement: { value: 8, authority: 'final_rules_9.4' },
      },
    });
    expect(card.printedText).toBe(FULL_TEXT);
    expect(hash(card.printedText)).toBe(FULL_SHA);
    expect(card.abilities.map((ability: any) => ability.id)).toEqual(['seventh-scripture.once-per-game', ABILITY]);
    expect(card.abilities.find((ability: any) => ability.id === ABILITY).printedClause).toBe(CLAUSE);
    expect(hash(card.abilities.find((ability: any) => ability.id === ABILITY).printedClause)).toBe(CLAUSE_SHA);
  });

  it('loads blocker-free and uses exactly the accepted FB2-52 whole envelope plus existing per-game limiter', () => {
    const pack = rules.loadAuthoringJson(rawArchive());
    expect(pack.report).toEqual([]);
    const card = pack.cards[ID]!;
    expect(card).toMatchObject({ cardType: 'master_skill', initialPlacement: 'outside_game', mode: 'automatic' });
    const limiter = card.abilities.find((ability) => ability.id === 'seventh-scripture.once-per-game')!;
    expect(limiter).toMatchObject({
      kind: 'passive', activation: { trigger: 'when_play_requirements_checked' },
      limit: { type: 'per_game', uses: 1, scope: 'this_card' }, execution: { mode: 'automatic' },
    });
    const ability = card.abilities.find((candidate) => candidate.id === ABILITY)!;
    expect(rules.isAcceptedNextRoundSituationBenefitSuppressionAbility(ability, 'compiled')).toBe(true);
    expect(ability).toMatchObject({
      kind: 'phase_action', activation: { phase: 'combat', opens: 'controller_combat_action_window' },
      conditions: [{ type: 'source_active' }, { type: 'at_battlefield' }],
      effects: [{
        type: rules.NEXT_ROUND_SITUATION_BENEFIT_SUPPRESSION_EFFECT,
        target: { scope: 'same_battlefield_opponents', where: [{
          type: rules.SITUATION_SUPPRESSION_LUCK_PREDICATE, definitionIds: ['card.cardluck'], zones: ['attack'], activeOnly: true, face: 'up',
        }] },
        roundOffset: 1, benefits: ['situation_mana_gain', 'situation_power_bonus'],
      }],
      execution: { mode: 'automatic' },
    });
  });

  it('enforces the final-rules 7/8 mana boundary, charges cost 3 and contributes printed 7 Power', () => {
    const low = setup(7);
    const before = structuredClone(low);
    expect(play(low).ok).toBe(false);
    expect(low).toEqual(before);

    const state = setup(8);
    expect(play(state).ok).toBe(true);
    expect(state.players[0]!.mana).toBe(5);
    expect(state.cards.find((card) => card.instanceId === SOURCE)).toMatchObject({ zone: 'field', visibility: { scope: 'public' } });
    expect(state.abilityRuntime!.cardState[SOURCE]).toMatchObject({ active: true, faceDown: false, playedRound: state.round.roundNumber });
    const participants = rules.deriveBattleParticipantsFromState(state, 'miyama_town');
    expect(participants.find((participant) => participant.playerId === 'p1')?.totalPower).toBe(7);
  });

  it('marks all and only same-battlefield opponents lacking active face-up Luck for the next round', () => {
    const state = setup();
    expect(play(state).ok).toBe(true);
    addLuck(state, 'p3');
    rules.advanceAbilityPhase(state, 'battle');
    const legal = rules.getLegalActions(state, 'p1').find((candidate) =>
      candidate.type === 'activate_ability' && candidate.cardInstanceId === SOURCE && candidate.abilityId === ABILITY);
    expect(legal).toBeTruthy();
    expect(activate(state).ok).toBe(true);
    expect(state.abilityRuntime!.situationBenefitsSuppressedRoundByPlayer).toEqual({ p2: state.round.roundNumber + 1 });

    const noQualifier = setup();
    expect(play(noQualifier).ok).toBe(true);
    addLuck(noQualifier, 'p2'); addLuck(noQualifier, 'p3');
    rules.advanceAbilityPhase(noQualifier, 'battle');
    expect(rules.getLegalActions(noQualifier, 'p1').some((candidate) =>
      candidate.type === 'activate_ability' && candidate.cardInstanceId === SOURCE && candidate.abilityId === ABILITY)).toBe(false);
  });

  it('suppresses only situation mana and situation combat Power during exactly the marked next round', () => {
    const state = setup();
    expect(play(state).ok).toBe(true);
    state.players[2]!.locationId = 'shinto';
    rules.advanceAbilityPhase(state, 'battle');
    expect(activate(state).ok).toBe(true);
    const markedRound = state.round.roundNumber + 1;
    rules.advanceAbilityPhase(state, 'preparation', markedRound);
    const p2 = state.players.find((player) => player.id === 'p2')!;
    p2.mana = 0;
    expect(rules.grantMana(state, 'p2', 2, { source: 'situation' }).actualAmount).toBe(0);
    expect(p2.mana).toBe(0);
    expect(rules.grantMana(state, 'p2', 2, { source: 'generic' }).actualAmount).toBe(2);
    expect(p2.mana).toBe(2);

    state.currentSituationModifiers = [{ sourceId: 'situation-test', targetTag: '力量', value: 4 }];
    const battle = rules.resolveBattlefield(state, {
      battlefieldId: 'miyama_town',
      participants: [
        { playerId: 'p1', totalPower: 1, attackTags: ['力量'] },
        { playerId: 'p2', totalPower: 1, attackTags: ['力量'] },
      ],
    }).nextState.battleResults.at(-1)!;
    const p1Breakdown = battle.participantBreakdowns?.find((entry) => entry.playerId === 'p1')!;
    const p2Breakdown = battle.participantBreakdowns?.find((entry) => entry.playerId === 'p2')!;
    expect(p1Breakdown.modifiers.some((entry) => entry.source === 'situation' && entry.value === 4)).toBe(true);
    expect(p2Breakdown.modifiers.some((entry) => entry.source === 'situation')).toBe(false);

    state.round.roundNumber = markedRound + 1;
    expect(rules.grantMana(state, 'p2', 1, { source: 'situation' }).actualAmount).toBe(1);
  });

  it('enforces the once-per-game play limit on the same physical card after it returns to skill', () => {
    const state = setup();
    expect(play(state).ok).toBe(true);
    const source = state.cards.find((card) => card.instanceId === SOURCE)!;
    source.zone = 'skill';
    source.visibility = { scope: 'owner_only', ownerPlayerId: 'p1' };
    state.abilityRuntime!.cardState[SOURCE] = { active: false, faceDown: false, playedRound: state.round.roundNumber };
    state.players[0]!.mana = 12;
    state.round.activePhase = 'action';
    expect(rules.getLegalActions(state, 'p1').some((candidate) => candidate.type === 'play_card' && candidate.cardInstanceId === SOURCE)).toBe(false);
    const before = structuredClone(state);
    expect(play(state).ok).toBe(false);
    expect(state).toEqual(before);
  });

  it('registers s3 only in the existing rules-only executable surface and is the sole frozen +1', () => {
    const manifest = JSON.parse(readFileSync(resolve(ROOT, 'data/packs/fd-playtest-v1/pack.json'), 'utf8'));
    expect(manifest.authoringMasterRuleFiles).toContain('data/authoring/masters/master.ciel.json');
    expect(JSON.stringify(manifest)).not.toContain(ID);

    const generated = JSON.parse(readFileSync(resolve(ROOT, 'data/generated/fd-playtest-v1.content-library.json'), 'utf8'));
    expect(generated.cards.some((card: any) => card.id === ID)).toBe(false);
    expect(generated.masters.some((master: any) => master.id === OWNER)).toBe(false);
    expect(generated.rules.cards[ID]).toMatchObject({
      id: ID, ownerId: OWNER, cardType: 'master_skill', initialPlacement: 'outside_game',
      cardFace: { typeLabel: '力量', cost: 3, basePower: 7, attributes: ['力量'] },
      playKind: 'support', destinationZone: 'field', mode: 'automatic',
    });
    expect(generated.rules.characters[OWNER]).toBeUndefined();
    expect(generated.rules.decks[OWNER]).toBeUndefined();
    expect(generated.rules.fallbackCommandSpells[OWNER]).toBeUndefined();
    expect(generated.rules.sourceMap[ID]).toMatchObject({ archiveId: OWNER, cardIndex: 2 });

    const inventory = JSON.parse(readFileSync(resolve(ROOT, 'data/phase3/full-roster-ability-inventory.json'), 'utf8'));
    const frozen = new Set<string>([
      ...inventory.staticSkills.map((entry: any) => entry.canonicalAbilityId),
      ...inventory.dynamicSkills.map((entry: any) => entry.canonicalAbilityId),
    ]);
    const counts = new Map<string, number>();
    for (const file of authoringJsonFiles(resolve(ROOT, 'data/authoring'))) {
      const archive = JSON.parse(readFileSync(file, 'utf8').replace(/^\uFEFF/, ''));
      for (const card of archive.cards ?? []) counts.set(card.id, (counts.get(card.id) ?? 0) + 1);
    }
    const overlap = [...counts.keys()].filter((id) => frozen.has(id));
    const duplicateFrozen = [...counts.entries()].filter(([id, count]) => frozen.has(id) && count > 1);
    expect(frozen.size).toBe(944);
    expect(overlap).toHaveLength(149);
    expect(duplicateFrozen).toEqual([]);
    expect(counts.get(ID)).toBe(1);
  });
});
