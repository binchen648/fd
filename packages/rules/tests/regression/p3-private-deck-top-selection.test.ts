import { describe, expect, it } from 'vitest';
import { planPrivateDeckTopSelection as plan, planPrivateDeckTopDiscard, planPrivateDeckTopReorder, preparePrivateDeckTopMutation, prepareLeasedPrivateDeckTopMutation, validatePrivateDeckTopLease, isPrivateDeckTopActionAuthorized, projectPrivateDeckTopDecision, validatePrivateDeckTopDecisionEnvelope, applyPrivateDeckTopSelection } from '../../src/ability/private-deck-top-selection';

describe('engine lifecycle callback deck-top application', () => {
  const cards = ['a','b','c','d'].map(id=>({instanceId:id, ownerPlayerId:'p2',zone:'deck'}));
  const lease = {controllerId:'p1',targetPlayerId:'p2',sourceCardInstanceId:'skill',abilityId:'hack',decisionId:'d1',createdRevision:4,recordedTopIds:['a','b','c']};
  const authority = {controllerId:'p1',targetPlayerId:'p2',sourceCardInstanceId:'skill',abilityId:'hack',decisionId:'d1',revision:4};
  it('sends selected discards before final ordered deck commit', () => {
    const log:string[] = [];
    expect(applyPrivateDeckTopSelection(cards,lease,authority,['b'],['c','a'],
      id=>log.push('discard:'+id),(owner,ids)=>log.push('order:'+owner+':'+ids.join(',')))).toBe(true);
    expect(log).toEqual(['discard:b','order:p2:c,a,d']);
  });
  it('rejects stale replay without invoking either live state callback', () => {
    const log:string[]=[];
    expect(applyPrivateDeckTopSelection(cards,lease,{...authority,revision:5},['b'],['c','a'],
      id=>log.push(id),(_,ids)=>log.push(ids.join(',')))).toBe(false);
    expect(log).toEqual([]);
  });
});

describe('pending private-choice envelope authority', () => {
  const envelope = { decisionId: 'decision', controllerId: 'p1', candidates: ['a','b','c'], min: 0, max: 3, visibility: 'owner_only', cancelPolicy: 'forbidden' };
  it('accepts exact owner and card subsets', () => {
    expect(validatePrivateDeckTopDecisionEnvelope(envelope, 'p1', 'decision', ['a','b','c'], [])).toBe(true);
    expect(validatePrivateDeckTopDecisionEnvelope(envelope, 'p1', 'decision', ['a','b','c'], ['a','c'])).toBe(true);
  });
  it('rejects forged actors, IDs, candidates and public visibility', () => {
    expect(validatePrivateDeckTopDecisionEnvelope(envelope, 'p2', 'decision', ['a','b','c'], ['a'])).toBe(false);
    expect(validatePrivateDeckTopDecisionEnvelope(envelope, 'p1', 'old', ['a','b','c'], ['a'])).toBe(false);
    expect(validatePrivateDeckTopDecisionEnvelope(envelope, 'p1', 'decision', ['c','b','a'], ['a'])).toBe(false);
    expect(validatePrivateDeckTopDecisionEnvelope(envelope, 'p1', 'decision', ['a','b','c'], ['foreign'])).toBe(false);
    expect(validatePrivateDeckTopDecisionEnvelope({ ...envelope, visibility: 'public' }, 'p1', 'decision', ['a','b','c'], [])).toBe(false);
    expect(validatePrivateDeckTopDecisionEnvelope(envelope, 'p1', 'decision', ['a','b','c'], ['a','a'])).toBe(false);
  });
});

describe('owner-only private top-card view', () => {
  it('reveals the trusted physical card IDs to only the decision controller', () => {
    const ownerView = projectPrivateDeckTopDecision('p1', 'p1', ['secret-a', 'secret-b']);
    expect(ownerView).toEqual({ count: 2, cardInstanceIds: ['secret-a', 'secret-b'] });
    expect(projectPrivateDeckTopDecision('p2', 'p1', ['secret-a', 'secret-b'])).toEqual({ count: 2 });
    expect(projectPrivateDeckTopDecision(undefined, 'p1', ['secret-a', 'secret-b'])).toEqual({ count: 2 });
  });
  it('fails closed for forged or malformed top-card visibility state', () => {
    expect(projectPrivateDeckTopDecision('p1', 'p1', ['a', 'a'])).toBeUndefined();
    expect(projectPrivateDeckTopDecision('p1', 'p1', ['a','b','c','d'])).toBeUndefined();
    expect(projectPrivateDeckTopDecision('p1', 'p1', null as unknown as string[])).toBeUndefined();
  });
});

describe('action-stage deck-top authority gate', () => {
  const authority = {
    phase: 'action', controllerId: 'p1', targetPlayerId: 'p2', battlefieldId: 'battlefield',
    controllerLocationId: 'battlefield', targetLocationId: 'battlefield',
    sourceOwnedByController: true, sourceActive: true, sourceAbilityAccepted: true,
    pendingDecisionId: undefined,
  };
  it('accepts an eligible opponent on the current battlefield', () => {
    expect(isPrivateDeckTopActionAuthorized(authority)).toBe(true);
  });
  it('rejects wrong phase, other locations and competing pending decisions', () => {
    expect(isPrivateDeckTopActionAuthorized({ ...authority, phase: 'battle' })).toBe(false);
    expect(isPrivateDeckTopActionAuthorized({ ...authority, targetPlayerId: 'p1' })).toBe(true);
    expect(isPrivateDeckTopActionAuthorized({ ...authority, targetLocationId: 'other' })).toBe(false);
    expect(isPrivateDeckTopActionAuthorized({ ...authority, pendingDecisionId: 'other-choice' })).toBe(false);
  });
  it('rejects inactive, foreign or unaccepted ability sources', () => {
    expect(isPrivateDeckTopActionAuthorized({ ...authority, sourceActive: false })).toBe(false);
    expect(isPrivateDeckTopActionAuthorized({ ...authority, sourceOwnedByController: false })).toBe(false);
    expect(isPrivateDeckTopActionAuthorized({ ...authority, sourceAbilityAccepted: false })).toBe(false);
  });
});

describe('authenticated leased mutation proposal', () => {
  const cards = [
    { instanceId: 'a', ownerPlayerId: 'p2', zone: 'deck' },
    { instanceId: 'b', ownerPlayerId: 'p2', zone: 'deck' },
    { instanceId: 'c', ownerPlayerId: 'p2', zone: 'deck' },
    { instanceId: 'd', ownerPlayerId: 'p2', zone: 'deck' },
  ];
  const lease = { controllerId: 'p1', targetPlayerId: 'p2', sourceCardInstanceId: 'skill', abilityId: 'ability', decisionId: 'choice', createdRevision: 7, recordedTopIds: ['a','b','c'] };
  const authority = { controllerId: 'p1', targetPlayerId: 'p2', sourceCardInstanceId: 'skill', abilityId: 'ability', decisionId: 'choice', revision: 7 };
  it('proposes a valid atomic mutation for a matching lease', () => {
    const planned = prepareLeasedPrivateDeckTopMutation(cards, lease, authority, ['b'], ['c','a']);
    expect(planned?.filter(c => c.zone === 'deck').map(c => c.instanceId)).toEqual(['c','a','d']);
    expect(planned?.find(c => c.instanceId === 'b')?.zone).toBe('discard');
    expect(cards[1]?.zone).toBe('deck');
  });
  it('rejects stale revisions, forged sources and changed top cards', () => {
    expect(prepareLeasedPrivateDeckTopMutation(cards, lease, { ...authority, revision: 8 }, [], ['a','b','c'])).toBeUndefined();
    expect(prepareLeasedPrivateDeckTopMutation(cards, lease, { ...authority, sourceCardInstanceId: 'fake' }, [], ['a','b','c'])).toBeUndefined();
    expect(prepareLeasedPrivateDeckTopMutation([cards[1]!, cards[0]!, cards[2]!, cards[3]!], lease, authority, [], ['a','b','c'])).toBeUndefined();
  });
});

describe('atomic candidate deck mutation', () => {
  const cards = [
    { instanceId: 'a', ownerPlayerId: 'p2', zone: 'deck' },
    { instanceId: 'b', ownerPlayerId: 'p2', zone: 'deck' },
    { instanceId: 'x', ownerPlayerId: 'p1', zone: 'deck' },
    { instanceId: 'c', ownerPlayerId: 'p2', zone: 'deck' },
    { instanceId: 'd', ownerPlayerId: 'p2', zone: 'deck' },
  ];
  it('prepares discard and reorder without changing input or other-player cards', () => {
    const planned = preparePrivateDeckTopMutation(cards, 'p2', ['a','b','c'], ['b'], ['c','a']);
    expect(planned?.filter(c => c.ownerPlayerId === 'p2' && c.zone === 'deck').map(c => c.instanceId)).toEqual(['c','a','d']);
    expect(planned?.find(c => c.instanceId === 'b')?.zone).toBe('discard');
    expect(planned?.find(c => c.instanceId === 'x')).toEqual(cards[2]);
    expect(cards[1]?.zone).toBe('deck');
  });
  it('rejects stale, forged or duplicate card collections atomically', () => {
    expect(preparePrivateDeckTopMutation(cards, 'p2', ['b','a','c'], [], ['a','b','c'])).toBeUndefined();
    expect(preparePrivateDeckTopMutation(cards, 'p2', ['a','b','c'], ['x'], ['a','b','c'])).toBeUndefined();
    expect(preparePrivateDeckTopMutation([...cards,cards[0]!], 'p2', ['a','b','c'], [], ['a','b','c'])).toBeUndefined();
  });
});

describe('staged private top-three planning', () => {
  it('supports a zero-discard transition and then ordering', () => {
    const phase = planPrivateDeckTopDiscard(['a','b','c'], ['a','b','c','d'], []);
    expect(phase?.reorderCandidates).toEqual(['a','b','c']);
    expect(planPrivateDeckTopReorder(phase!.reorderCandidates, ['a','b','c','d'], ['c','a','b'])).toEqual(['c','a','b','d']);
  });
  it('supports mixed subsets and all-card discard', () => {
    const phase = planPrivateDeckTopDiscard(['a','b','c'], ['a','b','c','d'], ['b']);
    expect(phase?.reorderCandidates).toEqual(['a','c']);
    expect(planPrivateDeckTopReorder(['a','c'], ['a','c','d'], ['c','a'])).toEqual(['c','a','d']);
    expect(planPrivateDeckTopDiscard(['a','b','c'], ['a','b','c','d'], ['a','b','c'])?.reorderCandidates).toEqual([]);
    expect(planPrivateDeckTopReorder([], ['d'], [])).toEqual(['d']);
  });
  it('rejects stale continuation and forged survivors', () => {
    expect(planPrivateDeckTopDiscard(['a','b','c'], ['b','a','c','d'], [])).toBeUndefined();
    expect(planPrivateDeckTopDiscard(['a','b','c'], ['a','b','c','d'], ['x'])).toBeUndefined();
    expect(planPrivateDeckTopReorder(['a','c'], ['c','a','d'], ['c','a'])).toBeUndefined();
    expect(planPrivateDeckTopReorder(['a','c'], ['a','c','d'], ['a','d'])).toBeUndefined();
  });
});

describe('private deck-top lease restore validation', () => {
  const lease = { controllerId: 'p1', targetPlayerId: 'p2', sourceCardInstanceId: 'source', abilityId: 'ability', decisionId: 'decision', createdRevision: 4, recordedTopIds: ['a', 'b', 'c'] };
  const live = { controllerId: 'p1', targetPlayerId: 'p2', sourceCardInstanceId: 'source', abilityId: 'ability', decisionId: 'decision', revision: 4, deckIds: ['a', 'b', 'c', 'd'] };
  it('accepts exact matching lease', () => expect(validatePrivateDeckTopLease(lease, live)).toBe(true));
  it('rejects stale revision and changed deck', () => {
    expect(validatePrivateDeckTopLease(lease, { ...live, revision: 5 })).toBe(false);
    expect(validatePrivateDeckTopLease(lease, { ...live, deckIds: ['b','a','c','d'] })).toBe(false);
  });
  it('rejects forgery and accepts same-player targets when on a battlefield', () => {
    expect(validatePrivateDeckTopLease({ ...lease, sourceCardInstanceId: 'forged' }, live)).toBe(false);
    expect(validatePrivateDeckTopLease({ ...lease, targetPlayerId: 'p1' }, { ...live, targetPlayerId: 'p1' })).toBe(true);
    expect(validatePrivateDeckTopLease({ ...lease, recordedTopIds: null as unknown as string[] }, live)).toBe(false);
  });
});

describe('private deck-top subset authority (pure readiness primitive)', () => {
  const deck = ['a', 'b', 'c', 'd', 'e'];
  it('allows zero discards and explicit reorder', () => {
    expect(plan(['a','b','c'], deck, [], ['c','a','b'])?.resultingDeckIds).toEqual(['c','a','b','d','e']);
  });
  it('allows any subset, including all three', () => {
    expect(plan(['a','b','c'], deck, ['a','c'], ['b'])?.resultingDeckIds).toEqual(['b','d','e']);
    expect(plan(['a','b','c'], deck, ['a','b','c'], [])?.resultingDeckIds).toEqual(['d','e']);
  });
  it('accepts short and empty decks', () => {
    expect(plan(['a'], ['a'], [], ['a'])?.resultingDeckIds).toEqual(['a']);
    expect(plan([], [], [], [])?.resultingDeckIds).toEqual([]);
  });
  it('rejects forged card identities, duplicates and incomplete survivor orders', () => {
    expect(plan(['a','b','c'], deck, ['z'], ['a','b','c'])).toBeUndefined();
    expect(plan(['a','b','c'], deck, ['a','a'], ['b','c'])).toBeUndefined();
    expect(plan(['a','b','c'], deck, [], ['a','b'])).toBeUndefined();
    expect(plan(['a','b','c'], deck, [], ['a','b','b'])).toBeUndefined();
  });
  it('fails closed on corrupted serialized selection shapes', () => {
    expect(plan(['a','b','c'], deck, null as unknown as string[], ['a','b','c'])).toBeUndefined();
    expect(plan(['a','b','c'], deck, [], 'abc' as unknown as string[])).toBeUndefined();
    expect(plan(['a', 2 as unknown as string], deck, [], ['a'])).toBeUndefined();
  });
  it('does not mutate the trusted recorded or live deck ordering', () => {
    const before = [...deck];
    const recorded = ['a','b','c'];
    const planned = plan(recorded, deck, ['b'], ['c','a']);
    expect(planned?.resultingDeckIds).toEqual(['c','a','d','e']);
    expect(deck).toEqual(before);
    expect(recorded).toEqual(['a','b','c']);
  });
  it('rejects stale top snapshots and impossible top sizes', () => {
    expect(plan(['a','b','c'], ['z','a','b','c'], [], ['a','b','c'])).toBeUndefined();
    expect(plan(['a','b'], deck, [], ['a','b'])).toBeUndefined();
    expect(plan(['a','b','c','d'], deck, [], ['a','b','c','d'])).toBeUndefined();
  });
});
