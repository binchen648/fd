import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';
import * as rules from '../../src/index';
import type { GameState } from '../../src/schema/game';

const archive = JSON.parse(readFileSync('data/authoring/masters/master.sion.json', 'utf8'));
const inventory = JSON.parse(readFileSync('data/phase3/full-roster-ability-inventory.json', 'utf8'));
const generated = JSON.parse(readFileSync('data/generated/fd-playtest-v1.content-library.json', 'utf8'));
const evidence = JSON.parse(readFileSync('data/generated/fd-playtest-v1.evidence-report.json', 'utf8'));
const packManifest = JSON.parse(readFileSync('data/packs/fd-playtest-v1/pack.json', 'utf8'));
function setup(): { state: GameState; pack: ReturnType<typeof rules.loadAuthoringJson> } {
  const pack = rules.loadAuthoringJson(archive);
  const state = rules.createSeededGameState(); state.cards = [];
  state.players[0]!.masterCardId = 'master.sion'; state.players[0]!.locationId = 'shinto'; state.round.activePhase = 'action'; state.round.prioritySeat = state.players[0]!.seat;
  rules.initializeAbilityRuntime(state, pack, { seed: 20261020 });
  state.players[0]!.servantCardId = 'servant.fixture';
  state.abilityRuntime!.pack.characters = {
    'servant.fixture': { id: 'servant.fixture', name: 'Fixture Saber', kind: 'servant', class: 'Saber', cardIds: [], publicInformation: {} },
  };
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

  it('keeps frozen source SHA, generated sourceMap, pack inclusion, and evidence aligned', () => {
    expect(packManifest.authoringMasterFiles).toContain('data/authoring/masters/master.sion.json');
    const sourceMap = generated.rules.sourceMap as Record<string, { archiveId: string; path: string }>;
    const sionEvidence = (evidence.entities as Array<{ entityId: string }>).filter((entry) => entry.entityId.startsWith('master.sion.skill.'));
    expect(sionEvidence).toHaveLength(18);
    for (const row of inventory.staticSkills.filter((entry: any) => entry.ownerId === 'master.sion')) {
      const card = archive.cards.find((entry: any) => entry.id === row.canonicalAbilityId);
      expect(card.phase3Evidence.sourceTextSha256).toBe(row.clauses[0].source.sha256);
      expect(sourceMap[row.canonicalAbilityId]?.archiveId).toBe('master.sion');
      expect(sourceMap[`${row.canonicalAbilityId}#${card.abilities[0].id}`]?.archiveId).toBe('master.sion');
      expect(sourceMap[`${row.canonicalAbilityId}#${card.abilities[0].id}`]?.path).toMatch(/^archives\[\d+\]\.cards\[\d+\]\.abilities\[0\]$/);
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
    const discard = add(paid.state, 'basic.fixture', 'discard', true);
    paid.state.abilityRuntime!.pack.cards['basic.fixture'] = { id: 'basic.fixture', name: 'basic', cardType: 'basic_attack', cardFace: { attributes: ['力量'], cost: 0, basePower: 1 }, playTiming: { phase: 'action', window: 'controller_play_card_window' }, playRequirements: [], abilities: [], mode: 'automatic' } as any;
    paid.state.players[0]!.vp = 2;
    expect(rules.dispatchAbilityCommand(paid.state, 'p1', { type: 'activate_ability', cardInstanceId: paidSource, abilityId: 'sion.s13.avenger' }).ok).toBe(true);
    const decision = paid.state.abilityRuntime!.pendingDecision!;
    expect(rules.dispatchAbilityCommand(paid.state, 'p1', { type: 'choose_target', decisionId: decision.id, selectedIds: [discard] }).ok).toBe(true);
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

  it('rewards only an opponent first face-up Noble Phantasm release, including when s2 activates later', () => {
    const { state } = setup();
    state.players[1]!.locationId = 'shinto';
    state.abilityRuntime!.pack.cards['fixture.np'] = {
      id: 'fixture.np', name: 'fixture np', cardType: 'basic_attack',
      cardFace: { attributes: ['宝具'], cost: 0, basePower: 1 },
      playTiming: { phase: 'battle', window: 'controller_play_card_window' }, playRequirements: [], abilities: [], mode: 'automatic',
    } as any;
    const addOpponentNp = (suffix: string): string => {
      const instanceId = `fixture.np:p2:${suffix}`;
      state.cards.push({ instanceId, definitionId: 'fixture.np', ownerPlayerId: 'p2', controllerPlayerId: 'p2', zone: 'attack_area', visibility: { scope: 'public' } });
      state.abilityRuntime!.cardState[instanceId] = { active: true, faceDown: false, playedRound: state.round.roundNumber };
      return instanceId;
    };
    const first = addOpponentNp('first');
    state.abilityRuntime!.cardState[first]!.faceDown = true;
    rules.processAbilityEvent(state, { id: 'sion-np-hidden', type: 'on_card_played', playerId: 'p2', sourceCardId: first });
    expect(state.abilityRuntime!.sion!.trueNameReleasedByPlayer?.p2).toBeUndefined();
    state.abilityRuntime!.cardState[first]!.faceDown = false;
    rules.processAbilityEvent(state, { id: 'sion-np-first', type: 'on_card_played', playerId: 'p2', sourceCardId: first });
    expect(state.abilityRuntime!.sion!.trueNameReleasedByPlayer?.p2).toBe(true);
    const source = add(state, 'master.sion.skill.s2', 'field', true);
    expect(state.players[0]!.vp).toBe(0);
    expect(state.abilityRuntime!.sion!.experience[source]).toBeUndefined();
    const second = addOpponentNp('second');
    rules.processAbilityEvent(state, { id: 'sion-np-second', type: 'on_card_played', playerId: 'p2', sourceCardId: second });
    expect(state.players[0]!.vp).toBe(0);
    expect(state.abilityRuntime!.sion!.experience[source]).toBeUndefined();
  });

  it('rewards the first opponent release at the shared location and restores the consumed first-release state', () => {
    const session = rules.createMatchSession({ seed: 20261020, humanPlayerId: 'p1', humanPlayerIds: ['p1', 'p2'] });
    const live = (session as unknown as { state: GameState }).state;
    live.players[0]!.locationId = 'shinto'; live.players[1]!.locationId = 'shinto';
    live.abilityRuntime!.pack.cards['fixture.np'] = {
      id: 'fixture.np', name: 'fixture np', cardType: 'basic_attack',
      cardFace: { attributes: ['宝具'], cost: 0, basePower: 1 },
      playTiming: { phase: 'battle', window: 'controller_play_card_window' }, playRequirements: [], abilities: [], mode: 'automatic',
    } as any;
    const source = `restore-sion-s2:${live.cards.length}`;
    live.cards.push({ instanceId: source, definitionId: 'master.sion.skill.s2', ownerPlayerId: 'p1', controllerPlayerId: 'p1', zone: 'field', visibility: { scope: 'public' } });
    live.abilityRuntime!.cardState[source] = { active: true, faceDown: false, playedRound: live.round.roundNumber };
    const first = `restore-np:first:${live.cards.length}`;
    live.cards.push({ instanceId: first, definitionId: 'fixture.np', ownerPlayerId: 'p2', controllerPlayerId: 'p2', zone: 'attack_area', visibility: { scope: 'public' } });
    live.abilityRuntime!.cardState[first] = { active: true, faceDown: false, playedRound: live.round.roundNumber };
    rules.processAbilityEvent(live, { id: 'restore-sion-np-first', type: 'on_card_played', playerId: 'p2', sourceCardId: first });
    expect(live.players[0]!.vp).toBe(1);
    expect(live.abilityRuntime!.sion!.experience[source]).toBe(1);
    const durable = session.serializeSession();
    const restored = rules.restoreMatchSession(durable, { restorePackKind: 'trusted_authoring_fixture' });
    const restoredLive = (restored as unknown as { state: GameState }).state;
    expect(restoredLive.abilityRuntime!.sion!.trueNameReleasedByPlayer?.p2).toBe(true);
    const second = `restore-np:second:${restoredLive.cards.length}`;
    restoredLive.cards.push({ instanceId: second, definitionId: 'fixture.np', ownerPlayerId: 'p2', controllerPlayerId: 'p2', zone: 'attack_area', visibility: { scope: 'public' } });
    restoredLive.abilityRuntime!.cardState[second] = { active: true, faceDown: false, playedRound: restoredLive.round.roundNumber };
    rules.processAbilityEvent(restoredLive, { id: 'restore-sion-np-second', type: 'on_card_played', playerId: 'p2', sourceCardId: second });
    expect(restoredLive.players[0]!.vp).toBe(1);
    expect(restoredLive.abilityRuntime!.sion!.experience[source]).toBe(1);
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
    expect(rules.calculateCardPower(state, attack).value).toBe(2);
    expect(rules.deriveBattleParticipantsFromState(state, 'magic_workshop').find((entry) => entry.playerId === 'p1')?.totalPower).toBe(3);

    const concealment = add(state, 'master.sion.skill.s10', 'field', true);
    rules.processAbilityEvent(state, { id: 'sion-concealment-loss', type: 'after_controller_loses_battle', playerId: 'p1' });
    expect(state.cards.find((card) => card.instanceId === concealment)?.zone).toBe('removed_from_game');
    expect(state.abilityRuntime!.cardState[concealment]?.active).toBe(false);
    expect(state.cards.find((card) => card.instanceId === territory)?.zone).toBe('field');
  });

  it('uses production choices for riding, abyss, ruler cooldown, and training consumption', () => {
    const { state } = setup();
    const s1 = add(state, 'master.sion.skill.s1', 'field', true);
    const covered = add(state, 'servant.fixture.skill', 'skill', true);
    const cafeteriaCovered = add(state, 'servant.fixture.skill.cafeteria', 'skill', true);
    const gymCovered = add(state, 'servant.fixture.skill.gym', 'skill', true);
    rules.executeAbility(state, { controllerId: 'p1', sourceCardId: s1, abilityId: 'sion.s1.training', variables: {}, selections: {} });
    const library = state.cards.find((card) => card.definitionId === 'master.sion.skill.s2')!;
    state.round.activePhase = 'preparation'; state.abilityRuntime!.sion!.experience[library.instanceId] = 2;
    expect(rules.dispatchAbilityCommand(state, 'p1', { type: 'activate_ability', cardInstanceId: library.instanceId, abilityId: 'sion.s2.library' }).ok).toBe(true);
    expect((state.abilityRuntime!.cardState[covered] as any).sionCostReduction).toBe(1);
    expect(state.cards.find((card) => card.instanceId === library.instanceId)?.zone).toBe('removed_from_game');
    const cafeteria = state.cards.find((card) => card.definitionId === 'master.sion.skill.s3')!;
    state.abilityRuntime!.sion!.experience[cafeteria.instanceId] = 2;
    expect(rules.dispatchAbilityCommand(state, 'p1', { type: 'activate_ability', cardInstanceId: cafeteria.instanceId, abilityId: 'sion.s3.cafeteria' }).ok).toBe(true);
    expect(state.cards.find((card) => card.instanceId === cafeteriaCovered)?.definitionId).toBe('master.sion.skill.s5');
    expect(state.abilityRuntime!.sion!.transformedTraining[cafeteriaCovered]).toBe('master.sion.skill.s5');
    expect(state.abilityRuntime!.sion!.exProvenance[cafeteriaCovered]).toMatchObject({
      originalDefinitionId: 'servant.fixture.skill.cafeteria', exDefinitionId: 'master.sion.skill.s5', servantClass: 'Saber',
      sourcePath: 'chm-extract/【EX技能_】.htm', sourceSha256: '0405961CA3309871E6BEE5965BCE2EC7CB23C419B7374C30FBF4302491695344', imageIndex: 1,
      imagePath: '图包/ScreenShot_2025-10-30_192904_202.png',
    });
    expect(state.abilityRuntime!.cardState[cafeteriaCovered]!.sionExAlias?.originalDefinitionId).toBe('servant.fixture.skill.cafeteria');
    expect(rules.projectAbilityState(state, 'p1').cards.find((card) => card.instanceId === cafeteriaCovered)?.definitionAliasIds).toEqual(['servant.fixture.skill.cafeteria']);
    expect(state.cards.find((card) => card.instanceId === cafeteria.instanceId)?.zone).toBe('removed_from_game');
    expect(rules.isSionCoveredCard(state, cafeteriaCovered)).toBe(false);
    const gym = state.cards.find((card) => card.definitionId === 'master.sion.skill.s4')!;
    state.abilityRuntime!.sion!.experience[gym.instanceId] = 2;
    expect(rules.dispatchAbilityCommand(state, 'p1', { type: 'activate_ability', cardInstanceId: gym.instanceId, abilityId: 'sion.s4.gym' }).ok).toBe(true);
    const gymDecision = state.abilityRuntime!.pendingDecision!;
    expect(rules.dispatchAbilityCommand(state, 'p1', { type: 'choose_target', decisionId: gymDecision.id, selectedIds: ['attack_strength'] }).ok).toBe(true);
    expect(state.cards.some((card) => card.generatedBy === gym.instanceId && card.zone === 'hand' && state.abilityRuntime!.pack.cards[card.definitionId]?.cardFace.basePower === 5)).toBe(true);

    state.abilityRuntime!.pack.cards['basic.fixture'] = { id: 'basic.fixture', name: 'basic', cardType: 'basic_attack', cardFace: { attributes: ['力量'], cost: 0, basePower: 1 }, playTiming: { phase: 'action', window: 'controller_play_card_window' }, playRequirements: [], abilities: [], mode: 'automatic' } as any;
    state.round.activePhase = 'action'; const riding = add(state, 'master.sion.skill.s8', 'field', true); const hand = add(state, 'basic.fixture', 'hand', true);
    rules.executeAbility(state, { controllerId: 'p1', sourceCardId: riding, abilityId: 'sion.s8.riding', variables: {}, selections: {} });
    const rideDecision = state.abilityRuntime!.pendingDecision!;
    expect(rideDecision.interaction?.kind).toBe('sion_choice_v1');
    expect(rules.dispatchAbilityCommand(state, 'p1', { type: 'choose_target', decisionId: rideDecision.id, selectedIds: [hand] }).ok).toBe(true);
    expect(state.cards.find((card) => card.instanceId === hand)?.zone).toBe('attack_area');

    const abyss = add(state, 'master.sion.skill.s16', 'field', true); const p2Hand = `${'fixture.hand'}:p2`;
    state.cards.push({ instanceId: p2Hand, definitionId: 'basic.fixture', ownerPlayerId: 'p2', controllerPlayerId: 'p2', zone: 'hand', visibility: { scope: 'owner_only', ownerPlayerId: 'p2' } });
    state.players[1]!.locationId = 'shinto'; state.players[1]!.mana = 0; state.players[0]!.mana = 2;
    rules.executeAbility(state, { controllerId: 'p1', sourceCardId: abyss, abilityId: 'sion.s16.abyss', variables: {}, selections: {} });
    const abyssDecision = state.abilityRuntime!.pendingDecision!;
    expect(rules.dispatchAbilityCommand(state, 'p1', { type: 'choose_target', decisionId: abyssDecision.id, selectedIds: ['all_players'] }).ok).toBe(true);
    expect(state.cards.find((card) => card.instanceId === p2Hand)?.zone).toBe('discard');
  });

  it('binds every sourced class EX identity and fails closed for an unsupported class', () => {
    const mappings = [
      ['Saber', 's5', 1], ['Lancer', 's6', 2], ['Archer', 's7', 3], ['Rider', 's8', 4],
      ['Caster', 's9', 5], ['Assassin', 's10', 6], ['Berserker', 's11', 7], ['Ruler', 's14', 8],
      ['AlterEgo', 's12', 9], ['Avenger', 's13', 10], ['Foreigner', 's16', 11], ['MoonCancer', 's15', 14],
    ] as const;
    for (const [classTag, exId, imageIndex] of mappings) {
      const { state } = setup();
      state.abilityRuntime!.pack.characters!['servant.fixture']!.class = classTag;
      const s1 = add(state, 'master.sion.skill.s1', 'field', true);
      add(state, `servant.fixture.skill.${classTag}`, 'skill', true);
      const covered = add(state, `servant.fixture.skill.${classTag}.cafeteria`, 'skill', true);
      add(state, `servant.fixture.skill.${classTag}.second`, 'skill', true);
      add(state, `servant.fixture.skill.${classTag}.third`, 'skill', true);
      rules.executeAbility(state, { controllerId: 'p1', sourceCardId: s1, abilityId: 'sion.s1.training', variables: {}, selections: {} });
      const cafeteria = state.cards.find((card) => card.definitionId === 'master.sion.skill.s3')!;
      state.round.activePhase = 'preparation'; state.abilityRuntime!.sion!.experience[cafeteria.instanceId] = 2;
      expect(rules.dispatchAbilityCommand(state, 'p1', { type: 'activate_ability', cardInstanceId: cafeteria.instanceId, abilityId: 'sion.s3.cafeteria' }).ok).toBe(true);
      const expectedDefinitionId = exId === 's15' ? `servant.fixture.skill.${classTag}.cafeteria` : `master.sion.skill.${exId}`;
      expect(state.cards.find((card) => card.instanceId === covered)?.definitionId).toBe(expectedDefinitionId);
      expect(state.abilityRuntime!.sion!.exProvenance[covered]).toMatchObject({ servantClass: classTag, imageIndex, exDefinitionId: `master.sion.skill.${exId}`, resolution: exId === 's15' ? 'obtained' : 'replaced' });
      if (exId === 's15') {
        expect(state.abilityRuntime!.cardState[covered]!.sionExAlias).toBeUndefined();
        const restored = structuredClone(state);
        expect(rules.projectAbilityState(restored, 'p1').cards.find((card) => card.instanceId === covered)).toMatchObject({
          definitionId: `servant.fixture.skill.${classTag}.cafeteria`, zone: 'skill',
        });
        expect(rules.projectAbilityState(restored, 'p1').cards.find((card) => card.instanceId === covered)?.definitionAliasIds).toBeUndefined();
        expect(rules.projectAbilityState(restored, 'p2').cards.some((card) => card.instanceId === covered)).toBe(false);
      } else expect(state.abilityRuntime!.cardState[covered]!.sionExAlias?.originalDefinitionId).toBe(`servant.fixture.skill.${classTag}.cafeteria`);
    }
    const unsupported = setup();
    unsupported.state.abilityRuntime!.pack.characters!['servant.fixture']!.class = 'Shielder';
    const s1 = add(unsupported.state, 'master.sion.skill.s1', 'field', true);
    add(unsupported.state, 'servant.fixture.skill', 'skill', true); const target = add(unsupported.state, 'servant.fixture.skill.2', 'skill', true); add(unsupported.state, 'servant.fixture.skill.3', 'skill', true);
    rules.executeAbility(unsupported.state, { controllerId: 'p1', sourceCardId: s1, abilityId: 'sion.s1.training', variables: {}, selections: {} });
    const cafeteria = unsupported.state.cards.find((card) => card.definitionId === 'master.sion.skill.s3')!;
    unsupported.state.round.activePhase = 'preparation'; unsupported.state.abilityRuntime!.sion!.experience[cafeteria.instanceId] = 2;
    expect(rules.dispatchAbilityCommand(unsupported.state, 'p1', { type: 'activate_ability', cardInstanceId: cafeteria.instanceId, abilityId: 'sion.s3.cafeteria' }).ok).toBe(false);
    expect(unsupported.state.cards.find((card) => card.instanceId === target)?.definitionId).toBe('servant.fixture.skill.2');
  });

  it('restores the MoonCancer obtain branch with owner/private projections intact', () => {
    const session = rules.createMatchSession({ seed: 20261020, humanPlayerId: 'p1', humanPlayerIds: ['p1', 'p2'] });
    const state = (session as unknown as { state: GameState }).state;
    const character = {
      id: 'servant.fixture', name: 'Fixture MoonCancer', kind: 'servant' as const, class: 'MoonCancer',
      cardIds: ['servant.artoria-alt.skill.sc-artoria-alt-1', 'servant.artoria-alt.skill.sc-artoria-alt-2', 'servant.artoria-alt.skill.sc-artoria-alt-3'], publicInformation: {},
    };
    state.abilityRuntime!.pack.characters!['servant.fixture'] = character;
    state.players[0]!.masterCardId = 'master.sion'; state.players[0]!.servantCardId = 'servant.fixture';
    state.round.activePhase = 'action'; state.round.prioritySeat = state.players[0]!.seat;
    for (const card of state.cards.filter((entry) => entry.ownerPlayerId === 'p1' && entry.zone === 'skill' && entry.definitionId.startsWith('servant.'))) card.zone = 'discard';
    const addProduction = (definitionId: string, zone: string, active = true): string => {
      const instanceId = `restore-sion:${state.cards.length}:${definitionId}`;
      state.cards.push({ instanceId, definitionId, ownerPlayerId: 'p1', controllerPlayerId: 'p1', zone, visibility: zone === 'field' ? { scope: 'public' } : { scope: 'owner_only', ownerPlayerId: 'p1' } });
      state.abilityRuntime!.cardState[instanceId] = { active, faceDown: false, playedRound: state.round.roundNumber };
      return instanceId;
    };
    const source = addProduction('master.sion.skill.s1', 'field');
    addProduction('servant.artoria-alt.skill.sc-artoria-alt-1', 'skill', false);
    const covered = addProduction('servant.artoria-alt.skill.sc-artoria-alt-2', 'skill', false);
    addProduction('servant.artoria-alt.skill.sc-artoria-alt-3', 'skill', false);
    rules.executeAbility(state, { controllerId: 'p1', sourceCardId: source, abilityId: 'sion.s1.training', variables: {}, selections: {} });
    const cafeteria = state.cards.find((card) => card.definitionId === 'master.sion.skill.s3')!;
    state.round.activePhase = 'preparation'; state.abilityRuntime!.sion!.experience[cafeteria.instanceId] = 2;
    expect(rules.dispatchAbilityCommand(state, 'p1', { type: 'activate_ability', cardInstanceId: cafeteria.instanceId, abilityId: 'sion.s3.cafeteria' }).ok).toBe(true);
    const obtained = state.cards.find((card) => card.definitionId === 'master.sion.skill.s15' && card.generatedBy === cafeteria.instanceId);
    expect(obtained).toMatchObject({ ownerPlayerId: 'p1', controllerPlayerId: 'p1', zone: 'skill', visibility: { scope: 'owner_only', ownerPlayerId: 'p1' } });
    expect(state.abilityRuntime!.sion!.exProvenance[obtained!.instanceId]).toMatchObject({ exDefinitionId: 'master.sion.skill.s15', resolution: 'obtained' });
    expect(rules.projectAbilityState(state, 'p1').cards.find((card) => card.instanceId === obtained!.instanceId)?.definitionId).toBe('master.sion.skill.s15');
    expect(rules.projectAbilityState(state, 'p2').cards.some((card) => card.instanceId === obtained!.instanceId)).toBe(false);
    const durable = session.serializeSession();
    const restored = rules.restoreMatchSession(durable, { restorePackKind: 'trusted_authoring_fixture' });
    const restoredState = restored.getState();
    expect(restoredState.cards.find((card) => card.instanceId === covered)?.definitionId).toBe('servant.artoria-alt.skill.sc-artoria-alt-2');
    expect(restoredState.abilityRuntime!.sion!.exProvenance[covered]).toMatchObject({ exDefinitionId: 'master.sion.skill.s15', resolution: 'obtained' });
    expect(rules.projectAbilityState(restoredState, 'p1').cards.find((card) => card.instanceId === covered)?.definitionId).toBe('servant.artoria-alt.skill.sc-artoria-alt-2');
    expect(rules.projectAbilityState(restoredState, 'p2').cards.some((card) => card.instanceId === covered)).toBe(false);
    const restoredLive = (restored as unknown as { state: GameState }).state;
    const restoredEx = restoredLive.cards.find((card) => card.instanceId === obtained!.instanceId)!;
    restoredEx.zone = 'field'; restoredEx.visibility = { scope: 'public' };
    restoredLive.abilityRuntime!.cardState[restoredEx.instanceId]!.active = true;
    restoredLive.round.activePhase = 'combat'; restoredLive.locationConfig.enabledLocationIds = ['miyama_town', 'shinto', 'magic_workshop', 'recon', 'moon_holy_grail']; restoredLive.players[1]!.locationId = 'moon_holy_grail';
    const restartResult = restored.dispatchPlayerAction('p1', { type: 'activate_ability', cardInstanceId: restoredEx.instanceId, abilityId: 'sion.s15.restart' });
    expect(restartResult.ok).toBe(true);
    expect(restoredLive.abilityRuntime!.sion!.restartUsed[restoredEx.instanceId]).toBe(true);
  });

  it('applies Aether opponent reveal/draw/luck defeat and leaves no silent fallback', () => {
    const { state } = setup();
    const aether = add(state, 'master.sion.skill.s17', 'field', true);
    state.players[0]!.locationId = 'shinto'; state.players[1]!.locationId = 'shinto';
    const lucky = 'fixture.lucky:p2'; const deck = 'fixture.deck:p2';
    state.cards.push(
      { instanceId: lucky, definitionId: 'fixture.lucky', ownerPlayerId: 'p2', controllerPlayerId: 'p2', zone: 'hand', visibility: { scope: 'owner_only', ownerPlayerId: 'p2' } },
      { instanceId: deck, definitionId: 'fixture.deck', ownerPlayerId: 'p2', controllerPlayerId: 'p2', zone: 'deck', visibility: { scope: 'owner_only', ownerPlayerId: 'p2' } },
    );
    state.abilityRuntime!.pack.cards['fixture.lucky'] = { id: 'fixture.lucky', name: 'lucky', cardType: 'basic_attack', cardFace: { attributes: ['幸运'], cost: 0, basePower: 1 }, playTiming: { phase: 'battle', window: 'controller_play_card_window' }, playRequirements: [], abilities: [], mode: 'automatic' } as any;
    state.abilityRuntime!.pack.cards['fixture.deck'] = state.abilityRuntime!.pack.cards['fixture.lucky'];
    state.round.activePhase = 'battle'; rules.executeAbility(state, { controllerId: 'p1', sourceCardId: aether, abilityId: 'sion.s17.aether', variables: {}, selections: {} });
    expect(state.players[1]!.status).toBe('eliminated');
    expect(state.cards.find((card) => card.instanceId === lucky)?.visibility.scope).toBe('public');
    expect(state.cards.find((card) => card.instanceId === deck)?.zone).toBe('hand');
  });

  it('restore-validates Sion continuation, owner/controller, source lifecycle, and candidate freshness', () => {
    const { state } = setup();
    state.abilityRuntime!.pack.cards['basic.restore'] = { id: 'basic.restore', name: 'restore', cardType: 'basic_attack', cardFace: { attributes: ['力量'], cost: 0, basePower: 1 }, playTiming: { phase: 'action', window: 'controller_play_card_window' }, playRequirements: [], abilities: [], mode: 'automatic' } as any;
    const source = add(state, 'master.sion.skill.s8', 'field', true); add(state, 'basic.restore', 'hand', true);
    expect(rules.dispatchAbilityCommand(state, 'p1', { type: 'activate_ability', cardInstanceId: source, abilityId: 'sion.s8.riding' }).ok).toBe(true);
    const decision = state.abilityRuntime!.pendingDecision!;
    expect(rules.isCanonicalGenericPendingDecisionForRestore(state, decision)).toBe(true);
    const forged = structuredClone(decision); forged.controllerId = 'p2';
    expect(rules.isCanonicalGenericPendingDecisionForRestore(state, forged)).toBe(false);
    const crossSession = structuredClone(decision); crossSession.context.sourceCardId = 'other-session-source';
    expect(rules.isCanonicalGenericPendingDecisionForRestore(state, crossSession)).toBe(false);
    const stale = structuredClone(decision); state.cards.find((card) => card.instanceId === source)!.zone = 'skill';
    expect(rules.isCanonicalGenericPendingDecisionForRestore(state, stale)).toBe(false);
  });

  it('resolves Berserk random count and Restart redeployment/event discard through production commands', () => {
    const { state } = setup();
    state.locationConfig.enabledLocationIds = ['miyama_town', 'shinto', 'magic_workshop', 'recon', 'moon_holy_grail'];
    state.round.activePhase = 'action';
    const berserk = add(state, 'master.sion.skill.s11', 'field', true);
    for (let i = 0; i < 3; i += 1) add(state, `fixture.deck.${i}`, 'deck', false);
    expect(rules.dispatchAbilityCommand(state, 'p1', { type: 'activate_ability', cardInstanceId: berserk, abilityId: 'sion.s11.berserk' }).ok).toBe(true);
    const berserkDecision = state.abilityRuntime!.pendingDecision!;
    expect(rules.dispatchAbilityCommand(state, 'p1', { type: 'choose_target', decisionId: berserkDecision.id, selectedIds: ['2'] }).ok).toBe(true);
    expect(state.cards.filter((card) => card.zone === 'removed_from_game' && card.definitionId.startsWith('fixture.deck.'))).toHaveLength(2);
    expect(state.abilityRuntime!.cardState[berserk]?.roundPowerBonus?.amount).toBe(8);

    state.round.activePhase = 'combat';
    const restart = add(state, 'master.sion.skill.s15', 'field', true);
    state.players[1]!.locationId = 'moon_holy_grail';
    state.eventPlacements.push({ locationId: 'moon_holy_grail', eventCardId: 'fixture.event', visibility: { scope: 'public' } });
    expect(rules.dispatchAbilityCommand(state, 'p1', { type: 'activate_ability', cardInstanceId: restart, abilityId: 'sion.s15.restart' }).ok).toBe(true);
    expect(state.players[1]!.locationId).not.toBe('moon_holy_grail');
    expect(state.eventPlacements).toHaveLength(0);
    expect(state.eventDiscardPile?.map((event) => event.eventCardId)).toEqual(['fixture.event']);
    expect(rules.dispatchAbilityCommand(state, 'p1', { type: 'activate_ability', cardInstanceId: restart, abilityId: 'sion.s15.restart' }).ok).toBe(false);
  });
});

function packIds(): Set<string> {
  return new Set((archive.cards as Array<{ id: string }>).map((entry) => entry.id));
}
