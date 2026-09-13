# P3-TO-05 Interaction Ability Map

- Owner: Codex B
- Date: 2026-09-13
- Status: `SPEC_REVIEW_READY`
- Authority: corrected generated `docs/audits/fd-skill-semantic-axis-matrix.md`
- Scope: mapping only; no taxonomy or eligibility reclassification

## 1. Denominator Reconciliation

The corrected generated inventory reports:

```ini
explicitInteractionAbilities=18
strictPendingInteractionAbilities=11
```

The classifier excludes `sc-artoriac-5.gain-mana-or-vp` and `sc-ereshkigal-3.blooming-netherworld`: both have automatic condition branches and no player interaction axis. The 11 strict pending abilities remain a subset of the 18 explicit interaction abilities. Multi-template abilities count once in each ability denominator, even when they occupy multiple template rows.

Template memberships across the corrected 18 abilities are:

| Template axis | Membership count | Strict pending contribution |
|---|---:|---:|
| `CHOOSE_N_CARDS` | 6 | 6 |
| `YES_NO` | 6 | 0 |
| `BRANCH_CHOICE` | 1 | 1 |
| `CHOOSE_LOCATION` | 3 | 3 |
| `CHOOSE_AMOUNT` | 0 | 0 |
| `CHOOSE_ONE_PLAYER` | 1 | 1 |
| `RESPONSE` | 1 | 0 |
| `ORDER` | 0 | 0 |

These membership counts sum to 18 across 18 abilities. The current card pool has no structured amount target or amount intent.

## 2. Corrected 18-Ability Map

Dependency abbreviations:

- `T`: Trigger or response-window ownership
- `L`: Lifecycle/limit ownership
- `B`: Battle integration
- `H`: Hidden/private information
- `M`: Rule/effect modifier
- `S`: Special subsystem
- `D`: typed data-flow owner such as Card Action, Card Zone, Movement, Resource, or Result Binding

Suitability is design-review input only. It does not select a B12 representative or declare runtime eligibility.

| # | Archive / card | Ability | Interaction templates | Strict pending | Visibility axis | External dependencies | Later representative comparison |
|---:|---|---|---|---:|---|---|---|
| 1 | `master.kayneth` / `master.kayneth.deck.volumen-hydrargyrum` | `volumen.extra-play` | `RESPONSE` | No | public choice; source visibility remains external | `T`, `B`, `D:CARD_ACTION` | Exclude from first target slice; response and battle coupled |
| 2 | `master.kiritsugu` / `master.kiritsugu.skill.magus-killer` | `magus-killer.setup` | `CHOOSE_N_CARDS` | Yes | owner-only deck candidate projection | `H`, `S`, `D:CARD_ZONE` | Defer; private deck and setup subsystem ownership must be isolated |
| 3 | `master.kiritsugu` / `master.kiritsugu.skill.time-alter` | `time-alter.action` | `CHOOSE_N_CARDS` | Yes | `HIDDEN_OR_PRIVATE` | `H`, `D:CARD_ACTION+CARD_ZONE` | Defer; hidden projection and play semantics coupled |
| 4 | `master.maiya` / `master.maiya.skill.military` | `military.attach-support-shot` | `CHOOSE_ONE_PLAYER` | Yes | public player candidates | `B`, `D:ADD_TO_ATTACK+RESOURCE` | Comparable only after confirming battle-state coupling is acceptable |
| 5 | `master.olga-marie` / `master.olga-marie.skill.chaldeas` | `chaldeas.swap-before-resolve` | `YES_NO` | No | `HIDDEN_OR_PRIVATE` | `T`, `L`, `H`, `S`, `D:CARD_ZONE` | Exclude; trigger, private cards, limits, and special subsystem coupled |
| 6 | `servant.achilles` / `servant.achilles.skill.sc-achilles-2` | `sc-achilles-2.blue-sky` | `BRANCH_CHOICE` | Yes | public choice | `B`, `M`, `D:RESOURCE+DISCARD/CLOSE` | Defer; branch choice, battle, modifier, and fixed-cost effect are coupled |
| 7 | `servant.artoria-alt` / `servant.artoria-alt.skill.sc-artoria-alt-3` | `sc-artoria-alt-3.noble-bloom` | `YES_NO` | No | public yes/no | `T`, `B`, `D:RESOURCE` | Exclude from target slice; trigger and battle coupled |
| 8 | `servant.artoria-alt` / `servant.artoria-alt.skill.sc-artoria-alt-3` | `sc-artoria-alt-3.noble-bloom-extra-vp` | `YES_NO` | No | public yes/no | `T`, `B`, `D:RESOURCE` | Exclude from target slice; trigger and battle coupled |
| 9 | `servant.artoriac` / `servant.artoriac.skill.sc-artoriac-1` | `sc-artoriac-1.return-current-round-attack` | `CHOOSE_N_CARDS` | Yes | `HIDDEN_OR_PRIVATE` | `B`, `H`, `D:CARD_ZONE` | Defer; battle and hidden card identity coupled |
| 10 | `servant.artoriac` / `servant.artoriac.skill.sc-artoriac-2` | `sc-artoriac-2.pay-x-look-x-plus-two` | `CHOOSE_N_CARDS` | Yes | `HIDDEN_OR_PRIVATE`, `PRIVATE_LOOK` | `H`, `D:CARD_ZONE+RESOURCE+DISCARD/CLOSE` | Exclude until private-look contract is accepted |
| 11 | `servant.artoriac` / `servant.artoriac.skill.sc-artoriac-4` | `sc-artoriac-4.unique-passive-luck-on-win` | `YES_NO` | No | public yes/no | `T`, `L`, `B`, `D:RESOURCE` | Exclude; unique trigger group and battle coupled |
| 12 | `servant.artoriac` / `servant.artoriac.skill.sc-artoriac-4` | `sc-artoriac-4.recon-gain-vp-and-move` | `CHOOSE_LOCATION` | Yes | public location candidates | `D:MOVEMENT+RESOURCE` | Low-coupling candidate for R comparison; not selected here |
| 13 | `servant.artoriac` / `servant.artoriac.skill.sc-artoriac-5` | `sc-artoriac-5.unique-passive-luck-on-win` | `YES_NO` | No | public yes/no | `T`, `L`, `B`, `D:RESOURCE` | Exclude; unique trigger group and battle coupled |
| 14 | `servant.artoriac` / `servant.artoriac.skill.sc-artoriac-6` | `sc-artoriac-6.unique-passive-luck-on-win` | `YES_NO` | No | public yes/no | `T`, `L`, `B`, `D:RESOURCE` | Exclude; unique trigger group and battle coupled |
| 15 | `servant.drake` / `servant.drake.skill.sc-drake-1` | `sc-drake-1.mount-summon` | `CHOOSE_N_CARDS` | Yes | `private_to_controller`; controller hand | `H`, `D:CARD_ACTION` | Defer; private hand projection and card-action dependency must be reviewed |
| 16 | `servant.drake` / `servant.drake.skill.sc-drake-2` | `sc-drake-2.reward-and-move` | `CHOOSE_LOCATION` | Yes | public locations | `B`, `D:MOVEMENT+DISCARD/CLOSE` | Defer; automatic reward branch is not interaction; battle and movement remain coupled |
| 17 | `servant.ereshkigal` / `servant.ereshkigal.skill.sc-ereshkigal-1` | `sc-ereshkigal-1.battle-continuation` | `CHOOSE_LOCATION` | Yes | public location candidates | `B`, `D:MOVEMENT` | Defer; battle-state legality coupled |
| 18 | `servant.kintoki` / `servant.kintoki.skill.sc-kintoki-3` | `sc-kintoki-3.golden-eater` | `CHOOSE_N_CARDS` | Yes | `private_to_controller` for both targets | `B`, `H`, `D:CARD_ZONE+RESOURCE+RESULT_BINDING` | Existing staged pilot evidence; retain as private comparison/control, not an automatic representative |

## 3. Exact Strict-Pending Subset

The following set is the exact strict target union from authoring. It contains 11 unique ability IDs and is unchanged by removing automatic effect branches:

| Strict target axis | Ability IDs |
|---|---|
| `CHOOSE_N_CARDS` | `magus-killer.setup`; `time-alter.action`; `sc-artoriac-1.return-current-round-attack`; `sc-artoriac-2.pay-x-look-x-plus-two`; `sc-drake-1.mount-summon`; `sc-kintoki-3.golden-eater` |
| `CHOOSE_LOCATION` | `sc-artoriac-4.recon-gain-vp-and-move`; `sc-drake-2.reward-and-move`; `sc-ereshkigal-1.battle-continuation` |
| `BRANCH_CHOICE` target-bearing strict row | `sc-achilles-2.blue-sky` |
| `CHOOSE_ONE_PLAYER` | `military.attach-support-shot` |

No `YES_NO`, response-only, non-target branch-only, or order ability is added to the strict-pending denominator by this document.

## 4. Selection Boundary For The Next Runtime Slice

Independent design review must compare, at minimum, the low-coupling rows rather than naming a representative in advance. The comparison must check:

- whether the ability truly needs a strict server-owned pending interaction;
- whether legal candidates are public or require Hidden Information work;
- whether Trigger, Lifecycle, Battle, Modifier, or Special Subsystem semantics would dominate the slice;
- whether typed downstream primitives already exist and are accepted;
- whether reconnect and stale-command evidence can exercise the natural production window;
- whether an existing pilot would test the new gateway or merely reuse card-specific continuation logic.

This map offers suitability observations only. Codex R must accept the contract before a separate dispatcher selects and scopes the representative.

## 5. Consumed Automation Baseline

Baseline commit `146213f` supplies the generator and generated authority consumed by this docs-only task. It implements these rules:

1. Remove the rule that maps every effect node of type `branch` to `BRANCH_CHOICE`.
2. Emit `BRANCH_CHOICE` only from a structured `choice` target or another explicit player-owned option/intent schema.
3. Treat `target.visibility` values such as `private_to_controller` and `controller_private_until_resolution` as `HIDDEN_OR_PRIVATE`.
4. Treat controller-owned `hand` and `deck` target scopes as private even when an older definition omits an explicit visibility field.
5. Preserve `PRIVATE_LOOK` as a narrower additional axis rather than using it as the only private-target signal.
6. Emit `CHOOSE_AMOUNT` only from a structured amount target or equivalent explicit player-owned amount intent. A fixed numeric effect field such as `pay_mana.amount` is not interaction evidence.
7. Add generator regressions for the four automatic branches, Achilles fixed `pay_mana(3)`, and Drake Mount Summon plus Golden Eater private targets.
8. Regenerate `docs/audits/fd-skill-semantic-axis-matrix.md` and confirm `explicitInteractionAbilities=18`, `strictPendingInteractionAbilities=11`, `BRANCH_CHOICE=1`, and `CHOOSE_AMOUNT=0`.

Baseline-focused generator regressions cover these rules. The resulting matrix reports `18/11`, `BRANCH_CHOICE=1`, no `CHOOSE_AMOUNT` membership, and structured private-target visibility. None of those automation files are modified by the P3-TO-05 docs-only diff.
