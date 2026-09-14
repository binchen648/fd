# P3-A03 B21 Synchronization — 2026-09-14

- A-owned sync branch: `codex/a-p3-b21-evidence-sync`
- Exact R15 acceptance base: `6e585bdc42223f9915501849a15a69d63f85ac39`
- Accepted B21 candidate: `a160913798d943bf74e6151494384ba946fdfce9`
- B21 handoff base: `29f7263b76884c73697936605cd11d4846dd2509`
- Reviewer verdict: `GATE_A_B_CANDIDATE_ACCEPTED`

## Accepted scope

B21 accepts exactly one additional TO14 direct consumer: Tomoe `sc-tomoe-1.penalty-on-defeat`, structurally routed as the exact identity-free family:

`forced after_controller_loses_battle -> adjust_victory_points(controller,-5) + ignore effect_prevention for this_effect at explicit_exception priority`.

The exception remains narrow to this exact semantic family. It does not promote broad rule-modifier behavior or TO15 Modifier/Power runtime. Same-family malformed shapes fail closed before legacy fallback, while typed settlement records actual VP delta/before/after and unpreventable provenance.

## Fresh A-owned coverage run

`npm.cmd run phase3:coverage` completed successfully from the exact R15 acceptance lineage.

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

Raw Phase 3 coverage therefore remains unchanged. B21 does not receive a synthetic raw-KPI delta because the current reporter does not separately classify this accepted Battle -> Trigger -> Resource/prevention-exception bridge.

The regenerated coverage artifact changed only `generatedAt` and generic static-evidence source line numbers shifted by interpreter insertions. Source fingerprint, counters, compiled identity, classifications, and evidence identities are unchanged, so this non-semantic generated drift is intentionally not committed.

## Scoped TO14 overlay

Before B21 acceptance: `10 / 13` accepted direct consumers.

After B21/R15 acceptance: `11 / 13` accepted direct consumers.

Remaining direct consumers: `2 / 13`:

- Gatou `seeker.battle-end-reward`;
- Olga `trismegistus.loss-transform`.

The broader Battle-integration denominator remains `39 abilities / 28 cards`; neither remaining consumer inherits B21 Gate status.

## Independent evidence carried into A03

R15 fresh verification from the exact B21 candidate recorded:

```text
npm ci                              PASS
npm run typecheck                   PASS
focused/current-lineage             12 files / 109 tests PASS
Chromium B13-B21 final rerun        9 / 9 PASS
full root                           693 PASS / 20 inherited FAIL / 713 total
candidate git diff --check          PASS
representative identity audit       PASS
```

The first reviewer Chromium run saw one transient inherited B15 browser command-send failure; B15 passed immediately in isolation and the complete fresh rerun passed 9/9. No new deterministic failure was identified.

The 20 root failures remain the inherited CHM/original-image evidence absence class. Relative to accepted B20 (`687 PASS / 20 inherited FAIL / 707 total`), B21 adds `+6 PASS / +0 new deterministic failures`.

Independent review confirmed exact identity-free classification, loser/participant provenance, post-scoring ordering, narrow explicit prevention bypass, typed unpreventable VP evidence, authoritative VP floor, stable replay exactly-once behavior, reconnect/stale rejection, and atomic malformed-shape fail-closed behavior.

## Non-promotion

This synchronization does not promote Gatou battle-end reward, Olga loss-transform, broad TO14 behavior, broad TO15 Modifier/Power, TO16 Special, or any A-owned taxonomy/classifier rewrite.

The B21 runtime/reviewer lane is released. The next TO14 implementation requires a fresh A-owned narrow handoff selecting one of the remaining two direct consumers and a new independent reviewer.
