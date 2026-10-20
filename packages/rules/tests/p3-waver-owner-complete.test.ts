import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';
import * as rules from '../src/index';

const archive = JSON.parse(readFileSync('data/authoring/masters/master.waver.canonical.json', 'utf8')) as any;
const frozen = [
  ['master.waver.skill.ascension', '埃尔梅罗二世事件簿', ['bf05e37a6177c644224c34511d01997b7976944ea964770962bfa5859f0ba40d', 'bb8b7ebe4ca71288efd61bf47b0573c5b8078d5bae03e476838dcfb9f93acc5c']],
  ['master.waver.skill.s1', '鉴识眼', ['c4004b02a61eb2cefa01526f174f4fb7815644f4267735020b2507177797058f']],
  ['master.waver.skill.s2', '战略部署', ['68b3ada84d7058a23517d12544478e2ed6f95274922ccc6010f2ae3819d0eb59']],
  ['master.waver.skill.s3', '调查', ['9863f1c6785fc3be2d26cd4314f8c31c8117115e75711a658f4af57acad23e04']],
] as const;

describe('P3 Waver owner-complete migration', () => {
  it('preserves the four frozen canonical cards, text and source hashes', () => {
    expect(archive.id).toBe('master.waver');
    expect(archive.cards.map((card: any) => card.id)).toEqual(frozen.map(([id]) => id));
    for (const [id, name, expected] of frozen) {
      const card = archive.cards.find((candidate: any) => candidate.id === id);
      expect(card.name).toBe(name);
      expect(card.owner).toEqual({ type: 'master', id: 'master.waver' });
      expect(card.phase3Evidence.f1ClauseSources.map((source: any) => source.sha256)).toEqual(expected);
    }
  });

  it('loads all cards and keeps unsupported clauses explicitly host-adjudicated', () => {
    const loaded = rules.loadAuthoringJson(archive);
    expect(loaded.report.filter((entry: any) => entry.status === 'unsupported')).toHaveLength(4);
    expect(Object.keys(loaded.cards)).toEqual(frozen.map(([id]) => id));
    expect(archive.cards.filter((card: any) => card.verification?.implementationStatus === 'host_adjudicated')).toHaveLength(3);
  });

  it('retains the accepted face-down-event visibility contract', () => {
    const loaded = rules.loadAuthoringJson(archive);
    const ability = loaded.cards['master.waver.skill.s1']!.abilities[0]!;
    expect(rules.isGameStartRuleOverrideSemantic(ability)).toBe(true);
    expect(ability.effects).toEqual([{ type: 'install_rule_override', player: 'controller', rule: 'view_face_down_events', enabled: true }]);
  });
});
