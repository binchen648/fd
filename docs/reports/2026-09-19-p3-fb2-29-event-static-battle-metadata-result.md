# P3-FB2-29 Rules-Only Event Static Battle Metadata Result

Role: Codex B2
Status: `IMPLEMENTATION_COMPLETE_CANDIDATE`
Date: 2026-09-19

## Baseline

- Exact A dispatch Base: `19170290ff851527f69cc2a01d2d26eccde1820c`
- Exact accepted coordinator baseline behind the dispatch: `1c33320b468825dd7e37b5ede6645bb29e5ee333`
- Accepted FB2-28 runtime dependency: `69f2fb09ca951957148f965df459bb3063323800`
- Blocked S evidence motivating FB2-29: `c735b235af3ab273a8daabffeae71db81809250a`
- F1 evidence: `59f145434695d29bdd17e4cb3adc887e84182377`
- Locked Reference: `b2f9fa15fba07c63530bbf4612b03b8b704755f9`
- Formal accepted frozen overlap remains `127/944`; remaining `817`.

FB2-29 is generic infrastructure only and earns zero frozen migration credit.


## R62 blocker-only revision

Fresh independent R62 rejected the original Candidate `6a603ca0f5dfd1e702fc9e8c269534b05e919f77` with `IMPLEMENTATION_NEEDS_REVISION` because both authoring boundaries coerced `attribute` / `condition` through `String(...)`. That allowed malformed single-element arrays such as `attribute: ['strength']` or `condition: ['has_attribute']` to canonicalize as valid scalar enum values.

This revision is intentionally narrow:

- the content loader now requires `typeof attribute === 'string'` and `typeof condition === 'string'` before enum membership;
- the executable compiler independently requires the same exact scalar-string types before mapping/enum membership;
- both independent adversarial matrices now reproduce R62's single-element-array attacks and require rejection;
- no authoring/product data, runtime routing, migration consumer, lifecycle code, or frozen accounting is changed.

The revision remains FB2-29 infrastructure-only and still earns zero frozen migration credit. A fresh independent R63 review is required before any A capability synchronization.

## Implemented contract

Rules-only `event_rule_definition_archive` cards may now declare optional structured `cardFace.battleModifiers`. When present the array must be nonempty and every entry must contain exactly:

- `attribute`: one canonical attribute from `strength | agility | magecraft | special | noble_phantasm`;
- `condition`: one existing generic event-combat condition from `has_attribute | lacks_attribute | has_repeated_attribute`;
- `value`: a nonzero safe integer.

Both the content-loader boundary and executable-compiler boundary independently enforce that exact shape. Unknown attributes/conditions, empty/non-array values, zero/fractional/non-finite values, missing fields, and extra fields such as caller-provided `sourceId` fail closed.

The executable compiler maps canonical attributes to the existing runtime attribute tags and emits the result through the already accepted `EventCatalogEntry.battleModifiers` surface. Modifier `sourceId` is always compiler-derived from the event definition ID; authoring cannot spoof it.

No new interpreter route, event subsystem, identity-specific handler, or combat resolver branch was added. Existing FB2-28 placement/lifecycle code copies catalog modifiers onto authoritative event placements; existing combat resolution consumes those modifiers only at the placement battlefield.

## Focused runtime evidence

A new identity-free regression compiles a synthetic rules-only event with:

- Strength `+4` / `has_attribute`;
- Agility `-2` / `has_attribute`;
- printed reward 4.

Through the real compiler and FB2-28 lifecycle it verifies:

1. `eventCatalog.battleModifiers` contains exact compiler-derived entries;
2. the definition still does not enter ordinary executable player `cards`;
3. outside-game -> battlefield produces an authoritative placement with exact VP and modifiers;
4. combat at that battlefield applies exact `+4/-2` event modifiers;
5. combat at another battlefield receives no modifier from that event;
6. battlefield -> discard -> battlefield preserves the original location and exact battle modifiers.

Focused content/compiler adversarial tests additionally cover malformed static metadata at both validation boundaries and source-ID spoof prevention.

## Scope / isolation

Base-to-Candidate production changes are limited to generic content/compiler code plus tests and this report. There are no changes under:

- `data/authoring/**`;
- `data/packs/**`;
- `data/generated/**`;
- `data/phase3/**`;
- `apps/**`;
- `scripts/**`;
- `artifacts/**` after restoring audit outputs.

Changed production code contains zero hits for the downstream Kadoc/Ophelia canonical IDs, owner names, `core.lostbelt-objective`, the F1 SHA, or locked Reference SHA. No consumer authoring is included.

## Validation

- Typecheck: PASS.
- Focused content/compiler/runtime suite: **`3 files / 176 tests PASS`**.
- Rules `src + core + regression`: **`82 files / 489 tests PASS`**.
- Official `npm run test:ci`: **`142 files / 1016 tests PASS`**.
- Eleven-round MatchSession gate on the blocker-only revision: approximately **4471 ms**, within unchanged 5000 ms timeout.
- `npm run content:validate`: PASS, `7 masters / 7 servants / 20 events / 0 blocking issues`.
- `npm run content:compile`: PASS with unchanged product counts.
- Generated determinism: PASS with unchanged hashes:
  - library `866a5b4249933b172bfebd7548c796a09fdbcf0bd6890929555a398dfa77e736`;
  - fixture `fb69383fd91ab56bc645633eae72df8b8c10131cccd2713fd57afcf950a5f057`;
  - evidence `b1bb8968097534c796cc6ff5775f3a14cfbbd063aa24e6b94f79a7e81d655cc3`.
- Locked Reference verification: PASS at exact `b2f9fa15fba07c63530bbf4612b03b8b704755f9`, clean.
- Client production build: PASS; existing Vite `node:crypto` externalization and chunk-size warnings only.
- Phase 3 coverage: `111 archives / 150 cards / 255 abilities`; compiled `76 / 14 / 0`; routing `22/3/135/0/95/137`.
- Automation audit: `135/3/95/20`.
- `git diff --check`: PASS.

### Local dependency-materialization note

The first fresh-B2 `npm ci --offline` stalled in Windows package materialization and was terminated after it left a truncated nested `@types/node`. This was an environment/setup failure, not a test result and is **not** reported as PASS. B2 repaired only untracked dependency files from a sibling fresh worktree using the same lockfile and re-verified all `@fd/*` workspace junctions point to this B2 worktree; no repository file was changed by that repair. All gates above then executed from this B2 worktree. Fresh R must independently install dependencies rather than inherit this setup.

## Frozen accounting

A mechanical recount from authoritative F1 and the exact current authoring tree reproduces:

- denominator: `944`;
- authoring archives: `111`;
- authoring cards: `150`;
- unique authoring cards: `150`;
- frozen overlap: `127/944`;
- duplicate frozen IDs: `0`;
- remaining: `817`.

Base-to-Candidate has zero authoring changes, so additions and removals are both empty. Historical P3-FM09 remains `MIGRATION_BLOCKED`.

## Downstream status

FB2-29 itself authorizes no migration credit. If independently accepted and synchronized by A, the previously blocked homogeneous four-card Lostbelt objective event family may be re-evaluated for a separate fresh S migration. Formal accepted remains `127/944` until such a migration is independently accepted and A-synchronized.
