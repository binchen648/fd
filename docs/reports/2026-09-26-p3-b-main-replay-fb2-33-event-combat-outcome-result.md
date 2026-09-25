# P3-B Current-Main FB2-33 Event Combat Outcome Replay Result

Role: Codex B2
Status: `IMPLEMENTATION_COMPLETE_CANDIDATE`
Date: 2026-09-26

## Exact dispatch input

- Task: `P3-B-MAIN-REPLAY-FB2-33-COMBAT-OUTCOME-CONDITIONS`
- Exact A-sync Base: `471392953e58ab60726cf3a6746481a04ce072ad`
- Historical accepted Candidate: `5ccef0d682ce0673926e349eda1732419fc0792c`
- Historical canonical evidence: `https://github.com/binchen648/fd/pull/377#issuecomment-5743426456`
- Locked Reference: `b2f9fa15fba07c63530bbf4612b03b8b704755f9`
- Current-main formal/material accounting before/after this B Candidate: `112/944`, remaining `832`.

FB2-33 is identity-free capability work and carries zero migration credit.

## Replayed accepted seam

The current-main replay adds only two exact type-only generic condition nodes:

- `{ type: "event_player_won_combat" }`
- `{ type: "event_player_lost_combat" }`

Evaluation is identity-free and read-only over trusted `AbilityEvent.playerId` plus trusted `battleResult`. A known event player matches only the corresponding winners/loserIds list. Missing/unknown event player, missing/malformed battle result, unknown outcome ids, duplicate ids, or winner/loser overlap fail closed to false. Payload-bearing near-matches reject rather than silently broaden semantics.

Loader admission is restricted to top-level ability conditions. Existing runtime condition carriers outside that route, including choice `target.conditions` and `ruleModifiers[].conditions`, are explicitly covered by focused regressions and disable automation for these tokens. No trigger, effect, target, interaction, lifecycle, modifier, event producer, consumer identity, or authoring migration is added.

## Exact scope

Candidate scope is exactly:

- `packages/rules/src/ability/interpreter.ts`
- `packages/rules/src/ability/loader.ts`
- `packages/rules/tests/fb2-33-event-combat-outcome.test.ts`
- this result report

No `data/authoring/**`, generated product, pack/client production, governance policy, Scathach authoring, M50 primitive, identity/name/printed-text/Chinese runtime routing, or SkillLib fallback is changed.

## Verification

Validation was run from an exact scratch snapshot of the A-sync tree, isolated from the protected dirty canonical checkout and fixed Work/Reviewer environments.

- `npm run typecheck`: PASS.
- focused FB2-33: **1 file / 9 tests PASS**.
- affected focused chain FB2-33 + FB2-32 + FB2-42 + FB2-49 + card-source-state + resolution-dataflow: **6 files / 100 tests PASS**.
- `npm run phase3:coverage`: PASS execution; compiled content reports **0 blocking issues**.
- Base-to-Candidate `data/authoring/**` delta: empty; therefore the synchronized material roster is unchanged at **112/944**, remaining **832**, duplicates unchanged.
- final `git diff --check`: PASS.
- exact Base-to-Candidate scope: 4 files only.
- production identity/name/printedText/Chinese/SkillLib routing audit: CLEAN.
