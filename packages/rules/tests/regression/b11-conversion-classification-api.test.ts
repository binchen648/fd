import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { describe, expect, it } from 'vitest';
import { loadAuthoringJson } from '../../src/ability/loader';
import { isCardZoneCoreDirectActionRouteCandidate, isCardZoneCoreDirectActionSemantic } from '../../src/ability/interpreter';

const vectors = JSON.parse(readFileSync(resolve('docs/agents/manifests/vectors/B11_CONVERSION_STRUCTURAL_CLASSIFICATION_API.json'), 'utf8'));
const archive = JSON.parse(readFileSync(resolve(vectors.source), 'utf8'));

describe('B11 Conversion existing shared classification API', () => {
  for (const vector of vectors.vectors) {
    it(`observes ${vector.id} without mutating authoring or normalized input`, () => {
      const input = structuredClone(archive);
      const card = input.cards.find((value: any) => value.id === vectors.cardId);
      const raw = card.abilities.find((value: any) => value.id === vectors.abilityId);
      switch (vector.mutation) {
        case 'none': break;
        case 'rename': card.id = 'diagnostic.renamed.source'; raw.id = 'diagnostic.renamed.ability'; break;
        case 'deck': raw.effects[0].to.zone = 'deck'; break;
        case 'discard': raw.effects[0].from = 'discard'; break;
        case 'unknown-binding': raw.effects[1].amount.var = 'missingBinding'; break;
        case 'action': raw.activation.phase = 'action'; break;
        case 'extra-node': raw.effects.push({ type: 'adjust_mana', amount: 1 }); break;
        default: throw new Error(`Unsupported vector: ${vector.mutation}`);
      }
      const before = structuredClone(input);
      const ability = loadAuthoringJson(input).cards[card.id]!.abilities.find(value => value.id === raw.id)!;
      const normalizedBefore = structuredClone(ability);
      expect(isCardZoneCoreDirectActionRouteCandidate(ability)).toBe(vector.routeCandidate);
      expect(isCardZoneCoreDirectActionSemantic(ability)).toBe(vector.exactEligible);
      expect(ability).toEqual(normalizedBefore);
      expect(input).toEqual(before);
    });
  }
});
