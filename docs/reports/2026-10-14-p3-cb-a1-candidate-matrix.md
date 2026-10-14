# P3-CB-A1-CANDIDATE-MATRIX

Date: 2026-10-14
Role: Planner / Process Controller
Scope: candidate selection only
Status: BLOCKED_WITH_REASON

Latest Planner disposition: CONTENT_BLOCKED / DEFERRED_CAPABILITY_CANDIDATE, recorded in docs/agents/P3-CB-A1-FORTIFICATION-DISPOSITION.md. A1 eligibility now requires complete production identity, full contract, production runtime and applicable lifecycle/event proof. The backup is not automatically promoted to READY.

## PREPARE disposition, 2026-10-14

Exact A PREPARE carrier `96788cb775c400aa3a2a8d5b1bfeb8f440772014` confirms `WHOLE_FORTIFICATION_PRODUCTION_CONTRACT_NOT_CLOSED`. The two selected archives do not satisfy the production loader's three-skill and 12-card-deck requirements. Their printed residual clause has no structural residual marker, while round cleanup checks `ability.kind === 'residual'`. Historical tests manually activate the source and do not prove real cross-round retention.

Planner independently checked these constraints against main `a42b5e1c517141b90f3407773958b0d8afe63264`, including Final Rules 11.3/11.5. This is a statically established semantic mismatch, not a fresh gameplay failure or Reviewer verdict. The recommended candidate exits ordinary A1 until whole-contract closure; no registry-only implementation is authorized. The original selection below remains historical reasoning, superseded by this disposition wherever it implies ordinary A1 eligibility.

Next task: `docs/agents/P3-CB-A1-FORTIFICATION-CONTRACT-CLOSURE.md`. A PREPARE delivery is complete; final evidence acceptance is not inferred. The backup still needs independent production admission verification and is not automatically activated.

## Exact evidence boundary

- Remote main, checked with `git ls-remote origin refs/heads/main`: `a42b5e1c517141b90f3407773958b0d8afe63264`.
- Published control identity: `FD-P3-2026-09-23-09`; no new Epoch is created.
- Selection checkout: Planner branch at `b52d09178737465525f09457b5145c40fbb097ee`.
- Candidate authoring archives, pack manifest, candidate tests, Outer-God-Life module and accepted-111 matrix match main. The Planner checkout has other runtime differences; current-main route existence was separately checked through `git show <main>:<path>` rather than inferred from that checkout.
- A0 runtime candidate: `3ec55814b8aca84416fca46dfaf7032a7f115094`; RB review: `fb487f1397b02663bac1ab065864aa484830c390`.
- A0 evidence carrier: `5b7f08ee047c671f08625283c7112736b063067a`; RA review: `5f7b3ef796891c0db9e9a4e335e1802bee62e97c`.
- A0 has scoped runtime/evidence PASS. Its promotion remains pending; its route changes cannot be treated as current-main dependencies.
- Accounting baseline: 111/944. Potential additions below are absent from the accepted-111 matrix, not already-earned credit.

## Selection

| Rank | Candidate | Exact identities | Potential main additions | Disposition |
|---|---|---|---|---|
| Recommended | A1-TERRITORY-PAIR | Gilles s2; Medea s2 | At most 2 | Existing-contract candidate; production admission and current contract provenance require verification |
| Backup | A1-OUTER-GOD-LIFE-FOUR | Abigail sc4; Clytie sc4; Hokusai sc4; Voyager sc4 | At most 4 | Existing-contract candidate; production owner binding and terminal return require verification |

Neither candidate is IMPLEMENT_READY. Both already have authoring in main; the useful incremental outcome would be production registration/execution and independently accepted identity evidence, rather than recreating authoring files. If admission requires initialization, authority or MatchSession expansion, the candidate fails the requested A1 boundary.

## Recommended: A1-TERRITORY-PAIR

1. **Capability:** Territory Creation, one complete two-clause card contract.
2. **Contract:** round power `16 - 2 * game.round_number`, plus residual controller deployment to Magic Workshop yielding +1 mana and +2 VP; ordinary skill play retains the canonical mana threshold. Authoring cites P3-R33/FB2-11, P3-R19/FB2-02 and P3-R34/FM05. Historical R50 records acceptance on the recovery lineage, not fresh current-main acceptance.
3. **Exact identities:** `servant.gilles.skill.sc-gilles-2`; `servant.medea.skill.sc-medea-2`.
4. **Potential identities:** 2. Both are absent from accepted-111 and current generated content. Other already-counted Territory Creation identities are controls only.
5. **Existing primitives/routes:** trusted `game.round_number` formula; `isDeploymentResourceRewardSemantic`; typed `adjust_mana` and `adjust_victory_points`; existing deployment event processing.
6. **Runtime delta:** no new primitive has been demonstrated necessary. Existing real-definition tests use manually seeded state and directly delivered events. Source-active residual eligibility, event delivery and ordinary production play must be verified. A missing residual guard would require a separately bounded enabler; no generic Trigger/Lifecycle expansion is included.
7. **Expected files:** `data/authoring/servants/servant.gilles.json`, `servant.medea.json` as existing inputs; proposed content admission through an approved pack/registry path; generated content through its generator; `packages/rules/tests/fm05-territory-variant-extension.test.ts`; scoped production integration tests and evidence. Exact admission/output paths are not yet approved.
8. **Hot-file risk:** LOW if registration and tests suffice; HIGH if `interpreter.ts`, `loader.ts` or `resolution-dataflow.ts` need semantic changes. `match-session.ts` expansion disqualifies the selected batch. No writer reservation granted.
9. **Required tests:** both real definitions compile and register; real play obeys mana threshold; rounds 1/4/7/8 produce 14/8/2/0; controller deployment yields exactly +1/+2; wrong location, other player and ordinary movement yield no reward; inactive/closed source does not reward; duplicate event does not reward twice; malformed input is atomic; no legacy fallback; production projection and source identity remain correct. Existing suites: `fm05-territory-variant-extension.test.ts`, `fb2-deployment-resource-reward.test.ts`, `fb2-round-number-formula.test.ts`. Presence is verified; no fresh execution claimed this round.
10. **Owner:** A for bounded eligibility/provenance selection evidence; existing B/S Lead Builder for admission and identity tests only after exact scope/reservation; B Runtime Owner only if one explicit missing contract is established; RB for semantics, A/RA for evidence, existing G/I for eventual promotion.
11. **Review complexity:** MEDIUM, rising to HIGH if residual eligibility needs runtime correction. Two identities share identical complete source text and authoring shape, making one contract review with per-identity execution evidence feasible.

**Reason for the Trigger/Lifecycle exception:** this is reuse of one specific deployment event and existing residual semantics with identical consumers. It is not an open-ended gateway project. The exception remains conditional on proving existing behavior; a new event owner or lifecycle engine is outside A1.

**Evidence:**

- `data/authoring/servants/servant.gilles.json`, `servant.medea.json`.
- `packages/rules/tests/fm05-territory-variant-extension.test.ts`: real definitions, source hashes, formula and deployment tests; state/event construction is synthetic.
- `docs/reports/2026-09-18-p3-a-r50-fm05-territory-variant-extension-acceptance-synchronization.md`: historical candidate `7f83a0cfba2cd7f781ab0c0491c9ed2607db02d6`; explicitly distinguishes recovery-line credit from main.

## Backup: A1-OUTER-GOD-LIFE-FOUR

1. **Capability:** Outer-God-Life relational +6 power with return to source servant owner's discard.
2. **Contract:** combat action on an active source; controller and source servant owner each gain +6, deduplicating equal recipients; ordinary source returns at authoritative battle terminal. Existing structural contract: P3-R67/FB2-29. Its historical review is a dependency to verify, not inherited final acceptance.
3. **Exact identities:** `servant.abigail.skill.sc-abigail-4`; `servant.clytie.skill.sc-clytie-4`; `servant.hokusai.skill.sc-hokusai-4`; `servant.voyager.skill.sc-voyager-4`.
4. **Potential identities:** 4, all absent from accepted-111 and generated registry. Molay is excluded from this batch because its distinct return wording needs separate semantic treatment.
5. **Existing primitives/routes:** `isOuterGodLifeAbilitySemantic`, `applyOuterGodLifeUse`, `adjust_round_total_power`, `schedule_source_card_return`, `settlePendingSourceCardReturns` in `packages/rules/src/ability/outer-god-life.ts`, wired into current-main interpreter.
6. **Runtime delta:** zero intended; production `ownerId` propagation is unproven by current migration tests, which explicitly assign it after loading. If the normal compiler loses that metadata, one generic metadata-propagation enabler could unlock all four, but that defect and its exact delta are not yet established. Do not modify battle resolution or MatchSession to force eligibility.
7. **Expected files:** four existing servant authoring archives; approved pack/registry and generated output paths; `packages/rules/tests/outer-god-life-consumer-migration.test.ts`, `packages/rules/tests/regression/fb2-outer-god-life-subsystem.test.ts`; production integration tests/evidence. Possible compiler/executable metadata file only if a concrete propagation defect is confirmed and separately authorized.
8. **Hot-file risk:** MEDIUM for content/metadata admission; HIGH for compiler/interpreter involvement. Any authority or terminal-owner redesign disqualifies this batch. No writer reservation granted.
9. **Required tests:** real compiler output supplies owner without test patching; each identity enters approved production registry; own/other controller rewards, same-recipient deduplication, missing/multiple/eliminated owner rejection; inactive/hidden/stale source rejection; terminal provenance and exact return recipient; malformed shape is atomic with no fallback; no double return on replay; real production command and projection. Existing tests are evidence of coverage structure, not fresh PASS this round.
10. **Owner:** A for admission and provenance evidence; B/S Lead Builder for approved content/identity work; B compiler owner if a generic metadata defect is confirmed; RB for relational/terminal semantics, A/RA for evidence, existing G/I for promotion.
11. **Review complexity:** HIGH, because owner/controller relationships and terminal return have more negative cases than Territory Creation.

**Reason for the Battle/Lifecycle exception:** reuse an existing narrow terminal-return contract and module. No winner calculation, battle-result envelope extension or new cleanup policy is included. Any need for such changes moves the candidate out of A1.

**Evidence:**

- `packages/rules/src/ability/outer-god-life.ts`.
- `packages/rules/tests/outer-god-life-consumer-migration.test.ts`: five real archived definitions, explicit owner assignment and explicit assertions that pack/generated exclude them.
- `docs/reports/2026-09-19-p3-a-r68-outer-god-life-consumer-migration-acceptance-synchronization.md`: historical five-consumer candidate `748bbd1c648e138149fe46c1d4c44ffd06ee769f`; recovery-line accounting is not current-main credit.

## Rejected shortcuts

| Candidate | Reason |
|---|---|
| Time Alter plus Billy/Okita | Different face, repeat, cost and limit contracts. A0's one identity cannot establish a multi-identity batch by text similarity. |
| Existing Mount Summon cohort | Checked identities are already within accepted-111; missing registry entries cannot be counted as new migration identities. |
| Gatou/Olga direct mana controls | Existing sub-ability controls are not two newly migrated complete identities. |
| Iliya/Taiga initial mana | Initialization admission excluded by the requested boundary. |
| Ruler seals | Authority changes excluded. |

## Activation conditions and recommendation

Select Territory Creation first because it has two exact complete identities, existing authoring, current route components and real-definition tests. Retain the four Outer-God-Life identities as backup with higher relational and lifecycle risk.

Before implementation, a single bounded eligibility packet must establish: current-main contract provenance; legal production definition/owner admission without changing initialization; full-contract source eligibility; exact production/test/output files; existing reservation compatibility. Historical Failure Preflight should be included in that packet, not introduce an additional approval loop.

If admission is legal and no runtime delta is required, the candidate can become an existing-contract A1 admission/conformance batch. If exactly one generic defect unlocks the identities, document that delta for a Priority-2 enabler decision and independent RB review. If multiple contracts or MatchSession/initialization changes are needed, reject the candidate rather than silently broadening it.

No production changes, reservation, task dispatch, PR, new Epoch, acceptance or credit are authorized by this selection report. Final state: A1_SELECTION_COMPLETE_IMPLEMENTATION_NOT_AUTHORIZED.
