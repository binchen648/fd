# P3-B Akasha Owner Readiness Capability Result

Role: Codex B / FORMAL readiness
Status: `IMPLEMENTATION_COMPLETE_CANDIDATE`
Date: 2026-10-01
Base: `3b82108ac397d8fb9010a5691f28fd3e24008e12`
Classification: complete currently discoverable `master.akasha` owner-readiness/capability batch; permanently zero migration credit

## Frozen owner scope

One indivisible readiness batch across all eight frozen identities:

1. `master.akasha.skill.ascension` — 最终形态;
2. `master.akasha.skill.s1` — 命理;
3. `master.akasha.skill.s1a` — 无限转生者;
4. `master.akasha.skill.s2` — 转生;
5. `master.akasha.skill.s3` — 米切尔·罗亚·巴尔丹姆杨;
6. `master.akasha.skill.s4` — 艾蕾西亚;
7. `master.akasha.skill.s5` — 远野四季（容器）;
8. `master.akasha.skill.s6` — 过负荷.

Strict formal accounting remains `173/944`, remaining `771`. This readiness Candidate changes no `data/authoring/**` file and grants zero migration credit.

## Source recertification

Frozen repository/source evidence is semantic authority. Locked Reference `b2f9fa15fba07c63530bbf4612b03b8b704755f9` is used only as bounded behavior corroboration; its historical `core.akasha-reincarnation*` identity handlers are not copied into production runtime.

The seven `SOURCE_EVIDENCE_REQUIRED / EXPLICIT_BLOCK` rows were mechanically recertified against their frozen printed/source records before implementation:

- initial Vessel is Roa; a battle loss by at least 5 Power, or authoritative defeat, schedules reincarnation for the next round;
- reincarnation uses VP earned in the current Vessel, with Roa counting double, Elesia counting half rounded up, and thresholds `0-5 / 6-10 / 11+`; same-Vessel reincarnation loses 3 VP;
- reincarnation removes temporary Overloads until exactly two remain;
- Roa grants +1 Recon VP;
- Elesia, while controlling Overload, gives Master Skills +1 Power / -1 mana cost;
- Shiki waives the 8-mana Overload play threshold; a below-8-mana Overload gains +3 Power and stays active; its Action clause pays the active Overloads' costs to double their base Power for the round;
- ordinary Overload play closes the physical source and creates a temporary copy at the controller's location;
- deployment to a positive-terrain battlefield may join matching temporary Overloads from that exact location into the attack, with +2 Power this round;
- after all three Vessels have been visited, the final-form definition is provisioned if no live physical copy exists, reincarnation stops, and the controller is treated as having completed the Vessel cycle;
- during each Climax round, final form can place one temporary Overload at one chosen battlefield, at most once that round.

`master.akasha.skill.s1` remains a consumer of already-available generic card-creation/provisioning authority and did not require a new identity-specific runtime path.

## Identity-free readiness seam

The Candidate adds `packages/rules/src/ability/vessel-cycle-capability.ts`, an identity-free exact-shape capability family. No `master.akasha`, Akasha printed name, or legacy `core.akasha-*` token occurs in production capability/runtime source.

The family provides:

- exact three-stage Vessel-cycle initialization with frozen thresholds/multipliers and provider source/ability binding;
- positive-VP-only incarnation accounting using authoritative player VP state and a sealed baseline;
- exact battle-loss/defeat scheduling and next-round resolution;
- visited-Vessel and ultimate-state lifecycle;
- same-Vessel VP penalty and temporary-definition retention-to-two;
- exact current-Vessel Recon reward and conditional skill cost/Power aura;
- exact-definition 8-mana threshold waiver;
- low-mana exact-play provenance, same-round +3 authority, and ordinary close/create-copy lifecycle;
- positive-terrain exact-location generated-card join with +2 same-round authority;
- same-round physical-card base-Power multiplier for the active matching definition;
- final-definition provisioning after all three Vessels are visited;
- once-per-Climax-round chosen-battlefield generated-card provisioning.

Privileged shapes are loader-gated by exact whole-ability validators. Widened values or keys fail closed.

## Restore / lifecycle boundary

Vessel state and temporary card-Power authority reuse serialized structured player flags but add an explicit `isVesselCycleRuntimeProvenanceValidForRestore()` gate. Restore rejects, among other cases:

- a current Vessel outside the exact provider-declared three-Vessel set;
- a forged provider source or ability;
- malformed/non-integer VP counters/baselines/pending rounds;
- impossible visited/ultimate state;
- malformed serial/climax state;
- forged card bonus/multiplier/low-mana markers or markers whose physical source/ability/definition does not re-resolve to an accepted exact capability.

Low-mana +3, deployment +2, and Square x2 authority are stored with exact round/source/ability/definition provenance and naturally expire on the next round. They do not reuse unrelated legacy `roundPowerBonus` or persistent `basePowerMultiplier` restore contracts.

## Verification

- Akasha readiness focused regression: `15/15 PASS`;
- directly affected loader/interpreter/scoring/cost/power/neighboring owner set: `133/133 PASS`;
- complex skills regression: `38/38 PASS`;
- MatchSession: `33/33 PASS`;
- generic MatchSession restore regressions: `11/11 PASS`;
- affected aggregate: **`230/230 PASS`**;
- `E:\Codex\FD\binchen648_fd\tools\verify-toolchain.cmd`: `FD_TOOLCHAIN_OK`;
- `npm run typecheck`: PASS;
- `npm run content:validate`: PASS — `7 masters / 19 servants / 20 events / 0 blocking issues`;
- `npm run content:compile`: PASS — same counts;
- `npm run verify:generated-content`: PASS:
  - content library `eea4a067812644adb41989b3519fceddd0b11ba5985856e3f0fd525ffb713d52`;
  - fixture `87542f5da07effcf6bba03efd963ae964dde99af4f6c3c63352225e870c96e6c`;
  - evidence report `fe7a7388fda1eaa0fcab6b80dbb08104cabc2e27ccc0285be535045267cfb6f2`;
- Base..working-tree `data/authoring/**` delta: EMPTY;
- production Akasha identity audit: CLEAN;
- `git diff --check`: PASS.

## Next transaction

Freeze one exact readiness Candidate / one PR / one fresh independent Reviewer for the full eight-identity Akasha owner scope. This transaction is permanently zero-credit.

ACCEPTED -> one FORMAL-only A-sync/full-owner rescan while remaining on `master.akasha`; only that rescan may authorize the later one-owner / all remaining frozen identities / one formal Candidate migration transaction.
