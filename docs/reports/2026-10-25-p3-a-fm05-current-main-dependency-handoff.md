# P3-A FM05 Current-Main Dependency / Handoff

Date: 2026-10-25  
Status: `READY_CURRENT_MAIN_HANDOFF`  
Role: Codex A dependency reconciliation  

This is a fresh current-main handoff, not a reuse of the historical FM05
Candidate, Reviewer, or synchronization. It authorizes a future authoring-only
Builder/S owner to start from the exact current-main Base below; it does not
claim FM05 migration acceptance or credit.

## Exact current-main Base and dependencies

- Current-main Base: `d5c7f7140b84aa7efe045a3730c9eddd0d0ce296`
  (FB2-11 current-main A-sync).
- Accepted dependency FB2-02 current-main A-sync:
  `5e7211ed84d8e3bb0df3653610a2d488119e14ce`.
- Accepted dependency FB2-11 current-main A-sync:
  `d5c7f7140b84aa7efe045a3730c9eddd0d0ce296`.
- Historical FM05 S Base: `fd17ba227182e5e9a14d093390bbfb3a47af1c39`.
- Historical FM05 S Candidate: `3e66365a03c12b4a1d683bdae5e9350acad80455`.
- Historical R34 evidence is semantic reference only; it is not current-main
  review evidence and must not be copied into a fresh Candidate.

The historical FM05 Base differs from the current-main line. The historical
Candidate's commit itself was authoring-only, but its surrounding planning
lineage contains FM03/FM04 material and cannot be used as the new Base.

## Frozen exact 10-ID contract

The authorized batch is exactly:

1. `servant.anastasia.skill.sc-anastasia-1`
2. `servant.andersen.skill.sc-andersen-1`
3. `servant.avicebron.skill.sc-avicebron-3`
4. `servant.kinggil.skill.sc-kinggil-1`
5. `servant.ladyavalon.skill.sc-ladyavalon-3`
6. `servant.maxwell.skill.sc-maxwell-1`
7. `servant.mephisto.skill.sc-mephisto-1`
8. `servant.mozart.skill.sc-mozart-3`
9. `servant.semiramis.skill.sc-semiramis-2`
10. `servant.shakespeare.skill.sc-shakespeare-1`

Frozen evidence to recheck in the fresh Builder/S worktree:

- full-text SHA for all ten:
  `295a5b531db5d1031cbbb89dc677e76737b7d3b3c7ca70af59405cc84bd98c58`;
- clause hashes:
  `a65ce56a69bba9214eba95ab30154209228bcd28f7fec21f6317c8a70f421847` and
  `2137380f5f57233a98494f45a9d12a848f3d1cf710101c60462c523ea3f1624f`;
- Reference static metadata: `typeLabel=魔术`, attributes `[魔术]`, cost `0`,
  historical basePower `2`, historical requirement `0`;
- owner/class metadata remains locked, including Lady Avalon as Pretender and
  Semiramis as Assassin;
- final skill-zone play requirement is 8 mana.

The current-main Base contains none of the ten servant archive files, so the
fresh authoring delta is expected to be exactly ten minimal archives plus a
focused FM05 test and report. No other servant, Medea/Gilles sibling, generated
coverage artifact, or runtime file is authorized.

## Rebound authoring contract

Each selected archive may contain exactly the two accepted clauses:

1. A `continuous_formula` card-face Power using the existing controlled AST
   `add(16, multiply(-2, game.round_number))`, with no new operator, string
   expression, arbitrary variable, or identity routing.
2. A forced `after_player_deployed_to_battlefield` reward at
   `eventLocationId=magic_workshop`, automatic controller `+1 mana` and `+2
   VP`, using the accepted FB2-02 structural route.

The migration must preserve source/full-text evidence, prove round values
`14/8/2/0` at rounds `1/4/7/8`, prove exact deployment/wrong-location/other-
player/ordinary-movement behavior, and keep runtime hot-file diff at zero.

## Current-main compatibility and authorization

Current-main source inspection confirms the accepted formula evaluator exposes
the trusted `game.round_number` metric and the accepted deployment-resource
semantic/test route exposes the Magic Workshop controller reward. No new
runtime implementation is needed for FM05, and FM05 may touch authoring,
focused migration tests, and its report only.

Therefore A authorizes a fresh FM05 Builder/S Candidate from exact Base
`d5c7f7140b84aa7efe045a3730c9eddd0d0ce296`, restricted to the ten-ID
authoring contract above. The future Candidate requires fresh review and
current-main synchronization; this handoff itself does not claim acceptance,
merge, or migration credit.
