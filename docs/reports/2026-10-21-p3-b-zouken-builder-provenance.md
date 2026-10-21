# P3-B Zouken Builder provenance and owner boundary

- Date: 2026-10-21
- Lane: Builder (GPT-5.6 Luna)
- Base: \`658849d1\` (\`codex/b-p3-main-replay-fb2-49-r2\`)
- Worktree: \`E:\Codex\FD\binchen648_fd\zouken-owner-preflight\`
- Scope: exactly \`master.zouken\` / 间桐脏砚, ascension + s1–s5
- Decision: **builder archive and active-pack binding prepared; five mechanics remain explicit HOST_ADJUDICATED**

## Provenance

The six printed texts are bound card-by-card in
\`data/authoring/masters/master.zouken.json\`. The source candidate is
\`E:\Codex\FD\Fate_Domination-开发版\data_masters.js\`, SHA-256
\`C596AF5730846EF9092375F18C4200B84F032028DC2E8F5483377D8DDCC22825\`,
\`line=19; record=m_zouken\`. Each card stores its normalized printed text,
full-text SHA-256, legacy locator, clause locators/hashes, and the development
owner-art reference.

The shared development card art is
\`E:\Codex\FD\Fate_Domination-开发版\images\masters\间桐脏砚.png\`, SHA-256
\`4E4F3F5607D7B39BC16F4ACB01831976E4036F38EBC180514C4E6BC28F75C6B9\`,
locator \`master.zouken/间桐脏砚\`. The cross-repository audit itself is recorded
with SHA-256
\`8CBF562644144572B7E6A3A27BB2526B1A2AF8E1B6F513E1A362424B02F7BEAC\`.
These are Builder provenance bindings, not a Reviewer semantic verdict.

## Runtime boundary

The active pack now registers the archive in
\`data/packs/fd-playtest-v1/pack.json\`. The accepted s5 contract remains the
automatic game-start \`install_rule_override\` for
\`ignore_situation_play_forbid_attribute=宝具\`. Ascension and s1–s4 are
represented as explicit \`host_adjudicated\` abilities with named directives;
they are not advertised as automatic/FULL and no old \`core.zouken-*\` runtime
was copied. The remaining target-runtime boundary is therefore visible and
reviewable: engagement bypass, FM09 derived-skill provisioning, command-seal
substitution/variable power, pseudo-vampire timing/targeting, and ascension
seal-loss targeting still need accepted target contracts before automation.

## Verification

Focused regression coverage is in
\`packages/rules/tests/regression/zouken-owner-builder.test.ts\`. It checks the
exact six IDs, normalized text hashes, source/art SHA bindings, host-vs-
automatic boundary, s5 semantic classifier, and active-pack registration.

\`npm run content:validate\` could not run in this isolated checkout because
\`node_modules/.bin/tsx\` is absent. No production runtime outside the Zouken
archive/manifest was modified; the frozen inventory remains a Reference
artifact and is not rewritten here.

