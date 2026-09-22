import { restoreMatchSession, type MatchSessionSnapshot } from '../src/match-session';

export function restoreTrustedAuthoringFixtureSession(snapshot: MatchSessionSnapshot) {
  return restoreMatchSession(snapshot, { restorePackKind: 'trusted_authoring_fixture' });
}