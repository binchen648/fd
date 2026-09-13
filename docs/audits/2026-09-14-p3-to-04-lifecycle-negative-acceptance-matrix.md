# P3-TO-04 Lifecycle Gateway Negative Acceptance Matrix

- Owner: Codex B, specification lane only
- Status: `SPEC_REVIEW_READY`
- Runtime authorization: `NONE`
- Purpose: define fail-closed cases that a later Lifecycle Gateway runtime must prove before any migration or Gate claim.

## Negative Cases

| # | Case | Required result | Mutation allowed | Legacy fallback allowed |
|---:|---|---|---|---|
| 1 | lifecycle source card instance missing | reject admission/transition | none | no |
| 2 | lifecycle source ability missing | reject admission/transition | none | no |
| 3 | client supplies lifecycle source/controller identity | reject client authority | none | no |
| 4 | runtime eligibility branches on named card/ability | reject design/runtime candidate | none | no |
| 5 | runtime parses translated/printed text to recover duration/limit | reject design/runtime candidate | none | no |
| 6 | duplicate active lifecycle install for non-stacking policy | reject/idempotent no duplicate | none beyond original install | no |
| 7 | zero/negative/non-integer `uses` | reject admission | none | no |
| 8 | zero/negative/non-integer `rounds` | reject admission | none | no |
| 9 | unknown usage cadence or scope | reject admission | none | no |
| 10 | unknown usage consumption boundary | reject admission | none | no |
| 11 | optional prompt creation consumes a per-round/per-game use | forbidden; no consumption | none | no |
| 12 | declined optional interaction consumes use | forbidden; no consumption | none | no |
| 13 | cancelled/forbidden cancellation consumes use | forbidden; no consumption | none | no |
| 14 | stale/unauthorized interaction consumes use | reject with no consumption | none | no |
| 15 | failed effect transaction consumes `successful_effect_commit` use | rollback count with effect | none | no |
| 16 | failed card-play transaction consumes `successful_card_play_commit` use | rollback count with play | none | no |
| 17 | duplicate replay of committed use increments counter twice | idempotent/reject duplicate | none beyond first commit | no |
| 18 | per-round count resets on reconnect/projection | forbidden | none | no |
| 19 | per-round count leaks into next authoritative round namespace | new round must get correct fresh availability | only accepted round transition | no |
| 20 | per-game count resets on round change | forbidden | none | no |
| 21 | per-game count resets on ordinary zone movement/reconnect | forbidden | none | no |
| 22 | same-definition new card instance inherits old `this_card` count | forbidden | none | no |
| 23 | transformed/replaced ability silently adopts old usage/lifecycle state | reject unless explicit reviewed transfer exists | none | no |
| 24 | delayed first-trigger consumer lacks explicit schedule-vs-effect consumption boundary | remain runtime-blocked | none | no |
| 25 | unique group missing semantic `groupId` | reject admission | none | no |
| 26 | unique group missing authoritative trigger-window identity | reject claim | none | no |
| 27 | opening yes/no prompt claims unique group | forbidden | none | no |
| 28 | decline/cancel/stale optional decision claims unique group | forbidden | none | no |
| 29 | two concurrent choices commit the same unique group/window | exactly one may commit; loser rejects/rolls back | first valid commit only | no |
| 30 | unique claim uses card ID instead of semantic groupId | reject design/runtime candidate | none | no |
| 31 | duplicate trigger-window processing reopens a closed unique group | reject/no-op | none | no |
| 32 | `while_card_active` source is already inactive/closed/missing at install | reject install | none | no |
| 33 | source leaves active area but lifecycle-owned state remains live | composed transition must clean state or roll back | atomic external move + cleanup only | no |
| 34 | Lifecycle itself moves/closes source for `when_card_leaves_active_area` | reject ownership violation | none | no |
| 35 | external CLOSE commits source movement while mandatory lifecycle cleanup fails | whole composed source transition rolls back | none | no |
| 36 | source definition/ability changes but old lifecycle remains attached without transfer policy | terminate/cleanup or remain blocked according reviewed transition; no silent adoption | accepted transition only | no |
| 37 | `round_count` policy omits explicit boundary convention | reject admission | none | no |
| 38 | fixed-duration expiry lacks resolved cleanup destination when movement is required | reject admission/runtime route | none | no |
| 39 | cleanup destination guessed from translated name/card ID/current zone | reject design/runtime candidate | none | no |
| 40 | duplicate round-boundary processing expires/moves source twice | idempotent/reject duplicate | original expiry only | no |
| 41 | failed expiry cleanup partially moves card but retains old lifecycle | rollback entire composed expiry | none | no |
| 42 | `remain_active` performs automatic round-end source movement | forbidden | none | no |
| 43 | `remain_active` prevents another accepted rule from closing/removing source | forbidden; it is not immunity | accepted external rule only | no |
| 44 | lifecycle cleanup changes Battle result/power arithmetic directly | reject ownership violation | none | no |
| 45 | lifecycle cleanup reveals hidden source/private data | reject projection/cleanup path | none | no |
| 46 | reconnect reinstalls lifecycle state or increments usage | forbidden | none | no |
| 47 | reconnect replays terminal expiry/source cleanup | reject/no-op duplicate | none | no |
| 48 | client supplies usage count, unique claim, reset, expiry, cleanup destination, or transfer record | reject client authority | none | no |
| 49 | corrupt serialized lifecycle state lacks policy/source/transition identity | fail closed on restore/admission | none | no |
| 50 | unsupported external Trigger/Interaction/Battle/Hidden/Modifier/Special dependency is treated as lifecycle-complete | keep consumer blocked | none | no |
| 51 | failure in later lifecycle command rolls back an earlier committed command | forbidden cross-command rollback | earlier commit remains | no |
| 52 | failed lifecycle transition appends terminal/history/revision evidence | rollback failing transition evidence | none | no |
| 53 | distinct later valid use is suppressed merely because policy/source values resemble an earlier transition | allow new transition when authoritative identity differs and policy permits | valid new commit | no |
| 54 | modifier-local lifecycle metadata is counted as a new ability denominator row without corrected taxonomy evidence | reject coverage/classification change | none | no |
| 55 | `while_card_active` lacks resolved accepted source-validity policy | reject admission/runtime route | none | no |
| 56 | Lifecycle hard-codes `field`, `attack_area`, or other zones instead of consuming source-validity policy | reject design/runtime candidate | none | no |
| 57 | fixed-duration policy lacks resolved scheduler expiry boundary/order policy | reject admission/runtime route | none | no |
| 58 | expiry is driven by ad-hoc phase polling/card-specific branch rather than resolved scheduler boundary identity | reject design/runtime candidate | none | no |

## Preservation Set For Failing Dispatches

Unless a separate earlier command is already committed, a failing lifecycle dispatch preserves:

- usage counters and unique-window claims;
- live and terminal lifecycle records;
- card zones, controller/owner, visibility, active/closed state;
- modifier/visibility/persistence records;
- resources, battle state, location, phase, and priority;
- Trigger/Interaction pending state;
- transition/event/log history;
- revision.

## Reviewer Sampling

Independent review should sample at least one case from each class:

1. source identity / generic routing;
2. usage consumption and reset;
3. unique group/window arbitration;
4. source close/leave-active-area composition;
5. fixed duration / cleanup destination;
6. `remain_active` semantics;
7. reconnect/replay/idempotency;
8. external-owner / hidden-information boundary;
9. rollback / cross-command preservation.

This matrix is specification evidence only. It does not claim current runtime already enforces every row.