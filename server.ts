import express, { Request, Response } from 'express';
import dotenv from 'dotenv';
import Anthropic from '@anthropic-ai/sdk';
import crypto from 'crypto';
import os from 'os';
import path from 'path';

import {
  db,
  saveDb,
  hashPassword,
  verifyPassword,
  findAccountByEmail,
  findAccountById,
  addAccount,
  publicUser,
  ensureAdminAccount,
  createSession,
  destroySession,
  getSessionUser,
  isAdminRequest,
  saveImage,
  readImage,
  rateLimiter,
  writeBackup,
  saveDbNow,
  USE_DATABASE,
  REALTIME,
  databaseMiddleware,
  stateVersion,
  restoreFromBackup,
  sessionTokenOf,
  type StoredUserAccount
} from './server/store';

dotenv.config();

const app = express();
const PORT = Number(process.env.PORT) || 3000;
// `npm start` passes --production (works on Windows too); NODE_ENV=production also works
const IS_PRODUCTION = process.env.NODE_ENV === 'production' || process.argv.includes('--production');
if (IS_PRODUCTION) process.env.NODE_ENV = 'production';
// AI assistant «Сенсей»: Claude. Shown on the site only when ANTHROPIC_API_KEY is set.
const CLAUDE_MODEL = process.env.CLAUDE_MODEL || 'claude-opus-5-5';

app.disable('x-powered-by');
// Basic security headers
app.use((req, res, next) => {
  res.setHeader('X-Content-Type-Options', 'nosniff');
  res.setHeader('X-Frame-Options', 'SAMEORIGIN');
  res.setHeader('Referrer-Policy', 'strict-origin-when-cross-origin');
  res.setHeader('Permissions-Policy', 'camera=(), microphone=(), geolocation=()');
  if (req.secure || req.get('x-forwarded-proto') === 'https') res.setHeader('Strict-Transport-Security', 'max-age=15552000');
  next();
});
app.set('trust proxy', 1);
app.use(express.json({ limit: '10mb' }));

// Vercel + Postgres: screens poll often, so answer "nothing changed" without loading all data
app.get('/api/state/:key', async (req: Request, res: Response, next) => {
  const since = Number(req.query.since);
  if (!USE_DATABASE || !Number.isFinite(since)) return next();
  try {
    const version = await stateVersion(req.params.key);
    if (version === since) {
      res.json({ key: req.params.key, version, changed: false });
      return;
    }
  } catch {
    /* fall through to the full handler */
  }
  next();
});

// Database mode: load data for each request, save changes before answering.
// The first administrator is created from ADMIN_EMAIL / ADMIN_PASSWORD.
app.use(databaseMiddleware(() => ensureAdminAccount(true)));

import { DEMO_EVENTS } from './src/data/eventsData';
import { SAMPLE_BOUTS, SAMPLE_PARTICIPANTS } from './src/data/sampleTournamentData';

const hasAiKey = () => !!process.env.ANTHROPIC_API_KEY?.trim();

// Health Check API
app.get('/api/health', (_req: Request, res: Response) => {
  res.json({
    status: 'ok',
    service: 'Apsatarov Server',
    aiEnabled: hasAiKey(),
    timestamp: new Date().toISOString(),
    serverTime: Date.now(),
    realtime: REALTIME,
    database: USE_DATABASE ? 'postgres' : process.env.VERCEL ? 'missing' : 'file',
    // whether ADMIN_EMAIL / ADMIN_PASSWORD are set (values are never shown)
    adminConfigured: !!(process.env.ADMIN_EMAIL && process.env.ADMIN_PASSWORD)
  });
});


// ========================================================
// EVENTS BACKEND API (SYNCHRONIZED REGISTRY + RBAC)
// ========================================================
// Demo tournaments only in development; a production install starts empty.
function eventsList(): any[] {
  if (!db.events) db.events = IS_PRODUCTION || USE_DATABASE ? [] : JSON.parse(JSON.stringify(DEMO_EVENTS));
  return db.events!;
}
const persistEvents = () => saveDb();

const isEventDatePast = (endDateStr?: string): boolean => {
  if (!endDateStr) return false;
  const cleanDate = String(endDateStr).trim().slice(0, 10);
  if (!/^\d{4}-\d{2}-\d{2}$/.test(cleanDate)) return false;
  const todayStr = new Date().toISOString().slice(0, 10);
  return cleanDate < todayStr;
};

// Admin rights come only from the server-side session, never from client headers/body.
const isRequestAuthorizedAdmin = (req: Request): boolean => isAdminRequest(req);

app.get('/api/events', (_req: Request, res: Response) => {
  // Automatically transition concluded events to 'completed' (Archive) instead of deleting them
  let changed = false;
  db.events = eventsList().map((ev) => {
    if (isEventDatePast(ev.endDate) && ev.status !== 'completed') {
      changed = true;
      return { ...ev, status: 'completed', isArchived: true };
    }
    return ev;
  });
  if (changed) persistEvents();

  res.json({
    total: eventsList().length,
    events: eventsList()
  });
});

// Uploaded event images (JPG / WebP, max 2 MB) are stored on disk in DATA_DIR/uploads
const MAX_EVENT_IMAGE_SIZE_BYTES = 2 * 1024 * 1024; // 2 MB limit
const ALLOWED_EVENT_IMAGE_MIMES = new Set(['image/jpeg', 'image/webp']);
const ALLOWED_EVENT_IMAGE_EXTS = /\.(jpe?g|webp)$/i;

app.post('/api/upload/event-image', (req: Request, res: Response) => {
  try {
    if (!isRequestAuthorizedAdmin(req)) {
      res.status(403).json({
        error: 'Доступ запрещён (RBAC): загрузка и изменение изображений турниров доступны только Администратору.'
      });
      return;
    }

    const { fileName, mimeType, sizeBytes, dataUrl } = req.body || {};

    if (!dataUrl || typeof dataUrl !== 'string') {
      res.status(400).json({ error: 'Файл изображения не передан' });
      return;
    }

    // Validate extension & MIME type strictly for JPG or WebP
    const normalizedMime = String(mimeType || '').toLowerCase().trim();
    const matchesDataUrl = dataUrl.match(/^data:(image\/(?:jpeg|jpg|webp));base64,(.+)$/i);

    if (!matchesDataUrl || (!ALLOWED_EVENT_IMAGE_MIMES.has(normalizedMime) && normalizedMime !== 'image/jpg')) {
      res.status(400).json({
        error: 'Недопустимый формат файла. Разрешены только изображения JPG (.jpg, .jpeg) или WebP (.webp).'
      });
      return;
    }

    if (fileName && !ALLOWED_EVENT_IMAGE_EXTS.test(String(fileName))) {
      res.status(400).json({
        error: 'Недопустимое расширение файла. Загрузите изображение в формате .jpg, .jpeg или .webp.'
      });
      return;
    }

    const base64Data = matchesDataUrl[2];
    const buffer = Buffer.from(base64Data, 'base64');
    const actualBytes = buffer.byteLength;

    if (actualBytes > MAX_EVENT_IMAGE_SIZE_BYTES || (typeof sizeBytes === 'number' && sizeBytes > MAX_EVENT_IMAGE_SIZE_BYTES)) {
      res.status(400).json({
        error: `Размер файла (${(actualBytes / (1024 * 1024)).toFixed(2)} МБ) превышает максимальный лимит 2 МБ.`
      });
      return;
    }

    const ext = normalizedMime.includes('webp') ? 'webp' : 'jpg';
    const imageId = `event_img_${Date.now()}_${Math.random().toString(36).slice(2, 7)}.${ext}`;
    const storedMime = ext === 'webp' ? 'image/webp' : 'image/jpeg';

    saveImage(imageId, buffer, {
      mimeType: storedMime,
      fileName: String(fileName || imageId).slice(0, 200),
      sizeBytes: actualBytes,
      uploadedAt: new Date().toISOString()
    });

    const imageUrl = `/api/uploads/${imageId}`;
    res.status(201).json({
      success: true,
      imageUrl,
      fileName: fileName || imageId,
      mimeType: storedMime,
      sizeBytes: actualBytes
    });
  } catch (err: any) {
    res.status(500).json({ error: err?.message || 'Ошибка при загрузке изображения события' });
  }
});

app.get('/api/uploads/:filename', async (req: Request, res: Response) => {
  const item = await readImage(req.params.filename);
  if (!item) {
    res.status(404).json({ error: 'Изображение не найдено' });
    return;
  }
  res.setHeader('Content-Type', item.meta.mimeType);
  res.setHeader('X-Content-Type-Options', 'nosniff');
  res.setHeader('Cache-Control', 'public, max-age=86400');
  res.send(item.buffer);
});

app.post('/api/events', (req: Request, res: Response) => {
  if (!isRequestAuthorizedAdmin(req)) {
    res.status(403).json({
      error: 'Доступ запрещён (RBAC): создание турниров доступно только Администратору.'
    });
    return;
  }

  const newEvent = req.body;
  if (!newEvent || !newEvent.title) {
    res.status(400).json({ error: 'Поле title обязательно' });
    return;
  }

  const id = newEvent.id || `event_${Date.now()}`;
  const imageUrl = newEvent.imageUrl || newEvent.image_url || undefined;
  const expired = isEventDatePast(newEvent.endDate);
  const preparedEvent = {
    ...newEvent,
    id,
    status: expired ? 'completed' : (newEvent.status || 'registration_open'),
    isArchived: expired || newEvent.status === 'completed',
    imageUrl,
    image_url: imageUrl || null,
    emblemType: newEvent.emblemType || 'pcl',
    locationLabel: newEvent.locationLabel || (newEvent.city ? `${newEvent.country || ''}, ${newEvent.city}` : ''),
    dateLabel: newEvent.dateLabel || `${newEvent.startDate || ''} - ${newEvent.endDate || ''}`,
    availableActions: newEvent.availableActions || ['info', 'categories_prices', 'brackets', 'results', 'medals', 'live_scoring'],
    athleteCount: newEvent.athleteCount || 0,
    clubCount: newEvent.clubCount || 0
  };

  db.events = [preparedEvent, ...eventsList().filter((e) => e.id !== id)];
  persistEvents();
  res.status(201).json({ success: true, event: preparedEvent });
});

app.put('/api/events/:id', (req: Request, res: Response) => {
  if (!isRequestAuthorizedAdmin(req)) {
    res.status(403).json({
      error: 'Доступ запрещён (RBAC): редактирование турниров доступно только Администратору.'
    });
    return;
  }

  const { id } = req.params;
  const updateData = req.body;
  const index = eventsList().findIndex((e) => e.id === id);

  if (index === -1) {
    res.status(404).json({ error: 'Турнир не найден' });
    return;
  }

  const existing = eventsList()[index];
  const resolvedImageUrl =
    updateData.imageUrl !== undefined
      ? updateData.imageUrl
      : updateData.image_url !== undefined
      ? updateData.image_url
      : existing.imageUrl;
  const effectiveEndDate = updateData.endDate || existing.endDate;
  const expired = isEventDatePast(effectiveEndDate);
  const updatedEvent = {
    ...existing,
    ...updateData,
    id,
    status: expired ? 'completed' : (updateData.status || existing.status),
    isArchived: expired || (updateData.status || existing.status) === 'completed',
    imageUrl: resolvedImageUrl,
    image_url: resolvedImageUrl || null,
    locationLabel: updateData.locationLabel || (updateData.city ? `${updateData.country || existing.country}, ${updateData.city}` : existing.locationLabel),
    dateLabel: updateData.dateLabel || (updateData.startDate ? `${updateData.startDate} - ${updateData.endDate || updateData.startDate}` : existing.dateLabel)
  };

  eventsList()[index] = updatedEvent;
  persistEvents();
  res.json({ success: true, event: updatedEvent });
});

app.delete('/api/events/:id', (req: Request, res: Response) => {
  if (!isRequestAuthorizedAdmin(req)) {
    res.status(403).json({
      error: 'Доступ запрещён (RBAC): удаление турниров доступно только Администратору.'
    });
    return;
  }

  const { id } = req.params;
  const initialLength = eventsList().length;
  db.events = eventsList().filter((e) => e.id !== id);

  if (eventsList().length === initialLength) {
    res.status(404).json({ error: 'Турнир не найден' });
    return;
  }

  persistEvents();
  res.json({ success: true, deletedId: id });
});

app.get('/api/events/:id', (req: Request, res: Response) => {
  const event = eventsList().find((e) => e.id === req.params.id);
  if (!event) {
    res.status(404).json({ error: 'Event not found' });
    return;
  }
  res.json(event);
});


// ========================================================
// REAL OAUTH 2.0 (GOOGLE & FACEBOOK) & AUTHENTICATION API
// ========================================================

// Roles a person may pick for themselves at sign-up. Referee/medical/admin roles
// are assigned by an administrator, never self-selected.
const SELF_SERVICE_ROLES = new Set(['athlete', 'club_coach']);

// Development-only demo accounts (never created in production).
function seedDevDemoAccounts() {
  if (IS_PRODUCTION || db.launchedAt) return;
  const demo = [
    { email: 'coach.smr@samurai.club', password: 'Coach2026!', fullName: 'Асанов Бакыт Таалайбекович', role: 'club_coach', clubName: 'СК "Тигр"' },
    { email: 'chief.referee@karate-fed.ru', password: 'Pass2026!', fullName: 'Эсенбаев Адилет Геннадьевич', role: 'chief_referee', licenseCode: 'INT-REF-0104' }
  ];
  for (const d of demo) {
    if (findAccountByEmail(d.email)) continue;
    addAccount({
      id: `usr-${crypto.randomUUID()}`,
      email: d.email,
      passwordHash: hashPassword(d.password),
      fullName: d.fullName,
      role: d.role,
      clubName: (d as any).clubName,
      licenseCode: (d as any).licenseCode,
      provider: 'credentials',
      isVerified: true,
      confirmedAt: new Date().toISOString(),
      createdAt: new Date().toISOString()
    });
  }
}

// Helper to determine clean origin and redirectUri
function getRedirectUri(req: Request): string {
  const host = req.get('host') || 'localhost:3000';
  const protocol = req.protocol === 'https' || req.get('x-forwarded-proto') === 'https' ? 'https' : 'http';
  return `${protocol}://${host}/auth/callback`;
}

// 1. Google OAuth Authorize URL Generator
app.get('/api/auth/google/url', (req: Request, res: Response) => {
  const redirectUri = getRedirectUri(req);
  const clientId = process.env.GOOGLE_CLIENT_ID;
  if (!clientId) {
    res.status(501).json({ error: 'Вход через Google не настроен на этом сервере.' });
    return;
  }

  const params = new URLSearchParams({
    client_id: clientId,
    redirect_uri: redirectUri,
    response_type: 'code',
    scope: 'openid email profile',
    state: 'google',
    prompt: 'select_account consent',
    access_type: 'offline'
  });

  const authUrl = `https://accounts.google.com/o/oauth2/v2/auth?${params.toString()}`;
  res.json({
    url: authUrl,
    redirectUri,
    provider: 'Google',
    hasRealCredentials: !!process.env.GOOGLE_CLIENT_ID
  });
});

// 2. Facebook OAuth Authorize URL Generator
app.get('/api/auth/facebook/url', (req: Request, res: Response) => {
  const redirectUri = getRedirectUri(req);
  const appId = process.env.FACEBOOK_APP_ID;
  if (!appId) {
    res.status(501).json({ error: 'Вход через Facebook не настроен на этом сервере.' });
    return;
  }

  const params = new URLSearchParams({
    client_id: appId,
    redirect_uri: redirectUri,
    response_type: 'code',
    scope: 'email,public_profile',
    state: 'facebook'
  });

  const authUrl = `https://www.facebook.com/v18.0/dialog/oauth?${params.toString()}`;
  res.json({
    url: authUrl,
    redirectUri,
    provider: 'Facebook',
    hasRealCredentials: !!process.env.FACEBOOK_APP_ID
  });
});

// 3. OAuth Callback Handler matching OAuth Skill (iframe & popup postMessage)
app.get(['/auth/callback', '/auth/callback/'], (req: Request, res: Response) => {
  // Values are JSON-encoded (and '<' escaped) before being placed in the inline script to prevent XSS.
  const safeJs = (v: unknown) => JSON.stringify(String(v ?? '')).replace(/</g, '\\u003c');
  const code = safeJs(req.query.code || '');
  const provider = safeJs(req.query.state || 'oauth');

  res.send(`
    <!DOCTYPE html>
    <html lang="ru">
      <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Apsatarov Authentication Callback</title>
        <style>
          body {
            font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
            display: flex;
            align-items: center;
            justify-content: center;
            height: 100vh;
            margin: 0;
            background: #090d16;
            color: #f1f5f9;
          }
          .box {
            background: #131c2e;
            border: 1px solid #1e293b;
            border-radius: 20px;
            padding: 36px 32px;
            max-width: 380px;
            text-align: center;
            box-shadow: 0 25px 50px -12px rgba(0, 0, 0, 0.7);
          }
          .icon {
            font-size: 36px;
            margin-bottom: 12px;
          }
          .title {
            font-size: 16px;
            font-weight: 700;
            margin: 0 0 6px 0;
            color: #ffffff;
          }
          .subtitle {
            font-size: 12px;
            color: #94a3b8;
            margin: 0;
            line-height: 1.5;
          }
        </style>
      </head>
      <body>
        <div class="box">
          <div class="icon">✓</div>
          <h2 class="title">Авторизация подтверждена</h2>
          <p class="subtitle">Передача профиля в систему Apsatarov. Окно закроется автоматически...</p>
        </div>
        <script>
          try {
            if (window.opener) {
              window.opener.postMessage({
                type: 'OAUTH_AUTH_SUCCESS',
                provider: ${provider},
                code: ${code},
                timestamp: Date.now()
              }, window.location.origin);
              setTimeout(function() {
                window.close();
              }, 600);
            } else {
              window.location.href = '/';
            }
          } catch(err) {
            console.error('Popup postMessage error:', err);
          }
        </script>
      </body>
    </html>
  `);
});

const authLimiter = rateLimiter(20, 60_000);

// 4. Credentials login: verifies the password and opens a cookie session.
app.post('/api/auth/login', authLimiter, (req: Request, res: Response) => {
  const { email, password } = req.body || {};

  if (!email || typeof email !== 'string') {
    res.status(400).json({ error: 'Пожалуйста, введите ваш email для входа.' });
    return;
  }
  if (!password || typeof password !== 'string') {
    res.status(400).json({ error: 'Требуется ввод пароля. Пустой пароль недопустим.' });
    return;
  }

  const user = findAccountByEmail(email);
  if (!user || !verifyPassword(password, user.passwordHash)) {
    res.status(401).json({ error: 'Неверный email или пароль. Если у вас нет аккаунта — зарегистрируйтесь.' });
    return;
  }

  createSession(req, res, user.id);
  res.json({ success: true, requiresProfileConfirmation: true, user: publicUser(user) });
});

// 5. Registration (self-service roles only) — also opens a session.
app.post('/api/auth/register', authLimiter, (req: Request, res: Response) => {
  const { fullName, email, phone, password, role, inviteToken, clubName, alsoCompetes } = req.body || {};

  // An invite link fixes the role (e.g. referee). Without one, only self-service roles are possible.
  let invite: ReturnType<typeof findValidInvite> = null;
  if (inviteToken) {
    invite = findValidInvite(String(inviteToken));
    if (!invite) {
      res.status(400).json({ error: 'Ссылка-приглашение недействительна или истекла. Попросите администратора новую.' });
      return;
    }
  }

  if (!fullName || typeof fullName !== 'string' || !fullName.trim()) {
    res.status(400).json({ error: 'Пожалуйста, укажите ваши имя и фамилию.' });
    return;
  }
  if (!email || typeof email !== 'string' || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim())) {
    res.status(400).json({ error: 'Пожалуйста, укажите корректный e-mail.' });
    return;
  }
  if (!password || typeof password !== 'string' || password.length < 8) {
    res.status(400).json({ error: 'Пароль должен состоять минимум из 8 символов.' });
    return;
  }
  if (findAccountByEmail(email)) {
    res.status(409).json({ error: 'Пользователь с таким email уже зарегистрирован. Пожалуйста, выполните вход.' });
    return;
  }

  const account: StoredUserAccount = {
    id: `usr-${crypto.randomUUID()}`,
    email: email.trim().toLowerCase(),
    passwordHash: hashPassword(password),
    fullName: fullName.trim().slice(0, 120),
    phone: phone ? String(phone).trim().slice(0, 40) : undefined,
    clubName: clubName ? String(clubName).trim().slice(0, 120) : undefined,
    role: invite ? invite.record.role : SELF_SERVICE_ROLES.has(role) ? role : 'athlete',
    provider: 'credentials',
    isVerified: true,
    confirmedAt: new Date().toISOString(),
    createdAt: new Date().toISOString()
  };
  account.alsoCompetes = account.role === 'club_coach' && alsoCompetes === true;
  addAccount(account);
  if (invite) {
    invite.record.uses += 1;
    saveDb();
  }
  createSession(req, res, account.id);

  res.json({ success: true, requiresProfileConfirmation: true, user: publicUser(account) });
});

// 6. Social login needs a real OAuth code exchange, which is not implemented yet.
app.post('/api/auth/social/verify', (_req: Request, res: Response) => {
  res.status(501).json({
    error: 'Вход через Google/Facebook пока не подключён. Используйте вход по email и паролю.'
  });
});

// 7. Profile confirmation — only for the signed-in user; the role cannot be changed here.
app.post('/api/auth/confirm-profile', (req: Request, res: Response) => {
  const sessionUser = getSessionUser(req);
  const { userId } = req.body || {};

  if (!sessionUser || (userId && userId !== sessionUser.id)) {
    res.status(401).json({ error: 'Сессия не найдена. Пожалуйста, войдите снова.' });
    return;
  }

  sessionUser.isVerified = true;
  sessionUser.confirmedAt = new Date().toISOString();
  saveDb();

  res.json({ success: true, authenticated: true, user: publicUser(sessionUser) });
});

// 8. Session check (per browser, via HttpOnly cookie)
app.get('/api/auth/me', (req: Request, res: Response) => {
  const user = getSessionUser(req);
  if (!user) {
    res.json({ authenticated: false, user: null });
    return;
  }
  res.json({ authenticated: true, user: publicUser(user) });
});

// 8b. Update own profile (never the role)
app.put('/api/auth/profile', (req: Request, res: Response) => {
  const user = getSessionUser(req);
  if (!user) {
    res.status(401).json({ error: 'Войдите в аккаунт.' });
    return;
  }
  const { fullName, phone, clubName, alsoCompetes } = req.body || {};
  if (typeof fullName === 'string' && fullName.trim()) user.fullName = fullName.trim().slice(0, 120);
  if (typeof phone === 'string') user.phone = phone.trim().slice(0, 40) || undefined;
  if (typeof clubName === 'string') user.clubName = clubName.trim().slice(0, 120) || undefined;
  if (typeof alsoCompetes === 'boolean') user.alsoCompetes = user.role === 'club_coach' && alsoCompetes;
  saveDb();
  res.json({ success: true, user: publicUser(user) });
});

// 9. Logout
app.post('/api/auth/logout', (req: Request, res: Response) => {
  destroySession(req, res);
  res.json({ success: true, message: 'Сессия завершена' });
});

// ---------------- Invite links ----------------
// Staff roles are never self-selected: the admin creates a secret, expiring link for them.
const INVITE_ROLES = new Set(['tatami_referee', 'scorekeeper', 'chief_referee', 'medical_officer', 'club_coach']);

function findValidInvite(token: string) {
  const record = db.invites[token];
  if (!record) return null;
  if (record.expiresAt < Date.now() || record.uses >= record.maxUses) return null;
  return { token, record };
}

app.get('/api/invites/:token', (req: Request, res: Response) => {
  const invite = findValidInvite(req.params.token);
  if (!invite) {
    res.status(404).json({ valid: false, error: 'Ссылка-приглашение недействительна или истекла.' });
    return;
  }
  res.json({ valid: true, role: invite.record.role, expiresAt: invite.record.expiresAt });
});

app.get('/api/admin/invites', (req: Request, res: Response) => {
  if (!isRequestAuthorizedAdmin(req)) {
    res.status(403).json({ error: 'Доступно только Администратору.' });
    return;
  }
  const now = Date.now();
  const invites = Object.entries(db.invites)
    .map(([token, r]) => ({ token, ...r, active: r.expiresAt > now && r.uses < r.maxUses }))
    .sort((a, b) => b.createdAt.localeCompare(a.createdAt));
  res.json({ invites });
});

app.post('/api/admin/invites', (req: Request, res: Response) => {
  const admin = getSessionUser(req);
  if (!admin || admin.role !== 'admin') {
    res.status(403).json({ error: 'Доступно только Администратору.' });
    return;
  }
  const { role, note, days, maxUses } = req.body || {};
  if (!INVITE_ROLES.has(role)) {
    res.status(400).json({ error: 'Для этой роли приглашение создать нельзя.' });
    return;
  }
  const token = crypto.randomBytes(18).toString('base64url');
  const lifeDays = Math.min(Math.max(Number(days) || 7, 1), 60);
  db.invites[token] = {
    role,
    note: note ? String(note).slice(0, 120) : undefined,
    createdBy: admin.id,
    createdAt: new Date().toISOString(),
    expiresAt: Date.now() + lifeDays * 24 * 60 * 60 * 1000,
    maxUses: Math.min(Math.max(Number(maxUses) || 1, 1), 100),
    uses: 0
  };
  saveDb();
  res.status(201).json({ token, ...db.invites[token] });
});

app.delete('/api/admin/invites/:token', (req: Request, res: Response) => {
  if (!isRequestAuthorizedAdmin(req)) {
    res.status(403).json({ error: 'Доступно только Администратору.' });
    return;
  }
  delete db.invites[req.params.token];
  saveDb();
  res.json({ success: true });
});

// 10. Admin: list users and assign roles (referees, medical officers, etc.)
const ALL_ROLES = new Set(['admin', 'chief_referee', 'tatami_referee', 'scorekeeper', 'club_coach', 'athlete', 'medical_officer']);

// ========================================================
// BACKUP AND LAUNCH PREPARATION (admin only)
// ========================================================
app.get('/api/admin/backup', (req: Request, res: Response) => {
  if (!isRequestAuthorizedAdmin(req)) {
    res.status(403).json({ error: 'Доступно только Администратору.' });
    return;
  }
  const { sessions, ...data } = db; // active sign-ins are not part of a backup
  res.setHeader('Content-Type', 'application/json; charset=utf-8');
  res.setHeader('Content-Disposition', `attachment; filename="apsatarov-backup-${new Date().toISOString().slice(0, 10)}.json"`);
  res.send(JSON.stringify(data, null, 2));
});

const stateCount = (key: string) => (Array.isArray(db.state[key]?.value) ? (db.state[key]!.value as unknown[]).length : 0);

app.get('/api/admin/launch-status', (req: Request, res: Response) => {
  if (!isRequestAuthorizedAdmin(req)) {
    res.status(403).json({ error: 'Доступно только Администратору.' });
    return;
  }
  res.json({
    launchedAt: db.launchedAt || null,
    counts: {
      events: eventsList().length,
      participants: stateCount('participants'),
      bouts: stateCount('bouts'),
      categories: stateCount('categories'),
      protocols: stateCount('protocols'),
      accounts: db.accounts.filter((a) => a.role !== 'admin').length,
      invites: Object.keys(db.invites).length,
      deviceKeys: Object.keys(db.deviceKeys).length
    }
  });
});

const LAUNCH_PHRASE = 'ЗАПУСК';

/**
 * «Подготовка к запуску»: saves a full backup, then removes all tournaments, entries, bouts,
 * categories, protocols, invitations, tatami device keys and every account except administrators.
 * Demo data is never created again after this.
 */
app.post('/api/admin/launch-reset', (req: Request, res: Response) => {
  if (!isRequestAuthorizedAdmin(req)) {
    res.status(403).json({ error: 'Доступно только Администратору.' });
    return;
  }
  if (String(req.body?.confirm || '').trim().toUpperCase() !== LAUNCH_PHRASE) {
    res.status(400).json({ error: `Для подтверждения введите слово ${LAUNCH_PHRASE}.` });
    return;
  }
  let backupFile: string;
  try {
    saveDbNow();
    backupFile = writeBackup('before-launch');
  } catch (err) {
    console.error('[launch] backup failed:', err);
    res.status(500).json({ error: 'Не удалось сохранить резервную копию. Ничего не удалено.' });
    return;
  }

  const now = new Date().toISOString();
  const admin = getSessionUser(req);
  db.events = [];
  for (const key of Object.keys(SHARED_STATE_WRITERS)) {
    const version = (db.state[key]?.version ?? 0) + 1;
    db.state[key] = { version, value: [], updatedAt: now, updatedBy: admin?.id || 'launch' };
  }
  db.invites = {};
  db.deviceKeys = {};
  const adminIds = new Set(db.accounts.filter((a) => a.role === 'admin').map((a) => a.id));
  db.accounts = db.accounts.filter((a) => adminIds.has(a.id));
  for (const [sid, sess] of Object.entries(db.sessions)) {
    if (!adminIds.has((sess as any).userId)) delete db.sessions[sid];
  }
  db.launchedAt = now;
  saveDbNow();
  for (const key of Object.keys(SHARED_STATE_WRITERS)) broadcast({ type: 'state', key, version: db.state[key].version });
  broadcast({ type: 'events' });
  console.log(`[launch] Site prepared for launch. Backup: ${backupFile}`);
  res.json({ ok: true, launchedAt: now, backupFile: path.basename(backupFile) });
});

/** Restore all data from a backup file (e.g. move a tournament between the website and a laptop in the hall). */
app.post('/api/admin/restore', (req: Request, res: Response) => {
  if (!isRequestAuthorizedAdmin(req)) {
    res.status(403).json({ error: 'Доступно только Администратору.' });
    return;
  }
  const backup = req.body?.backup;
  if (!backup || typeof backup !== 'object' || !Array.isArray(backup.accounts) || typeof backup.state !== 'object') {
    res.status(400).json({ error: 'Это не резервная копия Apsatarov.' });
    return;
  }
  let saved: string;
  try {
    saveDbNow();
    saved = writeBackup('before-restore');
  } catch {
    res.status(500).json({ error: 'Не удалось сохранить текущие данные перед восстановлением. Ничего не изменено.' });
    return;
  }
  const admin = getSessionUser(req) || undefined;
  restoreFromBackup(backup, admin, sessionTokenOf(req));
  saveDbNow();
  for (const key of Object.keys(SHARED_STATE_WRITERS)) {
    if (db.state[key]) broadcast({ type: 'state', key, version: db.state[key].version });
  }
  res.json({
    ok: true,
    previousSavedAs: path.basename(saved),
    counts: { events: eventsList().length, participants: stateCount('participants'), bouts: stateCount('bouts'), accounts: db.accounts.length }
  });
});

app.get('/api/admin/users', (req: Request, res: Response) => {
  if (!isRequestAuthorizedAdmin(req)) {
    res.status(403).json({ error: 'Доступно только Администратору.' });
    return;
  }
  res.json({ users: db.accounts.map(publicUser) });
});

app.put('/api/admin/users/:id/role', (req: Request, res: Response) => {
  if (!isRequestAuthorizedAdmin(req)) {
    res.status(403).json({ error: 'Доступно только Администратору.' });
    return;
  }
  const { role } = req.body || {};
  const target = findAccountById(req.params.id);
  if (!target) {
    res.status(404).json({ error: 'Пользователь не найден.' });
    return;
  }
  if (!ALL_ROLES.has(role)) {
    res.status(400).json({ error: 'Недопустимая роль.' });
    return;
  }
  if (target.role === 'admin' && role !== 'admin' && db.accounts.filter((a) => a.role === 'admin').length <= 1) {
    res.status(400).json({ error: 'Нельзя снять роль с последнего администратора.' });
    return;
  }
  target.role = role;
  saveDb();
  res.json({ success: true, user: publicUser(target) });
});

// ========================================================
// SHARED TOURNAMENT DATA (participants, bouts, protocols)
// Stored on the server so it survives page reloads and is the same on every device.
// Each key has a version number; a write must name the version it was based on,
// so two devices cannot silently overwrite each other (409 = reload and retry).
// ========================================================
const SHARED_STATE_WRITERS: Record<string, Set<string>> = {
  // Athletes and coaches add entries through POST /api/entries, never by rewriting the list.
  participants: new Set(['admin', 'chief_referee', 'scorekeeper', 'medical_officer']),
  bouts: new Set(['admin', 'chief_referee', 'tatami_referee', 'scorekeeper']),
  protocols: new Set(['admin', 'chief_referee', 'tatami_referee', 'scorekeeper']),
  categories: new Set(['admin', 'chief_referee'])
};

const stateEnvelope = (key: string) => {
  const entry = db.state[key];
  return entry
    ? { key, version: entry.version, value: entry.value, updatedAt: entry.updatedAt }
    : { key, version: 0, value: null, updatedAt: null };
};

// Coaches may only add new participants; they cannot change or remove existing ones.
function isAppendOnlyChange(previous: unknown, next: unknown[]): boolean {
  if (!Array.isArray(previous)) return true;
  const nextById = new Map(next.map((item: any) => [item?.id, JSON.stringify(item)]));
  return previous.every((item: any) => nextById.get(item?.id) === JSON.stringify(item));
}

app.get('/api/state/:key', (req: Request, res: Response) => {
  const { key } = req.params;
  if (!SHARED_STATE_WRITERS[key]) {
    res.status(404).json({ error: 'Неизвестный раздел данных.' });
    return;
  }
  const since = Number(req.query.since);
  const current = db.state[key]?.version ?? 0;
  if (Number.isFinite(since) && since === current) {
    res.json({ key, version: current, changed: false });
    return;
  }
  const envelope = stateEnvelope(key);
  if (key === 'participants' && Array.isArray(envelope.value)) {
    envelope.value = visibleParticipants(envelope.value as any[], getSessionUser(req));
  }
  res.json({ ...envelope, changed: true });
});

// Personal data of athletes (many are children) is shown only to officials who need it.
// Everyone else sees what results need (name, club, country, category) plus their own entries in full.
const PERSONAL_DATA_ROLES = new Set(['admin', 'chief_referee', 'scorekeeper', 'medical_officer', 'tatami_referee']);
function visibleParticipants(list: any[], user: StoredUserAccount | null): any[] {
  if (user && PERSONAL_DATA_ROLES.has(user.role)) return list;
  return list.map((p) => {
    if (user && p?.createdBy === user.id) return p;
    const { birthDate, declaredWeightKg, actualWeightKg, licenseNumber, feePaymentStatus, feeAmountRub, eligibilityNote, isMedicalCleared, createdBy, ...rest } = p || {};
    return { ...rest, birthDate: '', declaredWeightKg: 0, actualWeightKg: null, licenseNumber: '', isMedicalCleared: false };
  });
}

app.put('/api/state/:key', (req: Request, res: Response) => {
  const { key } = req.params;
  const writers = SHARED_STATE_WRITERS[key];
  if (!writers) {
    res.status(404).json({ error: 'Неизвестный раздел данных.' });
    return;
  }
  const user = getSessionUser(req);
  if (!user) {
    res.status(401).json({ error: 'Войдите в аккаунт, чтобы изменения сохранялись на сервере.' });
    return;
  }
  if (!writers.has(user.role)) {
    res.status(403).json({ error: 'У вашей роли нет права изменять эти данные.' });
    return;
  }

  const { baseVersion, value } = req.body || {};
  if (!Array.isArray(value)) {
    res.status(400).json({ error: 'Ожидается список записей.' });
    return;
  }
  const current = db.state[key];
  const currentVersion = current?.version ?? 0;
  if (baseVersion !== currentVersion) {
    res.status(409).json({ error: 'Данные уже изменены с другого устройства.', ...stateEnvelope(key) });
    return;
  }
  if ((user.role === 'club_coach' || user.role === 'athlete') && !isAppendOnlyChange(current?.value, value)) {
    res.status(403).json({ error: 'Тренер или спортсмен может только добавлять заявки, но не менять чужие.' });
    return;
  }

  db.state[key] = {
    version: currentVersion + 1,
    value,
    updatedAt: new Date().toISOString(),
    updatedBy: user.id
  };
  saveDb();
  broadcast({ type: 'state', key, version: db.state[key].version });
  res.json(stateEnvelope(key));
});

// ========================================================
// ENTRIES (заявки): athletes, parents and coaches enter tournaments.
// Each entry is appended on its own, so many coaches can submit at once.
// ========================================================
const ENTRY_ROLES = new Set(['athlete', 'club_coach', 'admin', 'chief_referee', 'scorekeeper']);

const participantsList = (): any[] => (Array.isArray(db.state.participants?.value) ? (db.state.participants!.value as any[]) : []);

function saveParticipants(list: any[], userId: string) {
  const version = (db.state.participants?.version ?? 0) + 1;
  db.state.participants = { version, value: list, updatedAt: new Date().toISOString(), updatedBy: userId };
  saveDb();
  broadcast({ type: 'state', key: 'participants', version });
}

app.post('/api/entries', (req: Request, res: Response) => {
  const user = getSessionUser(req);
  if (!user) {
    res.status(401).json({ error: 'Войдите в аккаунт, чтобы подать заявку.' });
    return;
  }
  if (!ENTRY_ROLES.has(user.role)) {
    res.status(403).json({ error: 'Ваша роль не может подавать заявки.' });
    return;
  }
  const entries = req.body?.entries;
  if (!Array.isArray(entries) || entries.length === 0 || entries.length > 200) {
    res.status(400).json({ error: 'Нет заявок для отправки.' });
    return;
  }
  const categories: any[] = Array.isArray(db.state.categories?.value) ? (db.state.categories!.value as any[]) : [];
  const list = participantsList();
  const created: any[] = [];
  for (const e of entries) {
    const cat = categories.find((c) => c.id === e?.categoryId);
    if (!cat) {
      res.status(400).json({ error: 'Категория не найдена. Обновите страницу и выберите категорию заново.' });
      return;
    }
    if (cat.isClosed) {
      res.status(400).json({ error: 'Приём заявок в эту категорию закрыт.' });
      return;
    }
    const isTeam = cat.discipline === 'team_kata' || cat.discipline === 'team_kumite';
    const last = String(e.lastName || '').trim().slice(0, 80);
    const first = String(e.firstName || '').trim().slice(0, 80);
    if (!isTeam && (!last || !first || !/^\d{4}-\d{2}-\d{2}$/.test(String(e.birthDate || '')))) {
      res.status(400).json({ error: 'Укажите фамилию, имя и дату рождения спортсмена.' });
      return;
    }
    const duplicate = list.some(
      (p) =>
        p.tournamentId === cat.tournamentId &&
        p.categoryId === cat.id &&
        p.status !== 'withdrawn' &&
        (isTeam
          ? String(p.teamName || '').toLowerCase() === String(e.teamName || '').trim().toLowerCase()
          : String(p.lastName).toLowerCase() === last.toLowerCase() && String(p.firstName).toLowerCase() === first.toLowerCase() && p.birthDate === e.birthDate)
    );
    if (duplicate) {
      res.status(409).json({ error: `${isTeam ? e.teamName : `${last} ${first}`}: уже заявлен(а) в эту категорию.` });
      return;
    }
    created.push({
      id: `p-${crypto.randomUUID()}`,
      tournamentId: cat.tournamentId,
      categoryId: cat.id,
      clubId: String(e.clubName || '').trim().toLowerCase() || `solo-${user.id}`,
      clubName: String(e.clubName || '').trim().slice(0, 120),
      city: String(e.city || '').trim().slice(0, 80),
      country: String(e.country || '').trim().slice(0, 80),
      countryCode: /^[A-Z]{3}$/.test(String(e.countryCode || '')) ? String(e.countryCode) : undefined,
      lastNameLatin: isTeam ? undefined : String(e.lastNameLatin || '').trim().slice(0, 80) || undefined,
      firstNameLatin: isTeam ? undefined : String(e.firstNameLatin || '').trim().slice(0, 80) || undefined,
      firstName: isTeam ? String(e.teamName || '').trim().slice(0, 80) : first,
      lastName: isTeam ? '' : last,
      gender: ['male', 'female', 'mixed'].includes(e.gender) ? e.gender : cat.gender,
      birthDate: isTeam ? '' : String(e.birthDate),
      beltRank: String(e.beltRank || 'white_10kyu'),
      declaredWeightKg: Number(e.declaredWeightKg) || 0,
      actualWeightKg: null,
      isWeighedIn: false,
      isMedicalCleared: false,
      feePaymentStatus: cat.fee > 0 ? 'pending' : 'exempt',
      status: 'registered',
      licenseNumber: String(e.licenseNumber || '').trim().slice(0, 40),
      teamName: isTeam ? String(e.teamName || '').trim().slice(0, 80) : undefined,
      teamMembers: isTeam && Array.isArray(e.teamMembers) ? e.teamMembers.map((m: unknown) => String(m).trim().slice(0, 80)).filter(Boolean).slice(0, 8) : undefined,
      createdBy: user.id,
      createdAt: new Date().toISOString()
    });
  }
  saveParticipants([...list, ...created], user.id);
  res.status(201).json({ success: true, entries: created });
});

/** Withdraw an entry: its author (before the draw) or an official. */
app.post('/api/entries/:id/withdraw', (req: Request, res: Response) => {
  const user = getSessionUser(req);
  if (!user) {
    res.status(401).json({ error: 'Войдите в аккаунт.' });
    return;
  }
  const list = participantsList();
  const entry = list.find((p) => p.id === req.params.id);
  if (!entry) {
    res.status(404).json({ error: 'Заявка не найдена.' });
    return;
  }
  const official = ['admin', 'chief_referee', 'scorekeeper'].includes(user.role);
  if (!official && entry.createdBy !== user.id) {
    res.status(403).json({ error: 'Можно отозвать только свою заявку.' });
    return;
  }
  if (!official && entry.status !== 'registered') {
    res.status(400).json({ error: 'После взвешивания или жеребьёвки заявку отзывает только организатор.' });
    return;
  }
  saveParticipants(list.map((p) => (p.id === entry.id ? { ...p, status: 'withdrawn' } : p)), user.id);
  res.json({ success: true });
});

// ========================================================
// LIVE UPDATES (Server-Sent Events) + PER-BOUT SAVING + TATAMI DEVICE KEYS
// Every change is pushed at once to all open screens (scoreboards, spectator
// displays, warm-up area). Each bout is saved on its own, so several tatami
// can work at the same time without overwriting each other.
// ========================================================
const streamClients = new Set<Response>();

function broadcast(event: Record<string, unknown>) {
  const payload = `data: ${JSON.stringify(event)}\n\n`;
  for (const client of streamClients) {
    try {
      client.write(payload);
    } catch {
      streamClients.delete(client);
    }
  }
}

app.get('/api/stream', (req: Request, res: Response) => {
  if (!REALTIME) {
    res.status(204).end(); // screens poll instead (Vercel)
    return;
  }
  res.setHeader('Content-Type', 'text/event-stream');
  res.setHeader('Cache-Control', 'no-cache, no-transform');
  res.setHeader('Connection', 'keep-alive');
  res.setHeader('X-Accel-Buffering', 'no');
  res.flushHeaders?.();
  res.write(`data: ${JSON.stringify({ type: 'hello' })}\n\n`);
  streamClients.add(res);
  const ping = setInterval(() => res.write(': ping\n\n'), 25000);
  req.on('close', () => {
    clearInterval(ping);
    streamClients.delete(res);
  });
});

const BOUT_WRITERS = new Set(['admin', 'chief_referee', 'tatami_referee', 'scorekeeper']);

function deviceKeyFor(req: Request) {
  const key = String(req.headers['x-device-key'] || '');
  const record = key ? db.deviceKeys[key] : undefined;
  if (!record || record.expiresAt < Date.now()) return null;
  return record;
}

/**
 * Upserts bouts by id. Officials may change any bout; a tatami device key may only
 * change bouts of its tatami (plus the next-round / repechage bouts its result fills).
 * `replaceAll` (draw, reset) is for officials only.
 */
app.put('/api/bouts', (req: Request, res: Response) => {
  const user = getSessionUser(req);
  const device = deviceKeyFor(req);
  const official = !!user && BOUT_WRITERS.has(user.role);
  if (!official && !device) {
    res.status(user ? 403 : 401).json({ error: 'Нет права изменять бои. Войдите как судья/секретарь или откройте пульт по ссылке татами.' });
    return;
  }
  const { bouts, replaceAll } = req.body || {};
  if (!Array.isArray(bouts) || bouts.some((b: any) => !b || typeof b.id !== 'string')) {
    res.status(400).json({ error: 'Ожидается список боёв.' });
    return;
  }
  if (replaceAll && !official) {
    res.status(403).json({ error: 'Полная замена сетки доступна только судьям и организатору.' });
    return;
  }

  const current: any[] = Array.isArray(db.state.bouts?.value) ? (db.state.bouts!.value as any[]) : [];
  let next: any[];
  if (replaceAll) {
    next = bouts;
  } else {
    if (device) {
      // The device must be touching a bout of its own tatami; other changed bouts must be
      // in the same categories (winner moved to the next round, repechage).
      const own = bouts.filter((b: any) => Number(b.tatamiNumber) === device.tatamiNumber);
      const cats = new Set(own.map((b: any) => b.categoryId));
      if (own.length === 0 || bouts.some((b: any) => !cats.has(b.categoryId))) {
        res.status(403).json({ error: `Этот пульт управляет только татами №${device.tatamiNumber}.` });
        return;
      }
    }
    const byId = new Map(bouts.map((b: any) => [b.id, b]));
    next = current.map((b) => (byId.has(b.id) ? byId.get(b.id) : b));
    for (const b of bouts) if (!current.some((c) => c.id === b.id)) next.push(b);
  }

  const version = (db.state.bouts?.version ?? 0) + 1;
  db.state.bouts = { version, value: next, updatedAt: new Date().toISOString(), updatedBy: user?.id || `device:${device!.tatamiNumber}` };
  saveDb();
  broadcast({ type: 'state', key: 'bouts', version });
  res.json({ success: true, version });
});

/** Tells a device what it is allowed to do (used by the tablet console). */
app.get('/api/device', (req: Request, res: Response) => {
  const device = deviceKeyFor(req);
  if (!device) {
    res.status(401).json({ error: 'Ключ пульта недействителен или истёк. Попросите организатора новый QR-код.' });
    return;
  }
  res.json({ tatamiNumber: device.tatamiNumber, expiresAt: device.expiresAt });
});

app.get('/api/admin/device-keys', (req: Request, res: Response) => {
  if (!isRequestAuthorizedAdmin(req)) {
    res.status(403).json({ error: 'Доступно только Администратору.' });
    return;
  }
  const now = Date.now();
  res.json({
    keys: Object.entries(db.deviceKeys)
      .filter(([, k]) => k.expiresAt > now)
      .map(([key, k]) => ({ key, ...k }))
  });
});

app.post('/api/admin/device-keys', (req: Request, res: Response) => {
  const admin = getSessionUser(req);
  if (!admin || admin.role !== 'admin') {
    res.status(403).json({ error: 'Доступно только Администратору.' });
    return;
  }
  const tatamiNumber = Number(req.body?.tatamiNumber);
  if (!Number.isInteger(tatamiNumber) || tatamiNumber < 1 || tatamiNumber > 20) {
    res.status(400).json({ error: 'Неверный номер татами.' });
    return;
  }
  const hours = Math.min(Math.max(Number(req.body?.hours) || 24, 1), 24 * 7);
  // One active key per tatami: creating a new one revokes the old one.
  for (const [k, v] of Object.entries(db.deviceKeys)) if (v.tatamiNumber === tatamiNumber) delete db.deviceKeys[k];
  const key = crypto.randomBytes(16).toString('base64url');
  db.deviceKeys[key] = { tatamiNumber, createdBy: admin.id, createdAt: new Date().toISOString(), expiresAt: Date.now() + hours * 3600_000 };
  saveDb();
  res.status(201).json({ key, ...db.deviceKeys[key] });
});

app.delete('/api/admin/device-keys/:key', (req: Request, res: Response) => {
  if (!isRequestAuthorizedAdmin(req)) {
    res.status(403).json({ error: 'Доступно только Администратору.' });
    return;
  }
  delete db.deviceKeys[req.params.key];
  saveDb();
  res.json({ success: true });
});

/** LAN addresses of this computer, so phones and TVs in the hall can open the screens. */
app.get('/api/network', (req: Request, res: Response) => {
  if (!isRequestAuthorizedAdmin(req)) {
    res.status(403).json({ error: 'Доступно только Администратору.' });
    return;
  }
  const addresses: string[] = [];
  for (const list of Object.values(os.networkInterfaces())) {
    for (const ni of list || []) if (ni.family === 'IPv4' && !ni.internal) addresses.push(`http://${ni.address}:${PORT}`);
  }
  res.json({ addresses });
});

// Comprehensive Karate Domain Fallback Engine
function generateExpertFallbackResponse(prompt: string, context: Record<string, any>): string {
  const q = prompt.toLowerCase();
  const currentTourn = context.tournamentTitle || 'вашем турнире';
  const rules = context.rules || 'wkf';

  if (q.includes('senshu') || q.includes('сеншу') || q.includes('первый балл')) {
    return `### 🥋 Правило первого балла (Senshu) в WKF 2026

**Senshu (Сеншу)** — преимущество спортсмена, первым набравшего безответный балл в поединке.

1. **Принцип действия:**
   - Спортсмен, заработавший первый балл (**Yuko, Waza-ari или Ippon**), получает отметку *Senshu* на судейском табло.
   - При равном счете по окончании времени (например, 2:2 или 4:4), победителем объявляется обладатель *Senshu* без назначения *Hantei* (судейского решения).

2. **Аннулирование Senshu:**
   - Если оба спортсмена набирают баллы одновременно (взаимная атака / *Aiuchi*), *Senshu* не присуждается ни одному из них.
   - Если обладатель *Senshu* получает предупреждение Категории 2 (*Hansoku Chui* или *Jogai* в последние 15 секунд поединка), статус *Senshu* аннулируется, и при равенстве счета победитель определяется решением судейской бригады (*Hantei*).

*На Apsatarov* табло автоматически отмечает Senshu у спортсмена, первым набравшего балл; судья может снять его вручную в пульте.`;
  }

  if (q.includes('skif') || q.includes('shobu') || q.includes('сетокан') || q.includes('сётокан')) {
    return `### ⛩️ Сравнение регламентов WKF и SKIF (Shobu Ippon / Sanbon)

| Параметр | WKF (Спортивное каратэ) | SKIF (Традиционный Сётокан) |
|---|---|---|
| **Главный принцип** | Накопительная система баллов (до разницы 8 очков) | Концепция «Одного смертельного удара» (*Todome-waza*) |
| **Система счета** | Yuko (1), Waza-ari (2), Ippon (3) | Waza-ari (половина победы), Ippon (чистая победа) |
| **Финал поединка** | Окончание времени или разрыв в 8 баллов | 1 Ippon или 2 Waza-ari (в Shobu Sanbon — до 3 Ippon) |
| **Контакт** | Строгий контроль (Skin-touch в юниорах/взрослых, запрет в кадетах) | Максимальная фокусировка удара, глубокий контроль дистанции |
| **Судейская бригада** | Рефери на татами + 4 боковых судьи (флажки/джойстики) | 1 Рефери (Shushin) + 4 угловых судьи (Fukushin) с красным/белым флагами |

*На Apsatarov* правила WKF или SKIF выбираются в пульте боя до его начала.`;
  }

  if (q.includes('оценк') || q.includes('ippon') || q.includes('waza') || q.includes('yuko') || q.includes('баллы') || q.includes('иппон')) {
    return `### 📊 Система оценок в каратэ WKF (Версия 2026)

В соревновательном кумитэ WKF баллы присуждаются за технически чистые атаки с соблюдением 6 критериев (*Хорошая форма, Спортивный дух, Концентрация Zanshin, Правильное время, Корректная дистанция, Звуковой импульс*):

* **IPPON (3 очка)**:
  - Удары ногами в голову (*Jodan Geri*).
  - Любая результативная атака (рукой или ногой) по сопернику, сбитому с ног или упавшему в результате подсечки (*Ashi Barai*).
* **WAZA-ARI (2 очка)**:
  - Удары ногами в средний уровень (*Chudan Geri* - живот, бока, спина).
* **YUKO (1 очко)**:
  - Прямые и круговые удары кулаком (*Tsuki*) в уровень *Chudan* или *Jodan*.
  - Удары обратной стороной кулака (*Uraken*).

*Разница счета:* Поединок завершается досрочно при разнице в **8 баллов** (*Senshu / Kiken / досрочная победа*).`;
  }

  if (q.includes('жеребьевк') || q.includes('сетк') || q.includes('разведен') || q.includes('клуб') || q.includes('draw')) {
    return `### 🛡️ Алгоритм «Умной жеребьевки» Apsatarov

В систему встроен алгоритм сеяния участников по стандартам WKF:
1. **Разведение одноклубников**: спортсмены одного клуба разводятся по разным частям сетки, чтобы встретиться как можно позже.
2. **Географическое разведение**: на турнире по стране — по городам и областям, на международном — по странам.
3. **Утешительные поединки (Repechage)**: Все бойцы, проигравшие финалистам, получают второй шанс и борются за две бронзовые медали.
4. **Татами** для категории выбирает организатор при жеребьёвке.`;
  }

  if (q.includes('ката') || q.includes('kata')) {
    return `### 🥋 Правила судейства КАТА WKF 2026

Оценка Ката базируется на балльной электронной системе:
- **Техническое исполнение (70%)**: Стойки (*Dachi*), базовые техники (*Kihon*), переходы, ритм, баланс, правильное дыхание и концентрация силы (*Kime*).
- **Атлетическое исполнение (30%)**: Скорость, взрывная сила, атлетизм, прыгучесть и стабильность.
- **Официальный список WKF**: Включает 102 признанных ката четырех основных стилей (*Shotokan, Goju-Ryu, Shito-Ryu, Wado-Ryu*).
- При выставлении баллов крайние верхний и нижний результаты отбрасываются для исключения судейской предвзятости.`;
  }

  return `### 🥋 Сенсей

ИИ-ассистент сейчас не подключён, поэтому я отвечаю только готовыми справками. Спросите, например:
- «Что такое Senshu?»
- «Какие оценки в кумитэ (Yuko, Waza-ari, Ippon)?»
- «Чем отличаются WKF и SKIF?»
- «Как работает жеребьёвка?»
- «Как судят ката?»

Вопросы о заявках, взносах и расписании турнира задавайте организатору: его контакты указаны на странице турнира.${context.tournamentTitle ? `\n\n*Текущий турнир:* ${context.tournamentTitle}` : ''}`;
}

// AI chat endpoint (Claude)
const aiLimiter = rateLimiter(15, 60_000);

app.post('/api/chat', aiLimiter, async (req: Request, res: Response) => {
  try {
    const { message, history = [], context = {} } = req.body;
    if (!message || typeof message !== 'string') {
      res.status(400).json({ error: 'Поле message обязательно для отправки.' });
      return;
    }

    if (!hasAiKey()) {
      res.json({ reply: generateExpertFallbackResponse(message, context), source: 'sensei-knowledge-engine', status: 'ok' });
      return;
    }

    const system = `Ты — «Сенсей», ассистент сайта Apsatarov (турниры по каратэ в Кыргызстане).
Отвечай на языке вопроса (русский, кыргызский или английский), коротко и по делу, простым языком; Markdown можно.
Темы: правила WKF и SKIF (оценки Yuko/Waza-ari/Ippon, Senshu, предупреждения C1/C2, Хансоку, Кикен, Шиккаку, Хантей, судейство ката), подготовка к турниру и как пользоваться сайтом.
Сайт Apsatarov умеет: заявки («Подать заявку», тренер — сразу на всех учеников), «Мои заявки и оплата», категории и жеребьёвку с разведением одноклубников (организатор), пульт боя и табло по QR-коду, режим «Один экран» с клавишами, печать сеток, протоколов и дипломов в PDF, рейтинги и клубы по результатам. Онлайн-оплаты картой нет: взносы принимает организатор.
Не выдумывай функции сайта, цифры, даты и правила. Если не уверен — так и скажи и посоветуй уточнить у организатора или в действующем регламенте федерации.
Текущий турнир на экране пользователя: ${String(context.tournamentTitle || 'не выбран').slice(0, 200)}.`;

    // Conversation: the page sends {role: 'user' | 'model', text}; Claude needs user/assistant, starting with user
    const messages: Anthropic.MessageParam[] = [];
    if (Array.isArray(history)) {
      for (const item of history.slice(-12)) {
        const role = item?.role === 'user' ? 'user' : item?.role === 'model' || item?.role === 'assistant' ? 'assistant' : null;
        if (!role || typeof item.text !== 'string' || !item.text.trim()) continue;
        if (messages.length === 0 && role === 'assistant') continue;
        messages.push({ role, content: item.text.slice(0, 4000) });
      }
    }
    messages.push({ role: 'user', content: message.slice(0, 4000) });

    const client = new Anthropic({ timeout: 60_000, maxRetries: 1 });
    // Server-side fallback: if a request is declined by a safety classifier, another model answers
    const response = await client.beta.messages.create({
      model: CLAUDE_MODEL,
      max_tokens: 16000,
      system,
      messages: messages as Anthropic.Beta.BetaMessageParam[],
      output_config: { effort: 'low' },
      betas: ['server-side-fallback-2026-07-01'],
      fallbacks: 'default'
    });

    if (response.stop_reason === 'refusal') {
      res.json({ reply: 'Извините, на этот вопрос я ответить не могу. Спросите про правила каратэ или про работу сайта.', source: 'claude', status: 'ok' });
      return;
    }
    const reply = response.content
      .filter((b: any) => b.type === 'text')
      .map((b: any) => b.text)
      .join('\n')
      .trim();
    res.json({ reply: reply || generateExpertFallbackResponse(message, context), source: 'claude', status: 'ok' });
  } catch (error: any) {
    if (error instanceof Anthropic.RateLimitError) console.warn('[Sensei AI] rate limited');
    else if (error instanceof Anthropic.AuthenticationError) console.error('[Sensei AI] invalid ANTHROPIC_API_KEY');
    else if (error instanceof Anthropic.APIError) console.error(`[Sensei AI] API error ${error.status}:`, error.message);
    else console.error('[Sensei AI] error:', error?.message || error);
    res.json({
      reply: 'Ассистент сейчас недоступен. Попробуйте позже.',
      source: 'error',
      status: 'ok'
    });
  }
});


// Start Express Server with Vite Dev Server in Middleware Mode
async function startServer() {
  const isProduction = IS_PRODUCTION;
  if (!USE_DATABASE) ensureAdminAccount(isProduction);
  // Bouts are saved one by one, so the server must hold the full list from the start.
  // Demo data is used only until the site is prepared for launch.
  if (!USE_DATABASE && !db.state.bouts && !db.launchedAt && !isProduction) {
    db.state.bouts = { version: 1, value: JSON.parse(JSON.stringify(SAMPLE_BOUTS)), updatedAt: new Date().toISOString(), updatedBy: 'seed' };
    saveDb();
  }
  if (!USE_DATABASE && !db.state.participants && !db.launchedAt && !isProduction) {
    db.state.participants = { version: 1, value: JSON.parse(JSON.stringify(SAMPLE_PARTICIPANTS)), updatedAt: new Date().toISOString(), updatedBy: 'seed' };
    saveDb();
  }
  if (!USE_DATABASE) seedDevDemoAccounts();

  if (!isProduction) {
    const { createServer: createViteServer } = await import('vite');
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    app.use(express.static('dist'));
    app.get('*', (_req: Request, res: Response) => {
      res.sendFile('dist/index.html', { root: '.' });
    });
  }

  const server = app.listen(PORT, '0.0.0.0', () => {
    console.log(`[Server] ${isProduction ? 'Production' : 'Dev'} server listening on http://0.0.0.0:${PORT}`);
    console.log(`[Server] Откройте в браузере: http://localhost:${PORT}`);
  });
  server.on('error', (err: NodeJS.ErrnoException) => {
    if (err.code === 'EADDRINUSE') {
      console.error(`\n[Server] Порт ${PORT} уже занят — скорее всего, сайт уже запущен в другом окне терминала.`);
      console.error(`[Server] Откройте http://localhost:${PORT} или остановите другой сервер (Ctrl+C в его окне).\n`);
      process.exit(1);
    }
    throw err;
  });
}

// On Vercel the app runs as a function (api/index.ts); everywhere else it is a normal server.
if (!process.env.VERCEL) {
  startServer().catch((err) => {
    console.error('Failed to start server:', err);
    process.exit(1);
  });
}

export default app;
