# P3-A R81 Triggered Residual CLOSE Integration Dispatch

- Role: Codex A
- Status: `READY_AFTER_HOT_FILE_LEASE`
- Canonical Task: `P3-B2-R81-TRIGGERED-RESIDUAL-CLOSE-INTEGRATION`
- Historical Invalid Alias: `P3-FB2-39-TRIGGERED-RESIDUAL-CLOSE`
- Accepted Runtime Base: `64b4bb7a8b1379dd858c746e77f503b271950ec1`
- Local B Candidate: `f4d67cc` (`codex/b-p3-fb2-39-triggered-residual-close`)
- Migration Credit: zero

## Numbering And Evidence

The earlier A-only dispatch at `a379a50` assigned `FB2-39` to this CLOSE gap. That ID collides with the formal `P3-FB2-39-GAME-START-STATUS-ASSIGNMENT`, already implemented and accepted on a separate remote lineage. The old CLOSE ID is withdrawn as an alias; no task history is deleted.

The local B branch is clean at `f4d67cc`, but has no corresponding remote branch. The user reports independent review passed for this B work. This record has no stable R verdict URL or exact Base/Candidate binding, so it does not claim formal integrated acceptance or Gate promotion. Publish the B Candidate and its review evidence separately from the new integration review.

## Integration Barrier

Read-only `git merge-tree --write-tree 64b4bb7 f4d67cc` found a content conflict in `packages/rules/src/ability/interpreter.ts`. Therefore the local B review cannot be inherited by the current accepted runtime lineage.

B2 must reserve the shared runtime hot-file lease, create a fresh branch from the exact accepted Base above, port the two local B commits or the equivalent minimal shared implementation, and resolve the interpreter conflict without dropping intervening contracts. Rename the historical FB2-39 test/report identifiers to this canonical task ID in the integration branch. Do not alter the independently active FB2-43 work or mix another capability into this PR.

## Required Integration Verification

- Compiler and runtime recognize only the exact identity-free `after_battle_ended` residual CLOSE shape; malformed near-matches fail closed without legacy fallback.
- Real post-scoring `MatchSession.resolveBattlePhase` closes the source once only when eligible; loss preserves it.
- Closed source is in skill, inactive, owner-only visible, and emits exactly one `source_card_closed` event with source/controller identity.
- Invalid controller, source, zone, active/face state, malformed terminal provenance, stale/replayed event, and later failure cause no partial mutation or duplicate audit event.
- Existing `on_card_played` typed CLOSE and other intervening runtime contracts remain green.
- Typecheck, focused rules tests, core/regression suite, official CI, content validation, generated determinism, diff check, and hot-file/identity-routing audits pass on the integrated Candidate.
- Report before/after legacy/new/dual and skipped counts without granting migration credit; state any secondary runtime path deliberately retained.

Then R independently reviews the integrated exact Base/Candidate. Only after R acceptance may A synchronize this capability. S must re-certify Darius s1 against that accepted runtime and R must resolve the conflicting historical `776ee46` verdict before A changes the Darius migration credit.

## Accounting Boundary

Latest remote A ledger records `145/944` after R89 Darius s2. The separate R81 Darius s1 `+1` is contested by a newer user-supplied CLOSE-path finding. This dispatch neither increments nor decrements the formal ledger; it marks the dependency and prevents treating `145/944` as proof that Darius s1's CLOSE semantics are sound. No merge or retarget is authorized here.
