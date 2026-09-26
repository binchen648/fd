# P3-A R79 Kayneth Consumer Migration Dispatch

Role: Codex A
Status: `READY`
Date: 2026-09-20

## Baseline

- Exact Base: `0be87fd9bb48e596845ac7ece9d03f2d8bfd074d`
- Formal migration accepted: `139/944`
- Formal remaining: `805`
- Locked Reference: `b2f9fa15fba07c63530bbf4612b03b8b704755f9`
- F1 evidence commit: `59f145434695d29bdd17e4cb3adc887e84182377`

PR #381 / Ibaraki remains pending independent migration review and is not part of this Base.

## Exact frozen identity

Migrate exactly one identity:

- `master.kayneth.skill.s3`
- legacy skill id: `s3`
- printed text SHA-256: `c3e30045f8b00e75f66735aace73f68594ac59d77c0782de75093dbaee31a294`
- F1 clause SHA-256: `c3e30045f8b00e75f66735aace73f68594ac59d77c0782de75093dbaee31a294`

F1 semantic axes:

- condition: `SOURCE_OWNED`
- lifecycle: `duration:permanent`
- modifier: `rule:deployment_destinations:replace`
- no trigger/effect/interaction/battle expansion

Locked Reference static metadata:

- owner: `master.kayneth`
- name: `倨傲`
- type label: `被动`
- cost: `0`
- basePower: `0`
- attributes: `[]`
- requirement: none

## Accepted semantic contract

Use only the formally accepted FB2-37 structural seam:

- passive ability, empty activation;
- exactly one `source_owned` condition;
- exactly one `deployment_destinations / replace` modifier;
- `scope.subject = controller`;
- destination filter exactly battlefield + one opponent + opponent VP lower than controller;
- modifier lifecycle `permanent`;
- priority `card_text / explicit_exception`;
- conflict policy `explicit_exception_over_general`;
- automatic execution.

A whole-card in-memory probe on exact FB2-37 Candidate returned `report: []`, automatic card/ability mode, exact ability classifier `true`, while preserving the existing legacy product card `master.kayneth.skill.pride` byte-for-byte in memory.

## S implementation scope

Fresh S must:

1. Create isolated standalone `data/authoring/masters/master.kayneth.p3-s3.json` containing canonical `master.kayneth.skill.s3`, following the existing `master.irisviel.fm08.json` split-archive precedent.
2. Leave the registered `data/authoring/masters/master.kayneth.json` byte-for-byte unchanged, including `master.kayneth.skill.pride`; do not rename/delete/replace the legacy product card.
3. Add focused migration tests proving F1/Reference evidence, zero-issue automatic loader compilation, exact FB2-37 classifier semantics, authoritative deployment behavior, fail-close boundaries, and absence from pack/generated product output.
4. Add one S result report.
5. Do not modify runtime production source, generated product, pack registration, or another consumer identity.

## Accounting gate

Exact Base frozen overlap is **`135/944`** with zero duplicate frozen IDs and no canonical Kayneth s3 present.

Candidate must be exactly **`136/944`**, with:

- exact addition: `master.kayneth.skill.s3`
- zero frozen removals
- zero frozen duplicates
- no other frozen additions

Formal project accounting remains **`139/944`** until fresh independent R returns `MIGRATION_ACCEPTED` for the exact S Candidate and A performs acceptance synchronization. Only then may formal accounting advance to 140/944.

## Corrected container constraint

Fresh S regression probing found that `data/packs/fd-playtest-v1/pack.json` already registers `data/authoring/masters/master.kayneth.json`. Appending canonical s3 there changes the freshly compiled playtest definition hash and strong-master product assertions, which violates this migration's no-product-mutation boundary.

Repository precedent `data/authoring/masters/master.irisviel.fm08.json` already isolates canonical full-roster migration material from a registered legacy/product archive for exactly this reason. Therefore the authoritative container instruction is corrected to:

- create isolated `data/authoring/masters/master.kayneth.p3-s3.json` with root id `master.kayneth` and exactly canonical `master.kayneth.skill.s3`;
- leave registered `data/authoring/masters/master.kayneth.json` byte-for-byte unchanged;
- do not register the new standalone archive in the playtest pack/generated product;
- preserve the same exact semantic/evidence/accounting contract: Base overlap `135/944`, Candidate `136/944`, exact +1 only.

This correction changes only migration container placement. FB2-37 capability semantics and formal accounting are unchanged.
