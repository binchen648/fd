# P3-FB2-39 Triggered Residual CLOSE Handoff

- Owner: Codex B2, shared runtime capability
- Status: `READY_RUNTIME_OWNER`
- Runtime Base: `1a57ee8443611e6c32fab4fee9ed8afd7e98c3d1`
- Maximum Claim: `IMPLEMENTATION_COMPLETE_CANDIDATE`
- Migration Credit: `0`
- Trigger: R81 Darius same-Candidate review conflict; see `2026-09-20-p3-a-r81-darius-close-review-conflict.md`

## Exact Contract

Extend semantic-form routing for a residual ability whose trigger is `after_battle_ended`, whose effect is one `close_source_card`, and whose conditions are the source-active check plus accepted FB2-38 current-round combat-loss-absence check. Reuse the typed CLOSE operation and its source identity, validation, visibility, event, and atomicity semantics. Do not broaden `on_card_played` CLOSE or equate every `close_source_card` with this contract.

The route must be independent of card/ability ID, printed text, and roster membership. A malformed or unsupported would-be migrated shape must fail closed, not fall through to `resolveExtendedEffect`. Preserve legacy behavior only for shapes outside this accepted route; list them explicitly.

## Required Evidence

- Gate A: compiler/route positive and negatives for wrong trigger, missing/extra conditions or effect, invalid source identity/controller/zone/active/face state, malformed FB2-38 provenance, and unknown form. Demonstrate no mutation, resource payment, or event on failure.
- Gate B: real `MatchSession.resolveBattlePhase` post-scoring terminal event. Prove no represented loss closes once; represented loss preserves source; non-participation is not loss; stale or non-terminal provenance fails closed. Assert zone, runtime active state, owner-only visibility, exact `source_card_closed` event with source/controller identity, and no duplicate event on replay.
- Atomicity: a failure after close validation must roll back source movement, active/visibility changes, lifecycle cleanup, and event emission together.
- Regression: existing Artoria Alter `on_card_played` typed CLOSE remains unchanged; shared route is not a Darius-specific extended-effects case.
- Review packet: name exact runtime owner, before/after legacy/new/dual counts, skipped semantic shapes, and any secondary runtime path retained. No inherited Gate C from an unrelated CLOSE contract.

## Boundaries

B2 may edit the shared compiler/interpreter/runtime and focused regression tests needed for this contract, subject to exclusive hot-file ownership. B2 must not edit `data/authoring/**`, generated packs, S Darius content/test branch, coverage taxonomy, or A/R acceptance records. B2 must not promote its own Gate status or migration count.

After independent R accepts the capability, A synchronizes it. S then re-certifies the exact Darius consumer against the accepted runtime; R must independently review that integrated behavior before A can resolve the contested `+1`.
