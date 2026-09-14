# P3-R Araya Souren Source-Evidence Review R1

- Date: 2026-09-15
- Role: Codex R
- Exact S candidate: `8b3a91215775f89daa036430589457fc3299ccc9`
- S PR: `#81`
- Exact A audit: `a2f82a756626baef08c27347281442f498367abc`
- A PR: `#82`
- Locked Reference: `fengling20011118-dotcom/fate-domination@b2f9fa15fba07c63530bbf4612b03b8b704755f9`
- Scope: independent read-only review; no S/A/runtime repair
- Verdict: `F1_INTAKE_NEEDS_REVISION`

## Mechanical verification

```text
npm ci                                      PASS
npm run typecheck                           PASS
Phase 3 full-roster/reference suite         6 files / 78 tests PASS
full reviewer CI (`npm run test:ci`)         84 files / 523 tests PASS
fresh independent full-roster audit         EXACT_AGREEMENT / gapCount=0
independent development-source replay       2 / 2 PASS
full Araya group source-grounded probe      3 / 3 PASS
candidate production-runtime diff           NONE
reviewer candidate repair                   NONE
```

The source/provenance burn-down is arithmetically consistent at `156 grounded / 788 blocked`, and the full Araya group is source-grounded 3/3. That does not by itself make the F1 capability dependency graph complete.

## Blocking finding

### ARAYA-001 — face-down play obligation loses Visibility dependency

`master.araya.skill.ascension` source text requires opponents, during regular play while Araya is in the Workshop, to play a **face-down** attack. The structured modifier correctly preserves that source requirement as:

```text
rule=card_play_requirement
operation=require_face_down_attack
face=down
```

However, `normalize-semantic-axes.ts` only derives `FACE_DOWN` / `FACE_UP` visibility axes from structured **effects**. It does not derive visibility from a rule modifier carrying `face`. Therefore the generated Araya ascension row has:

```text
modifier=[
  rule:card_play_requirement:require_face_down_attack,
  rule:movement_permission:prohibit_leave_controller_location
]
visibility=[]
```

and required capabilities omit `GENERIC_VISIBILITY`.

This is a real dependency gap. `CARD_ACTION_PLAY` only declares normal/explicit play into a legal destination; the catalog defines `GENERIC_VISIBILITY` separately as the visibility/reveal/face-state projection contract. A future implementation request generated from the current candidate could therefore omit the face-state dependency required by the source.

Required repair is structural, not identity-specific: when a structured rule modifier contains an explicit `face: down|up`, semantic normalization must expose the corresponding visibility axis. Add a generic regression and regenerate FS03/FS04/FS05. The Araya ascension should then require `GENERIC_VISIBILITY` while remaining `SPECIAL_HANDLER_CANDIDATE` with zero inherited acceptance contracts.

## Non-findings

R independently confirmed the two development-text locators and hashes, the controller-only Magical Workshop scope, persistent Death Complex location terrain, opponent movement lock, and regular-play face-down attack obligation. The allowed Fate/Domination Wiki ruling also supports that only Araya treats the 5+ Death Complex location as Magical Workshop.

No other blocking semantic mismatch was identified in R1.

## Result

The candidate is rejected at F1 pending the single structural visibility repair above. R does not modify S/A candidate files, runtime code, or generated artifacts. The previously accepted checkpoint remains `154 grounded / 790 source-evidence blocked` until repaired S/A/R evidence is accepted.
