import type { MapBoardProps } from '../types/props';
import type { CSSProperties } from "react";

const locationColors: Record<string, string> = {
  miyama_town: '#4ade80',
  shinto: '#60a5fa',
  magic_workshop: '#c084fc',
  recon: '#fb923c',
  moon_holy_grail: '#facc15',
};

export default function MapBoard({
  map,
  locationConfig,
  locationOccupancy,
  activeBattlefield,
  showMoonHolyGrail = true,
  debugMode = false,
  onLocationSelect,
  selectedLocationId,
}: MapBoardProps) {
  const enabledLocations = map.locations.filter(
    (loc) =>
      locationConfig.enabledLocationIds.includes(loc.id) &&
      (!loc.optional || showMoonHolyGrail)
  );

  return (
    <div style={styles.container}>
      <h3 style={styles.title}>Map Board</h3>
      <div style={styles.grid}>
        {enabledLocations.map((location) => {
          const players = locationOccupancy[location.id] || [];
          const isActiveBattlefield = activeBattlefield === location.id;
          const isMoonGrail = location.id === 'moon_holy_grail';

          return (
            <div
              key={location.id}
              onClick={() => onLocationSelect?.(location.id)}
              style={{
                ...styles.location,
                backgroundColor: locationColors[location.id] || '#94a3b8',
                border: isActiveBattlefield 
                  ? '3px solid #ef4444' 
                  : selectedLocationId === location.id 
                  ? '3px solid #3b82f6' 
                  : '2px solid #475569',
                boxShadow: isActiveBattlefield ? '0 0 20px #ef4444' : undefined,
                cursor: onLocationSelect ? 'pointer' : undefined,
              }}
            >
              <div style={styles.locationHeader}>
                <span style={styles.locationName}>{location.displayName}</span>
                {isMoonGrail && <span style={styles.moonGrailBadge}>Moon Grail</span>}
              </div>
              <div style={styles.locationMeta}>
                <span>Mode: {location.occupancyMode}</span>
                <span>Event: {location.eventPolicy}</span>
              </div>
              <div style={styles.occupancy}>
                <span style={styles.occupancyLabel}>Players:</span>
                {players.length === 0 ? (
                  <span style={styles.noPlayers}>None</span>
                ) : (
                  players.map((pid) => (
                    <span key={pid} style={styles.playerBadge}>
                      {pid}
                    </span>
                  ))
                )}
              </div>
              {debugMode && location.movementLinks.length > 0 && (
                <div style={styles.links}>
                  Links: {location.movementLinks.join(', ')}
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
  },
  title: {
    margin: '0 0 12px 0',
    fontSize: '16px',
    fontWeight: 600,
  },
  grid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))',
    gap: '12px',
  },
  location: {
    padding: '12px',
    borderRadius: '6px',
    color: '#0f172a',
  },
  locationHeader: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: '8px',
  },
  locationName: {
    fontWeight: 700,
    fontSize: '14px',
  },
  moonGrailBadge: {
    fontSize: '10px',
    padding: '2px 6px',
    backgroundColor: 'rgba(0,0,0,0.2)',
    borderRadius: '4px',
    fontWeight: 600,
  },
  locationMeta: {
    fontSize: '11px',
    opacity: 0.8,
    marginBottom: '8px',
    display: 'flex',
    flexDirection: 'column',
    gap: '2px',
  },
  occupancy: {
    display: 'flex',
    alignItems: 'center',
    gap: '6px',
    flexWrap: 'wrap',
  },
  occupancyLabel: {
    fontSize: '12px',
    fontWeight: 500,
  },
  noPlayers: {
    fontSize: '12px',
    opacity: 0.6,
  },
  playerBadge: {
    fontSize: '11px',
    padding: '2px 6px',
    backgroundColor: 'rgba(0,0,0,0.2)',
    borderRadius: '3px',
    fontWeight: 600,
  },
  links: {
    marginTop: '8px',
    fontSize: '10px',
    opacity: 0.7,
  },
};
