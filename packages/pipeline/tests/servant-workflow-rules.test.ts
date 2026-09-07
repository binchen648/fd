import { describe, expect, it } from "vitest";

import {
  SERVANT_RECOGNITION_WORKFLOW_RULES,
  SERVANT_RECOGNITION_WORKFLOW_RULE_TEXT,
} from "../src/servant-workflow-rules";

describe("servant recognition workflow rules", () => {
  it("codifies the approved servant page workflow as executable rules", () => {
    expect(SERVANT_RECOGNITION_WORKFLOW_RULES).toMatchObject({
      unitOfWork: "htm_page",
      stagingBeforeServantNaming: true,
      requiresUniqueMainCard: true,
      ambiguousPageRoute: "review-pending",
      renamePolicy: {
        includeDisplayedCostPowerPairOnly: true,
      },
    });

    expect(SERVANT_RECOGNITION_WORKFLOW_RULES.ruleText).toEqual(
      expect.arrayContaining([
        expect.stringContaining("HTM"),
        expect.stringContaining("staging/"),
        expect.stringContaining("unique"),
        expect.stringContaining("review-pending/"),
        expect.stringContaining("(A/B)"),
      ]),
    );

    expect(SERVANT_RECOGNITION_WORKFLOW_RULE_TEXT).toContain("HTM");
    expect(SERVANT_RECOGNITION_WORKFLOW_RULE_TEXT).toContain("review-pending/");
    expect(SERVANT_RECOGNITION_WORKFLOW_RULE_TEXT).toContain("(A/B)");
  });
});
