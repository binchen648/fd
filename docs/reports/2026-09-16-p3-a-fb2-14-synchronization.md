# P3-A FB2-14 Synchronization and FM08 Dispatch

Date: 2026-09-16
Role: Codex A
Status: `SYNCHRONIZED`
R39: `62d355513d7fff66c4f3752f891f8ec326cf70f3`
FB2-14 candidate: `86afe51311ff2b6cd05ea403044e8e226b0cde7d`
A handoff: `50602c9355794c9c0c7fe4d79b75f7936d912c17`
F1 evidence: `59f145434695d29bdd17e4cb3adc887e84182377`
Reference: `b2f9fa15fba07c63530bbf4612b03b8b704755f9`

## Fresh A recertification

A recertified from the exact R39 review lineage in a fresh A-sync worktree.

- `npm.cmd ci --offline --ignore-scripts`: PASS, `0 vulnerabilities`.
- `npm.cmd run typecheck`: PASS.
- FB2-14 focused regression: `9/9 PASS`.
- `npm.cmd run content:validate`: `7 masters / 7 servants / 20 events / 0 blocking issues`.
- deterministic generated-content hashes remain unchanged:
  - content `8da51a30935845670dcd88928089730ff4a7a39d9b53b8c8c794189d95509840`;
  - fixture `fb69383fd91ab56bc645633eae72df8b8c10131cccd2713fd57afcf950a5f057`;
  - evidence `b1bb8968097534c796cc6ff5775f3a14cfbbd063aa24e6b94f79a7e81d655cc3`.
- fresh coverage remains archives `90`, cards `123`, abilities `222`.
- raw routing remains `new=22 / legacyExecute=3 / legacyResolve=127 / dual=0 / notClassifiable=70 / taxonomyWarnings=124`.
- compiled definition hash remains `37551fd5f5b0a968f9143dee0698adf8582a0a26d8edabef55907cf78d374333` with `70` cards / `14` characters / `0` blocking issues.

The fresh coverage command regenerates local artifact metadata/source-location material. Those generated artifacts are intentionally excluded from this A synchronization commit because FB2-14 is runtime-only and the material coverage/KPI baseline is unchanged.

## Accepted runtime boundary

R39 independently accepted the exact identity-free FB2-14 contract:

- one typed authoritative `RuleOverrideState`, installed only through an exact fail-closed `game_start` structural classifier;
- loader-normalized empty response metadata is accepted only as the two exact default values and does not widen response semantics;
- first-logical-day and lower-VP battle total-Power adjustments use typed state only;
- Situation-conditioned controller `master_skill` physical-card Power can be final-locked to `0` for matching Noble Phantasm prohibition;
- command-spell timing is replaced from Action to Advance only for the configured controller;
- the extra regular attack-play allowance is prospective and depends on authoritative mana `>=11`;
- the Noble Phantasm exemption ignores only Situation-origin prohibitions, not event-origin prohibitions;
- own Action/Combat movement lock applies to ordinary normal/effect movement while the previously accepted explicit ignore-movement semantic remains the trusted bypass boundary;
- ordinary projections hide `hidden_until_trigger` event IDs while preserving aggregate count, and authorized viewers may inspect them;
- authorized opponent-discard inspection exposes opponent discard IDs only and does not broaden hand/deck/private-zone visibility;
- positive mana grants converge on one deterministic grant authority with non-climax Situation cap, regular/climax round budget, existing storage cap/gain block, applied-positive-only ledger accounting, and round reset;
- game-start installation inherits existing trusted event authority and replay idempotency, and the typed state/ledger serialize through ordinary authoritative `GameState`.

This does not accept identity/name/printed-text routing, an arbitrary player flag bag, broad Visibility/Modifier/Lifecycle promotion, Leonardo/Ophelia/Wodime semantics, or any authoring migration by implication.

## Frozen-F1 / Reference reconciliation

Accepted canonical overlap remains `101/944`; FB2-14 runtime acceptance adds no migration credit.

R39 independently parsed the frozen F1 inventory at the reviewed F1 candidate instead of reusing the A/B2 selection. For locked Reference handler `core.game-start-rule-flags` it reproduced:

- `17` handler-linked F1 identities total;
- `12` block-free `READY_GENERIC_EXTENSION` rows;
- `5` special/blocked rows;
- Leonardo s1a excluded from the self-contained executable subset because its frozen semantics require both event VP and event mana reward modification and the full authoritative event reward consumer is not closed by FB2-14;
- Ophelia s1a excluded because its use-limit replacement only parameterizes a separate not-yet-canonical dependent skill;
- exact remaining self-contained executable subset: `10` identities.

The exact FM08 set is:

1. `master.bazett.skill.s1b`
2. `master.caules.skill.s1a`
3. `master.fiore.skill.s2`
4. `master.fiore.skill.s3`
5. `master.fiore.skill.s4`
6. `master.irisviel.skill.s1`
7. `master.peperoncino.skill.s1a`
8. `master.sieg.skill.s1`
9. `master.waver.skill.s1`
10. `master.zouken.skill.s5`

Frozen F1 presence is `10/10`; accepted/current canonical presence before FM08 is `0/10`. There is no hidden eleventh self-contained migration-ready row within this handler family under the accepted FB2-14 boundary.

## FM08 dispatch

P3-FM08 is READY at exact batch size 10.

S must materialize only the ten identities above in minimal canonical authoring archives, preserving frozen source text/evidence and locked Reference owner/static metadata. Each card must encode only the exact accepted FB2-14 structural route corresponding to its frozen semantic contract. Leonardo s1a, Ophelia s1a, the five special/blocked handler-linked rows, unrelated game-start effects, runtime files, taxonomy/KPI logic, and unrelated authoring are out of scope.

Material overlap may become `111/944` after the ten canonical identities are added. Accepted overlap remains `101/944` until the S candidate is independently synchronized and migration-accepted.
