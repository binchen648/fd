import { resolve } from 'node:path';

import { describe, expect, it } from 'vitest';

import { compileLoadedPlaytestPack, loadPlaytestContentPack } from '@fd/content';
import contentLibrary from '../../../../data/generated/fd-playtest-v1.content-library.json';
import { compileExecutableCardPack } from '../../src/ability/executable-card-pack';
import { createMatchSession } from '../../src/match-session';

const goldenCardIds = [
  'servant.artoriac.skill.sc-artoriac-1',
  'servant.ereshkigal.skill.sc-ereshkigal-2',
  'servant.artoria-alt.skill.sc-artoria-alt-2',
] as const;

type GoldenCardId = typeof goldenCardIds[number];

function prepareGoldenCard(cardId: GoldenCardId, mana: number) {
  const session = createMatchSession({ seed: 20260907, humanPlayerIds: ['p1', 'p2', 'p3', 'p4', 'p5', 'p6', 'p7'] });
  const card = session.state.cards.find((candidate) => candidate.definitionId === cardId)!;
  const player = session.state.players.find((candidate) => candidate.id === card.controllerPlayerId)!;
  const runtime = session.state.abilityRuntime!;

  session.state.round.activePhase = 'action';
  session.state.round.prioritySeat = player.seat;
  player.mana = mana;
  player.locationId = 'miyama_town';
  runtime.hostRequests = [];
  runtime.responseWindows = [];
  delete runtime.pendingDecision;

  return { session, card, player, runtime };
}

describe('Phase 2 golden-card compiled-content pipeline', () => {
  it('initializes MatchSession from the versioned compiled definitions', () => {
    const sourceLibrary = compileLoadedPlaytestPack(loadPlaytestContentPack(
      resolve('data/packs/fd-playtest-v1/pack.json'),
      { workspaceRoot: resolve('.') },
    )).library;
    const freshlyCompiled = compileExecutableCardPack(sourceLibrary);
    const session = createMatchSession({ seed: 20260907 });
    const compiled = contentLibrary.rules;

    expect(compiled.schemaVersion).toBe('fd-executable-card-pack-v1');
    expect(freshlyCompiled.definitionHash).toBe(compiled.definitionHash);

    expect(session.state.abilityRuntime?.pack.contentIdentity).toEqual({
      packId: contentLibrary.pack.id,
      version: contentLibrary.pack.version,
      definitionHash: compiled.definitionHash,
    });
    expect(session.state.abilityRuntime?.pack.schemaVersion).toBe('fd-executable-card-pack-v1');
    expect(session.state.abilityRuntime?.pack).not.toHaveProperty('archives');
    expect(session.projectToClientState('p1').contentPack).toEqual({
      id: contentLibrary.pack.id,
      version: contentLibrary.pack.version,
      definitionHash: compiled.definitionHash,
    });

    for (const cardId of goldenCardIds) {
      const compiledCard = compiled.cards[cardId];
      const runtimeCard = session.state.abilityRuntime?.pack.cards[cardId];
      const sourceEntry = freshlyCompiled.sourceMap[cardId];
      const sourceCard = sourceLibrary.rules.archives[sourceEntry.archiveIndex]!.cards[sourceEntry.cardIndex]!;
      expect(sourceCard.id).toBe(cardId);
      expect(freshlyCompiled.cards[cardId]).toEqual(compiledCard);
      expect(runtimeCard?.playRequirements).toEqual(compiledCard.playRequirements);
      expect(runtimeCard).toMatchObject({
        ownerId: compiledCard.ownerId,
        playKind: compiledCard.playKind,
        destinationZone: compiledCard.destinationZone,
      });
      expect(runtimeCard?.abilities.map((ability) => ({
        id: ability.id,
        targets: ability.targets,
        effects: ability.effects,
        lifecycle: ability.lifecycle,
      }))).toEqual(compiledCard.abilities.map((ability) => ({
        id: ability.id,
        targets: ability.targets ?? [],
        effects: ability.effects ?? [],
        lifecycle: ability.lifecycle ?? {},
      })));
    }
  });

  it('consumes requirements, offers, effects, and lifecycle through MatchSession', () => {
    const sword = prepareGoldenCard('servant.artoriac.skill.sc-artoriac-1', 7);
    expect(sword.session.getPlayerView(sword.player.id).legalActions).not.toContainEqual(
      expect.objectContaining({ type: 'play_card', cardInstanceId: sword.card.instanceId }),
    );
    sword.player.mana = 8;
    expect(sword.session.getPlayerView(sword.player.id).legalActions).toContainEqual(
      expect.objectContaining({ type: 'play_card', cardInstanceId: sword.card.instanceId }),
    );
    expect(sword.session.dispatchPlayerAction(sword.player.id, {
      type: 'play_card',
      cardInstanceId: sword.card.instanceId,
    }).ok).toBe(true);
    expect(sword.session.state.abilityRuntime?.ongoingEffects).toContainEqual(expect.objectContaining({
      abilityId: 'sc-artoriac-1.residual-special-power-bonus',
      duration: 'round_count',
      expiresAtRound: sword.session.state.round.roundNumber + 2,
    }));

    const protection = prepareGoldenCard('servant.ereshkigal.skill.sc-ereshkigal-2', 8);
    expect(protection.session.getPlayerView(protection.player.id).legalActions).toContainEqual(
      expect.objectContaining({ type: 'play_card', cardInstanceId: protection.card.instanceId }),
    );
    expect(protection.session.dispatchPlayerAction(protection.player.id, {
      type: 'play_card',
      cardInstanceId: protection.card.instanceId,
    }).ok).toBe(true);
    expect((protection.session.state as unknown as {
      modeState?: { reversedModifierLocations?: Array<{ locationId: string }> };
    }).modeState?.reversedModifierLocations).toContainEqual(expect.objectContaining({ locationId: 'miyama_town' }));

    const curse = prepareGoldenCard('servant.artoria-alt.skill.sc-artoria-alt-2', 0);
    expect(curse.session.getPlayerView(curse.player.id).legalActions).toContainEqual(
      expect.objectContaining({ type: 'play_card', cardInstanceId: curse.card.instanceId }),
    );
    expect(curse.session.dispatchPlayerAction(curse.player.id, {
      type: 'play_card',
      cardInstanceId: curse.card.instanceId,
    }).ok).toBe(true);
    const noble = curse.session.state.cards.find((candidate) =>
      candidate.controllerPlayerId === curse.player.id &&
      candidate.definitionId === 'servant.artoria-alt.skill.sc-artoria-alt-1')!;
    curse.session.state.players.find((candidate) => candidate.id === curse.player.id)!.mana = 12;
    expect(curse.session.dispatchPlayerAction(curse.player.id, {
      type: 'play_card',
      cardInstanceId: noble.instanceId,
    }).ok).toBe(true);
    expect(curse.session.state.cards.find((candidate) => candidate.instanceId === curse.card.instanceId)?.zone).toBe('skill');
  });
});
