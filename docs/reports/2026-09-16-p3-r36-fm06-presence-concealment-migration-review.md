# P3-R36 FM06 Presence Concealment Migration Review - 2026-09-16

Role: Codex R
Verdict: `MIGRATION_ACCEPTED`
Reviewed A-synchronized lineage: `34f891a7739e86b835bc78e65aa58fdf5f4e955a`
S candidate: `ebc1ca575fcef0e3894b13ec10613801e4227970`
Pre-FM06 accepted A base: `35aa5ef063fe6d8c6c611f70f0696bf111a80657`
Runtime/family acceptance: P3-R35 `ee3367b1ea17e6db9d98b1ae42d769fae6122d5e`
F1 evidence: `59f145434695d29bdd17e4cb3adc887e84182377`
Reference metadata: `b2f9fa15fba07c63530bbf4612b03b8b704755f9`

## Findings

No blocking finding.

## Independent frozen-F1 reconciliation

R36 recomputed the migration set from the frozen F1 inventory rather than trusting S/A summaries.

- F1 static identities: `943`.
- F1 dynamic identities: `1` (`master.tiamat.card.life-sea`).
- Authoritative project denominator: `944`.
- Canonical static overlap before FM06: `79`.
- Canonical static overlap after FM06: `91`.
- Exact additions: `12`.
- Removals: `0`.
- Unauthorized additions: `0`.
- Project-wide accepted overlap after this review: `91/944`.
- Project-wide remaining identities: `853/944`.

The exact twelve additions are the authorized Presence Concealment family only:

- `servant.corday.skill.sc-corday-1`
- `servant.danzou.skill.sc-danzou-3`
- `servant.hassan.skill.sc-hassan-1`
- `servant.hassanhf.skill.sc-hassanhf-3`
- `servant.hassanser.skill.sc-hassanser-1`
- `servant.izou.skill.sc-izou-3`
- `servant.jekyll.skill.sc-jekyll-3`
- `servant.kama.skill.sc-kama-3`
- `servant.kiritsugu.skill.sc-kiritsugu-1`
- `servant.kotarou.skill.sc-kotarou-1`
- `servant.semiramis.skill.sc-semiramis-1`
- `servant.stheno.skill.sc-stheno-1`

Sion Presence Concealment EX is not present in the FM06 material.

## Source and static metadata review

All twelve independently pass:

- frozen full-text SHA `29b3f6c71d8bc5eb6f004d930e5b753f44ee766fb2e47ea6b9f0d89f5fa9643f`;
- frozen clause-source SHA sequence:
  - `ee2d737d979d2141319a55ff72d275847a90be89e5173c3f5030e2083d4dc4cb`;
  - `1e518f04fe63700d7a456ca83de546eb681dd9993f483be7598e5bdac7830b25`;
  - `0484d7c0b9f4cef66623fdfe67831240d883b04f3203f2acc7e2d6151c2a8217`;
  - `1f105508aace520b9a8b6703d50633c174f754856c10c4040b05570cfca0b871`;
- exact Reference legacy ID;
- Reference handler `core.presence-concealment`;
- static card face `迅捷 / cost 3 / base Power 4`;
- historical Reference requirement `3` retained only as evidence;
- final canonical skill-zone threshold `8`;
- source-defined owner class, including `servant.kiritsugu` remaining class `Master` and the other selected owners remaining `Assassin`.

## Structural/runtime boundary review

Each new card conforms exactly to the accepted FB2-12 identity-free semantic:

- optional combat trigger after frozen Power calculation;
- active face-up source;
- strict-second eligibility;
- no client target selection;
- all highest-Power opponents derived from the trusted snapshot;
- `post_power_response` in turn order with decline;
- once per round / one use / this-card scope;
- battle-local defeat effect only;
- same existing BattleResult/scoring path.

There is no production `packages/rules/src` diff between the pre-FM06 accepted base and reviewed lineage.

## Existing material preservation

Semiramis already contained accepted FM05 skill `servant.semiramis.skill.sc-semiramis-2`. R36 independently compared that card object against the exact pre-FM06 base and obtained exact JSON object equality. FM06 therefore appends skill1 without mutating the prior FM05 card semantics.

The FM05 test-only container assertion was correctly narrowed from “archive has exactly one card” to “the exact FM05 card ID occurs once”; all FM05 semantic tests remain intact and green.

## Independent dynamic evidence

R36 ran the validation suite from a fresh reviewer worktree:

- dependency install: PASS;
- typecheck: PASS;
- FM06 + FB2-12 + FM05 focused: `3 files / 20 tests PASS`;
- rules regression/core + FM05/FM06 authoring: `66 files / 388 tests PASS`;
- content validation: `7 masters / 7 servants / 20 events / 0 blocking issues`;
- deterministic generated-content hashes unchanged:
  - content `8da51a30935845670dcd88928089730ff4a7a39d9b53b8c8c794189d95509840`;
  - fixture `fb69383fd91ab56bc645633eae72df8b8c10131cccd2713fd57afcf950a5f057`;
  - evidence `b1bb8968097534c796cc6ff5775f3a14cfbbd063aa24e6b94f79a7e81d655cc3`;
- standard full CI: `118 files / 720 tests PASS`;
- runtime diff: `0`;
- diff check: PASS.

The representative real Corday migration executes the accepted `[5,10,10]` pre-scoring path: it opens the optional response before BattleResult construction, derives both highest opponents, records battle-local defeats, and settles through the existing winner/scoring machinery.

## Material coverage integrity

Fresh reviewer coverage equals the A-committed material coverage except `generatedAt`:

- archives `80`;
- cards `113`;
- abilities `212`;
- raw `new=22 / legacyExecute=3 / legacyResolve=127 / dual=0 / notClassifiable=60 / taxonomyWarnings=124`;
- source fingerprint `8bbbca216337b427509dd0dd133ef4515ede49c443937115ff9372259cd23ec4`;
- compiled definition hash `37551fd5f5b0a968f9143dee0698adf8582a0a26d8edabef55907cf78d374333`;
- compiled cards `70`, characters `14`, blocking issues `0`.

The fresh reviewer artifact differs from the committed A artifact by one field only: `generatedAt`. It remains intentionally unstaged.

## Verdict

`MIGRATION_ACCEPTED`.

FM06 is independently accepted for exactly the twelve Presence Concealment identities. Accepted canonical overlap therefore advances from `79/944` to `91/944`, leaving `853/944` identities outside accepted canonical authoring. This verdict does not accept Sion EX, generic defeat, broad Trigger, generic Target Selection, global defeat/elimination state, or any other special-handler family.
