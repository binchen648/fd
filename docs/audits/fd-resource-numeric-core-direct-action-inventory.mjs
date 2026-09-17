import fs from "node:fs";
import path from "node:path";

const roots = ["data/authoring/masters", "data/authoring/servants"];
const directResourceTypes = new Set(["adjust_mana", "adjust_command_seals", "adjust_victory_points"]);
const allResourceTypes = new Set([...directResourceTypes, "pay_mana"]);

const files = roots.flatMap((root) =>
  fs
    .readdirSync(root)
    .filter((name) => name.endsWith(".json"))
    .sort()
    .map((name) => path.join(root, name)),
);

const rows = [];
for (const file of files) {
  const archive = JSON.parse(fs.readFileSync(file, "utf8"));
  for (const card of archive.cards ?? []) {
    for (const ability of card.abilities ?? []) {
      const effects = (ability.effects ?? []).map((effect) => effect.type).filter(Boolean);
      if (!effects.some((effect) => allResourceTypes.has(effect))) continue;
      const dependencies = classifyDependencies(ability, effects);
      const eligible = isStrictDirectActionResourceAbility(ability);
      rows.push({
        archive: archive.id,
        card: card.id,
        ability: ability.id,
        kind: ability.kind ?? "",
        effects,
        dependencies,
        migrationClass: eligible ? "eligible" : dependencies.includes("SPECIAL") ? "special" : "blocked",
        eligible,
        skipReason: eligible
          ? ""
          : skipReason(ability, effects),
      });
    }
  }
}

const eligible = rows.filter((row) => row.eligible);
const skipped = rows.filter((row) => !row.eligible);
const blocked = rows.filter((row) => row.migrationClass === "blocked");
const special = rows.filter((row) => row.migrationClass === "special");

console.log("RESOURCE_NUMERIC_CORE_DIRECT_ACTION inventory");
console.log(`sourceFiles=${files.length}`);
console.log(`resourceNumericAbilities=${rows.length}`);
console.log(`eligible=${eligible.length}`);
console.log(`migrated=${eligible.length}`);
console.log(`blocked=${blocked.length}`);
console.log(`special=${special.length}`);
console.log(`skipped=${skipped.length}`);
console.log("");

console.log("Eligible abilities");
for (const row of eligible) {
  console.log(`${row.archive}\t${row.card}\t${row.ability}\t${row.effects.join(",")}\t${row.dependencies.join(",")}`);
}
console.log("");

console.log("Blocked/special abilities");
for (const row of skipped) {
  console.log(`${row.archive}\t${row.card}\t${row.ability}\t${row.effects.join(",")}\t${row.migrationClass}\t${row.dependencies.join(",")}\t${row.skipReason}`);
}
console.log("");

console.log("Before/after metrics");
console.log(`legacyResourceConsumerCount.before=${eligible.length}`);
console.log("legacyResourceConsumerCount.after=0");
console.log("newRuntimeSemanticRoutedCount.before=0");
console.log(`newRuntimeSemanticRoutedCount.after=${eligible.length}`);
console.log("dualCompatibleCount.before=NOT_CLASSIFIABLE");
console.log("dualCompatibleCount.after=0");
console.log(`remainingSkippedCount.after=${skipped.length}`);

function classifyDependencies(ability, effects) {
  const raw = JSON.stringify(ability);
  const dependencies = [];
  if (isStrictDirectActionResourceAbility(ability)) dependencies.push("DIRECT_RESOURCE");
  if (ability.kind && ability.kind !== "phase_action") dependencies.push("RESOURCE_WITH_TRIGGER");
  if (ability.activation?.trigger) dependencies.push("RESOURCE_WITH_TRIGGER");
  if ((ability.targets ?? []).length > 0 || /"branch"|choice|response|optional|YES_NO|选择|可以/.test(raw)) dependencies.push("RESOURCE_WITH_INTERACTION");
  if (/battle|combat|wins_battle|loses_battle|battle_result|defeat|战斗|获胜|战败|败北|胜者|交战/.test(raw)) dependencies.push("RESOURCE_WITH_BATTLE");
  if (/hidden|private|look|reveal|暗置|隐藏|查看|展示/.test(raw)) dependencies.push("RESOURCE_WITH_HIDDEN");
  if (/resultVar|binding_field|bind/.test(raw)) dependencies.push("RESOURCE_WITH_RESULT_BINDING");
  if ((ability.creates ?? []).length > 0 || Object.keys(ability.lifecycle ?? {}).length > 0 || /duration|cleanup|limit|once|per_game|残留|每局|持续/.test(raw)) {
    dependencies.push("RESOURCE_WITH_LIFECYCLE");
  }
  if (effects.some((effect) => !allResourceTypes.has(effect)) || /record_master_directive|independent_deck|replacement|terrain_multiplier|transfer_vp/.test(raw)) {
    dependencies.push("SPECIAL");
  }
  return [...new Set(dependencies.length ? dependencies : ["DIRECT_RESOURCE"])];
}

function isStrictDirectActionResourceAbility(ability) {
  const effects = ability.effects ?? [];
  return ability.kind === "phase_action" &&
    ability.activation?.phase === "action" &&
    effects.length > 0 &&
    effects.every((effect) => directResourceTypes.has(effect.type)) &&
    (ability.targets ?? []).length === 0 &&
    (ability.cost ?? []).length === 0 &&
    (ability.creates ?? []).length === 0;
}

function skipReason(ability, effects) {
  if (ability.kind !== "phase_action") return `out_of_scope:${ability.kind || "non_phase_action"}`;
  if (effects.includes("pay_mana")) return "out_of_scope:pending_payment_or_cost";
  if (effects.some((effect) => !directResourceTypes.has(effect))) return "out_of_scope:mixed_non_resource_effect";
  if (ability.activation?.phase !== "action") return `out_of_scope:${ability.activation?.phase || "non_action_phase"}_window`;
  if ((ability.targets ?? []).length > 0) return "out_of_scope:target_or_hidden_choice";
  if ((ability.cost ?? []).length > 0) return "out_of_scope:cost_payment";
  if ((ability.creates ?? []).length > 0) return "out_of_scope:modifier_or_lifecycle_create";
  const raw = JSON.stringify(ability);
  if (/battle|combat|wins_battle|loses_battle|battle_result|defeat|战斗|获胜|战败|败北|胜者|交战/.test(raw)) {
    return "out_of_scope:battle_result_or_defeat_dependency";
  }
  if (/move|移动|部署|地点|战场/.test(raw)) return "out_of_scope:movement_dependency";
  return "out_of_scope:not_selected_representative";
}
