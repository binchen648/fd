# P3-B Caules Yggdmillennia staged-declaration privacy readiness result

Date: 2026-10-05
Task: `P3-B-CAULES-YGGDMILLENNIA-OWNER-READINESS-STAGED-DECLARATION-PRIVACY`
Owner: FORMAL readiness follow-up

## Boundary

Exact Base is zero-credit readiness A-sync `4a0270b19db4bd60049bbaddd08f65bf120ba05d`.

This follow-up is permanently zero migration credit. Strict accounting remains `211/944`, remaining `733`. `data/authoring/**` remains unchanged and no Caules Yggdmillennia consumer identity is materialized.

The accepted parent readiness Candidate is `baeb8610c409f2e0bffecf1735be5b8286696757` on PR #526 with canonical same-attempt evidence `https://github.com/binchen648/fd/pull/526#issuecomment-5992238581`.

## Rescan gap reproduced

The A-sync/full-owner rescan confirmed a second client projection surface outside MatchSession shared telemetry:

- declaration-capable `stage_attack_card` actions carry `declaredAttribute`;
- staged choices are stored in `modeState.stagedAttacks`;
- `projectAbilityState(...)` previously cloned staged entries verbatim for a non-owner whenever the staging player already had a qualifying public `attack_area` card;
- therefore a secret repeat declaration could be observed before the authoritative combat reveal.

## Implementation

`projectAbilityState(...)` now keeps the existing staged-action visibility boundary and card/action shape, but strips only the optional `declaredAttribute` field from non-owner staged entries. The staging owner receives the full entry unchanged.

The change is identity-free: no Caules/card-name/printed-text/locked-Reference identity routing is added to production runtime.

Focused regression uses the real `dispatchAbilityCommand(...)` staging path: it stages an ordinary attack, stages the declaration-capable skill with a secret attribute while another public attack-area card makes the staged set visible, then verifies that the owner projection retains the attribute and the opponent projection retains the staged action but not the attribute. Existing post-reveal card projection coverage remains unchanged and green.

## Verification

- focused Caules readiness regression: `12/12 PASS`;
- MatchSession regression: `34/34 PASS`;
- authoring interpreter regression: `38/38 PASS`;
- task-relevant affected aggregate: `194/194 PASS` across 13 files;
- `npm run typecheck`: PASS;
- `npm run content:validate`: PASS — `14 masters / 19 servants / 20 events / 0 blocking issues`;
- `npm run verify:generated-content`: PASS;
- `data/authoring/**` delta from Exact Base: EMPTY;
- production runtime diff contains no Caules/Yggdmillennia identity routing;
- `git diff --check`: PASS.

## Gate

No migration credit is granted. Freeze one exact Candidate and request one fresh independent review. On `IMPLEMENTATION_ACCEPTED_CANDIDATE`, FORMAL must perform another zero-credit A-sync/full-owner rescan. Only if that rescan exposes no remaining owner-local readiness blocker may `P3-S-OWNER-CAULES-YGGDMILLENNIA-COMPLETE-MIGRATION` return to `READY`.
