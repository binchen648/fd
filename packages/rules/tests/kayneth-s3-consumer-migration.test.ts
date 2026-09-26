import { createHash } from 'node:crypto';
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { describe, expect, it } from 'vitest';

import * as rules from '../src/index';
import { createMatchSession } from '../src/match-session';

const ROOT = resolve('.');
const ID = 'master.kayneth.skill.s3';
const OWNER = 'master.kayneth';
const TEXT_SHA = 'c3e30045f8b00e75f66735aace73f68594ac59d77c0782de75093dbaee31a294';
const REGISTERED_ARCHIVE_SHA = '8047edd19f83c733e72c2b25c6c9bdf76e36a0d8005d358bbe6a2e6df4304c20';

function hash(text: string): string {
  return createHash('sha256').update(text, 'utf8').digest('hex');
}
function canonical(value: any): any {
  if (Array.isArray(value)) return value.map(canonical);
  if (value && typeof value === 'object') {
    return Object.fromEntries(Object.keys(value).sort().map((key) => [key, canonical(value[key])]));
  }
  return value;
}
function canonicalHash(value: any): string {
  return hash(JSON.stringify(canonical(value)));
}
function rawArchive(): any {
  return JSON.parse(readFileSync(resolve(ROOT, 'data/authoring/masters/master.kayneth.p3-s3.json'), 'utf8'));
}
function setup() {
  const pack = rules.loadAuthoringJson(rawArchive());
  expect(pack.report).toEqual([]);
  const session = createMatchSession({ seed: 20260920, humanPlayerId: 'p1' });
  const actor = session.state.players[0]!;
  const opponent = session.state.players[1]!;
  session.state.round.activePhase = 'advance';
  session.state.round.prioritySeat = actor.seat;
  for (const player of session.state.players) {
    delete player.locationId;
    player.vp = 0;
  }
  actor.vp = 5;
  opponent.vp = 2;
  opponent.locationId = 'shinto';
  session.state.abilityRuntime!.pack.cards[ID] = pack.cards[ID]!;
  session.state.cards.push({
    instanceId: 'kayneth-s3-source', definitionId: ID,
    ownerPlayerId: actor.id, controllerPlayerId: actor.id, zone: 'skill',
    visibility: { scope: 'owner_only', ownerPlayerId: actor.id },
  });
  return { session, actor, opponent };
}

describe('P3 S R79 Kayneth s3 consumer migration', () => {
  it('adds only the canonical frozen s3 material while preserving the legacy pride product card', () => {
    const raw = rawArchive();
    const authored = raw.cards.find((card: any) => card.id === ID);
    const registeredText = readFileSync(resolve(ROOT, 'data/authoring/masters/master.kayneth.json'), 'utf8');
    expect(authored).toMatchObject({
      id: ID,
      aliases: ['s3'],
      legacyId: 's3',
      name: '倨傲',
      cardType: 'master_skill',
      owner: { type: 'master', id: OWNER },
      cardFace: { typeLabel: '被动', attributes: [], cost: 0, basePower: 0 },
      playTiming: { phase: 'action', window: 'controller_play_card_window' },
      playRequirements: [],
      phase3Evidence: {
        f1Commit: '59f145434695d29bdd17e4cb3adc887e84182377',
        f1ClauseSources: [{ sha256: TEXT_SHA }],
        f1FullPrintedTextSha256: TEXT_SHA,
        referenceStaticMetadata: {
          commit: 'b2f9fa15fba07c63530bbf4612b03b8b704755f9',
          legacySkillId: 's3', class: 'Master', cost: 0, basePower: 0,
          legacyRequirement: null, typeLabel: '被动', attributes: [],
        },
      },
    });
    expect(hash(authored.printedText)).toBe(TEXT_SHA);
    expect(hash(authored.abilities[0].printedClause)).toBe(TEXT_SHA);
    expect(hash(registeredText)).toBe(REGISTERED_ARCHIVE_SHA);
    expect(registeredText).toContain('master.kayneth.skill.pride');

    const pack = rules.loadAuthoringJson(raw);
    expect(pack.report).toEqual([]);
    expect(pack.cards[ID]!.mode).toBe('automatic');
    expect(pack.cards[ID]!.abilities).toHaveLength(1);
    expect(rules.isAcceptedLowerVpLoneBattlefieldDeploymentAbility(pack.cards[ID]!.abilities[0])).toBe(true);
  });

  it('replaces deployment with exactly the current lower-VP lone-opponent battlefield', () => {
    const { session, actor } = setup();
    expect(session.legalDeploymentActions(actor.id)).toEqual([
      { type: 'deploy_player', locationId: 'shinto' },
    ]);
    expect(session.dispatchPlayerCommand(actor.id, { type: 'deploy_player', locationId: 'magic_workshop' })).toEqual(expect.objectContaining({
      ok: false,
      rejection: expect.objectContaining({ code: 'illegal_deployment' }),
    }));
  });

  it('uses live VP/occupancy and falls back to ordinary deployment when no qualifying battlefield exists', () => {
    const noLowerVp = setup();
    noLowerVp.opponent.vp = 8;
    expect(noLowerVp.session.legalDeploymentActions(noLowerVp.actor.id)).toContainEqual({ type: 'deploy_player', locationId: 'magic_workshop' });

    const crowded = setup();
    const second = crowded.session.state.players[2]!;
    second.locationId = 'shinto';
    second.vp = 1;
    expect(crowded.session.legalDeploymentActions(crowded.actor.id)).toContainEqual({ type: 'deploy_player', locationId: 'magic_workshop' });
    second.status = 'eliminated';
    expect(crowded.session.legalDeploymentActions(crowded.actor.id)).toEqual([{ type: 'deploy_player', locationId: 'shinto' }]);
  });

  it('fails closed when the canonical structural source is not currently owned/controlled in an eligible source zone', () => {
    for (const mutate of [
      (session: ReturnType<typeof createMatchSession>, opponentId: string) => { session.state.cards.find((card) => card.instanceId === 'kayneth-s3-source')!.ownerPlayerId = opponentId; },
      (session: ReturnType<typeof createMatchSession>) => { session.state.cards.find((card) => card.instanceId === 'kayneth-s3-source')!.zone = 'hand'; },
    ]) {
      const { session, actor, opponent } = setup();
      mutate(session, opponent.id);
      expect(session.legalDeploymentActions(actor.id)).toContainEqual({ type: 'deploy_player', locationId: 'magic_workshop' });
    }
  });

  it('keeps the standalone migration outside product pack/generated outputs', () => {
    const manifest = readFileSync(resolve(ROOT, 'data/packs/fd-playtest-v1/pack.json'), 'utf8');
    const generated = readFileSync(resolve(ROOT, 'data/generated/fd-playtest-v1.content-library.json'), 'utf8');
    expect(manifest).not.toContain('data/authoring/masters/master.kayneth.p3-s3.json');
    expect(manifest).not.toContain(ID);
    expect(generated).not.toContain(ID);
  });
});