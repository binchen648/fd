# P3-S R113 Helena S1 Consumer Migration Result

Role: Codex S
Task: P3-S-R113-HELENA-S1-CONSUMER-MIGRATION
Status: `CANDIDATE_READY`
Date: 2026-09-23

## Exact lineage

- Exact clarified A dispatch Base: `b648ff78b51f96cfc7653e33db76bda56802432e`
- Original R113 dispatch: `722341d1456bb857eb596f1f5ef81e4313a1db39`
- R112 FB2-53 acceptance synchronization: `a5f475dece21eac9d8a36a6d566e1402da6d33f9`
- Accepted FB2-53 Candidate: `c8fadf19c304a698e7f4c847e376a5ba6609c60e`
- Locked Reference: `b2f9fa15fba07c63530bbf4612b03b8b704755f9`

## Result

Migrated exactly one frozen identity into the existing standalone Helena servant archive:

- `servant.helena.skill.sc-helena-1`

The accepted Helena S3 remains present exactly once and its authored object is semantically byte-for-JSON identical to the exact clarified Base. No second Helena archive was created.

Frozen source/static facts preserved:

- owner: `servant.helena`
- owner name: `海伦娜·布拉瓦茨基`
- card name: `奥尔科特上校`
- legacy id: `sc_helena_1`
- typeLabel: `被动`
- cost/basePower: `0 / 0`
- attributes: `[]`
- F1 ability: `colonel-olcott-action`
- exact printed clause/full text: `被动/行动阶段：从手牌打出一张力量基础攻击，若如此做，将一名你所在地点的对手技能区明置的一张从者技能暗置。`
- clause/full-text SHA-256: `abc76e38254ac8688fa7caef5392e28a7b8baa507479231db743a638e9f3fc52`
- canonical servant skill-zone threshold: `8`; legacy requirement `0` remains evidence metadata only.

The card uses only the synchronized FB2-53 whole envelope: exact stage-one `basic_strength_attack` target, existing `play_selected_cards`, exact stage-two `same_location_opponent_face_up_servant_skill` target, and exact `set_selected_card_face_down`. Successful stage-one selection settles ordinary effect-play `playBatch` including printed mana cost/provenance before stage two opens. Stage two preserves physical card identity/owner/controller/zone while setting the exact opponent servant skill face-down/inactive. Both pending stages retain FB2-53 frozen-snapshot plus live-legality and fail-closed persisted-continuation protections.

The existing Helena S3 migration test received only the A-authorized archive compatibility change: it now finds S3 by id and asserts S3 exact-once instead of asserting that the entire Helena archive can contain only S3. All existing S3 semantic, lifecycle, skill-use-forbid, provenance, and product-isolation assertions remain intact.

During official full CI, one additional historical stale repository-total assertion was discovered in `ciel-s1b-consumer-migration.test.ts`: it hard-coded total material overlap `150`. S stopped without widening scope. A issued the formal R113 full-CI clarification at exact Base `b648ff78b51f96cfc7653e33db76bda56802432e`, authorizing only removal of that moving absolute count while preserving denominator `944`, duplicate-free accounting, and exact-once Ciel S1b/S3 assertions. No Ciel semantic/product behavior changed. Final full CI then passed.

## Material accounting

Mechanical recount on the final S tree:

- frozen denominator: `944`
- Base material overlap: `150/944`
- Candidate material overlap: `151/944`
- exact addition: `servant.helena.skill.sc-helena-1`
- Helena S1 count: `1`
- Helena S3 count: `1`
- frozen removals: `0`
- duplicate frozen ids: `0`

This S Candidate is not pre-credited. Project formal migration remains **`155/944`**, with **`789`** remaining until fresh independent R returns `MIGRATION_ACCEPTED` for the exact Candidate and A synchronizes that result.

## Validation evidence

- `FD_TOOLCHAIN_OK`.
- Focused S1 + existing Helena S3 + accepted FB2-53: `3` files / `25` tests PASS.
- Post-clarification focused bundle adding Ciel S1b compatibility: `4` files / `32` tests PASS.
- Typecheck: PASS.
- Content validation: PASS (`7` masters / `7` servants / `20` events / `0` blocking issues).
- Generated-content determinism: PASS; playtest product hashes unchanged (`b38f475d...`, `fb69383f...`, `b1bb8968...`).
- Locked Reference verification: PASS at exact `b2f9fa15fba07c63530bbf4612b03b8b704755f9`.
- Final official `npm run test:ci -- --maxWorkers=2`: **`186` files / `1393` tests PASS**.
- Client production build: PASS; only existing Vite browser-externalization/chunk-size warnings.
- Phase-3 coverage: PASS (`128` archives / `174` cards / `287` abilities / `78` compiled cards / `14` compiled characters / `blockingIssues=0` / `dualRuntime=0`).
- Automation audit: PASS (`promotionFindings=20`).
- Coverage/audit artifacts restored byte-for-byte from exact clarified Base after evidence collection.
- `packages/rules/src/**`, `apps/client/**`, `data/packs/**`, `data/generated/**`, and `data/phase3/**`: zero diff from exact clarified Base.
- Product manifest/generated outputs remain isolated from the standalone Helena archive.
- Production identity-routing diff probe: empty because production runtime/compiler/client source is unchanged.
- `git diff --check`: PASS.

S 完成 recertification 并提交 Exact Base/Candidate.