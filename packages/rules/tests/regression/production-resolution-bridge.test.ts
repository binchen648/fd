import { resolve } from 'node:path';

import { compileLoadedPlaytestPack, loadPlaytestContentPack } from '@fd/content';
import { describe, expect, it } from 'vitest';

import { compileExecutableCardPack } from '../../src/ability/executable-card-pack';
import { createMatchSession } from '../../src/match-session';

const workspaceRoot = resolve('.');
const packPath = resolve('data/packs/fd-playtest-v1/pack.json');
const goldenCardId = 'servant.kintoki.skill.sc-kintoki-3';
const goldenAbilityId = 'sc-kintoki-3.golden-eater';

function installGoldenFixture() {
  const loaded = loadPlaytestContentPack(packPath, { workspaceRoot });
  const library = compileLoadedPlaytestPack(loaded).library;
  const executable = compileExecutableCardPack(library);
  const session = createMatchSession({ seed: 20260912, humanPlayerId: 'p1', humanPlayerIds: ['p1', 'p2'] });
  const runtime = session.state.abilityRuntime!;
  const sourceInstanceId = 'p1-golden-eater-b11';
  const firstTargetInstanceId = 'p1-golden-impact-1-removed';
  const secondTargetInstanceId = 'p1-golden-impact-2-removed';

  session.state.round = { roundNumber: 4, activePhase: 'battle', prioritySeat: 1 };
  session.state.players.find((player) => player.id === 'p1')!.locationId = 'miyama_town';
  session.state.players.find((player) => player.id === 'p1')!.mana = 12;
  runtime.pack.cards[goldenCardId] = executable.cards[goldenCardId]!;
  session.state.cards.push({
    instanceId: sourceInstanceId,
    definitionId: goldenCardId,
    ownerPlayerId: 'p1',
    controllerPlayerId: 'p1',
    zone: 'attack_area',
    visibility: { scope: 'public' },
  }, {
    instanceId: firstTargetInstanceId,
    definitionId: 'servant.kintoki.skill.sc-kintoki-1',
    ownerPlayerId: 'p1',
    controllerPlayerId: 'p1',
    zone: 'removed_from_game',
    visibility: { scope: 'public' },
  }, {
    instanceId: secondTargetInstanceId,
    definitionId: 'servant.kintoki.skill.sc-kintoki-2',
    ownerPlayerId: 'p1',
    controllerPlayerId: 'p1',
    zone: 'removed_from_game',
    visibility: { scope: 'public' },
  });
  runtime.cardState[sourceInstanceId] = { active: true, faceDown: false, playedRound: 4 };
  runtime.cardState[firstTargetInstanceId] = { active: false, faceDown: false, playedRound: 1 };
  runtime.cardState[secondTargetInstanceId] = { active: false, faceDown: false, playedRound: 1 };

  return { session, sourceInstanceId, firstTargetInstanceId, secondTargetInstanceId };
}

function loadGoldenAuthoringLibrary() {
  const loaded = loadPlaytestContentPack(packPath, { workspaceRoot });
  return compileLoadedPlaytestPack(loaded).library;
}

function mutateGoldenAbility(mutator: (ability: Record<string, any>) => void) {
  const library = structuredClone(loadGoldenAuthoringLibrary()) as any;
  const archive = library.rules.archives.find((candidate: any) => candidate.cards.some((card: any) => card.id === goldenCardId));
  const card = archive.cards.find((candidate: any) => candidate.id === goldenCardId);
  const ability = card.abilities.find((candidate: any) => candidate.id === goldenAbilityId);
  mutator(ability);
  return library;
}

describe('P3-B11 result binding production bridge', () => {
  it('routes Golden Eater through typed staged result binding in MatchSession', () => {
    const { session, sourceInstanceId, firstTargetInstanceId, secondTargetInstanceId } = installGoldenFixture();

    const activation = session.dispatchPlayerAction('p1', {
      type: 'activate_ability', cardInstanceId: sourceInstanceId, abilityId: goldenAbilityId,
    });
    expect(activation.ok).toBe(true);
    const firstDecisionId = session.getPlayerView('p1').pendingDecision!.id;
    expect(session.getPlayerView('p1').pendingDecision?.candidates).toEqual([firstTargetInstanceId, secondTargetInstanceId]);

    const firstStage = session.dispatchPlayerAction('p1', {
      type: 'choose_target', decisionId: firstDecisionId, selectedIds: [firstTargetInstanceId],
    });
    expect(firstStage.ok).toBe(true);
    expect(session.state.cards.find((card) => card.instanceId === firstTargetInstanceId)?.zone).toBe('skill');
    expect(session.state.players.find((player) => player.id === 'p1')?.vp).toBe(2);
    expect(session.getPlayerView('p1').pendingDecision?.candidates).toEqual([secondTargetInstanceId]);

    const afterFirstStage = structuredClone(session.state);
    const staleReplay = session.dispatchPlayerAction('p1', {
      type: 'choose_target', decisionId: firstDecisionId, selectedIds: [firstTargetInstanceId],
    });
    expect(staleReplay.ok).toBe(false);
    expect(session.state).toEqual(afterFirstStage);

    const secondStage = session.dispatchPlayerAction('p1', {
      type: 'choose_target', decisionId: session.getPlayerView('p1').pendingDecision!.id, selectedIds: [secondTargetInstanceId],
    });
    expect(secondStage.ok).toBe(true);
    expect(session.state.cards.find((card) => card.instanceId === secondTargetInstanceId)?.zone).toBe('skill');
    expect(session.state.players.find((player) => player.id === 'p1')?.vp).toBe(4);
    expect(session.state.players.find((player) => player.id === 'p1')?.mana).toBe(5);
  });

  it('skips the optional second binding stage when its mana condition is no longer legal', () => {
    const { session, sourceInstanceId, firstTargetInstanceId, secondTargetInstanceId } = installGoldenFixture();
    session.state.players.find((player) => player.id === 'p1')!.mana = 6;

    expect(session.dispatchPlayerAction('p1', {
      type: 'activate_ability', cardInstanceId: sourceInstanceId, abilityId: goldenAbilityId,
    }).ok).toBe(true);
    const firstStage = session.dispatchPlayerAction('p1', {
      type: 'choose_target', decisionId: session.getPlayerView('p1').pendingDecision!.id, selectedIds: [firstTargetInstanceId],
    });
    expect(firstStage.ok).toBe(true);

    expect(session.getPlayerView('p1').pendingDecision).toBeUndefined();
    expect(session.state.cards.find((card) => card.instanceId === secondTargetInstanceId)?.zone).toBe('removed_from_game');
    expect(session.state.players.find((player) => player.id === 'p1')).toMatchObject({ mana: 6, vp: 2 });
  });

  it('does not pay when the owner declines an available optional second target', () => {
    const { session, sourceInstanceId, firstTargetInstanceId, secondTargetInstanceId } = installGoldenFixture();
    expect(session.dispatchPlayerAction('p1', {
      type: 'activate_ability', cardInstanceId: sourceInstanceId, abilityId: goldenAbilityId,
    }).ok).toBe(true);
    expect(session.dispatchPlayerAction('p1', {
      type: 'choose_target', decisionId: session.getPlayerView('p1').pendingDecision!.id, selectedIds: [firstTargetInstanceId],
    }).ok).toBe(true);

    const beforeDecline = structuredClone(session.state);
    const decline = session.dispatchPlayerAction('p1', {
      type: 'choose_target', decisionId: session.getPlayerView('p1').pendingDecision!.id, selectedIds: [],
    });
    expect(decline.ok).toBe(true);
    expect(session.state.cards.find((card) => card.instanceId === secondTargetInstanceId)?.zone).toBe('removed_from_game');
    expect(session.state.players.find((player) => player.id === 'p1')).toMatchObject({ mana: 12, vp: 2 });
    expect(session.state.abilityRuntime!.events.slice(beforeDecline.abilityRuntime!.events.length)).not.toContainEqual(expect.objectContaining({ type: 'mana_paid' }));
  });

  it('rolls back the complete first-stage command when a later staged node fails', () => {
    const { session, sourceInstanceId, firstTargetInstanceId, secondTargetInstanceId } = installGoldenFixture();
    expect(session.dispatchPlayerAction('p1', {
      type: 'activate_ability', cardInstanceId: sourceInstanceId, abilityId: goldenAbilityId,
    }).ok).toBe(true);
    session.state.cards = session.state.cards.filter((card) => card.instanceId !== secondTargetInstanceId);
    session.state.abilityRuntime!.pendingDecision!.remainingEffects.push({
      id: 'forced-first-stage-failure', type: 'fail_invariant', message: 'test failure after first-stage prefix',
    } as any);
    const before = structuredClone(session.state);

    const result = session.dispatchPlayerAction('p1', {
      type: 'choose_target', decisionId: session.getPlayerView('p1').pendingDecision!.id, selectedIds: [firstTargetInstanceId],
    });
    expect(result.ok).toBe(false);
    expect(result.rejection?.code).toBe('resolution_failed');
    expect(session.state).toEqual(before);
  });

  it('rolls back only the second-stage command after payment and movement fail', () => {
    const { session, sourceInstanceId, firstTargetInstanceId, secondTargetInstanceId } = installGoldenFixture();
    expect(session.dispatchPlayerAction('p1', {
      type: 'activate_ability', cardInstanceId: sourceInstanceId, abilityId: goldenAbilityId,
    }).ok).toBe(true);
    session.state.abilityRuntime!.pendingDecision!.remainingEffects.push({
      id: 'forced-second-stage-failure', type: 'fail_invariant', message: 'test failure after second-stage payment',
    } as any);
    expect(session.dispatchPlayerAction('p1', {
      type: 'choose_target', decisionId: session.getPlayerView('p1').pendingDecision!.id, selectedIds: [firstTargetInstanceId],
    }).ok).toBe(true);
    const afterFirstStage = structuredClone(session.state);

    const result = session.dispatchPlayerAction('p1', {
      type: 'choose_target', decisionId: session.getPlayerView('p1').pendingDecision!.id, selectedIds: [secondTargetInstanceId],
    });
    expect(result.ok).toBe(false);
    expect(result.rejection?.code).toBe('resolution_failed');
    expect(session.state).toEqual(afterFirstStage);
  });

  it('does not offer activation when the mandatory first target is absent', () => {
    const { session, sourceInstanceId, firstTargetInstanceId, secondTargetInstanceId } = installGoldenFixture();
    session.state.cards = session.state.cards.filter((card) => ![firstTargetInstanceId, secondTargetInstanceId].includes(card.instanceId));

    expect(session.getPlayerView('p1').legalActions).not.toContainEqual(expect.objectContaining({
      type: 'activate_ability', cardInstanceId: sourceInstanceId, abilityId: goldenAbilityId,
    }));

    const before = structuredClone(session.state);
    const result = session.dispatchPlayerAction('p1', {
      type: 'activate_ability', cardInstanceId: sourceInstanceId, abilityId: goldenAbilityId,
    });
    expect(result.ok).toBe(false);
    expect(result.rejection?.code).toBe('illegal_action');
    expect(result.events).toEqual([]);
    expect(session.state.abilityRuntime?.revision).toBe(before.abilityRuntime?.revision);
    expect(session.state).toEqual(before);
  });

  it.each([
    ['extra cost', (ability: Record<string, any>) => { ability.cost = [{ type: 'pay_mana', player: 'controller', amount: 1 }]; }],
    ['extra target', (ability: Record<string, any>) => { ability.targets.push(structuredClone(ability.targets[0])); }],
    ['extra creates', (ability: Record<string, any>) => { ability.creates = [{ type: 'create_card', cardId: 'servant.kintoki.skill.sc-kintoki-1', to: { zone: 'skill' } }]; }],
    ['extra condition', (ability: Record<string, any>) => { ability.conditions = [{ type: 'controller_at_battlefield' }]; }],
    ['wrong execution mode', (ability: Record<string, any>) => { ability.execution.mode = 'host'; }],
    ['missing typed result marker', (ability: Record<string, any>) => {
      delete ability.effects[0].bind;
      delete ability.effects[0].from;
    }],
  ])('rejects %s during executable compilation', (_label, mutator) => {
    expect(() => compileExecutableCardPack(mutateGoldenAbility(mutator))).toThrow(/result-binding production bridge|unsupported semantics/);
  });

  it('rejects a malformed production bridge before legacy execution and preserves state', () => {
    const { session, sourceInstanceId } = installGoldenFixture();
    const compiledAbility = session.state.abilityRuntime!.pack.cards[goldenCardId]!.abilities.find((ability) => ability.id === goldenAbilityId)! as any;
    compiledAbility.effects.push({
      id: 'malformed-extra-branch',
      type: 'branch',
      branches: [{ then: [{ id: 'nested-move', type: 'move_card', target: 'firstGoldenImpact', from: 'removed_from_game', to: 'deck', bind: 'nestedMove' }] }],
    });
    const before = structuredClone(session.state);

    const result = session.dispatchPlayerAction('p1', {
      type: 'activate_ability', cardInstanceId: sourceInstanceId, abilityId: goldenAbilityId,
    });
    expect(result.ok).toBe(false);
    expect(result.rejection?.code).toBe('resolution_failed');
    expect(result.events).toEqual([]);
    expect(session.state.abilityRuntime?.revision).toBe(before.abilityRuntime?.revision);
    expect(session.state).toEqual(before);
  });

  it('rejects a legacy-shaped combat move when the result-binding target family remains', () => {
    const { session, sourceInstanceId } = installGoldenFixture();
    const compiledAbility = session.state.abilityRuntime!.pack.cards[goldenCardId]!.abilities.find((ability) => ability.id === goldenAbilityId)! as any;
    delete compiledAbility.effects[0].bind;
    delete compiledAbility.effects[0].from;
    const before = structuredClone(session.state);

    const result = session.dispatchPlayerAction('p1', {
      type: 'activate_ability', cardInstanceId: sourceInstanceId, abilityId: goldenAbilityId,
    });
    expect(result.ok).toBe(false);
    expect(result.rejection?.code).toBe('resolution_failed');
    expect(result.events).toEqual([]);
    expect(session.state.abilityRuntime?.revision).toBe(before.abilityRuntime?.revision);
    expect(session.state).toEqual(before);
  });
});
