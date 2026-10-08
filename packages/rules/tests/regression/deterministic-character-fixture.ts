import contentLibrary from '../../../../data/generated/fd-playtest-v1.content-library.json';
import { buildSevenPlayerCharacterPairings, createMatchSession } from '../../src/match-session';

export const SEVEN_HUMAN_PLAYER_IDS = ['p1', 'p2', 'p3', 'p4', 'p5', 'p6', 'p7'];

type PairingRequirement = {
  playerId?: string;
  masterId?: string;
  servantId?: string;
};

const characters = Object.values(contentLibrary.rules.characters);
const masters = characters.filter((character) => character.kind === 'master');
const servants = characters.filter((character) => character.kind === 'servant');

export function seedIncludingPairings(requirements: readonly PairingRequirement[]): number {
  for (let seed = 1; seed <= 65_536; seed += 1) {
    const pairings = buildSevenPlayerCharacterPairings(masters, servants, seed);
    if (requirements.every((requirement) => pairings.some((pairing) =>
      (requirement.playerId === undefined || pairing.playerId === requirement.playerId) &&
      (requirement.masterId === undefined || pairing.master.id === requirement.masterId) &&
      (requirement.servantId === undefined || pairing.servant.id === requirement.servantId)))) {
      return seed;
    }
  }
  throw new Error('Unable to build deterministic character fixture: ' + JSON.stringify(requirements));
}

export function seedIncludingMaster(masterId: string, playerId?: string): number {
  return seedIncludingPairings([{ masterId, playerId }]);
}

export function seedIncludingServant(servantId: string, playerId?: string): number {
  return seedIncludingPairings([{ servantId, playerId }]);
}

export function seedIncludingMasterAndSituation(masterId: string, situationId: string): number {
  for (let seed = 1; seed <= 65_536; seed += 1) {
    const pairings = buildSevenPlayerCharacterPairings(masters, servants, seed);
    if (!pairings.some((pairing) => pairing.master.id === masterId)) continue;
    if (createMatchSession({ seed, humanPlayerId: 'p1' }).state.currentSituationCardId === situationId) return seed;
  }
  throw new Error('Unable to build deterministic master/situation fixture: ' + masterId + ' / ' + situationId);
}
