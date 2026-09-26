# P3-B Sigurd Revealed-Source Generic Capability Result

Role: Codex B
Status: `IMPLEMENTATION_CANDIDATE_READY_FOR_FRESH_R`
Date: 2026-09-27
Task: `P3-B-SIGURD-REVEALED-SOURCE-CAPABILITY`
Classification: bounded zero-credit capability/readiness task

## Exact input / owner continuity

- Exact Base: `fe37f27e17007af77573ab99e02b40870d62d532` — accepted Siegfried A-sync/accounting.
- Current formal owner remains `servant.sigurd`; this capability task does **not** migrate a Sigurd frozen identity.
- Current-main strict formal accounting remains `129/944`; remaining `815`.
- After this capability is independently accepted and A-synchronized/rescanned, execution returns to `P3-S-OWNER-SIGURD-COMPLETE-MIGRATION` for all three frozen Sigurd skills together.

## Why this bounded seam is required

Locked source/confirmed-override recertification for the current Sigurd owner requires generic mechanics that the accepted Base cannot author/execute:

1. a physical skill card being *revealed* must remain a persistent fact after the card stops being active;
2. a revealed source may grant all controller basic attacks a card-local Action ability (`pay 2 mana -> double that card's base power -> remove it after battle`);
3. another card may gain attributes conditionally from specifically authored owned definitions having been physically revealed;
4. an after-battle residual may select exactly one attack played this round by an opponent who actually fought the controller at the controller's battlefield and gain mana equal to that physical attack's trusted paid play cost;
5. a trusted round-start trigger is required for source-revealed curse consumers.

The locked reference explicitly distinguishes “physical card revealed” from merely “active”, requires the granted basic action to belong to the basic card itself, and requires exactly one eligible opponent attack when multiple refund candidates exist.

## Implemented generic capability

No Sigurd/card-id/name/printed-text identity routing is introduced.

- `revealed-card-mechanics.ts` defines strict exact-shape validators and generic physical reveal state derived from the trusted physical card play record plus face-up state.
- `source_revealed` is a strict generic condition.
- A strict passive marker may grant controller-owned `basic_attack` cards one synthetic, data-driven Action ability. The granted ability belongs to the physical basic card, costs exactly 2 mana, doubles that card's base power, is card-local once per round, and marks that physical card for removal at the trusted `after_battle_ended` terminal event.
- `CardRuntimeState` carries the bounded authenticated state (`basePowerMultiplier=2`, `removeAfterBattleRound=<round>`); restore validation admits only the exact bounded multiplier and a positive safe round.
- Conditional revealed-definition attribute markers append only exact authored attributes when the referenced controller-owned physical definition has a trusted revealed play record.
- A strict after-battle target constraint uses the trusted battle-terminal participant set plus current battlefield location to limit refund candidates to attacks controlled by an opponent from the controller's fight. The refund consumes that physical card's trusted `paidManaOnPlay` for the current round.
- `advanceAbilityPhase` emits one trusted `round_start` ability event only when the round number advances; existing phase event behavior remains intact.

## Fail-closed coverage

The focused capability regression widens each new authoring seam with an unsupported extra field and verifies loader rejection:

- `source_revealed` condition;
- revealed-source basic-action grant marker;
- battle-opponent target constraint;
- selected-card paid-cost refund effect;
- conditional revealed-definition attribute marker.

Runtime state restore validation also bounds the two new card-state fields rather than accepting arbitrary transform values.

## Verification

- focused generic capability: `5/5 PASS`;
- affected serial chain: `7 files / 159 tests PASS` (capability regression, resolution-dataflow, battle-loss reveal, authoring interpreter, executable-card-pack, MatchSession, combat resolver);
- `npm run typecheck`: PASS;
- `npm run content:validate`: PASS — `7 masters / 11 servants / 20 events / 0 blocking issues`;
- `npm run verify:generated-content`: PASS, unchanged deterministic hashes;
- `git diff --check`: PASS;
- production rules identity-routing audit: `servant.sigurd`, `sc-sigurd`, `齐格鲁德`, all three Sigurd skill names, and `SkillLib` = `0` hits.

## Accounting / review boundary

This task is zero-credit capability/readiness work. It does not add authoring for the three Sigurd frozen consumers and does not change `129/944`.

Allowed review verdicts:

- `IMPLEMENTATION_ACCEPTED_CANDIDATE`
- `IMPLEMENTATION_NEEDS_REVISION`
- `MIGRATION_BLOCKED` only for an external Reviewer-attempt blocker

The exact Candidate SHA is frozen by the commit containing this report. After ACCEPTED, A must synchronize/rescan this capability and return to the same `servant.sigurd` owner; no next-owner transition is permitted here.

## R1 successor revision

R1 on predecessor Candidate `986b04be707911b8f741ffc4f7bf33da8f59fe50` returned `IMPLEMENTATION_NEEDS_REVISION`; canonical Coordinator bounded relay of that same completed attempt: `https://github.com/binchen648/fd/pull/461#issuecomment-5848501887`.

Both exact-scope findings are closed in the successor revision:

1. revealed-source derived capabilities now require both the source card definition and the specific authored ability to remain executable `automatic`; loader-disabled/unsupported abilities cannot synthesize the granted basic action or conditional attributes;
2. the remove-after-battle marker is consumed only by the canonical current-round battle terminal identity (matching `battlePhaseResolutionId` and terminal event id), so an unproven same-name event cannot remove the card.

Successor-focused verification: revealed-source capability `6/6 PASS`; affected serial chain `7 files / 160 tests PASS`; typecheck/content validate/generated determinism/diff-check PASS. Formal accounting remains `129/944` because this task is zero-credit.
