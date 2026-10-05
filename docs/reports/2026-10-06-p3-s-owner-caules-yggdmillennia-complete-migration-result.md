# P3-S Caules Yggdmillennia Owner-Complete Migration Result

Date: 2026-10-06
Task: `P3-S-OWNER-CAULES-YGGDMILLENNIA-COMPLETE-MIGRATION`
Classification: formal owner-complete migration
Exact Base: `c9627d0c2575b91e48472d118db36b0c7f3bfb34`
Accepted parent readiness Candidate: `baeb8610c409f2e0bffecf1735be5b8286696757` (PR #526)
Canonical parent readiness evidence: https://github.com/binchen648/fd/pull/526#issuecomment-5992238581
Accepted staged-declaration privacy follow-up Candidate: `98dada24df0630eb28bed2c33a512102697e9435` (PR #527)
Canonical follow-up evidence: https://github.com/binchen648/fd/pull/527#issuecomment-5998140814
Locked Reference: `b2f9fa15fba07c63530bbf4612b03b8b704755f9`

## Formal scope

This Candidate materializes the complete frozen `master.caules-yggdmillennia` owner scope together, with no per-skill split:

- `master.caules-yggdmillennia.skill.ascension`
- `master.caules-yggdmillennia.skill.s1`
- `master.caules-yggdmillennia.skill.s1a`
- `master.caules-yggdmillennia.skill.s2`
- `master.caules-yggdmillennia.skill.s3`

The exact Base has canonical Caules Yggdmillennia authoring `0/5`; all five identities remain newly creditable and none is preservation-only. The Candidate adds one canonical owner archive, appends it exactly once after Caren in the playtest master sequence, and regenerates the checked-in content/evidence artifacts. Production runtime authority remains identity-free and comes entirely from the independently accepted readiness capability plus its accepted staged-projection privacy follow-up.

Frozen source evidence is grounded by historical source-evidence PR #126 exact head `9d59040a5a7fa9ba356dfc12c1ef8950fce05e78`, F1 frozen inventory evidence, and locked Reference corroboration.

## Materialized behavior

- `s1` provisions both `巴格达电池` (`s2`) and `绞首刑之雷` (`s3`) at game start without duplicating their physical definitions.
- `s1a` forces `绞首刑之雷` inactive at game start and each round end.
- `s2` implements the outpost Workshop choice: gain exactly `+1 mana`, or pay exactly `2 mana` to bind the accepted current-round battle-loss-ignore state; battlefield deployment activates `s3`.
- `s3` is an active required-additional-play skill with the frozen `力量 / 迅捷 / 魔术 / 特殊 / 宝具` declaration set, pre-ascension game-long per-attribute uniqueness, and combat action that sets matching same-battlefield opposing **basic attack** Power to `0` while excluding remote and non-basic cards.
- `ascension` rewrites the `s3` declaration to owner-private until the authoritative combat window, permits repeated declarations, reveals at combat, and schedules the exact next-round 12-card rebuild: `card.cardb3 x2`, `card.cardb4 x3`, `card.carda3 x2`, `card.carda4 x3`, `card.cardluck x1`, `card.cardsurveil x1`.
- The accepted rebuild seam preserves field/attack-area/skill cards, replaces only hand/deck/discard, and uses the shared deterministic runtime shuffle.
- The accepted projection/telemetry privacy seams keep the declaration owner-private before reveal, including staged attack projection, shared MatchSession telemetry, AI telemetry, and restored/legacy projected logs.

Static metadata preserves initial mana `4`; `绞首刑之雷` is `魔术`, printed cost `5`, skill-zone requirement `5`, and base Power `6`. `s2`, `s3`, and ascension begin outside game and enter through the accepted runtime routes.

Production identity audit across `packages/rules/src/**` is CLEAN for the Caules Yggdmillennia id, owner name, skill names, and legacy handler id.

## Canonical pool fixture convergence

Adding the 15th canonical Master changes deterministic character-pool sampling for fixed seeds. The formal affected sweep reproduced four test-fixture assumptions rather than runtime semantic failures:

- three MatchSession fixtures used seeds whose newly sampled owners opened unrelated response windows or changed the isolated Luck battle pairing;
- the predecessor Caren migration test asserted Caren was the final Master archive rather than asserting its stable adjacency after Bazett.

The Candidate updates only those deterministic fixtures: equivalent green seeds preserve each MatchSession test's original scenario, and the Caren/Caules pack-order checks assert exact once-only adjacency rather than brittle tail position. No production runtime behavior is changed by these fixture updates.

## Verification

Formal Caules Yggdmillennia owner regression: `10/10 PASS`.

Task-relevant affected aggregate: `204/204 PASS` across 14 files, including the parent readiness suite, staged projection/MatchSession path, Caren predecessor order, executable authoring, ascension unlock, deployment choice/resource routes, numeric resource seams, and existing Suzuka battle-loss-ignore consumers.

Repository gates:

- `FD_TOOLCHAIN_OK`.
- `npm run typecheck`: PASS.
- `npm run content:validate`: PASS — `15 masters / 19 servants / 20 events / 0 blocking issues`.
- `npm run verify:generated-content`: PASS.
  - content library: `c69f9df2ae06627e4e2daddf3b5f0078dde9e7294b88d3973c35961fbfd0e6a0`
  - fixture: `87542f5da07effcf6bba03efd963ae964dde99af4f6c3c63352225e870c96e6c`
  - evidence report: `9bcf081cc00a45806d55a379cfc6af68618d9258e92df9f8d96351955adda50e`
- Phase-3 coverage: PASS — `archives=121`, `cards=244`, `abilities=436`, `compiledCards=169`, `compiledCharacters=34`, `blockingIssues=0`, `newRuntimeSemanticRouted=22`.
- Phase-3 automation audit completed — `legacyResolveEffect=158`, `legacyExecuteAbility=3`, `notClassifiable=253`, `promotionFindings=20`.
- Coverage/audit tracked artifacts were verification side effects and were restored byte-for-byte from Exact Base; they are not Candidate changes.
- production identity / Chinese printed-text routing audit: CLEAN.
- `git diff --check`: PASS.

## Accounting gate

No migration credit is counted at Candidate publication. Strict formal accounting remains `211/944`, remaining `733` until this exact Candidate receives fresh independent `MIGRATION_ACCEPTED` and FORMAL performs the acceptance synchronization/accounting transaction. If the acceptance rescan confirms the same five identities remain newly creditable, the lawful post-acceptance total will become `216/944`, remaining `728`; this report does not pre-credit that increment.
