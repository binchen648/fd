# P3-A R102 Astolfo S1 Consumer Migration Dispatch

Role: Codex A
Status: `READY`
Date: 2026-09-22

## Exact baseline

- Exact A FB2-49 acceptance synchronization: `d413c10bb9d631582ac13c57a022fa7056e61391`
- Accepted FB2-49 runtime Candidate: `f0eb754edb7f7840ceb0121e376d88b7fadfd544`
- Fresh R verdict: `IMPLEMENTATION_ACCEPTED_CANDIDATE`
- Canonical R evidence: `https://github.com/binchen648/fd/pull/415#issuecomment-5765967083`
- Formal migration accepted: `151/944`
- Formal remaining: `793`
- Branch-local frozen authoring overlap: `146/944`
- Frozen duplicates: `0`
- Locked Reference: `b2f9fa15fba07c63530bbf4612b03b8b704755f9`

FB2-49 is accepted identity-free infrastructure and earns zero migration credit. This dispatch does not reopen or modify that runtime.

## Exact migration identity

Migrate exactly one frozen consumer:

- canonical id: `servant.astolfo.skill.sc-astolfo-1`
- owner: `servant.astolfo`
- owner name: `阿斯托尔福`
- class: `Rider`
- legacy id: `sc_astolfo_1`
- name: `唤起恐慌之魔笛`
- static metadata: typeLabel/attribute `宝具`, cost `4`, basePower `1`, skill-zone mana requirement `8`
- ability id: `panic-flute-close-to-one`

Frozen source evidence:

- S source Candidate: `b014cada5ae30c489ca384094681cf313aa71c82`
- A source audit: `b258039cc5da519cecee2129a658dd95bdb5524c`
- independent source R: `222a8ea0e2d73d64a1138b3326df20c767f37b01` (`ACCEPTED`)
- printed text: `【真名解放】\n战斗阶段：与你交战的对手关闭其非残留的牌直至只剩一张为止。`
- printed-clause SHA-256: `693e886ed5695721ec10dce30d64b978e45407eba1b81de3c7c5401f8bcb4e67`

Locked Reference independently confirms the identity, owner/class, legacy id, name, card face, cost, base power, requirement and printed text above.

## Fresh whole-card probe

A reconstructed the complete card in memory on the exact synchronized baseline, without adding authoring or production code. The temporary probe was deleted after execution. It verified:

1. authoring identity/static metadata and loader `report=[]`;
2. the compiled ability is admitted by the accepted exact FB2-49 classifier;
3. 7 mana rejects play from skill zone without mutation;
4. 8 mana permits play, pays exact printed cost 4, moves the source to attack area and marks it active/face-up;
5. combat activation from the owned source at the battlefield reveals the servant package;
6. the same-battlefield opponent receives an owner-only, non-cancellable, exactly-one keep decision;
7. resolving the decision leaves the selected card active/open and closes the other qualifying card.

Fresh focused command:

`npx vitest run packages/rules/tests/astolfo-s1-readiness-probe.test.ts packages/rules/tests/fb2-49-opponent-close-to-one-interaction.test.ts packages/rules/tests/fb2-32-source-state-conditions.test.ts packages/rules/tests/match-room-hub.test.ts packages/rules/tests/match-room.test.ts`

Result: 5 files, 57 tests passed. No runtime semantic gap was found. The temporary readiness probe is not part of this Candidate.

Therefore `servant.astolfo.skill.sc-astolfo-1` is mechanically `S_READY_NOW`; no new B2 slice is authorized before this singleton migration completes review.

## Frozen accounting and compatibility

The authoritative frozen inventory remains `943 static + 1 dynamic = 944`. Current material overlap is exactly `146/944`, target count is zero and duplicate frozen ids are zero. Adding only Astolfo S1 must produce exactly `147/944`, with zero removals, zero duplicates and no second frozen identity.

`packages/rules/tests/spartacus-s2-consumer-migration.test.ts` owns a historical repository-wide absolute `overlap.toHaveLength(146)` assertion. Astolfo's authorized exact +1 necessarily makes that assertion stale. S may modify only that accounting block to remove the absolute overlap count while retaining these stable invariants:

- frozen denominator is `944`;
- duplicate frozen ids are empty;
- Spartacus S2 remains authored exactly once.

No Spartacus production data, semantics or other test assertion may change. The new Astolfo focused test must own the exact `146/944 -> 147/944` Candidate accounting.

## S scope

S is authorized only to:

1. add `data/authoring/servants/servant.astolfo.json` with exactly `servant.astolfo.skill.sc-astolfo-1`;
2. encode the complete card using the accepted source/static evidence and existing exact FB2-49 vocabulary;
3. add `packages/rules/tests/astolfo-s1-consumer-migration.test.ts`;
4. make only the Spartacus historical-accounting compatibility edit described above;
5. add one S result report.

S must not modify production runtime, add identity/name/text routing, widen the FB2-49 contract, add another card, register the card in product/generated packs, merge, retarget, or claim formal migration credit.

## Required evidence

The S Candidate must prove exact metadata/source hash, loader and compiled classifier acceptance, the 7/8 mana boundary and cost 4, real play followed by combat activation, true-name reveal, source ownership and battlefield negatives, private per-opponent keep-one settlement, malformed/stale/replay/persistence fail-closed behavior, product/generated non-registration, and exact frozen accounting `146/944 -> 147/944`.

It must also run typecheck, focused suites, official CI, content validation, generated-content determinism, Locked Reference verification, client build, Phase 3 coverage/audit as applicable, `git diff --check`, scope audit and final cleanliness.

Formal migration remains `151/944`, with `793` remaining, until fresh independent R returns `MIGRATION_ACCEPTED` for the exact S Candidate and A synchronizes that verdict.

Long-term S rule: **S 完成 recertification 并提交 Exact Base/Candidate**。
