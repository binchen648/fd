# P3-A Current-Main Outside-Game Owned Servant-Skill Acceptance Synchronization

Role: Codex A
Status: `SYNCHRONIZED`
Date: 2026-09-26

## Accepted input

- PR: `#456`
- Exact accepted successor Candidate: `83cac6ef2a1334b823e37c873d0a1a2c8e819cb9`
- Predecessor Candidate: `10a22583f5e911ae4f812e82417b866006d6eaab`
- Exact Base: `3b2d78ae931a0ded23f98ec1e513768dea9c78de`
- Canonical fresh-R evidence: `https://github.com/binchen648/fd/pull/456#issuecomment-5844312272`
- Verdict: `IMPLEMENTATION_ACCEPTED_CANDIDATE`
- ReviewJobKey: `pr456:83cac6ef2a1334b823e37c873d0a1a2c8e819cb9`
- Historical authority: PR #441 Candidate `fc6d2f52f2d2cebbedc60e9e5d106744b347c8ff`, canonical evidence `https://github.com/binchen648/fd/pull/441#issuecomment-5825842148`.

## Accepted capability

The accepted scope is the bounded FB2-18 outside-game representation extension for exact owner-matching `servant_skill` cards. Existing owned `master_skill` behavior is unchanged. A servant card is admitted only when its archive/root id starts with `servant.`, the authored owner is exactly the two-key object `{type:"servant", id:<same root>}`, and `initialPlacement` is exactly `outside_game`. The executable pack preserves the card without assigning `initialZone`.

Malformed placement, owner mismatch, extra owner fields, wrong namespace/card type, and near-match shapes fail closed. There is no servant/card-name/printed-text/Chinese routing, no SkillLib fallback, no consumer authoring, and no migration credit.

## R1 closure

Predecessor `10a22583...` accepted an extra-field owner near-match. R1 canonical evidence is `https://github.com/binchen648/fd/pull/456#issuecomment-5844121623`. Successor `83cac6ef...` requires exactly the `type` and `id` owner keys and adds adversarial coverage. Focused FB2-18 is `12/12 PASS`; affected loader/compiler chain is `3 files / 99 tests PASS`; typecheck and `git diff --check` pass; `data/authoring/**` remains empty.

## Post-acceptance readiness rescan

The same historical PR #441 old-frontier-minus-current pool was mechanically reconstructed from `288` historical material identities minus `135` current material identities = exactly `153`. Each historical-diff card was reduced to a one-card archive and re-run through the exact accepted successor runtime `loadAuthoringJson` boundary.

Result: **27 loader-ready / 126 blocked**, up from Composition-02 `24 / 129`.

Exactly the three expected identities became newly loader-ready:

- `servant.mash.skill.sc-mash-4`
- `servant.sherlock.skill.sc-sherlock-4`
- `servant.sherlock.skill.sc-sherlock-5`

This is readiness/planning evidence only. Formal/material remains `112/944`, remaining `832`.

## User workflow supersession — owner-complete F4

The user's latest workflow ruling supersedes the earlier fixed-50 cadence for future formal F4 consumer migration. The formal unit is now **one character/owner complete**: select one owner, migrate all of that owner's remaining frozen skills, obtain one exact Candidate/PR/fresh R, then A-sync/account for the accepted owner before moving to the next owner. There is no fixed 50-card requirement.

Bounded zero-credit capability/readiness tasks remain allowed when needed to unblock the current owner. They earn no credit and, once synchronized, execution returns to the same owner rather than switching owners.

Historical `EXACT_50_*` reports and task blocks remain as history/evidence; their fixed-50 dispatch requirement is superseded from this point forward by this latest user workflow ruling.

## Next owner selection

Mechanical frozen-roster inventory shows Mash has exactly four frozen skills and none are currently materialized on this exact line:

- `servant.mash.skill.sc-mash-1` — FULL confirmed override; specific handler semantics currently need clean-line declarative/capability migration.
- `servant.mash.skill.sc-mash-2` — FULL confirmed override; specific attack-power-modifier semantics currently need clean-line declarative/capability migration.
- `servant.mash.skill.sc-mash-3` — FULL confirmed override; specific Ortenaus passive semantics currently need clean-line declarative/capability migration.
- `servant.mash.skill.sc-mash-4` — FULL confirmed override; now loader-ready via accepted PR #456 outside-game capability.

All four inventory rows share source grounding in `FD全卡图鉴V2.0.chm` (`从者/盾兵/英文版/玛修·基列莱特.htm`) plus the development image source and locked confirmed overrides. The next formal owner is therefore `servant.mash`, but implementation must remain generic/source-grounded: do not port identity/name routing from the historical reference and do not use SkillLib fallback.

Next task: `P3-S-OWNER-MASH-COMPLETE-MIGRATION`.
