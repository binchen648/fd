# P3-A FB2-50 Selected Played Attack Temporary Copy Dispatch

Role: Codex A
Status: `READY`
Date: 2026-09-22

## Exact baseline

- Exact accepted migration synchronization: `91e2a27e4682c68bb8efd4232cd8f51d1a544c86`
- Accepted Astolfo S1 Candidate: `110257b76a957a5bba39ea1822f7861cecf288a9`
- Fresh independent migration evidence: `https://github.com/binchen648/fd/pull/423#issuecomment-5775187822`
- Formal migration accepted: `152/944`
- Formal remaining: `792`
- Locked Reference: `b2f9fa15fba07c63530bbf4612b03b8b704755f9`

Astolfo S1 added authoring/test/report material only and no production runtime. The accepted FB2-49 close-to-one compound is consumed only by the already-migrated Astolfo S1 in the current material/inventory, so it does not unlock a second frozen consumer.

## Migration-credit-first probe result

The previous accepted low-complexity probe set was mechanically rechecked on the exact synchronized baseline.

- Darius S3 still depends on an unmaterialized `servant.darius.skill.sc-darius-4` support definition in addition to create/activate behavior.
- Ciel S1b now has accepted opponent relation and definition-return components, but the exact per-round opponent VP-gain threshold crossing/event acquisition is still absent.
- Andersen S2 remains a reviewed-special transform/defeat-immunity boundary.
- Atalanta S2 has all ordinary selection prerequisites already present: Action phase activation, `source_active`, `controller.deployment_bonus`, controller attack-area targeting, `played_this_round`, `not_source_card`, attack classification, exactly-one pending target settlement, and true-name visibility. The remaining runtime seam is the selected attack temporary-copy creation/activation itself.

No whole frozen card is therefore honestly `S_READY_NOW` from the newly accepted Astolfo lineage. The minimum next capability seam is the exact Atalanta S2 selected-played-attack temporary-copy transaction.

## Source and rule evidence

Exact frozen consumer:

- canonical id: `servant.atalanta.skill.sc-atalanta-2`
- owner: `servant.atalanta` / 阿塔兰忒
- name: `诉状箭书`
- source ability id: `appeal-letter-copy`
- printed clause SHA-256: `93fd375fbcb6d5841a26ebf2c1512b48d94e6b6ed963fd0fcafe7d37c58f501b`
- accepted source S: `4c67f72828125bc112b23b738948f5533eaceb8c`
- accepted source A audit: `6826dc5b085bf8efa0a53853c0e293e939b0c137`
- independent source R: `826e6f5b` (`ACCEPTED` source evidence)
- printed text: `【真名解放】\n唯一/行动阶段：若你拥有地利，创造并激活一张你本回合打出的其他攻击的临时复制。`

Locked Reference confirms stable card metadata `迅捷/宝具`, cost `2`, base power `4`, minimum mana `8`, and the same printed clause. Reference implementation is corroboration only and is not routing authority.

FQA adds two binding semantics for this exact operation:

1. creating and activating the attack copy costs no extra mana;
2. a created attack such as Atalanta's copy is not a card “played” for effects that count cards played this round.

## Exact B2 contract

Implement one identity-free compound effect for an already-resolved exactly-one controller attack target:

`create_selected_played_attack_temporary_copy`

The accepted shape must require all of the following rather than exposing generic clone machinery:

- source ability is an automatic Action phase activation using the existing controller action window;
- source is currently active;
- controller deployment bonus is strictly greater than zero;
- exactly one target is selected from the controller's current attack area;
- selected card is an attack, is not the source card, and has authoritative `playedRound === current round` provenance;
- at settlement, provenance/state is revalidated server-side before mutation;
- create exactly one physical card instance using the selected card's definition, controlled/owned by the ability controller, face-up and active in attack area;
- the generated copy is temporary through the current round and is removed when that duration expires;
- creation/activation charges no mana and does not increment play counters, emit ordinary card-play semantics, or mark the copy as played this round;
- true-name reveal and ordinary pending-decision authentication remain owned by existing runtime gateways;
- malformed effect/target shapes, forged selection, stale selection, wrong owner/controller/zone, non-attack target, source selection, or non-current-round provenance fail closed before mutation.

## B2 scope

B2 may touch only the minimum rule-runtime/compiler/test/report surface needed for this exact structural family. It may add a small identity-free classifier/helper module if that keeps loader/interpreter changes bounded.

B2 must not:

- add Atalanta/card/name/text routing;
- expose generic arbitrary card cloning, arbitrary destination cloning, arbitrary active/face/temporary parameters, or a generic `copies` engine;
- materialize Atalanta authoring;
- modify Darius/Ciel/Andersen or any other consumer;
- treat the generated copy as a normal card play;
- grant migration credit, merge, or retarget stacked PRs.

## Required evidence

The Candidate must prove exact authoring admission only for the bounded structural shape, negative malformed-shape rejection, target eligibility, owner/source/current-round checks, no-extra-mana semantics, copy definition fidelity, active/face-up attack placement, non-play accounting, round-end temporary cleanup, stale/forged decision rejection, replay/persistence compatibility through existing generic decision/session paths, affected focused regressions, and `git diff --check`.

This is zero-credit capability work. Formal migration remains **`152/944`**, **`792`** remaining. After exact fresh R acceptance and A synchronization, freshly reconstruct the complete `servant.atalanta.skill.sc-atalanta-2`; dispatch singleton S only if that whole-card probe is mechanically zero-gap.