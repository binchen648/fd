import { describe, expect, it } from 'vitest';
import * as rules from '../src/index';
import { readFileSync } from 'node:fs';
import { createSeededGameState } from '../src/tools/seeded-state';

const raw = JSON.parse(readFileSync('data/authoring/servants/servant.artoriac.json', 'utf8'));
const ids = raw.cards.map((c: { id: string }) => c.id);
function setup() {
  const pack = rules.loadAuthoringJson(raw);
  const state = createSeededGameState();
  state.cards = [];
  state.round.activePhase = 'action';
  state.players[0]!.mana = 12;
  state.players[0]!.servantCardId = raw.id;
  state.players[0]!.locationId = 'recon';
  rules.initializeAbilityRuntime(state, pack, { seed: 42 });
  return state;
}
function add(state: ReturnType<typeof setup>, index: number | string, zone = 'hand', owner = 'p1') {
  const id = `instance-${state.cards.length}`;
  state.cards.push({ instanceId: id, definitionId: typeof index === 'number' ? ids[index] : index,
    ownerPlayerId: owner, controllerPlayerId: owner, zone, visibility: { scope: 'owner_only', ownerPlayerId: owner } });
  return id;
}
const actions = (s: ReturnType<typeof setup>, p = 'p1') => rules.getLegalActions(s, p);
const play = (s: ReturnType<typeof setup>, id: string, faceDown = false) =>
  rules.dispatchAbilityCommand(s, 'p1', { type: 'play_card', cardInstanceId: id, faceDown });
function ability(s: ReturnType<typeof setup>, id: string) {
  return actions(s).find(a => a.type === 'activate_ability' && a.cardInstanceId === id)!;
}
function activate(s: ReturnType<typeof setup>, id: string, variables = {}) {
  return rules.dispatchAbilityCommand(s, 'p1', { ...ability(s, id), variables });
}
function battle(s: ReturnType<typeof setup>, winners: string[]) {
  rules.advanceAbilityPhase(s, 'battle');
  rules.processAbilityEvent(s, { id: `battle-${s.round.roundNumber}`, type: 'after_battle_result_determined',
    battleResult: { winners, loserIds: s.players.map(p => p.id).filter(p => !winners.includes(p)) } });
}

describe('authoring interpreter public server entry', () => {
  it('exports legal action discovery and a safe dispatch session', () => {
    expect(rules).toHaveProperty('getLegalActions', expect.any(Function));
    expect(rules).toHaveProperty('createAbilitySession', expect.any(Function));
  });
});

describe('Artoria Caster authoring vertical slice', () => {
  it('1. sword can play in action but never in combat', () => {
    const s = setup(); const c = add(s, 0, 'skill');
    expect(actions(s).some(a => a.type === 'play_card' && a.cardInstanceId === c)).toBe(true);
    rules.advanceAbilityPhase(s, 'battle');
    expect(play(s, c).ok).toBe(false);
  });
  it('2. sword return appears only after activation and in combat', () => {
    const s = setup(); const c = add(s, 0); const target = add(s, 4);
    expect(play(s, target, true).ok).toBe(true); expect(play(s, c).ok).toBe(true);
    expect(ability(s, c)).toBeUndefined();
    rules.advanceAbilityPhase(s, 'battle');
    expect(ability(s, c)).toMatchObject({ type: 'activate_ability' });
  });
  it('stages attacks for confirmation before moving them into the attack area', () => {
    const s = setup(); const c = add(s, 3);
    const stage = actions(s).find((action) => action.type === 'stage_attack_card' && action.cardInstanceId === c)!;
    expect(stage).toBeTruthy();
    expect(rules.dispatchAbilityCommand(s, 'p1', stage).ok).toBe(true);
    expect(s.cards.find((card) => card.instanceId === c)!.zone).toBe('hand');
    expect(s.players[0]!.mana).toBe(12);
    expect(rules.projectAbilityState(s, 'p1').stagedAttacks).toEqual([
      { playerId: 'p1', cards: [{ type: 'play_card', cardInstanceId: c }] },
    ]);
    expect(actions(s).some((action) => 'cardInstanceId' in action && action.cardInstanceId === c)).toBe(false);

    expect(rules.dispatchAbilityCommand(s, 'p1', { type: 'confirm_staged_attack' }).ok).toBe(true);
    expect(s.cards.find((card) => card.instanceId === c)).toMatchObject({
      zone: 'attack_area',
      visibility: { scope: 'public' },
    });
    expect(s.players[0]!.mana).toBe(11);
    expect(rules.projectAbilityState(s, 'p1').stagedAttacks).toBeUndefined();

    const s2 = setup(); const c2 = add(s2, 3);
    expect(rules.dispatchAbilityCommand(s2, 'p1', { type: 'stage_attack_card', cardInstanceId: c2 }).ok).toBe(true);
    expect(rules.dispatchAbilityCommand(s2, 'p1', { type: 'cancel_staged_attack' }).ok).toBe(true);
    expect(s2.cards.find((card) => card.instanceId === c2)!.zone).toBe('hand');
    expect(s2.players[0]!.mana).toBe(12);
  });
  it('3. inactive sword never exposes its combat ability', () => {
    const s = setup(); const c = add(s, 0); rules.advanceAbilityPhase(s, 'battle');
    expect(ability(s, c)).toBeUndefined();
  });
  it('4/5. immediate residual lasts current and next round, affects other special attacks only', () => {
    const s = setup(); const sword = add(s, 0); const special = add(s, 3); const magic = add(s, 1);
    expect(play(s, sword).ok).toBe(true); expect(play(s, special).ok).toBe(true);
    expect(rules.calculateCardPower(s, sword).value).toBe(4);
    expect(rules.calculateCardPower(s, special).value).toBe(6);
    expect(rules.calculateCardPower(s, magic).value).toBe(7);
    rules.advanceAbilityPhase(s, 'action', 2);
    expect(rules.calculateCardPower(s, special).value).toBe(6);
    rules.advanceAbilityPhase(s, 'action', 3);
    expect(rules.calculateCardPower(s, special).value).toBe(4);
    expect(s.abilityRuntime!.ongoingEffects).toHaveLength(0);
  });
  it('6. face-down attacks pay no mana, trigger no effects, have no damage and can return', () => {
    const s = setup(); const sword = add(s, 0); const c = add(s, 3);
    expect(play(s, c, true).ok).toBe(true); expect(s.players[0]!.mana).toBe(12);
    expect(rules.calculateCardPower(s, c).value).toBe(0); expect(ability(s, c)).toBeUndefined();
    play(s, sword); rules.advanceAbilityPhase(s, 'battle'); activate(s, sword);
    const choose = actions(s).find(a => a.type === 'choose_target')!;
    expect(choose.candidates).toContain(c);
    expect(rules.dispatchAbilityCommand(s, 'p1', { type: 'choose_target', decisionId: choose.decisionId, selectedIds: [c] }).ok).toBe(true);
    expect(s.cards.find(x => x.instanceId === c)!.zone).toBe('hand');
  });
  it.each([-1, 1.5, 10, Number.NaN])('7. rejects invalid X=%s atomically', x => {
    const s = setup(); const c = add(s, 1); play(s, c); const before = JSON.stringify(s);
    expect(activate(s, c, { X: x }).ok).toBe(false); expect(JSON.stringify(s)).toBe(before);
  });
  it.each([0, 1])('8. staff views X+2 privately, chooses %s card, discards rest and clears zone', choiceCount => {
    const s = setup(); const c = add(s, 1);
    for (let i = 0; i < 7; i++) add(s, `secret-${i}`, 'deck');
    play(s, c); expect(activate(s, c, { X: 3 }).ok).toBe(true);
    expect(s.players[0]!.mana).toBe(6);
    const own = rules.projectAbilityState(s, 'p1'); const other = rules.projectAbilityState(s, 'p2');
    expect(own.pendingDecision!.candidates).toHaveLength(5);
    expect(JSON.stringify(other)).not.toContain('secret-');
    expect(other.waitingLabel).toBe('等待响应结算');
    const d = own.pendingDecision!;
    expect(rules.dispatchAbilityCommand(s, 'p2', { type: 'choose_target', decisionId: d.id, selectedIds: [] }).ok).toBe(false);
    expect(rules.dispatchAbilityCommand(s, 'p1', { type: 'choose_target', decisionId: d.id, selectedIds: d.candidates.slice(0, 2) }).ok).toBe(false);
    expect(rules.dispatchAbilityCommand(s, 'p1', { type: 'choose_target', decisionId: d.id, selectedIds: d.candidates.slice(0, choiceCount) }).ok).toBe(true);
    expect(s.cards.filter(x => x.zone === 'hand')).toHaveLength(choiceCount);
    expect(s.cards.filter(x => x.zone === 'discard')).toHaveLength(5 - choiceCount);
    expect(s.cards.filter(x => x.zone === 'looked_cards')).toHaveLength(0);
    expect(actions(s).some(a => a.type === 'activate_ability' && a.cardInstanceId === c)).toBe(false);
  });
  it('9/10. star computes dynamic Luck power with explanations and conditionally reveals package', () => {
    const s = setup(); const c = add(s, 2); play(s, c);
    expect(JSON.stringify(rules.projectAbilityState(s, 'p2'))).not.toContain('阿尔托莉雅');
    add(s, 'card.luck', 'discard'); add(s, 'card.luck', 'discard');
    rules.processAbilityEvent(s, { id: 'resource-1', type: 'resources_changed', playerId: 'p1' });
    expect(rules.calculateCardPower(s, c).value).toBe(10);
    expect(rules.calculateCardPower(s, c).lines.map(l => l.value)).toEqual(expect.arrayContaining([2, 10]));
    expect(JSON.stringify(rules.projectAbilityState(s, 'p2'))).toContain('阿尔托莉雅·卡斯特');
    for (let i = 0; i < 5; i++) add(s, 'card.luck', 'discard');
    expect(rules.calculateCardPower(s, c).value).toBe(15);
  });
  it('11. victory shuffle overrides prevention and is idempotent per event', () => {
    const s = setup(); const c = add(s, 2); play(s, c); add(s, 'card.luck', 'discard');
    s.abilityRuntime!.preventEffects = true;
    const event = { id: 'victory-1', type: 'after_controller_gains_victory', playerId: 'p1' };
    rules.processAbilityEvent(s, event);
    expect(s.cards.filter(c => c.zone === 'discard')).toHaveLength(0);
    expect(s.abilityRuntime!.events.some(e => e.type === 'effect_resolved' && e.unpreventable)).toBe(true);
    const before = JSON.stringify(s); rules.processAbilityEvent(s, event); expect(JSON.stringify(s)).toBe(before);
  });
  it('12/13. pilgrim group offers one choice; hides candidates from others; rejects replay', () => {
    const s = setup(); [3, 4, 5].forEach(i => add(s, i)); battle(s, ['p1']);
    const choices = actions(s).filter(a => a.type === 'resolve_response'); expect(choices).toHaveLength(3);
    expect(rules.projectAbilityState(s, 'p1').responseWindow!.kind).toBe('choose_unique_trigger');
    const other = rules.projectAbilityState(s, 'p2'); expect(other.waitingLabel).toBe('等待响应结算');
    expect(other.legalActions).toEqual([]); expect(other.responseWindow).toBeUndefined();
    expect(JSON.stringify(other)).not.toContain('pilgrim');
    expect(rules.dispatchAbilityCommand(s, 'p1', choices[0]!).ok).toBe(true);
    expect(rules.dispatchAbilityCommand(s, 'p1', choices[1]!).ok).toBe(false);
    expect(s.cards.filter(c => c.zone === 'removed_from_game')).toHaveLength(1);
    expect(s.cards.filter(c => c.definitionId === 'card.luck')).toHaveLength(1);
  });
  it('decline closes this unique window, and a later battle can offer the cards again', () => {
    const s = setup(); add(s, 3); battle(s, ['p1']);
    const a = actions(s).find(a => a.type === 'decline_this_window')!;
    expect(rules.dispatchAbilityCommand(s, 'p1', { type: 'pass', windowId: a.windowId }).ok).toBe(true);
    expect(actions(s).filter(a => a.type === 'resolve_response')).toHaveLength(0);
    rules.processAbilityEvent(s, { id: 'battle-next', type: 'after_controller_wins_battle', playerId: 'p1' });
    expect(actions(s).filter(a => a.type === 'resolve_response')).toHaveLength(1);
  });
  it('14. recon condition and directed paths come from server and reject unreachable destinations', () => {
    const s = setup(); const c = add(s, 3); play(s, c);
    s.map.locations.find(l => l.id === 'recon')!.movementLinks = ['magic_workshop'];
    expect(rules.getReachableLocationsAlongArrows(s, 'recon', 2)).toEqual(['magic_workshop', 'miyama_town']);
    activate(s, c); const d = rules.projectAbilityState(s, 'p1').pendingDecision!;
    expect(d.candidates).toEqual(['magic_workshop', 'miyama_town']);
    expect(s.players[0]!.vp).toBe(2);
    expect(rules.dispatchAbilityCommand(s, 'p1', { type: 'choose_target', decisionId: d.id, selectedIds: ['shinto'] }).ok).toBe(false);
    expect(rules.dispatchAbilityCommand(s, 'p1', { type: 'choose_target', decisionId: d.id, selectedIds: ['miyama_town'] }).ok).toBe(true);
    expect(s.players[0]!.locationId).toBe('miyama_town');
    rules.advanceAbilityPhase(s, 'action', 2); expect(ability(s, c)).toBeUndefined();
  });
  it.each([10, 11, 12])('15. respite gains mana until cap, otherwise VP (mana %s)', mana => {
    const s = setup(); const c = add(s, 4); s.players[0]!.mana = mana; play(s, c); activate(s, c);
    expect(s.players[0]!.mana).toBe(12); expect(s.players[0]!.vp).toBe(mana === 12 ? 2 : 0);
  });
  it.each([['p1'], ['p2'], ['p1', 'p2']])('16. destiny rewards shared wins only: %s', (...winners) => {
    const s = setup(); const c = add(s, 5); play(s, c); battle(s, winners);
    expect(s.players[0]!.vp).toBe(winners.includes('p1') && winners.length > 1 ? 2 : 0);
  });
  it('fails closed on unmapped effects, formulas and execution flags', () => {
    const broken = structuredClone(raw); broken.cards[0].abilities[1].effects = [{ type: 'unknown_effect' }];
    const pack = rules.loadAuthoringJson(broken);
    expect(pack.report.some(r => r.path.includes('effects') && r.status === 'unsupported')).toBe(true);
    const s = setup(); s.abilityRuntime!.pack = pack; const c = add(s, 0);
    const result = play(s, c); expect(result.ok).toBe(false); expect(result.rejection!.code).toBe('unsupported');
    expect(s.players[0]!.mana).toBe(12);
    expect(() => rules.evaluateFormula('process.exit()', s, 'p1', c)).toThrow();
  });
  it('dispatch never returns authority or deck order and does not accept fabricated effects', () => {
    const s = setup(); const c = add(s, 4); add(s, 'secret-deck', 'deck');
    const session = rules.createAbilitySession(s); const result = session.dispatch('p1', { type: 'play_card', cardInstanceId: c });
    expect(result.ok).toBe(true); expect(result).not.toHaveProperty('nextState'); expect(result).not.toHaveProperty('state');
    expect(JSON.stringify(result)).not.toContain('secret-deck');
    expect(session.dispatch('p1', { type: 'adjust_mana', amount: 100 } as never).ok).toBe(false);
    expect(s.cards.find(x => x.instanceId === c)!.zone).toBe('hand');
  });
  it('integrates dynamic power into the existing combat resolver', () => {
    const s = setup(); const sword = add(s, 0); const attack = add(s, 3);
    play(s, sword); play(s, attack); s.players[0]!.locationId = 'miyama_town';
    expect(rules.deriveBattleParticipantsFromState(s, 'miyama_town').find(p => p.playerId === 'p1')!.totalPower).toBe(10);
  });
  it('dispatch includes controller calculation lines for variable costs and viewed counts', () => {
    const s = setup(); const c = add(s, 1); play(s, c);
    const result = activate(s, c, { X: 2 });
    expect(result.calculations).toEqual(expect.arrayContaining([{ label: 'X', value: 2 }, { label: '2 + 2', value: 4 }]));
  });
  it('validates structural semantics instead of silently ignoring unknown rule fields', () => {
    const broken = structuredClone(raw);
    broken.cards[4].abilities[1].effects[0].branches[0].then[0].player = 'opponent';
    broken.cards[0].abilities[1].ruleModifiers[0].scope.object = 'opponents';
    broken.cards[1].abilities[0].targets[0].scope.zone = 'enemy_deck';
    broken.cards[2].abilities[2].effects[0].ignoreCosts = true;
    const report = rules.loadAuthoringJson(broken).report;
    expect(report.filter(r => r.status === 'unsupported').length).toBeGreaterThanOrEqual(4);
  });
  it('honors host/text flags without generating automatic player actions', () => {
    const broken = structuredClone(raw); broken.cards[4].abilities[1].execution = { mode: 'host_adjudicated', hostOps: ['adjust-mana'] };
    const s = setup(); s.abilityRuntime!.pack = rules.loadAuthoringJson(broken); const c = add(s, 4);
    const result = play(s, c); expect(result.rejection).toMatchObject({ code: 'host_adjudicated', allowedOperations: ['adjust-mana'] });
    broken.cards[4].abilities[1].execution = { mode: 'text_unconfirmed' };
    s.abilityRuntime!.pack = rules.loadAuthoringJson(broken);
    expect(actions(s).filter(a => a.type === 'play_card' && a.cardInstanceId === c)).toEqual([]);
  });
  it('opens distinct players windows in turn order and never advances with unresolved decisions', () => {
    const s = setup(); add(s, 3); add(s, 4, 'hand', 'p2'); battle(s, ['p1', 'p2']);
    expect(actions(s, 'p2')).toEqual([]);
    expect(() => rules.advanceAbilityPhase(s, 'cleanup')).toThrow('Resolve');
    const decline = actions(s).find(a => a.type === 'decline_this_window')!;
    rules.dispatchAbilityCommand(s, 'p1', decline);
    expect(actions(s, 'p2').some(a => a.type === 'resolve_response')).toBe(true);
  });
  it('does not allow negative printed cost or string formulas', () => {
    const broken = structuredClone(raw); broken.cards[0].cardFace.cost = -10;
    broken.cards[1].cardFace.basePower = '999 + 999';
    const report = rules.loadAuthoringJson(broken).report;
    expect(report.some(r => r.path === 'cardFace.cost')).toBe(true);
    expect(report.some(r => r.path === 'cardFace.basePower')).toBe(true);
  });
  it('settles battle-result triggers only after base scoring on authority', () => {
    const s = setup(); const star = add(s, 2); play(s, star); add(s, 3); add(s, 'card.luck', 'discard');
    s.players[0]!.locationId = 'miyama_town'; s.players[1]!.locationId = 'miyama_town';
    rules.advanceAbilityPhase(s, 'battle');
    const resolved = rules.resolveBattlefield(s, { battlefieldId: 'miyama_town' }).nextState;
    expect(actions(resolved).some(a => a.type === 'resolve_response')).toBe(false);
    const battle = resolved.battleResults.at(-1)!;
    const scored = rules.applyBattleScoring(resolved).nextState;
    const loserIds = battle.participantBreakdowns
      .map((participant) => participant.playerId)
      .filter((playerId) => !battle.winnerPlayerIds.includes(playerId));
    rules.processAbilityEvent(scored, {
      id: 'battle-phase:1:battle:miyama_town:1:result',
      type: 'after_battle_result_determined',
      battlePhaseResolutionId: 'battle-phase:1',
      battleId: 'battle-phase:1:battle:miyama_town:1',
      resultId: 'battle-phase:1:battle:miyama_town:1:result',
      battleParticipantIds: battle.participantBreakdowns.map((participant) => participant.playerId),
      battlefieldId: 'miyama_town',
      battleResult: { winners: [...battle.winnerPlayerIds], loserIds },
    });
    expect(actions(scored).some(a => a.type === 'resolve_response')).toBe(true);
    expect(scored.cards.filter(c => c.zone === 'discard')).toHaveLength(0);
    expect(s.cards.filter(c => c.zone === 'discard')).toHaveLength(1);
  });
  it('legacy game-loop pauses at a pending response and resumes without replaying the battle', () => {
    const s = setup(); add(s, 3); s.players[0]!.locationId = 'miyama_town'; s.players[1]!.locationId = 'miyama_town';
    const attack = add(s, 5); play(s, attack); rules.advanceAbilityPhase(s, 'battle');
    const stopped = rules.stepGameLoop(s).nextState;
    expect(stopped.round.activePhase).toBe('battle');
    expect(stopped.battleResults).toHaveLength(0);
    expect(stopped.log.filter((entry) => entry.type === 'battle_scored')).toHaveLength(1);
    const decline = actions(stopped).find(a => a.type === 'decline_this_window')!;
    rules.dispatchAbilityCommand(stopped, 'p1', decline);
    const resumed = rules.stepGameLoop(stopped).nextState;
    expect(resumed.round.activePhase).toBe('cleanup');
    expect(resumed.battleResults).toHaveLength(0);
    expect(resumed.log.filter((entry) => entry.type === 'battle_scored')).toHaveLength(1);
  });
  it('reports malformed targets/effects, unsupported windows and unfinished verification', () => {
    const broken = structuredClone(raw);
    delete broken.cards[0].abilities[2].effects[0].target;
    broken.cards[1].abilities[0].activation.opens = 'any_time';
    broken.cards[4].abilities[1].effects[0].branches[0].then[0].amount = 'two';
    broken.cards[5].verification.implementationStatus = 'host_adjudicated';
    const report = rules.loadAuthoringJson(broken).report;
    expect(report.some(r => r.cardId === ids[0] && r.path.includes('target'))).toBe(true);
    expect(report.some(r => r.cardId === ids[1] && r.path.includes('activation'))).toBe(true);
    expect(report.some(r => r.cardId === ids[4] && r.path.includes('amount'))).toBe(true);
    expect(report.some(r => r.cardId === ids[5] && r.path.includes('verification'))).toBe(true);
  });
  it('normalizes on-use reveal markers but preserves explicit conditional timing', () => {
    const changed = structuredClone(raw);
    changed.cards[4].abilities[1].markers = ['真名解放'];
    const s = setup(); s.abilityRuntime!.pack = rules.loadAuthoringJson(changed); const c = add(s, 4);
    play(s, c); activate(s, c);
    expect(rules.projectAbilityState(s, 'p2').players[0]!.servantPackage!.name).toBe(raw.name);
  });
  it('redacts untracked hidden field instances, including IDs containing the secret definition', () => {
    const s = setup(); const c = add(s, 3, 'field');
    s.cards.find(x => x.instanceId === c)!.instanceId = 'secret-pilgrim-instance';
    expect(JSON.stringify(rules.projectAbilityState(s, 'p2'))).not.toContain('secret-pilgrim');
  });
  it('records move_card result counts for later formulas', () => {
    const changed = structuredClone(raw);
    changed.cards = [{
      id: 'test.skill.move-result-count',
      name: '移动计数测试',
      cardType: 'servant_skill',
      printedText: '战斗阶段：将至多两张指定牌加入你的技能区，每加入一张便获得2点战果。',
      cardFace: { typeLabel: '特殊', cost: 0, basePower: 0, attributes: [] },
      playTiming: { phase: 'action', window: 'controller_play_card_window' },
      playRequirements: [],
      verification: { implementationStatus: 'complete' },
      abilities: [{
        id: 'move-result-count.move-and-score',
        kind: 'phase_action',
        printedClause: '战斗阶段：将至多两张指定牌加入你的技能区，每加入一张便获得2点战果。',
        activation: { phase: 'action', opens: 'controller_action_window', requiresSourceState: 'active' },
        conditions: [],
        targets: [{
          id: 'chosen_cards',
          type: 'card_instance',
          scope: { zone: 'removed_from_game', owner: 'controller' },
          count: { min: 1, max: 2 },
          constraints: [{ type: 'has_card_id', cardId: 'servant.kintoki.skill.sc-kintoki-1' }],
        }],
        effects: [
          { type: 'move_card', target: 'chosen_cards', to: { zone: 'skill' }, resultVar: 'movedCount' },
          { type: 'adjust_victory_points', amount: { op: 'multiply', args: [{ var: 'movedCount' }, 2] } },
        ],
        execution: { mode: 'automatic' },
      }],
    }];
    const s = createSeededGameState();
    s.cards = [];
    s.round.activePhase = 'action';
    s.players[0]!.mana = 12;
    s.players[0]!.servantCardId = changed.id;
    rules.initializeAbilityRuntime(s, rules.loadAuthoringJson(changed), { seed: 42 });
    const source = add(s, 'test.skill.move-result-count', 'hand');
    const first = add(s, 'servant.kintoki.skill.sc-kintoki-1', 'removed_from_game');
    const second = add(s, 'servant.kintoki.skill.sc-kintoki-1', 'removed_from_game');

    expect(play(s, source).ok).toBe(true);
    expect(activate(s, source).ok).toBe(true);
    const decision = rules.projectAbilityState(s, 'p1').pendingDecision!;
    expect(rules.dispatchAbilityCommand(s, 'p1', { type: 'choose_target', decisionId: decision.id, selectedIds: [first, second] }).ok).toBe(true);
    expect(s.cards.filter(c => c.zone === 'skill' && c.definitionId === 'servant.kintoki.skill.sc-kintoki-1')).toHaveLength(2);
    expect(s.players[0]!.vp).toBe(4);
  });
});
