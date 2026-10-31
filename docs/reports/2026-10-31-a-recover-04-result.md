# A-RECOVER-04 result

Base462bb82730eb29ca5cf90b0a89f3e1cdd6189c1a. Reviewed source7b8f62e96e876a846388730f215ed55f68ee2027. IMPLEMENTATION_COMPLETE_CANDIDATE; final-head complete CI and explicit user merge consent pending.

## Actual gap and implementation

Existing reconnect/HTTP restore needed live memory. Production entry now uses a private AES-GCM authenticated/encrypted file and sibling server key; trusted room persistence contexts survive process loss without entering network snapshots. Room/session restore, legal projection and revision rules remain existing paths. Optional hub trustedContexts is a local server boundary, not accepted from HTTP. Every successful HTTP/WS room/game operation saves before success/broadcast. Atomic flushed temporary replacement preserves the last committed file; disk errors latch failure, reject later mutations and return unhealthy503. Pending HTTP body readers recheck the failure latch before any mutation. Single writer PID lock plus exclusive stale-recovery guard prevents concurrent reapers deleting replacement locks. Old connections reset offline at startup.

Client reconnect retries with bounded backoff, waits for authenticated fresh projection before sending, ignores events from obsolete sockets and does not buffer/replay mutations. Intentional close or policy1008 stops retry. Existing App invalid-revision test now supplies a ready projection and retains all invalid cases plus a preprojection rejection.

## Evidence

External directory D:/fd-validation/a-recover-04-evidence-20261031 preserves initial setup failures, actual RED (new server loses seven-person room, corrupt input ignored, client never reconnects), intermediate failures, fixed tests and browser evidence. Producer full client9files/60PASS, server3files/23PASS (including existing full11round HTTP/WS game), typecheck/buildPASS. New recovery browser naturally1PASS13.7sec: seven real pages, production entry killed with SIGKILL and restarted as freshPID/sameport, no page reload, identical private card/legal-action views, successful UI operation before and after. Reviewer independently4server+2clientPASS and ten2-process lock races exactlyonewriter; inspected browser source/log, did not rerun browser. Early independent twoP1 findings were fixed and verified before freezing candidate.

Original root/client CI commands retained; add full server suite as an additional gate, no skips or existing timeout changes. No interpreter/loader/authoring/generated content changes or migration credit. PR687 main Test/Build/Policy/Deploy succeeded before its explicit release record; old worktrees preserved. CB-C02 remains suspended and B read-only.

## Boundaries

This validates a default production seven-seat restart/reconnect slice, not all capability-specific restore cases, complete roster acceptance, distributed HA or disk-loss recovery. Private state and key must be retained on a persistent volume. Windows rename durability across power loss relies on filesystem; POSIX file+directory flush used. A crash leaving the exclusive recovery guard fails closed for operator review; never delete a live writer lock. UI presentation refinements and stale on-screen outage notices are later product work; unsent commands are dropped and never replayed. Final integration SHA must pass original+client+server CI and receive explicit user approval before merge.
