import { describe, expect, it } from "vitest";

import { buildReplaySnapshots } from "../../src/tools/replay";

describe("replay tool", () => {
  it("turns rule log entries into ordered replay snapshots", () => {
    const snapshots = buildReplaySnapshots([
      {
        type: "phase_transition",
        message: "round_end -> round_start",
      },
      {
        type: "event_placed",
        message: "event:event-1@shinto",
      },
    ]);

    expect(snapshots).toEqual([
      {
        step: 1,
        type: "phase_transition",
        message: "round_end -> round_start",
      },
      {
        step: 2,
        type: "event_placed",
        message: "event:event-1@shinto",
      },
    ]);
  });
});
