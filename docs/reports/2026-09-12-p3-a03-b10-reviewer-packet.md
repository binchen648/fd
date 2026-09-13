# P3-A03 B10 Reviewer Packet

- Document Role: REVIEWER_PACKET
- Owner: Codex A
- Source Task: `P3-A03`
- Reviewed Runtime Task: `P3-B10`
- Reviewed Branch: `codex/b-p3-b10-setup-create-to-skill`
- Reviewed Commit: `bb32fc2`
- Claimed Acceptance: `AUTOMATION_BASELINE_CANDIDATE`
- Promotion: this packet does not promote Gate A/B/C, Phase 3, or Release status.

## Runtime Slice Under Review

Codex B reports `SETUP_CARD_CREATION_MINIMAL:CREATE_TO_SKILL` as `IMPLEMENTATION_COMPLETE_CANDIDATE`.

The claimed exact shape is:

```text
forced_trigger + game_start + no conditions/targets/cost/creates
+ one create_card(cardId, to=skill) + automatic
```

The three claimed migrated abilities are Maiya `military.has-support-shot`, Olga-Marie `astronomical-science.has-chaldeas`, and Shinji `useless-person.setup`. The three Artoria Caster post-battle Luck abilities remain outside the contract.

## Fresh Checks

Codex A ran the following checks in the B10 worktree at `bb32fc2`:

```text
npx vitest run packages/rules/tests/regression/resolution-dataflow.test.ts packages/rules/tests/regression/setup-create-to-skill.test.ts packages/rules/tests/executable-card-pack.test.ts
PASS: 3 files / 63 tests

npm run typecheck
PASS

npm run test:ci
PASS: 86 files / 528 tests

npm run phase3:coverage
PASS: blockingIssues=0
newRuntimeSemanticRouted=9
legacyResolveEffect=52
dualRuntime=0
notClassifiable=28

npm run phase3:review-packet -- --task P3-B10 --batch SETUP_CARD_CREATION_MINIMAL_CREATE_TO_SKILL --out artifacts/phase3-review-packet-p3-b10.json
PASS: hotRuntimeFilesTouched=YES

npm run phase3:automation-audit
PASS: promotionFindings=3
```

A diagnostic MatchSession run confirmed that all three cards are newly created during the formal `match-session-game-start` event. Their instance ids are resolution-generated and each has a `card_created` event with the expected source ability.

## Review Findings

### Runtime Finding 1: card-specific semantic exclusion

Both executable-pack validation and runtime routing contain:

```text
cardId !== 'card.luck'
```

Locations at reviewed commit:

- `packages/rules/src/ability/executable-card-pack.ts:408`
- `packages/rules/src/ability/interpreter.ts:1037`

This is a card-definition-id route condition, contrary to the B10 handoff requirement that eligibility be determined entirely by semantic form. It is also redundant for current canonical Artoria Caster abilities because they already differ by kind, trigger, response window, cost, destination, and nested shuffle.

Fresh diagnostic proof:

```text
exact game_start create-to-skill shape with cardId=card.luck -> false
same shape with renamed arbitrary cardId -> true
```

Required B correction before promotion review: remove both `card.luck` checks and add a regression proving arbitrary created-card identity does not affect route eligibility. Keep the real Artoria Caster abilities excluded through their non-matching semantic axes.

### Runtime Finding 2: provenance adoption mutates an existing card

The typed primitive currently treats an existing same-definition controller skill card with no `generatedBy` as a no-op, then mutates it:

```text
duplicate.generatedBy ??= sourceCardId
duplicate.visibility = owner_only
```

Locations at reviewed commit:

- `packages/rules/src/ability/resolution-dataflow.ts:979`
- `packages/rules/src/ability/resolution-dataflow.ts:989`

Fresh diagnostic proof used a different `game_start` event id after removing `generatedBy` from Maiya's generated support card. The runtime preserved the old instance, wrote a new `generatedBy`, emitted four additional events across setup abilities, and advanced revision.

Stable same-event replay is already rejected by `processedEvents` before primitive execution. Therefore this adoption behavior is not required for the handoff's replay-idempotency requirement and can rewrite provenance of restored or corrupt state.

Codex R should require B either to fail closed on an existing ungenerated card or provide a canonical compatibility contract and focused tests proving why provenance adoption is valid. Codex A does not choose the runtime behavior.

## Automation Classification Gap

The B10 checkout has no `SETUP_CARD_CREATION_MINIMAL:CREATE_TO_SKILL` branch in `scripts/phase3-coverage.ts`. Consequently the three migrated runtime consumers remain absent from global new-runtime counts:

```text
before: new=9 legacyResolveEffect=52 dual=0
after:  new=9 legacyResolveEffect=52 dual=0
```

B correctly did not change the A-owned classifier. This is an `AUTOMATION_CLASSIFICATION_GAP`, not evidence that the runtime route did not execute. Codex A must update classifier/tests only after the exact runtime shape is accepted or corrected, then regenerate the global burn-down numbers.

## Evidence Boundary

- No browser acceptance evidence was attempted or claimed.
- No Gate A/B/C status is promoted by this packet.
- The Artoria Caster Luck abilities remain skipped.
- Existing legacy `resolveEffect` ownership remains authoritative in global counters until A taxonomy alignment occurs.
- Independent Codex R judgment is still required.

## Machine-Readable Artifact

Companion artifact:

```text
artifacts/phase3-a03-b10-reviewer-packet.json
```
