# P3-A Current-Main FB2-42 Semantic Replay Dispatch

Role: Codex A
Status: `SYNCHRONIZED`
Date: 2026-09-25

## Why this prerequisite is first

The immediately preceding current-main FB2-49 replay stopped as `IMPLEMENTATION_BLOCKED`: exact accepted FB2-49 settlement inherits FB2-42 `card_close` forbid behavior, while current main does not yet contain that accepted capability. Replaying FB2-49 without FB2-42 would weaken the accepted source contract; importing FB2-42 inside FB2-49 would violate reconciliation scope.

Therefore A dispatches FB2-42 separately before returning to FB2-49.

## Exact source authority

- source PR: `#394`
- source Base: `ec39baa2d99c1e9f2359e832ca7bd61118c44558`
- accepted Candidate: `d082a90e194ee4cf1f528086f1ba01150a9ead41`
- prior rejected Candidate: `5fc30e258be7f007e979008d9d46a43a2917098a`
- canonical accepted reviewer evidence: `https://github.com/binchen648/fd/pull/394#issuecomment-5748132070`
- locked Reference: `b2f9fa15fba07c63530bbf4612b03b8b704755f9`

The accepted revision closes the exact reviewer finding that a dead protection source could continue enforcing `card_close`: active-source liveness is centralized through Card Zone source-state core, interpreter liveness and FB2-42 query use the same predicate, and the typed close path proves stale ongoing state no longer protects once its source is dead.

## Current-main replay envelope

Replay only the bounded identity-free capability:

- automatic parent;
- exact `this_round` ongoing modifier;
- `operation=forbid`;
- `rule=card_close`;
- controller `self`;
- exactly one nonempty `has_card_id` selector;
- ordinary live source binding;
- matching controller-owned definition only;
- both server-owned close paths reject before mutation/event while protection is live;
- expired/dead/wrong-controller/wrong-definition/widened forms fail to protect.

No consumer, Darius, authoring migration, product registration, generated content, client production or migration credit is authorized.

## Accounting

Current-main formal accepted overlap remains `111/944`. Current-main material remains `111/944`. This capability is zero-credit infrastructure.

## Next gate

`P3-B-MAIN-REPLAY-FB2-42` is the only implementation task authorized from this dispatch. It must adapt source semantics to current main, pass current-main gates, produce one exact Candidate, then receive one fresh independent R before A capability synchronization. Only after that synchronization may FB2-49 be re-dispatched.