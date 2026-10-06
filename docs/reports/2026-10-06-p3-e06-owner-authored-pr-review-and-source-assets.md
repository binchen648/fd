# P3-E06 Owner-Authored PR Review and Source-Asset Reconciliation

- Control Epoch: `FD-P3-2026-09-23-06`
- Task ID: `P3-E06-I-RP00-PROMOTION`
- Repository: `binchen648/fd`
- Promotion PR: `#536`
- PR author and repository owner: `github:binchen648`
- Reviewed promotion HEAD: `ca8a0624cad8e89ca26360a6e1b69f8435554c78`
- Review date: `2026-10-06`

## User-approved approval rule

For every pull request authored by `github:binchen648`, no additional GitHub
account is required to submit an `APPROVED` review. A substantive review is
still mandatory. The review must bind the exact candidate or PR HEAD, record a
PASS, FAIL, or BLOCKED verdict, preserve unresolved blockers, and run the
required checks on the final HEAD.

For governed Phase 3 promotion, immutable role artifacts and exact-SHA review
evidence remain required. Account distinctness is not a substitute for those
controls and is not itself a gate.

## PR #536 review result

The following checks were independently repeated against
`ca8a0624cad8e89ca26360a6e1b69f8435554c78`:

- exact ancestry `4b8eeeeb -> 30be3b7 -> 054726e -> 3af8509 -> ca8a062`: `PASS`
- forbidden lineage `abbf1ae...` absent: `PASS`
- post-candidate runtime and authoring delta: `NONE`
- promotion-only delta after `3af8509...`: seven authorized Epoch 06 files
- Codex G artifact SHA-256 bindings: `MATCH`
- focused runtime tests: `PASS`, 5 files / 184 tests
- full CI tests: `PASS`, 183 files / 1409 tests
- typecheck: `PASS`
- client build: `PASS`
- standard content validation: `PASS`, 0 blocking issues
- diff check: `PASS`
- GitHub build, test, and promotion policy checks: `PASS`

Verdict for the reviewed HEAD: `PASS_WITH_RECORDED_EXTERNAL_BLOCKER`.

## Source-asset blocker reconciliation

The previously supplied requirement referred to 83 missing-image blockers. That
count is not reproducible on the exact promotion checkout.

Fresh strict verification:

```text
npm run test:source-assets
FAIL: 93 blocking issues
issue code: MISSING_IMAGE
```

The ordinary `npm run content:validate` command does not require local source
assets and therefore reports 0 blocking issues. The strict source-asset command
does require them and reports 93 missing files below `chm-extract/`.

The 93 source-asset findings are retained as an external content/release
blocker. They do not alter the reviewed runtime candidate, do not grant or
remove migration credit, and do not turn Gate C into PASS. Any later Release
Ready claim must resolve or explicitly disposition all 93 findings.

## Approval disposition

The owner-authored PR exception satisfies the separate-account aspect of human
approval after a PASS review is recorded for the final HEAD. It does not permit
merge while required checks are pending or failing, and it does not authorize
Codex I to claim post-merge status before the merge occurs.

Current accounting remains:

- main coverage credit delta: `0`
- main denominator delta: `0`
- migration credit delta: `0`
- Gate C: `NOT_VERIFIED`
- `promotedOnMain=false`
