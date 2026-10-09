import { execFileSync } from 'node:child_process';
import { createHash } from 'node:crypto';
import { readFileSync, writeFileSync } from 'node:fs';
import { resolve } from 'node:path';

export type Obj = Record<string, any>;
export class InputError extends Error {}
export interface Issue { code: string; path: string; message: string }
export interface Reference { commit: string; path: string; sha256: string; section?: string }

export function object(value: unknown, label: string): Obj {
  if (!value || typeof value !== 'object' || Array.isArray(value)) throw new InputError(`${label}: expected object`);
  return value as Obj;
}
export function fields(value: Obj, allowed: string[], label: string): void {
  for (const key of Object.keys(value)) if (!allowed.includes(key)) throw new InputError(`${label}: unknown field ${key}`);
}
export function string(value: unknown, label: string): string {
  if (typeof value !== 'string' || !value.trim()) throw new InputError(`${label}: expected nonempty string`);
  return value;
}
export function array(value: unknown, label: string): any[] {
  if (!Array.isArray(value)) throw new InputError(`${label}: expected array`);
  return value;
}
export function sha(value: unknown, label: string): string {
  if (!/^[0-9a-f]{40}$/.test(string(value, label))) throw new InputError(`${label}: expected full lowercase commit SHA`);
  return value as string;
}
export function safePath(value: unknown, label: string): string {
  const path = string(value, label);
  if (path.includes('\\') || path.startsWith('/') || path.includes(':') || path.split('/').some(part => !part || part === '.' || part === '..')) {
    throw new InputError(`${label}: expected repository-relative literal path`);
  }
  return path;
}
export function digest(value: unknown, label: string): string {
  const hash = string(value, label).toUpperCase();
  if (!/^[0-9A-F]{64}$/.test(hash)) throw new InputError(`${label}: expected SHA-256`);
  return hash;
}
export function hash(value: Buffer | string): string {
  return createHash('sha256').update(value).digest('hex').toUpperCase();
}
export function git(root: string, args: string[]): Buffer {
  return execFileSync('git', args, { cwd: root, maxBuffer: 64 * 1024 * 1024, stdio: ['ignore', 'pipe', 'pipe'] });
}
export function gitText(root: string, args: string[]): string { return git(root, args).toString('utf8').trim(); }
export function commitExists(root: string, value: string): boolean {
  try { return gitText(root, ['rev-parse', '--verify', `${value}^{commit}`]) === value; } catch { return false; }
}
export function ancestor(root: string, base: string, candidate: string): boolean {
  if (!commitExists(root, base) || !commitExists(root, candidate)) return false;
  try { git(root, ['merge-base', '--is-ancestor', base, candidate]); return true; }
  catch (error) { if ((error as { status?: number }).status === 1) return false; throw error; }
}
export function parseReference(raw: unknown, label: string, requireSection = false): Reference {
  const ref = object(raw, label);
  fields(ref, ['commit', 'path', 'sha256', 'section'], label);
  return { commit: sha(ref.commit, `${label}.commit`), path: safePath(ref.path, `${label}.path`),
    sha256: digest(ref.sha256, `${label}.sha256`),
    ...(ref.section !== undefined || requireSection ? { section: string(ref.section, `${label}.section`) } : {}) };
}
export function readReference(root: string, ref: Reference, issues: Issue[]): Buffer | undefined {
  try {
    if (!commitExists(root, ref.commit)) throw new Error('commit not available');
    const bytes = git(root, ['show', `${ref.commit}:${ref.path}`]);
    if (hash(bytes) !== ref.sha256) throw new Error('SHA-256 mismatch');
    if (ref.section && !bytes.toString('utf8').includes(ref.section)) throw new Error('section not found');
    return bytes;
  } catch (error) {
    issues.push({ code: 'REFERENCE_BINDING_FAILED', path: `${ref.commit}:${ref.path}`, message: String(error) });
    return undefined;
  }
}
export function json(bytes: Buffer | string, label: string): Obj {
  try { return object(JSON.parse(bytes.toString()), label); }
  catch (error) { throw new InputError(`${label}: invalid JSON object (${String(error)})`); }
}
export function parseArgs(argv: string[], allowed: string[], required: string[]): Record<string, string> {
  const args: Record<string, string> = {};
  for (let i = 0; i < argv.length; i += 2) {
    const name = argv[i]; const value = argv[i + 1];
    if (!allowed.includes(name) || args[name] || !value || value.startsWith('--')) throw new InputError(`Malformed argument ${name}`);
    args[name] = value;
  }
  for (const name of required) if (!args[name]) throw new InputError(`Missing argument ${name}`);
  return args;
}
export function output(value: unknown, out?: string): void {
  const text = `${JSON.stringify(value, null, 2)}\n`;
  if (out) {
    const path = safePath(out, '--out');
    if (!path.startsWith('artifacts/')) throw new InputError('--out must stay in artifacts/');
    writeFileSync(resolve(path), text);
  }
  process.stdout.write(text);
}
export function inputFile(path: string): { value: Obj; sha256: string } {
  const bytes = readFileSync(resolve(path));
  return { value: json(bytes, path), sha256: hash(bytes) };
}
export function cliError(error: unknown): void {
  process.stdout.write(`${JSON.stringify({ status: 'FAIL', issueCode: error instanceof InputError ? 'MALFORMED_INPUT' : 'TOOL_EXECUTION_FAILED', message: String(error) })}\n`);
  process.exitCode = error instanceof InputError ? 2 : 1;
}
