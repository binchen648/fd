import { describe, expect, it } from "vitest";

import { buildStructureRequestFromManifest } from "@fd/pipeline";
import { buildStructureMessages } from "../src/prompts";

describe("structure prompt", () => {
  it("includes family hints and explicit servant subtype guidance", () => {
    const request = buildStructureRequestFromManifest({
      id: "servant-bb-001",
      imagePath: "D:/output/fd_chm_extract/cards/bb.png",
      sourceSet: "servant",
      familyHint: "servant_skill",
      language: "zh-CN",
      targetNamespace: "servant",
    });

    const messages = buildStructureMessages(
      request,
      JSON.stringify({
        classification: {
          cardTypeGuess: "servant",
          subtypeGuess: "skill",
        },
        text: {
          cardName: "B.B.",
          normalizedText: "B.B. Moon Cancer",
        },
      }),
    );

    expect(messages[0]?.content).toContain(
      "For servant cards, card.cardType must resolve to servant_skill or servant_attack. Never return bare 'servant'.",
    );
    expect(messages[1]?.content).toContainEqual(
      expect.objectContaining({
        type: "text",
        text: expect.stringContaining('"familyHint": "servant_skill"'),
      }),
    );
  });
});
