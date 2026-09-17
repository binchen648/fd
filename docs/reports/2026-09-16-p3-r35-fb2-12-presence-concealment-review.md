# P3-R35 FB2-12 Presence Concealment Review - 2026-09-16

Role: Codex R
Verdict: `GATE_A_B_CANDIDATE_ACCEPTED`
Reviewed candidate: `4c97449de07b1e7a859d8ef43b60e34069541830`
A handoff: `f1bd75e958753ca48d8d08a9a37bb8901abbeadc`
Accepted FM05 baseline: `0470cc2f7b8124fb1247695a13bcb34e80b26703`
F1 evidence: `59f145434695d29bdd17e4cb3adc887e84182377`
Reference metadata: `b2f9fa15fba07c63530bbf4612b03b8b704755f9`

## Findings

No blocking finding.

## Independent static reconciliation

R35 reviewed the exact B2 candidate from a fresh reviewer worktree and independently reconciled the future migration family rather than relying on the implementation report:

- exact future Presence Concealment family: `12/12`;
- current canonical authoring membership before FM06: `0/12`;
- frozen F1 denominator: `944`;
- accepted canonical-authoring overlap remains `79/944`;
- all twelve rows preserve full-text SHA `29b3f6c71d8bc5eb6f004d930e5b753f44ee766fb2e47ea6b9f0d89f5fa9643f`;
- all twelve preserve the four inventory clause-source SHAs in printed order:
  - `ee2d737d979d2141319a55ff72d275847a90be89e5173c3f5030e2083d4dc4cb`;
  - `1e518f04fe63700d7a456ca83de546eb681dd9993f483be7598e5bdac7830b25`;
  - `0484d7c0b9f4cef66623fdfe67831240d883b04f3203f2acc7e2d6151c2a8217`;
  - `1f105508aace520b9a8b6703d50633c174f754856c10c4040b05570cfca0b871`;
- production identity / printed-text routing hits in the candidate diff: `0`;
- authoring/F1 mutation in the candidate: `0`;
- broad post-result rewrite API: `0`;
- `git diff --check`: PASS.

Sion's Presence Concealment EX remains outside the family. Owner metadata remains source-defined; Kiritsugu remains Reference class `Master`, while the other selected owners are Assassin.

## Contract review

R35 independently confirmed that FB2-12 is limited to one trusted pre-scoring response contract:

1. Power is frozen into a server-owned participant snapshot before response collection;
2. the response is offered only during combat, only from an active face-up source, and only to a participating controller;
3. eligibility requires at least three participants and exact strict-second Power: controller Power is below the highest tier and no non-highest opponent is above the controller;
4. all highest-Power opponents are derived from the trusted snapshot; there is no client target selection;
5. the response is optional; decline removes only that window and does not consume the per-round use;
6. successful resolution consumes the ordinary `per_round / this_card / 1` usage authority;
7. eligible responders are ordered through the existing priority-seat turn-order response machinery;
8. defeat-ignore authority is reused for Basic Luck; ignored highest targets remain eligible winners;
9. applied defeat targets are excluded only for this battle and the existing BattleResult builder recomputes winner, tie, margin, VP adjustments and military adjustments from the frozen breakdowns;
10. scoring continues through the existing scoring resolver; no second scoring path is introduced;
11. the battle-local pending marker is consumed after settlement and cannot leak to a later battlefield;
12. a changed or inconsistent authoritative Power snapshot fails closed instead of silently settling from different Power facts.

The implementation does not add global defeated/elimination state, broad Trigger acceptance, generic battle-result mutation, character-name routing, printed-text parsing, or authoring migration.

## Independent dynamic evidence

R35 ran all required validation from the fresh reviewer worktree:

- typecheck: PASS;
- FB2-12 focused regression: `10/10 PASS`;
- rules regression/core: `64 files / 378 tests PASS`;
- content validation: `7 masters / 7 servants / 20 events / 0 blocking issues`;
- deterministic generated-content hashes unchanged:
  - content `8da51a30935845670dcd88928089730ff4a7a39d9b53b8c8c794189d95509840`;
  - fixture `fb69383fd91ab56bc645633eae72df8b8c10131cccd2713fd57afcf950a5f057`;
  - evidence `b1bb8968097534c796cc6ff5775f3a14cfbbd063aa24e6b94f79a7e81d655cc3`;
- standard full CI: `118 files / 720 tests PASS`.

Focused evidence covers the frozen `[5,10,10]` strict-second case, decline, tied-highest all-target defeat, Basic Luck ignore, two-participant/non-second/highest negatives, equal strict-second peers, existing-scoring reuse, multi-responder turn order/deduplication, authoritative-snapshot fail-closed behavior, and marker cleanup across battlefields.

## Coverage integrity

Fresh reviewer coverage remains runtime-only and materially unchanged:

- archives `69`;
- cards `101`;
- abilities `200`;
- raw `new=22 / legacyExecute=3 / legacyResolve=127 / dual=0 / notClassifiable=48 / taxonomyWarnings=124`;
- compiled definition hash `37551fd5f5b0a968f9143dee0698adf8582a0a26d8edabef55907cf78d374333`;
- compiled cards `70`, characters `14`, blocking issues `0`.

The regenerated reviewer artifact differs only by `generatedAt` plus static interpreter source-line offsets caused by the runtime insertion. That artifact is intentionally left unstaged.

## Gate judgment

`GATE_A_B_CANDIDATE_ACCEPTED`.

This acceptance is limited to the exact identity-free Presence Concealment post-Power/pre-scoring response semantic described by FB2-12. It is sufficient for A synchronization and then the exact twelve-member FM06 migration batch, but it does not promote broad Trigger, generic defeat, generic target selection, broad battle rewriting, or Sion EX semantics.
