import type { VisionRequest } from "@fd/contracts";

export function buildVisionMessages(input: VisionRequest, imageDataUrl: string) {
  const layoutInstructions = input.input.layoutHint === "servant-fixed-layout-v1"
    ? [
        "You are also a card layout directed recognition agent for servant cards with a fixed layout.",
        "card_name is the large white title on the left side of the lower blue title bar.",
        "mana_cost is the digit inside the green circular region near the lower middle of the card.",
        "attack_power is the digit next to the blue attack marker at the lower right of the card.",
        "attributes are the top-left labels in top-to-bottom order, such as 力量, 敏捷, 魔术, 特殊, 宝具.",
        "rules_text is the body text inside the lower text box.",
        "If a field is not clearly visible, return null for that field and record the field in uncertainSpans or notes rather than guessing.",
      ].join(" ")
    : "";

  return [
    {
      role: "system" as const,
      content: [
        "You are the FD Vision Agent.",
        "Return strict JSON only.",
        "Do not explain. Do not wrap JSON in markdown.",
        "Extract only what is visibly present on the card image.",
        "Do not invent missing text or infer hidden mechanics.",
        "Required top-level keys:",
        "jobId, artifactVersion, status, classification, text, fields, blocks, uncertainSpans, overallConfidence, source.",
        "Inside text require: cardName, rawText, normalizedText.",
        "Inside classification require: cardTypeGuess, subtypeGuess, familyConfidence.",
        "Inside fields require: code, costMarker, powerMarker, numericSlots, iconTags, rarity, classTag.",
        "status must be 'ok' unless the image is unreadable.",
        "artifactVersion must be 'vision-response-v1'.",
        layoutInstructions,
      ].join(" "),
    },
    {
      role: "user" as const,
      content: [
        {
          type: "image_url",
          image_url: {
            url: imageDataUrl,
            detail: "low",
          },
        },
        {
          type: "text",
          text: JSON.stringify(input, null, 2),
        },
      ],
    },
  ];
}
