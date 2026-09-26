# P3-A F4 Exact-50 Composition 02

Date: 2026-09-26
Status: `EXACT_50_BATCH_BLOCKED`
Base: `162e9b03443719749a02d78a86e29d42db2aed7d`

## Mechanical accounting

- frozen denominator: `944 = 943 static + 1 dynamic`;
- formal/material: `112/944`;
- remaining: `832`;
- historical accepted PR #441 Candidate: `fc6d2f52f2d2cebbedc60e9e5d106744b347c8ff`;
- historical material identities: `288`;
- current exact-line material identities: `135`;
- old-frontier-minus-current replay pool: exactly `153`.

Each historical-diff identity was reduced to a one-card archive and re-run through the exact PR #455 accepted runtime `loadAuthoringJson` boundary. Loader readiness requires an empty adapter report and every compiled ability in `execution.mode=automatic`.

Result: **24 ready / 129 blocked**.

This is the same mechanical 153-card loader-readiness measure used by Composition-01 (`14/139`) and the post-#452 A synchronization (`22/131`). PR #455's result report also records a separate stricter reconciliation/evidence subset changing `17 -> 18`; that stricter subset is useful planning evidence but is not the same denominator/measure and is not substituted for this scan.

## Loader-ready pool

1. `master.ciel.skill.s1`
2. `master.ciel.skill.s1a`
3. `master.darnic.skill.s1a`
4. `master.fiore.skill.s1`
5. `master.iliya.skill.s1`
6. `master.leonardo.skill.s1a`
7. `master.ophelia.skill.s1a`
8. `master.peperoncino.skill.s1`
9. `master.shiki-ryougi.skill.s1a`
10. `master.shirou-emiya.skill.s1`
11. `master.shirou-emiya.skill.s2`
12. `master.shirou-emiya.skill.s3`
13. `master.taiga.skill.s1`
14. `master.zouken.skill.s1`
15. `servant.darius.skill.sc-darius-1`
16. `servant.darius.skill.sc-darius-2`
17. `servant.donquixote.skill.sc-donquixote-2`
18. `servant.gilles.skill.sc-gilles-2`
19. `servant.lance.skill.sc-lance-2`
20. `servant.medea.skill.sc-medea-2`
21. `servant.mhx.skill.sc-mhx-3`
22. `servant.muramasa.skill.sc-muramasa-1`
23. `servant.siegfried.skill.sc-siegfried-2`
24. `servant.sigurd.skill.sc-sigurd-3`

These 24 are readiness input only. Final exact-50 membership requires separate frozen source/provenance classification and semantic dependency proof.

## Current blocker clustering

High-frequency current blockers include `choose_cards`, `phase_is`, `metric`, `event_definition_is_self`, selection payload fields, and independent modifier lifecycles. Those broader families are not selected merely by raw frequency because most affected cards have multiple simultaneous blockers.

The narrowest immediate mechanically isolated closure is the outside-game servant-skill extension. Exactly three blocked replay identities share one current blocker only:

- `servant.mash.skill.sc-mash-4`
- `servant.sherlock.skill.sc-sherlock-4`
- `servant.sherlock.skill.sc-sherlock-5`

Current FB2-18 accepts exact outside-game placement only for owned `master_skill`. Historical accepted PR #441 extended the same identity-free representation to owner-matching `servant_skill`, preserved no-`initialZone` compilation, and added an owner-mismatch fail-closed regression. Fresh R accepted exact PR #441 Candidate `fc6d2f52f2d2cebbedc60e9e5d106744b347c8ff`; canonical relay evidence is `https://github.com/binchen648/fd/pull/441#issuecomment-5825842148`.

## Dispatch

Dispatch zero-credit `P3-B-MAIN-REPLAY-OUTSIDE-GAME-OWNED-SERVANT-SKILL` only. Replay the generic representation seam, not the three consumer identities and not the broader PR #441 M50 runtime.

If accepted and synchronized, rescan the same 153 identities again. Do not grant migration credit and do not dispatch a non-tail S batch until exactly 50 unique identities are dependency-complete.