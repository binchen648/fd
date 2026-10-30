# A-END-01 seven-player terminal implementation plan

Goal: canonical VP cutoff and final win/overflow for seven-player standard Session, without a second engine. Base48eef963. Owner/root sole writer; independent review separate. Use test-driven-development and execution in this existing isolated checkout.

1. Add real Session red tests for military non-elimination and round8/9/10 cutoff ties; final VP/Miyama/overflow; pending end windows/repeated finish/signed restore. Capture raw RED externally.
2. Implement pure standard-endgame resolver in existing elimination-resolver, explicit result schema, standard scoring no military elimination; preserve old core under explicit legacy policy.
3. Wire Session round_end finalization after all pending decisions; keep battle outcome history for tie-break, never a transient sorted ranking as winner. Project outcome safely; no unapproved generic protection semantics.
4. Carry outcome through local/remote fixture and display winner/overflow; server negative/reconnect tests and real browser fixture.
5. Run scoped tests/typecheck/build, freeze candidate, independent review+fix, original fullCI. One Promotion PR after accepted review; no automatic merge.

Exact authorized paths/dependencies/forbidden paths: manifests/tasks/A-END-01.json. No interpreter/loader permission. Full 11round product acceptance remains subsequent work.
