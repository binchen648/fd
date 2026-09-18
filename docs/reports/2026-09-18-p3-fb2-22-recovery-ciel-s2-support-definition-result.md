# P3-FB2-22 Recovery — Ciel S2 Support Definition Result

Date: 2026-09-18
Role: Codex S/B2
Status: `IMPLEMENTATION_COMPLETE_CANDIDATE`
Target: exactly `master.ciel.skill.s2`
Frozen credit status: material only; no accepted credit pending A material sync + fresh R47

## Exact lineage

- Implementation Base / A dispatch: `52ea97e9371f5a2353b58ad948b232434c68abd8`.
- Branch: `codex/b-p3-fb2-22-recovery-ciel-s2-current`.
- Integrated main ancestor remains `553779e8ffcc926ae4763ee86a2ea937e090c128`.
- Accepted F1 source-evidence commit: `59f145434695d29bdd17e4cb3adc887e84182377`.
- Locked Reference metadata commit: `b2f9fa15fba07c63530bbf4612b03b8b704755f9`.

Historical Ciel commit `d019e503e8fe4741498b4fa9200dd80e85453939` was used only as technical evidence. No historical acceptance or review provenance is inherited.

## Result

Exactly one frozen provisioning target, `master.ciel.skill.s2` / `火葬式典`, is materialized through the accepted `master_support_definition_archive` channel.

The support archive contains exactly one `master_skill`, owned by `master.ciel`, with `initialPlacement: "outside_game"`, no public master information, and no deck. Pack registration is only through `authoringMasterSupportFiles`.

F1 remains authoritative for identity, printed clauses, and semantics. The two clause SHA-256 values are preserved and focused-tested:

- `exorcism-uncontested-win`: `232427277ebaef014071cc298108bdae588937e0a1cad95e09bfeb2be825f676`;
- `clerical-convenience`: `aa9c706b41223a3a1ce19a89093bf5f533af1ae483ce352319e94a7081869b57`.

Locked Reference is used only for stable/static metadata/source locator: legacy id `s2`, type/attribute `特殊`, cost 1, base Power 4, legacy requirement 0, and owner identity. No Reference handler/runtime route is inherited.

## Accepted generic semantics reused unchanged

No production rules/runtime/compiler source file changes.

The card reuses already accepted generic contracts:

- FB2-18 / R43: exact outside-game initial placement;
- FB2-19 / R44: master support-only authoring registration;
- FB2-21 / R46: exact controlled `controller.deployment_bonus` backed by the shared combat terrain truth;
- existing `skill_zone_mana_at_least: 0` requirement for the printed below-eight-mana play exception;
- existing `after_controller_wins_battle` + `controller_alone_at_battlefield` condition for the source-grounded uncontested-win clause;
- existing `adjust_victory_points` controlled numeric amount;
- existing combat action window + `controller_at_location_kind: 侦查` + `adjust_mana` for the scouting clause.

No Ciel ID/name/printed-text/Reference handler is added to `packages/rules/src/**`.

## Product shape

Fresh official compile and direct product inspection prove:

- playable masters: 7;
- servants: 7;
- executable cards: 72;
- executable characters: 14;
- executable decks: 7;
- blockers: 0;
- no Ciel executable/playable character;
- no Ciel fallback command spell;
- no generated `master.ciel.command-spell`;
- no Ciel deck;
- no Ciel fixture/evidence/public surface;
- `master.ciel.skill.s2` has `ownerId: master.ciel`, `initialPlacement: outside_game`, no `initialZone`, `playKind: support`, `destinationZone: field`;
- sourceMap contains exactly the card and its two ability entries.

The other ten frozen FM09 provisioning targets remain absent from both canonical authoring and generated rules.

## Frozen material accounting

Fresh exact intersection against all 944 unique F1 frozen identities gives:

- Base material overlap: `111/944`;
- Candidate material overlap: `112/944`;
- exact frozen additions: only `master.ciel.skill.s2`;
- frozen removals: 0;
- duplicate canonical authoring card IDs: 0.

This is **material presence only**. Independently accepted overlap remains `111/944` until Codex A mechanically synchronizes this Candidate and fresh R47 returns migration acceptance. This result does not claim `112/944` accepted progress.

## Coverage / audit material counters

Fresh reporting commands on the Candidate produce:

- archives: 100;
- cards: 135;
- abilities: 235;
- compiled: `72 cards / 14 characters / 0 blockers`;
- buckets: `22/3/130/0/80/127`;
- automation audit: `130/3/80/20`.

The two reporting artifact files were restored exactly before Candidate commit because they are outside authorized scope. No taxonomy/KPI implementation is changed to manufacture a metric improvement.

## Generated determinism

Official compile + deterministic verification PASS:

- content library: `2ffde7a8cf54611332456fe91b812ab6d36d98800f5b8d53f57394d65c05e572`;
- fixture unchanged: `fb69383fd91ab56bc645633eae72df8b8c10131cccd2713fd57afcf950a5f057`;
- evidence report unchanged: `b1bb8968097534c796cc6ff5775f3a14cfbbd063aa24e6b94f79a7e81d655cc3`.

Only `data/generated/fd-playtest-v1.content-library.json` changes among generated product files.

## Validation

Fresh Candidate validation:

- `npm ci --offline`: PASS, 239 packages, 0 vulnerabilities; existing allow-scripts warnings only.
- typecheck: PASS.
- focused Ciel + combat + executable compiler: `3 files / 66 tests PASS`.
- content validation: `7 masters / 7 servants / 20 events / 0 blockers`.
- official content compilation: PASS.
- generated determinism: PASS.
- unchanged official full `test:ci`: `131 files / 849 tests PASS`; the known timing-sensitive eleven-round MatchSession test completed in 4962 ms in this run.
- rules core + regression: `71 files / 434 tests PASS`.
- client production build: PASS; existing Vite `node:crypto` browser-externalization warning only.
- locked Reference verification with `--reference-root E:\Codex\FD\fd-reference`: PASS at exact `b2f9fa15...`.
- phase3 coverage: PASS with the material counters above.
- automation audit: PASS with the material counters above.
- `git diff --check`: PASS.

An initial no-argument invocation of the Reference verifier printed its required `--reference-root` usage and did not perform verification; the required locked-path invocation was then run and passed. This was a command-invocation correction, not a product/test failure.

## Exact Candidate scope

Authorized Candidate diff is exactly six files:

1. `data/authoring/masters/master.ciel.json`;
2. `data/packs/fd-playtest-v1/pack.json`;
3. `data/generated/fd-playtest-v1.content-library.json`;
4. `packages/rules/tests/executable-card-pack.test.ts` — only aggregate `71 -> 72`;
5. `packages/rules/tests/regression/fb2-ciel-s2-support-definition.test.ts`;
6. this result report.

No `packages/rules/src/**`, MatchSession, fixture, evidence report, coverage/audit artifact, frozen inventory, Reference/F1 file, UI/server file, unrelated authoring archive, or second target is changed.

## Next gate

This is an S/B2 material Candidate only. Codex A must create a fresh mechanical material synchronization from the exact committed Candidate. Only after that synchronization may a fresh independent R47 review the exact Base, Candidate, A sync, provenance, behavior, product surface, material accounting, and final cleanliness.

Do not start another provisioning target, FM09, FM10, or merge a stacked PR from this result.
