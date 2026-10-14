# P3-CB-A1 Fortification PREPARE

Task: `P3-CB-A1-FORTIFICATION-PREPARE`
Main: `a42b5e1c517141b90f3407773958b0d8afe63264`
Epoch: `FD-P3-2026-09-23-09`
Conclusion: `BLOCKED_WITH_REASON`

Single decision blocker: `WHOLE_FORTIFICATION_PRODUCTION_CONTRACT_NOT_CLOSED`.
This is not a finding that all underlying technical remedies are one change. Admission and residual-lifecycle observations are both preserved below; neither is hidden to satisfy a one-blocker output.

Packet: `artifacts/phase3-cb-a1-fortification-prepare.json`
SHA-256: `7F3B27BF5E999C7E656C6AD0A75E96B1C8E45F05D90C69947DD9A96BD3C2278F`

## Whole Identity And Contract

The two full identities are `servant.gilles.skill.sc-gilles-2` and `servant.medea.skill.sc-medea-2`. Both archives already exist; neither is in accepted-111 or generated production cards/characters. Whole printed text equals frozen inventory, with SHA-256 `33c9377158b49fad67a503f1368f81efa65b97cff870c2331c8ca4ee69937446`. Ability structures and cardFace are equal after removal of identity-only ability IDs.

The complete printed rule is a round-number power formula followed by residual controller workshop deployment reward. It is not merely two resource adjustments.

Shared component contract: FM05 Territory Creation, comprising FB2-11 authoritative round formula and FB2-02 deployment resource reward. Primitives/evaluators are `evaluateFormula(add/multiply/game.round_number)`, typed `adjust_mana(+1)` and typed `adjust_victory_points(+2)`. There is no single universal fortification primitive.

Both current definitions use the same inspected component paths:

- Power: `calculateCardPower -> evaluateFormula -> game.round_number`, value 16-2*round.
- Reward: `MatchSession.deploy -> after_player_deployed_to_battlefield -> workshop/controller scope -> isDeploymentResourceRewardSemantic -> executeResolutionEffects -> typed mana/VP`.

Same component contracts/primitives/routes: YES. Same proven complete production route: NOT_VERIFIED.

## Production Admission

Both cards and both playable owners are absent from the production library. Both archives contain one skill, no deck, and no top-level product source-image declarations. Canonical printed source evidence is present and hash-matched; product loader metadata is incomplete.

The existing servant path is `authoringServantFiles -> convertAuthoringServant -> startingDeckFromAuthoring -> executable characters/decks -> MatchSession`. It requires exactly three skill cards and a 12-card starting deck. There is no current standalone servant rules-only admission channel. Adding pack references or manually patching generated artifacts cannot establish admission. Do not invent placeholder skills/decks or recreate these two existing identities.

Historical R50/FM05 archive acceptance did not change production pack/generated material. It does not authorize the current production surface or new main credit.

## Residual Boundary

`RUNTIME_SEMANTIC_GAP`, static contract evidence only:

- Final Rules 11.3/11.5 require residual attacks to stay active across rounds until closed.
- Both authoring cards contain only continuous_formula and forced_trigger, with no residual ability or lifecycle metadata.
- `MatchSession.discardRoundAttackAreaCards` retains attack-area sources only when a residual-kind ability is present.
- The existing variant test manually adds a source and marks it active. Its four tests cover hashes, structure, formula and deployment reward, but not real play followed by round cleanup or activation/closed-source provenance.

This exposes an unclosed whole-rule mapping. It does not establish whether the eventual remedy is authoring mapping or shared Runtime; B/RB must decide within a separate exact scope. A made no fix and ran no injected production probe.

Existing trigger support is present. No new trigger engine, authority contract or battle pipeline is demonstrated necessary by this audit. Initialization/MatchSession changes cannot be certified unnecessary before admission is resolved. Canonical residual mapping and real cleanup evidence are required, so this pair exits ordinary A1 IMPLEMENT readiness.

## Tests And File Impact

Existing tests inspected, not rerun:

- `packages/rules/tests/fm05-territory-variant-extension.test.ts`
- `packages/rules/tests/fm05-territory-creation-authoring.test.ts`
- `packages/rules/tests/regression/fb2-round-number-formula.test.ts`
- `packages/rules/tests/regression/fb2-deployment-resource-reward.test.ts`

Existing negative coverage includes wrong location/player, movement not deployment, stable event-id replay and malformed reward shape rejection. Missing production evidence includes actual registry/source instantiation, pre-activation/after-close rejection, full round cleanup retention, cross-round behavior and complete atomic state/events/revision checks for both identities.

Conditional content paths are the two existing archives and pack.json; generated outputs are content-library, fixture and evidence-report from the existing generator. Proposed focused test is `packages/rules/tests/regression/cb-a1-fortification-production.test.ts`. No implementation reservation or literal final file scope is granted.

Hot files needing owner investigation, not A edits: playtest-pack-loader.ts, executable-card-pack.ts, interpreter.ts and match-session.ts. Primitive implementations are present; no proposed hot-file patch is authorized by this packet.

## Handoff

Only packet/report added. Read-only source hashes, full-text agreement, identity-free component equality, registry absence and ledger membership were checked. No runtime/authoring/test changes, gameplay tests, PR or migration credit.

Main accounting stays 111/944, remaining 833; all deltas zero. Global Gate C and 93 missing-image Release blockers remain.

Next: Planner routes one full-production-contract clarification to the content/runtime owner and RB, keeping admission and residual observations visible. No Lead Builder IMPLEMENT task is issued until that contract is closed.

Final conclusion: `BLOCKED_WITH_REASON`.
