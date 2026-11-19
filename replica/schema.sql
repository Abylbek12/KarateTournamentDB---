-- Apsatarov: новые таблицы для денег (заказы, оплаты, билеты).
-- Остальное (турниры, категории, участники, бои) остаётся в tatami_kv, как сейчас.
-- Таблицы создаются только на Postgres (Vercel / Neon). В режиме db.json (ноутбук без интернета)
-- онлайн-оплата выключена, принимаются только оплаты на месте.
-- Доступ проверяет сервер (server.ts) в каждом запросе; RLS не используем: сервер ходит в базу одним пользователем.
-- Деньги храним в тыйынах (1 сом = 100 тыйын) целым числом плюс валюта.
-- Время всегда timestamptz (UTC). Кыргызстан: Asia/Bishkek, UTC+6, без перехода на летнее время.

create extension if not exists pgcrypto;

-- Заказ: одна корзина = один платёж. Заявка спортсмена на несколько категорий или пачка заявок клуба.
create table if not exists orders (
  id uuid primary key default gen_random_uuid(),
  order_number text not null unique,              -- человекочитаемый номер, например A-2026-000123
  tournament_id text not null,                    -- id турнира из tatami_kv (events)
  account_id text not null,                       -- кто платит: id аккаунта из store.ts
  kind text not null check (kind in ('entry', 'ticket')),
  status text not null default 'pending'
    check (status in ('pending', 'paid', 'failed', 'cancelled', 'refunded', 'partially_refunded')),
  currency text not null default 'KGS' check (currency ~ '^[A-Z]{3}$'),
  total_tyiyn integer not null check (total_tyiyn >= 0),
  price_period_id text,                           -- по какому ценовому периоду считали (фиксируем цену на момент заказа)
  payer_name text not null,
  payer_email text,
  payer_phone text,
  expires_at timestamptz not null,                -- неоплаченный заказ сгорает (например, через 30 минут)
  paid_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index if not exists orders_tournament_idx on orders (tournament_id, status);
create index if not exists orders_account_idx on orders (account_id, created_at desc);
create index if not exists orders_pending_expiry_idx on orders (expires_at) where status = 'pending';

-- Строка заказа: одна категория одного спортсмена (или один билет).
create table if not exists order_items (
  id uuid primary key default gen_random_uuid(),
  order_id uuid not null references orders(id) on delete cascade,
  participant_id text,                            -- id участника из tatami_kv (для заявок)
  category_id text,                               -- id категории из tatami_kv (для заявок)
  ticket_type_id text,                            -- id типа билета из настроек турнира (для билетов)
  price_kind text not null check (price_kind in ('first', 'additional', 'team', 'ticket')),
  amount_tyiyn integer not null check (amount_tyiyn >= 0),
  label text not null,                            -- что увидит человек в чеке: «Кумите, мальчики 10–11, -35 кг»
  created_at timestamptz not null default now(),
  check ((participant_id is not null and category_id is not null) or ticket_type_id is not null)
);
create index if not exists order_items_order_idx on order_items (order_id);
create index if not exists order_items_participant_idx on order_items (participant_id);
-- Одна категория одного спортсмена не может быть оплачена дважды в разных живых заказах:
-- проверяется в коде при создании заказа (заказы со статусом pending/paid), т.к. статус лежит в orders.

-- Платёж у платёжного сервиса. Один заказ может иметь несколько попыток.
create table if not exists payments (
  id uuid primary key default gen_random_uuid(),
  order_id uuid not null references orders(id) on delete restrict,   -- деньги не удаляем вместе с заказом
  provider text not null check (provider in ('freedompay', 'manual')),
  provider_payment_id text,                       -- id платежа у провайдера
  method text not null check (method in ('card', 'qr', 'cash', 'bank_transfer')),
  status text not null default 'created'
    check (status in ('created', 'succeeded', 'failed', 'refunded')),
  amount_tyiyn integer not null check (amount_tyiyn > 0),
  currency text not null default 'KGS',
  marked_by text,                                 -- для manual: кто из организаторов отметил оплату
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (provider, provider_payment_id)          -- повторное уведомление от провайдера не создаст второй платёж
);
create index if not exists payments_order_idx on payments (order_id);

-- Журнал уведомлений от платёжного сервиса: каждое сохраняем один раз.
create table if not exists payment_events (
  id uuid primary key default gen_random_uuid(),
  provider text not null,
  provider_event_id text not null,
  payload jsonb not null,
  processed_at timestamptz,
  created_at timestamptz not null default now(),
  unique (provider, provider_event_id)
);

-- Билет зрителя. Создаётся после оплаты заказа kind='ticket'.
create table if not exists tickets (
  id uuid primary key default gen_random_uuid(),
  order_id uuid not null references orders(id) on delete restrict,
  tournament_id text not null,
  ticket_type_id text not null,
  code text not null unique,                      -- случайный код для QR на входе
  holder_name text,
  status text not null default 'valid' check (status in ('valid', 'used', 'refunded')),
  used_at timestamptz,
  used_by text,                                   -- кто сканировал на входе
  created_at timestamptz not null default now()
);
create index if not exists tickets_tournament_idx on tickets (tournament_id, status);
