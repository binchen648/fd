# A-RECOVER-04 result

Base462bb82730eb29ca5cf90b0a89f3e1cdd6189c1a. Current reviewed source1d17b3f54b3e1eb2686e5d767e6a86c8f8d3f946 (prior7b frozen and superseded). IMPLEMENTATION_COMPLETE_CANDIDATE; final-head complete CI and explicit user merge consent pending.

## Actual gap and implementation

Existing reconnect/HTTP restore needed live memory. Production entry now uses a private AES-GCM authenticated/encrypted file and sibling server key; trusted room persistence contexts survive process loss without entering network snapshots. Room/session restore, legal projection and revision rules remain existing paths. Optional hub trustedContexts is a local server boundary, not accepted from HTTP. Every successful HTTP/WS room/game operation saves before success/broadcast. Atomic flushed temporary replacement preserves the last committed file; disk errors latch failure, reject later mutations and return unhealthy503. Pending HTTP body readers recheck the failure latch before any mutation. Single writer PID lock plus exclusive stale-recovery guard prevents concurrent reapers deleting replacement locks. Old connections reset offline at startup.

Client reconnect retries with bounded backoff, waits for authenticated fresh projection before sending, ignores events from obsolete sockets and does not buffer/replay mutations. Intentional close or policy1008 stops retry. Existing App invalid-revision test now supplies a ready projection and retains all invalid cases plus a preprojection rejection.

## Evidence

External directory D:/fd-validation/a-recover-04-evidence-20261031 preserves initial setup failures, actual RED (new server loses seven-person room, corrupt input ignored, client never reconnects), intermediate failures, fixed tests and browser evidence. Producer full client9files/60PASS, server3files/23PASS (including existing full11round HTTP/WS game), typecheck/buildPASS. New recovery browser naturally1PASS13.7sec: seven real pages, production entry killed with SIGKILL and restarted as freshPID/sameport, no page reload, identical private card/legal-action views, successful UI operation before and after. Reviewer independently4server+2clientPASS and ten2-process lock races exactlyonewriter; inspected browser source/log, did not rerun browser. Early independent twoP1 findings were fixed and verified before freezing candidate.

Original root/client CI commands retained; add full server suite as an additional gate, no skips or existing timeout changes. No interpreter/loader/authoring/generated content changes or migration credit. PR687 main Test/Build/Policy/Deploy succeeded before its explicit release record; old worktrees preserved. CB-C02 remains suspended and B read-only.

## Boundaries

This validates a default production seven-seat restart/reconnect slice, not all capability-specific restore cases, complete roster acceptance, distributed HA or disk-loss recovery. Private state and key must be retained on a persistent volume. Windows rename durability across power loss relies on filesystem; POSIX file+directory flush used. A crash leaving the exclusive recovery guard fails closed for operator review; never delete a live writer lock. UI presentation refinements and stale on-screen outage notices are later product work; unsent commands are dropped and never replayed. Final integration SHA must pass original+client+server CI and receive explicit user approval before merge.

## R1 revision supersedes initial bounded candidate

The original complete durable11round witness (full-durable-match-2.log) exceeded its unchanged5sec WS wait at round7battle, with no server protocol error. It was not PASS and not attributed to environment. Prior source7b/integration726/full-CI pass are preserved but do not certify whole-game durability. Same round7battle profile: default snapshot serialization2652ms, JSON463ms,total save3809ms,disk182378004bytes,high memory.

New source1d17b3f54b3e1eb2686e5d767e6a86c8f8d3f946 borrows only replay history for immediate synchronous encoding while default public snapshots still copy. It recomputes every original digest/seal and keeps all replay entries. AES-GCM v2 compresses before encrypting, binds v2AAD, still reads authentic v1 files and upgrades on next confirmed write. Byte-identical sealed JSON/default-copy isolation and actual independent-built v1 restore/upgrade tests pass. Same-state save1939.9ms/disk24486560bytes; no original timeout increased.

Independent R1 bounded review5store+1byte-equivalence testsPASS, verdictLIMITED_TECHNICAL_PASS. Real7page productionkill/restart browserR1 naturally1PASS14.2sec. Full durable11round witness rerun bound to1d remainsRUNNING at assembly; finalHEADCI and user approval remain required. A first R1 probe was intentionally cancelled to correct its old hardcoded SHA label; logs retained separately, not counted as product failure or PASS. Final measured witness and integration receipts are external producer-receipts/final-ci-receipt/final-result files, not inferred from old evidence.
