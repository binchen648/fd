# P3 FM03 MHX Saber Magic Resistance Extension Result

Date: 2026-09-18
Role: Codex S
Status: `MIGRATION_COMPLETE_CANDIDATE`
Base / A dispatch: `362c799c9c3b92a1e2af3f1e4597d5cfcba532ac`
Accepted recovery overlap at dispatch: `117/944`
F1 evidence: `59f145434695d29bdd17e4cb3adc887e84182377`
Locked Reference: `b2f9fa15fba07c63530bbf4612b03b8b704755f9`
Accepted contracts: P3-R12/B18, P3-R13/B19, P3-R29/FB2-10, P3-R30/FM03

## Exact migration set

This Candidate materializes exactly one frozen identity:

- `servant.mhx.skill.sc-mhx-3` / 对魔力（Saber Class）.

No MHX s1/s2 or any other frozen identity is added.

## Source and family grounding

Authoritative F1 preserves the complete printed source but classifies this row as a `SPECIAL_HANDLER_CANDIDATE`. S did not treat that classification label as migration authority. Instead, the A dispatch independently reconciled the complete source family, and S rechecked the same exact evidence before authoring.

MHX s3 source hashes are:

- full printed text SHA-256: `8a6da48db16868ce5d5766fa7ff05c00b2c392f715106f869cb59aaabee65ffc`;
- clause 1: `1cef15482dd584d9d18b4e9016476b7bffb31cb0331efd38b4025a26611c84c2`;
- clause 2: `f0631437ce658c07be75426fc0394d6f32c6fafc10805bcb359ff17d4de97f85`;
- clause 3: `bd7530459d6ccd00217d1192b06509e322d48bafd44f037c383470ecbba55229`.

The full text and all three clause hashes are byte-identical to accepted FM03 family members such as Altera. Locked Reference independently records the same shared handler family `core.saber-magic-resistance` and the MHX static shape:

- owner `servant.mhx` / 谜之女主角X;
- servant class `Assassin`;
- legacy id `sc_mhx_3`;
- type `特殊`;
- cost `3`;
- base Power `3`;
- historical requirement `3`.

The historical requirement is retained only as metadata. As in accepted FM03, Final Rules 9.4 provides the canonical skill-zone Mana threshold `8`.

## Authoring shape

The Candidate adds one standalone `servant_skill_card_archive`:

`data/authoring/servants/servant.mhx.json`

It contains only `servant.mhx.skill.sc-mhx-3` and preserves the exact MHX identity/source/static metadata while reusing the already accepted FM03 three-ability decomposition:

1. Noble Bloom base optional battle-result response: highest-cost Noble Phantasm predicate -> controller `+1 VP`;
2. Noble Bloom threshold response: same predicate plus highest-cost NP cost `>=4` -> independent controller `+1 VP`;
3. Magic Resistance combat action: while active, set same-battlefield engaged opponents' Magic attack Power to `0` for this round.

The production loader reports zero blockers. The normalized MHX abilities satisfy the accepted B18/B19/FB2-10 classifiers, and after removing only identity-specific ability ids their structures are identical to accepted Altera FM03 abilities.

No production runtime source is changed and no identity/name/text-specific route is introduced.

## Runtime proof

The focused Candidate regression uses the real authoring archive through the production loader and proves:

- Magic Resistance exposes through the accepted combat route;
- same-battlefield opponent Magic Power changes `5 -> 0`;
- same-battlefield opponent Force remains `4`;
- controller Magic remains `5`;
- remote opponent Magic remains `5`;
- Noble Bloom exposes two independent responses and changes controller VP `4 -> 6` through two typed `+1` adjustments;
- the playtest pack manifest contains no MHX archive.

Focused new + FM03 + FB2-10 + B18/B19 compatibility is **5 files / 26 tests PASS**.

## Product isolation

Candidate adds no `data/packs/**` or `data/generated/**` diff. Fresh validation remains:

- playable masters `7`;
- playable servants `7`;
- events `20`;
- blocking issues `0`;
- compiled cards `73`;
- compiled characters `14`.

Generated product hashes remain unchanged:

- content library `03582e22b830c59ccfe03379159dd5e50aef19fd7bae3561469c000e56618a79`;
- fixture `fb69383fd91ab56bc645633eae72df8b8c10131cccd2713fd57afcf950a5f057`;
- evidence report `b1bb8968097534c796cc6ff5775f3a14cfbbd063aa24e6b94f79a7e81d655cc3`.

A production `packages/rules/src/**` scan for MHX id/name/skill/Reference-handler strings returns zero identity-specific matches.

## Fresh validation

- `npm ci --offline`: PASS — 239 packages, 0 vulnerabilities.
- repository typecheck: PASS.
- focused MHX/FM03/FB2-10/B18/B19: **5 files / 26 tests PASS**.
- content validate: PASS — `7 masters / 7 servants / 20 events / 0 blocking issues`.
- content compile: PASS with unchanged playable product.
- generated determinism: PASS with unchanged hashes above.
- locked Reference verify: PASS at exact `b2f9fa15fba07c63530bbf4612b03b8b704755f9`.
- client production build: PASS; only the existing Vite `node:crypto` browser-externalization warning is emitted.
- official standard full CI (`npm run test:ci`): **136 files / 880 tests PASS**; eleven-round MatchSession case completes at about `4563ms` within its unchanged 5s case timeout.
- rules source + core + regression: **78 files / 468 tests PASS**.
- Phase 3 coverage: PASS — `106 archives / 141 cards / 246 abilities`; compiled product `73 / 14 / 0`; buckets `22/3/135/0/86/131`.
- automation audit: PASS — `135/3/86/20`.
- generated coverage/audit reporting artifacts were restored and are not Candidate changes.

For completeness, an additional non-standard broad `npm test -- --run` invocation was also tried. It includes machine-local historical source-asset authoring suites that the repository's standard CI intentionally excludes; it reported 20 pre-existing/environment failures because `D:\fd\chm-extract` and related original image assets are absent in this worktree. The new MHX test passed in that run, and none of the failing suites/files are touched by this Candidate. The authoritative standard CI gate above passes `880/880`.

## Frozen accounting and exact scope

A mechanical comparison of authoritative F1 `943 static + 1 dynamic = 944` against exact Base Git material and the Candidate working tree reports:

- Base cards/material overlap: `140 cards / 117/944`;
- Candidate cards/material overlap: `141 cards / 118/944`;
- exact addition: only `servant.mhx.skill.sc-mhx-3`;
- removals: `0`;
- duplicate canonical authoring ids: `0`.

Forbidden paths are unchanged relative to Base:

- `packages/rules/src/**`: 0 diff;
- `data/packs/**`: 0 diff;
- `data/generated/**`: 0 diff;
- `apps/**`: 0 diff;
- `scripts/**`: 0 diff;
- `artifacts/**`: 0 diff;
- frozen F1 artifacts under `data/phase3/**`: 0 diff.

Expected committed Candidate scope is exactly:

- `data/authoring/servants/servant.mhx.json`;
- `packages/rules/tests/fm03-mhx-extension-authoring.test.ts`;
- this S result report.

## Credit boundary / next gate

Candidate material is **`118/944`**, but this is not accepted migration credit yet. Recovery-line accepted overlap remains **`117/944`** until a fresh process-separated reviewer returns `MIGRATION_ACCEPTED` and a later A acceptance synchronization records it.

P3-FM09 remains `MIGRATION_BLOCKED` with the same nine provisioning targets. This FM03 family extension is not FM10.

Next gate: fresh independent R review of the exact committed Candidate. S must not review its own Candidate, merge PR, retarget PR, or advance accepted accounting.
