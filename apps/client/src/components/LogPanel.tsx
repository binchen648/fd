import type { LogPanelProps } from '../types/props';
import type { CSSProperties } from "react";

export default function LogPanel({
  log,
  filterPlayerId,
  filterType,
}: LogPanelProps) {
  const filteredLog = log.filter((entry) => {
    if (filterPlayerId && entry.payload?.playerId !== filterPlayerId) {
      return false;
    }
    if (filterType && entry.type !== filterType) {
      return false;
    }
    return true;
  });

  const getTypeColor = (type: string) => {
    const colors: Record<string, string> = {
      phase: '#3b82f6',
      action: '#22c55e',
      battle: '#ef4444',
      effect: '#a855f7',
      scoring: '#f59e0b',
      movement: '#06b6d4',
      elimination: '#dc2626',
      default: '#94a3b8',
    };
    return colors[type] || colors.default;
  };

  return (
    <div style={styles.container}>
      <h3 style={styles.title}>Game Log</h3>
      <div style={styles.filterInfo}>
        {filterPlayerId && <span>Filter: Player {filterPlayerId}</span>}
        {filterType && <span> | Type: {filterType}</span>}
      </div>
      <div style={styles.logList}>
        {filteredLog.length === 0 ? (
          <div style={styles.empty}>No log entries</div>
        ) : (
          filteredLog.map((entry, index) => (
            <div key={index} style={styles.entry}>
              <span
                style={{
                  ...styles.typeBadge,
                  backgroundColor: getTypeColor(entry.type),
                }}
              >
                {entry.type}
              </span>
              <span style={styles.message}>{entry.message}</span>
              {entry.payload && (
                <details style={styles.payload}>
                  <summary style={styles.payloadSummary}>Details</summary>
                  <pre style={styles.payloadContent}>
                    {JSON.stringify(entry.payload, null, 2)}
                  </pre>
                </details>
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
    display: 'flex',
    flexDirection: 'column',
    height: '100%',
    minHeight: '300px',
  },
  title: {
    margin: '0 0 8px 0',
    fontSize: '16px',
    fontWeight: 600,
  },
  filterInfo: {
    fontSize: '11px',
    color: '#94a3b8',
    marginBottom: '8px',
  },
  logList: {
    flex: 1,
    overflowY: 'auto',
    display: 'flex',
    flexDirection: 'column',
    gap: '6px',
  },
  empty: {
    color: '#64748b',
    fontSize: '14px',
    textAlign: 'center',
    padding: '20px',
  },
  entry: {
    padding: '8px',
    backgroundColor: '#0f172a',
    borderRadius: '4px',
    fontSize: '12px',
    borderLeft: '3px solid #475569',
  },
  typeBadge: {
    display: 'inline-block',
    padding: '2px 6px',
    borderRadius: '3px',
    fontSize: '10px',
    fontWeight: 600,
    color: '#fff',
    marginRight: '8px',
    textTransform: 'uppercase',
  },
  message: {
    color: '#e2e8f0',
  },
  payload: {
    marginTop: '6px',
  },
  payloadSummary: {
    fontSize: '10px',
    color: '#64748b',
    cursor: 'pointer',
  },
  payloadContent: {
    margin: '4px 0 0 0',
    padding: '8px',
    backgroundColor: '#1e293b',
    borderRadius: '4px',
    fontSize: '10px',
    overflow: 'auto',
    maxHeight: '100px',
  },
};
