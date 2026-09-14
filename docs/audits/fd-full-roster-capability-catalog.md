# FD Full-Roster Phase 3 Capability Catalog

- Document Role: AUDIT
- Status: PHASE_3_FS04_CONTRACT_MAPPED
- Reference Policy: Reference handler names/routes are observational only and never create capabilities.
- Card Action Policy: PLAY, ADD_TO_ATTACK, CREATE_AND_ACTIVATE, ACTIVATE, and CLOSE remain independent contracts.
- Fallback Policy: zero silent fallback; every canonical identity is mapped or explicitly blocked.

totalIdentityCount=944
contractMappedCount=99
explicitBlockCount=845
capabilityCount=32
zeroSilentFallback=true

## Capability Summary

| Capability | Category | Family | Eligible | Partial | Skipped | Acceptance Vehicle |
|---|---|---|---:|---:|---:|---|
| `CARD_ACTION_ACTIVATE` | `generic_request` | `CARD_ACTION_SEMANTICS` | 0 | 0 | 22 | new Phase 3 capability request + Gate A/B/C representative |
| `CARD_ACTION_ADD_TO_ATTACK` | `generic_request` | `CARD_ACTION_SEMANTICS` | 2 | 0 | 20 | new Phase 3 capability request + Gate A/B/C representative |
| `CARD_ACTION_CLOSE` | `generic_request` | `CARD_ACTION_SEMANTICS` | 12 | 0 | 10 | new Phase 3 capability request + Gate A/B/C representative |
| `CARD_ACTION_CREATE_AND_ACTIVATE` | `generic_request` | `CARD_ACTION_SEMANTICS` | 1 | 0 | 21 | new Phase 3 capability request + Gate A/B/C representative |
| `CARD_ACTION_PLAY` | `generic_request` | `CARD_ACTION_SEMANTICS` | 8 | 0 | 14 | new Phase 3 capability request + Gate A/B/C representative |
| `CARD_ACTION_SEMANTICS_MINIMAL_ACTIVATE` | `existing_contract` | `CARD_ACTION_SEMANTICS` | 0 | 0 | 22 | Olga first-loss Gate A/B/C candidate |
| `CARD_ACTION_SEMANTICS_MINIMAL_ADD_TO_ATTACK` | `existing_contract` | `CARD_ACTION_SEMANTICS` | 0 | 1 | 22 | Maiya Gate A/B/C candidate |
| `CARD_ACTION_SEMANTICS_MINIMAL_CLOSE` | `existing_contract` | `CARD_ACTION_SEMANTICS` | 0 | 1 | 22 | Artoria Alter Gate A/B/C candidate |
| `CARD_ACTION_SEMANTICS_MINIMAL_PLAY` | `existing_contract` | `CARD_ACTION_SEMANTICS` | 0 | 0 | 22 | Time Alter Gate A/B/C candidate |
| `CARD_ACTION_SEMANTICS_MINIMAL_PLAY_SOURCE_CARD_WITH_COST_RESPONSE` | `existing_contract` | `CARD_ACTION_SEMANTICS` | 0 | 0 | 22 | Volumen Gate A/B/C candidate |
| `CARD_ZONE_CORE_DIRECT_ACTION` | `existing_contract` | `CARD_ZONE` | 0 | 0 | 28 | Mechanic Batch Gate A/B/C representative evidence |
| `GENERIC_BATTLE_INTEGRATION` | `generic_request` | `BATTLE_RESULT` | 40 | 0 | 0 | new Phase 3 capability request + Gate A/B/C representative |
| `GENERIC_CARD_CREATE` | `generic_request` | `CARD_ZONE` | 3 | 0 | 25 | new Phase 3 capability request + Gate A/B/C representative |
| `GENERIC_CARD_ZONE` | `generic_request` | `CARD_ZONE` | 25 | 0 | 3 | new Phase 3 capability request + Gate A/B/C representative |
| `GENERIC_CONDITION_EVALUATION` | `generic_request` | `CONDITION` | 83 | 0 | 0 | new Phase 3 capability request + Gate A/B/C representative |
| `GENERIC_COST_PAYMENT` | `generic_request` | `COST_PAYMENT` | 5 | 0 | 0 | new Phase 3 capability request + Gate A/B/C representative |
| `GENERIC_EVENT_DECK` | `generic_request` | `SPECIAL_SUBSYSTEM` | 7 | 0 | 8 | new Phase 3 capability request + Gate A/B/C representative |
| `GENERIC_LIFECYCLE_POLICY` | `generic_request` | `LIFECYCLE` | 44 | 0 | 7 | new Phase 3 capability request + Gate A/B/C representative |
| `GENERIC_MODIFIER` | `generic_request` | `MODIFIER` | 43 | 0 | 0 | new Phase 3 capability request + Gate A/B/C representative |
| `GENERIC_MOVEMENT` | `generic_request` | `MOVEMENT` | 2 | 0 | 0 | new Phase 3 capability request + Gate A/B/C representative |
| `GENERIC_PENDING_INTERACTION` | `generic_request` | `INTERACTION` | 35 | 0 | 0 | new Phase 3 capability request + Gate A/B/C representative |
| `GENERIC_POWER` | `generic_request` | `POWER` | 10 | 0 | 0 | new Phase 3 capability request + Gate A/B/C representative |
| `GENERIC_RESOURCE_NUMERIC` | `generic_request` | `RESOURCE_NUMERIC` | 28 | 0 | 0 | new Phase 3 capability request + Gate A/B/C representative |
| `GENERIC_RESULT_BINDING` | `generic_request` | `RESULT_BINDING` | 28 | 0 | 0 | new Phase 3 capability request + Gate A/B/C representative |
| `GENERIC_STATUS_STATE` | `generic_request` | `LIFECYCLE` | 16 | 0 | 35 | new Phase 3 capability request + Gate A/B/C representative |
| `GENERIC_TARGET_SELECTION` | `generic_request` | `TARGET_SELECTION` | 35 | 0 | 0 | new Phase 3 capability request + Gate A/B/C representative |
| `GENERIC_TRIGGER_GATEWAY` | `generic_request` | `TRIGGER` | 50 | 0 | 0 | new Phase 3 capability request + Gate A/B/C representative |
| `GENERIC_VISIBILITY` | `generic_request` | `HIDDEN_INFORMATION` | 34 | 0 | 0 | new Phase 3 capability request + Gate A/B/C representative |
| `RESOURCE_NUMERIC_CORE_DIRECT_ACTION` | `existing_contract` | `RESOURCE_NUMERIC` | 0 | 1 | 28 | Mechanic Batch Gate A/B/C representative evidence |
| `RESULT_BINDING_PHASE3A` | `existing_contract` | `RESULT_BINDING` | 0 | 1 | 28 | Golden Eater Gate A/B/C candidate |
| `REVIEWED_SPECIAL_HANDLER` | `reviewed_special` | `SPECIAL_SUBSYSTEM` | 7 | 0 | 8 | B/R reviewed-special exception with explicit deletion/reuse criteria |
| `REVIEWED_SPECIAL_TRANSFORM` | `reviewed_special` | `SPECIAL_SUBSYSTEM` | 1 | 0 | 14 | B/R reviewed-special exception with explicit deletion/reuse criteria |

## Identity Mapping

| Canonical Ability | Mapping Route | Current Route | Reference Route | Mechanic Families | Required Capabilities | Inherited Contracts | Partial Contracts | Blocks |
|---|---|---|---|---|---|---|---|---|
| `master.akasha.skill.ascension` | `SOURCE_EVIDENCE_REQUIRED` | `none` | `shared_handler` | `NONE` | `NONE` | `NONE` | `NONE` | `SEMANTIC_SOURCE_REQUIRED` |
| `master.akasha.skill.s1` | `READY_GENERIC_EXTENSION` | `none` | `shared_handler` | `CARD_ZONE`, `LIFECYCLE`, `TRIGGER` | `GENERIC_CARD_CREATE`, `GENERIC_LIFECYCLE_POLICY`, `GENERIC_TRIGGER_GATEWAY` | `NONE` | `NONE` | `NONE` |
| `master.akasha.skill.s1a` | `SOURCE_EVIDENCE_REQUIRED` | `none` | `shared_handler` | `NONE` | `NONE` | `NONE` | `NONE` | `SEMANTIC_SOURCE_REQUIRED` |
| `master.akasha.skill.s2` | `SOURCE_EVIDENCE_REQUIRED` | `none` | `shared_handler` | `NONE` | `NONE` | `NONE` | `NONE` | `SEMANTIC_SOURCE_REQUIRED` |
| `master.akasha.skill.s3` | `SOURCE_EVIDENCE_REQUIRED` | `none` | `shared_handler` | `NONE` | `NONE` | `NONE` | `NONE` | `SEMANTIC_SOURCE_REQUIRED` |
| `master.akasha.skill.s4` | `SOURCE_EVIDENCE_REQUIRED` | `none` | `shared_handler` | `NONE` | `NONE` | `NONE` | `NONE` | `SEMANTIC_SOURCE_REQUIRED` |
| `master.akasha.skill.s5` | `SOURCE_EVIDENCE_REQUIRED` | `none` | `shared_handler` | `NONE` | `NONE` | `NONE` | `NONE` | `SEMANTIC_SOURCE_REQUIRED` |
| `master.akasha.skill.s6` | `SOURCE_EVIDENCE_REQUIRED` | `none` | `shared_handler` | `NONE` | `NONE` | `NONE` | `NONE` | `SEMANTIC_SOURCE_REQUIRED` |
| `master.akiha.skill.ascension` | `SOURCE_EVIDENCE_REQUIRED` | `none` | `shared_handler` | `NONE` | `NONE` | `NONE` | `NONE` | `SEMANTIC_SOURCE_REQUIRED` |
| `master.akiha.skill.s1` | `SOURCE_EVIDENCE_REQUIRED` | `none` | `shared_handler` | `NONE` | `NONE` | `NONE` | `NONE` | `SEMANTIC_SOURCE_REQUIRED` |
| `master.akiha.skill.s1a` | `SOURCE_EVIDENCE_REQUIRED` | `none` | `shared_handler` | `NONE` | `NONE` | `NONE` | `NONE` | `SEMANTIC_SOURCE_REQUIRED` |
| `master.akiha.skill.s2` | `SOURCE_EVIDENCE_REQUIRED` | `none` | `shared_handler` | `NONE` | `NONE` | `NONE` | `NONE` | `SEMANTIC_SOURCE_REQUIRED` |
| `master.akiha.skill.s3` | `SOURCE_EVIDENCE_REQUIRED` | `none` | `shared_handler` | `NONE` | `NONE` | `NONE` | `NONE` | `SEMANTIC_SOURCE_REQUIRED` |
| `master.alice.skill.ascension` | `SOURCE_EVIDENCE_REQUIRED` | `none` | `shared_handler` | `NONE` | `NONE` | `NONE` | `NONE` | `SEMANTIC_SOURCE_REQUIRED` |
| `master.alice.skill.s1` | `SOURCE_EVIDENCE_REQUIRED` | `none` | `shared_handler` | `NONE` | `NONE` | `NONE` | `NONE` | `SEMANTIC_SOURCE_REQUIRED` |
| `master.alice.skill.s2` | `SOURCE_EVIDENCE_REQUIRED` | `none` | `shared_handler` | `NONE` | `NONE` | `NONE` | `NONE` | `SEMANTIC_SOURCE_REQUIRED` |
| `master.amakusa.skill.ascension` | `SOURCE_EVIDENCE_REQUIRED` | `none` | `specific_handler` | `NONE` | `NONE` | `NONE` | `NONE` | `SEMANTIC_SOURCE_REQUIRED` |
| `master.amakusa.skill.s1` | `READY_GENERIC_EXTENSION` | `none` | `shared_handler` | `CONDITION`, `LIFECYCLE`, `TRIGGER` | `GENERIC_CONDITION_EVALUATION`, `GENERIC_STATUS_STATE`, `GENERIC_TRIGGER_GATEWAY` | `NONE` | `NONE` | `NONE` |
| `master.amakusa.skill.s1a` | `READY_GENERIC_EXTENSION` | `none` | `shared_handler` | `CONDITION`, `HIDDEN_INFORMATION`, `INTERACTION`, `LIFECYCLE`, `MODIFIER`, `RESULT_BINDING`, `TARGET_SELECTION` | `GENERIC_CONDITION_EVALUATION`, `GENERIC_LIFECYCLE_POLICY`, `GENERIC_MODIFIER`, `GENERIC_PENDING_INTERACTION`, `GENERIC_RESULT_BINDING`, `GENERIC_STATUS_STATE`, `GENERIC_TARGET_SELECTION`, `GENERIC_VISIBILITY` | `NONE` | `NONE` | `NONE` |
| `master.amakusa.skill.s2` | `READY_GENERIC_EXTENSION` | `none` | `shared_handler` | `CONDITION`, `INTERACTION`, `LIFECYCLE`, `TARGET_SELECTION`, `TRIGGER` | `GENERIC_CONDITION_EVALUATION`, `GENERIC_PENDING_INTERACTION`, `GENERIC_STATUS_STATE`, `GENERIC_TARGET_SELECTION`, `GENERIC_TRIGGER_GATEWAY` | `NONE` | `NONE` | `NONE` |
| `master.amakusa.skill.s3` | `SOURCE_EVIDENCE_REQUIRED` | `none` | `specific_handler` | `NONE` | `NONE` | `NONE` | `NONE` | `SEMANTIC_SOURCE_REQUIRED` |
| `master.araya.skill.ascension` | `SOURCE_EVIDENCE_REQUIRED` | `none` | `specific_handler` | `NONE` | `NONE` | `NONE` | `NONE` | `SEMANTIC_SOURCE_REQUIRED` |
| `master.araya.skill.s1` | `SOURCE_EVIDENCE_REQUIRED` | `none` | `specific_handler` | `NONE` | `NONE` | `NONE` | `NONE` | `SEMANTIC_SOURCE_REQUIRED` |
| `master.araya.skill.s1a` | `READY_GENERIC_EXTENSION` | `none` | `shared_handler` | `BATTLE_RESULT`, `CARD_ZONE`, `CONDITION`, `INTERACTION`, `RESOURCE_NUMERIC`, `RESULT_BINDING`, `TARGET_SELECTION`, `TRIGGER` | `GENERIC_BATTLE_INTEGRATION`, `GENERIC_CARD_ZONE`, `GENERIC_CONDITION_EVALUATION`, `GENERIC_PENDING_INTERACTION`, `GENERIC_RESOURCE_NUMERIC`, `GENERIC_RESULT_BINDING`, `GENERIC_TARGET_SELECTION`, `GENERIC_TRIGGER_GATEWAY` | `NONE` | `NONE` | `NONE` |
| `master.arcueid.skill.ascension` | `SOURCE_EVIDENCE_REQUIRED` | `none` | `shared_handler` | `NONE` | `NONE` | `NONE` | `NONE` | `SEMANTIC_SOURCE_REQUIRED` |
| `master.arcueid.skill.s1` | `READY_GENERIC_EXTENSION` | `none` | `shared_handler` | `CARD_ZONE`, `CONDITION`, `HIDDEN_INFORMATION`, `TRIGGER` | `GENERIC_CARD_ZONE`, `GENERIC_CONDITION_EVALUATION`, `GENERIC_TRIGGER_GATEWAY`, `GENERIC_VISIBILITY` | `NONE` | `NONE` | `NONE` |
| `master.arcueid.skill.s1a` | `READY_GENERIC_EXTENSION` | `none` | `shared_handler` | `BATTLE_RESULT`, `CARD_ZONE`, `CONDITION`, `INTERACTION`, `LIFECYCLE`, `TARGET_SELECTION`, `TRIGGER` | `GENERIC_BATTLE_INTEGRATION`, `GENERIC_CARD_CREATE`, `GENERIC_CONDITION_EVALUATION`, `GENERIC_LIFECYCLE_POLICY`, `GENERIC_PENDING_INTERACTION`, `GENERIC_STATUS_STATE`, `GENERIC_TARGET_SELECTION`, `GENERIC_TRIGGER_GATEWAY` | `NONE` | `NONE` | `NONE` |
| `master.arcueid.skill.s2` | `SOURCE_EVIDENCE_REQUIRED` | `none` | `specific_handler` | `NONE` | `NONE` | `NONE` | `NONE` | `SEMANTIC_SOURCE_REQUIRED` |
| `master.arcueid.skill.s3` | `READY_GENERIC_EXTENSION` | `none` | `shared_handler` | `CONDITION`, `MODIFIER`, `RESOURCE_NUMERIC`, `TRIGGER` | `GENERIC_CONDITION_EVALUATION`, `GENERIC_MODIFIER`, `GENERIC_RESOURCE_NUMERIC`, `GENERIC_TRIGGER_GATEWAY` | `NONE` | `NONE` | `NONE` |
| `master.artoira.skill.ascension` | `SOURCE_EVIDENCE_REQUIRED` | `none` | `specific_handler` | `NONE` | `NONE` | `NONE` | `NONE` | `SEMANTIC_SOURCE_REQUIRED` |
| `master.artoira.skill.s1` | `SOURCE_EVIDENCE_REQUIRED` | `none` | `specific_handler` | `NONE` | `NONE` | `NONE` | `NONE` | `SEMANTIC_SOURCE_REQUIRED` |
| `master.bazett.skill.ascension` | `READY_GENERIC_EXTENSION` | `none` | `specific_handler` | `MODIFIER` | `GENERIC_MODIFIER` | `NONE` | `NONE` | `NONE` |
| `master.bazett.skill.s1` | `READY_GENERIC_EXTENSION` | `none` | `shared_handler` | `CARD_ZONE` | `GENERIC_CARD_CREATE` | `NONE` | `NONE` | `NONE` |
| `master.bazett.skill.s1a` | `READY_GENERIC_EXTENSION` | `none` | `shared_handler` | `BATTLE_RESULT`, `CONDITION`, `LIFECYCLE`, `RESOURCE_NUMERIC`, `TRIGGER` | `GENERIC_BATTLE_INTEGRATION`, `GENERIC_CONDITION_EVALUATION`, `GENERIC_RESOURCE_NUMERIC`, `GENERIC_STATUS_STATE`, `GENERIC_TRIGGER_GATEWAY` | `NONE` | `NONE` | `NONE` |
| `master.bazett.skill.s1b` | `READY_GENERIC_EXTENSION` | `none` | `shared_handler` | `LIFECYCLE`, `MODIFIER` | `GENERIC_LIFECYCLE_POLICY`, `GENERIC_MODIFIER` | `NONE` | `NONE` | `NONE` |
| `master.bazett.skill.s1c` | `READY_GENERIC_EXTENSION` | `none` | `shared_handler` | `BATTLE_RESULT`, `CONDITION`, `LIFECYCLE`, `MODIFIER`, `RESOURCE_NUMERIC`, `TRIGGER` | `GENERIC_BATTLE_INTEGRATION`, `GENERIC_CONDITION_EVALUATION`, `GENERIC_LIFECYCLE_POLICY`, `GENERIC_MODIFIER`, `GENERIC_RESOURCE_NUMERIC`, `GENERIC_TRIGGER_GATEWAY` | `NONE` | `NONE` | `NONE` |
| `master.bazett.skill.s1d` | `READY_GENERIC_EXTENSION` | `none` | `shared_handler` | `BATTLE_RESULT`, `CONDITION`, `LIFECYCLE`, `TRIGGER` | `GENERIC_BATTLE_INTEGRATION`, `GENERIC_CONDITION_EVALUATION`, `GENERIC_STATUS_STATE`, `GENERIC_TRIGGER_GATEWAY` | `NONE` | `NONE` | `NONE` |
| `master.bazett.skill.s2` | `SPECIAL_HANDLER_CANDIDATE` | `none` | `specific_handler` | `CONDITION`, `LIFECYCLE`, `SPECIAL_SUBSYSTEM`, `TRIGGER` | `GENERIC_CONDITION_EVALUATION`, `GENERIC_LIFECYCLE_POLICY`, `GENERIC_TRIGGER_GATEWAY`, `REVIEWED_SPECIAL_HANDLER` | `NONE` | `NONE` | `SPECIAL_EFFECT:defeat_player` |
| `master.bazett.skill.s3` | `READY_GENERIC_EXTENSION` | `none` | `shared_handler` | `CONDITION`, `LIFECYCLE`, `RESOURCE_NUMERIC`, `TRIGGER` | `GENERIC_CONDITION_EVALUATION`, `GENERIC_RESOURCE_NUMERIC`, `GENERIC_STATUS_STATE`, `GENERIC_TRIGGER_GATEWAY` | `NONE` | `NONE` | `NONE` |
| `master.bazett.skill.s4` | `READY_GENERIC_EXTENSION` | `none` | `shared_handler` | `CARD_ZONE`, `RESOURCE_NUMERIC` | `GENERIC_CARD_ZONE`, `GENERIC_RESOURCE_NUMERIC` | `NONE` | `NONE` | `NONE` |
| `master.bazett.skill.s5` | `READY_GENERIC_EXTENSION` | `none` | `specific_handler` | `BATTLE_RESULT`, `CARD_ACTION_SEMANTICS`, `CONDITION`, `RESOURCE_NUMERIC`, `TRIGGER` | `CARD_ACTION_ADD_TO_ATTACK`, `GENERIC_BATTLE_INTEGRATION`, `GENERIC_CONDITION_EVALUATION`, `GENERIC_RESOURCE_NUMERIC`, `GENERIC_TRIGGER_GATEWAY` | `NONE` | `NONE` | `NONE` |
| `master.caren.skill.ascension` | `SOURCE_EVIDENCE_REQUIRED` | `none` | `specific_handler` | `NONE` | `NONE` | `NONE` | `NONE` | `SEMANTIC_SOURCE_REQUIRED` |
| `master.caren.skill.s1` | `SOURCE_EVIDENCE_REQUIRED` | `none` | `specific_handler` | `NONE` | `NONE` | `NONE` | `NONE` | `SEMANTIC_SOURCE_REQUIRED` |
| `master.caren.skill.s1a` | `SOURCE_EVIDENCE_REQUIRED` | `none` | `specific_handler` | `NONE` | `NONE` | `NONE` | `NONE` | `SEMANTIC_SOURCE_REQUIRED` |
| `master.caren.skill.s2` | `SOURCE_EVIDENCE_REQUIRED` | `none` | `specific_handler` | `NONE` | `NONE` | `NONE` | `NONE` | `SEMANTIC_SOURCE_REQUIRED` |
| `master.caren.skill.s3` | `SOURCE_EVIDENCE_REQUIRED` | `none` | `specific_handler` | `NONE` | `NONE` | `NONE` | `NONE` | `SEMANTIC_SOURCE_REQUIRED` |
| `master.caules-yggdmillennia.skill.ascension` | `SOURCE_EVIDENCE_REQUIRED` | `none` | `specific_handler` | `NONE` | `NONE` | `NONE` | `NONE` | `SEMANTIC_SOURCE_REQUIRED` |
| `master.caules-yggdmillennia.skill.s1` | `SOURCE_EVIDENCE_REQUIRED` | `none` | `shared_handler` | `NONE` | `NONE` | `NONE` | `NONE` | `SEMANTIC_SOURCE_REQUIRED` |
| `master.caules-yggdmillennia.skill.s1a` | `SOURCE_EVIDENCE_REQUIRED` | `none` | `shared_handler` | `NONE` | `NONE` | `NONE` | `NONE` | `SEMANTIC_SOURCE_REQUIRED` |
| `master.caules-yggdmillennia.skill.s2` | `SOURCE_EVIDENCE_REQUIRED` | `none` | `shared_handler` | `NONE` | `NONE` | `NONE` | `NONE` | `SEMANTIC_SOURCE_REQUIRED` |
| `master.caules-yggdmillennia.skill.s3` | `SOURCE_EVIDENCE_REQUIRED` | `none` | `specific_handler` | `NONE` | `NONE` | `NONE` | `NONE` | `SEMANTIC_SOURCE_REQUIRED` |
| `master.caules.skill.ascension` | `SOURCE_EVIDENCE_REQUIRED` | `none` | `specific_handler` | `NONE` | `NONE` | `NONE` | `NONE` | `SEMANTIC_SOURCE_REQUIRED` |
| `master.caules.skill.s1` | `SOURCE_EVIDENCE_REQUIRED` | `none` | `specific_handler` | `NONE` | `NONE` | `NONE` | `NONE` | `SEMANTIC_SOURCE_REQUIRED` |
| `master.caules.skill.s1a` | `SOURCE_EVIDENCE_REQUIRED` | `none` | `shared_handler` | `NONE` | `NONE` | `NONE` | `NONE` | `SEMANTIC_SOURCE_REQUIRED` |
| `master.caules.skill.s2` | `SOURCE_EVIDENCE_REQUIRED` | `none` | `specific_handler` | `NONE` | `NONE` | `NONE` | `NONE` | `SEMANTIC_SOURCE_REQUIRED` |
| `master.caules.skill.s3` | `SOURCE_EVIDENCE_REQUIRED` | `none` | `specific_handler` | `NONE` | `NONE` | `NONE` | `NONE` | `SEMANTIC_SOURCE_REQUIRED` |
| `master.celenike.skill.ascension` | `SOURCE_EVIDENCE_REQUIRED` | `none` | `specific_handler` | `NONE` | `NONE` | `NONE` | `NONE` | `SEMANTIC_SOURCE_REQUIRED` |
| `master.celenike.skill.s1` | `SOURCE_EVIDENCE_REQUIRED` | `none` | `specific_handler` | `NONE` | `NONE` | `NONE` | `NONE` | `SEMANTIC_SOURCE_REQUIRED` |
| `master.celenike.skill.s1a` | `SOURCE_EVIDENCE_REQUIRED` | `none` | `specific_handler` | `NONE` | `NONE` | `NONE` | `NONE` | `SEMANTIC_SOURCE_REQUIRED` |
| `master.chaos.skill.ascension` | `READY_GENERIC_EXTENSION` | `none` | `shared_handler` | `CARD_ZONE`, `COST_PAYMENT`, `MODIFIER` | `GENERIC_CARD_ZONE`, `GENERIC_COST_PAYMENT`, `GENERIC_MODIFIER` | `NONE` | `NONE` | `NONE` |
| `master.chaos.skill.s1` | `READY_GENERIC_EXTENSION` | `none` | `shared_handler` | `CARD_ACTION_SEMANTICS`, `CARD_ZONE`, `CONDITION`, `COST_PAYMENT`, `INTERACTION`, `LIFECYCLE`, `RESULT_BINDING`, `TARGET_SELECTION`, `TRIGGER` | `CARD_ACTION_PLAY`, `GENERIC_CARD_ZONE`, `GENERIC_CONDITION_EVALUATION`, `GENERIC_COST_PAYMENT`, `GENERIC_LIFECYCLE_POLICY`, `GENERIC_PENDING_INTERACTION`, `GENERIC_RESULT_BINDING`, `GENERIC_STATUS_STATE`, `GENERIC_TARGET_SELECTION`, `GENERIC_TRIGGER_GATEWAY` | `NONE` | `NONE` | `NONE` |
| `master.chaos.skill.s10` | `READY_GENERIC_EXTENSION` | `none` | `shared_handler` | `MODIFIER` | `GENERIC_MODIFIER` | `NONE` | `NONE` | `NONE` |
| `master.chaos.skill.s11` | `READY_GENERIC_EXTENSION` | `none` | `shared_handler` | `CARD_ACTION_SEMANTICS`, `CONDITION`, `LIFECYCLE`, `MODIFIER`, `TRIGGER` | `CARD_ACTION_CLOSE`, `GENERIC_CONDITION_EVALUATION`, `GENERIC_LIFECYCLE_POLICY`, `GENERIC_MODIFIER`, `GENERIC_TRIGGER_GATEWAY` | `NONE` | `NONE` | `NONE` |
| `master.chaos.skill.s12` | `READY_GENERIC_EXTENSION` | `none` | `shared_handler` | `INTERACTION`, `MODIFIER`, `MOVEMENT`, `POWER`, `RESULT_BINDING`, `TARGET_SELECTION` | `GENERIC_MODIFIER`, `GENERIC_MOVEMENT`, `GENERIC_PENDING_INTERACTION`, `GENERIC_POWER`, `GENERIC_RESULT_BINDING`, `GENERIC_TARGET_SELECTION` | `NONE` | `NONE` | `NONE` |
| `master.chaos.skill.s13` | `READY_GENERIC_EXTENSION` | `none` | `shared_handler` | `CARD_ZONE`, `INTERACTION`, `RESULT_BINDING`, `SPECIAL_SUBSYSTEM`, `TARGET_SELECTION` | `GENERIC_CARD_ZONE`, `GENERIC_EVENT_DECK`, `GENERIC_PENDING_INTERACTION`, `GENERIC_RESULT_BINDING`, `GENERIC_TARGET_SELECTION` | `NONE` | `NONE` | `NONE` |
| `master.chaos.skill.s14` | `READY_GENERIC_EXTENSION` | `none` | `specific_handler` | `MODIFIER` | `GENERIC_MODIFIER` | `NONE` | `NONE` | `NONE` |
| `master.chaos.skill.s15` | `READY_GENERIC_EXTENSION` | `none` | `shared_handler` | `MODIFIER` | `GENERIC_MODIFIER` | `NONE` | `NONE` | `NONE` |
| `master.chaos.skill.s16` | `READY_GENERIC_EXTENSION` | `none` | `shared_handler` | `CARD_ZONE`, `CONDITION`, `MODIFIER`, `POWER`, `RESULT_BINDING`, `TRIGGER` | `GENERIC_CARD_ZONE`, `GENERIC_CONDITION_EVALUATION`, `GENERIC_MODIFIER`, `GENERIC_POWER`, `GENERIC_RESULT_BINDING`, `GENERIC_TRIGGER_GATEWAY` | `NONE` | `NONE` | `NONE` |
| `master.chaos.skill.s17` | `SOURCE_EVIDENCE_REQUIRED` | `none` | `shared_handler` | `NONE` | `NONE` | `NONE` | `NONE` | `SEMANTIC_SOURCE_REQUIRED` |
| `master.chaos.skill.s2` | `READY_GENERIC_EXTENSION` | `none` | `specific_handler` | `BATTLE_RESULT`, `MODIFIER`, `POWER` | `GENERIC_BATTLE_INTEGRATION`, `GENERIC_MODIFIER`, `GENERIC_POWER` | `NONE` | `NONE` | `NONE` |
| `master.chaos.skill.s3` | `READY_GENERIC_EXTENSION` | `none` | `shared_handler` | `CARD_ZONE`, `INTERACTION`, `RESOURCE_NUMERIC`, `RESULT_BINDING`, `TARGET_SELECTION`, `TRIGGER` | `GENERIC_CARD_ZONE`, `GENERIC_PENDING_INTERACTION`, `GENERIC_RESOURCE_NUMERIC`, `GENERIC_RESULT_BINDING`, `GENERIC_TARGET_SELECTION`, `GENERIC_TRIGGER_GATEWAY` | `NONE` | `NONE` | `NONE` |
| `master.chaos.skill.s4` | `READY_GENERIC_EXTENSION` | `none` | `shared_handler` | `CARD_ZONE`, `CONDITION`, `INTERACTION`, `LIFECYCLE`, `RESULT_BINDING`, `TARGET_SELECTION`, `TRIGGER` | `GENERIC_CARD_ZONE`, `GENERIC_CONDITION_EVALUATION`, `GENERIC_LIFECYCLE_POLICY`, `GENERIC_PENDING_INTERACTION`, `GENERIC_RESULT_BINDING`, `GENERIC_TARGET_SELECTION`, `GENERIC_TRIGGER_GATEWAY` | `NONE` | `NONE` | `NONE` |
| `master.chaos.skill.s5` | `READY_GENERIC_EXTENSION` | `none` | `specific_handler` | `CONDITION`, `LIFECYCLE`, `MODIFIER`, `TRIGGER` | `GENERIC_CONDITION_EVALUATION`, `GENERIC_LIFECYCLE_POLICY`, `GENERIC_MODIFIER`, `GENERIC_TRIGGER_GATEWAY` | `NONE` | `NONE` | `NONE` |
| `master.chaos.skill.s6` | `READY_GENERIC_EXTENSION` | `none` | `shared_handler` | `BATTLE_RESULT`, `CARD_ZONE`, `CONDITION`, `TRIGGER` | `GENERIC_BATTLE_INTEGRATION`, `GENERIC_CARD_ZONE`, `GENERIC_CONDITION_EVALUATION`, `GENERIC_TRIGGER_GATEWAY` | `NONE` | `NONE` | `NONE` |
| `master.chaos.skill.s7` | `READY_GENERIC_EXTENSION` | `none` | `specific_handler` | `BATTLE_RESULT`, `CONDITION`, `RESOURCE_NUMERIC`, `TRIGGER` | `GENERIC_BATTLE_INTEGRATION`, `GENERIC_CONDITION_EVALUATION`, `GENERIC_RESOURCE_NUMERIC`, `GENERIC_TRIGGER_GATEWAY` | `NONE` | `NONE` | `NONE` |
| `master.chaos.skill.s8` | `SPECIAL_HANDLER_CANDIDATE` | `none` | `specific_handler` | `INTERACTION`, `RESULT_BINDING`, `SPECIAL_SUBSYSTEM`, `TARGET_SELECTION` | `GENERIC_PENDING_INTERACTION`, `GENERIC_RESULT_BINDING`, `GENERIC_TARGET_SELECTION`, `REVIEWED_SPECIAL_HANDLER` | `NONE` | `NONE` | `SPECIAL_EFFECT:defeat_player` |
| `master.chaos.skill.s9` | `READY_GENERIC_EXTENSION` | `none` | `specific_handler` | `MODIFIER` | `GENERIC_MODIFIER` | `NONE` | `NONE` | `NONE` |
| `master.ciel.skill.ascension` | `SOURCE_EVIDENCE_REQUIRED` | `none` | `shared_handler` | `NONE` | `NONE` | `NONE` | `NONE` | `SEMANTIC_SOURCE_REQUIRED` |
| `master.ciel.skill.s1` | `SOURCE_EVIDENCE_REQUIRED` | `none` | `specific_handler` | `NONE` | `NONE` | `NONE` | `NONE` | `SEMANTIC_SOURCE_REQUIRED` |
| `master.ciel.skill.s1a` | `SOURCE_EVIDENCE_REQUIRED` | `none` | `shared_handler` | `NONE` | `NONE` | `NONE` | `NONE` | `SEMANTIC_SOURCE_REQUIRED` |
| `master.ciel.skill.s1b` | `READY_GENERIC_EXTENSION` | `none` | `shared_handler` | `CARD_ZONE`, `CONDITION`, `HIDDEN_INFORMATION`, `TRIGGER` | `GENERIC_CARD_ZONE`, `GENERIC_CONDITION_EVALUATION`, `GENERIC_TRIGGER_GATEWAY`, `GENERIC_VISIBILITY` | `NONE` | `NONE` | `NONE` |
| `master.ciel.skill.s2` | `READY_GENERIC_EXTENSION` | `none` | `shared_handler` | `BATTLE_RESULT`, `CONDITION`, `RESOURCE_NUMERIC`, `TRIGGER` | `GENERIC_BATTLE_INTEGRATION`, `GENERIC_CONDITION_EVALUATION`, `GENERIC_RESOURCE_NUMERIC`, `GENERIC_TRIGGER_GATEWAY` | `NONE` | `NONE` | `NONE` |
| `master.ciel.skill.s3` | `READY_GENERIC_EXTENSION` | `none` | `shared_handler` | `BATTLE_RESULT`, `CONDITION`, `LIFECYCLE`, `MODIFIER` | `GENERIC_BATTLE_INTEGRATION`, `GENERIC_CONDITION_EVALUATION`, `GENERIC_LIFECYCLE_POLICY`, `GENERIC_MODIFIER`, `GENERIC_STATUS_STATE` | `NONE` | `NONE` | `NONE` |
| `master.dan.skill.ascension` | `SOURCE_EVIDENCE_REQUIRED` | `none` | `specific_handler` | `NONE` | `NONE` | `NONE` | `NONE` | `SEMANTIC_SOURCE_REQUIRED` |
| `master.dan.skill.s1` | `SOURCE_EVIDENCE_REQUIRED` | `none` | `specific_handler` | `NONE` | `NONE` | `NONE` | `NONE` | `SEMANTIC_SOURCE_REQUIRED` |
| `master.dan.skill.s1a` | `SOURCE_EVIDENCE_REQUIRED` | `none` | `specific_handler` | `NONE` | `NONE` | `NONE` | `NONE` | `SEMANTIC_SOURCE_REQUIRED` |
| `master.darnic.skill.ascension` | `SOURCE_EVIDENCE_REQUIRED` | `none` | `specific_handler` | `NONE` | `NONE` | `NONE` | `NONE` | `SEMANTIC_SOURCE_REQUIRED` |
| `master.darnic.skill.s1` | `SOURCE_EVIDENCE_REQUIRED` | `none` | `specific_handler` | `NONE` | `NONE` | `NONE` | `NONE` | `SEMANTIC_SOURCE_REQUIRED` |
| `master.darnic.skill.s1a` | `READY_GENERIC_EXTENSION` | `none` | `shared_handler` | `BATTLE_RESULT`, `CONDITION`, `INTERACTION`, `RESOURCE_NUMERIC`, `TARGET_SELECTION`, `TRIGGER` | `GENERIC_BATTLE_INTEGRATION`, `GENERIC_CONDITION_EVALUATION`, `GENERIC_PENDING_INTERACTION`, `GENERIC_RESOURCE_NUMERIC`, `GENERIC_TARGET_SELECTION`, `GENERIC_TRIGGER_GATEWAY` | `NONE` | `NONE` | `NONE` |
| `master.fiore.skill.ascension` | `SOURCE_EVIDENCE_REQUIRED` | `none` | `specific_handler` | `NONE` | `NONE` | `NONE` | `NONE` | `SEMANTIC_SOURCE_REQUIRED` |
| `master.fiore.skill.s1` | `SOURCE_EVIDENCE_REQUIRED` | `none` | `shared_handler` | `NONE` | `NONE` | `NONE` | `NONE` | `SEMANTIC_SOURCE_REQUIRED` |
| `master.fiore.skill.s1a` | `SOURCE_EVIDENCE_REQUIRED` | `none` | `specific_handler` | `NONE` | `NONE` | `NONE` | `NONE` | `SEMANTIC_SOURCE_REQUIRED` |
| `master.fiore.skill.s2` | `SOURCE_EVIDENCE_REQUIRED` | `none` | `shared_handler` | `NONE` | `NONE` | `NONE` | `NONE` | `SEMANTIC_SOURCE_REQUIRED` |
| `master.fiore.skill.s3` | `SOURCE_EVIDENCE_REQUIRED` | `none` | `shared_handler` | `NONE` | `NONE` | `NONE` | `NONE` | `SEMANTIC_SOURCE_REQUIRED` |
| `master.fiore.skill.s4` | `SOURCE_EVIDENCE_REQUIRED` | `none` | `shared_handler` | `NONE` | `NONE` | `NONE` | `NONE` | `SEMANTIC_SOURCE_REQUIRED` |
| `master.fiore.skill.s5` | `SOURCE_EVIDENCE_REQUIRED` | `none` | `specific_handler` | `NONE` | `NONE` | `NONE` | `NONE` | `SEMANTIC_SOURCE_REQUIRED` |
| `master.fiore.skill.s6` | `SOURCE_EVIDENCE_REQUIRED` | `none` | `specific_handler` | `NONE` | `NONE` | `NONE` | `NONE` | `SEMANTIC_SOURCE_REQUIRED` |
| `master.fiore.skill.s7` | `SOURCE_EVIDENCE_REQUIRED` | `none` | `specific_handler` | `NONE` | `NONE` | `NONE` | `NONE` | `SEMANTIC_SOURCE_REQUIRED` |
| `master.fou.skill.ascension` | `SOURCE_EVIDENCE_REQUIRED` | `none` | `specific_handler` | `NONE` | `NONE` | `NONE` | `NONE` | `SEMANTIC_SOURCE_REQUIRED` |
| `master.fou.skill.s1` | `SOURCE_EVIDENCE_REQUIRED` | `none` | `specific_handler` | `NONE` | `NONE` | `NONE` | `NONE` | `SEMANTIC_SOURCE_REQUIRED` |
| `master.fujino.skill.ascension` | `SOURCE_EVIDENCE_REQUIRED` | `none` | `shared_handler` | `NONE` | `NONE` | `NONE` | `NONE` | `SEMANTIC_SOURCE_REQUIRED` |
| `master.fujino.skill.s1` | `SOURCE_EVIDENCE_REQUIRED` | `none` | `shared_handler` | `NONE` | `NONE` | `NONE` | `NONE` | `SEMANTIC_SOURCE_REQUIRED` |
| `master.fujino.skill.s1a` | `SOURCE_EVIDENCE_REQUIRED` | `none` | `shared_handler` | `NONE` | `NONE` | `NONE` | `NONE` | `SEMANTIC_SOURCE_REQUIRED` |
| `master.fujino.skill.s2` | `SOURCE_EVIDENCE_REQUIRED` | `none` | `shared_handler` | `NONE` | `NONE` | `NONE` | `NONE` | `SEMANTIC_SOURCE_REQUIRED` |
| `master.fujino.skill.s3` | `SOURCE_EVIDENCE_REQUIRED` | `none` | `shared_handler` | `NONE` | `NONE` | `NONE` | `NONE` | `SEMANTIC_SOURCE_REQUIRED` |
| `master.fujino.skill.s4` | `SOURCE_EVIDENCE_REQUIRED` | `none` | `shared_handler` | `NONE` | `NONE` | `NONE` | `NONE` | `SEMANTIC_SOURCE_REQUIRED` |
| `master.goetia.skill.ascension` | `SOURCE_EVIDENCE_REQUIRED` | `none` | `shared_handler` | `NONE` | `NONE` | `NONE` | `NONE` | `SEMANTIC_SOURCE_REQUIRED` |
| `master.goetia.skill.s1` | `SOURCE_EVIDENCE_REQUIRED` | `none` | `shared_handler` | `NONE` | `NONE` | `NONE` | `NONE` | `SEMANTIC_SOURCE_REQUIRED` |
| `master.goetia.skill.s2` | `SOURCE_EVIDENCE_REQUIRED` | `none` | `shared_handler` | `NONE` | `NONE` | `NONE` | `NONE` | `SEMANTIC_SOURCE_REQUIRED` |
| `master.goredolf.skill.ascension` | `SOURCE_EVIDENCE_REQUIRED` | `none` | `specific_handler` | `NONE` | `NONE` | `NONE` | `NONE` | `SEMANTIC_SOURCE_REQUIRED` |
| `master.goredolf.skill.s1` | `SOURCE_EVIDENCE_REQUIRED` | `none` | `specific_handler` | `NONE` | `NONE` | `NONE` | `NONE` | `SEMANTIC_SOURCE_REQUIRED` |
| `master.goredolf.skill.s1a` | `SOURCE_EVIDENCE_REQUIRED` | `none` | `specific_handler` | `NONE` | `NONE` | `NONE` | `NONE` | `SEMANTIC_SOURCE_REQUIRED` |
| `master.hakuno-f.skill.ascension` | `SOURCE_EVIDENCE_REQUIRED` | `none` | `shared_handler` | `NONE` | `NONE` | `NONE` | `NONE` | `SEMANTIC_SOURCE_REQUIRED` |
| `master.hakuno-f.skill.s1` | `SOURCE_EVIDENCE_REQUIRED` | `none` | `shared_handler` | `NONE` | `NONE` | `NONE` | `NONE` | `SEMANTIC_SOURCE_REQUIRED` |
| `master.hakuno-f.skill.s2` | `SOURCE_EVIDENCE_REQUIRED` | `none` | `shared_handler` | `NONE` | `NONE` | `NONE` | `NONE` | `SEMANTIC_SOURCE_REQUIRED` |
| `master.hakuno-f.skill.s3` | `SOURCE_EVIDENCE_REQUIRED` | `none` | `shared_handler` | `NONE` | `NONE` | `NONE` | `NONE` | `SEMANTIC_SOURCE_REQUIRED` |
| `master.hakuno-f.skill.s4` | `SOURCE_EVIDENCE_REQUIRED` | `none` | `shared_handler` | `NONE` | `NONE` | `NONE` | `NONE` | `SEMANTIC_SOURCE_REQUIRED` |
| `master.hakuno-f.skill.s5` | `SOURCE_EVIDENCE_REQUIRED` | `none` | `shared_handler` | `NONE` | `NONE` | `NONE` | `NONE` | `SEMANTIC_SOURCE_REQUIRED` |
| `master.hakuno-m.skill.ascension` | `SOURCE_EVIDENCE_REQUIRED` | `none` | `shared_handler` | `NONE` | `NONE` | `NONE` | `NONE` | `SEMANTIC_SOURCE_REQUIRED` |
| `master.hakuno-m.skill.s1` | `SOURCE_EVIDENCE_REQUIRED` | `none` | `shared_handler` | `NONE` | `NONE` | `NONE` | `NONE` | `SEMANTIC_SOURCE_REQUIRED` |
| `master.hakuno-m.skill.s2` | `SOURCE_EVIDENCE_REQUIRED` | `none` | `shared_handler` | `NONE` | `NONE` | `NONE` | `NONE` | `SEMANTIC_SOURCE_REQUIRED` |
| `master.hakuno-m.skill.s3` | `SOURCE_EVIDENCE_REQUIRED` | `none` | `shared_handler` | `NONE` | `NONE` | `NONE` | `NONE` | `SEMANTIC_SOURCE_REQUIRED` |
| `master.hinako.skill.ascension` | `SOURCE_EVIDENCE_REQUIRED` | `none` | `shared_handler` | `NONE` | `NONE` | `NONE` | `NONE` | `SEMANTIC_SOURCE_REQUIRED` |
| `master.hinako.skill.s1` | `SOURCE_EVIDENCE_REQUIRED` | `none` | `shared_handler` | `NONE` | `NONE` | `NONE` | `NONE` | `SEMANTIC_SOURCE_REQUIRED` |
| `master.hinako.skill.s1a` | `SOURCE_EVIDENCE_REQUIRED` | `none` | `shared_handler` | `NONE` | `NONE` | `NONE` | `NONE` | `SEMANTIC_SOURCE_REQUIRED` |
| `master.hinako.skill.s2` | `SOURCE_EVIDENCE_REQUIRED` | `none` | `shared_handler` | `NONE` | `NONE` | `NONE` | `NONE` | `SEMANTIC_SOURCE_REQUIRED` |
| `master.hinako.skill.s3` | `SOURCE_EVIDENCE_REQUIRED` | `none` | `shared_handler` | `NONE` | `NONE` | `NONE` | `NONE` | `SEMANTIC_SOURCE_REQUIRED` |
| `master.hinako.skill.s4` | `SOURCE_EVIDENCE_REQUIRED` | `none` | `shared_handler` | `NONE` | `NONE` | `NONE` | `NONE` | `SEMANTIC_SOURCE_REQUIRED` |
| `master.hisui-detective.skill.ascension` | `SOURCE_EVIDENCE_REQUIRED` | `none` | `shared_handler` | `NONE` | `NONE` | `NONE` | `NONE` | `SEMANTIC_SOURCE_REQUIRED` |
| `master.hisui-detective.skill.s1` | `SOURCE_EVIDENCE_REQUIRED` | `none` | `shared_handler` | `NONE` | `NONE` | `NONE` | `NONE` | `SEMANTIC_SOURCE_REQUIRED` |
| `master.hisui-detective.skill.s1a` | `SOURCE_EVIDENCE_REQUIRED` | `none` | `shared_handler` | `NONE` | `NONE` | `NONE` | `NONE` | `SEMANTIC_SOURCE_REQUIRED` |
| `master.hisui-detective.skill.s2` | `SOURCE_EVIDENCE_REQUIRED` | `none` | `shared_handler` | `NONE` | `NONE` | `NONE` | `NONE` | `SEMANTIC_SOURCE_REQUIRED` |
| `master.hisui-detective.skill.s3` | `SOURCE_EVIDENCE_REQUIRED` | `none` | `shared_handler` | `NONE` | `NONE` | `NONE` | `NONE` | `SEMANTIC_SOURCE_REQUIRED` |
| `master.iliya.skill.ascension` | `SOURCE_EVIDENCE_REQUIRED` | `none` | `shared_handler` | `NONE` | `NONE` | `NONE` | `NONE` | `SEMANTIC_SOURCE_REQUIRED` |
| `master.iliya.skill.s1` | `SOURCE_EVIDENCE_REQUIRED` | `none` | `shared_handler` | `NONE` | `NONE` | `NONE` | `NONE` | `SEMANTIC_SOURCE_REQUIRED` |
| `master.iliya.skill.s2` | `SOURCE_EVIDENCE_REQUIRED` | `none` | `specific_handler` | `NONE` | `NONE` | `NONE` | `NONE` | `SEMANTIC_SOURCE_REQUIRED` |
| `master.iliya.skill.s3` | `SOURCE_EVIDENCE_REQUIRED` | `none` | `specific_handler` | `NONE` | `NONE` | `NONE` | `NONE` | `SEMANTIC_SOURCE_REQUIRED` |
| `master.iliya.skill.s4` | `SOURCE_EVIDENCE_REQUIRED` | `none` | `specific_handler` | `NONE` | `NONE` | `NONE` | `NONE` | `SEMANTIC_SOURCE_REQUIRED` |
| `master.illya-mahou.skill.ascension` | `SOURCE_EVIDENCE_REQUIRED` | `none` | `shared_handler` | `NONE` | `NONE` | `NONE` | `NONE` | `SEMANTIC_SOURCE_REQUIRED` |
| `master.illya-mahou.skill.s1` | `SOURCE_EVIDENCE_REQUIRED` | `none` | `shared_handler` | `NONE` | `NONE` | `NONE` | `NONE` | `SEMANTIC_SOURCE_REQUIRED` |
| `master.illya-mahou.skill.s1a` | `SOURCE_EVIDENCE_REQUIRED` | `none` | `shared_handler` | `NONE` | `NONE` | `NONE` | `NONE` | `SEMANTIC_SOURCE_REQUIRED` |
| `master.irisviel.skill.ascension` | `SOURCE_EVIDENCE_REQUIRED` | `none` | `specific_handler` | `NONE` | `NONE` | `NONE` | `NONE` | `SEMANTIC_SOURCE_REQUIRED` |
| `master.irisviel.skill.s1` | `SOURCE_EVIDENCE_REQUIRED` | `legacy` | `shared_handler` | `NONE` | `NONE` | `NONE` | `NONE` | `SEMANTIC_SOURCE_REQUIRED` |
| `master.irisviel.skill.s2` | `SOURCE_EVIDENCE_REQUIRED` | `new` | `specific_handler` | `NONE` | `NONE` | `NONE` | `NONE` | `SEMANTIC_SOURCE_REQUIRED` |
| `master.jinako.skill.ascension` | `SOURCE_EVIDENCE_REQUIRED` | `none` | `specific_handler` | `NONE` | `NONE` | `NONE` | `NONE` | `SEMANTIC_SOURCE_REQUIRED` |
| `master.jinako.skill.s1` | `SOURCE_EVIDENCE_REQUIRED` | `none` | `specific_handler` | `NONE` | `NONE` | `NONE` | `NONE` | `SEMANTIC_SOURCE_REQUIRED` |
| `master.jinako.skill.s2` | `SOURCE_EVIDENCE_REQUIRED` | `none` | `specific_handler` | `NONE` | `NONE` | `NONE` | `NONE` | `SEMANTIC_SOURCE_REQUIRED` |
| `master.julius.skill.ascension` | `SOURCE_EVIDENCE_REQUIRED` | `none` | `specific_handler` | `NONE` | `NONE` | `NONE` | `NONE` | `SEMANTIC_SOURCE_REQUIRED` |
| `master.julius.skill.s1` | `SOURCE_EVIDENCE_REQUIRED` | `none` | `specific_handler` | `NONE` | `NONE` | `NONE` | `NONE` | `SEMANTIC_SOURCE_REQUIRED` |
| `master.julius.skill.s1a` | `SOURCE_EVIDENCE_REQUIRED` | `none` | `specific_handler` | `NONE` | `NONE` | `NONE` | `NONE` | `SEMANTIC_SOURCE_REQUIRED` |
| `master.kadoc.skill.ascension` | `SOURCE_EVIDENCE_REQUIRED` | `none` | `specific_handler` | `NONE` | `NONE` | `NONE` | `NONE` | `SEMANTIC_SOURCE_REQUIRED` |
| `master.kadoc.skill.s1` | `SOURCE_EVIDENCE_REQUIRED` | `none` | `specific_handler` | `NONE` | `NONE` | `NONE` | `NONE` | `SEMANTIC_SOURCE_REQUIRED` |
| `master.kadoc.skill.s1a` | `SOURCE_EVIDENCE_REQUIRED` | `none` | `specific_handler` | `NONE` | `NONE` | `NONE` | `NONE` | `SEMANTIC_SOURCE_REQUIRED` |
| `master.kadoc.skill.s2` | `SOURCE_EVIDENCE_REQUIRED` | `none` | `shared_handler` | `NONE` | `NONE` | `NONE` | `NONE` | `SEMANTIC_SOURCE_REQUIRED` |
| `master.kadoc.skill.s3` | `SOURCE_EVIDENCE_REQUIRED` | `none` | `shared_handler` | `NONE` | `NONE` | `NONE` | `NONE` | `SEMANTIC_SOURCE_REQUIRED` |
| `master.kadoc.skill.s4` | `SOURCE_EVIDENCE_REQUIRED` | `none` | `shared_handler` | `NONE` | `NONE` | `NONE` | `NONE` | `SEMANTIC_SOURCE_REQUIRED` |
| `master.kadoc.skill.s5` | `SOURCE_EVIDENCE_REQUIRED` | `none` | `shared_handler` | `NONE` | `NONE` | `NONE` | `NONE` | `SEMANTIC_SOURCE_REQUIRED` |
| `master.kariya.skill.ascension` | `SOURCE_EVIDENCE_REQUIRED` | `none` | `specific_handler` | `NONE` | `NONE` | `NONE` | `NONE` | `SEMANTIC_SOURCE_REQUIRED` |
| `master.kariya.skill.s1` | `SOURCE_EVIDENCE_REQUIRED` | `none` | `specific_handler` | `NONE` | `NONE` | `NONE` | `NONE` | `SEMANTIC_SOURCE_REQUIRED` |
| `master.kariya.skill.s2` | `SOURCE_EVIDENCE_REQUIRED` | `none` | `shared_handler` | `NONE` | `NONE` | `NONE` | `NONE` | `SEMANTIC_SOURCE_REQUIRED` |
| `master.kariya.skill.s3` | `SOURCE_EVIDENCE_REQUIRED` | `none` | `shared_handler` | `NONE` | `NONE` | `NONE` | `NONE` | `SEMANTIC_SOURCE_REQUIRED` |
| `master.kariya.skill.s4` | `SOURCE_EVIDENCE_REQUIRED` | `none` | `specific_handler` | `NONE` | `NONE` | `NONE` | `NONE` | `SEMANTIC_SOURCE_REQUIRED` |
| `master.kayneth.skill.ascension` | `SOURCE_EVIDENCE_REQUIRED` | `none` | `specific_handler` | `NONE` | `NONE` | `NONE` | `NONE` | `SEMANTIC_SOURCE_REQUIRED` |
| `master.kayneth.skill.s1` | `SOURCE_EVIDENCE_REQUIRED` | `legacy` | `specific_handler` | `NONE` | `NONE` | `NONE` | `NONE` | `SEMANTIC_SOURCE_REQUIRED` |
| `master.kayneth.skill.s2` | `SOURCE_EVIDENCE_REQUIRED` | `legacy` | `specific_handler` | `NONE` | `NONE` | `NONE` | `NONE` | `SEMANTIC_SOURCE_REQUIRED` |
| `master.kayneth.skill.s3` | `READY_GENERIC_EXTENSION` | `legacy` | `shared_handler` | `CONDITION`, `LIFECYCLE`, `MODIFIER` | `GENERIC_CONDITION_EVALUATION`, `GENERIC_LIFECYCLE_POLICY`, `GENERIC_MODIFIER` | `NONE` | `NONE` | `NONE` |
| `master.kiara.skill.ascension` | `SOURCE_EVIDENCE_REQUIRED` | `none` | `shared_handler` | `NONE` | `NONE` | `NONE` | `NONE` | `SEMANTIC_SOURCE_REQUIRED` |
| `master.kiara.skill.s1` | `SOURCE_EVIDENCE_REQUIRED` | `none` | `shared_handler` | `NONE` | `NONE` | `NONE` | `NONE` | `SEMANTIC_SOURCE_REQUIRED` |
| `master.kiara.skill.s1a` | `SOURCE_EVIDENCE_REQUIRED` | `none` | `shared_handler` | `NONE` | `NONE` | `NONE` | `NONE` | `SEMANTIC_SOURCE_REQUIRED` |
| `master.kiara.skill.s2` | `SOURCE_EVIDENCE_REQUIRED` | `none` | `shared_handler` | `NONE` | `NONE` | `NONE` | `NONE` | `SEMANTIC_SOURCE_REQUIRED` |
| `master.kiara.skill.s3` | `SOURCE_EVIDENCE_REQUIRED` | `none` | `shared_handler` | `NONE` | `NONE` | `NONE` | `NONE` | `SEMANTIC_SOURCE_REQUIRED` |
| `master.kiara.skill.s4` | `SOURCE_EVIDENCE_REQUIRED` | `none` | `shared_handler` | `NONE` | `NONE` | `NONE` | `NONE` | `SEMANTIC_SOURCE_REQUIRED` |
| `master.kiara.skill.s5` | `SOURCE_EVIDENCE_REQUIRED` | `none` | `shared_handler` | `NONE` | `NONE` | `NONE` | `NONE` | `SEMANTIC_SOURCE_REQUIRED` |
| `master.kiara.skill.s6` | `SOURCE_EVIDENCE_REQUIRED` | `none` | `shared_handler` | `NONE` | `NONE` | `NONE` | `NONE` | `SEMANTIC_SOURCE_REQUIRED` |
| `master.kirei.skill.ascension` | `SOURCE_EVIDENCE_REQUIRED` | `none` | `shared_handler` | `NONE` | `NONE` | `NONE` | `NONE` | `SEMANTIC_SOURCE_REQUIRED` |
| `master.kirei.skill.s1` | `SOURCE_EVIDENCE_REQUIRED` | `none` | `specific_handler` | `NONE` | `NONE` | `NONE` | `NONE` | `SEMANTIC_SOURCE_REQUIRED` |
| `master.kirei.skill.s2` | `SOURCE_EVIDENCE_REQUIRED` | `none` | `shared_handler` | `NONE` | `NONE` | `NONE` | `NONE` | `SEMANTIC_SOURCE_REQUIRED` |
| `master.kirei.skill.s3` | `SOURCE_EVIDENCE_REQUIRED` | `none` | `deterministic` | `NONE` | `NONE` | `NONE` | `NONE` | `SEMANTIC_SOURCE_REQUIRED` |
| `master.kiritsugu.skill.ascension` | `SOURCE_EVIDENCE_REQUIRED` | `none` | `shared_handler` | `NONE` | `NONE` | `NONE` | `NONE` | `SEMANTIC_SOURCE_REQUIRED` |
| `master.kiritsugu.skill.s1` | `SOURCE_EVIDENCE_REQUIRED` | `legacy` | `specific_handler` | `NONE` | `NONE` | `NONE` | `NONE` | `SEMANTIC_SOURCE_REQUIRED` |
| `master.kiritsugu.skill.s2` | `SOURCE_EVIDENCE_REQUIRED` | `new` | `specific_handler` | `NONE` | `NONE` | `NONE` | `NONE` | `SEMANTIC_SOURCE_REQUIRED` |
| `master.kiritsugu.skill.s3` | `SOURCE_EVIDENCE_REQUIRED` | `legacy` | `specific_handler` | `NONE` | `NONE` | `NONE` | `NONE` | `SEMANTIC_SOURCE_REQUIRED` |
| `master.kiritsugu.skill.s4` | `SOURCE_EVIDENCE_REQUIRED` | `legacy` | `specific_handler` | `NONE` | `NONE` | `NONE` | `NONE` | `SEMANTIC_SOURCE_REQUIRED` |
| `master.kohaku.skill.ascension` | `SOURCE_EVIDENCE_REQUIRED` | `none` | `specific_handler` | `NONE` | `NONE` | `NONE` | `NONE` | `SEMANTIC_SOURCE_REQUIRED` |
| `master.kohaku.skill.s1` | `SOURCE_EVIDENCE_REQUIRED` | `none` | `specific_handler` | `NONE` | `NONE` | `NONE` | `NONE` | `SEMANTIC_SOURCE_REQUIRED` |
| `master.kohaku.skill.s1a` | `SOURCE_EVIDENCE_REQUIRED` | `none` | `shared_handler` | `NONE` | `NONE` | `NONE` | `NONE` | `SEMANTIC_SOURCE_REQUIRED` |
| `master.kohaku.skill.s3` | `SOURCE_EVIDENCE_REQUIRED` | `none` | `specific_handler` | `NONE` | `NONE` | `NONE` | `NONE` | `SEMANTIC_SOURCE_REQUIRED` |
| `master.kuzuki.skill.ascension` | `SOURCE_EVIDENCE_REQUIRED` | `none` | `shared_handler` | `NONE` | `NONE` | `NONE` | `NONE` | `SEMANTIC_SOURCE_REQUIRED` |
| `master.kuzuki.skill.s1` | `SOURCE_EVIDENCE_REQUIRED` | `none` | `specific_handler` | `NONE` | `NONE` | `NONE` | `NONE` | `SEMANTIC_SOURCE_REQUIRED` |
| `master.kuzuki.skill.s2` | `READY_GENERIC_EXTENSION` | `none` | `shared_handler` | `BATTLE_RESULT`, `CONDITION`, `LIFECYCLE`, `MODIFIER`, `TRIGGER` | `GENERIC_BATTLE_INTEGRATION`, `GENERIC_CONDITION_EVALUATION`, `GENERIC_LIFECYCLE_POLICY`, `GENERIC_MODIFIER`, `GENERIC_TRIGGER_GATEWAY` | `NONE` | `NONE` | `NONE` |
| `master.kuzuki.skill.s3` | `SOURCE_EVIDENCE_REQUIRED` | `none` | `shared_handler` | `NONE` | `NONE` | `NONE` | `NONE` | `SEMANTIC_SOURCE_REQUIRED` |
| `master.leonardo.skill.ascension` | `SOURCE_EVIDENCE_REQUIRED` | `none` | `specific_handler` | `NONE` | `NONE` | `NONE` | `NONE` | `SEMANTIC_SOURCE_REQUIRED` |
| `master.leonardo.skill.s1` | `SOURCE_EVIDENCE_REQUIRED` | `none` | `shared_handler` | `NONE` | `NONE` | `NONE` | `NONE` | `SEMANTIC_SOURCE_REQUIRED` |
| `master.leonardo.skill.s1a` | `SOURCE_EVIDENCE_REQUIRED` | `none` | `shared_handler` | `NONE` | `NONE` | `NONE` | `NONE` | `SEMANTIC_SOURCE_REQUIRED` |
| `master.maiya.skill.ascension` | `SOURCE_EVIDENCE_REQUIRED` | `none` | `shared_handler` | `NONE` | `NONE` | `NONE` | `NONE` | `SEMANTIC_SOURCE_REQUIRED` |
| `master.maiya.skill.s1` | `SOURCE_EVIDENCE_REQUIRED` | `dual` | `shared_handler` | `NONE` | `NONE` | `NONE` | `CARD_ACTION_SEMANTICS_MINIMAL_ADD_TO_ATTACK` | `SEMANTIC_SOURCE_REQUIRED` |
| `master.maiya.skill.s2` | `SOURCE_EVIDENCE_REQUIRED` | `legacy` | `shared_handler` | `NONE` | `NONE` | `NONE` | `NONE` | `SEMANTIC_SOURCE_REQUIRED` |
| `master.miyu.skill.ascension` | `SOURCE_EVIDENCE_REQUIRED` | `none` | `shared_handler` | `NONE` | `NONE` | `NONE` | `NONE` | `SEMANTIC_SOURCE_REQUIRED` |
| `master.miyu.skill.s1` | `SOURCE_EVIDENCE_REQUIRED` | `none` | `shared_handler` | `NONE` | `NONE` | `NONE` | `NONE` | `SEMANTIC_SOURCE_REQUIRED` |
| `master.miyu.skill.s2` | `SOURCE_EVIDENCE_REQUIRED` | `none` | `shared_handler` | `NONE` | `NONE` | `NONE` | `NONE` | `SEMANTIC_SOURCE_REQUIRED` |
| `master.miyu.skill.s3` | `SOURCE_EVIDENCE_REQUIRED` | `none` | `shared_handler` | `NONE` | `NONE` | `NONE` | `NONE` | `SEMANTIC_SOURCE_REQUIRED` |
| `master.ophelia.skill.ascension` | `SOURCE_EVIDENCE_REQUIRED` | `none` | `specific_handler` | `NONE` | `NONE` | `NONE` | `NONE` | `SEMANTIC_SOURCE_REQUIRED` |
| `master.ophelia.skill.s1` | `SOURCE_EVIDENCE_REQUIRED` | `none` | `specific_handler` | `NONE` | `NONE` | `NONE` | `NONE` | `SEMANTIC_SOURCE_REQUIRED` |
| `master.ophelia.skill.s1a` | `SOURCE_EVIDENCE_REQUIRED` | `none` | `shared_handler` | `NONE` | `NONE` | `NONE` | `NONE` | `SEMANTIC_SOURCE_REQUIRED` |
| `master.ophelia.skill.s1b` | `SOURCE_EVIDENCE_REQUIRED` | `none` | `specific_handler` | `NONE` | `NONE` | `NONE` | `NONE` | `SEMANTIC_SOURCE_REQUIRED` |
| `master.ophelia.skill.s2` | `SOURCE_EVIDENCE_REQUIRED` | `none` | `specific_handler` | `NONE` | `NONE` | `NONE` | `NONE` | `SEMANTIC_SOURCE_REQUIRED` |
| `master.ophelia.skill.s3` | `SOURCE_EVIDENCE_REQUIRED` | `none` | `shared_handler` | `NONE` | `NONE` | `NONE` | `NONE` | `SEMANTIC_SOURCE_REQUIRED` |
| `master.ophelia.skill.s4` | `SOURCE_EVIDENCE_REQUIRED` | `none` | `shared_handler` | `NONE` | `NONE` | `NONE` | `NONE` | `SEMANTIC_SOURCE_REQUIRED` |
| `master.ophelia.skill.s5` | `SOURCE_EVIDENCE_REQUIRED` | `none` | `shared_handler` | `NONE` | `NONE` | `NONE` | `NONE` | `SEMANTIC_SOURCE_REQUIRED` |
| `master.ophelia.skill.s6` | `SOURCE_EVIDENCE_REQUIRED` | `none` | `shared_handler` | `NONE` | `NONE` | `NONE` | `NONE` | `SEMANTIC_SOURCE_REQUIRED` |
| `master.ophelia.skill.s7` | `SOURCE_EVIDENCE_REQUIRED` | `none` | `shared_handler` | `NONE` | `NONE` | `NONE` | `NONE` | `SEMANTIC_SOURCE_REQUIRED` |
| `master.peperoncino.skill.ascension` | `SOURCE_EVIDENCE_REQUIRED` | `none` | `specific_handler` | `NONE` | `NONE` | `NONE` | `NONE` | `SEMANTIC_SOURCE_REQUIRED` |
| `master.peperoncino.skill.s1` | `SOURCE_EVIDENCE_REQUIRED` | `none` | `shared_handler` | `NONE` | `NONE` | `NONE` | `NONE` | `SEMANTIC_SOURCE_REQUIRED` |
| `master.peperoncino.skill.s1a` | `SOURCE_EVIDENCE_REQUIRED` | `none` | `shared_handler` | `NONE` | `NONE` | `NONE` | `NONE` | `SEMANTIC_SOURCE_REQUIRED` |
| `master.peperoncino.skill.s1b` | `SOURCE_EVIDENCE_REQUIRED` | `none` | `shared_handler` | `NONE` | `NONE` | `NONE` | `NONE` | `SEMANTIC_SOURCE_REQUIRED` |
| `master.peperoncino.skill.s2` | `SOURCE_EVIDENCE_REQUIRED` | `none` | `specific_handler` | `NONE` | `NONE` | `NONE` | `NONE` | `SEMANTIC_SOURCE_REQUIRED` |
| `master.peperoncino.skill.s3` | `SOURCE_EVIDENCE_REQUIRED` | `none` | `specific_handler` | `NONE` | `NONE` | `NONE` | `NONE` | `SEMANTIC_SOURCE_REQUIRED` |
| `master.peperoncino.skill.s4` | `SOURCE_EVIDENCE_REQUIRED` | `none` | `specific_handler` | `NONE` | `NONE` | `NONE` | `NONE` | `SEMANTIC_SOURCE_REQUIRED` |
| `master.rani.skill.ascension` | `SOURCE_EVIDENCE_REQUIRED` | `none` | `shared_handler` | `NONE` | `NONE` | `NONE` | `NONE` | `SEMANTIC_SOURCE_REQUIRED` |
| `master.rani.skill.s1` | `SOURCE_EVIDENCE_REQUIRED` | `none` | `shared_handler` | `NONE` | `NONE` | `NONE` | `NONE` | `SEMANTIC_SOURCE_REQUIRED` |
| `master.rani.skill.s2` | `SOURCE_EVIDENCE_REQUIRED` | `none` | `shared_handler` | `NONE` | `NONE` | `NONE` | `NONE` | `SEMANTIC_SOURCE_REQUIRED` |
| `master.rani.skill.s3` | `SOURCE_EVIDENCE_REQUIRED` | `none` | `shared_handler` | `NONE` | `NONE` | `NONE` | `NONE` | `SEMANTIC_SOURCE_REQUIRED` |
| `master.reines.skill.ascension` | `SOURCE_EVIDENCE_REQUIRED` | `none` | `shared_handler` | `NONE` | `NONE` | `NONE` | `NONE` | `SEMANTIC_SOURCE_REQUIRED` |
| `master.reines.skill.s1` | `SOURCE_EVIDENCE_REQUIRED` | `none` | `shared_handler` | `NONE` | `NONE` | `NONE` | `NONE` | `SEMANTIC_SOURCE_REQUIRED` |
| `master.reines.skill.s1a` | `SOURCE_EVIDENCE_REQUIRED` | `none` | `shared_handler` | `NONE` | `NONE` | `NONE` | `NONE` | `SEMANTIC_SOURCE_REQUIRED` |
| `master.reines.skill.s2` | `SOURCE_EVIDENCE_REQUIRED` | `none` | `shared_handler` | `NONE` | `NONE` | `NONE` | `NONE` | `SEMANTIC_SOURCE_REQUIRED` |
| `master.reines.skill.s3` | `SOURCE_EVIDENCE_REQUIRED` | `none` | `shared_handler` | `NONE` | `NONE` | `NONE` | `NONE` | `SEMANTIC_SOURCE_REQUIRED` |
| `master.reines.skill.s4` | `SOURCE_EVIDENCE_REQUIRED` | `none` | `shared_handler` | `NONE` | `NONE` | `NONE` | `NONE` | `SEMANTIC_SOURCE_REQUIRED` |
| `master.rin.skill.ascension` | `SOURCE_EVIDENCE_REQUIRED` | `none` | `specific_handler` | `NONE` | `NONE` | `NONE` | `NONE` | `SEMANTIC_SOURCE_REQUIRED` |
| `master.rin.skill.s1` | `SOURCE_EVIDENCE_REQUIRED` | `none` | `specific_handler` | `NONE` | `NONE` | `NONE` | `NONE` | `SEMANTIC_SOURCE_REQUIRED` |
| `master.rin.skill.s2` | `SOURCE_EVIDENCE_REQUIRED` | `none` | `specific_handler` | `NONE` | `NONE` | `NONE` | `NONE` | `SEMANTIC_SOURCE_REQUIRED` |
| `master.rin.skill.s3` | `SOURCE_EVIDENCE_REQUIRED` | `none` | `specific_handler` | `NONE` | `NONE` | `NONE` | `NONE` | `SEMANTIC_SOURCE_REQUIRED` |
| `master.rin.skill.s4` | `SOURCE_EVIDENCE_REQUIRED` | `none` | `shared_handler` | `NONE` | `NONE` | `NONE` | `NONE` | `SEMANTIC_SOURCE_REQUIRED` |
| `master.ritsuka-f.skill.ascension` | `SOURCE_EVIDENCE_REQUIRED` | `none` | `shared_handler` | `NONE` | `NONE` | `NONE` | `NONE` | `SEMANTIC_SOURCE_REQUIRED` |
| `master.ritsuka-f.skill.s1` | `SOURCE_EVIDENCE_REQUIRED` | `none` | `shared_handler` | `NONE` | `NONE` | `NONE` | `NONE` | `SEMANTIC_SOURCE_REQUIRED` |
| `master.ritsuka-f.skill.s1a` | `SOURCE_EVIDENCE_REQUIRED` | `none` | `shared_handler` | `NONE` | `NONE` | `NONE` | `NONE` | `SEMANTIC_SOURCE_REQUIRED` |
| `master.ritsuka-m.skill.ascension` | `SOURCE_EVIDENCE_REQUIRED` | `none` | `shared_handler` | `NONE` | `NONE` | `NONE` | `NONE` | `SEMANTIC_SOURCE_REQUIRED` |
| `master.ritsuka-m.skill.s1` | `SOURCE_EVIDENCE_REQUIRED` | `none` | `shared_handler` | `NONE` | `NONE` | `NONE` | `NONE` | `SEMANTIC_SOURCE_REQUIRED` |
| `master.ritsuka-m.skill.s2` | `SOURCE_EVIDENCE_REQUIRED` | `none` | `shared_handler` | `NONE` | `NONE` | `NONE` | `NONE` | `SEMANTIC_SOURCE_REQUIRED` |
| `master.roche.skill.ascension` | `SOURCE_EVIDENCE_REQUIRED` | `none` | `specific_handler` | `NONE` | `NONE` | `NONE` | `NONE` | `SEMANTIC_SOURCE_REQUIRED` |
| `master.roche.skill.s1` | `SOURCE_EVIDENCE_REQUIRED` | `none` | `specific_handler` | `NONE` | `NONE` | `NONE` | `NONE` | `SEMANTIC_SOURCE_REQUIRED` |
| `master.roche.skill.s1a` | `SOURCE_EVIDENCE_REQUIRED` | `none` | `specific_handler` | `NONE` | `NONE` | `NONE` | `NONE` | `SEMANTIC_SOURCE_REQUIRED` |
| `master.roche.skill.s2` | `SOURCE_EVIDENCE_REQUIRED` | `none` | `specific_handler` | `NONE` | `NONE` | `NONE` | `NONE` | `SEMANTIC_SOURCE_REQUIRED` |
| `master.ryuunosuke.skill.ascension` | `SOURCE_EVIDENCE_REQUIRED` | `none` | `specific_handler` | `NONE` | `NONE` | `NONE` | `NONE` | `SEMANTIC_SOURCE_REQUIRED` |
| `master.ryuunosuke.skill.s1` | `SOURCE_EVIDENCE_REQUIRED` | `none` | `specific_handler` | `NONE` | `NONE` | `NONE` | `NONE` | `SEMANTIC_SOURCE_REQUIRED` |
| `master.ryuunosuke.skill.s2` | `SOURCE_EVIDENCE_REQUIRED` | `none` | `specific_handler` | `NONE` | `NONE` | `NONE` | `NONE` | `SEMANTIC_SOURCE_REQUIRED` |
| `master.sakura.skill.ascension` | `SOURCE_EVIDENCE_REQUIRED` | `none` | `specific_handler` | `NONE` | `NONE` | `NONE` | `NONE` | `SEMANTIC_SOURCE_REQUIRED` |
| `master.sakura.skill.s1` | `SOURCE_EVIDENCE_REQUIRED` | `none` | `shared_handler` | `NONE` | `NONE` | `NONE` | `NONE` | `SEMANTIC_SOURCE_REQUIRED` |
| `master.sakura.skill.s2` | `SOURCE_EVIDENCE_REQUIRED` | `none` | `shared_handler` | `NONE` | `NONE` | `NONE` | `NONE` | `SEMANTIC_SOURCE_REQUIRED` |
| `master.sakura.skill.s3` | `SOURCE_EVIDENCE_REQUIRED` | `none` | `specific_handler` | `NONE` | `NONE` | `NONE` | `NONE` | `SEMANTIC_SOURCE_REQUIRED` |
| `master.sakura.skill.s4` | `SOURCE_EVIDENCE_REQUIRED` | `none` | `shared_handler` | `NONE` | `NONE` | `NONE` | `NONE` | `SEMANTIC_SOURCE_REQUIRED` |
| `master.shiki-nanaya.skill.ascension` | `SOURCE_EVIDENCE_REQUIRED` | `none` | `specific_handler` | `NONE` | `NONE` | `NONE` | `NONE` | `SEMANTIC_SOURCE_REQUIRED` |
| `master.shiki-nanaya.skill.s1` | `SOURCE_EVIDENCE_REQUIRED` | `none` | `shared_handler` | `NONE` | `NONE` | `NONE` | `NONE` | `SEMANTIC_SOURCE_REQUIRED` |
| `master.shiki-nanaya.skill.s1a` | `SOURCE_EVIDENCE_REQUIRED` | `none` | `shared_handler` | `NONE` | `NONE` | `NONE` | `NONE` | `SEMANTIC_SOURCE_REQUIRED` |
| `master.shiki-nanaya.skill.s1b` | `SOURCE_EVIDENCE_REQUIRED` | `none` | `specific_handler` | `NONE` | `NONE` | `NONE` | `NONE` | `SEMANTIC_SOURCE_REQUIRED` |
| `master.shiki-nanaya.skill.s2` | `SOURCE_EVIDENCE_REQUIRED` | `none` | `specific_handler` | `NONE` | `NONE` | `NONE` | `NONE` | `SEMANTIC_SOURCE_REQUIRED` |
| `master.shiki-ryougi.skill.ascension` | `SOURCE_EVIDENCE_REQUIRED` | `none` | `shared_handler` | `NONE` | `NONE` | `NONE` | `NONE` | `SEMANTIC_SOURCE_REQUIRED` |
| `master.shiki-ryougi.skill.s1` | `SOURCE_EVIDENCE_REQUIRED` | `none` | `shared_handler` | `NONE` | `NONE` | `NONE` | `NONE` | `SEMANTIC_SOURCE_REQUIRED` |
| `master.shiki-ryougi.skill.s1a` | `SOURCE_EVIDENCE_REQUIRED` | `none` | `shared_handler` | `NONE` | `NONE` | `NONE` | `NONE` | `SEMANTIC_SOURCE_REQUIRED` |
| `master.shiki-ryougi.skill.s1b` | `SOURCE_EVIDENCE_REQUIRED` | `none` | `specific_handler` | `NONE` | `NONE` | `NONE` | `NONE` | `SEMANTIC_SOURCE_REQUIRED` |
| `master.shiki-ryougi.skill.s2` | `SOURCE_EVIDENCE_REQUIRED` | `none` | `specific_handler` | `NONE` | `NONE` | `NONE` | `NONE` | `SEMANTIC_SOURCE_REQUIRED` |
| `master.shiki-ryougi.skill.s3` | `SOURCE_EVIDENCE_REQUIRED` | `none` | `shared_handler` | `NONE` | `NONE` | `NONE` | `NONE` | `SEMANTIC_SOURCE_REQUIRED` |
| `master.shiki-tohno.skill.ascension` | `SOURCE_EVIDENCE_REQUIRED` | `none` | `shared_handler` | `NONE` | `NONE` | `NONE` | `NONE` | `SEMANTIC_SOURCE_REQUIRED` |
| `master.shiki-tohno.skill.s1` | `SOURCE_EVIDENCE_REQUIRED` | `none` | `shared_handler` | `NONE` | `NONE` | `NONE` | `NONE` | `SEMANTIC_SOURCE_REQUIRED` |
| `master.shiki-tohno.skill.s1a` | `SOURCE_EVIDENCE_REQUIRED` | `none` | `shared_handler` | `NONE` | `NONE` | `NONE` | `NONE` | `SEMANTIC_SOURCE_REQUIRED` |
| `master.shiki-tohno.skill.s2` | `SOURCE_EVIDENCE_REQUIRED` | `none` | `shared_handler` | `NONE` | `NONE` | `NONE` | `NONE` | `SEMANTIC_SOURCE_REQUIRED` |
| `master.shiki-tohno.skill.s3` | `SOURCE_EVIDENCE_REQUIRED` | `none` | `shared_handler` | `NONE` | `NONE` | `NONE` | `NONE` | `SEMANTIC_SOURCE_REQUIRED` |
| `master.shiki-tohno.skill.s4` | `SOURCE_EVIDENCE_REQUIRED` | `none` | `shared_handler` | `NONE` | `NONE` | `NONE` | `NONE` | `SEMANTIC_SOURCE_REQUIRED` |
| `master.shinji.skill.ascension` | `SOURCE_EVIDENCE_REQUIRED` | `none` | `shared_handler` | `NONE` | `NONE` | `NONE` | `NONE` | `SEMANTIC_SOURCE_REQUIRED` |
| `master.shinji.skill.s1` | `SOURCE_EVIDENCE_REQUIRED` | `legacy` | `specific_handler` | `NONE` | `NONE` | `NONE` | `NONE` | `SEMANTIC_SOURCE_REQUIRED` |
| `master.shinji.skill.s2` | `SOURCE_EVIDENCE_REQUIRED` | `legacy` | `shared_handler` | `NONE` | `NONE` | `NONE` | `NONE` | `SEMANTIC_SOURCE_REQUIRED` |
| `master.shinji.skill.s3` | `SOURCE_EVIDENCE_REQUIRED` | `legacy` | `specific_handler` | `NONE` | `NONE` | `NONE` | `NONE` | `SEMANTIC_SOURCE_REQUIRED` |
| `master.shinji.skill.s4` | `SOURCE_EVIDENCE_REQUIRED` | `legacy` | `shared_handler` | `NONE` | `NONE` | `NONE` | `NONE` | `SEMANTIC_SOURCE_REQUIRED` |
| `master.shirou-emiya.skill.ascension` | `SOURCE_EVIDENCE_REQUIRED` | `none` | `shared_handler` | `NONE` | `NONE` | `NONE` | `NONE` | `SEMANTIC_SOURCE_REQUIRED` |
| `master.shirou-emiya.skill.s1` | `SOURCE_EVIDENCE_REQUIRED` | `none` | `shared_handler` | `NONE` | `NONE` | `NONE` | `NONE` | `SEMANTIC_SOURCE_REQUIRED` |
| `master.shirou-emiya.skill.s2` | `SOURCE_EVIDENCE_REQUIRED` | `none` | `shared_handler` | `NONE` | `NONE` | `NONE` | `NONE` | `SEMANTIC_SOURCE_REQUIRED` |
| `master.shirou-emiya.skill.s3` | `SOURCE_EVIDENCE_REQUIRED` | `none` | `shared_handler` | `NONE` | `NONE` | `NONE` | `NONE` | `SEMANTIC_SOURCE_REQUIRED` |
| `master.shirou-meal.skill.ascension` | `SOURCE_EVIDENCE_REQUIRED` | `none` | `specific_handler` | `NONE` | `NONE` | `NONE` | `NONE` | `SEMANTIC_SOURCE_REQUIRED` |
| `master.shirou-meal.skill.s1` | `SOURCE_EVIDENCE_REQUIRED` | `none` | `specific_handler` | `NONE` | `NONE` | `NONE` | `NONE` | `SEMANTIC_SOURCE_REQUIRED` |
| `master.shirou-meal.skill.s2` | `SOURCE_EVIDENCE_REQUIRED` | `none` | `specific_handler` | `NONE` | `NONE` | `NONE` | `NONE` | `SEMANTIC_SOURCE_REQUIRED` |
| `master.shishigou.skill.ascension` | `SOURCE_EVIDENCE_REQUIRED` | `none` | `shared_handler` | `NONE` | `NONE` | `NONE` | `NONE` | `SEMANTIC_SOURCE_REQUIRED` |
| `master.shishigou.skill.s1` | `SOURCE_EVIDENCE_REQUIRED` | `none` | `shared_handler` | `NONE` | `NONE` | `NONE` | `NONE` | `SEMANTIC_SOURCE_REQUIRED` |
| `master.shishigou.skill.s2` | `SOURCE_EVIDENCE_REQUIRED` | `none` | `shared_handler` | `NONE` | `NONE` | `NONE` | `NONE` | `SEMANTIC_SOURCE_REQUIRED` |
| `master.shishigou.skill.s3` | `SOURCE_EVIDENCE_REQUIRED` | `none` | `shared_handler` | `NONE` | `NONE` | `NONE` | `NONE` | `SEMANTIC_SOURCE_REQUIRED` |
| `master.sieg.skill.ascension` | `SOURCE_EVIDENCE_REQUIRED` | `none` | `specific_handler` | `NONE` | `NONE` | `NONE` | `NONE` | `SEMANTIC_SOURCE_REQUIRED` |
| `master.sieg.skill.s1` | `SOURCE_EVIDENCE_REQUIRED` | `none` | `shared_handler` | `NONE` | `NONE` | `NONE` | `NONE` | `SEMANTIC_SOURCE_REQUIRED` |
| `master.sieg.skill.s1a` | `SOURCE_EVIDENCE_REQUIRED` | `none` | `specific_handler` | `NONE` | `NONE` | `NONE` | `NONE` | `SEMANTIC_SOURCE_REQUIRED` |
| `master.sieg.skill.s2` | `SOURCE_EVIDENCE_REQUIRED` | `none` | `specific_handler` | `NONE` | `NONE` | `NONE` | `NONE` | `SEMANTIC_SOURCE_REQUIRED` |
| `master.sion.skill.ascension` | `SOURCE_EVIDENCE_REQUIRED` | `none` | `shared_handler` | `NONE` | `NONE` | `NONE` | `NONE` | `SEMANTIC_SOURCE_REQUIRED` |
| `master.sion.skill.s1` | `SOURCE_EVIDENCE_REQUIRED` | `none` | `shared_handler` | `NONE` | `NONE` | `NONE` | `NONE` | `SEMANTIC_SOURCE_REQUIRED` |
| `master.sion.skill.s10` | `SOURCE_EVIDENCE_REQUIRED` | `none` | `specific_handler` | `NONE` | `NONE` | `NONE` | `NONE` | `SEMANTIC_SOURCE_REQUIRED` |
| `master.sion.skill.s11` | `SOURCE_EVIDENCE_REQUIRED` | `none` | `shared_handler` | `NONE` | `NONE` | `NONE` | `NONE` | `SEMANTIC_SOURCE_REQUIRED` |
| `master.sion.skill.s12` | `SOURCE_EVIDENCE_REQUIRED` | `none` | `shared_handler` | `NONE` | `NONE` | `NONE` | `NONE` | `SEMANTIC_SOURCE_REQUIRED` |
| `master.sion.skill.s13` | `READY_GENERIC_EXTENSION` | `none` | `shared_handler` | `CARD_ACTION_SEMANTICS`, `CONDITION`, `COST_PAYMENT`, `INTERACTION`, `RESULT_BINDING`, `TARGET_SELECTION` | `CARD_ACTION_PLAY`, `GENERIC_CONDITION_EVALUATION`, `GENERIC_COST_PAYMENT`, `GENERIC_PENDING_INTERACTION`, `GENERIC_RESULT_BINDING`, `GENERIC_TARGET_SELECTION` | `NONE` | `NONE` | `NONE` |
| `master.sion.skill.s14` | `SOURCE_EVIDENCE_REQUIRED` | `none` | `shared_handler` | `NONE` | `NONE` | `NONE` | `NONE` | `SEMANTIC_SOURCE_REQUIRED` |
| `master.sion.skill.s15` | `SOURCE_EVIDENCE_REQUIRED` | `none` | `shared_handler` | `NONE` | `NONE` | `NONE` | `NONE` | `SEMANTIC_SOURCE_REQUIRED` |
| `master.sion.skill.s16` | `SOURCE_EVIDENCE_REQUIRED` | `none` | `shared_handler` | `NONE` | `NONE` | `NONE` | `NONE` | `SEMANTIC_SOURCE_REQUIRED` |
| `master.sion.skill.s17` | `SOURCE_EVIDENCE_REQUIRED` | `none` | `shared_handler` | `NONE` | `NONE` | `NONE` | `NONE` | `SEMANTIC_SOURCE_REQUIRED` |
| `master.sion.skill.s2` | `SOURCE_EVIDENCE_REQUIRED` | `none` | `shared_handler` | `NONE` | `NONE` | `NONE` | `NONE` | `SEMANTIC_SOURCE_REQUIRED` |
| `master.sion.skill.s3` | `SOURCE_EVIDENCE_REQUIRED` | `none` | `shared_handler` | `NONE` | `NONE` | `NONE` | `NONE` | `SEMANTIC_SOURCE_REQUIRED` |
| `master.sion.skill.s4` | `SOURCE_EVIDENCE_REQUIRED` | `none` | `shared_handler` | `NONE` | `NONE` | `NONE` | `NONE` | `SEMANTIC_SOURCE_REQUIRED` |
| `master.sion.skill.s5` | `SOURCE_EVIDENCE_REQUIRED` | `none` | `specific_handler` | `NONE` | `NONE` | `NONE` | `NONE` | `SEMANTIC_SOURCE_REQUIRED` |
| `master.sion.skill.s6` | `SOURCE_EVIDENCE_REQUIRED` | `none` | `shared_handler` | `NONE` | `NONE` | `NONE` | `NONE` | `SEMANTIC_SOURCE_REQUIRED` |
| `master.sion.skill.s7` | `SOURCE_EVIDENCE_REQUIRED` | `none` | `specific_handler` | `NONE` | `NONE` | `NONE` | `NONE` | `SEMANTIC_SOURCE_REQUIRED` |
| `master.sion.skill.s8` | `SOURCE_EVIDENCE_REQUIRED` | `none` | `shared_handler` | `NONE` | `NONE` | `NONE` | `NONE` | `SEMANTIC_SOURCE_REQUIRED` |
| `master.sion.skill.s9` | `SOURCE_EVIDENCE_REQUIRED` | `none` | `specific_handler` | `NONE` | `NONE` | `NONE` | `NONE` | `SEMANTIC_SOURCE_REQUIRED` |
| `master.taiga.skill.ascension` | `SOURCE_EVIDENCE_REQUIRED` | `none` | `specific_handler` | `NONE` | `NONE` | `NONE` | `NONE` | `SEMANTIC_SOURCE_REQUIRED` |
| `master.taiga.skill.s1` | `SOURCE_EVIDENCE_REQUIRED` | `none` | `shared_handler` | `NONE` | `NONE` | `NONE` | `NONE` | `SEMANTIC_SOURCE_REQUIRED` |
| `master.taiga.skill.s1a` | `SOURCE_EVIDENCE_REQUIRED` | `none` | `specific_handler` | `NONE` | `NONE` | `NONE` | `NONE` | `SEMANTIC_SOURCE_REQUIRED` |
| `master.tiamat.skill.ascension` | `SOURCE_EVIDENCE_REQUIRED` | `none` | `shared_handler` | `NONE` | `NONE` | `NONE` | `NONE` | `SEMANTIC_SOURCE_REQUIRED` |
| `master.tiamat.skill.s1` | `SOURCE_EVIDENCE_REQUIRED` | `none` | `specific_handler` | `NONE` | `NONE` | `NONE` | `NONE` | `SEMANTIC_SOURCE_REQUIRED` |
| `master.tiamat.skill.s1a` | `SOURCE_EVIDENCE_REQUIRED` | `none` | `specific_handler` | `NONE` | `NONE` | `NONE` | `NONE` | `SEMANTIC_SOURCE_REQUIRED` |
| `master.tokiomi.skill.ascension` | `SOURCE_EVIDENCE_REQUIRED` | `none` | `shared_handler` | `NONE` | `NONE` | `NONE` | `NONE` | `SEMANTIC_SOURCE_REQUIRED` |
| `master.tokiomi.skill.s1` | `SOURCE_EVIDENCE_REQUIRED` | `none` | `specific_handler` | `NONE` | `NONE` | `NONE` | `NONE` | `SEMANTIC_SOURCE_REQUIRED` |
| `master.tokiomi.skill.s2` | `SOURCE_EVIDENCE_REQUIRED` | `none` | `shared_handler` | `NONE` | `NONE` | `NONE` | `NONE` | `SEMANTIC_SOURCE_REQUIRED` |
| `master.twice.skill.ascension` | `READY_GENERIC_EXTENSION` | `none` | `shared_handler` | `BATTLE_RESULT`, `CONDITION`, `MODIFIER` | `GENERIC_BATTLE_INTEGRATION`, `GENERIC_CONDITION_EVALUATION`, `GENERIC_MODIFIER` | `NONE` | `NONE` | `NONE` |
| `master.twice.skill.s1` | `READY_GENERIC_EXTENSION` | `none` | `shared_handler` | `CARD_ZONE`, `CONDITION`, `INTERACTION`, `RESULT_BINDING`, `SPECIAL_SUBSYSTEM`, `TARGET_SELECTION` | `GENERIC_CARD_ZONE`, `GENERIC_CONDITION_EVALUATION`, `GENERIC_EVENT_DECK`, `GENERIC_PENDING_INTERACTION`, `GENERIC_RESULT_BINDING`, `GENERIC_TARGET_SELECTION` | `NONE` | `NONE` | `NONE` |
| `master.wallachia.skill.ascension` | `SOURCE_EVIDENCE_REQUIRED` | `none` | `shared_handler` | `NONE` | `NONE` | `NONE` | `NONE` | `SEMANTIC_SOURCE_REQUIRED` |
| `master.wallachia.skill.s1` | `SOURCE_EVIDENCE_REQUIRED` | `none` | `shared_handler` | `NONE` | `NONE` | `NONE` | `NONE` | `SEMANTIC_SOURCE_REQUIRED` |
| `master.wallachia.skill.s2` | `SOURCE_EVIDENCE_REQUIRED` | `none` | `shared_handler` | `NONE` | `NONE` | `NONE` | `NONE` | `SEMANTIC_SOURCE_REQUIRED` |
| `master.wallachia.skill.s3` | `SOURCE_EVIDENCE_REQUIRED` | `none` | `shared_handler` | `NONE` | `NONE` | `NONE` | `NONE` | `SEMANTIC_SOURCE_REQUIRED` |
| `master.wallachia.skill.s4` | `SOURCE_EVIDENCE_REQUIRED` | `none` | `shared_handler` | `NONE` | `NONE` | `NONE` | `NONE` | `SEMANTIC_SOURCE_REQUIRED` |
| `master.wallachia.skill.s5` | `SOURCE_EVIDENCE_REQUIRED` | `none` | `shared_handler` | `NONE` | `NONE` | `NONE` | `NONE` | `SEMANTIC_SOURCE_REQUIRED` |
| `master.wallachia.skill.s6` | `SOURCE_EVIDENCE_REQUIRED` | `none` | `shared_handler` | `NONE` | `NONE` | `NONE` | `NONE` | `SEMANTIC_SOURCE_REQUIRED` |
| `master.wallachia.skill.s7` | `SOURCE_EVIDENCE_REQUIRED` | `none` | `shared_handler` | `NONE` | `NONE` | `NONE` | `NONE` | `SEMANTIC_SOURCE_REQUIRED` |
| `master.wallachia.skill.s8` | `SOURCE_EVIDENCE_REQUIRED` | `none` | `shared_handler` | `NONE` | `NONE` | `NONE` | `NONE` | `SEMANTIC_SOURCE_REQUIRED` |
| `master.waver.skill.ascension` | `SOURCE_EVIDENCE_REQUIRED` | `none` | `specific_handler` | `NONE` | `NONE` | `NONE` | `NONE` | `SEMANTIC_SOURCE_REQUIRED` |
| `master.waver.skill.s1` | `SOURCE_EVIDENCE_REQUIRED` | `none` | `shared_handler` | `NONE` | `NONE` | `NONE` | `NONE` | `SEMANTIC_SOURCE_REQUIRED` |
| `master.waver.skill.s2` | `SOURCE_EVIDENCE_REQUIRED` | `none` | `specific_handler` | `NONE` | `NONE` | `NONE` | `NONE` | `SEMANTIC_SOURCE_REQUIRED` |
| `master.waver.skill.s3` | `SOURCE_EVIDENCE_REQUIRED` | `none` | `shared_handler` | `NONE` | `NONE` | `NONE` | `NONE` | `SEMANTIC_SOURCE_REQUIRED` |
| `master.wodime.skill.ascension` | `SOURCE_EVIDENCE_REQUIRED` | `none` | `shared_handler` | `NONE` | `NONE` | `NONE` | `NONE` | `SEMANTIC_SOURCE_REQUIRED` |
| `master.wodime.skill.s1` | `SOURCE_EVIDENCE_REQUIRED` | `none` | `shared_handler` | `NONE` | `NONE` | `NONE` | `NONE` | `SEMANTIC_SOURCE_REQUIRED` |
| `master.wodime.skill.s1a` | `SOURCE_EVIDENCE_REQUIRED` | `none` | `shared_handler` | `NONE` | `NONE` | `NONE` | `NONE` | `SEMANTIC_SOURCE_REQUIRED` |
| `master.wodime.skill.s2` | `SOURCE_EVIDENCE_REQUIRED` | `none` | `shared_handler` | `NONE` | `NONE` | `NONE` | `NONE` | `SEMANTIC_SOURCE_REQUIRED` |
| `master.wodime.skill.s3` | `SOURCE_EVIDENCE_REQUIRED` | `none` | `shared_handler` | `NONE` | `NONE` | `NONE` | `NONE` | `SEMANTIC_SOURCE_REQUIRED` |
| `master.wodime.skill.s4` | `SOURCE_EVIDENCE_REQUIRED` | `none` | `shared_handler` | `NONE` | `NONE` | `NONE` | `NONE` | `SEMANTIC_SOURCE_REQUIRED` |
| `master.wodime.skill.s5` | `SOURCE_EVIDENCE_REQUIRED` | `none` | `shared_handler` | `NONE` | `NONE` | `NONE` | `NONE` | `SEMANTIC_SOURCE_REQUIRED` |
| `master.wodime.skill.s6` | `SOURCE_EVIDENCE_REQUIRED` | `none` | `shared_handler` | `NONE` | `NONE` | `NONE` | `NONE` | `SEMANTIC_SOURCE_REQUIRED` |
| `master.wodime.skill.s7` | `SOURCE_EVIDENCE_REQUIRED` | `none` | `shared_handler` | `NONE` | `NONE` | `NONE` | `NONE` | `SEMANTIC_SOURCE_REQUIRED` |
| `master.wodime.skill.s8` | `SOURCE_EVIDENCE_REQUIRED` | `none` | `shared_handler` | `NONE` | `NONE` | `NONE` | `NONE` | `SEMANTIC_SOURCE_REQUIRED` |
| `master.wodime.skill.s9` | `SOURCE_EVIDENCE_REQUIRED` | `none` | `shared_handler` | `NONE` | `NONE` | `NONE` | `NONE` | `SEMANTIC_SOURCE_REQUIRED` |
| `master.zouken.skill.ascension` | `SOURCE_EVIDENCE_REQUIRED` | `none` | `specific_handler` | `NONE` | `NONE` | `NONE` | `NONE` | `SEMANTIC_SOURCE_REQUIRED` |
| `master.zouken.skill.s1` | `SOURCE_EVIDENCE_REQUIRED` | `none` | `shared_handler` | `NONE` | `NONE` | `NONE` | `NONE` | `SEMANTIC_SOURCE_REQUIRED` |
| `master.zouken.skill.s2` | `SOURCE_EVIDENCE_REQUIRED` | `none` | `shared_handler` | `NONE` | `NONE` | `NONE` | `NONE` | `SEMANTIC_SOURCE_REQUIRED` |
| `master.zouken.skill.s3` | `SOURCE_EVIDENCE_REQUIRED` | `none` | `specific_handler` | `NONE` | `NONE` | `NONE` | `NONE` | `SEMANTIC_SOURCE_REQUIRED` |
| `master.zouken.skill.s4` | `SOURCE_EVIDENCE_REQUIRED` | `none` | `specific_handler` | `NONE` | `NONE` | `NONE` | `NONE` | `SEMANTIC_SOURCE_REQUIRED` |
| `master.zouken.skill.s5` | `SOURCE_EVIDENCE_REQUIRED` | `none` | `shared_handler` | `NONE` | `NONE` | `NONE` | `NONE` | `SEMANTIC_SOURCE_REQUIRED` |
| `servant.abigail.skill.sc-abigail-1` | `SOURCE_EVIDENCE_REQUIRED` | `none` | `specific_handler` | `NONE` | `NONE` | `NONE` | `NONE` | `SEMANTIC_SOURCE_REQUIRED` |
| `servant.abigail.skill.sc-abigail-2` | `SOURCE_EVIDENCE_REQUIRED` | `none` | `specific_handler` | `NONE` | `NONE` | `NONE` | `NONE` | `SEMANTIC_SOURCE_REQUIRED` |
| `servant.abigail.skill.sc-abigail-3` | `SOURCE_EVIDENCE_REQUIRED` | `none` | `specific_handler` | `NONE` | `NONE` | `NONE` | `NONE` | `SEMANTIC_SOURCE_REQUIRED` |
| `servant.abigail.skill.sc-abigail-4` | `SOURCE_EVIDENCE_REQUIRED` | `none` | `shared_handler` | `NONE` | `NONE` | `NONE` | `NONE` | `SEMANTIC_SOURCE_REQUIRED` |
| `servant.achilles.skill.sc-achilles-1` | `SOURCE_EVIDENCE_REQUIRED` | `legacy` | `shared_handler` | `NONE` | `NONE` | `NONE` | `NONE` | `SEMANTIC_SOURCE_REQUIRED` |
| `servant.achilles.skill.sc-achilles-2` | `SOURCE_EVIDENCE_REQUIRED` | `legacy` | `shared_handler` | `NONE` | `NONE` | `NONE` | `NONE` | `SEMANTIC_SOURCE_REQUIRED` |
| `servant.achilles.skill.sc-achilles-3` | `SOURCE_EVIDENCE_REQUIRED` | `legacy` | `shared_handler` | `NONE` | `NONE` | `NONE` | `NONE` | `SEMANTIC_SOURCE_REQUIRED` |
| `servant.albion.skill.sc-albion-1` | `READY_GENERIC_EXTENSION` | `none` | `shared_handler` | `BATTLE_RESULT`, `CARD_ZONE`, `CONDITION`, `HIDDEN_INFORMATION`, `INTERACTION`, `RESOURCE_NUMERIC`, `TARGET_SELECTION`, `TRIGGER` | `GENERIC_BATTLE_INTEGRATION`, `GENERIC_CARD_ZONE`, `GENERIC_CONDITION_EVALUATION`, `GENERIC_PENDING_INTERACTION`, `GENERIC_RESOURCE_NUMERIC`, `GENERIC_TARGET_SELECTION`, `GENERIC_TRIGGER_GATEWAY`, `GENERIC_VISIBILITY` | `NONE` | `NONE` | `NONE` |
| `servant.albion.skill.sc-albion-2` | `READY_GENERIC_EXTENSION` | `none` | `shared_handler` | `CONDITION`, `LIFECYCLE`, `MODIFIER`, `POWER`, `TRIGGER` | `GENERIC_CONDITION_EVALUATION`, `GENERIC_MODIFIER`, `GENERIC_POWER`, `GENERIC_STATUS_STATE`, `GENERIC_TRIGGER_GATEWAY` | `NONE` | `NONE` | `NONE` |
| `servant.albion.skill.sc-albion-3` | `SOURCE_EVIDENCE_REQUIRED` | `none` | `shared_handler` | `NONE` | `NONE` | `NONE` | `NONE` | `SEMANTIC_SOURCE_REQUIRED` |
| `servant.altera.skill.sc-altera-1` | `SOURCE_EVIDENCE_REQUIRED` | `none` | `specific_handler` | `NONE` | `NONE` | `NONE` | `NONE` | `SEMANTIC_SOURCE_REQUIRED` |
| `servant.altera.skill.sc-altera-2` | `SOURCE_EVIDENCE_REQUIRED` | `none` | `specific_handler` | `NONE` | `NONE` | `NONE` | `NONE` | `SEMANTIC_SOURCE_REQUIRED` |
| `servant.altera.skill.sc-altera-3` | `SOURCE_EVIDENCE_REQUIRED` | `none` | `shared_handler` | `NONE` | `NONE` | `NONE` | `NONE` | `SEMANTIC_SOURCE_REQUIRED` |
| `servant.amakusa.skill.sc-amakusa-1` | `READY_GENERIC_EXTENSION` | `none` | `shared_handler` | `CARD_ZONE`, `CONDITION`, `HIDDEN_INFORMATION`, `MODIFIER`, `POWER`, `SPECIAL_SUBSYSTEM`, `TRIGGER` | `GENERIC_CARD_ZONE`, `GENERIC_CONDITION_EVALUATION`, `GENERIC_EVENT_DECK`, `GENERIC_MODIFIER`, `GENERIC_POWER`, `GENERIC_TRIGGER_GATEWAY`, `GENERIC_VISIBILITY` | `NONE` | `NONE` | `NONE` |
| `servant.amakusa.skill.sc-amakusa-2` | `SOURCE_EVIDENCE_REQUIRED` | `none` | `specific_handler` | `NONE` | `NONE` | `NONE` | `NONE` | `SEMANTIC_SOURCE_REQUIRED` |
| `servant.amakusa.skill.sc-amakusa-3` | `SOURCE_EVIDENCE_REQUIRED` | `none` | `shared_handler` | `NONE` | `NONE` | `NONE` | `NONE` | `SEMANTIC_SOURCE_REQUIRED` |
| `servant.amor.skill.sc-amor-1` | `SOURCE_EVIDENCE_REQUIRED` | `none` | `shared_handler` | `NONE` | `NONE` | `NONE` | `NONE` | `SEMANTIC_SOURCE_REQUIRED` |
| `servant.amor.skill.sc-amor-2` | `SOURCE_EVIDENCE_REQUIRED` | `none` | `specific_handler` | `NONE` | `NONE` | `NONE` | `NONE` | `SEMANTIC_SOURCE_REQUIRED` |
| `servant.amor.skill.sc-amor-3` | `SOURCE_EVIDENCE_REQUIRED` | `none` | `specific_handler` | `NONE` | `NONE` | `NONE` | `NONE` | `SEMANTIC_SOURCE_REQUIRED` |
| `servant.anastasia.skill.sc-anastasia-1` | `SOURCE_EVIDENCE_REQUIRED` | `none` | `shared_handler` | `NONE` | `NONE` | `NONE` | `NONE` | `SEMANTIC_SOURCE_REQUIRED` |
| `servant.anastasia.skill.sc-anastasia-2` | `SOURCE_EVIDENCE_REQUIRED` | `none` | `specific_handler` | `NONE` | `NONE` | `NONE` | `NONE` | `SEMANTIC_SOURCE_REQUIRED` |
| `servant.anastasia.skill.sc-anastasia-3` | `SOURCE_EVIDENCE_REQUIRED` | `none` | `specific_handler` | `NONE` | `NONE` | `NONE` | `NONE` | `SEMANTIC_SOURCE_REQUIRED` |
| `servant.andersen.skill.sc-andersen-1` | `SOURCE_EVIDENCE_REQUIRED` | `none` | `shared_handler` | `NONE` | `NONE` | `NONE` | `NONE` | `SEMANTIC_SOURCE_REQUIRED` |
| `servant.andersen.skill.sc-andersen-2` | `SPECIAL_HANDLER_CANDIDATE` | `none` | `shared_handler` | `BATTLE_RESULT`, `CONDITION`, `LIFECYCLE`, `MODIFIER`, `SPECIAL_SUBSYSTEM` | `GENERIC_BATTLE_INTEGRATION`, `GENERIC_CONDITION_EVALUATION`, `GENERIC_LIFECYCLE_POLICY`, `GENERIC_MODIFIER`, `REVIEWED_SPECIAL_TRANSFORM` | `NONE` | `NONE` | `STRUCTURED_TRANSFORM_REQUIRES_REVIEW` |
| `servant.andersen.skill.sc-andersen-3` | `SOURCE_EVIDENCE_REQUIRED` | `none` | `specific_handler` | `NONE` | `NONE` | `NONE` | `NONE` | `SEMANTIC_SOURCE_REQUIRED` |
| `servant.angra.skill.sc-angra-1` | `SOURCE_EVIDENCE_REQUIRED` | `none` | `specific_handler` | `NONE` | `NONE` | `NONE` | `NONE` | `SEMANTIC_SOURCE_REQUIRED` |
| `servant.angra.skill.sc-angra-2` | `SOURCE_EVIDENCE_REQUIRED` | `none` | `specific_handler` | `NONE` | `NONE` | `NONE` | `NONE` | `SEMANTIC_SOURCE_REQUIRED` |
| `servant.angra.skill.sc-angra-3` | `SOURCE_EVIDENCE_REQUIRED` | `none` | `specific_handler` | `NONE` | `NONE` | `NONE` | `NONE` | `SEMANTIC_SOURCE_REQUIRED` |
| `servant.arash.skill.sc-arash-1` | `SOURCE_EVIDENCE_REQUIRED` | `none` | `specific_handler` | `NONE` | `NONE` | `NONE` | `NONE` | `SEMANTIC_SOURCE_REQUIRED` |
| `servant.arash.skill.sc-arash-2` | `SOURCE_EVIDENCE_REQUIRED` | `none` | `specific_handler` | `NONE` | `NONE` | `NONE` | `NONE` | `SEMANTIC_SOURCE_REQUIRED` |
| `servant.arash.skill.sc-arash-3` | `SOURCE_EVIDENCE_REQUIRED` | `none` | `specific_handler` | `NONE` | `NONE` | `NONE` | `NONE` | `SEMANTIC_SOURCE_REQUIRED` |
| `servant.arcueid.skill.sc-arcueid-1` | `SOURCE_EVIDENCE_REQUIRED` | `none` | `specific_handler` | `NONE` | `NONE` | `NONE` | `NONE` | `SEMANTIC_SOURCE_REQUIRED` |
| `servant.arcueid.skill.sc-arcueid-2` | `SOURCE_EVIDENCE_REQUIRED` | `none` | `specific_handler` | `NONE` | `NONE` | `NONE` | `NONE` | `SEMANTIC_SOURCE_REQUIRED` |
| `servant.arcueid.skill.sc-arcueid-3` | `SOURCE_EVIDENCE_REQUIRED` | `none` | `specific_handler` | `NONE` | `NONE` | `NONE` | `NONE` | `SEMANTIC_SOURCE_REQUIRED` |
| `servant.arjuna-archer.skill.sc-arjuna-archer-1` | `SOURCE_EVIDENCE_REQUIRED` | `none` | `specific_handler` | `NONE` | `NONE` | `NONE` | `NONE` | `SEMANTIC_SOURCE_REQUIRED` |
| `servant.arjuna-archer.skill.sc-arjuna-archer-2` | `SOURCE_EVIDENCE_REQUIRED` | `none` | `specific_handler` | `NONE` | `NONE` | `NONE` | `NONE` | `SEMANTIC_SOURCE_REQUIRED` |
| `servant.arjuna-archer.skill.sc-arjuna-archer-3` | `SOURCE_EVIDENCE_REQUIRED` | `none` | `specific_handler` | `NONE` | `NONE` | `NONE` | `NONE` | `SEMANTIC_SOURCE_REQUIRED` |
| `servant.arjuna.skill.sc-arjuna-1` | `READY_GENERIC_EXTENSION` | `none` | `shared_handler` | `BATTLE_RESULT`, `CONDITION`, `HIDDEN_INFORMATION`, `LIFECYCLE`, `MODIFIER`, `POWER`, `TRIGGER` | `GENERIC_BATTLE_INTEGRATION`, `GENERIC_CONDITION_EVALUATION`, `GENERIC_LIFECYCLE_POLICY`, `GENERIC_MODIFIER`, `GENERIC_POWER`, `GENERIC_STATUS_STATE`, `GENERIC_TRIGGER_GATEWAY`, `GENERIC_VISIBILITY` | `NONE` | `NONE` | `NONE` |
| `servant.arjuna.skill.sc-arjuna-2` | `SOURCE_EVIDENCE_REQUIRED` | `none` | `specific_handler` | `NONE` | `NONE` | `NONE` | `NONE` | `SEMANTIC_SOURCE_REQUIRED` |
| `servant.arjuna.skill.sc-arjuna-3` | `SOURCE_EVIDENCE_REQUIRED` | `none` | `specific_handler` | `NONE` | `NONE` | `NONE` | `NONE` | `SEMANTIC_SOURCE_REQUIRED` |
| `servant.arthur.skill.sc-arthur-1` | `SOURCE_EVIDENCE_REQUIRED` | `none` | `shared_handler` | `NONE` | `NONE` | `NONE` | `NONE` | `SEMANTIC_SOURCE_REQUIRED` |
| `servant.arthur.skill.sc-arthur-2` | `SOURCE_EVIDENCE_REQUIRED` | `none` | `specific_handler` | `NONE` | `NONE` | `NONE` | `NONE` | `SEMANTIC_SOURCE_REQUIRED` |
| `servant.arthur.skill.sc-arthur-3` | `SOURCE_EVIDENCE_REQUIRED` | `none` | `shared_handler` | `NONE` | `NONE` | `NONE` | `NONE` | `SEMANTIC_SOURCE_REQUIRED` |
| `servant.artoria-alt.skill.sc-artoria-alt-1` | `SOURCE_EVIDENCE_REQUIRED` | `legacy` | `specific_handler` | `NONE` | `NONE` | `NONE` | `NONE` | `SEMANTIC_SOURCE_REQUIRED` |
| `servant.artoria-alt.skill.sc-artoria-alt-2` | `SOURCE_EVIDENCE_REQUIRED` | `dual` | `specific_handler` | `NONE` | `NONE` | `NONE` | `CARD_ACTION_SEMANTICS_MINIMAL_CLOSE` | `SEMANTIC_SOURCE_REQUIRED` |
| `servant.artoria-alt.skill.sc-artoria-alt-3` | `SOURCE_EVIDENCE_REQUIRED` | `legacy` | `shared_handler` | `NONE` | `NONE` | `NONE` | `NONE` | `SEMANTIC_SOURCE_REQUIRED` |
| `servant.artoriac.skill.sc-artoriac-1` | `SOURCE_EVIDENCE_REQUIRED` | `legacy` | `shared_handler` | `NONE` | `NONE` | `NONE` | `NONE` | `SEMANTIC_SOURCE_REQUIRED` |
| `servant.artoriac.skill.sc-artoriac-2` | `SOURCE_EVIDENCE_REQUIRED` | `legacy` | `shared_handler` | `NONE` | `NONE` | `NONE` | `NONE` | `SEMANTIC_SOURCE_REQUIRED` |
| `servant.artoriac.skill.sc-artoriac-3` | `SOURCE_EVIDENCE_REQUIRED` | `legacy` | `shared_handler` | `NONE` | `NONE` | `NONE` | `NONE` | `SEMANTIC_SOURCE_REQUIRED` |
| `servant.artoriac.skill.sc-artoriac-4` | `SOURCE_EVIDENCE_REQUIRED` | `legacy` | `shared_handler` | `NONE` | `NONE` | `NONE` | `NONE` | `SEMANTIC_SOURCE_REQUIRED` |
| `servant.artoriac.skill.sc-artoriac-5` | `SOURCE_EVIDENCE_REQUIRED` | `legacy` | `shared_handler` | `NONE` | `NONE` | `NONE` | `NONE` | `SEMANTIC_SOURCE_REQUIRED` |
| `servant.artoriac.skill.sc-artoriac-6` | `SOURCE_EVIDENCE_REQUIRED` | `legacy` | `shared_handler` | `NONE` | `NONE` | `NONE` | `NONE` | `SEMANTIC_SOURCE_REQUIRED` |
| `servant.ashva.skill.sc-ashva-1` | `SOURCE_EVIDENCE_REQUIRED` | `none` | `specific_handler` | `NONE` | `NONE` | `NONE` | `NONE` | `SEMANTIC_SOURCE_REQUIRED` |
| `servant.ashva.skill.sc-ashva-2` | `SOURCE_EVIDENCE_REQUIRED` | `none` | `specific_handler` | `NONE` | `NONE` | `NONE` | `NONE` | `SEMANTIC_SOURCE_REQUIRED` |
| `servant.ashva.skill.sc-ashva-3` | `SOURCE_EVIDENCE_REQUIRED` | `none` | `specific_handler` | `NONE` | `NONE` | `NONE` | `NONE` | `SEMANTIC_SOURCE_REQUIRED` |
| `servant.astolfo.skill.sc-astolfo-1` | `READY_GENERIC_EXTENSION` | `none` | `shared_handler` | `BATTLE_RESULT`, `CONDITION`, `HIDDEN_INFORMATION`, `INTERACTION`, `RESULT_BINDING`, `TARGET_SELECTION` | `GENERIC_BATTLE_INTEGRATION`, `GENERIC_CONDITION_EVALUATION`, `GENERIC_PENDING_INTERACTION`, `GENERIC_RESULT_BINDING`, `GENERIC_TARGET_SELECTION`, `GENERIC_VISIBILITY` | `NONE` | `NONE` | `NONE` |
| `servant.astolfo.skill.sc-astolfo-2` | `SOURCE_EVIDENCE_REQUIRED` | `none` | `specific_handler` | `NONE` | `NONE` | `NONE` | `NONE` | `SEMANTIC_SOURCE_REQUIRED` |
| `servant.astolfo.skill.sc-astolfo-3` | `SOURCE_EVIDENCE_REQUIRED` | `none` | `specific_handler` | `NONE` | `NONE` | `NONE` | `NONE` | `SEMANTIC_SOURCE_REQUIRED` |
| `servant.astraea.skill.sc-astraea-1` | `SOURCE_EVIDENCE_REQUIRED` | `none` | `shared_handler` | `NONE` | `NONE` | `NONE` | `NONE` | `SEMANTIC_SOURCE_REQUIRED` |
| `servant.astraea.skill.sc-astraea-2` | `SOURCE_EVIDENCE_REQUIRED` | `none` | `specific_handler` | `NONE` | `NONE` | `NONE` | `NONE` | `SEMANTIC_SOURCE_REQUIRED` |
| `servant.astraea.skill.sc-astraea-3` | `SOURCE_EVIDENCE_REQUIRED` | `none` | `specific_handler` | `NONE` | `NONE` | `NONE` | `NONE` | `SEMANTIC_SOURCE_REQUIRED` |
| `servant.atalanta.skill.sc-atalanta-1` | `READY_GENERIC_EXTENSION` | `none` | `shared_handler` | `CONDITION`, `HIDDEN_INFORMATION`, `LIFECYCLE`, `MODIFIER` | `GENERIC_CONDITION_EVALUATION`, `GENERIC_LIFECYCLE_POLICY`, `GENERIC_MODIFIER`, `GENERIC_VISIBILITY` | `NONE` | `NONE` | `NONE` |
| `servant.atalanta.skill.sc-atalanta-2` | `READY_GENERIC_EXTENSION` | `none` | `shared_handler` | `CONDITION`, `INTERACTION`, `LIFECYCLE`, `RESULT_BINDING`, `TARGET_SELECTION` | `GENERIC_CONDITION_EVALUATION`, `GENERIC_LIFECYCLE_POLICY`, `GENERIC_PENDING_INTERACTION`, `GENERIC_RESULT_BINDING`, `GENERIC_TARGET_SELECTION` | `NONE` | `NONE` | `NONE` |
| `servant.atalanta.skill.sc-atalanta-3` | `SOURCE_EVIDENCE_REQUIRED` | `none` | `shared_handler` | `NONE` | `NONE` | `NONE` | `NONE` | `SEMANTIC_SOURCE_REQUIRED` |
| `servant.avicebron.skill.sc-avicebron-1` | `SOURCE_EVIDENCE_REQUIRED` | `none` | `shared_handler` | `NONE` | `NONE` | `NONE` | `NONE` | `SEMANTIC_SOURCE_REQUIRED` |
| `servant.avicebron.skill.sc-avicebron-2` | `SOURCE_EVIDENCE_REQUIRED` | `none` | `shared_handler` | `NONE` | `NONE` | `NONE` | `NONE` | `SEMANTIC_SOURCE_REQUIRED` |
| `servant.avicebron.skill.sc-avicebron-3` | `SOURCE_EVIDENCE_REQUIRED` | `none` | `shared_handler` | `NONE` | `NONE` | `NONE` | `NONE` | `SEMANTIC_SOURCE_REQUIRED` |
| `servant.avicebron.skill.sc-avicebron-4` | `SOURCE_EVIDENCE_REQUIRED` | `none` | `shared_handler` | `NONE` | `NONE` | `NONE` | `NONE` | `SEMANTIC_SOURCE_REQUIRED` |
| `servant.avicebron.skill.sc-avicebron-5` | `SOURCE_EVIDENCE_REQUIRED` | `none` | `shared_handler` | `NONE` | `NONE` | `NONE` | `NONE` | `SEMANTIC_SOURCE_REQUIRED` |
| `servant.baobhan.skill.sc-baobhan-1` | `SOURCE_EVIDENCE_REQUIRED` | `none` | `specific_handler` | `NONE` | `NONE` | `NONE` | `NONE` | `SEMANTIC_SOURCE_REQUIRED` |
| `servant.baobhan.skill.sc-baobhan-2` | `SOURCE_EVIDENCE_REQUIRED` | `none` | `specific_handler` | `NONE` | `NONE` | `NONE` | `NONE` | `SEMANTIC_SOURCE_REQUIRED` |
| `servant.baobhan.skill.sc-baobhan-3` | `SOURCE_EVIDENCE_REQUIRED` | `none` | `shared_handler` | `NONE` | `NONE` | `NONE` | `NONE` | `SEMANTIC_SOURCE_REQUIRED` |
| `servant.barghest.skill.sc-barghest-1` | `SOURCE_EVIDENCE_REQUIRED` | `none` | `specific_handler` | `NONE` | `NONE` | `NONE` | `NONE` | `SEMANTIC_SOURCE_REQUIRED` |
| `servant.barghest.skill.sc-barghest-2` | `SOURCE_EVIDENCE_REQUIRED` | `none` | `specific_handler` | `NONE` | `NONE` | `NONE` | `NONE` | `SEMANTIC_SOURCE_REQUIRED` |
| `servant.barghest.skill.sc-barghest-3` | `SOURCE_EVIDENCE_REQUIRED` | `none` | `specific_handler` | `NONE` | `NONE` | `NONE` | `NONE` | `SEMANTIC_SOURCE_REQUIRED` |
| `servant.bb.skill.sc-bb-1` | `SOURCE_EVIDENCE_REQUIRED` | `none` | `shared_handler` | `NONE` | `NONE` | `NONE` | `NONE` | `SEMANTIC_SOURCE_REQUIRED` |
| `servant.bb.skill.sc-bb-2` | `SOURCE_EVIDENCE_REQUIRED` | `none` | `shared_handler` | `NONE` | `NONE` | `NONE` | `NONE` | `SEMANTIC_SOURCE_REQUIRED` |
| `servant.bb.skill.sc-bb-3` | `SOURCE_EVIDENCE_REQUIRED` | `none` | `shared_handler` | `NONE` | `NONE` | `NONE` | `NONE` | `SEMANTIC_SOURCE_REQUIRED` |
| `servant.bb.skill.sc-bb-4` | `SOURCE_EVIDENCE_REQUIRED` | `none` | `shared_handler` | `NONE` | `NONE` | `NONE` | `NONE` | `SEMANTIC_SOURCE_REQUIRED` |
| `servant.bedivere.skill.sc-bedivere-1` | `SOURCE_EVIDENCE_REQUIRED` | `none` | `shared_handler` | `NONE` | `NONE` | `NONE` | `NONE` | `SEMANTIC_SOURCE_REQUIRED` |
| `servant.bedivere.skill.sc-bedivere-2` | `SOURCE_EVIDENCE_REQUIRED` | `none` | `specific_handler` | `NONE` | `NONE` | `NONE` | `NONE` | `SEMANTIC_SOURCE_REQUIRED` |
| `servant.bedivere.skill.sc-bedivere-3` | `SOURCE_EVIDENCE_REQUIRED` | `none` | `specific_handler` | `NONE` | `NONE` | `NONE` | `NONE` | `SEMANTIC_SOURCE_REQUIRED` |
| `servant.benkei.skill.sc-benkei-1` | `SOURCE_EVIDENCE_REQUIRED` | `none` | `shared_handler` | `NONE` | `NONE` | `NONE` | `NONE` | `SEMANTIC_SOURCE_REQUIRED` |
| `servant.benkei.skill.sc-benkei-2` | `SOURCE_EVIDENCE_REQUIRED` | `none` | `specific_handler` | `NONE` | `NONE` | `NONE` | `NONE` | `SEMANTIC_SOURCE_REQUIRED` |
| `servant.benkei.skill.sc-benkei-3` | `SOURCE_EVIDENCE_REQUIRED` | `none` | `specific_handler` | `NONE` | `NONE` | `NONE` | `NONE` | `SEMANTIC_SOURCE_REQUIRED` |
| `servant.bikuni.skill.sc-bikuni-1` | `SOURCE_EVIDENCE_REQUIRED` | `none` | `shared_handler` | `NONE` | `NONE` | `NONE` | `NONE` | `SEMANTIC_SOURCE_REQUIRED` |
| `servant.bikuni.skill.sc-bikuni-2` | `SOURCE_EVIDENCE_REQUIRED` | `none` | `shared_handler` | `NONE` | `NONE` | `NONE` | `NONE` | `SEMANTIC_SOURCE_REQUIRED` |
| `servant.bikuni.skill.sc-bikuni-3` | `SOURCE_EVIDENCE_REQUIRED` | `none` | `shared_handler` | `NONE` | `NONE` | `NONE` | `NONE` | `SEMANTIC_SOURCE_REQUIRED` |
| `servant.bikuni.skill.sc-bikuni-4` | `SOURCE_EVIDENCE_REQUIRED` | `none` | `shared_handler` | `NONE` | `NONE` | `NONE` | `NONE` | `SEMANTIC_SOURCE_REQUIRED` |
| `servant.billy.skill.sc-billy-1` | `SOURCE_EVIDENCE_REQUIRED` | `none` | `specific_handler` | `NONE` | `NONE` | `NONE` | `NONE` | `SEMANTIC_SOURCE_REQUIRED` |
| `servant.billy.skill.sc-billy-2` | `SOURCE_EVIDENCE_REQUIRED` | `none` | `specific_handler` | `NONE` | `NONE` | `NONE` | `NONE` | `SEMANTIC_SOURCE_REQUIRED` |
| `servant.billy.skill.sc-billy-3` | `SOURCE_EVIDENCE_REQUIRED` | `none` | `specific_handler` | `NONE` | `NONE` | `NONE` | `NONE` | `SEMANTIC_SOURCE_REQUIRED` |
| `servant.boudica.skill.sc-boudica-1` | `SOURCE_EVIDENCE_REQUIRED` | `none` | `shared_handler` | `NONE` | `NONE` | `NONE` | `NONE` | `SEMANTIC_SOURCE_REQUIRED` |
| `servant.boudica.skill.sc-boudica-2` | `SOURCE_EVIDENCE_REQUIRED` | `none` | `shared_handler` | `NONE` | `NONE` | `NONE` | `NONE` | `SEMANTIC_SOURCE_REQUIRED` |
| `servant.boudica.skill.sc-boudica-3` | `SOURCE_EVIDENCE_REQUIRED` | `none` | `shared_handler` | `NONE` | `NONE` | `NONE` | `NONE` | `SEMANTIC_SOURCE_REQUIRED` |
| `servant.bradamante.skill.sc-bradamante-1` | `SOURCE_EVIDENCE_REQUIRED` | `none` | `shared_handler` | `NONE` | `NONE` | `NONE` | `NONE` | `SEMANTIC_SOURCE_REQUIRED` |
| `servant.bradamante.skill.sc-bradamante-2` | `SOURCE_EVIDENCE_REQUIRED` | `none` | `specific_handler` | `NONE` | `NONE` | `NONE` | `NONE` | `SEMANTIC_SOURCE_REQUIRED` |
| `servant.bradamante.skill.sc-bradamante-3` | `SOURCE_EVIDENCE_REQUIRED` | `none` | `specific_handler` | `NONE` | `NONE` | `NONE` | `NONE` | `SEMANTIC_SOURCE_REQUIRED` |
| `servant.brynhildr.skill.sc-brynhildr-1` | `SOURCE_EVIDENCE_REQUIRED` | `none` | `shared_handler` | `NONE` | `NONE` | `NONE` | `NONE` | `SEMANTIC_SOURCE_REQUIRED` |
| `servant.brynhildr.skill.sc-brynhildr-2` | `SOURCE_EVIDENCE_REQUIRED` | `none` | `specific_handler` | `NONE` | `NONE` | `NONE` | `NONE` | `SEMANTIC_SOURCE_REQUIRED` |
| `servant.brynhildr.skill.sc-brynhildr-3` | `SOURCE_EVIDENCE_REQUIRED` | `none` | `shared_handler` | `NONE` | `NONE` | `NONE` | `NONE` | `SEMANTIC_SOURCE_REQUIRED` |
| `servant.caenis.skill.sc-caenis-1` | `SOURCE_EVIDENCE_REQUIRED` | `none` | `specific_handler` | `NONE` | `NONE` | `NONE` | `NONE` | `SEMANTIC_SOURCE_REQUIRED` |
| `servant.caenis.skill.sc-caenis-2` | `SOURCE_EVIDENCE_REQUIRED` | `none` | `specific_handler` | `NONE` | `NONE` | `NONE` | `NONE` | `SEMANTIC_SOURCE_REQUIRED` |
| `servant.caenis.skill.sc-caenis-3` | `SOURCE_EVIDENCE_REQUIRED` | `none` | `specific_handler` | `NONE` | `NONE` | `NONE` | `NONE` | `SEMANTIC_SOURCE_REQUIRED` |
| `servant.caligula.skill.sc-caligula-1` | `READY_GENERIC_EXTENSION` | `none` | `shared_handler` | `CARD_ACTION_SEMANTICS`, `CONDITION`, `INTERACTION`, `LIFECYCLE`, `MODIFIER`, `RESULT_BINDING`, `TARGET_SELECTION` | `CARD_ACTION_PLAY`, `GENERIC_CONDITION_EVALUATION`, `GENERIC_LIFECYCLE_POLICY`, `GENERIC_MODIFIER`, `GENERIC_PENDING_INTERACTION`, `GENERIC_RESULT_BINDING`, `GENERIC_TARGET_SELECTION` | `NONE` | `NONE` | `NONE` |
| `servant.caligula.skill.sc-caligula-2` | `SOURCE_EVIDENCE_REQUIRED` | `none` | `specific_handler` | `NONE` | `NONE` | `NONE` | `NONE` | `SEMANTIC_SOURCE_REQUIRED` |
| `servant.caligula.skill.sc-caligula-3` | `SOURCE_EVIDENCE_REQUIRED` | `none` | `specific_handler` | `NONE` | `NONE` | `NONE` | `NONE` | `SEMANTIC_SOURCE_REQUIRED` |
| `servant.carmilla.skill.sc-carmilla-1` | `SOURCE_EVIDENCE_REQUIRED` | `none` | `specific_handler` | `NONE` | `NONE` | `NONE` | `NONE` | `SEMANTIC_SOURCE_REQUIRED` |
| `servant.carmilla.skill.sc-carmilla-2` | `SOURCE_EVIDENCE_REQUIRED` | `none` | `specific_handler` | `NONE` | `NONE` | `NONE` | `NONE` | `SEMANTIC_SOURCE_REQUIRED` |
| `servant.carmilla.skill.sc-carmilla-3` | `SOURCE_EVIDENCE_REQUIRED` | `none` | `specific_handler` | `NONE` | `NONE` | `NONE` | `NONE` | `SEMANTIC_SOURCE_REQUIRED` |
| `servant.charlemagne.skill.sc-charlemagne-1` | `SOURCE_EVIDENCE_REQUIRED` | `none` | `specific_handler` | `NONE` | `NONE` | `NONE` | `NONE` | `SEMANTIC_SOURCE_REQUIRED` |
| `servant.charlemagne.skill.sc-charlemagne-2` | `SOURCE_EVIDENCE_REQUIRED` | `none` | `specific_handler` | `NONE` | `NONE` | `NONE` | `NONE` | `SEMANTIC_SOURCE_REQUIRED` |
| `servant.charlemagne.skill.sc-charlemagne-3` | `SOURCE_EVIDENCE_REQUIRED` | `none` | `shared_handler` | `NONE` | `NONE` | `NONE` | `NONE` | `SEMANTIC_SOURCE_REQUIRED` |
| `servant.chiron.skill.sc-chiron-1` | `SOURCE_EVIDENCE_REQUIRED` | `none` | `shared_handler` | `NONE` | `NONE` | `NONE` | `NONE` | `SEMANTIC_SOURCE_REQUIRED` |
| `servant.chiron.skill.sc-chiron-2` | `SOURCE_EVIDENCE_REQUIRED` | `none` | `shared_handler` | `NONE` | `NONE` | `NONE` | `NONE` | `SEMANTIC_SOURCE_REQUIRED` |
| `servant.chiron.skill.sc-chiron-3` | `SOURCE_EVIDENCE_REQUIRED` | `none` | `specific_handler` | `NONE` | `NONE` | `NONE` | `NONE` | `SEMANTIC_SOURCE_REQUIRED` |
| `servant.chloe.skill.sc-chloe-1` | `READY_GENERIC_EXTENSION` | `none` | `shared_handler` | `CARD_ACTION_SEMANTICS`, `CONDITION`, `HIDDEN_INFORMATION`, `INTERACTION`, `LIFECYCLE`, `RESULT_BINDING`, `TARGET_SELECTION` | `CARD_ACTION_CLOSE`, `CARD_ACTION_PLAY`, `GENERIC_CONDITION_EVALUATION`, `GENERIC_LIFECYCLE_POLICY`, `GENERIC_PENDING_INTERACTION`, `GENERIC_RESULT_BINDING`, `GENERIC_TARGET_SELECTION`, `GENERIC_VISIBILITY` | `NONE` | `NONE` | `NONE` |
| `servant.chloe.skill.sc-chloe-2` | `SOURCE_EVIDENCE_REQUIRED` | `none` | `specific_handler` | `NONE` | `NONE` | `NONE` | `NONE` | `SEMANTIC_SOURCE_REQUIRED` |
| `servant.chloe.skill.sc-chloe-3` | `SOURCE_EVIDENCE_REQUIRED` | `none` | `specific_handler` | `NONE` | `NONE` | `NONE` | `NONE` | `SEMANTIC_SOURCE_REQUIRED` |
| `servant.clytie.skill.sc-clytie-1` | `SOURCE_EVIDENCE_REQUIRED` | `none` | `specific_handler` | `NONE` | `NONE` | `NONE` | `NONE` | `SEMANTIC_SOURCE_REQUIRED` |
| `servant.clytie.skill.sc-clytie-2` | `SOURCE_EVIDENCE_REQUIRED` | `none` | `specific_handler` | `NONE` | `NONE` | `NONE` | `NONE` | `SEMANTIC_SOURCE_REQUIRED` |
| `servant.clytie.skill.sc-clytie-3` | `READY_GENERIC_EXTENSION` | `none` | `shared_handler` | `CARD_ZONE`, `CONDITION`, `TRIGGER` | `GENERIC_CARD_ZONE`, `GENERIC_CONDITION_EVALUATION`, `GENERIC_TRIGGER_GATEWAY` | `NONE` | `NONE` | `NONE` |
| `servant.clytie.skill.sc-clytie-4` | `SOURCE_EVIDENCE_REQUIRED` | `none` | `shared_handler` | `NONE` | `NONE` | `NONE` | `NONE` | `SEMANTIC_SOURCE_REQUIRED` |
| `servant.constantine.skill.sc-constantine-1` | `SOURCE_EVIDENCE_REQUIRED` | `none` | `shared_handler` | `NONE` | `NONE` | `NONE` | `NONE` | `SEMANTIC_SOURCE_REQUIRED` |
| `servant.constantine.skill.sc-constantine-2` | `SOURCE_EVIDENCE_REQUIRED` | `none` | `shared_handler` | `NONE` | `NONE` | `NONE` | `NONE` | `SEMANTIC_SOURCE_REQUIRED` |
| `servant.constantine.skill.sc-constantine-3` | `SOURCE_EVIDENCE_REQUIRED` | `none` | `specific_handler` | `NONE` | `NONE` | `NONE` | `NONE` | `SEMANTIC_SOURCE_REQUIRED` |
| `servant.corday.skill.sc-corday-1` | `SOURCE_EVIDENCE_REQUIRED` | `none` | `shared_handler` | `NONE` | `NONE` | `NONE` | `NONE` | `SEMANTIC_SOURCE_REQUIRED` |
| `servant.corday.skill.sc-corday-2` | `SOURCE_EVIDENCE_REQUIRED` | `none` | `specific_handler` | `NONE` | `NONE` | `NONE` | `NONE` | `SEMANTIC_SOURCE_REQUIRED` |
| `servant.corday.skill.sc-corday-3` | `SOURCE_EVIDENCE_REQUIRED` | `none` | `specific_handler` | `NONE` | `NONE` | `NONE` | `NONE` | `SEMANTIC_SOURCE_REQUIRED` |
| `servant.cu-alter.skill.sc-cu-alter-1` | `SOURCE_EVIDENCE_REQUIRED` | `none` | `specific_handler` | `NONE` | `NONE` | `NONE` | `NONE` | `SEMANTIC_SOURCE_REQUIRED` |
| `servant.cu-alter.skill.sc-cu-alter-2` | `SOURCE_EVIDENCE_REQUIRED` | `none` | `specific_handler` | `NONE` | `NONE` | `NONE` | `NONE` | `SEMANTIC_SOURCE_REQUIRED` |
| `servant.cu-alter.skill.sc-cu-alter-3` | `SOURCE_EVIDENCE_REQUIRED` | `none` | `specific_handler` | `NONE` | `NONE` | `NONE` | `NONE` | `SEMANTIC_SOURCE_REQUIRED` |
| `servant.cu.skill.sc-cu-1` | `SOURCE_EVIDENCE_REQUIRED` | `none` | `specific_handler` | `NONE` | `NONE` | `NONE` | `NONE` | `SEMANTIC_SOURCE_REQUIRED` |
| `servant.cu.skill.sc-cu-2` | `SOURCE_EVIDENCE_REQUIRED` | `none` | `shared_handler` | `NONE` | `NONE` | `NONE` | `NONE` | `SEMANTIC_SOURCE_REQUIRED` |
| `servant.cu.skill.sc-cu-np` | `SOURCE_EVIDENCE_REQUIRED` | `none` | `specific_handler` | `NONE` | `NONE` | `NONE` | `NONE` | `SEMANTIC_SOURCE_REQUIRED` |
| `servant.dantes.skill.sc-dantes-1` | `SOURCE_EVIDENCE_REQUIRED` | `none` | `specific_handler` | `NONE` | `NONE` | `NONE` | `NONE` | `SEMANTIC_SOURCE_REQUIRED` |
| `servant.dantes.skill.sc-dantes-2` | `SOURCE_EVIDENCE_REQUIRED` | `none` | `specific_handler` | `NONE` | `NONE` | `NONE` | `NONE` | `SEMANTIC_SOURCE_REQUIRED` |
| `servant.dantes.skill.sc-dantes-3` | `SOURCE_EVIDENCE_REQUIRED` | `none` | `specific_handler` | `NONE` | `NONE` | `NONE` | `NONE` | `SEMANTIC_SOURCE_REQUIRED` |
| `servant.danzou.skill.sc-danzou-1` | `SOURCE_EVIDENCE_REQUIRED` | `none` | `specific_handler` | `NONE` | `NONE` | `NONE` | `NONE` | `SEMANTIC_SOURCE_REQUIRED` |
| `servant.danzou.skill.sc-danzou-2` | `SOURCE_EVIDENCE_REQUIRED` | `none` | `specific_handler` | `NONE` | `NONE` | `NONE` | `NONE` | `SEMANTIC_SOURCE_REQUIRED` |
| `servant.danzou.skill.sc-danzou-3` | `SOURCE_EVIDENCE_REQUIRED` | `none` | `shared_handler` | `NONE` | `NONE` | `NONE` | `NONE` | `SEMANTIC_SOURCE_REQUIRED` |
| `servant.darius.skill.sc-darius-1` | `READY_GENERIC_EXTENSION` | `none` | `shared_handler` | `BATTLE_RESULT`, `CARD_ACTION_SEMANTICS`, `CONDITION`, `LIFECYCLE`, `TRIGGER` | `CARD_ACTION_CLOSE`, `GENERIC_BATTLE_INTEGRATION`, `GENERIC_CONDITION_EVALUATION`, `GENERIC_LIFECYCLE_POLICY`, `GENERIC_TRIGGER_GATEWAY` | `NONE` | `NONE` | `NONE` |
| `servant.darius.skill.sc-darius-2` | `READY_GENERIC_EXTENSION` | `none` | `shared_handler` | `CONDITION`, `HIDDEN_INFORMATION`, `LIFECYCLE`, `MODIFIER` | `GENERIC_CONDITION_EVALUATION`, `GENERIC_LIFECYCLE_POLICY`, `GENERIC_MODIFIER`, `GENERIC_VISIBILITY` | `NONE` | `NONE` | `NONE` |
| `servant.darius.skill.sc-darius-3` | `READY_GENERIC_EXTENSION` | `none` | `shared_handler` | `CARD_ACTION_SEMANTICS`, `CONDITION`, `HIDDEN_INFORMATION`, `LIFECYCLE` | `CARD_ACTION_CREATE_AND_ACTIVATE`, `GENERIC_CONDITION_EVALUATION`, `GENERIC_LIFECYCLE_POLICY`, `GENERIC_VISIBILITY` | `NONE` | `NONE` | `NONE` |
| `servant.darius.skill.sc-darius-4` | `SOURCE_EVIDENCE_REQUIRED` | `none` | `shared_handler` | `NONE` | `NONE` | `NONE` | `NONE` | `SEMANTIC_SOURCE_REQUIRED` |
| `servant.davinci.skill.sc-davinci-1` | `SOURCE_EVIDENCE_REQUIRED` | `none` | `shared_handler` | `NONE` | `NONE` | `NONE` | `NONE` | `SEMANTIC_SOURCE_REQUIRED` |
| `servant.davinci.skill.sc-davinci-10` | `SOURCE_EVIDENCE_REQUIRED` | `none` | `specific_handler` | `NONE` | `NONE` | `NONE` | `NONE` | `SEMANTIC_SOURCE_REQUIRED` |
| `servant.davinci.skill.sc-davinci-11` | `SOURCE_EVIDENCE_REQUIRED` | `none` | `specific_handler` | `NONE` | `NONE` | `NONE` | `NONE` | `SEMANTIC_SOURCE_REQUIRED` |
| `servant.davinci.skill.sc-davinci-12` | `SOURCE_EVIDENCE_REQUIRED` | `none` | `specific_handler` | `NONE` | `NONE` | `NONE` | `NONE` | `SEMANTIC_SOURCE_REQUIRED` |
| `servant.davinci.skill.sc-davinci-13` | `SOURCE_EVIDENCE_REQUIRED` | `none` | `specific_handler` | `NONE` | `NONE` | `NONE` | `NONE` | `SEMANTIC_SOURCE_REQUIRED` |
| `servant.davinci.skill.sc-davinci-14` | `SOURCE_EVIDENCE_REQUIRED` | `none` | `specific_handler` | `NONE` | `NONE` | `NONE` | `NONE` | `SEMANTIC_SOURCE_REQUIRED` |
| `servant.davinci.skill.sc-davinci-15` | `SOURCE_EVIDENCE_REQUIRED` | `none` | `specific_handler` | `NONE` | `NONE` | `NONE` | `NONE` | `SEMANTIC_SOURCE_REQUIRED` |
| `servant.davinci.skill.sc-davinci-16` | `SOURCE_EVIDENCE_REQUIRED` | `none` | `specific_handler` | `NONE` | `NONE` | `NONE` | `NONE` | `SEMANTIC_SOURCE_REQUIRED` |
| `servant.davinci.skill.sc-davinci-17` | `SOURCE_EVIDENCE_REQUIRED` | `none` | `specific_handler` | `NONE` | `NONE` | `NONE` | `NONE` | `SEMANTIC_SOURCE_REQUIRED` |
| `servant.davinci.skill.sc-davinci-2` | `SOURCE_EVIDENCE_REQUIRED` | `none` | `shared_handler` | `NONE` | `NONE` | `NONE` | `NONE` | `SEMANTIC_SOURCE_REQUIRED` |
| `servant.davinci.skill.sc-davinci-3` | `SOURCE_EVIDENCE_REQUIRED` | `none` | `shared_handler` | `NONE` | `NONE` | `NONE` | `NONE` | `SEMANTIC_SOURCE_REQUIRED` |
| `servant.davinci.skill.sc-davinci-4` | `SOURCE_EVIDENCE_REQUIRED` | `none` | `specific_handler` | `NONE` | `NONE` | `NONE` | `NONE` | `SEMANTIC_SOURCE_REQUIRED` |
| `servant.davinci.skill.sc-davinci-5` | `SOURCE_EVIDENCE_REQUIRED` | `none` | `specific_handler` | `NONE` | `NONE` | `NONE` | `NONE` | `SEMANTIC_SOURCE_REQUIRED` |
| `servant.davinci.skill.sc-davinci-6` | `SOURCE_EVIDENCE_REQUIRED` | `none` | `specific_handler` | `NONE` | `NONE` | `NONE` | `NONE` | `SEMANTIC_SOURCE_REQUIRED` |
| `servant.davinci.skill.sc-davinci-7` | `SOURCE_EVIDENCE_REQUIRED` | `none` | `shared_handler` | `NONE` | `NONE` | `NONE` | `NONE` | `SEMANTIC_SOURCE_REQUIRED` |
| `servant.davinci.skill.sc-davinci-8` | `SOURCE_EVIDENCE_REQUIRED` | `none` | `deterministic` | `NONE` | `NONE` | `NONE` | `NONE` | `SEMANTIC_SOURCE_REQUIRED` |
| `servant.davinci.skill.sc-davinci-9` | `SOURCE_EVIDENCE_REQUIRED` | `none` | `shared_handler` | `NONE` | `NONE` | `NONE` | `NONE` | `SEMANTIC_SOURCE_REQUIRED` |
| `servant.deon.skill.sc-deon-1` | `SOURCE_EVIDENCE_REQUIRED` | `none` | `specific_handler` | `NONE` | `NONE` | `NONE` | `NONE` | `SEMANTIC_SOURCE_REQUIRED` |
| `servant.deon.skill.sc-deon-2` | `SOURCE_EVIDENCE_REQUIRED` | `none` | `specific_handler` | `NONE` | `NONE` | `NONE` | `NONE` | `SEMANTIC_SOURCE_REQUIRED` |
| `servant.deon.skill.sc-deon-3` | `SOURCE_EVIDENCE_REQUIRED` | `none` | `specific_handler` | `NONE` | `NONE` | `NONE` | `NONE` | `SEMANTIC_SOURCE_REQUIRED` |
| `servant.diarmuid.skill.sc-diarmuid-1` | `SPECIAL_HANDLER_CANDIDATE` | `none` | `shared_handler` | `BATTLE_RESULT`, `CONDITION`, `LIFECYCLE`, `SPECIAL_SUBSYSTEM`, `TRIGGER` | `GENERIC_BATTLE_INTEGRATION`, `GENERIC_CONDITION_EVALUATION`, `GENERIC_LIFECYCLE_POLICY`, `GENERIC_STATUS_STATE`, `GENERIC_TRIGGER_GATEWAY`, `REVIEWED_SPECIAL_HANDLER` | `NONE` | `NONE` | `SPECIAL_EFFECT:sequester_random_inactive_servant_skill` |
| `servant.diarmuid.skill.sc-diarmuid-2` | `SOURCE_EVIDENCE_REQUIRED` | `none` | `specific_handler` | `NONE` | `NONE` | `NONE` | `NONE` | `SEMANTIC_SOURCE_REQUIRED` |
| `servant.diarmuid.skill.sc-diarmuid-3` | `SOURCE_EVIDENCE_REQUIRED` | `none` | `shared_handler` | `NONE` | `NONE` | `NONE` | `NONE` | `SEMANTIC_SOURCE_REQUIRED` |
| `servant.dioscuri.skill.sc-dioscuri-1` | `SOURCE_EVIDENCE_REQUIRED` | `none` | `specific_handler` | `NONE` | `NONE` | `NONE` | `NONE` | `SEMANTIC_SOURCE_REQUIRED` |
| `servant.dioscuri.skill.sc-dioscuri-2` | `SOURCE_EVIDENCE_REQUIRED` | `none` | `specific_handler` | `NONE` | `NONE` | `NONE` | `NONE` | `SEMANTIC_SOURCE_REQUIRED` |
| `servant.dioscuri.skill.sc-dioscuri-3` | `SOURCE_EVIDENCE_REQUIRED` | `none` | `specific_handler` | `NONE` | `NONE` | `NONE` | `NONE` | `SEMANTIC_SOURCE_REQUIRED` |
| `servant.donquixote.skill.sc-donquixote-1` | `SOURCE_EVIDENCE_REQUIRED` | `none` | `shared_handler` | `NONE` | `NONE` | `NONE` | `NONE` | `SEMANTIC_SOURCE_REQUIRED` |
| `servant.donquixote.skill.sc-donquixote-2` | `SOURCE_EVIDENCE_REQUIRED` | `none` | `shared_handler` | `NONE` | `NONE` | `NONE` | `NONE` | `SEMANTIC_SOURCE_REQUIRED` |
| `servant.donquixote.skill.sc-donquixote-3` | `SOURCE_EVIDENCE_REQUIRED` | `none` | `shared_handler` | `NONE` | `NONE` | `NONE` | `NONE` | `SEMANTIC_SOURCE_REQUIRED` |
| `servant.douman.skill.sc-douman-1` | `SOURCE_EVIDENCE_REQUIRED` | `none` | `specific_handler` | `NONE` | `NONE` | `NONE` | `NONE` | `SEMANTIC_SOURCE_REQUIRED` |
| `servant.douman.skill.sc-douman-2` | `SOURCE_EVIDENCE_REQUIRED` | `none` | `specific_handler` | `NONE` | `NONE` | `NONE` | `NONE` | `SEMANTIC_SOURCE_REQUIRED` |
| `servant.douman.skill.sc-douman-3` | `SOURCE_EVIDENCE_REQUIRED` | `none` | `shared_handler` | `NONE` | `NONE` | `NONE` | `NONE` | `SEMANTIC_SOURCE_REQUIRED` |
| `servant.drake.skill.sc-drake-1` | `SOURCE_EVIDENCE_REQUIRED` | `legacy` | `shared_handler` | `NONE` | `NONE` | `NONE` | `NONE` | `SEMANTIC_SOURCE_REQUIRED` |
| `servant.drake.skill.sc-drake-2` | `READY_GENERIC_EXTENSION` | `legacy` | `shared_handler` | `CONDITION`, `HIDDEN_INFORMATION`, `INTERACTION`, `MOVEMENT`, `RESULT_BINDING`, `TARGET_SELECTION` | `GENERIC_CONDITION_EVALUATION`, `GENERIC_MOVEMENT`, `GENERIC_PENDING_INTERACTION`, `GENERIC_RESULT_BINDING`, `GENERIC_TARGET_SELECTION`, `GENERIC_VISIBILITY` | `NONE` | `NONE` | `NONE` |
| `servant.drake.skill.sc-drake-3` | `READY_GENERIC_EXTENSION` | `legacy` | `shared_handler` | `CONDITION`, `MODIFIER`, `RESOURCE_NUMERIC` | `GENERIC_CONDITION_EVALUATION`, `GENERIC_MODIFIER`, `GENERIC_RESOURCE_NUMERIC` | `NONE` | `NONE` | `NONE` |
| `servant.edison.skill.sc-edison-1` | `SOURCE_EVIDENCE_REQUIRED` | `none` | `specific_handler` | `NONE` | `NONE` | `NONE` | `NONE` | `SEMANTIC_SOURCE_REQUIRED` |
| `servant.edison.skill.sc-edison-2` | `READY_GENERIC_EXTENSION` | `none` | `shared_handler` | `CARD_ACTION_SEMANTICS`, `CONDITION`, `LIFECYCLE`, `RESOURCE_NUMERIC`, `TRIGGER` | `CARD_ACTION_CLOSE`, `GENERIC_CONDITION_EVALUATION`, `GENERIC_LIFECYCLE_POLICY`, `GENERIC_RESOURCE_NUMERIC`, `GENERIC_TRIGGER_GATEWAY` | `NONE` | `NONE` | `NONE` |
| `servant.edison.skill.sc-edison-3` | `READY_GENERIC_EXTENSION` | `none` | `shared_handler` | `BATTLE_RESULT`, `CARD_ACTION_SEMANTICS`, `CONDITION`, `HIDDEN_INFORMATION`, `LIFECYCLE`, `MODIFIER`, `TRIGGER` | `CARD_ACTION_CLOSE`, `GENERIC_BATTLE_INTEGRATION`, `GENERIC_CONDITION_EVALUATION`, `GENERIC_LIFECYCLE_POLICY`, `GENERIC_MODIFIER`, `GENERIC_TRIGGER_GATEWAY`, `GENERIC_VISIBILITY` | `NONE` | `NONE` | `NONE` |
| `servant.elizabeth.skill.sc-elizabeth-1` | `SOURCE_EVIDENCE_REQUIRED` | `none` | `specific_handler` | `NONE` | `NONE` | `NONE` | `NONE` | `SEMANTIC_SOURCE_REQUIRED` |
| `servant.elizabeth.skill.sc-elizabeth-2` | `SOURCE_EVIDENCE_REQUIRED` | `none` | `specific_handler` | `NONE` | `NONE` | `NONE` | `NONE` | `SEMANTIC_SOURCE_REQUIRED` |
| `servant.elizabeth.skill.sc-elizabeth-3` | `SOURCE_EVIDENCE_REQUIRED` | `none` | `specific_handler` | `NONE` | `NONE` | `NONE` | `NONE` | `SEMANTIC_SOURCE_REQUIRED` |
| `servant.emiya-alt.skill.sc-emiya-alt-1` | `SOURCE_EVIDENCE_REQUIRED` | `none` | `shared_handler` | `NONE` | `NONE` | `NONE` | `NONE` | `SEMANTIC_SOURCE_REQUIRED` |
| `servant.emiya-alt.skill.sc-emiya-alt-2` | `SOURCE_EVIDENCE_REQUIRED` | `none` | `specific_handler` | `NONE` | `NONE` | `NONE` | `NONE` | `SEMANTIC_SOURCE_REQUIRED` |
| `servant.emiya-alt.skill.sc-emiya-alt-3` | `SOURCE_EVIDENCE_REQUIRED` | `none` | `specific_handler` | `NONE` | `NONE` | `NONE` | `NONE` | `SEMANTIC_SOURCE_REQUIRED` |
| `servant.emiya.skill.sc-emiya-1` | `SOURCE_EVIDENCE_REQUIRED` | `none` | `shared_handler` | `NONE` | `NONE` | `NONE` | `NONE` | `SEMANTIC_SOURCE_REQUIRED` |
| `servant.emiya.skill.sc-emiya-2` | `SOURCE_EVIDENCE_REQUIRED` | `none` | `specific_handler` | `NONE` | `NONE` | `NONE` | `NONE` | `SEMANTIC_SOURCE_REQUIRED` |
| `servant.emiya.skill.sc-emiya-np` | `READY_GENERIC_EXTENSION` | `none` | `shared_handler` | `CARD_ZONE`, `CONDITION`, `HIDDEN_INFORMATION`, `INTERACTION`, `LIFECYCLE`, `MODIFIER`, `RESULT_BINDING`, `TARGET_SELECTION` | `GENERIC_CARD_ZONE`, `GENERIC_CONDITION_EVALUATION`, `GENERIC_LIFECYCLE_POLICY`, `GENERIC_MODIFIER`, `GENERIC_PENDING_INTERACTION`, `GENERIC_RESULT_BINDING`, `GENERIC_TARGET_SELECTION`, `GENERIC_VISIBILITY` | `NONE` | `NONE` | `NONE` |
| `servant.enkidu.skill.sc-enkidu-1` | `SOURCE_EVIDENCE_REQUIRED` | `none` | `specific_handler` | `NONE` | `NONE` | `NONE` | `NONE` | `SEMANTIC_SOURCE_REQUIRED` |
| `servant.enkidu.skill.sc-enkidu-2` | `SOURCE_EVIDENCE_REQUIRED` | `none` | `specific_handler` | `NONE` | `NONE` | `NONE` | `NONE` | `SEMANTIC_SOURCE_REQUIRED` |
| `servant.enkidu.skill.sc-enkidu-3` | `SOURCE_EVIDENCE_REQUIRED` | `none` | `shared_handler` | `NONE` | `NONE` | `NONE` | `NONE` | `SEMANTIC_SOURCE_REQUIRED` |
| `servant.ereshkigal.skill.sc-ereshkigal-1` | `SOURCE_EVIDENCE_REQUIRED` | `legacy` | `shared_handler` | `NONE` | `NONE` | `NONE` | `NONE` | `SEMANTIC_SOURCE_REQUIRED` |
| `servant.ereshkigal.skill.sc-ereshkigal-2` | `SOURCE_EVIDENCE_REQUIRED` | `legacy` | `specific_handler` | `NONE` | `NONE` | `NONE` | `NONE` | `SEMANTIC_SOURCE_REQUIRED` |
| `servant.ereshkigal.skill.sc-ereshkigal-3` | `SOURCE_EVIDENCE_REQUIRED` | `legacy` | `specific_handler` | `NONE` | `NONE` | `NONE` | `NONE` | `SEMANTIC_SOURCE_REQUIRED` |
| `servant.euryale.skill.sc-euryale-1` | `SOURCE_EVIDENCE_REQUIRED` | `none` | `shared_handler` | `NONE` | `NONE` | `NONE` | `NONE` | `SEMANTIC_SOURCE_REQUIRED` |
| `servant.euryale.skill.sc-euryale-2` | `SOURCE_EVIDENCE_REQUIRED` | `none` | `specific_handler` | `NONE` | `NONE` | `NONE` | `NONE` | `SEMANTIC_SOURCE_REQUIRED` |
| `servant.euryale.skill.sc-euryale-3` | `SOURCE_EVIDENCE_REQUIRED` | `none` | `specific_handler` | `NONE` | `NONE` | `NONE` | `NONE` | `SEMANTIC_SOURCE_REQUIRED` |
| `servant.frank.skill.sc-frank-1` | `SOURCE_EVIDENCE_REQUIRED` | `none` | `shared_handler` | `NONE` | `NONE` | `NONE` | `NONE` | `SEMANTIC_SOURCE_REQUIRED` |
| `servant.frank.skill.sc-frank-2` | `SOURCE_EVIDENCE_REQUIRED` | `none` | `specific_handler` | `NONE` | `NONE` | `NONE` | `NONE` | `SEMANTIC_SOURCE_REQUIRED` |
| `servant.frank.skill.sc-frank-3` | `SOURCE_EVIDENCE_REQUIRED` | `none` | `shared_handler` | `NONE` | `NONE` | `NONE` | `NONE` | `SEMANTIC_SOURCE_REQUIRED` |
| `servant.gareth.skill.sc-gareth-1` | `SOURCE_EVIDENCE_REQUIRED` | `none` | `shared_handler` | `NONE` | `NONE` | `NONE` | `NONE` | `SEMANTIC_SOURCE_REQUIRED` |
| `servant.gareth.skill.sc-gareth-2` | `SOURCE_EVIDENCE_REQUIRED` | `none` | `specific_handler` | `NONE` | `NONE` | `NONE` | `NONE` | `SEMANTIC_SOURCE_REQUIRED` |
| `servant.gareth.skill.sc-gareth-3` | `SOURCE_EVIDENCE_REQUIRED` | `none` | `specific_handler` | `NONE` | `NONE` | `NONE` | `NONE` | `SEMANTIC_SOURCE_REQUIRED` |
| `servant.gawain.skill.sc-gawain-1` | `SOURCE_EVIDENCE_REQUIRED` | `none` | `specific_handler` | `NONE` | `NONE` | `NONE` | `NONE` | `SEMANTIC_SOURCE_REQUIRED` |
| `servant.gawain.skill.sc-gawain-2` | `SOURCE_EVIDENCE_REQUIRED` | `none` | `specific_handler` | `NONE` | `NONE` | `NONE` | `NONE` | `SEMANTIC_SOURCE_REQUIRED` |
| `servant.gawain.skill.sc-gawain-3` | `SOURCE_EVIDENCE_REQUIRED` | `none` | `shared_handler` | `NONE` | `NONE` | `NONE` | `NONE` | `SEMANTIC_SOURCE_REQUIRED` |
| `servant.georgios.skill.sc-georgios-1` | `SOURCE_EVIDENCE_REQUIRED` | `none` | `specific_handler` | `NONE` | `NONE` | `NONE` | `NONE` | `SEMANTIC_SOURCE_REQUIRED` |
| `servant.georgios.skill.sc-georgios-2` | `SOURCE_EVIDENCE_REQUIRED` | `none` | `specific_handler` | `NONE` | `NONE` | `NONE` | `NONE` | `SEMANTIC_SOURCE_REQUIRED` |
| `servant.georgios.skill.sc-georgios-3` | `SOURCE_EVIDENCE_REQUIRED` | `none` | `specific_handler` | `NONE` | `NONE` | `NONE` | `NONE` | `SEMANTIC_SOURCE_REQUIRED` |
| `servant.gil.skill.sc-gil-1` | `SOURCE_EVIDENCE_REQUIRED` | `none` | `shared_handler` | `NONE` | `NONE` | `NONE` | `NONE` | `SEMANTIC_SOURCE_REQUIRED` |
| `servant.gil.skill.sc-gil-2` | `SOURCE_EVIDENCE_REQUIRED` | `none` | `shared_handler` | `NONE` | `NONE` | `NONE` | `NONE` | `SEMANTIC_SOURCE_REQUIRED` |
| `servant.gil.skill.sc-gil-np` | `SOURCE_EVIDENCE_REQUIRED` | `none` | `specific_handler` | `NONE` | `NONE` | `NONE` | `NONE` | `SEMANTIC_SOURCE_REQUIRED` |
| `servant.gilles.skill.sc-gilles-1` | `SOURCE_EVIDENCE_REQUIRED` | `none` | `specific_handler` | `NONE` | `NONE` | `NONE` | `NONE` | `SEMANTIC_SOURCE_REQUIRED` |
| `servant.gilles.skill.sc-gilles-2` | `SOURCE_EVIDENCE_REQUIRED` | `none` | `shared_handler` | `NONE` | `NONE` | `NONE` | `NONE` | `SEMANTIC_SOURCE_REQUIRED` |
| `servant.gilles.skill.sc-gilles-np` | `SOURCE_EVIDENCE_REQUIRED` | `none` | `specific_handler` | `NONE` | `NONE` | `NONE` | `NONE` | `SEMANTIC_SOURCE_REQUIRED` |
| `servant.gorgon.skill.sc-gorgon-1` | `SOURCE_EVIDENCE_REQUIRED` | `none` | `specific_handler` | `NONE` | `NONE` | `NONE` | `NONE` | `SEMANTIC_SOURCE_REQUIRED` |
| `servant.gorgon.skill.sc-gorgon-2` | `READY_GENERIC_EXTENSION` | `none` | `shared_handler` | `BATTLE_RESULT`, `CARD_ACTION_SEMANTICS`, `CONDITION`, `LIFECYCLE`, `MODIFIER`, `TRIGGER` | `CARD_ACTION_CLOSE`, `GENERIC_BATTLE_INTEGRATION`, `GENERIC_CONDITION_EVALUATION`, `GENERIC_LIFECYCLE_POLICY`, `GENERIC_MODIFIER`, `GENERIC_TRIGGER_GATEWAY` | `NONE` | `NONE` | `NONE` |
| `servant.gorgon.skill.sc-gorgon-3` | `SPECIAL_HANDLER_CANDIDATE` | `none` | `shared_handler` | `CONDITION`, `HIDDEN_INFORMATION`, `LIFECYCLE`, `MODIFIER`, `SPECIAL_SUBSYSTEM` | `GENERIC_CONDITION_EVALUATION`, `GENERIC_LIFECYCLE_POLICY`, `GENERIC_MODIFIER`, `GENERIC_VISIBILITY`, `REVIEWED_SPECIAL_HANDLER` | `NONE` | `NONE` | `SPECIAL_EFFECT:defeat_player` |
| `servant.hassan.skill.sc-hassan-1` | `SOURCE_EVIDENCE_REQUIRED` | `none` | `shared_handler` | `NONE` | `NONE` | `NONE` | `NONE` | `SEMANTIC_SOURCE_REQUIRED` |
| `servant.hassan.skill.sc-hassan-2` | `SOURCE_EVIDENCE_REQUIRED` | `none` | `shared_handler` | `NONE` | `NONE` | `NONE` | `NONE` | `SEMANTIC_SOURCE_REQUIRED` |
| `servant.hassan.skill.sc-hassan-np` | `SOURCE_EVIDENCE_REQUIRED` | `none` | `specific_handler` | `NONE` | `NONE` | `NONE` | `NONE` | `SEMANTIC_SOURCE_REQUIRED` |
| `servant.hassanhf.skill.sc-hassanhf-1` | `SOURCE_EVIDENCE_REQUIRED` | `none` | `specific_handler` | `NONE` | `NONE` | `NONE` | `NONE` | `SEMANTIC_SOURCE_REQUIRED` |
| `servant.hassanhf.skill.sc-hassanhf-2` | `SOURCE_EVIDENCE_REQUIRED` | `none` | `specific_handler` | `NONE` | `NONE` | `NONE` | `NONE` | `SEMANTIC_SOURCE_REQUIRED` |
| `servant.hassanhf.skill.sc-hassanhf-3` | `SOURCE_EVIDENCE_REQUIRED` | `none` | `shared_handler` | `NONE` | `NONE` | `NONE` | `NONE` | `SEMANTIC_SOURCE_REQUIRED` |
| `servant.hassanser.skill.sc-hassanser-1` | `SOURCE_EVIDENCE_REQUIRED` | `none` | `shared_handler` | `NONE` | `NONE` | `NONE` | `NONE` | `SEMANTIC_SOURCE_REQUIRED` |
| `servant.hassanser.skill.sc-hassanser-2` | `SOURCE_EVIDENCE_REQUIRED` | `none` | `shared_handler` | `NONE` | `NONE` | `NONE` | `NONE` | `SEMANTIC_SOURCE_REQUIRED` |
| `servant.hassanser.skill.sc-hassanser-3` | `SOURCE_EVIDENCE_REQUIRED` | `none` | `specific_handler` | `NONE` | `NONE` | `NONE` | `NONE` | `SEMANTIC_SOURCE_REQUIRED` |
| `servant.helena.skill.sc-helena-1` | `READY_GENERIC_EXTENSION` | `none` | `shared_handler` | `CARD_ACTION_SEMANTICS`, `CARD_ZONE`, `HIDDEN_INFORMATION`, `INTERACTION`, `RESULT_BINDING`, `TARGET_SELECTION` | `CARD_ACTION_PLAY`, `GENERIC_CARD_ZONE`, `GENERIC_PENDING_INTERACTION`, `GENERIC_RESULT_BINDING`, `GENERIC_TARGET_SELECTION`, `GENERIC_VISIBILITY` | `NONE` | `NONE` | `NONE` |
| `servant.helena.skill.sc-helena-2` | `SOURCE_EVIDENCE_REQUIRED` | `none` | `specific_handler` | `NONE` | `NONE` | `NONE` | `NONE` | `SEMANTIC_SOURCE_REQUIRED` |
| `servant.helena.skill.sc-helena-3` | `READY_GENERIC_EXTENSION` | `none` | `shared_handler` | `CONDITION`, `HIDDEN_INFORMATION`, `LIFECYCLE`, `MODIFIER` | `GENERIC_CONDITION_EVALUATION`, `GENERIC_LIFECYCLE_POLICY`, `GENERIC_MODIFIER`, `GENERIC_VISIBILITY` | `NONE` | `NONE` | `NONE` |
| `servant.hephaistion.skill.sc-hephaistion-1` | `SOURCE_EVIDENCE_REQUIRED` | `none` | `specific_handler` | `NONE` | `NONE` | `NONE` | `NONE` | `SEMANTIC_SOURCE_REQUIRED` |
| `servant.hephaistion.skill.sc-hephaistion-2` | `SOURCE_EVIDENCE_REQUIRED` | `none` | `shared_handler` | `NONE` | `NONE` | `NONE` | `NONE` | `SEMANTIC_SOURCE_REQUIRED` |
| `servant.hephaistion.skill.sc-hephaistion-3` | `SOURCE_EVIDENCE_REQUIRED` | `none` | `shared_handler` | `NONE` | `NONE` | `NONE` | `NONE` | `SEMANTIC_SOURCE_REQUIRED` |
| `servant.herc.skill.sc-herc-1` | `SOURCE_EVIDENCE_REQUIRED` | `none` | `shared_handler` | `NONE` | `NONE` | `NONE` | `NONE` | `SEMANTIC_SOURCE_REQUIRED` |
| `servant.herc.skill.sc-herc-2` | `SOURCE_EVIDENCE_REQUIRED` | `none` | `shared_handler` | `NONE` | `NONE` | `NONE` | `NONE` | `SEMANTIC_SOURCE_REQUIRED` |
| `servant.herc.skill.sc-herc-3` | `SOURCE_EVIDENCE_REQUIRED` | `none` | `shared_handler` | `NONE` | `NONE` | `NONE` | `NONE` | `SEMANTIC_SOURCE_REQUIRED` |
| `servant.hijikata.skill.sc-hijikata-1` | `SOURCE_EVIDENCE_REQUIRED` | `none` | `specific_handler` | `NONE` | `NONE` | `NONE` | `NONE` | `SEMANTIC_SOURCE_REQUIRED` |
| `servant.hijikata.skill.sc-hijikata-2` | `SOURCE_EVIDENCE_REQUIRED` | `none` | `specific_handler` | `NONE` | `NONE` | `NONE` | `NONE` | `SEMANTIC_SOURCE_REQUIRED` |
| `servant.hijikata.skill.sc-hijikata-3` | `SOURCE_EVIDENCE_REQUIRED` | `none` | `specific_handler` | `NONE` | `NONE` | `NONE` | `NONE` | `SEMANTIC_SOURCE_REQUIRED` |
| `servant.himiko.skill.sc-himiko-1` | `SOURCE_EVIDENCE_REQUIRED` | `none` | `shared_handler` | `NONE` | `NONE` | `NONE` | `NONE` | `SEMANTIC_SOURCE_REQUIRED` |
| `servant.himiko.skill.sc-himiko-2` | `SOURCE_EVIDENCE_REQUIRED` | `none` | `shared_handler` | `NONE` | `NONE` | `NONE` | `NONE` | `SEMANTIC_SOURCE_REQUIRED` |
| `servant.himiko.skill.sc-himiko-3` | `SOURCE_EVIDENCE_REQUIRED` | `none` | `shared_handler` | `NONE` | `NONE` | `NONE` | `NONE` | `SEMANTIC_SOURCE_REQUIRED` |
| `servant.hokusai.skill.sc-hokusai-1` | `SOURCE_EVIDENCE_REQUIRED` | `none` | `specific_handler` | `NONE` | `NONE` | `NONE` | `NONE` | `SEMANTIC_SOURCE_REQUIRED` |
| `servant.hokusai.skill.sc-hokusai-2` | `SOURCE_EVIDENCE_REQUIRED` | `none` | `specific_handler` | `NONE` | `NONE` | `NONE` | `NONE` | `SEMANTIC_SOURCE_REQUIRED` |
| `servant.hokusai.skill.sc-hokusai-3` | `SOURCE_EVIDENCE_REQUIRED` | `none` | `specific_handler` | `NONE` | `NONE` | `NONE` | `NONE` | `SEMANTIC_SOURCE_REQUIRED` |
| `servant.hokusai.skill.sc-hokusai-4` | `SOURCE_EVIDENCE_REQUIRED` | `none` | `shared_handler` | `NONE` | `NONE` | `NONE` | `NONE` | `SEMANTIC_SOURCE_REQUIRED` |
| `servant.ibaraki.skill.sc-ibaraki-1` | `READY_GENERIC_EXTENSION` | `none` | `shared_handler` | `BATTLE_RESULT`, `CONDITION`, `LIFECYCLE`, `MODIFIER` | `GENERIC_BATTLE_INTEGRATION`, `GENERIC_CONDITION_EVALUATION`, `GENERIC_LIFECYCLE_POLICY`, `GENERIC_MODIFIER` | `NONE` | `NONE` | `NONE` |
| `servant.ibaraki.skill.sc-ibaraki-2` | `SOURCE_EVIDENCE_REQUIRED` | `none` | `specific_handler` | `NONE` | `NONE` | `NONE` | `NONE` | `SEMANTIC_SOURCE_REQUIRED` |
| `servant.ibaraki.skill.sc-ibaraki-3` | `SOURCE_EVIDENCE_REQUIRED` | `none` | `specific_handler` | `NONE` | `NONE` | `NONE` | `NONE` | `SEMANTIC_SOURCE_REQUIRED` |
| `servant.illya.skill.sc-illya-1` | `SOURCE_EVIDENCE_REQUIRED` | `none` | `specific_handler` | `NONE` | `NONE` | `NONE` | `NONE` | `SEMANTIC_SOURCE_REQUIRED` |
| `servant.illya.skill.sc-illya-10` | `SOURCE_EVIDENCE_REQUIRED` | `none` | `specific_handler` | `NONE` | `NONE` | `NONE` | `NONE` | `SEMANTIC_SOURCE_REQUIRED` |
| `servant.illya.skill.sc-illya-2` | `SOURCE_EVIDENCE_REQUIRED` | `none` | `shared_handler` | `NONE` | `NONE` | `NONE` | `NONE` | `SEMANTIC_SOURCE_REQUIRED` |
| `servant.illya.skill.sc-illya-3` | `SOURCE_EVIDENCE_REQUIRED` | `none` | `specific_handler` | `NONE` | `NONE` | `NONE` | `NONE` | `SEMANTIC_SOURCE_REQUIRED` |
| `servant.illya.skill.sc-illya-4` | `SOURCE_EVIDENCE_REQUIRED` | `none` | `shared_handler` | `NONE` | `NONE` | `NONE` | `NONE` | `SEMANTIC_SOURCE_REQUIRED` |
| `servant.illya.skill.sc-illya-5` | `SOURCE_EVIDENCE_REQUIRED` | `none` | `shared_handler` | `NONE` | `NONE` | `NONE` | `NONE` | `SEMANTIC_SOURCE_REQUIRED` |
| `servant.illya.skill.sc-illya-6` | `SOURCE_EVIDENCE_REQUIRED` | `none` | `specific_handler` | `NONE` | `NONE` | `NONE` | `NONE` | `SEMANTIC_SOURCE_REQUIRED` |
| `servant.illya.skill.sc-illya-7` | `SOURCE_EVIDENCE_REQUIRED` | `none` | `shared_handler` | `NONE` | `NONE` | `NONE` | `NONE` | `SEMANTIC_SOURCE_REQUIRED` |
| `servant.illya.skill.sc-illya-8` | `SOURCE_EVIDENCE_REQUIRED` | `none` | `specific_handler` | `NONE` | `NONE` | `NONE` | `NONE` | `SEMANTIC_SOURCE_REQUIRED` |
| `servant.illya.skill.sc-illya-9` | `SOURCE_EVIDENCE_REQUIRED` | `none` | `shared_handler` | `NONE` | `NONE` | `NONE` | `NONE` | `SEMANTIC_SOURCE_REQUIRED` |
| `servant.ishtar.skill.sc-ishtar-1` | `SOURCE_EVIDENCE_REQUIRED` | `none` | `specific_handler` | `NONE` | `NONE` | `NONE` | `NONE` | `SEMANTIC_SOURCE_REQUIRED` |
| `servant.ishtar.skill.sc-ishtar-2` | `SOURCE_EVIDENCE_REQUIRED` | `none` | `specific_handler` | `NONE` | `NONE` | `NONE` | `NONE` | `SEMANTIC_SOURCE_REQUIRED` |
| `servant.ishtar.skill.sc-ishtar-3` | `SOURCE_EVIDENCE_REQUIRED` | `none` | `shared_handler` | `NONE` | `NONE` | `NONE` | `NONE` | `SEMANTIC_SOURCE_REQUIRED` |
| `servant.iskandar.skill.sc-iskandar-1` | `SOURCE_EVIDENCE_REQUIRED` | `none` | `shared_handler` | `NONE` | `NONE` | `NONE` | `NONE` | `SEMANTIC_SOURCE_REQUIRED` |
| `servant.iskandar.skill.sc-iskandar-2` | `READY_GENERIC_EXTENSION` | `none` | `shared_handler` | `BATTLE_RESULT`, `CARD_ZONE`, `CONDITION`, `HIDDEN_INFORMATION`, `INTERACTION`, `RESULT_BINDING`, `SPECIAL_SUBSYSTEM`, `TARGET_SELECTION` | `GENERIC_BATTLE_INTEGRATION`, `GENERIC_CARD_ZONE`, `GENERIC_CONDITION_EVALUATION`, `GENERIC_EVENT_DECK`, `GENERIC_PENDING_INTERACTION`, `GENERIC_RESULT_BINDING`, `GENERIC_TARGET_SELECTION`, `GENERIC_VISIBILITY` | `NONE` | `NONE` | `NONE` |
| `servant.iskandar.skill.sc-iskandar-np` | `SOURCE_EVIDENCE_REQUIRED` | `none` | `shared_handler` | `NONE` | `NONE` | `NONE` | `NONE` | `SEMANTIC_SOURCE_REQUIRED` |
| `servant.ivan.skill.sc-ivan-1` | `SOURCE_EVIDENCE_REQUIRED` | `none` | `specific_handler` | `NONE` | `NONE` | `NONE` | `NONE` | `SEMANTIC_SOURCE_REQUIRED` |
| `servant.ivan.skill.sc-ivan-2` | `SOURCE_EVIDENCE_REQUIRED` | `none` | `specific_handler` | `NONE` | `NONE` | `NONE` | `NONE` | `SEMANTIC_SOURCE_REQUIRED` |
| `servant.ivan.skill.sc-ivan-3` | `SOURCE_EVIDENCE_REQUIRED` | `none` | `shared_handler` | `NONE` | `NONE` | `NONE` | `NONE` | `SEMANTIC_SOURCE_REQUIRED` |
| `servant.izou.skill.sc-izou-1` | `SOURCE_EVIDENCE_REQUIRED` | `none` | `specific_handler` | `NONE` | `NONE` | `NONE` | `NONE` | `SEMANTIC_SOURCE_REQUIRED` |
| `servant.izou.skill.sc-izou-2` | `SOURCE_EVIDENCE_REQUIRED` | `none` | `specific_handler` | `NONE` | `NONE` | `NONE` | `NONE` | `SEMANTIC_SOURCE_REQUIRED` |
| `servant.izou.skill.sc-izou-3` | `SOURCE_EVIDENCE_REQUIRED` | `none` | `shared_handler` | `NONE` | `NONE` | `NONE` | `NONE` | `SEMANTIC_SOURCE_REQUIRED` |
| `servant.jack.skill.sc-jack-1` | `SOURCE_EVIDENCE_REQUIRED` | `none` | `specific_handler` | `NONE` | `NONE` | `NONE` | `NONE` | `SEMANTIC_SOURCE_REQUIRED` |
| `servant.jack.skill.sc-jack-2` | `SOURCE_EVIDENCE_REQUIRED` | `none` | `specific_handler` | `NONE` | `NONE` | `NONE` | `NONE` | `SEMANTIC_SOURCE_REQUIRED` |
| `servant.jack.skill.sc-jack-3` | `SOURCE_EVIDENCE_REQUIRED` | `none` | `specific_handler` | `NONE` | `NONE` | `NONE` | `NONE` | `SEMANTIC_SOURCE_REQUIRED` |
| `servant.jaguarman.skill.sc-jaguarman-1` | `SOURCE_EVIDENCE_REQUIRED` | `none` | `shared_handler` | `NONE` | `NONE` | `NONE` | `NONE` | `SEMANTIC_SOURCE_REQUIRED` |
| `servant.jaguarman.skill.sc-jaguarman-2` | `SOURCE_EVIDENCE_REQUIRED` | `none` | `specific_handler` | `NONE` | `NONE` | `NONE` | `NONE` | `SEMANTIC_SOURCE_REQUIRED` |
| `servant.jaguarman.skill.sc-jaguarman-3` | `SOURCE_EVIDENCE_REQUIRED` | `none` | `specific_handler` | `NONE` | `NONE` | `NONE` | `NONE` | `SEMANTIC_SOURCE_REQUIRED` |
| `servant.jason.skill.sc-jason-1` | `SOURCE_EVIDENCE_REQUIRED` | `none` | `shared_handler` | `NONE` | `NONE` | `NONE` | `NONE` | `SEMANTIC_SOURCE_REQUIRED` |
| `servant.jason.skill.sc-jason-2` | `SOURCE_EVIDENCE_REQUIRED` | `none` | `shared_handler` | `NONE` | `NONE` | `NONE` | `NONE` | `SEMANTIC_SOURCE_REQUIRED` |
| `servant.jason.skill.sc-jason-3` | `SOURCE_EVIDENCE_REQUIRED` | `none` | `shared_handler` | `NONE` | `NONE` | `NONE` | `NONE` | `SEMANTIC_SOURCE_REQUIRED` |
| `servant.jeanne-alter.skill.sc-jeanne-alter-1` | `SOURCE_EVIDENCE_REQUIRED` | `none` | `specific_handler` | `NONE` | `NONE` | `NONE` | `NONE` | `SEMANTIC_SOURCE_REQUIRED` |
| `servant.jeanne-alter.skill.sc-jeanne-alter-2` | `SOURCE_EVIDENCE_REQUIRED` | `none` | `specific_handler` | `NONE` | `NONE` | `NONE` | `NONE` | `SEMANTIC_SOURCE_REQUIRED` |
| `servant.jeanne-alter.skill.sc-jeanne-alter-3` | `SOURCE_EVIDENCE_REQUIRED` | `none` | `specific_handler` | `NONE` | `NONE` | `NONE` | `NONE` | `SEMANTIC_SOURCE_REQUIRED` |
| `servant.jeanne.skill.sc-jeanne-1` | `SOURCE_EVIDENCE_REQUIRED` | `none` | `shared_handler` | `NONE` | `NONE` | `NONE` | `NONE` | `SEMANTIC_SOURCE_REQUIRED` |
| `servant.jeanne.skill.sc-jeanne-2` | `SOURCE_EVIDENCE_REQUIRED` | `none` | `shared_handler` | `NONE` | `NONE` | `NONE` | `NONE` | `SEMANTIC_SOURCE_REQUIRED` |
| `servant.jeanne.skill.sc-jeanne-3` | `SOURCE_EVIDENCE_REQUIRED` | `none` | `specific_handler` | `NONE` | `NONE` | `NONE` | `NONE` | `SEMANTIC_SOURCE_REQUIRED` |
| `servant.jekyll.skill.sc-jekyll-1` | `SOURCE_EVIDENCE_REQUIRED` | `none` | `specific_handler` | `NONE` | `NONE` | `NONE` | `NONE` | `SEMANTIC_SOURCE_REQUIRED` |
| `servant.jekyll.skill.sc-jekyll-2` | `SOURCE_EVIDENCE_REQUIRED` | `none` | `specific_handler` | `NONE` | `NONE` | `NONE` | `NONE` | `SEMANTIC_SOURCE_REQUIRED` |
| `servant.jekyll.skill.sc-jekyll-3` | `SOURCE_EVIDENCE_REQUIRED` | `none` | `shared_handler` | `NONE` | `NONE` | `NONE` | `NONE` | `SEMANTIC_SOURCE_REQUIRED` |
| `servant.kagekiyo.skill.sc-kagekiyo-1` | `SOURCE_EVIDENCE_REQUIRED` | `none` | `specific_handler` | `NONE` | `NONE` | `NONE` | `NONE` | `SEMANTIC_SOURCE_REQUIRED` |
| `servant.kagekiyo.skill.sc-kagekiyo-2` | `READY_GENERIC_EXTENSION` | `none` | `shared_handler` | `BATTLE_RESULT`, `CARD_ACTION_SEMANTICS`, `CARD_ZONE`, `CONDITION`, `HIDDEN_INFORMATION`, `INTERACTION`, `RESULT_BINDING`, `TARGET_SELECTION`, `TRIGGER` | `CARD_ACTION_ADD_TO_ATTACK`, `GENERIC_BATTLE_INTEGRATION`, `GENERIC_CARD_ZONE`, `GENERIC_CONDITION_EVALUATION`, `GENERIC_PENDING_INTERACTION`, `GENERIC_RESULT_BINDING`, `GENERIC_TARGET_SELECTION`, `GENERIC_TRIGGER_GATEWAY`, `GENERIC_VISIBILITY` | `NONE` | `NONE` | `NONE` |
| `servant.kagekiyo.skill.sc-kagekiyo-3` | `SOURCE_EVIDENCE_REQUIRED` | `none` | `specific_handler` | `NONE` | `NONE` | `NONE` | `NONE` | `SEMANTIC_SOURCE_REQUIRED` |
| `servant.kagetora.skill.sc-kagetora-1` | `SOURCE_EVIDENCE_REQUIRED` | `none` | `specific_handler` | `NONE` | `NONE` | `NONE` | `NONE` | `SEMANTIC_SOURCE_REQUIRED` |
| `servant.kagetora.skill.sc-kagetora-2` | `SOURCE_EVIDENCE_REQUIRED` | `none` | `specific_handler` | `NONE` | `NONE` | `NONE` | `NONE` | `SEMANTIC_SOURCE_REQUIRED` |
| `servant.kagetora.skill.sc-kagetora-3` | `SOURCE_EVIDENCE_REQUIRED` | `none` | `shared_handler` | `NONE` | `NONE` | `NONE` | `NONE` | `SEMANTIC_SOURCE_REQUIRED` |
| `servant.kagetora.skill.sc-kagetora-4` | `SOURCE_EVIDENCE_REQUIRED` | `none` | `specific_handler` | `NONE` | `NONE` | `NONE` | `NONE` | `SEMANTIC_SOURCE_REQUIRED` |
| `servant.kama.skill.sc-kama-1` | `READY_GENERIC_EXTENSION` | `none` | `shared_handler` | `BATTLE_RESULT`, `CARD_ACTION_SEMANTICS`, `CONDITION`, `INTERACTION`, `LIFECYCLE`, `MODIFIER`, `POWER`, `RESOURCE_NUMERIC`, `TARGET_SELECTION` | `CARD_ACTION_CLOSE`, `GENERIC_BATTLE_INTEGRATION`, `GENERIC_CONDITION_EVALUATION`, `GENERIC_LIFECYCLE_POLICY`, `GENERIC_MODIFIER`, `GENERIC_PENDING_INTERACTION`, `GENERIC_POWER`, `GENERIC_RESOURCE_NUMERIC`, `GENERIC_TARGET_SELECTION` | `NONE` | `NONE` | `NONE` |
| `servant.kama.skill.sc-kama-2` | `READY_GENERIC_EXTENSION` | `none` | `shared_handler` | `BATTLE_RESULT`, `CARD_ACTION_SEMANTICS`, `CONDITION`, `LIFECYCLE`, `RESOURCE_NUMERIC`, `TRIGGER` | `CARD_ACTION_CLOSE`, `GENERIC_BATTLE_INTEGRATION`, `GENERIC_CONDITION_EVALUATION`, `GENERIC_LIFECYCLE_POLICY`, `GENERIC_RESOURCE_NUMERIC`, `GENERIC_STATUS_STATE`, `GENERIC_TRIGGER_GATEWAY` | `NONE` | `NONE` | `NONE` |
| `servant.kama.skill.sc-kama-3` | `SOURCE_EVIDENCE_REQUIRED` | `none` | `shared_handler` | `NONE` | `NONE` | `NONE` | `NONE` | `SEMANTIC_SOURCE_REQUIRED` |
| `servant.karna.skill.sc-karna-1` | `SOURCE_EVIDENCE_REQUIRED` | `none` | `specific_handler` | `NONE` | `NONE` | `NONE` | `NONE` | `SEMANTIC_SOURCE_REQUIRED` |
| `servant.karna.skill.sc-karna-2` | `SOURCE_EVIDENCE_REQUIRED` | `none` | `specific_handler` | `NONE` | `NONE` | `NONE` | `NONE` | `SEMANTIC_SOURCE_REQUIRED` |
| `servant.karna.skill.sc-karna-3` | `SOURCE_EVIDENCE_REQUIRED` | `none` | `specific_handler` | `NONE` | `NONE` | `NONE` | `NONE` | `SEMANTIC_SOURCE_REQUIRED` |
| `servant.kinggil.skill.sc-kinggil-1` | `SOURCE_EVIDENCE_REQUIRED` | `none` | `shared_handler` | `NONE` | `NONE` | `NONE` | `NONE` | `SEMANTIC_SOURCE_REQUIRED` |
| `servant.kinggil.skill.sc-kinggil-2` | `SOURCE_EVIDENCE_REQUIRED` | `none` | `specific_handler` | `NONE` | `NONE` | `NONE` | `NONE` | `SEMANTIC_SOURCE_REQUIRED` |
| `servant.kinggil.skill.sc-kinggil-3` | `SOURCE_EVIDENCE_REQUIRED` | `none` | `specific_handler` | `NONE` | `NONE` | `NONE` | `NONE` | `SEMANTIC_SOURCE_REQUIRED` |
| `servant.kinghassan.skill.sc-kinghassan-1` | `SOURCE_EVIDENCE_REQUIRED` | `none` | `shared_handler` | `NONE` | `NONE` | `NONE` | `NONE` | `SEMANTIC_SOURCE_REQUIRED` |
| `servant.kinghassan.skill.sc-kinghassan-2` | `SOURCE_EVIDENCE_REQUIRED` | `none` | `shared_handler` | `NONE` | `NONE` | `NONE` | `NONE` | `SEMANTIC_SOURCE_REQUIRED` |
| `servant.kinghassan.skill.sc-kinghassan-3` | `SOURCE_EVIDENCE_REQUIRED` | `none` | `shared_handler` | `NONE` | `NONE` | `NONE` | `NONE` | `SEMANTIC_SOURCE_REQUIRED` |
| `servant.kingprotea.skill.sc-kingprotea-1` | `SOURCE_EVIDENCE_REQUIRED` | `none` | `specific_handler` | `NONE` | `NONE` | `NONE` | `NONE` | `SEMANTIC_SOURCE_REQUIRED` |
| `servant.kingprotea.skill.sc-kingprotea-2` | `SOURCE_EVIDENCE_REQUIRED` | `none` | `specific_handler` | `NONE` | `NONE` | `NONE` | `NONE` | `SEMANTIC_SOURCE_REQUIRED` |
| `servant.kingprotea.skill.sc-kingprotea-3` | `SOURCE_EVIDENCE_REQUIRED` | `none` | `specific_handler` | `NONE` | `NONE` | `NONE` | `NONE` | `SEMANTIC_SOURCE_REQUIRED` |
| `servant.kintoki.skill.sc-kintoki-1` | `SOURCE_EVIDENCE_REQUIRED` | `legacy` | `shared_handler` | `NONE` | `NONE` | `NONE` | `NONE` | `SEMANTIC_SOURCE_REQUIRED` |
| `servant.kintoki.skill.sc-kintoki-2` | `SOURCE_EVIDENCE_REQUIRED` | `legacy` | `shared_handler` | `NONE` | `NONE` | `NONE` | `NONE` | `SEMANTIC_SOURCE_REQUIRED` |
| `servant.kintoki.skill.sc-kintoki-3` | `SOURCE_EVIDENCE_REQUIRED` | `dual` | `shared_handler` | `NONE` | `NONE` | `NONE` | `RESULT_BINDING_PHASE3A` | `SEMANTIC_SOURCE_REQUIRED` |
| `servant.kiritsugu.skill.sc-kiritsugu-1` | `SOURCE_EVIDENCE_REQUIRED` | `none` | `shared_handler` | `NONE` | `NONE` | `NONE` | `NONE` | `SEMANTIC_SOURCE_REQUIRED` |
| `servant.kiritsugu.skill.sc-kiritsugu-2` | `READY_GENERIC_EXTENSION` | `none` | `shared_handler` | `BATTLE_RESULT`, `CONDITION`, `HIDDEN_INFORMATION`, `INTERACTION`, `LIFECYCLE`, `MODIFIER`, `RESOURCE_NUMERIC`, `TARGET_SELECTION` | `GENERIC_BATTLE_INTEGRATION`, `GENERIC_CONDITION_EVALUATION`, `GENERIC_LIFECYCLE_POLICY`, `GENERIC_MODIFIER`, `GENERIC_PENDING_INTERACTION`, `GENERIC_RESOURCE_NUMERIC`, `GENERIC_TARGET_SELECTION`, `GENERIC_VISIBILITY` | `NONE` | `NONE` | `NONE` |
| `servant.kiritsugu.skill.sc-kiritsugu-3` | `READY_GENERIC_EXTENSION` | `none` | `shared_handler` | `BATTLE_RESULT`, `CARD_ZONE`, `CONDITION`, `HIDDEN_INFORMATION`, `INTERACTION`, `RESOURCE_NUMERIC`, `RESULT_BINDING`, `SPECIAL_SUBSYSTEM`, `TARGET_SELECTION` | `GENERIC_BATTLE_INTEGRATION`, `GENERIC_CARD_ZONE`, `GENERIC_CONDITION_EVALUATION`, `GENERIC_EVENT_DECK`, `GENERIC_PENDING_INTERACTION`, `GENERIC_RESOURCE_NUMERIC`, `GENERIC_RESULT_BINDING`, `GENERIC_TARGET_SELECTION`, `GENERIC_VISIBILITY` | `NONE` | `NONE` | `NONE` |
| `servant.kiyohime.skill.sc-kiyohime-1` | `SOURCE_EVIDENCE_REQUIRED` | `none` | `specific_handler` | `NONE` | `NONE` | `NONE` | `NONE` | `SEMANTIC_SOURCE_REQUIRED` |
| `servant.kiyohime.skill.sc-kiyohime-2` | `SOURCE_EVIDENCE_REQUIRED` | `none` | `specific_handler` | `NONE` | `NONE` | `NONE` | `NONE` | `SEMANTIC_SOURCE_REQUIRED` |
| `servant.kiyohime.skill.sc-kiyohime-3` | `SOURCE_EVIDENCE_REQUIRED` | `none` | `specific_handler` | `NONE` | `NONE` | `NONE` | `NONE` | `SEMANTIC_SOURCE_REQUIRED` |
| `servant.kotarou.skill.sc-kotarou-1` | `SOURCE_EVIDENCE_REQUIRED` | `none` | `shared_handler` | `NONE` | `NONE` | `NONE` | `NONE` | `SEMANTIC_SOURCE_REQUIRED` |
| `servant.kotarou.skill.sc-kotarou-2` | `SOURCE_EVIDENCE_REQUIRED` | `none` | `specific_handler` | `NONE` | `NONE` | `NONE` | `NONE` | `SEMANTIC_SOURCE_REQUIRED` |
| `servant.kotarou.skill.sc-kotarou-3` | `SOURCE_EVIDENCE_REQUIRED` | `none` | `specific_handler` | `NONE` | `NONE` | `NONE` | `NONE` | `SEMANTIC_SOURCE_REQUIRED` |
| `servant.koyanskaya.skill.sc-koyanskaya-1` | `SOURCE_EVIDENCE_REQUIRED` | `none` | `shared_handler` | `NONE` | `NONE` | `NONE` | `NONE` | `SEMANTIC_SOURCE_REQUIRED` |
| `servant.koyanskaya.skill.sc-koyanskaya-2` | `SOURCE_EVIDENCE_REQUIRED` | `none` | `specific_handler` | `NONE` | `NONE` | `NONE` | `NONE` | `SEMANTIC_SOURCE_REQUIRED` |
| `servant.koyanskaya.skill.sc-koyanskaya-3` | `SOURCE_EVIDENCE_REQUIRED` | `none` | `shared_handler` | `NONE` | `NONE` | `NONE` | `NONE` | `SEMANTIC_SOURCE_REQUIRED` |
| `servant.koyanskaya.skill.sc-koyanskaya-4` | `SOURCE_EVIDENCE_REQUIRED` | `none` | `shared_handler` | `NONE` | `NONE` | `NONE` | `NONE` | `SEMANTIC_SOURCE_REQUIRED` |
| `servant.koyanskaya.skill.sc-koyanskaya-5` | `SOURCE_EVIDENCE_REQUIRED` | `none` | `shared_handler` | `NONE` | `NONE` | `NONE` | `NONE` | `SEMANTIC_SOURCE_REQUIRED` |
| `servant.koyanskaya.skill.sc-koyanskaya-6` | `SOURCE_EVIDENCE_REQUIRED` | `none` | `shared_handler` | `NONE` | `NONE` | `NONE` | `NONE` | `SEMANTIC_SOURCE_REQUIRED` |
| `servant.koyo.skill.sc-koyo-1` | `SOURCE_EVIDENCE_REQUIRED` | `none` | `specific_handler` | `NONE` | `NONE` | `NONE` | `NONE` | `SEMANTIC_SOURCE_REQUIRED` |
| `servant.koyo.skill.sc-koyo-2` | `SOURCE_EVIDENCE_REQUIRED` | `none` | `specific_handler` | `NONE` | `NONE` | `NONE` | `NONE` | `SEMANTIC_SOURCE_REQUIRED` |
| `servant.koyo.skill.sc-koyo-3` | `SOURCE_EVIDENCE_REQUIRED` | `none` | `specific_handler` | `NONE` | `NONE` | `NONE` | `NONE` | `SEMANTIC_SOURCE_REQUIRED` |
| `servant.kriemhild.skill.sc-kriemhild-1` | `SOURCE_EVIDENCE_REQUIRED` | `none` | `specific_handler` | `NONE` | `NONE` | `NONE` | `NONE` | `SEMANTIC_SOURCE_REQUIRED` |
| `servant.kriemhild.skill.sc-kriemhild-2` | `SOURCE_EVIDENCE_REQUIRED` | `none` | `specific_handler` | `NONE` | `NONE` | `NONE` | `NONE` | `SEMANTIC_SOURCE_REQUIRED` |
| `servant.kriemhild.skill.sc-kriemhild-3` | `SOURCE_EVIDENCE_REQUIRED` | `none` | `specific_handler` | `NONE` | `NONE` | `NONE` | `NONE` | `SEMANTIC_SOURCE_REQUIRED` |
| `servant.ladyavalon.skill.sc-ladyavalon-1` | `SOURCE_EVIDENCE_REQUIRED` | `none` | `specific_handler` | `NONE` | `NONE` | `NONE` | `NONE` | `SEMANTIC_SOURCE_REQUIRED` |
| `servant.ladyavalon.skill.sc-ladyavalon-2` | `SOURCE_EVIDENCE_REQUIRED` | `none` | `shared_handler` | `NONE` | `NONE` | `NONE` | `NONE` | `SEMANTIC_SOURCE_REQUIRED` |
| `servant.ladyavalon.skill.sc-ladyavalon-3` | `SOURCE_EVIDENCE_REQUIRED` | `none` | `shared_handler` | `NONE` | `NONE` | `NONE` | `NONE` | `SEMANTIC_SOURCE_REQUIRED` |
| `servant.lakshmibai.skill.sc-lakshmibai-1` | `SOURCE_EVIDENCE_REQUIRED` | `none` | `shared_handler` | `NONE` | `NONE` | `NONE` | `NONE` | `SEMANTIC_SOURCE_REQUIRED` |
| `servant.lakshmibai.skill.sc-lakshmibai-2` | `SOURCE_EVIDENCE_REQUIRED` | `none` | `shared_handler` | `NONE` | `NONE` | `NONE` | `NONE` | `SEMANTIC_SOURCE_REQUIRED` |
| `servant.lakshmibai.skill.sc-lakshmibai-3` | `SOURCE_EVIDENCE_REQUIRED` | `none` | `shared_handler` | `NONE` | `NONE` | `NONE` | `NONE` | `SEMANTIC_SOURCE_REQUIRED` |
| `servant.lakshmibai.skill.sc-lakshmibai-4` | `SOURCE_EVIDENCE_REQUIRED` | `none` | `shared_handler` | `NONE` | `NONE` | `NONE` | `NONE` | `SEMANTIC_SOURCE_REQUIRED` |
| `servant.lance.skill.sc-lance-1` | `SOURCE_EVIDENCE_REQUIRED` | `none` | `specific_handler` | `NONE` | `NONE` | `NONE` | `NONE` | `SEMANTIC_SOURCE_REQUIRED` |
| `servant.lance.skill.sc-lance-2` | `SOURCE_EVIDENCE_REQUIRED` | `none` | `shared_handler` | `NONE` | `NONE` | `NONE` | `NONE` | `SEMANTIC_SOURCE_REQUIRED` |
| `servant.lance.skill.sc-lance-3` | `SOURCE_EVIDENCE_REQUIRED` | `none` | `specific_handler` | `NONE` | `NONE` | `NONE` | `NONE` | `SEMANTIC_SOURCE_REQUIRED` |
| `servant.leonidas.skill.sc-leonidas-1` | `READY_GENERIC_EXTENSION` | `none` | `shared_handler` | `CARD_ACTION_SEMANTICS`, `CONDITION`, `LIFECYCLE`, `MODIFIER`, `TRIGGER` | `CARD_ACTION_CLOSE`, `GENERIC_CONDITION_EVALUATION`, `GENERIC_LIFECYCLE_POLICY`, `GENERIC_MODIFIER`, `GENERIC_TRIGGER_GATEWAY` | `NONE` | `NONE` | `NONE` |
| `servant.leonidas.skill.sc-leonidas-2` | `SOURCE_EVIDENCE_REQUIRED` | `none` | `shared_handler` | `NONE` | `NONE` | `NONE` | `NONE` | `SEMANTIC_SOURCE_REQUIRED` |
| `servant.leonidas.skill.sc-leonidas-3` | `SOURCE_EVIDENCE_REQUIRED` | `none` | `specific_handler` | `NONE` | `NONE` | `NONE` | `NONE` | `SEMANTIC_SOURCE_REQUIRED` |
| `servant.lionking.skill.sc-lionking-1` | `SOURCE_EVIDENCE_REQUIRED` | `none` | `specific_handler` | `NONE` | `NONE` | `NONE` | `NONE` | `SEMANTIC_SOURCE_REQUIRED` |
| `servant.lionking.skill.sc-lionking-2` | `SOURCE_EVIDENCE_REQUIRED` | `none` | `specific_handler` | `NONE` | `NONE` | `NONE` | `NONE` | `SEMANTIC_SOURCE_REQUIRED` |
| `servant.lionking.skill.sc-lionking-3` | `READY_GENERIC_EXTENSION` | `none` | `shared_handler` | `BATTLE_RESULT`, `CARD_ZONE`, `CONDITION`, `HIDDEN_INFORMATION`, `LIFECYCLE`, `SPECIAL_SUBSYSTEM`, `TRIGGER` | `GENERIC_BATTLE_INTEGRATION`, `GENERIC_CARD_ZONE`, `GENERIC_CONDITION_EVALUATION`, `GENERIC_EVENT_DECK`, `GENERIC_LIFECYCLE_POLICY`, `GENERIC_STATUS_STATE`, `GENERIC_TRIGGER_GATEWAY`, `GENERIC_VISIBILITY` | `NONE` | `NONE` | `NONE` |
| `servant.lishuwen.skill.sc-lishuwen-1` | `SOURCE_EVIDENCE_REQUIRED` | `none` | `specific_handler` | `NONE` | `NONE` | `NONE` | `NONE` | `SEMANTIC_SOURCE_REQUIRED` |
| `servant.lishuwen.skill.sc-lishuwen-2` | `SOURCE_EVIDENCE_REQUIRED` | `none` | `specific_handler` | `NONE` | `NONE` | `NONE` | `NONE` | `SEMANTIC_SOURCE_REQUIRED` |
| `servant.lishuwen.skill.sc-lishuwen-3` | `SOURCE_EVIDENCE_REQUIRED` | `none` | `shared_handler` | `NONE` | `NONE` | `NONE` | `NONE` | `SEMANTIC_SOURCE_REQUIRED` |
| `servant.lobo.skill.sc-lobo-1` | `SOURCE_EVIDENCE_REQUIRED` | `none` | `specific_handler` | `NONE` | `NONE` | `NONE` | `NONE` | `SEMANTIC_SOURCE_REQUIRED` |
| `servant.lobo.skill.sc-lobo-2` | `SOURCE_EVIDENCE_REQUIRED` | `none` | `specific_handler` | `NONE` | `NONE` | `NONE` | `NONE` | `SEMANTIC_SOURCE_REQUIRED` |
| `servant.lobo.skill.sc-lobo-3` | `SOURCE_EVIDENCE_REQUIRED` | `none` | `specific_handler` | `NONE` | `NONE` | `NONE` | `NONE` | `SEMANTIC_SOURCE_REQUIRED` |
| `servant.lubu.skill.sc-lubu-1` | `SOURCE_EVIDENCE_REQUIRED` | `none` | `specific_handler` | `NONE` | `NONE` | `NONE` | `NONE` | `SEMANTIC_SOURCE_REQUIRED` |
| `servant.lubu.skill.sc-lubu-2` | `SOURCE_EVIDENCE_REQUIRED` | `none` | `shared_handler` | `NONE` | `NONE` | `NONE` | `NONE` | `SEMANTIC_SOURCE_REQUIRED` |
| `servant.lubu.skill.sc-lubu-3` | `SOURCE_EVIDENCE_REQUIRED` | `none` | `specific_handler` | `NONE` | `NONE` | `NONE` | `NONE` | `SEMANTIC_SOURCE_REQUIRED` |
| `servant.mandricardo.skill.sc-mandricardo-1` | `SOURCE_EVIDENCE_REQUIRED` | `none` | `shared_handler` | `NONE` | `NONE` | `NONE` | `NONE` | `SEMANTIC_SOURCE_REQUIRED` |
| `servant.mandricardo.skill.sc-mandricardo-2` | `SOURCE_EVIDENCE_REQUIRED` | `none` | `shared_handler` | `NONE` | `NONE` | `NONE` | `NONE` | `SEMANTIC_SOURCE_REQUIRED` |
| `servant.mandricardo.skill.sc-mandricardo-3` | `SOURCE_EVIDENCE_REQUIRED` | `none` | `shared_handler` | `NONE` | `NONE` | `NONE` | `NONE` | `SEMANTIC_SOURCE_REQUIRED` |
| `servant.martha.skill.sc-martha-1` | `SOURCE_EVIDENCE_REQUIRED` | `none` | `shared_handler` | `NONE` | `NONE` | `NONE` | `NONE` | `SEMANTIC_SOURCE_REQUIRED` |
| `servant.martha.skill.sc-martha-2` | `SOURCE_EVIDENCE_REQUIRED` | `none` | `specific_handler` | `NONE` | `NONE` | `NONE` | `NONE` | `SEMANTIC_SOURCE_REQUIRED` |
| `servant.martha.skill.sc-martha-3` | `SOURCE_EVIDENCE_REQUIRED` | `none` | `shared_handler` | `NONE` | `NONE` | `NONE` | `NONE` | `SEMANTIC_SOURCE_REQUIRED` |
| `servant.martha.skill.sc-martha-4` | `SOURCE_EVIDENCE_REQUIRED` | `none` | `shared_handler` | `NONE` | `NONE` | `NONE` | `NONE` | `SEMANTIC_SOURCE_REQUIRED` |
| `servant.mash.skill.sc-mash-1` | `SOURCE_EVIDENCE_REQUIRED` | `none` | `specific_handler` | `NONE` | `NONE` | `NONE` | `NONE` | `SEMANTIC_SOURCE_REQUIRED` |
| `servant.mash.skill.sc-mash-2` | `SOURCE_EVIDENCE_REQUIRED` | `none` | `specific_handler` | `NONE` | `NONE` | `NONE` | `NONE` | `SEMANTIC_SOURCE_REQUIRED` |
| `servant.mash.skill.sc-mash-3` | `SOURCE_EVIDENCE_REQUIRED` | `none` | `specific_handler` | `NONE` | `NONE` | `NONE` | `NONE` | `SEMANTIC_SOURCE_REQUIRED` |
| `servant.mash.skill.sc-mash-4` | `SOURCE_EVIDENCE_REQUIRED` | `none` | `shared_handler` | `NONE` | `NONE` | `NONE` | `NONE` | `SEMANTIC_SOURCE_REQUIRED` |
| `servant.maxwell.skill.sc-maxwell-1` | `SOURCE_EVIDENCE_REQUIRED` | `none` | `shared_handler` | `NONE` | `NONE` | `NONE` | `NONE` | `SEMANTIC_SOURCE_REQUIRED` |
| `servant.maxwell.skill.sc-maxwell-2` | `SOURCE_EVIDENCE_REQUIRED` | `none` | `shared_handler` | `NONE` | `NONE` | `NONE` | `NONE` | `SEMANTIC_SOURCE_REQUIRED` |
| `servant.maxwell.skill.sc-maxwell-3` | `SOURCE_EVIDENCE_REQUIRED` | `none` | `specific_handler` | `NONE` | `NONE` | `NONE` | `NONE` | `SEMANTIC_SOURCE_REQUIRED` |
| `servant.mechaeli.skill.sc-mechaeli-1` | `SOURCE_EVIDENCE_REQUIRED` | `none` | `specific_handler` | `NONE` | `NONE` | `NONE` | `NONE` | `SEMANTIC_SOURCE_REQUIRED` |
| `servant.mechaeli.skill.sc-mechaeli-2` | `READY_GENERIC_EXTENSION` | `none` | `shared_handler` | `BATTLE_RESULT`, `CONDITION`, `MODIFIER`, `POWER`, `RESOURCE_NUMERIC`, `TRIGGER` | `GENERIC_BATTLE_INTEGRATION`, `GENERIC_CONDITION_EVALUATION`, `GENERIC_MODIFIER`, `GENERIC_POWER`, `GENERIC_RESOURCE_NUMERIC`, `GENERIC_TRIGGER_GATEWAY` | `NONE` | `NONE` | `NONE` |
| `servant.mechaeli.skill.sc-mechaeli-3` | `SOURCE_EVIDENCE_REQUIRED` | `none` | `shared_handler` | `NONE` | `NONE` | `NONE` | `NONE` | `SEMANTIC_SOURCE_REQUIRED` |
| `servant.medb.skill.sc-medb-1` | `SOURCE_EVIDENCE_REQUIRED` | `none` | `shared_handler` | `NONE` | `NONE` | `NONE` | `NONE` | `SEMANTIC_SOURCE_REQUIRED` |
| `servant.medb.skill.sc-medb-2` | `SOURCE_EVIDENCE_REQUIRED` | `none` | `specific_handler` | `NONE` | `NONE` | `NONE` | `NONE` | `SEMANTIC_SOURCE_REQUIRED` |
| `servant.medb.skill.sc-medb-3` | `SOURCE_EVIDENCE_REQUIRED` | `none` | `specific_handler` | `NONE` | `NONE` | `NONE` | `NONE` | `SEMANTIC_SOURCE_REQUIRED` |
| `servant.medea.skill.sc-medea-1` | `SOURCE_EVIDENCE_REQUIRED` | `none` | `shared_handler` | `NONE` | `NONE` | `NONE` | `NONE` | `SEMANTIC_SOURCE_REQUIRED` |
| `servant.medea.skill.sc-medea-2` | `SOURCE_EVIDENCE_REQUIRED` | `none` | `shared_handler` | `NONE` | `NONE` | `NONE` | `NONE` | `SEMANTIC_SOURCE_REQUIRED` |
| `servant.medea.skill.sc-medea-np` | `SOURCE_EVIDENCE_REQUIRED` | `none` | `shared_handler` | `NONE` | `NONE` | `NONE` | `NONE` | `SEMANTIC_SOURCE_REQUIRED` |
| `servant.medusa.skill.sc-medusa-1` | `SOURCE_EVIDENCE_REQUIRED` | `none` | `shared_handler` | `NONE` | `NONE` | `NONE` | `NONE` | `SEMANTIC_SOURCE_REQUIRED` |
| `servant.medusa.skill.sc-medusa-2` | `SPECIAL_HANDLER_CANDIDATE` | `none` | `shared_handler` | `CONDITION`, `HIDDEN_INFORMATION`, `SPECIAL_SUBSYSTEM` | `GENERIC_CONDITION_EVALUATION`, `GENERIC_VISIBILITY`, `REVIEWED_SPECIAL_HANDLER` | `NONE` | `NONE` | `SPECIAL_EFFECT:defeat_player` |
| `servant.medusa.skill.sc-medusa-np` | `READY_GENERIC_EXTENSION` | `none` | `shared_handler` | `CONDITION`, `HIDDEN_INFORMATION`, `INTERACTION`, `RESULT_BINDING`, `TARGET_SELECTION` | `GENERIC_CONDITION_EVALUATION`, `GENERIC_PENDING_INTERACTION`, `GENERIC_RESULT_BINDING`, `GENERIC_TARGET_SELECTION`, `GENERIC_VISIBILITY` | `NONE` | `NONE` | `NONE` |
| `servant.meltryllis.skill.sc-meltryllis-1` | `SOURCE_EVIDENCE_REQUIRED` | `none` | `specific_handler` | `NONE` | `NONE` | `NONE` | `NONE` | `SEMANTIC_SOURCE_REQUIRED` |
| `servant.meltryllis.skill.sc-meltryllis-2` | `SOURCE_EVIDENCE_REQUIRED` | `none` | `specific_handler` | `NONE` | `NONE` | `NONE` | `NONE` | `SEMANTIC_SOURCE_REQUIRED` |
| `servant.meltryllis.skill.sc-meltryllis-3` | `SOURCE_EVIDENCE_REQUIRED` | `none` | `shared_handler` | `NONE` | `NONE` | `NONE` | `NONE` | `SEMANTIC_SOURCE_REQUIRED` |
| `servant.melusine.skill.sc-melusine-1` | `SOURCE_EVIDENCE_REQUIRED` | `none` | `specific_handler` | `NONE` | `NONE` | `NONE` | `NONE` | `SEMANTIC_SOURCE_REQUIRED` |
| `servant.melusine.skill.sc-melusine-2` | `SOURCE_EVIDENCE_REQUIRED` | `none` | `specific_handler` | `NONE` | `NONE` | `NONE` | `NONE` | `SEMANTIC_SOURCE_REQUIRED` |
| `servant.melusine.skill.sc-melusine-3` | `SOURCE_EVIDENCE_REQUIRED` | `none` | `shared_handler` | `NONE` | `NONE` | `NONE` | `NONE` | `SEMANTIC_SOURCE_REQUIRED` |
| `servant.mephisto.skill.sc-mephisto-1` | `SOURCE_EVIDENCE_REQUIRED` | `none` | `shared_handler` | `NONE` | `NONE` | `NONE` | `NONE` | `SEMANTIC_SOURCE_REQUIRED` |
| `servant.mephisto.skill.sc-mephisto-2` | `SPECIAL_HANDLER_CANDIDATE` | `none` | `shared_handler` | `CONDITION`, `MODIFIER`, `POWER`, `RESOURCE_NUMERIC`, `SPECIAL_SUBSYSTEM`, `TRIGGER` | `GENERIC_CONDITION_EVALUATION`, `GENERIC_MODIFIER`, `GENERIC_POWER`, `GENERIC_RESOURCE_NUMERIC`, `GENERIC_TRIGGER_GATEWAY`, `REVIEWED_SPECIAL_HANDLER` | `NONE` | `NONE` | `SPECIAL_EFFECT:defeat_player` |
| `servant.mephisto.skill.sc-mephisto-3` | `READY_GENERIC_EXTENSION` | `none` | `shared_handler` | `CONDITION`, `INTERACTION`, `LIFECYCLE`, `RESOURCE_NUMERIC`, `RESULT_BINDING`, `TARGET_SELECTION` | `GENERIC_CONDITION_EVALUATION`, `GENERIC_LIFECYCLE_POLICY`, `GENERIC_PENDING_INTERACTION`, `GENERIC_RESOURCE_NUMERIC`, `GENERIC_RESULT_BINDING`, `GENERIC_TARGET_SELECTION` | `NONE` | `NONE` | `NONE` |
| `servant.merlin.skill.sc-merlin-1` | `SOURCE_EVIDENCE_REQUIRED` | `none` | `shared_handler` | `NONE` | `NONE` | `NONE` | `NONE` | `SEMANTIC_SOURCE_REQUIRED` |
| `servant.merlin.skill.sc-merlin-2` | `SOURCE_EVIDENCE_REQUIRED` | `none` | `specific_handler` | `NONE` | `NONE` | `NONE` | `NONE` | `SEMANTIC_SOURCE_REQUIRED` |
| `servant.merlin.skill.sc-merlin-3` | `READY_GENERIC_EXTENSION` | `none` | `shared_handler` | `BATTLE_RESULT`, `CARD_ZONE`, `CONDITION`, `HIDDEN_INFORMATION`, `RESOURCE_NUMERIC`, `SPECIAL_SUBSYSTEM`, `TRIGGER` | `GENERIC_BATTLE_INTEGRATION`, `GENERIC_CARD_ZONE`, `GENERIC_CONDITION_EVALUATION`, `GENERIC_EVENT_DECK`, `GENERIC_RESOURCE_NUMERIC`, `GENERIC_TRIGGER_GATEWAY`, `GENERIC_VISIBILITY` | `NONE` | `NONE` | `NONE` |
| `servant.mhx.skill.sc-mhx-1` | `SOURCE_EVIDENCE_REQUIRED` | `none` | `specific_handler` | `NONE` | `NONE` | `NONE` | `NONE` | `SEMANTIC_SOURCE_REQUIRED` |
| `servant.mhx.skill.sc-mhx-2` | `SOURCE_EVIDENCE_REQUIRED` | `none` | `specific_handler` | `NONE` | `NONE` | `NONE` | `NONE` | `SEMANTIC_SOURCE_REQUIRED` |
| `servant.mhx.skill.sc-mhx-3` | `SOURCE_EVIDENCE_REQUIRED` | `none` | `shared_handler` | `NONE` | `NONE` | `NONE` | `NONE` | `SEMANTIC_SOURCE_REQUIRED` |
| `servant.molay.skill.sc-molay-1` | `SOURCE_EVIDENCE_REQUIRED` | `none` | `specific_handler` | `NONE` | `NONE` | `NONE` | `NONE` | `SEMANTIC_SOURCE_REQUIRED` |
| `servant.molay.skill.sc-molay-2` | `SOURCE_EVIDENCE_REQUIRED` | `none` | `specific_handler` | `NONE` | `NONE` | `NONE` | `NONE` | `SEMANTIC_SOURCE_REQUIRED` |
| `servant.molay.skill.sc-molay-3` | `SOURCE_EVIDENCE_REQUIRED` | `none` | `specific_handler` | `NONE` | `NONE` | `NONE` | `NONE` | `SEMANTIC_SOURCE_REQUIRED` |
| `servant.molay.skill.sc-molay-4` | `SOURCE_EVIDENCE_REQUIRED` | `none` | `shared_handler` | `NONE` | `NONE` | `NONE` | `NONE` | `SEMANTIC_SOURCE_REQUIRED` |
| `servant.mordred.skill.sc-mordred-1` | `SOURCE_EVIDENCE_REQUIRED` | `none` | `specific_handler` | `NONE` | `NONE` | `NONE` | `NONE` | `SEMANTIC_SOURCE_REQUIRED` |
| `servant.mordred.skill.sc-mordred-2` | `SOURCE_EVIDENCE_REQUIRED` | `none` | `specific_handler` | `NONE` | `NONE` | `NONE` | `NONE` | `SEMANTIC_SOURCE_REQUIRED` |
| `servant.mordred.skill.sc-mordred-3` | `SOURCE_EVIDENCE_REQUIRED` | `none` | `shared_handler` | `NONE` | `NONE` | `NONE` | `NONE` | `SEMANTIC_SOURCE_REQUIRED` |
| `servant.morgan.skill.sc-morgan-1` | `SOURCE_EVIDENCE_REQUIRED` | `none` | `specific_handler` | `NONE` | `NONE` | `NONE` | `NONE` | `SEMANTIC_SOURCE_REQUIRED` |
| `servant.morgan.skill.sc-morgan-2` | `SOURCE_EVIDENCE_REQUIRED` | `none` | `specific_handler` | `NONE` | `NONE` | `NONE` | `NONE` | `SEMANTIC_SOURCE_REQUIRED` |
| `servant.morgan.skill.sc-morgan-3` | `SOURCE_EVIDENCE_REQUIRED` | `none` | `shared_handler` | `NONE` | `NONE` | `NONE` | `NONE` | `SEMANTIC_SOURCE_REQUIRED` |
| `servant.moriarty.skill.sc-moriarty-1` | `SOURCE_EVIDENCE_REQUIRED` | `none` | `specific_handler` | `NONE` | `NONE` | `NONE` | `NONE` | `SEMANTIC_SOURCE_REQUIRED` |
| `servant.moriarty.skill.sc-moriarty-2` | `SOURCE_EVIDENCE_REQUIRED` | `none` | `specific_handler` | `NONE` | `NONE` | `NONE` | `NONE` | `SEMANTIC_SOURCE_REQUIRED` |
| `servant.moriarty.skill.sc-moriarty-3` | `SOURCE_EVIDENCE_REQUIRED` | `none` | `specific_handler` | `NONE` | `NONE` | `NONE` | `NONE` | `SEMANTIC_SOURCE_REQUIRED` |
| `servant.mozart.skill.sc-mozart-1` | `READY_GENERIC_EXTENSION` | `none` | `shared_handler` | `CONDITION`, `HIDDEN_INFORMATION`, `LIFECYCLE`, `MODIFIER`, `TRIGGER` | `GENERIC_CONDITION_EVALUATION`, `GENERIC_LIFECYCLE_POLICY`, `GENERIC_MODIFIER`, `GENERIC_TRIGGER_GATEWAY`, `GENERIC_VISIBILITY` | `NONE` | `NONE` | `NONE` |
| `servant.mozart.skill.sc-mozart-2` | `READY_GENERIC_EXTENSION` | `none` | `shared_handler` | `BATTLE_RESULT`, `CONDITION`, `HIDDEN_INFORMATION`, `LIFECYCLE`, `RESOURCE_NUMERIC`, `TRIGGER` | `GENERIC_BATTLE_INTEGRATION`, `GENERIC_CONDITION_EVALUATION`, `GENERIC_RESOURCE_NUMERIC`, `GENERIC_STATUS_STATE`, `GENERIC_TRIGGER_GATEWAY`, `GENERIC_VISIBILITY` | `NONE` | `NONE` | `NONE` |
| `servant.mozart.skill.sc-mozart-3` | `SOURCE_EVIDENCE_REQUIRED` | `none` | `shared_handler` | `NONE` | `NONE` | `NONE` | `NONE` | `SEMANTIC_SOURCE_REQUIRED` |
| `servant.muramasa.skill.sc-muramasa-1` | `SOURCE_EVIDENCE_REQUIRED` | `none` | `shared_handler` | `NONE` | `NONE` | `NONE` | `NONE` | `SEMANTIC_SOURCE_REQUIRED` |
| `servant.muramasa.skill.sc-muramasa-2` | `SOURCE_EVIDENCE_REQUIRED` | `none` | `specific_handler` | `NONE` | `NONE` | `NONE` | `NONE` | `SEMANTIC_SOURCE_REQUIRED` |
| `servant.muramasa.skill.sc-muramasa-3` | `SOURCE_EVIDENCE_REQUIRED` | `none` | `shared_handler` | `NONE` | `NONE` | `NONE` | `NONE` | `SEMANTIC_SOURCE_REQUIRED` |
| `servant.musashi.skill.sc-musashi-1` | `SOURCE_EVIDENCE_REQUIRED` | `none` | `specific_handler` | `NONE` | `NONE` | `NONE` | `NONE` | `SEMANTIC_SOURCE_REQUIRED` |
| `servant.musashi.skill.sc-musashi-2` | `SOURCE_EVIDENCE_REQUIRED` | `none` | `specific_handler` | `NONE` | `NONE` | `NONE` | `NONE` | `SEMANTIC_SOURCE_REQUIRED` |
| `servant.musashi.skill.sc-musashi-3` | `SOURCE_EVIDENCE_REQUIRED` | `none` | `shared_handler` | `NONE` | `NONE` | `NONE` | `NONE` | `SEMANTIC_SOURCE_REQUIRED` |
| `servant.napoleon.skill.sc-napoleon-1` | `READY_GENERIC_EXTENSION` | `none` | `shared_handler` | `BATTLE_RESULT`, `CONDITION`, `HIDDEN_INFORMATION`, `INTERACTION`, `LIFECYCLE`, `MODIFIER`, `RESULT_BINDING`, `TARGET_SELECTION` | `GENERIC_BATTLE_INTEGRATION`, `GENERIC_CONDITION_EVALUATION`, `GENERIC_LIFECYCLE_POLICY`, `GENERIC_MODIFIER`, `GENERIC_PENDING_INTERACTION`, `GENERIC_RESULT_BINDING`, `GENERIC_TARGET_SELECTION`, `GENERIC_VISIBILITY` | `NONE` | `NONE` | `NONE` |
| `servant.napoleon.skill.sc-napoleon-2` | `READY_GENERIC_EXTENSION` | `none` | `shared_handler` | `CARD_ACTION_SEMANTICS`, `CARD_ZONE`, `CONDITION`, `HIDDEN_INFORMATION`, `INTERACTION`, `RESULT_BINDING`, `TARGET_SELECTION` | `CARD_ACTION_PLAY`, `GENERIC_CARD_ZONE`, `GENERIC_CONDITION_EVALUATION`, `GENERIC_PENDING_INTERACTION`, `GENERIC_RESULT_BINDING`, `GENERIC_TARGET_SELECTION`, `GENERIC_VISIBILITY` | `NONE` | `NONE` | `NONE` |
| `servant.napoleon.skill.sc-napoleon-3` | `SOURCE_EVIDENCE_REQUIRED` | `none` | `shared_handler` | `NONE` | `NONE` | `NONE` | `NONE` | `SEMANTIC_SOURCE_REQUIRED` |
| `servant.nemo.skill.sc-nemo-1` | `SOURCE_EVIDENCE_REQUIRED` | `none` | `specific_handler` | `NONE` | `NONE` | `NONE` | `NONE` | `SEMANTIC_SOURCE_REQUIRED` |
| `servant.nemo.skill.sc-nemo-2` | `SOURCE_EVIDENCE_REQUIRED` | `none` | `specific_handler` | `NONE` | `NONE` | `NONE` | `NONE` | `SEMANTIC_SOURCE_REQUIRED` |
| `servant.nemo.skill.sc-nemo-3` | `SOURCE_EVIDENCE_REQUIRED` | `none` | `specific_handler` | `NONE` | `NONE` | `NONE` | `NONE` | `SEMANTIC_SOURCE_REQUIRED` |
| `servant.nero.skill.sc-nero-1` | `READY_GENERIC_EXTENSION` | `none` | `shared_handler` | `BATTLE_RESULT`, `CARD_ACTION_SEMANTICS`, `CONDITION`, `HIDDEN_INFORMATION`, `LIFECYCLE`, `RESOURCE_NUMERIC`, `TRIGGER` | `CARD_ACTION_CLOSE`, `GENERIC_BATTLE_INTEGRATION`, `GENERIC_CONDITION_EVALUATION`, `GENERIC_LIFECYCLE_POLICY`, `GENERIC_RESOURCE_NUMERIC`, `GENERIC_TRIGGER_GATEWAY`, `GENERIC_VISIBILITY` | `NONE` | `NONE` | `NONE` |
| `servant.nero.skill.sc-nero-2` | `READY_GENERIC_EXTENSION` | `none` | `shared_handler` | `CARD_ACTION_SEMANTICS`, `CARD_ZONE`, `CONDITION`, `HIDDEN_INFORMATION`, `INTERACTION`, `RESULT_BINDING`, `TARGET_SELECTION` | `CARD_ACTION_PLAY`, `GENERIC_CARD_ZONE`, `GENERIC_CONDITION_EVALUATION`, `GENERIC_PENDING_INTERACTION`, `GENERIC_RESULT_BINDING`, `GENERIC_TARGET_SELECTION`, `GENERIC_VISIBILITY` | `NONE` | `NONE` | `NONE` |
| `servant.nero.skill.sc-nero-3` | `SOURCE_EVIDENCE_REQUIRED` | `none` | `specific_handler` | `NONE` | `NONE` | `NONE` | `NONE` | `SEMANTIC_SOURCE_REQUIRED` |
| `servant.nightingale.skill.sc-nightingale-1` | `SOURCE_EVIDENCE_REQUIRED` | `none` | `specific_handler` | `NONE` | `NONE` | `NONE` | `NONE` | `SEMANTIC_SOURCE_REQUIRED` |
| `servant.nightingale.skill.sc-nightingale-2` | `SOURCE_EVIDENCE_REQUIRED` | `none` | `specific_handler` | `NONE` | `NONE` | `NONE` | `NONE` | `SEMANTIC_SOURCE_REQUIRED` |
| `servant.nightingale.skill.sc-nightingale-3` | `SOURCE_EVIDENCE_REQUIRED` | `none` | `specific_handler` | `NONE` | `NONE` | `NONE` | `NONE` | `SEMANTIC_SOURCE_REQUIRED` |
| `servant.nitocris.skill.sc-nitocris-1` | `SOURCE_EVIDENCE_REQUIRED` | `none` | `shared_handler` | `NONE` | `NONE` | `NONE` | `NONE` | `SEMANTIC_SOURCE_REQUIRED` |
| `servant.nitocris.skill.sc-nitocris-2` | `SOURCE_EVIDENCE_REQUIRED` | `none` | `shared_handler` | `NONE` | `NONE` | `NONE` | `NONE` | `SEMANTIC_SOURCE_REQUIRED` |
| `servant.nitocris.skill.sc-nitocris-3` | `SOURCE_EVIDENCE_REQUIRED` | `none` | `shared_handler` | `NONE` | `NONE` | `NONE` | `NONE` | `SEMANTIC_SOURCE_REQUIRED` |
| `servant.nobunaga.skill.sc-nobunaga-1` | `SOURCE_EVIDENCE_REQUIRED` | `none` | `specific_handler` | `NONE` | `NONE` | `NONE` | `NONE` | `SEMANTIC_SOURCE_REQUIRED` |
| `servant.nobunaga.skill.sc-nobunaga-2` | `SOURCE_EVIDENCE_REQUIRED` | `none` | `specific_handler` | `NONE` | `NONE` | `NONE` | `NONE` | `SEMANTIC_SOURCE_REQUIRED` |
| `servant.nobunaga.skill.sc-nobunaga-3` | `READY_GENERIC_EXTENSION` | `none` | `shared_handler` | `BATTLE_RESULT`, `CONDITION`, `RESOURCE_NUMERIC`, `TRIGGER` | `GENERIC_BATTLE_INTEGRATION`, `GENERIC_CONDITION_EVALUATION`, `GENERIC_RESOURCE_NUMERIC`, `GENERIC_TRIGGER_GATEWAY` | `NONE` | `NONE` | `NONE` |
| `servant.nursery.skill.sc-nursery-1` | `SOURCE_EVIDENCE_REQUIRED` | `none` | `shared_handler` | `NONE` | `NONE` | `NONE` | `NONE` | `SEMANTIC_SOURCE_REQUIRED` |
| `servant.nursery.skill.sc-nursery-2` | `READY_GENERIC_EXTENSION` | `none` | `shared_handler` | `CONDITION`, `HIDDEN_INFORMATION`, `LIFECYCLE`, `MODIFIER` | `GENERIC_CONDITION_EVALUATION`, `GENERIC_LIFECYCLE_POLICY`, `GENERIC_MODIFIER`, `GENERIC_VISIBILITY` | `NONE` | `NONE` | `NONE` |
| `servant.nursery.skill.sc-nursery-3` | `SOURCE_EVIDENCE_REQUIRED` | `none` | `shared_handler` | `NONE` | `NONE` | `NONE` | `NONE` | `SEMANTIC_SOURCE_REQUIRED` |
| `servant.oberon.skill.sc-oberon-1` | `SOURCE_EVIDENCE_REQUIRED` | `none` | `shared_handler` | `NONE` | `NONE` | `NONE` | `NONE` | `SEMANTIC_SOURCE_REQUIRED` |
| `servant.oberon.skill.sc-oberon-2` | `SOURCE_EVIDENCE_REQUIRED` | `none` | `shared_handler` | `NONE` | `NONE` | `NONE` | `NONE` | `SEMANTIC_SOURCE_REQUIRED` |
| `servant.oberon.skill.sc-oberon-3` | `SOURCE_EVIDENCE_REQUIRED` | `none` | `shared_handler` | `NONE` | `NONE` | `NONE` | `NONE` | `SEMANTIC_SOURCE_REQUIRED` |
| `servant.oberon.skill.sc-oberon-4` | `SOURCE_EVIDENCE_REQUIRED` | `none` | `shared_handler` | `NONE` | `NONE` | `NONE` | `NONE` | `SEMANTIC_SOURCE_REQUIRED` |
| `servant.odysseus.skill.sc-odysseus-1` | `SOURCE_EVIDENCE_REQUIRED` | `none` | `specific_handler` | `NONE` | `NONE` | `NONE` | `NONE` | `SEMANTIC_SOURCE_REQUIRED` |
| `servant.odysseus.skill.sc-odysseus-2` | `SOURCE_EVIDENCE_REQUIRED` | `none` | `specific_handler` | `NONE` | `NONE` | `NONE` | `NONE` | `SEMANTIC_SOURCE_REQUIRED` |
| `servant.odysseus.skill.sc-odysseus-3` | `SOURCE_EVIDENCE_REQUIRED` | `none` | `shared_handler` | `NONE` | `NONE` | `NONE` | `NONE` | `SEMANTIC_SOURCE_REQUIRED` |
| `servant.okita-alt.skill.sc-okita-alt-1` | `SOURCE_EVIDENCE_REQUIRED` | `none` | `shared_handler` | `NONE` | `NONE` | `NONE` | `NONE` | `SEMANTIC_SOURCE_REQUIRED` |
| `servant.okita-alt.skill.sc-okita-alt-2` | `SOURCE_EVIDENCE_REQUIRED` | `none` | `specific_handler` | `NONE` | `NONE` | `NONE` | `NONE` | `SEMANTIC_SOURCE_REQUIRED` |
| `servant.okita-alt.skill.sc-okita-alt-3` | `SOURCE_EVIDENCE_REQUIRED` | `none` | `specific_handler` | `NONE` | `NONE` | `NONE` | `NONE` | `SEMANTIC_SOURCE_REQUIRED` |
| `servant.okita.skill.sc-okita-1` | `SOURCE_EVIDENCE_REQUIRED` | `none` | `specific_handler` | `NONE` | `NONE` | `NONE` | `NONE` | `SEMANTIC_SOURCE_REQUIRED` |
| `servant.okita.skill.sc-okita-2` | `SOURCE_EVIDENCE_REQUIRED` | `none` | `shared_handler` | `NONE` | `NONE` | `NONE` | `NONE` | `SEMANTIC_SOURCE_REQUIRED` |
| `servant.okita.skill.sc-okita-3` | `SOURCE_EVIDENCE_REQUIRED` | `none` | `specific_handler` | `NONE` | `NONE` | `NONE` | `NONE` | `SEMANTIC_SOURCE_REQUIRED` |
| `servant.okita.skill.sc-okita-4` | `SOURCE_EVIDENCE_REQUIRED` | `none` | `specific_handler` | `NONE` | `NONE` | `NONE` | `NONE` | `SEMANTIC_SOURCE_REQUIRED` |
| `servant.orion.skill.sc-orion-1` | `SOURCE_EVIDENCE_REQUIRED` | `none` | `specific_handler` | `NONE` | `NONE` | `NONE` | `NONE` | `SEMANTIC_SOURCE_REQUIRED` |
| `servant.orion.skill.sc-orion-2` | `SOURCE_EVIDENCE_REQUIRED` | `none` | `specific_handler` | `NONE` | `NONE` | `NONE` | `NONE` | `SEMANTIC_SOURCE_REQUIRED` |
| `servant.orion.skill.sc-orion-3` | `SOURCE_EVIDENCE_REQUIRED` | `none` | `specific_handler` | `NONE` | `NONE` | `NONE` | `NONE` | `SEMANTIC_SOURCE_REQUIRED` |
| `servant.osakabe.skill.sc-osakabe-1` | `SOURCE_EVIDENCE_REQUIRED` | `none` | `specific_handler` | `NONE` | `NONE` | `NONE` | `NONE` | `SEMANTIC_SOURCE_REQUIRED` |
| `servant.osakabe.skill.sc-osakabe-2` | `SOURCE_EVIDENCE_REQUIRED` | `none` | `specific_handler` | `NONE` | `NONE` | `NONE` | `NONE` | `SEMANTIC_SOURCE_REQUIRED` |
| `servant.osakabe.skill.sc-osakabe-3` | `SOURCE_EVIDENCE_REQUIRED` | `none` | `specific_handler` | `NONE` | `NONE` | `NONE` | `NONE` | `SEMANTIC_SOURCE_REQUIRED` |
| `servant.ozymandias.skill.sc-ozymandias-1` | `SOURCE_EVIDENCE_REQUIRED` | `none` | `specific_handler` | `NONE` | `NONE` | `NONE` | `NONE` | `SEMANTIC_SOURCE_REQUIRED` |
| `servant.ozymandias.skill.sc-ozymandias-2` | `READY_GENERIC_EXTENSION` | `none` | `shared_handler` | `CARD_ACTION_SEMANTICS`, `CONDITION`, `LIFECYCLE`, `MODIFIER`, `POWER`, `RESOURCE_NUMERIC`, `TRIGGER` | `CARD_ACTION_CLOSE`, `GENERIC_CONDITION_EVALUATION`, `GENERIC_LIFECYCLE_POLICY`, `GENERIC_MODIFIER`, `GENERIC_POWER`, `GENERIC_RESOURCE_NUMERIC`, `GENERIC_TRIGGER_GATEWAY` | `NONE` | `NONE` | `NONE` |
| `servant.ozymandias.skill.sc-ozymandias-3` | `SOURCE_EVIDENCE_REQUIRED` | `none` | `specific_handler` | `NONE` | `NONE` | `NONE` | `NONE` | `SEMANTIC_SOURCE_REQUIRED` |
| `servant.parvati.skill.sc-parvati-1` | `SOURCE_EVIDENCE_REQUIRED` | `none` | `specific_handler` | `NONE` | `NONE` | `NONE` | `NONE` | `SEMANTIC_SOURCE_REQUIRED` |
| `servant.parvati.skill.sc-parvati-2` | `SOURCE_EVIDENCE_REQUIRED` | `none` | `specific_handler` | `NONE` | `NONE` | `NONE` | `NONE` | `SEMANTIC_SOURCE_REQUIRED` |
| `servant.parvati.skill.sc-parvati-3` | `READY_GENERIC_EXTENSION` | `none` | `shared_handler` | `CARD_ACTION_SEMANTICS`, `CONDITION`, `INTERACTION`, `LIFECYCLE`, `RESULT_BINDING`, `TARGET_SELECTION` | `CARD_ACTION_PLAY`, `GENERIC_CONDITION_EVALUATION`, `GENERIC_LIFECYCLE_POLICY`, `GENERIC_PENDING_INTERACTION`, `GENERIC_RESULT_BINDING`, `GENERIC_TARGET_SELECTION` | `NONE` | `NONE` | `NONE` |
| `servant.passionlip.skill.sc-passionlip-1` | `SOURCE_EVIDENCE_REQUIRED` | `none` | `shared_handler` | `NONE` | `NONE` | `NONE` | `NONE` | `SEMANTIC_SOURCE_REQUIRED` |
| `servant.passionlip.skill.sc-passionlip-2` | `SOURCE_EVIDENCE_REQUIRED` | `none` | `specific_handler` | `NONE` | `NONE` | `NONE` | `NONE` | `SEMANTIC_SOURCE_REQUIRED` |
| `servant.passionlip.skill.sc-passionlip-3` | `SOURCE_EVIDENCE_REQUIRED` | `none` | `specific_handler` | `NONE` | `NONE` | `NONE` | `NONE` | `SEMANTIC_SOURCE_REQUIRED` |
| `servant.penthesilea.skill.sc-penthesilea-1` | `SOURCE_EVIDENCE_REQUIRED` | `none` | `specific_handler` | `NONE` | `NONE` | `NONE` | `NONE` | `SEMANTIC_SOURCE_REQUIRED` |
| `servant.penthesilea.skill.sc-penthesilea-2` | `SOURCE_EVIDENCE_REQUIRED` | `none` | `specific_handler` | `NONE` | `NONE` | `NONE` | `NONE` | `SEMANTIC_SOURCE_REQUIRED` |
| `servant.penthesilea.skill.sc-penthesilea-3` | `SOURCE_EVIDENCE_REQUIRED` | `none` | `specific_handler` | `NONE` | `NONE` | `NONE` | `NONE` | `SEMANTIC_SOURCE_REQUIRED` |
| `servant.quetzalcoatl.skill.sc-quetzalcoatl-1` | `SOURCE_EVIDENCE_REQUIRED` | `none` | `specific_handler` | `NONE` | `NONE` | `NONE` | `NONE` | `SEMANTIC_SOURCE_REQUIRED` |
| `servant.quetzalcoatl.skill.sc-quetzalcoatl-2` | `SOURCE_EVIDENCE_REQUIRED` | `none` | `specific_handler` | `NONE` | `NONE` | `NONE` | `NONE` | `SEMANTIC_SOURCE_REQUIRED` |
| `servant.quetzalcoatl.skill.sc-quetzalcoatl-3` | `SOURCE_EVIDENCE_REQUIRED` | `none` | `shared_handler` | `NONE` | `NONE` | `NONE` | `NONE` | `SEMANTIC_SOURCE_REQUIRED` |
| `servant.raikou.skill.sc-raikou-1` | `SOURCE_EVIDENCE_REQUIRED` | `none` | `specific_handler` | `NONE` | `NONE` | `NONE` | `NONE` | `SEMANTIC_SOURCE_REQUIRED` |
| `servant.raikou.skill.sc-raikou-2` | `SOURCE_EVIDENCE_REQUIRED` | `none` | `shared_handler` | `NONE` | `NONE` | `NONE` | `NONE` | `SEMANTIC_SOURCE_REQUIRED` |
| `servant.raikou.skill.sc-raikou-3` | `SOURCE_EVIDENCE_REQUIRED` | `none` | `specific_handler` | `NONE` | `NONE` | `NONE` | `NONE` | `SEMANTIC_SOURCE_REQUIRED` |
| `servant.roberts.skill.sc-roberts-1` | `READY_GENERIC_EXTENSION` | `none` | `shared_handler` | `BATTLE_RESULT`, `CONDITION`, `COST_PAYMENT`, `INTERACTION`, `LIFECYCLE`, `RESULT_BINDING`, `TARGET_SELECTION` | `GENERIC_BATTLE_INTEGRATION`, `GENERIC_CONDITION_EVALUATION`, `GENERIC_COST_PAYMENT`, `GENERIC_LIFECYCLE_POLICY`, `GENERIC_PENDING_INTERACTION`, `GENERIC_RESULT_BINDING`, `GENERIC_STATUS_STATE`, `GENERIC_TARGET_SELECTION` | `NONE` | `NONE` | `NONE` |
| `servant.roberts.skill.sc-roberts-2` | `READY_GENERIC_EXTENSION` | `none` | `shared_handler` | `CARD_ZONE`, `CONDITION`, `COST_PAYMENT`, `HIDDEN_INFORMATION`, `INTERACTION`, `TARGET_SELECTION` | `GENERIC_CARD_ZONE`, `GENERIC_CONDITION_EVALUATION`, `GENERIC_COST_PAYMENT`, `GENERIC_PENDING_INTERACTION`, `GENERIC_TARGET_SELECTION`, `GENERIC_VISIBILITY` | `NONE` | `NONE` | `NONE` |
| `servant.roberts.skill.sc-roberts-3` | `SOURCE_EVIDENCE_REQUIRED` | `none` | `shared_handler` | `NONE` | `NONE` | `NONE` | `NONE` | `SEMANTIC_SOURCE_REQUIRED` |
| `servant.robin.skill.sc-robin-1` | `SOURCE_EVIDENCE_REQUIRED` | `none` | `shared_handler` | `NONE` | `NONE` | `NONE` | `NONE` | `SEMANTIC_SOURCE_REQUIRED` |
| `servant.robin.skill.sc-robin-2` | `SOURCE_EVIDENCE_REQUIRED` | `none` | `shared_handler` | `NONE` | `NONE` | `NONE` | `NONE` | `SEMANTIC_SOURCE_REQUIRED` |
| `servant.robin.skill.sc-robin-3` | `SOURCE_EVIDENCE_REQUIRED` | `none` | `specific_handler` | `NONE` | `NONE` | `NONE` | `NONE` | `SEMANTIC_SOURCE_REQUIRED` |
| `servant.romulus.skill.sc-romulus-1` | `SOURCE_EVIDENCE_REQUIRED` | `none` | `specific_handler` | `NONE` | `NONE` | `NONE` | `NONE` | `SEMANTIC_SOURCE_REQUIRED` |
| `servant.romulus.skill.sc-romulus-2` | `SOURCE_EVIDENCE_REQUIRED` | `none` | `specific_handler` | `NONE` | `NONE` | `NONE` | `NONE` | `SEMANTIC_SOURCE_REQUIRED` |
| `servant.romulus.skill.sc-romulus-3` | `SOURCE_EVIDENCE_REQUIRED` | `none` | `shared_handler` | `NONE` | `NONE` | `NONE` | `NONE` | `SEMANTIC_SOURCE_REQUIRED` |
| `servant.ryouma.skill.sc-ryouma-1` | `SOURCE_EVIDENCE_REQUIRED` | `none` | `specific_handler` | `NONE` | `NONE` | `NONE` | `NONE` | `SEMANTIC_SOURCE_REQUIRED` |
| `servant.ryouma.skill.sc-ryouma-2` | `SOURCE_EVIDENCE_REQUIRED` | `none` | `specific_handler` | `NONE` | `NONE` | `NONE` | `NONE` | `SEMANTIC_SOURCE_REQUIRED` |
| `servant.ryouma.skill.sc-ryouma-3` | `SOURCE_EVIDENCE_REQUIRED` | `none` | `specific_handler` | `NONE` | `NONE` | `NONE` | `NONE` | `SEMANTIC_SOURCE_REQUIRED` |
| `servant.saber.skill.sc-saber-1` | `SOURCE_EVIDENCE_REQUIRED` | `none` | `shared_handler` | `NONE` | `NONE` | `NONE` | `NONE` | `SEMANTIC_SOURCE_REQUIRED` |
| `servant.saber.skill.sc-saber-2` | `SOURCE_EVIDENCE_REQUIRED` | `none` | `shared_handler` | `NONE` | `NONE` | `NONE` | `NONE` | `SEMANTIC_SOURCE_REQUIRED` |
| `servant.saber.skill.sc-saber-np` | `SOURCE_EVIDENCE_REQUIRED` | `none` | `shared_handler` | `NONE` | `NONE` | `NONE` | `NONE` | `SEMANTIC_SOURCE_REQUIRED` |
| `servant.saitou.skill.sc-saitou-1` | `SOURCE_EVIDENCE_REQUIRED` | `none` | `shared_handler` | `NONE` | `NONE` | `NONE` | `NONE` | `SEMANTIC_SOURCE_REQUIRED` |
| `servant.saitou.skill.sc-saitou-2` | `SOURCE_EVIDENCE_REQUIRED` | `none` | `specific_handler` | `NONE` | `NONE` | `NONE` | `NONE` | `SEMANTIC_SOURCE_REQUIRED` |
| `servant.saitou.skill.sc-saitou-3` | `SOURCE_EVIDENCE_REQUIRED` | `none` | `specific_handler` | `NONE` | `NONE` | `NONE` | `NONE` | `SEMANTIC_SOURCE_REQUIRED` |
| `servant.salieri.skill.sc-salieri-1` | `SOURCE_EVIDENCE_REQUIRED` | `none` | `shared_handler` | `NONE` | `NONE` | `NONE` | `NONE` | `SEMANTIC_SOURCE_REQUIRED` |
| `servant.salieri.skill.sc-salieri-2` | `SOURCE_EVIDENCE_REQUIRED` | `none` | `shared_handler` | `NONE` | `NONE` | `NONE` | `NONE` | `SEMANTIC_SOURCE_REQUIRED` |
| `servant.salieri.skill.sc-salieri-3` | `SOURCE_EVIDENCE_REQUIRED` | `none` | `shared_handler` | `NONE` | `NONE` | `NONE` | `NONE` | `SEMANTIC_SOURCE_REQUIRED` |
| `servant.sanson.skill.sc-sanson-1` | `SOURCE_EVIDENCE_REQUIRED` | `none` | `specific_handler` | `NONE` | `NONE` | `NONE` | `NONE` | `SEMANTIC_SOURCE_REQUIRED` |
| `servant.sanson.skill.sc-sanson-2` | `SOURCE_EVIDENCE_REQUIRED` | `none` | `specific_handler` | `NONE` | `NONE` | `NONE` | `NONE` | `SEMANTIC_SOURCE_REQUIRED` |
| `servant.sanson.skill.sc-sanson-3` | `SOURCE_EVIDENCE_REQUIRED` | `none` | `specific_handler` | `NONE` | `NONE` | `NONE` | `NONE` | `SEMANTIC_SOURCE_REQUIRED` |
| `servant.sanzang.skill.sc-sanzang-1` | `SOURCE_EVIDENCE_REQUIRED` | `none` | `specific_handler` | `NONE` | `NONE` | `NONE` | `NONE` | `SEMANTIC_SOURCE_REQUIRED` |
| `servant.sanzang.skill.sc-sanzang-2` | `SOURCE_EVIDENCE_REQUIRED` | `none` | `specific_handler` | `NONE` | `NONE` | `NONE` | `NONE` | `SEMANTIC_SOURCE_REQUIRED` |
| `servant.sanzang.skill.sc-sanzang-3` | `SOURCE_EVIDENCE_REQUIRED` | `none` | `specific_handler` | `NONE` | `NONE` | `NONE` | `NONE` | `SEMANTIC_SOURCE_REQUIRED` |
| `servant.sasaki.skill.sc-sasaki-1` | `SOURCE_EVIDENCE_REQUIRED` | `none` | `specific_handler` | `NONE` | `NONE` | `NONE` | `NONE` | `SEMANTIC_SOURCE_REQUIRED` |
| `servant.sasaki.skill.sc-sasaki-2` | `SOURCE_EVIDENCE_REQUIRED` | `none` | `specific_handler` | `NONE` | `NONE` | `NONE` | `NONE` | `SEMANTIC_SOURCE_REQUIRED` |
| `servant.sasaki.skill.sc-sasaki-3` | `SOURCE_EVIDENCE_REQUIRED` | `none` | `specific_handler` | `NONE` | `NONE` | `NONE` | `NONE` | `SEMANTIC_SOURCE_REQUIRED` |
| `servant.scathach.skill.sc-scathach-1` | `SOURCE_EVIDENCE_REQUIRED` | `none` | `specific_handler` | `NONE` | `NONE` | `NONE` | `NONE` | `SEMANTIC_SOURCE_REQUIRED` |
| `servant.scathach.skill.sc-scathach-2` | `SOURCE_EVIDENCE_REQUIRED` | `none` | `shared_handler` | `NONE` | `NONE` | `NONE` | `NONE` | `SEMANTIC_SOURCE_REQUIRED` |
| `servant.scathach.skill.sc-scathach-3` | `SOURCE_EVIDENCE_REQUIRED` | `none` | `specific_handler` | `NONE` | `NONE` | `NONE` | `NONE` | `SEMANTIC_SOURCE_REQUIRED` |
| `servant.sei.skill.sc-sei-1` | `SOURCE_EVIDENCE_REQUIRED` | `none` | `shared_handler` | `NONE` | `NONE` | `NONE` | `NONE` | `SEMANTIC_SOURCE_REQUIRED` |
| `servant.sei.skill.sc-sei-2` | `SOURCE_EVIDENCE_REQUIRED` | `none` | `shared_handler` | `NONE` | `NONE` | `NONE` | `NONE` | `SEMANTIC_SOURCE_REQUIRED` |
| `servant.sei.skill.sc-sei-3` | `SOURCE_EVIDENCE_REQUIRED` | `none` | `shared_handler` | `NONE` | `NONE` | `NONE` | `NONE` | `SEMANTIC_SOURCE_REQUIRED` |
| `servant.semiramis.skill.sc-semiramis-1` | `SOURCE_EVIDENCE_REQUIRED` | `none` | `shared_handler` | `NONE` | `NONE` | `NONE` | `NONE` | `SEMANTIC_SOURCE_REQUIRED` |
| `servant.semiramis.skill.sc-semiramis-2` | `SOURCE_EVIDENCE_REQUIRED` | `none` | `shared_handler` | `NONE` | `NONE` | `NONE` | `NONE` | `SEMANTIC_SOURCE_REQUIRED` |
| `servant.semiramis.skill.sc-semiramis-3` | `SOURCE_EVIDENCE_REQUIRED` | `none` | `shared_handler` | `NONE` | `NONE` | `NONE` | `NONE` | `SEMANTIC_SOURCE_REQUIRED` |
| `servant.shakespeare.skill.sc-shakespeare-1` | `SOURCE_EVIDENCE_REQUIRED` | `none` | `shared_handler` | `NONE` | `NONE` | `NONE` | `NONE` | `SEMANTIC_SOURCE_REQUIRED` |
| `servant.shakespeare.skill.sc-shakespeare-2` | `SOURCE_EVIDENCE_REQUIRED` | `none` | `specific_handler` | `NONE` | `NONE` | `NONE` | `NONE` | `SEMANTIC_SOURCE_REQUIRED` |
| `servant.shakespeare.skill.sc-shakespeare-3` | `SOURCE_EVIDENCE_REQUIRED` | `none` | `shared_handler` | `NONE` | `NONE` | `NONE` | `NONE` | `SEMANTIC_SOURCE_REQUIRED` |
| `servant.sherlock.skill.sc-sherlock-1` | `SOURCE_EVIDENCE_REQUIRED` | `none` | `specific_handler` | `NONE` | `NONE` | `NONE` | `NONE` | `SEMANTIC_SOURCE_REQUIRED` |
| `servant.sherlock.skill.sc-sherlock-2` | `SOURCE_EVIDENCE_REQUIRED` | `none` | `specific_handler` | `NONE` | `NONE` | `NONE` | `NONE` | `SEMANTIC_SOURCE_REQUIRED` |
| `servant.sherlock.skill.sc-sherlock-3` | `SOURCE_EVIDENCE_REQUIRED` | `none` | `specific_handler` | `NONE` | `NONE` | `NONE` | `NONE` | `SEMANTIC_SOURCE_REQUIRED` |
| `servant.sherlock.skill.sc-sherlock-4` | `SOURCE_EVIDENCE_REQUIRED` | `none` | `shared_handler` | `NONE` | `NONE` | `NONE` | `NONE` | `SEMANTIC_SOURCE_REQUIRED` |
| `servant.sherlock.skill.sc-sherlock-5` | `SOURCE_EVIDENCE_REQUIRED` | `none` | `shared_handler` | `NONE` | `NONE` | `NONE` | `NONE` | `SEMANTIC_SOURCE_REQUIRED` |
| `servant.sherlock.skill.sc-sherlock-6` | `SOURCE_EVIDENCE_REQUIRED` | `none` | `shared_handler` | `NONE` | `NONE` | `NONE` | `NONE` | `SEMANTIC_SOURCE_REQUIRED` |
| `servant.sherlock.skill.sc-sherlock-7` | `SOURCE_EVIDENCE_REQUIRED` | `none` | `shared_handler` | `NONE` | `NONE` | `NONE` | `NONE` | `SEMANTIC_SOURCE_REQUIRED` |
| `servant.shuten.skill.sc-shuten-1` | `SOURCE_EVIDENCE_REQUIRED` | `none` | `specific_handler` | `NONE` | `NONE` | `NONE` | `NONE` | `SEMANTIC_SOURCE_REQUIRED` |
| `servant.shuten.skill.sc-shuten-2` | `SOURCE_EVIDENCE_REQUIRED` | `none` | `specific_handler` | `NONE` | `NONE` | `NONE` | `NONE` | `SEMANTIC_SOURCE_REQUIRED` |
| `servant.shuten.skill.sc-shuten-3` | `SOURCE_EVIDENCE_REQUIRED` | `none` | `specific_handler` | `NONE` | `NONE` | `NONE` | `NONE` | `SEMANTIC_SOURCE_REQUIRED` |
| `servant.siegfried.skill.sc-siegfried-1` | `SOURCE_EVIDENCE_REQUIRED` | `none` | `specific_handler` | `NONE` | `NONE` | `NONE` | `NONE` | `SEMANTIC_SOURCE_REQUIRED` |
| `servant.siegfried.skill.sc-siegfried-2` | `READY_GENERIC_EXTENSION` | `none` | `shared_handler` | `BATTLE_RESULT`, `CARD_ACTION_SEMANTICS`, `CONDITION`, `TRIGGER` | `CARD_ACTION_CLOSE`, `GENERIC_BATTLE_INTEGRATION`, `GENERIC_CONDITION_EVALUATION`, `GENERIC_TRIGGER_GATEWAY` | `NONE` | `NONE` | `NONE` |
| `servant.siegfried.skill.sc-siegfried-3` | `SOURCE_EVIDENCE_REQUIRED` | `none` | `specific_handler` | `NONE` | `NONE` | `NONE` | `NONE` | `SEMANTIC_SOURCE_REQUIRED` |
| `servant.sigurd.skill.sc-sigurd-1` | `SOURCE_EVIDENCE_REQUIRED` | `none` | `specific_handler` | `NONE` | `NONE` | `NONE` | `NONE` | `SEMANTIC_SOURCE_REQUIRED` |
| `servant.sigurd.skill.sc-sigurd-2` | `SOURCE_EVIDENCE_REQUIRED` | `none` | `specific_handler` | `NONE` | `NONE` | `NONE` | `NONE` | `SEMANTIC_SOURCE_REQUIRED` |
| `servant.sigurd.skill.sc-sigurd-3` | `SOURCE_EVIDENCE_REQUIRED` | `none` | `shared_handler` | `NONE` | `NONE` | `NONE` | `NONE` | `SEMANTIC_SOURCE_REQUIRED` |
| `servant.sitonai.skill.sc-sitonai-1` | `SOURCE_EVIDENCE_REQUIRED` | `none` | `specific_handler` | `NONE` | `NONE` | `NONE` | `NONE` | `SEMANTIC_SOURCE_REQUIRED` |
| `servant.sitonai.skill.sc-sitonai-2` | `SOURCE_EVIDENCE_REQUIRED` | `none` | `specific_handler` | `NONE` | `NONE` | `NONE` | `NONE` | `SEMANTIC_SOURCE_REQUIRED` |
| `servant.sitonai.skill.sc-sitonai-3` | `SOURCE_EVIDENCE_REQUIRED` | `none` | `shared_handler` | `NONE` | `NONE` | `NONE` | `NONE` | `SEMANTIC_SOURCE_REQUIRED` |
| `servant.skadi.skill.sc-skadi-1` | `SOURCE_EVIDENCE_REQUIRED` | `none` | `specific_handler` | `NONE` | `NONE` | `NONE` | `NONE` | `SEMANTIC_SOURCE_REQUIRED` |
| `servant.skadi.skill.sc-skadi-2` | `SOURCE_EVIDENCE_REQUIRED` | `none` | `specific_handler` | `NONE` | `NONE` | `NONE` | `NONE` | `SEMANTIC_SOURCE_REQUIRED` |
| `servant.skadi.skill.sc-skadi-3` | `SOURCE_EVIDENCE_REQUIRED` | `none` | `specific_handler` | `NONE` | `NONE` | `NONE` | `NONE` | `SEMANTIC_SOURCE_REQUIRED` |
| `servant.spartacus.skill.sc-spartacus-1` | `SOURCE_EVIDENCE_REQUIRED` | `none` | `specific_handler` | `NONE` | `NONE` | `NONE` | `NONE` | `SEMANTIC_SOURCE_REQUIRED` |
| `servant.spartacus.skill.sc-spartacus-2` | `READY_GENERIC_EXTENSION` | `none` | `shared_handler` | `BATTLE_RESULT`, `CONDITION`, `INTERACTION`, `LIFECYCLE`, `RESOURCE_NUMERIC`, `TARGET_SELECTION`, `TRIGGER` | `GENERIC_BATTLE_INTEGRATION`, `GENERIC_CONDITION_EVALUATION`, `GENERIC_LIFECYCLE_POLICY`, `GENERIC_PENDING_INTERACTION`, `GENERIC_RESOURCE_NUMERIC`, `GENERIC_TARGET_SELECTION`, `GENERIC_TRIGGER_GATEWAY` | `NONE` | `NONE` | `NONE` |
| `servant.spartacus.skill.sc-spartacus-3` | `SOURCE_EVIDENCE_REQUIRED` | `none` | `specific_handler` | `NONE` | `NONE` | `NONE` | `NONE` | `SEMANTIC_SOURCE_REQUIRED` |
| `servant.stheno.skill.sc-stheno-1` | `SOURCE_EVIDENCE_REQUIRED` | `none` | `shared_handler` | `NONE` | `NONE` | `NONE` | `NONE` | `SEMANTIC_SOURCE_REQUIRED` |
| `servant.stheno.skill.sc-stheno-2` | `READY_GENERIC_EXTENSION` | `none` | `shared_handler` | `BATTLE_RESULT`, `CONDITION`, `MODIFIER`, `RESOURCE_NUMERIC`, `TRIGGER` | `GENERIC_BATTLE_INTEGRATION`, `GENERIC_CONDITION_EVALUATION`, `GENERIC_MODIFIER`, `GENERIC_RESOURCE_NUMERIC`, `GENERIC_TRIGGER_GATEWAY` | `NONE` | `NONE` | `NONE` |
| `servant.stheno.skill.sc-stheno-3` | `SOURCE_EVIDENCE_REQUIRED` | `none` | `specific_handler` | `NONE` | `NONE` | `NONE` | `NONE` | `SEMANTIC_SOURCE_REQUIRED` |
| `servant.suzuka.skill.sc-suzuka-1` | `SOURCE_EVIDENCE_REQUIRED` | `none` | `shared_handler` | `NONE` | `NONE` | `NONE` | `NONE` | `SEMANTIC_SOURCE_REQUIRED` |
| `servant.suzuka.skill.sc-suzuka-2` | `SOURCE_EVIDENCE_REQUIRED` | `none` | `shared_handler` | `NONE` | `NONE` | `NONE` | `NONE` | `SEMANTIC_SOURCE_REQUIRED` |
| `servant.suzuka.skill.sc-suzuka-3` | `SOURCE_EVIDENCE_REQUIRED` | `none` | `shared_handler` | `NONE` | `NONE` | `NONE` | `NONE` | `SEMANTIC_SOURCE_REQUIRED` |
| `servant.taisui.skill.sc-taisui-1` | `SOURCE_EVIDENCE_REQUIRED` | `none` | `shared_handler` | `NONE` | `NONE` | `NONE` | `NONE` | `SEMANTIC_SOURCE_REQUIRED` |
| `servant.taisui.skill.sc-taisui-2` | `SOURCE_EVIDENCE_REQUIRED` | `none` | `specific_handler` | `NONE` | `NONE` | `NONE` | `NONE` | `SEMANTIC_SOURCE_REQUIRED` |
| `servant.taisui.skill.sc-taisui-3` | `SOURCE_EVIDENCE_REQUIRED` | `none` | `specific_handler` | `NONE` | `NONE` | `NONE` | `NONE` | `SEMANTIC_SOURCE_REQUIRED` |
| `servant.tamamo.skill.sc-tamamo-1` | `SOURCE_EVIDENCE_REQUIRED` | `none` | `specific_handler` | `NONE` | `NONE` | `NONE` | `NONE` | `SEMANTIC_SOURCE_REQUIRED` |
| `servant.tamamo.skill.sc-tamamo-2` | `SOURCE_EVIDENCE_REQUIRED` | `none` | `specific_handler` | `NONE` | `NONE` | `NONE` | `NONE` | `SEMANTIC_SOURCE_REQUIRED` |
| `servant.tamamo.skill.sc-tamamo-3` | `SOURCE_EVIDENCE_REQUIRED` | `none` | `specific_handler` | `NONE` | `NONE` | `NONE` | `NONE` | `SEMANTIC_SOURCE_REQUIRED` |
| `servant.teach.skill.sc-teach-1` | `SOURCE_EVIDENCE_REQUIRED` | `none` | `specific_handler` | `NONE` | `NONE` | `NONE` | `NONE` | `SEMANTIC_SOURCE_REQUIRED` |
| `servant.teach.skill.sc-teach-2` | `SOURCE_EVIDENCE_REQUIRED` | `none` | `specific_handler` | `NONE` | `NONE` | `NONE` | `NONE` | `SEMANTIC_SOURCE_REQUIRED` |
| `servant.teach.skill.sc-teach-3` | `SOURCE_EVIDENCE_REQUIRED` | `none` | `shared_handler` | `NONE` | `NONE` | `NONE` | `NONE` | `SEMANTIC_SOURCE_REQUIRED` |
| `servant.tesla.skill.sc-tesla-1` | `SOURCE_EVIDENCE_REQUIRED` | `none` | `specific_handler` | `NONE` | `NONE` | `NONE` | `NONE` | `SEMANTIC_SOURCE_REQUIRED` |
| `servant.tesla.skill.sc-tesla-2` | `SOURCE_EVIDENCE_REQUIRED` | `none` | `specific_handler` | `NONE` | `NONE` | `NONE` | `NONE` | `SEMANTIC_SOURCE_REQUIRED` |
| `servant.tesla.skill.sc-tesla-3` | `SOURCE_EVIDENCE_REQUIRED` | `none` | `shared_handler` | `NONE` | `NONE` | `NONE` | `NONE` | `SEMANTIC_SOURCE_REQUIRED` |
| `servant.tezcat.skill.sc-tezcat-1` | `SOURCE_EVIDENCE_REQUIRED` | `none` | `shared_handler` | `NONE` | `NONE` | `NONE` | `NONE` | `SEMANTIC_SOURCE_REQUIRED` |
| `servant.tezcat.skill.sc-tezcat-2` | `SOURCE_EVIDENCE_REQUIRED` | `none` | `specific_handler` | `NONE` | `NONE` | `NONE` | `NONE` | `SEMANTIC_SOURCE_REQUIRED` |
| `servant.tezcat.skill.sc-tezcat-3` | `SOURCE_EVIDENCE_REQUIRED` | `none` | `specific_handler` | `NONE` | `NONE` | `NONE` | `NONE` | `SEMANTIC_SOURCE_REQUIRED` |
| `servant.tomoe.skill.sc-tomoe-1` | `SOURCE_EVIDENCE_REQUIRED` | `dual` | `shared_handler` | `NONE` | `NONE` | `NONE` | `RESOURCE_NUMERIC_CORE_DIRECT_ACTION` | `SEMANTIC_SOURCE_REQUIRED` |
| `servant.tomoe.skill.sc-tomoe-2` | `SOURCE_EVIDENCE_REQUIRED` | `legacy` | `specific_handler` | `NONE` | `NONE` | `NONE` | `NONE` | `SEMANTIC_SOURCE_REQUIRED` |
| `servant.tomoe.skill.sc-tomoe-3` | `SOURCE_EVIDENCE_REQUIRED` | `legacy` | `shared_handler` | `NONE` | `NONE` | `NONE` | `NONE` | `SEMANTIC_SOURCE_REQUIRED` |
| `servant.tristan.skill.sc-tristan-1` | `SOURCE_EVIDENCE_REQUIRED` | `none` | `specific_handler` | `NONE` | `NONE` | `NONE` | `NONE` | `SEMANTIC_SOURCE_REQUIRED` |
| `servant.tristan.skill.sc-tristan-2` | `SOURCE_EVIDENCE_REQUIRED` | `none` | `specific_handler` | `NONE` | `NONE` | `NONE` | `NONE` | `SEMANTIC_SOURCE_REQUIRED` |
| `servant.tristan.skill.sc-tristan-3` | `SOURCE_EVIDENCE_REQUIRED` | `none` | `shared_handler` | `NONE` | `NONE` | `NONE` | `NONE` | `SEMANTIC_SOURCE_REQUIRED` |
| `servant.ushiwakamaru.skill.sc-ushiwakamaru-1` | `SOURCE_EVIDENCE_REQUIRED` | `none` | `specific_handler` | `NONE` | `NONE` | `NONE` | `NONE` | `SEMANTIC_SOURCE_REQUIRED` |
| `servant.ushiwakamaru.skill.sc-ushiwakamaru-2` | `SOURCE_EVIDENCE_REQUIRED` | `none` | `specific_handler` | `NONE` | `NONE` | `NONE` | `NONE` | `SEMANTIC_SOURCE_REQUIRED` |
| `servant.ushiwakamaru.skill.sc-ushiwakamaru-3` | `SOURCE_EVIDENCE_REQUIRED` | `none` | `shared_handler` | `NONE` | `NONE` | `NONE` | `NONE` | `SEMANTIC_SOURCE_REQUIRED` |
| `servant.valkyrie.skill.sc-valkyrie-1` | `SOURCE_EVIDENCE_REQUIRED` | `none` | `specific_handler` | `NONE` | `NONE` | `NONE` | `NONE` | `SEMANTIC_SOURCE_REQUIRED` |
| `servant.valkyrie.skill.sc-valkyrie-2` | `SOURCE_EVIDENCE_REQUIRED` | `none` | `specific_handler` | `NONE` | `NONE` | `NONE` | `NONE` | `SEMANTIC_SOURCE_REQUIRED` |
| `servant.valkyrie.skill.sc-valkyrie-3` | `SPECIAL_HANDLER_CANDIDATE` | `none` | `shared_handler` | `CONDITION`, `HIDDEN_INFORMATION`, `SPECIAL_SUBSYSTEM` | `GENERIC_CONDITION_EVALUATION`, `GENERIC_VISIBILITY`, `REVIEWED_SPECIAL_HANDLER` | `NONE` | `NONE` | `SPECIAL_EFFECT:retrigger_card_play_effects` |
| `servant.vlad.skill.sc-vlad-1` | `SOURCE_EVIDENCE_REQUIRED` | `none` | `specific_handler` | `NONE` | `NONE` | `NONE` | `NONE` | `SEMANTIC_SOURCE_REQUIRED` |
| `servant.vlad.skill.sc-vlad-2` | `SOURCE_EVIDENCE_REQUIRED` | `none` | `specific_handler` | `NONE` | `NONE` | `NONE` | `NONE` | `SEMANTIC_SOURCE_REQUIRED` |
| `servant.vlad.skill.sc-vlad-3` | `SOURCE_EVIDENCE_REQUIRED` | `none` | `shared_handler` | `NONE` | `NONE` | `NONE` | `NONE` | `SEMANTIC_SOURCE_REQUIRED` |
| `servant.voyager.skill.sc-voyager-1` | `SOURCE_EVIDENCE_REQUIRED` | `none` | `specific_handler` | `NONE` | `NONE` | `NONE` | `NONE` | `SEMANTIC_SOURCE_REQUIRED` |
| `servant.voyager.skill.sc-voyager-2` | `SOURCE_EVIDENCE_REQUIRED` | `none` | `specific_handler` | `NONE` | `NONE` | `NONE` | `NONE` | `SEMANTIC_SOURCE_REQUIRED` |
| `servant.voyager.skill.sc-voyager-3` | `SOURCE_EVIDENCE_REQUIRED` | `none` | `specific_handler` | `NONE` | `NONE` | `NONE` | `NONE` | `SEMANTIC_SOURCE_REQUIRED` |
| `servant.voyager.skill.sc-voyager-4` | `SOURCE_EVIDENCE_REQUIRED` | `none` | `shared_handler` | `NONE` | `NONE` | `NONE` | `NONE` | `SEMANTIC_SOURCE_REQUIRED` |
| `servant.xiangyu.skill.sc-xiangyu-1` | `SOURCE_EVIDENCE_REQUIRED` | `none` | `specific_handler` | `NONE` | `NONE` | `NONE` | `NONE` | `SEMANTIC_SOURCE_REQUIRED` |
| `servant.xiangyu.skill.sc-xiangyu-2` | `SOURCE_EVIDENCE_REQUIRED` | `none` | `specific_handler` | `NONE` | `NONE` | `NONE` | `NONE` | `SEMANTIC_SOURCE_REQUIRED` |
| `servant.xiangyu.skill.sc-xiangyu-3` | `SOURCE_EVIDENCE_REQUIRED` | `none` | `specific_handler` | `NONE` | `NONE` | `NONE` | `NONE` | `SEMANTIC_SOURCE_REQUIRED` |
| `master.tiamat.card.life-sea` | `SOURCE_EVIDENCE_REQUIRED` | `none` | `none` | `NONE` | `NONE` | `NONE` | `NONE` | `SEMANTIC_SOURCE_REQUIRED`, `SOURCE_EVIDENCE_REQUIRED` |
