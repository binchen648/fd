# Phase 3 Throughput Scheduler Rebase

- Date: 2026-09-21
- Scope: coordinator / dispatch policy only
- Runtime change: none
- Migration credit: none
- Exact starting Base: `822b5f9dfd05a64a5707fcb945b8b85eff2238e6`
- F1 accepted evidence: `59f145434695d29bdd17e4cb3adc887e84182377`
- Formal migration state at rebase: `151/944`, `793` remaining

## Why this rebase exists

The post-`141/944` migration-credit-first scheduler changed execution from the earlier throughput-oriented readiness overlays to a repeated pattern of: locate the first zero-gap singleton, otherwise add the narrowest B2 seam for one closure target. That preserved correctness, but it also made `batch-first` / `large-group-first` explicitly `SUPERSEDED` and created repeated zero-credit B2 -> singleton S cycles.

This document supersedes that **future scheduling rule only**. Historical dispatches, acceptance evidence, and accounting remain historical facts and are not rewritten.

The already-dispatched `P3-FB2-49-OPPONENT-CLOSE-TO-ONE-INTERACTION` / PR #415 remains valid and must finish its exact review/revision cycle. This rebase governs the next dispatch after that in-flight task reaches a terminal reviewer outcome and required A synchronization.

## Mechanical 151/944 baseline

The current branch-local frozen authoring overlap is `146/944`. Formal accounting is `151/944` because five independently accepted identities live on parallel historical material and must not be migrated or credited again:

- `master.kadoc.skill.s3`
- `master.ophelia.skill.s5`
- `master.ophelia.skill.s6`
- `master.ophelia.skill.s7`
- `servant.ibaraki.skill.sc-ibaraki-1`

Therefore the exact formal remaining set is `793` identities.

Against the accepted F1 catalog, those 793 currently split as:

| F1 route | Remaining identities | Meaning |
| --- | ---: | --- |
| `READY_EXISTING_CONTRACT` | 2 | F1 classification only; current whole-card readiness still needs exact-baseline proof. |
| `READY_GENERIC_EXTENSION` | 177 | F1 says reusable generic runtime composition is appropriate; this does not by itself prove today's runtime is sufficient. |
| `SPECIAL_HANDLER_CANDIDATE` | 614 | F1 conservative special classification; it does **not** mean 614 one-off implementations are required. |

A structural F1 grouping also proves that special rows still contain real multi-card/subsystem opportunities. Examples among the remaining set include `core.wodime-lostbelt-system` (11), `core.wallachia-tatari` (9), `core.kiara-secret-gardens` (8), `core.akasha-reincarnation` (7), and `core.sion-chaldea-training` (7). These are planning evidence only; each still requires current-runtime re-overlay before migration or runtime implementation.

## Effective scheduler after FB2-49

Before any new B2 dispatch or new singleton S dispatch, A must perform a **full remaining-set readiness overlay** on the exact synchronized runtime baseline. Do not stop after finding the first candidate.

Every remaining identity must land in exactly one current-baseline bucket:

1. `PROVEN_S_READY` — complete whole-card reconstruction/probe is zero-gap on accepted runtime.
2. `ONE_NARROW_GAP` — exactly one bounded missing semantic seam remains.
3. `MULTI_GAP` — two or more independent missing semantics/dependencies remain.
4. `SPECIAL_REVIEW` — F1 special/subsystem classification still needs current generic-vs-special re-evaluation before scheduling.
5. `FORMALLY_ACCEPTED` — already credited; exclude from dispatch even if absent from branch-local material.

The overlay must record exact IDs, exact accepted contracts used, exact residual gaps, and the evidence/probe used to justify each `PROVEN_S_READY` claim. Historical F1 labels alone are not enough.

### Dispatch priority

After the full overlay:

1. close any already-reviewed exact Candidate that only needs mechanical A synchronization;
2. dispatch the **largest honest zero-gap S batch**, normally 10-40 identities when one accepted semantic envelope genuinely covers that set;
3. if no 10+ batch exists, dispatch the largest smaller homogeneous zero-gap group;
4. dispatch a singleton S only when it is the largest honest ready set or materially blocks a larger ready family;
5. only when no honest zero-gap S work exists may A dispatch new zero-credit B2 runtime work;
6. when B2 is necessary, prefer a bounded identity-free gap that unlocks the most exact remaining consumers on the current overlay. Do not broaden semantics merely to increase the count, and do not combine unrelated gaps into one runtime task.

This supersedes the future-use instruction to stop at the first `S_READY_NOW` singleton and the blanket statement that histogram-first / batch-first / large-group-first scheduling is superseded.

## Reviewer throughput rule

Fresh independent R remains mandatory wherever the current contract requires it. Exact Base/Candidate binding, no merge/retarget, and no pre-credit rules are unchanged.

To avoid one-finding-per-round review churn, R should continue reviewing the **same exact task / exact Base->Candidate diff / declared contract scope** after finding a blocker and report all other independently confirmable findings in that same review. R must not widen into sibling skills or future tasks.

R may stop early only when a prerequisite is invalid, the reviewed input changes, or a repair is genuinely required before the rest of the declared scope can be meaningfully evaluated.

Worker revisions should then close all findings from that exact review together, produce one new Candidate, and request one fresh R for that new Candidate.

## Pre-R implementation check

Before requesting R, the implementer should exercise the failure surfaces relevant to the task in one pass: malformed/missing/extra metadata, ownership/controller/source drift, stale/replay behavior, queue/continuation integrity where applicable, raw exception boundaries, and atomic no-mutation-on-rejection. This is preparation for R, not a substitute for independent review.

## Non-goals

This rebase does not:

- change F1 source truth or redo F1 normalization;
- declare any of the 793 identities currently migratable without a current-baseline whole-card proof;
- promote a broad capability merely because an F1 family is large;
- reduce independent review requirements;
- grant migration credit;
- modify PR #415 Candidate scope;
- authorize merge or retarget.
