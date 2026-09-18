# P3-A FB2-27 Ruler Seal Subsystem Dispatch

Role: Codex A
Status: `SYNCHRONIZED`
Date: 2026-09-19

## Baseline

- Exact recovery-line Base: `2772ac9904c2e99c19cb73f7b60147a329fb27a4`
- Formal accepted overlap: `121/944` (`12.82%`)
- Remaining frozen identities: `823`
- F1 evidence: `59f145434695d29bdd17e4cb3adc887e84182377`
- Locked Reference: `b2f9fa15fba07c63530bbf4612b03b8b704755f9`
- Integrated `origin/main`: `553779e8ffcc926ae4763ee86a2ea937e090c128` / mechanically `111/944`

This is a zero-credit A capability dispatch. It does not migrate any frozen identity and does not merge or retarget any stacked PR.

## Throughput readiness result

A recomputed the remaining frozen set from the authoritative F1 Git blob and the exact accepted Base tree:

- accepted overlap: `121/944`;
- remaining: `823`;
- remaining `READY_GENERIC_EXTENSION`: `191` across `185` exact semantic-axis/required-capability signatures;
- the only exact generic signature larger than two is the unresolved game-start provisioning family (`6` remaining), whose target dependencies are not closed as one homogeneous migration batch;
- no direct accepted-family extension of `10+` exact homogeneous identities exists at this Base.

The largest Reference-handler groups were then reviewed only as non-authoritative aggregation evidence. Wodime (`11`) and Wallachia/TATARI (`9`) are true multi-mechanic special subsystems with substantially broader state, event, movement, and lifecycle surfaces. `core.game-start-rule-flags` is not one semantic family despite a shared Reference handler label.

The selected next capability is the narrower Ruler seal subsystem because it can close one coherent relationship/state boundary and then unlock one exact six-card family without mixing unrelated mechanics.

## Exact downstream family unlocked by this capability

No card below is authorized for migration in this B2 task. They are only the exact frozen consumers whose dependency this capability is intended to close:

1. `servant.amakusa.skill.sc-amakusa-3`
2. `servant.amor.skill.sc-amor-1`
3. `servant.jeanne.skill.sc-jeanne-1`
4. `servant.morgan.skill.sc-morgan-3`
5. `servant.oberon.skill.sc-oberon-3`
6. `servant.oberon.skill.sc-oberon-4`

The first five have byte-identical printed Ruler class text in F1. The sixth is the Ruler command-seal definition belonging to the same subsystem. These six remain unaccepted at dispatch.

## Capability request

Implement one identity-free, source-text-independent **Ruler seal relationship subsystem** sufficient to express the exact accepted semantic envelope below.

### Ruler binding relationship

A Ruler source may, during its authorized action-phase ability and subject to its per-game use limit:

- choose exactly two other active players;
- candidates must be among the currently least-bound players according to game-long Ruler binding history;
- grant one Ruler seal relationship from the source controller to each selected player;
- track issuer and bound player independently of card identity/name/text;
- preserve game-long binding-count history even after a granted seal is later spent;
- only the issuer may use that issuer's Ruler seal against the bound player.

### Ruler seal use

During the issuer's action phase, an unspent issuer→bound-player Ruler seal may resolve exactly one of the supported branches:

1. move the bound player to one of the two exact rule-defined destinations represented structurally by the ability data;
2. prevent the bound player from moving until round end;
3. allow/require the bound player to perform one free hand-card play opportunity, then bind a delayed reward so that if that player wins the relevant battle the issuer gains `2` VP.

A given Ruler seal instance is single-use. Resolution/replay must be idempotent and must not double-consume a seal, repeat a forced/free play, or duplicate the delayed VP reward.

### Structural safety

The runtime route must be selected only by exact structural authoring data introduced for this subsystem. It must not branch on:

- canonical card ID;
- owner/master/servant ID;
- card/skill name;
- printed text or Chinese text fragments;
- Reference handler ID;
- F1 commit/hash.

The five parent Ruler cards also carry a no-copy/no-steal rule. If current production has no copy/steal execution surface, B2 must still encode this as an explicit structural rule marker or fail closed; it may not silently drop the clause or add unrelated copy/steal machinery.

## Scope / role boundary

Owner: Codex B2.

B2 may touch only the minimum generic runtime/compiler/type/test files required for this capability, plus one FB2-27 result report. Expected hot files may include:

- `packages/rules/src/ability/types.ts`
- `packages/rules/src/ability/loader.ts`
- `packages/rules/src/ability/interpreter.ts`
- narrowly required core/runtime state helpers
- focused tests under `packages/rules/tests/**`

B2 must not modify:

- `data/authoring/**`
- `data/packs/**`
- `data/generated/**`
- apps
- F1/taxonomy/KPI data
- historical FM09 status
- unrelated runtime families
- Reference checkout

One PR has one role. This is B2 runtime capability work only and earns **zero frozen migration credit**.

## Required tests / acceptance evidence

At minimum, fresh implementation evidence must prove:

- exact structural recognition and near-match fail-closed behavior;
- two-player selection from least-bound eligible players;
- issuer/bound-player relationship ownership;
- game-long historical binding counts;
- single-use seal consumption;
- move branch with structural destinations;
- round-scoped no-move branch and expiry;
- free-play branch without ordinary mana cost, with delayed issuer `+2 VP` only on the qualifying win;
- same event/command replay idempotency;
- unauthorized player cannot spend another issuer's seal;
- malformed relation/action data rejects without partial mutation;
- no identity/name/text/Reference-handler routing;
- no production authoring/product drift;
- official typecheck, focused tests, full CI, rules suite, client build, Reference verify, coverage/audit, `git diff --check`, and final cleanliness.

## Frozen accounting

Dispatch accounting remains:

**`121/944` accepted, `823` remaining.**

FB2-27 itself is zero-credit. If FB2-27 is independently accepted and A-synchronized, a later separate S task may attempt exactly the six Ruler-family identities listed above. No `127/944` claim is allowed until that separate S Candidate receives fresh `MIGRATION_ACCEPTED` and later A synchronization.

Historical P3-FM09 remains `MIGRATION_BLOCKED`. No FM10 is dispatched.
