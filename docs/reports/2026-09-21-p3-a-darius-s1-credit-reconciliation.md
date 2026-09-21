# P3-A Darius S1 Credit Reconciliation

Role: Codex A
Status: `SYNCHRONIZED`
Date: 2026-09-21

## Reconciliation input

- Frozen identity: `servant.darius.skill.sc-darius-1`
- Historical S Candidate: `776ee46f5612481176a853dba099b489328b3236`
- Accepted B2 typed residual CLOSE Candidate: `2c9b19a9bae7d5228554c2526ecf1ce4efb158ba`
- Exact integrated recertification Candidate: `65bfd29ca9319f8dad90cf828c84dce8202058c7`
- Integrated branch: `codex/a-p3-r81-darius-s1-recertification-ready`
- Historical S review: `https://github.com/binchen648/fd/pull/388#issuecomment-5747146073`
- B2 review: `https://github.com/binchen648/fd/pull/397#issuecomment-5749018881`
- Recertification verdict: independent R reported PASS to the project coordinator on 2026-09-21; no additional stable repository review URL was supplied to A.

## Mechanical reconciliation

A verified that exact integrated Candidate `65bfd29` contains both exact ancestors:

- `776ee46`, which contributes the frozen Darius s1 archive and focused consumer proof without production runtime edits;
- `2c9b19a`, which contributes the independently accepted identity-free battle-end residual typed CLOSE route.

The integrated Candidate therefore resolves the later semantic dispute: the Darius residual closure is no longer evidenced only through the legacy handler. The accepted shared route owns the battle-end residual CLOSE operation, including owner-only closed visibility and the `source_card_closed` audit event.

Fresh A verification on exact `65bfd29`:

```text
npx vitest run \
  packages/rules/tests/darius-consumer-migration.test.ts \
  packages/rules/tests/fb2-38-current-round-combat-loss-condition.test.ts \
  packages/rules/tests/regression/b2-r81-triggered-residual-close-integration.test.ts
3 files / 31 tests PASS
```

The first invocation in the new worktree did not enter verification because dependencies were absent. A reused the existing repository `node_modules` without changing `package-lock.json` and reran successfully.

`npm run typecheck` is not claimed as PASS in this synchronization. It currently fails in unrelated `apps/server/src/match-server.ts` protocol/API compatibility code (`client:end_turn`, `expectedRevision`, and `MatchRoomHub.endTurn`). This synchronization does not modify or waive that failure.

## Credit reconciliation

The Darius s1 identity had already contributed one historical migration credit to the formal running total. The later typed-runtime dispute marked that existing credit as contested; it did not remove it from subsequent arithmetic.

This synchronization changes only the credit quality:

- before: Darius s1 historical credit included but contested;
- after: Darius s1 historical credit included and confirmed;
- migration credit delta: **`0`**;
- duplicate credit awarded: **none**.

The latest formal project count therefore remains **`151/944`**, with **`793`** remaining. The exact frozen identity must not receive another `+1` in any later synchronization.

## Scope boundary

This is evidence/accounting synchronization only. No authoring, generated product, runtime, client, test, pack, PR merge, or PR retarget is performed. It does not promote Gate C, Phase PASS, or Release Ready.
