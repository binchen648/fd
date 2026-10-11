import rawContent from "../content/generated/legacy-content.json" with { type: "json" };
import boardArt from "../content/generated/battle-board-art.json" with { type: "json" };
import { GameApplication } from "../application/game-application.ts";
import { buildStandardContent, type LegacyContentPackage } from "../content/content-package.ts";
import { CommandType } from "../match-engine/commands.ts";
import type { AvailableAction } from "../application/integration-contract.ts";
import { createGameState } from "../domain/state/createGameState.ts";
import { applyThreeXPurchase, createThreeXBudgetForMaster, finalizeThreeXPurchases, type ThreeXPurchase } from "../rules-core/three-x-economy.ts";
import type { ThreeXModeState } from "../rules-core/three-x-state.ts";
import type { GameEvent } from "../domain/state/types.ts";
import { StateRandom } from "../match-engine/random.ts";
import { rankTacticalActions } from "../ai/tactical-actions.ts";
import { calculateCombatPower } from "../rules-core/combat-power.ts";
import { getMoonCellState } from "../rules-core/moon-cell.ts";
import { THREE_X_MASTER_RATINGS } from "../content/three-x-ratings.ts";
import playableRoster from "../content/generated/playable-roster.json" with { type: "json" };

// The picker is generated from the frozen F1–F5 migration record.  Keeping
// the manifest as the single source prevents a preview-only role from being
// selectable before its complete skill package is actually playable.
const MASTER_IDS = playableRoster.masterIds;
const SERVANT_IDS = playableRoster.servantIds;

type CharacterPreview = { sourceId?: string; name?: string; fullName?: string; class?: string; image?: string };
type DetailCatalog = { masters?: Record<string, CharacterPreview>; servants?: Record<string, CharacterPreview> };
type Listener = (snapshot: ReturnType<BrowserBattleRuntime["snapshot"]>) => void;
type RuntimeMode = "standard" | "three-x";
type ThreeXPurchaseCounts = Partial<Record<ThreeXPurchase, number>>;
type RuntimeOptions = { master?: string; servant?: string; seed?: number; mode?: string; threeXPurchases?: ThreeXPurchaseCounts };
type StandardContent = ReturnType<typeof buildStandardContent>;

let preparedContent: StandardContent | undefined;
let preparationPromise: Promise<void> | undefined;

function playableContentSource(): LegacyContentPackage {
  const masterIds = new Set<string>(MASTER_IDS);
  const servantIds = new Set<string>(SERVANT_IDS);
  return {
    masters: (rawContent.masters ?? [])
      .filter((master) => masterIds.has(master.id))
      // Keep the authored skill definitions in the playable package.  The
      // previous preview-only shell removed every skill here, which meant
      // the engine could never seed a player's skill zone or expose a
      // `skill.use` action during an actual match.
      .map((master) => ({ ...master, skills: master.skills ?? [] })),
    servants: (rawContent.servants ?? [])
      .filter((servant) => servantIds.has(servant.id))
      .map((servant) => ({ ...servant, skills: servant.skills ?? [] })),
    cards: (rawContent.cards ?? []).filter((card) => card.cardType !== "skill" && card.isSkill !== true),
    situations: rawContent.situations ?? [],
    eventGroups: (rawContent.eventGroups ?? []).filter((group) => group.id === "event-group.fuyuki" || group.name.includes("冬木")),
    civilizationRuins: [],
  };
}

function standardContent(): StandardContent {
  if (!preparedContent) {
    // `buildStandardContent` materializes authored skills as executable card
    // definitions.  Do not strip those definitions after building them: the
    // browser UI and the match engine both use the same registry to determine
    // which skill actions are legal.
    preparedContent = Object.freeze(buildStandardContent(playableContentSource()));
  }
  return preparedContent;
}

function prepareStandardContent(): Promise<void> {
  if (preparedContent) return Promise.resolve();
  if (preparationPromise) return preparationPromise;
  preparationPromise = new Promise<void>((resolve, reject) => {
    window.setTimeout(() => {
      try {
        standardContent();
        resolve();
      } catch (error) {
        preparationPromise = undefined;
        reject(error);
      }
    }, 0);
  });
  return preparationPromise;
}

declare global {
  interface Window {
    FDCodexDetailData?: DetailCatalog;
    FDBattleRuntime?: {
      create(options?: RuntimeOptions): BrowserBattleRuntime;
      prepare(): Promise<void>;
      isPrepared(): boolean;
      masterCrystalRating(name: string): number;
    };
  }
}

function previewBySourceId(kind: "masters" | "servants", sourceId: string): CharacterPreview | undefined {
  return Object.values(window.FDCodexDetailData?.[kind] ?? {}).find((entry) => entry.sourceId === sourceId);
}

function selectedSourceId(kind: "masters" | "servants", requested: string | undefined, allowed: readonly string[]): string {
  const catalog = window.FDCodexDetailData?.[kind] ?? {};
  const direct = requested ? catalog[requested]?.sourceId : undefined;
  if (direct && allowed.includes(direct)) return direct;
  const byName = Object.values(catalog).find((entry) => entry.name === requested || entry.fullName === requested)?.sourceId;
  return byName && allowed.includes(byName) ? byName : allowed[0];
}

function orderedWithSelected(allowed: readonly string[], selected: string): string[] {
  return [selected, ...allowed.filter((id) => id !== selected)];
}

function decisionPayload(action: AvailableAction): unknown {
  if (action.commandType !== CommandType.ResolveDecision) return action.payload ?? {};
  const options = action.input?.options?.filter((option) => !option.disabled) ?? [];
  return {
    ...(action.payload && typeof action.payload === "object" ? action.payload : {}),
    selections: options.slice(0, action.input?.min ?? 1).map((option) => option.id),
  };
}

function randomizeStartingPlayer(state: ReturnType<typeof createGameState>): void {
  if (state.turnOrder.length < 2) return;
  const offset = new StateRandom().integer(state, state.turnOrder.length);
  state.turnOrder = [...state.turnOrder.slice(offset), ...state.turnOrder.slice(0, offset)];
}

function computerActionDelay(events: unknown[]): number {
  const types = new Set(events.flatMap((event) => event && typeof event === "object" && "type" in event ? [String(event.type)] : []));
  if (types.has("card.played") || types.has("attack.committed")) return 520;
  if (types.has("player.deployed") || types.has("player.moved")) return 420;
  if (types.has("combat.resolved") || types.has("round.started")) return 360;
  return 110;
}

export class BrowserBattleRuntime {
  readonly playerId = "p1";
  readonly assignments: Array<{ playerId: string; masterId: string; servantId: string }>;
  readonly app: GameApplication;
  readonly definitions: ReturnType<GameApplication["cardDefinitions"]>;
  readonly #content: ReturnType<typeof standardContent>;
  #sequence = 0;
  #listeners = new Set<Listener>();
  #lastEvents: unknown[] = [];
  #eventLog: GameEvent[] = [];
  #aiPumping = false;
  #disposed = false;
  #aiTimer: number | undefined;

  constructor(options: RuntimeOptions = {}) {
    const mode: RuntimeMode = options.mode === "3x" || options.mode === "three-x" || options.mode === "threeX" ? "three-x" : "standard";
    const allContent = standardContent();
    const masterPool = [...MASTER_IDS];
    const servantPool = [...SERVANT_IDS];
    const selectedMaster = selectedSourceId("masters", options.master, masterPool);
    const selectedServant = selectedSourceId("servants", options.servant, servantPool);
    const masters = orderedWithSelected(masterPool, selectedMaster).slice(0, 7);
    const servants = orderedWithSelected(servantPool, selectedServant).slice(0, 7);
    this.assignments = masters.map((masterId, index) => ({ playerId: `p${index + 1}`, masterId, servantId: servants[index] }));

    const fuyukiGroups = (allContent.eventGroups ?? []).filter((group) => group.id === "event-group.fuyuki" || group.name.includes("冬木"));
    if (fuyukiGroups.length !== 1) throw new Error("FUYUKI_EVENT_GROUP_REQUIRED");
    const content = {
      ...allContent,
      eventGroups: fuyukiGroups,
      threeXMasterPool: masterPool,
      threeXMasterRatings: Object.fromEntries(masterPool.map((id) => [id, allContent.threeXMasterRatings?.[id] ?? 4])),
    };
    this.#content = content;
    const gameInstanceId = `local-${Date.now().toString(36)}`;
    const players = this.assignments.map(({ playerId }, index) => ({ id: playerId, name: index === 0 ? "玩家" : `电脑玩家 ${index}` }));
    if (mode === "three-x") {
      const state = createGameState({ gameInstanceId, players, seed: options.seed ?? Date.now(), mode: "three-x" });
      randomizeStartingPlayer(state);
      const threeX = state.modeState.threeX as ThreeXModeState;
      threeX.setupPhase = "complete";
      threeX.turnOrderLocked = true;
      threeX.selectedMasterIds = Object.fromEntries(this.assignments.map((entry) => [entry.playerId, entry.masterId]));
      threeX.selectedServantIds = Object.fromEntries(this.assignments.map((entry) => [entry.playerId, entry.servantId]));
      threeX.banCommittedPlayerIds = [...threeX.playerIds];
      threeX.purchaseCommittedPlayerIds = [...threeX.playerIds];
      for (const entry of this.assignments) {
        const budget = createThreeXBudgetForMaster(entry.masterId, content.threeXMasterRatings ?? {});
        if (entry.playerId === this.playerId) {
          for (const [purchase, rawCount] of Object.entries(options.threeXPurchases ?? {}) as Array<[ThreeXPurchase, number]>) {
            const count = Math.max(0, Math.floor(Number(rawCount) || 0));
            for (let index = 0; index < count; index += 1) applyThreeXPurchase(budget, purchase);
          }
        }
        finalizeThreeXPurchases(budget);
        threeX.budgets[entry.playerId] = budget;
      }
      this.app = new GameApplication({ state, content });
    } else {
      const state = createGameState({ gameInstanceId, players, seed: options.seed ?? Date.now(), mode });
      randomizeStartingPlayer(state);
      this.app = new GameApplication({ state, content });
      for (const assignment of this.assignments) {
        this.#send(assignment.playerId, CommandType.AssignIdentity, { masterId: assignment.masterId, servantId: assignment.servantId });
      }
    }
    this.definitions = this.app.cardDefinitions();
    for (const [id, imageKey] of Object.entries(boardArt)) {
      if (this.definitions[id]) this.definitions[id].presentation = { ...this.definitions[id].presentation, imageKey };
    }
    const started = this.#send("host", CommandType.StartStandardGame, {});
    if (!started.ok) throw new Error(started.rejection.code);
    this.#scheduleComputerPlayers();
  }

  snapshot() {
    const view = this.app.viewFor(this.playerId);
    const definitions = this.definitions;
    const roster = this.assignments.map((assignment) => {
      const player = view.players[assignment.playerId];
      const master = previewBySourceId("masters", assignment.masterId) ?? { sourceId: assignment.masterId, name: assignment.masterId };
      const servant = previewBySourceId("servants", assignment.servantId) ?? { sourceId: assignment.servantId, name: assignment.servantId };
      return { ...assignment, player, master, servant };
    });
    const availableActions = this.#localAvailableActions();
    const deploymentRequired = view.phase === "outpost" && availableActions.some((action) => action.commandType === CommandType.DeployPlayer);
    const actions = deploymentRequired
      ? availableActions.filter((action) => action.commandType !== CommandType.CompletePlayerWindow)
      : availableActions;
    return {
      view,
      actions,
      draftAttackActions: this.#draftAttackActions(),
      movementUnavailableReason: actions.some(action => action.commandType === CommandType.MovePlayer) ? "" : this.#movementUnavailableReason(),
      definitions,
      combatPowers: this.#visibleCombatPowers(view),
      moonCell: getMoonCellState(this.app.state),
      roster,
      events: structuredClone(this.#lastEvents),
      eventLog: structuredClone(this.#eventLog),
      victory: this.app.victoryStatus(),
      approvedEventGroupId: "event-group.fuyuki",
    };
  }

  subscribe(listener: Listener): () => void {
    if (this.#disposed) return () => {};
    this.#listeners.add(listener);
    listener(this.snapshot());
    return () => this.#listeners.delete(listener);
  }

  dispose(): void {
    this.#disposed = true;
    if (this.#aiTimer !== undefined) window.clearTimeout(this.#aiTimer);
    this.#aiTimer = undefined;
    this.#listeners.clear();
  }

  dispatch(actionId: string, selections?: string[], payloadOverride?: unknown): ReturnType<BrowserBattleRuntime["snapshot"]> {
    if (this.#disposed) throw new Error("MATCH_CLOSED");
    let action = this.#localAvailableActions().find((candidate) => candidate.id === actionId);
    if (!action) {
      const draft = this.#draftAttackActions().find((candidate) => candidate.id === actionId);
      if (draft) {
        // Selecting cards is only a UI draft. Commit the decision to stay put
        // together with the validated attack when the player confirms it.
        const completed = this.#send(this.playerId, CommandType.CompletePlayerWindow, {});
        if (!completed.ok) throw new Error(completed.rejection.code);
        action = draft;
      }
    }
    if (!action) throw new Error("ACTION_NOT_AVAILABLE");
    // Structured skill choices (for example Rin's 宝石) are selected in the
    // battle UI after the legal action is exposed.  Keep the action id as the
    // authority check, while allowing the UI to provide the validated choice
    // payload for that same legal action.
    let payload: unknown = payloadOverride === undefined ? action.payload ?? {} : structuredClone(payloadOverride);
    if (action.commandType === CommandType.ResolveDecision) payload = {
      ...(payload && typeof payload === "object" ? payload : {}),
      selections: selections ?? [],
    };
    const observingSettlement = this.app.state.players[this.playerId]?.eliminated === true
      && [CommandType.ResolveCombat, CommandType.EndRound].includes(action.commandType as typeof CommandType.ResolveCombat | typeof CommandType.EndRound);
    const result = this.#send(observingSettlement ? "host" : this.playerId, action.commandType, payload);
    if (!result.ok) throw new Error(result.rejection.code);
    if (action.commandType === CommandType.DeployPlayer || action.commandType === CommandType.CommitAttack) {
      const complete = this.app.availableActionsFor(this.playerId).find((candidate) => candidate.commandType === CommandType.CompletePlayerWindow);
      if (complete) {
        const completed = this.#send(this.playerId, complete.commandType, complete.payload ?? {});
        if (!completed.ok) throw new Error(completed.rejection.code);
      }
    }
    this.#emit();
    this.#scheduleComputerPlayers();
    return this.snapshot();
  }

  autoAct(): ReturnType<BrowserBattleRuntime["snapshot"]> {
    const snapshot = this.snapshot();
    const actions = snapshot.actions;
    const decision = actions.find((action) => action.commandType === CommandType.ResolveDecision);
    if (decision) {
      const selections = (decision.input?.options ?? [])
        .filter((option) => !option.disabled)
        .slice(0, decision.input?.min ?? 1)
        .map((option) => option.id);
      return this.dispatch(decision.id, selections);
    }

    const priority = [
      CommandType.DeployPlayer,
      CommandType.MovePlayer,
      CommandType.CommitAttack,
      CommandType.ResolveCombat,
      CommandType.CompleteCombatResponse,
      CommandType.EndRound,
      CommandType.CompletePlayerWindow,
    ];
    for (const commandType of priority) {
      const candidates = actions.filter((action) => action.commandType === commandType);
      if (!candidates.length) continue;
      if (commandType === CommandType.CommitAttack) {
        const definitions = snapshot.definitions;
        candidates.sort((left, right) => {
          const score = (action: AvailableAction) => [
            ...((action.payload as { faceUpInstanceIds?: string[] })?.faceUpInstanceIds ?? []),
            ...((action.payload as { faceDownInstanceIds?: string[] })?.faceDownInstanceIds ?? []),
          ].reduce((sum, instanceId) => {
            const definitionId = snapshot.view.cards[instanceId]?.definitionId;
            return sum + Number(definitionId ? definitions[definitionId]?.basePower ?? 0 : 0);
          }, 0);
          return score(right) - score(left);
        });
      }
      return this.dispatch(candidates[0].id);
    }
    throw new Error("NO_AUTOMATIC_ACTION_AVAILABLE");
  }

  save(): string { return this.app.save(); }

  #draftAttackActions(): AvailableAction[] {
    const state = this.app.state;
    if (state.activePlayerId !== this.playerId || state.phase !== "action" || state.step !== "move-decision") return [];
    const draft = new GameApplication({ state, content: this.#content });
    try {
      draft.dispatch({ commandId: `draft:${state.revision}`, gameInstanceId: state.gameInstanceId,
        actorId: this.playerId, expectedRevision: state.revision, type: CommandType.CompletePlayerWindow, payload: {} });
      return draft.availableActionsFor(this.playerId)
        .filter(action => action.commandType === CommandType.CommitAttack)
        .map(action => ({ ...action, id: `draft:${action.id}` }));
    } catch { return []; }
  }

  #movementUnavailableReason(): string {
    const state = this.app.state;
    if (state.phase !== "action" || state.step !== "move-decision") return "";
    if (state.activePlayerId !== this.playerId) return "等待其他玩家行动";
    const codes: string[] = [];
    for (const locationId of ["workshop", "mountain", "city", "scouting"]) {
      if (locationId === state.players[this.playerId]?.locationId) continue;
      try {
        new GameApplication({ state, content: this.#content }).dispatch({
          commandId: `move-preview:${state.revision}:${locationId}`, gameInstanceId: state.gameInstanceId,
          actorId: this.playerId, expectedRevision: state.revision, type: CommandType.MovePlayer, payload: { locationId },
        });
      } catch (error) { codes.push(error instanceof Error ? error.message.split(":", 1)[0] : ""); }
    }
    if (codes.includes("ENGAGED_CANNOT_MOVE")) return "交战中：同一战场有对手，不能常规移动";
    if (codes.includes("PLAYER_DEFEATED")) return "败北状态下不能常规移动";
    if (codes.includes("PLAYER_MOVEMENT_BLOCKED") || codes.some(code => code.startsWith("MOVEMENT_BLOCKED"))) return "当前效果禁止常规移动";
    if (codes.some(code => /MANA|COST/.test(code))) return "魔力不足，无法支付移动成本";
    return "当前没有合法的移动地点";
  }

  #visibleCombatPowers(view: ReturnType<GameApplication["viewFor"]>): Record<string, number> {
    // Display-only independent copy. GameApplication.state also returns a clone;
    // none of these visibility adjustments are dispatched to the actual game.
    const displayState = structuredClone(this.app.state);
    for (const card of Object.values(displayState.cards)) {
      if (!view.cards[card.instanceId]?.definitionId) { card.active = false; card.definitionId = "hidden"; }
    }
    for (const locationId of Object.keys(displayState.board.currentEvents)) {
      displayState.board.currentEvents[locationId] = (displayState.board.currentEvents[locationId] ?? [])
        .filter(id => displayState.board.eventVisibility[id] === "up");
    }
    return Object.fromEntries(Object.values(displayState.players).map(player => [player.id,
      player.attack.length && player.locationId && !player.eliminated ? calculateCombatPower(displayState, player, this.definitions, player.locationId) : 0]));
  }

  #send(actorId: string, type: string, payload: unknown) {
    const state = this.app.state;
    try {
      const result = this.app.dispatch({
        commandId: `browser:${this.#sequence++}`,
        gameInstanceId: state.gameInstanceId,
        actorId,
        expectedRevision: state.revision,
        type,
        payload,
      });
      this.#lastEvents = structuredClone(result.events);
      this.#eventLog.push(...structuredClone(result.events));
      return { ok: true as const, events: result.events };
    } catch (error) {
      const code = error instanceof Error ? error.message.split(":", 1)[0] : "COMMAND_REJECTED";
      return { ok: false as const, events: [], rejection: { code } };
    }
  }

  #localAvailableActions(): AvailableAction[] {
    const state = this.app.state;
    if (!state.players[this.playerId]?.eliminated) return this.app.availableActionsFor(this.playerId);
    // Eliminated local players keep the region-by-region viewing controls.
    // Only public settlement commands are forwarded by the local match host;
    // no living player's moves, cards, skills or private choices are exposed.
    if (state.phase !== "combat" || state.step !== "settlement" || state.pendingDecision) return [];
    const observerSource = state.turnOrder.find(id => !state.players[id]?.eliminated);
    return observerSource ? this.app.availableActionsFor(observerSource).filter(action =>
      action.commandType === CommandType.ResolveCombat || action.commandType === CommandType.EndRound) : [];
  }

  #scheduleComputerPlayers(): void {
    if (this.#disposed || this.#aiPumping) return;
    this.#aiPumping = true;
    this.#aiTimer = window.setTimeout(async () => {
      this.#aiTimer = undefined;
      try {
        await this.#pumpComputerPlayers();
      } catch (error) {
        console.error(error);
      } finally {
        this.#aiPumping = false;
        this.#emit();
      }
    }, 0);
  }

  async #pumpComputerPlayers(): Promise<void> {
    for (let guard = 0; guard < 300; guard += 1) {
      if (this.#disposed) return;
      const state = this.app.state;
      const pendingActor = state.pendingDecision?.chooserPlayerIds.find((id) => state.pendingDecision?.submissions[id] === undefined);
      const actorId = pendingActor ?? state.activePlayerId;
      if (!actorId || actorId === this.playerId || state.status === "finished") return;
      const candidates: Array<{ type: string; payload: unknown }> = [];
      if (pendingActor) {
        const action = this.app.availableActionsFor(actorId).find((candidate) => candidate.commandType === CommandType.ResolveDecision);
        if (action) candidates.push({ type: action.commandType, payload: decisionPayload(action) });
      } else {
        const supported = new Set<string>([CommandType.DeployPlayer, CommandType.MovePlayer,
          CommandType.CommitAttack, CommandType.UseSkill, CommandType.UseCommandSeal,
          CommandType.CompletePlayerWindow, CommandType.CompleteCombatResponse]);
        const legal = this.app.availableActionsFor(actorId).filter(action => supported.has(action.commandType));
        const ranked = rankTacticalActions(state, actorId, legal, this.definitions, this.#content.events ?? []);
        for (const action of ranked) candidates.push({ type: action.commandType, payload: action.payload ?? {} });
      }
      candidates.push({ type: CommandType.CompletePlayerWindow, payload: {} });
      let acceptedEvents: unknown[] | undefined;
      for (const candidate of candidates) {
        const result = this.#send(actorId, candidate.type, candidate.payload);
        if (result.ok) { acceptedEvents = result.events; break; }
      }
      if (!acceptedEvents) return;
      this.#lastEvents = acceptedEvents;
      this.#emit();
      await new Promise<void>((resolve) => window.setTimeout(resolve, computerActionDelay(acceptedEvents)));
    }
    throw new Error("AI_ACTION_GUARD_EXCEEDED");
  }

  #emit(): void {
    if (this.#disposed) return;
    const snapshot = this.snapshot();
    for (const listener of this.#listeners) listener(snapshot);
  }
}

window.FDBattleRuntime = {
  create: (options) => new BrowserBattleRuntime(options),
  prepare: prepareStandardContent,
  isPrepared: () => preparedContent !== undefined,
  masterCrystalRating: (name: string) => {
    const id = selectedSourceId("masters", name, MASTER_IDS);
    return THREE_X_MASTER_RATINGS[id] ?? 4;
  },
};

