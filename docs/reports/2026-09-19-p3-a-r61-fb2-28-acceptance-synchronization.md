# P3-A R61 / FB2-28 Event Rule Bridge Acceptance Synchronization

Role: Codex A
Status: `SYNCHRONIZED`
Date: 2026-09-19

## Accepted review input

- Fresh reviewer verdict: `IMPLEMENTATION_ACCEPTED_CANDIDATE`
- Exact A dispatch Base: `4bee0f529f213ca0a5fb72f718dcc9d3113ff508`
- R60 rejected Candidate: `360c561be219aa8c488f0b826c2647e32ec5bd5b`
- Accepted Revision Candidate: `69f2fb09ca951957148f965df459bb3063323800`
- PR: `#369` (`P3-FB2-28: add event rule executable bridge`)
- F1 evidence: `59f145434695d29bdd17e4cb3adc887e84182377`
- Locked Reference: `b2f9fa15fba07c63530bbf4612b03b8b704755f9`

Fresh R61 reports no blocking finding. It independently replays and closes R60's sole blocker: an event moved battlefield -> discard -> battlefield now restores the authoritative saved battlefield location when no override is supplied, preserves visibility/VP/modifiers/rule identity/controller metadata, honors an explicit location override, keeps deck/outside sources without saved locations fail-closed, and validates every batch destination before mutation.

R61 also revalidates the original FB2-28 rules-only event representation, four authoritative event zones, structural event-card selection and movement DSL, executable event placement source/controller context, replay idempotency, product isolation, identity-free routing, zero frozen credit, formal gates, PR topology, and final cleanliness.

## A independent synchronization checks

A independently verified after the R61 verdict:

- fresh A sync worktree starts at exact accepted Revision Candidate `69f2fb09ca951957148f965df459bb3063323800`;
- Revision parent is exact A dispatch Base `4bee0f529f213ca0a5fb72f718dcc9d3113ff508`;
- PR #369 remains OPEN, non-draft, CLEAN, unmerged and unretargeted with exact base/head OIDs;
- locked Reference remains clean at exact `b2f9fa15fba07c63530bbf4612b03b8b704755f9`;
- `origin/main` remains `553779e8ffcc926ae4763ee86a2ea937e090c128`.

A mechanically reconstructed current frozen accounting from authoritative F1 and the exact accepted tree:

- denominator: `943` static + `1` dynamic = `944`;
- authoring archives: `111`;
- authoring cards: `150`;
- unique authoring cards: `150`;
- frozen overlap: `127/944`;
- remaining: `817`;
- duplicate frozen canonical IDs: `0`.

FB2-28 has no authoring/product identity additions and earns zero frozen migration credit.

## Accepted capability envelope

The accepted FB2-28 capability is one identity-free event-card executable/lifecycle bridge:

- rules-only `event_rule_definition_archive` authoring channel compiling into a separate `eventRules` surface without player-card/product leakage;
- structural event-card selection by authoritative zone, tag, and event-set membership;
- authoritative event deck, discard, outside-game, and battlefield lifecycle with stale-token protection and transactional batch movement;
- battlefield metadata round-trip including saved location fallback, visibility, printed VP, static modifiers, rule instance/controller metadata, with explicit location override taking precedence;
- server-owned executable event placement source context and explicit controller semantics;
- structural `event_card`, `event_has_tag`, `event_in_set`, `move_event_card`, and `move_source_event` DSL support;
- trusted trigger source-location predicates and replay idempotency;
- strict fail-closed archive/compiler/runtime boundaries;
- no canonical ID, name, printed-text, Reference-handler, F1-hash, or Reference-hash routing.

R60's location-restoration defect is not accepted history. Only Revision Candidate `69f2fb09...` is accepted by this synchronization.

## Fresh R61 validation accepted by A

Fresh R61 reports:

- offline install: 239 packages, 0 vulnerabilities;
- typecheck PASS;
- reviewer blocker probe: `6/6 PASS`;
- reviewer identity-free runtime probe: `4/4 PASS`;
- focused FB2-28: `3 files / 157 tests PASS`;
- official CI: `141 files / 991 tests PASS`;
- eleven-round MatchSession: about `3907 ms / 5000 ms`;
- rules src + core + regression: `81 files / 488 tests PASS`;
- content validate/compile: `7 masters / 7 servants / 20 events / 0 blockers`;
- generated determinism PASS with unchanged hashes;
- locked Reference verification PASS;
- client production build PASS;
- coverage unchanged at `111 archives / 150 cards / 255 abilities`, compiled `76 / 14 / 0`, routing `22/3/135/0/95/137`;
- automation audit unchanged at `135/3/95/20`;
- `git diff --check` PASS;
- reviewer, Candidate, and Reference final cleanliness PASS.

## Formal frozen accounting after synchronization

Formal recovery-line accepted overlap remains **`127/944` (`13.45%`)**, with **`817`** remaining.

FB2-28 is zero-credit infrastructure. Integrated `origin/main` remains mechanically `111/944`; it is not mixed with recovery-line accounting. PR #369 remains open and unmerged. Historical P3-FM09 remains `MIGRATION_BLOCKED`; no FM10 is dispatched.

## Next coordinator action

Privately recompute dependency completeness for the twelve single-gap `event_card_rule` rows named by the FB2-28 dispatch. The dispatch count of twelve remains an unlock-yield upper bound until that read-only overlay proves exact homogeneous S-ready families. Planning output is not committed to the repository.
