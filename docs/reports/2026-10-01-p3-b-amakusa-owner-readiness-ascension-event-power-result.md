# P3-B Amakusa Owner Readiness — Ascension Event-Power Result

Date: 2026-10-01
Owner: `master.amakusa`
Task: `P3-B-AMAKUSA-OWNER-READINESS-ASCENSION-EVENT-POWER`
Exact Base: `7f93b79699b510ced3a4851561613c3b2f359c28`
Classification: bounded zero-credit generic ascension-unlock terminal + exact event-bound basic-card Power authority

## Boundary

This Candidate closes only the last registered Amakusa readiness family. It does not materialize any `master.amakusa` canonical consumer under `data/authoring/**`, does not grant migration credit, and does not by itself close the parent owner-readiness task.

Strict accounting remains `189/944`, remaining `755`. Canonical Amakusa authoring remains `0/5`.

After a fresh independent Reviewer accepts this Candidate, FORMAL must perform one full-owner readiness A-sync/rescan across ascension + s1 + s1a + s2 + s3 before any owner-complete consumer migration may start.

## Frozen source recertification

The frozen ascension text contains two independent obligations:

1. After the ascension card is authoritatively unlocked, every opponent immediately loses exactly 2 ordinary Command Seals, floored at zero.
2. When the exact authored event referenced by the ascension clause is activated, the controller's basic cards gain +4 Power while that exact event placement remains active.

The implementation does not route by Amakusa identity, printed Chinese event name, card name, or legacy handler id. The event definition identity is supplied explicitly by authoring through `activation.eventDefinitionId`.

## Generic implementation

`master-ascension-event-power-capability.ts` adds two exact privileged semantic shapes:

- `ascension_unlock_opponents_lose_command_seals`
  - forced trigger `after_master_ascension_unlocked`;
  - amount exactly 2, floor exactly 0.
- `named_event_basic_attack_power_bonus`
  - forced trigger `event_activated` plus explicit `eventDefinitionId`;
  - amount exactly +4, duration exactly `while_event_active`.

The existing master-ascension unlock authority remains responsible for moving the ascension definition from outside-game to the controller's skill zone. Only a newly created ascension physical card emits the authoritative unlock event, so repeated unlock attempts cannot repeat the seal loss.

The ascension provider is validated through the complete source chain: current Master ascension physical -> `generatedBy` unlock source -> current controller servant definition -> accepted generic master-ascension unlock ability. The same provenance is revalidated at resolution, Power calculation and restore.

## Event / Power authority

Event placements receive a stable server-owned `ruleInstanceId`. An authoritative `event_activated` ability-system event is emitted when:

- a public event is placed;
- a hidden Shinto event is revealed at action start;
- a hidden battlefield event is revealed by the battle resolver.

Battlefield reveal emits the event activation before the same-battle Power snapshot, so an exact matching event contributes +4 during that battle rather than one battle late.

The runtime authority is bound to controller, ascension source/ability, exact event definition, exact physical event placement rule instance, location, triggering processed event, round and amount. `calculateCardPower` applies +4 only to controller-owned/controller-controlled `basic_attack` definitions. Non-basic cards and other players receive no bonus.

If the exact event placement is claimed/discarded during the round, the authority is reconciled away. Round-end also expires it. Restore validation rejects stale, missing, duplicated or forged event placement/provider/trigger records.

## Verification

Final focused / predecessor readiness regressions:
- ascension event-power: `7/7 PASS`;
- member-skill-copy: `7/7 PASS`;
- linked-role core: `10/10 PASS`;
- aggregate: `24/24 PASS`.

The ascension suite specifically covers:
- exact whole-ability gateway rejection of widened semantics;
- opponent seal loss with floor zero and no duplicate loss on repeated unlock;
- exact event definition matching;
- controller basic-card-only +4 Power;
- hidden battlefield reveal applying before the same battle Power snapshot;
- round-end cleanup;
- forged event placement, ascension controller, `generatedBy`, current-servant drift and runtime record restore failures;
- production identity-free implementation.

Final affected/shared gates on the frozen pre-commit tree:
- authoring-interpreter: `38/38 PASS`;
- executable-card-pack: `50/50 PASS`;
- MatchSession: `33/33 PASS`;
- aggregate shared affected: `121/121 PASS`;
- explicit focused + shared aggregate: `145/145 PASS`.

- `FD_TOOLCHAIN_OK` / typecheck PASS.
- content validate: `10 masters / 19 servants / 20 events / 0 blocking issues`.
- generated determinism unchanged:
  - content-library `cde732266c8ca18995ddacb54a4fd1f273379c4ea2497fdf672218949edd0e3b`
  - fixture `87542f5da07effcf6bba03efd963ae964dde99af4f6c3c63352225e870c96e6c`
  - evidence-report `d49a5ca87cf614cbba8140b1890225a51548c11479551577033f37615407c7a2`
- `data/authoring/**` delta EMPTY.
- changed-production Amakusa / printed-name / legacy-handler identity audit CLEAN.
- `git diff --check` PASS.

## Disposition

`IMPLEMENTATION_COMPLETE_CANDIDATE` for this bounded zero-credit final Amakusa readiness subtask only.

Parent `P3-B-AMAKUSA-OWNER-READINESS-CAPABILITY` remains open until fresh R acceptance followed by FORMAL full-owner readiness A-sync/rescan. Accounting remains `189/944`, remaining `755`.