/** Generic printed-cost-derived attack Power increase.
 * Caller must provide the trusted, immutable printed attack mana cost and
 * independently validate the action-stage/source/attack context.
 */
/** Resolve printed mana directly from an authenticated attack instance and pack face,
 * never from client-provided values or mana actually spent.
 */
export function trustedPrintedAttackManaPowerBonus(
  attackInstanceId: string,
  controllerId: string,
  cards: readonly { instanceId: string; definitionId: string; controllerPlayerId: string; zone: string }[],
  definitions: Readonly<Record<string, { cardType: string; cardFace: { cost?: unknown } }>>,
): number | undefined {
  if (!attackInstanceId || !controllerId || !Array.isArray(cards)) return undefined;
  const matches = cards.filter(c => c?.instanceId === attackInstanceId);
  if (matches.length !== 1) return undefined;
  const source = matches[0]!;
  if (source.controllerPlayerId !== controllerId || source.zone !== 'attack_area') return undefined;
  const definition = Object.prototype.hasOwnProperty.call(definitions, source.definitionId)
    ? definitions[source.definitionId] : undefined;
  if (!definition || !['basic_attack','servant_attack','servant_deck_card','master_deck_card','servant_skill'].includes(definition.cardType)) return undefined;
  return printedAttackManaPowerBonus(definition.cardFace?.cost, 3);
}

export function printedAttackManaPowerBonus(
  printedManaCost: unknown,
  maximumBonus: unknown,
): number | undefined {
  if (typeof printedManaCost !== 'number' || !Number.isSafeInteger(printedManaCost) ||
      printedManaCost < 0 || typeof maximumBonus !== 'number' ||
      !Number.isSafeInteger(maximumBonus) || maximumBonus < 0) return undefined;
  return Math.min(printedManaCost, maximumBonus);
}
