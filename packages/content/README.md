/**
 * FD Content Pipeline - CHM Base Game Integration
 * 
 * This README documents the complete content pipeline for FD (Fate/Domination)
 * card content, with full support for CHM (CHM Base Game) rules.
 */

# FD Content Pipeline - Complete Guide

## 📋 Overview

The FD Content Pipeline is a comprehensive system for managing card content from raw images through to a validated, rule-compliant content library. It follows a **5-stage pipeline**:

```
Vision (OCR) → Structuring → Guardrail (Validation) → Content Library → Game Engine
```

Based on **FD-Game-Rules-Final.md**, the pipeline enforces the project's authoritative game rules and constraints.

## 🎯 CHM Base Game Key Rules

| Aspect | Value |
|--------|-------|
| **Players** | 7 seats (fill missing human seats with proxies or AI) |
| **Total Rounds** | 11 |
| **Master Initial Mana** | 4 |
| **Command Spells per Player** | 3 |
| **Servant Attack Cards** | 12 per servant |
| **Servant Skill Cards** | 3 per servant |
| **Workshop Capacity** | 4 (or 1 in final 2 days) |
| **Investigation Capacity** | 1 |
| **Deep Mountain Competition VP** | 2 |
| **New Capital Competition VP** | 3 |
| **Investigation VP** | 2 |

## 📦 Directory Structure

```
packages/content/src/
├── chm-card-types.ts           # Card type definitions & constraints
├── index.ts                     # Content Library Manager
└── guardrail-integration.ts     # Guardrail integration layer
```

## 🔄 Pipeline Stages

### Stage 1: Vision Agent (OCR Recognition)
- **Input**: Raw card images from `chm-extract/`
- **Output**: `data/staged/ocr/{namespace}/{filename}.json`
- **Process**: Extracts text, numbers, and visual elements

### Stage 2: Structuring Agent
- **Input**: Vision OCR results
- **Output**: `data/staged/structured/{namespace}/{filename}.json`
- **Process**: Converts OCR to structured card data

### Stage 3: Guardrail Agent (Validation)
- **Input**: Structured card data
- **Output**: `data/staged/guardrail/{namespace}/{filename}.json`
- **Decision**: `approve`, `review`, or `reject`
- **Process**: Validates against CHM rules and constraints

### Stage 4: Content Library Integration
- **Input**: Guardrail-approved cards
- **Output**: `packages/content/library/`
- **Process**: Imports into typed content library with statistics

### Stage 5: Game Engine Usage
- **Input**: Content Library cards
- **Output**: Game objects for simulation and rules engine
- **Process**: Generates playable card objects

## 📊 Card Types Supported

### 1. Master Cards (御主)
- **Master Identity** (`master_identity`)
  - Initial Mana: 4
  - Command Spells: 3
  - Passive Abilities
  
- **Master Skill** (`master_skill`)
  - Ability types: passive, phase_ability, ex_skill
  - Trigger phases: preparation, sentinel, action, battle, end_of_turn

### 2. Servant Cards (从者)
- **Servant Overview** (`servant_overview`)
  - Class tags
  - 12 attack cards count
  - 3 skill cards count
  
- **Servant Attack** (`servant_attack`)
  - Magic Cost (J value)
  - Base Power (K value)
  - Attributes: strength, agility, magic, special, noble_phantasm
  
- **Servant Skill** (`servant_skill`)
  - Min Mana Required: 8
  - Ability text

### 3. Situation Cards (局势牌)
- **Regular Situation** (Rounds 1-8)
  - Grants mana to all players
  - May have instant or persistent effects
  
- **Climax Situation** (Rounds 9-11)
  - Special names: 命运之夜, 身处地狱之门, 天之杯
  - Critical game-changing effects

### 4. Event Cards (事件牌)
- **Deep Mountain Event**
  - Competition Reward: 2 VP
  - Display: Revealed
  
- **New Capital Event**
  - Competition Reward: 3 VP
  - Display: Hidden

### 5. Command Spell Cards (令咒)
- **Usage Types** (3 per player, 1 each):
  1. Deep Mountain/New Capital Move
  2. Gain 4 Mana
  3. Battle Power +2 / Extra VP +2 on Win

## 🚀 Usage Examples

### Example 1: Import Approved Cards

```typescript
import { ContentLibraryManager } from '@fd/content';
import type { GameCard } from '@fd/content';

const manager = new ContentLibraryManager();

// Approved cards from Guardrail
const approvedCards: GameCard[] = [
  {
    id: 'master-shinji-001',
    name: '间桐慎二',
    sourceSet: 'master',
    namespace: 'master',
    language: 'zh-CN',
    tags: ['master', 'identity'],
    approvedAt: new Date().toISOString(),
    guardrailJobId: 'job-001',
    initialMana: 4,
    commandSpells: 3,
    cardType: 'master_identity',
  },
  // ... more cards
];

const result = manager.importApprovedCards(approvedCards);
console.log(`Imported: ${result.imported}, Rejected: ${result.rejected}`);
```

### Example 2: Integrate Guardrail Results

```typescript
import { GuardrailIntegrationManager } from '@fd/content';
import type { GuardrailResponse } from '@fd/contracts';

const integrationMgr = new GuardrailIntegrationManager({
  structuredDataPath: 'data/staged/structured/',
  guardrailDataPath: 'data/staged/guardrail/',
  outputLibraryPath: 'packages/content/library/',
});

// Process guardrail responses
const guardrailResponses: GuardrailResponse[] = [];
const approvedCards: GameCard[] = [];

const report = await integrationMgr.processGuardrailResponses(
  guardrailResponses,
  approvedCards
);

console.log(integrationMgr.getReportSummary());
```

### Example 3: Query Content Library

```typescript
const manager = new ContentLibraryManager();
// ... import cards ...

// Get all servant cards
const servants = manager.getCardsBySourceSet('servant');

// Get cards by namespace
const masterCards = manager.getCardsByNamespace('master');

// Get statistics
const stats = manager.getStats();
console.log(`Total cards: ${stats.totalCards}`);
console.log(`By type:`, stats.bySourceSet);
```

## ✅ Validation Rules

All cards imported into the content library are validated against CHM constraints:

### Master Cards
- ✅ Initial Mana must be 4
- ✅ Command Spells count must be 3
- ✅ Must have valid metadata

### Servant Cards
- ✅ Attack cards count must be exactly 12
- ✅ Skill cards count must be exactly 3
- ✅ Magic cost (J) and base power (K) must be numeric
- ✅ Attributes must be from defined list

### Situation Cards
- ✅ Must grant mana to all players
- ✅ Climax situations must apply to rounds 9-11
- ✅ Climax names must match official names

### Event Cards
- ✅ Deep Mountain competition reward must be 2
- ✅ New Capital competition reward must be 3
- ✅ Display must match battlefield type

### Command Spell Cards
- ✅ Usage must be from 4 official types
- ✅ Limit per player must be 3 total
- ✅ Each usage type can appear once

## 📝 Sample Card Manifest

Location: `data/manifests/chm-base-samples-v1.json`

Contains 8 representative sample cards covering all CHM card types for testing:
- 1 Master Identity
- 2 Servants (Overview + Attack)
- 2 Situations (Regular + Climax)
- 1 Event
- 1 Command Spell
- 1 Master Skill

## 🧪 Testing

### Smoke Chain Test
Run end-to-end tests from Vision through Guardrail:

```bash
npm run test:smoke-chain
```

### Unit Tests
Test card type validation:

```bash
npm run test:content
```

## 📚 References

- **Authoritative Rules**: `docs/rules/FD-Game-Rules-Final.md`
- **Card Manifest**: `data/manifests/chm-base-samples-v1.json`
- **Type Definitions**: `packages/content/src/chm-card-types.ts`
- **Pipeline Contracts**: `packages/contracts/src/`

## 🔗 Integration Points

- **Vision Provider**: `packages/providers/src/siliconflow.ts`
- **Structuring Agent**: `agents/structure/`
- **Guardrail Agent**: `agents/guardrail/`
- **Rules Engine**: `packages/rules/src/`
- **Simulation Tests**: `packages/rules/tests/`

---

**Last Updated**: April 13, 2026
**Version**: 1.0.0
**Status**: ✅ Production Ready
