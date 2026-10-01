# P3-B Amakusa owner-readiness source-definition Power result

Date: 2026-10-01
Task: `P3-B-AMAKUSA-OWNER-READINESS-SOURCE-DEFINITION-POWER`
Classification: bounded zero-credit readiness follow-up discovered by Amakusa formal materialization preflight
Base: `7b26b374e13f9c33071f31ba0559f3aaa0e7b962`

## Why this follow-up exists

Locked source evidence resolves the Amakusa ascension reference `【开演之时已至，此处应有雷鸣般的喝彩】` to servant skill definition `servant.shakespeare.skill.sc-shakespeare-3`, not an event card. The previously accepted #515 event-placement authority remains unchanged and valid generically, but it cannot represent this frozen consumer without inventing a false event definition.

This Candidate therefore adds only the missing identity-free exact source-definition play authority. It does not materialize Shakespeare sc3, does not modify Amakusa canonical authoring, and grants no migration credit.

## Implemented generic contract

- exact whole-ability gateway: forced `on_card_played` with authoring-supplied `sourceDefinitionId` and exact +4 `while_source_active` effect;
- cross-card trigger admission is allowed only for this accepted whole-ability shape;
- trusted event must identify one face-up physical source owned/controlled by the provider controller whose runtime definition exactly equals `sourceDefinitionId`;
- runtime authority binds provider ascension source + provider ability + exact trigger physical instance + exact source definition + trigger event + round + physical play-count provenance;
- controller-owned/controller-controlled `basic_attack` cards receive exactly +4 while that same physical trigger remains live;
- other definitions, other controllers, and non-basic cards receive no bonus;
- physical source leaving the active area retires authority through normal move/close seams;
- round-end cleanup retires any remaining authority;
- replay in the same round cannot revive stale authority because the bound physical play count must still match;
- restore validation requires the exact provider provenance, processed trigger event, trigger physical/controller/definition, current live state, round, and play count;
- production code contains no Amakusa/Shakespeare/printed-name/legacy-handler identity routing.

## Verification

- full Amakusa readiness focused: `30/30 PASS`
  - source-definition follow-up 6/6
  - ascension/event-power predecessor 7/7
  - member-skill-copy predecessor 7/7
  - linked-role core predecessor 10/10
- shared affected: `121/121 PASS`
  - authoring-interpreter 38/38
  - executable-card-pack 50/50
  - MatchSession 33/33
- explicit focused + shared aggregate: `151/151 PASS`
- `FD_TOOLCHAIN_OK`
- `npm run typecheck`: PASS
- `npm run content:validate`: PASS (`10 masters, 19 servants, 20 events, 0 blocking issues`)
- `npm run verify:generated-content`: PASS; generated hashes unchanged
- `data/authoring/**` delta: EMPTY
- changed-production identity audit for Amakusa/Shakespeare/printed-name/legacy route: CLEAN
- `git diff --check`: PASS

## Accounting / next dependency

Migration credit remains +0. Strict accounting remains `189/944`, remaining `755`.

`P3-S-OWNER-AMAKUSA-COMPLETE-MIGRATION` remains `WAIT_READINESS_FOLLOWUP`. After fresh independent acceptance of this exact Candidate, FORMAL must A-sync/rescan once more before the 5-identity Amakusa owner-complete consumer can resume.