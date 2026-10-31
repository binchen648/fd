import { createCipheriv, createDecipheriv, randomBytes } from 'node:crypto';
import { closeSync, existsSync, fsyncSync, mkdirSync, openSync, readFileSync, renameSync, unlinkSync, writeFileSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import type { MatchRoom, MatchRoomHub, MatchRoomHubSnapshot } from '@fd/rules';

type RoomContext = ReturnType<MatchRoom['getPersistenceContext']>;
interface StoredRooms { version: 1; snapshot: MatchRoomHubSnapshot; contexts: Array<[string, RoomContext]> }

/** Private single-process store. Never expose either this file or its key over HTTP. */
export class RoomStore {
  private readonly file: string;
  private readonly lock: string;
  private readonly key: Buffer;
  private ownsLock = false;
  constructor(file: string) {
    this.file = resolve(file); this.lock = `${this.file}.lock`;
    mkdirSync(dirname(this.file), { recursive: true, mode: 0o700 });
    this.acquireLock();
    try {
      const keyFile = `${this.file}.key`;
      if (!existsSync(keyFile)) {
        if (existsSync(this.file)) throw new Error('Durable state key is missing');
        const fd = openSync(keyFile, 'wx', 0o600);
        try { writeFileSync(fd, randomBytes(32)); fsyncSync(fd); } finally { closeSync(fd); }
      }
      this.key = readFileSync(keyFile);
      if (this.key.length !== 32) throw new Error('Invalid durable state key');
    } catch (error) { this.close(); throw error; }
  }
  private acquireLock(): void {
    for (let attempt = 0; attempt < 2; attempt++) {
      try {
        const fd = openSync(this.lock, 'wx', 0o600);
        try { writeFileSync(fd, String(process.pid)); } finally { closeSync(fd); }
        this.ownsLock = true;
        return;
      } catch (error) {
        if ((error as NodeJS.ErrnoException).code !== 'EEXIST') throw error;
        // Serialize stale-lock recovery and re-read under the guard: a prior
        // observation of a dead PID cannot authorize deleting a new writer's lock.
        const guard = `${this.lock}.recover`;
        let guardFd: number;
        try { guardFd = openSync(guard, 'wx', 0o600); }
        catch { throw new Error('Durable state already has an active writer or recovery'); }
        try {
          if (!existsSync(this.lock)) continue;
          const pid = Number(readFileSync(this.lock, 'utf8'));
          if (!Number.isSafeInteger(pid) || pid <= 0) throw new Error('Invalid durable state lock');
          let dead = false;
          try { process.kill(pid, 0); } catch (probe) { dead = (probe as NodeJS.ErrnoException).code === 'ESRCH'; }
          if (!dead || attempt !== 0) throw new Error('Durable state already has an active writer');
          unlinkSync(this.lock);
          // Acquire the replacement before releasing the recovery guard.
          const fd = openSync(this.lock, 'wx', 0o600);
          try { writeFileSync(fd, String(process.pid)); } finally { closeSync(fd); }
          this.ownsLock = true;
          return;
        } finally { closeSync(guardFd); unlinkSync(guard); }
      }
    }
    throw new Error('Unable to acquire durable state lock');
  }
  restore(hub: MatchRoomHub): void {
    if (!existsSync(this.file)) return;
    try {
      const envelope = JSON.parse(readFileSync(this.file, 'utf8'));
      if (envelope.version !== 1) throw new Error('Unsupported durable state version');
      const decipher = createDecipheriv('aes-256-gcm', this.key, Buffer.from(envelope.iv, 'base64'));
      decipher.setAAD(Buffer.from('fd-room-store-v1'));
      decipher.setAuthTag(Buffer.from(envelope.tag, 'base64'));
      const stored = JSON.parse(Buffer.concat([decipher.update(Buffer.from(envelope.data, 'base64')), decipher.final()]).toString('utf8')) as StoredRooms;
      if (stored.version !== 1 || !Array.isArray(stored.snapshot?.rooms) || !Array.isArray(stored.contexts)) throw new Error('Invalid durable state payload');
      const contexts = new Map(stored.contexts);
      if (contexts.size !== stored.contexts.length || contexts.size !== stored.snapshot.rooms.length) throw new Error('Invalid durable room contexts');
      for (const room of stored.snapshot.rooms) {
        const context = contexts.get(room.roomId);
        if (!context?.persistenceSecret || !context.persistenceScope || context.restorePackKind !== 'production_executable') throw new Error('Invalid durable room context');
        // Connections belonged to the terminated process, not this server instance.
        for (const client of room.clients) client.connected = false;
      }
      hub.restore(stored.snapshot, contexts);
    } catch { throw new Error('Durable room store could not be validated; state preserved'); }
  }
  save(hub: MatchRoomHub): void {
    const snapshot = hub.serialize();
    const stored: StoredRooms = { version: 1, snapshot, contexts: snapshot.rooms.map(room => [room.roomId, hub.getRoom(room.roomId).getPersistenceContext()]) };
    const iv = randomBytes(12); const cipher = createCipheriv('aes-256-gcm', this.key, iv);
    cipher.setAAD(Buffer.from('fd-room-store-v1'));
    const data = Buffer.concat([cipher.update(JSON.stringify(stored), 'utf8'), cipher.final()]);
    const text = JSON.stringify({ version: 1, iv: iv.toString('base64'), tag: cipher.getAuthTag().toString('base64'), data: data.toString('base64') });
    const temporary = `${this.file}.${process.pid}.tmp`;
    const fd = openSync(temporary, 'w', 0o600);
    try { writeFileSync(fd, text); fsyncSync(fd); } finally { closeSync(fd); }
    renameSync(temporary, this.file);
    // POSIX directory sync makes the rename durable; Windows does not support it.
    if (process.platform !== 'win32') {
      const directory = openSync(dirname(this.file), 'r');
      try { fsyncSync(directory); } finally { closeSync(directory); }
    }
  }
  close(): void {
    if (!this.ownsLock) return;
    this.ownsLock = false;
    if (existsSync(this.lock)) unlinkSync(this.lock);
  }
}
