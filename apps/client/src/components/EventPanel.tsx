import type { EventPanelProps } from '../types/props';
import type { CSSProperties } from "react";

export default function EventPanel({
  eventPlacements,
  debugMode = false,
}: EventPanelProps) {
  const getVisibilityLabel = (visibility: string) => {
    const labels: Record<string, string> = {
      public: 'Public',
      owner_only: 'Owner Only',
      hidden: 'Hidden',
    };
    return labels[visibility] || visibility;
  };

  const getVisibilityColor = (visibility: string) => {
    const colors: Record<string, string> = {
      public: '#22c55e',
      owner_only: '#f59e0b',
      hidden: '#ef4444',
    };
    return colors[visibility] || '#64748b';
  };

  return (
    <div style={styles.container}>
      <h3 style={styles.title}>Event Placements</h3>
      <div style={styles.content}>
        {eventPlacements.length === 0 ? (
          <div style={styles.empty}>No events placed</div>
        ) : (
          eventPlacements.map((event, index) => (
            <div key={index} style={styles.eventCard}>
              <div style={styles.eventHeader}>
                <span style={styles.eventId}>{event.eventCardId}</span>
                <span
                  style={{
                    ...styles.visibilityBadge,
                    backgroundColor: getVisibilityColor(event.visibility),
                  }}
                >
                  {getVisibilityLabel(event.visibility)}
                </span>
              </div>
              <div style={styles.eventLocation}>
                <span style={styles.label}>Location:</span>
                <span style={styles.value}>{event.locationId}</span>
              </div>
              {debugMode && event.battleModifiers && event.battleModifiers.length > 0 && (
                <div style={styles.modifiers}>
                  <span style={styles.label}>Battle Modifiers:</span>
                  {event.battleModifiers.map((mod, idx) => (
                    <div key={idx} style={styles.modifier}>
                      {mod.source}: {mod.targetTag} {mod.value >= 0 ? '+' : ''}{mod.value}
                    </div>
                  ))}
                </div>
              )}
              {/* In normal mode, hide content for hidden events */}
              {!debugMode && event.visibility === 'hidden' && (
                <div style={styles.hiddenContent}>
                  [Hidden - enable debug mode to view]
                </div>
              )}
            </div>
          ))
        )}
      </div>
    </div>
  );
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
  content: {
    display: 'flex',
    flexDirection: 'column',
    gap: '8px',
    maxHeight: '250px',
    overflowY: 'auto',
  },
  empty: {
    color: '#64748b',
    fontSize: '14px',
    textAlign: 'center',
    padding: '20px',
  },
  eventCard: {
    padding: '10px',
    backgroundColor: '#0f172a',
    borderRadius: '6px',
    borderLeft: '3px solid #475569',
  },
  eventHeader: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: '6px',
  },
  eventId: {
    fontSize: '14px',
    fontWeight: 600,
  },
  visibilityBadge: {
    fontSize: '10px',
    padding: '2px 6px',
    borderRadius: '3px',
    color: '#fff',
    fontWeight: 600,
    textTransform: 'uppercase',
  },
  eventLocation: {
    display: 'flex',
    alignItems: 'center',
    gap: '6px',
    fontSize: '12px',
  },
  label: {
    color: '#94a3b8',
  },
  value: {
    fontWeight: 500,
  },
  modifiers: {
    marginTop: '8px',
    fontSize: '11px',
    color: '#94a3b8',
  },
  modifier: {
    padding: '4px 0',
    color: '#64748b',
  },
  hiddenContent: {
    marginTop: '8px',
    fontSize: '11px',
    color: '#64748b',
    fontStyle: 'italic',
  },
};
