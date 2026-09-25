# P3-A F4 Exact-50 Composition 01

Role: Codex A
Status: `PREREQUISITE_DISPATCHED`
Date: 2026-09-26
Base: `355089549671ba90dd9b50d7a929d4b032643ac0`

## Rule

Every non-tail F4 S migration batch must contain exactly 50 frozen identities. Multiple mechanically isolated compatible subgroups may be combined. A capability family smaller than 50 does not authorize a smaller S batch; continue prerequisite work / subgroup composition until the exact-50 manifest is mechanically supportable.

## Mechanical inventory

Source-only reconciliation artifact: PR #442 head `a1b8f274c8f3fb0859540de9dc08ca3a97a5f8cc`, frontier material `8b26c9d0aa294c065ae6c7f3a2b062f19cdff196`. These are evidence sources only and are not transplanted into current-main ancestry.

- frontier delta inventory: 158 identities;
- classification at reconciliation time: 31 `GENERIC_RUNTIME_REQUIRED`, 120 `NOT_VERIFIED`, 5 `SPECIAL_SUBSYSTEM`, 2 `CONTRACT_REVALIDATION_REQUIRED`;
- current-main per-identity loader/runtime prefilter over all 158: 16 zero-report/automatic;
- strict prefilter (zero-report/automatic + concrete `VERIFIED_REVIEW_EVIDENCE` + materialized frontier identity): 8;
- Astolfo S1 among those 8 is already current-main material/formal and must be excluded as a duplicate;
- loader-green does not override contract dependencies: e.g. Darius S2 still depends on unsynchronized FB2-36, while four M50 identities remain `identityContractParity=REQUIRES_SPLIT`;
- historical M50 100 identities scanned individually after only the already-authorized redundant `phase_is == activation.phase` normalization: 5 zero-report/automatic, 95 blocked by current-main unsupported vocabulary/routes.

Therefore an exact-50 S Candidate cannot be honestly dispatched from the current lineage yet. No migration credit is claimed and no smaller S batch is dispatched.

## Blocker ranking / next prerequisite

Across concrete-evidence material identities, the largest repeated unmapped primitive is `set_player_flag` (19 identities). A bounded what-if family scan found that the coherent player-flag/state family alone removes the sole current loader blocker from 9 identities:

- `master.ciel.skill.s1`
- `master.leonardo.skill.s1a`
- `master.ophelia.skill.s1a`
- `master.peperoncino.skill.s1`
- `master.shirou-emiya.skill.s3`
- `master.zouken.skill.s1`
- `servant.darius.skill.sc-darius-1`
- `servant.donquixote.skill.sc-donquixote-2`
- `servant.lance.skill.sc-lance-2`

This is a loader-unblock estimate, not migration acceptance for those identities. Every consumer still requires exact contract/source/evidence recertification before admission to the final 50 manifest.

Historical accepted #440/#441 runtime already contains an identity-free structured flag seam (`player_flag_equals`, numeric/current-round flag conditions, `set_player_flag`, `clear_player_flag`, `add_player_flag_number`, and `current_round`). A dispatches only that family as the next zero-credit B replay.

## Accounting

Formal/material remains `112/944`, remaining `832`. Exact-50 composition remains open until at least 50 unique identities pass current-main runtime prerequisite and evidence gates.
