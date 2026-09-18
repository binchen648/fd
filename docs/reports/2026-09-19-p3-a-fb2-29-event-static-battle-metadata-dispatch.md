# P3-A FB2-29 Rules-Only Event Static Battle Metadata Dispatch

Role: Codex A
Status: `SYNCHRONIZED`
Date: 2026-09-19

## Baseline

- Exact accepted Base: `1c33320b468825dd7e37b5ede6645bb29e5ee333` (R61 FB2-28 acceptance synchronization)
- Accepted FB2-28 runtime Candidate: `69f2fb09ca951957148f965df459bb3063323800`
- Formal recovery accepted: `127/944` (`13.45%`), remaining `817`
- F1 evidence: `59f145434695d29bdd17e4cb3adc887e84182377`
- Locked Reference: `b2f9fa15fba07c63530bbf4612b03b8b704755f9`
- Blocked S dispatch: `5d6a9982c0fead6c28fa73446f68ccf31562048c`
- Fresh S blocker evidence: `c735b235af3ab273a8daabffeae71db81809250a` / `MIGRATION_BLOCKED`

FB2-29 is zero-credit B2 infrastructure. It does not migrate any frozen identity.

## Why this follow-up is required

The prior A readiness overlay dispatched four `core.lostbelt-objective` event definitions (Kadoc s3 and Ophelia s5/s6/s7). Fresh S found that Kadoc s3 is expressible through accepted FB2-28 event-source triggers, but the three Ophelia static event definitions are not yet authorable end-to-end.

A fresh temporary compiler probe confirmed the exact gap: rules-only event authoring metadata can remain present inside `eventRules`, while `eventCatalog.battleModifiers` remains undefined. Existing runtime lifecycle/combat code can preserve and consume catalog battle modifiers, but there is no accepted rules-only authoring -> compiler path that produces them.

The previous four-card S migration therefore remains blocked with zero credit. S correctly did not submit a one-card partial Candidate or modify runtime/compiler code.

## Capability request

Implement one narrow identity-free **rules-only event static battle-metadata compiler contract**.

### Authoring contract

A rules-only `event_rule_definition_archive` event card may structurally declare zero or more static battlefield power modifiers. Prefer a canonical-attribute shape so source text is not runtime data, for example entries equivalent to:

- canonical attribute: `strength`, `agility`, `magecraft`, `special`, or `noble_phantasm`;
- integer modifier value, positive or negative but nonzero;
- structural match mode from the existing catalog contract (`has_attribute`, and only additional existing generic modes if B2 can support them without broadening runtime).

The exact field name may differ if a smaller existing-compatible representation is available, but all semantics below are mandatory.

### Compiler/runtime boundary

- Compile valid rules-only event static metadata into the existing `EventCatalogEntry.battleModifiers` surface.
- `sourceId` must be server/compiler-derived from the event definition ID; authoring must not be able to spoof another source ID.
- Canonical attribute values must map through generic attribute semantics, not identity/name/printed-text routing.
- No new interpreter/handler route is authorized. Existing combat resolution and FB2-28 event lifecycle must consume the compiled catalog metadata unchanged.
- Moving the event battlefield -> discard -> battlefield must continue to preserve the compiled modifiers exactly through the accepted FB2-28 lifecycle.
- Static modifiers apply only at the authoritative event placement battlefield through the existing event placement/combat boundary.

### Fail-closed requirements

Both content-loader and executable-compiler boundaries must reject malformed rules-only event static metadata, including at minimum:

- unknown canonical attribute;
- empty/non-array modifier surface;
- non-integer, zero, NaN/infinite modifier values;
- missing/unknown structural match mode if a mode is exposed;
- extra fields that would allow caller-provided/spoofed `sourceId`;
- wrong-channel / wrong-discriminator near matches through the already accepted FB2-28 archive guards.

Ordinary production event cards must retain their current behavior and hashes.

## Exact downstream purpose

This capability exists to close the remaining representation gap for the prior homogeneous family:

- `master.ophelia.skill.s5`: Strength `+4`, Agility `-2`;
- `master.ophelia.skill.s6`: Agility `+4`, Magecraft `-2`;
- `master.ophelia.skill.s7`: Magecraft `+4`, Strength `-2`.

`master.kadoc.skill.s3` already has a complete accepted FB2-28 trigger/effect path. None of these four identities is authorized for migration in FB2-29.

## Identity-free safety

Production/compiler/runtime logic must not branch on:

- any Kadoc/Ophelia canonical ID;
- owner names;
- Chinese printed text;
- `core.lostbelt-objective`;
- F1 hashes/commit;
- Reference hashes/handler IDs.

Generic canonical attribute enums/tags are allowed as structural data.

## Scope

Owner: Codex B2.

B2 may touch only the minimum generic content/compiler/type/test files needed for this metadata bridge plus one result report. Expected hot areas are:

- `packages/content/src/playtest-pack-loader.ts` validation;
- `packages/rules/src/ability/executable-card-pack.ts` compilation;
- `packages/rules/src/ability/types.ts` only if typing requires it;
- focused content/compiler/runtime regression tests.

Do not add consumer authoring, production pack registrations, generated product changes, Lostbelt expansion logic, movement locks, VP tracking, Wodime/God-Heritage state, F1/taxonomy/KPI changes, app work, FM09/FM10 changes, merge, or retarget.

## Required acceptance evidence

Fresh B2 evidence must prove with synthetic identity-free fixtures:

- a valid rules-only event static metadata definition compiles exact +4/-2 modifiers into `eventCatalog.battleModifiers`;
- compiler derives the event definition as modifier `sourceId`;
- combat at the event battlefield applies each modifier exactly and combat elsewhere does not;
- battlefield -> discard -> battlefield preserves the exact modifiers;
- malformed/near-match metadata fails closed at content and executable compiler boundaries;
- rules-only event definitions still do not enter ordinary cards/characters/decks/fallback command spells/random event-set membership;
- existing production event behavior and deterministic generated hashes remain unchanged;
- no identity/name/text/Reference-handler routing;
- Base-to-Candidate frozen overlap remains `127/944` with zero additions/removals/duplicates;
- typecheck, focused tests, rules suite, official CI, content validate/compile/determinism, client build, Reference verify, coverage/audit, `git diff --check`, and final cleanliness all pass.

## Accounting

FB2-29 earns **zero frozen migration credit**. Formal accepted remains `127/944`, remaining `817`.

After independent B2 review and later A synchronization, A may re-evaluate and separately re-dispatch the exact four-card Lostbelt objective event family. No downstream card is pre-credited here.

Historical P3-FM09 remains `MIGRATION_BLOCKED`. No FM10 is started.
