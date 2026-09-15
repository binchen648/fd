# P3-A FB2-12 Synchronization and FM06 Dispatch

Date: 2026-09-16
Role: Codex A
Status: `SYNCHRONIZED`
R35: `ee3367b1ea17e6db9d98b1ae42d769fae6122d5e`
FB2-12 candidate: `4c97449de07b1e7a859d8ef43b60e34069541830`
A handoff: `f1bd75e958753ca48d8d08a9a37bb8901abbeadc`
F1 evidence: `59f145434695d29bdd17e4cb3adc887e84182377`
Reference: `b2f9fa15fba07c63530bbf4612b03b8b704755f9`

## Fresh A recertification

- typecheck: PASS;
- FB2-12 focused regression: `10/10 PASS`;
- content validation: `7 masters / 7 servants / 20 events / 0 blocking issues`;
- deterministic generated-content hashes unchanged:
  - content `8da51a30935845670dcd88928089730ff4a7a39d9b53b8c8c794189d95509840`;
  - fixture `fb69383fd91ab56bc645633eae72df8b8c10131cccd2713fd57afcf950a5f057`;
  - evidence `b1bb8968097534c796cc6ff5775f3a14cfbbd063aa24e6b94f79a7e81d655cc3`;
- fresh coverage remains archives `69`, cards `101`, abilities `200`;
- raw routing remains `new=22 / legacyExecute=3 / legacyResolve=127 / dual=0 / notClassifiable=48 / taxonomyWarnings=124`;
- compiled definition hash remains `37551fd5f5b0a968f9143dee0698adf8582a0a26d8edabef55907cf78d374333` with 70 cards / 14 characters / 0 blocking issues.

The regenerated coverage artifact differs only by `generatedAt` plus static `packages/rules/src/ability/interpreter.ts` source-line offsets introduced by the accepted runtime implementation. No KPI, routing, identity, compiled product, or source fingerprint changed. The artifact remains intentionally uncommitted.

## Accepted runtime boundary

R35 independently accepted exactly the FB2-12 identity-free contract:

- trusted server-owned frozen Power snapshot after Power calculation and before winner/scoring;
- optional active face-up response only for a participating controller in a 3+ player battle;
- strict-second eligibility from the frozen snapshot;
- all highest-Power opponents derived automatically, including ties, with no target selection;
- once per round consumed only on use; decline does not consume;
- responder sequencing through existing turn order;
- Basic Luck defeat-ignore authority preserved per target;
- successfully defeated highest targets excluded only from that battle's winner eligibility;
- winner/tie/margin/VP/military are rebuilt by the same BattleResult builder and scored by the same existing scorer;
- stale/inconsistent snapshot fails closed;
- battle-local pending defeat state is consumed and cannot leak to later battlefields.

This does not accept broad Trigger, broad defeat, generic target selection, global defeated/elimination state, generic battle-result rewriting, identity/text routing, or Sion EX.

## Frozen-F1 reconciliation

Current accepted canonical-authoring overlap remains `79/944`; runtime acceptance alone does not add migration credit.

The exact FM06 family is the following `12/12`, all currently absent from canonical authoring:

- `servant.corday.skill.sc-corday-1`
- `servant.danzou.skill.sc-danzou-3`
- `servant.hassan.skill.sc-hassan-1`
- `servant.hassanhf.skill.sc-hassanhf-3`
- `servant.hassanser.skill.sc-hassanser-1`
- `servant.izou.skill.sc-izou-3`
- `servant.jekyll.skill.sc-jekyll-3`
- `servant.kama.skill.sc-kama-3`
- `servant.kiritsugu.skill.sc-kiritsugu-1`
- `servant.kotarou.skill.sc-kotarou-1`
- `servant.semiramis.skill.sc-semiramis-1`
- `servant.stheno.skill.sc-stheno-1`

All twelve preserve frozen full-text SHA:

`29b3f6c71d8bc5eb6f004d930e5b753f44ee766fb2e47ea6b9f0d89f5fa9643f`

and the same four F1 inventory clause-source SHAs, in printed order:

- `ee2d737d979d2141319a55ff72d275847a90be89e5173c3f5030e2083d4dc4cb`
- `1e518f04fe63700d7a456ca83de546eb681dd9993f483be7598e5bdac7830b25`
- `0484d7c0b9f4cef66623fdfe67831240d883b04f3203f2acc7e2d6151c2a8217`
- `1f105508aace520b9a8b6703d50633c174f754856c10c4040b05570cfca0b871`

Reference handler is uniformly `core.presence-concealment`. Locked static metadata is uniform for the selected skill cards: Swift type, cost 3, historical requirement 3, base Power 4. Owner class remains source-defined; Kiritsugu remains Reference class Master, while the other selected owners are Assassin. Historical requirement 3 is evidence metadata only; final canonical skill-zone use follows the established 8-mana rule.

## FM06 dispatch

P3-FM06 is READY at exact batch size 12.

S must migrate only the twelve IDs above into minimal canonical authoring archives, preserving frozen text/evidence and locked Reference metadata. It must use only the accepted FB2-12 structural response shape and must not modify runtime. Sion EX and all unrelated Assassin/special-handler rows are excluded.

Canonical overlap may become `91/944` only after the twelve migrations are materialized, synchronized, and independently migration-accepted; this A dispatch records no such credit yet.
