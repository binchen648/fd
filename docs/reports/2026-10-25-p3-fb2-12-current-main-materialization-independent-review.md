# P3-FB2-12 current-main runtime materialization independent review

Verdict: **MIGRATION_ACCEPTED** for exact Base `a1e3c970893446d39ec8a1d9e991008d69683f52` and final materialized Candidate `3450cebf2683d1f140f117d98dc0cd3888660edd`.

This is a fresh current-main review, not inherited acceptance of historical FB2-12 Candidate `4c97449de07b1e7a859d8ef43b60e34069541830`. Separate Base and Reviewer worktrees were used. The first attempted materialization `175c3476` was not accepted: it imported unrelated FB2-10 Magic Resistance helpers/route and accepted string `'0'` as a modifier value. The final Candidate removes that drift and retains only FB2-12 interpreter, loader, types, combat-resolver, game schema, and focused test changes plus A's revised materialization report. The combat-resolver/types/schema blobs match the historical accepted FB2-12 source exactly; the focused test adds one string-limit negative, and interpreter/loader changes are reconciled onto the current Base without losing the FB2-11 standalone `game.round_number` loader/evaluator guard or FB2-02 deployment behavior. No FM03/FM04/FM06 authoring, generated content, coverage, taxonomy, or unrelated runtime route was added.

The route accepts the identity-free optional combat response after authoritative battle Power calculation only for a participant with strict second-highest Power in a battle of at least three participants. It freezes participant IDs and effective Powers under the battle/result identity, opens the post-Power response before BattleResult/scoring, and stages defeat of every highest-Power opponent only when the controller accepts. Decline preserves the original result and does not consume the per-round use. Settlement checks that the frozen snapshot has not changed; Basic Luck defeat-ignore is applied per target; remaining defeated targets are excluded before the ordinary winner, military and VP scoring builder runs. Battle-local staged markers are consumed and cannot leak into later battles. The semantic classifier rejects malformed condition/effect/window/limit shapes, including `limit.uses = '1'` (strict numeric 1), before the legacy route. No FB2-10 Magic Resistance classifier, handler, or numeric-`'0'` coercion exists in this delta.

Independent validation after `npm ci` in both worktrees:

| Check | Result |
| --- | --- |
| Typecheck | pass in Base and Candidate |
| FB2-02 deployment, FB2-11 round metric, FB2-12 Presence focused | 9 + 7 + 10 = 26/26 pass |
| Direct semantic negative | numeric `limit.uses=1` accepted; string `'1'` rejected |
| Generated-content determinism | pass; unchanged content `8da51a30935845670dcd88928089730ff4a7a39d9b53b8c8c794189d95509840`, fixture `fb69383fd91ab56bc645633eae72df8b8c10131cccd2713fd57afcf950a5f057`, evidence `b1bb8968097534c796cc6ff5775f3a14cfbbd063aa24e6b94f79a7e81d655cc3` |
| `git diff Base..Candidate --check` | pass |
| Full root CI, sequential exact Base then final Candidate | Base 117 files / 713 tests pass; Candidate 118 files / 723 tests pass; both zero failures |

This verdict accepts only the scoped FB2-12 dependency materialization. It is not FM06 authoring acceptance, A-sync, merge, or migration credit.
