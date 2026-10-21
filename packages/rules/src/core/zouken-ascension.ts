import type { GameState } from "../schema/game";

const SOURCE_ID = "master.zouken.skill.ascension";
const PASSIVE_ID = "zouken.illusive-mastermind";
const PASSIVE_CLAUSE =
  '当你移动时，可以无视交战状态。移除【刻印虫】"如果你赢得一场战斗"的触发条件。';

function exactKeys(value: Record<string, unknown>, keys: string[]): boolean {
  const actual = Object.keys(value).sort();
  const expected = [...keys].sort();
  return actual.length === expected.length && actual.every((key, index) => key === expected[index]);
}

/** Source-bound, fail-closed recognition of Zouken's ascension passive. */
export function hasActiveZoukenAscension(state: GameState, playerId: string): boolean {
  const pack = state.abilityRuntime?.pack;
  if (!pack) return false;
  return state.cards.some((instance) => {
    if (instance.definitionId !== SOURCE_ID || instance.controllerPlayerId !== playerId ||
        !["field", "attack_area"].includes(instance.zone)) return false;
    const cardState = state.abilityRuntime?.cardState[instance.instanceId];
    if (!cardState || cardState.active !== true || cardState.faceDown === true) return false;
    const ability = pack.cards[instance.definitionId]?.abilities.find((candidate) => candidate.id === PASSIVE_ID);
    if (!ability || ability.kind !== "passive" || ability.printedClause !== PASSIVE_CLAUSE ||
        ability.execution.mode !== "automatic" || ability.execution.allowedOperations.length !== 0 ||
        !exactKeys(ability.activation, ["trigger"]) || ability.activation.trigger !== "while_active" ||
        ability.conditions.length !== 0 || ability.targets.length !== 0 || ability.cost.length !== 0 ||
        ability.creates.length !== 0 || ability.ruleModifiers.length !== 0 ||
        Object.keys(ability.lifecycle).length !== 0 ||
        Object.keys(ability.responseWindow).some((key) => !["order", "passBehavior"].includes(key)) ||
        (ability.responseWindow.order !== undefined && ability.responseWindow.order !== "turn_order") ||
        (ability.responseWindow.passBehavior !== undefined && ability.responseWindow.passBehavior !== "decline_this_window") ||
        Object.keys(ability.limit).length !== 0 || Object.keys(ability.visibility).length !== 0 ||
        ability.effects.length !== 1) return false;
    const effect = ability.effects[0]!;
    return effect.type === "record_master_directive" && effect.id === "zouken-illusive-mastermind" &&
      effect.directive === "zouken_illusive_mastermind" && exactKeys(effect, ["id", "type", "directive"]);
  });
}
