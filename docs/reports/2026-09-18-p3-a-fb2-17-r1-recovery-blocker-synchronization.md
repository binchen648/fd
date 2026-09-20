# P3-A FB2-17-R1 Recovery Blocker Synchronization

Date: 2026-09-18
Role: Codex A
Status: `BLOCKER_SYNCHRONIZED`
Credit: zero frozen-migration credit

## Exact lineage

- Fresh post-R43 A synchronization: `79c4f65ba8d3d9f50785ce290f9f755a19794c26`.
- Fresh FB2-17-R1 blocker: `7e0356146766486180bcd959ee4e90dcfe193be5`.
- Fresh R43-accepted FB2-18 candidate: `cb81559033db6b96b1f26cf7d9bd15686db5d4fb`.
- Integrated current-main baseline remains `553779e8ffcc926ae4763ee86a2ea937e090c128`.

Historical FB2-19/R44 work is planning evidence only and is not acceptance provenance for this recovery lineage.

## Fresh blocker synchronized

The fresh R1 retry independently proves that FB2-18 closed the original initial-placement blocker: the target support card can now be loaded and compiled with exact `initialPlacement: "outside_game"` and no executable `initialZone`.

The remaining blocker is the pack/executable registration envelope. The only current master-authoring registration path, `authoringMasterFiles`, necessarily treats a support-only archive as a full playable master package.

Fresh probe evidence on the exact current lineage shows:

- target support card authoring count: exactly `1`;
- all other eleven frozen FM09 provisioning targets remain `0/11`;
- playable masters `7 -> 8`;
- executable cards `70 -> 72`;
- a new executable `master.shirou-emiya` character is created;
- fallback `master.shirou-emiya.command-spell` is synthesized;
- the support archive occupies archive index 7 and shifts the first servant archive to index 8;
- focused structural gate is `51 PASS / 9 FAIL`, while FB2-18 itself remains `9/9 PASS`;
- deterministic generation legitimately changes only content-library and evidence-report; fixture remains unchanged.

This is not a card-semantic failure and must not be normalized by changing roster counts or archive-index tests.

## Dispatch decision

The narrowest legal next dependency is a generic, identity-free **master support-only / rules-only authoring registration seam**.

P3-FB2-19-RECOVERY may add one optional manifest channel and exact support-archive discriminator so master-owned support definitions can enter `authoringArchives` / `rules.archives` and executable card registration without entering the playable/presentation master roster and without executable character/fallback-command-spell generation.

It must not add any production identity, production pack entry, Shirou special case, card-name/text routing, Reference handler, runtime behavior, arbitrary support ownership, or frozen migration.

FB2-19 is zero-credit infrastructure work. Accepted overlap remains `111/944`, leaving `833/944`. FB2-17-R2 must wait for FB2-19 candidate + fresh independent R44 + post-review A synchronization. P3-FM09 remains `MIGRATION_BLOCKED`; no FM10 or Ciel task is authorized.
