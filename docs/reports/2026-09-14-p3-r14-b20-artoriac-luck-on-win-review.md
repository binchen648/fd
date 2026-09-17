# P3-R14 Review — B20 Unique Win Create/Shuffle Family

- Date: 2026-09-14
- Reviewer: Codex R
- Candidate: `bd2a350e3fd1d006d8692e770b4ad8eb24e5aeea`
- Candidate base: `80d3299af4ac51a350a32d64524691a822e92177`
- Review branch: `codex/r-p3-b20-artoriac-luck-on-win-r1-review`
- Verdict: `GATE_A_B_CANDIDATE_ACCEPTED`

## Findings

No blocking finding.

The candidate is narrowly structural and does not route by representative character/card/ability identity. The production diff contains no `artoria`, `artoriac`, `sc-artoria`, `servant.artoria`, `card.luck`, or pilgrim identifier. Group ID and created-card identity are treated as structural values rather than representative constants.

## Family scope / unique-group judgment

Accepted.

`isUniqueWinCreateCardTriggerSemantic()` requires the exact optional controller-win family shape:

- post-battle optional response;
- controller-only eligibility;
- unique keyword group with `only_one_effect_may_activate_per_window`;
- source card in controller hand;
- source moves from hand to removed-from-game;
- one created card enters controller deck;
- controller deck is shuffled exactly once.

The focused tests prove renamed ability/group/reward identities remain valid while wrong trigger/source/removal destination/missing shuffle/wrong conflict policy do not classify.

## Participant / provenance judgment

Accepted.

Winner scoping remains owned by the existing trigger gateway: unrelated and losing battle results do not expose the family. Focused coverage includes an unrelated battlefield result and a later distinct stable win event after decline.

## Atomicity / fail-closed / exactly-once judgment

Accepted.

The migrated route bypasses the generic legacy executor and emits typed settlement evidence:

- `source_card_removed_from_game`;
- `card_created`;
- `deck_shuffled`.

A malformed same-family create shape rejects with `resolution_failed` before legacy fallback and leaves authoritative state unchanged. Stable replay of an already processed result does not consume another source or create another reward. Unique-group arbitration settles only one chosen sibling.

## Projection / reconnect / stale judgment

Accepted.

Fresh Chromium proves:

- pending unique-response projection survives reconnect;
- the controller settles one response;
- settled state survives reconnect;
- stale replay is rejected without a second settlement.

## Gate A / B / C

Fresh reviewer environment:

```text
npm ci                              PASS
npm run typecheck                   PASS
focused/current-lineage             11 files / 103 tests PASS
Chromium B13-B20 compatibility      8 / 8 PASS
candidate git diff --check          PASS
representative identity audit       PASS
```

Fresh full-root baseline:

```text
Test files: 105 PASS / 10 FAIL / 115 total
Tests:      687 PASS / 20 FAIL / 707 total
```

The 20 failures are the inherited CHM/original-image evidence absence class. No new deterministic failure was found.

## A03 synchronization input

R14 accepts B20 candidate `bd2a350e3fd1d006d8692e770b4ad8eb24e5aeea`.

A03 may now run fresh `phase3:coverage` from this acceptance lineage and, independent of raw KPI movement, advance the scoped accepted TO14 direct-consumer overlay for the three current structurally identical win-create-shuffle consumers from `7/13` to `10/13`.

No other consumer is accepted by this review.

## Final verdict

`GATE_A_B_CANDIDATE_ACCEPTED`
