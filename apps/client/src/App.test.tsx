import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { afterEach, describe, expect, it, vi } from 'vitest';

import App from './App';
import { createMatchRoom } from '@fd/rules/match-room';
import { RemoteMatchRoomClient } from './state/match-room-client';
import type { ClientRoomMessage } from '@fd/rules/match-room-protocol';

afterEach(() => {
  vi.restoreAllMocks();
  vi.unstubAllGlobals();
  window.localStorage.clear();
  window.history.replaceState({}, '', '/');
});

describe('App room product shell', () => {
  it('reconnects locally using private credentials absent from the public room DTO', () => {
    const room = createMatchRoom({ roomId: 'local-private-reconnect', hostClientId: 'host' });
    room.disconnect('host');
    expect(JSON.stringify(room.getProjection('host'))).not.toContain('reconnectToken');
    room.reconnect(room.getIssuedCredential('host'));
    expect(room.getProjection('host').clients[0]?.connected).toBe(true);
  });

  it('does not send either mutation when its revision is missing or invalid', () => {
    const send = vi.fn();
    vi.stubGlobal('WebSocket', class {
      send = send;
      addEventListener() {}
      close() {}
    });
    const client = new RemoteMatchRoomClient({ httpBaseUrl: 'http://localhost', wsBaseUrl: 'ws://localhost', roomId: 'room', clientId: 'host', reconnectToken: 'private-test-token' });
    client.connect();
    for (const expectedRevision of [undefined, null, '2', NaN, Infinity, -1, 0.5]) {
      for (const type of ['client:end_turn', 'client:dispatch_command']) {
        client.send({ type, expectedRevision, command: { type: 'pass_priority' } } as unknown as ClientRoomMessage);
      }
    }
    expect(send).not.toHaveBeenCalled();
    client.send({ type: 'client:end_turn', expectedRevision: 2 });
    expect(send).toHaveBeenCalledWith(JSON.stringify({ type: 'client:end_turn', expectedRevision: 2 }));
    client.close();
  });
  it('renders the local room, seven seats, and connection controls', async () => {
    const user = userEvent.setup();
    render(<App />);

    expect(screen.getByLabelText('对局房间')).toBeInTheDocument();
    expect(screen.getByText('实战进行中')).toBeInTheDocument();
    expect(screen.getByText(/host · p1 · connected/)).toBeInTheDocument();
    expect(screen.getByLabelText('七人选座').querySelectorAll('span')).toHaveLength(7);
    expect(screen.getByLabelText('七人选座').querySelectorAll('.is-human')).toHaveLength(7);

    await user.click(screen.getByRole('button', { name: '断线' }));
    expect(screen.getByText(/host · p1 · disconnected/)).toBeInTheDocument();

    await user.click(screen.getByRole('button', { name: '重连' }));
    expect(screen.getByText(/host · p1 · connected/)).toBeInTheDocument();
  });

  it('saves, restores, and switches between followed player and spectator projections', async () => {
    const user = userEvent.setup();
    render(<App />);

    await user.click(screen.getByRole('button', { name: '保存' }));
    expect(screen.getByRole('button', { name: '恢复' })).toBeEnabled();

    await user.selectOptions(screen.getByLabelText('切换客户端'), 'client-2');
    expect(screen.getByText(/host · p1 · connected/)).toBeInTheDocument();

    await user.click(screen.getByRole('button', { name: '切换观战' }));
    expect(screen.getByText(/spectator · 观战 · connected/)).toBeInTheDocument();

    await user.click(screen.getByRole('button', { name: '恢复' }));
    expect(screen.getByText(/spectator · 观战 · connected/)).toBeInTheDocument();
  });

  it('ends the current local decision and follows the next player client', async () => {
    const user = userEvent.setup();
    render(<App />);

    await user.click(screen.getByRole('button', { name: /^(结束行动|完成准备|完成前哨|完成战斗)$/ }));
    const forceEnd = screen.queryByRole('button', { name: '仍然结束' });
    if (forceEnd) await user.click(forceEnd);

    expect(await screen.findByText(/player · p2 · connected/)).toBeInTheDocument();
    expect(screen.getByText(/player_passed/)).toBeInTheDocument();
  });

  it('creates a remote room from the lobby and persists a launch URL', async () => {
    const user = userEvent.setup();
    vi.spyOn(globalThis, 'fetch').mockResolvedValue({
      ok: true,
      json: async () => ({
        roomId: 'fd-remote-test',
        clientId: 'host',
        reconnectToken: 'token-host',
        projection: {},
      }),
    } as Response);
    render(<App />);

    await user.clear(screen.getByLabelText('房间'));
    await user.type(screen.getByLabelText('房间'), 'fd-remote-test');
    await user.click(screen.getByRole('button', { name: '创建联机房间' }));

    const link = await screen.findByRole('link', { name: '打开远程桌面' });
    expect(link).toHaveAttribute('href', expect.stringContaining('remote=1'));
    expect(link).toHaveAttribute('href', expect.stringContaining('roomId=fd-remote-test'));
    expect(window.localStorage.getItem('fd.remote.match-room.connection')).toContain('token-host');
  });

  it('joins a remote room from the lobby as a player client', async () => {
    const user = userEvent.setup();
    const fetchSpy = vi.spyOn(globalThis, 'fetch').mockResolvedValue({
      ok: true,
      json: async () => ({
        roomId: 'fd-remote-test',
        clientId: 'client-2',
        reconnectToken: 'token-p2',
        projection: {},
      }),
    } as Response);
    render(<App />);

    await user.clear(screen.getByLabelText('房间'));
    await user.type(screen.getByLabelText('房间'), 'fd-remote-test');
    await user.clear(screen.getByLabelText('客户端'));
    await user.type(screen.getByLabelText('客户端'), 'client-2');
    await user.clear(screen.getByLabelText('名称'));
    await user.type(screen.getByLabelText('名称'), '玩家 2');
    await user.click(screen.getByRole('button', { name: '加入联机房间' }));

    expect(fetchSpy).toHaveBeenCalledWith(
      'http://127.0.0.1:8787/rooms/fd-remote-test/join',
      expect.objectContaining({
        body: JSON.stringify({ clientId: 'client-2', displayName: '玩家 2', role: 'player' }),
      }),
    );
    expect(await screen.findByRole('link', { name: '打开远程桌面' })).toHaveAttribute('href', expect.stringContaining('clientId=client-2'));
  });
});
