import type { SituationPanelProps } from '../types/props';
import type { CSSProperties } from "react";

export default function SituationPanel({
  currentSituationCardId,
  currentSituationModifiers,
}: SituationPanelProps) {
  return (
    <div style={styles.container}>
      <h3 style={styles.title}>Current Situation</h3>
      <div style={styles.content}>
        {currentSituationCardId ? (
          <>
            <div style={styles.cardId}>
              <span style={styles.label}>Situation Card:</span>
              <span style={styles.value}>{currentSituationCardId}</span>
            </div>
            {currentSituationModifiers && currentSituationModifiers.length > 0 && (
              <div style={styles.modifiers}>
                <span style={styles.label}>Combat Modifiers:</span>
                <div style={styles.modifierList}>
                  {currentSituationModifiers.map((mod, index) => (
                    <div key={index} style={styles.modifier}>
                      <span style={styles.modSource}>{mod.source}</span>
                      <span style={styles.modTarget}>{mod.targetTag}</span>
                      <span
                        style={{
                          ...styles.modValue,
                          color: mod.value >= 0 ? '#22c55e' : '#ef4444',
                        }}
                      >
                        {mod.value >= 0 ? '+' : ''}{mod.value}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </>
        ) : (
          <div style={styles.empty}>No active situation</div>
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
    gap: '12px',
  },
  cardId: {
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
  },
  label: {
    fontSize: '12px',
    color: '#94a3b8',
  },
  value: {
    fontSize: '14px',
    fontWeight: 600,
  },
  modifiers: {
    display: 'flex',
    flexDirection: 'column',
    gap: '6px',
  },
  modifierList: {
    display: 'flex',
    flexDirection: 'column',
    gap: '4px',
  },
  modifier: {
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
    padding: '6px 10px',
    backgroundColor: '#0f172a',
    borderRadius: '4px',
    fontSize: '12px',
  },
  modSource: {
    color: '#94a3b8',
    flex: 1,
  },
  modTarget: {
    color: '#64748b',
  },
  modValue: {
    fontWeight: 700,
    minWidth: '30px',
    textAlign: 'right',
  },
  empty: {
    color: '#64748b',
    fontSize: '14px',
    textAlign: 'center',
    padding: '20px',
  },
};
