# P3-A R88 Darius s2 Consumer Migration Dispatch

Role: Codex A
Status: `DISPATCHED`
Date: 2026-09-20

## Formal baseline

- Exact FB2-42 acceptance-sync Base: `6b0ae42dc48b42171a3895ee3ee40d95f743d2d2`
- Formal migration accepted: `144/944`
- Formal remaining: `800`
- Branch-local frozen overlap: `139/944`
- Frozen duplicates: `0`
- Locked Reference: `b2f9fa15fba07c63530bbf4612b03b8b704755f9`
- F1 evidence commit: `59f145434695d29bdd17e4cb3adc887e84182377`

FB2-42 is synchronized identity-free infrastructure and earned zero migration credit.

## Exact migration identity

Migrate exactly one frozen consumer:

- `servant.darius.skill.sc-darius-2`
- owner: `servant.darius`
- owner class: `Berserker`
- legacy id: `sc_darius_2`
- name: `巴比伦之门`
- static card metadata: cost `4`, basePower `0`, typeLabel `特殊/宝具`, attributes `特殊` + `宝具`, legacy requirement `8`.

Frozen F1 binds the whole printed clause/text to SHA-256 `9306d30ca4244bde6326a78944a19e633f1dd3735f5cf4d2b33c4215ac794c01` at `src/content/authoring/cards.json / skillCards[21].abilities[0].printedClause`:

`【真名解放】打开冥府之门-行动阶段：你控制的【不死兵】获得+1威力且于本回合不会被关闭。`

Locked Reference supplies the three normalized undead definition ids:

- `servant.darius.skill.sc-darius-4`
- `card.skill.servant.darius.skill.sc-darius-4`
- `card.x-immortal`

Reference handler identity is evidence only and must not be used for production routing.

## Current whole-card readiness proof

After accepted FB2-42, A reran a read-only complete-card normalization probe against the current accepted runtime. The normalized card uses only accepted identity-free structures:

1. standard servant skill action/card-play envelope and final-rule skill-zone mana threshold `8`;
2. `phase_action` at action / `controller_action_window`, source-active gating, automatic execution;
3. one exact `card.currentPower` add-1 modifier per normalized undead definition id, scoped to the controller and one structural `has_card_id` constraint;
4. one exact accepted FB2-42 `card_close` forbid modifier per same definition id and scope;
5. all six modifiers plus parent ongoing lifecycle are exactly `this_round`;
6. structural true-name release `revealsTrueName / on_use_declared / servant_package`.

Mechanical probe result:

- loader `report=[]`;
- card and ability mode `automatic`;
- matching controller-owned undead powers: `2 -> 3` for all three normalized ids;
- unrelated controller-owned card: stays `2`;
- opponent-controlled matching definition: stays `2`;
- close forbid: true only for the three matching controller-owned definitions;
- unrelated/opponent close forbid: false;
- next round: power returns to `2` and close forbid returns false for all three targets.

Therefore `servant.darius.skill.sc-darius-2` is now mechanically `S_READY_NOW`. Migration-credit-first forbids opening another B2 seam before this singleton is closed.

## S scope

Fresh S must:

- extend the existing `data/authoring/servants/servant.darius.json` archive with exactly this second card and preserve the already accepted s1 unchanged;
- normalize the Reference list scopes into six exact modifiers (three power + three close-forbid), not a new list-selector runtime;
- add focused consumer-migration tests loading the real archive and proving exact hashes/static metadata, loader `report=[]`, automatic execution, exact controller/definition power and close behavior, round expiry, and structural visibility;
- add only one S result report.

Forbidden: production runtime edits, another frozen consumer identity, Darius-specific runtime routing, new selector/DSL capability, product/generated registration, merge/retarget, or migration credit before fresh R acceptance plus A synchronization.

## Required accounting and gates

- Base frozen overlap is exactly `139/944`, duplicates `0`.
- Candidate must be exactly `140/944`: exact +1 `servant.darius.skill.sc-darius-2`, zero removals, zero duplicates.
- Runtime production source diff must be empty.
- Typecheck first, then focused Darius s2 + FB2-42 coverage, rules src/core/regression/focused, official CI, content validation, generated determinism, exact Locked Reference verification, client build, `git diff --check`, identity/scope audit, and final cleanliness must pass.

Formal project migration remains **`144/944`**, with **`800`** remaining until fresh independent R returns `MIGRATION_ACCEPTED` for the exact S Candidate and A synchronizes that acceptance.
