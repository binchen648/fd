# P3-A Teach Owner Readiness Capability Acceptance Synchronization

Role: Codex A
Status: `SYNCHRONIZED`
Date: 2026-09-29

## Accepted input

- PR: `#483`
- Exact Base: `1987bfe9e23037c2e682fba15bc83fbff8cf33c0`
- Exact accepted Candidate: `964db288d809cabd9150afdcf08dc3f306b9ab4e`
- Canonical fresh-R evidence: `https://github.com/binchen648/fd/pull/483#issuecomment-5883800548`
- Verdict: `IMPLEMENTATION_ACCEPTED_CANDIDATE`
- ReviewJobKey: `pr483:964db288d809cabd9150afdcf08dc3f306b9ab4e`
- Exact-Candidate Phase 3 Gate: `36522217489` — `SUCCESS`

The fresh independent Reviewer completed the exact-Candidate review. Reviewer-side GitHub publication returned explicit 403, so the Coordinator published one bounded same-attempt relay. No second review is used for this synchronization.

## Accepted bounded readiness scope

The accepted zero-credit transaction closes the complete currently discoverable generic battle-plunder / recorded-replay readiness family required by Teach sc1 + sc2:

- authoritative contested-win competition-VP replacement only when the post-scoring result contains an authoritative loser;
- authoritative loser selection plus physical top-three deck reveal, exactly one physical-card removal, printed base Power gain capped at 5, and arbitrary ordering of the kept exposed cards;
- persisted exact removed-card authority bound to controller/source/ability/original owner/trusted battle result/winning trigger/record key/revision and exact server-created top-three removal evidence;
- Action replay of exactly one recorded removed physical card with normal play semantics and a 2-mana minimum paid cost, preserving original ownership while changing controller for play;
- replay-source skill removal after the battle terminal;
- pending-decision and persisted-authority restore/provenance validation with malformed, stale, widened, replayed, or forged metadata failing closed;
- reward replacement and post-scoring trigger use the same authoritative-loser relation: battle participant non-winners minus `lossEffectSuppressedPlayerIds`.

The accepted implementation adds no Teach consumer authoring and introduces no Teach/card-name/printed-text runtime parsing, legacy `core.teach-*` routing, or `SkillLib` fallback.

## Review closure

Fresh R confirmed exact Base/Candidate lineage, fixed clean Reviewer, exact PR scope, locked Reference, zero-credit boundary, and no exact-scope/shared-diff blocker. Exact Candidate evidence includes focused Teach + combat resolver `2 files / 19 tests PASS`, shared Teach + Suzuka readiness + MatchSession `3 files / 50 tests PASS`, `FD_TOOLCHAIN_OK`, typecheck PASS, empty `data/authoring/**` delta, production identity audit CLEAN, and `git diff --check` PASS. The exact-Candidate Phase 3 Gate `36522217489` is `SUCCESS`.

The predecessor literal all-winner/no-loser and persisted removed-card substitution findings were already closed before this accepted Candidate. The final predecessor P1 is also closed: competition-VP replacement now uses the same loser semantics as GameLoop/MatchSession post-scoring construction. Focused regressions cover both a sole loss-suppressed non-winner, which keeps ordinary competition VP and opens no plunder, and an excluded-from-winning but unsuppressed participant, which remains an authoritative loser and still enables replacement/plunder.

## Mandatory A-rescan of the complete Teach owner

Frozen owner scope remains exactly:

1. `servant.teach.skill.sc-teach-1`
2. `servant.teach.skill.sc-teach-2`
3. `servant.teach.skill.sc-teach-3`

Mechanical A-rescan against the exact accepted runtime confirms current canonical authoring still contains only `servant.teach.skill.sc-teach-3`. sc3 is historical accepted FM01 material and remains preservation-only. sc1 + sc2 are the only missing/newly creditable Teach consumers.

The accepted battle-plunder / recorded-replay readiness family closes the complete currently discoverable shared blocker for sc1 + sc2. Production runtime remains identity-free for Teach (`servant.teach`, `sc-teach`, and `core.teach-` have no production runtime hits). No additional bounded readiness task is authorized unless formal consumer implementation mechanically exposes a genuinely new source-grounded blocker.

Owner-readiness is therefore CLOSED and execution is authorized to enter one owner-complete formal Teach migration containing new sc1 + sc2 plus preserved sc3 together.

The latest HELPER report read immediately before this A-sync was Epoch 9 PRE-R for predecessor `bf33b3d76c6241592987cc0204c7be056f4d203d`; it is stale auxiliary preparation evidence only and grants no verdict, scope, or credit. All A-sync conclusions above were mechanically revalidated against exact accepted Candidate `964db288d809cabd9150afdcf08dc3f306b9ab4e`.

## Accounting and continuation

This A-sync grants zero migration credit. Strict formal accounting remains **`149/944`**, remaining **`795`**.

Next task: `P3-S-OWNER-TEACH-COMPLETE-MIGRATION`.

The formal unit is one Teach owner batch containing all three frozen skills in one Candidate, one PR, one fresh R, and one A-sync/accounting transaction before advancing to the next owner. Only sc1 + sc2 are newly creditable; sc3 remains `+0` preservation-only.
