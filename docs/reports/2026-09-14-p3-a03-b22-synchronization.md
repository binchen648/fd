# P3-A03 B22 Synchronization — 2026-09-14

- A-owned sync branch: `codex/a-p3-b22-evidence-sync`
- Exact R16 acceptance base: `53177e68435f8de6866aa61d2d80b70b4e26a81a`
- Accepted B22 candidate: `134c61e3f0acd6fd5e28bcbb9557cbb45244ed93`
- B22 handoff base: `ac2d0a8af05eb6461c45a564f623b03807cb9a34`
- Reviewer verdict: `GATE_A_B_CANDIDATE_ACCEPTED`

## Accepted scope

B22 accepts exactly one additional TO14 direct consumer: Gatou `seeker.battle-end-reward`, structurally routed as the exact identity-free phase-terminal family:

`forced after_battle_ended -> count unique other players currently colocated with controller who authoritatively moved into that location this round -> +1 per player; reward VP if controller won at that battlefield, otherwise mana`.

The route uses frozen battle-phase participant/outcome provenance and settles only at the post-scoring phase terminal. Normal and authored effect movement share authoritative movement provenance. Deployment-only placement, stale prior-round movement, controller self movement, duplicate movement rows, and players who have since moved away do not inflate the count. Same-family malformed shapes fail closed atomically before legacy fallback.

## Fresh A-owned coverage run

`npm.cmd run phase3:coverage` completed successfully from the exact R16 acceptance lineage.

```text
archives=14
cards=46
abilities=92
compiledCards=70
compiledCharacters=14
blockingIssues=0
definitionHash=37551fd5f5b0a968f9143dee0698adf8582a0a26d8edabef55907cf78d374333
newRuntimeSemanticRouted=12
legacyExecuteAbility=3
legacyResolveEffect=49
dualRuntime=0
pilotAllowlist=0
notClassifiable=28
taxonomyWarnings=79
```

Raw Phase 3 coverage therefore remains unchanged. B22 does not receive a synthetic raw-KPI delta because the current reporter does not separately classify this accepted Battle phase-terminal Trigger -> Resource bridge.

The regenerated coverage artifact changed only `generatedAt` and generic static-evidence source line numbers shifted by the B22 interpreter/session insertions. Source fingerprint, counters, compiled identity, classifications, and evidence identities are unchanged, so this non-semantic generated drift is intentionally not committed.

## Scoped TO14 overlay

Before B22 acceptance: `11 / 13` accepted direct consumers.

After B22/R16 acceptance: `12 / 13` accepted direct consumers.

Remaining direct consumers: `1 / 13`:

- Olga `trismegistus.loss-transform`.

The broader Battle-integration denominator remains `39 abilities / 28 cards`; Olga does not inherit B22 Gate status.

## Independent evidence carried into A03

R16 fresh verification from the exact B22 candidate recorded:

```text
npm ci                              PASS
npm run typecheck                   PASS
focused/current-lineage             13 files / 117 tests PASS
B22 focused                         8 / 8 PASS
Chromium B13-B22 final rerun        10 / 10 PASS
reviewer full root                  700 PASS / 21 FAIL / 721 total
candidate pre-submit full root      701 PASS / 20 inherited FAIL / 721 total
candidate git diff --check          PASS
production identity audit           PASS
authored effect-movement probe      PASS
```

Twenty root failures remain the inherited CHM/original-image evidence absence class. The one extra reviewer full-suite failure was the existing eleven-round MatchSession smoke test exceeding its 5-second timeout only under parallel suite load; R16 reran that test three consecutive times in isolation at approximately `2.07-2.13s`, all PASS, matching the implementation lane's separate 3/3 isolated verification. R16 therefore identified no new deterministic production failure.

Relative to accepted B21 (`693 PASS / 20 inherited FAIL / 713 total`), B22 adds `+8 PASS / +0 new deterministic failures` on the deterministic candidate baseline.

Independent review confirmed exact identity-free classification, frozen participant provenance, phase-wide post-scoring ordering, normal/effect movement provenance, stale/deployment/moved-away exclusion, per-player dedupe, shared-winner VP branch, typed actual resource deltas, mana-cap behavior, stable replay exactly-once semantics, reconnect preservation, stale-revision rejection, and atomic malformed-shape fail-closed behavior.

## Non-promotion

This synchronization does not promote Olga loss-transform, broad TO14 behavior, broad TO15 Modifier/Power, TO16 Special, or any A-owned taxonomy/classifier rewrite.

The B22 runtime/reviewer lane is released. TO14 now has one remaining direct consumer, Olga `trismegistus.loss-transform`; its implementation requires a fresh A-owned narrow handoff and a new independent reviewer.
