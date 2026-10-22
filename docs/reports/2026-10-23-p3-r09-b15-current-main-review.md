# P3-R09 B15 Current-main Independent Review

Date: 2026-10-23 (Asia/Hong_Kong)  
Exact Candidate: `90e72841ec58d4a5a670ef79333a2ba7d7c3e939`  
Exact A-sync base: `e951d7cc86e031807f6dc3af7c029310bf1317c9`  
Verdict: **MIGRATION_ACCEPTED**, limited to the B15 Ereshkigal battle-terminal source-card return runtime capability.

## Independent execution

On the exact Candidate, `npm ci` and `npm run typecheck` exited 0. B15 focused Vitest passed **7/7**. The seven-file B15/B14/B13/Olga/SOURCE_ACTIVE/combat-outcome/state-transform compatibility run passed **47/47**. Four additional Trigger, Card Zone, Card Action, and Interaction regression files passed **20/20**. Fresh Chromium Playwright `e2e/fd-ereshkigal-battle-terminal-card-zone.spec.ts` passed **1/1**. `git diff --check e951d7c... HEAD` passed. These are independent current-Candidate runs; historical R09/B15 reports were not substituted.

## Runtime and semantic assessment

The classifier accepts the identity-free forced combat `after_battle_ended` shape with no conditions, targets, costs, creates, modifiers, lifecycle, visibility, response, or limit extension and exactly one `move_card(this_card)` to controller `skill`. It permits only bounded canonical loader execution/response metadata. A renamed synthetic ability classifies; wrong trigger/destination, extra condition/activation/effect metadata, and missing destination owner fail classification. Malformed same-family candidates reject before legacy `resolveEffect`; the accepted shape uses typed resolution-dataflow. No Ereshkigal card or ability ID participates in routing.

The typed `move_source_card` primitive checks source existence, owner and controller match, a supported `field`/`attack_area` active face-up source, and the controller skill destination before committing its transaction. On success it moves to `skill`, restores owner-only visibility and controller authority, deactivates the source, and emits typed move evidence. Focused negatives prove unchanged caller state for off-board source, wrong controller, and malformed destination. No partial mutation or legacy fallback was observed.

`MatchSession` and core game-loop use the same phase-terminal helper. Its stable key is `battlePhaseResolutionId:after_battle_ended`; it retains ordered battle/result/scoring references and participant/outcome facts, waits while post-battle queue, decision, response window, or host request remains pending, then processes before cleanup. The production two-battlefield regression shows one terminal dispatch after both result dispatches and source return before cleanup; re-entry adds no second dispatch. The core-loop regression shows the same before-cleanup terminal behavior. The B13 Shinji, B14 Artoria Caster, and Olga B07 compatibility tests remained green.

Fresh browser/server Gate C sees two result dispatches before one terminal event, stable phase/battle/result/scoring references, and Eresh SC2 in `skill` after settlement. Reload/reconnect and a rejected stale command retain the zone, revision, terminal count, and terminal identity. The B15 in-process fixture keeps deferred runtime authority in its serving process; the browser still uses the real server with a server-issued credential. No production authentication code changed.

## Gate decision and boundary

Gate A, Gate B, and fresh B15 Gate C are satisfied for this exact representative. The base-to-Candidate diff is limited to B15 interpreter classification, B15 focused tests, B15 E2E/support fixture, and implementation report. This verdict accepts only the B15 runtime capability; it does not inherit historical B13/B14 evidence as B15 proof, accept Gatou or other TO14 consumers, change overlay accounting, create migration/coverage credit, or merge the Candidate. Any A-owned synchronization is separate.
