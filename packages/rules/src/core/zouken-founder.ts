import type { GameState } from "../schema/game";

const SOURCE_ID = "master.zouken.skill.s3";
const PASSIVE_ID = "zouken.founder";
const PASSIVE_CLAUSE = "你没有令咒。每当你获得令咒时，改为获得4点魔力；当你因其他能力需要花费令咒时，改为花费4点魔力。";

function exactKeys(value: Record<string, unknown>, keys: string[]): boolean {
  const actual = Object.keys(value).sort();
  const expected = [...keys].sort();
  return actual.length === expected.length && actual.every((key, index) => key === expected[index]);
}

export function hasActiveZoukenFounder(state: GameState, playerId: string): boolean {
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
        ability.creates.length !== 0 || ability.ruleModifiers.length !== 0 || Object.keys(ability.lifecycle).length !== 0 ||
        Object.keys(ability.responseWindow).some((key) => !["order", "passBehavior"].includes(key)) ||
        Object.keys(ability.limit).length !== 0 || Object.keys(ability.visibility).length !== 0 || ability.effects.length !== 1) return false;
    const effect = ability.effects[0]!;
    return effect.type === "record_master_directive" && effect.id === "zouken-founder" && effect.directive === "zouken_founder" &&
      exactKeys(effect, ["id", "type", "directive"]);
  });
}
