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

- Abigail S1 focused regression: 6/6 pass
- MatchSession and seven-servant-decks regressions: 32/32 pass
- Typecheck: pass
- `content:validate`: pass
- `verify:generated-content`: pass
- `git diff --check`: pass

Known boundary: this Builder does not claim acceptance of Abigail S1, and it does not alter Abigail S2/S3/S4 or any frozen inventory state. Independent GPT-6 Sol review is required before any Candidate or accounting action.
