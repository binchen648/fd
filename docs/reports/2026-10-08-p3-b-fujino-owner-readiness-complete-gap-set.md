# P3-B Fujino Owner Readiness Complete Gap Set

Date: 2026-10-08
Task: `P3-B-FUJINO-OWNER-READINESS-CAPABILITY`
Branch: `codex/b-p3-fujino-owner-readiness-complete-gap-set`
Exact Base: `ab166083772921c598fba53670b4a9ef04455ac6`
Locked Reference: `b2f9fa15fba07c63530bbf4612b03b8b704755f9`
Classification: zero-credit complete-owner readiness for `master.fujino`

## Frozen owner scope

Exactly six frozen identities:

- `master.fujino.skill.ascension` — 痛觉残留
- `master.fujino.skill.s1` — 浅神之嗣
- `master.fujino.skill.s1a` — 无痛症
- `master.fujino.skill.s2` — 扭曲空间
- `master.fujino.skill.s3` — 歪曲之魔眼
- `master.fujino.skill.s4` — 创伤

At exact Base, canonical Fujino consumer materialization is `0/6`:
- `data/authoring/masters/master.fujino.json`: ABSENT
- active-pack Fujino registration: ABSENT
- this readiness Candidate has no `data/authoring/**`, `data/packs/**`, or `data/phase3/**` delta
- migration credit: `+0`
- strict accounting remains `261/944`, remaining `683`.

## Reused accepted authority

`s1` does not require a new owner-specific runtime seam. The repository already carries the accepted identity-free, game-start-only skill-provisioning authority from the fresh FB2-15 recovery line:
- accepted FB2-15 Candidate `23a666913a3050ad55d781e3f5b3a1518add4c3e`
- fresh R41 verdict `IMPLEMENTATION_ACCEPTED_CANDIDATE`
- A synchronization report: `docs/reports/2026-09-17-p3-a-r41-fb2-15-recovery-synchronization.md`

That accepted boundary remains zero-credit infrastructure and is only reused later by the formal Fujino consumer.

## Complete owner-local readiness closure

The remaining owner-local readiness gap is one bounded, identity-free Injury/Warp subsystem. It covers the locked-Reference semantics needed by ascension, s1a, s2, s3, and s4 without materializing any Fujino consumer identity.

### G1 — injury state, private draw/choice, and fail-closed provenance

New generic `injury_warp_ruleset` and `injury_warp_draw_choice` authority provides:
- one provider-bound injury deck/state per controller + authored state key;
- exact six-key injury inventory;
- owner-only, non-cancellable private choice over the exact drawn injury candidates;
- exact live candidate/revision/source/ability/continuation validation;
- deterministic runtime state and closed-world restore provenance;
- widened/forged provider, pending choice, injury inventory, pain state, or topology state fails closed.

No Fujino identity, name, printed text, or `core.fujino-*` production routing is introduced.

### G2 — locked-Reference injury consequences

The identity-free ruleset supports the exact accepted parameter envelope:
- head injury: one immediate random hand discard and one generic controller-action-window random discard while active;
- shoulder injury: `-1` Basic Attack Power;
- stomach injury: deployment cannot consume terrain slots whose values are `+2` or `+3`;
- wrist injury: each authoritative Command-Seal decrement costs `1 VP`;
- leg injury: one own-turn movement costs `1 mana`;
- spinal injury: activates the linked distortion attack, clears the injury deck, converts all current injuries plus spinal into Pain count, and permanently records spinal occurrence.

Command-Seal observation is connected to the existing authoritative `markCommandSealSpent` path rather than a Fujino-specific route. Movement penalty is connected to the generic movement reducer and effect-movement path.

### G3 — Pain lifecycle and ascension reward

After spinal conversion:
- each remaining Pain reduces Master-skill play cost by exactly `1`;
- one Pain clears on the single battle-phase terminal `after_battle_ended` event;
- ascension unlock records generic ascension authority and creates at most one additional linked distortion-skill copy so the owner can hold at most two physical copies;
- if spinal occurred, ascension is unlocked, and Pain reaches zero, the controller receives exactly `+4 VP` once.

The battle terminal is keyed by one `battlePhaseResolutionId`, so Pain is not decremented once per battlefield.

### G4 — Warp topology and all movement consumers

The accepted topology override replaces the authored directed links while its linked physical skill is active, and repair closes the override.

The same effective topology is consumed by:
- normal movement pathfinding;
- interpreter arrow reachability and reverse-arrow traversal;
- definition-side-deck adjacency/forward reachability;
- multi-presence directed path and mirrored-target calculations.

This prevents a split runtime where ordinary movement sees the warped graph but another generic movement consumer still uses the base map. Conflicting simultaneous replacement authorities fail closed.

### G5 — stomach deployment integration

The stomach restriction is not merely a query helper. MatchSession deployment legality and terrain-slot assignment both use the same injury-aware available-slot calculation, so a battlefield whose remaining terrain values are entirely forbidden is not offered as a legal deployment destination.

## Identity-free / consumer boundary

Production-diff audit is clean for:
- `master.fujino`
- 浅上藤乃
- 痛觉残留
- 浅神之嗣
- 无痛症
- 扭曲空间
- 歪曲之魔眼
- 创伤
- `core.fujino-`

The canonical Fujino consumer remains absent. This transaction is permanently zero-credit.

## Verification

Focused Fujino readiness:
- `p3-fujino-owner-readiness-complete-gap-set.test.ts`: `7/7 PASS`

Affected shared/runtime validation:
- Fujino readiness: `7/7 PASS`
- Fou readiness: `6/6 PASS`
- Fou owner-complete: `4/4 PASS`
- any-location-except-workshop movement: `7/7 PASS`
- Raido movement readiness: `6/6 PASS`
- MatchSession: `34/34 PASS`
- Alice multi-presence readiness: `10/10 PASS`
- Chaos definition-side-deck readiness: `14/14 PASS`
- Chaos owner-complete: `5/5 PASS`
- presence-concealment pre-scoring: `10/10 PASS`
- distinct affected subtotal: `103/103 PASS` across ten files
- complex-skills regression: `38/38 PASS`
- combined selected behavioral validation: `141/141 PASS` across eleven files.

Other gates:
- `npm run typecheck`: PASS
- `npm run content:validate`: PASS — `23 masters / 19 servants / 20 events / 0 blocking issues`
- `npm run verify:generated-content`: PASS
  - content `fdd2cc458e12a3dd3346c8253362a081a18b67652d19cd1f3c78a60b6aa09be6`
  - fixture `87542f5da07effcf6bba03efd963ae964dde99af4f6c3c63352225e870c96e6c`
  - evidence `75cc147b8816004e26640cae5234b38282dd5a5eff011035cab7ff821b11cd2b`
- external-output Phase-3 coverage:
  - `archives=127 cards=289 abilities=505`
  - `compiledCards=226 compiledCharacters=42 blockingIssues=0`
  - `newRuntimeSemanticRouted=22 legacyExecuteAbility=3 legacyResolveEffect=164 dualRuntime=0 pilotAllowlist=0 notClassifiable=316 taxonomyWarnings=328`
- external-output automation audit:
  - `legacyResolveEffect=164 legacyExecuteAbility=3 notClassifiable=316 promotionFindings=20`
- external scratch only:
  - `E:\Codex\FD\.fd-runner-review-evidence\formal-fujino-readiness-ab166083-nonce112e95c077f815ee099968484eaeba3f`
- `git diff --check`: PASS
- no authoring/pack/phase3 consumer delta.

A supplemental run of the historical Alice owner-complete file was `6/7`; its sole failure is the pre-existing pack-tail assertion that Alice must still be immediately after Akiha at the end of the Master list. The test source expects `[master.akiha, master.alice]` in the final two entries, while exact Base already ends with `master.fiore, master.fou`. This Candidate changes neither the pack nor that Alice test. The failure is therefore not counted green and is not a Fujino regression.

Repository-wide source-asset validation is not claimed green here. This readiness Candidate introduces no authoring, pack, generated consumer, or source-image declaration.

## Review gate

This readiness transaction is implementation-complete but permanently zero-credit.

Freeze one Candidate from exact Base `ab166083772921c598fba53670b4a9ef04455ac6`, push one stacked PR against `codex/a-p3-fou-owner-migration-acceptance-sync`, and request one fresh independent exact Base/Candidate `IMPLEMENTATION_ACCEPTED_CANDIDATE` review.

Only after canonical accepted readiness evidence plus FORMAL A-sync/full-owner rescan may the same owner advance to one formal `P3-S-OWNER-FUJINO-COMPLETE-MIGRATION` Candidate covering all six frozen identities together. No migration credit is legal at readiness.

## Reviewer revision — PR #549 first Candidate

First Candidate `1beb51c5101e630c16e7bb3543930c41142829bd` received `IMPLEMENTATION_NEEDS_REVISION` on ReviewJobKey `pr549:1beb51c5101e630c16e7bb3543930c41142829bd`.

The original review attempt could not publish through the integration because GitHub returned `403 Resource not accessible by integration`. FORMAL performed only the bounded same-attempt evidence relay; the review was not rerun and no findings were added or changed. Canonical read-back URL:

- `https://github.com/binchen648/fd/pull/549#issuecomment-6047557896`

Both blocking findings are closed together in the successor:

- Warp Space Repair is separated from the Action-only topology activation contract. The generic Repair classifier now accepts exactly the repository's canonical interactive phase/window pairs: preparation / advance / action with `controller_action_window`, and combat with `controller_combat_action_window`. Execution requires the authored repair phase to match the current live phase; topology activation remains Action-only.
- The exact accepted Injury/Warp Repair capability is the only phase activation allowed to bypass ordinary priority ownership and ordinary field/attack-area active-source routing. It still requires the linked physical Warp skill to be the exact active runtime topology source, so the any-phase/out-of-turn exception cannot widen unrelated abilities.
- Focused regression drives the real `getLegalActions -> dispatchAbilityCommand` path in preparation, advance, action, and battle/combat while another player owns priority. Each phase exposes only its matching Repair action, successfully repairs the topology, and deactivates the linked Warp card.
- Post-spinal restore provenance now bounds `painCount` to the exact six-key Injury inventory. A mechanically created maximum baseline (five prior injuries plus spinal => Pain `6`) remains valid, while forged durable `painCount=999` fails restore validation.

Successor verification:
- Fujino focused readiness: `8/8 PASS`.
- Selected affected + Reviewer-added MatchSession regression set: `153/153 PASS` across `12` files.
- `npm run typecheck`: PASS.
- `npm run content:validate`: PASS — `23 masters / 19 servants / 20 events / 0 blocking issues`.
- `npm run verify:generated-content`: PASS with unchanged hashes:
  - content `fdd2cc458e12a3dd3346c8253362a081a18b67652d19cd1f3c78a60b6aa09be6`
  - fixture `87542f5da07effcf6bba03efd963ae964dde99af4f6c3c63352225e870c96e6c`
  - evidence `75cc147b8816004e26640cae5234b38282dd5a5eff011035cab7ff821b11cd2b`
- external-output Phase-3 coverage: `archives=127 cards=289 abilities=505 compiledCards=226 compiledCharacters=42 blockingIssues=0 newRuntimeSemanticRouted=22 legacyExecuteAbility=3 legacyResolveEffect=164 dualRuntime=0 pilotAllowlist=0 notClassifiable=316 taxonomyWarnings=328`.
- external-output automation audit: `legacyResolveEffect=164 legacyExecuteAbility=3 notClassifiable=316 promotionFindings=20`.
- successor external scratch only: `E:\Codex\FD\.fd-runner-review-evidence\formal-pr549-revision-from-1beb51c5101e630c16e7bb3543930c41142829bd-nonce112e95c077f815ee099968484eaeba3f`.
- `git diff --check`: PASS.
- no authoring/pack/phase3 consumer delta.

Readiness remains permanently zero-credit. Strict accounting remains `261/944`, remaining `683`. One bundled successor Candidate is required to receive a fresh exact Base/Candidate REVIEW before any readiness A-sync/full-owner rescan.
