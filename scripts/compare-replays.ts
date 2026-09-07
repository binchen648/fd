import { readFile } from "node:fs/promises";

import {
  compareReplayScenarios,
  compareReplayLogs,
  formatReplayComparisonReport,
  type ReplayLog,
  type ReplayScenarioInput,
} from "../packages/rules/src/index";

async function main() {
  const baselinePath = process.argv[2];
  const candidatePath = process.argv[3];

  if (!baselinePath || !candidatePath) {
    throw new Error("Usage: tsx scripts/compare-replays.ts <baseline.json|scenario.json> <candidate.json|scenario.json>");
  }

  const baseline = JSON.parse(await readFile(baselinePath, "utf8")) as ReplayLog | ReplayScenarioInput;
  const candidate = JSON.parse(await readFile(candidatePath, "utf8")) as ReplayLog | ReplayScenarioInput;

  const report = isReplayLog(baseline) && isReplayLog(candidate)
    ? compareReplayLogs(baseline, candidate)
    : isReplayScenarioInput(baseline) && isReplayScenarioInput(candidate)
      ? compareReplayScenarios(baseline, candidate)
      : invalidInputPair();

  console.log(formatReplayComparisonReport(report));
}

function isReplayLog(value: ReplayLog | ReplayScenarioInput): value is ReplayLog {
  return "matchId" in value && "frames" in value && "finalSnapshot" in value;
}

function isReplayScenarioInput(value: ReplayLog | ReplayScenarioInput): value is ReplayScenarioInput {
  return "id" in value && "initialState" in value && "steps" in value;
}

function invalidInputPair(): never {
  throw new Error("Both inputs must be replay logs or both inputs must be scenario files.");
}

void main();
