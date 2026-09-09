import { createMatchRoom, restoreMatchRoom, type MatchRoom, type MatchRoomProjection } from '@fd/rules/match-room';
import MatchTable from './pages/MatchTable';
import { useEffect, useMemo, useState } from 'react';
import {
  projectSevenAuthoringSessionFixture,
} from './state/seven-authoring-smoke-fixture';
import {
  createRemoteRoom,
  joinRemoteRoom,
  RemoteMatchRoomClient,
  type RemoteRoomConnection,
} from './state/match-room-client';
import { projectRemoteRoomFixture } from './state/remote-room-fixture';
import { loadPlaytestClientFixture, type ClientAvailableAction, type PlaytestClientFixture } from './state/playtest-fixture-loader';
import './App.css';

const HOST_CLIENT_ID = 'host';
const PLAYER_CLIENT_IDS = ['host', 'client-2', 'client-3', 'client-4', 'client-5', 'client-6', 'client-7'];
const LOCAL_CLIENT_ID = HOST_CLIENT_ID;
const WATCHER_CLIENT_ID = 'watcher';
const STORAGE_KEY = 'fd.local.match-room.snapshot';
const PAUSE_SNAPSHOT_KEY = 'fd.local.match-room.pause-snapshot';
const REMOTE_STORAGE_KEY = 'fd.remote.match-room.connection';

function createLocalRoom(): MatchRoom {
  const room = createMatchRoom({ seed: 20260905, hostClientId: HOST_CLIENT_ID, hostName: '房主' });
  PLAYER_CLIENT_IDS.forEach((clientId, index) => {
    if (clientId !== HOST_CLIENT_ID) room.joinRoom({ clientId, displayName: `玩家 ${index + 1}` });
    room.selectSeat(clientId, index + 1);
  });
  room.joinRoom({ clientId: WATCHER_CLIENT_ID, displayName: '观战者', role: 'spectator' });
  room.startMatch(HOST_CLIENT_ID);
  return room;
}

function getStoredSnapshot(): string | null {
  if (typeof window === 'undefined') return null;
  return window.localStorage.getItem(STORAGE_KEY);
}

function storeSnapshot(snapshot: string): void {
  if (typeof window === 'undefined') return;
  window.localStorage.setItem(STORAGE_KEY, snapshot);
}

function storePauseSnapshot(snapshot: string): void {
  if (typeof window === 'undefined') return;
  window.localStorage.setItem(PAUSE_SNAPSHOT_KEY, snapshot);
}

function storeRemoteConnection(connection: RemoteRoomConnection): void {
  if (typeof window === 'undefined') return;
  window.localStorage.setItem(REMOTE_STORAGE_KEY, JSON.stringify(connection));
}

function priorityClientId(projection: MatchRoomProjection): string | undefined {
  const priorityPlayerId = projection.match?.priorityPlayerId;
  if (!priorityPlayerId) return undefined;
  return projection.seats.find((seat) => seat.playerId === priorityPlayerId && seat.controller === 'human')?.clientId;
}

function getStoredRemoteConnection(): RemoteRoomConnection | null {
  if (typeof window === 'undefined') return null;
  const raw = window.localStorage.getItem(REMOTE_STORAGE_KEY);
  if (!raw) return null;
  try {
    return JSON.parse(raw) as RemoteRoomConnection;
  } catch {
    return null;
  }
}

export default function App() {
  if (getE2eFixtureMode() === 'interaction') return <E2eInteractionHarness />;
  const remoteConnection = getRemoteConnection();
  if (remoteConnection) return <RemoteRoomApp connection={remoteConnection} />;
  return <LocalRoomApp />;
}

function E2eInteractionHarness() {
  const [actionRecords, setActionRecords] = useState<Array<Record<string, unknown>>>([]);
  const [consumedDirectives, setConsumedDirectives] = useState<string[]>([]);
  const [restoredCheckpoints, setRestoredCheckpoints] = useState<string[]>([]);
  const [pausedDirectives, setPausedDirectives] = useState<string[]>([]);
  const fixture = useMemo(() => createE2eInteractionFixture(), []);

  return (
    <div className='app-shell'>
      <MatchTable
        fixture={fixture}
        onAction={(action) => setActionRecords((records) => [...records, action as unknown as Record<string, unknown>])}
        onConsumeDirective={(directiveId) => setConsumedDirectives((records) => [...records, directiveId])}
        onPauseForFix={(directiveId) => {
          storePauseSnapshot(JSON.stringify({ directiveId, fixture }));
          setPausedDirectives((records) => [...records, directiveId]);
        }}
        onRestoreReplay={(checkpointId) => setRestoredCheckpoints((records) => [...records, checkpointId])}
        canAdjudicate
      />
      <section aria-label='e2e 提交记录' hidden>
        <pre>{JSON.stringify({ actionRecords, consumedDirectives, restoredCheckpoints, pausedDirectives })}</pre>
      </section>
    </div>
  );
}

function LocalRoomApp() {
  const [room, setRoom] = useState<MatchRoom>(() => createLocalRoom());
  const [activeClientId, setActiveClientId] = useState(LOCAL_CLIENT_ID);
  const [savedSnapshot, setSavedSnapshot] = useState<string | null>(() => getStoredSnapshot());
  const [pauseNotice, setPauseNotice] = useState<string | null>(null);
  const [revision, setRevision] = useState(0);
  const roomProjection: MatchRoomProjection = useMemo(
    () => room.getProjection(activeClientId),
    [activeClientId, revision, room],
  );
  const fixture = room.session
    ? projectSevenAuthoringSessionFixture(room.session, roomProjection.viewer.playerId ?? `spectator:${activeClientId}`)
    : null;

  useEffect(() => {
    if (activeClientId === WATCHER_CLIENT_ID) return;
    const nextClientId = priorityClientId(roomProjection);
    if (nextClientId && nextClientId !== activeClientId) setActiveClientId(nextClientId);
  }, [activeClientId, roomProjection]);

  const refreshRoom = () => setRevision((value) => value + 1);

  const dispatchAction = (action: ClientAvailableAction) => {
    if (!action.backendCommand || !roomProjection.viewer.playerId) return;
    room.dispatchClientCommand(activeClientId, action.backendCommand);
    refreshRoom();
  };

  const saveRoom = () => {
    const snapshot = JSON.stringify(room.serializeRoom());
    storeSnapshot(snapshot);
    setSavedSnapshot(snapshot);
  };

  const restoreRoom = () => {
    const snapshot = savedSnapshot ?? getStoredSnapshot();
    if (!snapshot) return;
    setRoom(restoreMatchRoom(JSON.parse(snapshot)));
    setRevision((value) => value + 1);
  };

  const disconnect = () => {
    room.disconnect(activeClientId);
    refreshRoom();
  };

  const reconnect = () => {
    const token = roomProjection.clients.find((client) => client.id === activeClientId)?.reconnectToken;
    if (!token) return;
    room.reconnect(token);
    refreshRoom();
  };

  const consumeDirective = (directiveId: string) => {
    room.consumeDirective(HOST_CLIENT_ID, directiveId);
    refreshRoom();
  };

  const pauseForFix = (directiveId: string) => {
    const snapshot = JSON.stringify(room.serializeRoom());
    storePauseSnapshot(snapshot);
    setSavedSnapshot(snapshot);
    setPauseNotice(`已暂停并保存现场：${directiveId}。存档键 ${PAUSE_SNAPSHOT_KEY}`);
  };

  const restoreReplay = (checkpointId: string) => {
    room.restoreToReplayCheckpoint(HOST_CLIENT_ID, checkpointId);
    refreshRoom();
  };

  const endTurn = () => {
    room.endClientTurn(activeClientId);
    refreshRoom();
  };

  const activeClient = roomProjection.clients.find((client) => client.id === activeClientId);
  return (
    <div className='app-shell'>
      <section className='room-strip' aria-label='对局房间'>
        <div className='room-strip__summary'>
          <span>ROOM {roomProjection.roomId}</span>
          <strong>{roomProjection.status === 'running' ? '实战进行中' : roomProjection.status}</strong>
          <small>{roomProjection.viewer.role} · {roomProjection.viewer.playerId ?? '观战'} · {activeClient?.connected ? 'connected' : 'disconnected'}</small>
        </div>
        <div className='room-strip__seats' aria-label='七人选座'>
          {roomProjection.seats.map((seat) => (
            <span key={seat.playerId} className={seat.controller === 'human' ? 'is-human' : ''}>
              <b>{seat.seat}</b>{seat.displayName}
            </span>
          ))}
        </div>
        <div className='room-strip__actions'>
          <select
            aria-label='切换客户端'
            value={activeClientId}
            onChange={(event) => setActiveClientId(event.currentTarget.value)}
          >
            {PLAYER_CLIENT_IDS.map((clientId, index) => (
              <option key={clientId} value={clientId}>客户端 {index + 1}</option>
            ))}
            <option value={WATCHER_CLIENT_ID}>观战客户端</option>
          </select>
          <button type='button' onClick={saveRoom}>保存</button>
          <button type='button' onClick={restoreRoom} disabled={!savedSnapshot}>恢复</button>
          <button type='button' onClick={disconnect} disabled={!activeClient?.connected}>断线</button>
          <button type='button' onClick={reconnect} disabled={activeClient?.connected}>重连</button>
          <button
            type='button'
            onClick={() => setActiveClientId((current) => current === WATCHER_CLIENT_ID ? LOCAL_CLIENT_ID : WATCHER_CLIENT_ID)}
          >
            {activeClientId === WATCHER_CLIENT_ID ? '切回玩家' : '切换观战'}
          </button>
        </div>
      </section>
      <RemoteLobbyPanel />
      {pauseNotice ? <div role='alert' className='test-pause-notice'>{pauseNotice}</div> : null}
      {fixture ? (
        <MatchTable
          fixture={fixture}
          onAction={dispatchAction}
          onConsumeDirective={consumeDirective}
          onPauseForFix={pauseForFix}
          onRestoreReplay={restoreReplay}
          onEndTurn={endTurn}
          canAdjudicate
        />
      ) : null}
    </div>
  );
}

function RemoteLobbyPanel() {
  const [httpBaseUrl, setHttpBaseUrl] = useState('http://127.0.0.1:8787');
  const [roomId, setRoomId] = useState('fd-live-1');
  const [clientId, setClientId] = useState('host');
  const [displayName, setDisplayName] = useState('房主');
  const [remoteLaunchUrl, setRemoteLaunchUrl] = useState<string | null>(() => {
    const stored = getStoredRemoteConnection();
    return stored ? buildRemoteLaunchUrl(stored) : null;
  });
  const [remoteError, setRemoteError] = useState<string | null>(null);

  const useResponse = (response: { roomId: string; clientId: string; reconnectToken: string }) => {
    const connection = {
      httpBaseUrl,
      wsBaseUrl: httpBaseUrl.replace(/^http/, 'ws'),
      roomId: response.roomId,
      clientId: response.clientId,
      reconnectToken: response.reconnectToken,
    };
    storeRemoteConnection(connection);
    setRemoteLaunchUrl(buildRemoteLaunchUrl(connection));
    setRemoteError(null);
  };

  const createRoom = async () => {
    try {
      useResponse(await createRemoteRoom(httpBaseUrl, {
        roomId,
        hostClientId: clientId,
        hostName: displayName,
        seed: 20260905,
      }));
    } catch (error) {
      setRemoteError(error instanceof Error ? error.message : '创建联机房间失败');
    }
  };

  const joinRoom = async () => {
    try {
      useResponse(await joinRemoteRoom(httpBaseUrl, roomId, {
        clientId,
        displayName,
        role: clientId === WATCHER_CLIENT_ID ? 'spectator' : 'player',
      }));
    } catch (error) {
      setRemoteError(error instanceof Error ? error.message : '加入联机房间失败');
    }
  };

  return (
    <section className='remote-lobby' aria-label='联机大厅'>
      <label>
        <span>服务</span>
        <input value={httpBaseUrl} onChange={(event) => setHttpBaseUrl(event.currentTarget.value)} />
      </label>
      <label>
        <span>房间</span>
        <input value={roomId} onChange={(event) => setRoomId(event.currentTarget.value)} />
      </label>
      <label>
        <span>客户端</span>
        <input value={clientId} onChange={(event) => setClientId(event.currentTarget.value)} />
      </label>
      <label>
        <span>名称</span>
        <input value={displayName} onChange={(event) => setDisplayName(event.currentTarget.value)} />
      </label>
      <button type='button' onClick={createRoom}>创建联机房间</button>
      <button type='button' onClick={joinRoom}>加入联机房间</button>
      {remoteLaunchUrl ? <a href={remoteLaunchUrl}>打开远程桌面</a> : null}
      {remoteError ? <span role='alert'>{remoteError}</span> : null}
    </section>
  );
}

function buildRemoteLaunchUrl(connection: RemoteRoomConnection): string {
  const base = typeof window === 'undefined' ? 'http://127.0.0.1:3000/' : `${window.location.origin}${window.location.pathname}`;
  const params = new URLSearchParams({
    remote: '1',
    roomId: connection.roomId,
    clientId: connection.clientId,
    token: connection.reconnectToken,
    http: connection.httpBaseUrl,
    ws: connection.wsBaseUrl,
  });
  return `${base}?${params.toString()}`;
}

function getE2eFixtureMode(): string | null {
  if (typeof window === 'undefined') return null;
  return new URLSearchParams(window.location.search).get('e2e');
}

function createE2eInteractionFixture(): PlaytestClientFixture {
  const fixture = loadPlaytestClientFixture();
  return {
    ...fixture,
    interactionWindows: [
      {
        id: 'payment:e2e',
        kind: 'payment',
        title: '支付窗口',
        controllerId: fixture.match.priorityPlayerId,
        min: 1,
        max: 5,
        currentMana: 6,
        variableCosts: [{ name: 'X', min: 1, max: 5 }],
        actions: [{
          actionId: 'payment:e2e:submit',
          kind: 'play_card',
          ownerPlayerId: fixture.match.priorityPlayerId,
          label: '支付 X=1',
          backendCommand: {
            type: 'activate_ability',
            cardInstanceId: fixture.self.skills[0]!,
            abilityId: 'fixture.pay-x',
          },
        }],
      },
      {
        id: 'target:e2e',
        kind: 'target',
        title: '选择目标',
        controllerId: fixture.match.priorityPlayerId,
        min: 2,
        max: 2,
        candidates: [
          { id: fixture.self.skills[0]!, label: '星之开拓者', kind: 'card', zone: 'skill' },
          { id: fixture.players[1]!.id, label: '对手', kind: 'player' },
          { id: 'shinto', label: '新都', kind: 'location' },
        ],
        actions: [{
          actionId: 'target:e2e:submit',
          kind: 'respond',
          ownerPlayerId: fixture.match.priorityPlayerId,
          label: '确认目标',
          backendCommand: {
            type: 'choose_target',
            decisionId: 'target:e2e',
            selectedIds: [],
          },
        }],
      },
      {
        id: 'response:e2e',
        kind: 'response',
        title: '唯一触发选择',
        controllerId: fixture.match.priorityPlayerId,
        actions: [{
          actionId: 'response:e2e:activate',
          kind: 'respond',
          ownerPlayerId: fixture.match.priorityPlayerId,
          label: '发动响应',
          backendCommand: {
            type: 'resolve_response',
            windowId: 'response:e2e',
            cardInstanceId: fixture.self.skills[1]!,
            abilityId: 'fixture.response',
          },
        }],
      },
    ],
    directives: [
      {
        id: 'directive:e2e',
        controllerId: fixture.match.priorityPlayerId,
        kind: 'host_adjudicated',
        status: 'pending',
        label: 'false_attendant_book_replacement',
        payload: { sourceCardId: fixture.self.masterSkills?.[0], abilityId: 'fixture.directive' },
      },
    ],
    zones: [
      ...(fixture.zones ?? []),
      { id: 'event_deck', label: '事件牌库', cardIds: [], count: 20, status: 'enabled' },
      { id: 'unowned_servant_pool', label: '无主从者池', cardIds: [], count: 0, status: 'host_adjudicated' },
    ],
    logs: [{ id: 'log:e2e', type: 'dispatch_ok', message: 'e2e fixture dispatch record' }],
    replay: [{ id: 'checkpoint:e2e', round: 1, phase: '行动阶段', revision: 1, label: 'round 1 start' }],
    backendRejection: 'illegal_target: Selected targets are not legal',
  };
}

function RemoteRoomApp({ connection }: { connection: RemoteRoomConnection }) {
  const [client] = useState(() => new RemoteMatchRoomClient(connection));
  const [projection, setProjection] = useState<MatchRoomProjection | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [pauseNotice, setPauseNotice] = useState<string | null>(null);
  const [revision, setRevision] = useState(0);

  useEffect(() => {
    const unsubscribe = client.subscribe((message) => {
      if (message.type === 'server:projection') {
        setProjection(message.projection);
        setRevision(message.version);
      }
      if (message.type === 'server:error') setError(message.message);
    });
    client.connect();
    return () => {
      unsubscribe();
      client.close();
    };
  }, [client]);

  const fixture = projection ? projectRemoteRoomFixture(projection) : null;
  const dispatchAction = (action: ClientAvailableAction) => {
    const expectedRevision = projection?.match?.view.revision;
    if (!action.backendCommand || expectedRevision === undefined) return;
    client.send({ type: 'client:dispatch_command', command: action.backendCommand, expectedRevision });
  };
  const endTurn = () => {
    const expectedRevision = projection?.match?.view.revision;
    if (expectedRevision === undefined) return;
    client.send({ type: 'client:end_turn', expectedRevision });
  };

  return (
    <div className='app-shell'>
      <section className='room-strip' aria-label='远程对局房间'>
        <div className='room-strip__summary'>
          <span>REMOTE {connection.roomId}</span>
          <strong>{projection?.status ?? 'connecting'}</strong>
          <small>{connection.clientId} · rev {revision}</small>
        </div>
        <div className='room-strip__seats' aria-label='远程七人选座'>
          {(projection?.seats ?? []).map((seat) => (
            <button
              type='button'
              key={seat.playerId}
              className={seat.controller === 'human' ? 'is-human' : ''}
              onClick={() => client.send({ type: 'client:select_seat', seat: seat.seat })}
            >
              <b>{seat.seat}</b>{seat.displayName}
            </button>
          ))}
        </div>
        <div className='room-strip__actions'>
          <button type='button' onClick={() => client.send({ type: 'client:start_match' })}>开始</button>
          <button type='button' onClick={() => client.send({ type: 'client:request_projection' })}>同步</button>
        </div>
      </section>
      {error ? <div role='alert' className='remote-error'>{error}</div> : null}
      {pauseNotice ? <div role='alert' className='test-pause-notice'>{pauseNotice}</div> : null}
      {fixture ? (
        <MatchTable
          fixture={fixture}
          onAction={dispatchAction}
          onConsumeDirective={(directiveId) => client.send({ type: 'client:consume_directive', directiveId })}
          onPauseForFix={(directiveId) => setPauseNotice(`已暂停在 directive：${directiveId}。请保留当前房间 ${connection.roomId} 供排查。`)}
          onRestoreReplay={(checkpointId) => client.send({ type: 'client:restore_replay', checkpointId })}
          onEndTurn={endTurn}
          canAdjudicate={projection?.viewer.isHost ?? false}
        />
      ) : null}
    </div>
  );
}

function getRemoteConnection(): RemoteRoomConnection | null {
  if (typeof window === 'undefined') return null;
  const params = new URLSearchParams(window.location.search);
  if (params.get('remote') !== '1') return null;
  const roomId = params.get('roomId');
  const clientId = params.get('clientId');
  const reconnectToken = params.get('token');
  if (!roomId || !clientId || !reconnectToken) return null;
  const httpBaseUrl = params.get('http') ?? 'http://127.0.0.1:8787';
  const wsBaseUrl = params.get('ws') ?? httpBaseUrl.replace(/^http/, 'ws');
  return { httpBaseUrl, wsBaseUrl, roomId, clientId, reconnectToken };
}
