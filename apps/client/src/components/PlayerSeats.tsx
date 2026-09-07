import type { PlayerSeatsProps } from '../types/props';
import type { CSSProperties } from "react";

const SEAT_POSITIONS = [
  { seat: 1, top: '5%', left: '50%' },
  { seat: 2, top: '20%', left: '80%' },
  { seat: 3, top: '50%', left: '95%' },
  { seat: 4, top: '80%', left: '80%' },
  { seat: 5, top: '95%', left: '50%' },
  { seat: 6, top: '80%', left: '20%' },
  { seat: 7, top: '50%', left: '5%' },
];

export default function PlayerSeats({
  players,
  currentPlayerId,
  debugMode = false,
  selectedPlayerId,
  onPlayerSelect,
}: PlayerSeatsProps) {
  const getStatusColor = (status: string) => {
    return status === 'eliminated' ? '#ef4444' : '#22c55e';
  };

  const getSeatPosition = (seat: number) => {
    return SEAT_POSITIONS.find((p) => p.seat === seat) || SEAT_POSITIONS[0];
  };

  return (
    <div style={styles.container}>
      <h3 style={styles.title}>Player Seats (7-Player Table)</h3>
      <div style={styles.tableArea}>
        {/* Table center */}
        <div style={styles.tableCenter}>
          <span style={styles.tableLabel}>Table Center</span>
          {currentPlayerId && (
            <div style={styles.currentPlayer}>
              Active: {currentPlayerId}
            </div>
          )}
        </div>

        {/* Player seats */}
        {players.map((player) => {
          const pos = getSeatPosition(player.seat);
          const isSelected = selectedPlayerId === player.id;
          const isCurrent = currentPlayerId === player.id;

          return (
            <div
              key={player.id}
              style={{
                ...styles.seat,
                top: pos.top,
                left: pos.left,
                border: isSelected
                  ? '3px solid #3b82f6'
                  : isCurrent
                  ? '3px solid #22c55e'
                  : '1px solid #475569',
                backgroundColor: player.status === 'eliminated'
                  ? '#374151'
                  : '#1e293b',
                opacity: player.status === 'eliminated' ? 0.6 : 1,
              }}
              onClick={() => onPlayerSelect?.(player.id)}
            >
              <div style={styles.seatHeader}>
                <span style={styles.seatNumber}>Seat {player.seat}</span>
                <span
                  style={{
                    ...styles.statusBadge,
                    backgroundColor: getStatusColor(player.status),
                  }}
                >
                  {player.status}
                </span>
              </div>

              <div style={styles.playerId}>
                {player.id}
              </div>

              <div style={styles.stats}>
                <div style={styles.stat}>
                  <span style={styles.statLabel}>VP</span>
                  <span style={styles.statValue}>{player.vp}</span>
                </div>
                <div style={styles.stat}>
                  <span style={styles.statLabel}>MIL</span>
                  <span style={styles.statValue}>{player.militaryResult}</span>
                </div>
                <div style={styles.stat}>
                  <span style={styles.statLabel}>MANA</span>
                  <span style={styles.statValue}>{player.mana}</span>
                </div>
              </div>

              <div style={styles.cards}>
                <div style={styles.cardInfo}>
                  <span style={styles.cardLabel}>Master</span>
                  <span style={styles.cardId}>{player.masterCardId}</span>
                </div>
                <div style={styles.cardInfo}>
                  <span style={styles.cardLabel}>Servant</span>
                  <span style={styles.cardId}>{player.servantCardId}</span>
                </div>
              </div>

              {debugMode && player.eliminationOrder && (
                <div style={styles.elimOrder}>
                  Eliminated: #{player.eliminationOrder}
                </div>
              )}
            </div>
          );
        })}
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
    position: 'relative',
    minHeight: '400px',
  },
  title: {
    margin: '0 0 12px 0',
    fontSize: '16px',
    fontWeight: 600,
  },
  tableArea: {
    position: 'relative',
    width: '100%',
    height: '350px',
  },
  tableCenter: {
    position: 'absolute',
    top: '50%',
    left: '50%',
    transform: 'translate(-50%, -50%)',
    width: '120px',
    height: '120px',
    borderRadius: '50%',
    backgroundColor: '#0f172a',
    border: '2px solid #334155',
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
  },
  tableLabel: {
    fontSize: '12px',
    color: '#94a3b8',
  },
  currentPlayer: {
    fontSize: '11px',
    color: '#22c55e',
    marginTop: '4px',
  },
  seat: {
    position: 'absolute',
    transform: 'translate(-50%, -50%)',
    padding: '10px',
    borderRadius: '6px',
    minWidth: '120px',
    cursor: 'pointer',
    transition: 'border-color 0.2s',
  },
  seatHeader: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: '6px',
  },
  seatNumber: {
    fontSize: '12px',
    fontWeight: 600,
  },
  statusBadge: {
    fontSize: '9px',
    padding: '2px 5px',
    borderRadius: '3px',
    color: '#fff',
    fontWeight: 600,
    textTransform: 'uppercase',
  },
  playerId: {
    fontSize: '11px',
    fontWeight: 500,
    marginBottom: '8px',
    wordBreak: 'break-all',
  },
  stats: {
    display: 'flex',
    gap: '8px',
    marginBottom: '8px',
  },
  stat: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
  },
  statLabel: {
    fontSize: '9px',
    color: '#94a3b8',
  },
  statValue: {
    fontSize: '14px',
    fontWeight: 700,
  },
  cards: {
    display: 'flex',
    flexDirection: 'column',
    gap: '4px',
  },
  cardInfo: {
    display: 'flex',
    justifyContent: 'space-between',
    fontSize: '10px',
  },
  cardLabel: {
    color: '#94a3b8',
  },
  cardId: {
    fontWeight: 500,
    maxWidth: '70px',
    overflow: 'hidden',
    textOverflow: 'ellipsis',
    whiteSpace: 'nowrap',
  },
  elimOrder: {
    marginTop: '6px',
    fontSize: '10px',
    color: '#ef4444',
    textAlign: 'center',
  },
};
