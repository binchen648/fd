import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { describe, expect, it } from 'vitest';
import { classifyB11InventoryAbility, classifyB11CoverageEligibility } from '../phase3-b11-diagnostic-api';

const root = resolve(fileURLToPath(new URL('../..', import.meta.url)));
function seed(path: string, abilityId: string) {
  const archive = JSON.parse(readFileSync(resolve(root, path), 'utf8'));
  return archive.cards.flatMap((card: any) => card.abilities).find((ability: any) => ability.id === abilityId);
}
const golden = seed('data/authoring/servants/servant.kintoki.json', 'sc-kintoki-3.golden-eater');
const conversion = seed('data/authoring/masters/master.irisviel.json', 'conversion-magic.preparation');

describe('B11 read-only inventory and coverage exact diagnostics', () => {
  it.each([golden, conversion])('classifies actual authoring without mutation or identity routing', source => {
    const input = structuredClone(source);
    input.id = 'diagnostic.unrelated.identity';
    expect(classifyB11InventoryAbility(input)).toMatchObject({ routeCandidate: true, exactEligible: true });
    expect(classifyB11CoverageEligibility(input).exactEligible).toBe(true);
    expect(input).toEqual({ ...source, id: 'diagnostic.unrelated.identity' });
  });
  it('keeps malformed binding ownership disagreement visible rather than copying expected values', () => {
    const input = structuredClone(conversion);
    input.effects[1].amount.var = 'unknown';
    expect(classifyB11InventoryAbility(input)).toMatchObject({ routeCandidate: false, exactEligible: false });
    expect(classifyB11CoverageEligibility(input).exactEligible).toBe(false);
  });
  it.each(['field', 'target', 'payment'])('rejects invalid Golden %s while preserving structural ownership', defect => {
    const input = structuredClone(golden);
    if (defect === 'field') input.effects[1].branches[0].then[0].amount.args[0].field = 'unknown';
    if (defect === 'target') input.effects[0].target = 'missing';
    if (defect === 'payment') input.effects[2].amount = 8;
    expect(classifyB11InventoryAbility(input)).toMatchObject({ routeCandidate: true, exactEligible: false });
    expect(classifyB11CoverageEligibility(input).exactEligible).toBe(false);
  });
  it.each(['extra-effect', 'extra-cost', 'extra-target', 'wrong-zone', 'outside-phase'])('rejects Conversion %s scope expansion', defect => {
    const input = structuredClone(conversion);
    if (defect === 'extra-effect') input.effects.push({ type: 'unknown' });
    if (defect === 'extra-cost') input.cost = [{ type: 'pay_mana', amount: 1 }];
    if (defect === 'extra-target') input.targets = [{ id: 'extra' }];
    if (defect === 'wrong-zone') input.effects[0].to.zone = 'field';
    if (defect === 'outside-phase') input.activation.phase = 'action';
    expect(classifyB11InventoryAbility(input).exactEligible).toBe(false);
    expect(classifyB11CoverageEligibility(input).exactEligible).toBe(false);
  });
  it('does not treat unsupported raw input as eligible', () => {
    expect(classifyB11InventoryAbility({})).toMatchObject({ routeCandidate: false, exactEligible: false });
    expect(classifyB11CoverageEligibility({ effects: [{ type: 'unknown' }] }).exactEligible).toBe(false);
  });
});
