# P3-FM07 current-main Alter Ego Transform authoring candidate

Status: `MIGRATION_CANDIDATE` only. This report is not Reviewer acceptance, credit, merge, or A-sync.

## Lineage and scope

- Exact Base: `9fe8da9982bece78913f71129cf30c781b730684`.
- Branch: `codex/s-p3-fm07-current-main-20261025`.
- Base contains the accepted FB2-13 runtime plus FB2-02/11/12, FM05, and FM06 dependencies. No historical FM07 Candidate was cherry-picked.
- Changes are authoring-only: nine servant archives, one master archive, one focused migration test, and this report. Shared runtime, coverage, generated artifacts, task index, governance, and unrelated servants are untouched.

## Exact 10-ID set and variants

Regular identity-free Alter Ego variant:

`servant.douman.skill.sc-douman-3`, `servant.koyanskaya.skill.sc-koyanskaya-1`, `servant.mechaeli.skill.sc-mechaeli-3`, `servant.meltryllis.skill.sc-meltryllis-3`, `servant.muramasa.skill.sc-muramasa-3`, `servant.okita-alt.skill.sc-okita-alt-1`, `servant.passionlip.skill.sc-passionlip-1`, `servant.sitonai.skill.sc-sitonai-3`, `servant.taisui.skill.sc-taisui-1`.

EX variant: `master.sion.skill.s12`, with fixed controller mana cost 3, source remains active, and per-round one-card limit.

The nine regular cards preserve frozen text SHA `b6c74ac37a50b671ded913dbc6ae6736f2057904fe4c02924d79f84971cebbdf`, passive/cost 2/base Power 3 metadata, and final skill-zone gate 8. Sion preserves frozen text SHA `43c84de7cf6532ee6b561d8cfa35ddbdeac52850f6105684b23a82121636a892`, special/cost 3/base Power 3 metadata, and final skill-zone gate 8. All use handler `core.alter-ego-transform` and accepted contract `P3-R37/FB2-13`.

## Structural authoring contract

Regular cards use optional `on_card_played` action trigger with `transform_event_source_card` plus `close_source_card`, no cost, and no limit. Sion uses the same identity-free trigger with one typed `pay_mana(controller, 3)` cost, one transform effect, and a per-round one-card limit. No identity/name/text routing, generic target selection, or unrelated reverse-capable family is introduced.

## Verification receipt

- FM07 authoring focused: 4/4.
- FB2-13 runtime: 7/7.
- FB2-02: 9/9.
- FB2-11: 7/7.
- FB2-12: 10/10.
- FM05: 4/4.
- FM06: 4/4.
- B23 compatibility: 9/9.
- Combined focused: 54/54.
- Full CI: 119 files / 730 tests passed.
- `npm run typecheck`: passed.
- `npm run content:validate`: passed, 0 blocking issues.
- `npm run verify:generated-content`: passed with unchanged hashes.
- `git diff --check`: passed.

This Candidate is ready for independent Reviewer review on the exact current-main Base and makes no acceptance or migration-credit claim.
