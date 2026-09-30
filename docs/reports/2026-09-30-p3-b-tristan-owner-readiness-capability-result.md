# P3-B Tristan Owner Readiness Capability Result

Role: Codex B
Status: `IMPLEMENTATION_COMPLETE_CANDIDATE`
Date: 2026-09-30
Base: `f067d70514a702327d24b94d9bc1327eb3ae7881`
Classification: complete currently discoverable Tristan owner-readiness/capability batch; permanently zero migration credit

## Frozen owner scope

The owner remains one indivisible batch:

1. `servant.tristan.skill.sc-tristan-1` — 痛哭幻奏;
2. `servant.tristan.skill.sc-tristan-2` — 高声颂爱;
3. `servant.tristan.skill.sc-tristan-3` — 单独行动（Archer Class）.

Frozen semantic authority is the independently accepted F1/source-evidence lineage. Locked Reference `b2f9fa15fba07c63530bbf4612b03b8b704755f9` is static/observed metadata only.

## Mechanical preflight / accounting boundary

- current canonical authoring contains only `sc-tristan-3`;
- `sc-tristan-3` is the accepted FM04 Independent Action family member and is preservation-only for this owner; no duplicate migration credit is permitted;
- `sc-tristan-1` and `sc-tristan-2` are absent from canonical authoring and are the currently discoverable owner-local readiness pressure points;
- this task changes no `data/authoring/**` file and is permanently zero-credit;
- strict formal accounting remains `157/944`, remaining `787` until a later formal owner-complete migration receives `MIGRATION_ACCEPTED` and A-sync/accounting.

## Implemented generic readiness family

Production runtime contains no Tristan/card-name/printed-text/`sc-tristan-*` identity routing. The implementation adds structural generic semantics only.

### sc1 — duplicate base-Power close / fallback discard

The accepted generic combat action shape is exact and fail-closed:

- phase action in the controller combat action window from a live source;
- operate on the controller's current battlefield;
- exclude the source itself;
- exclude residual attacks;
- compare the authoritative **base-Power axis**, not modified combat total;
- a source-X binding, when structurally present on another accepted physical source, is its authoritative current base Power;
- freeze every non-residual attack belonging to any duplicate base-Power group before mutation, then close that frozen set;
- if and only if the qualifying frozen set is empty, discard up to the top three controller deck cards, naturally handling deck sizes 0/1/2;
- generic card-close lifecycle is used and the source itself is not closed by the effect;
- widened/malformed privileged shapes are rejected by the loader gateway.

### sc2 — private discard shuffle, physical-source X, and battle upkeep

The accepted generic residual shape provides:

- exact live-source `on_card_played` provenance;
- one owner-only mandatory interaction over the current controller-owned/controller-controlled discard, selecting any distinct set `0..N`;
- the candidate list is frozen and authenticated against current discard state at resolution; stale/moved/forged/duplicate selections fail closed atomically;
- selected physical cards move discard -> deck and the deck is deterministically shuffled when at least one card was selected;
- exact physical-source binding `X = selected count + 2`, including the zero-selection boundary `X=2`;
- the same physical-source binding overrides that source's base Power while live;
- during a battle round, an active controller located at the battlefield is a participant even with zero active attacks; each live bound source pays exactly X mana once for that round, and insufficient mana closes that exact source without allowing negative mana;
- unrelated battles do not charge the upkeep;
- physical-source close/lifecycle cleanup removes both X and its round-upkeep marker;
- restore boundary validates the interaction shape, exact discard candidates, source/controller provenance, source-X structure, accepted source ability, live source state, and non-future upkeep round.

### sc3 — preservation-only

No new sc3 runtime or identity routing is introduced. Existing accepted contracts remain authoritative:

- first-half action +3 VP via the FM04/TO08 Independent Action family;
- forced post-loss -5 VP via B21/R15;
- explicit unpreventable prevention exception remains narrow and unchanged.

## Verification

- `E:\\Codex\\FD\\binchen648_fd\\tools\\verify-toolchain.cmd`: `FD_TOOLCHAIN_OK`;
- `packages/rules/tests/regression/p3-tristan-readiness-capability.test.ts`: `11/11 PASS`;
- `packages/rules/tests/regression/complex-skills-regression.test.ts`: `38/38 PASS`;
- `packages/rules/tests/match-session.test.ts`: `33/33 PASS`;
- affected total: **3 files / 82 tests PASS**;
- `npm run typecheck`: PASS;
- `npm run content:validate`: PASS — `7 masters / 13 servants / 20 events / 0 blocking issues`;
- `npm run content:compile`: PASS — same counts;
- `npm run verify:generated-content`: PASS with deterministic hashes;
- `data/authoring/**` Base..working-tree delta: EMPTY;
- production runtime identity audit for `tristan` / `sc-tristan` / printed names: CLEAN;
- `git diff --check`: PASS.

## Next transaction

One exact readiness Candidate / one PR / one fresh independent Reviewer. This task itself adds zero migration credit.

- ACCEPTED -> one A-sync/full-owner rescan on `servant.tristan`, preserving sc3 and deciding the exact newly creditable owner-complete migration set;
- NEEDS_REVISION -> close all findings in one successor Candidate, then one fresh R;
- no per-skill review split is permitted.
