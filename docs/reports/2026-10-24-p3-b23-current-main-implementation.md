# P3-B23 Olga loss-transform current-main implementation

- Base: `c4ef7156bd291e5134c7444421516d5d72a9f28d` (B22 A-sync)
- Branch: `codex/b-p3-b23-current-main-20261024`
- Status: `IMPLEMENTATION_NEEDS_REVISION`

This candidate is a narrow current-main B23 correction. The identity-free loss-transform family now rejects the malformed Return Silence same-family route before legacy extended-effect fallback, while preserving canonical compiled response defaults. The focused regression also covers malformed effect and response-window shapes. No authoring, taxonomy, coverage, inventory, or B13-B22 production behavior was changed.

Checks:

- `npm run typecheck`: exit 0.
- B23 focused `battle-loss-state-transform.test.ts`: 9/9.
- B13/B21 loss compatibility focused files: 25/25.
- `git diff --check`: pending final commit check.
- Chromium Gate C: failed. The new same-process fixture starts and the room reaches the Olga action projection, but the end-turn command leaves the revision at 2 (expected >2) and does not reach round-end. Gate C is therefore not claimed.

The E2E fixture was moved away from the old cross-process snapshot builder to an in-process `createMatchServer` room fixture. The remaining command-flow failure is an honest blocker for Reviewer follow-up; this report does not claim acceptance, credit, merge, or Gate C.
