# A-ROUND-02-CI-01 result

Base dec47680027beb4ee7af2036b293c5d0c96365c1. Reviewed candidate53023f2fcee75dbe12ca857064b546209440cacf. PR685. Builder /root; independent reviewer /root/ci_repair_independent.

Main Test41169597645 naturally exit1: eleven-round simulation exceeded unchanged10000ms,1734pass/1fail/1skip. This remains a test failure; no remote environment cause established.

Measured hot path: CPU profile shows staticWhileActiveSkillUseForbidRules764/5991 inclusive samples. Existing implementation repeatedly checks every card source even for non-skill targets and off-board sources. Add two necessary-condition guards already required by acceptedSkillUseForbidApplies/isActiveCardSource. Eligible sources still pass original active/controller/location/selector checks. No cache,other Runtime rule change,checkpoint suppression,signing or restore change.

RED/GREEN deterministic operation-count regression:100 irrelevant deck cards caused200 reads; optimized path retains only the100 existing face-up counter reads. Existing skill-use/endgame/authority80tests and128independent combinations/384live queries PASS. Producer Session/round/skill54tests, typecheck,clientbuild,server18,browser3 PASS.

Paired seeded full-match elapsed6811->5961ms; profiled8766->6917ms. These timings demonstrate reduced workload locally, not proof of failing remote host conditions. State/log/history/replay/all482signed snapshot aggregate SHA256 exactly equal before/after, including signed authority bytes. Full final-head CI still required as the merge gate.

Same-owner exact scope addendum grants only interpreter static query helper; loader excluded. A-ROUND-02 merged frozen/suspended,CB-C02 remains suspended; no overlapping writer. No test timeout/assertion/selection/config/command changes. No migration credit or full-game acceptance. User consent required before PR merge. External original raw profile/RED/GREEN/parity/independent evidence: D:/fd-validation/a-round-02-ci-evidence-20261031.
