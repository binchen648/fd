# P3 Builder — Zouken s3 `创造者`

## Scope

This Builder branch starts at the accepted ascension Candidate `94e05581bb1dc62c01fa69f8e30fb1e8e8f9eb10`. It changes only the Zouken s3 source archive, its generated content/evidence, and the source-specific runtime/test contracts. Accepted s1/s4/s5/ascension lineage, PRs, frozen inventory and credit accounting are not edited.

## Canonical provenance

- Source text: `E:/Codex/FD/Fate_Domination-开发版/data_masters.js`, locator `line=19#record=m_zouken.s3`, SHA-256 `C596AF5730846EF9092375F18C4200B84F032028DC2E8F5483377D8DDCC22825`.
- Normalized printed text SHA-256: `cea95dc5010d588158e85f29d23cbbfa92f4a3211825312a12d0f641b7648b44`.
- Development card image: `E:/Codex/FD/Fate_Domination-开发版/images/masters/间桐脏砚.png`, SHA-256 `4E4F3F5607D7B39BC16F4ACB01831976E4036F38EBC180514C4E6BC28F75C6B9`.
- Legacy snapshot candidate: `master/master.zouken/s3`, SHA-256 `BFF4C268CA3F292E3F32FD2A3B51C7520E3D8C475C703BDB854A43B48318BF2A`.

The archive keeps the complete printed source text and binds each clause to the s3 legacy locator. The second-repository material remains provenance evidence only; no old runtime was copied.

## Target-runtime contract

1. `zouken.founder` is an exact active passive shell. While the exact source card is active, controller command-seal state is projected as zero; generic controller seal gains/spends are source-specifically replaced by four mana per seal. Negative replacement is atomic and rejects before resource mutation when mana is insufficient.
2. `zouken.founder.power-conversion` is an exact action-window ability. It accepts only positive integer `X`, pays exactly `2X` mana atomically, records `{ round, amount: X }` in the authoritative rule override, and adds `X` to the player’s current-round combat power. It is unavailable outside action/active/priority state and cannot be reused in the same round.
3. `zouken.founder.after-win` is an exact `after_controller_wins_battle` trigger. It settles the current-round recorded `X` into victory points once per source/round. The rule override is restore-validated and the settlement key is replay-idempotent.

All three shapes are source-specific and fail closed through semantic guards; malformed near-matches are rejected rather than interpreted as generic directives.

## Verification

- Focused s3: 5/5.
- Existing Zouken s1/s4/ascension regressions: 20/20; combined with s3: 25/25.
- `npm run content:validate`: PASS, 8 masters / 7 servants / 20 events / 0 blocking issues.
- `npm run verify:generated-content`: PASS; generated hashes are deterministic.
- `npm run typecheck`: PASS.
- `git diff --check`: PASS.

Remaining boundary: s3 is implemented as a strict source-specific contract on this Builder branch and has not been Candidate-reviewed or credited. It must be independently reviewed before any Candidate/A-sync action.
