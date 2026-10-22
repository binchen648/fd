# Andersen SC2 scoped Candidate report

- Date: 2026-10-22
- Role: Builder Candidate
- Strict repository: `https://github.com/binchen648/fd.git`
- Exact base: `03f11c7a0f5641f9601d05f480d9b67765ca0ae0`
- Owner: `servant.andersen`
- Candidate scope: `servant.andersen.skill.sc-andersen-2` literal subset only
- Formal source-bound decision: `caca0de044ee35953344e4d4ce9c2526f1a5ae1c`
- Independent Candidate Reviewer prerequisite: `f4c05864b210bb0fd0527d950829a79f0faef5`
- Owner credit: `0`
- Owner unlock: `false`
- Candidate status: docs-only scoped record; pending independent Candidate Reviewer

## Included scope

This Candidate records exactly three source-bound literal assertions:

1. Andersen's victory points may be gained only from effects.
2. The base special card is named `幸运` and contains the literal combat-stage text `你无视【败北】效果`.
3. Printed `X = ceil(你的战果 / 5)` is identity-level text only, with no operative binding.

The Candidate preserves the exact frozen SC2 printed text, full-text SHA-256, separately source-grounded residual clause SHA-256, canonical/legacy IDs, and source locators. `core.structured-skill` remains provenance only.

## Explicit exclusions and preserved blocks

- No special-card transformation, construction, copying, replacement, ownership, or generation is recorded.
- No activation timing, attachment, lifecycle, cleanup, expiration, continuous duration, battle settlement, effect-origin classification/enforcement, or operative `X` semantics are recorded.
- `servant.andersen.skill.sc-andersen-1` remains `SOURCE_EVIDENCE_REQUIRED` / `SEMANTIC_SOURCE_REQUIRED` / `EXPLICIT_BLOCK`.
- `servant.andersen.skill.sc-andersen-3` remains `SOURCE_EVIDENCE_REQUIRED` / `SEMANTIC_SOURCE_REQUIRED` / `EXPLICIT_BLOCK`.
- The owner remains blocked with `ownerCredit=0`; the frozen SC2 `currentRoute=none`, empty inherited/partial contracts, and `STRUCTURED_TRANSFORM_REQUIRES_REVIEW` block are preserved.
- No runtime, executable, playable, handler, authoring, pack, generated-content, roster, restore/replay/reconnect, or frozen-inventory mutation is included.
- No Candidate PR is created or pushed from this worktree; independent Candidate Reviewer approval is required first.

## Checks

- Candidate JSON parse and scope cardinality: **PASS**.
- Full printed-text SHA recomputation: **PASS** (`6c4ec3bdc39933ea11b73566d6993fea1c5d752f06c2f6c7131e9a3f32bb8f81`).
- Residual-clause SHA recomputation: **PASS** (`8ca9c8143d72538f449be401909f1f0dc39879d446c0b817283d353e47b0eca4`).
- Frozen inventory boundary cross-check: **PASS** (SC1/SC3 blocked; SC2 current route none and transform review block preserved; owner credit zero).
- Content/pack boundary scan: **PASS** (no Andersen SC2 identity in `data/packs/**` or `data/generated/**`; no generated/playable mutation).
- Runtime/inventory path boundary: **PASS** (Candidate change set is docs-only).
- `git diff --check`: **PASS** after final report normalization.
- Runtime/content/generated suites: **not run**; this Candidate is docs-only and the clean worktree has no `node_modules`. No new dynamic result is claimed.

