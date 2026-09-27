# P3-A Sitonai Source-Skill Attack-Join Capability Acceptance Synchronization

Role: Codex A
Status: `SYNCHRONIZED`
Date: 2026-09-27

## Accepted input

- PR: `#464`
- Exact Base: `e92cb3a08392619b0e8f47504f8e1c751b7b504d`
- Reviewed predecessor Candidate: `a79cff1d2e91515d5a638a2e063415cb340f3d08`
- Exact accepted successor Candidate: `c68bfe1246c06a2a0f67728d5539a3710a355933`
- Canonical same-attempt evidence: `https://github.com/binchen648/fd/pull/464#issuecomment-5853397996`
- Verdict: `IMPLEMENTATION_ACCEPTED_CANDIDATE`
- ReviewJobKey: `pr464:c68bfe1246c06a2a0f67728d5539a3710a355933`
- Exact-Candidate Phase 3 Pre-Review Gate: `36299648124` — `SUCCESS`

The canonical comment is the Coordinator bounded relay of the same already-completed fresh independent review attempt after Reviewer GitHub publication returned explicit HTTP 403. It is not a second review.

## Accepted bounded capability

The accepted transaction is a permanently zero-credit capability/readiness seam for current owner `servant.sitonai`.

It provides the generic, data-driven `join_source_skill_card_to_attack` boundary required by locked Reference:

- server-owned source validation requires owner/controller match, skill zone, inactive and face-up source state;
- the accepted whole-ability shell requires a fixed positive authored mana cost and the exact active-attack distinct-attribute-pair condition;
- successful execution moves the physical source into `attack_area`, makes it public/face-up/active, and records `paidManaOnPlay=0`;
- joining is not ordinary card play: it does not emit ordinary play triggers or increment ordinary play counters;
- recursive privileged-node detection and loader/runtime whole-ability validation fail closed on nested or widened near matches.

Final review closure additionally confirms that joining does not forge current-round `playedRound` provenance. Genuine prior play provenance is preserved, an untracked skill-zone source receives valid non-current provenance, and a joined-but-not-played attack does not become eligible for existing `played_this_round` consumers such as Sigurd's refund selector.

## Verification carried by accepted Candidate

- focused source-skill attack-join capability: `5/5 PASS`;
- R1 closure set: `3 files / 19 tests PASS`;
- affected serial chain: `7 files / 155 tests PASS`;
- typecheck: PASS;
- content validate: PASS — `7 masters / 12 servants / 20 events / 0 blocking issues`;
- content compile: PASS — same summary;
- generated-content determinism: PASS;
- Base-to-Candidate `git diff --check`: PASS;
- `data/authoring/**` delta: EMPTY;
- production identity-routing audit: CLEAN for Sitonai identities/names/SkillLib;
- policy run `36299648124`: SUCCESS;
- fixed Reviewer final state: CLEAN, detached HEAD exactly accepted Candidate.

## A rescan / accounting

This capability task earns zero migration credit. Strict formal accounting therefore remains **`132/944`**, remaining **`812`**.

Mechanical rescan confirms the Sitonai owner boundary is unchanged:

- frozen inventory still records `servant.sitonai.skill.sc-sitonai-1` with `hasConfirmedOverride=true` and `hasAuthoringCard=false`;
- frozen inventory still records `servant.sitonai.skill.sc-sitonai-2` with `hasConfirmedOverride=true` and `hasAuthoringCard=false`;
- current canonical `data/authoring/servants/servant.sitonai.json` contains the already accepted `servant.sitonai.skill.sc-sitonai-3` and does not yet contain sc-sitonai-1/sc-sitonai-2;
- accepted FM07/R38 sc-sitonai-3 remains preserved and receives no duplicate credit.

The formal owner-complete remaining consumer scope is therefore still exactly:

1. `servant.sitonai.skill.sc-sitonai-1` — 连携打击
2. `servant.sitonai.skill.sc-sitonai-2` — 冻结吧，天上的诸力

Both accepted zero-credit prerequisites (#463 combination/Fimbul capability and #464 source-skill attack-join capability) are now available. Execution returns immediately to `P3-S-OWNER-SITONAI-COMPLETE-MIGRATION`; it must not advance owners.

If the whole remaining Sitonai owner batch is later `MIGRATION_ACCEPTED` and A-synchronized/accounted, it can add exactly two formal identities and move strict accounting from `132/944` to `134/944`.
