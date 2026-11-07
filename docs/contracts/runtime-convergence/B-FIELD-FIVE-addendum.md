# Five-field continuation contract — 2026-11-07

Owner Root; user authority 连续处理完成. Base493c87fa; existing six RC contracts apply. This is implementation authority and schema design, not acceptance.

Input: authoritative compiled source/actor, current player identities/resources/targets, typed effect sequence, round/revision. Output: projected legal action or explicit atomic rejection, committed state changes and entitled public/private projection. Failure rolls back the Session command; no partial payment/events/revision. Restore reuses existing typed context and rejects stale/duplicate requests.

Exact VP cost: cost transfer_vp_to_owner with payment=exact, unique recipient.masterId and equal exemptIf.controllerMasterId. Recipient must be current active identity and source owner/provenance. Exemption is current identity, never owner equality. Pure preflight is shared by projection/dispatch; exact transfer before effects; invalid recipient/source or insufficient balance refuses. No clamped gift semantics.

Terrain: distinguish `terrain_bonus.layer=base` from existing A2 final-terrain bonus. Final=(printed base + base bonuses)*multipliers + existing final bonuses. Expiry/source validity bound to installation; base0 supported without assigning a slot. No-role-hardcoded effects.

Placement: move_card placement.kind=battlefield_effect, location=controller.location, effectsFrom=card_definition, emitPlayEvents=false. Only exact supported static reversal, deployment reward, self immunity, battle-end return are adopted. No arbitrary abilities, phase actions or on-play events replayed. Card must be unique associated instance, actual battlefield, owner/provenance valid. Anchor persists independently of controller movement; leave/close/return ends effect. Existing on-board card cannot be duplicated. Same-anchor power modifier adds total once; foreign-anchor does nothing.

Origin: lower accepted target snapshot request AST to existing typed number input after target validation. Parameterize typed mana primitive with selected victim, protection hook and same-resolution signed actualAmount. Typed source-power modifier consumes actualAmount*-2; no generic legacy fallback. Unknown/future/wrong type bindings reject before execution. Normal9->6 yields2->8, immunity yields0 delta and remains2. No persistent shadow binding store.

Tests: L1 real Session actual effect/cost/projection/negative; L2 combinations/source/target changes/restore/repeat. Freeze final SHA then fullCI and seven-player L3 plus independent review. No automatic acceptance/merge.
