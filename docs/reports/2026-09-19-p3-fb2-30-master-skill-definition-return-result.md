# P3-FB2-30 Master Skill Definition Return Result

Role: Codex B2
Status: `IMPLEMENTATION_COMPLETE_CANDIDATE`
Date: 2026-09-19

## Lineage and scope

- Base: `e3c49b3f80248a58d0cb7a8b1e22e946627a2b39` (`codex/a-p3-fb2-30-card-definition-return-dispatch`)
- F1 evidence: `59f145434695d29bdd17e4cb3adc887e84182377`
- Locked Reference: `b2f9fa15fba07c63530bbf4612b03b8b704755f9`
- Formal recovery accounting remains `136/944`; this B2 task is zero frozen migration credit.
- No F1 authoring, production pack registration, KPI/taxonomy, app, merge, or retarget change is included.

## Implemented capability

Adds one identity-free structural component for:

`return_card_by_definition` + controller + exactly one `definitionId|linkedSkillId` + `master-skills` + `createIfMissing:true` + `face:up` + `active:false`.

The loader admits only that narrow shape. Executable-pack reference validation treats `linkedSkillId` as a definition reference. The server resolver verifies that the referenced definition exists, is a `master_skill`, and belongs to the controller's current master definition.

For exactly one existing controller-owned physical target, the same physical instance is returned to runtime `skill`, ownership/control and owner-only visibility are normalized, transient transform state is cleared, and the skill is inactive/face-up. When none exists, exactly one controller-owned physical skill instance is materialized. Duplicate physical targets, wrong target owner/type, missing definitions, malformed near-matches, or invalid source context fail closed before mutation.

The component intentionally does not make a parent ability routable: ability discovery rejects any parent containing this component and direct `executeAbility` rejects until a later independently accepted Trigger/Condition parent route exists. The parent gate recursively scans executable `effects` and `creates`, including descendants under `branch`, so nesting cannot bypass that boundary.

## Reviewer revision closure

PR #374 received `IMPLEMENTATION_NEEDS_REVISION` findings in reviewer evidence `#issuecomment-5741680313` and `#issuecomment-5741727805`.

The revision closes both findings without widening the authorized FB2-30 capability:

- source preflight now requires the physical source to remain controller-owned/controller-controlled in runtime `skill`, with a source definition whose `cardType` is `master_skill` and whose `ownerId` equals the controller's current `masterCardId`;
- wrong source definition owner, wrong source definition type, and stale source zone each reject before target lookup/materialization, with full-state equality regressions;
- the parent-route candidate detector is recursive across executable `effects`/`creates`; nested branch descendants and `creates` placements are blocked both from trigger discovery and from direct `executeAbility` execution;
- no parent Trigger/Condition route is accepted or promoted by this revision.

## Identity isolation

Modified production files contain no Arcueid/Ciel identity, canonical ability/card ID, Chinese printed text, F1/Reference hash, or Reference handler routing token. Immediate F1 membership is evidence only and is not embedded in runtime.

## Validation

- dependency materialization: `npm ci` completed with 239 packages; audit reported pre-existing dependency advisories and no package/lockfile change is committed;
- focused FB2-30: `1 file / 8 tests PASS`;
- typecheck: PASS;
- runtime/core regression selection: `83 files / 502 tests PASS`;
- official CI: `144 files / 1011 tests PASS`;
- content validate: `7 masters / 7 servants / 20 events / 0 blocking issues`;
- generated-content determinism: PASS with hashes `866a5b...`, `fb6938...`, `b1bb89...`;
- Locked Reference verify against exact checkout: PASS;
- client production build: PASS (existing Vite `node:crypto` browser-externalization warning only);
- production identity audit on modified runtime files: PASS;
- `git diff --check`: PASS.

A raw `vitest run packages/rules/tests` was also attempted. It reported 18 source-evidence authoring failures caused by absent legacy `chm-extract`/image files in this worktree (including hard-coded historical `D:/fd/chm-extract` paths). Runtime/regression tests in that run passed; the repository's official `test:ci` excludes those source-dependent authoring tests and passed in full. No test was weakened or edited to hide those environmental failures.

## Review boundary

Candidate status only. Fresh independent R must review the exact Candidate and may return `IMPLEMENTATION_ACCEPTED_CANDIDATE` or `IMPLEMENTATION_NEEDS_REVISION`. A capability synchronization is required after acceptance. No consumer migration or formal frozen-credit increase is claimed here.
