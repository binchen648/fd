import { readFileSync } from "node:fs";
import { join } from "node:path";

import { describe, expect, it } from "vitest";

import {
  canMoveToLocation,
  canOccupyLocation,
  getEnabledLocations,
  getLocationById,
} from "../../src/core/map-engine";
import type { MapDefinition } from "../../src/schema/location";

const defaultMap = JSON.parse(
  readFileSync(
    join(__dirname, "../../src/data/maps/default-7p-map.json"),
    "utf8",
  ),
) as MapDefinition;

describe("map engine", () => {
  it("hides Moon Holy Grail unless config enables it", () => {
    const locations = getEnabledLocations(defaultMap, {
      enabledLocationIds: [],
    });

    expect(locations.map((location) => location.id)).not.toContain("moon_holy_grail");
  });

  it("enables Moon Holy Grail when match config includes it", () => {
    const moonLocation = getLocationById(defaultMap, {
      enabledLocationIds: ["moon_holy_grail"],
    }, "moon_holy_grail");

    expect(moonLocation?.eventPolicy).toBe("custom");
  });

  it("uses the CHM linear path as the default movement rule", () => {
    expect(
      canMoveToLocation({
        map: defaultMap,
        config: { enabledLocationIds: [] },
        from: "magic_workshop",
        to: "miyama_town",
      }),
    ).toBe(true);

    expect(
      canMoveToLocation({
        map: defaultMap,
        config: { enabledLocationIds: [] },
        from: "miyama_town",
        to: "shinto",
      }),
    ).toBe(true);

    expect(
      canMoveToLocation({
        map: defaultMap,
        config: { enabledLocationIds: [] },
        from: "shinto",
        to: "recon",
      }),
    ).toBe(true);
  });

  it("rejects reverse or shortcut movement by default but allows an explicit override", () => {
    expect(
      canMoveToLocation({
        map: defaultMap,
        config: { enabledLocationIds: [] },
        from: "miyama_town",
        to: "magic_workshop",
        movingPlayerId: "p1",
      }),
    ).toBe(false);

    expect(
      canMoveToLocation({
        map: defaultMap,
        config: { enabledLocationIds: [] },
        from: "miyama_town",
        to: "magic_workshop",
        movingPlayerId: "p1",
        ruleOverrides: {
          ignoreMovementLinkPlayerIds: ["p1"],
        },
      }),
    ).toBe(true);
  });

  it("blocks normal movement while engaged unless an explicit override bypasses it", () => {
    expect(
      canMoveToLocation({
        map: defaultMap,
        config: { enabledLocationIds: [] },
        from: "miyama_town",
        to: "shinto",
        movingPlayerId: "p1",
        ruleOverrides: {
          engagedPlayerIds: ["p1"],
        },
      }),
    ).toBe(false);

    expect(
      canMoveToLocation({
        map: defaultMap,
        config: { enabledLocationIds: [] },
        from: "miyama_town",
        to: "shinto",
        movingPlayerId: "p1",
        ruleOverrides: {
          engagedPlayerIds: ["p1"],
          ignoreEngagementForMovementPlayerIds: ["p1"],
        },
      }),
    ).toBe(true);
  });

  it("rejects movement when Recon has reached its policy-defined occupancy limit", () => {
    expect(
      canMoveToLocation({
        map: defaultMap,
        config: { enabledLocationIds: [] },
        from: "shinto",
        to: "recon",
        movingPlayerId: "p1",
        occupyingPlayerIds: ["p2"],
      }),
    ).toBe(false);

    expect(
      canMoveToLocation({
        map: defaultMap,
        config: { enabledLocationIds: [] },
        from: "shinto",
        to: "recon",
        movingPlayerId: "p1",
        occupyingPlayerIds: [],
      }),
    ).toBe(true);
  });

  it("allows up to four occupants in Magic Workshop before rejecting more", () => {
    expect(
      canOccupyLocation({
        map: defaultMap,
        config: { enabledLocationIds: [] },
        locationId: "magic_workshop",
        movingPlayerId: "p1",
        occupyingPlayerIds: ["p2", "p3", "p4"],
      }),
    ).toBe(true);

    expect(
      canOccupyLocation({
        map: defaultMap,
        config: { enabledLocationIds: [] },
        locationId: "magic_workshop",
        movingPlayerId: "p1",
        occupyingPlayerIds: ["p2", "p3", "p4", "p5"],
      }),
    ).toBe(false);
  });

  it("leaves Moon Holy Grail uncapped by default but supports soft occupancy overrides", () => {
    expect(
      canOccupyLocation({
        map: defaultMap,
        config: { enabledLocationIds: ["moon_holy_grail"] },
        locationId: "moon_holy_grail",
        movingPlayerId: "p1",
        occupyingPlayerIds: ["p2", "p3", "p4"],
      }),
    ).toBe(true);

    expect(
      canOccupyLocation({
        map: defaultMap,
        config: { enabledLocationIds: ["moon_holy_grail"] },
        locationId: "moon_holy_grail",
        movingPlayerId: "p1",
        occupyingPlayerIds: ["p2"],
        ruleOverrides: {
          occupancyLimitByLocation: {
            moon_holy_grail: 1,
          },
        },
      }),
    ).toBe(false);
  });
});
