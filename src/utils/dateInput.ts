/**
 * Ввод даты рождения вручную: люди пишут «20.01.1991», без календаря.
 * Внутри сайта дата хранится как ГГГГ-ММ-ДД (так её понимают сервер и проверка категорий).
 */

/** Оставляет только цифры и сама ставит точки: «20011991» → «20.01.1991». Точка в конце не ставится, чтобы работал Backspace. */
export function formatBirthInput(raw: string): string {
  const d = raw.replace(/\D/g, '').slice(0, 8);
  if (d.length <= 2) return d;
  if (d.length <= 4) return `${d.slice(0, 2)}.${d.slice(2)}`;
  return `${d.slice(0, 2)}.${d.slice(2, 4)}.${d.slice(4)}`;
}

/** «20.01.1991» → «1991-01-20». Если даты не существует (31.02.1990), слишком старая или из будущего — пустая строка. */
export function parseBirthText(text: string, today: Date = new Date()): string {
  const m = /^(\d{2})\.(\d{2})\.(\d{4})$/.exec(text.trim());
  if (!m) return '';
  const day = Number(m[1]);
  const month = Number(m[2]);
  const year = Number(m[3]);
  if (year < 1900) return '';
  const date = new Date(Date.UTC(year, month - 1, day));
  if (date.getUTCFullYear() !== year || date.getUTCMonth() !== month - 1 || date.getUTCDate() !== day) return '';
  const todayUtc = Date.UTC(today.getFullYear(), today.getMonth(), today.getDate());
  if (date.getTime() > todayUtc) return '';
  return `${m[3]}-${m[2]}-${m[1]}`;
}

/** «1991-01-20» → «20.01.1991» (для показа уже сохранённой даты). */
export function isoToBirthText(iso: string): string {
  const m = /^(\d{4})-(\d{2})-(\d{2})/.exec(iso || '');
  return m ? `${m[3]}.${m[2]}.${m[1]}` : '';
}
