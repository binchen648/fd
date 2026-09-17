# P3-R37 FB2-13 Alter Ego Transform — Independent Review

Date: 2026-09-16
Owner: Codex R
Verdict: `GATE_A_B_CANDIDATE_ACCEPTED`
Candidate: `18f2733eb0551f368e78a5f67ad9a32b96193d5b`
Candidate base / A handoff: `61d9f0c92e0af7598e237b71fb90ad83c13c88c1`
F1 evidence: `59f145434695d29bdd17e4cb3adc887e84182377`
Locked Reference: `b2f9fa15fba07c63530bbf4612b03b8b704755f9`

## Verdict

R37 independently accepts FB2-13. No blocking finding remains.

The candidate implements the exact identity-free Alter Ego transform contract frozen by A without authoring migration, identity/name/text routing, client-selected transform targets, or broad Trigger/transform promotion.

## Independent static review

Reviewer inspected the exact candidate diff against `61d9f0c92e0af7598e237b71fb90ad83c13c88c1`.

Accepted properties:

- The classifier admits only the frozen regular and EX structural variants and fails closed on near matches.
- Target provenance is bound to the trusted current `on_card_played` event and the authoritative physical card instance; the client never supplies the transformed card id.
- Physical-card transform state is explicit (`reversed` / `attributeOverrides`) and has a shared effective-attribute resolver rather than mutating printed definitions.
- Effective attributes are consumed by subsequent attribute constraints/event checks and combat tags, so the transform is not write-only.
- Regular settlement reuses the existing close-source primitive.
- EX reuses the accepted fixed-controller-mana path for exactly 3 mana, keeps the source active, and records once-per-round use only after successful settlement.
- Attribute selection is staged through a server-owned pending interaction, then revalidates source/event/target/variant/revision/candidates before mutation.
- Transform state is cleared across typed movement/close, legacy move-to-skill/close, MatchSession round cleanup/attachment return, and direct combat removal.
- No second card-zone, scoring, or generic client transform authority was introduced.

Scope audit:

- future FM07 exact IDs in `packages/rules/src`: `0`;
- future FM07 names / printed-text routing in `packages/rules/src`: `0`;
- `data/authoring` changes: `0`;
- `data/phase3` changes: `0`;
- `git diff --check` on the candidate range: PASS.

## Independent dynamic verification

R37 used a fresh reviewer worktree and a fresh offline dependency install.

- `npm.cmd ci --offline --ignore-scripts`: PASS, 0 vulnerabilities.
- `npm.cmd run typecheck`: PASS.
- focused/high-risk compatibility set: `10 files / 101 tests PASS`.
- rules regression + core: `65 files / 385 tests PASS`.
- `npm.cmd run content:validate`: `7 masters, 7 servants, 20 events, 0 blocking issues`.
- `npm.cmd run verify:generated-content`: PASS with unchanged hashes:
  - content `8da51a30935845670dcd88928089730ff4a7a39d9b53b8c8c794189d95509840`
  - fixture `fb69383fd91ab56bc645633eae72df8b8c10131cccd2713fd57afcf950a5f057`
  - evidence `b1bb8968097534c796cc6ff5775f3a14cfbbd063aa24e6b94f79a7e81d655cc3`
- standard `npm.cmd run test:ci`: `119 files / 727 tests PASS`.
- fresh `npm.cmd run phase3:coverage`:
  - archives `80`
  - cards `113`
  - abilities `212`
  - `newRuntimeSemanticRouted=22`
  - `legacyExecuteAbility=3`
  - `legacyResolveEffect=127`
  - `dualRuntime=0`
  - `notClassifiable=60`
  - `taxonomyWarnings=124`
  - compiled definition hash `37551fd5f5b0a968f9143dee0698adf8582a0a26d8edabef55907cf78d374333`
  - blocking issues `0`.

Fresh coverage artifact differs from the accepted baseline only by `generatedAt` and static source line offsets caused by candidate edits. It is intentionally not part of the reviewer commit.

## Independent FM07 family reconciliation

R37 recomputed the future migration family from the locked Reference and frozen F1 evidence rather than accepting the A/B2 list by assertion.

- Reference `alterEgoSkillIds`: exactly `9` regular identities.
- `master.sion.skill.s12`: separate structured override using the same `core.alter-ego-transform` handler, fixed ability cost 3 and `alterEgoCloseSource: false`.
- Combined Reference handler family: exactly `10` identities.
- Frozen F1 presence: `10 / 10`.
- Current canonical authoring presence: `0 / 10`.
- Regular nine share source-text SHA `b6c74ac37a50b671ded913dbc6ae6736f2057904fe4c02924d79f84971cebbdf`.
- Sion EX has distinct source-text SHA `43c84de7cf6532ee6b561d8cfa35ddbdeac52850f6105684b23a82121636a892`.
- No eleventh still-absent F1 identity belongs to this locked Reference handler family.

Exact future FM07 identities therefore remain:

1. `servant.douman.skill.sc-douman-3`
2. `servant.koyanskaya.skill.sc-koyanskaya-1`
3. `servant.mechaeli.skill.sc-mechaeli-3`
4. `servant.meltryllis.skill.sc-meltryllis-3`
5. `servant.muramasa.skill.sc-muramasa-3`
6. `servant.okita-alt.skill.sc-okita-alt-1`
7. `servant.passionlip.skill.sc-passionlip-1`
8. `servant.sitonai.skill.sc-sitonai-3`
9. `servant.taisui.skill.sc-taisui-1`
10. `master.sion.skill.s12`

## Gate consequence

FB2-13 is reviewer-accepted. A may synchronize this evidence and unblock P3-FM07 for exactly the ten identities above. No migration credit is taken by this review itself.
