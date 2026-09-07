import type { StructuringRequest } from "@fd/contracts";

export function buildStructureMessages(input: StructuringRequest, visionArtifact: string) {
  const structureHints = [
    "Card type normalization rules:",
    "- Use engine-ready card types only.",
    "- For servant cards, card.cardType must resolve to servant_skill or servant_attack. Never return bare 'servant'.",
    "- If input.input.familyHint is servant_skill or servant_attack, prefer that exact cardType unless the vision artifact clearly contradicts it.",
    "- Map event_card to event and situation_card to situation.",
  ].join(" ");

  return [
    {
      role: "system" as const,
      content: [
        "You are the FD Structuring Agent.",
        "Return strict JSON only.",
        "Do not explain. Do not wrap JSON in markdown. Do not echo the request object.",
        "Required top-level keys: jobId, artifactVersion, status, card, parseNotes, coverage, source.",
        "artifactVersion must be 'structure-response-v1'.",
        "status must be 'ok' unless the vision artifact is unusable.",
        "card must be an object with these required keys: id, name, cardType, timing, conditions, targets, effects, duration, visibility, tags, ambiguities.",
        "card.id must be a non-empty lowercase slug-like string using dots or underscores, for example 'master.matou_shinji.profile'.",
        "card.name must be the visible card name from the artifact.",
        "Never omit card.id. Never return the input request shape.",
        "coverage must contain sourceClauses, mappedClauses, unmappedClauses.",
        "source must contain visionJobId, provider, model.",
        structureHints,
        // Mapping examples - map these text patterns to these effect types:
        // "获得X点魔力" -> gain_mana with value X
        // "获得【卡牌名】" -> gain_card with value "卡牌名"
        // "失去令咒" -> lose_command_spell with value 1
        // "属性相同时威力+X" -> battle_power_bonus_if_shared_attribute with value X
        // "禁止特殊攻击" -> forbid_special_attack_on_battlefield with value true
        // "封锁此地点" -> lock_battlefield_movement with value "all_players"
        // If you cannot recognize the text pattern, put the ORIGINAL text (not the type name) in ambiguities[].span.
        // Identity replacement effects (explicit handlers):
        // "替换本体/换掉本体/身份置换" -> swap_master_identity with args: { newCardId: "目标卡牌id" }
        // "替换从者/从者置换" -> swap_servant_identity with args: { newCardId: "目标卡牌id" }
        // These require target to be self_player and args.newCardId to be a valid card id.
      ].join(" "),
    },
    {
      role: "user" as const,
      content: [
        {
          type: "text",
          text: JSON.stringify(input, null, 2),
        },
        {
          type: "text",
          text: `VISION_ARTIFACT:\n${visionArtifact}`,
        },
        {
          type: "text",
          text: `EXAMPLE_RESPONSE_SHAPE:\n${JSON.stringify(
            {
              jobId: input.jobId,
              artifactVersion: "structure-response-v1",
              status: "ok",
              card: {
                id: "master.matou_shinji.profile",
                name: "间桐慎二",
                cardType: "master_skill",
                owner: "间桐慎二",
                timing: ["passive"],
                conditions: [],
                targets: [],
                effects: [],
                duration: null,
                visibility: "public",
                tags: ["master", "profile"],
                ambiguities: []
              },
              parseNotes: ["example note"],
              coverage: {
                sourceClauses: 3,
                mappedClauses: 3,
                unmappedClauses: 0
              },
              source: {
                visionJobId: "vision-example",
                provider: input.provider.name,
                model: input.provider.model
              }
            },
            null,
            2,
          )}`,
        },
      ],
    },
  ];
}
