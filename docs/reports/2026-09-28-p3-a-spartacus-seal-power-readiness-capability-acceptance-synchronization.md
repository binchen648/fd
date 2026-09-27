# P3-A Spartacus Seal-Power Readiness Capability Acceptance Synchronization

Role: Codex A
Status: `SYNCHRONIZED`
Date: 2026-09-28

## Accepted input

- PR: `#470`
- Exact Base: `7f0dc16fec89bcbbd78681e7cfc3036616a5c68b`
- Reviewed predecessors: `f114f650516802e19e38cd882c341e83469d8021`, `7fd3e7b1ef942a569a36e4b36ff656751f8ca6bd`, `2a057640c066ef47b82e90fa66df6bb31e89969a`
- Exact accepted successor Candidate: `c5c418a0c1227924abdac5de6707ebeacbe074a0`
- Canonical same-attempt evidence: `https://github.com/binchen648/fd/pull/470#issuecomment-5858470246`
- Verdict: `IMPLEMENTATION_ACCEPTED_CANDIDATE`
- ReviewJobKey: `pr470:c5c418a0c1227924abdac5de6707ebeacbe074a0`
- Exact-Candidate Phase 3 Pre-Review Gate: `36339293812` — `SUCCESS`

The canonical comment is a Coordinator bounded relay of the same already-completed fresh independent review attempt after Reviewer GitHub publication returned explicit HTTP 403. It is not a second review.

## Accepted bounded capability

This transaction is a permanently zero-credit owner-readiness prerequisite for current owner `servant.spartacus`. It closes the complete currently discoverable generic seal-to-combat-total-power gap family needed by sc1/sc3 while preserving the already accepted FB2-48 support used by sc2.

Accepted behavior includes:

- current-round distinct engaged-opponent normal/Ruler seal-use tracking and the source-defined `engaged user count * (6 - 2 * controller remaining normal seals)` combat formula shell;
- repeatable normal Command Seal replacement that consumes one physical seal and grants +4 current-round combat total power;
- issuer-owned/distributed Ruler Seal replacement with exact selection when multiple seals remain, granting +4 current-round combat total power;
- Action-stage live +1 current-round combat total power per unused normal / issuer-owned Ruler seal held by each engaged opponent;
- suppression of the original normal/Ruler action only while the corresponding exact controlled replacement provider exists, preserving legacy behavior otherwise;
- authenticated physical Ruler grant cardinality/provenance, normal/Ruler use provenance, bidirectional persisted marker reconciliation, and fail-closed restore/corruption handling.

Across R1/R2/R3, forged or unreachable resources, marker-only state, provenance-only state with missing markers, widened physical Command Seal counts, invalid private continuation metadata, and malformed privileged shells all fail closed before gameplay can observe or consume them.

## Verification carried by accepted Candidate

- focused Spartacus readiness: `20/20 PASS`;
- affected serial chain: `10 files / 227 tests PASS`;
- FB2-27 Ruler: `13 PASS`;
- MatchSession: `33 PASS`;
- executable-card-pack: `50 PASS`;
- authoring-interpreter: `38 PASS`;
- combat-resolver: `10 PASS`;
- MatchSession regressions: `7 PASS`;
- complex-skills regression: `37 PASS`;
- resolution-dataflow: `15 PASS`;
- fixed-controller command-seal component: `4 PASS`;
- typecheck: PASS;
- content validate/compile: PASS — `7 masters / 12 servants / 20 events / 0 blocking issues`;
- generated-content determinism: PASS with unchanged hashes;
- Base-to-Candidate `git diff --check`: PASS;
- `data/authoring/**` delta: EMPTY;
- production Spartacus/card-name/SkillLib identity-routing audit: CLEAN;
- final fixed Reviewer state: CLEAN, detached HEAD exactly accepted Candidate.

## A rescan / accounting

This readiness task earns zero migration credit. Strict formal accounting therefore remains **`137/944`**, remaining **`807`**.

Mechanical owner rescan after acceptance confirms:

- canonical formal owner scope remains exactly all three Spartacus skills together;
- sc1 and sc3 now have the accepted generic seal-power readiness support needed for their source-grounded semantics;
- sc2 keeps the historical formal acceptance from PR #414 / Candidate `58fffb751e25a9ccc2f28470a48255a07ba11493` and accepted FB2-48 support; it remains preservation-only and receives no duplicate credit;
- no additional currently discoverable bounded readiness/capability blocker remains before formal consumer authoring;
- `data/authoring/servants/servant.spartacus.json` is still absent at the accepted readiness Candidate, so no formal consumer migration has been credited by this transaction.

Execution returns immediately to `P3-S-OWNER-SPARTACUS-COMPLETE-MIGRATION`. The formal owner Candidate must contain sc1 + preservation-only sc2 + sc3 together and must bind this A-sync line as its exact Base. Do not advance owners.

If the whole Spartacus owner batch is later `MIGRATION_ACCEPTED` and A-synchronized/accounted, it can add exactly two new formal identities (sc1 + sc3), moving strict accounting from `137/944` to `139/944`, remaining `805`.
