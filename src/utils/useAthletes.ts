import React from 'react';
import type { ClubAthlete, ClubAthleteInput } from './athletes';

const send = async (url: string, method: string, body?: unknown) => {
  const res = await fetch(url, { method, headers: { 'Content-Type': 'application/json' }, body: body === undefined ? undefined : JSON.stringify(body) });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(data.error || 'Нет связи с сервером.');
  return data;
};

/** «Мои спортсмены» of the signed-in account, loaded from the server. `enabled` = false for roles without a roster. */
export function useAthletes(enabled: boolean) {
  const [athletes, setAthletes] = React.useState<ClubAthlete[]>([]);
  const [loaded, setLoaded] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);

  const reload = React.useCallback(async () => {
    if (!enabled) return;
    try {
      const data = await send('/api/athletes', 'GET');
      setAthletes(data.athletes || []);
      setError(null);
    } catch (e: any) {
      setError(e.message);
    } finally {
      setLoaded(true);
    }
  }, [enabled]);

  React.useEffect(() => {
    reload();
  }, [reload]);

  const replace = (a: ClubAthlete) => setAthletes((list) => (list.some((x) => x.id === a.id) ? list.map((x) => (x.id === a.id ? a : x)) : [...list, a]));

  return {
    athletes,
    loaded,
    error,
    reload,
    add: async (input: ClubAthleteInput) => {
      const data = await send('/api/athletes', 'POST', input);
      replace(data.athlete);
      return data.athlete as ClubAthlete;
    },
    update: async (id: string, input: ClubAthleteInput) => {
      const data = await send(`/api/athletes/${encodeURIComponent(id)}`, 'PUT', input);
      replace(data.athlete);
      return data.athlete as ClubAthlete;
    },
    archive: async (id: string, archived: boolean) => {
      const data = await send(`/api/athletes/${encodeURIComponent(id)}/archive`, 'POST', { archived });
      replace(data.athlete);
    },
    suggestions: async (): Promise<ClubAthleteInput[]> => (await send('/api/athletes/suggest-from-entries', 'GET')).candidates || [],
    importFromEntries: async (): Promise<number> => {
      const data = await send('/api/athletes/import-from-entries', 'POST', {});
      setAthletes(data.athletes || []);
      return data.added || 0;
    }
  };
}

export const fullName = (a: { lastName: string; firstName: string }) => `${a.lastName} ${a.firstName}`.trim();
