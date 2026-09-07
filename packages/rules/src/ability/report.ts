import type { AuthoringPack, ExecutionMode } from './types';
import { node, nodes, str } from './loader';

/** Mapping capability is not evidence of application/UI integration. Preserve unresolved authoring context. */
export function buildAuthoringAdapterReport(pack: AuthoringPack, archive: unknown, source: string) {
  const raw = node(archive); const cards = Object.values(pack.cards);
  const abilities = cards.flatMap(c => c.abilities);
  const cardStatus = (card: typeof cards[number]): ExecutionMode => {
    const modes = [card.mode, ...card.abilities.map(a => a.execution.mode)];
    return (['unsupported', 'text_unconfirmed', 'host_adjudicated'] as const).find(m => modes.includes(m)) ?? 'automatic';
  };
  return {
    schemaVersion: 'fd-ability-adapter-report-v1', source,
    summary: { cards: cards.length, abilities: abilities.length,
      executableCards: cards.filter(c => cardStatus(c) === 'automatic').length,
      automatic: abilities.filter(a => a.execution.mode === 'automatic').length,
      unsupported: pack.report.filter(r => r.status === 'unsupported').length,
      hostAdjudicated: pack.report.filter(r => r.status === 'host_adjudicated').length,
      textUnconfirmed: pack.report.filter(r => r.status === 'text_unconfirmed').length },
    cards: cards.map(c => ({ id: c.id, status: cardStatus(c), abilities: c.abilities.map(a => ({ id: a.id, status: a.execution.mode })) })),
    unmapped: pack.report,
    externalDeckDefinitions: nodes(raw.deck).map(e => str(e.cardId)).filter(id => !pack.cards[id]),
    openQuestions: Array.isArray(raw.openQuestions) ? raw.openQuestions : [],
    userConfirmedInterpretations: Array.isArray(raw.userConfirmedInterpretations) ? raw.userConfirmedInterpretations : [],
    resolvedQuestions: Array.isArray(raw.resolvedQuestions) ? raw.resolvedQuestions : [],
    notes: [
      `This report covers ${cards.length} authored card definitions. External deck definitions require explicit content-layer loading; no aliases or card text are inferred.`,
      'automatic describes supported interpreter nodes only, not completed normal-turn orchestration, UI wiring or main-repository integration.',
      'Unsupported/unconfirmed abilities block their card; they are never silently skipped.',
      ...(Array.isArray(raw.adapterNotes) ? raw.adapterNotes.filter((n): n is string => typeof n === 'string') : []),
    ],
  };
}
