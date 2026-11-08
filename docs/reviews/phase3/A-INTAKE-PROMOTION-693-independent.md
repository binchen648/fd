# PR #693 independent implementation candidate review — 4f18ce1d

**IMPLEMENTATION_ACCEPTED_CANDIDATE** for the complete 126-path main-relative implementation candidate, using the cumulative evidence specified below. There are no remaining independently reproduced blockers in the reviewed promotion implementation scope. This is not complete integration gate PASS, full-game product acceptance, full-roster acceptance or merge authorization.

Candidate `4f18ce1d94a36af477b6279b74b1fe3606199e12`, main `e63cdeb2a065a9f87c24039d2b08bbe059513fed`. Exact candidate and clean worktree checked before and after. Repository production/tests were not edited by reviewer. Independent L1/L2 **89 PASS /0 FAIL /0 SKIP, natural exit0**; exact command and hashes in the accompanying JSON, raw `promotion-final-4f18ce1d-tests.json/log`.

## Closed final blocker

PROMO-D5-LIFECYCLE-01 is closed. The movement-lock reader now derives recognized lock effects from the latest authoritative public event placements using the registered playtest definitions. The former modeState cache is diagnostic only; Session snapshots use the same reader. Public removal/replacement, battle reveal and snapshot restoration no longer depend on a later cache refresh.

The exact independent lifecycle probe from the failing 01c candidate was rerun on 4f: after authoritative removal, effect entry is allowed and the lock reads false; after the production battlefield resolver reveals a hidden barrier, the lock reads true and effect entry is rejected `movement_locked`. See `promotion-final-4f18ce1d-lifecycle-probe.log`. This is bounded L1/L2 evidence, not a natural complete game. Endpoint-only entry/exit restrictions and the existing trusted effect override remain; ordinary deployment is not forbidden.

## Complete promotion scope and cumulative review

This review combines the prior main-relative scope/provenance audit (`promotion-scope-review`), the D5 consumer sweep (`promotion-d5-review`), the 01c withdrawal review, and the prior five-field source/evidence review (`final-unified-review`). Their conclusions are used only within their documented coverage; their historical test results are not relabeled as current candidate runs.

The original Resistance/Narrow Path/Curse God/Banquet/Waxing Moon consumers were withdrawn in 0c. Remaining unaccepted Gentle Hometown/Beautiful Thing/Rage Rising/Keian/White Night consumers were withdrawn in 01c. Current source and focused tests confirm their speculative stores do not alter retained settlement and power calculation. Printed source definitions remain host-adjudicated; existing host notices are consumed advisory directives, not an implemented optional-choice/host-settlement UI. Five previously reviewed field fixes retain their scoped evidence and current 48-case independent regression pass.

The original eleven-round test body was independently compared byte-for-byte against 0c: identical after moving to `seven-roster-full-match.test.ts`, including its 30_000 timeout and all assertions. Root Vitest still discovers that file. AGENTS.md, roadmap and the plan now require L1 per skill, L2 for actual combinations and L3 at a frozen integrated milestone. The historical mixed 171/1 run remains a failure; splitting does not turn it into PASS.

## Integration gates still pending

Run the complete unchanged CI on the frozen candidate and obtain a natural exit0. Run the required final integrated seven-player/recovery/browser L3 once after this review; none was run by this reviewer. Complete current report, actual review reference/attestation and GitHub Test/Build/Policy before readiness. User merge approval remains separate.

Full94 acceptance,59 identity rows without mapped execution evidence, public tunnel acceptance and excluded Shinji replacement remain outside this candidate review. Deferred events are not credited as new automatic skill support. No merge, reservation release or migration/coverage credit granted.
