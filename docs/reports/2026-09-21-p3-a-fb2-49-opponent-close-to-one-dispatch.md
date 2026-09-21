# P3-A FB2-49 Opponent Close-To-One Interaction Dispatch

Role: Codex A
Status: `DISPATCHED`
Date: 2026-09-21

## Exact baseline

- Exact R101 Spartacus s2 migration acceptance-sync: `b208ac5571c29f28b623f6462438649d9b151b54`
- Accepted Spartacus Candidate: `58fffb751e25a9ccc2f28470a48255a07ba11493`
- Canonical Reviewer evidence: `https://github.com/binchen648/fd/pull/414#issuecomment-5754190524`
- Formal migration accepted: **`151/944`**
- Formal remaining: **`793`**
- Current material frozen authoring overlap: **`146/944`**, duplicates `0`
- Locked Reference: `b2f9fa15fba07c63530bbf4612b03b8b704755f9`

## Scheduler proof: no S-ready singleton exists after Spartacus

The prior fresh scheduler proof before FB2-48 established a defensible `S_READY_NOW=0` queue and selected `servant.spartacus.skill.sc-spartacus-2` as the nearest whole-card closure target. FB2-48 admitted only the exact frozen-opponent-power reward seam needed by Spartacus. The subsequently accepted Spartacus S Candidate added no production runtime capability at all; it added only the standalone consumer archive, focused migration test/result report, plus one A-authorized stale accounting assertion removal in the historical Nobunaga test.

Therefore accepting Spartacus cannot unlock a second runtime consumer. A fresh current-baseline scan also excluded the apparent material-only `servant.ibaraki.skill.sc-ibaraki-1`: PR #381 Candidate `78ab99ce3136f654e53ec922466c26d4751b1917` already received independent `MIGRATION_ACCEPTED`, and formal accounting was historically reconciled through Ibaraki sync `51f8af150f10a249ba471aaa65d7d7b49cabc98e`. It must not be migrated or credited again merely because that parallel historical material is absent from the current authoring lineage.

The lowest-complexity remaining uncredited whole cards were freshly compared against current accepted runtime contracts. Darius s3 still depends on a formal `sc-darius-4` support definition; Ciel s1b needs thresholded opponent-VP acquisition plus support-card return/provisioning; Andersen s2 alters base-special identity and defeat immunity; Atalanta s2 needs selected-attack cloning/activation. The first bounded one-seam closure target is Astolfo s1.

Thus the current ready queue remains **zero** and a narrow B2 seam is authorized.

## Intended closure target: Astolfo s1

Frozen identity: `servant.astolfo.skill.sc-astolfo-1` (`唤起恐慌之魔笛`), owner `servant.astolfo` / `阿斯托尔福`, class Rider.

Accepted F1/source-evidence lineage:

- S source candidate: `b014cada5ae30c489ca384094681cf313aa71c82`
- A source audit: `b258039cc5da519cecee2129a658dd95bdb5524c`
- independent source R: `222a8ea0e2d73d64a1138b3326df20c767f37b01` — `ACCEPTED`
- frozen clause source ability: `panic-flute-close-to-one`
- frozen clause SHA-256: `693e886ed5695721ec10dce30d64b978e45407eba1b81de3c7c5401f8bcb4e67`
- frozen text: `【真名解放】\n战斗阶段：与你交战的对手关闭其非残留的牌直至只剩一张为止。`

Locked Reference independently confirms Rider owner metadata, legacy id `sc_astolfo_1`, card name `唤起恐慌之魔笛`, `宝具`, cost `4`, basePower `1`, requirement `8`, and exact printed text.

Reference semantic shape is one combat `phase_action` with true-name reveal, exact conditions `source_owned` + `at_battlefield`, followed by a per-opponent card-retention interaction: for every same-battlefield opponent with at least two qualifying cards, that opponent keeps exactly one and all other qualifying cards close.

All surrounding whole-card capabilities are already present on the synchronized runtime:

- ordinary servant-skill play and printed cost payment;
- `skill_zone_mana_at_least: 8`;
- combat `phase_action`;
- exact `source_owned` condition;
- exact `at_battlefield` condition;
- servant-package true-name reveal on use declaration;
- card active/face/residual metadata and ordinary card close mutation primitives.

The missing capability is only the atomic multi-opponent decision/close transaction below. Current production loader/runtime contains **no** `choose_each_player_cards`, `close_matching_cards_except_selected`, `minCandidateCount`, or `keptInstanceIds` execution path. Generic same-battlefield expressions elsewhere do not implement this transaction.

## Exact FB2-49 capability contract

Implement one identity-free compound ability effect, tentatively named `opponent_close_non_residual_to_one`, admitted only inside this exact whole-ability envelope:

- `kind: phase_action`;
- activation exactly combat phase;
- visibility absent/empty or exact servant-package true-name reveal `{ revealsTrueName:true, revealTiming:"on_use_declared", revealScope:"servant_package" }` as required by the consumer;
- conditions exactly ordered `source_owned`, `at_battlefield`;
- targets/cost/creates/ruleModifiers/lifecycle/responseWindow/limit empty;
- exactly one compound effect and automatic execution.

At resolution, using authoritative current server state:

1. controller must still be at an enabled battlefield and own the source under the accepted source-owned contract;
2. determine opponents located at the same battlefield in stable turn/seat order; do not include controller, remote players, eliminated/non-participating identities, or any player absent from server state;
3. for each such opponent, freeze only that opponent's qualifying attack-area cards: controlled by that opponent, currently active, face up, and **non-residual**; cards not satisfying every predicate are untouched;
4. opponents with fewer than two qualifying cards require no decision and no mutation;
5. each opponent with at least two qualifying cards receives a server-owned, non-cancellable, exactly-one private decision over only their own frozen qualifying instance ids; decisions serialize deterministically, never overwrite another pending decision, and only the decision player may answer;
6. selected id means “keep this one”; upon valid resolution, close every other still-valid card from that opponent's frozen qualifying set. The selected card remains active/open;
7. stale/forged decision metadata, duplicate/empty/multiple selection, outsider card, controller mismatch, ownership/control drift, zone/active/face/residual drift, or source/battlefield drift must fail closed atomically without partial card mutation;
8. once an opponent's decision resolves, continue to the next frozen eligible opponent. When the queue empties, the compound transaction is complete;
9. exact replay / duplicate command must not close additional cards or restage completed decisions.

The B2 implementation may use existing generic pending-decision/card-state primitives internally, but **must not expose** generic authoring support for Reference vocabulary `choose_each_player_cards`, `close_matching_cards_except_selected`, arbitrary each-player card selectors, arbitrary card-close lists, or generic candidate filters. Reserve/reject those historical spellings so near-miss authoring fails closed.

## Scope and prohibitions

B2 may change only the minimum rules-engine files needed for this identity-free compound contract, focused FB2-49 tests, and one B2 result report. A dedicated helper/classifier file is preferred over widening generic interpreter vocabulary.

Do not:

- author or route Astolfo by identity/name/text;
- add `servant.astolfo.skill.sc-astolfo-1` under `data/authoring/**`;
- add generic `choose_each_player_cards` or `close_matching_cards_except_selected` authoring support;
- add arbitrary opponent/card filtering, generic multi-player decisions, or generic mass-close APIs;
- alter residual classification globally;
- change product packs/generated outputs/client production;
- merge or retarget;
- take migration credit.

## Required B2 evidence

At minimum prove:

- exact raw + compiled whole-ability classifier acceptance and near-miss/historical generic rejection;
- zero/one qualifying card = no decision/no mutation;
- one eligible opponent chooses exactly one and all other qualifying cards close;
- multiple eligible opponents serialize in stable order with decision ownership/privacy;
- residual, inactive, face-down, wrong-zone, wrong-controller and remote-player cards are excluded and remain untouched;
- forged/stale/duplicate/empty/multiple/outsider selection and state/provenance drift fail closed mutation-free;
- queue completion/idempotence and no decision overwrite;
- typecheck, focused compatibility, official CI, content validation, generated determinism, exact Locked Reference verify, client build, Phase 3 coverage/audit as applicable, `git diff --check`, exact scope and final cleanliness.

FB2-49 is zero-credit infrastructure. Formal migration remains **`151/944`**, with **`793`** remaining. After exact fresh independent R acceptance and A synchronization, run the full remaining-set current-baseline overlay required by `docs/reports/2026-09-21-p3-throughput-scheduler-rebase.md`. `servant.astolfo.skill.sc-astolfo-1` remains an intended FB2-49 consumer and must be re-probed, but it is not an automatic singleton dispatch: include it in the largest honest zero-gap S batch supported by the overlay, or record its residual blocker if it is still not zero-gap.
