# P3-S Owner Spartacus Complete Migration Result

Role: Codex S
Status: `MIGRATION_CANDIDATE_READY_FOR_FRESH_R`
Date: 2026-09-28
Task: `P3-S-OWNER-SPARTACUS-COMPLETE-MIGRATION`
Exact Base: `20a59b9dd3fad4d4e0f49c22176d42941bd8daab`
Owner root: `servant.spartacus`

## Formal owner scope

This owner-complete transaction contains all three canonical Spartacus frozen identities together:

1. `servant.spartacus.skill.sc-spartacus-1` — 反叛 — newly creditable;
2. `servant.spartacus.skill.sc-spartacus-2` — 伤兽的咆哮 — exact historical accepted preservation/replay only;
3. `servant.spartacus.skill.sc-spartacus-3` — 不屈的意志 — newly creditable.

Strict accounting remains `137/944`, remaining `807`, until this exact formal Candidate receives `MIGRATION_ACCEPTED` and subsequent A-sync/accounting completes. If accepted and synchronized, the owner batch adds exactly sc1 + sc3 (`+2`) and moves strict accounting to `139/944`, remaining `805`. Historical sc2 receives no duplicate credit.

## Source recertification

Locked Reference was mechanically re-read at exact commit `b2f9fa15fba07c63530bbf4612b03b8b704755f9` together with the frozen CHM/development source evidence.

- class: `Berserker`;
- exact deck: `card.cardb1`, `card.cardb2`, `card.cardb4` x3, `card.cardb5` x2, `card.cardb6`, `card.cardq1` x2, `card.cardq2`, `card.cardluck`;
- sc1: 力量, cost `4`, skill-zone requirement `4`, base power `6`, true-name release; source text SHA-256 `c86e6d655017cfdf5d852c81720de191cd2be88c5c43d99c519cdcf39d196416`;
- sc2: 宝具, cost `3`, skill-zone requirement `8`, base power `4`; accepted clause SHA-256 `cc5be3d123f96a8199e6c07bdae9161b93829c7b52cab2e838cb2a19b592996e`;
- sc3: 被动, cost `0`, requirement `0`, base power `0`; source text SHA-256 `9029821ed97e10ed2a58a64b308bf1b835a6dfef0057d864a90c795576195df7`.

Semantics recertified from the locked hierarchy:

- sc1 counts distinct engaged opponents who used an ordinary Command Seal or issuer-owned Ruler Seal this round and grants `(6 - 2X)` aggregate power per such opponent, where `X` is Spartacus remaining normal Command Seal count;
- sc2 after battle chooses one engaged opponent from frozen battle facts and grants `floor(opponent aggregate power / 5)` VP;
- sc3 changes the controller normal and issuer-owned/distributed Ruler Seal effect to consume one physical seal for +4 aggregate power, with exact choice when multiple Ruler seals remain; its Action-stage aura grants +1 aggregate power for every unused normal/Ruler seal owned by each engaged opponent, with Ruler ownership scoped to issuer/distributor.

Historical identity handlers remain evidence only and do not authorize production identity routing.

## Accepted prerequisites consumed

- PR #469 accepted-seam recovery restored/adapted historical FB2-27 Ruler and FB2-48 combat-opponent frozen-power reward seams; final accepted Candidate `d12596998bc4d3a45494e84b107e2577d8e445c4` and zero-credit A-sync `7f0dc16fec89bcbbd78681e7cfc3036616a5c68b`;
- PR #470 complete Spartacus sc1/sc3 seal-power owner-readiness family; final accepted Candidate `c5c418a0c1227924abdac5de6707ebeacbe074a0`, canonical acceptance `https://github.com/binchen648/fd/pull/470#issuecomment-5858470246`, zero-credit A-sync `20a59b9dd3fad4d4e0f49c22176d42941bd8daab`;
- historical sc2 formal acceptance PR #414 / Candidate `58fffb751e25a9ccc2f28470a48255a07ba11493` / canonical Reviewer evidence `https://github.com/binchen648/fd/pull/414#issuecomment-5754190524` / A-sync `b208ac5571c29f28b623f6462438649d9b151b54`;
- accepted FB2-48 prerequisite Candidate `14c8688c201d4d39a85843470be6b79eec01853d` / canonical evidence `https://github.com/binchen648/fd/pull/413#issuecomment-5754051359`.

No readiness/capability work is re-credited by this formal batch.

## Implementation

`data/authoring/servants/servant.spartacus.json` introduces one canonical Berserker owner archive containing exactly sc1 + sc2 + sc3 and the locked 12-card deck.

- sc1 consumes only the accepted #470 true-name/generic seal-user formula shells;
- sc2 is programmatically replayed as the exact historical accepted card object from Candidate `58fffb75...`; a mechanical structural comparison is `true`;
- sc3 consumes only the accepted #470 normal-seal replacement, issuer-owned Ruler-seal replacement, and live unused-engaged-seal aura shells;
- no `packages/rules/src` production runtime file is changed by this formal consumer migration;
- no Spartacus ID/name/card text, Chinese runtime parser, or SkillLib fallback is added to production runtime.

## Material / accounting boundary

Mechanical frozen material scan against the fixed 944 roster:

- exact Base overlap: `137`;
- formal worktree overlap: `140`;
- duplicate frozen IDs: `0` at Base and Candidate material;
- sc1/sc2/sc3 each appear exactly once in formal material;
- the material delta is `+3` because the historical sc2 artifact was absent on the current line and must be preserved/replayed in the complete owner archive;
- formal migration credit is nevertheless exactly `+2`, because sc2 already has formal historical acceptance and cannot be re-counted.

## Focused verification

`packages/rules/tests/regression/p3-owner-spartacus-complete-migration.test.ts`: **8/8 PASS**.

Coverage proves:

- exact three-card owner/class/deck/static metadata and source text hashes;
- sc1 and sc3 compile only through the accepted #470 whole-ability shells while sc2 compiles through accepted FB2-48;
- sc1 3/4 mana boundary, printed cost 4, true-name reveal, and real engaged seal-user formula wiring;
- sc2 7/8 mana boundary, printed cost 3, private frozen-opponent choice and `floor(power/5)` settlement;
- sc3 repeatable physical normal-seal +4 replacement;
- sc3 exact issuer-owned Ruler-seal selection when multiple seals remain and +4 settlement;
- sc3 live engaged-opponent unused-seal aura feeds authoritative battle `totalPower` and ignores a far opponent;
- all three owner cards remain standalone outside product/generated playtest outputs.

## Affected serial verification

**12 files / 245 tests PASS**:

- formal Spartacus owner `8`;
- final Spartacus readiness `20`;
- FB2-48 combat opponent power reward `10`;
- FB2-27 Ruler seal `13`;
- MatchSession `33`;
- executable-card-pack `50`;
- authoring-interpreter `38`;
- combat-resolver `10`;
- resolution-dataflow `15`;
- MatchSession regressions `7`;
- complex-skills regression `37`;
- fixed-controller command-seal component `4`.

## Static/content gates

- `npm run typecheck`: PASS;
- `npm run content:validate`: PASS — `7 masters / 12 servants / 20 events / 0 blocking issues`;
- `npm run content:compile`: PASS — same summary;
- `npm run verify:generated-content`: PASS with unchanged hashes:
  - content `b2c446488a28c5036ac36557e09b563b54b11018d5396233a53f37ffdbff6923`;
  - fixture `fb69383fd91ab56bc645633eae72df8b8c10131cccd2713fd57afcf950a5f057`;
  - evidence `f4ae33de4dc2832766064bdf46e277d9559398d4d34b45d7d05a0eb76744cd14`.

## Whole-suite baseline probe

An additional official `npm run test:ci -- --maxWorkers=2` probe was run before Candidate freeze: `1141 PASS / 15 FAIL` (`152` files passed, `6` files failed). These failures are not hidden or treated as green.

Exact Base `20a59b9d...` was independently loaded in the clean fixed Reviewer and the five tracked failure files were rerun: they reproduce **10 tracked failures** before any Spartacus consumer exists. They are:

- stale Astolfo migration overlap assertion hard-coded to `112` while exact Base already has `137` material overlap;
- M50-02 opponent-close replay: six existing failures;
- Sherlock deck projection missing expected compiled pairing;
- Phase 2 golden-card compiled-content pipeline missing expected card/controller;
- Tomoe real-compiled direct VP regression missing expected pairing.

The remaining five full-probe failures are from local ignored file `packages/rules/tests/.fd-shiki-runtime-debug.test.ts`; exact Base Git tree reports `DEBUG_TRACKED=false`. It is not part of this Candidate and is not deleted or modified.

The formal owner material intentionally changes the stale Astolfo observed overlap from Base `137` to `140`; the underlying failure class predates the Candidate and the canonical formal accounting is not derived from that stale hard-coded test. Final F4/F5 whole-project full-suite convergence remains a later close-out obligation. A complementary exact-scope run excluding only those five mechanically reproduced tracked Base-debt files plus the ignored debug file is fully green: `152 files / 1127 tests PASS`.

## Review boundary

This report does not grant migration credit. Freeze one exact Candidate on branch `codex/s-p3-owner-spartacus-complete-migration-r3` from Base `20a59b9dd3fad4d4e0f49c22176d42941bd8daab`, pass the exact-Candidate Phase 3 policy gate, then request one fresh independent R for the whole three-skill owner batch.

Allowed formal verdicts: `MIGRATION_ACCEPTED`, `MIGRATION_NEEDS_REVISION`, `MIGRATION_BLOCKED`.
