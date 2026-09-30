# P3-B Akasha Owner Readiness Location Provisioning Follow-up

Role: Codex B / FORMAL readiness follow-up
Status: `IMPLEMENTATION_COMPLETE_CANDIDATE`
Date: 2026-10-01
Base: `d57ceeb3b1796db1a2069e446b7841b5763ae367`
Classification: bounded zero-credit follow-up readiness gap discovered during Akasha formal materialization preflight

## Why this follow-up exists

The accepted Akasha readiness/A-sync correctly covered the Vessel-cycle state machine and the skill-zone provisioning half of `s1【命理】`, but formal consumer preflight exposed one missing generic authority: the frozen clause also requires one temporary `s6【过负荷】` physical copy at **each enabled battlefield**, and later `【沸腾】` depends on authoritative `cardState.placedAtLocationId` provenance.

The existing generic `create_card` effect can create a card in a zone but cannot assign authoritative battlefield location provenance. Therefore formal materialization is paused; no Akasha consumer authoring is created in this transaction.

## Exact generic closure

Adds one identity-free exact privileged Vessel-cycle effect:

`vessel_cycle_game_start_battlefield_provision`

Accepted shape:
- `cycleKey`: structural runtime namespace only;
- `targetDefinitionId`: exact target definition from authoring;
- `temporaryAtEachBattlefield: true`;
- forced trigger exactly `game_start`;
- no conditions/targets/cost/creates/rule modifiers/lifecycle/limit/visibility widening.

Resolution enumerates current `getEnabledLocations(...).filter(tags includes battlefield)` and ensures exactly one generated controller-owned target-definition physical copy per enabled battlefield, with exact `generatedBy` source and `cardState.placedAtLocationId`. Repeated delivery of the same game-start semantic is idempotent; more than one matching source-generated copy at the same battlefield fails closed.

The skill-zone copy remains the responsibility of the already accepted generic `provision_skill_cards` contract; this follow-up does not duplicate that authority.

## Boundary

- no `data/authoring/**` delta;
- no Akasha/card-name/printed-text/`core.akasha-*` production identity routing;
- no migration credit;
- strict accounting remains `173/944`, remaining `771`;
- formal Akasha owner-complete migration stays blocked until this exact follow-up Candidate is independently accepted and A-synced.

## Verification

- Akasha Vessel-cycle focused regression including exact battlefield provisioning, idempotence, and widened-shape rejection: `17/17 PASS`;
- focused + game-start provisioning + outside-game placement + executable pack group: `86/86 PASS`;
- authoring/content/complex group: `131/131 PASS`;
- MatchSession: `33/33 PASS`;
- MatchSession restore regressions: `11/11 PASS`;
- affected aggregate: **`261/261 PASS`**;
- `FD_TOOLCHAIN_OK`;
- typecheck PASS;
- content validate/compile PASS: `7 masters / 19 servants / 20 events / 0 blocking issues`;
- generated determinism PASS;
- `data/authoring/**` delta EMPTY;
- production identity audit CLEAN;
- `git diff --check` PASS.

## Next transaction

Freeze one exact zero-credit readiness follow-up Candidate / one PR / one fresh independent Reviewer. ACCEPTED -> one FORMAL A-sync/rescan; then resume `P3-S-OWNER-AKASHA-COMPLETE-MIGRATION` for all eight frozen identities together.