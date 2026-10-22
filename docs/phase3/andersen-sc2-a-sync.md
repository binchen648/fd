# Andersen SC2 A-sync / accounting

- Date: 2026-10-22
- Role: A synchronization/accounting
- Strict repository: `https://github.com/binchen648/fd.git`
- Exact A-sync base: `03f11c7a0f5641f9601d05f480d9b67765ca0ae0`
- Candidate: `3ea6d3380612025f93e39a077b411953218655d2`
- Candidate PR: [#678](https://github.com/binchen648/fd/pull/678)
- Formal decision: `caca0de`
- Source-contract review: `d9059ecb372f6df2e06d5999fd7309e530256a08`
- Formal review: `f4c05864b210bb0fd0527d950829a79f0faef5`
- Successor Candidate Reviewer: `4da6ab4f`
- Prior content review: `9ac8698164b33053b27bafe0ed33c5a0f55c3f72`
- Verdict: `MIGRATION_ACCEPTED` — SC2 literal subset only
- Credit delta: `0`

## Accounted scope

This A-sync records acceptance of exactly `servant.andersen.skill.sc-andersen-2` (`sc_andersen_2`) under the formal source-bound literal contract:

1. Andersen's victory points may be gained only from effects.
2. The base special card is named `幸运` and contains the literal combat-stage text `你无视【败北】效果`.
3. Printed `X = ceil(你的战果 / 5)` is identity-level text only, with no operative binding.

The exact frozen printed text, full-text SHA-256, residual-clause SHA-256, canonical/legacy IDs, and source locators remain recorded in the Candidate. This is accounting/documentation only; no runtime, executable, playable, handler, authoring, pack, generated-content, roster, restore/replay, or frozen-inventory mutation is included.

## Preserved blocks and limits

- `servant.andersen.skill.sc-andersen-1` remains `SOURCE_EVIDENCE_REQUIRED` / `SEMANTIC_SOURCE_REQUIRED` / `EXPLICIT_BLOCK`.
- `servant.andersen.skill.sc-andersen-3` remains `SOURCE_EVIDENCE_REQUIRED` / `SEMANTIC_SOURCE_REQUIRED` / `EXPLICIT_BLOCK`.
- `servant.andersen` remains owner-blocked; SC2 does not unlock the owner.
- `ownerCredit=0`; this A-sync grants no migration credit.
- SC2 remains a literal-only scoped contract. Special-card transformation/construction/copy/replacement/ownership/generation, activation/lifecycle timing, attachment/cleanup/expiration, effect-origin classification/enforcement/settlement, battle ordering, and operative `X` use remain outside scope.
- Frozen inventory `currentRoute=none`, empty inherited/partial contracts, and `STRUCTURED_TRANSFORM_REQUIRES_REVIEW` provenance are preserved and not rewritten.

## Validation and dynamic-check limitation

- A-sync base/Candidate/PR/formal/source/successor-review identifiers: recorded exactly as above.
- A-sync report is docs-only; runtime and frozen-inventory paths are untouched.
- `git diff --check`: PASS.
- Dynamic checks were **not rerun in the isolated reviewer checkout** for this A-sync. The accounting relies on the formal/source/Candidate review chain and prior content review; no new dynamic result is claimed.
- No push or merge was performed.

