import type { GameState } from '../schema/game';
import { hasActiveRuleModifier } from './interpreter';

export interface EffectDefeat {
  round: number;
  battlefieldId: string;
  controllerId: string;
  sourceCardId: string;
  sourceDefinitionId: string;
  abilityId: string;
  targetPlayerIds: string[];
}

export function immuneToEffectDefeat(state: GameState, playerId: string, battlefieldId: string): boolean {
  return !!state.abilityRuntime && state.players.some(player => player.id === playerId && player.locationId === battlefieldId) &&
    hasActiveRuleModifier(state, playerId, 'immune_to_defeat', 'add', { requireActivation: true });
}

export function effectDefeatedPlayerIds(state: GameState, battlefieldId: string): string[] {
  if (state.round.activePhase === 'round_end') return [];
  const targets = (state.abilityRuntime?.effectDefeats ?? [])
    .filter(fact => fact.round === state.round.roundNumber && fact.battlefieldId === battlefieldId)
    .flatMap(fact => fact.targetPlayerIds);
  return [...new Set(targets)].filter(id => !immuneToEffectDefeat(state, id, battlefieldId));
}

function containsDefeatEffect(input: unknown): boolean {
  if (Array.isArray(input)) return input.some(containsDefeatEffect);
  if (!input || typeof input !== 'object') return false;
  const record = input as Record<string, unknown>;
  return record.type === 'apply_defeat_status' || Object.values(record).some(containsDefeatEffect);
}

export function validEffectDefeatState(state: GameState): boolean {
  const runtime = state.abilityRuntime;
  const facts = runtime?.effectDefeats;
  if (facts === undefined) return true;
  if (!Array.isArray(facts) || state.round.activePhase === 'round_end' && facts.length > 0) return false;
  const players = new Set(state.players.map(player => player.id));
  return facts.every(fact => {
    if (!fact || typeof fact !== 'object' || Object.keys(fact).some(key => ![
      'round', 'battlefieldId', 'controllerId', 'sourceCardId', 'sourceDefinitionId', 'abilityId', 'targetPlayerIds',
    ].includes(key))) return false;
    if (fact.round !== state.round.roundNumber || !players.has(fact.controllerId) ||
        !state.map.locations.some(location => location.id === fact.battlefieldId && location.tags.includes('battlefield')) ||
        !Array.isArray(fact.targetPlayerIds) || new Set(fact.targetPlayerIds).size !== fact.targetPlayerIds.length ||
        !fact.targetPlayerIds.every((id: string) => players.has(id))) return false;
    const source = state.cards.find(card => card.instanceId === fact.sourceCardId);
    const producer = runtime?.pack.cards[fact.sourceDefinitionId]?.abilities.find(ability => ability.id === fact.abilityId);
    return !!source && !!producer && containsDefeatEffect(producer.effects);
  });
}
