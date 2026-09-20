# P3-A R81 Darius s1 Recertification Handoff

- Owner: Codex S
- Status: `READY_AFTER_B2_REVIEW_BINDING`
- Frozen identity: `servant.darius.skill.sc-darius-1`
- Runtime dependency: `P3-B2-R81-TRIGGERED-RESIDUAL-CLOSE-INTEGRATION`
- Migration credit: no new identity; resolve previously contested +1 only after independent R

Use the exact accepted B2 integration commit once it is published and bound to an independent R verdict. Keep Darius's printed-text hashes, static metadata, and canonical authoring semantics unchanged unless the source evidence itself is proven wrong. Do not edit runtime production code or add card-specific routing.

The recertification must load the real archive and execute the real post-scoring `MatchSession.resolveBattlePhase` path. Assert that eligible no-loss closure consumes the typed route, moves the source to skill, makes it inactive and owner-only visible, and emits exactly one `source_card_closed` with correct source/controller identity. A represented loss must preserve the source; non-participation must not count as a loss. Invalid source/terminal provenance and replay must fail closed without mutation or duplicate event. Also verify unrelated on-play CLOSE remains unchanged.

S reports an exact Base/Candidate and focused, rules-regression, typecheck, content, determinism, and CI results. R reviews that integrated Candidate before A resolves the conflicting historical Darius s1 verdict. Do not award a second migration increment for this identity.
