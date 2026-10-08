# P3-B Goredolf Owner Readiness Complete Gap Set

Date: 2026-10-08
Task: `P3-B-GOREDOLF-OWNER-READINESS-CAPABILITY`
Branch: `codex/b-p3-goredolf-owner-readiness-complete-gap-set`
Exact Base: `1b233c4d380b06549940889c9bd2b20f557c58e3`
Locked Reference: `b2f9fa15fba07c63530bbf4612b03b8b704755f9`
Classification: zero-credit owner-local readiness / capability closure

## Frozen owner scope

Goredolf / 戈尔德鲁夫·穆吉克 has exactly three frozen identities:

- `master.goredolf.skill.ascension` — 别掉队了！
- `master.goredolf.skill.s1` — 铁腕绅士
- `master.goredolf.skill.s1a` — 愚者的决意

At exact Base no canonical Goredolf authoring consumer exists and this readiness transaction contains no `data/authoring/**`, `data/packs/**`, or `data/generated/**` delta. Canonical Goredolf materialization therefore remains exactly `0/3`.

Strict accounting remains `270/944`, remaining `674`. This readiness transaction permanently contributes `+0` migration credit.

## Locked Reference capability gap

The locked Reference requires:

1. 铁腕绅士: at game start, replace the controller's two highest-Power basic attacks in deck with one declared replacement attack, using physical deck order for ties.
2. 愚者的决意: in advance/outpost, activate a current-round commitment that grants `+2` total Power, requires deployment to a battlefield, blocks movement for the round, and applies `-2 VP` after a trusted battle loss.
3. 别掉队了！: once the ascension provider is live, the declared replacement attack gains `+6` Power; if the currently committed controller wins, every authoritative loser in that battle loses `2 VP`.

The Reference's round movement lock applies to ordinary and effect movement unless the movement effect already has authority to ignore card movement restrictions. The ascension begins outside game and must not provide its +6 or win-settlement authority until it is a live Master-skill source.

Existing runtime already supplies shared current-round player Power adjustments, centralized movement legality, MatchSession deployment legality, trusted battle-result snapshots, VP adjustment auditing, and Power calculation. The missing gap was a strict identity-free authoring/provenance gateway tying those authorities together.

## Implemented identity-free authority

`packages/rules/src/ability/round-commitment-capability.ts` adds five exact privileged semantic shapes:

- `replace_highest_basic_attacks_with_definition`
- `activate_round_commitment`
- `round_commitment_loss_vp_penalty`
- `round_commitment_definition_power_bonus`
- `round_commitment_win_losers_vp_penalty`

The gateway is fail-closed:

- each effect requires an exact field set and exact numeric/phase/trigger domain;
- common authoring fields must remain empty/automatic except the exact accepted response shape;
- source authority requires the controller's own Master-skill definition and rejects face-down/unrelated providers;
- definition-Power and winner/loser ascension operations require a live provider; `outside_game` is not live;
- trusted battle operations require exact event identity, player, result, battle, resolution, battlefield, participant, and winner/loser agreement with `trustedBattleResultSnapshots`;
- malformed replacement count/ranking is blocked by the loader whole-ability gateway.

No new owner-specific runtime state is introduced. Successful `activate_round_commitment` reuses one current-round `roundPlayerPowerAdjustments` entry with exact source/ability provenance. That record is also the commitment proof for deployment, movement, trusted loss/win settlement, and restore validation.

Runtime integration is identity-free across loader gating, interpreter legality/resolution/Power/restore, centralized movement lock, MatchSession deployment filtering, and public exports. Production runtime diff contains no Goredolf/name/printed-text routing.

## Verification

Focused readiness:

- `p3-goredolf-owner-readiness-complete-gap-set.test.ts`: `5/5 PASS`
- exact semantic matrix + malformed loader rejection;
- real game-start top-two replacement with deck-order tie break;
- real public activation path, duplicate suppression, +2 provenance, battlefield-only deployment, and effect-movement lock;
- trusted battle loss `-2 VP`;
- live ascension exact-definition `+6 Power`;
- trusted committed win `-2 VP` to every authoritative loser;
- legitimate adjustment provenance valid, forged amount rejected.

Selected affected validation:

- `154/154 PASS` across `15` files;
- includes core movement, MatchSession `34/34`, complex skills `38/38`, Ruler/Command-Seal `13/13`, deployment/resource, terrain deployment, battle-result VP triggers, master ascension, Raido movement, accepted Goetia readiness, and Caren restore coverage.

One separately observed historical suite remains red:

- `fm02-any-location-except-workshop-movement-authoring.test.ts`: `3` stale raw-authoring assertions still require one-card minimal archives, historical source-text hashes, and historical cost metadata;
- this readiness Candidate modifies neither that test nor the referenced authoring archives;
- the failures are disclosed and are not represented as green or candidate-induced.

Static/content gates:

- `npm run typecheck`: PASS
- `npm run content:validate`: PASS — `25 masters / 19 servants / 20 events / 0 blocking issues`
- `npm run verify:generated-content`: PASS
  - content `f7f0a1b44e3e9d22425ed646adbc53aa8a925f2f0bcfc462d5c237325ce7264a`
  - fixture `87542f5da07effcf6bba03efd963ae964dde99af4f6c3c63352225e870c96e6c`
  - evidence `600fe09a921a9ace395dbfb00eec850e04b5e65a6a4f22ef3460ffdc15f693e0`
- `git diff --check`: PASS

External Phase-3 coverage:

- `archives=129 cards=305 abilities=536`
- `compiledCards=244 compiledCharacters=44 blockingIssues=0`
- `newRuntimeSemanticRouted=22 legacyExecuteAbility=3 legacyResolveEffect=165 dualRuntime=0 pilotAllowlist=0 notClassifiable=346 taxonomyWarnings=357`

External automation audit:

- `legacyResolveEffect=165 legacyExecuteAbility=3 notClassifiable=346 promotionFindings=20`

Scratch evidence:

- `E:\Codex\FD\.fd-runner-review-evidence\formal-goredolf-readiness-1b233c4d`

## Formal gate

Freeze one zero-credit readiness Candidate from exact Base `1b233c4d380b06549940889c9bd2b20f557c58e3`, push one PR, obtain one fresh exact Base/Candidate independent readiness review, then perform zero-credit acceptance synchronization.

Only after readiness acceptance may FORMAL build one owner-complete Goredolf consumer Candidate containing all three frozen identities together.

Strict accounting:

- before readiness: `270/944`, remaining `674`;
- readiness acceptance: still `270/944`, remaining `674`;
- maximum later lawful Goredolf owner increment after fresh `MIGRATION_ACCEPTED` + A-sync: exactly `+3`, yielding `273/944`, remaining `671`.
