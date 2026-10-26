# P3-A FB2-25 Initial-Mana Consumer Accounting Synchronization

Role: Codex A accounting  
Status: `SYNCHRONIZED`  
Task: `P3-FB2-25-INITIAL-MANA-CONSUMER-MIGRATION`  
Classification: accepted consumer migration; `+2` frozen migration credit

## Exact evidence

- Exact Base: `b780972acbbe12639568f88de63c33c627fbc1d3`.
- Accepted Candidate: `7c19eea34cbe5eb18589ceda57e43d6c6b9a5076`.
- Candidate branch: `codex/builder-p3-fb2-25-consumer-20261026`.
- Independent Reviewer: `d647e02b2d1ced4572f14d6c11466062e7c07c8e`.
- Reviewer verdict: `MIGRATION_ACCEPTED`.

This A-sync records the reviewer-accepted consumer Candidate against the
exact Base. It does not modify the Candidate, merge a PR, or alter runtime,
pack/generated product, unrelated masters, or FM09.

## Exact synchronized IDs

Only these two canonical IDs receive credit:

1. `master.iliya.skill.s1`
2. `master.taiga.skill.s1`

The Candidate's standalone archives, authoring-boundary test, and report are
retained exactly as reviewed. No other identity is included.

## Verification receipt

- Consumer focused: `5/5 PASS`.
- FB2-25 focused: `5/5 PASS`.
- Rules regression: `358/358 PASS`.
- Typecheck: PASS.
- Content validation: PASS.
- Generated-content determinism: PASS.
- `git diff --check`: PASS.
- Full CI comparison: Candidate `885/905`, Base `880/900`; both contain the
  same 20 external CHM/image/path fixture failures. The delta is the five
  consumer tests, with no new failure class.

## Accounting ledger

- Before consumer A-sync: `149 / 944 FULL`; remaining `795`.
- Accepted consumer credit: `+2` (`master.iliya.skill.s1`,
  `master.taiga.skill.s1`).
- After consumer A-sync: `151 / 944 FULL`; remaining `793`.

Formal A-owned accounting synchronization only. No merge, retarget, or
additional implementation is performed here.
