# P3-B Araya Owner Readiness Persistent Terrain Result

Date: 2026-10-01
Task: `P3-B-ARAYA-OWNER-READINESS-PERSISTENT-TERRAIN`
Exact Base: `c71b67e6ea78c891bc0e494600cc2c7ef7ca6529`
Classification: bounded zero-credit owner-readiness capability.
Accounting remains `194/944`, remaining `750`.

## Frozen source closure

The exact generic contract closes the frozen Triple Boundary terrain semantics without any Araya identity routing:
- authoritative `after_player_deployed_to_battlefield` only;
- the deployed player must currently own a real terrain slot at that battlefield;
- each qualifying deployment adds exactly one persistent replacement-terrain layer for that player/location/source;
- the replacement is per-location, persists for the game, and caps at 5;
- it applies only while that player is physically at the recorded location; leaving disables it and returning reactivates the accumulated value;
- deployment without a terrain slot adds nothing;
- the persistent replacement feeds the existing shared terrain adjustment/multiplier path rather than mutating transient terrain assignments.

## Generic implementation

- New exact whole-ability privileged effect: `persistent_location_terrain_replace_increment` with `amount: 1`, `max: 5`.
- Exact gateway accepts only a forced `after_player_deployed_to_battlefield` ability with the bounded shape.
- Runtime provenance is keyed by player + location and records physical source card, ability, accumulated value, and unique authoritative trigger-event ids.
- Duplicate events are idempotent; provider conflicts fail closed.
- Restore boundary validates the stored shape and the interpreter provenance validator re-proves player/location/source/ability and processed-event authority.
- `terrainAdvantageAtLocation()` consumes the generic persistent replacement before existing round adjustments and multipliers.

## Verification

- Persistent-terrain focused regression: `7/7 PASS`.
- Authoring interpreter: `38/38 PASS`.
- Executable card pack: `50/50 PASS`.
- MatchSession: `33/33 PASS`.
- MatchSession gameplay regressions: `11/11 PASS`.
- Directly affected shared aggregate: `132/132 PASS`.
- Explicit focused + shared aggregate: `139/139 PASS`.
- `FD_TOOLCHAIN_OK`.
- typecheck PASS.
- content validate: `11 masters / 19 servants / 20 events / 0 blocking issues`.
- generated determinism PASS with unchanged hashes:
  - content-library `04aeadf82611b118a8d56085d8f0548f5381fdef8e725a85cdaf00b8f35b9a38`
  - fixture `87542f5da07effcf6bba03efd963ae964dde99af4f6c3c63352225e870c96e6c`
  - evidence-report `97ee687b4919b443cc31a16824e1abb854c03b068f18fb6b22136614a43cec73`
- `data/authoring/**` delta from exact Base: EMPTY.
- production Araya / printed-name / legacy-handler identity audit: CLEAN.
- `git diff --check`: PASS.

## Governance

This Candidate grants permanently `+0` migration credit. `P3-B-ARAYA-OWNER-READINESS-EFFECTIVE-WORKSHOP-RESTRICTIONS` remains outside this exact scope and stays `WAIT_CORE_ACCEPTANCE` until this Candidate is fresh-R accepted and FORMAL completes the zero-credit A-sync/rescan.