import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import vm from "node:vm";
import content from "../src/content/generated/legacy-content.json" with { type: "json" };
import { buildStandardContent } from "../src/content/content-package.ts";

const masters = [
  "master.kayneth", "master.shinji", "master.kiritsugu", "master.maiya",
  "master.dan", "master.rin", "master.irisviel", "master.julius",
];
const servants = [
  "servant.artoriac", "servant.drake", "servant.achilles", "servant.artoria-alt",
  "servant.ereshkigal", "servant.tomoe", "servant.kintoki", "servant.emiya",
];

function readCatalog(file, key) {
  const context = { window: {} };
  vm.runInNewContext(fs.readFileSync(file, "utf8"), context);
  return context.window[key];
}

test("playable roster contains eight valid choices for seven in-game seats", () => {
  const contentIds = new Set([...(content.masters ?? []), ...(content.servants ?? [])].map((entity) => entity.id));
  for (const id of [...masters, ...servants]) assert.ok(contentIds.has(id), `missing content: ${id}`);
  assert.equal(masters.length, 8);
  assert.equal(servants.length, 8);
  assert.equal(7, Math.min(masters.length, servants.length) - 1);
});

test("every selected master and servant skill is executable and represented by the UI catalog", () => {
  const built = buildStandardContent(content);
  const entities = new Map([...(content.masters ?? []), ...(content.servants ?? [])].map((entity) => [entity.id, entity]));
  const detail = readCatalog("ui-preview/codex-detail-data.js", "FDCodexDetailData");
  for (const id of [...masters, ...servants]) {
    const entity = entities.get(id);
    assert.ok(entity);
    const kind = id.startsWith("master.") ? "masters" : "servants";
    const entry = Object.values(detail[kind]).find((item) => item.sourceId === id);
    assert.ok(entry, `missing UI entry: ${id}`);
    for (const skill of entity.skills ?? []) {
      const definition = built.skills.get(skill.id);
      assert.ok(definition, `missing runtime skill: ${skill.id}`);
      assert.equal(definition.supportLevel, "FULL", `skill is not FULL: ${skill.id}`);
      assert.ok(entry.skills.some((item) => item.id === skill.id), `missing UI skill: ${skill.id}`);
    }
  }
});
