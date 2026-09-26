# P3-A MHX Saber Magic Resistance FM03 Extension Dispatch

Date: 2026-09-18
Role: Codex A
Status: `S_DISPATCH_READY`
Base: exact post-R52 acceptance synchronization `caacad5634dfbcb14314c29125cdd21071141a72`
F1 evidence: `59f145434695d29bdd17e4cb3adc887e84182377`
Locked Reference: `b2f9fa15fba07c63530bbf4612b03b8b704755f9`
Accepted contracts: P3-R12/B18 Noble Bloom +1 VP, P3-R13/B19 Noble Bloom threshold extra +1 VP, P3-R29/FB2-10 Magic Resistance, and P3-R30/FM03 migration precedent.

## Current accounting

- recovery-line accepted: `117/944` (`12.39%`);
- remaining: `827/944`;
- integrated `origin/main` accepted: `111/944`;
- this dispatch itself grants zero migration credit.

## Fresh readiness overlay

A re-scanned the authoritative F1 `943 static + 1 dynamic = 944` inventory against exact canonical authoring presence at the accepted `117/944` recovery base.

Using the same exact signature key as the R50 delta refresh — Reference handler + normalized semantic axes + required capabilities + mechanic families — there are now **zero** mixed accepted/missing signature groups. That means there is no remaining identity that can be authorized solely from the frozen F1 classification tuple.

A then performed a stricter source-family reconciliation over the remaining `827`, looking for missing rows whose complete printed source and locked Reference shape are already represented by an independently accepted family. Exactly one clean direct extension survives that check:

`servant.mhx.skill.sc-mhx-3` / 对魔力（Saber Class）

No other missing row is authorized by this dispatch. In particular:

- `servant.illya.skill.sc-illya-7` additionally carries the unaccepted Dream Summon rule;
- `master.sion.skill.s8` is a distinct batch-card-use special subsystem, not Riding;
- `master.shirou-emiya.skill.s1` is a game-duration initial-Mana modifier, not the accepted FB2-25 game-start set-Mana trigger;
- Okita s1 still has repeat-play/draw semantics outside the accepted Riding/source-play family.

## F1 classification-drift reconciliation

F1 currently labels MHX s3 as `SPECIAL_HANDLER_CANDIDATE` with `SPECIAL_EFFECT:mhx_magic_resistance_noble_reward_rule`. That label is not itself sufficient for migration and is not rewritten here.

Fresh source evidence shows the label is a normalization-classification divergence rather than a semantic difference from the accepted FM03 family:

- exact printed text SHA-256: `8a6da48db16868ce5d5766fa7ff05c00b2c392f715106f869cb59aaabee65ffc`;
- exact clause 1 SHA-256: `1cef15482dd584d9d18b4e9016476b7bffb31cb0331efd38b4025a26611c84c2`;
- exact clause 2 SHA-256: `f0631437ce658c07be75426fc0394d6f32c6fafc10805bcb359ff17d4de97f85`;
- exact clause 3 SHA-256: `bd7530459d6ccd00217d1192b06509e322d48bafd44f037c383470ecbba55229`.

Those hashes are byte-identical to the accepted Altera / Arthur / Bedivere / Charlemagne / Gawain / Mordred / Musashi FM03 wording. The printed semantics are therefore exactly the same three clauses already accepted by R30:

1. Noble Bloom base: after battle result, if controller played their highest-cost Noble Phantasm in that battle this round, gain `+1 VP`;
2. Noble Bloom threshold: under the same predicate and highest-cost NP cost `>=4`, independently gain another `+1 VP`;
3. Magic Resistance: during controller combat action while the source is active, set same-battlefield engaged opponents' Magic attack Power to `0` for the current round.

Locked Reference independently places MHX s3 in the same `core.saber-magic-resistance` shared handler family and records:

- owner `servant.mhx` / 谜之女主角X;
- servant class `Assassin`;
- legacy id `sc_mhx_3`;
- name `对魔力（Saber Class）`;
- `typeLabel=特殊`;
- `cost=3`;
- `basePower=3`;
- historical `requirement=3`.

As with accepted FM03, Final Rules 9.4 supplies the canonical skill-zone threshold `8`; historical Reference requirement `3` remains metadata only.

## A feasibility probe

A performed a temporary in-memory authoring probe from exact Base without committing any content change. The probe rebuilt MHX s3 by preserving the authoritative MHX identity/source/static metadata while reusing only the accepted FM03 structural decomposition.

Results:

- `npm ci --offline`: PASS, 239 packages, 0 vulnerabilities;
- repository `typecheck`: PASS;
- production authoring loader report: `[]`;
- full printed-text SHA: exact `8a6da48...`;
- accepted classifiers: Noble Bloom base `true`, threshold extra VP `true`, Magic Resistance candidate `true`, exact Magic Resistance semantic `true`;
- all three normalized abilities are structurally identical to accepted Altera FM03 abilities after removing only identity-specific ability ids;
- real Magic Resistance runtime probe: opponent same-battlefield Magic Power `5 -> 0`, opponent Force remains `4`, controller Magic remains `5`, remote opponent Magic remains `5`;
- real Noble Bloom runtime probe: controller VP `4 -> 6` through two independent `+1` responses;
- temporary probe was removed and the A worktree returned clean.

Therefore MHX s3 requires no new runtime/compiler seam and does not authorize widening any accepted semantic contract.

## Exact S scope

Codex S may materialize exactly one frozen identity:

`servant.mhx.skill.sc-mhx-3`

Expected production authoring file:

`data/authoring/servants/servant.mhx.json`

It must be a minimal `servant_skill_card_archive` containing only MHX s3. Do not migrate MHX s1/s2 or any other skill.

S should reuse the accepted FM03 authoring representation exactly except for authoritative MHX identity/static/source evidence:

- `cardType=servant_skill`;
- class `Assassin` at archive owner level;
- `typeLabel=特殊`, attributes `[特殊]`, cost/basePower `3/3`;
- play timing `action / controller_play_card_window`;
- final skill-zone Mana requirement `8`;
- the exact three accepted FM03 abilities and no additional semantic axis.

Allowed implementation scope is narrowly:

- `data/authoring/servants/servant.mhx.json`;
- one focused MHX/FM03 family-extension regression test;
- one S result report.

No `packages/rules/src/**`, `data/packs/**`, `data/generated/**`, apps, scripts, F1 artifacts, taxonomy/KPI logic, or locked Reference changes are authorized. If implementation requires any such change, stop as `MIGRATION_BLOCKED` rather than widening scope.

## Required S proof

S must independently verify:

- exact F1 printed text, three clause hashes, owner/card id, and source references;
- exact locked Reference class/static metadata;
- exact structural equivalence to accepted FM03 abilities excluding identity/source-evidence fields;
- zero authoring-loader report;
- all three accepted semantic classifiers;
- representative real runtime for Magic Resistance and both Noble Bloom responses;
- no identity/name/text-specific production runtime routing;
- no pack/generated/product exposure or playable roster drift;
- frozen accounting exactly `117/944 -> 118/944`, addition only MHX s3, removals `0`, duplicate frozen canonical IDs `0`;
- standard typecheck, focused FM03/FB2-10/B18/B19 compatibility, content validate/compile, deterministic generated content, locked Reference verify, full CI, rules core+regression, client build, Phase 3 coverage, automation audit, `git diff --check`, exact scope, and final cleanliness.

## Credit boundary

This A dispatch grants zero migration credit. Recovery-line accepted overlap remains **`117/944`** until a fresh process-separated R review returns `MIGRATION_ACCEPTED` and a later A acceptance synchronization records the result. Candidate material may become `118/944`; it must not be reported as accepted before those gates.

P3-FM09 remains `MIGRATION_BLOCKED` with the same nine provisioning targets. This FM03 extension is not FM10 and does not alter the FM09 blocker claim.
