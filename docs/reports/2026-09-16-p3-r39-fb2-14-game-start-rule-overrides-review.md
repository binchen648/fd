# P3-R39 FB2-14 Game-Start Rule Overrides — Independent Review

Date: 2026-09-16
Owner: Codex R
Verdict: `GATE_A_B_CANDIDATE_ACCEPTED`
B2 candidate: `86afe51311ff2b6cd05ea403044e8e226b0cde7d`
A handoff / review base: `50602c9355794c9c0c7fe4d79b75f7936d912c17`
F1 evidence: `59f145434695d29bdd17e4cb3adc887e84182377`
F1 reviewed S candidate: `fefc34550cf2f71797e724d7170803f9c24e6221`
Locked Reference: `b2f9fa15fba07c63530bbf4612b03b8b704755f9`
Pre-FB2-14 accepted canonical overlap: `101/944`

## Verdict

R39 independently accepts the exact FB2-14 runtime candidate. No blocking finding remains.

This acceptance is runtime-only. It does **not** advance accepted canonical authoring overlap beyond `101/944`; FM08 remains a separate A-sync + migration + reviewer gate.

## Independent candidate / scope audit

Reviewer worktree was created directly from exact candidate SHA `86afe51311ff2b6cd05ea403044e8e226b0cde7d`, not from the implementer working tree.

Diff from the exact A handoff base is:

- `16` files;
- `764` insertions / `84` deletions;
- runtime/schema/compiler/interpreter changes, one focused regression suite, and the B2 result report only;
- authoring diff under `data/authoring`: `0` files;
- exact future FM08 production runtime identity/name scan: `0` hits;
- `git diff --check`: PASS.

No arbitrary string player-flag bag, card/ability-id router, character-name router, or printed-text parser was added. Leonardo/Ophelia/Wodime semantics are not implemented or migrated by FB2-14.

## Independent exact classifier audit

R39 inspected the production classifier rather than relying on the B2 report.

A matching route requires:

- `kind=forced_trigger`;
- automatic execution;
- activation containing only `trigger=game_start`;
- no conditions, targets, costs, creates, rule modifiers, lifecycle, limits, or visibility metadata;
- response metadata limited to the loader-normalized empty defaults `order=turn_order` and `passBehavior=decline_this_window`;
- one or more distinct effects;
- every effect must be an exact whitelisted `install_rule_override` for `player=controller` with exact keys and exact literals.

The exact accepted schemas are the eleven A-frozen structures:

1. first-logical-day total-Power `-2`;
2. non-climax Situation mana grant cap `1`;
3. own Action/Combat movement lock;
4. regular/climax round total positive-mana gain cap `2/4`;
5. lower-VP battle-participant total-Power `-2`;
6. Situation Noble Phantasm forbid -> controller master-skill physical-card Power final lock `0`;
7. command-spell phase replacement to Advance;
8. viewer-scoped opponent-discard visibility;
9. extra regular attack-play allowance at authoritative mana `>=11`;
10. viewer-scoped face-down event visibility;
11. Situation-origin Noble Phantasm play-forbid exemption.

Wrong literal, wrong player, extra effect keys, duplicate logical rule, foreign response metadata, or unsupported parent structure fails closed.

The response-window normalization accommodation is narrow: it accepts only the two defaults inserted by the loader for a raw empty response window; it does not broaden response semantics.

## Independent consumer / state audit

R39 traced every typed state consumer.

- `RuleOverrideState` is explicit typed authoritative state, serialized/restored through ordinary `GameState`; there is no second persistence path.
- `game_start` uses the existing trusted event dispatcher and existing `processedEvents` idempotency.
- Combat total-Power adjustments are read generically from typed state.
- Master-skill Power lock is evaluated before additive/set card modifiers, so the Situation-conditioned `0` is final.
- Command-spell timing replaces the normal Action phase with Advance instead of adding a second window.
- Extra attack allowance is prospective and reads current authoritative mana.
- Situation Noble Phantasm exemption filters only Situation-origin forbids; event-origin forbids remain active.
- Own Action/Combat movement lock blocks normal movement and ordinary card-effect destination candidates. The existing semantic `ignore enter_or_leave_current_battlefield` route remains an explicit structural bypass; the core movement API also exposes a trusted non-authoring bypass parameter for already-authorized effect movement.
- Hidden event placement IDs are removed from ordinary client projection while the public aggregate count is preserved.
- Authorized opponent-discard projection includes only opponent discard IDs and does not broaden hand/deck/private-zone visibility.

## Independent positive-mana authority audit

R39 traced the positive-mana write paths changed by FB2-14. Generic typed `adjust_mana`, legacy interpreter positive adjustment, effect-stack `gain_mana`, Situation rewards, standalone Situation engine rewards, and Magic Workshop/deployment rewards now converge on `grantMana`.

Ordering is deterministic:

1. validate nonnegative safe integer request;
2. apply the non-climax Situation per-grant cap only for Situation source;
3. apply remaining regular/climax round budget;
4. apply existing storage cap / gain block;
5. record only the actually applied positive amount in the round ledger.

Payments, losses, and direct set-mana semantics do not consume positive-gain budget. Ledger round mismatch resets deterministically, and normal round transition also resets the ledger. Existing default storage cap remains `12` unless the established runtime mana-cap authority provides a different value.

No production caller currently uses `bypassRoundGainCap`; it is not authoring-exposed and does not create a route around the accepted FM08 contract.

## Independent F1 / future FM08 reconciliation

R39 did not reuse the A/B2 ten-ID list as its denominator. It parsed the frozen F1 candidate inventory directly from commit `fefc34550cf2f71797e724d7170803f9c24e6221` and selected rows whose frozen Reference handler is `core.game-start-rule-flags`.

Result:

- handler-linked F1 identities: `17`;
- block-free `READY_GENERIC_EXTENSION` rows: `12`;
- blocked/special rows: `5` (`Peperoncino s1`, Shirou Emiya s3, Don Quixote SC2, Lancelot SC2, Merlin SC1);
- among the twelve block-free rows, Leonardo s1a is event-card mana/VP reward modification and requires the independently missing event reward consumer;
- Ophelia s1a is ability-use-limit replacement whose meaningful consumer is a separate not-yet-canonical dependent skill;
- therefore the self-contained executable future FM08 subset is exactly `10` rows.

Independently reproduced future FM08 set:

- `master.bazett.skill.s1b`;
- `master.caules.skill.s1a`;
- `master.fiore.skill.s2`;
- `master.fiore.skill.s3`;
- `master.fiore.skill.s4`;
- `master.irisviel.skill.s1`;
- `master.peperoncino.skill.s1a`;
- `master.sieg.skill.s1`;
- `master.waver.skill.s1`;
- `master.zouken.skill.s5`.

This independently matches the A-frozen future FM08 membership; there is no hidden eleventh row that FB2-14 makes migration-ready.

## Independent dynamic validation

R39 used a fresh reviewer worktree and a fresh offline dependency install.

- `npm.cmd ci --offline --ignore-scripts`: PASS, `0 vulnerabilities`.
- `npm.cmd run typecheck`: PASS.
- focused/high-risk set: `5 files / 60 tests PASS`.
- FB2-14 focused suite within that set: `9/9 PASS`.
- rules regression + core: `66 files / 394 tests PASS`.
- `npm.cmd run content:validate`: `7 masters / 7 servants / 20 events / 0 blocking issues`.
- generated-content determinism: PASS with unchanged hashes:
  - content `8da51a30935845670dcd88928089730ff4a7a39d9b53b8c8c794189d95509840`;
  - fixture `fb69383fd91ab56bc645633eae72df8b8c10131cccd2713fd57afcf950a5f057`;
  - evidence `b1bb8968097534c796cc6ff5775f3a14cfbbd063aa24e6b94f79a7e81d655cc3`.
- standard `npm.cmd run test:ci`: `120 files / 736 tests PASS`.
- fresh `npm.cmd run phase3:coverage`:
  - archives `90`;
  - cards `123`;
  - abilities `222`;
  - `newRuntimeSemanticRouted=22`;
  - `legacyExecuteAbility=3`;
  - `legacyResolveEffect=127`;
  - `dualRuntime=0`;
  - `notClassifiable=70`;
  - `taxonomyWarnings=124`;
  - compiled definition hash `37551fd5f5b0a968f9143dee0698adf8582a0a26d8edabef55907cf78d374333`;
  - blocking issues `0`.
- fresh automation audit retains authoritative legacy counters `127 / 3 / 70`.

The fresh reviewer coverage/audit commands regenerate local artifacts. Their material KPI values remain at the R38 baseline; regenerated artifact drift is intentionally excluded from the R39 review commit.

## Acceptance consequence

FB2-14 is accepted at Gate A/B candidate level. A may now perform a fresh synchronization from the exact accepted runtime candidate + R39 review and, only after that synchronization formally marks FM08 `READY`, S may migrate the independently reproduced exact ten identities.

Accepted canonical authoring overlap remains `101/944` until FM08 itself passes independent migration review; runtime acceptance alone does not earn `111/944` credit.
