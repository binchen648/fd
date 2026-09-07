import { pathToFileURL } from "node:url";

import {
  compareReplayScenarios,
  evaluateReplayComparisonMatrix,
  formatReplayComparisonMatrixJson,
  formatReplayComparisonMatrixReport,
  loadScenarioMatrix,
  readScenario,
  type ReplayComparisonMatrixEntry,
} from "../packages/rules/src/index";

const DEFAULT_CONFIG_PATH = "D:\\fd\\config\\scenario-matrix.config.json";

export async function main() {
  const outputJson = process.argv.includes("--json") || process.argv.includes("-j");
  const matrix = await loadScenarioMatrix(DEFAULT_CONFIG_PATH);
  const entries: ReplayComparisonMatrixEntry[] = [];

  for (const item of matrix) {
    const [baseline, candidate] = await Promise.all([
      readScenario(item.baselinePath),
      readScenario(item.candidatePath),
    ]);

    entries.push({
      label: item.label,
      expectedIdentical: item.expectedIdentical,
      report: compareReplayScenarios(baseline, candidate),
    });
  }

  const summary = evaluateReplayComparisonMatrix(entries);
  console.log(
    outputJson
      ? formatReplayComparisonMatrixJson(summary)
      : formatReplayComparisonMatrixReport(summary),
  );

  if (summary.failed > 0) {
    process.exitCode = 1;
  }
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  void main();
}
