# P3-S Owner Bazett Complete Migration Result

Date: 2026-10-05

## Task boundary

Task: `P3-S-OWNER-BAZETT-COMPLETE-MIGRATION`

Exact Base: `84e2fab939de6ce1b1cc307488b749b80ce8cc92` (accepted Bazett readiness A-sync).

Frozen owner scope is exactly ten identities:
- `master.bazett.skill.ascension`
- `master.bazett.skill.s1`
- `master.bazett.skill.s1a`
- `master.bazett.skill.s1b`
- `master.bazett.skill.s1c`
- `master.bazett.skill.s1d`
- `master.bazett.skill.s2`
- `master.bazett.skill.s3`
- `master.bazett.skill.s4`
- `master.bazett.skill.s5`

Base canonical authoring contains only `master.bazett.skill.s1b` (1/10). That identity was already accepted/credited in FM08 and is preservation-only. This Candidate materializes the other nine identities together; no partial credit and no duplicate `s1b` credit.

Strict accounting remains `197/944`, remaining `747` until fresh independent `MIGRATION_ACCEPTED` + FORMAL A-sync. On acceptance, newly creditable is exactly 9, advancing to `206/944`, remaining `738`.

## Accepted readiness consumed

The formal consumer uses the complete identity-free readiness accepted on PR #522, exact Candidate `566c086f168b23883a1c064ec35f598404fed8df`, canonical bounded relay https://github.com/binchen648/fd/pull/522#issuecomment-5982765629.

Runtime semantics are structural; no `master.bazett`, Bazett printed title, or `core.bazett-*` branch is added to production runtime.

Consumer mapping:
- `s1`: accepted game-start skill provisioning -> Fragarach;
- `s1a`: logical-day initialize/advance/loss-reset plus climax -5 VP while not Awake;
- `s1b`: historical accepted Day-1 -2 total Power rule preserved byte-for-object-equivalent;
- `s1c`: Day-2 exact Fragarach 8-mana prerequisite / per-game-limit override and +2 VP on win;
- `s1d`: Day-4 win -> Awake;
- `s2`: Fragarach cost 1 / base Power 4 / Magic attribute / 8-mana skill-zone prerequisite; arm next same-location opponent Noble-Phantasm card-or-ability use -> Defeat; once per game baseline;
- `s3`: next-round Reset -> Day 1 +1 VP and configured Fragarach closure;
- `s4`: Awake settlement restores 3 command seals and returns Fragarach;
- `s5`: Day-3 outside-game stage -> skill -> zero-cost join to attack, base Power 5 / Strength attribute, +3 VP on win;
- `ascension`: source-bound Fragarach per-game-limit removal and residual persistence.

Static names/card-face metadata are corroborated by locked Reference `b2f9fa15fba07c63530bbf4612b03b8b704755f9`; frozen F1 evidence plus accepted readiness remains semantic authority.

## Canonical integration

- `data/authoring/masters/master.bazett.json`: Base 1/10 -> Candidate 10/10; exact `s1b` JSON object preserved; newly materialized = 9.
- `data/packs/fd-playtest-v1/pack.json`: Bazett appended once after Araya; master count 12 -> 13.
- generated content library/evidence report regenerated deterministically; fixture hash remains unchanged.
- production identity audit under `packages/rules/src`: CLEAN.

The 13-master roster changed deterministic pairings for three old MatchSession fixtures. No production behavior was modified. The tests now use the existing bounded master-inclusion seed helper for Irisviel/Kiritsugu and a mechanically verified current-roster seed `1` for the one-round auto-run; all original behavior assertions remain intact.

## Post-return provenance finding and successor closure

Exact Candidate `9a457a38aa9118cecee410f6b4c133a1d10fac5c` received historical fresh Reviewer verdict `MIGRATION_ACCEPTED`; its bounded same-attempt evidence relay is https://github.com/binchen648/fd/pull/523#issuecomment-5982980953. That review result remains a historical fact and was not repeated.

Before lawful promotion/accounting, FORMAL read HELPER Epoch 47 and independently reproduced a cross-capability provenance contradiction in the accepted Candidate:
- first Day-3 staging wrote current-round `playedRound` despite not being a card play;
- discard-to-skill second-cycle restaging rewrote `playedRound` to the current round;
- zero-cost Day-3 skill-to-attack join rewrote `playedRound` to the current round;
- accepted generic source-skill attack-join policy preserves genuine prior play provenance and otherwise initializes non-current provenance;
- generic `played_this_round` target consumers directly compare `cardState.playedRound` with the current round.

The premature A-sync commit `ac38ec7a594559e5d8aab918873aca0bb4f8c5ef` was superseded before promotion by correction commit `177fc4986dc4d50b80f2a2bd7ebd598fde4280df`; neither changes the historical Reviewer verdict, and neither awards Bazett migration credit. Effective accounting remains `197/944`, remaining `747`.

This successor closes the finding structurally and identity-free:
- new Day-3 physical staging initializes `playedRound` to `max(0, currentRound - 1)`;
- discard-to-skill restaging preserves any existing `playedRound`; if runtime state is absent it initializes non-current provenance;
- restaging clears stale `paidManaOnPlay` while leaving genuine historical play provenance untouched;
- zero-cost skill-to-attack join preserves existing `playedRound`; absent state initializes non-current provenance, then sets only active/face-up/`paidManaOnPlay=0`;
- a real Bazett authoring regression proves real `master.bazett.skill.s5` is excluded from a generic `played_this_round` target window after Day-3 staging/join, while a current-round control remains eligible; a bug-control clone proves the same Day-3 physical would become eligible if `playedRound` were forged current.

No Bazett identity branch was added to production runtime.

## Verification

Focused consumer:
- Bazett owner-complete: `10/10 PASS` (includes real-authoring `played_this_round` cross-consumer regression).
- accepted Bazett readiness: `15/15 PASS` (includes first-stage/join provenance, second-cycle restage preservation, genuine prior-play preservation, and cross-consumer target filtering).
- accepted generic source-skill attack-join: `5/5 PASS`.
- Sigurd revealed-source / `played_this_round` consumer: `7/7 PASS`.

Affected aggregate: `189/189 PASS`:
- Bazett formal 10;
- Bazett readiness 15;
- generic source-skill attack-join 5;
- Sigurd revealed-source 7;
- MatchSession 33;
- authoring-interpreter 38;
- executable-card-pack 50;
- Akasha readiness 17;
- Alice readiness 10;
- card-action-play 4.

Repository gates:
- `FD_TOOLCHAIN_OK`;
- typecheck PASS;
- content validate/compile PASS: `13 masters / 19 servants / 20 events / 0 blocking issues`;
- generated determinism PASS; hashes: content library `d9f3f693a0a2df0f3832ba19e9956d32bec8f857a4a8deeef7766a0805f8183e`, fixture `87542f5da07effcf6bba03efd963ae964dde99af4f6c3c63352225e870c96e6c`, evidence report `051e9d4877e7c7b1e227633e3385e3edfa4851e304f6d7c6b75171808c5a0a0f`;
- Phase-3 coverage scratch PASS: `archives=119 / cards=234 / abilities=417 / compiledCards=157 / compiledCharacters=32 / blockingIssues=0`;
- Phase-3 automation audit scratch completed;
- Base authoring = 1/10, Candidate authoring = 10/10, newly materialized = 9, `s1bPreserved=true`;
- production Bazett identity audit CLEAN;
- `git diff --check` PASS.

## Review gate

No migration credit is awarded before fresh independent review. Candidate must remain frozen after handoff. Terminal formal verdict is expected to be `MIGRATION_ACCEPTED`, `MIGRATION_NEEDS_REVISION`, or `MIGRATION_BLOCKED` according to the current owner-complete review contract.
