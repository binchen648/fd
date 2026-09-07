export const visibilityScopes = [
  "public",
  "owner_only",
  "battlefield_only",
  "hidden_until_trigger",
  "revealed_after_declaration",
] as const;

export type VisibilityScope = (typeof visibilityScopes)[number];

export interface VisibilityState {
  scope: VisibilityScope;
  ownerPlayerId?: string;
  revealedToPlayerIds?: string[];
  revealReason?: string;
}
