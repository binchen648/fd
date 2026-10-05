# P3-B Caren Owner Readiness Complete Gap Set Result

Date: 2026-10-05
Task: `P3-B-CAREN-OWNER-READINESS-CAPABILITY`
Classification: parent zero-credit owner-readiness capability batch
Exact Base: `19d710705ccaee472a86e07c464ed755c33d9745`
Locked Reference: `b2f9fa15fba07c63530bbf4612b03b8b704755f9`

## Scope and accounting boundary

Current frozen Caren owner scope is exactly five identities:
- `master.caren.skill.ascension`
- `master.caren.skill.s1`
- `master.caren.skill.s1a`
- `master.caren.skill.s2`
- `master.caren.skill.s3`

Canonical `data/authoring/masters/master.caren.json` is absent at Base and remains absent in this readiness Candidate. `data/authoring/**` delta is EMPTY. No prior Caren owner-complete acceptance/A-sync or preservation-only credit is established by current repo evidence. This task is permanently zero migration credit, so strict accounting remains `206/944`, remaining `738`.

Authoritative Caren F1/source evidence is exact source-evidence Candidate `d74bd590ff589b3b8dcaf35192adef6429bfaa5d`, independently accepted by the historical source-evidence chain ending at `9b3fc778245c90d23cc9927d7674411141750699`. Locked Reference is corroboration only; production runtime remains identity-free.

## Complete readiness gap set

The owner preflight closes the four currently discoverable bounded capability families together rather than splitting Caren by skill:

1. Definition-bound skill lifecycle and first-transition triggers. Exact whole-ability shapes can provision/return one owned definition, remove one configured definition on the first authoritative `>1 -> <=1` mana crossing, and consume servant-reveal / accepted Master-Ascension-unlock transitions without duplicate physicals.
2. Same-location eligible opponent VP-gain replacement and actual-mana conversion. Positive eligible VP gain is corrected to `floor(original/2)`; controller mana loss is capped by actual available mana; controller VP gain equals actual mana lost. Resource provenance is structural and malformed/widened sources fail closed.
3. Bound-opponent round authority. One engaged active opponent plus integer penalty `1..5` is bound to authenticated source/controller/round provenance; ordinary movement is blocked and exact round power penalty is applied; authoritative target battle loss removes the source while the already-created round authority remains valid until round cleanup; forged/stale restore state is rejected.
4. Opposing battle-winner VP terminal distribution. A live exact provider can grant `+3 VP` per authoritative opposing winning combat outcome, retaining per-combat multiplicity and excluding controller/loser/nonparticipant/forged or replayed terminals.

Production integration is through exact semantic shape and runtime provenance only. Diff audit finds no `master.caren`, Caren names, or printed-text routing in `packages/rules/src/**`.

## Verification

Focused Caren readiness regression after R1 revision: `12/12 PASS`.

Task-relevant affected scoped aggregate: `199/199 PASS` across 14 files:
- `p3-caren-owner-readiness-complete-gap-set.test.ts`
- `authoring-interpreter.test.ts`
- `executable-card-pack.test.ts`
- `match-session.test.ts`
- `core/movement.test.ts`
- `resource-numeric-room-boundary.test.ts`
- `trigger-resource-runtime.test.ts`
- `p3-master-ascension-unlock-readiness.test.ts`
- `p3-bazett-owner-readiness-complete-gap-set.test.ts`
- `p3-bazett-owner-complete-migration.test.ts`
- `card-action-play.test.ts`
- `card-action-play-source-response.test.ts`
- `fb2-fixed-controller-resource-component.test.ts`
- `card-action-activate.test.ts`

Additional routes touched by the R1 closure are green in an isolated supplemental aggregate: `30/30 PASS` across `core/effect-resolver.test.ts`, `fb2-fixed-controller-set-mana.test.ts`, and `p3-akasha-owner-readiness-capability.test.ts`. The Reviewer-parity Shuten regression is `8/8 PASS`; `resource-numeric-room-boundary` is `1/1 PASS`.

The roster-sensitive `resource-numeric-room-boundary` fixture now derives a deterministic current-roster seed that places `master.gatou` at the asserted seat; gameplay assertions remain unchanged.

Repository gates:
- `FD_TOOLCHAIN_OK`;
- typecheck PASS;
- content validate PASS: `13 masters / 19 servants / 20 events / 0 blocking issues`;
- generated determinism PASS with unchanged generated hashes;
- Phase-3 coverage command PASS: `compiledCards=157`, `compiledCharacters=32`, `blockingIssues=0`;
- Phase-3 automation audit command completed and wrote `.fd-caren-automation-audit.json`;
- `data/authoring/**` delta EMPTY;
- production Caren identity/text routing audit CLEAN;
- `git diff --check` PASS.

A broader package sweep still exposes inherited roster-sensitive/raw-archive fixtures, including fixed seeds that resolve a different historical owner before this new Caren capability can execute and the historical FM02 exact-12 archive assertion. They are not promoted into this owner-readiness Candidate; the sprint policy leaves those unrelated baseline hazards for F5 convergence rather than widening this zero-credit task.

## R1 revision closure

Predecessor Candidate `0132a76e79f2bfedbd5741d3d2400adbae3ae423` received `IMPLEMENTATION_NEEDS_REVISION`. The Reviewer transport failed with explicit GitHub 403, and the Coordinator published the bounded same-attempt relay at `https://github.com/binchen648/fd/pull/524#issuecomment-5989922121`. No second review was manufactured.

R1 P1 was that Caren s1 observed only the event names `mana_spent` / `mana_adjusted`, while the frozen first `>1 -> <=1` crossing is cause-independent. The successor closes the complete mechanically discovered current-runtime decrease surface without identity routing:
- definition-resource settlement now accepts any authenticated typed `resource=mana` transaction with coherent integer `before/after/delta` provenance, so specialized loss events such as lose-all-mana and post-play mana loss are no longer missed by event-name filtering;
- a shared non-payment mana-adjustment notifier now publishes and settles authoritative direct mutations used by legacy `set_mana` and the core negative effect-resolver route;
- the Vessel-cycle direct mana cost now uses the existing paid-mana observer path instead of mutating mana silently;
- already-authoritative payment, linked-role/Bloodlust contribution, direct `adjust_mana`, pair-play, data-flow, and Caren conversion routes continue through their existing typed observers.

New focused regressions prove a specialized typed mana-loss event and the direct `set_mana` route both remove the provisioned definition on the first valid crossing. Exact malformed/wrong-direction/current-state guards remain fail closed, and the one-time crossing marker still prevents a second removal.

The historical `p3-akasha-owner-complete-migration` pack-order assertion remains an inherited current-Base hazard: it expects Akasha to be the final authoring master while the accepted current pack ends in Bazett. This revision changes neither that test nor the pack authoring list; the directly affected Akasha Vessel readiness suite is independently `17/17 PASS`.

## Review gate

This is a zero-credit readiness Candidate. No Caren consumer authoring is permitted to receive formal migration credit from this task. After exact Candidate publication and a fresh independent `IMPLEMENTATION_ACCEPTED_CANDIDATE`, FORMAL must A-sync/rescan all five frozen Caren identities. Only then may one formal owner-complete Caren migration materialize all still-uncredited identities in one Candidate / one PR / one fresh R / one accounting transaction.