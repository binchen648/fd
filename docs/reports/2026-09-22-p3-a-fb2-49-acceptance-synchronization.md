# P3-A FB2-49 Acceptance Synchronization

Role: Codex A
Status: `SYNCHRONIZED`
Date: 2026-09-22

## Exact accepted evidence

- Task: `P3-FB2-49-OPPONENT-CLOSE-TO-ONE-INTERACTION`
- Accepted Candidate: `f0eb754edb7f7840ceb0121e376d88b7fadfd544`
- Fresh R verdict: `IMPLEMENTATION_ACCEPTED_CANDIDATE`
- Canonical verdict: `https://github.com/binchen648/fd/pull/415#issuecomment-5765967083`
- A synchronization branch: `codex/a-p3-r102-fb2-49-acceptance-sync`

R independently confirmed that deleted checkpoint trust cannot be revived, session-less replacement revokes old current/replay trust, multi-room replacement reconciles only after all candidates validate, failed replacement preserves the original room/version/trust, persistence scopes stay isolated, and checkpoint identity is authenticated by both MAC and digest.

## Accepted capability boundary

Acceptance covers only the identity-free exact-shape compound transaction `opponent_close_non_residual_to_one` and the server-owned authority required to persist and replay its forced per-opponent keep-one interaction safely.

It does not accept or expose:

- generic `choose_each_player_cards` authoring;
- generic `close_matching_cards_except_selected` or arbitrary mass close;
- generic multi-player target selection;
- Astolfo identity/name/text routing;
- Astolfo consumer authoring;
- inherited Gate A/B/C or whole-card acceptance.

## Accounting

FB2-49 is zero-credit capability infrastructure:

- formal migrated: `151/944`;
- formal remaining: `793`;
- branch-local frozen authoring overlap: `146/944`;
- duplicate frozen identities: `0`;
- `servant.astolfo.skill.sc-astolfo-1` authored count: `0`.

No runtime, authoring, pack, generated content, client, server, or test file is changed by this A synchronization commit relative to the accepted Candidate.

## Next gate

Freshly reconstruct the complete `servant.astolfo.skill.sc-astolfo-1` against this synchronized runtime. The probe must verify source/printed metadata, final skill-zone requirement, ordinary play/cost/lifecycle behavior, combat timing, true-name reveal, source ownership, battlefield condition, exact FB2-49 compound shape, positive execution, canonical negatives, malformed fail-closed behavior, replay/persistence boundaries, and absence of legacy or identity fallback.

Only a mechanically zero-gap whole-card probe may authorize a singleton S migration. This synchronization itself does not authorize S, a new B2 seam, migration credit, Gate promotion, Phase PASS, Release Ready, merge, or retarget.
