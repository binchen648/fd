# DR-P01 M1 Reconstruction implementation

DR-P01 now implements a complete ordinary action turn against M1 `7724bff0d849e13e5b6725c5b05f76dc6c03bce4`: each player moves once or explicitly skips, then completes the simultaneous regular play batch before ending the turn. Legal phase abilities remain available before/between/after. Seven action turns enter seven battle decisions, followed by the existing settlement path exactly once.

Owner: Feature Delivery Lead /root/dr_p01_delivery_lead. Planner grant: `f674c00a065878f2fd454ed3820d87d322058114`. Control parent: `b181c4987ce7710d6bebacc68bed45576f45d11e`. Branch: `codex/dr-p01-m1-integration-20261030`. This implementation uses the existing interpreter, movement executor, Session and protocol.

## Scope and provenance

9 production source +19 test/support paths from the literal reservation. No loader, historical governance, old reservation metadata, A0 whole-branch merge or CB-C02 patch is included. Old candidate2c502562 is a read-only technical reference. Minimum A0 legality handles real master deck attacks and revalidates face-down effect targets; its natural OriginBullet tests remain technical tests, without inheriting old governance or acceptance.

The required-additional-play fixture now proves that an append-only hand cannot activate an impossible TimeAlter effect: legal actions omit it, forced activation rejects atomically, and the target remains in hand. Existing append-only batch and accounting assertions remain.

## Implemented behavior

- Authoritative movement costs1/2/2, one final destination, capacity/engagement/current restriction checks, one regular quota independent of effect movement.
- Mandatory simultaneous ordinary batches, remaining-hand inclusion, pre-batch8mana skill gate, aggregate payment and battlefield face-up constraints. Only the exact all-hand-effect-forbidden fallback reveals the hand.
- Signed versioned action progress and explicit safe legacy-restore policy; stale/replayed/illegal commands reject without GameState/rule-event/revision mutation.
- Private staging and hidden event identity/modifiers stay private until legal reveal; client controls consume backend legalActions. Public current power reuses a pure existing combat derivation.
- Battle completion barrier survives signed durable restore and postscore windows; scoring/cleanup are not reopened.

## Actual validation

M1 baseline install/typecheck succeeded. Before production changes, the real Session test failed because skip_normal_move was absent (1 actual failure/24 filtered). Raw RED log remains external.

|Check|Actual result|
|---|---|
|Typecheck|exit0|
|Affected rules|14 files144/144, including action25 and OriginBullet14|
|Server/WS|17/17|
|Relevant client|6 files43/43|
|Client production build|exit0|
|Real browser|2/2: seven human seats, move/skip+batch/reconnect; naturally replaced/drawn OriginBullet+TimeAlter/stale|

Browser used this worktree on strict port3198 with reuseExistingServer:false and separate dynamic backend fixtures. Default test30s/expect10s are unchanged; the existing action test's own120s limit remains. Service cwd/head/pid attachments, raw logs, exactargv, command exits, source hashes and results are in `D:/fd-validation/dr-p01-m1-evidence-20261030`.

These scoped runs used the implementation bytes under the control parent and are bound to all28 literal source/test hashes in artifacts/dr-p01-m1-validation.json. The later frozen commit's exact SHA will be recorded externally; no later-commit execution is fabricated.

## Remaining gates

Independent technical verification and the original full CI script against the final candidate are pending. No full client all-green, old-CI inheritance, promotion, coverage/migration credit, release readiness or whole-game acceptance is claimed. Original30-path prestart audit is preserved.
