import React from 'react';
import { Plus, Trash2, Tag } from 'lucide-react';
import { NumberField } from './NumberField';
import { useApp } from '../context/AppContext';
import type { EventCategory, Tournament } from '../types/schema';
import { sanitizePricing, currentPeriod, periodStartsOn, bishkekDate, categoryPrice, additionalPrice, type TournamentPricing } from '../utils/pricing';

const t = (lang: string, ru: string, ky: string, en: string) => (lang === 'ky' ? ky : lang === 'en' ? en : ru);
const field = 'rounded-lg border border-[var(--app-border)] bg-[var(--app-surface)] text-[var(--app-text-primary)] px-2.5 py-1.5 text-sm';

interface DraftPeriod {
  id: string;
  name: string;
  endsOn: string;
  sign: 'minus' | 'plus';
  amount: number;
}

const toDraft = (p?: TournamentPricing): DraftPeriod[] =>
  (p?.periods || []).map((x) => ({ id: x.id, name: x.name, endsOn: x.endsOn, sign: x.extra < 0 ? 'minus' : 'plus', amount: Math.abs(x.extra) }));

const fmtDate = (iso: string) => (iso ? iso.split('-').reverse().join('.') : '');

/** Organizer: price periods (early / regular / late) and the discount for every next category. */
export const PricingEditor: React.FC<{
  tournament: Tournament;
  categories: EventCategory[];
  currency: string;
  onSave: (pricing: TournamentPricing | undefined) => void;
}> = ({ tournament, categories, currency, onSave }) => {
  const { language } = useApp();
  const [periods, setPeriods] = React.useState<DraftPeriod[]>(() => toDraft(tournament.pricing));
  const [discount, setDiscount] = React.useState(tournament.pricing?.additionalDiscount || 0);
  const [saved, setSaved] = React.useState(false);

  React.useEffect(() => {
    setPeriods(toDraft(tournament.pricing));
    setDiscount(tournament.pricing?.additionalDiscount || 0);
    setSaved(false);
  }, [tournament.id]);

  const pricing = sanitizePricing({
    periods: periods.map((p) => ({ id: p.id, name: p.name, endsOn: p.endsOn, extra: p.sign === 'minus' ? -p.amount : p.amount })),
    additionalDiscount: discount
  });
  const missingDate = periods.some((p) => !p.endsOn);
  const now = currentPeriod(pricing, bishkekDate());
  const sample = categories.find((c) => c.fee > 0 && c.discipline !== 'team_kata' && c.discipline !== 'team_kumite');

  const update = (id: string, patch: Partial<DraftPeriod>) => {
    setSaved(false);
    setPeriods(periods.map((p) => (p.id === id ? { ...p, ...patch } : p)));
  };
  const add = () => {
    setSaved(false);
    const n = periods.length;
    const names = [
      t(language, 'Ранняя регистрация', 'Эрте каттоо', 'Early registration'),
      t(language, 'Основная', 'Негизги', 'Regular'),
      t(language, 'Поздняя регистрация', 'Кеч каттоо', 'Late registration')
    ];
    setPeriods([...periods, { id: `period-${Date.now()}`, name: names[Math.min(n, 2)], endsOn: '', sign: n === 0 ? 'minus' : 'plus', amount: 0 }]);
  };

  return (
    <section className="rounded-2xl border border-[var(--app-border)] bg-[var(--app-surface)] p-4 space-y-4">
      <div>
        <h2 className="font-semibold text-[var(--app-text-primary)] flex items-center gap-2">
          <Tag className="w-4 h-4 text-[var(--accent)]" /> {t(language, 'Цены: периоды и скидка за следующую категорию', 'Баалар: мезгилдер жана кийинки категорияга арзандатуу', 'Prices: periods and next-category discount')}
        </h2>
        <p className="text-sm text-[var(--app-text-secondary)] mt-1">
          {t(
            language,
            'Взнос каждой категории задаётся в списке ниже. Здесь — как он меняется по датам (например, ранняя регистрация дешевле) и скидка, если спортсмен заявляется в несколько категорий. Самую дорогую категорию он оплачивает полностью, остальные — со скидкой. Командные категории — без скидки.',
            'Ар бир категориянын төлөмү төмөнкү тизмеде. Бул жерде — датага жараша өзгөрүшү (мисалы, эрте каттоо арзаныраак) жана спортчу бир нече категорияга катталса арзандатуу. Эң кымбат категорияны толук төлөйт, калгандарын — арзандатуу менен. Командалык категорияларга арзандатуу жок.',
            'Each category fee is set in the list below. Here you set how it changes by date (e.g. early registration is cheaper) and a discount when an athlete enters several categories: the most expensive one is paid in full, the others with the discount. Team categories get no discount.'
          )}
        </p>
      </div>

      <div className="space-y-2">
        {periods.length === 0 && (
          <p className="text-sm text-[var(--app-text-muted)]">
            {t(language, 'Периодов нет: взнос одинаковый до конца регистрации.', 'Мезгилдер жок: төлөм каттоо бүткөнгө чейин бирдей.', 'No periods: the fee is the same until registration closes.')}
          </p>
        )}
        {periods.map((p, i) => {
          const start = periodStartsOn(pricing, p.id);
          return (
            <div key={p.id} className="grid gap-2 sm:grid-cols-[1fr_auto_auto_auto_auto] items-end rounded-xl border border-[var(--app-border)] p-2.5">
              <label className="text-sm">
                <span className="block text-xs font-medium text-[var(--app-text-muted)] mb-1">{t(language, 'Название периода', 'Мезгилдин аты', 'Period name')}</span>
                <input value={p.name} maxLength={60} onChange={(e) => update(p.id, { name: e.target.value })} className={`${field} w-full`} />
              </label>
              <label className="text-sm">
                <span className="block text-xs font-medium text-[var(--app-text-muted)] mb-1">
                  {t(language, 'Последний день', 'Акыркы күнү', 'Last day')}
                  {start ? ` (${t(language, 'с', 'башталышы', 'from')} ${fmtDate(start)})` : ''}
                </span>
                <input type="date" value={p.endsOn} onChange={(e) => update(p.id, { endsOn: e.target.value })} className={`${field} w-full`} aria-label={t(language, 'Последний день периода', 'Мезгилдин акыркы күнү', 'Last day of the period')} />
              </label>
              <label className="text-sm">
                <span className="block text-xs font-medium text-[var(--app-text-muted)] mb-1">{t(language, 'К взносу', 'Төлөмгө', 'To the fee')}</span>
                <select value={p.sign} onChange={(e) => update(p.id, { sign: e.target.value as DraftPeriod['sign'] })} className={`${field} w-full`}>
                  <option value="minus">{t(language, 'скидка −', 'арзандатуу −', 'discount −')}</option>
                  <option value="plus">{t(language, 'наценка +', 'кошумча +', 'surcharge +')}</option>
                </select>
              </label>
              <label className="text-sm">
                <span className="block text-xs font-medium text-[var(--app-text-muted)] mb-1">{t(language, 'Сумма', 'Сумма', 'Amount')}, {currency}</span>
                <NumberField value={p.amount} onValueChange={(n) => update(p.id, { amount: n })} className={`${field} w-24`} />
              </label>
              <button
                onClick={() => { setSaved(false); setPeriods(periods.filter((x) => x.id !== p.id)); }}
                className="h-9 w-9 inline-flex items-center justify-center rounded-lg text-[var(--app-text-muted)] hover:text-red-600 hover:bg-red-50 cursor-pointer"
                title={t(language, 'Удалить период', 'Мезгилди өчүрүү', 'Delete period')}
                aria-label={`${t(language, 'Удалить период', 'Мезгилди өчүрүү', 'Delete period')} ${i + 1}`}
              >
                <Trash2 className="w-4 h-4" />
              </button>
            </div>
          );
        })}
        <button onClick={add} disabled={periods.length >= 12} className="inline-flex items-center gap-2 h-9 px-3 rounded-lg border border-[var(--app-border)] text-sm text-[var(--app-text-primary)] hover:bg-[var(--app-surface-subtle)] disabled:opacity-40 cursor-pointer">
          <Plus className="w-4 h-4" /> {t(language, 'Добавить период', 'Мезгил кошуу', 'Add period')}
        </button>
        {periods.length > 0 && (
          <p className="text-xs text-[var(--app-text-muted)]">
            {t(language, 'Даты — по времени Бишкека. После последнего периода действует его цена.', 'Даталар — Бишкек убакыты боюнча. Акыркы мезгилден кийин анын баасы колдонулат.', 'Dates are in Bishkek time. After the last period ends, its price stays.')}
          </p>
        )}
      </div>

      <label className="flex flex-wrap items-center gap-2 text-sm text-[var(--app-text-primary)]">
        {t(language, 'Скидка за каждую следующую категорию спортсмена:', 'Спортчунун ар бир кийинки категориясына арзандатуу:', 'Discount for each next category of an athlete:')}
        <NumberField value={discount} onValueChange={(n) => { setSaved(false); setDiscount(n); }} className={`${field} w-24`} /> {currency}
      </label>

      {sample && (
        <p className="text-sm rounded-xl bg-[var(--app-surface-subtle)] px-3 py-2 text-[var(--app-text-secondary)]">
          {t(language, 'Пример сейчас', 'Азыркы мисал', 'Example now')}
          {now ? ` (${now.name || fmtDate(now.endsOn)})` : ''}: {t(language, 'категория за', 'категория', 'a category at')} {sample.fee} {currency} →{' '}
          {t(language, 'первая', 'биринчи', 'first')} <b>{categoryPrice(sample, now)} {currency}</b>, {t(language, 'следующая', 'кийинки', 'next')}{' '}
          <b>{additionalPrice(sample, now, pricing)} {currency}</b>
        </p>
      )}

      <div className="flex flex-wrap items-center gap-3">
        <button
          onClick={() => { onSave(pricing); setSaved(true); }}
          disabled={missingDate}
          className="h-10 px-4 rounded-lg bg-[var(--accent)] hover:bg-[var(--accent-strong)] text-white text-sm font-semibold disabled:opacity-40 cursor-pointer"
        >
          {t(language, 'Сохранить цены', 'Бааларды сактоо', 'Save prices')}
        </button>
        {missingDate && <span className="text-sm text-amber-700">{t(language, 'Укажите последний день у каждого периода.', 'Ар бир мезгилдин акыркы күнүн көрсөтүңүз.', 'Set the last day of every period.')}</span>}
        {saved && !missingDate && <span className="text-sm text-emerald-700">{t(language, 'Сохранено. Новые заявки считаются по этим ценам.', 'Сакталды. Жаңы табыштамалар ушул баалар менен эсептелет.', 'Saved. New entries use these prices.')}</span>}
      </div>
      <p className="text-xs text-[var(--app-text-muted)]">
        {t(language, 'Уже поданные заявки не пересчитываются: цена фиксируется в момент подачи.', 'Мурда берилген табыштамалар кайра эсептелбейт: баа берилген учурда бекитилет.', 'Entries already submitted keep their price: it is fixed when the entry is made.')}
      </p>
    </section>
  );
};
