# P3-B Spartacus Seal-Power Readiness Capability Result

Role: Codex B
Status: `IMPLEMENTATION_CANDIDATE_READY_FOR_FRESH_R`
Date: 2026-09-28
Task: `P3-B-SPARTACUS-SEAL-POWER-READINESS-CAPABILITY`
Exact Base: `7f0dc16fec89bcbbd78681e7cfc3036616a5c68b`
Current owner: `servant.spartacus`
Classification: bounded zero-credit owner-readiness prerequisite

## Owner-readiness-first result

The complete remaining Spartacus owner was preflighted before formal consumer authoring. Historical sc-spartacus-2 is already formally accepted on PR #414 and its required FB2-48 opponent-power reward seam is present on the current line after the synchronized accepted-seam recovery. The only discoverable missing generic runtime family for the remaining sc-spartacus-1/sc-spartacus-3 semantics is the seal-to-combat-total-power family closed by this one batch.

This task contains **no Spartacus consumer authoring and no migration credit**. `data/authoring/**` remains unchanged. After fresh independent acceptance and A-sync/rescan, execution must return to `P3-S-OWNER-SPARTACUS-COMPLETE-MIGRATION` and encode sc1 + accepted-preservation sc2 + sc3 together.

## Source-grounded capability set

Historical source-evidence overlay commit `80aaa029ff20448b92afc4fd115080cd3f34a60c` records:

- sc1: true-name combat power increases for each engaged opponent who used a normal Command Seal or Ruler Seal this round, using the source-defined `6 - 2X` formula where `X` is the controller's remaining normal Command Seal count;
- sc3: the controller's normal Command Seals and controller-owned/distributed Ruler Seals have their effects replaced by `+4 aggregate power`; during Action stage, each unused normal/Ruler seal owned by each engaged opponent contributes `+1 aggregate power`, with distributed Ruler seals counted as distributor/issuer owned.

Locked Reference commit `b2f9fa15fba07c63530bbf4612b03b8b704755f9`, `test/skill-spartacus-package.test.js`, was used only as behavioral observation/recertification evidence. It confirms the expected resource ownership, distinct-opponent usage counting, repeatable physical normal-seal consumption, exact selection among multiple issuer-owned Ruler seals, and live decrease of the unused-seal aura after a seal is spent. Reference behavior does not authorize identity-keyed runtime routing.

## Generic implementation

The new identity-free `command-seal-power-capability` family provides exact fail-closed whole-ability contracts for:

1. current-round engaged-opponent normal/Ruler seal-use detection and distinct-opponent formula power;
2. repeatable normal Command Seal replacement: consume one remaining physical seal and grant `+4 player.combatTotalPower` for the current round;
3. issuer-owned Ruler Seal replacement: auto-consume when exactly one remains, otherwise stage a private non-cancellable exact-seal choice; consume the selected seal and grant `+4 player.combatTotalPower` for the current round;
4. Action-stage current-round live unused-seal aura: each active engaged opponent's remaining normal seals plus issuer-owned unspent Ruler seals contributes `+1`; the authoritative battle participant total recalculates the live value;
5. normal/Ruler current-round usage provenance so sc1-style consumers can observe standard seal use as well as replacement use;
6. exact replacement-provider suppression: legacy normal/Ruler actions remain unchanged when no provider exists, while an exact controlled replacement provider hides the corresponding original action so “effect is changed to” is replacement rather than an additional option;
7. authenticated restore validation for the multi-Ruler `owned_ruler_seal_power_v1` continuation, including exact source/ability/controller/issuer binding, frozen unspent seal-ID domain, amount, constraints, candidate order, and widened-metadata rejection.

Existing Ruler seal ownership remains issuer-scoped. No identity/name/printed-text runtime parser, Chinese-text routing, or SkillLib fallback is introduced.

## R1 fresh-review closure

Predecessor Candidate `f114f650516802e19e38cd882c341e83469d8021` received `IMPLEMENTATION_NEEDS_REVISION`. Canonical same-attempt Coordinator relay after Reviewer GitHub-write 403: `https://github.com/binchen648/fd/pull/470#issuecomment-5857767819`.

Both R1 P1 findings are closed in this successor line:

- restored `rulerSealBindings` now require unique resource IDs, valid issuer/bound players, non-self binding, coherent granted/spent rounds, exact source-controller ownership, and the exact named source ability must satisfy the accepted identity-free Ruler-seal grant semantic; persisted `rulerSealBindingHistory` must exactly match the restored physical binding multiset per issuer/bound pair;
- restored `player.commandSpells`, when present, must be a safe integer in the physical `0..3` domain; widened strings, values above three, negative values, and fractional values fail closed before MatchSession construction.

Focused regressions reproduce the Reviewer counterexamples: an unrelated Ruler-use ability can no longer authenticate a forged restored seal even when the forged history is made coherent, and host-signed `commandSpells='999'` / `999` / `4` / `-1` / `1.5` are rejected while the legal boundaries `0` and `3` round-trip.

## R2 fresh-review closure

Predecessor Candidate `7fd3e7b1ef942a569a36e4b36ff656751f8ca6bd` received `IMPLEMENTATION_NEEDS_REVISION`. Canonical same-attempt Coordinator relay after Reviewer GitHub-write 403: `https://github.com/binchen648/fd/pull/470#issuecomment-5858026355`.

Both R2 P1 findings are closed in this successor line:

- restored Ruler-seal resources are reconciled against exact accepted grant execution provenance: bindings are grouped by exact `(sourceCardId, abilityId)`, the persisted per-game `abilityUsage` must be an integer `1..3`, and the physical binding cardinality must be exactly `2 * usage`; legal maximum usage therefore permits exactly six bindings and an impossible seventh binding fails closed;
- persisted normal/Ruler use-round markers are no longer trusted independently. Normal Command Seal use now carries append-only source/ability/before/after/round provenance, each provenance record is cross-bound to the dedicated authoritative execution counter in `abilityUsage`, and the marker must equal the latest authenticated use record. Ruler use markers are reconstructed against actual issuer-owned physical bindings and their authenticated `spentRound`; marker-only forgeries fail closed.

Focused regressions cover the legal six-binding maximum plus an impossible seventh restored seal, forged normal and Ruler marker-only snapshots, forged normal provenance lacking its execution counter, and successful round-trip of real normal and Ruler use provenance.

## Focused verification

`packages/rules/tests/regression/p3-spartacus-seal-power-readiness-capability.test.ts`: **19/19 PASS**.

Coverage includes:

- exact privileged-shell acceptance and widened/nested near-match rejection;
- normal-seal replacement suppression, repeatable physical consumption, usage-round marking, accumulated +4 bonuses, and next-round expiry;
- legacy normal Command Seal availability and usage marking without a replacement provider;
- legacy Ruler-seal availability without a replacement provider;
- standard Ruler-seal use records `spentRound` and Ruler usage-round provenance;
- one issuer-owned Ruler seal auto-consumes; multiple seals require exact private selection;
- corrupt live continuation rejects transactionally before seal spend/usage/power mutation;
- exact multi-Ruler pending choice round-trips MatchSession while host-signed widened restore metadata is rejected;
- accepted Ruler grant usage and physical binding cardinality round-trip at the legal maximum of six seals while a coherent impossible seventh seal is rejected;
- forged persisted normal/Ruler current-round usage markers reject without backing provenance, while real normal command-spell use and real physical Ruler-seal spend round-trip with their markers;
- sc1 formula deduplicates a player who used both seal types, excludes non-engaged/far players, and ignores prior-round use;
- live unused-seal aura drops immediately when normal or issuer-owned Ruler seals are spent and expires next round;
- authoritative `deriveBattleParticipantsFromState` includes the live dynamic aura in participant `totalPower`;
- compiled-pack privileged corruption rejects before resource consumption or pending-decision staging.

Affected serial verification: **10 files / 226 tests PASS**:

- Spartacus seal-power readiness `19`;
- FB2-27 Ruler seal `13`;
- MatchSession `33`;
- executable-card-pack `50`;
- authoring-interpreter `38`;
- combat-resolver `10`;
- match-session regressions `7`;
- complex-skills regression `37`;
- resolution-dataflow `15`;
- fixed-controller command-seal component `4`.

A broader local probe also invoked `seven-masters-authoring.test.ts`: its four targeted interpreter behavior tests passed, while seven source-fixture assertions failed only because they require external `D:/fd/chm-extract/*.htm` files outside the allowed `E:\Codex\FD` boundary. Those external files were not created or touched, and that unrelated fixture-only suite is not counted in the clean affected PASS above.

Static/content gates:

- `npm run typecheck`: PASS;
- `npm run content:validate`: PASS — `7 masters / 12 servants / 20 events / 0 blocking issues`;
- `npm run content:compile`: PASS — same summary;
- `npm run verify:generated-content`: PASS with unchanged hashes:
  - content `b2c446488a28c5036ac36557e09b563b54b11018d5396233a53f37ffdbff6923`;
  - fixture `fb69383fd91ab56bc645633eae72df8b8c10131cccd2713fd57afcf950a5f057`;
  - evidence `f4ae33de4dc2832766064bdf46e277d9559398d4d34b45d7d05a0eb76744cd14`;
- predecessor-to-worktree `git diff --check`: PASS;
- `data/authoring/**` delta: EMPTY;
- Base-to-worktree production identity audit: `servant.spartacus=0`, `sc-spartacus=0`, `斯巴达克斯=0`, `反叛=0`, `伤兽的咆哮=0`, `不屈的意志=0`, `SkillLib=0`.

## Accounting / continuation

This readiness task is permanently zero-credit. Strict formal accounting remains **`137/944`**, remaining **`807`**.

After exact-Candidate `IMPLEMENTATION_ACCEPTED_CANDIDATE` + A-sync/rescan, return to the same Spartacus formal owner. The later owner-complete Candidate must contain all three skills together; sc2 remains preservation-only and only sc1 + sc3 may add new formal credit. A later formal `MIGRATION_ACCEPTED` + A-sync/accounting can therefore move strict accounting to `139/944`, remaining `805`.
