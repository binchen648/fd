import type { GameState, PlayerState } from '../schema/game';
import type { LocationId } from '../schema/location';
import type { PlayerId, SafeEvent } from './types';

export type EffectExecutionStatus = 'applied' | 'no_op';
export type BindingFieldType = 'number' | 'player_ids' | 'boolean' | 'status';
export type EffectResultType =
  | 'remove_advantage_position'
  | 'move_all_remaining'
  | 'draw_cards'
  | 'play_selected_cards'
  | 'attach_card_to_player_attack'
  | 'activate_card_by_id'
  | 'close_source_card'
  | 'create_card'
  | 'adjust_mana'
  | 'pay_mana'
  | 'adjust_command_seals'
  | 'adjust_victory_points'
  | 'noop'
  | 'fail_invariant';

export interface AffectedEntityRef {
  kind: 'player';
  id: PlayerId;
}

export interface EffectResultEnvelope<Type extends EffectResultType = EffectResultType, Payload = unknown> {
  effectId: string;
  effectType: Type;
  status: EffectExecutionStatus;
  affectedEntities: AffectedEntityRef[];
  payload: Payload;
  emittedEventIds: string[];
}

export interface RemoveAdvantagePositionResult {
  affectedPlayerIds: PlayerId[];
  removedCount: number;
}

export interface AdjustVictoryPointsResult {
  playerId: PlayerId;
  before: number;
  after: number;
  amount: number;
}

export interface AdjustManaResult {
  playerId: PlayerId;
  requestedAmount: number;
  actualAmount: number;
  before: number;
  after: number;
}

export interface PayManaResult {
  playerId: PlayerId;
  requestedAmount: number;
  actualAmount: number;
  before: number;
  after: number;
}

export interface AdjustCommandSealsResult {
  playerId: PlayerId;
  requestedAmount: number;
  actualAmount: number;
  before: number;
  after: number;
  directive?: string;
}

export interface MoveAllRemainingResult {
  ownerPlayerId: PlayerId;
  from: string;
  to: string;
  movedCount: number;
  movedCardIds: string[];
}

export interface DrawCardsResult {
  playerId: PlayerId;
  requestedCount: number;
  actualCount: number;
  movedCardIds: string[];
}

export interface PlaySelectedCardsResult {
  playerId: PlayerId;
  requestedCount: number;
  playedCount: number;
  cardInstanceIds: string[];
  faceDown: boolean;
}

export interface AttachCardToPlayerAttackResult {
  sourceOwnerId: PlayerId;
  targetPlayerId: PlayerId;
  cardInstanceId: string;
  attachedCount: number;
  returnAtRoundEnd: boolean;
  controllerCannotWinStatus: string;
}

export interface ActivateCardByIdResult {
  definitionId: string;
  cardInstanceId: string;
  activatedCount: number;
}

export interface CloseSourceCardResult {
  cardInstanceId: string;
  fromZone: string;
  toZone: 'skill';
  closedCount: number;
}

export interface CreateCardResult {
  definitionId: string;
  cardInstanceId: string;
  destinationZone: 'skill';
  createdCount: number;
}

export interface NoopResult {
  reason: string;
}

export interface FailInvariantResult {
  message: string;
}

export type KnownEffectResult =
  | EffectResultEnvelope<'remove_advantage_position', RemoveAdvantagePositionResult>
  | EffectResultEnvelope<'move_all_remaining', MoveAllRemainingResult>
  | EffectResultEnvelope<'draw_cards', DrawCardsResult>
  | EffectResultEnvelope<'play_selected_cards', PlaySelectedCardsResult>
  | EffectResultEnvelope<'attach_card_to_player_attack', AttachCardToPlayerAttackResult>
  | EffectResultEnvelope<'activate_card_by_id', ActivateCardByIdResult>
  | EffectResultEnvelope<'close_source_card', CloseSourceCardResult>
  | EffectResultEnvelope<'create_card', CreateCardResult>
  | EffectResultEnvelope<'adjust_mana', AdjustManaResult>
  | EffectResultEnvelope<'pay_mana', PayManaResult>
  | EffectResultEnvelope<'adjust_command_seals', AdjustCommandSealsResult>
  | EffectResultEnvelope<'adjust_victory_points', AdjustVictoryPointsResult>
  | EffectResultEnvelope<'noop', NoopResult>
  | EffectResultEnvelope<'fail_invariant', FailInvariantResult>;

export type BindingFieldSchema = Record<string, BindingFieldType>;

export const resultSchemas: Record<EffectResultType, BindingFieldSchema> = {
  remove_advantage_position: {
    affectedPlayerIds: 'player_ids',
    removedCount: 'number',
    status: 'status',
  },
  move_all_remaining: {
    movedCount: 'number',
    status: 'status',
  },
  draw_cards: {
    requestedCount: 'number',
    actualCount: 'number',
    status: 'status',
  },
  play_selected_cards: {
    requestedCount: 'number',
    playedCount: 'number',
    status: 'status',
  },
  attach_card_to_player_attack: {
    attachedCount: 'number',
    status: 'status',
  },
  activate_card_by_id: {
    activatedCount: 'number',
    status: 'status',
  },
  close_source_card: {
    closedCount: 'number',
    status: 'status',
  },
  create_card: {
    createdCount: 'number',
    status: 'status',
  },
  adjust_victory_points: {
    before: 'number',
    after: 'number',
    amount: 'number',
    status: 'status',
  },
  adjust_mana: {
    before: 'number',
    after: 'number',
    requestedAmount: 'number',
    actualAmount: 'number',
    status: 'status',
  },
  pay_mana: {
    before: 'number',
    after: 'number',
    requestedAmount: 'number',
    actualAmount: 'number',
    status: 'status',
  },
  adjust_command_seals: {
    before: 'number',
    after: 'number',
    requestedAmount: 'number',
    actualAmount: 'number',
    status: 'status',
  },
  noop: {
    status: 'status',
  },
  fail_invariant: {
  },
};

interface BindingDefinition {
  id: string;
  effectType: EffectResultType;
  fields: BindingFieldSchema;
}

export interface ResolutionBindingStore {
  set(bindingId: string, result: KnownEffectResult): void;
  get(bindingId: string): KnownEffectResult | undefined;
}

class MapResolutionBindingStore implements ResolutionBindingStore {
  private readonly bindings = new Map<string, KnownEffectResult>();

  set(bindingId: string, result: KnownEffectResult): void {
    this.bindings.set(bindingId, result);
  }

  get(bindingId: string): KnownEffectResult | undefined {
    return this.bindings.get(bindingId);
  }
}

export interface AbilityResolutionContext {
  resolutionId: string;
  causationId: string;
  controllerId: PlayerId;
  sourceCardId: string;
  abilityId: string;
  variables: Record<string, number>;
  selections: Record<string, string[]>;
  bindings: ResolutionBindingStore;
  hooks: AbilityResolutionHooks;
}

export interface AbilityResolutionHooks {
  playSelectedCards?: (input: { state: GameState; playerId: PlayerId; cardInstanceIds: string[]; faceDown: boolean }) => { playedCount: number };
}

export type ValueExpression =
  | number
  | { expr: 'binding_field'; binding: string; field: string; valueType: 'number' };

export type TargetExpression =
  | { expr: 'player_ids'; ids: PlayerId[] }
  | { expr: 'same_battlefield_opponents' }
  | { expr: 'binding_field'; binding: string; field: string; valueType: 'player_ids' };

export type ConditionExpression =
  | boolean
  | { expr: 'binding_field'; binding: string; field: string; valueType: 'boolean' }
  | { expr: 'binding_status'; binding: string; status: EffectExecutionStatus };

export type ResolutionEffectNode =
  | { id: string; type: 'remove_advantage_position'; target: TargetExpression; bind?: string }
  | { id: string; type: 'move_all_remaining'; owner: 'controller'; from: string; to: string; bind?: string }
  | { id: string; type: 'draw_cards'; player: 'controller'; count: ValueExpression; bind?: string }
  | { id: string; type: 'play_selected_cards'; target: string; face: 'face_down' | 'face_up'; bind?: string }
  | { id: string; type: 'attach_card_to_player_attack'; cardId: string; target: string; returnAtRoundEnd: boolean; controllerCannotWinStatus: string; bind?: string }
  | { id: string; type: 'activate_card_by_id'; definitionId: string; bind?: string }
  | { id: string; type: 'close_source_card'; bind?: string }
  | { id: string; type: 'create_card'; cardId: string; to: 'skill'; owner: 'controller'; bind?: string }
  | { id: string; type: 'adjust_mana'; player: 'controller'; amount: ValueExpression; bind?: string }
  | { id: string; type: 'pay_mana'; player: 'controller'; amount: ValueExpression; bind?: string }
  | { id: string; type: 'adjust_command_seals'; player: 'controller'; amount: ValueExpression; directive?: string; bind?: string }
  | { id: string; type: 'adjust_victory_points'; player: 'controller'; amount: ValueExpression; bind?: string }
  | { id: string; type: 'noop'; reason: string; bind?: string }
  | { id: string; type: 'fail_invariant'; message: string }
  | { id: string; type: 'branch'; branches: ResolutionBranch[] };

export interface ResolutionBranch {
  if?: ConditionExpression;
  then: ResolutionEffectNode[];
}

export interface DataFlowIssue {
  code:
    | 'invalid_resolution_node'
    | 'unregistered_primitive'
    | 'unknown_binding'
    | 'future_binding'
    | 'duplicate_binding'
    | 'invalid_result_field'
    | 'wrong_expression_type'
    | 'unsafe_branch_binding';
  path: string;
  message: string;
}

export class DataFlowValidationError extends Error {
  constructor(readonly issues: DataFlowIssue[]) {
    super(`Resolution data-flow validation failed: ${issues.map((issue) => issue.code).join(', ')}`);
  }
}

export class ResolutionRuntimeError extends Error {
  constructor(readonly code: string, message: string) {
    super(message);
  }
}

export interface AbilityResolutionTransaction {
  baseState: GameState;
  workingState: GameState;
  context: AbilityResolutionContext;
  emittedEvents: SafeEvent[];
  results: KnownEffectResult[];
}

export interface ExecuteResolutionInput {
  state: GameState;
  controllerId: PlayerId;
  sourceCardId: string;
  abilityId: string;
  effects: ResolutionEffectNode[];
  selections?: Record<string, string[]>;
  hooks?: AbilityResolutionHooks;
  resolutionId?: string;
  causationId?: string;
}

export interface ExecuteResolutionOutput {
  nextState: GameState;
  context: AbilityResolutionContext;
  emittedEvents: SafeEvent[];
  results: KnownEffectResult[];
}

export type ResolutionPrimitiveNode = Exclude<ResolutionEffectNode, { type: 'branch' }>;

export interface ResolutionPrimitive {
  type: ResolutionPrimitiveNode['type'];
  resultSchema: BindingFieldSchema;
  execute(transaction: AbilityResolutionTransaction, effect: ResolutionPrimitiveNode): KnownEffectResult;
}

const primitiveDefinitions: ResolutionPrimitive[] = [
  {
    type: 'remove_advantage_position',
    resultSchema: resultSchemas.remove_advantage_position,
    execute: removeAdvantagePositionPrimitive,
  },
  {
    type: 'move_all_remaining',
    resultSchema: resultSchemas.move_all_remaining,
    execute: moveAllRemainingPrimitive,
  },
  {
    type: 'draw_cards',
    resultSchema: resultSchemas.draw_cards,
    execute: drawCardsPrimitive,
  },
  {
    type: 'play_selected_cards',
    resultSchema: resultSchemas.play_selected_cards,
    execute: playSelectedCardsPrimitive,
  },
  {
    type: 'attach_card_to_player_attack',
    resultSchema: resultSchemas.attach_card_to_player_attack,
    execute: attachCardToPlayerAttackPrimitive,
  },
  {
    type: 'activate_card_by_id',
    resultSchema: resultSchemas.activate_card_by_id,
    execute: activateCardByIdPrimitive,
  },
  {
    type: 'close_source_card',
    resultSchema: resultSchemas.close_source_card,
    execute: closeSourceCardPrimitive,
  },
  {
    type: 'create_card',
    resultSchema: resultSchemas.create_card,
    execute: createCardPrimitive,
  },
  {
    type: 'adjust_victory_points',
    resultSchema: resultSchemas.adjust_victory_points,
    execute: adjustVictoryPointsPrimitive,
  },
  {
    type: 'adjust_mana',
    resultSchema: resultSchemas.adjust_mana,
    execute: adjustManaPrimitive,
  },
  {
    type: 'pay_mana',
    resultSchema: resultSchemas.pay_mana,
    execute: payManaPrimitive,
  },
  {
    type: 'adjust_command_seals',
    resultSchema: resultSchemas.adjust_command_seals,
    execute: adjustCommandSealsPrimitive,
  },
  {
    type: 'noop',
    resultSchema: resultSchemas.noop,
    execute: noopPrimitive,
  },
  {
    type: 'fail_invariant',
    resultSchema: resultSchemas.fail_invariant,
    execute: failInvariantPrimitive,
  },
];

const resolutionPrimitiveRegistry = new Map<ResolutionPrimitiveNode['type'], ResolutionPrimitive>(
  primitiveDefinitions.map((primitive) => [primitive.type, primitive]),
);

export function getResolutionPrimitive(type: string): ResolutionPrimitive | undefined {
  return resolutionPrimitiveRegistry.get(type as ResolutionPrimitiveNode['type']);
}

export function listResolutionPrimitiveTypes(): ResolutionPrimitiveNode['type'][] {
  return [...resolutionPrimitiveRegistry.keys()];
}

export function hasResolutionDataFlowSyntax(value: unknown): boolean {
  if (Array.isArray(value)) return value.some(hasResolutionDataFlowSyntax);
  if (!value || typeof value !== 'object') return false;
  const current = value as Record<string, unknown>;
  if (typeof current.bind === 'string') return true;
  if (current.expr === 'binding_field' || current.expr === 'binding_status') return true;
  if (current.type === 'remove_advantage_position' || current.type === 'noop' || current.type === 'fail_invariant') return true;
  return Object.values(current).some(hasResolutionDataFlowSyntax);
}

export function normalizeResolutionDataFlowNodes(effects: unknown[], rootPath = 'effects'): ResolutionEffectNode[] {
  const issues: DataFlowIssue[] = [];
  const nodes = effects.map((effect, index) => coerceResolutionEffectNode(effect, `${rootPath}[${index}]`, issues));
  if (issues.length > 0) throw new DataFlowValidationError(issues);
  validateResolutionDataFlow(nodes);
  return nodes;
}

export function validateResolutionDataFlowNodes(effects: unknown[], rootPath = 'effects'): void {
  normalizeResolutionDataFlowNodes(effects, rootPath);
}

export function validateResolutionDataFlow(effects: ResolutionEffectNode[]): void {
  const issues: DataFlowIssue[] = [];
  walkEffects(effects, new Map(), new Map(), issues, 'effects');
  if (issues.length > 0) throw new DataFlowValidationError(issues);
}

export function executeResolution(input: ExecuteResolutionInput): ExecuteResolutionOutput {
  validateResolutionDataFlow(input.effects);
  const workingState = structuredClone(input.state);
  const transaction: AbilityResolutionTransaction = {
    baseState: input.state,
    workingState,
    context: {
      resolutionId: input.resolutionId ?? 'resolution.synthetic',
      causationId: input.causationId ?? 'causation.synthetic',
      controllerId: input.controllerId,
      sourceCardId: input.sourceCardId,
      abilityId: input.abilityId,
      variables: {},
      selections: structuredClone(input.selections ?? {}),
      bindings: new MapResolutionBindingStore(),
      hooks: input.hooks ?? {},
    },
    emittedEvents: [],
    results: [],
  };

  executeNodes(transaction, input.effects);
  return {
    nextState: transaction.workingState,
    context: transaction.context,
    emittedEvents: transaction.emittedEvents,
    results: transaction.results,
  };
}

function walkEffects(
  effects: ResolutionEffectNode[],
  available: Map<string, BindingDefinition>,
  unsafeBranchBindings: Map<string, BindingDefinition>,
  issues: DataFlowIssue[],
  path: string,
): Map<string, BindingDefinition> {
  const current = new Map(available);
  const unsafe = new Map(unsafeBranchBindings);
  for (let index = 0; index < effects.length; index += 1) {
    const effect = effects[index]!;
    const effectPath = `${path}[${index}]`;
    if (effect.type === 'branch') {
      const branchResults = effect.branches.map((branch, branchIndex) => {
        validateConditionExpression(branch.if ?? true, current, unsafe, issues, `${effectPath}.branches[${branchIndex}].if`);
        return walkEffects(branch.then, current, unsafe, issues, `${effectPath}.branches[${branchIndex}].then`);
      });
      const guaranteed = guaranteedBranchBindings(current, branchResults);
      for (const [bindingId, definition] of branchOnlyBindings(current, branchResults)) {
        if (!guaranteed.has(bindingId)) unsafe.set(bindingId, definition);
      }
      for (const [bindingId, definition] of guaranteed) current.set(bindingId, definition);
      continue;
    }

    validateEffectReferences(effect, current, unsafe, issues, effectPath);
    if ('bind' in effect && effect.bind) {
      if (current.has(effect.bind)) {
        issues.push({
          code: 'duplicate_binding',
          path: `${effectPath}.bind`,
          message: `Binding '${effect.bind}' is already defined in this resolution path.`,
        });
      } else {
        const primitive = getResolutionPrimitive(effect.type);
        if (!primitive) {
          issues.push({
            code: 'unregistered_primitive',
            path: `${effectPath}.type`,
            message: `Resolution primitive '${effect.type}' is not registered.`,
          });
          continue;
        }
        current.set(effect.bind, {
          id: effect.bind,
          effectType: effect.type,
          fields: primitive.resultSchema,
        });
      }
    }
  }
  return current;
}

function guaranteedBranchBindings(
  beforeBranch: Map<string, BindingDefinition>,
  branchResults: Map<string, BindingDefinition>[],
): Map<string, BindingDefinition> {
  const guaranteed = new Map<string, BindingDefinition>();
  if (branchResults.length === 0) return guaranteed;
  const [first, ...rest] = branchResults;
  for (const [bindingId, definition] of first!) {
    if (beforeBranch.has(bindingId)) continue;
    if (rest.every((result) => sameBindingDefinition(definition, result.get(bindingId)))) {
      guaranteed.set(bindingId, definition);
    }
  }
  return guaranteed;
}

function sameBindingDefinition(left: BindingDefinition, right: BindingDefinition | undefined): boolean {
  if (!right || left.effectType !== right.effectType) return false;
  return Object.entries(left.fields).every(([field, type]) => right.fields[field] === type);
}

function branchOnlyBindings(
  beforeBranch: Map<string, BindingDefinition>,
  branchResults: Map<string, BindingDefinition>[],
): Map<string, BindingDefinition> {
  const bindings = new Map<string, BindingDefinition>();
  for (const result of branchResults) {
    for (const [bindingId, definition] of result) {
      if (!beforeBranch.has(bindingId)) bindings.set(bindingId, definition);
    }
  }
  return bindings;
}

function validateEffectReferences(
  effect: Exclude<ResolutionEffectNode, { type: 'branch' }>,
  available: Map<string, BindingDefinition>,
  unsafeBranchBindings: Map<string, BindingDefinition>,
  issues: DataFlowIssue[],
  path: string,
): void {
  switch (effect.type) {
    case 'remove_advantage_position':
      validateTargetExpression(effect.target, available, unsafeBranchBindings, issues, `${path}.target`);
      break;
    case 'draw_cards':
      validateValueExpression(effect.count, available, unsafeBranchBindings, issues, `${path}.count`);
      break;
    case 'move_all_remaining':
      if (effect.owner !== 'controller' || effect.from !== 'hand' || effect.to !== 'discard') {
        issues.push({
          code: 'invalid_resolution_node',
          path,
          message: 'Only controller hand to discard move_all_remaining is supported.',
        });
      }
      break;
    case 'play_selected_cards':
      break;
    case 'attach_card_to_player_attack':
      if (!effect.cardId || !effect.target) {
        issues.push({
          code: 'invalid_resolution_node',
          path,
          message: 'attach_card_to_player_attack requires cardId and target.',
        });
      }
      if (effect.returnAtRoundEnd !== true || effect.controllerCannotWinStatus !== 'maiya_cannot_win_battle_this_round') {
        issues.push({
          code: 'invalid_resolution_node',
          path,
          message: 'Only return-at-round-end Maiya cannot-win support attachments are supported.',
        });
      }
      break;
    case 'activate_card_by_id':
      if (!effect.definitionId) {
        issues.push({
          code: 'invalid_resolution_node',
          path,
          message: 'activate_card_by_id requires definitionId.',
        });
      }
      break;
    case 'close_source_card':
      break;
    case 'create_card':
      if (!effect.cardId || effect.to !== 'skill' || effect.owner !== 'controller') {
        issues.push({
          code: 'invalid_resolution_node',
          path,
          message: 'Only controller-owned create_card to skill is supported.',
        });
      }
      break;
    case 'adjust_victory_points':
      validateValueExpression(effect.amount, available, unsafeBranchBindings, issues, `${path}.amount`);
      break;
    case 'adjust_mana':
    case 'pay_mana':
    case 'adjust_command_seals':
      validateValueExpression(effect.amount, available, unsafeBranchBindings, issues, `${path}.amount`);
      break;
    case 'noop':
    case 'fail_invariant':
      break;
  }
}

function validateValueExpression(
  expression: ValueExpression,
  available: Map<string, BindingDefinition>,
  unsafeBranchBindings: Map<string, BindingDefinition>,
  issues: DataFlowIssue[],
  path: string,
): void {
  if (typeof expression === 'number') return;
  validateBindingField(expression.binding, expression.field, 'number', expression.valueType, available, unsafeBranchBindings, issues, path);
}

function validateTargetExpression(
  expression: TargetExpression,
  available: Map<string, BindingDefinition>,
  unsafeBranchBindings: Map<string, BindingDefinition>,
  issues: DataFlowIssue[],
  path: string,
): void {
  if (expression.expr === 'player_ids' || expression.expr === 'same_battlefield_opponents') return;
  validateBindingField(expression.binding, expression.field, 'player_ids', expression.valueType, available, unsafeBranchBindings, issues, path);
}

function validateConditionExpression(
  expression: ConditionExpression,
  available: Map<string, BindingDefinition>,
  unsafeBranchBindings: Map<string, BindingDefinition>,
  issues: DataFlowIssue[],
  path: string,
): void {
  if (typeof expression === 'boolean') return;
  if (expression.expr === 'binding_status') {
    validateBindingField(expression.binding, 'status', 'status', 'status', available, unsafeBranchBindings, issues, path);
    return;
  }
  validateBindingField(expression.binding, expression.field, 'boolean', expression.valueType, available, unsafeBranchBindings, issues, path);
}

function validateBindingField(
  bindingId: string,
  field: string,
  expectedType: BindingFieldType,
  expressionType: BindingFieldType,
  available: Map<string, BindingDefinition>,
  unsafeBranchBindings: Map<string, BindingDefinition>,
  issues: DataFlowIssue[],
  path: string,
): void {
  const definition = available.get(bindingId);
  if (!definition) {
    if (unsafeBranchBindings.has(bindingId)) {
      issues.push({
        code: 'unsafe_branch_binding',
        path,
        message: `Binding '${bindingId}' is defined only on some branch paths.`,
      });
      return;
    }
    issues.push({
      code: 'unknown_binding',
      path,
      message: `Binding '${bindingId}' is not defined before this reference.`,
    });
    issues.push({
      code: 'future_binding',
      path,
      message: `Binding '${bindingId}' may be defined by a later effect or an unsafe branch.`,
    });
    return;
  }
  const actualType = definition.fields[field];
  if (!actualType) {
    issues.push({
      code: 'invalid_result_field',
      path,
      message: `Binding '${bindingId}' has no result field '${field}'.`,
    });
    return;
  }
  if (expressionType !== expectedType || actualType !== expectedType) {
    issues.push({
      code: 'wrong_expression_type',
      path,
      message: `Binding '${bindingId}.${field}' is '${actualType}' but '${expectedType}' is required.`,
    });
  }
}

function executeNodes(transaction: AbilityResolutionTransaction, effects: ResolutionEffectNode[]): void {
  for (const effect of effects) {
    if (effect.type === 'branch') {
      const branch = effect.branches.find((candidate) => evaluateCondition(transaction, candidate.if ?? true));
      if (branch) executeNodes(transaction, branch.then);
      continue;
    }
    const result = executePrimitive(transaction, effect);
    if ('bind' in effect && effect.bind) transaction.context.bindings.set(effect.bind, result);
    transaction.results.push(result);
  }
}

function executePrimitive(
  transaction: AbilityResolutionTransaction,
  effect: Exclude<ResolutionEffectNode, { type: 'branch' }>,
): KnownEffectResult {
  const primitive = getResolutionPrimitive(effect.type);
  if (!primitive) throw new ResolutionRuntimeError('unregistered_primitive', `Resolution primitive '${effect.type}' is not registered.`);
  return primitive.execute(transaction, effect);
}

function removeAdvantagePositionPrimitive(
  transaction: AbilityResolutionTransaction,
  effect: ResolutionPrimitiveNode,
): KnownEffectResult {
  if (effect.type !== 'remove_advantage_position') throw new ResolutionRuntimeError('primitive_type_mismatch', effect.type);
  return removeAdvantagePosition(transaction, effect);
}

function moveAllRemainingPrimitive(
  transaction: AbilityResolutionTransaction,
  effect: ResolutionPrimitiveNode,
): KnownEffectResult {
  if (effect.type !== 'move_all_remaining') throw new ResolutionRuntimeError('primitive_type_mismatch', effect.type);
  return moveAllRemaining(transaction, effect);
}

function drawCardsPrimitive(
  transaction: AbilityResolutionTransaction,
  effect: ResolutionPrimitiveNode,
): KnownEffectResult {
  if (effect.type !== 'draw_cards') throw new ResolutionRuntimeError('primitive_type_mismatch', effect.type);
  return drawCards(transaction, effect);
}

function playSelectedCardsPrimitive(
  transaction: AbilityResolutionTransaction,
  effect: ResolutionPrimitiveNode,
): KnownEffectResult {
  if (effect.type !== 'play_selected_cards') throw new ResolutionRuntimeError('primitive_type_mismatch', effect.type);
  return playSelectedCards(transaction, effect);
}

function attachCardToPlayerAttackPrimitive(
  transaction: AbilityResolutionTransaction,
  effect: ResolutionPrimitiveNode,
): KnownEffectResult {
  if (effect.type !== 'attach_card_to_player_attack') throw new ResolutionRuntimeError('primitive_type_mismatch', effect.type);
  return attachCardToPlayerAttack(transaction, effect);
}

function activateCardByIdPrimitive(
  transaction: AbilityResolutionTransaction,
  effect: ResolutionPrimitiveNode,
): KnownEffectResult {
  if (effect.type !== 'activate_card_by_id') throw new ResolutionRuntimeError('primitive_type_mismatch', effect.type);
  return activateCardById(transaction, effect);
}

function closeSourceCardPrimitive(
  transaction: AbilityResolutionTransaction,
  effect: ResolutionPrimitiveNode,
): KnownEffectResult {
  if (effect.type !== 'close_source_card') throw new ResolutionRuntimeError('primitive_type_mismatch', effect.type);
  return closeSourceCard(transaction, effect);
}

function createCardPrimitive(
  transaction: AbilityResolutionTransaction,
  effect: ResolutionPrimitiveNode,
): KnownEffectResult {
  if (effect.type !== 'create_card') throw new ResolutionRuntimeError('primitive_type_mismatch', effect.type);
  return createCard(transaction, effect);
}

function adjustVictoryPointsPrimitive(
  transaction: AbilityResolutionTransaction,
  effect: ResolutionPrimitiveNode,
): KnownEffectResult {
  if (effect.type !== 'adjust_victory_points') throw new ResolutionRuntimeError('primitive_type_mismatch', effect.type);
  return adjustVictoryPoints(transaction, effect);
}

function adjustManaPrimitive(
  transaction: AbilityResolutionTransaction,
  effect: ResolutionPrimitiveNode,
): KnownEffectResult {
  if (effect.type !== 'adjust_mana') throw new ResolutionRuntimeError('primitive_type_mismatch', effect.type);
  return adjustMana(transaction, effect);
}

function payManaPrimitive(
  transaction: AbilityResolutionTransaction,
  effect: ResolutionPrimitiveNode,
): KnownEffectResult {
  if (effect.type !== 'pay_mana') throw new ResolutionRuntimeError('primitive_type_mismatch', effect.type);
  return payMana(transaction, effect);
}

function adjustCommandSealsPrimitive(
  transaction: AbilityResolutionTransaction,
  effect: ResolutionPrimitiveNode,
): KnownEffectResult {
  if (effect.type !== 'adjust_command_seals') throw new ResolutionRuntimeError('primitive_type_mismatch', effect.type);
  return adjustCommandSeals(transaction, effect);
}

function noopPrimitive(_transaction: AbilityResolutionTransaction, effect: ResolutionPrimitiveNode): KnownEffectResult {
  if (effect.type !== 'noop') throw new ResolutionRuntimeError('primitive_type_mismatch', effect.type);
  return {
    effectId: effect.id,
    effectType: 'noop',
    status: 'no_op',
    affectedEntities: [],
    payload: { reason: effect.reason },
    emittedEventIds: [],
  };
}

function failInvariantPrimitive(_transaction: AbilityResolutionTransaction, effect: ResolutionPrimitiveNode): KnownEffectResult {
  if (effect.type !== 'fail_invariant') throw new ResolutionRuntimeError('primitive_type_mismatch', effect.type);
  throw new ResolutionRuntimeError('runtime_invariant_failed', effect.message);
}

function removeAdvantagePosition(
  transaction: AbilityResolutionTransaction,
  effect: Extract<ResolutionEffectNode, { type: 'remove_advantage_position' }>,
): KnownEffectResult {
  const state = terrainState(transaction.workingState);
  const targets = evaluateTargets(transaction, effect.target);
  const affectedPlayerIds: PlayerId[] = [];
  for (const playerId of targets) {
    if (removeTerrainAssignment(state, playerId)) affectedPlayerIds.push(playerId);
  }
  const eventId = `${transaction.context.resolutionId}.${effect.id}.terrain_removed`;
  if (affectedPlayerIds.length > 0) {
    transaction.emittedEvents.push({
      type: 'advantage_position_removed',
      playerId: transaction.context.controllerId,
      sourceCardId: transaction.context.sourceCardId,
      abilityId: transaction.context.abilityId,
    });
  }
  return {
    effectId: effect.id,
    effectType: 'remove_advantage_position',
    status: affectedPlayerIds.length > 0 ? 'applied' : 'no_op',
    affectedEntities: affectedPlayerIds.map((id) => ({ kind: 'player', id })),
    payload: {
      affectedPlayerIds,
      removedCount: affectedPlayerIds.length,
    },
    emittedEventIds: affectedPlayerIds.length > 0 ? [eventId] : [],
  };
}

function moveAllRemaining(
  transaction: AbilityResolutionTransaction,
  effect: Extract<ResolutionEffectNode, { type: 'move_all_remaining' }>,
): KnownEffectResult {
  if (effect.from !== 'hand' || effect.to !== 'discard') {
    throw new ResolutionRuntimeError('unsupported_zone_move', 'Only controller hand to discard move_all_remaining is supported.');
  }
  const movedCardIds: string[] = [];
  for (const candidate of transaction.workingState.cards) {
    if (candidate.ownerPlayerId !== transaction.context.controllerId || candidate.zone !== effect.from) continue;
    movedCardIds.push(candidate.instanceId);
    moveCardInstance(transaction, candidate.instanceId, effect.to);
  }
  const eventId = `${transaction.context.resolutionId}.${effect.id}.cards_moved`;
  if (movedCardIds.length > 0) {
    transaction.emittedEvents.push({
      type: 'cards_moved',
      playerId: transaction.context.controllerId,
      sourceCardId: transaction.context.sourceCardId,
      abilityId: transaction.context.abilityId,
      resultId: eventId,
      revision: transaction.workingState.abilityRuntime?.revision ?? 0,
    });
  }
  return {
    effectId: effect.id,
    effectType: 'move_all_remaining',
    status: movedCardIds.length === 0 ? 'no_op' : 'applied',
    affectedEntities: movedCardIds.length === 0 ? [] : [{ kind: 'player', id: transaction.context.controllerId }],
    payload: {
      ownerPlayerId: transaction.context.controllerId,
      from: effect.from,
      to: effect.to,
      movedCount: movedCardIds.length,
      movedCardIds,
    },
    emittedEventIds: movedCardIds.length === 0 ? [] : [eventId],
  };
}

function drawCards(
  transaction: AbilityResolutionTransaction,
  effect: Extract<ResolutionEffectNode, { type: 'draw_cards' }>,
): KnownEffectResult {
  const count = evaluateIntegerAmount(transaction, effect.count, 'draw_cards');
  if (count < 0) throw new ResolutionRuntimeError('invalid_count', 'Draw count must be nonnegative.');
  const movedCardIds: string[] = [];
  for (let index = 0; index < count; index += 1) {
    if (!transaction.workingState.cards.some((candidate) =>
      candidate.ownerPlayerId === transaction.context.controllerId && candidate.zone === 'deck')) {
      for (const discarded of transaction.workingState.cards.filter((candidate) =>
        candidate.ownerPlayerId === transaction.context.controllerId && candidate.zone === 'discard')) {
        moveCardInstance(transaction, discarded.instanceId, 'deck');
      }
      shuffleControllerDeck(transaction, transaction.context.controllerId);
    }
    const top = transaction.workingState.cards.find((candidate) =>
      candidate.ownerPlayerId === transaction.context.controllerId && candidate.zone === 'deck');
    if (!top) break;
    movedCardIds.push(top.instanceId);
    moveCardInstance(transaction, top.instanceId, 'hand');
  }
  const eventId = `${transaction.context.resolutionId}.${effect.id}.cards_drawn`;
  if (movedCardIds.length > 0) {
    transaction.emittedEvents.push({
      type: 'cards_drawn',
      playerId: transaction.context.controllerId,
      sourceCardId: transaction.context.sourceCardId,
      abilityId: transaction.context.abilityId,
      resultId: eventId,
      revision: transaction.workingState.abilityRuntime?.revision ?? 0,
    });
  }
  return {
    effectId: effect.id,
    effectType: 'draw_cards',
    status: movedCardIds.length === 0 ? 'no_op' : 'applied',
    affectedEntities: movedCardIds.length === 0 ? [] : [{ kind: 'player', id: transaction.context.controllerId }],
    payload: {
      playerId: transaction.context.controllerId,
      requestedCount: count,
      actualCount: movedCardIds.length,
      movedCardIds,
    },
    emittedEventIds: movedCardIds.length === 0 ? [] : [eventId],
  };
}

function playSelectedCards(
  transaction: AbilityResolutionTransaction,
  effect: Extract<ResolutionEffectNode, { type: 'play_selected_cards' }>,
): KnownEffectResult {
  const cardInstanceIds = transaction.context.selections[effect.target] ?? [];
  const hook = transaction.context.hooks.playSelectedCards;
  if (!hook) throw new ResolutionRuntimeError('missing_runtime_hook', 'play_selected_cards requires a trusted play batch hook.');
  const faceDown = effect.face === 'face_down';
  const result = hook({ state: transaction.workingState, playerId: transaction.context.controllerId, cardInstanceIds, faceDown });
  return {
    effectId: effect.id,
    effectType: 'play_selected_cards',
    status: result.playedCount === 0 ? 'no_op' : 'applied',
    affectedEntities: result.playedCount === 0 ? [] : [{ kind: 'player', id: transaction.context.controllerId }],
    payload: {
      playerId: transaction.context.controllerId,
      requestedCount: cardInstanceIds.length,
      playedCount: result.playedCount,
      cardInstanceIds,
      faceDown,
    },
    emittedEventIds: [],
  };
}

function attachCardToPlayerAttack(
  transaction: AbilityResolutionTransaction,
  effect: Extract<ResolutionEffectNode, { type: 'attach_card_to_player_attack' }>,
): KnownEffectResult {
  if (effect.returnAtRoundEnd !== true || effect.controllerCannotWinStatus !== 'maiya_cannot_win_battle_this_round') {
    throw new ResolutionRuntimeError('unsupported_add_to_attack_shape', 'Only return-at-round-end Maiya cannot-win support attachments are supported.');
  }
  const targetPlayerId = transaction.context.selections[effect.target]?.[0];
  if (!targetPlayerId || targetPlayerId === transaction.context.controllerId) {
    throw new ResolutionRuntimeError('invalid_target', 'Support attachment requires one non-controller target player.');
  }
  const target = transaction.workingState.players.find((player) => player.id === targetPlayerId && player.status === 'active');
  if (!target) throw new ResolutionRuntimeError('invalid_target', `Missing active target player '${targetPlayerId}'.`);
  const support = transaction.workingState.cards.find((candidate) =>
    candidate.ownerPlayerId === transaction.context.controllerId &&
    candidate.definitionId === effect.cardId &&
    candidate.zone === 'skill');
  if (!support) throw new ResolutionRuntimeError('missing_support_card', `Missing support card '${effect.cardId}'.`);
  support.zone = 'attack_area';
  support.controllerPlayerId = targetPlayerId;
  support.visibility = { scope: 'public' };
  if (transaction.workingState.abilityRuntime) {
    transaction.workingState.abilityRuntime.cardState[support.instanceId] = {
      active: true,
      faceDown: false,
      playedRound: transaction.workingState.round.roundNumber,
    };
  }
  const stateWithMode = transaction.workingState as GameState & {
    modeState?: { supportShotAttachments?: Array<Record<string, unknown>> };
    activeStatuses?: Array<Record<string, unknown>>;
  };
  stateWithMode.modeState ??= {};
  stateWithMode.modeState.supportShotAttachments = [
    ...(stateWithMode.modeState.supportShotAttachments ?? []),
    {
      sourceOwnerId: transaction.context.controllerId,
      targetPlayerId,
      cardInstanceId: support.instanceId,
      sourceCardId: transaction.context.sourceCardId,
      abilityId: transaction.context.abilityId,
      returnAtRoundEnd: true,
    },
  ];
  stateWithMode.activeStatuses = [
    ...(stateWithMode.activeStatuses ?? []),
    {
      id: effect.controllerCannotWinStatus,
      sourceControllerId: transaction.context.controllerId,
      duration: 'this_round',
    },
  ];
  const eventId = `${transaction.context.resolutionId}.${effect.id}.attack_added`;
  transaction.emittedEvents.push({
    type: 'attack_added',
    playerId: targetPlayerId,
    sourceCardId: transaction.context.sourceCardId,
    abilityId: transaction.context.abilityId,
    resultId: eventId,
    revision: transaction.workingState.abilityRuntime?.revision ?? 0,
  });
  return {
    effectId: effect.id,
    effectType: 'attach_card_to_player_attack',
    status: 'applied',
    affectedEntities: [{ kind: 'player', id: targetPlayerId }],
    payload: {
      sourceOwnerId: transaction.context.controllerId,
      targetPlayerId,
      cardInstanceId: support.instanceId,
      attachedCount: 1,
      returnAtRoundEnd: true,
      controllerCannotWinStatus: effect.controllerCannotWinStatus,
    },
    emittedEventIds: [eventId],
  };
}

function activateCardById(
  transaction: AbilityResolutionTransaction,
  effect: Extract<ResolutionEffectNode, { type: 'activate_card_by_id' }>,
): KnownEffectResult {
  const targets = transaction.workingState.cards.filter((candidate) =>
    candidate.ownerPlayerId === transaction.context.controllerId && candidate.definitionId === effect.definitionId);
  if (targets.length === 0) throw new ResolutionRuntimeError('missing_activation_target', `Missing owned activation target '${effect.definitionId}'.`);
  if (targets.length !== 1) throw new ResolutionRuntimeError('ambiguous_activation_target', `Activation target '${effect.definitionId}' is ambiguous.`);
  const target = targets[0]!;
  if (target.controllerPlayerId !== transaction.context.controllerId) {
    throw new ResolutionRuntimeError('invalid_activation_controller', `Activation target '${effect.definitionId}' is controlled by another player.`);
  }
  if (target.zone !== 'skill') throw new ResolutionRuntimeError('invalid_activation_zone', `Activation target '${effect.definitionId}' must be in skill.`);
  const runtime = transaction.workingState.abilityRuntime;
  if (runtime?.cardState[target.instanceId]?.active) {
    throw new ResolutionRuntimeError('already_active', `Activation target '${effect.definitionId}' is already active.`);
  }
  target.zone = 'field';
  target.controllerPlayerId = transaction.context.controllerId;
  target.visibility = { scope: 'public' };
  if (runtime) {
    runtime.cardState[target.instanceId] = {
      active: true,
      faceDown: false,
      playedRound: transaction.workingState.round.roundNumber,
    };
  }
  const eventId = `${transaction.context.resolutionId}.${effect.id}.card_activated`;
  transaction.emittedEvents.push({
    type: 'card_activated',
    playerId: transaction.context.controllerId,
    sourceCardId: transaction.context.sourceCardId,
    abilityId: transaction.context.abilityId,
    resultId: eventId,
    revision: runtime?.revision ?? 0,
  });
  return {
    effectId: effect.id,
    effectType: 'activate_card_by_id',
    status: 'applied',
    affectedEntities: [{ kind: 'player', id: transaction.context.controllerId }],
    payload: {
      definitionId: effect.definitionId,
      cardInstanceId: target.instanceId,
      activatedCount: 1,
    },
    emittedEventIds: [eventId],
  };
}

function closeSourceCard(
  transaction: AbilityResolutionTransaction,
  effect: Extract<ResolutionEffectNode, { type: 'close_source_card' }>,
): KnownEffectResult {
  const source = transaction.workingState.cards.find((candidate) => candidate.instanceId === transaction.context.sourceCardId);
  if (!source) throw new ResolutionRuntimeError('missing_close_source', 'Close source card is missing.');
  if (source.controllerPlayerId !== transaction.context.controllerId) {
    throw new ResolutionRuntimeError('invalid_close_controller', 'Close source card is not controlled by the ability controller.');
  }
  if (!['field', 'attack_area'].includes(source.zone)) {
    throw new ResolutionRuntimeError('invalid_close_zone', 'Close source card must be active on the board.');
  }
  const runtime = transaction.workingState.abilityRuntime;
  if (runtime) {
    const state = runtime.cardState[source.instanceId];
    if (!runtime.pack.cards[source.definitionId]) {
      throw new ResolutionRuntimeError('missing_close_definition', 'Close source card has no compiled definition.');
    }
    if (!state?.active) throw new ResolutionRuntimeError('inactive_close_source', 'Close source card is not active.');
    if (state.faceDown) throw new ResolutionRuntimeError('face_down_close_source', 'Close source card must be face up.');
    state.active = false;
    state.faceDown = false;
  }
  const fromZone = source.zone;
  source.zone = 'skill';
  source.visibility = { scope: 'owner_only', ownerPlayerId: source.ownerPlayerId };
  const eventId = `${transaction.context.resolutionId}.${effect.id}.source_card_closed`;
  transaction.emittedEvents.push({
    type: 'source_card_closed',
    playerId: transaction.context.controllerId,
    sourceCardId: source.instanceId,
    abilityId: transaction.context.abilityId,
    resultId: eventId,
    revision: runtime?.revision ?? 0,
  });
  return {
    effectId: effect.id,
    effectType: 'close_source_card',
    status: 'applied',
    affectedEntities: [{ kind: 'player', id: transaction.context.controllerId }],
    payload: { cardInstanceId: source.instanceId, fromZone, toZone: 'skill', closedCount: 1 },
    emittedEventIds: [eventId],
  };
}

function createCard(
  transaction: AbilityResolutionTransaction,
  effect: Extract<ResolutionEffectNode, { type: 'create_card' }>,
): KnownEffectResult {
  if (effect.to !== 'skill' || effect.owner !== 'controller') {
    throw new ResolutionRuntimeError('unsupported_create_card_shape', 'Only controller-owned create_card to skill is supported.');
  }
  const runtime = transaction.workingState.abilityRuntime;
  if (!runtime?.pack.cards[effect.cardId]) {
    throw new ResolutionRuntimeError('missing_created_definition', `Created card definition '${effect.cardId}' is not compiled.`);
  }
  const existingCards = transaction.workingState.cards.filter((candidate) =>
    candidate.ownerPlayerId === transaction.context.controllerId && candidate.definitionId === effect.cardId);
  if (existingCards.length > 0) {
    if (existingCards.some((candidate) => candidate.generatedBy !== transaction.context.sourceCardId)) {
      throw new ResolutionRuntimeError('duplicate_created_card', `Existing card '${effect.cardId}' has incompatible creation provenance.`);
    }
    const existing = existingCards[0]!;
    return {
      effectId: effect.id,
      effectType: 'create_card',
      status: 'no_op',
      affectedEntities: [],
      payload: {
        definitionId: effect.cardId,
        cardInstanceId: existing.instanceId,
        destinationZone: 'skill',
        createdCount: 0,
      },
      emittedEventIds: [],
    };
  }
  let cardInstanceId = `created-${++runtime.sequence}`;
  while (transaction.workingState.cards.some((candidate) => candidate.instanceId === cardInstanceId)) {
    cardInstanceId = `created-${++runtime.sequence}`;
  }
  transaction.workingState.cards.push({
    instanceId: cardInstanceId,
    definitionId: effect.cardId,
    ownerPlayerId: transaction.context.controllerId,
    controllerPlayerId: transaction.context.controllerId,
    zone: 'skill',
    visibility: { scope: 'owner_only', ownerPlayerId: transaction.context.controllerId },
    generatedBy: transaction.context.sourceCardId,
  });
  const eventId = `${transaction.context.resolutionId}.${effect.id}.card_created`;
  transaction.emittedEvents.push({
    type: 'card_created',
    playerId: transaction.context.controllerId,
    sourceCardId: transaction.context.sourceCardId,
    abilityId: transaction.context.abilityId,
    resultId: eventId,
    revision: runtime.revision,
  });
  return {
    effectId: effect.id,
    effectType: 'create_card',
    status: 'applied',
    affectedEntities: [{ kind: 'player', id: transaction.context.controllerId }],
    payload: {
      definitionId: effect.cardId,
      cardInstanceId,
      destinationZone: 'skill',
      createdCount: 1,
    },
    emittedEventIds: [eventId],
  };
}

function adjustVictoryPoints(
  transaction: AbilityResolutionTransaction,
  effect: Extract<ResolutionEffectNode, { type: 'adjust_victory_points' }>,
): KnownEffectResult {
  const amount = evaluateIntegerAmount(transaction, effect.amount, 'adjust_victory_points');
  const player = findPlayer(transaction.workingState, transaction.context.controllerId);
  const before = player.vp;
  player.vp = Math.max(0, before + amount);
  const actualAmount = player.vp - before;
  const eventId = `${transaction.context.resolutionId}.${effect.id}.vp_adjusted`;
  transaction.emittedEvents.push(resourceEvent(transaction, eventId, 'victory_points_adjusted', player.id, 'victory_points', actualAmount, before, player.vp));
  return {
    effectId: effect.id,
    effectType: 'adjust_victory_points',
    status: actualAmount === 0 ? 'no_op' : 'applied',
    affectedEntities: actualAmount === 0 ? [] : [{ kind: 'player', id: player.id }],
    payload: { playerId: player.id, before, after: player.vp, amount: actualAmount },
    emittedEventIds: [eventId],
  };
}

function adjustMana(
  transaction: AbilityResolutionTransaction,
  effect: Extract<ResolutionEffectNode, { type: 'adjust_mana' }>,
): KnownEffectResult {
  const amount = evaluateIntegerAmount(transaction, effect.amount, 'adjust_mana');
  const player = findPlayer(transaction.workingState, transaction.context.controllerId);
  const runtime = transaction.workingState.abilityRuntime;
  const before = player.mana;
  const cap = runtime?.manaCaps[player.id] ?? 12;
  const blocked = amount > 0 && runtime?.manaGainBlocked.includes(player.id);
  const after = blocked ? before : amount > 0 ? Math.min(cap, before + amount) : Math.max(0, before + amount);
  player.mana = after;
  const actualAmount = after - before;
  const eventId = `${transaction.context.resolutionId}.${effect.id}.mana_adjusted`;
  if (actualAmount !== 0) {
    transaction.emittedEvents.push(resourceEvent(transaction, eventId, 'mana_adjusted', player.id, 'mana', actualAmount, before, after));
  }
  return {
    effectId: effect.id,
    effectType: 'adjust_mana',
    status: actualAmount === 0 ? 'no_op' : 'applied',
    affectedEntities: actualAmount === 0 ? [] : [{ kind: 'player', id: player.id }],
    payload: { playerId: player.id, requestedAmount: amount, actualAmount, before, after },
    emittedEventIds: actualAmount === 0 ? [] : [eventId],
  };
}

function payMana(
  transaction: AbilityResolutionTransaction,
  effect: Extract<ResolutionEffectNode, { type: 'pay_mana' }>,
): KnownEffectResult {
  const amount = evaluateIntegerAmount(transaction, effect.amount, 'pay_mana');
  if (amount < 0) throw new ResolutionRuntimeError('invalid_amount', 'Mana payment amount must be nonnegative.');
  const player = findPlayer(transaction.workingState, transaction.context.controllerId);
  const before = player.mana;
  if (amount > before) throw new ResolutionRuntimeError('insufficient_mana', 'Cannot pay mana.');
  player.mana = before - amount;
  const eventId = `${transaction.context.resolutionId}.${effect.id}.mana_paid`;
  transaction.emittedEvents.push(resourceEvent(transaction, eventId, 'mana_paid', player.id, 'mana', -amount, before, player.mana));
  return {
    effectId: effect.id,
    effectType: 'pay_mana',
    status: amount === 0 ? 'no_op' : 'applied',
    affectedEntities: amount === 0 ? [] : [{ kind: 'player', id: player.id }],
    payload: { playerId: player.id, requestedAmount: amount, actualAmount: amount, before, after: player.mana },
    emittedEventIds: [eventId],
  };
}

function adjustCommandSeals(
  transaction: AbilityResolutionTransaction,
  effect: Extract<ResolutionEffectNode, { type: 'adjust_command_seals' }>,
): KnownEffectResult {
  const amount = evaluateIntegerAmount(transaction, effect.amount, 'adjust_command_seals');
  const player = findPlayer(transaction.workingState, transaction.context.controllerId) as PlayerState & { commandSpells?: number };
  const before = Number(player.commandSpells ?? 3);
  const after = before + amount;
  if (!Number.isSafeInteger(before) || !Number.isSafeInteger(after) || after < 0) {
    throw new ResolutionRuntimeError('insufficient_command_seals', 'Command seal adjustment would go below zero.');
  }
  player.commandSpells = after;
  const eventId = `${transaction.context.resolutionId}.${effect.id}.command_seals_adjusted`;
  transaction.emittedEvents.push(resourceEvent(transaction, eventId, 'command_seals_adjusted', player.id, 'command_seals', amount, before, after));
  return {
    effectId: effect.id,
    effectType: 'adjust_command_seals',
    status: amount === 0 ? 'no_op' : 'applied',
    affectedEntities: amount === 0 ? [] : [{ kind: 'player', id: player.id }],
    payload: { playerId: player.id, requestedAmount: amount, actualAmount: amount, before, after, ...(effect.directive ? { directive: effect.directive } : {}) },
    emittedEventIds: [eventId],
  };
}

function resourceEvent(
  transaction: AbilityResolutionTransaction,
  resultId: string,
  type: SafeEvent['type'],
  playerId: PlayerId,
  resource: NonNullable<SafeEvent['resource']>,
  delta: number,
  before: number,
  after: number,
): SafeEvent {
  return {
    type,
    playerId,
    sourceCardId: transaction.context.sourceCardId,
    abilityId: transaction.context.abilityId,
    sourceAbilityId: transaction.context.abilityId,
    controllerId: transaction.context.controllerId,
    resource,
    delta,
    before,
    after,
    resultId,
    revision: transaction.workingState.abilityRuntime?.revision ?? 0,
  };
}

function evaluateValue(transaction: AbilityResolutionTransaction, expression: ValueExpression): number {
  if (typeof expression === 'number') return expression;
  const result = transaction.context.bindings.get(expression.binding);
  if (!result) throw new ResolutionRuntimeError('missing_binding', `Missing binding '${expression.binding}'`);
  if (result.effectType === 'remove_advantage_position' && expression.field === 'removedCount') return result.payload.removedCount;
  if (result.effectType === 'move_all_remaining' && expression.field === 'movedCount') return result.payload.movedCount;
  if (result.effectType === 'draw_cards') {
    if (expression.field === 'requestedCount') return result.payload.requestedCount;
    if (expression.field === 'actualCount') return result.payload.actualCount;
  }
  if (result.effectType === 'play_selected_cards') {
    if (expression.field === 'requestedCount') return result.payload.requestedCount;
    if (expression.field === 'playedCount') return result.payload.playedCount;
  }
  if (result.effectType === 'attach_card_to_player_attack' && expression.field === 'attachedCount') return result.payload.attachedCount;
  if (result.effectType === 'activate_card_by_id' && expression.field === 'activatedCount') return result.payload.activatedCount;
  if (result.effectType === 'close_source_card' && expression.field === 'closedCount') return result.payload.closedCount;
  if (result.effectType === 'create_card' && expression.field === 'createdCount') return result.payload.createdCount;
  if (result.effectType === 'adjust_victory_points') {
    if (expression.field === 'amount') return result.payload.amount;
    if (expression.field === 'before') return result.payload.before;
    if (expression.field === 'after') return result.payload.after;
  }
  if (['adjust_mana', 'pay_mana', 'adjust_command_seals'].includes(result.effectType)) {
    const payload = result.payload as AdjustManaResult | PayManaResult | AdjustCommandSealsResult;
    if (expression.field === 'requestedAmount') return payload.requestedAmount;
    if (expression.field === 'actualAmount') return payload.actualAmount;
    if (expression.field === 'before') return payload.before;
    if (expression.field === 'after') return payload.after;
  }
  throw new ResolutionRuntimeError('invalid_binding_field', `Invalid numeric binding field '${expression.binding}.${expression.field}'`);
}

function evaluateIntegerAmount(transaction: AbilityResolutionTransaction, expression: ValueExpression, primitive: string): number {
  const value = evaluateValue(transaction, expression);
  if (!Number.isSafeInteger(value)) throw new ResolutionRuntimeError('invalid_amount', `${primitive} amount must be a safe integer.`);
  return value;
}

function evaluateTargets(transaction: AbilityResolutionTransaction, expression: TargetExpression): PlayerId[] {
  if (expression.expr === 'player_ids') return expression.ids;
  if (expression.expr === 'same_battlefield_opponents') {
    const controller = findPlayer(transaction.workingState, transaction.context.controllerId);
    return transaction.workingState.players
      .filter((player) => player.id !== controller.id && player.status === 'active' && player.locationId === controller.locationId)
      .map((player) => player.id);
  }
  const result = transaction.context.bindings.get(expression.binding);
  if (!result) throw new ResolutionRuntimeError('missing_binding', `Missing binding '${expression.binding}'`);
  if (result.effectType === 'remove_advantage_position' && expression.field === 'affectedPlayerIds') return result.payload.affectedPlayerIds;
  throw new ResolutionRuntimeError('invalid_binding_field', `Invalid target binding field '${expression.binding}.${expression.field}'`);
}

function evaluateCondition(transaction: AbilityResolutionTransaction, expression: ConditionExpression): boolean {
  if (typeof expression === 'boolean') return expression;
  const result = transaction.context.bindings.get(expression.binding);
  if (!result) throw new ResolutionRuntimeError('missing_binding', `Missing binding '${expression.binding}'`);
  if (expression.expr === 'binding_status') return result.status === expression.status;
  throw new ResolutionRuntimeError('invalid_binding_field', `Invalid condition binding field '${expression.binding}.${expression.field}'`);
}

type TerrainModeState = {
  modeState?: {
    terrainAssignments?: Partial<Record<LocationId, PlayerId[]>>;
  };
};

function terrainState(state: GameState): GameState & TerrainModeState {
  const target = state as GameState & TerrainModeState;
  target.modeState ??= {};
  target.modeState.terrainAssignments ??= {};
  return target;
}

function removeTerrainAssignment(state: GameState & TerrainModeState, playerId: PlayerId): boolean {
  const assignments = state.modeState?.terrainAssignments;
  if (!assignments) return false;
  for (const [locationId, assigned] of Object.entries(assignments)) {
    if (!assigned) continue;
    const next = assigned.filter((id) => id !== playerId);
    if (next.length !== assigned.length) {
      assignments[locationId as LocationId] = next;
      return true;
    }
  }
  return false;
}

function findPlayer(state: GameState, playerId: PlayerId): PlayerState {
  const found = state.players.find((player) => player.id === playerId);
  if (!found) throw new ResolutionRuntimeError('missing_player', `Missing player '${playerId}'`);
  return found;
}

function moveCardInstance(transaction: AbilityResolutionTransaction, cardInstanceId: string, zone: string): void {
  if (!['hand', 'deck', 'discard', 'field', 'skill', 'attack_area', 'removed_from_game', 'looked_cards'].includes(zone)) {
    throw new ResolutionRuntimeError('unsupported_zone', `Unsupported destination zone '${zone}'.`);
  }
  const found = transaction.workingState.cards.find((candidate) => candidate.instanceId === cardInstanceId);
  if (!found) throw new ResolutionRuntimeError('missing_card', `Missing card '${cardInstanceId}'.`);
  found.zone = zone;
  found.visibility = zone === 'field' || zone === 'attack_area' || zone === 'removed_from_game'
    ? { scope: 'public' }
    : { scope: 'owner_only', ownerPlayerId: found.ownerPlayerId };
  if (!['field', 'attack_area'].includes(zone) && transaction.workingState.abilityRuntime?.cardState[cardInstanceId]) {
    transaction.workingState.abilityRuntime.cardState[cardInstanceId]!.active = false;
  }
}

function shuffleControllerDeck(transaction: AbilityResolutionTransaction, ownerPlayerId: PlayerId): void {
  const indexes = transaction.workingState.cards
    .map((candidate, index) => candidate.ownerPlayerId === ownerPlayerId && candidate.zone === 'deck' ? index : -1)
    .filter((index) => index >= 0);
  const deck = indexes.map((index) => transaction.workingState.cards[index]!);
  for (let index = deck.length - 1; index > 0; index -= 1) {
    const runtime = transaction.workingState.abilityRuntime;
    let randomState = runtime?.randomState ?? 1;
    randomState ^= randomState << 13;
    randomState ^= randomState >>> 17;
    randomState ^= randomState << 5;
    if (runtime) runtime.randomState = randomState >>> 0;
    const swapIndex = Math.floor(((randomState >>> 0) / 0x100000000) * (index + 1));
    [deck[index], deck[swapIndex]] = [deck[swapIndex]!, deck[index]!];
  }
  indexes.forEach((cardIndex, deckIndex) => {
    transaction.workingState.cards[cardIndex] = deck[deckIndex]!;
  });
}

function coerceResolutionEffectNode(value: unknown, path: string, issues: DataFlowIssue[]): ResolutionEffectNode {
  if (!value || typeof value !== 'object' || Array.isArray(value)) {
    invalidNode(path, 'Resolution effect must be an object.', issues);
    return { id: path, type: 'noop', reason: 'invalid node placeholder' };
  }
  const current = value as Record<string, unknown>;
  const id = typeof current.id === 'string' && current.id ? current.id : path;
  const type = typeof current.type === 'string' ? current.type : '';
  switch (type) {
    case 'remove_advantage_position':
      return {
        id,
        type,
        target: coerceTargetExpression(current.target, `${path}.target`, issues),
        ...coerceBind(current.bind),
      };
    case 'move_all_remaining':
      return {
        id,
        type,
        owner: current.owner === undefined || current.owner === 'controller' ? 'controller' : reportControllerOwner(path, issues),
        from: stringField(current, 'from', `${path}.from`, issues),
        to: zoneField(current.to, `${path}.to`, issues),
        ...coerceLegacyBind(current.bind ?? current.resultVar),
      };
    case 'draw_cards':
      return {
        id,
        type,
        player: current.player === undefined || current.player === 'controller' ? 'controller' : reportControllerPlayer(path, issues),
        count: coerceValueExpression(current.count, `${path}.count`, issues),
        ...coerceBind(current.bind),
      };
    case 'play_selected_cards':
      return {
        id,
        type,
        target: stringField(current, 'target', `${path}.target`, issues),
        face: current.face === 'face_down' || current.face === 'face_up' ? current.face : reportFace(path, issues),
        ...coerceBind(current.bind),
      };
    case 'attach_card_to_player_attack':
      return {
        id,
        type,
        cardId: stringField(current, 'cardId', `${path}.cardId`, issues),
        target: stringField(current, 'target', `${path}.target`, issues),
        returnAtRoundEnd: current.returnAtRoundEnd === true,
        controllerCannotWinStatus: stringField(current, 'controllerCannotWinStatus', `${path}.controllerCannotWinStatus`, issues),
        ...coerceBind(current.bind),
      };
    case 'activate_card_by_id':
      return {
        id,
        type,
        definitionId: stringField(current, 'definitionId', `${path}.definitionId`, issues),
        ...coerceBind(current.bind),
      };
    case 'close_source_card':
      return { id, type, ...coerceBind(current.bind) };
    case 'create_card': {
      const destination = current.to && typeof current.to === 'object' && !Array.isArray(current.to)
        ? current.to as Record<string, unknown>
        : {};
      const destinationZone = zoneField(current.to, `${path}.to`, issues);
      return {
        id,
        type,
        cardId: stringField(current, 'cardId', `${path}.cardId`, issues),
        to: destinationZone === 'skill' ? 'skill' : reportSkillDestination(path, issues),
        owner: destination.owner === undefined || destination.owner === 'controller' ? 'controller' : reportControllerOwner(path, issues),
        ...coerceBind(current.bind),
      };
    }
    case 'adjust_victory_points':
      return {
        id,
        type,
        player: current.player === undefined || current.player === 'controller' ? 'controller' : reportControllerPlayer(path, issues),
        amount: coerceValueExpression(current.amount, `${path}.amount`, issues),
        ...coerceBind(current.bind),
      };
    case 'adjust_mana':
    case 'pay_mana':
      return {
        id,
        type,
        player: current.player === undefined || current.player === 'controller' ? 'controller' : reportControllerPlayer(path, issues),
        amount: coerceValueExpression(current.amount, `${path}.amount`, issues),
        ...coerceBind(current.bind),
      };
    case 'adjust_command_seals':
      return {
        id,
        type,
        player: current.player === undefined || current.player === 'controller' ? 'controller' : reportControllerPlayer(path, issues),
        amount: coerceValueExpression(current.amount, `${path}.amount`, issues),
        ...(typeof current.directive === 'string' ? { directive: current.directive } : {}),
        ...coerceBind(current.bind),
      };
    case 'noop':
      return {
        id,
        type,
        reason: typeof current.reason === 'string' ? current.reason : '',
        ...coerceBind(current.bind),
      };
    case 'fail_invariant':
      return {
        id,
        type,
        message: typeof current.message === 'string' ? current.message : '',
      };
    case 'branch':
      return {
        id,
        type,
        branches: Array.isArray(current.branches)
          ? current.branches.map((branch, index) => coerceResolutionBranch(branch, `${path}.branches[${index}]`, issues))
          : reportBranches(path, issues),
      };
    default:
      invalidNode(`${path}.type`, `Resolution primitive '${type}' is not registered.`, issues, 'unregistered_primitive');
      return { id, type: 'noop', reason: 'invalid node placeholder' };
  }
}

function coerceResolutionBranch(value: unknown, path: string, issues: DataFlowIssue[]): ResolutionBranch {
  if (!value || typeof value !== 'object' || Array.isArray(value)) {
    invalidNode(path, 'Resolution branch must be an object.', issues);
    return { then: [] };
  }
  const current = value as Record<string, unknown>;
  return {
    if: current.if === undefined ? true : coerceConditionExpression(current.if, `${path}.if`, issues),
    then: Array.isArray(current.then)
      ? current.then.map((effect, index) => coerceResolutionEffectNode(effect, `${path}.then[${index}]`, issues))
      : reportThen(path, issues),
  };
}

function coerceValueExpression(value: unknown, path: string, issues: DataFlowIssue[]): ValueExpression {
  if (typeof value === 'number') {
    if (Number.isSafeInteger(value)) return value;
    invalidNode(path, 'Expected a safe integer amount.', issues);
    return 0;
  }
  const expression = objectExpression(value, path, issues);
  if (expression?.expr === 'binding_field') {
    return {
      expr: 'binding_field',
      binding: stringField(expression, 'binding', `${path}.binding`, issues),
      field: stringField(expression, 'field', `${path}.field`, issues),
      valueType: expression.valueType === 'number' ? 'number' : reportValueType(path, 'number', issues),
    };
  }
  if (typeof expression?.var === 'string' && expression.var) {
    return {
      expr: 'binding_field',
      binding: expression.var,
      field: 'movedCount',
      valueType: 'number',
    };
  }
  invalidNode(path, 'Expected a numeric literal or number binding-field expression.', issues);
  return 0;
}

function coerceTargetExpression(value: unknown, path: string, issues: DataFlowIssue[]): TargetExpression {
  const expression = objectExpression(value, path, issues);
  if (expression?.expr === 'player_ids') {
    return {
      expr: 'player_ids',
      ids: Array.isArray(expression.ids) ? expression.ids.filter((id): id is PlayerId => typeof id === 'string') : [],
    };
  }
  if (expression?.expr === 'same_battlefield_opponents') return { expr: 'same_battlefield_opponents' };
  if (expression?.expr === 'binding_field') {
    return {
      expr: 'binding_field',
      binding: stringField(expression, 'binding', `${path}.binding`, issues),
      field: stringField(expression, 'field', `${path}.field`, issues),
      valueType: expression.valueType === 'player_ids' ? 'player_ids' : reportValueType(path, 'player_ids', issues),
    };
  }
  invalidNode(path, 'Expected a target expression.', issues);
  return { expr: 'player_ids', ids: [] };
}

function coerceConditionExpression(value: unknown, path: string, issues: DataFlowIssue[]): ConditionExpression {
  if (typeof value === 'boolean') return value;
  const expression = objectExpression(value, path, issues);
  if (expression?.expr === 'binding_status') {
    return {
      expr: 'binding_status',
      binding: stringField(expression, 'binding', `${path}.binding`, issues),
      status: expression.status === 'applied' || expression.status === 'no_op' ? expression.status : reportStatus(path, issues),
    };
  }
  if (expression?.expr === 'binding_field') {
    return {
      expr: 'binding_field',
      binding: stringField(expression, 'binding', `${path}.binding`, issues),
      field: stringField(expression, 'field', `${path}.field`, issues),
      valueType: expression.valueType === 'boolean' ? 'boolean' : reportValueType(path, 'boolean', issues),
    };
  }
  invalidNode(path, 'Expected a boolean or condition expression.', issues);
  return false;
}

function objectExpression(value: unknown, path: string, issues: DataFlowIssue[]): Record<string, unknown> | undefined {
  if (!value || typeof value !== 'object' || Array.isArray(value)) {
    invalidNode(path, 'Expected expression object.', issues);
    return undefined;
  }
  return value as Record<string, unknown>;
}

function coerceBind(value: unknown): { bind?: string } {
  return typeof value === 'string' && value ? { bind: value } : {};
}

function coerceLegacyBind(value: unknown): { bind?: string } {
  return coerceBind(value);
}

function zoneField(value: unknown, path: string, issues: DataFlowIssue[]): string {
  if (typeof value === 'string' && value) return value;
  if (value && typeof value === 'object' && !Array.isArray(value)) {
    const zone = (value as Record<string, unknown>).zone;
    if (typeof zone === 'string' && zone) return zone;
  }
  invalidNode(`${path}.zone`, 'Expected destination zone.', issues);
  return '';
}

function stringField(value: Record<string, unknown>, field: string, path: string, issues: DataFlowIssue[]): string {
  if (typeof value[field] === 'string' && value[field]) return value[field];
  invalidNode(path, `Expected string field '${field}'.`, issues);
  return '';
}

function reportControllerPlayer(path: string, issues: DataFlowIssue[]): 'controller' {
  invalidNode(`${path}.player`, 'Only controller result adjustment is supported.', issues);
  return 'controller';
}

function reportControllerOwner(path: string, issues: DataFlowIssue[]): 'controller' {
  invalidNode(`${path}.owner`, 'Only controller-owned card-zone effects are supported.', issues);
  return 'controller';
}

function reportSkillDestination(path: string, issues: DataFlowIssue[]): 'skill' {
  invalidNode(`${path}.to.zone`, 'Only setup create-to-skill is supported.', issues);
  return 'skill';
}

function reportFace(path: string, issues: DataFlowIssue[]): 'face_down' {
  invalidNode(`${path}.face`, 'Expected face_down or face_up.', issues);
  return 'face_down';
}

function reportBranches(path: string, issues: DataFlowIssue[]): ResolutionBranch[] {
  invalidNode(`${path}.branches`, 'Branch node requires branches array.', issues);
  return [];
}

function reportThen(path: string, issues: DataFlowIssue[]): ResolutionEffectNode[] {
  invalidNode(`${path}.then`, 'Branch requires then array.', issues);
  return [];
}

function reportValueType<T extends BindingFieldType>(path: string, expected: T, issues: DataFlowIssue[]): T {
  invalidNode(`${path}.valueType`, `Expected valueType '${expected}'.`, issues, 'wrong_expression_type');
  return expected;
}

function reportStatus(path: string, issues: DataFlowIssue[]): EffectExecutionStatus {
  invalidNode(`${path}.status`, 'Expected status applied or no_op.', issues);
  return 'no_op';
}

function invalidNode(
  path: string,
  message: string,
  issues: DataFlowIssue[],
  code: DataFlowIssue['code'] = 'invalid_resolution_node',
): void {
  issues.push({ code, path, message });
}
