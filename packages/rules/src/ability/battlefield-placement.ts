import type { AuthoringCard, RuleNode } from './types';
const n = (v: unknown): RuleNode => v && typeof v === 'object' && !Array.isArray(v) ? v as RuleNode : {};
const list = (v: unknown): RuleNode[] => Array.isArray(v) ? v.map(n) : [];
function exact(a: unknown, b: unknown): boolean {
  if (Array.isArray(b)) return Array.isArray(a) && a.length === b.length && a.every((v,i) => exact(v,b[i]));
  if (b && typeof b === 'object') return Object.keys(n(a)).length === Object.keys(n(b)).length && Object.keys(n(b)).every(k => exact(n(a)[k],n(b)[k]));
  return a === b;
}
export function isAcceptedBattlefieldPlacement(effect: RuleNode): boolean {
  return exact(Object.keys(effect).sort(), ['placement','target','to','type']) && effect.type === 'move_card' &&
    typeof effect.target === 'string' && exact(effect.to,{zone:'field',owner:'controller'}) &&
    exact(effect.placement,{kind:'battlefield_effect',location:'controller.location',effectsFrom:'card_definition',emitPlayEvents:false});
}
/** Closed set of supported field consumers, never replay arbitrary card abilities. */
export function supportsBattlefieldPlacement(card: AuthoringCard | RuleNode | undefined): boolean {
  if (!card || card.cardType !== 'servant_skill') return false;
  const abilities = list(card.abilities);
  if (abilities.length !== 4 || abilities.some(a => n(a.execution).mode !== 'automatic' ||
      ['conditions','targets','cost','creates'].some(k => list(a[k]).length) ||
      ['visibility','limit'].some(k => Object.keys(n(a[k])).length) ||
      (Object.keys(n(a.responseWindow)).length !== 0 && !exact(a.responseWindow,{order:'turn_order',passBehavior:'decline_this_window'})))) return false;
  const reversal = abilities.find(a => a.kind === 'residual');
  const deploy = abilities.find(a => n(a.activation).trigger === 'after_player_deployed_to_battlefield');
  const exemption = abilities.find(a => a.kind === 'passive');
  const cleanup = abilities.find(a => n(a.activation).trigger === 'after_battle_ended');
  return !!reversal && !!deploy && !!exemption && !!cleanup &&
    exact(reversal.activation,{trigger:'on_card_played',opens:'immediate'}) &&
    exact(reversal.lifecycle,{starts:'immediate',duration:'while_card_active',cleanup:'remain_active'}) && !list(reversal.ruleModifiers).length &&
    exact(reversal.effects,[{type:'reverse_situation_and_event_power_modifiers',scope:'players_at_this_battlefield'}]) &&
    deploy.kind === 'forced_trigger' && exact(deploy.activation,{trigger:'after_player_deployed_to_battlefield'}) &&
    !Object.keys(n(deploy.lifecycle)).length && !list(deploy.ruleModifiers).length &&
    exact(deploy.effects,[{type:'adjust_mana',player:'controller',amount:1}]) &&
    exact(exemption.activation,{trigger:'when_power_calculation_applied'}) && !list(exemption.effects).length && !Object.keys(n(exemption.lifecycle)).length &&
    list(exemption.ruleModifiers).length === 1 && (() => {
      const m = list(exemption.ruleModifiers)[0]!;
      return m.operation === 'ignore' && m.rule === 'netherworld_protection' && exact(m.scope,{subject:'controller'}) &&
        Object.keys(m).every(k => ['id','printedClause','operation','rule','scope'].includes(k));
    })() && cleanup.kind === 'forced_trigger' && exact(cleanup.activation,{phase:'combat',trigger:'after_battle_ended'}) &&
    !Object.keys(n(cleanup.lifecycle)).length && !list(cleanup.ruleModifiers).length &&
    exact(cleanup.effects,[{type:'move_card',target:'this_card',to:{zone:'skill',owner:'controller'}}]);
}
