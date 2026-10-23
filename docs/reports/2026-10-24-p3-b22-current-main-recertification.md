# P3-B22 Current-Main Recertification Receipt

Status: `IMPLEMENTATION_COMPLETE_CANDIDATE` (not Reviewer accepted)

Base: `88087e13a4d228b270a8922e741cbe7788d47e15` (B21 A-sync)  
Candidate branch: `codex/b-p3-b22-current-main-20261023`

## Scope and current-main finding

The current-main base already contains the Gatou
`seeker.battle-end-reward` implementation and focused regression, with runtime
blame at `bf6b1a158`. This receipt does not inherit the historical B22 branch,
historical Reviewer evidence, or historical acceptance. Only B22-scoped
interpreter/types/tests/E2E fixture/report files changed for this
recertification; no generated registry, inventory, task index, or coverage
file was changed.

The current runtime structurally recognizes only the exact identity-free
`forced_trigger` / `after_battle_ended` / single
`record_master_directive(gatou_battle_end_mobile_players_reward)` shape. It
requires frozen phase participants and battle outcomes, current-round movement
provenance, current-location eligibility, per-player deduplication, shared-win
VP selection, mana fallback, typed actual deltas, and replay exactly-once
settlement. Focused evidence confirms malformed same-family shapes fail closed.

The narrow delta adds exact-key semantic rejection, dense terminal battle/result/
scoring/participant/outcome/winner/controller-location provenance, current-round
normal/effect movement validation, and `terminalEventId`/`triggerEventId` on the
typed settlement receipt. No generic terminal or modifier path was changed.

## Fresh receipts

- `npm run typecheck`: exit 0.
- B22 focused `battle-terminal-gatou-reward.test.ts`: 9/9, exit 0.
- B13-B22 regression selection: 10 files, 72/72, exit 0.
- Chromium Gate C: 1/1, exit 0.
- `git diff --check`: exit 0.

The original B22 browser spec first failed at the legacy cross-process restore
fixture. It was replaced with a same-process trusted fixture server that
creates the room, prepares battle state, and serves dynamic endpoints:

```text
npx playwright test e2e/fd-gatou-battle-end-reward.spec.ts -c playwright.config.ts
1 passed, exit 0
```

The prior cross-process failure was `400 Invalid or missing deferred runtime
state authority`; it is retained as historical fixture evidence only. The
passing Gate-C path covers phase-terminal settlement, post-scoring ordering,
reconnect continuity, and stale revision rejection.

## Disposition

This is a current-main implementation candidate for independent review. It
does not claim `MIGRATION_ACCEPTED`, credit, merge, or promotion.
