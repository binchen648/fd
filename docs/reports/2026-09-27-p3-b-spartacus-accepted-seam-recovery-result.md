# P3-B Spartacus Accepted-Seam Recovery Result

Role: Codex B
Status: `IMPLEMENTATION_CANDIDATE_READY_FOR_FRESH_R`
Date: 2026-09-27
Task: `P3-B-SPARTACUS-ACCEPTED-SEAM-RECOVERY`
Exact Base: `128089a18341b41b663244f6b8b23088d237f6d8`
Current owner: `servant.spartacus`
Classification: bounded zero-credit recovery/readiness prerequisite

## Why this recovery exists

The current F4 line has already A-synchronized the accepted Skadi owner and mechanically selected `servant.spartacus` next. Full Git-history recovery then found that Spartacus S2 (`servant.spartacus.skill.sc-spartacus-2`) was already formally `MIGRATION_ACCEPTED` on historical PR #414, but the runtime prerequisite line that made that accepted consumer executable is not an ancestor of the current owner-complete line.

The current line therefore must recover the already accepted generic seams before replaying the complete Spartacus owner archive. This task does not migrate or re-credit any frozen identity.

## Historical accepted inputs

### FB2-27 Ruler seal subsystem

- accepted Revision Candidate: `e30e7efef3cf9fc111236599441e5a869f4bc81a`;
- prior rejected Candidate: `f315f2e412399f3aca7971adf7ccd1812437e63f`;
- PR: `#367`;
- acceptance synchronization: `1ef03961` (`P3-A-R58-FB2-27-ACCEPTANCE-SYNC`);
- repository acceptance-sync report: `docs/reports/2026-09-19-p3-a-r58-fb2-27-acceptance-synchronization.md` at commit `1ef03961`;
- verdict recorded by that synchronization: `IMPLEMENTATION_ACCEPTED_CANDIDATE`;
- zero migration credit.

The historical accepted Ruler contract remains grounded in accepted Revision Candidate `e30e7efe`, and the current recovery preserves its default ordered least-bound behavior, issuer-scoped history, issuer-owned single-use seals, movement / movement-lock / free-play+delayed-reward branches, and copy/steal guard. Successor integration is **not** byte-for-byte identical to `e30e7efe`: R1 added one optional explicit eligible-opponent-domain parameter to the least-bound helper APIs plus the focused immunity regression. When that optional domain is omitted, the historical/default active-opponent behavior remains unchanged; the evolved current-runtime interpreter supplies the same immunity-filtered active-opponent domain to both discovery and final ordered settlement so the accepted algorithm is applied consistently rather than redefined.

### FB2-48 combat-opponent-power VP reward

- exact accepted Candidate: `14c8688c201d4d39a85843470be6b79eec01853d`;
- exact dispatch Base: `8177482148c5133ff02b6f0851c5f4402ec414a6`;
- PR: `#413`;
- canonical independent reviewer evidence: `https://github.com/binchen648/fd/pull/413#issuecomment-5754051359`;
- acceptance synchronization: `ff6aeba3` (`P3-A-R100-FB2-48-ACCEPTANCE-SYNC`);
- verdict: `IMPLEMENTATION_ACCEPTED_CANDIDATE`;
- zero migration credit.

The recovered dedicated `packages/rules/src/ability/combat-opponent-power-vp-reward.ts` normalizes exactly to accepted Candidate `14c8688c`. It preserves the accepted bounded transaction: authoritative post-battle frozen participant powers, exactly one opponent selection, controller reward `floor(selected frozen opponent power / 5)`, trusted-root validation, private non-cancellable decision integrity, replay idempotency, and serialized multiple-source staging.

## Current-line integration

The accepted dedicated modules are reconnected to the evolved current runtime through generic integration only:

- loader reservation / exact gateway routing;
- interpreter discovery, staging, settlement, and generic Ruler-seal action handling;
- runtime type/schema state needed for Ruler bindings/history, trusted frozen battle powers, and pending interaction provenance;
- authoritative battle-result producers carry the already accepted frozen participant-power field;
- movement / rule-override / MatchSession paths restore the accepted Ruler movement-lock, free-play, delayed reward, and persisted state behavior;
- focused exports are restored for regression verification.

No `servant.spartacus`, Spartacus card ID/name, printed-text parser, Chinese-text runtime routing, or `SkillLib` fallback is introduced in production rules.

## R1 revision closure

Fresh independent R on predecessor Candidate `4a07140a75600f2128dab17cce264f78beae3ea4` returned `IMPLEMENTATION_NEEDS_REVISION`. Canonical same-attempt Coordinator relay after Reviewer GitHub-write 403: `https://github.com/binchen648/fd/pull/469#issuecomment-5857074164`.

- Sole R1 P1 CLOSED — least-bound discovery and final ordered settlement now use the same current-runtime Ruler eligibility domain after other-player ability immunity is applied.
- The historical accepted least-bound algorithm remains unchanged when no explicit eligibility domain is supplied; current integration passes the exact immunity-filtered active-opponent domain into both candidate discovery and `isLeastBoundSelection()` settlement validation.
- Focused reproduction uses the Reviewer shape `p2=0, p3=1, p4=1` with p2 immune to p1 at the supported same-location opponent boundary. p2 is absent from the pending decision, p3/p4 are the exposed eligible pair, and `[p3,p4]` settles successfully instead of being advertised then rejected.
- No other recovery semantic is changed and no Spartacus consumer authoring is introduced.

## R2 provenance correction

Fresh independent R on successor Candidate `49d940a2536de55a7ed87fc26045557fc0c51358` returned `IMPLEMENTATION_NEEDS_REVISION` only because the report/PR prose still carried the predecessor-era byte-equivalence claim for the Ruler files. Canonical same-attempt Coordinator relay after Reviewer GitHub-write 403: `https://github.com/binchen648/fd/pull/469#issuecomment-5857199684`.

- Sole R2 P1 CLOSED — the stale byte-for-byte claim is removed.
- Accepted Revision `e30e7efe` remains the historical semantic baseline; the current successor preserves its default behavior when no explicit eligibility domain is supplied.
- The only successor-specific Ruler extension is the bounded optional eligible-opponent-domain parameter required to make current-runtime immunity-filtered discovery and final ordered settlement consistent, plus its focused regression.
- This correction changes provenance/evidence text only. Recovery remains zero-credit, `data/authoring/**` remains unchanged, and there is still no Spartacus consumer migration in this task.

## Verification

Focused accepted-seam regressions:

- FB2-27 Ruler seal subsystem: `13/13 PASS`;
- FB2-48 combat-opponent-power VP reward: `10/10 PASS`;
- combined focused: `2 files / 23 tests PASS`.

Affected current-runtime serial chain:

- `packages/rules/tests/fb2-48-combat-opponent-power-vp-reward.test.ts`;
- `packages/rules/tests/regression/fb2-ruler-seal-subsystem.test.ts`;
- `packages/rules/tests/authoring-interpreter.test.ts`;
- `packages/rules/tests/executable-card-pack.test.ts`;
- `packages/rules/tests/match-session.test.ts`;
- `packages/rules/tests/regression/resolution-dataflow.test.ts`;
- `packages/rules/tests/regression/fb2-any-location-except-workshop-movement.test.ts`;
- `packages/rules/tests/core/combat-resolver.test.ts`.

Result: `8 files / 176 tests PASS`.

Static/content gates:

- `npm run typecheck`: PASS;
- `npm run content:validate`: PASS — `7 masters / 12 servants / 20 events / 0 blocking issues`;
- `npm run content:compile`: PASS — same summary;
- `npm run verify:generated-content`: PASS with unchanged hashes:
  - content `b2c446488a28c5036ac36557e09b563b54b11018d5396233a53f37ffdbff6923`;
  - fixture `fb69383fd91ab56bc645633eae72df8b8c10131cccd2713fd57afcf950a5f057`;
  - evidence `f4ae33de4dc2832766064bdf46e277d9559398d4d34b45d7d05a0eb76744cd14`;
- Base-to-worktree `git diff --check`: PASS;
- `data/authoring/**` delta: EMPTY;
- production identity audit over Base-to-worktree `packages/rules/src/**`: `servant.spartacus=0`, `sc-spartacus=0`, `斯巴达克斯=0`, `反叛=0`, `伤兽的咆哮=0`, `不屈的意志=0`, `SkillLib=0`.

## Accounting / continuation

This task is permanently zero-credit. Strict formal accounting remains **`137/944`**, remaining **`807`**.

Historical Spartacus S2 formal credit is preservation-only and is not counted again here or in the later owner-complete replay. After this exact recovery Candidate receives fresh `IMPLEMENTATION_ACCEPTED_CANDIDATE` and A-sync/rescan, execution must return to the same formal owner task `P3-S-OWNER-SPARTACUS-COMPLETE-MIGRATION`.

The later complete Spartacus owner Candidate must contain all three canonical skills together, but its new-credit set is exactly sc-spartacus-1 + sc-spartacus-3. Only a later formal `MIGRATION_ACCEPTED` + A-sync/accounting may move strict accounting from `137/944` to `139/944`.
