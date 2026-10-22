# P3-R10 B16 Current-main Independent Review

Date: 2026-10-23 (Asia/Hong_Kong)  
Exact Candidate: `0a11c04d4799628f3aa6e2e2f7b11b60611cc3b4`  
Exact B15 A-sync base: `97fd187331a6c4d2e3442d483971d4557da3a897`  
Verdict: **MIGRATION_ACCEPTED**, limited to the B16 Achilles battle-loss servant-package reveal runtime capability.

## Independent execution

On this exact Candidate, `npm ci` and `npm run typecheck` exited 0. B16 focused Vitest passed **8/8**. The eight-file B16/B15/B14/B13/Olga/SOURCE_ACTIVE/combat-outcome/state-transform compatibility run passed **55/55**. Three additional Trigger, Card Zone, and Interaction regression files passed **16/16**. Fresh Chromium Playwright `e2e/fd-achilles-battle-loss-reveal.spec.ts` passed **1/1**. `git diff --check 97fd187... HEAD` passed. These are independent current-Candidate runs, not inherited historical R10 or earlier B13–B15 receipts.

## Semantic and typed Visibility review

The identity-free classifier accepts only the forced `after_controller_loses_battle` trigger with no extra activation, conditions, targets, costs, creates, modifiers, lifecycle, visibility, response, or limit extension and one `reveal_information(servant_package, controller.servant)` effect. It allows bounded canonical loader execution/response metadata. A renamed same-shape ability classifies; wrong trigger, scope, subject, extra condition, activation key, and effect key fail. Malformed same-family candidates reject before legacy `resolveEffect`; the accepted shape executes the typed `reveal_servant_package` primitive. No Achilles/card/ability ID controls dispatch.

The primitive validates the controller, source existence, source ownership/control, and runtime before mutation. It writes only to authoritative `abilityRuntime.revealedServants`; the first reveal emits `servant_package_revealed` with stable resolution provenance. A later reveal returns typed `no_op` with no emitted event. Focused tests verify first-event evidence, same-event replay, already-revealed idempotence, malformed scope/subject rejection, wrong-controller atomic rejection, no-loss behavior, and a losing Achilles who becomes eliminated by scoring but remains eligible through frozen battle participation.

Production result/loss settlement follows base scoring and precedes B15 phase-terminal dispatch; stable phase/battle/result/battlefield facts come from the existing server-owned battle pipeline. The B13 Shinji, B14 shared-victory, B15 terminal Card Zone, and Olga B07 regressions remained green. The B16 in-process fixture preserves deferred runtime authority in its serving process while the browser uses the real room server and server-issued credential; no production auth file changed. Its host is p1 and Achilles is p3, so the test observes another player's projection: Achilles's servant package is hidden before the scored loss and public after it. Reload/reconnect and stale-command rejection preserve the revealed package, revision, and phase-terminal identity. Typed reveal-event count is not exposed in the public projection; focused typed evidence and production re-entry tests establish no duplicate event, while browser evidence establishes externally visible idempotence.

## Gate decision and scope

Gate A, Gate B, and fresh B16 Gate C are satisfied for this exact representative. The base-to-Candidate diff is confined to B16 interpreter classification, B16 focused tests, B16 E2E/support fixture, and implementation report. This verdict accepts only the B16 runtime capability; it does not inherit prior B13/B14/B15 evidence as B16 proof, accept other TO14 consumers, change overlay accounting, create migration/coverage credit, or merge the Candidate. Any A-owned synchronization is separate.
