# P3-FB2-26 exact three consumer migration Candidate

Status: `MIGRATION_COMPLETE_CANDIDATE` only. No Reviewer acceptance, A-sync,
merge, retarget, or formal credit is claimed.

## Exact baseline and scope

- Base: `a4a4d24ca666c7b727f7e37e761a13f7887e5803`.
- Accepted FB2-26 runtime infrastructure: `a4a4d24ca666c7b727f7e37e761a13f7887e5803`.
- Formal accounting Base: `151/944 FULL`; remaining `793`.
- Authorized consumers, exactly:
  `master.ciel.skill.s1a`, `master.shiki-ryougi.skill.s1a`, and
  `master.shirou-emiya.skill.s2`.

The three existing FM09 owner archives were renamed into the explicit
`authoringMasterRuleFiles` channel. Their existing cards, source text, hashes,
and accepted target/dependency identities are preserved byte-for-byte at the
card-field level; only playable `publicInformation` and normal-channel
registration were removed. Ryougi's existing s1/s2 identities remain in its
archive. Bazett, Fujino, Tohno, the seven-seat fixture, and runtime sources are
unchanged.

## Exact consumer evidence

| source | source SHA-256 | target |
| --- | --- | --- |
| `master.ciel.skill.s1a` | `2cdf7e6bcc7876757898867a73658374247440ab0d78a6a21d2b8f34cf19d486` | `master.ciel.skill.s2` |
| `master.shiki-ryougi.skill.s1a` | `d1e84428f5798f573fd01ed7f061e937925424f2fbab89c4a43ad6af7782d98f` | `master.shiki-ryougi.skill.s3` |
| `master.shirou-emiya.skill.s2` | `a0ea1f45cedb3ac69c9d4050cfdadcf318cf32f62b749013a8454245535ca575` | `card.derived.master.shirou-emiya.ganjiang-moye` |

Every registered card ID is unique and each authorized source/target is
registered exactly once. No new playable character, deck, fallback command
spell, or session seat was added.

## Candidate material accounting

- Raw authoring cards: `60 -> 60` (channel/materialization only).
- Playable masters: `13 -> 10`; fixture seats: `7 -> 7`.
- Executable cards: `90 -> 87` because three removed playable owner overview
  surfaces are no longer product cards; the rules archive card stream remains
  complete and contains all preserved FM09 cards.
- Mechanical frozen material: `151/944 -> 154/944`, exact additions `+3`
  (the three authorized source identities), removals `0`, duplicate canonical
  IDs `0`; formal accepted accounting remains `151/944` pending fresh R/A.

## Validation receipt

- Focused migration/loader/compiler/FM09 regression: `4 files / 79 tests PASS`.
- Full official CI: `126 files / 809 tests PASS`.
- `npm run typecheck`: PASS.
- `npm run content:validate`: PASS; `10 masters / 7 servants / 20 events / 0 blocking issues`.
- `npm run verify:generated-content`: PASS; library
  `b9f5b96a4e93be13ed715dc8c6e85218888e384d846eac315045d0336e763c4e`, fixture
  `fb69383fd91ab56bc645633eae72df8b8c10131cccd2713fd57afcf950a5f057`, evidence
  `6843da606d177d4546fad068ffc4a33c54380ea7353030504f2e306fca54563b`.
- `git diff --check`: PASS.

The standalone product-source-asset test retains the known fresh-checkout
missing historical `master.kayneth.overview` asset failure; it is outside
`test:ci` and unrelated to this migration.
