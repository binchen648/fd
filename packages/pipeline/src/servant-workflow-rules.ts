export interface ServantRecognitionWorkflowRules {
  unitOfWork: "htm_page";
  stagingBeforeServantNaming: true;
  requiresUniqueMainCard: true;
  ambiguousPageRoute: "review-pending";
  renamePolicy: {
    includeDisplayedCostPowerPairOnly: true;
  };
  ruleText: readonly [string, string, string, string, string, string, string];
}

export const SERVANT_RECOGNITION_WORKFLOW_RULES: ServantRecognitionWorkflowRules = {
  unitOfWork: "htm_page",
  stagingBeforeServantNaming: true,
  requiresUniqueMainCard: true,
  ambiguousPageRoute: "review-pending",
  renamePolicy: {
    includeDisplayedCostPowerPairOnly: true,
  },
  ruleText: [
    "Process each servant HTM page as the unit of work.",
    "Create staging/<htm-name>/ before any servant-named folder is created.",
    "Confirm exactly one unique servant main card before materializing approved servant output.",
    "If no unique main card can be confirmed, route the whole page into review-pending/<htm-name>/.",
    "Only create a servant-named folder after the main card confirms the servant character_name.",
    "Every PNG must produce a same-stem JSON draft artifact.",
    "Use 卡名(A/B).png only when both displayed cost A and displayed power B are visually present; otherwise keep the filename without the numeric pair and mark unstable cases for human review.",
  ],
};

export const SERVANT_RECOGNITION_WORKFLOW_RULE_TEXT = SERVANT_RECOGNITION_WORKFLOW_RULES.ruleText.join("\n");
