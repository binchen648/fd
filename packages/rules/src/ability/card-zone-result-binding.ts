import { node, str } from './loader';
import type { AuthoringAbility } from './types';

export function isCardZoneCoreDirectActionRouteCandidate(ability: AuthoringAbility): boolean {
  if (ability.kind !== 'phase_action' || str(ability.activation.phase) !== 'advance' || str(ability.activation.opens) !== 'controller_action_window') return false;
  if (ability.targets.length || ability.cost.length || ability.creates.length || ability.effects.length !== 2) return false;
  const [move, mana] = ability.effects;
  // References and result declarations belong to validation, not ownership.
  return str(move?.type) === 'move_all_remaining' && str(mana?.type) === 'adjust_mana';
}

export function isCardZoneCoreDirectActionSemantic(ability: AuthoringAbility): boolean {
  if (!isCardZoneCoreDirectActionRouteCandidate(ability)) return false;
  const [move, mana] = ability.effects;
  const binding = str(move?.resultVar ?? move?.bind);
  const amount = node(mana?.amount);
  return str(move?.from) === 'hand' && str(node(move?.to).zone) === 'discard' && !!binding &&
    (str(amount.var) === binding ||
      (str(amount.expr) === 'binding_field' && str(amount.binding) === binding && str(amount.field) === 'movedCount' && str(amount.valueType) === 'number'));
}
