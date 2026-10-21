# P3-B Zouken Ascension Builder Report

Base: accepted Zouken s4 Candidate `8587818ead1dd60e9e96a2971e06b8c35ade21c1`.
Builder branch: `codex/b-p3-zouken-ascension-builder`.

## Provenance

The active archive binds `master.zouken.skill.ascension` to the cross-repository
source audit `E:/Codex/FD/.fd-takeover-audit-20261018/FD-ZOUKEN-CROSS-REPO-SOURCE-AUDIT-20261021.md`
and to the development source `E:/Codex/FD/Fate_Domination-开发版/data_masters.js`
at `line=19#record=m_zouken.ascension` (development source SHA-256
`C596AF5730846EF9092375F18C4200B84F032028DC2E8F5483377D8DDCC22825`). The
normalized printed-text SHA is `6bec5e2443f416546ea830907c255e87b2ad2d9cad9ddb12dfd8436c0b0ee7b7`.
The development card art is bound to
`E:/Codex/FD/Fate_Domination-开发版/images/masters/间桐脏砚.png` with SHA-256
`4E4F3F5607D7B39BC16F4ACB01831976E4036F38EBC180514C4E6BC28F75C6B9`.

## Runtime contract

The passive is recognized only when the exact active ascension definition,
printed clause, `while_active` activation, and directive effect are present.
That predicate bypasses normal engagement checks for movement and is also used
by the accepted s4 settlement to remove its controller-win gate. The action is
recognized only with the exact action window, same-battlefield active-opponent
target constraints, one-command-seal lower bound, and six-mana cost. Target
selection is revalidated before payment; payment and the target seal event are
transactional, and a target with zero seals is never legal.

## Verification

- ascension focused regression: 6/6
- existing s1 and s4 focused regressions: 13/13
- generated content compile/validate: 8 masters, 7 servants, 20 events, 0 blocking issues
- workspace typecheck: pass
- `git diff --check`: pass

The frozen inventory remains unchanged. This is a Builder commit only; no
Candidate, A-sync, credit, or PR was created.
