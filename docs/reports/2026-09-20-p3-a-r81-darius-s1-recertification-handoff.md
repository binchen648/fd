# P3-A R81 Darius s1 Recertification Handoff

- Owner: Codex S
- Status: `READY`
- Frozen identity: `servant.darius.skill.sc-darius-1`
- Runtime dependency: `P3-B2-R81-TRIGGERED-RESIDUAL-CLOSE-INTEGRATION`
- Migration credit: no new identity; resolve previously contested +1 only after independent R

## Repository start point

This handoff is published on branch `codex/a-p3-r81-darius-s1-recertification-ready`. Its parent is the exact independently accepted B2 runtime Candidate `2c9b19a9bae7d5228554c2526ecf1ce4efb158ba`, so S must branch from this handoff branch rather than reconstructing the dependency from chat history.

```powershell
git fetch origin
git switch -c codex/s-p3-r81-darius-s1-recertification origin/codex/a-p3-r81-darius-s1-recertification-ready
git rev-parse HEAD
```

Before implementation, read `docs/agents/PHASE3-AGENT-CONTRACT.md`, then only task `P3-S-R81-DARIUS-S1-RECERTIFICATION` in `docs/agents/PHASE3-TASK-INDEX.md` and this handoff. The starting HEAD must equal the handoff Candidate recorded by A; S must report the exact resulting Candidate commit.

## Accepted dependency

Use exact accepted B2 integration commit `2c9b19a9bae7d5228554c2526ecf1ce4efb158ba`, accepted by independent R at `https://github.com/binchen648/fd/pull/397#issuecomment-5749018881`. Keep Darius's printed-text hashes, static metadata, and canonical authoring semantics unchanged unless the source evidence itself is proven wrong. Do not edit runtime production code or add card-specific routing.

The accepted dependency is scoped to the reusable post-battle residual CLOSE capability. It does not itself accept the Darius consumer, does not grant Gate C, and does not grant another roster credit.

## May touch

- `packages/rules/tests/darius-consumer-migration.test.ts`
- a new S recertification result under `docs/reports/`
- generated evidence only when an existing repository command deterministically requires it

The existing `data/authoring/servants/servant.darius.json` may only change if S produces direct canonical evidence that the frozen source is wrong. Runtime production files, taxonomy, KPI, unrelated cards, and unrelated tests are outside this task.

## Required evidence

The recertification must load the real archive and execute the real post-scoring `MatchSession.resolveBattlePhase` path. Assert that eligible no-loss closure consumes the typed route, moves the source to skill, makes it inactive and owner-only visible, and emits exactly one `source_card_closed` with correct source/controller identity. A represented loss must preserve the source; non-participation must not count as a loss. Invalid source/terminal provenance and replay must fail closed without mutation or duplicate event. Also verify unrelated on-play CLOSE remains unchanged.

At minimum, the result report must bind:

- exact Base and Candidate commits;
- exact frozen identity and authoring hashes;
- typed route proof, including exactly one `source_card_closed` envelope;
- before/after state for zone, active state, visibility, and revision/event count;
- loss, non-participation, invalid provenance, and replay negatives;
- focused test command and result;
- rules regression, typecheck, content validation, generated-content determinism, and CI commands/results;
- `git diff --check` and a production-runtime diff proving S did not modify runtime semantics.

## Stop and review boundary

If the accepted B2 primitive cannot satisfy the consumer without changing runtime semantics, record `RUNTIME_SEMANTIC_GAP` and stop. Do not repair runtime in the S branch.

S reports an exact Base/Candidate and all evidence above. R reviews that integrated Candidate before A resolves the conflicting historical Darius s1 verdict. Do not award a second migration increment for this identity. Final S status may only be `CONSUMER_RECERTIFICATION_CANDIDATE`.
