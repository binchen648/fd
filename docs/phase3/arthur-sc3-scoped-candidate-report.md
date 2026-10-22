# Arthur SC3 scoped Candidate report

- Date: 2026-10-23
- Role: Builder Candidate (docs/metadata/contract evidence only)
- Strict repository: `https://github.com/binchen648/fd.git`
- Exact base: `31c389e607e9bd192d02169486f0b5fd2672d394`
- Owner: `servant.arthur`
- Candidate scope: `servant.arthur.skill.sc-arthur-3` prior-contract evidence only
- Formal decision: `642d73609efb1884fc2781b7268f02fe78872b6d`
- Formal decision reviewer: `362357c0a754c8719f285393171f212926758bd4` (`CONTRACT_ACCEPTED_FOR_SCOPED_SUBSET`; decision review only, not Candidate review)
- Independent Candidate Reviewer: pending; a fresh GPT-6 Sol Candidate review is required for this successor
- Owner credit: `0`
- Owner unlock: `false`
- Candidate status: docs/metadata-only scoped record; no runtime/current-route/playable/restore claim

## Included scope

This Candidate records only the previously accepted identity-free contracts represented by Arthur SC3 and the exact FM03 ten-member evidence:

1. P3-R12/B18: exact optional combat post-result controller VP `+1` response;
2. P3-R13/B19: independent threshold sibling, highest-cost Noble Phantasm cost `>=4`, controller VP `+1`;
3. P3-R29/FB2-10: active-source combat modifier setting same-battlefield engaged opponent Magic attack `attack.currentPower=0` for `this_round`;
4. P3-R30: exact ten-member FM03 boundary including Arthur SC3.

The Candidate preserves the exact canonical/legacy identity, printed text, full SHA-256, clause SHA-256 values, source locators, strict-repo archive hash, and focused ten-member test hash. It does not add or alter the archive/test; they are evidence only.

## Historical verification boundary

F1 `59f145434695d29bdd17e4cb3adc887e84182377`, R12/B18 `c86eca28dc4c915f60a30eaff7769714f8644d77`, R13/B19 `24c1ef9dba7436204ac3a334edc2483804d00cc3`, R29/FB2-10 `37fcdaf6d3367a4efb9dcfaf8a1a532fb4354ae9`, and R30 `27a112888058a3fe4dd5882bc95054e7346de4a5` are retained as provenance references. Their raw commit objects are not resolvable in this strict checkout; the Candidate claims corroboration only from checked-in archive, test, and reports.

## Explicit exclusions and preserved blocks

- Frozen inventory remains unchanged: SC3 is `BLOCKED` / `SOURCE_EVIDENCE_REQUIRED` / `SEMANTIC_SOURCE_REQUIRED` / `EXPLICIT_BLOCK`, `currentRoute=none`, empty inherited/partial contracts, and `hasAuthoringCard=false` accounting state.
- `servant.arthur.skill.sc-arthur-1` and `servant.arthur.skill.sc-arthur-2` remain `SOURCE_EVIDENCE_REQUIRED` / `SEMANTIC_SOURCE_REQUIRED` / `EXPLICIT_BLOCK`.
- No current route, playable registration, pack/generated mutation, runtime/executable mutation, roster mutation, restore/replay/reconnect readiness, owner unlock, or owner credit is recorded.
- Reference handlers and historical contract labels remain provenance/contract boundaries only; no Arthur-specific handler or guessed semantics are added.
- This Candidate record already exists as a docs/metadata-only artifact; no additional Candidate PR is created or pushed from this successor worktree. Fresh independent Candidate Reviewer acceptance remains required.

## Checks

- Candidate JSON parse and scope cardinality: **PASS**.
- Inventory text/full/clause SHA recomputation: **PASS** (SC3 exact source identity).
- Archive parse, exact one-card membership, archive SHA, focused FM03 test membership, and test SHA: **PASS**.
- Prior-contract boundary check: **PASS** (R12/B18, R13/B19, R29/FB2-10, R30 only).
- Historical commit-object resolution boundary: **PASS** (five hashes intentionally retained as unresolvable provenance).
- Frozen block/current-route/owner-credit boundary: **PASS**.
- Runtime/inventory/pack/generated path boundary: **PASS** (Candidate change set is docs-only).
- `git diff --check`: **PASS** after final report normalization.
- Runtime/content/generated suites: **not run**; this Candidate is docs/metadata-only and no new dynamic result is claimed.
