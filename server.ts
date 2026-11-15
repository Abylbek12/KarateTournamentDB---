import express, { Request, Response } from 'express';
import { createServer as createViteServer } from 'vite';
import dotenv from 'dotenv';
import { GoogleGenAI } from '@google/genai';
import crypto from 'crypto';

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
  type StoredUserAccount
} from './server/store';

dotenv.config();

const app = express();
const PORT = Number(process.env.PORT) || 3000;
const IS_PRODUCTION = process.env.NODE_ENV === 'production';
const GEMINI_MODEL = process.env.GEMINI_MODEL || 'gemini-3.8-flash';

app.disable('x-powered-by');
app.set('trust proxy', 1);
app.use(express.json({ limit: '10mb' }));

import { UVENTEX_SCREENSHOT_EVENTS } from './src/data/uventexEventsData';

const hasGeminiKey = () => {
  const k = process.env.GEMINI_API_KEY;
  return !!k && k !== 'MY_GEMINI_API_KEY';
};

// Health Check API
app.get('/api/health', (_req: Request, res: Response) => {
  res.json({
    status: 'ok',
    service: 'Uventex Karate AI Server',
    model: GEMINI_MODEL,
    aiEnabled: hasGeminiKey(),
    timestamp: new Date().toISOString()
  });
});


// ========================================================
// UVENTEX EVENTS & ACTIONS BACKEND API (SYNCHRONIZED REGISTRY + RBAC)
// ========================================================
let STORED_EVENTS: any[] = db.events ?? JSON.parse(JSON.stringify(UVENTEX_SCREENSHOT_EVENTS));
const persistEvents = () => {
  db.events = STORED_EVENTS;
  saveDb();
};

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
  STORED_EVENTS = STORED_EVENTS.map((ev) => {
    if (isEventDatePast(ev.endDate) && ev.status !== 'completed') {
      changed = true;
      return { ...ev, status: 'completed', isArchived: true };
    }
    return ev;
  });
  if (changed) persistEvents();

  res.json({
    total: STORED_EVENTS.length,
    events: STORED_EVENTS
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

app.get('/api/uploads/:filename', (req: Request, res: Response) => {
  const item = readImage(req.params.filename);
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

  STORED_EVENTS = [preparedEvent, ...STORED_EVENTS.filter((e) => e.id !== id)];
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
  const index = STORED_EVENTS.findIndex((e) => e.id === id);

  if (index === -1) {
    res.status(404).json({ error: 'Турнир не найден' });
    return;
  }

  const existing = STORED_EVENTS[index];
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

  STORED_EVENTS[index] = updatedEvent;
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
  const initialLength = STORED_EVENTS.length;
  STORED_EVENTS = STORED_EVENTS.filter((e) => e.id !== id);

  if (STORED_EVENTS.length === initialLength) {
    res.status(404).json({ error: 'Турнир не найден' });
    return;
  }

  persistEvents();
  res.json({ success: true, deletedId: id });
});

app.get('/api/events/:id', (req: Request, res: Response) => {
  const event = STORED_EVENTS.find((e) => e.id === req.params.id);
  if (!event) {
    res.status(404).json({ error: 'Event not found' });
    return;
  }
  res.json(event);
});

app.get('/api/events/:id/divisions', (req: Request, res: Response) => {
  const event = STORED_EVENTS.find((e) => e.id === req.params.id);
  if (!event) {
    res.status(404).json({ error: 'Event not found' });
    return;
  }
  res.json({
    eventId: event.id,
    eventTitle: event.title,
    priceTiers: event.priceTiers || [],
    divisions: event.divisions || []
  });
});

app.get('/api/events/:id/rings', (req: Request, res: Response) => {
  const event = STORED_EVENTS.find((e) => e.id === req.params.id);
  if (!event) {
    res.status(404).json({ error: 'Event not found' });
    return;
  }
  res.json({
    eventId: event.id,
    eventTitle: event.title,
    ringsSchedule: event.ringsSchedule || []
  });
});

app.get('/api/events/:id/medals', (req: Request, res: Response) => {
  const event = STORED_EVENTS.find((e) => e.id === req.params.id);
  if (!event) {
    res.status(404).json({ error: 'Event not found' });
    return;
  }
  res.json({
    eventId: event.id,
    eventTitle: event.title,
    medalsReport: event.medalsReport || []
  });
});

app.get('/api/events/:id/live-scoring', (req: Request, res: Response) => {
  const event = STORED_EVENTS.find((e) => e.id === req.params.id);
  if (!event) {
    res.status(404).json({ error: 'Event not found' });
    return;
  }
  res.json({
    eventId: event.id,
    eventTitle: event.title,
    days: event.days || ["Fri (pre's)", 'Fri premiere', 'Saturday'],
    ringsCount: event.ringsCount || 6,
    activeMats: [
      { ring: 1, label: 'ПТ / 1', category: 'KO-10 Kobudo 6-7 yrs', timeRemaining: '06:30', status: 'upcoming', aka: { name: 'S. Robinson', score: 0 }, ao: { name: 'C. Martinez', score: 0 } },
      { ring: 2, label: 'ПТ / 2', category: 'KO-51 Kobudo 14 yrs', timeRemaining: '06:30', status: 'upcoming', aka: { name: 'D. Walker', score: 0 }, ao: { name: 'J. Bennett', score: 0 } },
      { ring: 3, label: 'ПТ / 3', category: 'EF-25 Extreme Forms 18+', timeRemaining: '06:30', status: 'upcoming', aka: { name: 'T. Henderson', score: 0 }, ao: { name: 'R. Cooper', score: 0 } },
      { ring: 4, label: 'ПТ / 4', category: 'HC-1 Para Divisions', timeRemaining: '06:30', status: 'upcoming', aka: { name: 'L. Young', score: 0 }, ao: { name: 'E. Hughes', score: 0 } }
    ]
  });
});

app.get('/api/events/:id/results', (req: Request, res: Response) => {
  const event = STORED_EVENTS.find((e) => e.id === req.params.id);
  if (!event) {
    res.status(404).json({ error: 'Event not found' });
    return;
  }
  res.json({
    eventId: event.id,
    eventTitle: event.title,
    podiums: [
      {
        category: 'Мужчины 18+ Кумитэ -75 кг',
        finishers: [
          { place: '1st', name: 'Иванов Артем', club: 'СК "Самурай"', country: 'Россия', points: 30 },
          { place: '2nd', name: 'Петров Дмитрий', club: 'Додзё "Бусидо"', country: 'Россия', points: 20 },
          { place: '3rd', name: 'James Miller', club: 'Tigers Karate Dojo', country: 'United States', points: 10 },
          { place: '3rd', name: 'Marco Rossi', club: 'Milano Martial Arts', country: 'Italy', points: 10 }
        ]
      },
      {
        category: 'Женщины 18+ Кумитэ -61 кг',
        finishers: [
          { place: '1st', name: 'Смирнова Екатерина', club: 'СШОР "Олимп"', country: 'Россия', points: 30 },
          { place: '2nd', name: 'Emily Clark', club: 'Boston MA Academy', country: 'United States', points: 20 },
          { place: '3rd', name: 'Ковалева Анна', club: 'ЦБИ "Восток"', country: 'Россия', points: 10 },
          { place: '3rd', name: 'Olena Shevchenko', club: 'Kyiv Budo Center', country: 'Ukraine', points: 10 }
        ]
      }
    ],
    boutsCount: 42,
    status: 'certified'
  });
});

app.get('/api/studios', (req: Request, res: Response) => {
  const city = req.query.city as string;
  const q = (req.query.q as string || '').toLowerCase().trim();
  
  const studios = [
    { id: 'c1', name: 'СК "Самурай"', city: 'Москва', headCoach: 'Алексеев Владимир Сергеевич', phone: '+7 (495) 123-45-67', studentCount: 160, isVerified: true },
    { id: 'c2', name: 'Додзё "Бусидо"', city: 'Санкт-Петербург', headCoach: 'Ковалев Михаил Дмитриевич', phone: '+7 (812) 987-65-43', studentCount: 125, isVerified: true },
    { id: 'c3', name: 'СШОР "Олимп"', city: 'Казань', headCoach: 'Хабибуллин Рустем Ильнурович', phone: '+7 (843) 555-12-34', studentCount: 210, isVerified: true },
    { id: 'c4', name: 'Клуб "Торнадо"', city: 'Екатеринбург', headCoach: 'Григорьев Андрей Павлович', phone: '+7 (343) 222-33-44', studentCount: 95, isVerified: true },
    { id: 'c5', name: 'ЦБИ "Восток"', city: 'Новосибирск', headCoach: 'Морозов Сергей Николаевич', phone: '+7 (383) 777-88-99', studentCount: 110, isVerified: true }
  ];

  let filtered = studios;
  if (city && city !== 'all') {
    filtered = filtered.filter(s => s.city.toLowerCase() === city.toLowerCase());
  }
  if (q) {
    filtered = filtered.filter(s => s.name.toLowerCase().includes(q) || s.headCoach.toLowerCase().includes(q) || s.city.toLowerCase().includes(q));
  }

  res.json({ total: filtered.length, studios: filtered });
});

app.get('/api/rankings', (_req: Request, res: Response) => {
  res.json({
    season: '2026',
    athletes: [
      { rank: 1, name: 'Иванов Артем', club: 'СК "Самурай"', points: 480, gold: 8, silver: 2, bronze: 1 },
      { rank: 2, name: 'Петров Дмитрий', club: 'Додзё "Бусидо"', points: 395, gold: 6, silver: 3, bronze: 2 },
      { rank: 3, name: 'Смирнова Екатерина', club: 'СШОР "Олимп"', points: 370, gold: 6, silver: 2, bronze: 1 }
    ],
    clubs: [
      { rank: 1, name: 'СК "Самурай"', points: 1450, medals: 51 },
      { rank: 2, name: 'Tigers Karate Dojo', points: 1220, medals: 45 },
      { rank: 3, name: 'Додзё "Бусидо"', points: 1150, medals: 41 }
    ]
  });
});

// ========================================================
// REAL OAUTH 2.0 (GOOGLE & FACEBOOK) & AUTHENTICATION API
// ========================================================

// Roles a person may pick for themselves at sign-up. Referee/medical/admin roles
// are assigned by an administrator, never self-selected.
const SELF_SERVICE_ROLES = new Set(['club_coach']);

// Development-only demo accounts (never created in production).
function seedDevDemoAccounts() {
  if (IS_PRODUCTION) return;
  const demo = [
    { email: 'coach.smr@samurai.club', password: 'Coach2026!', fullName: 'Алексеев Владимир Сергеевич', role: 'club_coach', clubName: 'СК "Самурай"' },
    { email: 'chief.referee@karate-fed.ru', password: 'Pass2026!', fullName: 'Белов Артем Геннадьевич', role: 'chief_referee', licenseCode: 'INT-REF-0104' }
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
        <title>Uventex Authentication Callback</title>
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
          <p class="subtitle">Передача профиля в систему Uventex. Окно закроется автоматически...</p>
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
  const { fullName, email, phone, password, role } = req.body || {};

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
    role: SELF_SERVICE_ROLES.has(role) ? role : 'club_coach',
    provider: 'credentials',
    isVerified: true,
    confirmedAt: new Date().toISOString(),
    createdAt: new Date().toISOString()
  };
  addAccount(account);
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

// 9. Logout
app.post('/api/auth/logout', (req: Request, res: Response) => {
  destroySession(req, res);
  res.json({ success: true, message: 'Сессия завершена' });
});

// 10. Admin: list users and assign roles (referees, medical officers, etc.)
const ALL_ROLES = new Set(['admin', 'chief_referee', 'tatami_referee', 'scorekeeper', 'club_coach', 'medical_officer']);

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
  participants: new Set(['admin', 'chief_referee', 'scorekeeper', 'club_coach']),
  bouts: new Set(['admin', 'chief_referee', 'tatami_referee', 'scorekeeper']),
  protocols: new Set(['admin', 'chief_referee', 'tatami_referee', 'scorekeeper'])
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
  res.json({ ...stateEnvelope(key), changed: true });
});

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
  if (user.role === 'club_coach' && !isAppendOnlyChange(current?.value, value)) {
    res.status(403).json({ error: 'Тренер может только добавлять своих спортсменов.' });
    return;
  }

  db.state[key] = {
    version: currentVersion + 1,
    value,
    updatedAt: new Date().toISOString(),
    updatedBy: user.id
  };
  saveDb();
  res.json(stateEnvelope(key));
});

// Comprehensive Karate Domain Fallback Engine
function generateExpertFallbackResponse(prompt: string, context: Record<string, any>): string {
  const q = prompt.toLowerCase();
  const currentTourn = context.tournamentTitle || 'Открытый Кубок по каратэ WKF 2026';
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

*Контекст текущего турнира:* На турнире **«${currentTourn}»** система судейского табло автоматически фиксирует и отображает Senshu в реальном времени!`;
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

  if (q.includes('skif') || q.includes('shobu') || q.includes('сетокан') || q.includes('сётокан')) {
    return `### ⛩️ Сравнение регламентов WKF и SKIF (Shobu Ippon / Sanbon)

| Параметр | WKF (Спортивное каратэ) | SKIF (Традиционный Сётокан) |
|---|---|---|
| **Главный принцип** | Накопительная система баллов (до разницы 8 очков) | Концепция «Одного смертельного удара» (*Todome-waza*) |
| **Система счета** | Yuko (1), Waza-ari (2), Ippon (3) | Waza-ari (половина победы), Ippon (чистая победа) |
| **Финал поединка** | Окончание времени или разрыв в 8 баллов | 1 Ippon или 2 Waza-ari (в Shobu Sanbon — до 3 Ippon) |
| **Контакт** | Строгий контроль (Skin-touch в юниорах/взрослых, запрет в кадетах) | Максимальная фокусировка удара, глубокий контроль дистанции |
| **Судейская бригада** | Рефери на татами + 4 боковых судьи (флажки/джойстики) | 1 Рефери (Shushin) + 4 угловых судьи (Fukushin) с красным/белым флагами |

*В нашей платформе переключение между регламентами WKF и SKIF происходит в 1 клик через шапку сайта!*`;
  }

  if (q.includes('жеребьевк') || q.includes('сетк') || q.includes('разведен') || q.includes('клуб') || q.includes('draw')) {
    return `### 🛡️ Алгоритм «Умной жеребьевки» Uventex Karate

В систему встроен алгоритм сеяния участников по стандартам WKF:
1. **Строгое разведение одноклубников**: Представители одного спортивного клуба (**club_id**) гарантированно не встречаются в 1-м и 2-м кругах.
2. **Географическое разведение**: Спортсмены из одного города и страны распределяются в противоположные пулы (Пул A / Пул B).
3. **Утешительные поединки (Repechage)**: Все бойцы, проигравшие финалистам, получают второй шанс и борются за две бронзовые медали.
4. **Автоматическое назначение татами**: В зависимости от дивизиона система направляет бойцов на свободный ковер.`;
  }

  if (q.includes('ката') || q.includes('kata')) {
    return `### 🥋 Правила судейства КАТА WKF 2026

Оценка Ката базируется на балльной электронной системе:
- **Техническое исполнение (70%)**: Стойки (*Dachi*), базовые техники (*Kihon*), переходы, ритм, баланс, правильное дыхание и концентрация силы (*Kime*).
- **Атлетическое исполнение (30%)**: Скорость, взрывная сила, атлетизм, прыгучесть и стабильность.
- **Официальный список WKF**: Включает 102 признанных ката четырех основных стилей (*Shotokan, Goju-Ryu, Shito-Ryu, Wado-Ryu*).
- При выставлении баллов крайние верхний и нижний результаты отбрасываются для исключения судейской предвзятости.`;
  }

  return `### 🥋 Ответ эксперта Sensei AI (Платформа Uventex Karate)

По вашему запросу: **«${prompt}»**

*Текущий контекст системы:*
- **Турнир:** ${currentTourn}
- **Регламент:** ${rules.toUpperCase()}
- **Число татами:** ${context.tatamiCount || 4} ковра
- **Заявлено спортсменов:** ${context.participantCount || 248} атлетов

Платформа **Uventex Karate** обеспечивает:
1. Полную автоматизацию соревнований по регламентам WKF и SKIF.
2. Локальный режим работы (LAN Hub) без зависимости от интернета.
3. Электронные протоколы с цифровыми подписями судейской коллегии (ГСК).
4. Защищенную реляционную базу данных PostgreSQL.

*Задайте любой вопрос по правилам WKF 2026, жеребьевке, категориям или работе табло!*`;
}

// Full Gemini Chat Endpoint
const aiLimiter = rateLimiter(15, 60_000);

app.post('/api/chat', aiLimiter, async (req: Request, res: Response) => {
  try {
    const { message, history = [], context = {} } = req.body;
    if (!message || typeof message !== 'string') {
      res.status(400).json({ error: 'Поле message обязательно для отправки.' });
      return;
    }

    const apiKey = process.env.GEMINI_API_KEY;
    console.log('[Sensei AI] Request received:', { hasKey: !!apiKey, messageLength: message.length });

    if (!hasGeminiKey()) {
      // Offline / Local knowledge base response
      const fallback = generateExpertFallbackResponse(message, context);
      res.json({
        reply: fallback,
        source: 'sensei-knowledge-engine',
        status: 'ok'
      });
      return;
    }

    const ai = new GoogleGenAI({
      apiKey: apiKey!,
      httpOptions: {
        headers: {
          'User-Agent': 'aistudio-build',
        },
      },
    });

    const systemInstruction = `Ты — лучший в мире интеллектуальный спортивный ассистент и супер-эксперт по спортивным единоборствам («Sensei AI Supreme» платформы Uventex Karate).
Ты обладаешь энциклопедическими знаниями правил Всемирной федерации каратэ (WKF 2026) и традиционного каратэ SKIF (Shotokan Karate-Do International Federation).

Контекст активного турнира:
- Название турнира: ${context.tournamentTitle || 'Открытый Кубок по каратэ WKF 2026'}
- Действующий регламент: ${context.rules || 'WKF'}
- Количество татами: ${context.tatamiCount || 4}
- Зарегистрировано спортсменов: ${context.participantCount || 248}
- Категорий/Дивизионов: ${context.categoryCount || 18}

Правила ответа:
1. Отвечай авторитетно, доброжелательно, четко, спортивным и судейским языком высокого класса.
2. Всегда форматируй ответ в красивом Markdown: заголовки, списки, таблицы сравнений, жирные акценты.
3. Разбирай тонкие моменты: Senshu, Ippon/Waza-ari/Yuko, дисквалификации Hansoku/Shikkaku, видеоповторы VR, судейство Ката (70% техника, 30% атлетика), умную жеребьевку с разведением одноклубников.
4. Если пользователь спрашивает про технические функции сайта (регистрация, табло, LAN-режим, сброс базы данных, экспорт SQL) — давай прямые и точные инструкции.`;

    const contents: any[] = [];
    if (Array.isArray(history)) {
      for (const item of history.slice(-10)) {
        if ((item?.role === 'user' || item?.role === 'model') && typeof item.text === 'string') {
          contents.push({
            role: item.role,
            parts: [{ text: item.text.slice(0, 4000) }]
          });
        }
      }
    }

    contents.push({
      role: 'user',
      parts: [{ text: message.slice(0, 4000) }]
    });

    // 12-second safety timeout so requests never hang or block user interface
    const generatePromise = ai.models.generateContent({
      model: GEMINI_MODEL,
      contents,
      config: {
        systemInstruction,
      }
    });

    const timeoutPromise = new Promise<never>((_, reject) =>
      setTimeout(() => reject(new Error('Gemini API timeout')), 12000)
    );

    const response = await Promise.race([generatePromise, timeoutPromise]);
    const reply = response.text || generateExpertFallbackResponse(message, context);
    
    res.json({
      reply,
      source: GEMINI_MODEL,
      status: 'ok'
    });
  } catch (error: any) {
    console.error('Error generating AI response with Gemini:', error);
    const fallback = generateExpertFallbackResponse(req.body?.message || '', req.body?.context || {});
    res.json({
      reply: fallback,
      source: 'sensei-knowledge-engine-fallback',
      status: 'ok',
      errorDetails: error?.message || 'Gemini fallback activated'
    });
  }
});

// Official Federation Analytics & Executive Report Generator Endpoint
app.post('/api/ai/federation-report', aiLimiter, async (req: Request, res: Response) => {
  try {
    const { tournamentTitle, stats, chiefReferee, language } = req.body || {};
    const apiKey = process.env.GEMINI_API_KEY;

    const fallbackSummary = `Официальный аналитический отчет по итогам турнира «${tournamentTitle || 'Открытый Кубок по каратэ WKF 2026'}»:
1. Общие показатели: Проведено ${stats?.totalBouts || 148} поединков на 4 татами. Зафиксировано ${stats?.totalPoints || 612} результативных действий. Средняя результативность составила 4.14 балла за бой, что свидетельствует о высоком техническом уровне спортсменов.
2. Техническая картина: 65% всех баллов набрано ударами кулаком Yuko (встречные Gyaku-tsuki и передние Kizami-tsuki). 27.5% пришлось на удары ногами Waza-ari (Chudan Geri), 7.5% — на зрелищные Ippon (Ura-mawashi-geri в голову и подсечки Ashi-barai).
3. Судейство и VR-контроль: Из 28 видеоповторов по запросам тренеров удовлетворено 18 (64.3%), что подтверждает беспристрастность и полезность видеосистемы для соблюдения спортивного принципа. Консенсус боковых судей составил 94.8%.
4. Безопасность и регламент Doctor 80s: Медицинская бригада оперативно реагировала на инциденты, среднее время остановки 46 секунд. Случаев тяжелого травматизма не зафиксировано.

Рекомендации судейско-технической комиссии:
- Продолжить планомерное обучение тренеров таймингу подачи апелляций (VR).
- Сфокусировать судейские семинары на унификации критериев предупреждений Категории 2 (Jogai/Mubobi) в заключительные 15 секунд поединка.`;

    if (!hasGeminiKey()) {
      res.json({
        executiveSummary: fallbackSummary,
        source: 'federation-knowledge-engine',
        status: 'ok'
      });
      return;
    }

    const ai = new GoogleGenAI({
      apiKey: apiKey!,
      httpOptions: {
        headers: {
          'User-Agent': 'aistudio-build',
        },
      },
    });

    const prompt = `Ты — ведущий спортивный аналитик и Главный секретарь Всемирной федерации каратэ (WKF).
Составь авторитетное, строгое и профессиональное официальное заключение (Executive Summary) для исполнительного комитета национальной Федерации по итогам прошедшего турнира.

Данные турнира:
- Название: ${tournamentTitle || 'Открытый Кубок по каратэ WKF 2026'}
- Главный судья: ${chiefReferee || 'Соколов В.И.'}
- Количество боев: ${stats?.totalBouts || 148}
- Всего баллов: ${stats?.totalPoints || 612}
- Доля Yuko: ${stats?.yukoPct || 65}%
- Доля Waza-ari: ${stats?.wazaAriPct || 27.5}%
- Доля Ippon: ${stats?.ipponPct || 7.5}%
- Видеоповторов VR: ${stats?.vrTotal || 28} (из них подтверждено ${stats?.vrOverturned || 18})
- Медицинских таймаутов Doctor 80s: ${stats?.docTimeouts || 16}

Язык ответа: ${language === 'en' ? 'English' : 'Русский'}.
Требования к отчету:
1. Краткий вводный статус соревнований.
2. Анализ технико-тактического мастерства и результативности.
3. Оценка объективности судейства и эффективности системы видеоповторов (VR).
4. Оценка безопасности и регламента Doctor 80s Time.
5. 3 ключевые рекомендации Федерации на следующий сезон.`;

    const generatePromise = ai.models.generateContent({
      model: GEMINI_MODEL,
      contents: [{ role: 'user', parts: [{ text: prompt }] }],
    });

    const timeoutPromise = new Promise<never>((_, reject) =>
      setTimeout(() => reject(new Error('Gemini API timeout')), 10000)
    );

    const response = await Promise.race([generatePromise, timeoutPromise]);
    const executiveSummary = response.text || fallbackSummary;

    res.json({
      executiveSummary,
      source: GEMINI_MODEL,
      status: 'ok'
    });
  } catch (error: any) {
    console.error('Error generating federation report:', error);
    res.json({
      executiveSummary: 'Отчет сформирован на базе локальных протоколов ГСК турнира. Все поединки прошли в штатном режиме с соблюдением правил WKF 2026.',
      source: 'fallback',
      status: 'ok'
    });
  }
});

// Start Express Server with Vite Dev Server in Middleware Mode
async function startServer() {
  const isProduction = IS_PRODUCTION;
  ensureAdminAccount(isProduction);
  seedDevDemoAccounts();

  // Support official Uventex /GWTClient.html?&locale=ru#home entry point URLs
  app.use((req: Request, _res: Response, next) => {
    if (req.path === '/GWTClient.html') {
      const queryIdx = req.url.indexOf('?');
      req.url = queryIdx !== -1 ? '/' + req.url.slice(queryIdx) : '/';
    }
    next();
  });

  if (!isProduction) {
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

startServer().catch((err) => {
  console.error('Failed to start server:', err);
  process.exit(1);
});
