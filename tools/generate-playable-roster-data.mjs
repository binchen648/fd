import fs from "node:fs";
import path from "node:path";

const projectRoot = path.resolve(import.meta.dirname, "..");
const legacy = JSON.parse(fs.readFileSync(path.join(projectRoot, "src/content/generated/legacy-content.json"), "utf8"));
const entities = new Map([...legacy.masters, ...legacy.servants].map((entity) => [entity.id, entity]));
const cards = new Map(legacy.cards.map((card) => [card.id, card]));

// The browser runtime seats seven players.  Keep one extra option in each
// picker so the human can choose first while the remaining six seats are
// filled from the same executable pools.
export const PLAYABLE_MASTERS = [
  "master.kayneth",
  "master.shinji",
  "master.kiritsugu",
  "master.maiya",
  "master.dan",
  "master.rin",
  "master.irisviel",
  "master.julius",
];
export const PLAYABLE_SERVANTS = [
  "servant.artoriac",
  "servant.drake",
  "servant.achilles",
  "servant.artoria-alt",
  "servant.ereshkigal",
  "servant.tomoe",
  "servant.kintoki",
  "servant.emiya",
];

function hasAsset(relativePath) {
  return fs.existsSync(path.join(projectRoot, "ui-preview", relativePath));
}

function portraitPath(entity) {
  const folder = entity.id.startsWith("master.") ? "masters" : "servants";
  const relative = `../assets/cards/${folder}/${entity.name}.png`;
  return hasAsset(relative) ? relative : "";
}

function cardImage(card) {
  if (!card?.legacyId) return "";
  const relative = `../assets/cards/deck/${card.legacyId}.png`;
  return hasAsset(relative) ? relative : "";
}

function skillImage(entity, skill) {
  const kind = entity.id.startsWith("master.") ? "master" : "servant";
  const relative = `../assets/cards/skills/${kind}-${entity.name}-${skill.legacyId ?? "skill"}.png`;
  return hasAsset(relative) ? relative : "";
}

function isAscension(skill) {
  return skill.tags?.includes("ascension") === true || skill.legacyId === "ascension" || skill.id.endsWith(".skill.ascension");
}

function skillView(entity, skill) {
  return {
    id: skill.id,
    name: skill.name,
    type: isAscension(skill) ? "升华技" : (skill.typeLabel || "技能"),
    text: skill.text || "",
    cost: skill.cost ?? null,
    requirement: skill.requirement ?? null,
    basePower: skill.basePower ?? null,
    image: skillImage(entity, skill),
    ...(isAscension(skill) ? { isAscension: true } : {}),
  };
}

function deckView(entity) {
  const groups = [];
  for (const id of entity.deck ?? []) {
    const card = cards.get(id);
    if (!card) throw new Error(`Missing deck card ${entity.id}:${id}`);
    const existing = groups.find((item) => item.id === id);
    if (existing) existing.count += 1;
    else groups.push({
      id,
      name: card.name,
      type: card.typeLabel || "卡牌",
      text: card.text || "",
      cost: card.cost ?? null,
      basePower: card.basePower ?? null,
      image: cardImage(card),
      count: 1,
    });
  }
  return groups;
}

function detailView(id) {
  const entity = entities.get(id);
  if (!entity) throw new Error(`Missing playable entity ${id}`);
  return {
    sourceId: id,
    name: entity.name,
    fullName: entity.name,
    class: entity.class || "Master",
    image: portraitPath(entity),
    skills: (entity.skills ?? []).map((skill) => skillView(entity, skill)),
    ...(id.startsWith("servant.") ? { deck: deckView(entity) } : {}),
  };
}

function catalog(ids) {
  return Object.fromEntries(ids.map((id) => {
    const view = detailView(id);
    return [view.name, view];
  }));
}

const detail = { masters: catalog(PLAYABLE_MASTERS), servants: catalog(PLAYABLE_SERVANTS) };
const preview = {
  masters: Object.fromEntries(Object.entries(detail.masters).map(([name, item]) => [name, {
    sourceId: item.sourceId,
    name: item.name,
    fullName: item.fullName,
    class: item.class,
    image: item.image,
    skills: item.skills.map(({ id, name: skillName, type, text, isAscension }) => ({ id, name: skillName, type, text, ...(isAscension ? { isAscension: true } : {}) })),
  }])),
  servants: Object.fromEntries(Object.entries(detail.servants).map(([name, item]) => [name, {
    sourceId: item.sourceId,
    name: item.name,
    fullName: item.fullName,
    class: item.class,
    image: item.image,
    skills: item.skills.map(({ id, name: skillName, type, text, isAscension }) => ({ id, name: skillName, type, text, ...(isAscension ? { isAscension: true } : {}) })),
  }])),
};

fs.writeFileSync(path.join(projectRoot, "ui-preview/codex-detail-data.js"), `window.FDCodexDetailData=${JSON.stringify(detail, null, 2)};\n`);
fs.writeFileSync(path.join(projectRoot, "ui-preview/character-preview-data.js"), `window.FDCharacterPreviewData=${JSON.stringify(preview, null, 2)};\n`);

const skillCount = [...Object.values(detail.masters), ...Object.values(detail.servants)].reduce((sum, item) => sum + item.skills.length, 0);
console.log(`Generated ${PLAYABLE_MASTERS.length} masters, ${PLAYABLE_SERVANTS.length} servants, ${skillCount} skills.`);
