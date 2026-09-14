# Phase 3 Full-Roster Independent Review — Bazett Source Evidence R1

- Date: 2026-09-15
- Role: Codex R
- Exact S candidate: `f439b3241bb5999e90fd7cf638b569081f2b148c`
- Exact A audit head: `9b03a32642c64d064334fad0857ac2f566838659`
- Locked Reference: `fengling20011118-dotcom/fate-domination@b2f9fa15fba07c63530bbf4612b03b8b704755f9`
- S PR: `#48`
- A PR: `#49`
- Overall verdict: `INTAKE_NEEDS_REVISION`

## Baseline judgment

The candidate's count arithmetic is internally consistent (`99` source-grounded / `845` blocked), and the A audit independently reports `EXACT_AGREEMENT / gapCount=0`. Those automation checks do not prove that every Bazett printed clause was normalized faithfully.

Fresh semantic inspection against the allowed Fate/Domination Wiki found three F1 blockers. Per reviewer stop rules, R does not repair the candidate.

## Blocking findings

### F1-BAZETT-001 — Day 3 omits its entry-to-skill-zone clause

- Severity: blocking F1 clause-preservation defect
- Canonical ID: `master.bazett.skill.s5`
- Source: `https://fatedomination.fandom.com/wiki/Bazett_Fraga_McRemitz`, Day 3 row
- Candidate: `data/phase3/full-roster-source-evidence-overlays.json`, `bazett.day3.add-to-attack`

The authoritative row explicitly includes `(Add this card to your skill zone)` before the Passive/Action ability. The candidate only models moving the source from `skill` to `attack`; it never models how Day 3 enters the skill zone.

Impact: later migration can preserve the Action and 3-VP reward while silently dropping the setup transition that makes the Day 3 Skill/Attack card available.

Minimum repair: represent the Day 3 entry-to-skill-zone transition structurally and ensure its capability dependency is classified. Do not infer the transition from Reference handlers.

### F1-BAZETT-002 — Day 4 Awake is not connected to the Awake card effect

- Severity: blocking F1 cross-card state-transition defect
- Canonical IDs: `master.bazett.skill.s1d`, `master.bazett.skill.s4`, and the Lost in Time day-cycle state
- Source: `https://fatedomination.fandom.com/wiki/Bazett_Fraga_McRemitz` and `https://fatedomination.fandom.com/wiki/Bazett%27s_Day_Cycle`

The source states that winning a fight on Day 4 causes `Awake`; Awake then stops Lost in Time, restores all Command Seals, and regains Fragarach.

The candidate's Day 4 ability only adds a generic `bazett_awake` status. `master.bazett.skill.s4` is a separate passive record with the actual break-loop effects, but there is no trigger/activation/transition binding connecting the newly-added status to those effects. Likewise, Lost in Time represents the day deck only as a numeric player flag, so `Start with Day 1 in play` / advancing the active Day card is not explicitly connected to the Day-card identities.

Impact: the normalized graph can mark the player awake without ever resolving the authoritative Awake effects, or can preserve numeric day state while never making the corresponding Day card semantics active.

Minimum repair: model Bazett's day-cycle/Awake transition as an explicit reviewed state-transition subsystem (or another already-authorized structural form) that binds the active Day identity and Awake/Reset transitions. Do not promote it to an accepted runtime contract in S.

### F1-BAZETT-003 — Fragarach narrows `uses a Noble Phantasm` to `card.played`

- Severity: blocking F1 trigger-semantics defect
- Canonical ID: `master.bazett.skill.s2`
- Source: `https://fatedomination.fandom.com/wiki/Bazett_Fraga_McRemitz`, Fragarach row
- Rule source: `https://fatedomination.fandom.com/wiki/Keywords`

Fragarach says: the next time an opponent on Bazett's battlefield **uses** a Noble Phantasm, defeat them. The Wiki's Keywords rules distinguish a card being *played* from an activated ability being *used*; for example Reveal Servant Name can trigger when a card is played or when it is used.

The candidate binds Ultimate Counter only to `card.played`. That is narrower than the authoritative `uses a Noble Phantasm` condition and can miss a Noble Phantasm ability used from an already-present card.

Impact: the source-grounded trigger can fail to fire for a valid Noble Phantasm use.

Minimum repair: use a semantic event that represents Noble Phantasm use (or explicitly covers all authoritative use forms), retaining opponent + same-battlefield + next-use + Defeat semantics.

## Verified non-blocking properties

- Day 2 correctly removes the 8-mana requirement and once-per-game restriction for the round without inventing printed-cost removal.
- Flawless Defense no longer contains the stale extra 3-mana attack-deactivation action found in the abandoned draft.
- Awake's Command Seal restoration is classified as a generic resource dependency without inheriting the accepted mana/VP direct-action contract.
- Fragarach remains a reviewed-special candidate because of `Defeat`.
- No `packages/` or `apps/` runtime files are changed by the candidate stack.

## Result

- Existing accepted F0/F1 baseline remains intact.
- Bazett 10-ID source-evidence candidate: `INTAKE_NEEDS_REVISION`.
- The proposed `99 / 845` burn-down is **not yet accepted**.
- Repair all three findings, rerun A independent recomputation, then perform a fresh R review.
