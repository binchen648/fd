# P3-E04-A112 Accepted 111 Gap Decomposition

- Task ID: `P3-E04-A112`
- Control Epoch: `FD-P3-2026-09-23-04`
- Main SHA: `0e943a94e8bdab6335e34818278ecc90760015f0`
- Source matrix: `artifacts/phase3-e04-current-main-accepted-111-execution-matrix.json`
- Source matrix SHA-256: `34ce9258e94e9bf44243cdd76be223f599d4776c13e2ef623382ae44a2f4f965`
- Artifact: `artifacts/phase3-e04-a112-accepted-111-gap-decomposition.json`
- Status: `REVIEW_READY`
- Credit change: `NONE`

## Accounting

- accepted: `111`
- denominator: `944`
- remaining: `833`
- main coverage credit delta: `0`

## Gap Counts

- `GENERATED_REGISTRY_MISSING`: 87
- `RUNTIME_CONTRACT_UNBOUND`: 49
- `TEST_EVIDENCE_UNBOUND`: 76
- `GATE_C_PENDING`: 111
- `LEGACY_ONLY`: 65
- `COMPILER_UNSUPPORTED`: 68
- `AUTHORING_GENERATION_DRIFT`: 0
- `REVIEW_ARTIFACT_MISSING`: 0

Gap counts are overlapping identity diagnostics. `primaryGapCounts` is the non-overlapping routing view.

## Registry Diagnosis

- `AUTHORING_PRESENT_BUT_NOT_REGISTERED_IN_ACTIVE_PLAYTEST_PACK`: 77
- `RULES_ONLY_MASTER_RULE_ARCHIVE_NOT_REGISTERED_IN_PLAYTEST_PACK`: 10
- `PACK_SOURCE_LISTED_BUT_NOT_EMITTED`: 0
- `AUTHORING_SHAPE_UNSUPPORTED`: 0
- `RUNTIME_CAPABILITY_MISSING`: 0
- `LEGACY_HANDLER_DEPENDENCY_ONLY`: 0

The 87 missing generated identities are not treated as one B runtime batch. The current result distinguishes active-pack exclusion, rules-only content, and source-listed-but-not-emitted drift.

- `AUTHORING_PRESENT_BUT_NOT_REGISTERED_IN_ACTIVE_PLAYTEST_PACK` is the observed diagnosis for 77 identities; no generator failure is inferred.
- `RULES_ONLY_MASTER_RULE_ARCHIVE_NOT_REGISTERED_IN_PLAYTEST_PACK` accounts for 10 FM08 rules-only identities; these are not automatically playtest registry obligations.
- `PACK_SOURCE_LISTED_BUT_NOT_EMITTED`, `AUTHORING_SHAPE_UNSUPPORTED`, `RUNTIME_CAPABILITY_MISSING`, and `LEGACY_HANDLER_DEPENDENCY_ONLY` are explicitly zero in this registry diagnosis. Legacy/runtime gaps remain separate identity diagnostics.
- `COMPILER_UNSUPPORTED` is derived from coverage classification signals only; it is not a runtime defect finding. Any runtime defect requires a Codex B reproduction and a separate handoff.

## Family Decomposition

### ALTER_EGO_TRANSFORM

- identity count: 10
- shared runtime contract: FB2-13/R37: transform_event_source_card + close_source_card; EX variant included
- registry status: PACK_SOURCE_EXCLUDED
- gap counts: {"COMPILER_UNSUPPORTED":10,"GATE_C_PENDING":10,"GENERATED_REGISTRY_MISSING":10,"TEST_EVIDENCE_UNBOUND":10}
- gap owner: Codex A / Evidence Owner; Codex B / Compiler Owner; Codex B for runtime path plus Codex A for evidence packet; Codex S / Content Pack Owner
- smallest repair slice: Add one typed compiler contract and negative tests for the exact primitive shape.; Create an exact identity evidence manifest; do not infer identity execution from family tests.; Decide active-pack inclusion versus explicit rules-only boundary; do not bulk-register identities.; Select one representative Gate C path with browser/WS/reconnect/stale evidence before widening.
- required reviewer: Reviewer A for pack/source evidence, then Reviewer R for acceptance; Reviewer A, followed by Reviewer R where runtime behavior is claimed; Reviewer R; Reviewer R / Gate C reviewer
- dependency order: 1, 2, 4, 5
- affected identities: master.sion.skill.s12, servant.douman.skill.sc-douman-3, servant.koyanskaya.skill.sc-koyanskaya-1, servant.mechaeli.skill.sc-mechaeli-3, servant.meltryllis.skill.sc-meltryllis-3, servant.muramasa.skill.sc-muramasa-3, servant.okita-alt.skill.sc-okita-alt-1, servant.passionlip.skill.sc-passionlip-1, servant.sitonai.skill.sc-sitonai-3, servant.taisui.skill.sc-taisui-1

### ANY_LOCATION_EXCEPT_WORKSHOP_MOVEMENT

- identity count: 12
- shared runtime contract: FB2-09/R27: typed move_player with one location choice and workshop exclusion
- registry status: PACK_SOURCE_EXCLUDED
- gap counts: {"GATE_C_PENDING":12,"GENERATED_REGISTRY_MISSING":12,"LEGACY_ONLY":12,"RUNTIME_CONTRACT_UNBOUND":12}
- gap owner: Codex A/R for evidence; Codex B for legacy semantic migration; Codex B / Runtime Owner; Codex B for runtime path plus Codex A for evidence packet; Codex S / Content Pack Owner
- smallest repair slice: A112-MOVE-EVIDENCE: bind movement contract and decide Gate C representative; Decide active-pack inclusion versus explicit rules-only boundary; do not bulk-register identities.; Select one representative Gate C path with browser/WS/reconnect/stale evidence before widening.
- required reviewer: Reviewer A for pack/source evidence, then Reviewer R for acceptance; Reviewer R / Gate C reviewer; Reviewer R, then Gate C reviewer if interaction is exposed
- dependency order: 1, 2, 3, 5
- affected identities: servant.benkei.skill.sc-benkei-1, servant.bradamante.skill.sc-bradamante-1, servant.brynhildr.skill.sc-brynhildr-1, servant.cu.skill.sc-cu-2, servant.diarmuid.skill.sc-diarmuid-3, servant.donquixote.skill.sc-donquixote-3, servant.enkidu.skill.sc-enkidu-3, servant.jaguarman.skill.sc-jaguarman-1, servant.kagetora.skill.sc-kagetora-3, servant.lishuwen.skill.sc-lishuwen-3, servant.romulus.skill.sc-romulus-3, servant.vlad.skill.sc-vlad-3

### CURRENT_MAIN_PLAYTEST_BASELINE

- identity count: 22
- shared runtime contract: CURRENT_MAIN_PLAYTEST_BASELINE: no accepted family contract bound by A111
- registry status: GENERATED_REGISTRY_PRESENT
- gap counts: {"COMPILER_UNSUPPORTED":16,"GATE_C_PENDING":22,"LEGACY_ONLY":19,"RUNTIME_CONTRACT_UNBOUND":22,"TEST_EVIDENCE_UNBOUND":22}
- gap owner: Codex A / Evidence Owner; Codex B / Compiler Owner; Codex B / Runtime Owner; Codex B for contract owner; Codex A for evidence binding; Codex B for runtime path plus Codex A for evidence packet
- smallest repair slice: Add one typed compiler contract and negative tests for the exact primitive shape.; B-CONTRACT-BASELINE-MIN: select one semantic contract before roster expansion; Create an exact identity evidence manifest; do not infer identity execution from family tests.; Select one representative Gate C path with browser/WS/reconnect/stale evidence before widening.
- required reviewer: Reviewer A, followed by Reviewer R where runtime behavior is claimed; Reviewer R; Reviewer R / Gate C reviewer; Reviewer R before any migration credit
- dependency order: 1, 2, 3, 4, 5
- affected identities: servant.achilles.skill.sc-achilles-1, servant.achilles.skill.sc-achilles-2, servant.achilles.skill.sc-achilles-3, servant.artoria-alt.skill.sc-artoria-alt-1, servant.artoria-alt.skill.sc-artoria-alt-2, servant.artoria-alt.skill.sc-artoria-alt-3, servant.artoriac.skill.sc-artoriac-1, servant.artoriac.skill.sc-artoriac-2, servant.artoriac.skill.sc-artoriac-3, servant.artoriac.skill.sc-artoriac-4, servant.artoriac.skill.sc-artoriac-5, servant.artoriac.skill.sc-artoriac-6, servant.drake.skill.sc-drake-2, servant.drake.skill.sc-drake-3, servant.ereshkigal.skill.sc-ereshkigal-1, servant.ereshkigal.skill.sc-ereshkigal-2, servant.ereshkigal.skill.sc-ereshkigal-3, servant.kintoki.skill.sc-kintoki-1, servant.kintoki.skill.sc-kintoki-2, servant.kintoki.skill.sc-kintoki-3, servant.tomoe.skill.sc-tomoe-2, servant.tomoe.skill.sc-tomoe-3

### GAME_START_RULE_OVERRIDES

- identity count: 10
- shared runtime contract: FB2-14/R39: game_start RuleOverride installation; rules-only boundary
- registry status: RULES_ONLY_NOT_IN_PLAYTEST_PACK
- gap counts: {"COMPILER_UNSUPPORTED":10,"GATE_C_PENDING":10,"GENERATED_REGISTRY_MISSING":10}
- gap owner: Codex B / Compiler Owner; Codex B for runtime path plus Codex A for evidence packet; Codex S / Content Pack Owner
- smallest repair slice: Add one typed compiler contract and negative tests for the exact primitive shape.; Decide active-pack inclusion versus explicit rules-only boundary; do not bulk-register identities.; Select one representative Gate C path with browser/WS/reconnect/stale evidence before widening.
- required reviewer: Reviewer A for pack/source evidence, then Reviewer R for acceptance; Reviewer R; Reviewer R / Gate C reviewer
- dependency order: 1, 2, 5
- affected identities: master.bazett.skill.s1b, master.caules.skill.s1a, master.fiore.skill.s2, master.fiore.skill.s3, master.fiore.skill.s4, master.irisviel.skill.s1, master.peperoncino.skill.s1a, master.sieg.skill.s1, master.waver.skill.s1, master.zouken.skill.s5

### INDEPENDENT_ACTION

- identity count: 11
- shared runtime contract: TO08/B21: independent-action resource cost plus battle-loss exception
- registry status: GENERATED_REGISTRY_PRESENT, PACK_SOURCE_EXCLUDED
- gap counts: {"GATE_C_PENDING":11,"GENERATED_REGISTRY_MISSING":10,"RUNTIME_CONTRACT_UNBOUND":1,"TEST_EVIDENCE_UNBOUND":11}
- gap owner: Codex A / Evidence Owner; Codex A/R for exact evidence; Codex B for legacy route; Codex B for runtime path plus Codex A for evidence packet; Codex S / Content Pack Owner
- smallest repair slice: A112-INDEPENDENT-ACTION-EVIDENCE: exact Tomoe lineage plus ten family members; Create an exact identity evidence manifest; do not infer identity execution from family tests.; Decide active-pack inclusion versus explicit rules-only boundary; do not bulk-register identities.; Select one representative Gate C path with browser/WS/reconnect/stale evidence before widening.
- required reviewer: Reviewer A for pack/source evidence, then Reviewer R for acceptance; Reviewer A, followed by Reviewer R where runtime behavior is claimed; Reviewer R / Gate C reviewer; Reviewer R, Gate C reviewer for action/resource path
- dependency order: 1, 3, 4, 5
- affected identities: servant.atalanta.skill.sc-atalanta-3, servant.baobhan.skill.sc-baobhan-3, servant.chiron.skill.sc-chiron-1, servant.emiya-alt.skill.sc-emiya-alt-1, servant.euryale.skill.sc-euryale-1, servant.gil.skill.sc-gil-1, servant.ishtar.skill.sc-ishtar-3, servant.napoleon.skill.sc-napoleon-3, servant.robin.skill.sc-robin-1, servant.tomoe.skill.sc-tomoe-1, servant.tristan.skill.sc-tristan-3

### PRESENCE_CONCEALMENT

- identity count: 12
- shared runtime contract: FB2-12/R35: source-active presence concealment behavior
- registry status: PACK_SOURCE_EXCLUDED
- gap counts: {"COMPILER_UNSUPPORTED":12,"GATE_C_PENDING":12,"GENERATED_REGISTRY_MISSING":12}
- gap owner: Codex B / Compiler Owner; Codex B for runtime path plus Codex A for evidence packet; Codex S / Content Pack Owner
- smallest repair slice: Add one typed compiler contract and negative tests for the exact primitive shape.; Decide active-pack inclusion versus explicit rules-only boundary; do not bulk-register identities.; Select one representative Gate C path with browser/WS/reconnect/stale evidence before widening.
- required reviewer: Reviewer A for pack/source evidence, then Reviewer R for acceptance; Reviewer R; Reviewer R / Gate C reviewer
- dependency order: 1, 2, 5
- affected identities: servant.corday.skill.sc-corday-1, servant.danzou.skill.sc-danzou-3, servant.hassan.skill.sc-hassan-1, servant.hassanhf.skill.sc-hassanhf-3, servant.hassanser.skill.sc-hassanser-1, servant.izou.skill.sc-izou-3, servant.jekyll.skill.sc-jekyll-3, servant.kama.skill.sc-kama-3, servant.kiritsugu.skill.sc-kiritsugu-1, servant.kotarou.skill.sc-kotarou-1, servant.semiramis.skill.sc-semiramis-1, servant.stheno.skill.sc-stheno-1

### SABER_MAGIC_RESISTANCE_AND_NOBLE_BLOOM

- identity count: 10
- shared runtime contract: B18/R12 + B19/R13 + FB2-10/R29: Magic Resistance and Noble Bloom response contracts
- registry status: PACK_SOURCE_EXCLUDED
- gap counts: {"COMPILER_UNSUPPORTED":10,"GATE_C_PENDING":10,"GENERATED_REGISTRY_MISSING":10,"LEGACY_ONLY":10,"TEST_EVIDENCE_UNBOUND":10}
- gap owner: Codex A / Evidence Owner; Codex B / Compiler Owner; Codex B / Runtime Owner; Codex B for runtime path plus Codex A for evidence packet; Codex S / Content Pack Owner
- smallest repair slice: A112-SABER-EVIDENCE: bind the two accepted subcontracts separately; Add one typed compiler contract and negative tests for the exact primitive shape.; Create an exact identity evidence manifest; do not infer identity execution from family tests.; Decide active-pack inclusion versus explicit rules-only boundary; do not bulk-register identities.; Select one representative Gate C path with browser/WS/reconnect/stale evidence before widening.
- required reviewer: Reviewer A for pack/source evidence, then Reviewer R for acceptance; Reviewer A, followed by Reviewer R where runtime behavior is claimed; Reviewer R; Reviewer R / Gate C reviewer
- dependency order: 1, 2, 3, 4, 5
- affected identities: servant.altera.skill.sc-altera-3, servant.arthur.skill.sc-arthur-3, servant.bedivere.skill.sc-bedivere-1, servant.charlemagne.skill.sc-charlemagne-3, servant.gawain.skill.sc-gawain-3, servant.lakshmibai.skill.sc-lakshmibai-3, servant.mordred.skill.sc-mordred-3, servant.musashi.skill.sc-musashi-3, servant.saber.skill.sc-saber-1, servant.saitou.skill.sc-saitou-1

### SOURCE_PLAY_BASIC_DRAW

- identity count: 14
- shared runtime contract: TO13 + FB2-06 + FB2-08: source play, selected hand play, and basic-attack draw
- registry status: GENERATED_REGISTRY_PRESENT, PACK_SOURCE_EXCLUDED
- gap counts: {"GATE_C_PENDING":14,"GENERATED_REGISTRY_MISSING":13,"LEGACY_ONLY":14,"RUNTIME_CONTRACT_UNBOUND":14,"TEST_EVIDENCE_UNBOUND":13}
- gap owner: Codex A / Evidence Owner; Codex A/R for identity evidence; Codex B for legacy path; Codex B / Runtime Owner; Codex B for runtime path plus Codex A for evidence packet; Codex S / Content Pack Owner
- smallest repair slice: A112-SOURCE-PLAY-EVIDENCE: bind private-selection and draw evidence by identity; Create an exact identity evidence manifest; do not infer identity execution from family tests.; Decide active-pack inclusion versus explicit rules-only boundary; do not bulk-register identities.; Select one representative Gate C path with browser/WS/reconnect/stale evidence before widening.
- required reviewer: Reviewer A for pack/source evidence, then Reviewer R for acceptance; Reviewer A, followed by Reviewer R where runtime behavior is claimed; Reviewer R / Gate C reviewer; Reviewer R, Gate C reviewer for private hand selection
- dependency order: 1, 3, 4, 5
- affected identities: servant.boudica.skill.sc-boudica-3, servant.constantine.skill.sc-constantine-1, servant.drake.skill.sc-drake-1, servant.hephaistion.skill.sc-hephaistion-3, servant.iskandar.skill.sc-iskandar-1, servant.ivan.skill.sc-ivan-3, servant.mandricardo.skill.sc-mandricardo-3, servant.martha.skill.sc-martha-3, servant.medb.skill.sc-medb-1, servant.medusa.skill.sc-medusa-1, servant.odysseus.skill.sc-odysseus-3, servant.roberts.skill.sc-roberts-3, servant.teach.skill.sc-teach-3, servant.ushiwakamaru.skill.sc-ushiwakamaru-3

### TERRITORY_CREATION

- identity count: 10
- shared runtime contract: FB2-11/R34: round formula plus Magic Workshop deployment reward
- registry status: PACK_SOURCE_EXCLUDED
- gap counts: {"COMPILER_UNSUPPORTED":10,"GATE_C_PENDING":10,"GENERATED_REGISTRY_MISSING":10,"LEGACY_ONLY":10,"TEST_EVIDENCE_UNBOUND":10}
- gap owner: Codex A / Evidence Owner; Codex B / Compiler Owner; Codex B / Runtime Owner; Codex B for runtime path plus Codex A for evidence packet; Codex S / Content Pack Owner
- smallest repair slice: A112-TERRITORY-EVIDENCE: bind formula and deployment reward subcontracts; Add one typed compiler contract and negative tests for the exact primitive shape.; Create an exact identity evidence manifest; do not infer identity execution from family tests.; Decide active-pack inclusion versus explicit rules-only boundary; do not bulk-register identities.; Select one representative Gate C path with browser/WS/reconnect/stale evidence before widening.
- required reviewer: Reviewer A for pack/source evidence, then Reviewer R for acceptance; Reviewer A, followed by Reviewer R where runtime behavior is claimed; Reviewer R; Reviewer R / Gate C reviewer
- dependency order: 1, 2, 3, 4, 5
- affected identities: servant.anastasia.skill.sc-anastasia-1, servant.andersen.skill.sc-andersen-1, servant.avicebron.skill.sc-avicebron-3, servant.kinggil.skill.sc-kinggil-1, servant.ladyavalon.skill.sc-ladyavalon-3, servant.maxwell.skill.sc-maxwell-1, servant.mephisto.skill.sc-mephisto-1, servant.mozart.skill.sc-mozart-3, servant.semiramis.skill.sc-semiramis-2, servant.shakespeare.skill.sc-shakespeare-1

## Non-Claims

- This decomposition does not change migration acceptance, main coverage, taxonomy, Gate status, or runtime behavior.
- Family contracts are planning/evidence references; they do not create identity-specific execution proof.
- No B batch is authorized by this report. Each repair slice requires its own handoff and independent review.
