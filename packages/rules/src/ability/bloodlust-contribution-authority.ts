import type { GameState } from '../schema/game';
import { hmacSha256Hex, sha256Hex } from './portable-sha256';

export interface BloodlustContributionAuthorityRecord {
  cardInstanceId: string;
  beneficiaryPlayerId: string;
  resourceKey: string;
  providerSourceCardId: string;
  providerAbilityId: string;
  round: number;
  contributors: Array<{ playerId: string; amount: 1 }>;
}
export interface BloodlustContributionServerAuthoritySnapshot { records: BloodlustContributionAuthorityRecord[]; }
export interface BloodlustContributionServerAuthoritySeal {
  version: 1;
  checkpointId: string | null;
  stateBinding: string;
  authority: BloodlustContributionServerAuthoritySnapshot;
  mac: string;
}
const authorityByState = new WeakMap<GameState, BloodlustContributionServerAuthoritySnapshot>();
function cloneAuthority(value: BloodlustContributionServerAuthoritySnapshot): BloodlustContributionServerAuthoritySnapshot { return structuredClone(value); }
function authority(state: GameState): BloodlustContributionServerAuthoritySnapshot {
  let value = authorityByState.get(state); if (!value) { value = { records: [] }; authorityByState.set(state, value); } return value;
}
function exactKeys(value: Record<string, unknown>, expected: readonly string[]): boolean { const keys=Object.keys(value).sort(), target=[...expected].sort(); return keys.length===target.length&&keys.every((k,i)=>k===target[i]); }
function isRecord(value: unknown): value is Record<string, unknown> { return !!value && typeof value==='object' && !Array.isArray(value); }
function isRecordEntry(value: unknown): value is BloodlustContributionAuthorityRecord {
  if(!isRecord(value)||!exactKeys(value,['cardInstanceId','beneficiaryPlayerId','resourceKey','providerSourceCardId','providerAbilityId','round','contributors'])||
    typeof value.cardInstanceId!=='string'||typeof value.beneficiaryPlayerId!=='string'||typeof value.resourceKey!=='string'||
    typeof value.providerSourceCardId!=='string'||typeof value.providerAbilityId!=='string'||!Number.isSafeInteger(value.round)||Number(value.round)<1||
    !Array.isArray(value.contributors)||value.contributors.length<1) return false;
  const contributors=value.contributors as unknown[]; const ids:string[]=[];
  for(const c of contributors){if(!isRecord(c)||!exactKeys(c,['playerId','amount'])||typeof c.playerId!=='string'||c.amount!==1)return false;ids.push(c.playerId);}
  return new Set(ids).size===ids.length;
}
function isAuthority(value: unknown): value is BloodlustContributionServerAuthoritySnapshot {
  return isRecord(value)&&exactKeys(value,['records'])&&Array.isArray(value.records)&&value.records.every(isRecordEntry)&&
    new Set((value.records as BloodlustContributionAuthorityRecord[]).map(r=>r.cardInstanceId)).size===(value.records as BloodlustContributionAuthorityRecord[]).length;
}
function isSeal(value: unknown): value is BloodlustContributionServerAuthoritySeal {
  return isRecord(value)&&exactKeys(value,['version','checkpointId','stateBinding','authority','mac'])&&value.version===1&&
    (value.checkpointId===null||(typeof value.checkpointId==='string'&&/^checkpoint:\d+$/.test(value.checkpointId)))&&
    typeof value.stateBinding==='string'&&/^[0-9a-f]{64}$/.test(value.stateBinding)&&isAuthority(value.authority)&&typeof value.mac==='string'&&/^[0-9a-f]{64}$/.test(value.mac);
}
function sealPayload(scope:string,checkpointId:string|null,stateBinding:string,snapshot:BloodlustContributionServerAuthoritySnapshot):string{
  return JSON.stringify({version:1,persistenceScope:scope,checkpointId,stateBinding,authority:snapshot});
}
export function rememberBloodlustContributionAuthority(state:GameState,record:BloodlustContributionAuthorityRecord|undefined,cardInstanceId:string):void{
  const value=authority(state); value.records=value.records.filter(r=>r.cardInstanceId!==cardInstanceId); if(record)value.records.push(structuredClone(record));
  if(value.records.length===0)authorityByState.delete(state);
}
export function getBloodlustContributionAuthority(state:GameState,cardInstanceId:string):BloodlustContributionAuthorityRecord|undefined{
  const record=authorityByState.get(state)?.records.find(r=>r.cardInstanceId===cardInstanceId); return record?structuredClone(record):undefined;
}
export function copyBloodlustContributionServerAuthority(from:GameState,to:GameState):void{
  const value=authorityByState.get(from); if(!value){authorityByState.delete(to);return;} authorityByState.set(to,cloneAuthority(value));
}
export function persistBloodlustContributionServerAuthority(state:GameState,secret:string,scope:string,checkpointId?:string):BloodlustContributionServerAuthoritySeal|undefined{
  const current=authorityByState.get(state); if(!current?.records.length)return undefined; const snapshot=cloneAuthority(current); const cp=checkpointId??null; const stateBinding=sha256Hex(JSON.stringify(state));
  return {version:1,checkpointId:cp,stateBinding,authority:snapshot,mac:hmacSha256Hex(secret,sealPayload(scope,cp,stateBinding,snapshot))};
}
export function restoreBloodlustContributionServerAuthority(state:GameState,seal:BloodlustContributionServerAuthoritySeal|undefined,secret:string,scope:string,checkpointId?:string):boolean{
  if(!seal){authorityByState.delete(state);return true;} if(!isSeal(seal))return false; const cp=checkpointId??null;if(seal.checkpointId!==cp)return false;
  const stateBinding=sha256Hex(JSON.stringify(state)); if(seal.stateBinding!==stateBinding)return false;
  if(seal.mac!==hmacSha256Hex(secret,sealPayload(scope,cp,stateBinding,seal.authority)))return false; authorityByState.set(state,cloneAuthority(seal.authority)); return true;
}
export function isBloodlustContributionServerAuthorityConsistent(state:GameState):boolean{
  const records=authorityByState.get(state)?.records??[]; const runtime=state.abilityRuntime; if(!runtime)return records.length===0;
  const sensitive=Object.entries(runtime.cardState).filter(([,st])=>!!st.playManaContributions?.length);
  if(sensitive.length!==records.length)return false;
  for(const [cardInstanceId,st] of sensitive){const record=records.find(r=>r.cardInstanceId===cardInstanceId); if(!record)return false;
    if(record.round!==st.playedRound||record.contributors.length!==st.playManaContributions!.length)return false;
    if(record.contributors.some((x,i)=>x.playerId!==st.playManaContributions![i]!.playerId||x.amount!==1))return false;
  }
  return records.every(r=>sensitive.some(([id])=>id===r.cardInstanceId));
}