# P3 Builder — Zouken s2 `五百年的活尸`

## Scope and lineage

This isolated Builder branch starts from accepted s3 Candidate `d655a727c3f07c36e5e5d11beca689bfae1e1618` and does not modify Candidate PR #654, A-sync PR #655, or any other accepted owner. No Candidate, PR, A-sync, or credit was created by this Builder.

## Canonical provenance

- Source text: `E:/Codex/FD/Fate_Domination-开发版/data_masters.js`, locator `line=19#record=m_zouken.s2`, development-file SHA-256 `C596AF5730846EF9092375F18C4200B84F032028DC2E8F5483377D8DDCC22825`.
- Normalized printed text SHA-256: `8b8f4b24424a8600807fd42c0965fad94bd6f9dcdc9917efe10f1bff8b17f3e3`.
- Development card image: `E:/Codex/FD/Fate_Domination-开发版/images/masters/间桐脏砚.png`, SHA-256 `4E4F3F5607D7B39BC16F4ACB01831976E4036F38EBC180514C4E6BC28F75C6B9`.
- Legacy snapshot candidate: `master/master.zouken/s2`, SHA-256 `BFF4C268CA3F292E3F32FD2A3B51C7520E3D8C475C703BDB854A43B48318BF2A`.

The active archive retains the exact source clause and binds it to `legacy-content.json#masters[14].skills[1].text#line=1`. The old cross-repository runtime remains provenance-only; no old runtime was copied as semantic authorization.

## Strict target-runtime contract

`master.zouken.skill.s2` is an exact automatic `game_start` provisioning ability. Its only targets, in fixed order, are canonical `master.zouken.skill.s3` and `master.zouken.skill.s4`. The compiler and runtime both require:

- source card is the same owner’s automatic `master_skill` and is in that owner’s skill zone;
- target IDs are exactly s3 then s4, with the same `ownerId`, automatic mode, master-skill type, and canonical accepted ability ID sets;
- targets are deferred from initial placement, then created as owner/controller-owned, face-up inactive skill cards in the owner’s skill zone with `generatedBy` bound to the s2 source;
- duplicate valid material is retained, invalid retained material or cross-owner material fails closed, and repeated/replayed `game_start` does not create duplicates;
- restore validates the resulting card ownership, source provenance, card zone/visibility and replay envelope through the existing MatchSession restore contract.
- the s2 runtime source definition must remain `mode=automatic`; retained/generated target cards must carry the exact generating source instance marker (for example, `p1-master.zouken.skill.s2`), and a forged marker or host-adjudicated source is rejected before any provisioning mutation.

## R1 reviewer repair

R1 closes the runtime provenance gaps identified by independent review: source-specific retained-card validation now requires the exact s2 source instance in `generatedBy`, and runtime provisioning rejects a mutated non-automatic source definition even when its compiled shape was previously valid. Regression coverage exercises both forged retained provenance and hostile runtime source mode.

The generic provisioning primitive remains available for its existing FB2 contracts; the s2 path adds source-specific shape and canonical target checks at executable-pack compilation and runtime preflight.

## Verification

- s2 focused regression: `5/5 PASS`.
- s2 + s1/s3/s4/ascension + generic provisioning regressions: `41/41 PASS`.
- MatchSession: `30/30 PASS`.
- `content:validate`: PASS, `8 masters, 7 servants, 20 events, 0 blocking issues`.
- `verify:generated-content`: PASS.
- `typecheck`: PASS.
- `git diff --check`: PASS.

## Boundary

This is an unreviewed Builder commit only. s2 is not yet Candidate-accepted, synchronized, or credited. Independent GPT-6 Sol review is required before any Candidate/A-sync/accounting action.
