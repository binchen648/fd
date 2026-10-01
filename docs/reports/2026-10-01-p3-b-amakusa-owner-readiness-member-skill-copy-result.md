# P3-B Amakusa Owner Readiness — Member Skill Copy Result

## Boundary

- Parent: `P3-B-AMAKUSA-OWNER-READINESS-CAPABILITY`.
- Bounded subtask: `P3-B-AMAKUSA-OWNER-READINESS-MEMBER-SKILL-COPY`.
- Exact Base: `a0c5d9ddfb7e8d9266ef0d56ee874f9e283ca501` (accepted linked-role-core A-sync).
- Strict accounting: `189/944`, remaining `755`.
- Permanently zero migration credit; `data/authoring/**` delta EMPTY.

## Frozen source recertification

Frozen `master.amakusa.skill.s1a` / `绝罚` source text is:

> 行动阶段：将一名【神仆】已展示的从者技能的临时复制加入你的技能区直至回合结束。他本回合无法使用你使用了其复制的原技能牌且其不再为【神仆】。

The implementation preserves that exact dependency order: selecting a revealed linked member skill creates a temporary leader-owned physical copy; the original physical skill is not locked and membership is not removed merely by copying it. Those consequences occur only when the leader actually uses the temporary copy.

## Identity-free implementation

`linked-role-member-skill-copy-capability.ts` adds one exact whole-ability privileged contract:

- Action / `controller_action_window` only;
- exactly one currently active linked member's revealed `servant_skill` physical card in that member's skill zone;
- current-servant ownership and revealed-servant state are checked server-side;
- a temporary physical card with the same compiled definition is created in the leader's skill zone, owner/controller bound to the leader and source-bound to the exact provider;
- using the temporary copy records a current-round lock on the exact original physical skill card, removes the original owner from active linked-member status through the accepted linked-role core, and preserves permanent ever-member history;
- both direct ability activation and physical card play routes commit the copied-use consequence transactionally;
- original skill play/activation is rejected while the exact current-round lock is live;
- round-end removes temporary copies and expires original-use locks;
- restore validation rejects forged copy/original/provider provenance, stale round state, used-copy state with surviving active membership, orphan locks, or missing accepted providers.

Production implementation contains no `master.amakusa`, Amakusa printed names, `absolute-punishment`, or `core.amakusa-*` identity routing.

## Verification

- new member-skill-copy focused regression: **6/6 PASS**.
- accepted linked-role-core regression: **10/10 PASS**.
- focused Amakusa readiness aggregate: **16/16 PASS**.
- shared affected regression: authoring interpreter **38/38**, executable pack **50/50**, MatchSession **33/33** = **121/121 PASS**.
- total explicitly rerun tests: **137/137 PASS**.
- `FD_TOOLCHAIN_OK`.
- typecheck PASS.
- content validate PASS: `10 masters / 19 servants / 20 events / 0 blocking issues`.
- generated determinism PASS with unchanged hashes:
  - content-library `cde732266c8ca18995ddacb54a4fd1f273379c4ea2497fdf672218949edd0e3b`
  - fixture `87542f5da07effcf6bba03efd963ae964dde99af4f6c3c63352225e870c96e6c`
  - evidence-report `d49a5ca87cf614cbba8140b1890225a51548c11479551577033f37615407c7a2`
- `data/authoring/**` delta EMPTY.
- changed-production Amakusa identity audit CLEAN.
- `git diff --check` PASS.

## Disposition

`IMPLEMENTATION_COMPLETE_CANDIDATE` for the bounded member-skill-copy readiness layer only. No migration credit is granted. Parent Amakusa readiness remains open, and `P3-B-AMAKUSA-OWNER-READINESS-ASCENSION-EVENT-POWER` remains mandatory after exact acceptance + FORMAL A-sync of this Candidate. Formal Amakusa consumer migration remains forbidden until all readiness families are accepted and the full-owner readiness A-sync/rescan is complete.
## Reviewer revision closure

PR #514 first fresh review returned `IMPLEMENTATION_NEEDS_REVISION` on exact Candidate `e2bbc51470165776a799bf0d2bc4c7bf037854b4` with one P1 restore-provenance finding.

Successor closure adds exact original servant-skill provenance validation shared by live copied-use commit and restore validation:

- original physical `controllerPlayerId` must still equal the recorded original owner;
- original definition must still be `servant_skill`;
- original definition owner must still equal that player's current `servantCardId`.

Focused negative coverage now explicitly rejects forged controller, non-servant definition substitution and current-servant owner drift.

Post-fix verification:

- member-skill-copy + predecessor linked-role-core: **17/17 PASS**;
- authoring-interpreter + executable-card-pack + MatchSession: **121/121 PASS**;
- `npm run typecheck`: PASS;
- content validate: `10 masters / 19 servants / 20 events / 0 blocking issues`;
- generated determinism: PASS with unchanged hashes;
- `data/authoring/**` delta EMPTY;
- changed-production Amakusa identity audit CLEAN;
- `git diff --check`: PASS.

This remains bounded zero-credit readiness. Parent Amakusa readiness is still open and ASCENSION-EVENT-POWER remains mandatory after exact acceptance + FORMAL A-sync.
