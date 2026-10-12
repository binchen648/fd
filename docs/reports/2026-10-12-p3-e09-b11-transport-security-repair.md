# B11 Transport Security Repair

Task: `P3-E09-B11-TRANSPORT-SECURITY-REPAIR`.
State: `IMPLEMENTATION_COMPLETE_CANDIDATE`.
Readiness: `FAIL_GLOBAL_VALIDATION_AND_INDEPENDENT_REVIEWS_PENDING`.
Current tested implementation: `d9d8a6a480710afba20ee7371ecdedb09de77de1`. The final candidate is the exact commit containing this packet, reported externally in the final handoff to avoid inventing a self-referential SHA. The final evidence commit changes no source/test blobs. The previous candidate `865c27b9446e591c5e9be9956d50ca5375f825de` was FAILED for unauthenticated room replacement; its tests do not grant current acceptance.

Fresh browser/default-CI combination tested carrier: `88dcd441a17584b4a2a6d1ba78e588ac6a818ed1`, independently checked to have the same source/config Git objects as the focused implementation. Fresh final RB composition and RA evidence review are pending. The user-reported RB room-ID PASS is narrow; RA PASS bound to `865c27b9` is historical only.

## Authority And Source

- Base: `463facb109cc4d19c4fda7af936fb4546fb86091`.
- Branch: `codex/b-p3-e09-b11-transport-security-repair`.
- Worktree: `C:/Users/chenshang/.config/superpowers/worktrees/fd/b-p3-e09-b11-transport-security-repair`.
- Dispatch: `e247a9a2c07c83652234c42e95f1d74548f1a6a3`.
- Reservation acknowledgement: `53eda909e3d5551b51bc892551b560779131fea3`, `docs/agents/manifests/reservations/P3-E09-B11-TRANSPORT-SECURITY-REPAIR.json`.
- Five-path compatibility extension: `2806e25c74337ff9cc5fb088cee4dd7b8674440f`, `docs/agents/P3-E09-B11-COMPATIBILITY-AND-VALIDATION.md`.

B accepts the prospective session-authority/server-transport reservation, including its five-path extension. No concrete competing modifications are known. This is not an enforced filesystem mutex or a claim of cross-chat acknowledgements. Reservation remains active until Planner release/transfer.

The machine packet `artifacts/phase3-e09-b11-transport-security-repair.json` binds each of the 13 changed source/test blobs, SHA-256 and the complete unified source diff. The two additional candidate files are this report and the packet. The packet records the current diff hash and preserves the previous batch under `historicalValidationBatch` without rebinding old receipts to new source.

## Scoped Implementation

Credentials use browser-compatible Web Crypto with 256 random bits and private per-room storage. Public client DTOs and all viewer projections omit credentials. Creation/new-identity HTTP responses issue only that identity's credential. Duplicate identity joins reject rather than changing name, role or connection state. Genuine authenticated WS reconnect reuses the private credential.

Persisted clients retain credentials only in trusted snapshots. Old deterministic, malformed and duplicate tokens are rejected explicitly; old reconnect sessions must be recreated. There is no identity-only recovery or predictable-token compatibility alias. HTTP restore requires current host proof and preserves matching host identity/credential. HTTP create cannot replace an existing room. Sockets authenticate from private state and are bound to their original room object, preventing restored/replaced room identity inheritance.

Dispatch and end-turn share one required nonnegative safe-integer revision check. Missing, invalid and stale values reject before session mutation. Version increments and accepted mutation broadcasts occur only on success. Existing upgrade-registration, replacement-close and simultaneous final-disconnect tests remain intact.

Compatibility changes are limited to local private reconnect, required frontend revision, trusted fixture-process credential issuance and authenticated snapshot-helper requests. Interpreter, compiler, card authoring, resolution semantics, coverage, workflows and test timeout/concurrency settings are unchanged.

## Previous Focused Verification (Not Current Source)

Sequential executions on 2026-10-12, 12:26:09-12:26:41 Asia/Shanghai:

- `npm run typecheck`: exit 0.
- `npx tsc --noEmit -p apps/client/tsconfig.json`: exit 0.
- MatchRoom / Hub focused tests: 16/16, exit 0.
- Server suite: 15/15, exit 0.
- Client App focused tests: 7/7, exit 0.
- `git diff --check`: exit 0.

Raw combined command outputs, UTC timestamps, exit codes and source bindings are retained in the packet. These preliminary outputs are not split stdout/stderr receipts for the pending heavy batch. Earlier setup/verification is not silently promoted into final evidence: first rule-test collection failed because the fresh worktree had no content build output; initial typecheck identified nullable runtime references in the new test helper, which were corrected before the recorded fresh run. Earlier `npm ci` reported 12 dependency vulnerabilities; dependency changes are outside this repair.

HTTP/WS negatives cover RB duplicate-host credential retrieval and deterministic guess, cross-room/wrong-client authentication, unauthorized restore, and missing/invalid/stale dispatch/end-turn revisions. They compare complete room snapshots, GameState/pending/resources/events/logs, room version and projections. Positive tests retain private player views, Golden Eater pending reconnect and fresh end-turn. Both viewers' WS broadcasts are asserted credential-free with no cross-view private cards.

## Historical Authorized Heavy Batch And Release

The user confirmed no other active Worker or heavy-test owner and explicitly authorized the immediate sequential batch. This is direct user authority, not fabricated other-worker ACKs. Host: `cyb`. Actual window: 2026-10-12 12:41:40.4290634 through 12:45:50.0420745 Asia/Shanghai. Window is explicitly `RELEASED`; the source reservation remains active pending Planner release/transfer.

Startup checks found 168,387,993,600 free bytes on C and 53,487,718,400 on D; 3000/8787 were free. The only existing Node processes were a non-FD Vite development service on 5173. Before each batch command, the external receipt collector rechecked Node processes for competing vitest/playwright/tsc/npm-test/typecheck/build/ci activity. No competition was detected; no process was killed and no other Worker was started. FD test servers exited and 3000/8787 were free at release.

Exact sequential commands and outcomes, all against `ea5e630b...`:

1. `npm ci`: exit 0; 12 dependency vulnerabilities disclosed, no dependency edits.
2. `npm run typecheck`: exit 0.
3. `npx tsc --noEmit -p apps/client/tsconfig.json`: exit 0.
4. Room/Hub, B11 dataflow/bridge/binding/classification and interaction/resource room regressions: 8 files / 71 tests, exit 0.
5. Server suite: 15/15, exit 0.
6. Client full suite: 49 pass / 1 fail, exit 1. The unchanged asset inventory assertion expects 14 IDs but the current directory contains 127 archives.
7. Conversion Magic, Golden Eater and remote-sync Chromium Playwright, repeat-each=5: 15/15, exit 0. Existing timeout/concurrency/configuration unchanged. Conversion and Golden start at trusted server-process fixtures, not natural room progression.
8. Default `npm run test:ci`: 189 pass / 4 failed files of 193; 1489 pass / 1 failed / 45 skipped tests of 1535, exit 1. No extra timeout or concurrency flags; the base's existing package.json already supplies `--maxWorkers=2`.

The packet embeds all 16 raw stdout/stderr streams byte-for-byte as base64, with original SHA-256/length, exact command/cwd/source SHA, UTC start/end, exit and process observations. Local originals and receipt metadata remain under `D:/fd-validation/e09-transport-security-receipts`. Display truncation does not affect the embedded raw evidence. The external collector's code hash is also bound; it is not a production source change.

Default CI failures are preserved: `phase3-contract-parity.test.ts` rejects the new packages tree against its historical exact candidate; `phase3-e08-b11-coverage-sync.test.ts`, `phase3-readiness-preflight.test.ts` and `phase3-e06-post-merge-recount.test.ts` reject App.test.tsx against the old continuation path table. Those automation/source-binding files are unchanged and predate the new Planner extension. A owns new frozen-source evidence after this candidate exists; B did not rewrite historical receipts, add waivers or weaken checks.

## Remaining Conditions

### Creation Boundary Review Repair

The empty-string HTTP counterexample was reproduced before editing production code: HTTP returned 201 instead of 400; the new direct Hub negative also failed because creation did not throw. These observed red runs are recorded descriptively, not fabricated as separately captured raw stdout/stderr receipts.

The shared `resolveMatchRoomId` resolves defaults only for an omitted ID, rejects null/non-string/blank IDs and preserves other explicit IDs. Both Hub and MatchRoom use it. HTTP forwards supplied roomId unchanged instead of combining nullish duplicate checking with truthy creation. Hub rejects an already existing resolved ID before construction, scope rotation, trust revocation, credential generation, room replacement or version updates. No replacement/create compatibility escape hatch was added.

Fresh focused verification against `d9d8a6a...`: typecheck exit 0; 9 rule files / 123 tests exit 0 (including FB2-49 persistence/trust); server 16/16 exit 0; diff-check exit 0. Direct Hub and real HTTP cases cover omitted/default duplicate, empty, whitespace-only, null, number, object and array IDs. They assert original room/session identity, full snapshot and credentials, persistence scope, version and projection unchanged. Hub also checks the global scope binding and that trust revocation is never called. The older fresh-lifecycle scope test now uses a separate new Hub, retaining its provenance rejection while respecting the prohibition on overwriting a live room.

Three focused command receipts/six raw streams bind `d9d8a6a` under `roomIdFocusedReceipts`. The eight old receipts/sixteen streams remain immutable inside the historical batch. At the room-ID checkpoint, no new browser/full-CI run had been performed. The follow-up combination executions below are now bound to `88dcd441`; no old acceptance is inherited. Reviewer must fresh-review the final exact candidate.

### Fresh Current-Source Combination Batch

The user explicitly assigned browser combination and default full CI on the new source. Actual bounded window on host `cyb`: 2026-10-12 16:09:48.3547284 through 16:17:36.9740612 Asia/Shanghai, now RELEASED. Initial free bytes: C=168105304064, D=53355061248. No competing heavy process was found; only the existing non-FD Vite service on 5173 remained. Ports 3000/8787 were free before and after the run. This records the new execution instruction and process observations without fabricating fresh cross-chat acknowledgements.

Sequential executions against exact `88dcd441`:

- Chromium Conversion Magic, Golden Eater and remote-sync with repeat-each=5: exit 0, 15/15. Each scenario passed 5/5. Conversion and Golden retain trusted server-process fixture starting boundaries; remote-sync performs real HTTP create/join/select/start.
- Original `npm run test:ci`: exit 1; 189/193 files passed, 4 failed; 1490 tests passed, 1 failed, 45 skipped of 1536. No timeout/concurrency settings were changed or new flags supplied.

The four fresh failing files are `phase3-contract-parity.test.ts` (historical packages source mismatch), `phase3-e08-b11-coverage-sync.test.ts`, `phase3-readiness-preflight.test.ts` and `phase3-e06-post-merge-recount.test.ts` (historical continuation table rejects App.test.tsx). Complete stdout/stderr bytes, SHA-256, commands, times and exits are embedded in the packet's current two receipts/four streams; source/config equivalence is explicitly pinned. Raw files are `12-current-combination-browser.*` and `13-current-combination-default-ci.*` in the local receipt directory. Failures were not weakened, waived or repaired in A-owned code.

Only packet/report change after this batch. Runtime/source/test/configuration objects remain identical to the tested carrier. The final frozen SHA is reported externally. Browser success and local room-ID review do not grant final security/composition acceptance. Readiness remains FAIL pending the retained validation blockers and fresh exact-candidate RB/RA reviews; no main/Phase/Gate/credit/promotion is granted.

Global client/full CI are not green. Fresh RB security/composition review and RA evidence review are pending; no prior narrow PASS is inherited. Local Node v24.13.1 does not establish GitHub Node20 equivalence. Deployment/TLS and snapshot-at-rest protection are not verified. Unrelated offline/legacy snapshot E2Es are not migrated and cannot bypass current HTTP host proof. Historical evidence, governance/authority gaps and Release blockers remain unchanged. No role-level PR, self-PASS, credit or Gate is granted; `111/944` and `93 MISSING_IMAGE` remain unchanged.
