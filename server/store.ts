// Persistent JSON storage, password hashing and cookie sessions for the Express server.
// Data survives restarts: everything is written to DATA_DIR (default ./data).
import fs from 'fs';
import path from 'path';
import crypto from 'crypto';
import type { Request, Response } from 'express';

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

interface DbShape {
  events: any[] | null;
  invites: Record<string, InviteRecord>;
  state: Record<string, SharedStateEntry>;
  accounts: StoredUserAccount[];
  sessions: Record<string, SessionRecord>;
  images: Record<string, ImageMeta>;
}

export const DATA_DIR = path.resolve(process.env.DATA_DIR || 'data');
export const UPLOADS_DIR = path.join(DATA_DIR, 'uploads');
const DB_FILE = path.join(DATA_DIR, 'db.json');

fs.mkdirSync(UPLOADS_DIR, { recursive: true });

function loadDb(): DbShape {
  try {
    const raw = JSON.parse(fs.readFileSync(DB_FILE, 'utf8'));
    return {
      events: Array.isArray(raw.events) ? raw.events : null,
      state: raw.state && typeof raw.state === 'object' ? raw.state : {},
      invites: raw.invites && typeof raw.invites === 'object' ? raw.invites : {},
      accounts: Array.isArray(raw.accounts) ? raw.accounts : [],
      sessions: raw.sessions && typeof raw.sessions === 'object' ? raw.sessions : {},
      images: raw.images && typeof raw.images === 'object' ? raw.images : {}
    };
  } catch {
    return { events: null, state: {}, invites: {}, accounts: [], sessions: {}, images: {} };
  }
}

export const db: DbShape = loadDb();

let saveTimer: NodeJS.Timeout | null = null;
function writeNow() {
  const tmp = `${DB_FILE}.tmp`;
  fs.writeFileSync(tmp, JSON.stringify(db, null, 2));
  fs.renameSync(tmp, DB_FILE);
}

/** Debounced atomic save of the whole database file. */
export function saveDb() {
  if (saveTimer) return;
  saveTimer = setTimeout(() => {
    saveTimer = null;
    try {
      writeNow();
    } catch (err) {
      console.error('[store] Failed to save database:', err);
    }
  }, 200);
}

process.on('exit', () => {
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
  fs.writeFileSync(path.join(UPLOADS_DIR, id), buffer);
  db.images[id] = meta;
  saveDb();
}

export function readImage(id: string): { meta: ImageMeta; buffer: Buffer } | null {
  const meta = db.images[id];
  if (!meta || !/^[\w.-]+$/.test(id)) return null;
  try {
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
