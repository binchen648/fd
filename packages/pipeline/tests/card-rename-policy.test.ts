import { describe, expect, it } from "vitest";

import { buildRenamedCardFileName } from "../src/card-rename-policy";

describe("card rename policy", () => {
  it("uses 卡名(A/B).png only when both displayed cost and power are available", () => {
    expect(
      buildRenamedCardFileName({
        card_name: "魔力放出",
        cost: 2,
        power: 4,
        displayed_cost_power_confirmed: true,
      }),
    ).toBe("魔力放出(2／4).png");
  });

  it("falls back to 卡名.png when only cost is known", () => {
    expect(buildRenamedCardFileName({ card_name: "魔力放出", cost: 2, power: null, displayed_cost_power_confirmed: false })).toBe("魔力放出.png");
  });

  it("falls back to 卡名.png when only power is known", () => {
    expect(buildRenamedCardFileName({ card_name: "魔力放出", cost: null, power: 4, displayed_cost_power_confirmed: false })).toBe("魔力放出.png");
  });

  it("falls back to 卡名.png when no displayed numeric pair is known", () => {
    expect(buildRenamedCardFileName({ card_name: "魔力放出", cost: null, power: null, displayed_cost_power_confirmed: false })).toBe("魔力放出.png");
  });

  it("does not use (A/B) when the numeric pair is unstable and needs review", () => {
    expect(buildRenamedCardFileName({ card_name: '王之军势:?*', cost: 5, power: 2, displayed_cost_power_confirmed: false })).toBe("王之军势___.png");
  });
});
