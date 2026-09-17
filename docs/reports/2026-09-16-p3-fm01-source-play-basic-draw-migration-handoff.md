# P3-FM01 Source-Play / Basic-Attack Draw Migration Handoff — 2026-09-16

Role: Codex S
Status: READY
F1 evidence: `59f145434695d29bdd17e4cb3adc887e84182377`
Runtime acceptance: FB2-08 candidate `ea6a1522f6382ef617ae26fbca7d208e999f204f`, R25 `33f0a0e1b3e9c4c62c8eb713ae45cd7117c7a0a7`
Dependencies: TO13 private optional hand-play + FB2-06 typed controller draw + FB2-08 exact source-play/basic-attack trigger

## Exact batch

Migrate exactly these 14 F1 identities and no sibling by similarity:

- `servant.boudica.skill.sc-boudica-3`
- `servant.constantine.skill.sc-constantine-1`
- `servant.drake.skill.sc-drake-1`
- `servant.hephaistion.skill.sc-hephaistion-3`
- `servant.iskandar.skill.sc-iskandar-1`
- `servant.ivan.skill.sc-ivan-3`
- `servant.mandricardo.skill.sc-mandricardo-3`
- `servant.martha.skill.sc-martha-3`
- `servant.medb.skill.sc-medb-1`
- `servant.medusa.skill.sc-medusa-1`
- `servant.odysseus.skill.sc-odysseus-3`
- `servant.roberts.skill.sc-roberts-3`
- `servant.teach.skill.sc-teach-3`
- `servant.ushiwakamaru.skill.sc-ushiwakamaru-3`


## Frozen canonical shape

Each selected F1 row has `blockedBy=[]`, required capabilities exactly `CARD_ACTION_PLAY + GENERIC_CARD_ZONE`, and the same source-grounded two-clause behavior:

1. When this source is played face up in the same batch as one face-up basic attack controlled by the same player, draw exactly 1 card for the controller.
2. During the controller action phase while the source is active, privately choose 0–3 controller-hand cards whose base power is at most 3 and play the chosen cards using normal play/payment semantics.

The source overlay currently stores those clauses as one mixed normalization record. S must normalize them into canonical accepted authoring abilities without adding card-specific runtime routing or changing their source-grounded printed semantics.

Drake is the already-authored representative; use its canonical semantic structure as the accepted-shape reference, but preserve each target card's own identity, metadata, source references, printed text, and existing unrelated content.

## S ownership

May modify only:

- the 14 selected `data/authoring/` servant files/records required for the migration;
- focused content/authoring compilation tests or fixtures for this exact batch;
- `docs/reports/2026-09-16-p3-fm01-source-play-basic-draw-migration.md`.

Must not modify:

- `packages/rules/src/**`, MatchSession, server/client/app runtime;
- Phase-3 coverage/taxonomy classifiers or generated coverage artifacts;
- F1 frozen evidence artifacts;
- unrelated servant/master authoring;
- Okita or other near-match families.

## Required proof

- exact membership 14/14, skipped=0 unless a source-preservation conflict is discovered;
- source/printed-clause preservation for every migrated row;
- canonical trigger and private optional play shapes compile through existing contracts;
- no identity-specific shared runtime routing;
- focused authoring/content tests;
- `npm.cmd run typecheck`;
- `npm.cmd run content:validate`;
- `npm.cmd run verify:generated-content`;
- relevant runtime regression compatibility;
- `git diff --check`;
- no runtime hot-file changes.

S final status is `MIGRATION_CANDIDATE` only. After S commits, Codex A performs fresh before/after burn-down synchronization; independent R26 reviews the resulting migration lineage from a fresh worktree.
