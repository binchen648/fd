# P3-A R86 Nero s1 Consumer Migration Dispatch

Role: Codex A
Status: `READY`
Date: 2026-09-20

## Dispatch target

- Frozen identity: `servant.nero.skill.sc-nero-1`
- Owner: `servant.nero`
- Skill: `邀至心荡神驰的黄金剧场`
- Base: exact R85 FB2-41 acceptance sync `e8c58b7d8b4c822f8e658935bfde8b14cf78bdf2`
- Formal migration before Candidate: **`143/944`**, remaining **`801`**
- Locked Reference: `b2f9fa15fba07c63530bbf4612b03b8b704755f9`
- Frozen F1 evidence: `59f145434695d29bdd17e4cb3adc887e84182377`

## Mechanical whole-card re-overlay

A reconstructed the whole card from frozen F1 semantics and current accepted runtime vocabulary, using Locked Reference only for stable static metadata. The normalization is:

- structural `【真名解放】` marker;
- residual winner reward through accepted `after_controller_wins_battle` + active source;
- VP adjustment amount `{ var: "source_card_active_round_count" }` from accepted FB2-40;
- residual no-win close through authoritative `round_end` + exact `{ type: "player_flag_number_not_current_round", key: "combatWinRound" }` from accepted FB2-41;
- existing `close_source_card` semantics;
- existing `while_active / remain_active` lifecycle;
- standard servant skill-zone threshold 8 and Locked Reference static card face: cost 7, power 6, attributes `特殊` + `宝具`.

A temporary whole-card loader probe returned:

- `report=[]`;
- card execution `mode=automatic`;
- all three normalized abilities compiled without a fallback or unsupported path.

A temporary runtime probe on the accepted FB2-41 runtime additionally showed:

- with the source played in round 1 and still active in round 2, an authoritative round-2 controller win grants **2 VP**, records `combatWinRoundByPlayer.p1 = 2`, and keeps the source active at round end;
- with no current-round win, authoritative `round_end` closes the active source;
- the probe required no identity-specific runtime routing and no additional interaction/lifecycle seam.

Therefore the whole card is mechanically zero-gap and is the current singleton **`S_READY_NOW`**.

## Frozen overlap accounting contract

Mechanical Base inventory:

- frozen identities: `944` (`943 static + 1 dynamic`);
- authoring card ids: `161`;
- unique authoring ids: `161`;
- Base frozen overlap: **`138/944`**;
- duplicate frozen ids: `0`.

The S Candidate must add exactly one frozen identity, `servant.nero.skill.sc-nero-1`, making Candidate frozen overlap exactly **`139/944`** with zero removals and zero duplicates. This branch-local overlap is not the formal migration counter.

Formal migration remains **`143/944`**, remaining **`801`**, until a fresh independent R returns `MIGRATION_ACCEPTED` for the exact Candidate and A synchronizes it. Only then formal accounting may advance to **`144/944`**, remaining **`800`**.

## S scope

Authorized S scope is only:

1. one standalone authoring archive for `servant.nero.skill.sc-nero-1`;
2. focused consumer migration tests proving F1/static evidence, loader zero-gap behavior, authoritative winner reward, active-round metric, win-ledger/no-win close behavior, fail-closed provenance, and pack/generated non-registration;
3. one S result report.

Forbidden:

- any production runtime modification;
- any second frozen identity;
- product pack/generated registration;
- generic fallback expansion;
- merge or retarget.

After S validation, commit/push/open one PR and hand the exact new Candidate to a fresh independent R.
