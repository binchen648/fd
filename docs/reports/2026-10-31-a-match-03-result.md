# A-MATCH-03 default seven-player whole-match delivery

Base: bbe1ef91584d550c690552efa5d5bbae78d36b3b. Reviewed candidate: f31c3b12f02c4560c96eaf0f1c991c8edc8b16b7. PR686. Sole builder/global lead /root; independent reviewer /root/a_match_03_independent. Implementation-complete candidate,not human merge consent.

## Observed defects and fixes

A default room could reach11rounds while silently violating supply:round6p1hand2/discard10. Preserve original failing assertion. Recycle only drawing player's discard after consuming remaining deck prefix,retain all physical identities/order of unconsumed prefix,shuffle deterministically,reset controller/visibility/transient source state;exclude other owners and removed/independent/attack zones. Preparation draws in rotated active order before situation mana and events.

Actual WS progression exposed workshop deployment changing location/mana without advancing revision(10->10). Increment authoritative revision for successful deployment so subsequent old-revision mutations are rejected. Validation still precedes mutation. Remote outpost previously showed three identical deploy_player labels; show distinct destination labels and canonical outpost phase without changing legal commands.

## Acceptance evidence

Two default-pack seeds20260904/20260905 play from genuine seven-human room creation/join/seat/start through11rounds; assert strict terminal outcome,all11start/end receipts,hand refill,normal movement and midgame signed restore/stale refusal. No state/round/card/outcome injection. Isolated supply boundary tests are explicitly separate fixtures.

All19server tests PASS,including realHTTP create/join and7WS gameplay,round4staged save via signed authenticated HTTP restore,forged save refusal,stale duplicate refusal,owner hand privacy and terminal reconnect. First full7pagebrowser run naturally1PASS2.9min; final clean-source archive run naturally1PASS3.0min:523 UI-click decisions,rounds1..11,p5highestVPwinner,zero errors. Setup uses publicHTTP plus UI seating/start;all game decisions use visible buttons. Reload at round4 and after terminal outcome passes. Late-round surviving decisions match7->4->3->2. Original first TypeScript cross-rootDir test-import failure corrected by local test policy; no production semantics changed. Three accidental compiler outputs archived externally and absent in final run.

Independent5supply boundary probes+72terminal/authority tests PASS. Reviewer independently checked archived whole-match result/transcript/screenshot/source path. Interpreter/loader unchanged. Typecheck/build and new remote projection test PASS. Exact assembledHEAD original test:ci still required as final gate.

## Separate failed gate and limits

Full client unit suite53PASS/1FAIL:fd-asset-registry approved-authoring-list assertion differs from all authoring archives. Identical focused failure reproduced at c99fa8f8,whose tree equals basebbe1ef91;asset source/test/authoring unchanged. Root test:ci has always included packages/scripts,not apps/client. No test skipped,deleted or selection changed. This is a separate client-release blocker requiring asset-owner inventory/approval reconciliation;do not declare unconditional client release PASS.

This evidence certifies representative default seven-player product paths under deterministic optional-skill-decline policy. Not all943+1skills,all optional abilities,3-6seats,NPC,3X or every temporary/residual/per-game cleanup interaction. B remains read-only;existingHelena/Nursery contracts must be reviewed rather than reimplemented;DeepSeek-next.md outside repo supplies precise next admission prompt. No migration/coveragecredit.

## Evidence and authority

External originals and hashes: D:/fd-validation/a-match-03-evidence-20261031 including supply-red,deploy-revision-red,client-deploy-red,whole-match-result.json/png,whole-match-transcript.json,independent-final-f31c3b12.json,client-asset-baseline.json. CI-repair authority explicitly RELEASED after merged main PASS;A-MATCH-03 sole GRANTED,CB-C02 suspended. One PR to main;user approval of final HEAD required before merge,then verify main CI. Do not use earlier PASS or running status as final-headPASS.
