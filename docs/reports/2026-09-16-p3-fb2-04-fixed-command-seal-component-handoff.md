# P3-FB2-04 Fixed Controller Command-Seal Component Handoff

Date: 2026-09-16
Role: A
Status: READY

## Baselines

- Runtime/A-sync baseline: `0842bd83a1d7f86ea59fe8e92e948521dba73713`.
- F1 final source evidence: `59f145434695d29bdd17e4cb3adc887e84182377`.
- Request: `runtime-capability-6220d123d8e1` / `GENERIC_RESOURCE_NUMERIC`.
- Reference remains read-only at `b2f9fa15fba07c63530bbf4612b03b8b704755f9`.

## Why this is the next wave-1 slice

F1 final contains 125 Resource Numeric identities. FB2-03 aligned 59 identities whose source semantics are fixed controller Mana/VP gain/loss. The largest remaining simple literal Resource Numeric sibling that can reuse an already existing typed primitive is command-seal adjustment. A fresh scan found 10 `adjust_command_seals` effects across 9 identities. Seven effects across six identities are fixed controller literal changes; three sibling shapes require target/special semantics and are not part of this handoff.

The existing Resolution Data-flow `adjust_command_seals` primitive already owns mutation, typed event emission, and underflow rejection. FB2-04 must therefore add/reuse only an identity-free semantic component and must not duplicate the primitive.

## Frozen component membership

| F1 identity | Source effect |
| --- | --- |
| `master.rin.skill.s2` | controller -1 |
| `master.shinji.skill.s3` | controller -1 |
| `master.shinji.skill.s4` | controller +3 and +2 |
| `master.sieg.skill.ascension` | controller +1 |
| `master.sieg.skill.s1a` | controller -1 |
| `servant.davinci.skill.sc-davinci-8` | controller +1 (implicit controller in F1 overlay) |

This table is component membership, not migration eligibility. Parent route acceptance remains mandatory.

## Explicit exclusions

- `master.amakusa.skill.ascension`: amount 2 loss against `all_opponents`; requires non-controller targeting semantics.
- `master.bazett.skill.s4`: `restore_all`; not a fixed signed delta.
- `master.zouken.skill.ascension`: -1 against `opponents_same_battlefield`; requires target/condition semantics.
- `master.amakusa.skill.s3` command-seal payment belongs Cost Payment, not this adjustment component.

## Runtime contract

A matching authoring effect is exactly `adjust_command_seals`, controller-owned, fixed non-zero safe-integer signed amount, with an optional non-empty string `directive`. No broader parent route is granted by the component. Existing accepted parent classifiers should reuse it where their own timing/trigger/condition gates already apply.

The optional directive is required for compatibility with existing accepted content such as `spend_command_spell` and the battle-loss command-seal directive; it is metadata, not permission to parse text or route by identity.

## Required validation

1. Identity-free component classifier and sibling rejection.
2. Reuse in Resource Numeric direct action and B13 battle-loss resource trigger.
3. Positive and negative typed command-seal delta evidence.
4. Underflow rejection is atomic.
5. Matching component under unsupported parent shape remains unroutable.
6. Full typecheck/regression/determinism/CI and static identity audit.

## Non-goals

No broad Resource Numeric gateway, command-seal payment, restore-all, target selection, all-opponent adjustment, same-battlefield-opponent adjustment, Trigger Gateway, migration, Reference handler copying, MatchSession changes, or KPI changes.
