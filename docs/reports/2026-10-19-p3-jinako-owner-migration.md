# P3 `master.jinako` owner migration

- Remote: `https://github.com/binchen648/fd.git`
- Worktree: `E:\Codex\FD\binchen648_fd\jinako-owner-migration-binchen`
- Base: `e9091c1b29c80851c3ce7db85eb76407d3bcc70d` (Irisviel A-sync frontier, 305/944)
- Candidate: dirty worktree handoff; not committed, not pushed, no PR, no A-sync
- Scope: frozen `master.jinako.skill.ascension`, `.s1`, and `.s2`; no prior Jinako archive or pack entry existed

## Evidence preserved

`data/authoring/masters/master.jinako.json` copies all three canonical printed texts from `data/phase3/full-roster-ability-inventory.json`, retains the development/legacy locators, and records every generated legacy-content SHA:

- `ascension`: `1b4e4b0bff4586c9e2d659215cc38b0aaf5fd03dc7083a84bbfd079ccef1d17f`
- `s1`: `15f270cfdab5a2f45482d33e0c50efc8cc9bcc66f934eab1ea80fa55ae969bde`, `25ad45a115ded7dc1aa6113e8f2be2118aea59883c7036f9cc1b933693f89d8a`, `6506468bd07d1edeecddc9a4b6fab63463be102c5e55e97f6008b428addcb809`
- `s2`: `1a0fcd48118eb47ac98de4aae367b2d95e196e4df62b98b79f557d7b290b40c0`, `0aa4873676bee849f375a2c7ec893e83a57ee264282f49ddbc370497421f659f`

The canonical pack now registers the archive once. Generated content and evidence were rebuilt; all three skill rows are `HOST_ADJUDICATED` and no skill claims `FULL` or automatic gameplay. The generated overview's `FULL` status is the loader's normal non-playable overview projection, not a skill capability claim.

## Honest runtime boundary

The loader can preserve and display the cards, but the current runtime cannot authoritatively prove:

- the dynamic X calculation from the game-start Servant deck's special-attribute basic-attack count;
- the once-per-game lifecycle of Cheat Code Conversion;
- preservation of an activated attack's printed attribute;
- converted basic-attack costs (4→Luck, 3→Rapid, 2→Remote Operation);
- Workshop-leave mana loss timing and outpost deployment/no-deployment timing.

All three cards therefore use audit-only `record_master_directive` envelopes and remain host-adjudicated. No legacy handler is executed automatically.

## Verification evidence

- `npx vitest run packages/rules/tests/regression/p3-jinako-owner-migration.test.ts` — **4 passed**.
- `npm run typecheck` — **PASS**.
- `npm run content:validate` — **PASS** — `33 masters, 19 servants, 20 events, 0 blocking issues`.
- `npm run content:compile` — **PASS** — `33 masters, 19 servants, 20 events, 0 blocking issues`.
- `npm run verify:generated-content` — **PASS**.
  - content library: `436f1e35d19cd2dffb2e246d7ac85a010bbbad2fd397b42609b7d3b7754ff319`
  - fixture: `87542f5da07effcf6bba03efd963ae964dde99af4f6c3c63352225e870c96e6c`
  - evidence report: `a3518118c85c7c6ef23bee233c279b8b7bed5a2b25fa5f5a8e65234077395ca4`
- `git diff --check` — **PASS**.

No push, PR, merge, or A-sync action was performed.
