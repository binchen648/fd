import { fdRealAssetManifest } from './fd-asset-manifest';

export const approvedAuthoringMasterIds = [
  'master.gatou',
  'master.irisviel',
  'master.kayneth',
  'master.kiritsugu',
  'master.maiya',
  'master.olga-marie',
  'master.shinji',
] as const;

export const approvedAuthoringServantIds = [
  'servant.achilles',
  'servant.artoria-alt',
  'servant.artoriac',
  'servant.drake',
  'servant.ereshkigal',
  'servant.kintoki',
  'servant.tomoe',
] as const;

type EntityKind = 'master' | 'servant';

const approvedAuthoringMasterIdSet = new Set<string>(approvedAuthoringMasterIds);
const approvedAuthoringServantIdSet = new Set<string>(approvedAuthoringServantIds);

const placeholders = {
  card: '/assets/fd/placeholders/card.svg',
  commandSpell: '/assets/fd/placeholders/command-spell.svg',
  event: '/assets/fd/placeholders/event.svg',
  master: '/assets/fd/placeholders/master.svg',
  servant: '/assets/fd/placeholders/servant.svg',
  situation: '/assets/fd/placeholders/situation.svg',
  skill: '/assets/fd/placeholders/skill.svg',
} as const;

const masterPortraits: Record<string, string> = {
  'master.dan_blackmore': '/assets/fd/masters/dan.png',
  'master.gatou': '/assets/fd/masters/monji.png',
  'master.julius_harwey': '/assets/fd/masters/julius.png',
  'master.kayneth': '/assets/fd/masters/kayneth.png',
  'master.kayneth_archibald': '/assets/fd/masters/kayneth.png',
  'master.kiritsugu': '/assets/fd/masters/kiritsugu.png',
  'master.kiritsugu_emiya': '/assets/fd/masters/kiritsugu.png',
  'master.maiya': '/assets/fd/masters/maiya.png',
  'master.maiya_hisau': '/assets/fd/masters/maiya.png',
  'master.matou_shinji': '/assets/fd/masters/shinji.png',
  'master.monji_gatou': '/assets/fd/masters/monji.png',
  'master.shinji': '/assets/fd/masters/shinji.png',
};

const servantPortraits: Record<string, string> = {
  'servant.francis_drake': '/assets/fd/servants/drake.png',
  'servant.drake': '/assets/fd/servants/drake.png',
  'servant.galatea': '/assets/fd/servants/galatea.png',
  'servant.henry_jekyll': '/assets/fd/servants/jekyll.png',
  'servant.jing_ke': '/assets/fd/servants/jing-ke.png',
  'servant.suzuka_gozen': '/assets/fd/servants/suzuka.png',
};

const cardArt: Record<string, string> = {
  'basic.agility.2': '/assets/fd/cards/basic-agility-2.svg',
  'basic.magecraft.2': '/assets/fd/cards/basic-magecraft-2.svg',
  'basic.preparation': '/assets/fd/real/basic-attacks/basic-preparation.png',
  'basic.surveil': '/assets/fd/real/basic-attacks/basic-surveil.png',
  'basic.luck': '/assets/fd/real/basic-attacks/basic-luck.png',
  'basic.special.2': '/assets/fd/cards/basic-special-2.svg',
  'basic.strength.2': '/assets/fd/cards/basic-strength-2.svg',
  'event.waxing_moon_ritual.bloody_sunset': '/assets/fd/placeholders/event.svg',
  'event.waxing_moon_ritual.dark_current': '/assets/fd/placeholders/event.svg',
  'event.waxing_moon_ritual.ritual': '/assets/fd/placeholders/event.svg',
  'master.dan_blackmore.overview': masterPortraits['master.dan_blackmore'],
  'master.gatou': masterPortraits['master.gatou'],
  'master.gatou.command-spell': placeholders.commandSpell,
  'master.irisviel': placeholders.master,
  'master.julius_harwey.overview': masterPortraits['master.julius_harwey'],
  'master.kayneth': masterPortraits['master.kayneth'],
  'master.kayneth_archibald.overview': masterPortraits['master.kayneth_archibald'],
  'master.kiritsugu': masterPortraits['master.kiritsugu'],
  'master.kiritsugu_emiya.overview': masterPortraits['master.kiritsugu_emiya'],
  'master.maiya': masterPortraits['master.maiya'],
  'master.maiya_hisau.overview': masterPortraits['master.maiya_hisau'],
  'master.matou_shinji.overview': masterPortraits['master.matou_shinji'],
  'master.monji_gatou.overview': masterPortraits['master.monji_gatou'],
  'master.olga-marie': placeholders.master,
  'master.olga-marie.command-spell': placeholders.commandSpell,
  'master.shinji': masterPortraits['master.shinji'],
  'servant.drake': servantPortraits['servant.drake'],
  'servant.francis_drake.skill.riding': '/assets/fd/skills/riding.png',
  'servant.francis_drake.skill.golden_hind_and_stormy_night': '/assets/fd/placeholders/skill.svg',
  'servant.francis_drake.skill.stormy_voyager': '/assets/fd/placeholders/skill.svg',
  'servant.drake.skill.sc-drake-1': '/assets/fd/skills/riding.png',
  'situation.perfect_flow': '/assets/fd/cards/perfect-flow.png',
};

export function resolveEntityImageUrl(kind: EntityKind, id: string): string {
  const realAsset = fdRealAssetManifest.entities[id as keyof typeof fdRealAssetManifest.entities];
  if (realAsset) return realAsset;

  if (kind === 'master') return masterPortraits[id] ?? placeholders.master;
  return servantPortraits[id] ?? placeholders.servant;
}

export function resolveCardImageUrl(input: { definitionId: string; cardType?: string }): string {
  const realAsset = fdRealAssetManifest.cards[input.definitionId as keyof typeof fdRealAssetManifest.cards];
  if (realAsset) return realAsset;

  const mapped = cardArt[input.definitionId];
  if (mapped) return mapped;

  if (input.cardType === 'command_spell' || input.definitionId.includes('command-spell')) {
    return placeholders.commandSpell;
  }
  if (input.cardType === 'event' || input.definitionId.startsWith('event.')) {
    return placeholders.event;
  }
  if (input.cardType === 'situation' || input.definitionId.startsWith('situation.')) {
    return placeholders.situation;
  }
  if (input.cardType?.includes('skill') || input.definitionId.includes('.skill.')) {
    return placeholders.skill;
  }
  if (input.cardType === 'master_overview' || approvedAuthoringMasterIdSet.has(input.definitionId)) {
    return resolveEntityImageUrl('master', input.definitionId);
  }
  if (input.cardType === 'servant_overview' || approvedAuthoringServantIdSet.has(input.definitionId)) {
    return resolveEntityImageUrl('servant', input.definitionId);
  }

  return placeholders.card;
}

export function resolvePublicAssetPath(url: string): string | undefined {
  return url.startsWith('/assets/') ? url.slice(1) : undefined;
}
