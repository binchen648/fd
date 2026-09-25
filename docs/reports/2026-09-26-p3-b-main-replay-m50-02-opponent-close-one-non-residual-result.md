# P3-B Current-Main M50-02 Opponent Close One Non-Residual Replay

Role: Codex B2
Status: `IMPLEMENTATION_COMPLETE_CANDIDATE`
Date: 2026-09-26

## Exact input

- Canonical Base: `67a8d150efd20d7b84c08fab59d9b403a9543087` (M50-01 primitives acceptance synchronization).
- Local tree-equivalent validation Base: `a2bcc1b37e54c4427e62c1824c3f57a1ca4e59ee`; both resolve to tree `b246b19f61310acd77def04c0404595cd96d105c`.
- Historical accepted semantic source: PR #441 Candidate `fc6d2f52f2d2cebbedc60e9e5d106744b347c8ff`.
- Historical canonical evidence: `https://github.com/binchen648/fd/pull/441#issuecomment-5825842148`.
- Scathach decomposition authority: `docs/reports/2026-09-25-p3-a-main-replay-scathach-s2-contract-decomposition.md`.

## Implemented capability

Replays only the identity-free `opponent_close_one_non_residual` interaction required by Scathach S2. This contract remains distinct from FB2-49 `opponent_close_non_residual_to_one`: the latter closes multiple non-residual attacks until one remains, while this task gives the unique same-battlefield opponent one mandatory owner-only choice to close exactly one of their own eligible non-residual attacks.

Current-main normalizes the redundant historical `phase_is(combat)` condition into authoritative `activation.phase = combat`; no new `phase_is` vocabulary is introduced. The ability classifier requires the exact combat activation, one direct `target_count_equals(scope=same_battlefield_opponents,count=1)` condition, and one exact `opponent_close_one_non_residual` effect.

Legal candidates are restricted to the unique active same-battlefield opponent's physically owned, controlled, active, face-up, non-residual, currently closable attacks. If there is not exactly one active same-battlefield opponent or no legal candidate, no action is exposed. At answer time the runtime recomputes source validity, battlefield relation, chooser identity, candidate set, physical owner map, close protection, frozen metadata, and selection before closing exactly one card through the existing current-main close helper.

A dedicated `opponent_close_selected_one_non_residual_v1` interaction metadata shape is bounded in `types.ts` and restore validation. Valid pending state round-trips through MatchSession persistence; host-signed widened metadata is rejected. No second hidden-authority subsystem is introduced.

## Scope

Production changes are limited to the existing opponent-close classifier, loader/interpreter interaction handling, interaction metadata/restore validation, one focused test, and this result report. No `data/authoring/**`, Scathach consumer card, M50-02 50-card batch, unrelated M50 vocabulary, generated/client/pack/governance change, identity/name/printed-text/Chinese routing, SkillLib fallback, merge, or retarget is included.

## Verification

- focused M50-02: `1 file / 6 tests PASS`;
- affected chain including M50-02, M50-01, FB2-33, FB2-32, FB2-42, FB2-49, card-source-state, resolution-dataflow, and full `match-session.test.ts`: `9 files / 143 tests PASS`;
- `match-session.test.ts`: `30/30 PASS`;
- `npm run typecheck`: `PASS`;
- valid pending selected-one persistence round-trip: `PASS`;
- host-signed widened selected-one metadata restore rejection: `PASS`;
- exact Base-to-Candidate scope: `7 files`;
- Base-to-Candidate `data/authoring/**` delta: `EMPTY`;
- production identity/name/printed-text/Chinese/SkillLib routing audit: `CLEAN`;
- exact Base-to-Candidate `git diff --check`: `PASS`.

## Accounting

Zero migration credit. Formal/material remains `112/944`, remaining `832`.