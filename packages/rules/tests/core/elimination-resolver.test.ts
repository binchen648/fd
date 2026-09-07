import { describe, expect, it } from "vitest";

import { resolveEliminationBatch } from "../../src/core/elimination-resolver";

describe("elimination resolver", () => {
  it("assigns deterministic order to elimination candidates within one batch", () => {
    const result = resolveEliminationBatch([
      { playerId: "p3", seat: 3, militaryResult: -8 },
      { playerId: "p2", seat: 2, militaryResult: -8 },
      { playerId: "p4", seat: 4, militaryResult: -9 },
      { playerId: "p1", seat: 2, militaryResult: -8 },
    ]);

    expect(result).toEqual([
      { playerId: "p4", seat: 4, militaryResult: -9, eliminationOrder: 1 },
      { playerId: "p1", seat: 2, militaryResult: -8, eliminationOrder: 2 },
      { playerId: "p2", seat: 2, militaryResult: -8, eliminationOrder: 3 },
      { playerId: "p3", seat: 3, militaryResult: -8, eliminationOrder: 4 },
    ]);
  });
});
