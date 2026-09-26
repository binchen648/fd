# P3-B Main Replay Outside-Game Owned Servant Skill — Dispatch

Date: 2026-09-26
Task: `P3-B-MAIN-REPLAY-OUTSIDE-GAME-OWNED-SERVANT-SKILL`
Base authority: Composition-02 exact A line
Historical accepted authority: PR #441 Candidate `fc6d2f52f2d2cebbedc60e9e5d106744b347c8ff`
Canonical historical evidence: `https://github.com/binchen648/fd/pull/441#issuecomment-5825842148`

## Purpose

Restore only the identity-free extension of accepted FB2-18 outside-game initial placement from owned master skills to owner-matching servant skills. This is zero-credit capability work used to close exact-50 readiness blockers; it is not a consumer migration.

## Exact contract

An authored card with exact `initialPlacement: "outside_game"` is additionally admissible only when all of the following hold:

- `cardType === "servant_skill"`;
- archive/root id is a nonempty `servant.*` id;
- authored owner is exactly `{type:"servant", id:<root id>}`;
- card ownership therefore matches its archive root.

The loaded/compiled card remains registered with `initialPlacement: outside_game` and receives no `initialZone`.

Existing owned-master-skill FB2-18 behavior must remain unchanged. Any owner mismatch, non-servant root, unsupported card type, malformed placement value, or near-match shape must fail closed. Loader and executable compiler must agree.

## Exclusions

No consumer/card identity routing. No Sherlock or Mash special case. No deduction-record behavior. No authoring/material changes. No product registration. No generic outside-game widening to attack/event/player cards. No unrelated M50-02 primitive replay. No merge/retarget. Zero migration credit.

## Required proof

Run focused FB2-18 placement tests with servant positive + mismatch/unsupported negatives, executable-pack affected tests, loader/compiler affected tests, typecheck, `git diff --check`, exact scope, and production identity-routing audit. Fixed Work must be clean and exact-line compatible before implementation; otherwise report the blocker without mutating that Work or creating a fallback worktree.