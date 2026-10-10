type Obj = Record<string, any>;
const object = (value: unknown): value is Obj => !!value && typeof value === 'object' && !Array.isArray(value);
const text = (value: unknown): value is string => typeof value === 'string' && value.trim().length > 0;
const sha = (value: unknown): boolean => typeof value === 'string' && /^[a-f0-9]{40}$/.test(value);
const uniqueStrings = (value: unknown): value is string[] => Array.isArray(value) && value.every(text) && new Set(value).size === value.length;
const sameSet = (a: string[], b: string[]): boolean => a.length === b.length && a.every(item => b.includes(item));

function validSnapshot(input: unknown): input is Obj {
  if (!object(input) || input.schemaVersion !== 'fd-c01-scheduler-snapshot-v1' || !text(input.controlEpoch)) return false;
  const { task, planner, git, worker, dependencies, locks, delivery } = input;
  if (![task, planner, git, worker, delivery].every(object)) return false;
  if (!text(task.id) || !text(task.state) || !text(task.role) || !text(task.dispatchId) || !sha(task.baseSha) || !sha(task.candidateSha)
    || !uniqueStrings(task.domains) || !task.domains.length || !uniqueStrings(task.requiredDependencies)) return false;
  if (!text(planner.taskId) || !text(planner.state) || !text(planner.controlEpoch) || !text(planner.role)
    || !sha(planner.baseSha) || !sha(planner.candidateSha) || !uniqueStrings(planner.domains) || !uniqueStrings(planner.requiredDependencies)) return false;
  if (!sha(git.observedMainSha) || !sha(git.worktreeHeadSha) || typeof git.clean !== 'boolean'
    || !uniqueStrings(git.availableCommits) || !git.availableCommits.every(sha)) return false;
  if (typeof worker.registered !== 'boolean' || !text(worker.role) || !uniqueStrings(worker.allowedDomains) || !object(worker.status)
    || !text(worker.status.kind) || ![true, false, null].includes(worker.status.canAcceptDirectInput)) return false;
  if (!Array.isArray(dependencies) || dependencies.some(row => !object(row) || !text(row.id) || !text(row.state))
    || new Set(dependencies.map(row => row.id)).size !== dependencies.length) return false;
  if (typeof input.locksKnown !== 'boolean' || !Array.isArray(locks) || locks.some(row => !object(row) || !text(row.domain) || !text(row.taskId) || !text(row.state))) return false;
  return typeof delivery.snapshotKnown === 'boolean' && uniqueStrings(delivery.reservedIds)
    && uniqueStrings(delivery.acknowledgedIds) && uniqueStrings(delivery.uncertainIds);
}

// Evaluates supplied snapshots only. It has no transport, reservation or send path.
// Git/review/queue observations must be collected and authenticated by future tooling.
export function previewSchedulerGate(input: unknown) {
  const blockers: string[] = [];
  const reject = (condition: boolean, code: string) => { if (condition) blockers.push(code); };
  if (!validSnapshot(input)) blockers.push('INVALID_SNAPSHOT');
  else {
    const { task, planner, git, worker, dependencies, locks, delivery } = input;
    reject(planner.state !== 'REGISTERED_PREVIEW_ONLY' || planner.taskId !== task.id || planner.controlEpoch !== input.controlEpoch
      || planner.baseSha !== task.baseSha || planner.candidateSha !== task.candidateSha || planner.role !== task.role
      || !sameSet(planner.domains, task.domains) || !sameSet(planner.requiredDependencies, task.requiredDependencies), 'PLANNER_BINDING_MISMATCH');
    reject(task.state !== 'READY', 'TASK_NOT_READY');
    reject(task.baseSha !== git.observedMainSha, 'STALE_BASE');
    reject(task.candidateSha !== git.worktreeHeadSha, 'STALE_WORKTREE');
    reject(!git.clean, 'DIRTY_WORKTREE');
    reject(!git.availableCommits.includes(task.baseSha) || !git.availableCommits.includes(task.candidateSha), 'COMMIT_UNAVAILABLE');
    reject(!worker.registered, 'UNREGISTERED_WORKER');
    reject(worker.role !== task.role, 'ROLE_MISMATCH');
    reject(task.domains.some((domain: string) => !worker.allowedDomains.includes(domain)), 'DOMAIN_NOT_ALLOWED');
    reject(worker.status.kind !== 'idle' || worker.status.canAcceptDirectInput !== true, 'WORKER_NOT_IDLE');
    reject(!input.locksKnown, 'LOCK_SNAPSHOT_UNKNOWN');
    for (const domain of task.domains) {
      const matching = locks.filter((lock: Obj) => lock.domain === domain);
      reject(matching.some((lock: Obj) => !['HELD', 'RELEASED'].includes(lock.state)), 'LOCK_STATE_UNKNOWN');
      reject(matching.some((lock: Obj) => lock.state === 'HELD' && lock.taskId !== task.id), 'LOCK_CONFLICT');
    }
    for (const id of task.requiredDependencies) {
      const dependency = dependencies.find((row: Obj) => row.id === id);
      reject(!dependency, 'DEPENDENCY_MISSING');
      if (!dependency) continue;
      reject(dependency.state !== 'PASS_EXACT_BOUND', 'DEPENDENCY_NOT_ACCEPTED');
      reject(!sha(dependency.reviewedSha) || !sha(dependency.requiredSha) || dependency.reviewedSha !== dependency.requiredSha
        || typeof dependency.artifactSha256 !== 'string' || !/^[a-fA-F0-9]{64}$/.test(dependency.artifactSha256), 'DEPENDENCY_BINDING_MISMATCH');
    }
    reject(!delivery.snapshotKnown, 'DELIVERY_STATE_UNKNOWN');
    reject(delivery.reservedIds.includes(task.dispatchId) || delivery.acknowledgedIds.includes(task.dispatchId), 'DUPLICATE_DELIVERY');
    reject(delivery.uncertainIds.includes(task.dispatchId), 'UNCERTAIN_DELIVERY');
  }
  return { schemaVersion: 'fd-c01-scheduler-preview-v1', status: blockers.length ? 'BLOCKED' : 'PREVIEW_READY',
    blockers: [...new Set(blockers)], dispatchAuthorized: false, acceptanceGranted: false,
    mode: 'READ_ONLY_SUPPLIED_SNAPSHOT', liveFactsVerified: false, toolCalls: 0 };
}
