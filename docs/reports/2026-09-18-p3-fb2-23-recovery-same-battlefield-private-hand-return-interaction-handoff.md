# P3-FB2-23 Recovery — Same-Battlefield Private Hand Return Interaction Handoff

Date: 2026-09-18
From: Codex A
To: Codex B2
Status: `READY_FOR_B2_RECOVERY`
Base: exact planning commit created from post-R47 accepted lineage
Credit: zero frozen migration credit

## Goal

Add one identity-free runtime/authoring seam for this exact interaction envelope:

1. phase action in the controller action window, source active;
2. choose exactly one active player located at the same battlefield as the ability controller; do not invent an opponent-only restriction;
3. after the player is selected, privately expose only that selected player's current hand snapshot to the ability controller;
4. controller may select `0..1` card from that snapshot;
5. selecting zero commits no card/deck mutation;
6. selecting one moves exactly that card to its existing owner's deck and deterministically shuffles that owner's deck;
7. unrelated viewers never receive the inspected card instance IDs or definitions through pending-decision/card projection;
8. settlement revalidates source ability, selected player, same-battlefield relation, candidate snapshot, card ownership/zone, interaction revision and continuation identity before mutation.

This is infrastructure only. Do not add the Ryougi card in this task.

## Exact structural contract

Use a structural/identity-free semantic classifier. The authoring representation may introduce only the smallest exact vocabulary required for this envelope, such as an exact same-battlefield player constraint and one exact hand-inspection/optional-return effect. Near-match shapes must fail closed rather than falling through to generic hidden-card targeting.

The implementation should reuse the current PendingDecision continuation, deterministic shuffle, card-zone mutation, projection, serialization/restore, and command transaction behavior wherever possible. Do not duplicate those systems.

A normal first-stage player decision may use the existing pending-decision path. The second-stage hand-card decision must carry explicit interaction metadata (new kind) so candidate identities are a trusted server snapshot and only project to the ability controller.

The viewer card projection must reveal the inspected candidate card definitions only to the active interaction controller while the private decision is pending. The selected hand owner naturally retains visibility of their own hand through existing ownership projection; other viewers must not gain visibility.

## Required adversarial behavior

Tests must prove at least:

- two or more players on different locations: only players at the exact same battlefield are eligible;
- source wording does not imply opponent-only, so controller self-selection is not rejected solely for identity;
- after selecting another player, only the ability controller receives the private candidate snapshot/action;
- an unrelated observer receives neither candidate IDs nor card definitions;
- hand cards belonging to unselected players are not candidates;
- zero-card selection succeeds with no card/deck mutation;
- one-card selection returns only that card to its owner deck and shuffles that owner's deck, not the controller deck;
- deterministic seed/replay/serialize-restore preserves the interaction safely;
- late-added hand cards after snapshot cannot be selected;
- cards that leave the selected player's hand after snapshot cannot be selected;
- wrong controller, duplicate selection, forged continuation/revision/selected-player metadata, wrong owner, wrong zone, or changed same-battlefield relationship fails closed and mutation-free;
- terminal replay cannot apply the interaction twice;
- existing `private_optional_hand_play_v1` remains unchanged;
- no identity/name/text/Reference route exists.

## May touch

Only:

- `packages/rules/src/ability/types.ts`
- `packages/rules/src/ability/interaction-gateway.ts`
- `packages/rules/src/ability/loader.ts`
- `packages/rules/src/ability/interpreter.ts`
- one focused regression test under `packages/rules/tests/regression/`
- one FB2-23 result report

If a correct implementation requires MatchSession source, content authoring, generated product, pack files, executable compiler changes, broad target-expression infrastructure, taxonomy/KPI changes, or another hot file, stop and report `IMPLEMENTATION_BLOCKED` instead of widening scope.

## Forbidden

No production identity/content changes. No Ryougi/Ciel/Bazett/Zouken special case. No new frozen material. No changes to FB2-16 required-additional play, FB2-18 outside-game, FB2-19 support-only registration, or FB2-21 terrain semantics. No PR merge/retarget. No FM09/FM10.

## Required validation

At minimum:

- `npm ci --offline`
- typecheck
- focused new interaction regression + existing private optional interaction regression
- MatchSession serialize/restore coverage without modifying MatchSession source
- full unchanged `npm run test:ci`
- rules core + regression
- client production build
- content validation / compile
- generated determinism
- locked Reference verification
- phase3 coverage / automation audit
- `git diff --check`
- exact scope and identity-routing scan
- final worktree cleanliness

Generated hashes, product material counts and frozen overlap must remain exactly at the post-R47 accepted baseline because FB2-23 changes no content:

- content library `2ffde7a8cf54611332456fe91b812ab6d36d98800f5b8d53f57394d65c05e572`;
- fixture `fb69383fd91ab56bc645633eae72df8b8c10131cccd2713fd57afcf950a5f057`;
- evidence `b1bb8968097534c796cc6ff5775f3a14cfbbd063aa24e6b94f79a7e81d655cc3`;
- material `100 archives / 135 cards / 235 abilities`, compiled `72 / 14 / 0`;
- buckets `22/3/130/0/80/127`;
- audit `130/3/80/20`;
- recovery-line accepted overlap `112/944`;
- integrated-main overlap `111/944`.

## Completion

A clean implementation Candidate must be committed and pushed on a fresh B2 branch/worktree from the exact planning Base, then opened as a stacked PR on the planning branch. It requires fresh independent **R48** before any downstream Ryougi support-definition attempt.

Permitted B2 final status:

- `IMPLEMENTATION_COMPLETE_CANDIDATE`
- `IMPLEMENTATION_BLOCKED`

Do not self-review and do not continue to Ryougi content after Candidate completion.
