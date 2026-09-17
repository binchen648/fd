# P3-TO-05 Independent Reviewer Checklist

- Implementer: Codex B
- Review owner: Codex R
- Date: 2026-09-13
- Implementer status: `SPEC_REVIEW_READY`
- Allowed reviewer outcomes: `SPEC_ACCEPTED`, `PLAN_NEEDS_REVISION`, `FAILED`
- Runtime/Gate effect: none

## 1. Scope Guard

- [ ] Review range is `146213f..P3_TO_05_HEAD`.
- [ ] Exactly three P3-TO-05 files are present in that range: contract, corrected 18/11 map, and checklist.
- [ ] No runtime, protocol, projection, E2E, classifier, taxonomy, generated artifact, automation test, or card authoring file changed in that range.
- [ ] No Gate A/B/C promotion or Phase PASS is claimed.
- [ ] No P3-B12 representative is hardcoded or dispatched by these documents.
- [ ] Trigger, Lifecycle, Battle, Hidden Information, Modifier, and Special Subsystem responsibilities remain external.

## 2. Inventory Reconciliation

- [ ] Corrected taxonomy baseline `146213f` is the parent of the reviewed P3-TO-05 commit.
- [ ] `explicitInteractionAbilities=18` is represented by exactly 18 unique ability IDs.
- [ ] `strictPendingInteractionAbilities=11` is represented by exactly 11 unique ability IDs.
- [ ] The 11 are explicitly treated as a subset of the 18, not added to form 29.
- [ ] Achilles Blue Sky has only `BRANCH_CHOICE`; its fixed `pay_mana(3)` is not an amount interaction.
- [ ] The six `CHOOSE_N_CARDS`, six `YES_NO`, one `BRANCH_CHOICE`, three `CHOOSE_LOCATION`, zero `CHOOSE_AMOUNT`, one `CHOOSE_ONE_PLAYER`, and one `RESPONSE` memberships match the corrected authority.
- [ ] Automatic condition branches in Gain Mana or VP, Blooming Netherworld, Drake Reward and Move, and Golden Eater are not classified as player interaction.
- [ ] Structured target `visibility` and private-zone scope classify Magus Killer, Drake Mount Summon, Golden Eater, and every other affected target accurately.
- [ ] `CHOOSE_AMOUNT` and `ORDER` have contracts but current inventory denominators of zero.
- [ ] The mapping does not modify or reinterpret coverage taxonomy.

Suggested mechanical review:

```powershell
git diff --check
git diff --name-only
Select-String -Path docs/audits/2026-09-13-p3-to-05-interaction-ability-map.md -Pattern '^\| [0-9]+ \|'
```

## 3. Server Authority And Identity

- [ ] Interaction IDs are server-generated, stable across reconnect, and replay-protected after terminal settlement.
- [ ] Entity targets use stable kind plus ID, never display text or list index.
- [ ] Card targets distinguish card instance identity from definition identity.
- [ ] The client submits intent only; candidates, continuation, costs, effects, and typed result bindings remain server-owned.
- [ ] Current-state legality is revalidated at settlement rather than trusting projected candidate membership.
- [ ] Composite interactions use a new interaction ID and revision per stage.

## 4. Template Completeness

- [ ] Target contract covers kind, cardinality, distinctness, visibility, ownership, and current legality.
- [ ] Response contract covers timing/window ownership, allowed response identity, decline, and cost/source revalidation.
- [ ] Branch contract permits only exact server-authored option IDs.
- [ ] Yes/no contract distinguishes decline from generic cancellation.
- [ ] Amount contract requires finite integer bounds and step validation plus current affordability/bound revalidation.
- [ ] Order contract requires an exact permutation with no insertion, omission, duplication, or substitution.
- [ ] Unsupported template compositions fail closed.

## 5. Projection And Privacy

- [ ] Owner and non-owner projections are separately defined.
- [ ] Non-owner projection cannot expose private candidate IDs, hidden card definitions, private ordering, continuation, or bindings.
- [ ] Candidate count is redacted when count itself reveals private information.
- [ ] Reconnect restores the same authorized owner view without recreating or resolving the interaction.
- [ ] The contract does not claim that `owner_only` replaces a future Hidden Information contract.

## 6. Revision, Reconnect, And Replay

- [ ] `expectedRevision` is mandatory at protocol and authoritative handler boundaries.
- [ ] Missing and stale revision rejection is mutation-free, including events, logs, pending state, and revision.
- [ ] Reconnect/projection does not increment revision.
- [ ] Old-socket close after replacement connection cannot invalidate the active client session.
- [ ] Duplicate settlement and terminal interaction replay are rejected.
- [ ] Existing E2E/server patterns are referenced only as equivalent facilities; P3-TO-07 is not marked complete.

## 7. Cancel, Timeout, And Transactions

- [ ] Cancellation defaults to forbidden and requires an explicit per-template policy.
- [ ] Browser/socket loss is not cancellation.
- [ ] Timeout is disabled unless a deterministic server-clock deadline and terminal policy are authored.
- [ ] Timeout never auto-selects a target, amount, branch, response, or order.
- [ ] A failing dispatch rolls back all mutation from that dispatch.
- [ ] A later interaction-stage failure does not roll back an earlier successfully committed command.
- [ ] Terminal transitions are immutable and idempotent.

## 8. Fail-Closed And Legacy Bypass

- [ ] Compiler/admission rejects malformed contracts and recognized-but-inexact route candidates.
- [ ] Runtime rejects wrong owner, ID, revision, template, candidate, cardinality, amount, order, timing, or continuation with no mutation.
- [ ] Recognized gateway failures cannot call legacy `resolveEffect`, legacy pending selection, or card/ability-ID fallbacks.
- [ ] Rejection preservation explicitly covers resources, zones, statuses, phase, priority, pending state, events, logs, and revision.
- [ ] The contract keeps downstream typed primitive settlement outside interaction mechanics.

## 9. Representative Selection Review

Do not select a representative while reviewing only formal completeness. After the contract is accepted, compare candidates using the map and record a separate dispatch decision.

- [ ] Candidate comparison excludes or explicitly blocks Trigger, Lifecycle, Battle, Hidden/Private, Modifier, and Special Subsystem coupling.
- [ ] Public candidate visibility is preferred for the first slice unless a private interaction is explicitly required and separately authorized.
- [ ] Required downstream primitives already have accepted production behavior.
- [ ] The production window can be reached naturally for Gate C; a restore fixture alone is not sufficient for the full chain.
- [ ] Existing Golden Eater or other pilot evidence is treated as a control, not automatic family-wide inheritance.
- [ ] The selected scope remains one exact semantic contract and one representative ability.

## 10. Reviewer Decision

Reviewer records one result:

```text
Decision: SPEC_ACCEPTED | PLAN_NEEDS_REVISION | FAILED
Reviewed commit:
Blocking findings:
Non-blocking findings:
18 unique explicit interactions verified: yes/no
11 unique strict pending interactions verified: yes/no
Runtime or Gate promotion performed: no
Representative selected by this review: no
```

`SPEC_ACCEPTED` only accepts the design contract. Runtime work remains unstarted and must be separately dispatched after representative comparison.
