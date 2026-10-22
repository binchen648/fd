# Arthur SC3 A-sync / accounting

- Date: 2026-10-23
- Role: A synchronization/accounting
- Strict repository: `https://github.com/binchen648/fd.git`
- Exact A-sync base: `31c389e607e9bd192d02169486f0b5fd2672d394`
- Candidate: `96d3951b5b2d5bf8a3e0da35a32006e6bf50125e`
- Candidate PR: [#680](https://github.com/binchen648/fd/pull/680)
- FORMAL decision: `642d73609efb1884fc2781b7268f02fe78872b6d`
- Formal decision review: `362357c0a754c8719f285393171f212926758bd4`
- Candidate Reviewer: `37bfa4335119ef51904e21b46a1939393d8b9af7`
- Verdict: `MIGRATION_ACCEPTED` — SC3 scoped subset only
- Credit delta: `0`

## Accounted scope

This A-sync records acceptance of exactly `servant.arthur.skill.sc-arthur-3` (`sc_arthur_3`) through the prior FM03 contract envelope:

1. P3-R12/B18 — exact optional combat post-result controller VP `+1` response;
2. P3-R13/B19 — independent highest-cost Noble Phantasm threshold `>=4` sibling controller VP `+1` response;
3. P3-R29/FB2-10 — exact active-source same-battlefield engaged-opponent Magic attack `attack.currentPower=0` modifier for `this_round`;
4. P3-R30 — exact ten-member FM03 boundary including Arthur SC3.

The accepted Candidate preserves the exact canonical/legacy IDs, printed SC3 text, full-text SHA-256 `8a6da48db16868ce5d5766fa7ff05c00b2c392f715106f869cb59aaabee65ffc`, clause SHA-256 values `1cef15482dd584d9d18b4e9016476b7bffb31cb0331efd38b4025a26611c84c2`, `f0631437ce658c07be75426fc0394d6f32c6fafc10805bcb359ff17d4de97f85`, and `bd7530459d6ccd00217d1192b06509e322d48bafd44f037c383470ecbba55229`, plus strict-repo archive/test evidence. This is accounting/documentation only.

## Preserved blocks and limits

- `servant.arthur.skill.sc-arthur-1` remains `SOURCE_EVIDENCE_REQUIRED` / `SEMANTIC_SOURCE_REQUIRED` / `EXPLICIT_BLOCK`.
- `servant.arthur.skill.sc-arthur-2` remains `SOURCE_EVIDENCE_REQUIRED` / `SEMANTIC_SOURCE_REQUIRED` / `EXPLICIT_BLOCK`.
- `servant.arthur` remains owner-blocked; SC3 does not unlock the owner.
- `ownerCredit=0`; this A-sync grants no migration credit.
- Frozen SC3 inventory accounting remains `BLOCKED`, `mappingStatus=EXPLICIT_BLOCK`, `currentRoute=none`, empty inherited/partial contracts, and `reference.hasAuthoringCard=false`; this drift is preserved and not rewritten.
- Acceptance does not infer a playable/current route, Arthur-specific handler, pack/generated registration, roster mutation, restore/replay/reconnect readiness, or owner-complete migration.
- No runtime, executable, playable, authoring, pack, generated-content, roster, restore/replay, or frozen-inventory mutation is included in this A-sync.

## Historical object verification boundary

The following historical references remain unparsed provenance limitations in the strict checkout:

- F1: `59f145434695d29bdd17e4cb3adc887e84182377`
- R12/B18: `c86eca28dc4c915f60a30eaff7769714f8644d77`
- R13/B19: `24c1ef9dba7436204ac3a334edc2483804d00cc3`
- R29/FB2-10: `37fcdaf6d3367a4efb9dcfaf8a1a532fb4354ae9`
- R30/FM03: `27a112888058a3fe4dd5882bc95054e7346de4a5`

All five `git cat-file -e` checks are unresolvable in this checkout. The accounting relies on the checked-in Candidate, strict-repo archive/test, and formal/reviewer reports; no raw historical commit-object verification is claimed. The frozen out-of-scope provenance repository warning remains unchanged.

## Validation and dynamic-check limitation

- Base/Candidate/PR/FORMAL/formal-review/Candidate-review identifiers: recorded exactly as above.
- Candidate JSON/archive/test/SHA/boundary checks: passed before this A-sync.
- A-sync report is docs-only; runtime and frozen-inventory paths are untouched.
- Runtime/content/generated suites were **not run** for this A-sync; no new dynamic result is claimed.
- `git diff --check`: PASS.
- No push or merge was performed.
