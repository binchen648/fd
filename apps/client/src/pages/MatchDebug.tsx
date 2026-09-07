import { useState } from "react";
import type { CSSProperties } from "react";

import ContentSchedulePanel from '../components/ContentSchedulePanel';
import EventPanel from "../components/EventPanel";
import LogPanel from "../components/LogPanel";
import MapBoard from "../components/MapBoard";
import PhaseIndicator from "../components/PhaseIndicator";
import PlayerSeats from "../components/PlayerSeats";
import SituationPanel from "../components/SituationPanel";
import { deriveLocationOccupancy } from "../state/engine-bridge";
import type { MatchDebugProps } from "../types/props";

export default function MatchDebug({
  gameState,
  debugMode = false,
  onPlayerSelect,
  onLocationSelect,
  selectedLocationId,
  onAdvancePhase,
  onReset,
}: MatchDebugProps) {
  const [selectedPlayerId, setSelectedPlayerId] = useState<string | undefined>();
  const [logFilterPlayer] = useState<string | undefined>();
  const [logFilterType] = useState<string | undefined>();

  const locationOccupancy = deriveLocationOccupancy({ map: gameState.map, players: gameState.players });

  const handlePlayerSelect = (playerId: string) => {
    setSelectedPlayerId(playerId);
    onPlayerSelect?.(playerId);
  };

  return (
    <div style={styles.container}>
      <header style={styles.header}>
        <h1 style={styles.title}>FD Debug Client - 7 Player Match</h1>
        <div style={styles.headerControls}>
          <label style={styles.toggle}>
            <input type="checkbox" checked={debugMode} readOnly />
            <span>Debug Mode</span>
          </label>
          <button style={styles.button} onClick={onAdvancePhase}>
            Advance Phase
          </button>
          <button style={{ ...styles.button, ...styles.resetButton }} onClick={onReset}>
            Reset
          </button>
        </div>
      </header>

      <div style={styles.phaseArea}>
        <PhaseIndicator
          activePhase={gameState.round.activePhase}
          prioritySeat={gameState.round.prioritySeat}
          roundNumber={gameState.round.roundNumber}
        />
      </div>

      <div style={styles.main}>
        <div style={styles.leftColumn}>
          <MapBoard
            map={gameState.map}
            locationConfig={gameState.locationConfig}
            locationOccupancy={locationOccupancy}
            activeBattlefield={undefined}
            showMoonHolyGrail={true}
            debugMode={debugMode}
            onLocationSelect={onLocationSelect}
            selectedLocationId={selectedLocationId}
          />
          <SituationPanel
            currentSituationCardId={gameState.currentSituationCardId}
            currentSituationModifiers={gameState.currentSituationModifiers}
          />
          <ContentSchedulePanel
            currentRound={gameState.round.roundNumber}
            contentRuntime={gameState.contentRuntime}
          />
        </div>

        <div style={styles.centerColumn}>
          <PlayerSeats
            players={gameState.players}
            currentPlayerId={gameState.players.find((player) => player.seat === gameState.round.prioritySeat)?.id}
            debugMode={debugMode}
            selectedPlayerId={selectedPlayerId}
            onPlayerSelect={handlePlayerSelect}
          />
        </div>

        <div style={styles.rightColumn}>
          <EventPanel eventPlacements={gameState.eventPlacements} debugMode={debugMode} />
          <LogPanel
            log={gameState.log}
            filterPlayerId={logFilterPlayer}
            filterType={logFilterType}
          />
        </div>
      </div>

      <footer style={styles.footer}>
        <div style={styles.footerInfo}>
          <span>Game ID: {gameState.id}</span>
          <span>|</span>
          <span>Players: {gameState.players.length}/7</span>
          <span>|</span>
          <span>Cards: {gameState.cards.length}</span>
          <span>|</span>
          <span>Effect Stack: {gameState.effectStack.length}</span>
        </div>
      </footer>
    </div>
  );
}

const styles: Record<string, CSSProperties> = {
  container: {
    minHeight: "100vh",
    backgroundColor: "#0f172a",
    color: "#f1f5f9",
    display: "flex",
    flexDirection: "column",
    fontFamily: "system-ui, -apple-system, sans-serif",
  },
  header: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    padding: "16px 24px",
    backgroundColor: "#1e293b",
    borderBottom: "1px solid #334155",
  },
  title: {
    margin: 0,
    fontSize: "20px",
    fontWeight: 700,
  },
  headerControls: {
    display: "flex",
    alignItems: "center",
    gap: "16px",
  },
  toggle: {
    display: "flex",
    alignItems: "center",
    gap: "8px",
    fontSize: "14px",
    cursor: "pointer",
  },
  button: {
    padding: "8px 16px",
    backgroundColor: "#3b82f6",
    color: "#fff",
    border: "none",
    borderRadius: "6px",
    fontSize: "14px",
    fontWeight: 500,
    cursor: "pointer",
    transition: "background-color 0.2s",
  },
  resetButton: {
    backgroundColor: "#475569",
  },
  phaseArea: {
    padding: "16px 24px",
    backgroundColor: "#0f172a",
  },
  main: {
    flex: 1,
    display: "grid",
    gridTemplateColumns: "300px 1fr 350px",
    gap: "16px",
    padding: "16px 24px",
  },
  leftColumn: {
    display: "flex",
    flexDirection: "column",
    gap: "16px",
  },
  centerColumn: {
    minWidth: 0,
  },
  rightColumn: {
    display: "flex",
    flexDirection: "column",
    gap: "16px",
  },
  footer: {
    padding: "12px 24px",
    backgroundColor: "#1e293b",
    borderTop: "1px solid #334155",
  },
  footerInfo: {
    display: "flex",
    gap: "12px",
    fontSize: "12px",
    color: "#94a3b8",
  },
};
