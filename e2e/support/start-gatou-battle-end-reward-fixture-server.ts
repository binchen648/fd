import { createMatchServer } from '../../apps/server/src/match-server';

const hostClientId = 'host-b22-gatou-reward';
const server = createMatchServer();
const port = await server.listen(0);
const roomId = `fd-b22-gatou-reward-${process.pid}`;
const projection = server.hub.createRoom({ roomId, hostClientId, hostName: '房主', seed: 20260922 });
const room = server.hub.getRoom(roomId);
room.selectSeat(hostClientId, 6);
room.startMatch(hostClientId);
const session = room.session;
if (!session) throw new Error('B22 E2E fixture session is missing');
const state = session.state;
state.round = { roundNumber: 1, activePhase: 'action', prioritySeat: 6 };
session.stopReason = undefined; session.logs = []; session.battleHistory = [];
state.battleResults = []; state.eventPlacements = []; state.currentSituationModifiers = [];
state.abilityRuntime.hostRequests = []; state.abilityRuntime.responseWindows = [];
state.abilityRuntime.pendingDelayedActivations = []; state.abilityRuntime.pendingPostBattleEvents = [];
delete state.abilityRuntime.pendingBattleTerminalEvent; delete state.abilityRuntime.pendingDecision;
state.modeState ??= {}; state.modeState.stagedAttacks = {};
for (const player of state.players) {
  player.status = ['p1', 'p2', 'p6'].includes(player.id) ? 'active' : 'eliminated';
  player.vp = 0; player.militaryResult = 0;
  if (player.id === 'p1' || player.id === 'p2') player.locationId = 'miyama_town';
  else if (player.id === 'p6') player.locationId = 'recon';
  else delete player.locationId;
}
state.players.find((player) => player.id === 'p1')!.mana = 4;
state.log.push({ type: 'movement', message: 'player:p2:normal_move:shinto->miyama_town', payload: { playerId: 'p2', from: 'shinto', to: 'miyama_town', movementKind: 'normal', manaSpent: 1, roundNumber: 1 } });
state.cards = []; state.abilityRuntime.cardState = {};
state.cards.push({ instanceId: 'b22-gatou-seeker', definitionId: 'master.gatou.skill.seeker', ownerPlayerId: 'p1', controllerPlayerId: 'p1', zone: 'skill', visibility: { scope: 'owner_only', ownerPlayerId: 'p1' } });
state.abilityRuntime.cardState['b22-gatou-seeker'] = { active: false, faceDown: false, playedRound: 1 };
state.cards.push({ instanceId: 'b22-gatou-attack', definitionId: 'basic.strength.5', ownerPlayerId: 'p1', controllerPlayerId: 'p1', zone: 'attack_area', visibility: { scope: 'public' } });
state.abilityRuntime.cardState['b22-gatou-attack'] = { active: true, faceDown: false, playedRound: 1 };
const host = projection.clients.find((candidate) => candidate.id === hostClientId);
if (!host) throw new Error('B22 E2E fixture host is missing');
process.stdout.write(`${JSON.stringify({ httpBase: `http://127.0.0.1:${port}`, wsBase: `ws://127.0.0.1:${port}`, roomId, clientId: host.id, reconnectToken: room.getIssuedCredential(host.id) })}\n`);
const shutdown = async () => { await server.close(); process.exit(0); };
process.once('SIGINT', shutdown); process.once('SIGTERM', shutdown);
