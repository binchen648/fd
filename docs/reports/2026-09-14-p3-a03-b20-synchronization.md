# P3-A03 B20 Synchronization — 2026-09-14

- A-owned sync branch: `codex/a-p3-b20-evidence-sync`
- Exact R14 acceptance base: `f48b6b45eab26096cfdfd2889801aad7e91bf1f0`
- Accepted B20 candidate: `bd2a350e3fd1d006d8692e770b4ad8eb24e5aeea`
- B20 handoff base: `80d3299af4ac51a350a32d64524691a822e92177`
- Reviewer verdict: `GATE_A_B_CANDIDATE_ACCEPTED`

## Accepted scope

B20 accepts exactly the three remaining structurally identical Artoria Caster `unique-passive-luck-on-win` TO14 direct consumers as one identity-free runtime family:

`optional controller-win trigger -> unique-group response -> move source hand->removed_from_game -> create one reward in controller deck -> shuffle controller deck`.

The production classifier is independent of representative ability/card/character identity, unique-group ID value, and reward-card ID value. Malformed same-family shapes fail closed before legacy fallback. Settlement emits typed `source_card_removed_from_game`, `card_created`, and `deck_shuffled` evidence and remains exactly-once under stable replay/reconnect/stale-revision paths.

## Fresh A-owned coverage run

`npm.cmd run phase3:coverage` completed successfully from the exact R14 acceptance lineage.

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

Raw Phase 3 coverage therefore remains unchanged. B20 does not receive a synthetic raw-KPI delta because the current reporter does not separately classify this accepted Battle -> Trigger -> Card Zone/Create/Shuffle bridge.

The regenerated coverage artifact changed only `generatedAt` and generic static-evidence source line numbers shifted by the interpreter insertion. Source fingerprint, counters, compiled identity, classifications, and evidence identities were unchanged, so the non-semantic generated drift was restored and is not committed.

## Scoped TO14 overlay

Before B20 acceptance: `7 / 13` accepted direct consumers.

After B20/R14 acceptance: `10 / 13` accepted direct consumers.

Remaining direct consumers: `3 / 13`:

- Gatou `seeker.battle-end-reward`;
- Tomoe `sc-tomoe-1.penalty-on-defeat`;
- Olga `trismegistus.loss-transform`.

The broader Battle-integration denominator remains `39 abilities / 28 cards`; none of the remaining three inherits B20 Gate status.

## Independent evidence carried into A03

R14 fresh verification from the exact B20 candidate recorded:

```text
npm ci                              PASS
npm run typecheck                   PASS
focused/current-lineage             11 files / 103 tests PASS
Chromium B13-B20 compatibility      8 / 8 PASS
full root                           687 PASS / 20 inherited FAIL / 707 total
candidate git diff --check          PASS
representative identity audit       PASS
```

The 20 root failures remain the inherited CHM/original-image evidence absence class. Relative to accepted B19 (`677 PASS / 20 inherited FAIL / 697 total`), B20 adds `+10 PASS / +0 new deterministic failures`.

## Non-promotion

This synchronization does not promote Gatou battle-end reward, Tomoe defeat penalty, Olga loss-transform, broad TO14 behavior, TO15 Modifier/Power, TO16 Special, or any A-owned taxonomy/classifier rewrite.

The B20 runtime/reviewer lane is released. The next narrow handoff must select one of the remaining three direct consumers and obtain a fresh independent reviewer before the scoped overlay can advance again.
