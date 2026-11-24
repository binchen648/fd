import { expect, it } from 'vitest';
import { defaultServiceUrl, roomInviteUrl, publicLobbyDefaults } from './public-playtest';

it('uses HTTPS/WSS-compatible same origin in public mode while keeping development default', () => {
  expect(defaultServiceUrl('https://fd.example:1234/', true)).toBe('https://fd.example:1234');
  expect(defaultServiceUrl('http://localhost:3000/', false)).toBe('http://127.0.0.1:8787');
});
it('shares room identity without owner credentials or private launch query parameters', () => {
  const link = roomInviteUrl('room & x', 'https://fd.example/?remote=1&token=PRIVATE&clientId=host&http=http://old', 'https://fd.example');
  expect(new URL(link).searchParams.get('join')).toBe('room & x');
  for (const text of ['PRIVATE', 'token=', 'clientId=', 'remote=', 'old']) expect(link).not.toContain(text);
  const basic = roomInviteUrl('r', 'https://alice:secret@fd.example/?token=PRIVATE', 'https://fd.example');
  expect(basic).not.toContain('alice'); expect(basic).not.toContain('secret');
});
it('assigns distinct guest identities and keeps an explicit service address on invitation', () => {
  const invite = roomInviteUrl('r', 'http://localhost:3000/', 'https://relay.example:2345');
  const a = publicLobbyDefaults(invite, true), b = publicLobbyDefaults(invite, true);
  expect(a.roomId).toBe('r'); expect(a.httpBaseUrl).toBe('https://relay.example:2345');
  expect(a.clientId).not.toBe(b.clientId); expect(a.clientId).not.toBe('host');
});
it('keeps a malformed or mixed-content invitation recoverable instead of crashing render', () => {
  for (const service of ['broken', 'javascript:alert(1)', 'http://unsafe.example']) {
    const value = publicLobbyDefaults('https://fd.example/?join=r&service=' + encodeURIComponent(service), true);
    expect(value.httpBaseUrl).toBe('https://fd.example'); expect(value.serviceError).toBeTruthy();
  }
});
