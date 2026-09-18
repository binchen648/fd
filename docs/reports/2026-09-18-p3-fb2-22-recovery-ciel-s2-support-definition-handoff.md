# P3-FB2-22 Recovery — Ciel S2 Support Definition Handoff

Date: 2026-09-18
From: Codex A
To: Codex S/B2
Status: `READY`
Target: exactly one frozen identity, `master.ciel.skill.s2`
Accepted overlap at dispatch: `111/944`
Potential Candidate material overlap: `112/944` only

## Exact Base

Implementation must start from exact post-R46 A sync:

`abc57f240e083b9a345a5e2cbfe9bda011de9ea3`

Do not base on historical FB2-20/Ciel commits. Historical `d019e503e8fe4741498b4fa9200dd80e85453939` may be consulted only as technical repair evidence.

## Authoritative evidence boundary

Use accepted F1 commit `59f145434695d29bdd17e4cb3adc887e84182377` as authority for identity, printed text/clauses, and semantics. Required clause provenance:

- `exorcism-uncontested-win`: `232427277ebaef014071cc298108bdae588937e0a1cad95e09bfeb2be825f676`;
- `clerical-convenience`: `aa9c706b41223a3a1ce19a89093bf5f533af1ae483ce352319e94a7081869b57`.

Use locked Reference commit `b2f9fa15fba07c63530bbf4612b03b8b704755f9` only for stable/static metadata/source locator:

- owner `master.ciel`;
- legacy skill id `s2`;
- type label / attribute `特殊`;
- cost `1`;
- base Power `4`;
- legacy requirement `0`;
- source locator for Ciel / 火葬式典.

Do not inherit a Reference handler, old Reference runtime syntax, identity route, or old acceptance verdict.

## Exact product contract

Create one `master_support_definition_archive`:

- archive id exactly `master.ciel`;
- exactly one card `master.ciel.skill.s2`;
- `cardType: master_skill`;
- owner exactly `master.ciel`;
- `initialPlacement: outside_game`;
- no `publicInformation`;
- no deck;
- register only through `authoringMasterSupportFiles`.

The card must preserve the F1 printed play exception and two clauses. Current accepted generic representation is:

1. play below the ordinary 8-mana skill threshold with `skill_zone_mana_at_least: 0`;
2. `exorcism-uncontested-win`:
   - forced trigger;
   - `after_controller_wins_battle`;
   - source must be active;
   - condition `controller_alone_at_battlefield`;
   - one `adjust_victory_points` effect to controller;
   - amount exactly `{ "var": "controller.deployment_bonus" }`;
   - automatic execution;
3. `clerical-convenience`:
   - combat phase action;
   - `controller_combat_action_window`;
   - source must be active;
   - condition `controller_at_location_kind` with exact accepted `侦查` mapping;
   - controller gains exactly 2 mana;
   - automatic execution.

Do not add Ciel-specific routing anywhere under `packages/rules/src`. The content definition may of course contain the target identity; runtime dispatch must remain structural/generic.

## Exact allowed Candidate scope

Candidate may change exactly these six files:

1. `data/authoring/masters/master.ciel.json` — new one-card support archive;
2. `data/packs/fd-playtest-v1/pack.json` — append Ciel only to `authoringMasterSupportFiles`;
3. `data/generated/fd-playtest-v1.content-library.json` — official deterministic compiler output;
4. `packages/rules/tests/executable-card-pack.test.ts` — only the canonical executable-card aggregate `71 -> 72`; no weakened/deleted assertions;
5. `packages/rules/tests/regression/fb2-ciel-s2-support-definition.test.ts` — focused target behavior/product regression;
6. `docs/reports/2026-09-18-p3-fb2-22-recovery-ciel-s2-support-definition-result.md` — S/B2 result.

Forbidden Candidate changes include all `packages/rules/src/**`, MatchSession/runtime/compiler/loader/interpreter/terrain code, other authoring archives, frozen inventory, Reference/F1 files, taxonomy/KPI implementation, coverage/audit artifacts, fixture, evidence report, UI/server files, or another frozen target.

If any production rules/runtime/compiler change proves necessary, stop and return a blocker instead of broadening scope.

## Required product invariants

Fresh official compilation must prove:

- playable masters = 7;
- servants = 7;
- executable cards = 72;
- executable characters = 14;
- blockers = 0;
- Ciel playable character absent;
- Ciel fallback command spell absent;
- generated Ciel command spell absent;
- Ciel deck absent;
- fixture playable seats unchanged;
- `master.ciel.skill.s2` present exactly once in canonical authoring and generated rules;
- executable Ciel card has owner `master.ciel`, `initialPlacement: outside_game`, no `initialZone`, `playKind: support`, `destinationZone: field`;
- card + both abilities have sourceMap entries;
- the other ten frozen FM09 provisioning targets remain absent.

Expected material counters from the fresh A probe are `100/135/235`, compiled `72/14/0`, buckets `22/3/130/0/80/127`, audit `130/3/80/20`. These are material/accounting observations, not accepted-overlap promotion.

Expected generated hashes after official compile:

- content library `2ffde7a8cf54611332456fe91b812ab6d36d98800f5b8d53f57394d65c05e572`;
- fixture unchanged `fb69383fd91ab56bc645633eae72df8b8c10131cccd2713fd57afcf950a5f057`;
- evidence report unchanged `b1bb8968097534c796cc6ff5775f3a14cfbbd063aa24e6b94f79a7e81d655cc3`.

Do not trust the expected hash blindly; regenerate and verify determinism independently.

## Required behavioral tests

At minimum prove:

- support archive loads with zero adapter blockers;
- outside-game card compiles without `initialZone`;
- it can be played with mana below 8 while still paying printed cost 1;
- scouting combat action grants exactly 2 mana only in the accepted location condition;
- uncontested-win path uses `controller.deployment_bonus` and grants the correct VP;
- terrain multiplier behavior flows through the accepted shared metric rather than any duplicated Ciel formula;
- executable compiler has no failure after only aggregate `71 -> 72` update;
- no playable/fallback/deck/public-surface leakage.

## Required official gates

Run fresh from the clean implementation worktree:

- `npm ci --offline`;
- typecheck;
- focused Ciel + combat + executable compiler;
- content validation and official compilation;
- generated determinism;
- full `test:ci`;
- rules core + regression;
- client production build;
- locked Reference verify;
- phase3 coverage;
- automation audit;
- `git diff --check`;
- exact six-file scope and final cleanliness.

Coverage/audit commands may rewrite their artifact files locally. Restore those files exactly before Candidate commit; they are not authorized scope.

## Credit gate

The S/B2 Candidate may state **material overlap `112/944`** because exactly one frozen F1 identity is newly materialized. It must also state **accepted overlap remains `111/944`** until A performs independent material synchronization and fresh R47 returns migration acceptance.

After Candidate completion, stop product implementation. Codex A must mechanically synchronize the exact Candidate before R47. Do not start another frozen target, FM09, FM10, or merge any stacked PR.
