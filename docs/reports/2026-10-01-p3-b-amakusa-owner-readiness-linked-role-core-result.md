# P3-B Amakusa Owner Readiness — Linked-Role Core Result

## Boundary

- Parent: `P3-B-AMAKUSA-OWNER-READINESS-CAPABILITY`.
- Bounded subtask: `P3-B-AMAKUSA-OWNER-READINESS-LINKED-ROLE-CORE`.
- Exact Base: `e00f0d6b7b9d7c9db987bb7e1e510a6bc1d8d930` (accepted Alice owner A-sync/accounting).
- Strict accounting: `189/944`, remaining `755`.
- Permanently zero migration credit; `data/authoring/**` delta EMPTY.

## Frozen source recertification

The complete Amakusa owner scope was rescanned together. This bounded Candidate closes only the common linked-role family spanning s1/s2/s3:

- `master.amakusa.skill.s1` 教则 — game start makes the controller the leader and the next-seat player the initial member.
- `master.amakusa.skill.s2` 红队领袖 — Action recruitment spends `1 + active member count` Command Seals, may choose only a player who has never been a member and had fewer seals before payment, and applies membership at the next round start.
- `master.amakusa.skill.s3` 神仆 — before climax, ordinary entry into the leader's battlefield costs one Command Seal; once per round while leader/member are in different battlefields, exactly one leader mana may contribute to the member's positive payment; if they win different battlefields in the same authoritative battle terminal, each gains 1 VP.

Two independent owner gaps remain explicitly out of scope:

- s1a 绝罚: temporary copy of a revealed servant skill, original-skill round lock and member-status removal after copied use.
- ascension 过去的裁定者: unlock-time opponent Command-Seal loss plus exact named-event basic-card +4 Power authority.

## Identity-free implementation

`linked-role-core-capability.ts` provides exact whole-ability gateways for:

- `linked_role_initialize`
- `linked_role_schedule_member`
- `linked_role_apply_scheduled_members`
- `linked_role_member_rules`
- `linked_role_battle_reward`

Runtime state is source/ability/relationship/round bound and restore validation rejects forged or orphan relationship state. Entry Command-Seal cost is integrated into ordinary movement and deployment commit authority. Mana contribution uses the existing explicit contribution transport while remaining distinct from Bloodlust physical-card contribution provenance. Battle reward is driven by the authoritative terminal battle outcomes and composes with existing VP-gain modifiers.

Production implementation contains no `master.amakusa`, Amakusa printed names, fixture identity, or `core.amakusa-*` routing.

## Verification

- focused synthetic linked-role regression: **10/10 PASS**.
- affected/shared aggregate: **169/169 PASS** across movement, resolution dataflow, Akiha contribution provenance, game-start provisioning, authoring interpreter, executable pack, MatchSession and MatchSession regressions.
- `FD_TOOLCHAIN_OK`.
- typecheck PASS.
- content validate PASS: `10 masters / 19 servants / 20 events / 0 blocking issues`.
- generated determinism PASS, hashes unchanged from accepted Alice formal content:
  - content-library `cde732266c8ca18995ddacb54a4fd1f273379c4ea2497fdf672218949edd0e3b`
  - fixture `87542f5da07effcf6bba03efd963ae964dde99af4f6c3c63352225e870c96e6c`
  - evidence-report `d49a5ca87cf614cbba8140b1890225a51548c11479551577033f37615407c7a2`
- `data/authoring/**` delta EMPTY.
- production identity audit CLEAN.
- `git diff --check` PASS.

## Disposition

`IMPLEMENTATION_COMPLETE_CANDIDATE` for the bounded linked-role core foundation only. Parent Amakusa readiness remains blocked on the two explicitly registered follow-up subtasks. Accounting remains `189/944`, remaining `755`.
