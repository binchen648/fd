# P3-R21 FB2-04 Fixed Controller Command-Seal Component Review

Date: 2026-09-16
Role: R
Reviewed candidate: `5e6500a72f2d82c2cb12644a163ed6b9d96f0fc7`
A handoff baseline: `61162f0cfc25014a0a6f0bde73802ff5d00d662f`
Verdict: `GATE_A_B_CANDIDATE_ACCEPTED`

## Findings

No blocking findings.

The candidate implements the A-owned FB2-04 scope as a reusable semantic component and does not promote a broader Resource Numeric route. Production changes are limited to `packages/rules/src/ability/interpreter.ts`; the existing Resolution Data-flow `adjust_command_seals` primitive remains the single mutation/event owner.

## Accepted scope

R21 accepts only this component contract:

- effect type exactly `adjust_command_seals`;
- implicit or explicit `controller` ownership only;
- fixed non-zero safe-integer literal signed amount;
- optional `directive` only when it is a non-empty string;
- reuse under independently accepted parent routes, specifically the existing Resource Numeric direct-action route and B13 battle-loss resource route;
- typed `command_seals_adjusted` evidence and transaction rollback continue to come from the existing Resolution Data-flow primitive.

A matching effect does not by itself make an unsupported parent ability routable.

## Explicit non-acceptance

This review does not accept or imply:

- all-opponents or opponents-on-same-battlefield command-seal adjustment;
- restore-all command seals;
- command-seal payment;
- variable/expression command-seal amounts;
- third-party or target-selected command-seal mutation;
- generic Target Selection, Trigger Gateway, Interaction, Cost Payment, or broad Resource Numeric behavior;
- F1 authoring migration or any claim that the six component-member identities are migration-ready solely because this component is accepted.

The F1 exclusions recorded by A remain excluded: Amakusa ascension all-opponents loss, Bazett S4 restore-all, and Zouken ascension same-battlefield-opponent loss.

## Independent verification

Reviewer worktree was created fresh from the exact candidate SHA and remained clean before the review report.

- Static changed-file audit: only candidate result report, `interpreter.ts`, and focused regression file.
- Forbidden-file audit: PASS; no MatchSession, Resolution Data-flow, client/server, `data/phase3`, or `data/authoring` changes.
- Production identity/text audit: PASS; no master/servant/card/location/printed-text routing.
- `git diff --check`: PASS.
- `npm.cmd run typecheck`: PASS.
- Focused compatibility: 6 files / 33 tests PASS.
- Rules regression: 43 files / 256 tests PASS.
- `npm.cmd run verify:generated-content`: PASS with unchanged hashes:
  - content `8da51a30935845670dcd88928089730ff4a7a39d9b53b8c8c794189d95509840`
  - fixture `fb69383fd91ab56bc645633eae72df8b8c10131cccd2713fd57afcf950a5f057`
  - evidence `b1bb8968097534c796cc6ff5775f3a14cfbbd063aa24e6b94f79a7e81d655cc3`
- Full root `npm.cmd run test:ci`: 110 files / 669 tests PASS.

## Compatibility judgment

The final candidate correctly preserves the previously accepted direct Mana/VP malformed-definition rejection behavior. The implementation report records an earlier local attempt that tightened that parent classifier; that attempt is not present in the reviewed candidate. R21 judges only the final candidate and finds no compatibility regression.

## Gate judgment

`GATE_A_B_CANDIDATE_ACCEPTED`

No new Gate C is required for this server-side classifier/component-only change because projection, reconnect, stale-command, and pending-interaction behavior are unchanged.
