function serviceUrl(value: string): string {
  const url = new URL(value);
  if (!['http:', 'https:'].includes(url.protocol) || url.username || url.password || url.search || url.hash) throw new Error('请输入有效的 HTTP/HTTPS 服务地址');
  return url.href.replace(/\/$/, '');
}
export function defaultServiceUrl(page: string, publicMode: boolean): string {
  return publicMode ? new URL(page).origin : 'http://127.0.0.1:8787';
}
export function roomInviteUrl(roomId: string, page: string, service: string): string {
  const url = new URL(page); url.search = ''; url.hash = '';
  url.searchParams.set('join', roomId);
  const endpoint = serviceUrl(service);
  if (endpoint !== url.origin) url.searchParams.set('service', endpoint);
  return url.href;
}
export function publicLobbyDefaults(page: string, publicMode: boolean) {
  const url = new URL(page), invited = url.searchParams.has('join'), shared = publicMode || invited;
  let httpBaseUrl = defaultServiceUrl(page, shared), serviceError: string | null = null;
  if (url.searchParams.has('service')) {
    try {
      httpBaseUrl = serviceUrl(url.searchParams.get('service')!);
      if (url.protocol === 'https:' && new URL(httpBaseUrl).protocol !== 'https:') throw new Error('Mixed content');
    } catch { httpBaseUrl = defaultServiceUrl(page, shared); serviceError = '邀请中的服务地址无效，已恢复为本站地址；请核对房间或服务地址。'; }
  }
  return { shared, roomId: url.searchParams.get('join') ?? (shared ? `fd-${crypto.randomUUID().slice(0, 8)}` : 'fd-live-1'),
    clientId: shared ? `player-${crypto.randomUUID()}` : 'host',
    httpBaseUrl, serviceError,
    displayName: invited ? '玩家' : '房主' };
}
