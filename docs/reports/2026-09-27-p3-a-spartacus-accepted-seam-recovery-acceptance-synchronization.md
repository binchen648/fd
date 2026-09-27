# P3-A Spartacus Accepted-Seam Recovery Acceptance Synchronization

Role: Codex A
Status: `SYNCHRONIZED`
Date: 2026-09-27
Task: `P3-A-SPARTACUS-ACCEPTED-SEAM-RECOVERY-ACCEPTANCE-SYNC`

## Accepted input

- PR: `#469`
- Exact Base: `128089a18341b41b663244f6b8b23088d237f6d8`
- Reviewed predecessors: `4a07140a75600f2128dab17cce264f78beae3ea4`, `49d940a2536de55a7ed87fc26045557fc0c51358`
- Exact accepted successor Candidate: `d12596998bc4d3a45494e84b107e2577d8e445c4`
- Canonical same-attempt evidence: `https://github.com/binchen648/fd/pull/469#issuecomment-5857358441`
- Verdict: `IMPLEMENTATION_ACCEPTED_CANDIDATE`
- ReviewJobKey: `pr469:d12596998bc4d3a45494e84b107e2577d8e445c4`
- Exact-Candidate Phase 3 Pre-Review Gate: `36329801282` — `SUCCESS`

The canonical comment is the Coordinator bounded relay of the same already-completed fresh independent review attempt after Reviewer GitHub publication returned explicit HTTP 403. It is not a second review.

## Accepted bounded recovery

This transaction is permanently zero-credit and restores two historically accepted identity-free generic seams onto the current owner-complete line:

- FB2-27 Ruler seal subsystem, historical accepted semantic baseline `e30e7efef3cf9fc111236599441e5a869f4bc81a` / acceptance sync `1ef03961`;
- FB2-48 combat-opponent frozen-power VP reward, historical accepted Candidate `14c8688c201d4d39a85843470be6b79eec01853d` / canonical prior reviewer evidence `https://github.com/binchen648/fd/pull/413#issuecomment-5754051359` / acceptance sync `ff6aeba3`.

Current-line integration truthfully differs from the historical Ruler baseline only where required by the evolved current runtime: an optional explicit eligible-opponent domain is supplied to the accepted least-bound algorithm so target discovery and ordered settlement consume the same immunity-filtered active-opponent set. Omitting that domain preserves the historical/default active-opponent behavior. The focused immunity regression covers the Reviewer shape `p2=0,p3=1,p4=1`, excludes immune p2, exposes p3/p4, and settles `[p3,p4]` successfully.

The FB2-48 dedicated module remains the accepted frozen-power reward semantic envelope, apart from BOM normalization. No Spartacus identity/card-name/printed-text routing, runtime Chinese parsing, SkillLib fallback, or consumer authoring is introduced by this recovery.

## Review closure / verification

- R1 Candidate `4a07140a75600f2128dab17cce264f78beae3ea4`: `IMPLEMENTATION_NEEDS_REVISION`; canonical relay `https://github.com/binchen648/fd/pull/469#issuecomment-5857074164`; immunity-domain functional finding closed by successor `49d940a2...`;
- R2 Candidate `49d940a2536de55a7ed87fc26045557fc0c51358`: `IMPLEMENTATION_NEEDS_REVISION`; canonical relay `https://github.com/binchen648/fd/pull/469#issuecomment-5857199684`; stale byte-equivalence provenance claim closed by docs-only successor `d1259699...`;
- exact accepted successor focused Ruler + FB2-48: `2 files / 23 tests PASS` (`13 + 10`);
- affected serial chain: `8 files / 176 tests PASS`;
- typecheck: PASS;
- content validate: PASS — `7 masters / 12 servants / 20 events / 0 blocking issues`;
- content compile: PASS — same summary;
- generated-content determinism: PASS with expected unchanged hashes;
- Base-to-Candidate `git diff --check`: PASS;
- `data/authoring/**` delta: EMPTY;
- production Base-to-Candidate identity audit: CLEAN for `servant.spartacus`, `sc-spartacus`, Chinese owner/card strings, and `SkillLib`;
- exact-Candidate policy run `36329801282`: SUCCESS;
- final fixed Reviewer remained clean, detached, at exact accepted Candidate.

## A rescan / accounting

This recovery grants zero migration credit. Strict formal accounting therefore remains **`137/944`**, remaining **`807`**.

Mechanical owner rescan keeps the same current owner `servant.spartacus` and the same one-owner-complete boundary:

1. `servant.spartacus.skill.sc-spartacus-1` — 反叛 — newly creditable only after the future owner-complete formal transaction is accepted and synchronized;
2. `servant.spartacus.skill.sc-spartacus-2` — 伤兽的咆哮 — historical `MIGRATION_ACCEPTED` preservation/replay only from PR #414 / Candidate `58fffb751e25a9ccc2f28470a48255a07ba11493`; no duplicate credit;
3. `servant.spartacus.skill.sc-spartacus-3` — 不屈的意志 — newly creditable only after the future owner-complete formal transaction is accepted and synchronized.

The canonical `data/authoring/servants/servant.spartacus.json` is still absent at the accepted recovery Candidate, so no formal Spartacus consumer has been created by this task. Execution returns immediately to `P3-S-OWNER-SPARTACUS-COMPLETE-MIGRATION`; do not advance owners.

A later accepted + synchronized Spartacus owner batch can add exactly two new identities (sc1 + sc3), moving strict accounting from `137/944` to `139/944`, remaining `805`. Historical sc2 is preservation evidence only and must not be counted again.
