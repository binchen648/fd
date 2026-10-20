import contentLibrary from '../../../../data/generated/fd-playtest-v1.content-library.json';

const attributeTags: Record<string, string> = { strength: '力量', agility: '敏捷', magecraft: '魔术', magic: '魔术', special: '特殊', noble_phantasm: '宝具' };
const eventById = new Map(((contentLibrary as { cards?: Array<any> }).cards ?? []).filter((card) => String(card.id).startsWith('event.')).map((card) => [card.id, card]));

export function canonicalEventPlacementMetadata(eventCardId: string): Pick<NonNullable<import('../schema/game').EventPlacementState>, 'victoryPoints' | 'battleModifiers'> {
  const card = eventById.get(eventCardId);
  const modifiers = (card?.effects ?? []).flatMap((effect: any) => {
    const targetTag = attributeTags[String(effect.attribute ?? '')];
    const amount = Number(effect.amount ?? 0);
    if (!targetTag || !amount) return [];
    if (effect.type === 'attribute_power_bonus' && !effect.condition) return [{ sourceId: eventCardId, targetTag, value: amount, condition: 'has_attribute' as const }];
    if (effect.type === 'non_attribute_power_modifier') return [{ sourceId: eventCardId, targetTag, value: amount, condition: 'lacks_attribute' as const }];
    return [];
  });
  const reward = typeof card?.printedReward === 'number' ? { victoryPoints: card.printedReward } : {};
  return { ...reward, battleModifiers: modifiers };
}
