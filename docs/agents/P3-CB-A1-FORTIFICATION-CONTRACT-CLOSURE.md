# P3-CB-A1-FORTIFICATION-CONTRACT-CLOSURE

Role: Planner disposition and bounded read-only task packet
Control Epoch: FD-P3-2026-09-23-09
Exact main: a42b5e1c517141b90f3407773958b0d8afe63264
Input carrier: 96788cb775c400aa3a2a8d5b1bfeb8f440772014
Status: ANALYSIS_DELIVERED_FORTIFICATION_DEFERRED
Runtime authorization: NONE
Production writer reservation: NOT_GRANTED
Migration / coverage / denominator credit delta: 0

Planner continuation is superseded by P3-CB-A1-FORTIFICATION-DISPOSITION.md after the content-blocked handoff and B's static analysis. No RB acceptance is implied; historical analysis scope below is preserved.

## Decision

Register A's PREPARE as delivered with `BLOCKED_WITH_REASON`; do not turn the handoff into a Reviewer PASS. The sole decision blocker is full Territory Creation production-contract closure, with two distinct technical facets: content admission and residual retention. Preserve both facets and their owners.

Selected identities remain exactly:

- servant.gilles.skill.sc-gilles-2
- servant.medea.skill.sc-medea-2

The candidate exits ordinary A1. It may become a narrowly bounded capability enabler only after the missing behavior and production entry are established. Existing formula and resource components do not prove the full card contract. No new Trigger, Battle, initialization or MatchSession engine is justified by the present evidence.

## Parallel assignments

| Task | Owner | Allowed activity | Required result |
|---|---|---|---|
| P3-CB-A1-FORTIFICATION-ADMISSION-ANALYSIS | Existing content Owner under B/S permissions | Read current loader, schema, registry and owner/deck sources | Decide whether an existing lawful card-only entry exists, or complete owner content is required; identify exact source evidence and paths |
| P3-CB-A1-FORTIFICATION-RESIDUAL-ANALYSIS | Existing Codex B / Runtime Owner | Read canonical residual rules, authoring, compile/route and cleanup behavior | Determine whether existing residual encoding can preserve the reward route and lifecycle, or one generic runtime contract delta is needed |
| P3-CB-A1-FORTIFICATION-CONTRACT-REVIEW | Reviewer B | Read-only review of the unified findings | Confirm supported classification and minimum repair boundary; acceptance of a proposal is not runtime acceptance |

If the same existing B owns content and runtime, perform both analyses in one conversation. Do not add an Agent or a separate A synchronization cycle. A's supplied packet is the shared input and remains unchanged.

## Input and output scope

Read first the input carrier's two exact files:

- artifacts/phase3-cb-a1-fortification-prepare.json
- docs/reports/2026-10-14-p3-cb-a1-fortification-prepare.md

Then read only relevant current-main files and rules:

- docs/rules/FD-Game-Rules-Final.md, sections 9.4, 11.3 and 11.5.
- data/authoring/servants/servant.gilles.json and servant.medea.json.
- data/packs/fd-playtest-v1/pack.json; generated content is observational input only.
- packages/content/src/playtest-pack-loader.ts and directly relevant content schemas.
- packages/rules/src/ability/loader.ts, executable-card-pack.ts, interpreter.ts and directly relevant residual schema/route helpers.
- packages/rules/src/match-session.ts, residual round-cleanup and attack participation paths only.
- packages/rules/tests/fm05-territory-variant-extension.test.ts and fm05-territory-creation-authoring.test.ts.

Use current-main Git objects or a clean exact checkout. Planner's branch contains unrelated runtime differences and is not a substitute baseline. If main changes, report its exact SHA and assess only changed dependencies before binding the analysis.

The only new writable outputs for the analysis owner are:

- artifacts/phase3-cb-a1-fortification-contract-closure.json
- docs/reports/2026-10-14-p3-cb-a1-fortification-contract-closure.md

Reviewer B may persist its own scoped artifact at:

- docs/reviews/phase3/P3-CB-A1-FORTIFICATION-contract-closure-reviewer-b.json

Separate branches/worktrees own these outputs. No shared production file writes are granted; no heavy-test window is requested by this read-only phase.

## Questions that must be closed together

Admission analysis must distinguish a card definition from a playable servant. Do not relax three-skill/deck invariants, invent two missing skills, fabricate a deck, or infer a production path from synthetic owner assignment. Cite any existing card-only admission path and explain how a valid real source becomes available through it. If none exists, state the exact content or design dependency and stop short of a proposed loader bypass.

Residual analysis must trace printed residual text through authoring, compiled definition, source activation, round cleanup and next-round attack participation. Assess whether an existing explicit residual marker can coexist with the narrow deployment reward route. Changing `forced_trigger` to `residual` without checking route acceptance is not a repair proposal. Do not add a dummy residual ability, detect Chinese printed text at runtime, or use card-ID exceptions to force retention.

The unified result must cover legal first play, canonical cost/mana requirements, same-round reward, round-end retention, next-round attack participation without repaying cost, and inactive/closed source rejection. Preserve the distinction between movement and deployment. Formula and typed resource components should be reused unless concrete evidence establishes a defect.

Record applicable verified historical guardrails with their actual sources. If the Historical Failure Preflight CLI is unavailable, use a traceable equivalent check and state the limitation. Do not manufacture a CLI receipt or add a new review stage for this check.

## Required unified packet

Bind exact main, input carrier, source paths and Git objects. For each observation record CONFIRMED_STATIC, HYPOTHESIS or NOT_VERIFIED; no fresh gameplay execution has been requested.

Include one decision matrix:

| Facet | Required contract | Existing support | Gap | Minimum proposed delta | Owner | Evidence / tests needed |
|---|---|---|---|---|---|---|
| Production admission | Valid real source and owner | To establish | To establish | To establish | Content Owner | Registry and real source construction |
| Residual retention | Canonical residual lifetime and attack participation | Existing cleanup recognizes structural residual | Missing marker / compatibility to establish | To establish | B Runtime Owner | Real play through round boundary |
| Reward eligibility | Controller deployment at workshop while source eligible | Existing narrow trigger and resources | Whole-source eligibility not proven | To establish | B Runtime Owner | Active/inactive/closed, wrong player/location, replay |

List exact proposed source/test/generated/manifest paths, hot-file domains, current conflicting reservations if verifiable, and required negative tests. A future runtime task must include its required task-manifest path in the scope from the start. No proposed file list constitutes a granted production reservation.

## Review and next decision

Reviewer B reviews this unified packet once for evidence-grounded boundaries. The permitted proposal dispositions are:

- EXISTING_CONTRACT_MAPPING_REPAIR: existing admission and residual contracts suffice; specify authoring/metadata mapping and real-path tests.
- SCOPED_CAPABILITY_ENABLER_REQUIRED: one explicit generic delta would serve both identities; specify exact invariant and files.
- CONTENT_ADMISSION_DEPENDENCY: complete production owner content or an accepted admission contract is missing.
- BLOCKED_MULTIPLE_CONTRACTS: multiple new contracts exceed this bounded candidate.

These may coexist per facet; the whole card remains blocked until every required facet has a lawful path. Only then does Planner publish one implementation packet and verify/grant the necessary reservations. Runtime changes require a fresh candidate and RB review; A/RA bind final evidence after implementation, not after each analysis note.

The four Outer-God-Life backup identities are not automatically eligible: their pack/owner admission must be checked against the same loader constraint before switching candidates. Do not launch another broad roster search in this task.

## Completion and next sync

Complete when one packet answers both admission and residual mapping with source evidence, exact proposed files, missing tests and clear ownership, and Reviewer B provides a scoped verdict. The next sync trigger is that unified packet plus RB verdict, or a material main/dependency change. Keep the Epoch, ledger 111/944, Gate C and Release blockers unchanged.

## Copyable worker prompt

You are the existing FD Content/Runtime Owner. Execute P3-CB-A1-FORTIFICATION-CONTRACT-CLOSURE as read-only analysis plus the two authorized evidence outputs. Read this task card first, then exact PREPARE carrier 96788cb775c400aa3a2a8d5b1bfeb8f440772014. Bind main a42b5e1c517141b90f3407773958b0d8afe63264, or report verified dependency drift. Analyze production admission and residual encoding together for Gilles s2 and Medea s2. Establish whether existing contracts suffice or precisely one enabler is needed. Do not edit runtime, authoring, registry, generated output, tests, control or credit. Do not invent missing skills/decks or bypass admission. Return one unified packet for Reviewer B containing the minimum proposed repair boundary and negative-test plan. No Lead Builder implementation or promotion is authorized.
