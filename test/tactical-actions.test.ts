import test from "node:test";
import assert from "node:assert/strict";
import { createGameState } from "../src/domain/state/createGameState.ts";
import { rankTacticalActions, tacticalKnowledge } from "../src/ai/tactical-actions.ts";
import { CommandType } from "../src/match-engine/commands.ts";
import type { AvailableAction } from "../src/application/integration-contract.ts";
import type { CardDefinition } from "../src/rules-core/content-types.ts";

const definitions: Record<string, CardDefinition> = {
  weak: { id: "weak", name: "轻击", cost: 1, basePower: 1, attributes: ["力量"] },
  strong: { id: "strong", name: "强击", cost: 3, basePower: 7, attributes: ["力量"] },
  enemy: { id: "enemy", name: "攻击", cost: 0, basePower: 5, attributes: ["力量"] },
};
const end: AvailableAction = { id: "end", commandType: CommandType.CompletePlayerWindow, label: "跳过" };
const sealPower: AvailableAction = { id: "seal-power", commandType: CommandType.UseCommandSeal, label: "增威", payload: { mode: "power" } };
const attack = (id: string, cards: string[]): AvailableAction => ({ id, commandType: CommandType.CommitAttack, label: id, payload: { faceUpInstanceIds: cards, faceDownInstanceIds: [] } });
function fixture() {
  const state = createGameState({ gameInstanceId: "tactics", players: [{ id: "bot", name: "人机" }, { id: "enemy", name: "玩家" }], seed: 1 });
  state.status = "playing"; state.round = 2; state.phase = "action"; state.step = "play-batch-draft"; state.activePlayerId = "bot";
  state.turnOrder = ["enemy", "bot"];
  for (const p of Object.values(state.players)) { p.locationId = "city"; p.mana = 6; p.identityRevealed = true; p.trueNameRevealed = true; }
  state.board.locations.city = ["enemy", "bot"];
  for (const [id, definitionId, owner, zone] of [["s", "strong", "bot", "hand"], ["w", "weak", "bot", "hand"], ["e", "enemy", "enemy", "attack"]]) {
    state.cards[id] = { instanceId: id, definitionId, ownerPlayerId: owner, controllerPlayerId: owner, zone, face: "up", active: zone === "attack", temporary: false, residual: false, modifiers: [] };
  }
  state.players.bot.hand = ["s", "w"]; state.players.enemy.attack = ["e"];
  return state;
}

test("选择能赢的强击，而不是按列表顺序先出弱牌", () => {
  const state = fixture(), choices = [attack("weak", ["w"]), attack("strong", ["s"]), end];
  assert.equal(rankTacticalActions(state, "bot", choices, definitions, [])[0].id, "strong");
});
test("一张牌能赢时保留第二张牌和魔力", () => {
  assert.equal(rankTacticalActions(fixture(), "bot", [attack("both", ["s", "w"]), attack("single", ["s"]), end], definitions, [])[0].id, "single");
});
test("无力翻盘时不把手牌全部白送", () => {
  const state = fixture();
  assert.equal(rankTacticalActions(state, "bot", [attack("both", ["s", "w"]), end], { ...definitions, enemy: { ...definitions.enemy, basePower: 30 } }, [])[0].id, "end");
});
test("无对手战场不浪费攻击牌", () => {
  const state = fixture(); state.players.enemy.locationId = "workshop"; state.board.locations.city = ["bot"]; state.board.locations.workshop = ["enemy"];
  assert.equal(rankTacticalActions(state, "bot", [attack("both", ["s", "w"]), end], definitions, [])[0].id, "end");
});
test("先手占空战场时防备后手从魔术工坊进入", () => {
  const state = fixture(); state.turnOrder = ["bot", "enemy"];
  state.players.enemy.locationId = "workshop"; state.players.enemy.hand = ["secret"];
  state.board.locations.city = ["bot"]; state.board.locations.workshop = ["enemy"];
  assert.equal(rankTacticalActions(state, "bot", [end, attack("guard", ["s"])], definitions, [])[0].id, "guard");
});
test("两处战场都明显打不过且魔力不足时先在工坊恢复", () => {
  const state = fixture(); state.phase = "outpost"; state.step = "player-window";
  state.players.bot.locationId = null; state.players.bot.mana = 0;
  state.players.enemy.locationId = "city"; state.board.locations.city = ["enemy"];
  state.players.second = { ...structuredClone(state.players.enemy), id: "second", locationId: "mountain", attack: ["e2"] };
  state.cards.e2 = { ...state.cards.e, instanceId: "e2", ownerPlayerId: "second", controllerPlayerId: "second" };
  state.board.locations.mountain = ["second"]; state.turnOrder.push("second");
  const actions = ["city", "mountain", "workshop"].map(locationId => ({ id: locationId, label: locationId, commandType: CommandType.DeployPlayer, payload: { locationId } }));
  assert.equal(rankTacticalActions(state, "bot", actions, { ...definitions, enemy: { ...definitions.enemy, basePower: 30 } }, [])[0].id, "workshop");
});
test("部署比较公开事件收益，避免固定选择魔术工坊", () => {
  const state = fixture(); state.phase = "outpost"; state.step = "player-window";
  for (const p of Object.values(state.players)) p.locationId = null;
  state.board.locations.city = []; state.board.currentEvents.city = ["reward"];
  const actions = ["workshop", "mountain", "city"].map(locationId => ({ id: locationId, label: locationId, commandType: CommandType.DeployPlayer, payload: { locationId } }));
  assert.equal(rankTacticalActions(state, "bot", actions, definitions, [{ id: "reward", victoryPoints: 8 }])[0].id, "city");
});
test("安全且收益更高时留在原地，不做固定顺序移动", () => {
  const state = fixture(); state.step = "move-decision"; state.players.enemy.locationId = "workshop"; state.board.locations.city = ["bot"]; state.board.locations.workshop = ["enemy"];
  const move = { id: "scout", label: "侦察", commandType: CommandType.MovePlayer, payload: { locationId: "scouting" } };
  assert.equal(rankTacticalActions(state, "bot", [move, end], definitions, [])[0].id, "end");
});
test("隐藏手牌、暗置牌、事件和 RNG 变化不改变判断，也不修改原状态", () => {
  const state = fixture(); state.cards.e.face = "down"; state.players.enemy.trueNameRevealed = false;
  state.players.enemy.hand = ["h"];
  state.cards.h = { ...state.cards.e, instanceId: "h", zone: "hand", face: "up", definitionId: "strong" };
  state.board.currentEvents.city = ["secret.one"]; state.board.eventVisibility["secret.one"] = "down";
  state.board.eventDeck = ["secret.two", "secret.three"];
  const before = structuredClone(state), actions = [attack("weak", ["w"]), attack("strong", ["s"]), end];
  const first = rankTacticalActions(state, "bot", actions, definitions, []).map(a => a.id);
  const other = structuredClone(state); other.cards.e.definitionId = "strong"; other.rng.state = 999; other.players.enemy.servantId = "secret-servant";
  other.cards.h.definitionId = "weak"; other.board.currentEvents.city = ["secret.two"];
  other.board.eventVisibility = { "secret.two": "down" }; other.board.eventDeck.reverse();
  assert.deepEqual(rankTacticalActions(other, "bot", actions, definitions, []).map(a => a.id), first);
  assert.equal(tacticalKnowledge(other, "bot").cards.e.definitionId, "ai:hidden");
  assert.equal(tacticalKnowledge(other, "bot").players.enemy.servantId, null);
  assert.deepEqual(state, before);
});
test("令咒补魔能把可用手牌变成胜局时会补魔", () => {
  const state = fixture(); state.players.bot.mana = 1;
  const mana = { id: "seal-mana", label: "补魔", commandType: CommandType.UseCommandSeal, payload: { mode: "mana" } };
  assert.equal(rankTacticalActions(state, "bot", [end, attack("weak", ["w"]), mana], definitions, [])[0].id, "seal-mana");
});
test("必败且没有有效手牌时不会随便耗费令咒补魔", () => {
  const state = fixture(); state.players.bot.hand = []; state.players.bot.mana = 1;
  const mana = { id: "seal-mana", label: "补魔", commandType: CommandType.UseCommandSeal, payload: { mode: "mana" } };
  assert.equal(rankTacticalActions(state, "bot", [mana, end], { ...definitions, enemy: { ...definitions.enemy, basePower: 30 } }, [])[0].id, "end");
});

test("同样能赢时留下高效强牌，消耗两张普通牌", () => {
  const state = fixture(); state.players.bot.hand = ["s", "w", "w2"];
  state.cards.w2 = { ...state.cards.w, instanceId: "w2" };
  const cards = { ...definitions, strong: { ...definitions.strong, cost: 1, basePower: 20 }, weak: { ...definitions.weak, basePower: 3 } };
  assert.equal(rankTacticalActions(state, "bot", [attack("valuable", ["s"]), attack("ordinary", ["w", "w2"]), end], cards, [])[0].id, "ordinary");
  // Near the end, banked card quality matters less than immediate costs.
  state.round = 11;
  assert.equal(rankTacticalActions(state, "bot", [attack("ordinary", ["w", "w2"]), attack("valuable", ["s"]), end], cards, [])[0].id, "valuable");
});

test("策略输入不含命令队列或其他玩家尚未处理的选择", () => {
  const state = fixture();
  state.effectQueue = [{ id: "private-player-action", payload: { selectedCards: ["secret"] } }] as never;
  state.scheduledEffects = [{ id: "private-future-action" }] as never;
  state.pendingDecision = { chooserPlayerIds: ["enemy"], submissions: { enemy: { cardIds: ["secret"] } } } as never;
  const knowledge = tacticalKnowledge(state, "bot");
  assert.deepEqual(knowledge.effectQueue, []);
  assert.deepEqual(knowledge.scheduledEffects, []);
  assert.equal(knowledge.pendingDecision, null);
});

test("自己的未来抽牌顺序也不用于规划", () => {
  const state = fixture(); state.players.bot.deck = ["next-strong", "next-weak"];
  const changed = structuredClone(state); changed.players.bot.deck.reverse();
  assert.deepEqual(tacticalKnowledge(state, "bot").players.bot.deck, ["unknown-deck:bot:0", "unknown-deck:bot:1"]);
  const choices = [attack("both", ["s", "w"]), end];
  assert.deepEqual(rankTacticalActions(state, "bot", choices, definitions, []), rankTacticalActions(changed, "bot", choices, definitions, []));
});

test("不能出手的牌不作为花令咒补魔的理由", () => {
  const state = fixture(); state.players.bot.mana = 1;
  const cards = Object.fromEntries(Object.entries(definitions).map(([id, card]) => [id, { ...card, tags: ["cannot-play"] }]));
  const mana = { id: "seal-mana", label: "补魔", commandType: CommandType.UseCommandSeal, payload: { mode: "mana" } };
  assert.equal(rankTacticalActions(state, "bot", [mana, end], cards, [])[0].id, "end");
});

test("50 组隐藏信息扰动不改变同一公开局面的策略排序", () => {
  const state = fixture(); state.cards.e.face = "down"; state.players.enemy.trueNameRevealed = false;
  state.players.enemy.hand = ["h"]; state.players.enemy.deck = ["d1", "d2"];
  state.cards.h = { ...state.cards.e, instanceId: "h", zone: "hand", definitionId: "strong" };
  const actions = [attack("weak", ["w"]), attack("strong", ["s"]), end];
  const expected = rankTacticalActions(state, "bot", actions, definitions, []).map(a => a.id);
  for (let i = 0; i < 50; i++) {
    const other = structuredClone(state);
    other.cards.h.definitionId = i % 2 ? "strong" : "weak";
    other.cards.e.definitionId = i % 3 ? "enemy" : "strong";
    other.players.enemy.deck = i % 2 ? ["d2", "d1"] : ["d1", "d2"];
    other.players.enemy.servantId = `secret-servant:${i}`;
    other.players.enemy.flags.privatePlannedAction = `unsubmitted:${i}`;
    other.rng.state = i * 197 + 11;
    other.effectQueue = [{ id: `private-queued-action:${i}` }] as never;
    other.pendingDecision = { chooserPlayerIds: ["enemy"], options: [], submissions: { enemy: { cardIds: i % 2 ? ["h"] : [] } } } as never;
    assert.deepEqual(rankTacticalActions(other, "bot", actions, definitions, []).map(a => a.id), expected, `hidden variant ${i}`);
  }
});

test("现有合法牌组足以获胜时不为首轮额外战果烧令咒", () => {
  const state = fixture(); state.round = 1;
  assert.equal(rankTacticalActions(state, "bot", [sealPower, attack("win", ["s", "w"]), end], definitions, [])[0].id, "win");
});

test("已经增威并且可获胜时不会继续堆第二枚令咒", () => {
  const state = fixture(); state.round = 1; state.players.bot.commandSeals = 2;
  state.players.bot.flags.commandSealRoundPowerBonus = 2;
  state.players.bot.flags.commandSealVictoryPointBonusRound = 1;
  state.players.bot.flags.commandSealVictoryPointBonus = 2;
  assert.equal(rankTacticalActions(state, "bot", [sealPower, attack("win", ["s", "w"]), end], definitions, [])[0].id, "win");
});

test("一枚增威令咒能把公开败局变成胜局时仍会用", () => {
  const state = fixture();
  const cards = { ...definitions, strong: { ...definitions.strong, basePower: 4 }, weak: { ...definitions.weak, basePower: 0 } };
  assert.equal(rankTacticalActions(state, "bot", [attack("lose", ["s", "w"]), sealPower, end], cards, [])[0].id, "seal-power");
});

test("没有后续轮次时愿意将令咒转换为可取得的战果", () => {
  const state = fixture(); state.round = 11;
  assert.equal(rankTacticalActions(state, "bot", [attack("win", ["s", "w"]), sealPower, end], definitions, [])[0].id, "seal-power");
});

test("魔力已满时不浪费令咒补魔", () => {
  const state = fixture(); state.players.bot.mana = 12;
  const mana = { id: "seal-mana", label: "补魔", commandType: CommandType.UseCommandSeal, payload: { mode: "mana" } };
  assert.equal(rankTacticalActions(state, "bot", [mana, attack("win", ["s", "w"]), end], definitions, [])[0].id, "win");
});

test("手里只有一张普通牌时不靠虚构单张攻击规划令咒翻盘", () => {
  const state = fixture(); state.players.bot.hand = ["s"];
  const cards = { ...definitions, strong: { ...definitions.strong, basePower: 4 } };
  assert.equal(rankTacticalActions(state, "bot", [sealPower, end], cards, [])[0].id, "end");
});
