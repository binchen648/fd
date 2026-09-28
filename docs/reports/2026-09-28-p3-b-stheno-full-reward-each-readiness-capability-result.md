# P3-B Stheno Full-Reward-Each Readiness Capability Result

Role: Codex B
Status: `IMPLEMENTATION_READY_FOR_FRESH_R`
Date: 2026-09-28
Task: `P3-B-STHENO-FULL-REWARD-EACH-READINESS-CAPABILITY`
Exact Base: `f2029ede09c7dbe61119836c4c349fce3753d8fb`
Owner root: `servant.stheno`
Classification: bounded zero-credit owner-readiness prerequisite

## Why this readiness task exists

PR #472 accepted the sc3 Divine Core readiness family and the follow-up A-sync mechanically rescanned the entire Stheno owner. That mandatory rescan corrected one earlier pre-review assumption: sc2's separate +1 VP win clause is already expressible, but its reward-distribution replacement is not.

The locked Reference at exact commit `b2f9fa15fba07c63530bbf4612b03b8b704755f9` requires the sc2 passive semantic:

- `operation = replace`
- `rule = combat_reward_distribution`
- `scope.subject = controller`
- `scope.whenControllerWins = true`
- `scope.mode = full_reward_each`

Reference combat settlement applies that switch before winner reward splitting. If the provider's controller is among the winners, every winner receives the full corresponding event/competition/location reward instead of the ordinary per-winner split. The printed clause separately states that reward-reduction abilities still apply.

This is the sole remaining readiness gap discovered by the complete accepted-runtime Stheno rescan. It is not a formal consumer migration and grants zero migration credit.

## Implementation boundary

Generic production support is identity-free:

- `packages/rules/src/ability/combat-reward-distribution.ts` defines the exact whole-ability/RuleModifier gateway and the live provider lookup;
- loader admission permits `replace + combat_reward_distribution` only when the entire passive ability is the exact supported semantic; widened or near-match variants remain unsupported;
- `packages/rules/src/core/combat-resolver.ts` queries the generic provider after authoritative winner determination and before reward division;
- full-reward mode keeps event, competition, and location components distinct, but replaces each component's split with its full pool value;
- ordinary settlement remains byte-for-byte on the prior split route when no eligible provider exists;
- downstream `vpAdjustments` are not bypassed, so existing adjustment/reduction settlement remains effective after the replacement.

The provider lookup is source-state and winner scoped, not identity scoped:

- controller must be an actual battle winner and still active;
- skill/hand passive sources are live unless face-down;
- attack-area sources must be active and face-up;
- source owner/controller binding must remain intact;
- no Stheno ID, card name, printed text, Chinese runtime parsing, or `SkillLib` route is used.

No `data/authoring/**` consumer changes are present.

## Focused verification

`packages/rules/tests/regression/p3-stheno-full-reward-each-readiness-capability.test.ts`: **7/7 PASS**.

Coverage proves:

1. the exact whole-ability shell and the minimal locked-Reference raw passive shape load successfully;
2. wrong operation, rule, subject, controller-win scope, mode, missing modifier identity, widened scope/execution, extra condition/effect, non-passive kind, and nonempty host operations fail closed;
3. two tied winners receive the entire event, competition, and location pools each rather than splitting them;
4. without a live provider, the existing ordinary split remains unchanged;
5. a provider controlled by a losing player does not affect reward distribution;
6. skill/hand source text is suppressed when face-down, and attack-area providers require active face-up state;
7. downstream negative VP adjustment remains effective after the full-reward replacement, and the runtime route is driven by a non-Stheno fixture semantic shape rather than owner identity.

## Directly affected verification

Serial, one worker: **5 files / 138 tests PASS**:

- full-reward-each focused readiness: `7`;
- combat resolver: `10`;
- authoring interpreter: `38`;
- executable card pack: `50`;
- MatchSession: `33`.

Static/content gates:

- `tools/verify-toolchain.cmd`: `FD_TOOLCHAIN_OK`;
- `npm run typecheck`: PASS;
- `npm run content:validate`: PASS — `7 masters / 12 servants / 20 events / 0 blocking issues`;
- `npm run content:compile`: PASS — same summary;
- `npm run verify:generated-content`: PASS with unchanged hashes:
  - content `b2c446488a28c5036ac36557e09b563b54b11018d5396233a53f37ffdbff6923`;
  - fixture `fb69383fd91ab56bc645633eae72df8b8c10131cccd2713fd57afcf950a5f057`;
  - evidence `f4ae33de4dc2832766064bdf46e277d9559398d4d34b45d7d05a0eb76744cd14`;
- `git diff --check`: PASS;
- `data/authoring/**` delta: EMPTY;
- production identity audit on changed runtime files: CLEAN for Stheno IDs/names and `SkillLib`.

## Accounting / continuation

This task is permanently zero-credit. Strict formal accounting remains **`139/944`**, remaining **`805`**.

Fresh independent R must review the exact Candidate generated from this result. `IMPLEMENTATION_ACCEPTED_CANDIDATE` must be followed by A-sync/rescan on the same Stheno owner. Only if that rescan finds no further readiness gap may execution enter one formal owner-complete Stheno migration carrying sc1 + sc2 + sc3 together. No owner advance is permitted before the formal Stheno batch is accepted and synchronized.

Allowed verdicts: `IMPLEMENTATION_ACCEPTED_CANDIDATE` / `IMPLEMENTATION_NEEDS_REVISION`.
