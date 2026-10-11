import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { buildStandardContent } from "../src/content/content-package.ts";
import { createGameState } from "../src/domain/state/createGameState.ts";
import { createOwnedCardInstance } from "../src/rules-core/decks.ts";
import { calculateCombatPower } from "../src/rules-core/combat-power.ts";
import { resolveCombat } from "../src/rules-core/combat.ts";
import { gainMana, adjustVictoryPoints, setMana, restoreManaUnpreventable } from "../src/rules-core/resources.ts";
import { projectPublicState } from "../src/projection/project-state.ts";
import { initializeSituationDeck } from "../src/rules-core/situation-setup.ts";
import { StandardMatchEngine } from "../src/match-engine/standard-match-engine.ts";
import { CommandType } from "../src/match-engine/commands.ts";
import { FUYUKI_EFFECT_TAGS } from "../src/rules-core/fuyuki-objectives.ts";
import { SkillRegistry } from "../src/rules-core/skill-registry.ts";
import type { SkillHandler, SkillDefinition } from "../src/rules-core/skill-types.ts";
import { movePlayerByEffect } from "../src/rules-core/board.ts";
import { addCardToAttack } from "../src/rules-core/card-play.ts";
import type { CardDefinition } from "../src/rules-core/content-types.ts";

const raw = JSON.parse(readFileSync(new URL("../src/content/generated/legacy-content.json", import.meta.url), "utf8"));
const content = buildStandardContent({ ...raw, masters: [], servants: [], cards: raw.cards.filter((c: { isSkill?: boolean }) => !c.isSkill), eventGroups: raw.eventGroups.filter((g: { id: string }) => g.id === "event-group.fuyuki"), civilizationRuins: [] });
const events = Object.fromEntries(content.events.map(e => [e.id, e]));
function fixture(ids: number[] = [], powers = [2, 3]) {
  const state = createGameState({ gameInstanceId: "fuyuki-regression", players: [{ id: "p1", name: "一" }, { id: "p2", name: "二" }], seed: 4 });
  const cards: Record<string, CardDefinition> = { ...content.cards, ...events };
  state.status = "playing"; state.round = 1; state.phase = "combat"; state.step = "settlement"; state.activePlayerId = null;
  state.players.p1.locationId = "mountain"; state.board.locations.mountain = ["p1"]; state.players.p1.mana = 6;
  state.board.currentEvents.mountain = ids.map(id => `event.fuyuki.${id}`);
  for (const id of state.board.currentEvents.mountain) state.board.eventVisibility[id] = "up";
  powers.forEach((power, i) => {
    cards[`test.${i}`] = { id: `test.${i}`, cost: 0, basePower: power, attributes: ["力量"] };
    createOwnedCardInstance(state, "p1", { instanceId: `i${i}`, definitionId: `test.${i}`, zone: "attack", active: true, face: "up" });
  });
  return { state, cards };
}
function execute(state: ReturnType<typeof createGameState>, cards: Record<string, CardDefinition>, type: string, payload = {}) {
  return new StandardMatchEngine({ ...content, cards }).execute(state, { commandId: `test-${state.revision}`, gameInstanceId: state.gameInstanceId, expectedRevision: state.revision, actorId: state.activePlayerId ?? "host", type, payload });
}

test("魔力默认上限12，显式较高上限保留，战果损失报告实际扣除值", () => {
  const { state } = fixture(); const player = state.players.p1;
  player.mana = 11; assert.equal(gainMana(player, 4), 1); assert.equal(player.mana, 12);
  setMana(player, 20); assert.equal(player.mana, 12);
  assert.equal(restoreManaUnpreventable(player, 3), 0);
  player.flags.manaCap = 20; assert.equal(gainMana(player, 4), 4);
  player.victoryPoints = 2; assert.equal(adjustVictoryPoints(player, -5), -2); assert.equal(player.victoryPoints, 0);
});
test("二十张冬木事件都有结构化属性加成或明确效果标签", () => {
  assert.equal(content.events.length, 20);
  for (const event of content.events) assert.ok(event.combatPower || FUYUKI_EFFECT_TAGS[event.id], event.id);
});
test("重复事件效果叠加，暗置事件不提前影响合计威力", () => {
  const { state, cards } = fixture([14, 15]);
  assert.equal(calculateCombatPower(state, state.players.p1, cards, "mountain"), 15);
  state.board.eventVisibility["event.fuyuki.15"] = "down";
  assert.equal(calculateCombatPower(state, state.players.p1, cards, "mountain"), 10);
  state.players.p1.trueNameRevealed = true;
  assert.equal(calculateCombatPower(state, state.players.p1, cards, "mountain"), 5);
});
test("铤而走险并列末位各加12，下一位按跳位排名只加4", () => {
  const { state, cards } = fixture([2]);
  state.players.p2.victoryPoints = 0;
  state.players.p3 = structuredClone(state.players.p2); state.players.p3.id = "p3"; state.players.p3.victoryPoints = 1;
  assert.equal(calculateCombatPower(state, state.players.p1, cards, "mountain"), 17);
  state.players.p1.victoryPoints = 1;
  state.players.p3.victoryPoints = 0;
  assert.equal(calculateCombatPower(state, state.players.p1, cards, "mountain"), 9);
});
test("归零地只移除战场位置提供的地利，保留能力给予的额外地利", () => {
  const { state, cards } = fixture([9]); const player = state.players.p1;
  player.flags.deploymentBonusActive = true; player.flags.deploymentLocationId = "mountain"; player.flags.deploymentBonus = 3;
  player.flags.roundTerrainAdvantageBonusRound = 1; player.flags.roundTerrainAdvantageBonusLocationId = "mountain"; player.flags.roundTerrainAdvantageBonus = 2;
  assert.equal(calculateCombatPower(state, player, cards, "mountain"), 7);
});
test("排名事件冻结结算前战果，先结算深山町不会改变新都加成", () => {
  const { state, cards } = fixture([1]);
  state.players.p2.locationId = "city"; state.board.locations.city = ["p2"];
  state.board.currentEvents.city = ["event.fuyuki.2"]; state.board.eventVisibility["event.fuyuki.2"] = "up";
  state.players.p1.victoryPoints = 0; state.players.p2.victoryPoints = 1;
  resolveCombat(state, "mountain", cards, events);
  assert.equal(state.players.p1.victoryPoints, 5);
  assert.equal(calculateCombatPower(state, state.players.p2, cards, "city"), 8);
});
test("战斗失利保留回合威力并不赋予败退，回合清理后再移除威力", () => {
  const { state, cards } = fixture();
  state.players.p2.locationId = "mountain"; state.board.locations.mountain.push("p2");
  state.players.p1.flags.roundPowerBonus = 3; state.players.p1.flags.commandSealRoundPowerBonus = 4;
  resolveCombat(state, "mountain", cards, events);
  assert.equal(state.players.p2.defeated, false);
  assert.equal(state.players.p1.flags.roundPowerBonus, 3);
  assert.equal(state.players.p1.flags.commandSealRoundPowerBonus, 4);
  state.modeState.resolvedCombats = ["mountain", "city"];
  const result = execute(state, cards, CommandType.EndRound).state;
  assert.equal(result.players.p1.flags.roundPowerBonus, undefined);
  assert.equal(result.players.p1.flags.commandSealRoundPowerBonus, undefined);
});
test("地脉在战斗后、移出地图前结算，遏制威胁不凭空转为魔力", () => {
  const { state, cards } = fixture([19, 20]);
  resolveCombat(state, "mountain", cards, events); assert.equal(state.players.p1.mana, 6);
  state.modeState.resolvedCombats = ["mountain", "city"];
  assert.equal(execute(state, cards, CommandType.EndRound).state.players.p1.mana, 10);
  const other = fixture([13]); other.state.players.p1.commandSeals = 3;
  resolveCombat(other.state, "mountain", other.cards, events); assert.equal(other.state.players.p1.mana, 6);
});
test("完成阶段动作与执行器同时阻止未部署和合法攻击跳过，空手可结束", () => {
  const { state, cards } = fixture(); const engine = new StandardMatchEngine({ ...content, cards });
  state.activePlayerId = "p1"; state.phase = "outpost"; state.step = "player-window";
  state.players.p1.locationId = null; state.board.locations.mountain = [];
  assert.ok(!engine.getLegalActions(state, "p1").some(a => a.type === CommandType.CompletePlayerWindow));
  assert.throws(() => execute(state, cards, CommandType.CompletePlayerWindow), /MANDATORY_PHASE_ACTION_REQUIRED/);
  state.players.p1.locationId = "mountain"; state.board.locations.mountain = ["p1"];
  state.phase = "action"; state.step = "play-batch-draft";
  for (const id of state.players.p1.attack) { state.cards[id].zone = "hand"; state.cards[id].active = false; state.cards[id].face = "down"; }
  state.players.p1.hand = [...state.players.p1.attack]; state.players.p1.attack = [];
  assert.throws(() => execute(state, cards, CommandType.CompletePlayerWindow), /MANDATORY_PHASE_ACTION_REQUIRED/);
  state.players.p1.hand = [];
  assert.doesNotThrow(() => execute(state, cards, CommandType.CompletePlayerWindow));
});
test("烧毁局势继续隐藏，正常使用后的局势弃牌公开", () => {
  const { state } = fixture(); initializeSituationDeck(state, content.situations, () => 0);
  state.board.situationDiscard.push("public.used");
  const projected = projectPublicState(state);
  assert.equal(projected.board.situationDiscard.at(-1), "public.used");
  for (const id of state.board.burnedSituationIds ?? []) assert.ok(!projected.board.situationDiscard.includes(id));
});
test("战斗后能力看见原战场，回合结束能力看见清理后的地图与牌区", () => {
  const { state, cards } = fixture([19]); const seen: string[] = []; const skills = new SkillRegistry();
  state.players.p1.masterId = "master.order";
  const skillId = "master.order.skill.cleanup";
  const skill: SkillDefinition = { id: skillId, name: "时序检查", ownerType: "master", ownerId: "master.order", activation: "passive", windows: [], cost: 0, text: "", supportLevel: "FULL", passiveEventTypes: ["combat.ending", "round.ending"] };
  const handler: SkillHandler = ({ state: current, payload }) => {
    const type = (payload as { eventType: string }).eventType; seen.push(type);
    if (type === "combat.ending") {
      assert.equal(current.players.p1.locationId, "mountain"); assert.equal(current.players.p1.attack.length, 2);
    } else {
      assert.equal(current.players.p1.locationId, null); assert.equal(current.players.p1.attack.length, 0);
      assert.equal(current.board.currentEvents.mountain.length, 0); assert.equal(current.players.p1.mana, 8);
    }
  };
  skills.register(skill, handler);
  cards[skillId] = { id: skillId, isSkill: true, skillOwnerType: "master", cost: 0 };
  createOwnedCardInstance(state, "p1", { instanceId: "cleanup-skill", definitionId: skillId, zone: "master-skills", active: true, face: "up" });
  state.modeState.resolvedCombats = ["mountain", "city"];
  const engine = new StandardMatchEngine({ ...content, cards, skills });
  engine.effects.register(skillId, handler);
  for (const eventType of skill.passiveEventTypes ?? []) engine.passives.register({ skill, eventType, mandatory: true, handler });
  engine.execute(state, { commandId: "cleanup", gameInstanceId: state.gameInstanceId, expectedRevision: state.revision, actorId: "host", type: CommandType.EndRound, payload: {} });
  assert.deepEqual(seen, ["combat.ending", "round.ending"]);
});
test("固有结界同时限制效果移动与单牌明置，暗置特殊牌仍可作为情报", () => {
  const { state, cards } = fixture([17]);
  assert.throws(() => movePlayerByEffect(state, "p1", "city", cards), /MOVEMENT_BLOCKED_BY_EVENT/);
  cards.special = { id: "special", cost: 0, basePower: 2, attributes: ["特殊"], basic: true };
  createOwnedCardInstance(state, "p1", { instanceId: "special-card", definitionId: "special", zone: "hand", active: false, face: "down" });
  assert.throws(() => addCardToAttack(state, "p1", "special-card", cards, { bypassTiming: true }), /EVENT_FORBIDS_SPECIAL_ATTACK/);
  assert.equal(state.cards["special-card"].zone, "hand");
});
