import { createHash } from 'node:crypto';
import { readFileSync } from 'node:fs';

import { describe, expect, it } from 'vitest';

import { isCardZoneCoreDirectActionSemantic, isPlayActionDirectAction } from '../src/ability/interpreter';
import * as rules from '../src/index';

const F1_COMMIT = '59f145434695d29bdd17e4cb3adc887e84182377';
const REFERENCE_COMMIT = 'b2f9fa15fba07c63530bbf4612b03b8b704755f9';

const members = [
  {
    file: 'master.irisviel.json', ownerId: 'master.irisviel', cardId: 'master.irisviel.skill.conversion-magic',
    abilityId: 'conversion-magic.preparation', legacyText: '弃置所有手牌，每1张获得1点魔力。',
    currentText: '前哨阶段：弃置所有手牌，每1张获得1点魔力。',
    sourceSha: '75fa71628bf0f1ce128eb156a6b7bd1d3e49bf1e155e3e11978d342190548304',
    contract: 'P3-TO-09/CARD_ZONE_CORE_DIRECT_ACTION',
  },
  {
    file: 'master.kiritsugu.json', ownerId: 'master.kiritsugu', cardId: 'master.kiritsugu.skill.time-alter',
    abilityId: 'time-alter.action', legacyText: '暗置打出一张牌，然后抽一张牌。',
    currentText: '行动阶段：暗置打出一张牌，然后抽一张牌。',
    sourceSha: '37250362ba119e621015b05c59c6694b319f15900647522fb8c5400ea8290df0',
    contract: 'P3-TO-10/CARD_ACTION_SEMANTICS_MINIMAL_PLAY',
  },
] as const;

function archive(file: string): any {
  return JSON.parse(readFileSync(`data/authoring/masters/${file}`, 'utf8'));
}

function sha(text: string): string {
  return createHash('sha256').update(text, 'utf8').digest('hex');
}

describe('P3-A FB2-26 authorized two-route consumer migration', () => {
  it('records exactly the two authorized F1 identities on their current canonical cards', () => {
    expect(members).toHaveLength(2);
    for (const member of members) {
      const raw = archive(member.file);
      expect(raw.sourcePolicy).toMatchObject({
        phase3EvidenceCommit: F1_COMMIT,
        referenceMetadataCommit: REFERENCE_COMMIT,
      });
      const card = raw.cards.find((candidate: any) => candidate.id === member.cardId);
      expect(card).toBeDefined();
      expect(card).toMatchObject({
        id: member.cardId,
        aliases: ['s2'],
        legacyId: 's2',
        owner: { type: 'master', id: member.ownerId },
        printedText: member.currentText,
        phase3Evidence: {
          f1Commit: F1_COMMIT,
          sourceTextSha256: member.sourceSha,
          referenceStaticMetadata: { commit: REFERENCE_COMMIT, legacySkillId: 's2' },
          acceptedContracts: { [member.contract.startsWith('P3-TO-09') ? 'cardZoneCoreDirectAction' : 'cardActionSemanticsMinimalPlay']: member.contract },
          currentRouteNormalization: { currentPrintedText: member.currentText, sourceClauseIsByteIdentical: false },
        },
      });
      expect(sha(member.legacyText)).toBe(member.sourceSha);
      expect(sha(card.printedText)).not.toBe(member.sourceSha);
      expect(card.abilities).toHaveLength(1);
      expect(card.abilities[0]).toMatchObject({ id: member.abilityId, printedClause: member.currentText });
    }
  });

  it('loads both routes through their existing exact semantic contracts without legacy IDs or duplicate cards', () => {
    const canonicalIds: string[] = [];
    for (const member of members) {
      const pack = rules.loadAuthoringJson(archive(member.file));
      expect(pack.report).toEqual([]);
      const card = pack.cards[member.cardId];
      expect(card).toBeDefined();
      canonicalIds.push(...Object.keys(pack.cards));
      const ability = card!.abilities[0]!;
      expect(ability.id).toBe(member.abilityId);
      expect(member.contract.startsWith('P3-TO-09')
        ? isCardZoneCoreDirectActionSemantic(ability)
        : isPlayActionDirectAction(ability)).toBe(true);
    }

    expect(new Set(canonicalIds).size).toBe(canonicalIds.length);
    expect(canonicalIds).not.toContain('master.irisviel.skill.s2');
    expect(canonicalIds).not.toContain('master.kiritsugu.skill.s2');

    const manifest = JSON.parse(readFileSync('data/packs/fd-playtest-v1/pack.json', 'utf8')) as {
      authoringMasterFiles: string[];
    };
    const registeredIds = manifest.authoringMasterFiles.flatMap((file) =>
      (JSON.parse(readFileSync(file, 'utf8')) as { cards: Array<{ id: string }> }).cards.map((card) => card.id));
    expect(new Set(registeredIds).size).toBe(registeredIds.length);
    for (const member of members) {
      expect(registeredIds.filter((id) => id === member.cardId)).toHaveLength(1);
    }
  });
});
