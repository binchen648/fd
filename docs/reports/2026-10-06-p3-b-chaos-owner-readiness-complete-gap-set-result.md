# P3-B Chaos Owner Readiness Complete Gap Set Result

Date: 2026-10-06
Task: `P3-B-CHAOS-OWNER-READINESS-CAPABILITY`
Branch: `codex/b-p3-chaos-owner-readiness-complete-gap-set`
Exact Base: `87a0a9d15e5799742d8c41c6a11cbd7e64ffa3c9`
Locked Reference: `b2f9fa15fba07c63530bbf4612b03b8b704755f9`
Classification: zero-credit complete-owner readiness

## Frozen scope / accounting

`master.chaos` contains exactly 18 frozen identities: ascension plus `s1` through `s17`. Canonical `data/authoring/masters/master.chaos.json` is absent at Exact Base, so canonical coverage remains `0/18`. Historical FB2-03 membership of `master.chaos.skill.s7` is reusable Resource Numeric component evidence only and grants no migration credit.

Strict formal accounting therefore remains `223/944`, remaining `721` throughout this readiness transaction.

## Complete owner-local readiness family

The implementation closes the complete reproduced Chaos owner gap set through one structural, identity-free definition-side-deck family. No production branch routes on `master.chaos`, owner name, printed skill names, or `core.chaos-*` handlers.

- `s1`: server-owned isolated 15-definition Beast deck/hand/discard; actual mana gain draws `floor(actualGain/2)`; Beast plays occur only through the provider action; printed cost is paid by discarding other Beast-hand cards; played Beasts return to the isolated discard; s3/explicit suppressions do not recursively draw.
- `s2`: source card gains +1 Power for each active same-battlefield opponent.
- `s3`: discard up to three Beast-hand cards for 2 mana each without triggering the Beast mana observer.
- `s4`: on-play schedules next-round draw three then mandatory discard two with exact source/ability provenance and restore validation.
- `s5`: an opponent entering the source location receives -5 total Power for the current round.
- `s6`: trusted controller battle loss draws two Beast cards.
- `s7`: trusted controller win grants +2 VP while each trusted battle loser loses up to 2 VP with the normal zero floor.
- `s8`: combat action selects one engaged opponent controlling the authored required definition and marks that player defeated for the round.
- `s9`: same-battlefield authored target definition Power is forced to zero.
- `s10`: consumes the existing accepted terrain-doubling seam.
- `s11`: played residual converts the one-shot Scrambled Seal into one ordinary Command Seal and closes/returns the source when a seal is spent or used.
- `s12`: choose X from 1..8, move along legal arrows up to X, and grant the source `1+X` Power for the round.
- `s13`: choose X and discard exactly one same-location event whose VP equals X+2.
- `s14`: controller attacks carrying the authored Noble-Phantasm attribute receive +2 Power.
- `s15`: engaged same-battlefield opponents who have neither spent nor used a Command Seal this round receive -3 total Power.
- `s16`: on play discard all remaining Beast hand; source Power becomes `2X`, capped at 10.
- `s17`: one game-long four-way choice: one bonus Beast play, gain 2 mana plus exactly one Beast draw, arm +2 VP on the next trusted win, or move to an adjacent location. The choice is consumed exactly once.
- ascension: Beast Nest play limit becomes unlimited each round and action-phase pay 4 mana draws one Beast without recursive mana-observer draw.

The accepted generic family uses exact structural shapes and fail-closed privileged routing. Side-deck deck/hand/discard cards are owner-only in projection and become public only after actual play. Runtime restore provenance verifies provider source, exact physical membership and zones, unique definition set, event cursor, virtual seal source, live pending interaction and round markers.

## Verification

- focused Chaos complete-owner readiness: `14/14 PASS`.
- stable task-relevant affected aggregate: `137/137 PASS` across 10 files with one worker:
  - MatchSession `34/34`;
  - authoring interpreter `38/38`;
  - Spartacus seal-power readiness `20/20`;
  - Chaos focused `14/14`;
  - plus movement, persistent terrain, master-ascension, Resource Numeric direct action and fixed command-seal/resource component regressions.
- `npm run typecheck`: PASS.
- `npm run content:validate`: PASS — `17 masters / 19 servants / 20 events / 0 blocking issues`.
- `npm run verify:generated-content`: PASS:
  - content library `071a195543ddf1b5ebddfc0fe6e48e8d29e7cf41d8873ea20284ab8839c14c2b`
  - fixture `87542f5da07effcf6bba03efd963ae964dde99af4f6c3c63352225e870c96e6c`
  - evidence report `607542ffb2e1b165665c7df9a5c2be2e82312854e0a91cd2260ae8c7ccd2c219`
- Phase-3 coverage: `archives=122`, `cards=251`, `abilities=446`, `compiledCards=179`, `compiledCharacters=36`, `blockingIssues=0`, `newRuntimeSemanticRouted=22`.
- automation audit: `legacyResolveEffect=158`, `legacyExecuteAbility=3`, `notClassifiable=263`, `promotionFindings=20`.
- coverage/audit output files were verification-only and restored byte-for-byte from Exact Base.
- `data/authoring/**` delta: EMPTY.
- production Chaos identity / printed-text / legacy-handler audit: CLEAN.
- `git diff --check`: PASS.

A broad exploratory historical-fixture sweep was also run. Its failures were fixed-seed/fixed-pool assumptions already stale under previously accepted roster expansion plus legacy simulation/restore fixtures outside this zero-authoring readiness delta; those unrelated tests are intentionally not edited or represented as Candidate-green evidence. The production MatchSession suite itself is green `34/34`.

## Gate

This Candidate is readiness/capability only and permanently zero-credit. A fresh independent exact Base/Candidate review must return `IMPLEMENTATION_ACCEPTED_CANDIDATE` before FORMAL may perform the zero-credit A-sync/full-owner rescan and release one Chaos owner-complete consumer migration covering all 18 frozen identities together.
