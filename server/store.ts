// Persistent storage, password hashing and cookie sessions for the Express server.
//
// Two storage modes:
//  - File (laptop / own server): everything is kept in DATA_DIR/db.json (default ./data).
//  - Database (Vercel): when DATABASE_URL or POSTGRES_URL is set, data is kept in Postgres
//    (for example Neon from the Vercel "Storage" tab). Each request loads the data, changes
//    are saved before the answer is sent, and changes are serialized with a database lock,
//    so several tatami consoles can work at the same time.
import fs from 'fs';
import path from 'path';
import crypto from 'crypto';
import type { NextFunction, Request, Response } from 'express';
import pg from 'pg';
import { attachDatabasePool } from '@vercel/functions';

export interface StoredUserAccount {
  id: string;
  email: string;
  passwordHash: string; // scrypt$<salt>$<hash>
  fullName: string;
  phone?: string;
  role: string;
  provider: 'credentials' | 'google' | 'facebook';
  avatarUrl?: string;
  clubName?: string;
  licenseCode?: string;
  alsoCompetes?: boolean;
  isVerified: boolean;
  confirmedAt?: string;
  createdAt: string;
}

interface SessionRecord {
  userId: string;
  expiresAt: number;
}

interface ImageMeta {
  mimeType: string;
  fileName: string;
  sizeBytes: number;
  uploadedAt: string;
}

export interface SharedStateEntry {
  version: number;
  value: unknown;
  updatedAt: string;
  updatedBy: string;
}

export interface InviteRecord {
  role: string;
  note?: string;
  createdBy: string;
  createdAt: string;
  expiresAt: number;
  maxUses: number;
  uses: number;
}

/** Secret key of a tatami device (secretary tablet / laptop) that may control one tatami. */
export interface DeviceKeyRecord {
  tatamiNumber: number;
  label?: string;
  createdBy: string;
  createdAt: string;
  expiresAt: number;
}

interface DbShape {
  events: any[] | null;
  invites: Record<string, InviteRecord>;
  deviceKeys: Record<string, DeviceKeyRecord>;
  state: Record<string, SharedStateEntry>;
  accounts: StoredUserAccount[];
  sessions: Record<string, SessionRecord>;
  images: Record<string, ImageMeta>;
  /** Set by «Подготовка к запуску»: demo data is never seeded again. */
  launchedAt?: string;
}

const DATABASE_URL = process.env.DATABASE_URL || process.env.POSTGRES_URL || '';
/** Postgres mode (Vercel). Otherwise the JSON file is used. */
export const USE_DATABASE = !!DATABASE_URL;
/** Instant updates (SSE) need a long-running server; on Vercel screens poll instead. */
export const REALTIME = !USE_DATABASE && !process.env.VERCEL;

export const DATA_DIR = path.resolve(process.env.DATA_DIR || 'data');
export const UPLOADS_DIR = path.join(DATA_DIR, 'uploads');
const DB_FILE = path.join(DATA_DIR, 'db.json');

/** On Vercel without a connected database nothing can be saved (the disk is read-only). */
export const DATABASE_MISSING = !USE_DATABASE && !!process.env.VERCEL;

if (!USE_DATABASE && !DATABASE_MISSING) fs.mkdirSync(UPLOADS_DIR, { recursive: true });

const emptyDb = (): DbShape => ({ events: null, state: {}, invites: {}, deviceKeys: {}, accounts: [], sessions: {}, images: {} });

function normalize(raw: any): DbShape {
  return {
      events: Array.isArray(raw.events) ? raw.events : null,
      state: raw.state && typeof raw.state === 'object' ? raw.state : {},
      invites: raw.invites && typeof raw.invites === 'object' ? raw.invites : {},
      deviceKeys: raw.deviceKeys && typeof raw.deviceKeys === 'object' ? raw.deviceKeys : {},
      accounts: Array.isArray(raw.accounts) ? raw.accounts : [],
      sessions: raw.sessions && typeof raw.sessions === 'object' ? raw.sessions : {},
      images: raw.images && typeof raw.images === 'object' ? raw.images : {},
      launchedAt: typeof raw.launchedAt === 'string' ? raw.launchedAt : undefined
  };
}

function loadDb(): DbShape {
  if (USE_DATABASE || DATABASE_MISSING) return emptyDb(); // loaded per request
  try {
    return normalize(JSON.parse(fs.readFileSync(DB_FILE, 'utf8')));
  } catch {
    return emptyDb();
  }
}

export const db: DbShape = loadDb();

let saveTimer: NodeJS.Timeout | null = null;
function writeNow() {
  if (USE_DATABASE) return; // saved by the request middleware
  const tmp = `${DB_FILE}.tmp`;
  fs.writeFileSync(tmp, JSON.stringify(db, null, 2));
  fs.renameSync(tmp, DB_FILE);
}

/** Debounced atomic save of the whole database file. */
export function saveDb() {
  if (USE_DATABASE || saveTimer) return;
  saveTimer = setTimeout(() => {
    saveTimer = null;
    try {
      writeNow();
    } catch (err) {
      console.error('[store] Failed to save database:', err);
    }
  }, 200);
}

/** Writes a full copy of the database to DATA_DIR/backups and returns its path. */
export function writeBackup(label = 'backup'): string {
  if (USE_DATABASE) {
    const name = `${label}-${new Date().toISOString().replace(/[:.]/g, '-')}`;
    pendingBackups.push({ key: `backup:${name}`, value: JSON.parse(JSON.stringify(db)) });
    return name;
  }
  const dir = path.join(DATA_DIR, 'backups');
  fs.mkdirSync(dir, { recursive: true });
  const file = path.join(dir, `${label}-${new Date().toISOString().replace(/[:.]/g, '-')}.json`);
  fs.writeFileSync(file, JSON.stringify(db, null, 2));
  return file;
}

/** Saves immediately (used before risky operations). */
export function saveDbNow() {
  if (saveTimer) {
    clearTimeout(saveTimer);
    saveTimer = null;
  }
  writeNow();
}

if (!USE_DATABASE) process.on('exit', () => {
  if (saveTimer) {
    try { writeNow(); } catch { /* ignore */ }
  }
});
for (const sig of ['SIGINT', 'SIGTERM'] as const) {
  process.on(sig, () => process.exit(0));
}

// ---------------- Passwords ----------------

export function hashPassword(password: string): string {
  const salt = crypto.randomBytes(16).toString('hex');
  const hash = crypto.scryptSync(password, salt, 64).toString('hex');
  return `scrypt$${salt}$${hash}`;
}

export function verifyPassword(password: string, stored: string): boolean {
  const [scheme, salt, hash] = String(stored || '').split('$');
  if (scheme !== 'scrypt' || !salt || !hash) return false;
  const expected = Buffer.from(hash, 'hex');
  const actual = crypto.scryptSync(password, salt, expected.length);
  return crypto.timingSafeEqual(expected, actual);
}

// ---------------- Accounts ----------------

export function findAccountByEmail(email: string): StoredUserAccount | undefined {
  const normalized = email.trim().toLowerCase();
  return db.accounts.find((a) => a.email === normalized);
}

export function findAccountById(id: string): StoredUserAccount | undefined {
  return db.accounts.find((a) => a.id === id);
}

export function addAccount(account: StoredUserAccount) {
  db.accounts.push(account);
  saveDb();
}

export function publicUser(u: StoredUserAccount) {
  const { passwordHash: _omit, ...rest } = u;
  return rest;
}

/**
 * Creates the administrator account on first start.
 * Production: requires ADMIN_EMAIL + ADMIN_PASSWORD env vars.
 * Development: falls back to admin@localhost with a random password printed once.
 */
export function ensureAdminAccount(isProduction: boolean) {
  if (db.accounts.some((a) => a.role === 'admin')) return;

  let email = process.env.ADMIN_EMAIL?.trim().toLowerCase();
  let password = process.env.ADMIN_PASSWORD;
  let generated = false;

  if (!email || !password) {
    if (isProduction) {
      console.warn('[auth] No admin account exists. Set ADMIN_EMAIL and ADMIN_PASSWORD and restart to create one.');
      return;
    }
    email = 'admin@localhost';
    password = crypto.randomBytes(9).toString('base64url');
    generated = true;
  }

  addAccount({
    id: `usr-admin-${crypto.randomUUID()}`,
    email,
    passwordHash: hashPassword(password),
    fullName: 'Администратор',
    role: 'admin',
    provider: 'credentials',
    isVerified: true,
    confirmedAt: new Date().toISOString(),
    createdAt: new Date().toISOString()
  });

  if (generated) {
    console.log('================================================================');
    console.log(`[auth] Dev admin created: ${email} / ${password}`);
    console.log('[auth] (shown once; set ADMIN_EMAIL/ADMIN_PASSWORD to choose your own)');
    console.log('================================================================');
  } else {
    console.log(`[auth] Admin account created for ${email}`);
  }
}

// ---------------- Sessions (HttpOnly cookie) ----------------

const SESSION_COOKIE = 'kt_sid';
const SESSION_TTL_MS = 7 * 24 * 60 * 60 * 1000;

function parseCookies(req: Request): Record<string, string> {
  const out: Record<string, string> = {};
  const header = req.headers.cookie;
  if (!header) return out;
  for (const part of header.split(';')) {
    const idx = part.indexOf('=');
    if (idx === -1) continue;
    const k = part.slice(0, idx).trim();
    const v = part.slice(idx + 1).trim();
    try { out[k] = decodeURIComponent(v); } catch { out[k] = v; }
  }
  return out;
}

function isSecureRequest(req: Request) {
  return req.secure || req.get('x-forwarded-proto') === 'https';
}

export function createSession(req: Request, res: Response, userId: string) {
  const token = crypto.randomBytes(32).toString('base64url');
  db.sessions[token] = { userId, expiresAt: Date.now() + SESSION_TTL_MS };
  saveDb();
  res.cookie(SESSION_COOKIE, token, {
    httpOnly: true,
    sameSite: 'lax',
    secure: isSecureRequest(req),
    maxAge: SESSION_TTL_MS,
    path: '/'
  });
}

export function destroySession(req: Request, res: Response) {
  const token = parseCookies(req)[SESSION_COOKIE];
  if (token && db.sessions[token]) {
    delete db.sessions[token];
    saveDb();
  }
  res.clearCookie(SESSION_COOKIE, { path: '/' });
}

export function getSessionUser(req: Request): StoredUserAccount | null {
  const token = parseCookies(req)[SESSION_COOKIE];
  if (!token) return null;
  const session = db.sessions[token];
  if (!session) return null;
  if (session.expiresAt < Date.now()) {
    delete db.sessions[token];
    saveDb();
    return null;
  }
  return findAccountById(session.userId) || null;
}

export function isAdminRequest(req: Request): boolean {
  return getSessionUser(req)?.role === 'admin';
}

// ---------------- Uploaded images ----------------

export function saveImage(id: string, buffer: Buffer, meta: ImageMeta) {
  if (USE_DATABASE) pendingImages.set(id, buffer.toString('base64'));
  else fs.writeFileSync(path.join(UPLOADS_DIR, id), buffer);
  db.images[id] = meta;
  saveDb();
}

export async function readImage(id: string): Promise<{ meta: ImageMeta; buffer: Buffer } | null> {
  const meta = db.images[id];
  if (!meta || !/^[\w.-]+$/.test(id)) return null;
  try {
    if (USE_DATABASE) {
      const r = await getPool().query('select value from tatami_kv where key = $1', [`img:${id}`]);
      return r.rows[0] ? { meta, buffer: Buffer.from(String(r.rows[0].value.data), 'base64') } : null;
    }
    return { meta, buffer: fs.readFileSync(path.join(UPLOADS_DIR, id)) };
  } catch {
    return null;
  }
}

// ---------------- Simple per-IP rate limiter ----------------

export function rateLimiter(limit: number, windowMs: number) {
  const hits = new Map<string, { count: number; resetAt: number }>();
  return (req: Request, res: Response, next: () => void) => {
    const key = req.ip || 'unknown';
    const now = Date.now();
    const entry = hits.get(key);
    if (!entry || entry.resetAt < now) {
      hits.set(key, { count: 1, resetAt: now + windowMs });
      return next();
    }
    entry.count += 1;
    if (entry.count > limit) {
      res.status(429).json({ error: 'Слишком много запросов. Попробуйте через минуту.' });
      return;
    }
    next();
  };
}

// ---------------- Database mode (Vercel + Postgres) ----------------

const DB_KEYS = ['events', 'invites', 'deviceKeys', 'state', 'accounts', 'sessions', 'images', 'launchedAt'] as const;
const pendingImages = new Map<string, string>();
const pendingBackups: { key: string; value: unknown }[] = [];
let pool: pg.Pool | null = null;
let schemaReady: Promise<void> | null = null;

function getPool(): pg.Pool {
  if (!pool) {
    pool = new pg.Pool({ connectionString: DATABASE_URL, max: 3, idleTimeoutMillis: 10_000 });
    // Vercel: release idle connections before the function is suspended
    if (process.env.VERCEL) attachDatabasePool(pool);
  }
  return pool;
}

function ensureSchema(): Promise<void> {
  if (!schemaReady) {
    schemaReady = getPool()
      .query('create table if not exists tatami_kv (key text primary key, value jsonb not null, updated_at timestamptz not null default now())')
      .then(() => undefined)
      .catch((err) => {
        schemaReady = null;
        throw err;
      });
  }
  return schemaReady;
}

/** Fast check used by screens that poll: version of one shared list without loading everything. */
export async function stateVersion(key: string): Promise<number> {
  await ensureSchema();
  const r = await getPool().query("select coalesce((value -> $1 ->> 'version')::int, 0) as v from tatami_kv where key = 'state'", [key]);
  return r.rows[0]?.v ?? 0;
}

function loadRows(rows: { key: string; value: any }[]) {
  const raw: Record<string, unknown> = {};
  for (const r of rows) raw[r.key] = r.key === 'launchedAt' ? r.value?.at : r.value;
  const next = normalize(raw);
  for (const k of DB_KEYS) (db as any)[k] = (next as any)[k];
}

const snapshotOf = () => Object.fromEntries(DB_KEYS.map((k) => [k, JSON.stringify((db as any)[k] ?? null)]));

// One request at a time per server instance (the data object is shared);
// across instances, writes are serialized by a Postgres advisory lock.
let queue: Promise<void> = Promise.resolve();
const NO_DB_PATHS = new Set(['/api/health', '/api/chat', '/api/stream']);

/** Express middleware: load data before the handler, save changes before the answer is sent. */
export function databaseMiddleware(onLoaded?: () => void) {
  return (req: Request, res: Response, next: NextFunction) => {
    if (DATABASE_MISSING && !NO_DB_PATHS.has(req.path)) {
      res.status(503).json({ error: 'База данных не подключена. В Vercel откройте Storage → Create Database → Neon и сделайте Redeploy.' });
      return;
    }
    if (!USE_DATABASE || NO_DB_PATHS.has(req.path)) return next();
    let release!: () => void;
    const turn = new Promise<void>((r) => (release = r));
    const previous = queue;
    queue = previous.then(() => turn);

    previous.then(async () => {
      let client: pg.PoolClient | null = null;
      let finished = false;
      const finish = (err?: unknown) => {
        if (finished) return;
        finished = true;
        clearTimeout(guard);
        client?.release(err instanceof Error ? err : undefined);
        release();
      };
      // Safety: never block the queue for long if a handler forgets to answer
      const guard = setTimeout(() => finish(), 25_000);
      try {
        await ensureSchema();
        client = await getPool().connect();
        const writes = req.method !== 'GET' && req.method !== 'HEAD';
        if (writes) {
          await client.query('begin');
          await client.query('select pg_advisory_xact_lock(424242)');
        }
        const rows = await client.query("select key, value from tatami_kv where key not like 'img:%' and key not like 'backup:%'");
        loadRows(rows.rows);
        pendingImages.clear();
        pendingBackups.length = 0;
        const before = snapshotOf();
        onLoaded?.(); // e.g. creates the first administrator: counted as a change and saved

        const originalEnd = res.end.bind(res) as (...a: any[]) => Response;
        (res as any).end = (...args: any[]) => {
          const c = client!;
          const persist = async () => {
            if (res.statusCode >= 500) {
              if (writes) await c.query('rollback');
              return;
            }
            const after = snapshotOf();
            const changed = DB_KEYS.filter((k) => after[k] !== before[k]);
            if (changed.length || pendingImages.size || pendingBackups.length) {
              if (!writes) {
                await c.query('begin');
                await c.query('select pg_advisory_xact_lock(424242)');
              }
              for (const k of changed) {
                const value = k === 'launchedAt' ? { at: db.launchedAt ?? null } : (db as any)[k];
                await c.query(
                  'insert into tatami_kv (key, value, updated_at) values ($1, $2, now()) on conflict (key) do update set value = excluded.value, updated_at = now()',
                  [k, JSON.stringify(value ?? null)]
                );
              }
              for (const [id, data] of pendingImages) {
                await c.query('insert into tatami_kv (key, value) values ($1, $2) on conflict (key) do update set value = excluded.value', [`img:${id}`, JSON.stringify({ data })]);
              }
              for (const b of pendingBackups) {
                await c.query('insert into tatami_kv (key, value) values ($1, $2) on conflict (key) do update set value = excluded.value', [b.key, JSON.stringify(b.value)]);
                // keep the three newest backups
                await c.query("delete from tatami_kv where key like 'backup:%' and key not in (select key from tatami_kv where key like 'backup:%' order by key desc limit 3)");
              }
              await c.query('commit');
            } else if (writes) {
              await c.query('commit');
            }
          };
          persist()
            .then(() => {
              originalEnd(...args);
              finish();
            })
            .catch((err) => {
              console.error('[store] Failed to save to the database:', err);
              c.query('rollback').catch(() => {});
              if (!res.headersSent) {
                res.statusCode = 503;
                res.setHeader('Content-Type', 'application/json; charset=utf-8');
                originalEnd(JSON.stringify({ error: 'Не удалось сохранить данные. Повторите действие.' }));
              } else {
                originalEnd(...args);
              }
              finish(err);
            });
          return res;
        };
        next();
      } catch (err) {
        console.error('[store] Database is not available:', err);
        if (client) await client.query('rollback').catch(() => {});
        finish(err);
        if (!res.headersSent) res.status(503).json({ error: 'База данных недоступна. Попробуйте через минуту.' });
      }
    });
  };
}

/** Replaces all data with a backup (keeps the current administrator signed in). */
export function restoreFromBackup(raw: any, keepAdmin?: StoredUserAccount, keepSessionToken?: string) {
  const next = normalize(raw);
  const session = keepSessionToken ? db.sessions[keepSessionToken] : undefined;
  const previousVersions = Object.fromEntries(Object.entries(db.state).map(([k, v]) => [k, v?.version ?? 0]));
  for (const k of DB_KEYS) (db as any)[k] = (next as any)[k];
  // Newer versions than before, so every open screen reloads the restored data
  for (const [k, v] of Object.entries(db.state)) {
    if (v) v.version = Math.max(v.version ?? 0, previousVersions[k] ?? 0) + 1;
  }
  if (keepAdmin && !db.accounts.some((a) => a.id === keepAdmin.id)) db.accounts.push(keepAdmin);
  if (keepSessionToken && session) db.sessions[keepSessionToken] = session;
  saveDb();
}

export const sessionTokenOf = (req: Request) => parseCookies(req)[SESSION_COOKIE];
