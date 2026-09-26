# P3-FB2-25 Game-Start Fixed Set-Mana Result

Date: 2026-09-18
Role: Codex B2
Status: `IMPLEMENTATION_COMPLETE_CANDIDATE`
Credit: `0` frozen identities

## Lineage

- A dispatch Base: `c04e42ea8d002e974f8965218f915d642fe26ea5`.
- Accepted recovery baseline before this task: `115/944`.
- F1 evidence: `59f145434695d29bdd17e4cb3adc887e84182377`.
- Locked Reference: `b2f9fa15fba07c63530bbf4612b03b8b704755f9`.

## Implemented boundary

The Candidate adds one identity-free fail-closed parent semantic for exactly:

- `forced_trigger`;
- activation exactly `game_start`;
- automatic execution with no host operations;
- no condition, target, cost, create, rule-modifier, lifecycle, visibility, limit, or non-default response-window semantics;
- exactly one effect;
- that effect is the already accepted FB2-05 fixed-controller literal `set_mana` component.

`isGameStartFixedControllerManaSetSemantic` owns the composed parent route. Discovery rejects malformed near-matches before activation, direct server execution rejects them explicitly, and valid effects execute through the existing typed Resolution Data-flow `set_mana` primitive. No new resource primitive, event type, schema, MatchSession timing rule, or identity route is added.

The production classifier contains no Iliya, Taiga, owner name, printed text, Reference handler, or fixed amount. The semantic remains parameterized by the literal target amount.

## Fail-closed evidence

Focused tests prove that amounts `3` and `6` are valid under the exact structural envelope, while the following near-matches are rejected:

- non-`game_start` trigger;
- extra activation metadata;
- condition;
- multiple effects;
- lifecycle or rule-modifier semantics;
- non-controller `set_mana`;
- negative, fractional, or expression amount;
- response-window semantics;
- non-empty host operation authority.

Runtime probes prove:

- starting from controller Mana 2, exact targets 6 and 3 settle to 6 and 3 respectively;
- another player's Mana is unchanged;
- non-zero change emits exactly the existing typed `mana_adjusted` evidence with authoritative before/after/delta;
- replay of the same trusted `game_start` event id is idempotent;
- same-value exact assignment remains a no-op with no `mana_adjusted` event;
- a malformed parent shape does not mutate Mana;
- direct malformed execution rejects before mutation;
- an over-cap target aborts transactionally, leaving Mana, processed-event state, and resource evidence unchanged.

## Compatibility and validation

Fresh validation on the exact Candidate worktree:

- `npm ci --offline`: PASS, 239 packages, 0 vulnerabilities;
- typecheck: PASS;
- focused FB2-25 + FB2-05 + FB2-14 + FB2-15: `4 files / 29 tests PASS`;
- content validate: `7 masters / 7 servants / 20 events / 0 blockers`;
- content compile: PASS with the same product roster and zero blockers;
- generated determinism: PASS;
- locked Reference verification: PASS;
- client production build: PASS (existing Vite `node:crypto` browser-externalization warning only);
- official full CI: `135 files / 875 tests PASS`;
- rules core + regression: `74 files / 456 tests PASS`;
- phase3 coverage: PASS;
- automation audit: PASS;
- `git diff --check`: PASS.

The eleven-round MatchSession case completed at approximately 2683 ms under the unchanged 5000 ms timeout in this Candidate run.

Deterministic generated-product hashes remain unchanged:

- content library: `03582e22b830c59ccfe03379159dd5e50aef19fd7bae3561469c000e56618a79`;
- fixture: `fb69383fd91ab56bc645633eae72df8b8c10131cccd2713fd57afcf950a5f057`;
- evidence report: `b1bb8968097534c796cc6ff5775f3a14cfbbd063aa24e6b94f79a7e81d655cc3`.

Coverage remains `103 archives / 138 cards / 241 abilities`, compiled `73 cards / 14 characters / 0 blockers`, buckets `22/3/133/0/83/130`; automation audit remains `133/3/83/20`.

## Scope and accounting

Base-to-Candidate production scope is limited to the narrow interpreter semantic plus its focused regression. This report is the only documentation result file.

There is no diff under:

- `data/authoring/**`;
- `data/packs/**`;
- `data/generated/**`;
- `apps/**`;
- `scripts/**`.

A production diff scan finds no `iliya`, `taiga`, `初始魔力`, or `master-initial-mana` routing string.

Frozen intersection remains exactly:

- denominator: `944`;
- material overlap: `115/944`;
- duplicate canonical authoring IDs: `0`.

Therefore FB2-25 takes **zero migration credit**. It does not itself migrate `master.iliya.skill.s1` or `master.taiga.skill.s1`, and it does not authorize `master.zouken.skill.s1`.

## Handoff

The next gate is a fresh process-separated R review of the exact Candidate produced from this result. R must independently verify the exact semantic envelope, near-match fail-closed behavior, trusted game-start execution/idempotency, preservation of FB2-05 set semantics, FB2-14/FB2-15 compatibility, identity-free routing, zero-credit accounting, official gates, exact scope, and final cleanliness.

Only after fresh R acceptance and A synchronization may A re-evaluate Iliya s1 and Taiga s1 for a later Codex S migration batch. Recovery accepted remains `115/944` throughout this B2 task and its R review.
