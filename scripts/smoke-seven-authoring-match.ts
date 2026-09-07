import { readFile } from 'node:fs/promises';
import {
  advanceAbilityPhase,
  buildAuthoringAdapterReport,
  createSeededGameState,
  dispatchAbilityCommand,
  initializeAbilityRuntime,
  loadAuthoringJson,
  processAbilityEvent,
  projectAbilityState,
  resolveBattlefield,
  applyBattleScoring,
  type AuthoringPack,
  type LegalAction,
} from '../packages/rules/src/index';

const masterPaths = [
  'data/authoring/masters/master.kayneth.json',
  'data/authoring/masters/master.shinji.json',
  'data/authoring/masters/master.kiritsugu.json',
  'data/authoring/masters/master.maiya.json',
  'data/authoring/masters/master.gatou.json',
  'data/authoring/masters/master.irisviel.json',
  'data/authoring/masters/master.olga-marie.json',
];

const servantPaths = [
  'data/authoring/servants/servant.artoriac.json',
  'data/authoring/servants/servant.drake.json',
  'data/authoring/servants/servant.achilles.json',
  'data/authoring/servants/servant.artoria-alt.json',
  'data/authoring/servants/servant.ereshkigal.json',
  'data/authoring/servants/servant.tomoe.json',
  'data/authoring/servants/servant.kintoki.json',
];

function nextRandom(seed: number): () => number {
  let state = seed >>> 0 || 1;
  return () => {
    state ^= state << 13;
    state ^= state >>> 17;
    state ^= state << 5;
    return (state >>> 0) / 0x100000000;
  };
}

function shuffle<T>(items: T[], seed: number): T[] {
  const random = nextRandom(seed);
  const result = [...items];
  for (let i = result.length - 1; i > 0; i--) {
    const j = Math.floor(random() * (i + 1));
    [result[i], result[j]] = [result[j]!, result[i]!];
  }
  return result;
}

async function readArchive(path: string): Promise<any> {
  return JSON.parse(await readFile(path, 'utf8'));
}

function mergePacks(packs: AuthoringPack[]): AuthoringPack {
  const cards = Object.assign({}, ...packs.map(pack => pack.cards));
  return {
    cards,
    report: packs.flatMap(pack => pack.report),
    servantPackage: {
      id: 'authoring.seven-pair-smoke',
      name: 'Seven Pair Authoring Smoke Pack',
      class: 'Smoke',
      publicInformation: { type: 'merged_authoring_pack' },
      skillCards: Object.values(cards)
        .filter(card => card.cardType === 'servant_skill')
        .map(card => ({ id: card.id, name: card.name, printedText: '', cardFace: card.cardFace })),
      knownCardDefinitions: Object.values(cards)
        .map(card => ({ id: card.id, name: card.name, printedText: '', cardFace: card.cardFace })),
    },
  };
}

function startingZone(cardType: string): string | undefined {
  if (cardType === 'servant_skill' || cardType === 'master_skill' || cardType === 'command_spell') return 'skill';
  if (cardType === 'servant_attack' || cardType === 'basic_attack') return 'hand';
  return undefined;
}

function shouldStartInPlay(cardId: string): boolean {
  const generatedOnly = [
    'master.shinji.skill.false-attendant-book',
    'master.kayneth.deck.volumen-hydrargyrum',
    'master.kiritsugu.deck.origin-bullet',
    'master.maiya.deck.support-shot',
    'master.olga-marie.skill.chaldeas',
    'master.olga-marie.skill.trismegistus-grief',
  ];
  return !generatedOnly.includes(cardId);
}

function visibleScope(zone: string, ownerPlayerId: string) {
  return zone === 'field' || zone === 'master'
    ? { scope: 'public' as const }
    : { scope: 'owner_only' as const, ownerPlayerId };
}

function settleOpenWindows(state: ReturnType<typeof createSeededGameState>, max = 50): string[] {
  const settled: string[] = [];
  for (let i = 0; i < max; i++) {
    const windowOwner = state.players.find(player => projectAbilityState(state, player.id).responseWindow);
    if (!windowOwner) break;
    const view = projectAbilityState(state, windowOwner.id);
    const windowId = view.responseWindow?.id;
    if (!windowId) break;
    const result = dispatchAbilityCommand(state, windowOwner.id, { type: 'decline_this_window', windowId });
    settled.push(`${windowOwner.id}:${windowId}:${result.ok ? 'declined' : result.rejection?.code ?? 'failed'}`);
    if (!result.ok) break;
  }
  return settled;
}

function settlePendingDecisions(state: ReturnType<typeof createSeededGameState>, max = 50): string[] {
  const settled: string[] = [];
  for (let i = 0; i < max; i++) {
    const owner = state.players.find(player => projectAbilityState(state, player.id).pendingDecision);
    if (!owner) break;
    const view = projectAbilityState(state, owner.id);
    const decision = view.pendingDecision;
    if (!decision) break;
    const selectedIds = decision.candidates.slice(0, decision.min);
    const result = dispatchAbilityCommand(state, owner.id, { type: 'choose_target', decisionId: decision.id, selectedIds });
    settled.push(`${owner.id}:${decision.id}:${result.ok ? `selected:${selectedIds.join(',') || 'none'}` : result.rejection?.code ?? 'failed'}`);
    if (!result.ok) break;
  }
  return settled;
}

function settleAbilityQueues(state: ReturnType<typeof createSeededGameState>, max = 50): string[] {
  const settled: string[] = [];
  for (let i = 0; i < max; i++) {
    const before = settled.length;
    settled.push(...settlePendingDecisions(state, 1));
    settled.push(...settleOpenWindows(state, 1));
    if (settled.length === before) break;
  }
  return settled;
}

function assignRoundLocations(state: ReturnType<typeof createSeededGameState>, roundIndex: number): void {
  const pattern = roundIndex % 2 === 1
    ? ['miyama_town', 'miyama_town', 'shinto', 'shinto', 'miyama_town', 'shinto', 'recon']
    : ['shinto', 'miyama_town', 'miyama_town', 'shinto', 'shinto', 'miyama_town', 'magic_workshop'];
  for (const player of state.players) player.locationId = pattern[player.seat - 1] as any;
}

function seedRoundEvents(state: ReturnType<typeof createSeededGameState>, roundIndex: number): void {
  state.eventPlacements = [
    {
      locationId: 'miyama_town',
      eventCardId: 'event.waxing_moon_ritual.bloody_sunset',
      victoryPoints: 2,
      visibility: { scope: 'public' },
      battleModifiers: [
        {
          sourceId: 'event.waxing_moon_ritual.bloody_sunset',
          targetTag: '力量',
          value: 2,
        },
      ],
    },
    {
      locationId: 'shinto',
      eventCardId: 'event.waxing_moon_ritual.dark_current',
      victoryPoints: 3,
      visibility: { scope: 'hidden_until_trigger' },
      battleModifiers: [
        {
          sourceId: 'event.waxing_moon_ritual.dark_current',
          targetTag: '魔术',
          value: 2,
        },
      ],
    },
  ];
}

function playRound(state: ReturnType<typeof createSeededGameState>, roundIndex: number): Record<string, unknown> {
  assignRoundLocations(state, roundIndex);
  seedRoundEvents(state, roundIndex);
  state.round.roundNumber = roundIndex;
  const events: string[] = [];
  const actions: Array<Record<string, unknown>> = [];
  for (const player of state.players) {
    state.round.activePhase = 'action';
    state.round.prioritySeat = player.seat;
    for (let attempt = 0; attempt < 2; attempt++) {
      const legalActions = projectAbilityState(state, player.id).legalActions;
      const orderedActions = legalActions
        .filter(action => action.type === 'play_card')
        .concat(legalActions.filter(action => action.type === 'activate_ability'));
      if (!orderedActions.length) {
        actions.push({ playerId: player.id, attempt, status: 'no_action' });
        break;
      }
      let completed = false;
      const skipped = [];
      for (const action of orderedActions) {
        const result = dispatchAbilityCommand(state, player.id, action as any);
        events.push(...settleAbilityQueues(state));
        if (result.ok) {
          actions.push({ playerId: player.id, attempt, action, status: 'ok', ...(skipped.length ? { skipped } : {}) });
          completed = true;
          break;
        }
        skipped.push({ action, status: result.rejection?.code });
      }
      if (!completed) {
        actions.push({ playerId: player.id, attempt, status: 'no_successful_action', skipped });
        break;
      }
    }
  }

  const battles = [];
  advanceAbilityPhase(state, 'battle', roundIndex);
  events.push(...settleAbilityQueues(state));
  for (const battlefieldId of ['miyama_town', 'shinto'] as const) {
    const eventPlacementsBefore = state.eventPlacements
      .filter(placement => placement.locationId === battlefieldId)
      .map(placement => ({
        eventCardId: placement.eventCardId,
        visibility: placement.visibility.scope,
        victoryPoints: placement.victoryPoints,
        modifiers: placement.battleModifiers ?? [],
      }));
    const result = resolveBattlefield(state, { battlefieldId, revealHiddenEvents: true });
    Object.assign(state, result.nextState);
    events.push(...settleAbilityQueues(state));
    const eventPlacementsAfter = state.eventPlacements
      .filter(placement => placement.locationId === battlefieldId)
      .map(placement => ({
        eventCardId: placement.eventCardId,
        visibility: placement.visibility.scope,
        victoryPoints: placement.victoryPoints,
        modifiers: placement.battleModifiers ?? [],
      }));
    const latest = state.battleResults[state.battleResults.length - 1];
    battles.push(latest?.battlefieldId === battlefieldId
      ? {
          battlefieldId,
          winnerPlayerId: latest.winnerPlayerId,
          margin: latest.margin,
          eventsBefore: eventPlacementsBefore,
          eventsAfter: eventPlacementsAfter,
          eventModifierHits: latest.participantBreakdowns.flatMap(p =>
            p.modifiers
              .filter(modifier => modifier.source === 'event')
              .map(modifier => ({ playerId: p.playerId, label: modifier.label, value: modifier.value })),
          ),
          participants: latest.participantBreakdowns.map(p => ({ playerId: p.playerId, power: p.effectivePower })),
        }
      : { battlefieldId, winnerPlayerId: null, margin: 0, eventsBefore: eventPlacementsBefore, eventsAfter: eventPlacementsAfter, eventModifierHits: [], participants: [] });
  }
  const scoring = applyBattleScoring(state);
  Object.assign(state, scoring.nextState);
  advanceAbilityPhase(state, 'cleanup', roundIndex);
  advanceAbilityPhase(state, 'round_end', roundIndex);
  events.push(...settleAbilityQueues(state));
  return { round: roundIndex, actions, battles, settled: events };
}

async function main() {
  const seed = Number(process.argv[2] ?? 20260904);
  const rounds = Math.max(1, Math.min(5, Number(process.argv[3] ?? 3)));
  const masterArchives = await Promise.all(masterPaths.map(readArchive));
  const servantArchives = await Promise.all(servantPaths.map(readArchive));
  const archives = [...masterArchives, ...servantArchives];
  const packs = archives.map(loadAuthoringJson);
  const report = archives.map((archive, index) => buildAuthoringAdapterReport(packs[index]!, archive, [...masterPaths, ...servantPaths][index]!));
  const unsupportedByPath = report
    .map((next, index) => ({ path: [...masterPaths, ...servantPaths][index]!, unsupported: next.summary.unsupported }))
    .filter(next => next.unsupported > 0);
  const unsupported = unsupportedByPath.reduce((sum, next) => sum + next.unsupported, 0);

  const masters = shuffle(masterArchives, seed);
  const servants = shuffle(servantArchives, seed ^ 0x9e3779b9);
  const pairings = masters.map((master, index) => ({
    seat: index + 1,
    playerId: `p${index + 1}`,
    masterId: master.id,
    masterName: master.name,
    servantId: servants[index]!.id,
    servantName: servants[index]!.name,
  }));

  const pack = mergePacks(packs);
  const state = createSeededGameState({ activeSeats: [1, 2, 3, 4, 5, 6, 7] });
  state.cards = [];
  state.round.activePhase = 'action';
  state.round.prioritySeat = 1;
  for (const pairing of pairings) {
    const player = state.players.find(player => player.id === pairing.playerId)!;
    player.masterCardId = pairing.masterId;
    player.servantCardId = pairing.servantId;
    (player as any).commandSpells = 3;

    for (const archive of [masters[pairing.seat - 1]!, servants[pairing.seat - 1]!]) {
      for (const card of archive.cards) {
        const zone = startingZone(card.cardType);
        if (!zone || !shouldStartInPlay(card.id)) continue;
        state.cards.push({
          instanceId: `${pairing.playerId}-${card.id}`,
          definitionId: card.id,
          ownerPlayerId: pairing.playerId,
          controllerPlayerId: pairing.playerId,
          zone,
          visibility: visibleScope(zone, pairing.playerId),
        });
      }
    }
  }

  initializeAbilityRuntime(state, pack, { seed });
  processAbilityEvent(state, { id: 'smoke-game-start', type: 'game_start' });
  const gameStartSettled = settleAbilityQueues(state);
  const roundsLog = [];
  for (let round = 1; round <= rounds; round++) roundsLog.push(playRound(state, round));

  const modeState = (state as any).modeState ?? {};
  const output = {
    seed,
    pairings,
    adapter: {
      packs: archives.length,
      cards: Object.keys(pack.cards).length,
      unsupported,
      unsupportedByPath,
    },
    smoke: {
      gameStartEvents: state.abilityRuntime?.events.length ?? 0,
      gameStartSettled,
      rounds: roundsLog,
      masterDirectives: modeState.masterDirectives ?? [],
    },
    finalPlayers: state.players.map(player => ({
      id: player.id,
      seat: player.seat,
      masterCardId: player.masterCardId,
      servantCardId: player.servantCardId,
      mana: player.mana,
      vp: player.vp,
      commandSpells: (player as any).commandSpells ?? 3,
      handCount: state.cards.filter(card => card.ownerPlayerId === player.id && card.zone === 'hand').length,
      skillCount: state.cards.filter(card => card.ownerPlayerId === player.id && card.zone === 'skill').length,
    })),
  };

  console.log(JSON.stringify(output, null, 2));
}

void main();
