import type { CSSProperties } from 'react';

import type { ContentSchedulePanelProps } from '../types/props';

type ScheduleModifier = { source: string; targetTag: string; value: number };

export default function ContentSchedulePanel({ currentRound, contentRuntime }: ContentSchedulePanelProps) {
  const upcomingSituations = (contentRuntime?.situations ?? []).filter((entry) => entry.round >= currentRound);
  const upcomingEvents = (contentRuntime?.eventDraws ?? []).filter((entry) => entry.round >= currentRound);

  return (
    <div style={styles.container}>
      <h3 style={styles.title}>Upcoming Content Schedule</h3>
      <div style={styles.section}>
        <div style={styles.sectionTitle}>Situations</div>
        {upcomingSituations.length === 0 ? (
          <div style={styles.empty}>No scheduled situations</div>
        ) : (
          upcomingSituations.map((entry) => (
            <div key={`${entry.cardId}-${entry.round}`} style={styles.card}>
              <div style={styles.row}>
                <span style={styles.badge}>{entry.round === currentRound ? 'Now' : `R${entry.round}`}</span>
                <span style={styles.cardId}>{entry.cardId}</span>
              </div>
              {entry.sharedManaReward !== undefined ? (
                <div style={styles.meta}>Mana to all: +{entry.sharedManaReward}</div>
              ) : null}
              {entry.modifiers?.length ? (
                <div style={styles.meta}>Modifiers: {entry.modifiers.map(formatModifier).join(', ')}</div>
              ) : null}
              {entry.notes?.length ? <div style={styles.notes}>Notes: {entry.notes.join(' | ')}</div> : null}
            </div>
          ))
        )}
      </div>
      <div style={styles.section}>
        <div style={styles.sectionTitle}>Events</div>
        {upcomingEvents.length === 0 ? (
          <div style={styles.empty}>No scheduled events</div>
        ) : (
          upcomingEvents.map((entry) => (
            <div key={`${entry.eventCardId}-${entry.locationId}-${entry.round}`} style={styles.card}>
              <div style={styles.row}>
                <span style={styles.badge}>{entry.round === currentRound ? 'Now' : `R${entry.round}`}</span>
                <span style={styles.cardId}>{entry.eventCardId}</span>
              </div>
              <div style={styles.meta}>Location: {entry.locationId}</div>
              {entry.modifiers?.length ? (
                <div style={styles.meta}>Modifiers: {entry.modifiers.map(formatModifier).join(', ')}</div>
              ) : null}
              {entry.notes?.length ? <div style={styles.notes}>Notes: {entry.notes.join(' | ')}</div> : null}
            </div>
          ))
        )}
      </div>
    </div>
  );
}

function formatModifier(modifier: ScheduleModifier) {
  return `${modifier.source}:${modifier.targetTag}${modifier.value >= 0 ? '+' : ''}${modifier.value}`;
}

const styles: Record<string, CSSProperties> = {
  container: {
    padding: '16px',
    backgroundColor: '#1e293b',
    borderRadius: '8px',
    color: '#f1f5f9',
  },
  title: {
    margin: '0 0 12px 0',
    fontSize: '16px',
    fontWeight: 600,
  },
  section: {
    display: 'flex',
    flexDirection: 'column',
    gap: '8px',
    marginTop: '12px',
  },
  sectionTitle: {
    fontSize: '12px',
    fontWeight: 700,
    letterSpacing: '0.08em',
    textTransform: 'uppercase',
    color: '#93c5fd',
  },
  empty: {
    color: '#64748b',
    fontSize: '13px',
    padding: '8px 0',
  },
  card: {
    padding: '10px',
    backgroundColor: '#0f172a',
    borderRadius: '6px',
    display: 'flex',
    flexDirection: 'column',
    gap: '6px',
  },
  row: {
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
  },
  badge: {
    fontSize: '10px',
    fontWeight: 700,
    color: '#0f172a',
    backgroundColor: '#93c5fd',
    padding: '2px 6px',
    borderRadius: '999px',
    minWidth: '34px',
    textAlign: 'center',
  },
  cardId: {
    fontSize: '13px',
    fontWeight: 600,
  },
  meta: {
    fontSize: '12px',
    color: '#cbd5e1',
  },
  notes: {
    fontSize: '11px',
    color: '#94a3b8',
  },
};
