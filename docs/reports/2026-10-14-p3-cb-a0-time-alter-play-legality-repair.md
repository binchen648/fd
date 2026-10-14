# Time Alter Scoped Play Legality Repair

- Task: P3-CB-A0-TIME-ALTER-PLAY-LEGALITY-REPAIR.
- Control Epoch: FD-P3-2026-09-23-09.
- Base: a42b5e1c517141b90f3407773958b0d8afe63264.
- Tested implementation: 8fba9c457de11f849353b5ad84c6165bfa4493b8.
- Authority: b52d09178737465525f09457b5145c40fbb097ee; ruling a1328bead4d653991f7b52817686e24e882d50b4, blob 5865aa653f614da29361b777569cb8a0f44d0c2f.
- Status: VALIDATION_BLOCKED. No independent acceptance, credit or promotion.

## Runtime Delta

The shared attack-category predicate now agrees with the executable classifier
about master_deck_card. The structurally owned face-down PLAY target projection
calls the same side-effect-free play-failure predicate as final effect play.
The target still must satisfy controller/owner/hand scope, requirements and
prohibitions; skill cards gain no face-down exception. Runtime code has no new
card or ability identity literal. The existing authoring target shape is not
used alone as proof of legality: the full final-play predicate is applied.

Only interpreter.ts changes in production. Compiler, loader, card JSON and
generated files are unchanged. No new typed authoring constraint is required.
The prior exact semantic route and typed result/event contract remain in use.

## Production Evidence

The new regression creates a seven-human MatchSession from the real pack.
It progresses preparation priority, executes real magus-killer.setup and target
replacement, then uses a normal-hand Time Alter play to draw that same instance.
Public priority passes and runFullMatch advance to round two. The second use
plays Origin Bullet face-down and draws one: source stays skill, target enters
attack_area inactive, no mana is paid, and one deck card enters hand.
There is no direct positive-fixture rewrite of phase, card identity, zone,
mana, usage counters or deck order.

The browser spec launches a separate production server with tsx. Its pre-browser
fixture uses real room create/select/start and the same public Session progression.
Browser activation and target choice run through WS, server, typed resolution
and projection. Pending reload, post-settlement reload, stale choose replay,
unchanged view and observer privacy are checked. This is not a claim that setup
and the first round were performed through browser buttons. HTTP restore is not used.

## Negative Matrix

The 14 new tests cover fabricated servant/master skills in hand, wrong owner,
controller, zone, moved card, empty selection, selecting the ability source,
stale decision, wrong phase, newly introduced play prohibition, corrupt pending
target reference and corrupt draw. Failures compare complete GameState,
including cards, pending, events and revision. Corrupt pending graph returns
resolution_failed after typed ownership; a failed draw rolls back the play prefix.

Successful resolution exposes typed effect_resolved result IDs. The setup
replacement remains on its existing legacy path; no other legacy consumer is migrated.

## Verification And Blockers

- Final focused: 8 files / 216 tests PASS, including 98 executable-pack and 38 authoring-interpreter tests.
- Browser repeat: 5/5 PASS.
- Typecheck, content validation (0 blocking) and generated determinism: PASS.
- First default CI: 193/196 files and 1640/1643 tests PASS; exit 1.
- Final default CI: 195/196 files and 1642/1643 tests PASS; exit 1, B11 source binding only.
- Isolated diagnosis: historical-preflight tests 22/22 PASS; additional-play 7/8 PASS.

The adjacent additional-play regression intentionally expected an illegal
append-only-only candidate to be offered and rejected later. Under this task's
legal-projection contract it is no longer offered. After the user authorized
this single additional test path, only its projection and mutation-free forged
activation expectations were updated. Its eight tests pass. The supplement is
recorded separately in the manifest; it is not claimed to exist in pinned b52d0917.
The B11 current-source binding also rejects the changed rules source rather
than inheriting historical evidence. Its automation owner must decide the new
binding; this slice does not rewrite evidence classification or counters.
The default CI historical-preflight test timed out at its unchanged 5000ms limit;
the isolated full file and the final default CI passed it without timeout overrides.
Default CI is not green because the B11 binding still rejects source drift.

Startup invoked the old Phase 3 preflight and got MALFORMED_INPUT. The assigned
standalone Historical Failure Preflight was then correctly executed via
its exported API using the eight task-metadata fields from the published manifest.
It returned CHECKED (historical extraction only), not runtime acceptance.
The authorized scope supplement was checked again with its updated exact task metadata.
The late correct invocation does not count as pre-implementation HFG success.

Raw command receipts, exit codes, tested SHAs, stream hashes and embedded bytes
are in artifacts/phase3-cb-a0-time-alter-play-legality-repair.json. Failed browser
attempts are retained as well as the passing repeat. The heavy-test window was
first released at 2026-10-14T18:45:47.4838154+08:00, then resumed for the user-authorized
test supplement at 2026-10-14T18:50:16.8778465+08:00. The packet records final release;
no test sessions remain running.

Fresh RB review, A/RA binding, a green default CI and promotion are not verified.
Credit delta remains zero. All unrelated families and the dirty historical
D:/f49-26 worktree remain untouched.
