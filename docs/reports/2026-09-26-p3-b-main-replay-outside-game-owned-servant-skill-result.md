# P3-B Current-Main Outside-Game Owned Servant Skill Replay

Role: Codex B
Status: `IMPLEMENTATION_COMPLETE_CANDIDATE`
Date: 2026-09-26
Task: `P3-B-MAIN-REPLAY-OUTSIDE-GAME-OWNED-SERVANT-SKILL`

## Exact input

- Formal Base: `3b2d78ae931a0ded23f98ec1e513768dea9c78de` (`P3-A-F4-EXACT-50-COMPOSITION-02`).
- Historical accepted Candidate: `fc6d2f52f2d2cebbedc60e9e5d106744b347c8ff` (PR #441).
- Canonical historical reviewer evidence: `https://github.com/binchen648/fd/pull/441#issuecomment-5825842148`.
- Frozen denominator remains `944`; formal/material remains `112/944` before and after this zero-credit capability task.

## Replayed capability

Only the identity-free FB2-18 outside-game placement extension for owner-matching servant skills is replayed.

The existing owned-master path remains unchanged: an authored `master_skill` under a `master.*` archive may preserve exact `initialPlacement: "outside_game"` as before.

Additionally, an authored card may preserve exact `initialPlacement: "outside_game"` only when all of the following servant conditions hold:

- `cardType === "servant_skill"`;
- archive/root id starts with `servant.`;
- authored owner is exactly `{ type: "servant", id: <same archive/root id> }`.

The loaded card preserves the literal placement. The executable compiler accepts the resulting owned servant-skill definition as deferred and therefore does not assign an executable `initialZone`.

Owner mismatch, unsupported card type, malformed placement literal/value, and master/servant namespace mismatches remain fail closed. No Sherlock/Mash/card-id/name/printed-text routing, deduction-record behavior, product registration, `data/authoring/**` mutation, runtime Chinese-text parsing, SkillLib fallback, merge, or retarget is introduced.

## Validation

- fixed Work recovered to the exact formal Base and verified clean before implementation; preserved pre-existing dirty material remains archived outside Work;
- focused FB2-18 regression after R1 revision: `12/12 PASS`, including owner-matching servant positive coverage, owner-mismatch coverage, and an extra-field owner near-match rejection;
- affected loader/compiler chain after R1 revision: `3 files / 99 tests PASS` (`fb2-explicit-outside-game-initial-placement`, `executable-card-pack`, `authoring-interpreter`);
- `npm run typecheck`: `PASS`;
- `git diff --check`: `PASS`;
- Base-to-Candidate `data/authoring/**`: `EMPTY`;
- production identity-routing audit: no `servant.mash`, `servant.sherlock`, printed-text/name routing, Locked-Reference hash routing, or SkillLib fallback; only generic `master.` / `servant.` owner-namespace validation is added;
- exact implementation scope before this report: loader, executable compiler, focused FB2-18 regression only.

## Accounting / next planning effect

This task is capability infrastructure and grants `0` migration credit. Formal/material therefore remains `112/944`, remaining `832`.

After fresh-R ACCEPTED and A-sync, Composition must rerun the same historical `153`-identity loader-readiness scan. The task contract expects the three previously single-blocker identities (`servant.mash.skill.sc-mash-4`, `servant.sherlock.skill.sc-sherlock-4`, `servant.sherlock.skill.sc-sherlock-5`) to become loader-ready if no additional exact blocker appears. That planning effect is not formal migration credit and is not asserted as accepted until post-review A synchronization/rescan.

## Fresh-R R1 revision

Exact Candidate `10a22583f5e911ae4f812e82417b866006d6eaab` received `IMPLEMENTATION_NEEDS_REVISION`. Because Reviewer GitHub publication returned 403, Coordinator relayed the same already-completed attempt verbatim/bounded to canonical evidence `https://github.com/binchen648/fd/pull/456#issuecomment-5844121623` before modifying the Candidate.

The single blocking finding was that the new servant owner gate accepted a near-match owner object carrying extra fields. The revision keeps the pre-existing master path unchanged and strengthens only the servant path so the authored owner must have exactly the two keys `type` and `id`, with values `servant` and the same `servant.*` archive root. A focused adversarial regression now proves `{ type: "servant", id: <root>, extra: "near-match" }` fails closed. No second finding was reported in R1.
## Freeze requirement

Final Candidate scope is exactly the two production files, one focused regression file, and this result report. Before fresh R, verify exact Base/Candidate direct-parent lineage, `git diff --check`, authoring-empty scope, production identity-routing audit, and fixed Work cleanliness.
