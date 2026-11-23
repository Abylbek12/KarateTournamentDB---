/**
 * Page addresses. Every screen has its own link (#rankings, #info;id=...),
 * so the phone's Back button returns to the previous page and links can be
 * opened in a new tab or shared.
 */
const EVENT_ROUTES: Record<string, string> = {
  event_info: 'info',
  event_categories_prices: 'categories',
  event_brackets: 'brackets',
  event_results: 'results',
  event_medals: 'medals',
  event_live_scoring: 'live_scoring'
};
const ROUTE_TO_EVENT_TAB = Object.fromEntries(Object.entries(EVENT_ROUTES).map(([tab, route]) => [route, tab]));

export const isEventTab = (tab: string) => tab in EVENT_ROUTES;

/** Link of a screen, e.g. "#rankings" or "#info;id=kg-cup-2026". */
export function hashForTab(tab: string, eventId?: string): string {
  if (tab === 'tournaments') return '#home';
  if (EVENT_ROUTES[tab]) return `#${EVENT_ROUTES[tab]}${eventId ? `;id=${eventId}` : ''}`;
  return `#${tab}`;
}

/** Link of a stage of the tournament workflow, e.g. "#manage;id=kg-cup;step=4". */
export const manageHash = (eventId: string, step: number) => `#manage;id=${eventId};step=${step}`;

/** Screen and tournament of a link. Unknown links → null. */
export function tabFromHash(hash: string): { tab: string; eventId?: string; step?: number } | null {
  const raw = hash.replace(/^#/, '');
  if (!raw) return null;
  const [route, ...params] = raw.split(';');
  const eventId = params.find((p) => p.startsWith('id='))?.slice(3);
  const stepRaw = Number(params.find((p) => p.startsWith('step='))?.slice(5));
  if (route === 'manage') return { tab: 'manage', eventId, step: stepRaw >= 1 && stepRaw <= 6 ? stepRaw : 1 };
  if (route === 'home' || route === 'events' || route === 'tournaments') return { tab: 'tournaments' };
  if (ROUTE_TO_EVENT_TAB[route]) return { tab: ROUTE_TO_EVENT_TAB[route], eventId };
  if (/^[a-z_]+$/.test(route) && route !== 'login') return { tab: route, eventId };
  return null;
}

/** Ordinary click → handled in the page; Ctrl/Cmd/middle click → browser opens a new tab. */
export const isPlainClick = (e: { button?: number; metaKey?: boolean; ctrlKey?: boolean; shiftKey?: boolean; altKey?: boolean }) =>
  !e.metaKey && !e.ctrlKey && !e.shiftKey && !e.altKey && (e.button ?? 0) === 0;
