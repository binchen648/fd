import { describe, expect, it } from 'vitest';
import { previewSchedulerGate } from '../phase3-scheduler-gates';

const sha = 'a'.repeat(40);
const candidate = 'b'.repeat(40);
function snapshot(): any {
  return {
    schemaVersion: 'fd-c01-scheduler-snapshot-v1', controlEpoch: 'FD-P3-2026-09-23-08',
    task: { id: 'C01-TEST', state: 'READY', role: 'A', baseSha: sha, candidateSha: candidate, dispatchId: 'preview-1', domains: ['evidence'], requiredDependencies: ['dep-1'] },
    planner: { taskId: 'C01-TEST', state: 'REGISTERED_PREVIEW_ONLY', controlEpoch: 'FD-P3-2026-09-23-08', baseSha: sha, candidateSha: candidate, role: 'A', domains: ['evidence'], requiredDependencies: ['dep-1'] },
    git: { observedMainSha: sha, worktreeHeadSha: candidate, clean: true, availableCommits: [sha, candidate] },
    worker: { registered: true, role: 'A', allowedDomains: ['evidence'], status: { kind: 'idle', canAcceptDirectInput: true } },
    dependencies: [{ id: 'dep-1', state: 'PASS_EXACT_BOUND', reviewedSha: sha, requiredSha: sha, artifactSha256: 'c'.repeat(64) }],
    locksKnown: true, locks: [], delivery: { snapshotKnown: true, reservedIds: [], acknowledgedIds: [], uncertainIds: [] },
  };
}

describe('C01 read-only scheduler gates, not a live dispatcher', () => {
  it('previews a matching registered task without authorizing dispatch or changing input', () => {
    const input = snapshot(); const before = structuredClone(input);
    expect(previewSchedulerGate(input)).toMatchObject({ status: 'PREVIEW_READY', blockers: [], dispatchAuthorized: false, toolCalls: 0, acceptanceGranted: false });
    expect(input).toEqual(before);
  });
  it.each([
    ['STALE_BASE', (v: any) => { v.git.observedMainSha = candidate; }],
    ['STALE_WORKTREE', (v: any) => { v.git.worktreeHeadSha = sha; }],
    ['DIRTY_WORKTREE', (v: any) => { v.git.clean = false; }],
    ['COMMIT_UNAVAILABLE', (v: any) => { v.git.availableCommits = [sha]; }],
    ['ROLE_MISMATCH', (v: any) => { v.worker.role = 'B'; }],
    ['UNREGISTERED_WORKER', (v: any) => { v.worker.registered = false; }],
    ['DOMAIN_NOT_ALLOWED', (v: any) => { v.worker.allowedDomains = ['runtime']; }],
    ['LOCK_CONFLICT', (v: any) => { v.locks = [{ domain: 'evidence', taskId: 'other', state: 'HELD' }]; }],
    ['LOCK_STATE_UNKNOWN', (v: any) => { v.locks = [{ domain: 'evidence', taskId: 'other', state: 'UNKNOWN' }]; }],
    ['LOCK_SNAPSHOT_UNKNOWN', (v: any) => { v.locksKnown = false; }],
    ['DEPENDENCY_NOT_ACCEPTED', (v: any) => { v.dependencies[0].state = 'PENDING'; }],
    ['DEPENDENCY_NOT_ACCEPTED', (v: any) => { v.dependencies[0].state = 'FAIL'; }],
    ['DEPENDENCY_NOT_ACCEPTED', (v: any) => { v.dependencies[0].state = 'WAIT'; }],
    ['DEPENDENCY_MISSING', (v: any) => { v.dependencies = []; }],
    ['DEPENDENCY_BINDING_MISMATCH', (v: any) => { v.dependencies[0].reviewedSha = candidate; }],
    ['DEPENDENCY_BINDING_MISMATCH', (v: any) => { v.dependencies[0].artifactSha256 = ''; }],
    ['DUPLICATE_DELIVERY', (v: any) => { v.delivery.reservedIds = ['preview-1']; }],
    ['DUPLICATE_DELIVERY', (v: any) => { v.delivery.acknowledgedIds = ['preview-1']; }],
    ['UNCERTAIN_DELIVERY', (v: any) => { v.delivery.uncertainIds = ['preview-1']; }],
    ['DELIVERY_STATE_UNKNOWN', (v: any) => { v.delivery.snapshotKnown = false; }],
    ['WORKER_NOT_IDLE', (v: any) => { v.worker.status.kind = 'running'; }],
    ['WORKER_NOT_IDLE', (v: any) => { v.worker.status.kind = 'waiting'; }],
    ['WORKER_NOT_IDLE', (v: any) => { v.worker.status.kind = 'unknown'; }],
    ['WORKER_NOT_IDLE', (v: any) => { v.worker.status.canAcceptDirectInput = null; }],
    ['TASK_NOT_READY', (v: any) => { v.task.state = 'WAIT'; }],
    ['PLANNER_BINDING_MISMATCH', (v: any) => { v.task.role = 'B'; }],
    ['PLANNER_BINDING_MISMATCH', (v: any) => { v.task.requiredDependencies = []; }],
    ['PLANNER_BINDING_MISMATCH', (v: any) => { v.planner.controlEpoch = 'old'; }],
  ])('blocks %s before any delivery', (code, mutate) => {
    const input = snapshot(); (mutate as (v: any) => void)(input);
    const result = previewSchedulerGate(input);
    expect(result.status).toBe('BLOCKED'); expect(result.blockers).toContain(code);
    expect(result.dispatchAuthorized).toBe(false); expect(result.toolCalls).toBe(0); expect(result.acceptanceGranted).toBe(false);
  });
  it.each([null, {}, { schemaVersion: 'unknown' }])('fails closed on malformed snapshot', input => {
    expect(previewSchedulerGate(input)).toMatchObject({ status: 'BLOCKED', blockers: ['INVALID_SNAPSHOT'], dispatchAuthorized: false });
  });
  it('rejects duplicate dependencies instead of accepting the first matching row', () => {
    const input = snapshot(); input.dependencies.push({ ...input.dependencies[0], state: 'FAIL' });
    expect(previewSchedulerGate(input).blockers).toContain('INVALID_SNAPSHOT');
  });
  it('allows a known non-overlapping lock or own reservation only as a preview', () => {
    const input = snapshot(); input.locks = [{ domain: 'runtime', taskId: 'other', state: 'HELD' }, { domain: 'evidence', taskId: input.task.id, state: 'HELD' }];
    expect(previewSchedulerGate(input)).toMatchObject({ status: 'PREVIEW_READY', dispatchAuthorized: false });
  });
  it('does not accept a chat PASS without exact review metadata', () => {
    const input = snapshot(); input.dependencies[0] = { id: 'dep-1', state: 'PASS', message: 'Reviewer says PASS' };
    expect(previewSchedulerGate(input).status).toBe('BLOCKED');
  });
  it('retains reservation and uncertain delivery on repeat previews without a retry', () => {
    const input = snapshot(); input.delivery.reservedIds = ['preview-1']; input.delivery.uncertainIds = ['preview-1'];
    const before = structuredClone(input);
    expect(previewSchedulerGate(input).blockers).toEqual(expect.arrayContaining(['DUPLICATE_DELIVERY', 'UNCERTAIN_DELIVERY']));
    expect(previewSchedulerGate(input)).toEqual(previewSchedulerGate(before)); expect(input).toEqual(before);
  });
});
