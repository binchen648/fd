# P3-S owner-complete Sigurd migration result

## Task / lineage

- Task: `P3-S-OWNER-SIGURD-COMPLETE-MIGRATION`
- Branch: `codex/s-p3-owner-sigurd-complete-migration`
- Exact Base: `8f2c8141c33da0ac30a3468a068c9ab1715e15ce`
- Base is the accepted zero-credit Sigurd capability A-sync/rescan commit.
- Capability authority: PR #461 exact accepted Candidate `20f7c6d3262b00ca072554fc07be5fc2ba89e7ab`, canonical same-attempt evidence `https://github.com/binchen648/fd/pull/461#issuecomment-5851169420`.
- Workflow unit: one formal owner-complete batch; all three remaining `servant.sigurd` frozen identities are migrated together.
- Strict formal accounting before review: `129/944`; no Sigurd credit is claimed before fresh independent R + A-sync/accounting.

## Exact frozen owner scope

1. `servant.sigurd.skill.sc-sigurd-1` — 破灭之黎明
2. `servant.sigurd.skill.sc-sigurd-2` — 坏劫之天轮
3. `servant.sigurd.skill.sc-sigurd-3` — 里迪尔·赫萝蒂

If and only if this exact owner Candidate receives `MIGRATION_ACCEPTED` and is subsequently A-synchronized/accounted, exactly three identities become eligible and strict accounting becomes `132/944` with `812` remaining.

## Source recertification

The frozen inventory, locked confirmed overrides, locked reference implementation and static content metadata were mechanically re-read before encoding the consumers.

Authority chain:

- locked Reference commit: `b2f9fa15fba07c63530bbf4612b03b8b704755f9`;
- CHM source: `chm-extract/Sigurd.htm` / `从者/剑士/英文版/Sigurd.htm`;
- development image: `Fate_Domination-开发版/images/servants/齐格鲁德.png`;
- both source files exist mechanically in the local reference/resource roots.

Recertified semantics:

- both Gram skills key their curse and Ridill grants from the physical skill card having been revealed, not merely remaining active;
- sc-sigurd-1 reveals true name on play; after its physical card is revealed, controller loses 1 VP at each round start; after battle it refunds mana equal to exactly one current-round attack paid by an opponent who fought Sigurd, choosing one when multiple candidates exist;
- sc-sigurd-2, once physically revealed, causes every controller basic attack to gain a card-local Action costing 2 mana that doubles that physical basic card's base power and removes it only after the canonical battle terminal; the granted Action belongs to the basic attack itself;
- sc-sigurd-3 is required-additional-play; while sc-sigurd-2 is physically revealed it gains Agility, and while sc-sigurd-1 is physically revealed it gains Magic;
- exact static deck/card metadata is preserved from the locked content record.

Historical identity handlers are evidence only; production runtime remains generic and identity-free.

## Implemented owner consumers

### sc-sigurd-1 — 破灭之黎明

- Strength / Magic / Noble Phantasm, cost 11, base power 3, skill-zone mana requirement 11.
- True-name release is represented through the generic declaration reveal path.
- Curse uses the accepted generic `source_revealed` condition plus round-start VP adjustment, so the effect persists from the physical reveal fact even after the card stops being active.
- After-battle residual targets exactly one eligible current-round attack from an opponent in the trusted battle participant/location relation and refunds its trusted physical paid mana cost.

### sc-sigurd-2 — 坏劫之天轮

- Agility / Noble Phantasm, cost 0, base power 5, skill-zone mana requirement 8.
- Curse uses the same physical-reveal semantic.
- Blade Storm is an exact accepted passive derived-marker shell from PR #461. It grants the generic synthetic basic-card Action only while the physical source has been revealed.
- The transformed basic card is not removed by an unproven same-name event; removal requires the canonical current-round battle terminal provenance accepted in #461.

### sc-sigurd-3 — 里迪尔·赫萝蒂

- Strength, cost 3, base power 5, skill-zone mana requirement 3.
- Exact required-additional-play marker prevents a solo regular play and permits the card in a valid additional-play batch.
- Exact accepted conditional-revealed-attribute marker adds Agility from revealed sc-sigurd-2 and Magic from revealed sc-sigurd-1.

## Product/content integration

- Added `data/authoring/servants/servant.sigurd.json` and registered it in `fd-playtest-v1`.
- Product roster becomes 12 authoring servants.
- Generated content library/evidence report were regenerated deterministically.
- MatchSession tests that depended on a fixed seven-of-roster seed were made roster-stable by deterministically selecting a session that actually contains the servant required by the test. No production MatchSession behavior changed in this formal owner batch.

## Final candidate validation before freeze

Toolchain:

- `tools\verify-toolchain.cmd` => `FD_TOOLCHAIN_OK`.

Focused / affected:

- Sigurd owner-complete focused regression: `6/6 PASS`.
- Accepted revealed-source capability regression: `7/7 PASS`.
- MatchSession: `33/33 PASS`.
- executable-card-pack: `50/50 PASS`.
- authoring interpreter: `38/38 PASS`.
- resolution-dataflow: `15/15 PASS`.
- combat resolver: `10/10 PASS`.
- compile-playtest-content-pack CLI: `4/4 PASS`.
- aggregate affected serial chain: `8 files / 163 tests PASS`.
- product-content non-asset assertions: `3/3 PASS` (12-servant roster, twelve-card decks/three skills, validation without blocking issues).
- `npm run typecheck`: PASS.
- `npm run content:validate`: PASS — `7 masters / 12 servants / 20 events / 0 blocking issues`.
- `npm run content:compile`: PASS — same summary.
- `npm run verify:generated-content`: PASS:
  - content library: `b2c446488a28c5036ac36557e09b563b54b11018d5396233a53f37ffdbff6923`
  - fixture: `fb69383fd91ab56bc645633eae72df8b8c10131cccd2713fd57afcf950a5f057`
  - evidence report: `f4ae33de4dc2832766064bdf46e277d9559398d4d34b45d7d05a0eb76744cd14`
- `git diff --check`: PASS.
- production identity-routing audit under `packages/rules/src`: `servant.sigurd=0`, `sc-sigurd=0`, `齐格鲁德=0`, all three Sigurd card-name literals = 0, `SkillLib=0`.
- exact declared Sigurd development image and `Sigurd.htm` source both exist mechanically.

## Known fixed-environment source-asset baseline

The full `fd-playtest-servants.test.ts` currently remains `3 PASS / 1 FAIL` solely because `servant.artoriac.overview` points at the already-documented missing historical `chm-extract` image asset. The failure predates this Sigurd batch and is not in the Sigurd source/image chain. The same file's roster/deck/validation assertions pass, and the exact Sigurd development image exists.

## Review boundary

This report freezes implementation evidence only. It does not self-award migration credit. Fresh independent R must review the exact pushed Candidate for all three Sigurd skills together. Until exact-Candidate `MIGRATION_ACCEPTED` and subsequent A-sync/accounting, strict formal accounting remains `129/944`.