# P3-A Skadi Rune / Castle Readiness Capability Acceptance Synchronization

Role: Codex A
Status: `SYNCHRONIZED`
Date: 2026-09-27

## Accepted input

- PR: `#466`
- Exact Base: `44bf45f39c6adc2b419527f96d4257aea4080bb8`
- Reviewed predecessor Candidates: `ae5647871bedf3c2fcc143975bbcd7854d8ff5aa`, `102193c0fbf7aaa80772676e1fe2828e32e3ee0e`
- Exact accepted successor Candidate: `f807936f26d3e61dc2454a59f918de073fcfeb4f`
- Canonical same-attempt evidence: `https://github.com/binchen648/fd/pull/466#issuecomment-5854715176`
- Verdict: `IMPLEMENTATION_ACCEPTED_CANDIDATE`
- ReviewJobKey: `pr466:f807936f26d3e61dc2454a59f918de073fcfeb4f`
- Exact-Candidate Phase 3 Pre-Review Gate: `36309515122` — `SUCCESS`

The canonical comment is the Coordinator bounded relay of the same already-completed fresh independent review attempt after Reviewer GitHub publication returned explicit HTTP 403. It is not a second review.

## Accepted bounded capability

The accepted transaction is a permanently zero-credit capability/readiness seam for current owner `servant.skadi`.

It provides generic, data-driven support for the locked/source-recertified Skadi owner surface without any consumer migration:

- current-round two-distinct-basic-attack attribute-pair derivation for rune combinations;
- exact pay-1 outpost draw-one then private exact-two hand-card shuffle-to-deck continuation, with source-grounded nonempty-deck legality;
- exact pay-3 same-location other-active-player mana loss with authoritative pre-payment affordability and once-this-round gating;
- armed same-round combat defeat of the unique active opponent at the controller battlefield;
- active-source same-location opponent positive-mana-gain suppression;
- active-source outpost choice of one supported attribute to apply a source-bound current-round x2 basic base-power multiplier at the live source location;
- authenticated restore/settlement validation for private continuation and source-bound multiplier state;
- recursive privileged-node detection and exact whole-ability loader/runtime fail-closed validation.

Final review closure confirms the exact pay-1 affordability boundary: 1 starting mana is legal, dispatches successfully, reaches the private continuation, and ends at 0 mana. The post-payment path does not demand a second mana. Empty-deck and insufficient-mana states remain fail closed.

## Verification carried by accepted Candidate

- focused Skadi readiness capability: `12/12 PASS`;
- affected serial chain: `10 files / 182 tests PASS`;
- typecheck: PASS;
- content validate: PASS — `7 masters / 12 servants / 20 events / 0 blocking issues`;
- content compile: PASS — same summary;
- generated-content determinism: PASS;
- Base-to-Candidate `git diff --check`: PASS;
- `data/authoring/**` delta: EMPTY;
- production identity-routing audit: CLEAN for Skadi identities/names/SkillLib;
- policy run `36309515122`: SUCCESS;
- fixed Reviewer final state: CLEAN, detached HEAD exactly accepted Candidate.

## A rescan / accounting

This capability task earns zero migration credit. Strict formal accounting therefore remains **`134/944`**, remaining **`810`**.

Mechanical rescan confirms the Skadi owner boundary is unchanged:

- frozen inventory still records `servant.skadi.skill.sc-skadi-1` with `hasConfirmedOverride=true` and `hasAuthoringCard=false`;
- frozen inventory still records `servant.skadi.skill.sc-skadi-2` with `hasConfirmedOverride=true` and `hasAuthoringCard=false`;
- frozen inventory still records `servant.skadi.skill.sc-skadi-3` with `hasConfirmedOverride=true` and `hasAuthoringCard=false`;
- canonical `data/authoring/servants/servant.skadi.json` is still absent;
- targeted historical report search still finds no prior formal Skadi migration acceptance.

The formal owner-complete consumer scope therefore remains exactly all three frozen Skadi identities together:

1. `servant.skadi.skill.sc-skadi-1` — 大神的睿智
2. `servant.skadi.skill.sc-skadi-2` — 原初之卢恩
3. `servant.skadi.skill.sc-skadi-3` — 通往死亡满溢的魔境之门

Execution returns immediately to `P3-S-OWNER-SKADI-COMPLETE-MIGRATION`; it must not advance owners.

If the whole Skadi owner batch is later `MIGRATION_ACCEPTED` and A-synchronized/accounted, it can add exactly three formal identities and move strict accounting from `134/944` to `137/944`, remaining `807`.
