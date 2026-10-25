# P3-FB2-11 current-main independent review

Verdict: **MIGRATION_ACCEPTED** for exact Base `1d0500390081620e94cd21d56ac83b4eafc51057` and Candidate `cdeb73b86486acc848c5c912976816a32a9a5704`.

The review used separate exact-Base and Candidate worktrees. Candidate changes only the formula loader/evaluator, the FB2-11 regression, and its Builder receipt. It binds the single trusted read-only metric `game.round_number` to `state.round.roundNumber`; no authoring/F1, FM03/FM04, identity or printed-text route, new operator, or arbitrary state traversal is accepted.

The accepted metric AST is exactly `{ var: 'game.round_number' }`. Controlled `add`/`multiply` formulas can compose that leaf, giving Territory values 14, 8, 2, and 0 at rounds 1, 4, 7, and 8. The server metric is read before caller-supplied variables, so a supplied value cannot spoof the authoritative round. Existing Drake movement-distance and FB2-02 resource behavior remains compatible. Subtraction and free-form string expressions remain unsupported.

Independent adversarial probes covered `{ name: 'game.round_number' }`, `op: var` with that name, name-plus-add, var/name-plus-formula, mixed `var: controller.availableMana` plus round name, var-plus-subtract, and var-plus-extra-key. Every malformed shape produced a loader unsupported report and was rejected by both direct `evaluateFormula` and `calculateCardPower`. The canonical leaf produced no loader report and evaluated to the authoritative round. This closes two earlier Candidate fail-open families: operator/formula early-return execution and `n.var ?? n.name` alias masking. The exact guard now precedes formula, formulaRef, variable, and operator dispatch.

Independent checks after `npm ci` in both worktrees:

| Check | Result |
| --- | --- |
| Typecheck | pass in Base and Candidate |
| FB2-11 + FB2-02 focused | 2 files, 14/14 pass |
| Rules regression | 49 files, 294/294 pass |
| Generated-content determinism | pass; unchanged content `8da51a30935845670dcd88928089730ff4a7a39d9b53b8c8c794189d95509840`, fixture `fb69383fd91ab56bc645633eae72df8b8c10131cccd2713fd57afcf950a5f057`, evidence `b1bb8968097534c796cc6ff5775f3a14cfbbd063aa24e6b94f79a7e81d655cc3` |
| Runtime identity/text and scope audit | no new identity/printed-text route; no authoring or FM03/FM04 files changed |
| `git diff Base..Candidate --check` | pass |
| Full root CI, sequential Base then final Candidate | Base 237 suites / 700 tests pass; Candidate 239 suites / 707 tests pass; both zero failures |

No A-sync, migration credit, or successor promotion was performed by this Reviewer.
