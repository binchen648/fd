# P3-A FB2-11 Synchronization and FM05 Dispatch

Date: 2026-09-16
Role: Codex A
Status: `SYNCHRONIZED`
R33: `0121d500b3abda1e9ef4de45c9a266620aa20f45`
FB2-11 candidate: `5383c37c8362341b8a581624b8ad1d77ddce3567`
F1 evidence: `59f145434695d29bdd17e4cb3adc887e84182377`

## Fresh A recertification

- fresh coverage remains archives `59`, cards `91`, abilities `180`;
- raw routing remains `new=22 / legacyExecute=3 / legacyResolve=117 / dual=0 / notClassifiable=38 / taxonomyWarnings=124`;
- source fingerprint remains `401d6d62a3f085eb84e54e1c6889108dcec5ee9fd38b4dbd9ee841059c906125`;
- compiled definition hash remains `37551fd5f5b0a968f9143dee0698adf8582a0a26d8edabef55907cf78d374333` with 70 cards / 14 characters / 0 blocking issues;
- typecheck PASS;
- FB2-11 + FB2-02 focused `12/12 PASS`;
- content validation 0 blockers;
- deterministic hashes unchanged.

Regenerated coverage differs from the committed FM04 material artifact in exactly eight non-semantic fields: `generatedAt` plus seven `packages/rules/src/ability/interpreter.ts` static-literal source line numbers shifted by +1 because FB2-11 inserted one evaluator line. No KPI, routing, identity, fingerprint, or compiled-product value changed. The artifact remains intentionally uncommitted.

## Frozen-F1 reconciliation

- denominator `944`;
- current canonical overlap `69/944`;
- absent `875/944`;
- exact Territory Creation family size `10`;
- current canonical presence `0/10`;
- exact full-text SHA `295a5b531db5d1031cbbb89dc677e76737b7d3b3c7ca70af59405cc84bd98c58`;
- exact two clause-source hashes are common 10/10;
- Reference handler `core.territory-creation` common 10/10;
- Reference static metadata common 10/10: `typeLabel=魔术`, `cost=0`, historical `requirement=0`, historical static `basePower=2`;
- R33 independently accepts the F1 `5 open + 5 scaling-blocked` split as classification drift only.

The full two-clause family is now dependency-complete under FB2-11 round-number formula + previously accepted FB2-02 deployment reward.

## FM05 dispatch

P3-FM05 is READY at exact batch size 10:

- `servant.anastasia.skill.sc-anastasia-1`
- `servant.andersen.skill.sc-andersen-1`
- `servant.avicebron.skill.sc-avicebron-3`
- `servant.kinggil.skill.sc-kinggil-1`
- `servant.ladyavalon.skill.sc-ladyavalon-3`
- `servant.maxwell.skill.sc-maxwell-1`
- `servant.mephisto.skill.sc-mephisto-1`
- `servant.mozart.skill.sc-mozart-3`
- `servant.semiramis.skill.sc-semiramis-2`
- `servant.shakespeare.skill.sc-shakespeare-1`

S must create only these ten minimal archives and must not migrate Medea/Gilles or any other Reference Territory member.

Each selected card must preserve frozen F1 full text/source evidence. Its actual `cardFace.basePower` must be the controlled AST `16 + (-2 * game.round_number)` with printed expression `X`; Reference static `basePower=2` is evidence metadata only. Final skill-zone threshold remains 8 mana. Deployment reward must be the exact accepted FB2-02 shape at `magic_workshop`: controller mana +1 and VP +2.
