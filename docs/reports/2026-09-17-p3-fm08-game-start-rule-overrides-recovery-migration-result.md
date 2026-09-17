# P3-FM08 Game-Start Rule Overrides — S Recovery Migration Result

Date: 2026-09-17
Owner: Codex S
Status: `MIGRATION_COMPLETE_CANDIDATE`
Base / fresh FB2-14 A recovery synchronization: `ff2742e51d46ee862071abffe4e23a61652dbdc1`
Accepted FB2-14 recovery runtime: `0831d9fea7c0ffedde634333f27564ea3c1dc65a`
Fresh R39 acceptance report: `45e1cc6ff25fe6da838b8d7fca382d0504275aa7`
F1 evidence: `59f145434695d29bdd17e4cb3adc887e84182377`
Locked Reference provenance: `b2f9fa15fba07c63530bbf4612b03b8b704755f9`
Accepted canonical overlap at dispatch: `101/944`

## Recovery provenance

This candidate is rebuilt from the fresh FB2-14 recovery synchronization. It does not inherit migration acceptance from the invalidated #343-#345 chain.

For reconstruction only, the eight authoring archives and one FM08 regression file were compared byte-for-byte with the old #343 material commit `8d87dfc6fd9032e45b893425c74ede0de9920fff`; all nine blobs match exactly. The old migration report and its acceptance state were not copied. Byte identity is used only to avoid semantic drift while rebuilding the same frozen ten-member material set on the corrected runtime lineage.

## Exact migration set

FM08 materializes exactly these ten frozen identities:

1. `master.bazett.skill.s1b`
2. `master.caules.skill.s1a`
3. `master.fiore.skill.s2`
4. `master.fiore.skill.s3`
5. `master.fiore.skill.s4`
6. `master.irisviel.skill.s1`
7. `master.peperoncino.skill.s1a`
8. `master.sieg.skill.s1`
9. `master.waver.skill.s1`
10. `master.zouken.skill.s5`

`master.leonardo.skill.s1a` and `master.ophelia.skill.s1a` remain excluded. The eight new archives contain exactly ten cards: Fiore contains s2/s3/s4 and each other recovery archive contains one selected identity. No extra card ID is present.

The existing playtest Irisviel archive remains untouched. Canonical F1 `master.irisviel.skill.s1` is isolated in `master.irisviel.fm08.json`, preserving the pre-existing non-F1 playtest material and keeping the generated playtest pack deterministic.

## Frozen evidence / runtime contract

The focused FM08 authoring regression independently checks, for every selected member:

- exact owner/master ID and canonical card ID;
- locked legacy skill ID and passive static metadata (`cost=0`, `basePower=0`, `legacyRequirement=null`, type label `被动`);
- exact frozen source-text SHA-256 recorded in F1 evidence;
- F1 and locked Reference provenance fields;
- blocker-free authoring loader result;
- exact accepted `game_start` RuleOverride classifier only;
- trusted `game_start` installation of the real migrated rule contract.

Fiore s4 is the sole two-effect card and installs exactly the lower-VP total-power adjustment plus the Situation-forbidden Noble Phantasm master-skill power lock. The other nine install one exact whitelisted RuleOverride each.

No production runtime source file is changed by FM08.

## Fresh validation

- `npm.cmd run typecheck`: PASS.
- Focused FM08 authoring + FB2-14 runtime: `2 files / 16 tests PASS` (`5` FM08 + `11` FB2-14).
- Rules regression/core: `66 files / 396 tests PASS`.
- `npm.cmd run content:validate`: PASS, `7 masters / 7 servants / 20 events / 0 blocking issues`.
- `npm.cmd run verify:generated-content`: PASS with unchanged playtest hashes:
  - content `8da51a30935845670dcd88928089730ff4a7a39d9b53b8c8c794189d95509840`;
  - fixture `fb69383fd91ab56bc645633eae72df8b8c10131cccd2713fd57afcf950a5f057`;
  - evidence `b1bb8968097534c796cc6ff5775f3a14cfbbd063aa24e6b94f79a7e81d655cc3`.
- Standard full CI: `120 files / 738 tests PASS`.
- `git diff --check`: PASS.
- Production runtime source diff under `packages/rules/src`: `0` files.

## Material coverage / overlap

A read-only scan of all current `fd-card-authoring-v1` archives against frozen F1 evidence reports:

- frozen denominator: `943 static + 1 dynamic = 944`;
- authoring material: `98 archives / 133 cards / 232 abilities`;
- unique frozen static IDs present: `111`;
- duplicate frozen IDs: `0`;
- each exact FM08 target count: `1`;
- total not-yet-materialized frozen identities: `833/944`.

The base was the accepted `101/944` material baseline and this diff adds exactly the ten authorized IDs with no authoring removals, so candidate material overlap is `111/944`.

This is material coverage only. Strict accepted overlap remains `101/944` until fresh A material synchronization and a fresh independent FM08 migration review both succeed.

## Scope / governance boundary

This candidate changes only eight full-roster authoring archives, one FM08 authoring/runtime-contract regression, and this recovery report. It changes no runtime implementation, coverage taxonomy, KPI logic, Reference checkout, Leonardo/Ophelia authoring, or unrelated content.

Global repository status remains `BASELINE_REBASE_REQUIRED`: this recovery line is still not integrated into current `origin/main`. Even a later local recovery-line migration acceptance must not be described as current-main acceptance until repository integration is resolved.

GitHub reviewer-identity governance also remains unresolved. The next gate must use a fresh process-separated reviewer and must not treat same-account commit authorship or old GitHub PR state as proof of independent reviewer identity.

## Next gate

Codex A must freshly synchronize the exact S candidate and independently recompute exact-ten membership, F1/Reference integrity, material overlap, determinism, scope, and unrelated drift. Accepted overlap must remain `101/944` at A sync. Only a later fresh independent migration review may award local recovery-line `111/944` credit.
