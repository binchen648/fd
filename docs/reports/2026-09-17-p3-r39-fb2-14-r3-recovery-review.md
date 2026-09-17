# P3-R39 FB2-14 r3 Recovery Review

Date: 2026-09-17
Reviewer: Codex R
Status: `GATE_A_B_CANDIDATE_ACCEPTED`

## Pins

- Target: `0831d9fea7c0ffedde634333f27564ea3c1dc65a`
- Recovery base / blocked r2 review: `68b173d480df7a7b0e83cdc403e73616c3216b2f`
- Blocked r2 target: `3879203870bb05ad9619c03c60c69ed9e1941080`
- A handoff base: `50602c9355794c9c0c7fe4d79b75f7936d912c17`
- F1 evidence: `59f145434695d29bdd17e4cb3adc887e84182377`
- Locked Reference provenance: `b2f9fa15fba07c63530bbf4612b03b8b704755f9`
- Reviewer branch: `codex/r-p3-fb2-14-r3-review-r39-recovery`

The reviewer independently read the Phase 3 agent contract, the P3-FB2-14/P3-R39/P3-FM08 task blocks, the A handoff, the blocked r2 review, the r3 recovery report, and the exact `68b173d..0831d9f` recovery diff. The reviewer made no runtime or authoring changes.

## Findings

No blocking findings.

The r3 repair closes the r2 P1 execution-envelope defect at the raw loader boundary before normalization can erase provenance:

- unknown raw `execution` keys on an ability containing `install_rule_override` emit an unsupported report;
- simultaneous `hostOps` and `allowedOperations` declarations are rejected, including the dual-empty form;
- either isolated authority field is accepted only when it is an empty array;
- non-array and nonempty authority declarations are rejected;
- any such loader failure normalizes the ability execution mode to `unsupported`, so the semantic classifier cannot accept the rejected raw shape.

Legal absence and either isolated empty authority declaration remain accepted. The recovery does not change the eleven RuleOverride schemas, setup ordering, generic consumers, mana accounting, projection rules, movement bypass, persistence/idempotency, or the earlier r2 runtime behavior.

## Scope and lineage audit

- `0831d9f` is a direct child of the blocked review commit `68b173d`; the runtime recovery itself changes only `loader.ts`, the focused FB2-14 regression, and the B2 recovery report.
- The full A-handoff-to-target lineage contains no `data/authoring` change.
- The recovery contains no Reference change, FM08 authoring migration, identity/name/printed-text routing, arbitrary flag bag, or accepted-overlap promotion.
- Production source search contains zero selected/excluded FM08 identity matches.
- `git diff --check` passes.

## Independent FM08 reconciliation

Frozen F1 evidence contains exactly twelve block-free `core.game-start-rule-flags` rows. The future FM08 set remains exactly these ten:

1. `master.bazett.skill.s1b`
2. `master.caules.skill.s1a`
3. `master.fiore.skill.s2`
4. `master.fiore.skill.s3`
5. `master.fiore.skill.s4`
6. `master.irisviel.skill.s1`
7. `master.peperoncino.skill.s1a`
8. `master.sieg.skill.s1`
9. `master.waver.skill.s1`
10. `master.zouken.skill.s5`

The other two rows remain correctly excluded: `master.leonardo.skill.s1a` requires the still-missing authoritative event-mana reward consumer for its full semantics, and `master.ophelia.skill.s1a` is a write-only use-count modifier for a dependent skill that is not yet canonical. FB2-14 does not implement either excluded semantic.

## Fresh validation

- `npm.cmd run typecheck`: PASS.
- Focused FB2-14 plus MatchSession: `37/37` PASS across 2 files.
- Rules regression/core: `396/396` PASS across 66 files.
- `npm.cmd run content:validate`: PASS, `7 masters, 7 servants, 20 events, 0 blocking issues`.
- `npm.cmd run verify:generated-content`: PASS with hashes:
  - content `8da51a30935845670dcd88928089730ff4a7a39d9b53b8c8c794189d95509840`;
  - fixture `fb69383fd91ab56bc645633eae72df8b8c10131cccd2713fd57afcf950a5f057`;
  - evidence `b1bb8968097534c796cc6ff5775f3a14cfbbd063aa24e6b94f79a7e81d655cc3`.
- Standard full CI: `738/738` PASS across 120 files.
- Fresh Phase 3 coverage: `90 archives / 123 cards / 222 abilities`; raw `22/3/127/0/70/124`; compiled definition hash `37551fd5f5b0a968f9143dee0698adf8582a0a26d8edabef55907cf78d374333`; blocking issues `0`.
- Fresh automation audit: legacy resolve/execute/not-classifiable `127/3/70`; promotion findings `20`.
- Coverage and audit outputs were directed to temporary files outside the repository.

An initial parallel test invocation raced workspace build output and failed package resolution before test collection. After typecheck completed, the exact focused and rules/core commands passed sequentially; this was not a product assertion failure.

## Verdict

`GATE_A_B_CANDIDATE_ACCEPTED`

The r3 recovery is acceptable for fresh Codex A synchronization. Strict accepted canonical overlap remains `101/944`; this runtime acceptance does not itself release FM08 or grant `111/944` migration credit. P3-FM08 may become READY only after A records the synchronization required by the task contract.
