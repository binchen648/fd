import type { AuthoringAbility, RuleNode } from './types';

export const WODIME_ASTROLOGY_ROUND_TARGET = 'wodime_astrology_rounds';
export const WODIME_ASTROLOGY_ROUND_OPTIONS = Array.from({ length: 11 }, (_, index) => `round:${index + 1}`);

export function isGameStartSkillProvisioningCandidate(ability: AuthoringAbility): boolean {
  return ability.effects.some((effect) => effect.type === 'provision_skill_cards' ||
    (effect.type === 'branch' && Array.isArray(effect.branches) && effect.branches.some((branch: RuleNode) =>
      Array.isArray(branch.then) && (branch.then as RuleNode[]).some((nested: RuleNode) => nested.type === 'provision_skill_cards'))));
}

function isExactGameStartSkillProvisioningEffect(effect: RuleNode): boolean {
  const targets = effect.targetDefinitionIds;
  return effect.type === 'provision_skill_cards' && effect.player === 'controller' &&
    Array.isArray(targets) && targets.length > 0 &&
    targets.every((target) => typeof target === 'string' && target.length > 0) &&
    new Set(targets).size === targets.length &&
    Object.keys(effect).every((key) => ['type', 'player', 'targetDefinitionIds'].includes(key));
}

export function isGameStartSkillProvisioningSemantic(ability: AuthoringAbility): boolean {
  if (!isGameStartSkillProvisioningCandidate(ability) || ability.kind !== 'forced_trigger' || ability.execution.mode !== 'automatic' ||
    !Array.isArray(ability.execution.allowedOperations) || ability.execution.allowedOperations.length) return false;
  const gameStart = ability.activation.trigger === 'game_start' && Object.keys(ability.activation).every((key) => key === 'trigger') && ability.conditions.length === 0;
  const battleWin = ability.activation.trigger === 'after_controller_wins_battle' &&
    Object.keys(ability.activation).every((key) => key === 'trigger') && ability.conditions.length === 1 &&
    ability.conditions[0]?.type === 'player_flag_number_at_least' &&
    Object.keys(ability.conditions[0]!).every((key) => ['type', 'key', 'value'].includes(key)) &&
    typeof ability.conditions[0]?.key === 'string' && ability.conditions[0].key.length > 0 &&
    Number.isSafeInteger(ability.conditions[0]?.value) && Number(ability.conditions[0]?.value) >= 1;
  if (!gameStart && !battleWin) return false;
  if (ability.targets.length || ability.cost.length || ability.creates.length || ability.ruleModifiers.length) return false;
  const responseKeys = Object.keys(ability.responseWindow);
  if (responseKeys.some((key) => !['order', 'passBehavior'].includes(key)) ||
    (ability.responseWindow.order !== undefined && ability.responseWindow.order !== 'turn_order') ||
    (ability.responseWindow.passBehavior !== undefined && ability.responseWindow.passBehavior !== 'decline_this_window') ||
    Object.keys(ability.limit).length || Object.keys(ability.visibility).length || Object.keys(ability.lifecycle).length) return false;
  return gameStart && ability.effects.length === 1 && isExactGameStartSkillProvisioningEffect(ability.effects[0]!);
}

export function isBattleWinRoundProvisioningSemantic(ability: AuthoringAbility): boolean {
  if (!isGameStartSkillProvisioningCandidate(ability) || ability.kind !== 'forced_trigger' || ability.execution.mode !== 'automatic' ||
      ability.execution.allowedOperations.length !== 0 || ability.activation.trigger !== 'after_controller_wins_battle' ||
      Object.keys(ability.activation).some((key) => key !== 'trigger') || ability.conditions.length !== 0 ||
      ability.targets.length !== 0 || ability.cost.length !== 0 || ability.creates.length !== 0 || ability.ruleModifiers.length !== 0 ||
      Object.keys(ability.lifecycle).length || Object.keys(ability.limit).length || Object.keys(ability.visibility).length ||
      Object.keys(ability.responseWindow).some((key) => !['order', 'passBehavior'].includes(key)) ||
      (ability.responseWindow.order !== undefined && ability.responseWindow.order !== 'turn_order') ||
      (ability.responseWindow.passBehavior !== undefined && ability.responseWindow.passBehavior !== 'decline_this_window') ||
      ability.effects.length !== 2) return false;
  const increment = ability.effects[0]!;
  if (increment.type !== 'add_player_flag_number' || increment.target !== 'controller' || typeof increment.key !== 'string' ||
      !increment.key || increment.amount !== 1 || Object.keys(increment).some((key) => !['type', 'target', 'key', 'amount'].includes(key))) return false;
  const branch = ability.effects[1]!;
  if (branch.type !== 'branch' || !Array.isArray(branch.branches) || branch.branches.length !== 1 || Object.keys(branch).some((key) => !['type', 'branches'].includes(key))) return false;
  const choice = branch.branches[0]!;
  if (!choice.if || !Array.isArray(choice.then) || choice.then.length !== 1 || choice.then[0]?.type !== 'provision_skill_cards' ||
      Object.keys(choice).some((key) => !['if', 'then'].includes(key))) return false;
  const condition = choice.if;
  if (condition.type !== 'player_flag_number_at_least' || condition.key !== increment.key || condition.value !== 2 ||
      Object.keys(condition).some((key) => !['type', 'key', 'value'].includes(key))) return false;
  return isExactGameStartSkillProvisioningEffect(choice.then[0]!);
}

export function gameStartSkillProvisioningTargetDefinitionIds(ability: AuthoringAbility): string[] | undefined {
  if (isGameStartSkillProvisioningSemantic(ability)) return ability.effects[0]!.targetDefinitionIds as string[];
  if (isBattleWinRoundProvisioningSemantic(ability)) return ((ability.effects[1]!.branches as RuleNode[])[0]!.then as RuleNode[])[0]!.targetDefinitionIds as string[];
  return undefined;
}

export function isWodimeAstrologyRoundSelectionSemantic(ability: AuthoringAbility): boolean {
  if (ability.id !== 'wodime.astrology' || ability.kind !== 'forced_trigger' || ability.execution.mode !== 'automatic' ||
      ability.activation.trigger !== 'game_start' || Object.keys(ability.activation).some((key) => key !== 'trigger') ||
      ability.conditions.length || ability.cost.length || ability.creates.length || ability.ruleModifiers.length ||
      Object.keys(ability.lifecycle).length || Object.keys(ability.limit).length || Object.keys(ability.visibility).length ||
      ability.targets.length !== 1 || ability.effects.length !== 1) return false;
  const target = ability.targets[0]!;
  const count = target.count as { min?: unknown; max?: unknown } | undefined;
  if (target.type !== 'choice' || target.id !== WODIME_ASTROLOGY_ROUND_TARGET ||
      !Array.isArray(target.options) || target.options.length !== 11 ||
      target.options.some((option: RuleNode, index: number) => option.id !== WODIME_ASTROLOGY_ROUND_OPTIONS[index]) ||
      count?.min !== 2 || count.max !== 2) return false;
  const effect = ability.effects[0]!;
  return effect.type === 'wodime_astrology_round_selection' && effect.target === WODIME_ASTROLOGY_ROUND_TARGET &&
    effect.provisionDefinitionId === 'master.wodime.skill.s2' &&
    Object.keys(effect).every((key) => ['type', 'target', 'provisionDefinitionId'].includes(key));
}

export function isWodimeAstrologyAscensionSemantic(ability: AuthoringAbility): boolean {
  if (ability.id !== 'wodime.ascension' || ability.kind !== 'passive' ||
      ability.activation.trigger !== 'after_controller_wins_battle' || ability.conditions.length !== 0 ||
      ability.targets.length !== 0 || ability.cost.length !== 0 || ability.creates.length !== 0 ||
      ability.ruleModifiers.length !== 0 || Object.keys(ability.lifecycle).length !== 0 ||
      Object.keys(ability.limit).length !== 0 || ability.effects.length !== 1) return false;
  const effect = ability.effects[0]!;
  return effect.type === 'wodime_astrology_ascension_record' && Object.keys(effect).length === 1;
}

/** Exact runtime contract for Wodime's generated Celestial Sphere. */
export function isWodimeCelestialSphereSemantic(ability: AuthoringAbility): boolean {
  if (ability.id !== 'wodime.orb' || ability.kind !== 'forced_trigger' ||
      ability.activation.trigger !== 'on_card_played' ||
      Object.keys(ability.activation).some((key) => key !== 'trigger') ||
      ability.conditions.length !== 0 || ability.targets.length !== 0 ||
      ability.cost.length !== 0 || ability.creates.length !== 0 ||
      ability.ruleModifiers.length !== 0 || Object.keys(ability.lifecycle).length !== 0 ||
      Object.keys(ability.limit).length !== 0 || Object.keys(ability.visibility).length !== 0 ||
      ability.effects.length !== 1) return false;
  const effect = ability.effects[0]!;
  return effect.type === 'wodime_celestial_sphere_battle' && Object.keys(effect).length === 1;
}
