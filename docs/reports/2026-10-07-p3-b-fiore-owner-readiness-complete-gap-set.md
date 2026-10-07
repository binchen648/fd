# P3-B Fiore Owner Readiness Complete Gap Set

Date: 2026-10-07
Task: `P3-B-FIORE-OWNER-READINESS-CAPABILITY`
Branch: `codex/b-p3-fiore-owner-readiness-complete-gap-set`
Exact readiness Base: `b7bb64a0b3079927177c7ad131f9a482d29540d8`
Implementation start commit: `e46a6e05c42e1b13ebf4381ab710c5ad1522ae13`
Locked Reference: `b2f9fa15fba07c63530bbf4612b03b8b704755f9`
Classification: zero-credit complete-owner readiness

## Frozen owner / accounting boundary

Fiore's frozen owner scope is exactly nine identities:

- `master.fiore.skill.ascension`
- `master.fiore.skill.s1`
- `master.fiore.skill.s1a`
- `master.fiore.skill.s2`
- `master.fiore.skill.s3`
- `master.fiore.skill.s4`
- `master.fiore.skill.s5`
- `master.fiore.skill.s6`
- `master.fiore.skill.s7`

Current canonical Fiore authoring contains exactly `3/9`: `s2 + s3 + s4`. Those three objects are already accepted/credited FM08 recovery material and are preservation-only. Their canonical file blob remains byte-for-byte identical to the task-start commit: `79ce0ef8c7403c849c64abe4fc41e812dc4fa6d9`.

The six remaining uncredited identities are `ascension + s1 + s1a + s5 + s6 + s7`. This readiness transaction materializes none of those consumers and grants zero migration credit.

Strict accounting remains `253/944`, remaining `691`. Maximum later lawful Fiore migration increment is `+6`, only after one owner-complete migration preserves the accepted `3/9`, materializes all six remaining identities, receives fresh `MIGRATION_ACCEPTED`, and FORMAL A-sync/accounting completes.

## Complete owner-local readiness gap set

A new identity-free `round-skill-profile-capability` closes the runtime seams required by the complete remaining Fiore contract while preserving the accepted FM08 baseline:

- `s1` reuses existing game-start skill provisioning for 瘫痪 / 温顺 / 回路不良.
- `s1a` 超越 uses `switch_round_skill_profile` to select one available pair in advance or action mode, enforce one use per mode/pair, create or reuse the corresponding enhanced Master skill, suppress only the selected accepted FM08 drawback for the round, and clean temporary profile authority at round end.
- Action-mode 超越 arms exact post-battle `-4 mana` once.
- Gentle -> 决意 requires exactly one active opponent with strictly higher VP and persists that target for the round.
- `s5` 神经机械学 reuses required-additional play, generic one-arrow movement at exact `1 mana`, and adds an identity-free `+2` current-battlefield terrain route only when the controller has no assigned terrain there.
- `s6` 决意 uses `round_profile_determination_reward`: exactly `+2 VP`, once, only when controller and the selected higher-VP target participate and the controller defeats that target.
- `s7` 聪慧头脑 uses `round_skill_card_power_bonus`: exact `1 mana` action cost and cumulative `+1` round power to Master/Servant skill cards, including generated enhanced Fiore skills.
- `ascension` 完全恢复 reuses the same profile switch in ascension mode and arms exact `-2 VP` only if Fiore later loses a battle that round. The marker survives a prior win/non-loss, remains restore-valid, charges once on the later loss, and does not double-charge on replay.
- All profile state is round-scoped and restore provenance validates exact provider/enhanced-definition relationships.

Production integration is identity-free:
- movement-lock suppression is consumed by the shared movement rule;
- round-mana-cap suppression is consumed by the shared resource rule;
- Gentle's lower-VP total-power and situation-driven Master-skill lock are suppressed only while the selected round profile is active;
- current-location terrain and skill power bonuses feed the shared terrain/combat/power pipelines;
- loader gateways fail closed on malformed privileged shapes.

## Preservation / identity boundary

- `data/authoring/**` delta: EMPTY.
- Existing `master.fiore.json` hash at task start and current worktree: `79ce0ef8c7403c849c64abe4fc41e812dc4fa6d9`.
- Production scan for `master.fiore`, 菲奥蕾·弗尔维吉, 完全恢复, 超越, 神经机械学, 决意, 聪慧头脑 and `core.fiore-`: CLEAN.
- Development source image `E:\Codex\FD\Fate_Domination-开发版\images\masters\菲奥蕾·弗尔维吉.png`: PRESENT.

## Verification

Candidate-local / affected green evidence:

- Fiore complete-owner readiness regression: `10/10 PASS`, including closed-world restore-provenance tamper rejection.
- Shared terrain deployment metric: `7/7 PASS`, including pure-read/no-mutation invariant.
- Game-start skill provisioning: `7/7 PASS`.
- Authoring interpreter: `38/38 PASS`.
- MatchSession: `34/34 PASS`.
- Full selected affected batch: `105/107 PASS`; its only two failures are exact pre-existing Base failures documented below.
- `npm run typecheck`: PASS.
- `npm run content:validate`: PASS — `21 masters / 19 servants / 20 events / 0 blocking issues`.
- `npm run verify:generated-content`: PASS with unchanged consumer hashes:
  - content `b2fc1c24e3c9ad9d2e05dd9dfbaadfda9c4900a0992afee02c8fd8f9f3a94756`
  - fixture `87542f5da07effcf6bba03efd963ae964dde99af4f6c3c63352225e870c96e6c`
  - evidence `2c238ac983a3f9f9131acf16703a4a3d54c68af241deba93164139484f512823`
- Phase-3 coverage written outside the worktree with explicit `--out`: `archives=126`, `cards=281`, `abilities=487`, `compiledCards=213`, `compiledCharacters=40`, `blockingIssues=0`, `newRuntimeSemanticRouted=22`, `legacyExecuteAbility=3`, `legacyResolveEffect=161`, `dualRuntime=0`, `notClassifiable=301`.
- Automation audit written outside the worktree with explicit `--out`: `legacyResolveEffect=161`, `legacyExecuteAbility=3`, `notClassifiable=301`, `promotionFindings=20`.
- Source-assets reproduces exactly `93` historical missing image entries; `fioreHits=0`.
- `git diff --check`: PASS.

External FORMAL evidence directory:
`E:\Codex\FD\.fd-formal-evidence\p3-b-fiore-readiness-e46a6e05-1`

## Exact-Base-known affected failures

Two selected shared tests fail identically on a plain archive of exact task-start commit `e46a6e05c42e1b13ebf4381ab710c5ad1522ae13`, outside every Git worktree, using the same installed dependency tree:

1. `fb2-game-start-rule-overrides.test.ts` — the deterministic fixture expects a Kayneth pairing that the current canonical pack no longer produces, so the pairing lookup is undefined.
2. `golden-flow-2-combat-power-winner-vp.test.ts` — restore rejects the hand-mutated fixture as `Invalid MatchSession state container`.

Both failures reproduce unchanged before the Fiore readiness runtime delta. They are recorded as pre-existing shared-test debt rather than hidden or reported as Candidate green. The Fiore Candidate does not modify either test or the MatchSession restoration boundary responsible for those exact Base failures.

## Fresh Reviewer revision closure

Prior Candidate `d1809a4eade396242e267e74a9eff1dd1a0bb4a6` received
`IMPLEMENTATION_NEEDS_REVISION`. The completed same-attempt evidence relay is canonical at:
`https://github.com/binchen648/fd/pull/544#issuecomment-6032667992`.

The single blocking finding was a fail-open restore boundary for privileged
`__fd_rsp:` structured round flags. The revision closes that boundary as a
closed-world contract:

- every `__fd_rsp:` player flag must have an exact same-round marker, and every prefixed round marker must have a matching flag;
- unknown/orphaned prefixed keys are rejected;
- profile/mode/suppression/enhanced/provider/provider-ability/target/reward fields must belong to one validated accepted switch profile with exact physical-source and enhanced-definition provenance;
- action and ascension penalties are accepted only when anchored to a matching validated profile mode and exact amount;
- terrain and skill-power authority now persist exact source-card/ability provenance and must be anchored to an enhanced card belonging to a validated profile;
- forged suppression, forged skill-power bonus, forged terrain bonus, unknown authority, orphaned profile-owned fields, and orphaned round markers are all negative-tested.

Revision verification:

- Fiore focused regression: `10/10 PASS`;
- `npm run typecheck`: PASS;
- `git diff --check`: PASS.

Readiness remains permanently zero-credit; strict accounting remains `253/944`, remaining `691`.

## Gate

This readiness Candidate remains permanently zero-credit. No missing Fiore consumer identity is materialized here.

Freeze exactly one Candidate / PR from the accepted Darnic A-sync lineage. One fresh independent exact implementation review must adjudicate the complete nine-identity readiness/preservation boundary. Only a fresh `IMPLEMENTATION_ACCEPTED_CANDIDATE` may authorize zero-credit A-sync/rescan and release `P3-S-OWNER-FIORE-COMPLETE-MIGRATION`.
