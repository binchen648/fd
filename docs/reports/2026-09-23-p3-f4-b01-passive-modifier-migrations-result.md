# P3 F4 B01 Passive / Modifier Migration Batch Result

Date: 2026-09-23
Task: `P3-F4-B01-PASSIVE-MODIFIER-MIGRATION-BATCH`
Role: batch implementation + migration candidate
Branch: `codex/batch-p3-f4-b01-passive-modifier-migrations`
Exact Base: `27cc057893738e0c64a1db0148b9132c9b4429e2` (R115 FB2-54 acceptance synchronization)
Locked Reference: `b2f9fa15fba07c63530bbf4612b03b8b704755f9`

## Batch authorization and scope

This is the first user-authorized F4 BATCH-FIRST throughput candidate. It changes the implementation/review granularity for this batch only; it does not modify the repository collaborator startup prompt, Locked Reference, rule-source priority, exact Base/Candidate review requirement, or the independent-R requirement.

The batch materializes four frozen identities in one candidate while sharing only identity-free bounded runtime helpers:

1. `servant.mechaeli.skill.sc-mechaeli-2` — fresh formal-credit candidate. Uses the exact accepted FB2-54 opponent-entry source +2 / uncontested-win +4 VP routes.
2. `servant.atalanta.skill.sc-atalanta-1` — fresh formal-credit candidate. Adds the exact active-source family that forbids one declared skill definition, adds fixed power to other owner-definition attacks, and adds target printed base Power to their mana cost.
3. `servant.gorgon.skill.sc-gorgon-2` — fresh formal-credit candidate. Adds exact solo-play, active-source defeat-ignore, and trusted >=2-opponent battle-end source-close behavior.
4. `servant.ibaraki.skill.sc-ibaraki-1` — material reconciliation only, **no new formal credit**. The file is the exact accepted blob from PR #381 Candidate `78ab99ce3136f654e53ec922466c26d4751b1917` (blob `cf6564a62032cfc4d9f1d6580005305b96ecfad3`), whose independent `MIGRATION_ACCEPTED` evidence is https://github.com/binchen648/fd/pull/381#issuecomment-5747179411 and whose historical formal accounting was already reconciled through `51f8af150f10a249ba471aaa65d7d7b49cabc98e`.

Darius S3 was explicitly excluded after mechanical evidence confirmed its required `servant.darius.skill.sc-darius-4` support definition remains source-unresolved / explicit-block. No semantic source was synthesized to increase batch size.

## Runtime changes

New `packages/rules/src/ability/batch-passive-card-rules.ts` contains structural, identity-free, fail-closed classifiers and runtime predicates for the exact B01 families. Production runtime contains no Atalanta / Mecha Eli / Gorgon / Ibaraki identity or Chinese-name routing.

The existing loader/interpreter/combat resolver are extended only to:

- admit and execute the exact Atalanta-style owner-definition power/cost/skill-forbid envelope;
- enforce Gorgon-style play-alone atomically;
- suppress normal battle-loss effects for an exact active defeat-ignore source;
- close the exact source only from a trusted battle-result root whose frozen participant set contains the controller plus at least two opponents;
- preserve existing accepted FB2-35 and FB2-54 behavior for Ibaraki and Mecha Eli.

Reserved B01 vocabulary and near-matches fail closed in loader/runtime admission. No generic text parser, identity switch, SkillLib fallback, product/client routing, arbitrary flag engine, or broad target/interaction subsystem was added.

## Historical compatibility

Three historical archive-exclusivity assertions were made additive-safe without weakening their original semantics:

- Atalanta S2 history now requires S2 and S3 exact-once rather than claiming the owner archive can never gain another frozen card.
- FM04 keeps every historical Archer family member exact-once; only Atalanta is allowed to coexist with later accepted/migrated cards.
- FM07 keeps every historical Alter Ego family member exact-once; only Mecha Eli is allowed to coexist with later accepted/migrated cards.

No historical runtime assertion was removed.

## Accounting

Independent frozen-ID recount on the working tree:

- denominator: `944` unique frozen identities;
- exact Base material overlap: `151/944`;
- Candidate material overlap: `155/944`;
- exact material additions: the four B01 identities above;
- duplicate frozen identities: `0`;
- removals: `0`.

Formal project accounting remains `156/944` pending fresh independent review. Ibaraki is already contained in that formal total and must not be credited again. Therefore, if this exact B01 Candidate is accepted and A synchronizes it, the batch may add exactly **three** new formal identities, advancing formal migration to `159/944` with `785` remaining; material overlap stays `155/944`.

## Validation on the pre-Candidate working tree

- `FD_TOOLCHAIN_OK`.
- B01 + affected historical/accepted runtime bundle: **7 files / 58 tests PASS**.
- Additional exact Ibaraki accepted-blob recheck bundle: **3 files / 22 tests PASS** after byte-for-byte alignment to PR #381.
- `npm run typecheck`: PASS.
- `npm run content:validate`: PASS (7 masters / 7 servants / 20 events / 0 blocking issues).
- independent frozen recount: `944` denominator / `155` material overlap / `0` duplicates / all four B01 material identities exact-once.
- production identity/name routing scan across the B01 production delta: no consumer identity/name hits.
- `git diff --check`: PASS.

Per the user-authorized BATCH-FIRST F4 mode, a fixed full-CI/build/coverage/audit bundle is not required before every batch review. Final F4/F5 convergence still requires the repository's full tests / validate / coverage / audit / determinism / build gates repeatedly until green.

## Review requirement

One fresh independent Reviewer must review the whole exact B01 Base-to-Candidate delta. The reviewer must verify all four material identities, the three fresh-credit boundaries, the historical Ibaraki no-double-credit invariant, bounded runtime admission, affected regressions, and exact frozen accounting. The batch must not be split into per-skill reviews merely because it contains multiple consumers.

Allowed verdict: `IMPLEMENTATION_ACCEPTED_CANDIDATE` or `IMPLEMENTATION_NEEDS_REVISION`.
