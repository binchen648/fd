# P3 `master.irisviel` owner migration

- Base: `4dd3dbb382cc7d4fb893410309418c1b08bb5cb2` (`302/944` sync frontier)
- Candidate: dirty worktree handoff (not committed, not pushed, no PR, no A-sync)
- Worktree: `E:\Codex\FD\binchen648_fd\irisviel-owner-migration`
- Scope: frozen `master.irisviel.skill.ascension`, `.s1`, and `.s2` only

## Evidence preserved

The authoring archive now contains exactly the three canonical owner identities, with the stale `excludedCards` entry removed. Printed text is copied verbatim from the Phase 3 full-roster inventory, and the accepted generated-text hashes remain in `sourcePolicy.sourceLocators.generated`:

- `ascension`: `764186a6e18e6809aae2fac1606962feda161ba0f7e5a91e9d5a2a4575f2d0f2`, `2e1aa81c66cb7c8c37ca72d9da458c2e0aee4ea286f510a4c386abbd5f73060f`, `3b8136218dd2ca0707eb4d6b480ee36d3d4186bcfebd586a4f96cee39adad95f`, `ce2524bda62f58881683da59bf06a5ee7bab5a8ff7d3820b074b8401ccb861c2`
- `s1`: `d880afd3807b56ddd0ae4c2ad35829fc7991428aee15438515ade2ade66bf9fd`
- `s2`: `75fa71628bf0f1ce128eb156a6b7bd1d3e49bf1e155e3e11978d342190548304`

The generated playtest content library and evidence report were regenerated from the pack; each of the three skill rows is `HOST_ADJUDICATED`.

## Honest runtime boundary

All three archive cards and generated skill entries are `host_adjudicated`; none claims `complete`, `FULL`, or automatic gameplay. Their effects are audit-only `record_master_directive` markers, so loader/runtime event processing does not execute the legacy handlers.

The current engine cannot authoritatively prove Ascension's attack activation lifetime and combat attribute/power modification, S1's command-seal timing rewrite, or S2's dynamic all-hand discard and discard-count mana gain. Those semantics remain explicitly host-adjudicated; the old handler/reference routes are retained only as source evidence.

## Verification evidence

- `npx vitest run packages/rules/tests/regression/p3-irisviel-owner-migration.test.ts` — **4 passed**.
- `npm run typecheck` — **PASS**.
- `npm run content:validate` — **PASS** — `32 masters, 19 servants, 20 events, 0 blocking issues`.
- `npm run content:compile` — **PASS** — `32 masters, 19 servants, 20 events, 0 blocking issues`.
- `npm run verify:generated-content` — **PASS**.
  - content library: `04226ff2aae27d61238ced7c20510fbdfd3b4c620f375d0d941e1b4c9bef3f27`
  - fixture: `87542f5da07effcf6bba03efd963ae964dde99af4f6c3c63352225e870c96e6c`
  - evidence report: `6147b0a058238507a63b38e4c83136990783b98e72cdfbd12f0f36b81809c77c`
- `git diff --check` — **PASS**.

The broader legacy seven-master/runtime tests still contain pre-migration expectations for the removed `proxy-master`/`conversion-magic` identities and automatic conversion behavior; those failures are not used as acceptance evidence for this migration. No push, PR, merge, or A-sync action was performed.
