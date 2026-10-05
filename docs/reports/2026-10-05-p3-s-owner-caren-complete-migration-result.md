# P3-S Caren Owner-Complete Migration Result

Date: 2026-10-05
Task: `P3-S-OWNER-CAREN-COMPLETE-MIGRATION`
Classification: formal owner-complete migration
Exact Base: `d665f45a0dc503fbaf9611bc3c05522f94255b11`
Accepted readiness Candidate: `c64d3f1d389efd40a16005e9d02cd22780a5d79c`
Canonical readiness evidence: https://github.com/binchen648/fd/pull/524#issuecomment-5990302105
Locked Reference: `b2f9fa15fba07c63530bbf4612b03b8b704755f9`

## Formal scope

This Candidate materializes the complete frozen Caren owner scope together, with no per-skill split:

- `master.caren.skill.ascension`
- `master.caren.skill.s1`
- `master.caren.skill.s1a`
- `master.caren.skill.s2`
- `master.caren.skill.s3`

The Base has canonical Caren authoring `0/5` and no prior Caren migration or preservation-only credit. The Candidate adds one canonical `master.caren` authoring archive, appends it once to the playtest master archive list, and regenerates the checked-in compiled content/evidence artifacts. Runtime authority remains identity-free and comes entirely from the independently accepted complete readiness capability.

Frozen source/static evidence is taken from exact source-evidence Candidate `d74bd590ff589b3b8dcaf35192adef6429bfaa5d`, its accepted evidence chain ending at `9b3fc778245c90d23cc9927d7674411141750699`, and the locked Reference for corroborating static metadata.

## Materialized behavior

- `s1` provisions `s2` at game start and removes it on the first authoritative mana crossing from `>1` to `<=1`, independent of the authoritative decrease route.
- `s1a` provisions `s3` on the first servant-package reveal path without duplicating the physical definition.
- `s2` halves an eligible same-location opponent VP gain using floor-half correction, loses only actually available mana, and gains equal VP to the actual mana lost.
- `s3` binds one engaged opponent for the round, applies a controller-chosen `-1..-5` total-power penalty, blocks ordinary own-turn movement, and removes the source if that bound target loses during the round.
- `ascension` preserves the frozen 1-cost / 7-Power Agility+Noble-Phantasm static metadata and 8-mana skill-zone gate, provisions `s3` on ascension unlock, and grants each qualifying opposing battle winner `+3 VP` through the accepted terminal semantic.

Production identity audit across `packages/rules/src/**` is CLEAN for `master.caren`, Caren names, and printed skill names.

## Verification

Formal Caren owner regression: `9/9 PASS`.

Task-relevant affected aggregate: `186/186 PASS` across 13 files, including Caren readiness, Shuten owner-complete parity, resource numeric room boundary, Master ascension unlock, authoring interpreter, executable pack, MatchSession, movement, resource triggers, and card-action play/response/activate routes.

Repository gates:

- `FD_TOOLCHAIN_OK`.
- `npm run typecheck`: PASS.
- `npm run content:validate`: PASS — `14 masters / 19 servants / 20 events / 0 blocking issues`.
- `npm run verify:generated-content`: PASS.
  - content library: `b5fb6dca891649bc9f2bfe8b00b1771db86537847b055f81608118b5e3bfdea9`
  - fixture: `87542f5da07effcf6bba03efd963ae964dde99af4f6c3c63352225e870c96e6c`
  - evidence report: `b2081e4df1f0b814c7337f4579733c214f926e93f0eabe1e1fd241afbe05a1f1`
- Phase-3 coverage: PASS — `archives=120`, `cards=239`, `abilities=424`, `compiledCards=163`, `compiledCharacters=33`, `blockingIssues=0`.
- Phase-3 automation audit completed — `legacyResolveEffect=157`, `legacyExecuteAbility=3`, `notClassifiable=242`, `promotionFindings=20`.
- `git diff --check`: PASS.

A broad `npm run test:ci -- --maxWorkers=1` convergence sweep completed with `1504 PASS / 58 FAIL` across `206` files. The 58 failures are inherited F5-wide baseline hazards already present outside the Caren owner scope (historical fixed-seed owner expectations, stale archive-order/accounting assertions, old replay/runtime fixtures, current fixture composition gaps, and unrelated legacy capability tests). None is a Caren focused/affected failure; the 13-file affected aggregate above is fully green. This formal owner Candidate does not widen scope to repair unrelated F5 convergence debt.

## Accounting gate

No migration credit is counted at Candidate publication. Strict formal accounting remains `206/944`, remaining `738` until this exact Candidate receives fresh independent `MIGRATION_ACCEPTED` and FORMAL performs the acceptance synchronization/accounting transaction. At that point, newly creditable is exactly five identities: `211/944`, remaining `733`.
