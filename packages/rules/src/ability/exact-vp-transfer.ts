import type { RuleNode } from './types';

function record(v: unknown): RuleNode { return v && typeof v === 'object' && !Array.isArray(v) ? v as RuleNode : {}; }
function keys(v: RuleNode, expected: string[]): boolean {
  return Object.keys(v).length === expected.length && expected.every(k => Object.prototype.hasOwnProperty.call(v, k));
}
/** A full conditional cost, deliberately distinct from a clamped VP gift effect. */
export function isExactVpTransferCost(v: RuleNode): boolean {
  const recipient = record(v.recipient), exempt = record(v.exemptIf);
  return keys(v, ['type', 'amount', 'payment', 'recipient', 'exemptIf']) &&
    v.type === 'transfer_vp_to_owner' && v.payment === 'exact' &&
    Number.isSafeInteger(v.amount) && Number(v.amount) > 0 &&
    keys(recipient, ['masterId']) && typeof recipient.masterId === 'string' && recipient.masterId.startsWith('master.') &&
    keys(exempt, ['controllerMasterId']) && exempt.controllerMasterId === recipient.masterId;
}
