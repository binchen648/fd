import { existsSync, readFileSync, readdirSync, writeFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { pathToFileURL } from 'node:url';
import * as rules from '../../packages/rules/src/index';

const ROOT = resolve(import.meta.dirname, '../..');
const REFERENCE_ROOT = 'E:/Codex/FD/fengling20011118-dotcom_fate-domination/reference';
const REFERENCE_CARDS = resolve(REFERENCE_ROOT, 'src/content/authoring/cards.json');
const REFERENCE_LEGACY = resolve(REFERENCE_ROOT, 'src/content/generated/legacy-content.json');
const REFERENCE_OVERRIDES = resolve(REFERENCE_ROOT, 'src/content/confirmed-skill-overrides.ts');

export const M50_01_READY_IDS = [
  'master.akasha.skill.s1','master.amakusa.skill.s1a','master.amakusa.skill.s2','master.araya.skill.s1a','master.arcueid.skill.s1','master.arcueid.skill.s1a','master.kuzuki.skill.s2','master.sion.skill.s13','master.twice.skill.s1',
  'servant.albion.skill.sc-albion-1','servant.arjuna.skill.sc-arjuna-1','servant.caligula.skill.sc-caligula-1','servant.chloe.skill.sc-chloe-1','servant.clytie.skill.sc-clytie-3','servant.darius.skill.sc-darius-3','servant.emiya.skill.sc-emiya-np','servant.iskandar.skill.sc-iskandar-2','servant.kagekiyo.skill.sc-kagekiyo-2','servant.kama.skill.sc-kama-1','servant.kiritsugu.skill.sc-kiritsugu-2','servant.kiritsugu.skill.sc-kiritsugu-3','servant.lionking.skill.sc-lionking-3','servant.medusa.skill.sc-medusa-np','servant.mephisto.skill.sc-mephisto-3','servant.merlin.skill.sc-merlin-3','servant.napoleon.skill.sc-napoleon-1','servant.napoleon.skill.sc-napoleon-2','servant.nero.skill.sc-nero-2','servant.parvati.skill.sc-parvati-3','servant.roberts.skill.sc-roberts-1','servant.roberts.skill.sc-roberts-2',
] as const;


export const M50_01_GROUNDED_CANDIDATE_IDS = [
  'master.arcueid.skill.ascension','master.caules-yggdmillennia.skill.s1a','master.caules-yggdmillennia.skill.s2','master.chaos.skill.s12','master.chaos.skill.s13','master.ciel.skill.ascension','master.iliya.skill.ascension','master.kirei.skill.ascension','master.kirei.skill.s2','master.kiritsugu.skill.ascension','master.kohaku.skill.s1a','master.kuzuki.skill.ascension','master.shiki-ryougi.skill.s3','master.sion.skill.s11','master.sion.skill.s16','master.sion.skill.s6','master.tiamat.skill.ascension','master.waver.skill.s3',
  'servant.arthur.skill.sc-arthur-1','servant.boudica.skill.sc-boudica-1','servant.boudica.skill.sc-boudica-2','servant.chiron.skill.sc-chiron-2','servant.constantine.skill.sc-constantine-2','servant.darius.skill.sc-darius-4','servant.donquixote.skill.sc-donquixote-1','servant.frank.skill.sc-frank-1','servant.frank.skill.sc-frank-3','servant.gareth.skill.sc-gareth-1','servant.hassan.skill.sc-hassan-2','servant.hassanser.skill.sc-hassanser-2','servant.illya.skill.sc-illya-2','servant.jeanne.skill.sc-jeanne-2','servant.kintoki.skill.sc-kintoki-3','servant.medea.skill.sc-medea-1','servant.medea.skill.sc-medea-np','servant.muramasa.skill.sc-muramasa-1','servant.robin.skill.sc-robin-2','servant.scathach.skill.sc-scathach-2','servant.semiramis.skill.sc-semiramis-3','servant.sigurd.skill.sc-sigurd-3','servant.tesla.skill.sc-tesla-3',
] as const;

// Frozen macro-batch roster. This is intentionally checked in so a fresh
// reviewer checkout never depends on local .fd-* probe/scratch files.
export const M50_01_SELECTED_IDS = [
  'servant.muramasa.skill.sc-muramasa-1','servant.sigurd.skill.sc-sigurd-3','servant.darius.skill.sc-darius-3','servant.medea.skill.sc-medea-1','master.sion.skill.s6',
  'servant.leonidas.skill.sc-leonidas-2','master.kirei.skill.s2','master.kohaku.skill.s1a','servant.darius.skill.sc-darius-4','servant.lionking.skill.sc-lionking-3',
  'servant.illya.skill.sc-illya-2','servant.tesla.skill.sc-tesla-3','master.caules-yggdmillennia.skill.s1a','servant.shakespeare.skill.sc-shakespeare-3','servant.robin.skill.sc-robin-2',
  'servant.boudica.skill.sc-boudica-2','master.kirei.skill.ascension','master.sion.skill.s11','master.araya.skill.s1a','master.sion.skill.s16',
  'servant.emiya.skill.sc-emiya-np','servant.kiritsugu.skill.sc-kiritsugu-3','servant.chloe.skill.sc-chloe-1','servant.roberts.skill.sc-roberts-2','servant.boudica.skill.sc-boudica-1',
  'servant.kama.skill.sc-kama-1','servant.frank.skill.sc-frank-1','servant.kagekiyo.skill.sc-kagekiyo-2','master.kiritsugu.skill.ascension','master.chaos.skill.s13',
  'servant.napoleon.skill.sc-napoleon-2','master.chaos.skill.s12','servant.albion.skill.sc-albion-1','servant.nero.skill.sc-nero-2','servant.chiron.skill.sc-chiron-2',
  'master.caules-yggdmillennia.skill.s2','servant.caligula.skill.sc-caligula-1','master.waver.skill.s3','servant.arthur.skill.sc-arthur-1','master.sion.skill.s13',
  'servant.astraea.skill.sc-astraea-1','servant.hassanser.skill.sc-hassanser-2','servant.merlin.skill.sc-merlin-3','servant.hassan.skill.sc-hassan-2','servant.valkyrie.skill.sc-valkyrie-3',
  'servant.iskandar.skill.sc-iskandar-2','servant.frank.skill.sc-frank-3','servant.donquixote.skill.sc-donquixote-1','servant.constantine.skill.sc-constantine-2','servant.medusa.skill.sc-medusa-np',
] as const;

type AnyRecord = Record<string, any>;
const reference = JSON.parse(readFileSync(REFERENCE_CARDS, 'utf8')) as AnyRecord;
const legacy = JSON.parse(readFileSync(REFERENCE_LEGACY, 'utf8')) as AnyRecord;
const inventory = JSON.parse(readFileSync(resolve(ROOT, 'data/phase3/full-roster-ability-inventory.json'), 'utf8')) as AnyRecord;
const inventoryById = new Map([...inventory.staticSkills, ...inventory.dynamicSkills].map((entry: AnyRecord) => [entry.canonicalAbilityId, entry]));
const referenceById = new Map((reference.skillCards ?? []).map((card: AnyRecord) => [card.id, card]));

const triggerMap: Record<string, string> = {
  'card.played': 'on_card_played',
  'combat.resolved': 'after_battle_result_determined',
  'combat.ending': 'after_battle_ended',
  'game.started': 'game_start',
  'player.entered-location': 'after_controller_enters_location',
  'round.started': 'm50_round_started',
  'round.ended': 'round_end',
  'servant.true-name-revealed': 'm50_servant_true_name_revealed',
  'skill.used': 'm50_skill_used',
  'card.exiled': 'm50_card_exiled',
};

function ownerName(ownerType: string, ownerId: string): string {
  const list = ownerType === 'master' ? legacy.masters ?? [] : legacy.servants ?? [];
  const exact = list.find((entry: AnyRecord) => entry.id === ownerId);
  return String(exact?.name ?? ownerId);
}

function ownerClass(ownerType: string, ownerId: string): string {
  if (ownerType === 'master') return 'Master';
  const exact = (legacy.servants ?? []).find((entry: AnyRecord) => entry.id === ownerId);
  return String(exact?.class ?? 'Servant');
}

function currentZone(zone: unknown): unknown {
  const map: Record<string, string> = {
    'master-skills': 'skill', 'servant-skills': 'skill', attack: 'attack_area', removed: 'removed_from_game', board: 'field',
  };
  return typeof zone === 'string' ? (map[zone] ?? zone) : zone;
}

function transformDeep(value: unknown): unknown {
  if (Array.isArray(value)) return value.map(transformDeep);
  if (!value || typeof value !== 'object') return value;
  const src = value as AnyRecord;
  const out: AnyRecord = {};
  for (const [key, raw] of Object.entries(src)) {
    if (key === 'zone' || key === 'destination' || key === 'fromZone') out[key] = currentZone(raw);
    else if (key === 'zones' || key === 'sourceZones') out[key] = Array.isArray(raw) ? raw.map(currentZone) : raw;
    else if (key === 'phase' && raw === 'outpost') out[key] = 'advance';
    else out[key] = transformDeep(raw);
  }
  return out;
}

function normalizeStructuredEffect(value: unknown, parentType = ''): unknown {
  if (Array.isArray(value)) return value.map((entry) => normalizeStructuredEffect(entry, parentType));
  if (!value || typeof value !== 'object') return value;
  const effect = structuredClone(value as AnyRecord);
  for (const key of ['effects', 'then', 'else']) {
    if (Array.isArray(effect[key])) effect[key] = effect[key].map((entry: unknown) => normalizeStructuredEffect(entry, String(effect.type ?? '')));
  }
  if (Array.isArray(effect.options)) effect.options = effect.options.map((option: AnyRecord) => normalizeStructuredEffect(option, String(effect.type ?? '')));

  if (effect.type === 'card' && typeof effect.linkedSkillId === 'string' && effect.linkedSkillId) {
    return {
      type: 'create_card_instances', definitionId: effect.linkedSkillId, count: effect.count ?? 1,
      zone: effect.zone ?? 'hand', face: effect.face ?? 'up', active: effect.active === true,
      residual: effect.residual === true, temporary: effect.temporary === true,
      ...(effect.lifecycle && typeof effect.lifecycle === 'object' ? { lifecycle: effect.lifecycle } : {}),
    };
  }
  if (effect.type === 'move_player' && !effect.to && !effect.locationId && parentType === 'choose_locations') {
    effect.to = 'targetLocationId';
  }
  if (effect.type === 'move_player' && !effect.to && !effect.locationId && Array.isArray(effect.allowedLocationIds)) {
    return {
      type: 'choose_locations',
      allowedLocationIds: effect.allowedLocationIds,
      minCount: 1, maxCount: 1, payloadKey: 'targetLocationId',
      then: [{ type: 'move_player', target: effect.target ?? 'controller', to: 'targetLocationId', ...(effect.ignoreEngagement === true ? { ignoreEngagement: true } : {}) }],
    };
  }
  if (effect.type === 'discard_selected_cards') {
    const count = Number(effect.count ?? 1);
    const payloadKey = String(effect.payloadKey ?? 'selectedInstanceIds');
    const definitionIds = effect.definitionId ? [String(effect.definitionId)] : Array.isArray(effect.definitionIds) ? effect.definitionIds.map(String) : [];
    return {
      type: 'choose_cards', target: effect.target ?? 'controller', zone: effect.zone ?? 'hand',
      ...(definitionIds.length ? { definitionIds } : {}), minCount: count, maxCount: count, payloadKey,
      then: [{ type: 'move_selected_cards', payloadKey, count, destination: 'discard' }],
    };
  }
  if (effect.type === 'move_forward') {
    return {
      type: 'choose_locations', forwardOnly: true, minForwardSteps: 1, maxForwardSteps: effect.steps,
      minCount: 1, maxCount: 1, payloadKey: 'targetLocationId',
      then: [{ type: 'move_player', target: effect.target ?? 'controller', to: 'targetLocationId' }],
    };
  }
  if (effect.type === 'schedule_combat_power_bonus_from_selected_card' &&
      effect.scope === 'same_battlefield_opponent_attack' && typeof effect.payloadKey === 'string' && effect.payloadKey &&
      typeof effect.abilityId === 'string' && effect.abilityId && effect.triggerEventType === 'round.started' &&
      effect.triggerRoundOffset === 1 &&
      Object.keys(effect).every((key) => ['type', 'scope', 'payloadKey', 'abilityId', 'triggerEventType', 'triggerRoundOffset'].includes(key))) {
    return {
      type: 'choose_cards', target: { scope: 'same_battlefield_opponents' }, zone: 'attack_area', activeOnly: true, attackOnly: true,
      minCount: 1, maxCount: 1, payloadKey: effect.payloadKey,
      then: [{
        type: 'schedule_effect', abilityId: effect.abilityId, triggerEventType: effect.triggerEventType,
        triggerRoundOffset: effect.triggerRoundOffset, captureCardPowerFromPayloadKey: effect.payloadKey, payloadVariableKey: 'amount',
      }],
    };
  }
  if (effect.type === 'hide_true_name') effect.type = 'hide_servant_true_name';
  if (effect.type === 'discard_current_event_by_victory_points') {
    return {
      type: 'choose_events', sourceZone: 'current', locationId: 'controller_location', victoryPoints: effect.victoryPoints,
      minCount: 1, maxCount: 1, payloadKey: 'selectedEventIds',
      then: [{ type: 'move_selected_events', payloadKey: 'selectedEventIds', destination: 'discard' }],
    };
  }
  return effect;
}

function transformAbility(raw: AnyRecord): AnyRecord[] {
  const base = transformDeep(raw) as AnyRecord;
  base.effects = normalizeStructuredEffect(base.effects ?? []) as AnyRecord[];
  base.creates = normalizeStructuredEffect(base.creates ?? []) as AnyRecord[];
  // Locked Reference metadata -> current authoring equivalents. These are shape-only
  // normalizations: no rule text is inferred and no runtime behavior is widened.
  if (base.requiresActiveCard === true) {
    base.activation = { ...(base.activation ?? {}), requiresSourceState: 'active' };
  }
  delete base.requiresActiveCard;
  delete base.name;
  delete base.handlerId;
  const eventConditions = (base.conditions ?? []).filter((c: AnyRecord) => c?.type === 'event_type_is');
  const eventTypes = [...new Set(eventConditions.map((c: AnyRecord) => String(c.eventType ?? '')).filter(Boolean))];
  if (eventTypes.length > 1) throw new Error(`ability ${raw.id} has multiple event_type_is conditions: ${eventTypes.join(',')}`);
  base.conditions = (base.conditions ?? []).filter((c: AnyRecord) => c?.type !== 'event_type_is');
  const rawActivation: AnyRecord = { ...(base.activation ?? {}) };
  const phases = Array.isArray(rawActivation.phases) ? rawActivation.phases.map(String) : rawActivation.phase ? [String(rawActivation.phase)] : [];
  delete rawActivation.phases;
  const variants = phases.length > 1 ? phases : [phases[0] ?? ''];
  return variants.map((rawPhase, index) => {
    const a = structuredClone(base);
    const activation: AnyRecord = { ...rawActivation };
    if (rawPhase) activation.phase = rawPhase === 'outpost' ? 'advance' : rawPhase;
    if (a.kind === 'activated') a.kind = 'phase_action';
    if (a.kind === 'phase_action') {
      if (!activation.phase) throw new Error(`phase_action ${raw.id} lacks phase`);
      activation.opens = activation.phase === 'combat' ? 'controller_combat_action_window' : 'controller_action_window';
      if (variants.length > 1) a.id = `${raw.id}__${activation.phase}`;
    }
    if (eventTypes[0]) {
      const trigger = triggerMap[eventTypes[0]];
      if (!trigger) throw new Error(`unmapped event trigger ${eventTypes[0]} in ${raw.id}`);
      if (activation.trigger && activation.trigger !== trigger) throw new Error(`conflicting trigger in ${raw.id}`);
      activation.trigger = trigger;
    }
    if (a.kind === 'play_trigger') {
      a.kind = 'forced_trigger';
      activation.trigger ||= 'on_card_played';
    }
    a.activation = activation;
    a.markers = [...new Set([...(Array.isArray(a.markers) ? a.markers : []), 'm50_structured_v1'])];
    a.targets ??= [];

    const liftSelectedSameBattlefieldOpponent = (value: unknown): unknown => {
      if (Array.isArray(value)) return value.map(liftSelectedSameBattlefieldOpponent);
      if (!value || typeof value !== 'object') return value;
      const source = value as AnyRecord; const out: AnyRecord = {};
      for (const [key, child] of Object.entries(source)) out[key] = liftSelectedSameBattlefieldOpponent(child);
      if (out.type === 'defeat_player' && out.target && typeof out.target === 'object') {
        const target = out.target as AnyRecord;
        if (target.scope === 'selected_same_battlefield_opponent' && Object.keys(target).every((key) => ['scope', 'where'].includes(key))) {
          const targetId = 'selected_same_battlefield_opponent';
          const where = Array.isArray(target.where) ? target.where.map((entry: unknown) => transformDeep(entry)) : [];
          if (a.targets.some((entry: AnyRecord) => entry?.id === targetId)) throw new Error(`ability ${raw.id} duplicates ${targetId}`);
          a.targets.push({ id: targetId, type: 'player', count: { min: 1, max: 1 }, constraints: [
            { type: 'not_controller' }, { type: 'same_battlefield_as_controller' }, ...where,
          ] });
          out.target = targetId;
        }
      }
      return out;
    };
    a.effects = liftSelectedSameBattlefieldOpponent(a.effects) as AnyRecord[];

    const containsSelectedSameBattlefieldDefeat = (value: unknown): boolean => {
      if (Array.isArray(value)) return value.some(containsSelectedSameBattlefieldDefeat);
      if (!value || typeof value !== 'object') return false;
      const node = value as AnyRecord;
      if (node.type === 'defeat_player' && node.target && typeof node.target === 'object' &&
          Object.keys(node.target).length === 1 && node.target.scope === 'selected_same_battlefield_player') return true;
      return Object.values(node).some(containsSelectedSameBattlefieldDefeat);
    };
    const hasSelectedSameBattlefieldDefeat = containsSelectedSameBattlefieldDefeat(a.effects);
    if (hasSelectedSameBattlefieldDefeat) {
      a.targets = a.targets.map((target: AnyRecord) => {
        if (target?.type !== 'player' || target?.scope !== 'same_battlefield_players') return target;
        const copy = { ...target }; delete copy.scope;
        copy.constraints = [...(Array.isArray(copy.constraints) ? copy.constraints : []),
          { type: 'not_controller' }, { type: 'same_battlefield_as_controller' }];
        return copy;
      });
    }
    const sameBattlefieldPlayerTargets = hasSelectedSameBattlefieldDefeat ? a.targets.filter((target: AnyRecord) => target?.type === 'player' &&
      Array.isArray(target.constraints) && target.constraints.some((c: AnyRecord) => c?.type === 'not_controller') &&
      target.constraints.some((c: AnyRecord) => c?.type === 'same_battlefield_as_controller')) : [];
    const bindSelectedSameBattlefield = (value: unknown): unknown => {
      if (Array.isArray(value)) return value.map(bindSelectedSameBattlefield);
      if (!value || typeof value !== 'object') return value;
      const node = value as AnyRecord; const out: AnyRecord = {};
      for (const [key, child] of Object.entries(node)) out[key] = bindSelectedSameBattlefield(child);
      if (out.type === 'defeat_player' && out.target && typeof out.target === 'object' &&
          Object.keys(out.target).length === 1 && out.target.scope === 'selected_same_battlefield_player') {
        if (sameBattlefieldPlayerTargets.length !== 1 || typeof sameBattlefieldPlayerTargets[0]?.id !== 'string') {
          throw new Error(`ability ${raw.id} cannot bind selected_same_battlefield_player uniquely`);
        }
        out.target = sameBattlefieldPlayerTargets[0].id;
      }
      return out;
    };
    a.effects = bindSelectedSameBattlefield(a.effects) as AnyRecord[];
    a.cost = Array.isArray(a.cost) ? a.cost : a.cost ? [a.cost] : [];
    a.effects ??= [];
    a.ruleModifiers ??= [];
    a.creates ??= [];
    a.lifecycle ??= {};
    a.responseWindow ??= {};
    a.limit ??= {};
    a.visibility ??= {};
    a.execution = { mode: 'automatic', allowedOperations: [] };
    return a;
  });
}

export function convertReferenceCard(id: string): AnyRecord {
  const source = referenceById.get(id);
  const f1 = inventoryById.get(id);
  if (!source || !f1) throw new Error(`missing reference/F1 source for ${id}`);
  if (f1.semanticNormalization?.status !== 'SOURCE_GROUNDED' || f1.phase3?.classificationRoute !== 'READY_GENERIC_EXTENSION') {
    throw new Error(`${id} is not READY_GENERIC_EXTENSION + SOURCE_GROUNDED`);
  }
  const ownerType = String(source.ownerType);
  const ownerId = String(source.ownerId);
  return {
    id,
    aliases: [...new Set([`card.skill.${id}`, f1.reference?.legacySkillId].filter(Boolean))],
    ...(f1.reference?.legacySkillId ? { legacyId: f1.reference.legacySkillId } : {}),
    name: source.name,
    cardType: ownerType === 'master' ? 'master_skill' : 'servant_skill',
    owner: { type: ownerType, id: ownerId },
    printedText: source.printedText,
    cardFace: {
      cost: Number(source.cardFace?.cost ?? 0), basePower: Number(source.cardFace?.basePower ?? 0),
      attributes: [...(source.cardFace?.attributes ?? [])],
      ...(source.cardFace?.requirement && source.cardFace.requirement.type !== 'none' ? { requirements: transformDeep(source.cardFace.requirement) } : {}),
    },
    playTiming: { phase: 'action', window: 'controller_play_card_window' },
    playRequirements: [],
    abilities: (source.abilities ?? []).flatMap(transformAbility),
    phase3Evidence: {
      lockedReferenceCommit: 'b2f9fa15fba07c63530bbf4612b03b8b704755f9',
      inventoryStatus: f1.semanticNormalization?.status,
      referenceHandlerId: f1.reference?.handlerId,
      sourceLocators: (source.evidence ?? []).map((entry: AnyRecord) => entry.locator ?? entry.document).filter(Boolean),
      macroBatch: 'P3-F4-M50-01-50-SKILL-MACRO-MIGRATION-BATCH',
    },
  };
}

function legacyOwnerAndSkill(id: string): { owner: AnyRecord; skill: AnyRecord; ownerType: 'master' | 'servant' } {
  for (const [group, ownerType] of [['masters', 'master'], ['servants', 'servant']] as const) {
    for (const owner of legacy[group] ?? []) {
      const skill = (owner.skills ?? []).find((entry: AnyRecord) => entry.id === id);
      if (skill) return { owner, skill, ownerType };
    }
  }
  throw new Error(`missing legacy skill ${id}`);
}

function normalizeOverrideAbility(raw: AnyRecord): AnyRecord[] {
  const variants = transformAbility(raw);
  for (const ability of variants) {
    if (ability.execution?.mode !== 'automatic') throw new Error(`non-automatic override ability ${raw.id}`);
  }
  return variants;
}

export function convertConfirmedOverrideCard(id: string, override: AnyRecord): AnyRecord {
  const f1 = inventoryById.get(id);
  if (!f1) throw new Error(`missing F1 ${id}`);
  const { skill, ownerType } = legacyOwnerAndSkill(id);
  if (f1.reference?.handlerId !== 'core.structured-skill' || override?.handlerId !== 'core.structured-skill' || override?.supportLevel !== 'FULL') {
    throw new Error(`${id} is not exact FULL structured-skill override`);
  }
  if ((override.rules?.unmodeledClauses ?? []).length || (override.rules?.ambiguities ?? []).length) throw new Error(`${id} has unresolved override clauses`);
  const requirements: AnyRecord[] = [];
  if (Number.isFinite(Number(skill.requirement)) && Number(skill.requirement) > 0) requirements.push({ type: 'skill_zone_mana_at_least', value: Number(skill.requirement) });
  const ownerId = String(f1.ownerId);
  const attributes = Array.isArray(skill.attributes) ? [...skill.attributes] : [];
  const card: AnyRecord = {
    id,
    aliases: [...new Set([`card.skill.${id}`, f1.reference?.legacySkillId].filter(Boolean))],
    ...(f1.reference?.legacySkillId ? { legacyId: f1.reference.legacySkillId } : {}),
    name: skill.name,
    cardType: ownerType === 'master' ? 'master_skill' : 'servant_skill',
    owner: { type: ownerType, id: ownerId },
    printedText: skill.text,
    cardFace: { typeLabel: skill.typeLabel, cost: Number(skill.cost ?? 0), basePower: Number(skill.basePower ?? 0), attributes },
    playTiming: { phase: 'action', window: 'controller_play_card_window' },
    playRequirements: requirements,
    abilities: (override.rules?.abilities ?? []).flatMap(normalizeOverrideAbility),
    phase3Evidence: {
      lockedReferenceCommit: 'b2f9fa15fba07c63530bbf4612b03b8b704755f9',
      sourceGrounding: 'locked-confirmed-skill-overrides',
      referenceHandlerId: f1.reference?.handlerId,
      sourceRefs: f1.sources ?? [],
      macroBatch: 'P3-F4-M50-01-50-SKILL-MACRO-MIGRATION-BATCH',
    },
  };
  if (override.initiallyOwned === false) card.initialPlacement = 'outside_game';
  return card;
}

export function archiveFor(card: AnyRecord): AnyRecord {
  const ownerType = card.owner.type;
  const ownerId = card.owner.id;
  return {
    schemaVersion: 'fd-card-authoring-v1',
    archiveType: ownerType === 'master' ? 'master_skill_card_archive' : 'servant_skill_card_archive',
    id: ownerId,
    name: ownerName(ownerType, ownerId),
    class: ownerClass(ownerType, ownerId),
    sourcePolicy: { referenceMetadataCommit: 'b2f9fa15fba07c63530bbf4612b03b8b704755f9', note: 'P3 F4 M50-01 macro-batch mechanical materialization from locked source-grounded evidence.' },
    cards: [card],
  };
}

async function probeGrounded(): Promise<AnyRecord[]> {
  const mod = await import(pathToFileURL(REFERENCE_OVERRIDES).href);
  const overrides = mod.confirmedSkillOverrides as Record<string, AnyRecord>;
  const out: AnyRecord[] = [];
  for (const id of M50_01_GROUNDED_CANDIDATE_IDS) {
    try {
      const card = convertConfirmedOverrideCard(id, overrides[id]);
      const archive = archiveFor(card);
      const loaded = rules.loadAuthoringJson(archive);
      out.push({ id, ok: loaded.report.length === 0, report: loaded.report, card, archive });
    } catch (error) {
      out.push({ id, ok: false, error: String((error as Error)?.message ?? error) });
    }
  }
  return out;
}

async function main(): Promise<void> {
  if (process.argv.includes('--dump-selected-vocab')) {
    const selectedIds = new Set<string>(M50_01_SELECTED_IDS);
    const mod = await import(pathToFileURL(REFERENCE_OVERRIDES).href);
    const overrides = mod.confirmedSkillOverrides as Record<string, AnyRecord>;
    const ready = new Set<string>(M50_01_READY_IDS as readonly string[]);
    const wantedTypes = new Set(['choose_cards','choose_one','move_selected_cards','choose_locations','choose_events','metric','constant','metric_compare','payload_number','payload_count','payload_number_plus','target_count_at_least']);
    const rows: AnyRecord[] = [];
    const walk = (value: unknown, cardId: string, path = ''): void => {
      if (Array.isArray(value)) { value.forEach((entry, index) => walk(entry, cardId, `${path}[${index}]`)); return; }
      if (!value || typeof value !== 'object') return;
      const entry = value as AnyRecord;
      if (wantedTypes.has(String(entry.type ?? ''))) rows.push({ cardId, path, node: entry });
      for (const [key, child] of Object.entries(entry)) walk(child, cardId, path ? `${path}.${key}` : key);
    };
    for (const id of selectedIds) {
      const card = ready.has(id) ? convertReferenceCard(id) : convertConfirmedOverrideCard(id, overrides[id]);
      walk(card, id);
    }
    process.stdout.write(JSON.stringify(rows, null, 2));
    return;
  }
  if (process.argv.includes('--probe-ready')) {
    const rows = M50_01_READY_IDS.map((id) => {
      try { const card = convertReferenceCard(id); const report = rules.loadAuthoringJson(archiveFor(card)).report; return { id, ok: report.length === 0, report }; }
      catch (error) { return { id, ok: false, error: String((error as Error)?.message ?? error) }; }
    });
    process.stdout.write(JSON.stringify({ pass: rows.filter((x) => x.ok).map((x) => x.id), fail: rows.filter((x) => !x.ok).map(({ id, report, error }) => ({ id, report, error })) }, null, 2));
    return;
  }
  if (process.argv.includes('--probe-grounded')) {
    const grounded = await probeGrounded();
    process.stdout.write(JSON.stringify({ pass: grounded.filter((x) => x.ok).map((x) => x.id), fail: grounded.filter((x) => !x.ok).map(({ id, report, error }) => ({ id, report, error })) }, null, 2));
    return;
  }

  const selectedIds = [...M50_01_SELECTED_IDS];
  if (selectedIds.length !== 50 || new Set(selectedIds).size !== 50) {
    throw new Error(`frozen macro roster must contain exactly 50 unique ids; got ${selectedIds.length}/${new Set(selectedIds).size}`);
  }
  const mod = await import(pathToFileURL(REFERENCE_OVERRIDES).href);
  const overrides = mod.confirmedSkillOverrides as Record<string, AnyRecord>;
  const ready = new Set<string>(M50_01_READY_IDS as readonly string[]);
  const selected = selectedIds.map((id) => {
    try {
      const card = ready.has(id) ? convertReferenceCard(id) : convertConfirmedOverrideCard(id, overrides[id]);
      const archive = archiveFor(card);
      const report = rules.loadAuthoringJson(archive).report;
      return { id, ok: report.length === 0, report, card, archive };
    } catch (error) {
      return { id, ok: false, report: [] as AnyRecord[], error: String((error as Error)?.message ?? error) };
    }
  });
  if (process.argv.includes('--probe-selected')) {
    process.stdout.write(JSON.stringify({ pass: selected.filter((x) => x.ok).map((x) => x.id), fail: selected.filter((x) => !x.ok).map(({ id, report, error }) => ({ id, report, error })) }, null, 2));
    return;
  }
  const failed = selected.filter((x) => !x.ok);
  if (failed.length) throw new Error(`frozen macro roster has ${failed.length} load blocker(s): ${failed.map((entry) => entry.id).join(', ')}`);
  const cards = selected.map((entry) => entry.card!);
  const archives = selected.map((entry) => entry.archive!);
  if (process.argv.includes('--write-authoring')) {
    const grouped = new Map<string, AnyRecord[]>();
    for (const card of cards) {
      const ownerType = String(card.owner?.type ?? ''); const ownerId = String(card.owner?.id ?? '');
      if (!['master', 'servant'].includes(ownerType) || !ownerId) throw new Error(`invalid materialized owner for ${card.id}`);
      const key = `${ownerType}:${ownerId}`; const list = grouped.get(key) ?? []; list.push(card); grouped.set(key, list);
    }
    const written: string[] = [];
    for (const [key, ownerCards] of grouped) {
      const [ownerType, ownerId] = key.split(':');
      const family = ownerType === 'master' ? 'masters' : 'servants';
      const target = resolve(ROOT, `data/authoring/${family}/${ownerId}.p3-m50-01.json`);
      if (existsSync(target)) throw new Error(`refusing to overwrite existing macro material ${target}`);
      const archive = archiveFor(ownerCards[0]!); archive.cards = ownerCards;
      const report = rules.loadAuthoringJson(archive).report;
      if (report.length) throw new Error(`grouped macro archive ${ownerId} has ${report.length} load blocker(s)`);
      writeFileSync(target, `${JSON.stringify(archive, null, 2)}\n`, 'utf8');
      written.push(target.slice(ROOT.length + 1).replaceAll('\\', '/'));
    }
    process.stdout.write(JSON.stringify({ task: 'P3-F4-M50-01-50-SKILL-MACRO-MIGRATION-BATCH', count: cards.length, selectedIds, written }, null, 2));
    return;
  }
  process.stdout.write(JSON.stringify({ task: 'P3-F4-M50-01-50-SKILL-MACRO-MIGRATION-BATCH', count: cards.length, selectedIds, cards, archives }, null, 2));
}
if (process.argv[1] && resolve(process.argv[1]) === resolve(import.meta.filename)) void main();
