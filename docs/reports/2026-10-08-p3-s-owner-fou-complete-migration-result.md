# P3-S Fou Owner-Complete Migration Result

Date: 2026-10-08
Task: `P3-S-OWNER-FOU-COMPLETE-MIGRATION`
Branch: `codex/s-p3-owner-fou-complete-migration`
Exact Base: `058dc4dfc436b8f222da073ff2d8bd9db91481c3`
Locked Reference: `b2f9fa15fba07c63530bbf4612b03b8b704755f9`
Accepted readiness Candidate: `76489aaed00dcd76d092bf18098511e3c7ff0fc1`
Accepted readiness evidence: `https://github.com/binchen648/fd/pull/547#issuecomment-6044972979`
Classification: formal owner-complete consumer migration for `master.fou`

## Frozen scope / accounting boundary

Frozen owner scope is exactly two identities:

- `master.fou.skill.s1` — 兽之印记
- `master.fou.skill.ascension` — 苍天之力

Before this Candidate, canonical Fou consumer materialization was exactly `0/2`.
Strict accounting remains `259/944`, remaining `685`, until one fresh exact `MIGRATION_ACCEPTED` review plus FORMAL A-sync/accounting.
Maximum lawful later increment is exactly `+2`, yielding `261/944`, remaining `683`.

## Canonical consumer materialization

`data/authoring/masters/master.fou.json` now materializes exact `2/2`:

- owner initial mana: `4`;
- `s1` / 兽之印记:
  - passive/forced round-end authority;
  - requires a real same-round Command-Seal expenditure;
  - requires one physical controller-owned skill that returned to the skill zone this round;
  - applies game-duration `+1 Power` and `-1 effective mana cost`;
  - cost floor remains `ceil(printed cost * 0.5)`;
  - repeated qualifying rounds may stack lawfully;
  - restore provenance remains fail-closed;
- `ascension` / 苍天之力:
  - `initialPlacement=outside_game`;
  - once-per-game imminent-elimination rescue;
  - exact post-settlement opponent VP swap;
  - self rescue creates no swap/link;
  - persistent shared-victory linkage survives later elimination;
  - stale/no-longer-threatened and changed-ledger pending choices fail closed.

Fou is registered exactly once in `data/packs/fd-playtest-v1/pack.json`.

The canonical development source image exists at:
`E:\Codex\FD\Fate_Domination-开发版\images\masters\芙芙.png`.

## Accepted identity-free capability consumption

The consumer uses only the accepted readiness authority from PR #547. Production runtime remains free of `master.fou`, 芙芙, 兽之印记, 苍天之力 and `core.fou-` routing.

The formal consumer regression verifies `s1` through the real:
`round_end -> interpreter forced trigger -> pending target -> choose_target -> accepted permanent tuning`
path, not by directly invoking the tuning helper.

The generic master-ascension unlock subsystem remains the outside-game provisioning authority for `masterId.skill.ascension`; its focused regression is `5/5 PASS`.

## Consumer-exposed generic closures

Materializing Fou exposed two generic paths that readiness helper-level tests did not exercise:

1. **Permanent-tuning pending-target continuation**
   - the first round-end trigger correctly staged a target decision;
   - after `choose_target`, generic continuation previously fell through to extended-effect execution and treated `permanent_returned_skill_tuning` as unknown;
   - accepted permanent returned-skill tuning is now included in the identity-free pending-decision resume gate and returns to `executeAbility`;
   - canonical Fou `s1` now executes end to end through the interpreter.

2. **Full-match human response auto-run**
   - adding Fou as the 23rd Master changes deterministic character pairings for some seeds;
   - one existing three-round auto-run now surfaced a human response window while round priority belonged to another player;
   - `runFullMatch` previously returned `human_input` before attempting the authenticated human's legal response action;
   - the auto-run helper now dispatches an available human legal action first and only pauses when no auto action exists and priority belongs elsewhere;
   - normal interactive MatchSession dispatch semantics are unchanged.

## Deterministic fixture recertification

Adding the 23rd canonical Master changes the seeded pairing surface. Two shared MatchSession regression fixtures were mechanically recertified without changing their asserted contracts:

- durable terrain/elimination restore fixture: old seed `20207105` -> seed `1`, preserving `match_complete`, active-player terrain authority and successful `restoreMatchSession`;
- reusable generic Command-Spell fixture: old seed `20260906` -> seed `2`, yielding Bazett with exact legal abilities:
  `command-spell.free-move`, `command-spell.gain-mana`, `command-spell.power-victory`, and preserving reuse after one Seal spend.

Only those two fixture seeds changed; production behavior was not altered for seed recertification.

## Canonical pack / generated content

Canonical compilation now succeeds at:

- `23 masters / 19 servants / 20 events / 0 blocking issues`;
- Fou pack registration count exactly `1`;
- generated content contains `master.fou`, `master.fou.skill.s1`, and `master.fou.skill.ascension`.

Generated determinism:

- content: `fdd2cc458e12a3dd3346c8253362a081a18b67652d19cd1f3c78a60b6aa09be6`
- fixture: `87542f5da07effcf6bba03efd963ae964dde99af4f6c3c63352225e870c96e6c`
- evidence: `75cc147b8816004e26640cae5234b38282dd5a5eff011035cab7ff821b11cd2b`

## Verification

Primary / affected validation:

- Fou owner-complete migration: `4/4 PASS`;
- Fou accepted readiness: `6/6 PASS`;
- core scoring: `6/6 PASS`;
- fixed-controller Command-Seal: `4/4 PASS`;
- Ruler Seal subsystem: `13/13 PASS`;
- Spartacus seal-power readiness: `20/20 PASS`;
- authoring interpreter: `38/38 PASS`;
- portable SHA/HMAC: `7/7 PASS`;
- MatchSession: `34/34 PASS`, including the three-round event smoke at about `2.687 s` under the unchanged/default `5000 ms` timeout;
- affected subtotal above: `132/132 PASS`;
- MatchSession gameplay regressions: `11/11 PASS`;
- focused three-round complex-skills MatchSession regression: PASS;
- master ascension unlock readiness: `5/5 PASS`.

Other gates:

- `npm run typecheck`: PASS;
- `npm run content:validate`: PASS — `23 masters / 19 servants / 20 events / 0 blocking issues`;
- `npm run verify:generated-content`: PASS with hashes above;
- external-output Phase-3 coverage:
  - `archives=127`, `cards=289`, `abilities=505`;
  - `compiledCards=226`, `compiledCharacters=42`, `blockingIssues=0`;
  - `newRuntimeSemanticRouted=22`, `legacyExecuteAbility=3`, `legacyResolveEffect=164`, `dualRuntime=0`, `pilotAllowlist=0`, `notClassifiable=316`, `taxonomyWarnings=328`;
- external-output automation audit:
  - `legacyResolveEffect=164`, `legacyExecuteAbility=3`, `notClassifiable=316`, `promotionFindings=20`;
- `git diff --check`: PASS.

Repository-wide `test:source-assets` still reproduces exactly `93` historical `chm-extract/图包` missing-image blockers. No Fou source path appears in that missing set, and the declared Fou development image was separately verified present. The 93 shared historical blockers are not counted green.

## Review gate

This formal migration is implementation-complete but uncredited.
Freeze one Candidate from exact Base `058dc4dfc436b8f222da073ff2d8bd9db91481c3`, push one PR, and request one fresh independent exact Base/Candidate migration review.

Only `MIGRATION_ACCEPTED` followed by FORMAL A-sync/accounting may credit exactly the two newly materialized Fou identities:
`259/944 -> 261/944`, remaining `683`.
