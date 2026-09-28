import { createHash } from 'node:crypto';
import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';
import * as rules from '../../src/index';
import { createSeededGameState } from '../../src/tools/seeded-state';
import type { GameState } from '../../src/schema/game';

const ARCHIVE = 'data/authoring/servants/servant.suzuka.json';
const ROOT = 'servant.suzuka';
const SC1 = `${ROOT}.skill.sc-suzuka-1`;
const SC2 = `${ROOT}.skill.sc-suzuka-2`;
const SC3 = `${ROOT}.skill.sc-suzuka-3`;
const COUNTER = 'servant.suzuka:wisdom';
const SC1_TEXT_SHA = 'cd69a157df7f2ee4c13c1fcbad23c2603f55c3ec4f8ef2cbcdb12fae58b547ff';
const SC2_TEXT_SHA = 'd9f5e7b4d3518899acd71d736d3f71635812ab39f75e3bb1eaf91c4bbaff5d6d';
const SC3_TEXT_SHA = 'a55a092d54ce61769a8236c78ac50bd0a9558de44007b2b726718efb7a5ab13d';

const sha = (value: string) => createHash('sha256').update(value, 'utf8').digest('hex');
function rawArchive(): any { return JSON.parse(readFileSync(ARCHIVE, 'utf8')); }
function pack() {
  const loaded = rules.loadAuthoringJson(rawArchive());
  expect(loaded.report).toEqual([]);
  return loaded;
}
function basic(id: string, cost: number, basePower = cost || 1) {
  return { id, name: id, cardType: 'basic_attack', cardFace: { typeLabel: '攻击', attributes: ['力量'], cost, basePower },
    playTiming: { phase: 'action', window: 'controller_play_card_window' }, playRequirements: [], abilities: [], mode: 'automatic' } as any;
}
function add(state: GameState, definitionId: string, owner: string, zone: string, instanceId = `${definitionId}:${state.cards.length}`) {
  state.cards.push({ instanceId, definitionId, ownerPlayerId: owner, controllerPlayerId: owner, zone,
    visibility: ['field','attack_area'].includes(zone) ? { scope: 'public' } : { scope: 'owner_only', ownerPlayerId: owner } } as any);
  state.abilityRuntime!.cardState[instanceId] = { active: ['field','attack_area'].includes(zone), faceDown: false, playedRound: state.round.roundNumber };
  return instanceId;
}
function setup() {
  const loaded = pack();
  for (let i = 1; i <= 8; i++) loaded.cards[`formal.suzuka.basic.${i}`] = basic(`formal.suzuka.basic.${i}`, i % 3, i === 4 ? 4 : 2);
  const state = createSeededGameState({ activeSeats: [1,2] });
  state.cards = []; state.round.activePhase = 'action'; state.round.prioritySeat = 1; state.players[0]!.mana = 30;
  rules.initializeAbilityRuntime(state, loaded, { seed: 20260929 });
  return { state, loaded };
}
function activate(state: GameState, source: string, abilityId: string) {
  const out = rules.dispatchAbilityCommand(state, 'p1', { type: 'activate_ability', cardInstanceId: source, abilityId });
  expect(out, JSON.stringify(out)).toMatchObject({ ok: true });
}
function choose(state: GameState, selectedIds: string[]) {
  const decision = state.abilityRuntime!.pendingDecision!;
  const out = rules.dispatchAbilityCommand(state, decision.controllerId, { type: 'choose_target', decisionId: decision.id, selectedIds });
  expect(out, JSON.stringify(out)).toMatchObject({ ok: true });
}
function playSkill(state: GameState, cardId: string) {
  const source = add(state, cardId, 'p1', 'skill', `${cardId}:source`);
  const action = rules.getLegalActions(state, 'p1').find((entry) => entry.type === 'play_card' && entry.cardInstanceId === source);
  expect(action).toBeDefined();
  expect(rules.dispatchAbilityCommand(state, 'p1', action!).ok).toBe(true);
  return source;
}

describe('P3 owner-complete Suzuka migration', () => {
  it('materializes exactly sc1 + sc2 + sc3 with frozen text/static metadata and accepted generic seams', () => {
    const raw = rawArchive(); const loaded = pack();
    expect(raw).toMatchObject({ id: ROOT, name: '铃鹿御前', class: 'Saber' });
    expect(raw.cards.map((card: any) => card.id)).toEqual([SC1, SC2, SC3]);
    expect([sha(raw.cards[0].printedText), sha(raw.cards[1].printedText), sha(raw.cards[2].printedText)]).toEqual([SC1_TEXT_SHA, SC2_TEXT_SHA, SC3_TEXT_SHA]);
    expect(raw.cards.map((card: any) => [card.cardFace.typeLabel, card.cardFace.cost, card.cardFace.basePower])).toEqual([
      ['被动',0,0], ['力量/宝具',5,0], ['迅捷',0,5],
    ]);
    expect(raw.cards.map((card: any) => card.playRequirements)).toEqual([
      [], [{ type: 'skill_zone_mana_at_least', value: 8 }], [{ type: 'skill_zone_mana_at_least', value: 8 }],
    ]);
    expect(loaded.cards[SC1]!.abilities.some(rules.isAcceptedAutomaticRecycleKeepGainCounterAbility)).toBe(true);
    expect(loaded.cards[SC1]!.abilities.some(rules.isAcceptedSpendCounterIgnoreBattleLossAbility)).toBe(true);
    expect(loaded.cards[SC2]!.abilities.some(rules.isAcceptedDiscardBasicReplayCounterAbility)).toBe(true);
    expect(loaded.cards[SC3]!.abilities.some(rules.isAcceptedPhysicalCardReplayGrowthAbility)).toBe(true);
    expect(loaded.cards[SC2]!.abilities.find((ability) => ability.id === 'true-name-release')!.visibility).toMatchObject({ revealsTrueName: true, revealTiming: 'on_use_declared', revealScope: 'servant_package' });
  });

  it('runs sc1 automatic recycle keep choice, gains Wisdom, and spends it for current-round defeat suppression', () => {
    const { state } = setup();
    const sc1 = add(state, SC1, 'p1', 'skill', 'suzuka-sc1');
    const draw = { id:'formal.suzuka.draw', name:'draw', cardType:'servant_skill', owner:{type:'servant',id:ROOT}, cardFace:{typeLabel:'fixture',attributes:[],cost:0,basePower:0}, playTiming:{phase:'action',window:'controller_play_card_window'}, playRequirements:[], abilities:[{ id:'draw-one', kind:'phase_action', printedClause:'draw', activation:{phase:'action',opens:'controller_action_window'}, conditions:[],targets:[],effects:[{type:'draw_cards',count:1}],cost:[],ruleModifiers:[],creates:[],lifecycle:{},responseWindow:{order:'turn_order',passBehavior:'decline_this_window'},limit:{},visibility:{},execution:{mode:'automatic',allowedOperations:[]} }] } as any;
    (state.abilityRuntime!.pack as any).cards[draw.id] = draw;
    const drawSource = add(state, draw.id, 'p1', 'skill', 'draw-source');
    const discard = [1,2,3,4].map((i) => add(state, `formal.suzuka.basic.${i}`, 'p1', 'discard', `discard-${i}`));
    activate(state, drawSource, 'draw-one');
    expect(state.abilityRuntime!.pendingDecision?.interaction).toMatchObject({ kind:'automatic_recycle_keep_v1', counterKey:COUNTER });
    choose(state, discard.slice(0,3));
    expect(state.abilityRuntime!.structuredPlayerFlagsByPlayer?.p1?.[COUNTER]).toBe(1);
    state.round.activePhase = 'advance';
    activate(state, sc1, 'sc-suzuka-1.ignore-defeat');
    expect(state.abilityRuntime!.structuredPlayerFlagsByPlayer?.p1?.[COUNTER]).toBe(0);
    expect(state.abilityRuntime!.battleLossIgnoreRoundByPlayer?.p1).toBe(state.round.roundNumber);
    state.players[0]!.locationId='miyama_town'; state.players[1]!.locationId='miyama_town'; state.round.activePhase='battle';
    const first = rules.resolveBattlefield(state,{battlefieldId:'miyama_town',participants:[{playerId:'p1',totalPower:1},{playerId:'p2',totalPower:5}]}).nextState;
    expect(first.battleResults.at(-1)!.lossEffectSuppressedPlayerIds).toContain('p1');
  });

  it('enforces the final 8-mana gate and printed costs for sc2/sc3', () => {
    for (const [cardId, printedCost] of [[SC2,5],[SC3,0]] as const) {
      const low = setup(); low.state.players[0]!.mana = 7; const lowId = add(low.state, cardId, 'p1', 'skill', `${cardId}:low`);
      expect(rules.getLegalActions(low.state,'p1').some((entry) => entry.type==='play_card' && entry.cardInstanceId===lowId)).toBe(false);
      const exact = setup(); exact.state.players[0]!.mana = 8; const id = add(exact.state,cardId,'p1','skill',`${cardId}:exact`);
      const action = rules.getLegalActions(exact.state,'p1').find((entry) => entry.type==='play_card' && entry.cardInstanceId===id);
      expect(action).toBeDefined(); expect(rules.dispatchAbilityCommand(exact.state,'p1',action!).ok).toBe(true);
      expect(exact.state.players[0]!.mana).toBe(8-printedCost);
    }
  });

  it('runs sc2 X=2 discard-basic replay with ordinary costs and exact-card return to deck after battle', () => {
    const { state } = setup();
    state.abilityRuntime!.structuredPlayerFlagsByPlayer = { p1: { [COUNTER]: 2 } };
    const sc2 = playSkill(state, SC2);
    const ids = [1,2,3,4,5].map((i) => add(state,`formal.suzuka.basic.${i}`,'p1','discard',`replay-${i}`));
    const before = state.players[0]!.mana;
    activate(state, sc2, 'sc-suzuka-2.tenkiame-replay');
    choose(state, ['counter:2']);
    expect(state.abilityRuntime!.pendingDecision?.max).toBe(5);
    choose(state, ids);
    const expectedCost = ids.reduce((sum,_,i)=>sum+((i+1)%3),0);
    expect(state.players[0]!.mana).toBe(before-expectedCost);
    expect(ids.every((id)=>state.cards.find((c)=>c.instanceId===id)!.zone==='attack_area')).toBe(true);
    rules.processAbilityEvent(state,{id:'formal-suzuka-battle-ended',type:'after_battle_ended',playerId:'p1'} as any);
    expect(ids.every((id)=>state.cards.find((c)=>c.instanceId===id)!.zone==='deck')).toBe(true);
  });

  it('runs sc3 permanent physical-card cost growth and printed-Power-4 top-three round bonus', () => {
    const { state } = setup();
    const sc3 = add(state,SC3,'p1','skill','suzuka-sc3');
    const top = [1,4,2].map((i,index)=>add(state,`formal.suzuka.basic.${i}`,'p1','deck',`top-${index}`));
    const first = rules.getLegalActions(state,'p1').find((entry)=>entry.type==='play_card' && entry.cardInstanceId===sc3)!;
    expect(rules.dispatchAbilityCommand(state,'p1',first).ok).toBe(true);
    expect(state.abilityRuntime!.cardPlayCountByInstance?.[sc3]).toBe(1);
    expect(rules.effectiveCardPlayCost(state,'p1',sc3)).toBe(1);
    expect(state.abilityRuntime!.cardState[sc3]!.roundPowerBonus).toMatchObject({amount:1,round:state.round.roundNumber});
    expect(rules.calculateCardPower(state,sc3).value).toBe(6);
    expect(top.every((id)=>state.cards.find((c)=>c.instanceId===id)!.zone==='discard')).toBe(true);
    const session = rules.createMatchSession({humanPlayerId:'p1',humanPlayerIds:['p1','p2'],restorePackKind:'trusted_authoring_fixture'});
    session.state=state; session.logs=[]; session.replay=[]; session.replaySnapshots=[]; session.battleHistory=[];
    expect(()=>rules.restoreMatchSession(session.serializeSession(),{restorePackKind:'trusted_authoring_fixture'})).not.toThrow();
    state.round.roundNumber+=1; state.round.activePhase='action'; state.round.prioritySeat=1; state.cards.find((c)=>c.instanceId===sc3)!.zone='skill'; state.abilityRuntime!.cardState[sc3]!.active=false;
    const second = rules.getLegalActions(state,'p1').find((entry)=>entry.type==='play_card' && entry.cardInstanceId===sc3)!;
    expect(rules.dispatchAbilityCommand(state,'p1',second).ok).toBe(true);
    expect(rules.effectiveCardPlayCost(state,'p1',sc3)).toBe(2);
  });

  it('keeps owner-complete authoring isolated from identity-routed production runtime', () => {
    const production = ['packages/rules/src/ability/deck-recycle-replay-growth-capability.ts','packages/rules/src/ability/interpreter.ts','packages/rules/src/ability/loader.ts','packages/rules/src/core/combat-resolver.ts']
      .map((path)=>readFileSync(path,'utf8')).join('\n');
    for (const needle of ['servant.suzuka','sc-suzuka','铃鹿御前','core.suzuka-package','SkillLib']) expect(production).not.toContain(needle);
  });
});