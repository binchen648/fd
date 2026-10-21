# P3-B Zouken Builder provenance and owner boundary

- Date: 2026-10-21
- Lane: Builder (GPT-5.6 Luna)
- Base: 658849d1 (codex/b-p3-main-replay-fb2-49-r2)
- Worktree: E:\Codex\FD\binchen648_fd\zouken-owner-preflight
- Scope: exactly master.zouken / 间桐脏砚, ascension + s1-s5
- Decision: R1 active-pack compile-safe split; s5 executable, five mechanics remain explicit HOST_ADJUDICATED source candidates

## Provenance

The six printed texts are bound card-by-card in
data/authoring/masters/master.zouken-source-candidates.json. The source
candidate is E:\Codex\FD\Fate_Domination-开发版\data_masters.js, SHA-256
C596AF5730846EF9092375F18C4200B84F032028DC2E8F5483377D8DDCC22825,
locator line=19; record=m_zouken. Each candidate card stores normalized
printed text, full-text SHA-256, legacy locator, clause locators/hashes, and
the development owner-art reference.

The shared development card art is
E:\Codex\FD\Fate_Domination-开发版\images\masters\间桐脏砚.png, SHA-256
4E4F3F5607D7B39BC16F4ACB01831976E4036F38EBC180514C4E6BC28F75C6B9,
locator master.zouken/间桐脏砚. The cross-repository audit is recorded with
SHA-256 8CBF562644144572B7E6A3A27BB2526B1A2AF8E1B6F513E1A362424B02F7BEAC.
These are Builder provenance bindings, not a Reviewer semantic verdict.

## Runtime boundary

The active pack registers the compile-safe
data/authoring/masters/master.zouken.json, which contains only the accepted
s5 automatic game-start install_rule_override contract and uses
verification.implementationStatus=complete, the loader's accepted value.
The six-card source archive is retained separately as
master.zouken-source-candidates.json; ascension and s1-s4 remain explicit
host_adjudicated there and are intentionally excluded from executable pack
compilation. This avoids claiming automatic/FULL and avoids copying old
core.zouken-* runtime. Engagement bypass, FM09 derived-skill provisioning,
command-seal substitution/variable power, pseudo-vampire timing/targeting,
and ascension seal-loss targeting still need accepted target contracts.

## Inventory reconciliation

The frozen inventory now carries a builderProvenance section for exactly the
six Zouken IDs, recording the audit document, source/art SHA-256 values,
legacy locators, and per-skill text hashes. All six semanticNormalization
and phase3 records intentionally remain BLOCKED/EXPLICIT_BLOCK; provenance
attachment alone does not clear a semantic or target-runtime contract block.

## Verification

Focused regression coverage is in
packages/rules/tests/regression/zouken-owner-builder.test.ts. Its 2 tests
check exact six source-candidate IDs, normalized text hashes, source/art SHA
bindings, host-vs-automatic boundary, loader-clean s5 archive, s5 semantic
classifier, and active-pack registration.

npm run content:validate could not run in this isolated checkout because
node_modules/.bin/tsx is absent. Static JSON/hash and git diff --check checks
are run in Builder. No production runtime outside Zouken authoring/manifest
was modified.

