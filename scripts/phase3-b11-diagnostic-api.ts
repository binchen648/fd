import { hash, type Obj } from './phase3-tooling-common';

const list = (value: unknown): Obj[] => Array.isArray(value) ? value.map(item => item ?? {}) : [];
const empty = (value: unknown): boolean => value === undefined || (Array.isArray(value) && value.length === 0);
const name = (value: unknown): value is string => typeof value === 'string' && value.length > 0;

function hasBinding(value: unknown): boolean {
  if (!value || typeof value !== 'object') return false;
  if (Array.isArray(value)) return value.some(hasBinding);
  const item = value as Obj;
  return name(item.bind) || ['binding_field', 'binding_status'].includes(item.expr) || Object.values(item).some(hasBinding);
}

function bindingAmount(amount: Obj | undefined, binding: string): boolean {
  return !!amount && (amount.var === binding || (amount.expr === 'binding_field' && amount.binding === binding && amount.field === 'movedCount' && amount.valueType === 'number'));
}

function impactIds(target: Obj): string[] {
  const constraints = list(target.constraints);
  const choices = list(constraints[0]?.conditions);
  if (constraints.length !== 1 || constraints[0]?.type !== 'or' || choices.length !== 2 || choices.some(item => item.type !== 'has_card_id' || !name(item.cardId))) return [];
  return [...new Set(choices.map(item => item.cardId))].sort();
}

function impactTarget(target: Obj, optional: boolean): boolean {
  const conditions = list(target.conditions);
  return name(target.id) && target.type === 'card_instance' && target.scope?.zone === 'removed_from_game' && target.scope?.owner === 'controller'
    && target.count?.min === (optional ? 0 : 1) && target.count?.max === 1 && target.visibility === 'private_to_controller' && impactIds(target).length === 2
    && (optional ? conditions.length === 1 && conditions[0].type === 'controller_mana_at_least' && conditions[0].value === 7 : empty(target.conditions));
}

function movement(effect: Obj, target: Obj): boolean {
  return effect?.type === 'move_card' && effect.target === target.id && effect.from?.zone === 'removed_from_game' && effect.to?.zone === 'skill' && name(effect.bind);
}

function award(effect: Obj, binding: string): boolean {
  const branches = list(effect?.branches);
  const steps = list(branches[0]?.then);
  const amount = steps[0]?.amount;
  const args = list(amount?.args);
  return effect?.type === 'branch' && branches.length === 1 && branches[0]?.if?.expr === 'controller_at_battlefield' && steps.length === 1
    && steps[0].type === 'adjust_victory_points' && steps[0].player === 'controller' && amount?.expr === 'multiply' && args.length === 2
    && args[0].expr === 'binding_field' && args[0].binding === binding && args[0].field === 'movedCount' && args[0].valueType === 'number'
    && (args[1] === 2 || (args[1].expr === 'const' && args[1].value === 2));
}

// Read-only authoring shape diagnostics, not a runtime dispatcher or acceptance oracle.
export function inspectB11AuthoringShape(ability: Obj) {
  const effects = list(ability.effects);
  const activation = ability.activation ?? {};
  const common = ability.kind === 'phase_action' && empty(ability.cost) && empty(ability.creates);
  const conversionCandidate = common && activation.phase === 'advance' && activation.opens === 'controller_action_window' && empty(ability.targets)
    && effects.length === 2 && effects[0].type === 'move_all_remaining' && effects[1].type === 'adjust_mana';
  const goldenCandidate = ability.kind === 'phase_action' && activation.phase === 'combat' && activation.opens === 'controller_combat_action_window'
    && effects.some(effect => effect.type === 'move_card') && (hasBinding(effects) || list(ability.targets).some(target => target.type === 'card_instance' && target.scope?.zone === 'removed_from_game' && target.scope?.owner === 'controller'));
  const targets = list(ability.targets);
  const goldenExact = goldenCandidate && common && empty(ability.conditions) && ability.execution?.mode === 'automatic' && activation.requiresSourceState === 'active'
    && targets.length === 2 && impactTarget(targets[0], false) && impactTarget(targets[1], true) && targets[0].id !== targets[1].id
    && JSON.stringify(impactIds(targets[0])) === JSON.stringify(impactIds(targets[1])) && effects.length === 5
    && movement(effects[0], targets[0]) && award(effects[1], effects[0].bind)
    && effects[2].type === 'pay_mana' && effects[2].player === 'controller' && effects[2].amount === 7 && effects[2].selection === targets[1].id && name(effects[2].bind)
    && movement(effects[3], targets[1]) && effects[3].bind !== effects[0].bind && effects[2].bind !== effects[0].bind && effects[2].bind !== effects[3].bind
    && award(effects[4], effects[3].bind);
  const conversionExact = conversionCandidate && effects[0].from === 'hand' && effects[0].to?.zone === 'discard'
    && name(effects[0].resultVar ?? effects[0].bind) && bindingAmount(effects[1].amount, effects[0].resultVar ?? effects[0].bind);
  return { routeCandidate: !!(goldenCandidate || conversionCandidate), exactEligible: !!(goldenExact || conversionExact),
    shape: goldenCandidate ? 'RESULT_BINDING_PRIVATE_SELECTION' : conversionCandidate ? 'MOVE_REMAINING_COUNT_TO_MANA' : 'OUTSIDE_DIAGNOSTIC_CONTRACT',
    inputSha256: hash(`${JSON.stringify(ability)}\n`) };
}

export function classifyB11InventoryAbility(ability: Obj) {
  return { evaluationStatus: 'EVALUATED', ...inspectB11AuthoringShape(ability), contract: 'B11_AUTHORING_DIAGNOSTIC_V1' };
}

export function classifyB11CoverageEligibility(ability: Obj) {
  const inspected = inspectB11AuthoringShape(ability);
  return { evaluationStatus: 'EVALUATED_EXACT_ELIGIBILITY_RAW_CLASSIFICATION_RETAINED', exactEligible: inspected.exactEligible,
    shape: inspected.shape, inputSha256: inspected.inputSha256, contract: 'B11_AUTHORING_DIAGNOSTIC_V1' };
}
