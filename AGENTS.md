# FD execution instructions

## Product A: mandatory test scheduling

Every Product A task must read `docs/plans/fd-tiered-skill-acceptance.md` before implementation and declare its L1 set, applicable L2 combinations, and L3 trigger (or why none).

- New cards do not require a complete match per card. L1 real MatchSession skill tests are the daily requirement: activation, target legality, actual settled effects, costs/resources where applicable, authoritative state/client projection, and atomic rejection.
- Use L2 only for relevant interactions, multistep choices, lifecycle, suspension/resume, repeated submissions, and changed source/target state. Advance only the necessary phases.
- Use L3 at a key integration/release milestone or for a demonstrated system-level risk. Reuse the A-MATCH-03 seven-player 11-round baseline. Complete related L1/L2 repairs and independent review first; run L3 once on the frozen integrated code candidate. Repeat only if a new relevant code change, failure, or unresolved risk justifies it.
- L3 cannot replace card semantics tests; L1/L2 cannot be reported as L3 PASS. Bind evidence to exact candidates. Keep mandatory CI unchanged, preserve failures, and never disable tests or relax timeouts to obtain PASS.
- Implementers report candidate status; independent acceptance and user merge approval remain separate. Preserve existing worktrees and obey shared-file reservations.

Authority: user instructions of 2026-11-05 and explicit reaffirmation on 2026-11-08. Applies to every subsequent Product A execution.
