## Role and Task

- Role:
- Task ID:
- Dependencies:

## Phase 3 Task Manifest

```json phase3-task-manifest
{
  "schemaVersion": "fd-phase3-promotion-manifest-v1",
  "role": "I",
  "taskId": "P3-...",
  "prType": "promotion",
  "base": {
    "ref": "main",
    "sha": ""
  },
  "head": {
    "ref": "",
    "sha": ""
  },
  "dependsOnPrs": [],
  "affectedAbilityIds": [],
  "runtimeBehaviorChanged": false,
  "rules": {
    "source": "",
    "referenceCommit": ""
  },
  "review": {
    "sha": "",
    "conclusion": "",
    "reviewedCandidateSha": ""
  },
  "synchronization": {
    "sha": ""
  },
  "migrationCounts": {
    "mainline": 0,
    "recovery": 0,
    "candidate": 0
  },
  "tests": [
    {
      "command": "",
      "result": ""
    }
  ],
  "uncoveredScenarios": ["None declared."],
  "knownBlockers": ["None declared."],
  "zeroMigrationCredit": false,
  "reverifyOnUpstreamHeadChange": true
}
```

## Required Evidence

- Base SHA / Head SHA:
- Dependency PRs:
- Affected ability IDs:
- RuntimeBehaviorChanged:
- Rules source and Reference commit:
- R review SHA and conclusion:
- R reviewed candidate SHA:
- A synchronization SHA:
- Mainline migration count:
- Recovery migration count:
- Candidate migration count:
- Test commands and results:
- Uncovered scenarios:
- Known blockers:
- Promotion is zero migration credit:
- Upstream HEAD changed after validation:

## Reviewer Notes

- Independent reviewer:
- Latest reviewable push approved:
- Conversation resolution complete:
