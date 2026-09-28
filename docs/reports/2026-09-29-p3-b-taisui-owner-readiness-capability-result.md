# P3-B-TAISUI-OWNER-READINESS-CAPABILITY Result

Date: 2026-09-29
Base: `9eed6f832fbc7ec00368e688b43d0020b04f804d`
Branch: `codex/b-p3-taisui-owner-readiness-capability`
Classification: bounded owner-readiness capability, permanently zero-credit
Current strict formal accounting: `144/944`, remaining `800`
Locked Reference: `b2f9fa15fba07c63530bbf4612b03b8b704755f9`

## Owner preflight boundary

The frozen Taisui owner set is exactly sc1 + sc2 + sc3. At exact Base, canonical authoring contains only historical accepted sc1; sc2 and sc3 have no canonical consumer. sc1 is preservation-only and must never receive duplicate formal credit. A future accepted owner-complete formal batch can therefore add at most +2 identities (sc2 + sc3).

Locked Reference was mechanically rechecked directly:
- sc1 `他人格（Alter Ego Class）`: passive, cost 2, base Power 3;
- sc2 `凶神`: Magic, cost 2, base Power 5; marker-follow + normal/reversed combat branches;
- sc3 `太岁头上动土`: Magic/Noble Phantasm, cost 7, requirement 8, base Power 11; Outpost marker placement plus reversed Action midpoint convergence / true-name reveal / Defeat.

The complete currently discoverable owner blocker is one shared location-marker family used by sc2 + sc3. This Candidate closes that family together without consumer authoring.

## Generic readiness implementation

The implementation adds one identity-free exact whole-ability gateway and authoritative persisted marker state:

1. exact marker placement at controller current enabled canonical location from a normal live source;
2. exact opponent-departure follow from the marker location, requiring a live owned active source and trusted movement provenance; repeated/stale events fail closed through event identity plus exact previous-location matching;
3. exact normal combat branch: controller at marker gains +3 terrain advantage for the current round;
4. exact reversed combat branch: controller away from marker transfers up to 1 VP from every other active player at marker, clamped by each target's current VP;
5. exact reversed midpoint branch: graph distance exactly 2 with one unique canonical middle location, coherent controller+marker convergence, true-name reveal, authoritative movement event emission, and ordinary defeatable Defeat application to eligible opponents;
6. defeat-ignore remains semantic: existing current-round battle-loss-ignore, linked-owner loss immunity, and any active semantic `append_only_rule: ignore_battle_loss_effects` provider suppress this Defeat without card/character identity routing;
7. MatchSession restore authenticates marker key/controller/location/provider/source ability/revisions and rejects forged or widened persisted state;
8. marker state persists independently of temporary source activity, while follow/combat/place/midpoint execution requires the correct live source state;
9. loader rejects widened marker key, branch amount, phase, source-state, distance, visibility, conditions or extra-node shapes;
10. production runtime contains no Taisui/card-name/printed-text/legacy-handler/SkillLib routing.

## Behavioral evidence

Focused readiness regression: `10/10 PASS`. It covers exact gateway shapes, place/follow, normal +3 terrain, reversed VP transfer, midpoint movement/reveal/Defeat, existing defeat-ignore preservation, repeated/stale movement provenance, inactive source, owner/controller divergence, default no-provider behavior, persistence/forged-state rejection, and identity audit.

Directly affected serial verification: `10 files / 171 tests PASS`:
- Taisui readiness 10/10;
- movement 3/3;
- game-loop action 2/2;
- MatchSession 33/33;
- authoring-interpreter 38/38;
- executable-card-pack 50/50;
- Suzuka owner formal 6/6;
- Suzuka readiness 8/8;
- Ruler-seal subsystem 13/13;
- Mash owner formal 8/8.

Static gates:
- `FD_TOOLCHAIN_OK`;
- `npm run typecheck` PASS;
- content validate/compile PASS: `7 masters / 12 servants / 20 events / 0 blocking issues`;
- generated determinism PASS with unchanged hashes;
- `data/authoring/**` delta EMPTY;
- production identity audit CLEAN;
- `git diff --check` PASS.

## Accounting / next step

This readiness Candidate grants no migration credit. Strict formal accounting remains `144/944`, remaining `800`.

If fresh independent R returns `IMPLEMENTATION_ACCEPTED_CANDIDATE`, A must synchronize/rescan this exact Candidate and immediately return to the same Taisui owner. Then FORMAL may create one owner-complete archive containing preserved sc1 plus new sc2 + sc3 in one formal Candidate/PR/fresh R/A-sync transaction.

Allowed verdicts:
- `IMPLEMENTATION_ACCEPTED_CANDIDATE`
- `IMPLEMENTATION_NEEDS_REVISION`
