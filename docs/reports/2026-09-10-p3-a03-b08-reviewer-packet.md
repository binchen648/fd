# P3-A03 B08 Reviewer Packet

- Document Role: REVIEWER_PACKET
- Owner: Codex A
- Source Task: `P3-A03`
- Reviewed Runtime Task: `P3-B08`
- Reviewed Branch: `codex/b-p3-b08-close`
- Reviewed Commit: `e938bbb`
- Claimed Acceptance: `AUTOMATION_BASELINE_CANDIDATE`
- Promotion: this packet does not promote Gate A/B/C, Phase 3, or Release status.

## Runtime Slice Under Review

Codex B reports `P3-B08: CARD_ACTION_SEMANTICS_CLOSE` as `IMPLEMENTATION_COMPLETE_CANDIDATE`.

The scoped representative is:

```text
servant.artoria-alt.skill.sc-artoria-alt-2#sc-artoria-alt-2.angra-mainyu-embrace
```

The claimed exact semantic route is:

```text
CARD_ACTION_SEMANTICS_MINIMAL:CLOSE
```

The claimed primitive is:

```text
close_source_card -> closedCount
```

## A Fresh Evidence Checks

Codex A ran the following read-only or generated-artifact checks against B08 worktree `codex/b-p3-b08-close` at commit `e938bbb`.

```text
npm run phase3:review-packet -- --task P3-B08 --batch CARD_ACTION_SEMANTICS_CLOSE --out artifacts/phase3-review-packet-p3-b08.json
PASS
hotRuntimeFilesTouched=YES
affectedSemanticAbilities=9
remainingLegacyResolveEffect=52
notClassifiable=28
```

The generated packet correctly reports hot runtime files touched:

```text
packages/rules/src/ability/executable-card-pack.ts
packages/rules/src/ability/interpreter.ts
packages/rules/src/ability/resolution-dataflow.ts
packages/rules/src/ability/types.ts
packages/rules/src/match-session.ts
```

```text
npm run phase3:automation-audit
PASS
legacyResolveEffect=52
legacyExecuteAbility=3
notClassifiable=28
promotionFindings=3
```

```text
node docs/audits/fd-card-action-close-inventory.mjs
PASS
sourceFiles=14
cardActionSemanticAbilities=7
eligible=1
skipped=6
```

```text
npm run phase3:coverage
PASS
archives=14 cards=46 abilities=92
compiledPack=fd-playtest-v1@1
definitionHash=f4aeaddb88f3018efed31ca74a8a0c91a614c9a61752237952285b017de4d192
compiledCards=70 compiledCharacters=14 blockingIssues=0
newRuntimeSemanticRouted=9
legacyExecuteAbility=3
legacyResolveEffect=52
dualRuntime=0
pilotAllowlist=0
notClassifiable=28
taxonomyWarnings=79
```

```text
npx vitest run packages/rules/tests/regression/card-action-close.test.ts packages/rules/tests/regression/resolution-dataflow.test.ts packages/rules/tests/executable-card-pack.test.ts scripts/tests/phase3-coverage.test.ts
PASS
4 files / 75 tests
```

After these checks, Codex A restored generated B-worktree artifacts and confirmed the B08 worktree remained clean.

## Reviewer Focus

Codex R should independently verify whether B08 evidence supports the scoped CLOSE candidate. The priority checks are:

- exact semantic routing, not ability-id pilot routing;
- compiler fail-closed for non-exact `close_source_card` variants;
- runtime fail-closed for missing/off-board/inactive/face-down/wrong-controller source state;
- source card has compiled definition at close time;
- visible `宝具` played-card condition is actually consumed;
- non-noble play does not close the source;
- stale WS replay cannot close or move the source twice;
- B08 does not claim targeted close, close-then-activate, temporary dissolve, non-skill close destination, once-per-game removal, broad cleanup ordering, or `CREATE_AND_ACTIVATE`.

## A Boundary

Codex A does not judge B08 as `SCENARIO_VERIFIED` or scoped `E2E_VERIFIED`.

This packet only says the B08 implementation candidate has fresh automation evidence ready for independent review.

## Machine-Readable Artifact

Companion artifact:

```text
artifacts/phase3-a03-b08-reviewer-packet.json
```
