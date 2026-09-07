import type { PhaseIndicatorProps } from '../types/props';
import type { CSSProperties } from "react";

const phaseLabels: Record<string, string> = {
  round_start: 'Round Start',
  preparation: 'Preparation',
  advance: 'Advance',
  action: 'Action',
  battle: 'Battle',
  cleanup: 'Cleanup',
  round_end: 'Round End',
};

const phaseColors: Record<string, string> = {
  round_start: '#3b82f6',
  preparation: '#8b5cf6',
  advance: '#06b6d4',
  action: '#22c55e',
  battle: '#ef4444',
  cleanup: '#f59e0b',
  round_end: '#64748b',
};

export default function PhaseIndicator({
  activePhase,
  prioritySeat,
  roundNumber,
}: PhaseIndicatorProps) {
  return (
    <div style={styles.container}>
      <div style={styles.roundInfo}>
        <span style={styles.roundLabel}>Round</span>
        <span style={styles.roundNumber}>{roundNumber}</span>
      </div>
      <div
        style={{
          ...styles.phaseBadge,
          backgroundColor: phaseColors[activePhase] || '#64748b',
        }}
      >
        {phaseLabels[activePhase] || activePhase}
      </div>
      <div style={styles.priority}>
        <span style={styles.priorityLabel}>Priority Seat:</span>
        <span style={styles.priorityValue}>{prioritySeat}</span>
      </div>
    </div>
  );
}

const styles: Record<string, CSSProperties> = {
  container: {
    display: 'flex',
    alignItems: 'center',
    gap: '16px',
    padding: '12px 16px',
    backgroundColor: '#1e293b',
    borderRadius: '8px',
    color: '#f1f5f9',
  },
  roundInfo: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
  },
  roundLabel: {
    fontSize: '10px',
    color: '#94a3b8',
    textTransform: 'uppercase',
  },
  roundNumber: {
    fontSize: '24px',
    fontWeight: 700,
    color: '#f1f5f9',
  },
  phaseBadge: {
    padding: '8px 16px',
    borderRadius: '6px',
    fontSize: '14px',
    fontWeight: 600,
    color: '#fff',
  },
  priority: {
    display: 'flex',
    alignItems: 'center',
    gap: '6px',
    marginLeft: 'auto',
  },
  priorityLabel: {
    fontSize: '12px',
    color: '#94a3b8',
  },
  priorityValue: {
    fontSize: '16px',
    fontWeight: 700,
    color: '#22c55e',
  },
};
