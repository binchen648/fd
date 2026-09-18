# P3-A Ciel S2 Recovery Feasibility After R46

Date: 2026-09-18
Role: Codex A
Status: `FEASIBILITY_CLOSED`
Accepted frozen overlap at dispatch: `111/944`

## Exact starting point

- Integrated main ancestor: `553779e8ffcc926ae4763ee86a2ea937e090c128`.
- FB2-21 accepted Candidate: `92f2aa1b084b9ac9c2ee8f2f353cdfa13611f04a`.
- Post-R46 A acceptance sync: `abc57f240e083b9a345a5e2cbfe9bda011de9ea3`.
- Fresh feasibility probe worktree: `E:\Codex\FD\fd-p3-fb2-22-ciel-s2-probe`, detached at exact A sync.
- Target: frozen F1 identity `master.ciel.skill.s2` / `火葬式典`.

The probe is evidence only. It is intentionally dirty and is not an implementation Candidate or acceptance provenance.

## Source and static contract

Accepted F1 source-evidence commit `59f145434695d29bdd17e4cb3adc887e84182377` is authoritative for identity, printed clauses, and semantics. It records:

- owner `master.ciel`;
- exact target `master.ciel.skill.s2`;
- clause `驱魔-战斗阶段：若你赢得一场未进行争夺战的战斗，获得等于你地利位置数的战果`, SHA-256 `232427277ebaef014071cc298108bdae588937e0a1cad95e09bfeb2be825f676`;
- clause `神职便利-战斗阶段：若你位于侦查，获得2点魔力`, SHA-256 `aa9c706b41223a3a1ce19a89093bf5f533af1ae483ce352319e94a7081869b57`;
- printed play exception that the card may be played below 8 mana.

Locked Reference `b2f9fa15fba07c63530bbf4612b03b8b704755f9` supplies only stable identity/static metadata/source locator for this recovery implementation: legacy skill `s2`, type label/attribute `特殊`, printed cost 1, base Power 4, owner `master.ciel`, and source locator. Its old structured handler/runtime syntax is not acceptance authority and must not be copied as a routing contract.

## Current-lineage semantic closure

Fresh current-code inspection confirms all required generic seams now exist without a Ciel identity route:

- support-only `master_support_definition_archive` registration from FB2-19;
- `initialPlacement: "outside_game"` from FB2-18;
- low-mana skill play through `skill_zone_mana_at_least` with value 0;
- `after_controller_wins_battle` + `controller_alone_at_battlefield` for the source-grounded uncontested-win condition;
- `adjust_victory_points` with controlled formula `{ "var": "controller.deployment_bonus" }`;
- `controller_combat_action_window` + `controller_at_location_kind: "侦查"` + `adjust_mana: 2`;
- accepted FB2-21 shared terrain metric, so the VP formula reads the same terrain/deployment-bonus truth as combat.

Historical commit `d019e503e8fe4741498b4fa9200dd80e85453939` was inspected only as technical evidence. It is not acceptance provenance. Its only rules/runtime extension for Ciel was the terrain/deployment-bonus metric that has now been independently rebuilt and accepted through FB2-21/R46.

## Fresh detached feasibility probe

A reconstructed only the proposed Ciel support archive plus support-only pack registration on exact `abc57f2...` and ran the current production toolchain.

Results:

- `npm ci --offline`: PASS, 239 packages, 0 vulnerabilities.
- typecheck: PASS.
- content validation: `7 masters / 7 servants / 20 events / 0 blockers`.
- official content compilation: PASS.
- historical technical Ciel behavior probe on current code: `3/3` PASS.
- executable compiler without baseline repair: `48/49` PASS; sole failure is exact aggregate `71 -> 72`.
- after temporary probe-only aggregate `71 -> 72`, Ciel + combat + executable focused suites: `62/62` PASS.
- generated determinism: PASS.

Generated product diff is limited to:

- one new `rules.cards.master.ciel.skill.s2` definition;
- sourceMap entries for the card and its two abilities.

No playable/public Ciel surface appears. Playable masters remain 7, servants remain 7, executable characters remain 14, no Ciel character/fallback command spell/deck/fixture seat is created, and the executable Ciel definition retains `initialPlacement: outside_game` with no `initialZone`.

The other ten frozen FM09 provisioning targets remain absent in canonical authoring and generated rules.

Candidate material counters predicted by the official probe are:

- `100 archives / 135 cards / 235 abilities`;
- compiled `72 cards / 14 characters / 0 blockers`;
- buckets `22/3/130/0/80/127`;
- automation audit `130/3/80/20`.

Deterministic candidate content-library hash from the probe is `2ffde7a8cf54611332456fe91b812ab6d36d98800f5b8d53f57394d65c05e572`. Fixture and evidence report remain unchanged at `fb69383fd91ab56bc645633eae72df8b8c10131cccd2713fd57afcf950a5f057` and `b1bb8968097534c796cc6ff5775f3a14cfbbd063aa24e6b94f79a7e81d655cc3`.

Coverage/audit artifact files changed only because the probe ran the reporting commands; those files are not authorized Candidate scope and must be restored in the implementation worktree.

## Accounting and dispatch decision

Ciel s2 is one frozen F1 identity. A clean S Candidate may therefore demonstrate material overlap `112/944`, but independently accepted overlap must remain `111/944` through Candidate creation and A material synchronization. Only fresh R47 may promote the recovery-line accepted overlap to `112/944`.

No further generic prerequisite is required. Dispatch `P3-FB2-22-RECOVERY` as an exact one-target support-definition migration. P3-FM09 remains blocked on the other ten frozen provisioning targets and on its source-family migration; no FM10 is dispatched.
