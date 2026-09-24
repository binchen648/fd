import { existsSync, readFileSync, readdirSync, writeFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { pathToFileURL } from 'node:url';
import * as rules from '../../packages/rules/src/index';

const ROOT = resolve(import.meta.dirname, '../..');
const REFERENCE_ROOT = 'E:/Codex/FD/fengling20011118-dotcom_fate-domination/reference';
const REFERENCE_CARDS = resolve(REFERENCE_ROOT, 'src/content/authoring/cards.json');
const REFERENCE_LEGACY = resolve(REFERENCE_ROOT, 'src/content/generated/legacy-content.json');
const REFERENCE_OVERRIDES = resolve(REFERENCE_ROOT, 'src/content/confirmed-skill-overrides.ts');

export const M50_02_READY_IDS = [
  "master.akasha.skill.s1",
  "master.amakusa.skill.s1a",
  "master.amakusa.skill.s2",
  "master.arcueid.skill.s1",
  "master.arcueid.skill.s1a",
  "master.kuzuki.skill.s2",
  "master.twice.skill.s1",
  "servant.arjuna.skill.sc-arjuna-1",
  "servant.clytie.skill.sc-clytie-3",
  "servant.kiritsugu.skill.sc-kiritsugu-2",
  "servant.mephisto.skill.sc-mephisto-3",
  "servant.napoleon.skill.sc-napoleon-1",
  "servant.parvati.skill.sc-parvati-3",
  "servant.roberts.skill.sc-roberts-1"
] as const;


export const M50_02_GROUNDED_CANDIDATE_IDS = [
  "master.arcueid.skill.ascension",
  "master.ciel.skill.ascension",
  "master.iliya.skill.ascension",
  "master.kuzuki.skill.ascension",
  "master.tiamat.skill.ascension",
  "servant.andersen.skill.sc-andersen-2",
  "servant.diarmuid.skill.sc-diarmuid-1",
  "servant.gareth.skill.sc-gareth-1",
  "servant.gorgon.skill.sc-gorgon-3",
  "servant.jeanne.skill.sc-jeanne-2",
  "servant.maxwell.skill.sc-maxwell-2",
  "servant.medea.skill.sc-medea-np",
  "servant.mephisto.skill.sc-mephisto-2",
  "servant.scathach.skill.sc-scathach-2",
  "servant.semiramis.skill.sc-semiramis-3",
  "master.goredolf.skill.s1a",
  "master.goredolf.skill.ascension",
  "servant.lubu.skill.sc-lubu-2",
  "servant.brynhildr.skill.sc-brynhildr-3",
  "master.shiki-ryougi.skill.ascension",
  "master.leonardo.skill.s1a",
  "master.ophelia.skill.s1a",
  "master.peperoncino.skill.s1",
  "master.zouken.skill.s1",
  "master.sieg.skill.ascension",
  "servant.cu-alter.skill.sc-cu-alter-1",
  "master.shirou-emiya.skill.s3",
  "servant.donquixote.skill.sc-donquixote-2",
  "servant.kriemhild.skill.sc-kriemhild-2",
  "servant.sigurd.skill.sc-sigurd-2",
  "servant.kagekiyo.skill.sc-kagekiyo-3",
  "servant.lance.skill.sc-lance-2",
  "master.fiore.skill.s1",
  "master.shirou-emiya.skill.s1",
  "master.chaos.skill.s10",
  "master.ciel.skill.s1"
] as const;

// Frozen macro-batch roster. This is intentionally checked in so a fresh
// reviewer checkout never depends on local .fd-* probe/scratch files.
// Truly blocked selected identities are mechanically replaced only after their
// required definitions prove source-blocked; non-tail F4 macro batches must remain
// exactly 50 identities. Mash S4 replaces Akasha S1; Sherlock S4 replaces Arcueid
// S1; Sherlock S5 replaces Tiamat Ascension at the final exact-50 checkpoint.
export const M50_02_SELECTED_IDS = [
  "servant.mash.skill.sc-mash-4",
  "master.amakusa.skill.s1a",
  "master.amakusa.skill.s2",
  "master.arcueid.skill.ascension",
  "servant.sherlock.skill.sc-sherlock-4",
  "master.arcueid.skill.s1a",
  "master.ciel.skill.ascension",
  "master.iliya.skill.ascension",
  "master.kuzuki.skill.ascension",
  "master.kuzuki.skill.s2",
  "servant.sherlock.skill.sc-sherlock-5",
  "master.twice.skill.s1",
  "servant.andersen.skill.sc-andersen-2",
  "servant.arjuna.skill.sc-arjuna-1",
  "servant.clytie.skill.sc-clytie-3",
  "servant.diarmuid.skill.sc-diarmuid-1",
  "servant.gareth.skill.sc-gareth-1",
  "servant.gorgon.skill.sc-gorgon-3",
  "servant.jeanne.skill.sc-jeanne-2",
  "servant.kiritsugu.skill.sc-kiritsugu-2",
  "servant.maxwell.skill.sc-maxwell-2",
  "servant.medea.skill.sc-medea-np",
  "servant.mephisto.skill.sc-mephisto-2",
  "servant.mephisto.skill.sc-mephisto-3",
  "servant.napoleon.skill.sc-napoleon-1",
  "servant.parvati.skill.sc-parvati-3",
  "servant.roberts.skill.sc-roberts-1",
  "servant.scathach.skill.sc-scathach-2",
  "servant.semiramis.skill.sc-semiramis-3",
  "master.goredolf.skill.s1a",
  "master.goredolf.skill.ascension",
  "servant.lubu.skill.sc-lubu-2",
  "servant.brynhildr.skill.sc-brynhildr-3",
  "master.shiki-ryougi.skill.ascension",
  "master.leonardo.skill.s1a",
  "master.ophelia.skill.s1a",
  "master.peperoncino.skill.s1",
  "master.zouken.skill.s1",
  "master.sieg.skill.ascension",
  "servant.cu-alter.skill.sc-cu-alter-1",
  "master.shirou-emiya.skill.s3",
  "servant.donquixote.skill.sc-donquixote-2",
  "servant.kriemhild.skill.sc-kriemhild-2",
  "servant.sigurd.skill.sc-sigurd-2",
  "servant.kagekiyo.skill.sc-kagekiyo-3",
  "servant.lance.skill.sc-lance-2",
  "master.fiore.skill.s1",
  "master.shirou-emiya.skill.s1",
  "master.chaos.skill.s10",
  "master.ciel.skill.s1"
] as const;

type AnyRecord = Record<string, any>;
const reference = JSON.parse(readFileSync(REFERENCE_CARDS, 'utf8')) as AnyRecord;
const legacy = JSON.parse(readFileSync(REFERENCE_LEGACY, 'utf8')) as AnyRecord;
const inventory = JSON.parse(readFileSync(resolve(ROOT, 'data/phase3/full-roster-ability-inventory.json'), 'utf8')) as AnyRecord;
const inventoryById = new Map([...inventory.staticSkills, ...inventory.dynamicSkills].map((entry: AnyRecord) => [entry.canonicalAbilityId, entry]));
const referenceById = new Map((reference.skillCards ?? []).map((card: AnyRecord) => [card.id, card]));

function sourceGroundedExecutableDependency(definitionId: string): boolean {
  const dependency = inventoryById.get(definitionId);
  return dependency?.semanticNormalization?.status === 'SOURCE_GROUNDED' &&
    dependency?.phase3?.classificationRoute === 'READY_GENERIC_EXTENSION' &&
    referenceById.has(definitionId);
}

function assertSourceGroundedExecutableDependency(ownerId: string, definitionId: string, path: string): void {
  if (!sourceGroundedExecutableDependency(definitionId)) {
    throw new Error(`${ownerId} ${path} depends on source-blocked definition ${definitionId}`);
  }
}

function assertAbilityDefinitionDependencies(ownerId: string, abilities: AnyRecord[]): void {
  for (const ability of abilities) {
    for (const [index, created] of (Array.isArray(ability.creates) ? ability.creates : []).entries()) {
      if (typeof created?.linkedSkillId === 'string' && created.linkedSkillId) {
        assertSourceGroundedExecutableDependency(ownerId, created.linkedSkillId, `abilities.${String(ability.id ?? '')}.creates[${index}].linkedSkillId`);
      }
    }
    for (const [index, copy] of (Array.isArray(ability.copies) ? ability.copies : []).entries()) {
      const linkedSkillId = copy?.source?.linkedSkillId;
      if (typeof linkedSkillId === 'string' && linkedSkillId) {
        assertSourceGroundedExecutableDependency(ownerId, linkedSkillId, `abilities.${String(ability.id ?? '')}.copies[${index}].source.linkedSkillId`);
      }
    }
    for (const [index, effect] of (Array.isArray(ability.effects) ? ability.effects : []).entries()) {
      if (effect?.type === 'return_card_by_definition' && typeof effect.linkedSkillId === 'string' && effect.linkedSkillId) {
        assertSourceGroundedExecutableDependency(ownerId, effect.linkedSkillId, `abilities.${String(ability.id ?? '')}.effects[${index}].linkedSkillId`);
      }
    }
  }
}

const triggerMap: Record<string, string> = {
  'card.played': 'on_card_played',
  'combat.resolved': 'after_battle_result_determined',
  'combat.ending': 'after_battle_ended',
  'game.started': 'game_start',
  'player.entered-location': 'after_controller_enters_location',
  'player.mana.spent': 'm50_player_mana_spent',
  'round.started': 'm50_round_started',
  'skill.unlocked': 'm50_skill_unlocked',
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
  if (out.type === 'player_flag_equals_controller_location' && out.key === 'deploymentLocationId' && Object.keys(out).length === 2) {
    return { type: 'deployed_this_round_at_controller_location' };
  }
  if (out.type === 'true_name_hidden' && Object.keys(out).length === 1) {
    return { type: 'not', condition: { type: 'controller_servant_revealed' } };
  }
  if (out.type === 'event_face_is' && ['up', 'down'].includes(String(out.face)) &&
      Object.keys(out).every((key) => ['type', 'face'].includes(key))) {
    return { type: 'event_face_is', face: out.face === 'up' ? 'face_up' : 'face_down' };
  }
  if (out.type === 'any_of' && Object.keys(out).every((key) => ['type', 'conditions'].includes(key)) &&
      Array.isArray(out.conditions) && out.conditions.length > 0) {
    return { type: 'or', conditions: out.conditions };
  }
  if (out.type === 'implies' && Object.keys(out).every((key) => ['type', 'when', 'require'].includes(key)) &&
      Array.isArray(out.when) && out.when.length > 0 && Array.isArray(out.require) && out.require.length > 0) {
    return { type: 'or', conditions: [
      { type: 'not', condition: { type: 'and', conditions: out.when } },
      { type: 'and', conditions: out.require },
    ] };
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
  if (effect.type === 'choose_each_player_cards') {
    const candidateTarget = effect.candidateTarget && typeof effect.candidateTarget === 'object' && !Array.isArray(effect.candidateTarget)
      ? effect.candidateTarget as AnyRecord : {};
    const then = Array.isArray(effect.then) ? effect.then as AnyRecord[] : [];
    const close = then.length === 1 && then[0] && typeof then[0] === 'object' && !Array.isArray(then[0]) ? then[0] as AnyRecord : {};
    const exactOuterKeys = ['type','candidateTarget','zone','activeOnly','face','residual','minCandidateCount','minCount','maxCount','payloadKey','then'];
    const exactCloseKeys = ['type','scope','zone','activeOnly','nonResidualOnly','ownerScope','payloadKey'];
    if (Object.keys(effect).length === exactOuterKeys.length && Object.keys(effect).every((key) => exactOuterKeys.includes(key)) &&
        Object.keys(candidateTarget).length === 1 && candidateTarget.scope === 'same_battlefield_opponents' &&
        effect.zone === 'attack_area' && effect.activeOnly === true && effect.face === 'up' && effect.residual === false &&
        effect.minCandidateCount === 1 && effect.minCount === 1 && effect.maxCount === 1 && effect.payloadKey === 'targetInstanceId' &&
        Object.keys(close).length === exactCloseKeys.length && Object.keys(close).every((key) => exactCloseKeys.includes(key)) &&
        close.type === 'close_selected_card' && close.scope === 'same_battlefield' && close.zone === 'attack_area' &&
        close.activeOnly === true && close.nonResidualOnly === true && close.ownerScope === 'same_battlefield_opponents' &&
        close.payloadKey === 'targetInstanceId') {
      return { type: 'opponent_close_one_non_residual' };
    }
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
  if (effect.type === 'choose_players') {
    const mapped = structuredClone(effect);
    mapped.payloadKey = String(effect.payloadKey ?? 'targetPlayerId');
    const rewriteSelectedPlayer = (value: unknown): unknown => {
      if (Array.isArray(value)) return value.map(rewriteSelectedPlayer);
      if (!value || typeof value !== 'object') return value;
      const out: AnyRecord = {};
      for (const [key, child] of Object.entries(value as AnyRecord)) out[key] = rewriteSelectedPlayer(child);
      if (out.target === 'selected_player') out.target = mapped.payloadKey;
      return out;
    };
    mapped.then = rewriteSelectedPlayer(mapped.then ?? []) as AnyRecord[];
    return mapped;
  }
  if (effect.type === 'reveal_true_name' && effect.target === 'controller' &&
      Object.keys(effect).every((key) => ['type', 'target', 'thenIfChanged'].includes(key))) {
    const changedEffects = Array.isArray(effect.thenIfChanged)
      ? effect.thenIfChanged.map((entry: unknown) => normalizeStructuredEffect(entry, 'branch'))
      : [];
    return {
      type: 'branch', branches: [
        { if: { type: 'not', condition: { type: 'controller_servant_revealed' } }, then: [
          { type: 'reveal_information', scope: 'servant_package', subject: 'controller.servant' }, ...changedEffects,
        ] },
        { else: [] },
      ],
    };
  }
  if (effect.type === 'move_player' && !effect.to && !effect.locationId && effect.adjacentOnly === true &&
      Object.keys(effect).every((key) => ['type', 'target', 'adjacentOnly', 'ignoreEngagement'].includes(key))) {
    return {
      type: 'choose_locations', adjacentOnly: true, minCount: 1, maxCount: 1, payloadKey: 'targetLocationId',
      then: [{ type: 'move_player', target: effect.target ?? 'controller', to: 'targetLocationId',
        ...(effect.ignoreEngagement === true ? { ignoreEngagement: true } : {}) }],
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
      if (['skill.unlocked', 'card.exiled', 'servant.true-name-revealed', 'player.mana.spent'].includes(eventTypes[0]) && a.kind === 'passive') a.kind = 'forced_trigger';
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
      if (out.target && typeof out.target === 'object') {
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
          { type: 'same_battlefield_as_controller' }];
        return copy;
      });
    }
    const sameBattlefieldPlayerTargets = hasSelectedSameBattlefieldDefeat ? a.targets.filter((target: AnyRecord) => target?.type === 'player' &&
      Array.isArray(target.constraints) && !target.constraints.some((c: AnyRecord) => c?.type === 'not_controller') &&
      target.constraints.some((c: AnyRecord) => c?.type === 'same_battlefield_as_controller')) : [];
    const bindSelectedSameBattlefield = (value: unknown): unknown => {
      if (Array.isArray(value)) return value.map(bindSelectedSameBattlefield);
      if (!value || typeof value !== 'object') return value;
      const node = value as AnyRecord; const out: AnyRecord = {};
      for (const [key, child] of Object.entries(node)) out[key] = bindSelectedSameBattlefield(child);
      if (out.target && typeof out.target === 'object' &&
          Object.keys(out.target).length === 1 && out.target.scope === 'selected_same_battlefield_player') {
        if (sameBattlefieldPlayerTargets.length !== 1 || typeof sameBattlefieldPlayerTargets[0]?.id !== 'string') {
          throw new Error(`ability ${raw.id} cannot bind selected_same_battlefield_player uniquely`);
        }
        out.target = sameBattlefieldPlayerTargets[0].id;
      }
      return out;
    };
    a.effects = bindSelectedSameBattlefield(a.effects) as AnyRecord[];

    // Compile locked-Reference granted-card handler metadata into the already accepted
    // identity-free FB2-52 structured ability. Runtime routing never sees handler ids.
    if (Array.isArray(a.transforms)) {
      a.transforms = a.transforms.map((rawTransform: AnyRecord) => {
        const transform = structuredClone(rawTransform);
        if (!Array.isArray(transform.grantAbilities)) return transform;
        transform.grantAbilities = transform.grantAbilities.map((rawGrant: AnyRecord) => {
          if (rawGrant?.handlerId === 'core.ciel-expanded-soul-crush') {
            if (rawGrant.id !== 'expanded-soul-crush' || rawGrant.activation?.phase !== 'combat' ||
                Object.keys(rawGrant).some((key) => !['id','name','activation','handlerId'].includes(key))) {
              throw new Error(`ability ${raw.id} has widened locked granted soul-crush metadata`);
            }
            return {
              id: rawGrant.id, kind: 'phase_action', printedClause: String(a.printedClause ?? rawGrant.name ?? ''),
              activation: { phase: 'combat', opens: 'controller_combat_action_window' },
              conditions: [{ type: 'source_active' }, { type: 'at_battlefield' }], targets: [], cost: [],
              effects: [{
                type: 'suppress_next_round_situation_benefits',
                target: { scope: 'same_battlefield_opponents', where: [{
                  type: 'does_not_control_card_definition', definitionIds: ['card.cardluck'], zones: ['attack'], activeOnly: true, face: 'up',
                }] },
                roundOffset: 1, benefits: ['situation_mana_gain', 'situation_power_bonus'],
              }],
              creates: [], ruleModifiers: [], lifecycle: {},
              responseWindow: { order: 'turn_order', passBehavior: 'decline_this_window' }, limit: {}, visibility: {},
              execution: { mode: 'automatic', allowedOperations: [] },
            };
          }
          if (rawGrant?.handlerId === 'core.sigurd-blade-storm') {
            if (rawGrant.id !== 'sigurd-blade-storm' || rawGrant.activation?.phase !== 'action' || rawGrant.limit !== 'once-per-round' ||
                Object.keys(rawGrant).some((key) => !['id','name','activation','limit','handlerId'].includes(key)) ||
                Object.keys(rawGrant.activation ?? {}).some((key) => key !== 'phase')) {
              throw new Error(`ability ${raw.id} has widened locked granted Blade Storm metadata`);
            }
            return {
              id: rawGrant.id, kind: 'phase_action', printedClause: String(a.printedClause ?? rawGrant.name ?? ''),
              activation: { phase: 'action', opens: 'controller_action_window', requiresSourceState: 'active' },
              conditions: [], targets: [], cost: [{ type: 'pay_mana', amount: 2 }],
              effects: [{ type: 'double_source_base_power_remove_after_battle' }],
              creates: [], ruleModifiers: [], lifecycle: {}, responseWindow: {},
              limit: { type: 'per_round', uses: 1, scope: 'this_card' }, visibility: {},
              execution: { mode: 'automatic', allowedOperations: [] },
            };
          }
          if (rawGrant?.handlerId === 'core.kuzuki-snake-join') {
            const zones = Array.isArray(rawGrant.allowedZones) ? rawGrant.allowedZones.map(String) : [];
            if (rawGrant.id !== 'perfect-breath-snake-join' || rawGrant.activation?.phase !== 'combat' || rawGrant.allowInactive !== true ||
                JSON.stringify(zones) !== JSON.stringify(['hand','master-skills','servant-skills']) ||
                Object.keys(rawGrant).some((key) => !['id','name','activation','handlerId','allowedZones','allowInactive'].includes(key))) {
              throw new Error(`ability ${raw.id} has widened locked granted snake-join metadata`);
            }
            return {
              id: rawGrant.id, kind: 'phase_action', printedClause: String(a.printedClause ?? rawGrant.name ?? ''),
              activation: { phase: 'combat', opens: 'controller_combat_action_window' },
              conditions: [], targets: [], cost: [{ type: 'pay_mana', amount: 6 }],
              effects: [{ type: 'join_source_card_to_attack', allowedSourceZones: ['hand','skill'] }],
              creates: [], ruleModifiers: [], lifecycle: {}, responseWindow: {}, limit: {}, visibility: {},
              execution: { mode: 'automatic', allowedOperations: [] },
            };
          }
          if (rawGrant?.handlerId === 'core.play-card-from-hand-in-combat') {
            const zones = Array.isArray(rawGrant.allowedZones) ? rawGrant.allowedZones.map(String) : [];
            if (typeof rawGrant.id !== 'string' || !rawGrant.id || rawGrant.activation?.phase !== 'combat' || rawGrant.activation?.step !== 'player-window' ||
                rawGrant.allowInactive !== true || JSON.stringify(zones) !== JSON.stringify(['hand']) ||
                Object.keys(rawGrant).some((key) => !['id','name','activation','handlerId','allowedZones','allowInactive'].includes(key)) ||
                Object.keys(rawGrant.activation ?? {}).some((key) => !['phase','step'].includes(key))) {
              throw new Error(`ability ${raw.id} has widened locked granted combat hand-play metadata`);
            }
            return {
              id: rawGrant.id, kind: 'phase_action', printedClause: String(a.printedClause ?? rawGrant.name ?? ''),
              activation: { phase: 'combat', opens: 'controller_combat_action_window' },
              conditions: [], targets: [], cost: [], effects: [{ type: 'play_source_card', face: 'face_up' }],
              creates: [], ruleModifiers: [], lifecycle: {}, responseWindow: {}, limit: {}, visibility: {},
              execution: { mode: 'automatic', allowedOperations: [] },
            };
          }
          const grantModifiers = Array.isArray(rawGrant?.ruleModifiers) ? rawGrant.ruleModifiers : [];
          const defeatModifier = grantModifiers.length === 1 ? grantModifiers[0] as AnyRecord : undefined;
          if (rawGrant?.activation?.phase === 'combat' && rawGrant?.limit === 'once-per-round' && defeatModifier?.operation === 'ignore' &&
              defeatModifier?.rule === 'defeat' && defeatModifier?.scope?.subject === 'controller' &&
              defeatModifier?.lifecycle?.duration === 'this_round' && defeatModifier?.priority?.tier === 'card_text' &&
              defeatModifier?.priority?.specificity === 'explicit_exception' && defeatModifier?.conflictPolicy === 'explicit_exception_over_general') {
            if (Object.keys(rawGrant).some((key) => !['id','name','activation','limit','ruleModifiers'].includes(key)) ||
                Object.keys(rawGrant.activation ?? {}).some((key) => key !== 'phase') ||
                Object.keys(defeatModifier).some((key) => !['id','printedClause','operation','rule','scope','lifecycle','priority','conflictPolicy'].includes(key)) ||
                Object.keys(defeatModifier.scope ?? {}).some((key) => key !== 'subject') ||
                Object.keys(defeatModifier.lifecycle ?? {}).some((key) => key !== 'duration') ||
                Object.keys(defeatModifier.priority ?? {}).some((key) => !['tier','specificity'].includes(key))) {
              throw new Error(`ability ${raw.id} has widened locked granted round-defeat-ignore metadata`);
            }
            return {
              id: String(rawGrant.id ?? ''), kind: 'phase_action', printedClause: String(defeatModifier.printedClause ?? rawGrant.name ?? a.printedClause ?? ''),
              activation: { phase: 'combat', opens: 'controller_combat_action_window', requiresSourceState: 'active' },
              conditions: [], targets: [], cost: [], effects: [], creates: [], ruleModifiers: [structuredClone(defeatModifier)], lifecycle: {},
              responseWindow: {}, limit: { type: 'per_round', uses: 1, scope: 'this_card' }, visibility: {},
              execution: { mode: 'automatic', allowedOperations: [] },
            };
          }
          if (rawGrant?.handlerId === 'core.ryougi-boundary-bottom-discard') {
            const limit = rawGrant.limit;
            if (rawGrant.id !== 'ryougi-boundary-bottom-discard' || rawGrant.activation?.phase !== 'combat' || limit !== 'once-per-round' ||
                Object.keys(rawGrant).some((key) => !['id','name','activation','limit','handlerId'].includes(key)) ||
                Object.keys(rawGrant.activation ?? {}).some((key) => key !== 'phase')) {
              throw new Error(`ability ${raw.id} has widened locked granted boundary-bottom metadata`);
            }
            const parentConditions = Array.isArray(a.conditions) ? a.conditions : [];
            if (parentConditions.length === 0) a.conditions = [{ type: 'source_owned' }];
            else if (parentConditions.length !== 1 || parentConditions[0]?.type !== 'source_owned' || Object.keys(parentConditions[0] ?? {}).length !== 1) {
              throw new Error(`ability ${raw.id} has widened locked boundary source applicability`);
            }
            return {
              id: rawGrant.id, kind: 'phase_action', printedClause: String(a.printedClause ?? rawGrant.name ?? ''),
              activation: { phase: 'combat', opens: 'controller_combat_action_window', requiresSourceState: 'active' },
              conditions: [],
              targets: [{
                id: 'boundary_target', type: 'player', count: { min: 1, max: 1 },
                constraints: [
                  { type: 'same_battlefield_as_controller' },
                  { type: 'card_count_at_least', target: 'controller', zone: 'deck', value: 1 },
                ],
              }],
              cost: [], effects: [{ type: 'discard_bottom_card', target: 'boundary_target' }],
              creates: [], ruleModifiers: [], lifecycle: {}, responseWindow: {},
              limit: { type: 'per_round', uses: 1, scope: 'this_card' }, visibility: {},
              execution: { mode: 'automatic', allowedOperations: [] },
            };
          }
          return rawGrant;
        });
        return transform;
      });
    }

    const copies = Array.isArray(a.copies) ? a.copies as AnyRecord[] : [];
    const exactSelectedCardPermanentAttackCopies = copies.length > 0 && copies.every((copy) => {
      const lifecycle = copy.lifecycle && typeof copy.lifecycle === 'object' ? copy.lifecycle as AnyRecord : {};
      return copy.source === 'selected_card' && typeof copy.payloadKey === 'string' && copy.payloadKey.length > 0 &&
        copy.target === 'selected_player' && copy.zone === 'attack_area' && copy.face === 'up' && copy.active === true &&
        copy.temporary === false && copy.residual === true && lifecycle.duration === 'permanent' &&
        Object.keys(lifecycle).every((key) => key === 'duration') &&
        Object.keys(copy).every((key) => ['id','printedClause','source','payloadKey','target','zone','face','active','temporary','lifecycle','residual'].includes(key));
    });
    const exactSelectedCardTemporarySkillCopies = copies.length > 0 && copies.every((copy) => {
      const lifecycle = copy.lifecycle && typeof copy.lifecycle === 'object' ? copy.lifecycle as AnyRecord : {};
      return copy.source === 'selected_card' && typeof copy.payloadKey === 'string' && copy.payloadKey.length > 0 &&
        copy.target === 'controller' && ['servant-skills','master-skills','skill'].includes(String(copy.zone ?? '')) &&
        copy.face === 'up' && copy.active === false && copy.temporary === true && copy.residual === false &&
        lifecycle.duration === 'this_round' && lifecycle.cleanup === 'remove_from_game' &&
        Object.keys(lifecycle).every((key) => ['duration','cleanup'].includes(key)) &&
        Object.keys(copy).every((key) => ['id','printedClause','source','payloadKey','target','zone','face','active','temporary','lifecycle','residual'].includes(key));
    });
    if (exactSelectedCardPermanentAttackCopies || exactSelectedCardTemporarySkillCopies) {
      a.effects = [...(Array.isArray(a.effects) ? a.effects : []), ...copies.map((copy) => ({ ...copy, type: 'copy_selected_card' }))];
      delete a.copies;
    }
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
  assertAbilityDefinitionDependencies(id, Array.isArray(source.abilities) ? source.abilities : []);
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
      macroBatch: 'P3-F4-M50-02-50-SKILL-MACRO-MIGRATION-BATCH',
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

function exactNodeKeys(value: AnyRecord, allowed: readonly string[]): boolean {
  const keys = Object.keys(value).sort(); const expected = [...allowed].sort();
  return keys.length === expected.length && keys.every((key, index) => key === expected[index]);
}

/**
 * Locked Reference still labels a small class of fully declarative structured abilities as
 * `manual`.  Only these exact server-computable envelopes may be promoted to automatic here.
 * This is intentionally structural and identity-free; any widened shape remains fail-closed.
 */
function isExactDeclarativeManualAbility(raw: AnyRecord): boolean {
  if (raw.kind !== 'activated' || raw.execution?.mode !== 'manual' || !exactNodeKeys(raw.execution, ['mode'])) return false;
  const activation = raw.activation && typeof raw.activation === 'object' && !Array.isArray(raw.activation) ? raw.activation as AnyRecord : {};
  if (!['action','combat'].includes(String(activation.phase ?? '')) || !exactNodeKeys(activation, ['phase'])) return false;
  const conditions = Array.isArray(raw.conditions) ? raw.conditions : [];
  if (conditions.length !== 1 || conditions[0]?.type !== 'phase_is' || conditions[0]?.phase !== activation.phase ||
      !exactNodeKeys(conditions[0], ['type','phase'])) return false;
  const effects = Array.isArray(raw.effects) ? raw.effects : [];
  const sameLocation = (target: unknown): boolean => !!target && typeof target === 'object' && !Array.isArray(target) &&
    (target as AnyRecord).scope === 'same_location_players' && exactNodeKeys(target as AnyRecord, ['scope']);
  const exactSeed = effects.length === 2 && effects[0]?.type === 'gain_mana' && effects[0]?.amount === 2 && sameLocation(effects[0]?.target) &&
    exactNodeKeys(effects[0], ['type','target','amount']) && effects[1]?.type === 'add_player_flag_number' &&
    typeof effects[1]?.key === 'string' && effects[1].key.length > 0 && effects[1]?.amount === 1 && sameLocation(effects[1]?.target) &&
    exactNodeKeys(effects[1], ['type','target','key','amount']);
  const target = effects[0]?.target && typeof effects[0].target === 'object' && !Array.isArray(effects[0].target) ? effects[0].target as AnyRecord : {};
  const where = Array.isArray(target.where) ? target.where : [];
  const predicate = where[0] && typeof where[0] === 'object' && !Array.isArray(where[0]) ? where[0] as AnyRecord : {};
  const exactCollapse = effects.length === 1 && effects[0]?.type === 'defeat_player' && exactNodeKeys(effects[0], ['type','target']) &&
    target.scope === 'all_players' && exactNodeKeys(target, ['scope','where']) && where.length === 1 &&
    predicate.type === 'player_flag_greater_than_mana_ratio' && typeof predicate.key === 'string' && predicate.key.length > 0 &&
    Number.isSafeInteger(predicate.numerator) && Number(predicate.numerator) > 0 &&
    Number.isSafeInteger(predicate.denominator) && Number(predicate.denominator) > 0 &&
    exactNodeKeys(predicate, ['type','key','numerator','denominator']);
  return exactSeed || exactCollapse;
}
function normalizeOverrideAbility(raw: AnyRecord): AnyRecord[] {
  const normalizedRaw = structuredClone(raw);
  if (normalizedRaw.execution?.mode === 'handler' && normalizedRaw.execution?.handlerId === 'core.sieg-galvanism') {
    const conditions = Array.isArray(normalizedRaw.conditions) ? normalizedRaw.conditions : [];
    const exactEvent = conditions.length === 1 && conditions[0]?.type === 'event_type_is' && conditions[0]?.eventType === 'player.mana.spent' &&
      Object.keys(conditions[0] ?? {}).every((key) => ['type', 'eventType'].includes(key));
    if (normalizedRaw.id !== 'galvanism-recover-seal' || normalizedRaw.kind !== 'passive' || !exactEvent ||
        Object.keys(normalizedRaw.execution ?? {}).some((key) => !['mode', 'handlerId'].includes(key)) ||
        normalizedRaw.effects !== undefined || normalizedRaw.ruleModifiers !== undefined || normalizedRaw.transforms !== undefined || normalizedRaw.copies !== undefined) {
      throw new Error(`override ability ${raw.id} has widened Sieg Galvanism handler metadata`);
    }
    normalizedRaw.execution = { mode: 'automatic' };
    normalizedRaw.conditions = [
      conditions[0],
      { type: 'source_owned_live' },
      { type: 'event_player_is_opponent' },
      { type: 'event_player_same_location_as_controller' },
      { type: 'event_mana_spent_at_least', amount: 4 },
    ];
    normalizedRaw.effects = [{ type: 'adjust_command_seals', player: 'controller', amount: 1, directive: 'recover_command_seal' }];
  }
  if (normalizedRaw.execution?.mode === 'handler' && normalizedRaw.execution?.handlerId === 'core.cu-alter-curruid-passive') {
    const emptyList = (value: unknown): boolean => value === undefined || (Array.isArray(value) && value.length === 0);
    const emptyObject = (value: unknown): boolean => value === undefined || (!!value && typeof value === 'object' && !Array.isArray(value) && Object.keys(value as object).length === 0);
    if (normalizedRaw.id !== 'curruid-combat-attrition' || normalizedRaw.kind !== 'passive' ||
        Object.keys(normalizedRaw.execution ?? {}).sort().join(',') !== 'handlerId,mode' ||
        !emptyList(normalizedRaw.conditions) || !emptyList(normalizedRaw.targets) || !emptyList(normalizedRaw.effects) ||
        !emptyList(normalizedRaw.cost) || !emptyList(normalizedRaw.creates) || !emptyList(normalizedRaw.ruleModifiers) ||
        !emptyObject(normalizedRaw.activation) || !emptyObject(normalizedRaw.lifecycle) || !emptyObject(normalizedRaw.responseWindow) ||
        !emptyObject(normalizedRaw.limit) || !emptyObject(normalizedRaw.visibility) || normalizedRaw.transforms !== undefined || normalizedRaw.copies !== undefined) {
      throw new Error(`override ability ${raw.id} has widened Cu Alter Curruid passive handler metadata`);
    }
    normalizedRaw.kind = 'forced_trigger';
    normalizedRaw.activation = { trigger: 'after_battle_ended' };
    normalizedRaw.conditions = [{ type: 'source_owned_live' }];
    normalizedRaw.effects = [{ type: 'battle_terminal_active_attack_vp_attrition', offset: -1, maxAmount: 3 }];
    normalizedRaw.execution = { mode: 'automatic' };
  }
  if (normalizedRaw.execution?.mode === 'handler' && normalizedRaw.execution?.handlerId === 'core.sigurd-bolverk-gram') {
    const emptyList = (value: unknown): boolean => value === undefined || (Array.isArray(value) && value.length === 0);
    const emptyObject = (value: unknown): boolean => value === undefined || (!!value && typeof value === 'object' && !Array.isArray(value) && Object.keys(value as object).length === 0);
    if (normalizedRaw.id !== 'bolverk-cursed' || normalizedRaw.kind !== 'passive' ||
        Object.keys(normalizedRaw.execution ?? {}).sort().join(',') !== 'handlerId,mode' ||
        !emptyList(normalizedRaw.conditions) || !emptyList(normalizedRaw.targets) || !emptyList(normalizedRaw.effects) ||
        !emptyList(normalizedRaw.cost) || !emptyList(normalizedRaw.creates) || !emptyList(normalizedRaw.ruleModifiers) ||
        !emptyObject(normalizedRaw.activation) || !emptyObject(normalizedRaw.lifecycle) || !emptyObject(normalizedRaw.responseWindow) ||
        !emptyObject(normalizedRaw.limit) || !emptyObject(normalizedRaw.visibility) || normalizedRaw.transforms !== undefined || normalizedRaw.copies !== undefined) {
      throw new Error(`override ability ${raw.id} has widened Sigurd Bolverk curse handler metadata`);
    }
    normalizedRaw.kind = 'forced_trigger';
    normalizedRaw.activation = { trigger: 'm50_round_started' };
    normalizedRaw.conditions = [{ type: 'source_revealed' }];
    normalizedRaw.effects = [{ type: 'lose_victory_points', target: 'controller', amount: 1 }];
    normalizedRaw.execution = { mode: 'automatic' };
  }
  if (normalizedRaw.execution?.mode === 'handler' && normalizedRaw.execution?.handlerId === 'core.kagekiyo-never-dies') {
    const cost = Array.isArray(normalizedRaw.cost) ? normalizedRaw.cost : normalizedRaw.cost ? [normalizedRaw.cost] : [];
    const exactCost = cost.length === 1 && cost[0]?.type === 'pay_mana' && cost[0]?.amount === 3 &&
      Object.keys(cost[0] ?? {}).every((key) => ['type','amount'].includes(key));
    const emptyList = (value: unknown): boolean => value === undefined || (Array.isArray(value) && value.length === 0);
    const emptyObject = (value: unknown): boolean => value === undefined || (!!value && typeof value === 'object' && !Array.isArray(value) && Object.keys(value as object).length === 0);
    if (normalizedRaw.id !== 'vengeful-grudge-facedown' || normalizedRaw.kind !== 'phase_action' || normalizedRaw.activation?.phase !== 'outpost' ||
        Object.keys(normalizedRaw.activation ?? {}).some((key) => key !== 'phase') || !exactCost ||
        Object.keys(normalizedRaw.execution ?? {}).sort().join(',') !== 'handlerId,mode' ||
        !emptyList(normalizedRaw.conditions) || !emptyList(normalizedRaw.targets) || !emptyList(normalizedRaw.effects) ||
        !emptyList(normalizedRaw.creates) || !emptyList(normalizedRaw.ruleModifiers) ||
        !emptyObject(normalizedRaw.lifecycle) || !emptyObject(normalizedRaw.responseWindow) || !emptyObject(normalizedRaw.limit) ||
        !emptyObject(normalizedRaw.visibility) || normalizedRaw.transforms !== undefined || normalizedRaw.copies !== undefined) {
      throw new Error(`override ability ${raw.id} has widened Kagekiyo Never Dies handler metadata`);
    }
    normalizedRaw.conditions = [{
      type: 'not', condition: { type: 'card_count_at_least', target: 'controller', zone: 'attack', face: 'down', value: 1 },
    }];
    normalizedRaw.effects = [{ type: 'draw_and_play_face_down_attacks', target: 'controller', count: 2 }];
    normalizedRaw.execution = { mode: 'automatic' };
  }
  if (normalizedRaw.execution?.mode === 'handler' && normalizedRaw.execution?.handlerId === 'core.kriemhild-black-wedding') {
    const emptyList = (value: unknown): boolean => value === undefined || (Array.isArray(value) && value.length === 0);
    const emptyObject = (value: unknown): boolean => value === undefined || (!!value && typeof value === 'object' && !Array.isArray(value) && Object.keys(value as object).length === 0);
    if (normalizedRaw.id !== 'widows-invitation' || normalizedRaw.kind !== 'play_trigger' ||
        Object.keys(normalizedRaw.execution ?? {}).sort().join(',') !== 'handlerId,mode' ||
        !emptyList(normalizedRaw.conditions) || !emptyList(normalizedRaw.targets) || !emptyList(normalizedRaw.effects) ||
        !emptyList(normalizedRaw.cost) || !emptyList(normalizedRaw.creates) || !emptyList(normalizedRaw.ruleModifiers) ||
        !emptyObject(normalizedRaw.activation) || !emptyObject(normalizedRaw.lifecycle) || !emptyObject(normalizedRaw.responseWindow) ||
        !emptyObject(normalizedRaw.limit) || !emptyObject(normalizedRaw.visibility) || normalizedRaw.transforms !== undefined || normalizedRaw.copies !== undefined) {
      throw new Error(`override ability ${raw.id} has widened Kriemhild Black Wedding handler metadata`);
    }
    normalizedRaw.conditions = [{ type: 'event_definition_is_self' }, { type: 'event_face_is', face: 'up' }];
    normalizedRaw.effects = [{
      type: 'choose_each_player_option',
      candidateTarget: { scope: 'all_opponents' },
      candidateConditions: [{ type: 'can_effect_move_to_controller_location' }],
      skipIfNoCandidates: true,
      options: [
        { id: 'move', label: '移动至该战场', effects: [{ type: 'move_player', target: 'decision_player', to: 'controller_location', movementKind: 'effect' }] },
        { id: 'stay', label: '留在原地', effects: [] },
      ],
    }];
    normalizedRaw.execution = { mode: 'automatic' };
  }
  if (normalizedRaw.execution?.mode !== undefined && normalizedRaw.execution.mode !== 'automatic') {
    if (normalizedRaw.execution.mode === 'manual' && isExactDeclarativeManualAbility(normalizedRaw)) {
      normalizedRaw.execution = { mode: 'automatic' };
    } else {
      throw new Error(`override ability ${raw.id} still depends on non-declarative execution mode ${String(raw.execution.mode)}`);
    }
  }
  if (normalizedRaw.execution?.handlerId) {
    throw new Error(`override ability ${raw.id} still depends on handler ${String(normalizedRaw.execution.handlerId)}`);
  }
  const variants = transformAbility(normalizedRaw);
  const residualConditions = Array.isArray(normalizedRaw.conditions) ? normalizedRaw.conditions : [];
  const residualModifiers = Array.isArray(normalizedRaw.ruleModifiers) ? normalizedRaw.ruleModifiers : [];
  const residualModifier = residualModifiers[0] && typeof residualModifiers[0] === 'object' && !Array.isArray(residualModifiers[0]) ? residualModifiers[0] as AnyRecord : {};
  const residualScope = residualModifier.scope && typeof residualModifier.scope === 'object' && !Array.isArray(residualModifier.scope) ? residualModifier.scope as AnyRecord : {};
  const residualCards = residualScope.cards && typeof residualScope.cards === 'object' && !Array.isArray(residualScope.cards) ? residualScope.cards as AnyRecord : {};
  const residualLifecycle = residualModifier.lifecycle && typeof residualModifier.lifecycle === 'object' && !Array.isArray(residualModifier.lifecycle) ? residualModifier.lifecycle as AnyRecord : {};
  const exactFaceDownResidual = normalizedRaw.kind === 'passive' && normalizedRaw.execution?.mode === 'automatic' &&
    residualConditions.length === 1 && residualConditions[0]?.type === 'source_owned' && Object.keys(residualConditions[0] ?? {}).length === 1 &&
    residualModifiers.length === 1 && residualModifier.operation === 'allow' && residualModifier.rule === 'card_residual' && residualModifier.value === 1 &&
    residualScope.subject === 'controller' && Object.keys(residualScope).sort().join(',') === 'cards,subject' &&
    JSON.stringify(residualCards.zones) === JSON.stringify(['attack']) && residualCards.face === 'down' && Object.keys(residualCards).sort().join(',') === 'face,zones' &&
    residualLifecycle.duration === 'permanent' && Object.keys(residualLifecycle).length === 1;
  if (exactFaceDownResidual) {
    variants.push(...transformAbility({
      id: `${String(normalizedRaw.id ?? 'face-down-residual')}__round-end-close`,
      kind: 'optional_trigger', printedClause: String(normalizedRaw.printedClause ?? ''),
      activation: { trigger: 'round_end' }, conditions: [{ type: 'source_owned' }],
      targets: [{ id: 'face_down_attacks', type: 'card_instance', scope: { zone: 'attack' }, count: { min: 1, max: 50 }, constraints: [{ type: 'is_attack', face: 'face_down' }] }],
      cost: [], effects: [{ type: 'close_selected_face_down_attacks', target: 'face_down_attacks' }], creates: [], ruleModifiers: [], lifecycle: {},
      responseWindow: { opens: 'round_end', order: 'turn_order', passBehavior: 'decline_this_window' }, limit: {}, visibility: {},
      execution: { mode: 'automatic' },
    }));
  }
  for (const ability of variants) {
    if (ability.execution?.mode !== 'automatic') throw new Error(`non-automatic override ability ${raw.id}`);
  }
  return variants;
}

function overrideMetadataAbilities(id: string, override: AnyRecord): AnyRecord[] {
  const existing = Array.isArray(override.rules?.abilities) ? override.rules.abilities : [];
  if (existing.length > 0) {
    // Dependency-bearing linked definitions must already be source-grounded before
    // normalization can erase or rewrite their source-authoring fields.
    assertAbilityDefinitionDependencies(id, existing);
    const metadata = Array.isArray(override.abilities) ? override.abilities : [];
    const topLevelLimit = override.limit;
    const mapUsageLimit = (value: unknown, abilityId: unknown): AnyRecord | undefined => {
      if (value === undefined || value === null) return undefined;
      if (value === 'once-per-game') return { type: 'per_game', uses: 1, scope: 'this_card' };
      if (value === 'once-per-round') return { type: 'per_round', uses: 1, scope: 'this_card' };
      throw new Error(`${id} has unsupported usage limit metadata ${String(value)} for ${String(abilityId ?? '')}`);
    };
    return existing.flatMap((raw: AnyRecord) => {
      const exactMetadata = metadata.filter((entry: AnyRecord) => entry?.id === raw?.id);
      if (exactMetadata.length > 1) throw new Error(`${id} has duplicate metadata for ability ${String(raw?.id ?? '')}`);
      const enriched = structuredClone(raw);
      const effectiveRequiresActive = exactMetadata[0]?.requiresActiveCard ?? override.requiresActiveCard;
      if (effectiveRequiresActive !== undefined && typeof effectiveRequiresActive !== 'boolean') {
        throw new Error(`${id} has invalid requiresActiveCard metadata for ${String(raw?.id ?? '')}`);
      }
      if (effectiveRequiresActive === true) {
        if (enriched.requiresActiveCard === false) throw new Error(`${id} has conflicting structured and active-source metadata for ${String(raw?.id ?? '')}`);
        enriched.requiresActiveCard = true;
      } else if (effectiveRequiresActive === false && enriched.requiresActiveCard === true) {
        throw new Error(`${id} explicitly disables active-source requirement but structured rules require it for ${String(raw?.id ?? '')}`);
      }
      const effectiveReveal = exactMetadata[0]?.revealsTrueNameOnSkillUse ?? override.revealsTrueNameOnSkillUse;
      if (effectiveReveal !== undefined && typeof effectiveReveal !== 'boolean') {
        throw new Error(`${id} has invalid revealsTrueNameOnSkillUse metadata for ${String(raw?.id ?? '')}`);
      }
      if (effectiveReveal === true) {
        const mappedVisibility = { revealsTrueName: true, revealTiming: 'on_use_declared', revealScope: 'servant_package' };
        const existingVisibility = enriched.visibility;
        const emptyVisibility = existingVisibility === undefined || existingVisibility === null ||
          (typeof existingVisibility === 'object' && !Array.isArray(existingVisibility) && Object.keys(existingVisibility).length === 0);
        if (!emptyVisibility && JSON.stringify(existingVisibility) !== JSON.stringify(mappedVisibility)) {
          throw new Error(`${id} has conflicting structured and reveal metadata for ${String(raw?.id ?? '')}`);
        }
        enriched.visibility = mappedVisibility;
      } else if (effectiveReveal === false && enriched.visibility && Object.keys(enriched.visibility).length > 0) {
        throw new Error(`${id} explicitly disables true-name reveal but structured visibility is nonempty for ${String(raw?.id ?? '')}`);
      }      // Locked Reference resolves an activated ability limit as ability.limit ?? skill.limit.
      // Preserve that generic inheritance here: exact per-ability metadata overrides the
      // top-level skill limit, while an ability without its own limit inherits the top-level one.
      const effectiveLimit = exactMetadata[0]?.limit ?? topLevelLimit;
      const mappedLimit = mapUsageLimit(effectiveLimit, raw?.id);
      if (mappedLimit) {
        const existingLimit = enriched.limit;
        const emptyExisting = existingLimit === undefined || existingLimit === null ||
          (typeof existingLimit === 'object' && !Array.isArray(existingLimit) && Object.keys(existingLimit).length === 0);
        if (!emptyExisting && JSON.stringify(existingLimit) !== JSON.stringify(mappedLimit)) {
          throw new Error(`${id} has conflicting structured and metadata usage limit for ${String(raw?.id ?? '')}`);
        }
        enriched.limit = mappedLimit;
      }
      if (exactMetadata.length === 1 && exactMetadata[0]!.abilityCost !== undefined) {
        const amount = Number(exactMetadata[0]!.abilityCost);
        if (!Number.isSafeInteger(amount) || amount < 0) throw new Error(`${id} has invalid abilityCost metadata for ${String(raw?.id ?? '')}`);
        if (enriched.cost !== undefined && enriched.cost !== null &&
            JSON.stringify(enriched.cost) !== JSON.stringify({ type: 'pay_mana', amount }) &&
            JSON.stringify(enriched.cost) !== JSON.stringify([{ type: 'pay_mana', amount }])) {
          throw new Error(`${id} has conflicting structured cost and abilityCost metadata for ${String(raw?.id ?? '')}`);
        }
        enriched.cost = { type: 'pay_mana', amount };
      }
      const linkedTransform = override.linkedPlayerSameBattlefieldAttributeTransform;
      if (linkedTransform !== undefined) {
        if (!linkedTransform || typeof linkedTransform !== 'object' || Array.isArray(linkedTransform) ||
            Object.keys(linkedTransform).some((key) => !['playerFlag', 'removeAttributes', 'addAttributes'].includes(key)) ||
            typeof linkedTransform.playerFlag !== 'string' || !linkedTransform.playerFlag ||
            !Array.isArray(linkedTransform.removeAttributes) || !linkedTransform.removeAttributes.length ||
            !linkedTransform.removeAttributes.every((value: unknown) => typeof value === 'string' && value.length > 0) ||
            new Set(linkedTransform.removeAttributes).size !== linkedTransform.removeAttributes.length ||
            !Array.isArray(linkedTransform.addAttributes) || !linkedTransform.addAttributes.length ||
            !linkedTransform.addAttributes.every((value: unknown) => typeof value === 'string' && value.length > 0) ||
            new Set(linkedTransform.addAttributes).size !== linkedTransform.addAttributes.length ||
            linkedTransform.removeAttributes.some((value: string) => linkedTransform.addAttributes.includes(value))) {
          throw new Error(`${id} has malformed linked-player same-battlefield attribute transform metadata`);
        }
        const linkedConditions = Array.isArray(enriched.conditions)
          ? enriched.conditions.filter((condition: AnyRecord) => condition?.type === 'linked_player_flag_same_battlefield')
          : [];
        if (linkedConditions.length !== 1 || linkedConditions[0]?.key !== linkedTransform.playerFlag) {
          throw new Error(`${id} linked-player attribute transform is not bound to the exact structured condition`);
        }
        const modifiers = Array.isArray(enriched.ruleModifiers) ? enriched.ruleModifiers : [];
        if (modifiers.some((modifier: AnyRecord) => modifier?.rule === 'card_attributes')) {
          throw new Error(`${id} duplicates structured card-attribute transform metadata`);
        }
        enriched.ruleModifiers = [...modifiers, {
          id: 'linked-player-same-battlefield-attributes',
          operation: 'replace',
          rule: 'card_attributes',
          scope: { subject: 'controller', cards: { definitionIds: [id] } },
          value: { removeAttributes: [...linkedTransform.removeAttributes], addAttributes: [...linkedTransform.addAttributes] },
          lifecycle: { duration: 'permanent' },
        }];
      }
      return normalizeOverrideAbility(enriched);
    });
  }

  const passiveEvents = Array.isArray(override.passiveEventTypes) ? override.passiveEventTypes.map(String) : [];
  const exactGameStart = override.activation === 'passive' && passiveEvents.length === 1 && passiveEvents[0] === 'game.started';
  const execution = { mode: 'automatic', allowedOperations: [] as string[] };

  if (override.handlerId === 'core.game-start-add-skill' && exactGameStart) {
    const rawTargets = override.addSkillDefinitionIds ?? (override.addSkillDefinitionId ? [override.addSkillDefinitionId] : []);
    if (!Array.isArray(rawTargets) || rawTargets.length === 0 || rawTargets.some((entry: unknown) => typeof entry !== 'string' || !entry)) {
      throw new Error(`${id} has malformed game-start provision targets`);
    }
    const targetDefinitionIds = [...new Set(rawTargets.map(String))];
    if (targetDefinitionIds.length !== rawTargets.length) throw new Error(`${id} has duplicate game-start provision targets`);
    return [{
      id: 'game-start-provision', kind: 'forced_trigger', printedClause: legacyOwnerAndSkill(id).skill.text,
      activation: { trigger: 'game_start' }, conditions: [], targets: [],
      effects: [{ type: 'provision_skill_cards', player: 'controller', targetDefinitionIds }], cost: [], ruleModifiers: [], creates: [],
      lifecycle: {}, responseWindow: {}, limit: {}, visibility: {}, markers: ['m50_structured_v1'], execution,
    }];
  }

  if (override.handlerId === 'core.master-initial-mana' && exactGameStart && Number.isSafeInteger(override.initialMana) && override.initialMana >= 0) {
    return [{
      id: 'game-start-fixed-mana', kind: 'forced_trigger', printedClause: legacyOwnerAndSkill(id).skill.text,
      activation: { trigger: 'game_start' }, conditions: [], targets: [],
      effects: [{ type: 'set_mana', player: 'controller', amount: Number(override.initialMana) }], cost: [], ruleModifiers: [], creates: [],
      lifecycle: {}, responseWindow: {}, limit: {}, visibility: {}, markers: ['m50_structured_v1'], execution,
    }];
  }

  if (override.handlerId === 'core.game-start-player-config' && exactGameStart &&
      Number.isSafeInteger(override.initialMana) && override.initialMana >= 0 &&
      override.playerFlags && typeof override.playerFlags === 'object' && !Array.isArray(override.playerFlags)) {
    const entries = Object.entries(override.playerFlags);
    if (entries.length === 0 || entries.some(([key, value]) => !key || !['boolean', 'number', 'string'].includes(typeof value))) {
      throw new Error(`${id} has malformed game-start player config flags`);
    }
    return [{
      id: 'game-start-player-config', kind: 'forced_trigger', printedClause: legacyOwnerAndSkill(id).skill.text,
      activation: { trigger: 'game_start' }, conditions: [], targets: [],
      effects: [
        { type: 'set_mana', player: 'controller', amount: Number(override.initialMana) },
        ...entries.map(([key, value]) => ({ type: 'set_player_flag', target: 'controller', key, value })),
      ],
      cost: [], ruleModifiers: [], creates: [], lifecycle: {}, responseWindow: {}, limit: {}, visibility: {},
      markers: ['m50_structured_v1'], execution,
    }];
  }

  if (exactGameStart && override.playerFlags && typeof override.playerFlags === 'object' && !Array.isArray(override.playerFlags)) {
    const entries = Object.entries(override.playerFlags);
    if (entries.length === 0 || entries.some(([key, value]) => !key || !['boolean', 'number', 'string'].includes(typeof value))) {
      throw new Error(`${id} has malformed game-start playerFlags metadata`);
    }
    return [{
      id: 'game-start-player-flags', kind: 'forced_trigger', printedClause: legacyOwnerAndSkill(id).skill.text,
      activation: { trigger: 'game_start' }, conditions: [], targets: [],
      effects: entries.map(([key, value]) => ({ type: 'set_player_flag', target: 'controller', key, value })), cost: [], ruleModifiers: [], creates: [],
      lifecycle: {}, responseWindow: {}, limit: {}, visibility: {}, markers: ['m50_structured_v1'], execution,
    }];
  }

  if (override.handlerId === 'core.rule-marker' && override.initiallyOwned === false && Array.isArray(override.tags) && override.tags.includes('deduction-record')) {
    const tags = override.tags.map(String);
    const attributeTags = tags.filter((tag: string) => tag.startsWith('deduction-attribute:'));
    const allowedAttributes = new Set(['力量', '迅捷', '魔术', '特殊']);
    if (tags.length !== 2 || new Set(tags).size !== 2 || attributeTags.length !== 1 ||
        !allowedAttributes.has(attributeTags[0]!.slice('deduction-attribute:'.length))) {
      throw new Error(`${id} has malformed deduction-record marker metadata`);
    }
    return [{
      id: 'deduction-record-marker', kind: 'passive', printedClause: legacyOwnerAndSkill(id).skill.text,
      markers: ['m50_structured_v1', ...tags], activation: {}, conditions: [], targets: [], effects: [], cost: [],
      ruleModifiers: [], creates: [], lifecycle: {}, responseWindow: {}, limit: {}, visibility: {}, execution,
    }];
  }

  if (override.activation === 'phase' && override.doubleDeploymentBonus === true) {
    return [{
      id: 'double-deployment-bonus', kind: 'phase_action', printedClause: legacyOwnerAndSkill(id).skill.text,
      activation: { phase: 'action', opens: 'controller_action_window' }, conditions: [], targets: [],
      effects: [{ type: 'multiply_deployment_bonus', target: 'controller', multiplier: 2 }], cost: [], ruleModifiers: [], creates: [],
      lifecycle: {}, responseWindow: {}, limit: {}, visibility: {}, markers: ['m50_structured_v1'], execution,
    }];
  }

  throw new Error(`${id} FULL override has no declarative abilities or accepted generic metadata mapping`);
}

export function convertConfirmedOverrideCard(id: string, override: AnyRecord): AnyRecord {
  const f1 = inventoryById.get(id);
  if (!f1) throw new Error(`missing F1 ${id}`);
  const { skill, ownerType } = legacyOwnerAndSkill(id);
  if (override?.supportLevel !== 'FULL') {
    throw new Error(`${id} is not exact FULL structured-skill override`);
  }
  if ((override.rules?.unmodeledClauses ?? []).length || (override.rules?.ambiguities ?? []).length) throw new Error(`${id} has unresolved override clauses`);
  if (override.faceDownAttackFollowup !== undefined) {
    const followup = override.faceDownAttackFollowup as AnyRecord;
    const keys = Object.keys(followup).sort();
    if (keys.length !== 2 || keys[0] !== 'definitionId' || keys[1] !== 'exactCount' ||
        typeof followup.definitionId !== 'string' || !followup.definitionId ||
        !Number.isSafeInteger(followup.exactCount) || Number(followup.exactCount) <= 0) {
      throw new Error(`${id} has malformed faceDownAttackFollowup metadata`);
    }
    assertSourceGroundedExecutableDependency(id, followup.definitionId, 'faceDownAttackFollowup');
  }
  const abilities = overrideMetadataAbilities(id, override);
  assertAbilityDefinitionDependencies(id, abilities);
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
    cardFace: {
      typeLabel: skill.typeLabel,
      cost: Number(skill.cost ?? 0),
      basePower: override.basePowerFormula !== undefined ? transformDeep(override.basePowerFormula) : Number(skill.basePower ?? 0),
      attributes,
    },
    playTiming: { phase: 'action', window: 'controller_play_card_window' },
    playRequirements: requirements,
    abilities,
    phase3Evidence: {
      lockedReferenceCommit: 'b2f9fa15fba07c63530bbf4612b03b8b704755f9',
      sourceGrounding: 'locked-confirmed-skill-overrides',
      referenceHandlerId: f1.reference?.handlerId,
      sourceRefs: f1.sources ?? [],
      macroBatch: 'P3-F4-M50-02-50-SKILL-MACRO-MIGRATION-BATCH',
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
    sourcePolicy: { referenceMetadataCommit: 'b2f9fa15fba07c63530bbf4612b03b8b704755f9', note: 'P3 F4 M50-02 macro-batch mechanical materialization from locked source-grounded evidence.' },
    cards: [card],
  };
}

async function probeGrounded(): Promise<AnyRecord[]> {
  const mod = await import(pathToFileURL(REFERENCE_OVERRIDES).href);
  const overrides = mod.confirmedSkillOverrides as Record<string, AnyRecord>;
  const out: AnyRecord[] = [];
  for (const id of M50_02_GROUNDED_CANDIDATE_IDS) {
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
    const selectedIds = new Set<string>(M50_02_SELECTED_IDS);
    const mod = await import(pathToFileURL(REFERENCE_OVERRIDES).href);
    const overrides = mod.confirmedSkillOverrides as Record<string, AnyRecord>;
    const ready = new Set<string>(M50_02_READY_IDS as readonly string[]);
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
    const rows = M50_02_READY_IDS.map((id) => {
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

  const selectedIds = [...M50_02_SELECTED_IDS];
  if (selectedIds.length !== 50 || new Set(selectedIds).size !== 50) {
    throw new Error(`frozen macro roster must contain exactly 50 unique ids; got ${selectedIds.length}/${new Set(selectedIds).size}`);
  }
  const mod = await import(pathToFileURL(REFERENCE_OVERRIDES).href);
  const overrides = mod.confirmedSkillOverrides as Record<string, AnyRecord>;
  const ready = new Set<string>(M50_02_READY_IDS as readonly string[]);
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
      const target = resolve(ROOT, `data/authoring/${family}/${ownerId}.p3-m50-02.json`);
      if (existsSync(target)) throw new Error(`refusing to overwrite existing macro material ${target}`);
      const archive = archiveFor(ownerCards[0]!); archive.cards = ownerCards;
      const report = rules.loadAuthoringJson(archive).report;
      if (report.length) throw new Error(`grouped macro archive ${ownerId} has ${report.length} load blocker(s)`);
      writeFileSync(target, `${JSON.stringify(archive, null, 2)}\n`, 'utf8');
      written.push(target.slice(ROOT.length + 1).replaceAll('\\', '/'));
    }
    process.stdout.write(JSON.stringify({ task: 'P3-F4-M50-02-50-SKILL-MACRO-MIGRATION-BATCH', count: cards.length, selectedIds, written }, null, 2));
    return;
  }
  process.stdout.write(JSON.stringify({ task: 'P3-F4-M50-02-50-SKILL-MACRO-MIGRATION-BATCH', count: cards.length, selectedIds, cards, archives }, null, 2));
}
if (process.argv[1] && resolve(process.argv[1]) === resolve(import.meta.filename)) void main();
