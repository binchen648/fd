# Phase 3 Full-Roster Source Evidence — Nrvnqsr Chaos

- Date: 2026-09-15
- Role: Codex S
- Scope: source normalization only; no runtime implementation or Gate promotion
- Locked Reference: `fengling20011118-dotcom/fate-domination@b2f9fa15fba07c63530bbf4612b03b8b704755f9`
- External canonical evidence: Fate/Domination Wiki, `https://fatedomination.fandom.com/wiki/Nrvnqsr_Chaos`
- Candidate status: `SOURCE_EVIDENCE_NORMALIZATION_CANDIDATE`

## Scope

This batch adds a reusable external source-evidence overlay path for canonical identities that are present in the locked Reference but lack source-aligned structured authoring.

The overlay is fail-closed and only accepts evidence records whose authority is `FATE_DOMINATION_WIKI`, whose document is `Fate/Domination Wiki`, and whose URL is under `https://fatedomination.fandom.com/wiki/`.

The locked Reference remains read-only. Reference handler IDs and Reference runtime behavior remain non-authoritative and are not used to infer semantics.

## Chaos evidence slice

Seventeen canonical identities are newly source-grounded:

- `master.chaos.skill.ascension`
- `master.chaos.skill.s1`
- `master.chaos.skill.s2`
- `master.chaos.skill.s3`
- `master.chaos.skill.s4`
- `master.chaos.skill.s5`
- `master.chaos.skill.s6`
- `master.chaos.skill.s7`
- `master.chaos.skill.s8`
- `master.chaos.skill.s9`
- `master.chaos.skill.s10`
- `master.chaos.skill.s11`
- `master.chaos.skill.s12`
- `master.chaos.skill.s13`
- `master.chaos.skill.s14`
- `master.chaos.skill.s15`
- `master.chaos.skill.s16`

`master.chaos.skill.s17` remains explicitly `SOURCE_EVIDENCE_REQUIRED`: the allowed Wiki page establishes that Scrambled Seals exist but does not enumerate the complete four-option Scrambled Seals action card needed to normalize that canonical identity safely.

Important source-specific details preserved structurally include:

- The 666 evaluates each mana-gain event independently; separate gains are not aggregated.
- The Breaker constrains X to 1 through 3, overriding the conflicting legacy/development text observed elsewhere.
- The Hunter remains a reviewed-special candidate because its canonical effect includes Defeat.
- The Emperor carries both the Scrambled-Seal-to-Command-Seal rule and source close after seal spend.

The local evidence file stores compact source labels plus normalized structured semantics rather than copying the Wiki prose. Each record retains its exact Wiki URL and card locator.

## Burn-down

Before this batch:

```text
sourceGroundedCount=72
blockedCount=872
structuredAbilityCount=117
contractMappedCount=72
explicitBlockCount=872
READY_GENERIC_EXTENSION=66
SPECIAL_HANDLER_CANDIDATE=6
SOURCE_EVIDENCE_REQUIRED=872
runtimeRequestAffectedIdentityCount=72
```

After this batch:

```text
sourceGroundedCount=89
blockedCount=855
structuredAbilityCount=138
contractMappedCount=89
explicitBlockCount=855
READY_EXISTING_CONTRACT=0
READY_GENERIC_EXTENSION=82
SPECIAL_HANDLER_CANDIDATE=7
SOURCE_EVIDENCE_REQUIRED=855
runtimeRequestAffectedIdentityCount=89
```

Delta:

```text
+17 source-grounded identities
-17 source-evidence-blocked identities
+21 structured semantic abilities
+16 generic-extension candidates
+1 reviewed-special candidate
+0 accepted current contracts
+0 runtime changes
```

## Verification

- `npm run typecheck`: PASS
- FS03/FS04/FS05 regeneration from the locked Reference: PASS
- full-roster semantic/capability/decision/audit focused suites: PASS
- FS01 inventory suite in isolation: PASS
- generated inventory still partitions all `944` identities with `unclassifiedCount=0`
- `zeroSilentFallback=true`

A separate A-owned audit layer independently validates overlay canonical IDs, Fandom-only authority, provenance, subability membership, and summary counts. That A evidence is intentionally kept out of this S candidate commit.

## Non-promotion

This batch does not promote `READY_EXISTING_CONTRACT`, F2, F3, F4, broad runtime capability acceptance, migration acceptance, or full-roster closure. It only removes source-evidence blocks for the exact seventeen Chaos identities listed above.
