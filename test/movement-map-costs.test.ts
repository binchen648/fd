import test from "node:test";
import assert from "node:assert/strict";
import { createGameState } from "../src/domain/state/createGameState.ts";
import { movePlayer } from "../src/rules-core/board.ts";
import { MAP_LOCATIONS } from "../src/map/locations.js";

const routes: [string, string, number][] = [
  ["workshop", "mountain", 1], ["mountain", "city", 2], ["city", "scouting", 2],
  ["workshop", "city", 3], ["mountain", "scouting", 4], ["workshop", "scouting", 5],
];
function atLocation(locationId: string, mana: number) {
  const state = createGameState({gameInstanceId:"map-costs",players:[{id:"p1",name:"玩家"}],seed:1});
  state.status="playing";state.phase="action";state.step="move-decision";state.activePlayerId="p1";
  state.players.p1.locationId=locationId;state.players.p1.mana=mana;state.board.locations[locationId]=["p1"];
  return state;
}
for(const [from,to,cost] of routes) {
  test(`地图路线 ${from} → ${to}：${cost} 魔力恰好足够`,()=>{
    const state=atLocation(from,cost);
    assert.equal(movePlayer(state,"p1",to),cost);
    assert.equal(state.players.p1.mana,0);
    assert.equal(state.players.p1.locationId,to);
    assert.deepEqual(state.board.locations[from],[]);
  });
  test(`地图路线 ${from} → ${to}：不足魔力不能移动`,()=>{
    const state=atLocation(from,cost-1),before=structuredClone(state);
    assert.throws(()=>movePlayer(state,"p1",to));
    assert.deepEqual(state,before);
  });
}
test("地图配置的三段箭头费用与确认的原图一致",()=>{
  assert.equal(MAP_LOCATIONS.workshop.moveCost,1);
  assert.equal(MAP_LOCATIONS.mountain.moveCost,2);
  assert.equal(MAP_LOCATIONS.city.moveCost,2);
});
