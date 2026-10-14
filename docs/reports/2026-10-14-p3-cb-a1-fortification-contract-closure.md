# A1 Fortification Contract Closure Analysis

Task: P3-CB-A1-FORTIFICATION-CONTRACT-CLOSURE.
Epoch: FD-P3-2026-09-23-09. Planner: 831db178.
Exact main: a42b5e1c517141b90f3407773958b0d8afe63264 (remote main checked).
Input: 96788cb775c400aa3a2a8d5b1bfeb8f440772014.
Identities: Gilles s2 and Medea s2 only. Mapped 2/2.
Result: CONTENT_ADMISSION_DEPENDENCY + SCOPED_CAPABILITY_ENABLER_REQUIRED.
All implementation claims below are CONFIRMED_STATIC unless explicitly marked otherwise.
No gameplay tests or probes were run. No production writes are authorized.

## Decision Matrix

| Facet | Existing Support | Gap | Minimum Proposal | Owner |
| --- | --- | --- | --- | --- |
| Admission | Complete servant loader and executable compiler | Both archives have one skill, no deck, no production owner/card | Complete authoritative owner content or separately accepted admission design | Content Owner |
| Retention | Residual-kind cleanup, active attack_area state | Both cards have no residual kind; current reward forbids residual/source-state/lifecycle changes | Explicit genuine residual reward contract mapping plus narrow route compatibility | B after authorization |
| Reward | Authoritative round formula and typed mana/VP | No active prerequisite; real workshop deployment does not emit listened event | Active-source revalidation and reviewed location-deployment occurrence | B after authorization |

Existing components are reusable, but the whole production contract is not
closed. A residual metadata-only repair is insufficient with the current route.
No evidence justifies a broad Trigger/Battle/Lifecycle/initialization engine.
The minimum generic enabler proposal is HYPOTHESIS pending RB review and lawful
content admission; a single accepted contract delta is not yet established.

## Production Admission

The standard path requires exactly three servant skill cards and a twelve-card
deck, independently enforced by product conversion and executable compilation.
Neither selected owner/card is present in generated production rules.
No servant rules-only admission channel exists: the rules-only exceptions are
master support, master rule and event archives. servantCardFiles can load display
cards but does not create an executable rules archive or playable owner.
MatchSession instantiates character cardIds/decks, not arbitrary absent archives.

This corroborates A's finding, not a replacement for Content Owner acceptance.
Do not weaken cardinality, add dummy skills/decks, assign another owner, borrow
master support exemptions or manually edit generated output. Content Owner must
identify actual authoritative missing content or return a design dependency.

## Residual And Reward Trace

Rules 11.3/11.5 require retention after activation until close, extra attack
participation each round and cost only on first play. Current archives encode
continuous_formula and forced_trigger with no lifecycle; printed residual text
alone is not a runtime marker. MatchSession.discardRoundAttackAreaCards retains
only residual-kind abilities not explicitly discarded/closed at round end.

Changing the reward to residual alone is not safe: isDeploymentResourceRewardCandidate
requires forced_trigger, so residual falls outside typed ownership. Its generic
event execution can reach legacy. Adding requiresSourceState=active or lifecycle
to the current forced_trigger is also not accepted by the exact reward validator.
Generic canActivate does not infer source activation from residual kind.

Proposal: one identity-free active-source residual deployment-reward boundary,
using existing Card Zone active-source validation and typed resource components.
Preserve the accepted forced-trigger sibling contract unchanged. Do not create
a dummy residual ability, parse printed Chinese text, add card-ID exceptions,
or accept malformed candidates into legacy.

## Actual Deployment Producer Gap

MatchSession.deploy emits after_player_deployed_to_battlefield only for a location
tagged battlefield. magic_workshop in the actual default map is support_location.
legalDeploymentActions allows workshop, but deploying there does not execute
that event-emission branch. Both current FM05 tests directly inject the event
at workshop after manually constructing an active source in skill. They prove
component behavior only, not a real deployment producer or legal activation.

The PREPARE path description must therefore remain a component chain, not an
established MatchSession workshop-reward chain. Freeze a generic legal-location
deployment occurrence contract with RB, preserving battlefield consumer meaning
and movement/deployment separation. A specific new event name or broader change
is not approved by this analysis. If this plus admission needs multiple new
contracts, Planner must re-evaluate the bounded slice before implementation.

## Cross-Round Reuse

Shared playBatch activates a face-up skill into attack_area and pays printed
cost once. These cards cost 0 but require at least 8 mana for skill-zone play;
that requirement is not an 8-mana payment. Retention does not play the card again.
startRound resets locations and draws cards without reactivating retained attacks.
Combat authoredAttacks includes active attack_area sources without a current
playedRound filter; calculateCardPower reads authoritative current round.
These support components can reuse 16-2*round rather than a new power engine.
Actual next-round retention/attack/reward remains NOT_VERIFIED until legal admission
and real play through cleanup are tested for both cards.

Advance deployment normally precedes first action-phase play. Residual being
effective in the first play round does not authorize retroactive rewards for an
earlier deployment. Test eligible later occurrences only if independently lawful.

## Future Scope And Required Tests

Conditional authoring/registry: the two existing servant archives and pack.json;
complete other owner content requires explicit sourced paths from Content Owner.
Generated outputs only via existing compiler: content-library, fixture, evidence-report.
Possible hot files: interpreter.ts, loader.ts, executable-card-pack.ts and
match-session.ts. Formula/resource/battle components should remain unchanged.
This is a proposed upper boundary, not a production write reservation.

Future manifest must be granted from the outset:
docs/agents/manifests/tasks/P3-CB-A1-FORTIFICATION-IMPLEMENTATION.json.
Proposed test: packages/rules/tests/regression/cb-a1-fortification-production.test.ts;
also inspect/update FM05 variant, FB2 deployment reward and executable-pack tests
only under a future literal grant. A0 interpreter/loader reservation needs explicit
Planner release/transfer; freezing A0 does not itself prove release.

Required evidence: legal >=8-mana first face-up play; <8 and face-down rejection;
inactive/closed/wrong-controller/wrong-zone/missing-state rejection; real workshop
deployment, wrong player/location and movement-only controls; full cleanup and
next-round power/attack/no-repayment; malformed residual graph no fallback;
event replay and resource-failure atomicity; production restore/reconnect.
Tests must distinguish legal content instantiation from synthetic active-source
fixtures and include whole state/events/revision invariance for rejection.

## Guardrails And Handoff

Read-only historical applicability check used exact main GUARDRAILS.md and
FD-RESTORE-004.md alongside the pinned PREPARE. No preflight CLI receipt is claimed.
The nested-pending historical case is not directly this noninteractive reward;
it grants no write permission or current acceptance. Historical formula/reward
PASS does not certify full owner admission, lifecycle or event producer.

Only this report and its JSON packet were written. Packet binds exact Git blobs
and SHA-256 for sources and carrier. Content Owner findings still need confirmation;
Reviewer B verdict is pending. No PR, tests, runtime change, promotion or credit.
Ledger remains 111/944; Gate C and Release blockers remain unchanged.
