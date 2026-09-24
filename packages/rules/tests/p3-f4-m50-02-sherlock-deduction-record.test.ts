import { pathToFileURL } from 'node:url';

import { describe, expect, it } from 'vitest';

import * as rules from '../src/index';
import { archiveFor, convertConfirmedOverrideCard } from '../../../scripts/phase3-reference/materialize-m50-02-batch';

const ID = 'servant.sherlock.skill.sc-sherlock-4';
const REFERENCE_OVERRIDES = 'E:/Codex/FD/fengling20011118-dotcom_fate-domination/reference/src/content/confirmed-skill-overrides.ts';

function syntheticArchive(markers: string[]) {
  return {
    schemaVersion: 'fd-card-authoring-v1',
    archiveType: 'servant_skill_card_archive',
    id: 'servant.synthetic-record-owner',
    name: 'Synthetic Record Owner',
    class: 'Ruler',
    cards: [{
      id: 'servant.synthetic-record-owner.skill.record',
      name: 'Synthetic Record',
      cardType: 'servant_skill',
      owner: { type: 'servant', id: 'servant.synthetic-record-owner' },
      initialPlacement: 'outside_game',
      printedText: 'secret record',
      cardFace: { typeLabel: '被动', cost: 0, basePower: 0, attributes: [] },
      playTiming: { phase: 'action', window: 'controller_play_card_window' },
      playRequirements: [],
      abilities: [{
        id: 'deduction-record-marker', kind: 'passive', printedClause: 'secret record', markers,
        activation: {}, conditions: [], targets: [], effects: [], cost: [], ruleModifiers: [], creates: [],
        lifecycle: {}, responseWindow: {}, limit: {}, visibility: {}, execution: { mode: 'automatic', allowedOperations: [] },
      }],
    }],
  };
}

describe('P3 F4 M50-02 Sherlock deduction-record definition', () => {
  it('materializes the Locked-Reference strength record as an outside-game typed data card without inventing consumer effects', async () => {
    const mod = await import(pathToFileURL(REFERENCE_OVERRIDES).href);
    const override = mod.confirmedSkillOverrides[ID];
    expect(override).toMatchObject({
      initiallyOwned: false,
      handlerId: 'core.rule-marker',
      supportLevel: 'FULL',
      tags: ['deduction-record', 'deduction-attribute:力量'],
    });

    const card = convertConfirmedOverrideCard(ID, override);
    expect(card).toMatchObject({
      id: ID,
      cardType: 'servant_skill',
      owner: { type: 'servant', id: 'servant.sherlock' },
      initialPlacement: 'outside_game',
      abilities: [{
        id: 'deduction-record-marker', kind: 'passive',
        markers: ['m50_structured_v1', 'deduction-record', 'deduction-attribute:力量'],
        effects: [], ruleModifiers: [], creates: [],
        execution: { mode: 'automatic', allowedOperations: [] },
      }],
    });

    const loaded = rules.loadAuthoringJson(archiveFor(card));
    expect(loaded.report).toEqual([]);
    expect(rules.m50DeductionRecordAttribute(loaded.cards[ID]!)).toBe('力量');
  });

  it('materializes the Locked-Reference agility record for the final replacement owner', async () => {
    const agilityId = 'servant.sherlock.skill.sc-sherlock-5';
    const mod = await import(pathToFileURL(REFERENCE_OVERRIDES).href);
    const override = mod.confirmedSkillOverrides[agilityId];
    expect(override).toMatchObject({
      initiallyOwned: false,
      handlerId: 'core.rule-marker',
      supportLevel: 'FULL',
      tags: ['deduction-record', 'deduction-attribute:迅捷'],
    });

    const card = convertConfirmedOverrideCard(agilityId, override);
    const loaded = rules.loadAuthoringJson(archiveFor(card));
    expect(loaded.report).toEqual([]);
    expect(card.initialPlacement).toBe('outside_game');
    expect(rules.m50DeductionRecordAttribute(loaded.cards[agilityId]!)).toBe('迅捷');
  });

  it.each(['力量', '迅捷', '魔术', '特殊'])('accepts the exact identity-free record attribute family: %s', (attribute) => {
    const loaded = rules.loadAuthoringJson(syntheticArchive([
      'm50_structured_v1', 'deduction-record', `deduction-attribute:${attribute}`,
    ]));
    expect(loaded.report).toEqual([]);
    expect(rules.m50DeductionRecordAttribute(loaded.cards['servant.synthetic-record-owner.skill.record']!)).toBe(attribute);
  });

  it('fails closed for a reserved deduction-record marker with an unsupported attribute', () => {
    const loaded = rules.loadAuthoringJson(syntheticArchive([
      'm50_structured_v1', 'deduction-record', 'deduction-attribute:宝具',
    ]));
    expect(loaded.report).toEqual(expect.arrayContaining([
      expect.objectContaining({ path: 'm50DeductionRecord.gateway', reason: 'Unsupported deduction-record semantic marker shape' }),
    ]));
  });

  it('fails closed for a widened deduction-record marker envelope', () => {
    const loaded = rules.loadAuthoringJson(syntheticArchive([
      'm50_structured_v1', 'deduction-record', 'deduction-attribute:力量', 'extra-marker',
    ]));
    expect(loaded.report).toEqual(expect.arrayContaining([
      expect.objectContaining({ path: 'm50DeductionRecord.gateway' }),
    ]));
  });
});
