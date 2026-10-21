# P3-B Abigail S1 Builder Report

## Scope and lineage

- Owner: `servant.abigail`
- Skill: `servant.abigail.skill.sc-abigail-1`
- Builder branch: `codex/b-p3-abigail-s1-builder`
- Exact base: `726e6e55cd51b80d360366e62a0cb6058804265e` (accepted Abigail S4 Candidate)
- This worktree contains Builder changes only. No Candidate, A-sync, credit, PR, or merge was created.

## Source evidence

The canonical source candidate was independently inspected and bound into the active authoring record; no legacy runtime was copied.

- Printed source: `E:/Codex/FD/Fate_Domination-重构版/src/content/generated/legacy-content.json`
- Printed source SHA-256: `8DE23E47529D59E1E05BB8FBD74E1FAAADF21687CBCCDD859B5A8ACFB85E277C`
- Locator: `servants[178].skills[0].text`
- Normalized S1 text SHA-256: `69d643135ce8c1e86dcf14c314c3fcca02793f96664ce58d6fae554e37fd30c8`
- Development card image: `E:/Codex/FD/Fate_Domination-开发版/images/masters/阿比盖尔.png`
- Development card image SHA-256: `3A049A05FC5B7A1C8CA864EA3152239C2E353E15CA509C623487A91B73179D1F`
- Development source candidate: `E:/Codex/FD/Fate_Domination-开发版/batch_berserker_extra.js`
- Development source SHA-256: `6BF26E40FF08FF632AC5DCEE88A9CDA4684E60CA71C39ADADBB239D1F3723FDC`

## Implemented contract

S1 is source-bound and fail-closed. Its two executable clauses are represented by exact custom effects:

1. During Abigail's action window, the active S1 source card may distribute exactly one canonical Outside-Life S4 card to every active opponent at the same battlefield. Recipient owner/controller, generated-by marker, card definition, zone, target set, and source owner are checked atomically. A canonical per-player ledger makes duplicate dispatches and replay idempotent.
2. On the source card's own play event, the exact distributed-card ledger is counted. Exactly `X=12` records produce a winner envelope for Abigail; any other count is a no-op. The winner envelope and ledger are restore-validated and malformed/forged ledgers fail without mutation.

The active authoring/provenance record uses the exact printed S1 text, source locator and SHA values above. Generated content and evidence outputs were regenerated from it. The runtime adds restore validation for the ledger and winner envelope, and MatchSession stops after a valid immediate winner.

## Verification

Final checks were run from this worktree before commit:

- Abigail S1 focused regression: 13/13 pass, including the real S1 -> S4 use -> Abigail discard -> next-round S1 path, immutable per-card distribution provenance, isolated forged-receipt and cross-card proof-transplant rejection with unchanged state, cross-record/wrong-recipient/repeated-event rejection, and serialize/restore provenance rejection
- MatchSession/replay/related Abigail regressions: 75/75 pass (`match-session`, replay, Abigail S3a/S3b/S4)
- Typecheck: pass
- `content:validate`: pass
- `verify:generated-content`: pass (deterministic hashes unchanged)
- `verify:playtest-v1`: pass (8 masters, 8 servants, 20 events, 96 starting-deck cards, 0 private-view leaks)
- `git diff --check`: pass

Known boundary: this Builder does not claim acceptance of Abigail S1, and it does not alter Abigail S2/S3/S4 or any frozen inventory state. Independent GPT-6 Sol review is required before any Candidate or accounting action.

## Reviewer R1/R2/R3 repair

The follow-up Builder repair makes the S1 winner state fail-closed: `winnerPlayerIds` is accepted only with exactly one matching S1 victory envelope; that envelope must reference the exact source card, owner/controller, win ability, and the exact ordered 12-card ledger record set. Restore rejects isolated winners, source swaps, missing/extra/duplicate records, and cross-player bindings. MatchSession also returns `match_complete` before resetting stop state or entering any interaction when an authoritative winner is already present.

The final restore boundary additionally requires the authoritative `action` phase, the source card to remain public in `attack_area` with `cardState.active === true`, and the controller's servant identity to remain `servant.abigail`. Phase, zone, visibility, active-state, and servant-identity tampering are covered by focused restore tests and leave the forged snapshot unchanged after rejection.

## Cross-skill provenance repair

The S1 ledger now binds every immutable `cardInstanceId` and original recipient back to the canonical S1 distribution event (source, controller, ability, target/card pairing, and exact-once card occurrence). A ledger entry remains valid in hand, or after the canonical S4 cleanup receipt moves that same card from the recipient's active attack area to Abigail's owner-only discard. The S4 transition requires the original recipient as the cleanup controller, Abigail as the cleanup recipient, exact zones, a unique terminal receipt, and the terminal/trigger identities. Arbitrary owner/controller/zone edits, replaced cards, cross-record bindings, duplicate distribution or recycle receipts, and wrong source/recipient provenance fail closed in both live resolution and MatchSession restore validation.

## Independent reviewer blocker repair

The S1 recycled-card predicate no longer trusts a receipt by itself. The runtime now records server-owned provenance for the actual S4 hand-to-attack-area play, its `on_use_declared`/`on_card_played` event IDs, the canonical true-name release, and the cleanup transaction that consumed the canonical `after_battle_ended` event. Every proof carries and is checked against its unique `cardInstanceId`/source key; play/use IDs and release/recycle IDs must be unique across cards. Both live S1 resolution and MatchSession restore require the exact card, recipient, release/play IDs, terminal IDs, and processed-event membership to agree across those records. A direct discard plus an invented receipt, wrong event chain, replacement card, duplicate, or cross-card proof transplant is rejected transactionally with no revision, ledger, or state change. The S4 regression fixtures now exercise the real play path, while preserving the forged-source rejection boundary.
