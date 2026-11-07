# RC-04 Inferno and terrain batch

Implementation candidate, independent acceptance pending. terrain-migration.json records exact SHA256 of the frozen B terrain-state helper. No B Interpreter/Session wholesale copy and no Medusa import. Stable slots are a shared consumer dependency, not new roster credit.

Typed Inferno activation anchors source battlefield and installs next-round status via existing status subsystem. StartsAtRound and expiry are honored. Deployment hook excludes source and compares bid with map printed bonus. Session permits zero payment without terrain and battlefield entry when all terrain is occupied; rejects invalid/over-max/insufficient-VP bid before mutation; assigns only allowed empty slots by highest actual value. Movement releases original slots without compacting; save/restore validates slot version, identities and lengths.

Evidence: terrain-red.json (original protocol witnesses), terrain-green-attempt1.json, terrain-final.json. Final 17 PASS /0 FAIL: temporal start/end, source exemption, [3,1] payment1, full field, zeroVP, malformed bids, restore, holes and pure movement. Typecheck rerun after scoped typing correction. No old assertion changed, skipped or disabled. Snapshot legacy indexes remain explicitly unverified history; no reconstruction of lost historical position.
