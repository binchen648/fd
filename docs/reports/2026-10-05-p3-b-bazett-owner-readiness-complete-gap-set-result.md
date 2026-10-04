# P3-B Bazett Owner Readiness Complete Gap Set Result

Date: 2026-10-05

## Task and accounting boundary

Task: `P3-B-BAZETT-OWNER-READINESS-CAPABILITY`

Classification: bounded zero-credit owner-readiness capability for the complete frozen `master.bazett` scope.

Exact readiness Base: `b48a1948cb7d50b4add0a0d118ced10ce63ee1b0` (accepted Araya A-sync).

Frozen Bazett scope contains ten identities:
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

Historical accepted FM08 already credited `master.bazett.skill.s1b`. Therefore this owner starts with one preservation-only identity and nine remaining uncredited identities. Strict migration accounting stays `197/944`, remaining `747`; this readiness Candidate is permanently zero-credit.

## Source-evidence basis

The complete preflight mechanically reused the accepted Bazett F1 source-evidence normalization from repair commit `0dcc1f94297f2198f0f4152742c585032931390a` / review commit `ec37b2a0`, then rechecked the resulting semantic clauses against the current accepted runtime and locked Reference `b2f9fa15fba07c63530bbf4612b03b8b704755f9`.

The current runtime already covers:
- `s1` game-start skill provisioning through the accepted identity-free provisioning seam;
- preservation-only `s1b` Day-1 total-Power modifier through the existing `ruleOverrides.logicalDayByPlayer` authority;
- ordinary battle win/loss VP adjustments and climax-conditioned resource/VP arithmetic through generic trigger/resource resolution.

The preflight found one complete owner-local gap set. No additional Bazett readiness family remains intentionally deferred.

## Complete readiness gap set

### A. Logical-day cycle authority

Identity-free structured authority now supports:
- Day 1 initialization;
- round-end Day 1 -> Day 2 -> Day 3 -> Day 4 progression;
- exact Day-3 skill-definition provisioning;
- controller loss scheduling a reset without rewinding the same event;
- next-round reset to Day 1, exactly +1 VP, and configured definition closure;
- Day-4 controller win entering Awake;
- exact Awake-definition provisioning;
- stopping further day progression after Awake;
- provider source/ability provenance and restore validation.

This reuses the existing accepted Day-1 modifier naturally: that modifier remains active only while the authoritative logical day equals 1.

### B. Definition-scoped play/persistence overrides

Identity-free marker authority now supports the two distinct source clauses without changing printed card cost:
- a configured logical day may waive exactly one `skill_zone_mana_at_least` requirement and ignore that target definition's per-game play limit;
- a live owned source may ignore the target definition's per-game play limit and grant persistent/residual treatment to that definition.

The override is source-grounded. Removing the exact provider disables it. Day-2 requirement waiver does not waive printed mana cost.

### C. Armed next-opponent attribute-use defeat

Identity-free armed authority now supports the source-normalized `card_or_ability.used` semantic:
- arming occurs only from the exact active, face-up, owner-controlled source after its own play event;
- the candidate use must be by an active opponent at the same actual location;
- both trusted `on_use_declared` and `on_ability_used` events are supported;
- the used physical definition must carry the configured effective attribute;
- off-location and nonmatching uses do not consume the arm;
- the first exact matching use consumes the arm once, applies normal immunity/defeat protections, and records effect defeat;
- when source-bound persistence is active, the exact counter source returns to its owner's skill zone after triggering;
- forged/stale armed provenance fails restore validation.

Phase/response ability execution now emits a trusted `on_ability_used` semantic event so this capability is not restricted to card-play events.

### D. Awake settlement

Identity-free Awake settlement supports:
- restoring the controller's normal command seals to exactly 3, with malformed/out-of-range state rejected;
- returning exactly one controller-owned configured definition to skill;
- duplicate or foreign-controller matching physicals fail closed;
- settlement is accepted only from the exact logical-cycle Awake event while that cycle is authoritative and Awake.

### E. Day-3 zero-cost source-skill join

Identity-free action authority supports:
- only the configured logical day;
- exact owner/controller source in `skill` with `master_skill` definition;
- movement of that exact physical to `attack_area` at zero paid mana;
- public, active, face-up runtime state;
- ordinary card-play transport is blocked for this activation-only semantic, preventing a second route around the capability gate.

## Security / fail-closed boundaries

The capability module is production-identity-free: no Bazett name, ID, printed title, or Bazett-specific handler branch appears in `packages/rules/src/ability/logical-day-countermeasure-capability.ts`.

The loader requires exact whole-ability privileged shapes. Widened logical-day cycle shapes are disabled as unsupported. Runtime authority is bound to live provider definitions and physical sources; forged provider or armed markers fail `isDeferredAbilityRuntimeProvenanceValidForRestore`.

Dynamic definition persistence is consulted by real MatchSession round-end attack cleanup and affected interpreter close-selection paths; it does not globally mark unrelated cards residual.

## Verification

Focused readiness regression:
- `packages/rules/tests/regression/p3-bazett-owner-readiness-complete-gap-set.test.ts`: `13/13 PASS`.

Affected shared aggregate:
- Bazett readiness: `13/13 PASS`;
- MatchSession: `33/33 PASS`;
- authoring-interpreter: `38/38 PASS`;
- executable-card-pack: `50/50 PASS`;
- Akasha vessel-cycle readiness: `17/17 PASS`;
- Alice readiness: `10/10 PASS`;
- card-action-play: `4/4 PASS`;
- aggregate: `165/165 PASS`.

Repository gates:
- `FD_TOOLCHAIN_OK`;
- typecheck: PASS;
- content validate: PASS (`12 masters / 19 servants / 20 events / 0 blocking issues`);
- generated content determinism: PASS;
- Phase-3 coverage command: PASS using scratch `--out`; `compiledCards=146`, `compiledCharacters=31`, `blockingIssues=0`;
- Phase-3 automation audit command: PASS using scratch `--out`; no tracked audit artifact was rewritten;
- `data/authoring/**` Base..worktree delta: EMPTY;
- `git diff --check`: PASS.

Large Phase-3 coverage/audit JSON was intentionally written under untracked `.fd-bazett-readiness/` scratch rather than overwriting the repository's tracked historical artifacts during verification.

## Fresh-R revision closure

Predecessor Candidate `f4234d18baf7235375f3634808a118abf97f912b` received `IMPLEMENTATION_NEEDS_REVISION`. Canonical bounded same-attempt relay: `https://github.com/binchen648/fd/pull/522#issuecomment-5982661723`.

The exact P1 finding was that the Day-3 stage failed on the second Lost-in-Time cycle: after the first Day-3 physical was used and normally reached discard, `ensureDefinitionInSkill()` detected the existing physical and returned without restoring it to skill.

Successor closure:
- an existing exact staged physical in `discard` is now restored to `skill`, owner-controlled and owner-visible, with inactive/face-up runtime state reset for the new stage;
- an existing physical must retain the exact original `generatedBy` provider provenance; forged provenance fails closed;
- an existing physical in a live/non-discard zone fails closed instead of being silently moved or duplicated;
- regression now exercises first Day3 use -> discard -> Day4 loss/reset -> second Day3 and proves the same physical instance is restaged without duplication;
- focused Bazett readiness: `13/13 PASS`; affected shared aggregate: `165/165 PASS`; FD_TOOLCHAIN_OK; typecheck/content/generated/data-authoring/identity/diff gates PASS.

The Reviewer transport exposed only this exact P1 finding before truncating its trailing reproduction JSON. No omitted finding text is reconstructed or invented.

## Formal next gate

No Bazett consumer identity is materialized by this readiness Candidate. It awards zero migration credit.

After fresh independent `IMPLEMENTATION_ACCEPTED_CANDIDATE` and FORMAL A-sync/rescan, `P3-S-OWNER-BAZETT-COMPLETE-MIGRATION` may materialize the nine remaining uncredited Bazett identities together while preserving the already credited `s1b`, in one owner-complete Candidate / one PR / one fresh independent R.
