# P3-S Vlad Owner-Complete Migration Result

Role: Codex S
Status: `MIGRATION_COMPLETE_CANDIDATE`
Date: 2026-09-30
Base: `a41cc21459db8067d48344f4ae10aa8b1390264e`
Task: `P3-S-OWNER-VLAD-COMPLETE-MIGRATION`
Classification: one formal owner-complete consumer migration for the exact frozen Vlad owner scope

## Formal owner scope / accounting boundary

Exact frozen scope remains one indivisible owner transaction:

1. `servant.vlad.skill.sc-vlad-1` — newly creditable;
2. `servant.vlad.skill.sc-vlad-2` — newly creditable;
3. `servant.vlad.skill.sc-vlad-3` — preservation-only, already canonical before this Candidate.

Strict formal accounting before fresh R is **`164/944`**, remaining **`780`**. This Candidate may add exactly **+2** only after exact-Candidate `MIGRATION_ACCEPTED` and subsequent A-sync/accounting, yielding `166/944`, remaining `778`. sc3 contributes `+0`.

Accepted prerequisite: readiness PR #497 successor `0b93b10e62eb793a3e04aeff163a92ce7e3cc2a8`, `IMPLEMENTATION_ACCEPTED_CANDIDATE`, canonical correction relay `https://github.com/binchen648/fd/pull/497#issuecomment-5910603956`, followed by readiness A-sync/full-owner rescan `a41cc21459db8067d48344f4ae10aa8b1390264e`.

## Canonical owner archive

Extended existing `data/authoring/servants/servant.vlad.json` so sc1 + sc2 join the preserved canonical sc3 in one owner archive. Vlad is integrated exactly once immediately after Valkyrie in `fd-playtest-v1`.

Frozen 12-card starting deck, from locked Reference static metadata only:

- `card.cardb1` x2;
- `card.cardb2`;
- `card.cardq1` x2;
- `card.cardq2`;
- `card.cardq3`;
- `card.cardq4`;
- `card.cardluck`;
- `card.cardsurveil`;
- `card.cardpreparation` x2.

All three skill cards use final-rule skill-zone threshold `8`. Reference legacy requirement remains metadata only.

### sc1 — 护国鬼将

Consumes exact accepted PR #497 generic readiness structure:
- action/controller action window, source-owned, pay exactly 1 mana, `double_controller_terrain_this_round` multiplier 2 / this-round duration;
- combat/controller combat action window, source-owned, pay exactly 1 mana, exact `fortify_moved_in_battlefield_and_arm_next_round_deployment` with moved-player total Power adjustment `-4` and `same_battlefield_next_round` authority;
- real cross-round cleanup/forced-deployment durability remains the accepted successor behavior.

### sc2 — 极刑王

Consumes exact accepted PR #497 extra hand-play structure:
- action/controller action window with active source and source-owned condition;
- first target: exactly one controller-owned physical hand card independently legal for face-up effect-play;
- optional second target: distinct hand card exposed only with positive terrain;
- both settle through ordinary card-play semantics; second adds exactly 2 mana to aggregate transaction cost;
- `【真名解放】` / `revealsTrueNameOnPlay` is preserved as accepted/static card evidence; the privileged ability itself remains the exact accepted readiness shape with no widened visibility payload;
- pending decision restore/revalidation and atomic preflight remain the accepted generic runtime behavior.

### sc3 — 战斗续行（Lancer Class）

Preserved existing canonical F1 authoring and movement semantics unchanged. It remains preservation-only and receives no duplicate credit.

## Runtime / identity boundary

Formal consumer migration introduces no new `packages/rules/src/**` changes. It consumes the already accepted readiness runtime. Production identity audit must remain clean for Vlad ids/names and `core.vlad-*` routing.

## Verification

Frozen verification before fresh R:
- Vlad formal owner-complete regression: `5/5 PASS`;
- accepted Vlad readiness regression: `13/13 PASS`;
- complex-skills regression: `38/38 PASS`;
- MatchSession regression: `33/33 PASS`;
- generic MatchSession regression: `11/11 PASS`;
- playtest pack loader: `21/21 PASS`;
- exact affected aggregate: **`121/121 PASS`**;
- `FD_TOOLCHAIN_OK`;
- typecheck PASS;
- content validate/compile PASS: `7 masters / 17 servants / 20 events / 0 blocking issues`;
- generated-content determinism PASS:
  - content library `611cfdc5735708fb37e7e9b014d779ae1e8dc90843ce1f4d387fc881985900d4`;
  - fixture `87542f5da07effcf6bba03efd963ae964dde99af4f6c3c63352225e870c96e6c`;
  - evidence report `9b06437e4dafbf23aab3dd08f7e2a87821055693820e4ddee95b5405b0026669`;
- Base..Candidate `packages/rules/src/**` delta EMPTY;
- production Vlad identity audit CLEAN;
- `git diff --check` PASS.

## Next transaction

Freeze one exact formal Candidate / one PR / one fresh independent formal migration Reviewer. Allowed terminal verdicts: `MIGRATION_ACCEPTED`, `MIGRATION_NEEDS_REVISION`, `MIGRATION_BLOCKED`.

ACCEPTED -> one A-sync/accounting transaction adds exactly sc1 + sc2 (+2); sc3 remains +0.
