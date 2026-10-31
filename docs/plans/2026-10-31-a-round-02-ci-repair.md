# A-ROUND-02 CI repair

Base dec47680027beb4ee7af2036b293c5d0c96365c1. User authorizes repair; Global Lead remains sole writer. Frozen merged candidate preserved. Initial investigation excluded interpreter/loader writes. After CPU profiling, the same sole owner explicitly grants only staticWhileActiveSkillUseForbidRules early query exclusions; loader and all other interpreter behavior remain excluded. See task profileScopeAddendum.

1. Read natural exit1 main evidence and collect CPU profile of exact seeded eleven-round Session; isolate dominant work before modifying production.
2. Add RED regression proving redundant expensive work without removing required checkpoints or verification. Implement minimum measured change with unchanged runtime legality/authority.
3. Compare deterministic state/logs/history/signed snapshots before/after; verify independent snapshots and rejection of tampering. Run existing focused terminal/authority/session suites.
4. Obtain independent review, run original full CI on final SHA and build/browser when applicable. One PR to main; explicit user approval before merging.

No timeout increases,assertion removal,skip,selection/config changes or blind reruns. If local run cannot reproduce timeout, report measured workload and profiler evidence rather than infer environment failure.
