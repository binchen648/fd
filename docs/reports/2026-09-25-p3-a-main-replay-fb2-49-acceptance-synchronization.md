# P3-A Current-Main FB2-49 Acceptance Synchronization

Status: `SYNCHRONIZED`

## Exact accepted input

- Task: `P3-B-MAIN-REPLAY-FB2-49-R2`
- PR: `#445`
- Exact implementation Base: `5c8e21c853ac95a1b0ee42e28108ae40692491cf`
- Exact accepted Candidate: `658849d1602bd4b705a924f6aa649e973d9d65ca`
- Canonical accepted evidence: `https://github.com/binchen648/fd/pull/445#issuecomment-5832739229`
- Historical semantic authority: PR #422 accepted Candidate `aa04a12e1647560374e09f7e2b6e62a5dccd0954`
- Current-main prerequisite already synchronized: FB2-42 Candidate `c820161a427de6b0e55c209b7e14e3f6fba36033`

## Synchronization result

Fresh independent R accepted the exact current-main FB2-49 replay Candidate. A synchronizes only the identity-free opponent-close-to-one transaction/lifecycle/restore/replay authority capability. No frontier ancestry is merged or cherry-picked; PR #422/#424 remain semantic/evidence sources only.

The accepted current-main capability preserves:

- exact-shape/fail-closed `opponent_close_non_residual_to_one` admission;
- transactional settlement with frozen qualifying targets/owners and pre-mutation FB2-42 close-forbid checks;
- hidden server authority copied/committed atomically with accepted state dispatch;
- authenticated persistence/checkpoint/replay state bound to server-owned secret/scope, transaction/checkpoint identity, state/checkpoint digests and HMAC;
- lifecycle scope rotation/revocation and trusted MatchRoom/Hub/server restore boundaries;
- current-main restore compatibility without importing unrelated later battle-terminal/game-loop work;
- no identity/name/printed-text/Chinese routing, no SkillLib fallback and no consumer authoring.

## Independent verification carried by accepted R

- typecheck: PASS
- focused FB2-49 + MatchSession + Hub + SHA: 4 files / 89 tests PASS
- server workspace: 1 file / 5 tests PASS
- first-loss provenance compatibility: 1 file / 3 tests PASS
- full CI: 132 files / 924 tests PASS
- content validation: 7 masters / 7 servants / 20 events / 0 blockers
- generated-content determinism: PASS
- `git diff --check`: PASS
- frozen reconciliation: denominator 944; materialized overlap 111 unique / 111 occurrences; duplicates 0; remaining 833
- Base -> Candidate authoring/frozen-inventory changes: none

## Accounting

FB2-49 replay is zero-credit infrastructure. Current-main formal/material accounting remains **111/944**, with **833** remaining. Acceptance synchronization itself adds/removes no frozen identity.

## Reconciliation consequence

PR #442 classified two identities as `CONTRACT_REVALIDATION_REQUIRED` because they depended on FB2-49 lifecycle/server-authority parity: Astolfo S1 and Scathach S2. This synchronization closes the shared FB2-49 parity prerequisite, but it does not automatically promote either consumer.

Astolfo S1 is the direct accepted FB2-49 consumer from historical PR #423 and has no additional M50 semantic-split dependency. It is therefore the next bounded current-main consumer replay. Scathach S2 remains separate because its reconciliation entry also requires `SEMANTIC_CONTRACT_SPLIT_REQUIRED` / `M50_02_SINGLE_OPPONENT_CLOSE_EXTENSION` handling.

## Next legal task

`P3-S-MAIN-REPLAY-ASTOLFO-S1-CONSUMER` is READY from the exact A synchronization commit carrying this report/task block. It may add exactly one frozen identity and no production runtime. Candidate material target is **112/944**; formal remains **111/944** until exact fresh-R `MIGRATION_ACCEPTED` plus A synchronization.
