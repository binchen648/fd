import { createHash } from 'node:crypto';
import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';
import * as rules from '../src/index';
import { isPrivateOptionalHandPlayInteractionSemantic } from '../src/ability/interaction-gateway';
import { createSeededGameState } from '../src/tools/seeded-state';

const F1_COMMIT = '59f145434695d29bdd17e4cb3adc887e84182377';
const PRINTED_TEXT_SHA = '0514b5cce67642f6c5215fe348f433ce3638806be3af558ac845d39310a3d2b1';
const DRAW_CLAUSE_SHA = '88e0daa4be5047709147c103b33305e34b428e053e34ff8c90d5065252a9bebc';
const ACTION_CLAUSE_SHA = 'cbdff481f797da49ce7639a279842cc6f0e9fda622b584bcc42103065bc2c5c8';

const members = [
  ['servant.boudica', 'servant.boudica.skill.sc-boudica-3'],
  ['servant.constantine', 'servant.constantine.skill.sc-constantine-1'],
  ['servant.drake', 'servant.drake.skill.sc-drake-1'],
  ['servant.hephaistion', 'servant.hephaistion.skill.sc-hephaistion-3'],
  ['servant.iskandar', 'servant.iskandar.skill.sc-iskandar-1'],
  ['servant.ivan', 'servant.ivan.skill.sc-ivan-3'],
  ['servant.mandricardo', 'servant.mandricardo.skill.sc-mandricardo-3'],
  ['servant.martha', 'servant.martha.skill.sc-martha-3'],
  ['servant.medb', 'servant.medb.skill.sc-medb-1'],
  ['servant.medusa', 'servant.medusa.skill.sc-medusa-1'],
  ['servant.odysseus', 'servant.odysseus.skill.sc-odysseus-3'],
  ['servant.roberts', 'servant.roberts.skill.sc-roberts-3'],
  ['servant.teach', 'servant.teach.skill.sc-teach-3'],
  ['servant.ushiwakamaru', 'servant.ushiwakamaru.skill.sc-ushiwakamaru-3'],
] as const;

function archivePath(ownerId: string): string {
  return `data/authoring/servants/${ownerId}.json`;
}

function readArchive(ownerId: string): any {
  return JSON.parse(readFileSync(archivePath(ownerId), 'utf8'));
}

function sha(value: string): string {
  return createHash('sha256').update(value, 'utf8').digest('hex');
}

describe('P3-FM01 source-play/basic-attack draw authoring migration', () => {
  it('freezes exactly the authorized 14 canonical identities', () => {
    expect(members.map(([, cardId]) => cardId)).toEqual([
      'servant.boudica.skill.sc-boudica-3',
      'servant.constantine.skill.sc-constantine-1',
      'servant.drake.skill.sc-drake-1',
      'servant.hephaistion.skill.sc-hephaistion-3',
      'servant.iskandar.skill.sc-iskandar-1',
      'servant.ivan.skill.sc-ivan-3',
      'servant.mandricardo.skill.sc-mandricardo-3',
      'servant.martha.skill.sc-martha-3',
      'servant.medb.skill.sc-medb-1',
      'servant.medusa.skill.sc-medusa-1',
      'servant.odysseus.skill.sc-odysseus-3',
      'servant.roberts.skill.sc-roberts-3',
      'servant.teach.skill.sc-teach-3',
      'servant.ushiwakamaru.skill.sc-ushiwakamaru-3',
    ]);
  });

  it.each(members)('%s preserves F1 clauses and compiles only the accepted composite shape for %s', (ownerId, cardId) => {
    const raw = readArchive(ownerId);
    const card = raw.cards.find((candidate: any) => candidate.id === cardId);
    expect(card, `${cardId} must exist in its authoring archive`).toBeDefined();

    expect(sha(card.printedText)).toBe(PRINTED_TEXT_SHA);
    expect(card.abilities).toHaveLength(2);
    expect(sha(card.abilities[0].printedClause)).toBe(DRAW_CLAUSE_SHA);
    expect(sha(card.abilities[1].printedClause)).toBe(ACTION_CLAUSE_SHA);
    expect(card.printedText).toBe(`${card.abilities[0].printedClause}\n${card.abilities[1].printedClause}`);

    expect(card.cardType).toBe('servant_skill');
    expect(card.owner).toEqual({ type: 'servant', id: ownerId });
    expect(card.cardFace).toMatchObject({ cost: 3, basePower: 0 });
    expect(card.playTiming).toEqual({ phase: 'action', window: 'controller_play_card_window' });
    expect(card.playRequirements).toEqual([{ type: 'skill_zone_mana_at_least', value: 8 }]);

    const loaded = rules.loadAuthoringJson(raw);
    const compiled = loaded.cards[cardId];
    expect(compiled).toBeDefined();
    expect(loaded.report.filter((entry) => entry.cardId === cardId && entry.status === 'unsupported')).toEqual([]);
    expect(compiled!.abilities).toHaveLength(2);
    expect(rules.isSourcePlayBasicAttackDrawTriggerSemantic(compiled!.abilities[0]!)).toBe(true);
    expect(isPrivateOptionalHandPlayInteractionSemantic(compiled!.abilities[1]!)).toBe(true);
  });

  it('executes one newly migrated representative through the accepted trigger and private-play runtime contracts', () => {
    const raw = structuredClone(readArchive('servant.boudica'));
    raw.cards.push(
      {
        id: 'fixture.fm01.basic-2', name: 'FM01 basic 2', cardType: 'basic_attack',
        cardFace: { cost: 2, basePower: 2 },
        playTiming: { phase: 'action', window: 'controller_play_card_window' }, abilities: [],
      },
      {
        id: 'fixture.fm01.basic-5', name: 'FM01 basic 5', cardType: 'basic_attack',
        cardFace: { cost: 5, basePower: 5 },
        playTiming: { phase: 'action', window: 'controller_play_card_window' }, abilities: [],
      },
    );
    const pack = rules.loadAuthoringJson(raw);
    const state = createSeededGameState({ activeSeats: [1, 2] });
    state.cards = [];
    state.round.activePhase = 'action';
    state.round.prioritySeat = 1;
    state.players[0]!.servantCardId = 'servant.boudica';
    state.players[0]!.mana = 12;
    rules.initializeAbilityRuntime(state, pack, { seed: 20260916 });

    const add = (definitionId: string, zone: string) => {
      const instanceId = `fm01-${state.cards.length}`;
      state.cards.push({
        instanceId, definitionId, ownerPlayerId: 'p1', controllerPlayerId: 'p1', zone,
        visibility: { scope: 'owner_only', ownerPlayerId: 'p1' },
      });
      return instanceId;
    };
    const riding = add('servant.boudica.skill.sc-boudica-3', 'skill');
    const basic2 = add('fixture.fm01.basic-2', 'hand');
    const basic5 = add('fixture.fm01.basic-5', 'hand');
    const deckCard = add('fixture.fm01.basic-2', 'deck');

    rules.playAbilityCardBatch(state, 'p1', [{ cardInstanceId: riding }, { cardInstanceId: basic2 }]);
    expect(state.cards.find((card) => card.instanceId === deckCard)!.zone).toBe('hand');

    const second = createSeededGameState({ activeSeats: [1, 2] });
    second.cards = [];
    second.round.activePhase = 'action';
    second.round.prioritySeat = 1;
    second.players[0]!.servantCardId = 'servant.boudica';
    second.players[0]!.mana = 12;
    rules.initializeAbilityRuntime(second, pack, { seed: 20260917 });
    const addSecond = (definitionId: string, zone: string) => {
      const instanceId = `fm01-second-${second.cards.length}`;
      second.cards.push({
        instanceId, definitionId, ownerPlayerId: 'p1', controllerPlayerId: 'p1', zone,
        visibility: { scope: 'owner_only', ownerPlayerId: 'p1' },
      });
      return instanceId;
    };
    const secondRiding = addSecond('servant.boudica.skill.sc-boudica-3', 'skill');
    const low = addSecond('fixture.fm01.basic-2', 'hand');
    const high = addSecond('fixture.fm01.basic-5', 'hand');
    expect(rules.dispatchAbilityCommand(second, 'p1', { type: 'play_card', cardInstanceId: secondRiding }).ok).toBe(true);
    expect(rules.dispatchAbilityCommand(second, 'p1', {
      type: 'activate_ability', cardInstanceId: secondRiding, abilityId: 'sc-boudica-3.mount-summon',
    }).ok).toBe(true);
    const decision = rules.projectAbilityState(second, 'p1').pendingDecision!;
    expect(decision).toMatchObject({ min: 0, max: 3 });
    expect(decision.candidates).toContain(low);
    expect(decision.candidates).not.toContain(high);
  });

  it('keeps the 13 newly introduced archives scoped to one selected card and preserves their frozen evidence lineage', () => {
    for (const [ownerId, cardId] of members.filter(([ownerId]) => ownerId !== 'servant.drake')) {
      const raw = readArchive(ownerId);
      expect(raw.id).toBe(ownerId);
      expect(raw.cards).toHaveLength(1);
      expect(raw.cards[0]!.id).toBe(cardId);
      expect(raw.cards[0]!.phase3Evidence).toMatchObject({
        f1Commit: F1_COMMIT,
        referenceStaticMetadata: {
          commit: 'b2f9fa15fba07c63530bbf4612b03b8b704755f9',
          cost: 3,
          basePower: 0,
          legacyRequirement: 3,
        },
        canonicalSkillZoneManaRequirement: {
          value: 8,
          authority: 'final_rules_9.4',
        },
      });
      expect(raw.cards[0]!.phase3Evidence.f1ClauseSources.map((source: any) => source.sha256)).toEqual([
        DRAW_CLAUSE_SHA,
        ACTION_CLAUSE_SHA,
      ]);
      expect(raw.sourcePolicy.phase3EvidenceCommit).toBe(F1_COMMIT);
      expect(raw.sourcePolicy.note).toContain('Semantics come from accepted F1 evidence/contracts');
    }
  });

  it('reuses Drake as the unchanged pre-existing canonical representative instead of rewriting it', () => {
    const raw = readArchive('servant.drake');
    const riding = raw.cards.find((card: any) => card.id === 'servant.drake.skill.sc-drake-1');
    expect(raw.cards.length).toBeGreaterThan(1);
    expect(riding.playRequirements).toEqual([{ type: 'skill_zone_mana_at_least', value: 8 }]);
    expect(sha(riding.printedText)).toBe(PRINTED_TEXT_SHA);
  });
});
