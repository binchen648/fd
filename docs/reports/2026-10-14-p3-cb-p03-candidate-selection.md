# P3-CB-P03 Candidate Selection Packet

Task: `P3-CB-P03-A-SELECT`
Role: Codex A / Evidence and Candidate Analyst
Control Epoch: `FD-P3-2026-09-23-09`
Exact current main: `a42b5e1c517141b90f3407773958b0d8afe63264`
Final status: `NO_VALID_BATCH_FOUND`

This differs from P02: P02 tested two selected initial-mana identities. P03 searches for 2-4 whole, genuinely unconnected identities sharing an existing production contract, excluding new owner admission, initialization, authority, trigger/lifecycle work and mixed mechanics.

Machine packet: `artifacts/phase3-cb-p03-candidate-selection.json`
SHA-256: `703A44F979C123503BD4BC8342D813226C5F8AA535CE10592B7FE2EA03B46FE4`

## Exact Search Boundary

- Fresh origin/main fetch and remote lookup agree with the bound SHA.
- Frozen inventory contains 943 static plus one dynamic identity; accepted list contains 111. Remaining static=832, dynamic=1, total=833.
- 127 current master/servant archives were scanned read-only.
- Within the existing 14 playable owners, 19 frozen static identities are outside accepted-111: 14 named-product correspondences and five ascensions. All 19 are individually retained with reasons in the packet.
- The existing seven playable servants' 21 canonical skill identities are already credited; they cannot supply new identities.
- Five further exact canonical definitions are registered as rules-only content, but no playable owner entry exists. Their registry presence is not a production-instantiation proof.
- Source text, clause sources, accepted membership, current library, primitives/routes and focused evidence files are bound to exact Git objects/hashes. Named-product correspondences are analyst hypotheses, not accepted mapping.

## Candidate Matrix

| Identity / candidate | Existing contract / primitive | Current registry | Missing piece / scope conflict | Runtime change needed | Eligible |
| --- | --- | --- | --- | --- | --- |
| Kiritsugu s2 / Time Alter | Exact PLAY; play_selected_cards + draw_cards | Named definition PRESENT | One identity; draw companion excluded; full-text target restriction needs review | No for existing shape; broader shape prohibited | NO |
| Kiritsugu s3 | CLOSE + ACTIVATE components | Square Accel PRESENT, directive | Composite combat contract unproven; one identity | Unproven compound runtime | NO |
| Maiya s1 | Typed ADD_TO_ATTACK | Named military/support-shot PRESENT | Whole skill also setup and round cleanup; one identity | No for attachment alone; other contracts excluded | NO |
| Sion s13 | PLAY component | ABSENT; owner ABSENT | Discard + VP payment differs from exact PLAY; owner admission needed | New contract/admission required | NO |
| Kayneth s1 | Play-rule exception lookup | Named double-master PRESENT | One identity; owner-wide permission not proven by card-local modifier/directive test | UNKNOWN; cannot assume mapping-only | NO |
| Kintoki sc1 + sc2 | Reveal/play exceptions/once-per-game | Both PRESENT | Both already credited and connected | None justified for new migration | NO |
| Atalanta sc3 + Baobhan sc3 | Direct VP primitive | Archives only | Both already credited; owners absent; whole text includes battle-loss trigger | Admission/excluded dependency | NO |
| Ciel s2 + Darnic s1a | Resource primitives | Ciel rules-only; Darnic absent | Battle and round triggers; different complete contracts | Excluded admission/contracts | NO |
| Iliya s1 + Taiga s1 | game_start set_mana | Archives only | P02 initialization and admission conflict explicitly excluded by P03 | Numeric primitive exists; entry decision missing | NO |
| Gatou + Olga command-spell gain-mana controls | Direct adjust_mana + adjust_command_seals | Both PRESENT and routed | Existing zero-increment controls, not new frozen skill identities | None | NO |

The JSON rows additionally list literal candidate files, hot-file impact and historical risks. File lists are feasibility proposals, not implementation reservations. No interpreter, MatchSession or core authority modification is proposed or authorized.

## Fresh Inventory Evidence

`node docs/audits/fd-card-action-play-inventory.mjs`: exit 0; sourceFiles=127, cardActionSemanticAbilities=35, exact shape eligible=1, skipped=34. The sole shape is Time Alter.

`node docs/audits/fd-resource-numeric-core-direct-action-inventory.mjs`: exit 0; sourceFiles=127, resourceNumericAbilities=78, eligible=13, migrated=13, blocked=58, special=7, skipped=65. Two entries are existing command-spell controls; eleven are Independent Action abilities. Ability-level eligible/migrated counts are not new whole-identity acceptance or admission.

Both complete outputs are embedded in the machine packet. No runtime, compiler, unit, browser or full CI tests were run. This is source/selection evidence, not execution acceptance.

## Historical And Negative Boundaries

Retained risks include component-to-whole-shape inference, archive/registry-to-runtime inference, duplicated frozen credit, per-card versus owner-wide semantics, reused ability IDs, and stale source/review binding. Current Kayneth regression checks a directive; it does not prove the printed owner-wide exemption across other cards. No runtime defect is repaired or accepted here.

Any future re-scoped implementation must preserve exact full-text mapping, duplicate rejection, wrong phase/source/controller rejection, corrupted shape and legacy-fallback rejection, complete state/event/revision atomicity, and evidence bound to both canonical card identity and ability identity.

## Handoff

The current constraints produce zero valid 2-4 identity batches. Planner must explicitly choose a different boundary or a singleton existing-owner contract before a Lead task can be granted. Do not silently pad a batch, mix contracts, relabel an existing control as a new identity, or import recovery-line PASS.

Code/runtime/authoring/registry/KPI changes: NONE.
Main, migration and denominator delta: 0.
Lead Builder writes: NOT AUTHORIZED.
PR: NOT CREATED.
Global Gate C: NOT_VERIFIED.
93 missing-image Release blockers and long-term stability gaps remain.

Final status: `NO_VALID_BATCH_FOUND`.
