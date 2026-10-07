# P3-B Fou Owner Readiness Complete Gap Set

Date: 2026-10-08
Task: `P3-B-FOU-OWNER-READINESS-CAPABILITY`
Branch: `codex/b-p3-fou-owner-readiness-complete-gap-set`
Exact Base: `17eebe767897e73c17eb3749c8986797d06b2097`
Locked Reference: `b2f9fa15fba07c63530bbf4612b03b8b704755f9`
Helper evidence: Epoch 6 / `helper-112e95c077f815ee099968484eaeba3f-6`
Classification: zero-credit complete-owner readiness for `master.fou`

## Frozen owner scope

Exactly two identities:

- `master.fou.skill.s1` — 兽之印记
- `master.fou.skill.ascension` — 苍天之力

This readiness Candidate intentionally creates no Fou consumer authoring and no pack registration:
- `data/authoring/masters/master.fou.json`: ABSENT
- canonical pack registration count: `0`
- migration credit: `+0`
- strict accounting remains `259/944`, remaining `685`.

## Complete readiness closure

### G1 — authoritative Command-Seal spend + returned physical skill provenance

A shared identity-free ledger now records a real Command-Seal decrease in the authoritative runtime, including existing typed resolution paths, direct card-play seal payment, linked-role seal payment, definition-side-deck one-shot seal payment, and compatible extended-effect paths.

Physical skill cards returning to the controller skill zone now record the exact current round and a source event. Existing canonical return/close paths call the same generic recorder rather than introducing owner-specific routing.

The compatibility boundary remains non-invasive: low-level rule/data-flow fixtures without an initialized ability runtime still execute their original resource adjustment; provenance recording is simply unavailable in such non-runtime fixtures.

### G2 — permanent physical returned-skill tuning

New identity-free capability `permanent_returned_skill_tuning` accepts one exact whole-ability shape:
- forced round-end trigger;
- requires a real same-round Command-Seal spend;
- requires one physical controller-owned skill that returned to the skill zone this round;
- applies game-duration `+1 Power`;
- applies game-duration `-1 effective play cost`;
- effective cost cannot fall below `ceil(printed cost * 0.5)`;
- marks stack lawfully on later qualifying rounds;
- paired Power/cost provenance is restore-validated and forged/widened pairs fail closed.

### G3/G4/G5 — imminent-elimination rescue, VP exchange, shared victory

New identity-free capability `once_per_game_elimination_rescue_shared_victory` provides:
- eligibility only in locked Reference rounds `8/9/10`;
- exact pre-scoring elimination projection from the completed battle ledger;
- optional owner-only target choice among exact imminent eliminations;
- one accepted rescue record per physical source/ability per game;
- exact selected player remains active through threshold scoring;
- self rescue creates neither VP exchange nor shared-victory link;
- opponent rescue swaps controller/target VP exactly once after scoring settles;
- opponent rescue creates a persistent bidirectional shared-victory link;
- final ranking expands rank-1 through valid persistent links;
- stale, duplicate, forged, widened or corrupt rescue/link state fails restore validation.

The exact completed battle ledger is frozen while an interactive rescue decision is pending, preventing battle re-resolution when MatchSession resumes.

A fast path skips all rescue scoring-preview work when the current runtime has no available accepted rescue provider. This preserves the existing production MatchSession cost before Fou consumer migration.

## Identity-free / consumer boundary

Production authority is mechanically covered by regression against:
- `master.fou`
- 芙芙
- 兽之印记
- 苍天之力
- `core.fou-`

No such owner/name branch is permitted in the accepted runtime path.

The canonical Fou consumer remains absent at this readiness stage; this Candidate is capability-only and zero-credit.

## Verification

Focused Fou readiness:
- `p3-fou-owner-readiness-complete-gap-set.test.ts`: `5/5 PASS`

Affected shared validation, distinct files:
- core scoring: `6/6 PASS`
- fixed controller Command-Seal component: `4/4 PASS`
- Ruler Seal subsystem: `13/13 PASS`
- Spartacus seal-power readiness: `20/20 PASS`
- authoring interpreter: `38/38 PASS`
- Fou readiness: `5/5 PASS`
- subtotal: `86/86 PASS`
- MatchSession: `34/34 PASS`
- total affected validation: `120/120 PASS` across 7 files.

Other gates:
- `npm run typecheck`: PASS
- `npm run content:validate`: PASS — `22 masters / 19 servants / 20 events / 0 blocking issues`
- `npm run verify:generated-content`: PASS
  - content `a91b4903929ac9c06febcaed8b4998217b29f7b2ad58b74a6e6f1e6e0d410fc4`
  - fixture `87542f5da07effcf6bba03efd963ae964dde99af4f6c3c63352225e870c96e6c`
  - evidence `0c176fcbcdbf5f46207adda92670459939891afd530416524973f64e5e8af5a0`
- external-output Phase-3 coverage:
  - `archives=126`, `cards=287`, `abilities=503`
  - `compiledCards=223`, `compiledCharacters=41`, `blockingIssues=0`
  - `newRuntimeSemanticRouted=22`, `legacyExecuteAbility=3`, `legacyResolveEffect=164`, `dualRuntime=0`, `pilotAllowlist=0`, `notClassifiable=314`, `taxonomyWarnings=326`
- external-output automation audit:
  - `legacyResolveEffect=164`, `legacyExecuteAbility=3`, `notClassifiable=314`, `promotionFindings=20`
- `git diff --check`: PASS
- Fou authoring remains absent and pack registration count remains exactly zero.

Repository-wide source-asset validation was attempted once at final closeout but the AgentDock tool call was blocked by the tool safety layer before execution. No result is fabricated from that blocked call. This readiness changes no authoring/generated/source-image declarations, so it introduces no new source-asset path; existing repository source-asset debt remains outside this Candidate's claimed green gates.

## Review gate

This readiness transaction is implementation-complete but permanently zero-credit.
Freeze one Candidate from exact Base `17eebe767897e73c17eb3749c8986797d06b2097`, push one PR, and request one fresh independent exact Base/Candidate `IMPLEMENTATION_ACCEPTED_CANDIDATE` review.

Only after accepted readiness evidence plus FORMAL A-sync/rescan may the same owner advance to `P3-S-OWNER-FOU-COMPLETE-MIGRATION` for the exact two frozen consumer identities.
