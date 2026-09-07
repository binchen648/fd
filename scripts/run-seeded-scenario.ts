import { readFile } from "node:fs/promises";

import { createReplayLogFromScenario, type ReplayScenarioInput } from "../packages/rules/src/index";

const DEFAULT_SCENARIO_PATH = "D:\\fd\\packages\\rules\\src\\data\\scenarios\\minimal-7p-seeded-scenario.json";

async function main() {
  const scenarioPath = process.argv[2] ?? DEFAULT_SCENARIO_PATH;
  const raw = await readFile(scenarioPath, "utf8");
  const scenario = JSON.parse(raw) as ReplayScenarioInput;

  const replay = createReplayLogFromScenario(scenario);

  console.log(JSON.stringify(replay, null, 2));
}

void main();
