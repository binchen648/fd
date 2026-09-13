# P3-TO-16 Special Legacy Owner / Quarantine Audit

- Owner: Codex B, planning/docs-only lane
- Date: 2026-09-14
- Runtime authorization: `NONE`
- Strict denominator: `17 abilities / 12 cards`

## Current Legacy Owner Risks

### 1. `record_master_directive` is a pseudo-protocol, not a reusable primitive

Ten strict special abilities encode unrelated semantics behind a string `directive` field. Current authoring includes directives for:

- battle-end rewards;
- command-spell timing;
- temporary immunity / ability suppression;
- victory-point awards;
- movement ignoring engagement;
- low-mana play permission;
- close/activate orchestration;
- mana-loss + power conversion.

These are different rule families. They must not be promoted as one generic `record_master_directive` runtime primitive.

Current runtime also interprets directive strings outside the effect owner. `match-session.ts` derives broad categories by substring matching tokens such as `create_independent_deck`, `draw_from_independent_deck`, `adjust_command_seals`, `set_mana`, `movement`, `deploy`, `replacement`, `extra_play`, and `reverse_dash`. This is a hidden string protocol and must be quarantined from new core routing.

**Disposition:** `QUARANTINE_AND_DECOMPOSE`.

### 2. Independent deck creation/draw

Two strict rows create and draw from Kayneth's independent deck.

Required typed owner before quarantine exit:

- stable independent-deck identity distinct from display/card names;
- deterministic card instance/order creation using server-owned state;
- owner-only projection and reconnect serialization;
- explicit setup trigger and draw legality;
- empty-deck behavior;
- no prefix/string parsing of instance IDs to discover deck membership;
- transaction/replay/idempotency evidence.

**Disposition:** `ISOLATED_SUBSYSTEM_CANDIDATE`.

### 3. Deck replacement in preparation

Kiritsugu's setup replaces a chosen deck card with Origin Bullet and crosses Card Zone, Interaction and Hidden Information boundaries.

Required typed owner before quarantine exit:

- server-derived legal replacement candidates;
- exact source/target zone validation;
- deterministic replacement/provenance semantics;
- private target projection/reconnect;
- stale/duplicate target rejection;
- typed replacement result; no direct definition-ID routing except authored payload identity.

**Disposition:** `COMPOSED_TYPED_CANDIDATE`, but not core until Interaction + Hidden + Card Zone ownership is reviewed.

### 4. Match-deck bottom intervention

Chaldeas swaps a revealed situation/event with the corresponding deck bottom. It combines strict Trigger, optional Interaction, per-round Lifecycle and hidden deck information.

Required typed owner before quarantine exit:

- authoritative revealed-card/event identity;
- correct original deck provenance;
- owner-authorized private bottom-card access;
- per-round consumption after the reviewed commit boundary;
- typed swap transaction and projection redaction;
- reconnect/stale replay proof.

**Disposition:** `COMPOSED_TYPED_CANDIDATE`, blocked on all named external gateways.

### 5. Trismegistus state-transform chain

`loss-transform` and `return-silence` encode a state-machine transition rather than two unrelated one-shot effects.

Required owner before quarantine exit:

- explicit typed state enum / transition identity;
- Trigger ownership for loss/battle-start timing;
- Lifecycle/source-validity ownership;
- Battle envelope for defeating players and source cleanup;
- reconnect persistence and duplicate transition rejection;
- no `modeState` side-channel flag as the authoritative contract.

**Disposition:** `DEDICATED_STATE_MACHINE`.

### 6. False Attendant Book identity replacement

This effect can replace servant or master identity and preserve selected player state. It changes roster identity, resources, pools and projection semantics.

Required owner before quarantine exit:

- typed identity-replacement transaction;
- authoritative unused-servant pool / replacement eligibility;
- explicit preserved/reset fields;
- once-per-game Lifecycle commit boundary;
- full card/zone cleanup and newly introduced identity initialization;
- projection/reconnect and stale replay behavior;
- fail-closed missing-asset behavior; logging a missing replacement and partially resetting resources is not an acceptable generic contract.

**Disposition:** `DEDICATED_IDENTITY_SUBSYSTEM`.

## Neighboring Legacy Risks Outside The Strict 17

`extended-effects.ts` contains many non-special or conservative-risk handlers. They are not added to the strict denominator, but they matter to deletion planning:

- direct `Math.random()` in random discard is incompatible with deterministic/replay-safe rules execution until replaced by accepted server RNG;
- generic resource/card-action helpers coexist beside special handlers, so deleting the file wholesale is forbidden;
- `modeState` arrays/flags are used as implicit persistence for multiple unrelated mechanics;
- active-area tests and card-type destination heuristics inside legacy handlers may overlap Card Zone/Lifecycle ownership;
- generic effects already having typed owners may still remain as legacy shims for unmigrated consumers.

TO-16 therefore separates **strict special quarantine** from **legacy-owner cleanup**. The two ledgers must not be merged.

## Quarantine States

| State | Meaning |
|---|---|
| `STRICT_SPECIAL_QUARANTINED` | In current authoritative `SPECIAL_SUBSYSTEM` denominator; no core-factory inheritance. |
| `COMPOSED_TYPED_CANDIDATE` | Can potentially leave special after named typed owners accept the full semantics. |
| `DEDICATED_SUBSYSTEM_REQUIRED` | Identity/state-machine/domain behavior should remain a separate subsystem even after typed implementation. |
| `LEGACY_SHIM_ONLY` | Not itself special; retained only because unmigrated legacy consumers still call it. |
| `DELETION_READY_CANDIDATE` | All consumers are migrated/accepted and independent audit proves zero reachable legacy use. |

## Non-Negotiable Boundary

Quarantine is not permission to create card-name handlers. Dedicated subsystem code must still route by typed semantic contracts and authoritative payload/state, not character/card names or translated text.
