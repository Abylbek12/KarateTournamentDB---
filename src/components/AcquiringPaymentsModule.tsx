import React, { useState, useMemo } from 'react';
import { 
  CreditCard, 
  QrCode, 
  FileText, 
  CheckCircle2, 
  Clock, 
  AlertCircle, 
  RotateCcw, 
  Download, 
  Search, 
  Filter, 
  Plus, 
  ArrowUpRight, 
  Receipt, 
  Printer, 
  ShieldCheck, 
  Percent, 
  Building2, 
  User, 
  DollarSign, 
  Send, 
  Check, 
  ExternalLink,
  ChevronDown,
  Sparkles,
  Smartphone
} from 'lucide-react';
import { 
  PaymentTransaction, 
  PaymentStatus, 
  PaymentMethodType, 
  FeeCategory, 
  Participant, 
  Club, 
  Tournament,
  UserRole
} from '../types/schema';
import { SAMPLE_PAYMENTS, INITIAL_ACQUIRING_STATS, playNotificationSound } from '../data/sampleAcquiringAndExports';

interface AcquiringPaymentsModuleProps {
  tournament: Tournament;
  participants: Participant[];
  clubs: Club[];
  currentUserRole: UserRole;
  onUpdateParticipantFee?: (participantId: string, status: 'paid' | 'pending' | 'exempt' | 'refunded') => void;
  onNotifySystem?: (title: string, message: string, category: 'payment') => void;
}

export const AcquiringPaymentsModule: React.FC<AcquiringPaymentsModuleProps> = ({
  tournament,
  participants,
  clubs,
  currentUserRole,
  onUpdateParticipantFee,
  onNotifySystem
}) => {
  const [payments, setPayments] = useState<PaymentTransaction[]>(SAMPLE_PAYMENTS);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | PaymentStatus>('all');
  const [methodFilter, setMethodFilter] = useState<'all' | PaymentMethodType>('all');
  const [selectedReceipt, setSelectedReceipt] = useState<PaymentTransaction | null>(null);

  // New Payment Checkout Modal State
  const [isCheckoutOpen, setIsCheckoutOpen] = useState(false);
  const [checkoutStep, setCheckoutStep] = useState<'details' | 'payment_method' | 'processing' | 'success'>('details');
  const [selectedParticipantId, setSelectedParticipantId] = useState<string>('');
  const [selectedFeeCategory, setSelectedFeeCategory] = useState<FeeCategory>('athlete_entry');
  const [selectedMethod, setSelectedMethod] = useState<PaymentMethodType>('sbp_qr');
  const [payerName, setPayerName] = useState('');
  const [payerEmail, setPayerEmail] = useState('');
  const [payerPhone, setPayerPhone] = useState('+7 (9');
  const [customAmountRub, setCustomAmountRub] = useState<number>(3500);
  const [cardDetails, setCardDetails] = useState({ number: '4400 8912 3456 7890', exp: '12/28', cvc: '741' });
  const [smsCode, setSmsCode] = useState('7729');
  const [showSmsVerification, setShowSmsVerification] = useState(false);

  // Calculate live statistics
  const stats = useMemo(() => {
    const totalRevenue = payments
      .filter(p => p.status === 'paid')
      .reduce((sum, p) => sum + p.amountRub, 0);

    const paidCount = payments.filter(p => p.status === 'paid').length;
    const pendingCount = payments.filter(p => p.status === 'pending').length;
    const refundedCount = payments.filter(p => p.status === 'refunded').length;
    const totalTransactions = payments.length || 1;
    const collectionRate = Math.round((paidCount / totalTransactions) * 100);

    const sbpRevenue = payments
      .filter(p => p.status === 'paid' && p.paymentMethod === 'sbp_qr')
      .reduce((sum, p) => sum + p.amountRub, 0);
    const cardRevenue = payments
      .filter(p => p.status === 'paid' && (p.paymentMethod === 'card' || p.paymentMethod === 'tpay'))
      .reduce((sum, p) => sum + p.amountRub, 0);
    const invoiceRevenue = payments
      .filter(p => p.status === 'paid' && p.paymentMethod === 'club_invoice')
      .reduce((sum, p) => sum + p.amountRub, 0);

    return {
      totalRevenue,
      paidCount,
      pendingCount,
      refundedCount,
      collectionRate,
      sbpSharePct: totalRevenue > 0 ? Math.round((sbpRevenue / totalRevenue) * 100) : 40,
      cardSharePct: totalRevenue > 0 ? Math.round((cardRevenue / totalRevenue) * 100) : 35,
      invoiceSharePct: totalRevenue > 0 ? Math.round((invoiceRevenue / totalRevenue) * 100) : 25
    };
  }, [payments]);

  // Filtered payments list
  const filteredPayments = useMemo(() => {
    return payments.filter(p => {
      const matchSearch = 
        p.orderNumber.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (p.participantName && p.participantName.toLowerCase().includes(searchQuery.toLowerCase())) ||
        p.clubName.toLowerCase().includes(searchQuery.toLowerCase()) ||
        p.payerName.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (p.fiscalReceiptNumber && p.fiscalReceiptNumber.toLowerCase().includes(searchQuery.toLowerCase()));

      const matchStatus = statusFilter === 'all' || p.status === statusFilter;
      const matchMethod = methodFilter === 'all' || p.paymentMethod === methodFilter;

      return matchSearch && matchStatus && matchMethod;
    });
  }, [payments, searchQuery, statusFilter, methodFilter]);

  // Handle participant change in checkout
  const handleSelectParticipant = (pId: string) => {
    setSelectedParticipantId(pId);
    const p = participants.find(item => item.id === pId);
    if (p) {
      setPayerName(`${p.lastName} ${p.firstName}`);
      setPayerEmail(`${p.firstName.toLowerCase()}.${p.lastName.toLowerCase()}@karate-mail.ru`);
      setPayerPhone('+7 (916) 789-22-33');
      const cat = p.categoryId?.includes('kumite') ? 3500 : 3000;
      setCustomAmountRub(cat);
    }
  };

  // Submit payment processing
  const handleExecutePayment = () => {
    setCheckoutStep('processing');

    setTimeout(() => {
      const selectedP = participants.find(p => p.id === selectedParticipantId);
      const newTx: PaymentTransaction = {
        id: `tx-${Date.now()}`,
        orderNumber: `ORD-2026-${Math.floor(1000 + Math.random() * 9000)}`,
        tournamentId: tournament.id,
        participantId: selectedParticipantId || undefined,
        participantName: selectedP ? `${selectedP.lastName} ${selectedP.firstName}` : payerName,
        clubId: selectedP?.clubId || 'c1',
        clubName: selectedP?.clubName || 'СК «Сётокан Профи»',
        amountRub: customAmountRub,
        feeCategory: selectedFeeCategory,
        paymentMethod: selectedMethod,
        status: 'paid',
        createdAt: new Date().toISOString(),
        paidAt: new Date().toISOString(),
        fiscalReceiptNumber: `ФД-000${Math.floor(50000 + Math.random() * 9000)}`,
        fiscalSign: `${Math.floor(1000000000 + Math.random() * 9000000000)}`,
        payerName: payerName || 'Представитель команды',
        payerEmail: payerEmail || 'billing@karate-event.ru',
        payerPhone: payerPhone || '+7 (900) 000-00-00',
        categoryName: selectedFeeCategory === 'athlete_entry' ? 'Стартовый взнос участника WKF' : 'Командный сбор',
        description: `Оплата взноса через ${selectedMethod.toUpperCase()} в системе эквайринга Uventex`
      };

      setPayments(prev => [newTx, ...prev]);

      if (selectedParticipantId && onUpdateParticipantFee) {
        onUpdateParticipantFee(selectedParticipantId, 'paid');
      }

      if (onNotifySystem) {
        onNotifySystem(
          'Оплата взноса подтверждена',
          `Успешно получен взнос ${customAmountRub.toLocaleString('ru-RU')} ₽ за участника ${newTx.participantName} (${newTx.clubName}). Чек ${newTx.fiscalReceiptNumber}.`,
          'payment'
        );
      }

      playNotificationSound('success');
      setCheckoutStep('success');
      setSelectedReceipt(newTx);
    }, 1200);
  };

  // Issue Refund Handler
  const handleRefundTransaction = (tx: PaymentTransaction) => {
    if (confirm(`Вы действительно хотите выполнить возврат платежа ${tx.orderNumber} на сумму ${tx.amountRub.toLocaleString('ru-RU')} ₽?`)) {
      setPayments(prev => prev.map(p => {
        if (p.id === tx.id) {
          return {
            ...p,
            status: 'refunded',
            fiscalReceiptNumber: `ВОЗВ-000${Math.floor(100 + Math.random() * 900)}`
          };
        }
        return p;
      }));

      if (tx.participantId && onUpdateParticipantFee) {
        onUpdateParticipantFee(tx.participantId, 'refunded');
      }

      playNotificationSound('warning');
    }
  };

  // Export transactions ledger as CSV with UTF-8 BOM
  const handleExportCsv = () => {
    const headers = ['Номер заказа', 'Дата оплаты', 'ФИО плательщика', 'Спортсмен', 'Клуб', 'Категория взноса', 'Способ оплаты', 'Сумма (₽)', 'Статус', 'Фискальный чек ФД', 'ФПД'];
    const rows = payments.map(p => [
      p.orderNumber,
      p.paidAt ? new Date(p.paidAt).toLocaleString('ru-RU') : 'Не оплачен',
      `"${p.payerName}"`,
      `"${p.participantName || '-'}"`,
      `"${p.clubName}"`,
      p.feeCategory,
      p.paymentMethod,
      p.amountRub,
      p.status,
      p.fiscalReceiptNumber || '-',
      p.fiscalSign || '-'
    ]);

    const csvContent = '\uFEFF' + [headers.join(';'), ...rows.map(r => r.join(';'))].join('\r\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', `reestr_platezhey_${tournament.slug || 'wkf_tournament'}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const getMethodBadge = (method: PaymentMethodType) => {
    switch (method) {
      case 'sbp_qr':
        return (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-lg bg-teal-950/80 text-teal-300 border border-teal-800 text-[11px] font-mono font-bold">
            <QrCode className="w-3 h-3 text-teal-400" />
            СБП QR
          </span>
        );
      case 'card':
        return (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-lg bg-indigo-950/80 text-indigo-300 border border-indigo-800 text-[11px] font-mono font-bold">
            <CreditCard className="w-3 h-3 text-indigo-400" />
            Карта МИР
          </span>
        );
      case 'club_invoice':
        return (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-lg bg-amber-950/80 text-amber-300 border border-amber-800 text-[11px] font-mono font-bold">
            <Building2 className="w-3 h-3 text-amber-400" />
            Счет юрлица
          </span>
        );
      case 'tpay':
        return (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-lg bg-yellow-950/80 text-yellow-300 border border-yellow-800 text-[11px] font-mono font-bold">
            <Smartphone className="w-3 h-3 text-yellow-400" />
            T-Pay
          </span>
        );
      default:
        return (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-lg bg-slate-800 text-slate-300 border border-slate-700 text-[11px] font-mono font-bold">
            <DollarSign className="w-3 h-3 text-emerald-400" />
            Касса мандата
          </span>
        );
    }
  };

  const getStatusBadge = (status: PaymentStatus) => {
    switch (status) {
      case 'paid':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-emerald-950/90 text-emerald-300 border border-emerald-600/60 text-xs font-mono font-bold">
            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
            Оплачено
          </span>
        );
      case 'pending':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-amber-950/90 text-amber-300 border border-amber-600/60 text-xs font-mono font-bold">
            <Clock className="w-3.5 h-3.5 text-amber-400 animate-pulse" />
            Ожидает
          </span>
        );
      case 'refunded':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-rose-950/90 text-rose-300 border border-rose-600/60 text-xs font-mono font-bold">
            <RotateCcw className="w-3.5 h-3.5 text-rose-400" />
            Возврат
          </span>
        );
      default:
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-slate-800 text-slate-400 border border-slate-700 text-xs font-mono">
            Ошибка
          </span>
        );
    }
  };

  return (
    <div className="space-y-6 pb-12 font-sans selection:bg-blue-600 selection:text-white">
      {/* Top Banner Header */}
      <div className="p-6 rounded-3xl bg-gradient-to-r from-slate-900 via-slate-900/90 to-blue-950/60 border border-slate-800 shadow-xl relative overflow-hidden">
        <div className="absolute right-0 top-0 bottom-0 w-80 bg-gradient-to-l from-emerald-500/10 to-transparent pointer-events-none" />
        
        <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4 relative z-10">
          <div>
            <div className="flex items-center gap-2 mb-2">
              <span className="px-2.5 py-0.5 rounded-full bg-emerald-950 text-emerald-300 border border-emerald-700/80 text-xs font-mono font-bold flex items-center gap-1.5">
                <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
                Платежный шлюз СБП · ФЗ-54 Онлайн-Касса
              </span>
              <span className="text-slate-500 font-mono text-xs">· Эквайринг соревнований</span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-black font-mono tracking-tight text-white">
              Оплата стартовых взносов и Эквайринг
            </h1>
            <p className="text-sm text-slate-400 font-mono mt-1">
              Прием платежей через СБП с динамическим QR, банковские карты МИР/Visa, безналичные счета для клубов
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2.5 shrink-0">
            <button
              onClick={handleExportCsv}
              className="px-3.5 py-2 rounded-2xl bg-slate-800 hover:bg-slate-700 text-slate-200 hover:text-white border border-slate-700 text-xs font-mono font-bold transition-all cursor-pointer flex items-center gap-2 shadow-sm"
              title="Выгрузить реестр транзакций в CSV для бухгалтерии"
            >
              <Download className="w-4 h-4 text-sky-400" />
              <span>Реестр платежей (CSV)</span>
            </button>

            <button
              onClick={() => {
                setCheckoutStep('details');
                setIsCheckoutOpen(true);
              }}
              className="px-4 py-2 rounded-2xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white text-xs font-mono font-bold transition-all cursor-pointer flex items-center gap-2 shadow-lg shadow-emerald-900/30 hover:scale-[1.02]"
            >
              <Plus className="w-4 h-4" />
              <span>Принять оплату взноса</span>
            </button>
          </div>
        </div>

        {/* 4 Financial KPI Stat Cards */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3.5 mt-6 pt-6 border-t border-slate-800/80">
          <div className="p-4 rounded-2xl bg-slate-950/60 border border-slate-800/90 shadow-sm">
            <div className="flex items-center justify-between text-xs font-mono text-slate-400 mb-1">
              <span>Собрано взносов</span>
              <DollarSign className="w-4 h-4 text-emerald-400" />
            </div>
            <div className="text-2xl font-black font-mono text-emerald-300">
              {stats.totalRevenue.toLocaleString('ru-RU')} ₽
            </div>
            <div className="text-[11px] font-mono text-slate-500 mt-1 flex items-center gap-1">
              <span className="text-emerald-400 font-bold">94%</span> от планового фонда
            </div>
          </div>

          <div className="p-4 rounded-2xl bg-slate-950/60 border border-slate-800/90 shadow-sm">
            <div className="flex items-center justify-between text-xs font-mono text-slate-400 mb-1">
              <span>Оплачено заявок</span>
              <CheckCircle2 className="w-4 h-4 text-blue-400" />
            </div>
            <div className="text-2xl font-black font-mono text-white">
              {stats.paidCount} <span className="text-sm font-normal text-slate-400">платежей</span>
            </div>
            <div className="text-[11px] font-mono text-slate-500 mt-1">
              Успешно фискализировано
            </div>
          </div>

          <div className="p-4 rounded-2xl bg-slate-950/60 border border-slate-800/90 shadow-sm">
            <div className="flex items-center justify-between text-xs font-mono text-slate-400 mb-1">
              <span>Ожидают оплаты</span>
              <Clock className="w-4 h-4 text-amber-400" />
            </div>
            <div className="text-2xl font-black font-mono text-amber-300">
              {stats.pendingCount} <span className="text-sm font-normal text-slate-400">заявок</span>
            </div>
            <div className="text-[11px] font-mono text-amber-400/80 mt-1">
              Счета выставлены клубам
            </div>
          </div>

          <div className="p-4 rounded-2xl bg-slate-950/60 border border-slate-800/90 shadow-sm">
            <div className="flex items-center justify-between text-xs font-mono text-slate-400 mb-1">
              <span>Каналы эквайринга</span>
              <Percent className="w-4 h-4 text-purple-400" />
            </div>
            <div className="text-sm font-bold font-mono text-slate-200 space-y-1 mt-1">
              <div className="flex justify-between text-[11px]">
                <span className="text-teal-300">СБП QR:</span>
                <span>{stats.sbpSharePct}%</span>
              </div>
              <div className="flex justify-between text-[11px]">
                <span className="text-indigo-300">Карты:</span>
                <span>{stats.cardSharePct}%</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="p-4 rounded-2xl bg-slate-900 border border-slate-800 flex flex-wrap items-center justify-between gap-3 text-xs font-mono">
        <div className="flex items-center gap-2 flex-1 min-w-[240px]">
          <div className="relative flex-1">
            <Search className="w-4 h-4 text-slate-500 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Поиск по спортсмену, клубу, номеру заказа или чеку..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full bg-slate-950 border border-slate-700/80 rounded-xl pl-9 pr-3 py-2 text-slate-200 placeholder-slate-500 focus:outline-none focus:border-blue-500 text-xs font-mono"
            />
          </div>
        </div>

        {/* Status Pills */}
        <div className="flex items-center gap-1.5 overflow-x-auto py-0.5">
          <span className="text-slate-500 font-bold">Статус:</span>
          {(['all', 'paid', 'pending', 'refunded'] as const).map((st) => (
            <button
              key={st}
              onClick={() => setStatusFilter(st)}
              className={`px-3 py-1.5 rounded-xl transition-all cursor-pointer ${
                statusFilter === st
                  ? 'bg-blue-600 text-white font-bold shadow'
                  : 'bg-slate-800 text-slate-400 hover:text-white'
              }`}
            >
              {st === 'all' ? 'Все' : st === 'paid' ? 'Оплачено' : st === 'pending' ? 'Ожидает' : 'Возврат'}
            </button>
          ))}
        </div>

        {/* Method Filter */}
        <div className="flex items-center gap-1.5">
          <span className="text-slate-500 font-bold">Метод:</span>
          <select
            value={methodFilter}
            onChange={(e) => setMethodFilter(e.target.value as any)}
            className="bg-slate-950 border border-slate-700 rounded-xl px-2.5 py-1.5 text-xs text-slate-300 font-mono focus:border-blue-500 focus:outline-none"
          >
            <option value="all">Все методы</option>
            <option value="sbp_qr">СБП QR-код</option>
            <option value="card">Банковская карта</option>
            <option value="club_invoice">Счет юрлица</option>
            <option value="tpay">T-Pay</option>
            <option value="cash_mandate">Касса мандата</option>
          </select>
        </div>
      </div>

      {/* Main Table of Transactions */}
      <div className="rounded-2xl bg-slate-900 border border-slate-800 overflow-hidden shadow-lg">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs font-mono">
            <thead className="bg-slate-950/80 text-slate-400 uppercase text-[11px] border-b border-slate-800">
              <tr>
                <th className="py-3.5 px-4 font-bold">Заказ / Чек</th>
                <th className="py-3.5 px-4 font-bold">Спортсмен / Плательщик</th>
                <th className="py-3.5 px-4 font-bold">Клуб / Организация</th>
                <th className="py-3.5 px-4 font-bold">Способ оплаты</th>
                <th className="py-3.5 px-4 font-bold">Сумма взноса</th>
                <th className="py-3.5 px-4 font-bold">Статус</th>
                <th className="py-3.5 px-4 font-bold text-right">Действия</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/80 text-slate-200">
              {filteredPayments.length === 0 ? (
                <tr>
                  <td colSpan={7} className="py-12 text-center text-slate-500">
                    Транзакций по заданным критериям не найдено.
                  </td>
                </tr>
              ) : (
                filteredPayments.map((tx) => (
                  <tr key={tx.id} className="hover:bg-slate-800/50 transition-colors">
                    <td className="py-3.5 px-4">
                      <div className="font-bold text-white flex items-center gap-1.5">
                        <Receipt className="w-3.5 h-3.5 text-blue-400" />
                        <span>{tx.orderNumber}</span>
                      </div>
                      <div className="text-[10px] text-slate-400 mt-0.5">
                        {tx.fiscalReceiptNumber ? (
                          <button
                            onClick={() => setSelectedReceipt(tx)}
                            className="text-emerald-400 hover:underline cursor-pointer"
                          >
                            {tx.fiscalReceiptNumber} (54-ФЗ)
                          </button>
                        ) : (
                          'Без чека'
                        )}
                        {' · '}
                        {new Date(tx.createdAt).toLocaleTimeString('ru-RU', { hour: '2-digit', minute: '2-digit' })}
                      </div>
                    </td>

                    <td className="py-3.5 px-4">
                      <div className="font-bold text-slate-100">
                        {tx.participantName || tx.payerName}
                      </div>
                      <div className="text-[10px] text-slate-400 truncate max-w-[200px]">
                        {tx.payerEmail}
                      </div>
                    </td>

                    <td className="py-3.5 px-4">
                      <div className="text-slate-300 font-semibold">{tx.clubName}</div>
                      <div className="text-[10px] text-slate-500">{tx.categoryName || 'Индивидуальная заявка'}</div>
                    </td>

                    <td className="py-3.5 px-4">
                      {getMethodBadge(tx.paymentMethod)}
                    </td>

                    <td className="py-3.5 px-4">
                      <div className="font-black text-sm text-emerald-300">
                        {tx.amountRub.toLocaleString('ru-RU')} ₽
                      </div>
                      <div className="text-[10px] text-slate-500 uppercase">
                        {tx.feeCategory.replace('_', ' ')}
                      </div>
                    </td>

                    <td className="py-3.5 px-4">
                      {getStatusBadge(tx.status)}
                    </td>

                    <td className="py-3.5 px-4 text-right">
                      <div className="flex items-center justify-end gap-1.5">
                        {tx.fiscalReceiptNumber && (
                          <button
                            onClick={() => setSelectedReceipt(tx)}
                            className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white transition-colors cursor-pointer"
                            title="Открыть фискальный кассовый чек 54-ФЗ"
                          >
                            <FileText className="w-3.5 h-3.5 text-sky-400" />
                          </button>
                        )}

                        {tx.status === 'paid' && currentUserRole === 'admin' && (
                          <button
                            onClick={() => handleRefundTransaction(tx)}
                            className="p-1.5 rounded-lg bg-slate-800 hover:bg-rose-950 text-slate-400 hover:text-rose-300 transition-colors cursor-pointer"
                            title="Оформить возврат взноса"
                          >
                            <RotateCcw className="w-3.5 h-3.5" />
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* 1. Modal: Interactive Acquiring Checkout Simulator */}
      {isCheckoutOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-950/80 backdrop-blur-md animate-fadeIn">
          <div 
            className="w-full max-w-xl rounded-3xl bg-slate-900 border border-slate-700 shadow-2xl overflow-hidden flex flex-col text-slate-100"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Modal Header */}
            <div className="p-5 border-b border-slate-800 bg-slate-950/90 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="p-2.5 rounded-2xl bg-emerald-600/20 border border-emerald-500/40 text-emerald-400">
                  <CreditCard className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-base sm:text-lg font-bold font-mono text-white">
                    Касса соревнований · Оплата взноса
                  </h3>
                  <p className="text-xs text-slate-400 font-mono">
                    Безопасный эквайринг Uventex WKF 2026
                  </p>
                </div>
              </div>
              <button
                onClick={() => setIsCheckoutOpen(false)}
                className="p-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white"
              >
                ✕
              </button>
            </div>

            {/* Modal Body: Wizard Steps */}
            <div className="p-5 sm:p-6 overflow-y-auto max-h-[75vh] space-y-4 font-mono">
              {checkoutStep === 'details' && (
                <div className="space-y-4 animate-fadeIn">
                  <div>
                    <label className="text-xs text-slate-300 font-bold block mb-1.5">
                      Спортсмен или заявитель
                    </label>
                    <select
                      value={selectedParticipantId}
                      onChange={(e) => handleSelectParticipant(e.target.value)}
                      className="w-full bg-slate-950 border border-slate-700 rounded-2xl px-3 py-2.5 text-xs text-slate-200 focus:outline-none focus:border-blue-500"
                    >
                      <option value="">-- Выберите спортсмена из заявки турнира --</option>
                      {participants.map((p) => (
                        <option key={p.id} value={p.id}>
                          {p.lastName} {p.firstName} · {p.clubName} ({p.declaredWeightKg} кг)
                        </option>
                      ))}
                    </select>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div>
                      <label className="text-xs text-slate-300 font-bold block mb-1">
                        Категория платежа
                      </label>
                      <select
                        value={selectedFeeCategory}
                        onChange={(e) => {
                          const cat = e.target.value as FeeCategory;
                          setSelectedFeeCategory(cat);
                          if (cat === 'athlete_entry') setCustomAmountRub(3500);
                          else if (cat === 'team_entry') setCustomAmountRub(7000);
                          else if (cat === 'coach_license') setCustomAmountRub(1500);
                          else if (cat === 'medical_insurance') setCustomAmountRub(750);
                        }}
                        className="w-full bg-slate-950 border border-slate-700 rounded-2xl px-3 py-2.5 text-xs text-slate-200 focus:outline-none focus:border-blue-500"
                      >
                        <option value="athlete_entry">Стартовый взнос Кумитэ/Ката (3 500 ₽)</option>
                        <option value="team_entry">Командная заявка (7 000 ₽)</option>
                        <option value="medical_insurance">Страховка и медосмотр (750 ₽)</option>
                        <option value="coach_license">Лицензия тренера (1 500 ₽)</option>
                      </select>
                    </div>

                    <div>
                      <label className="text-xs text-slate-300 font-bold block mb-1">
                        Сумма к списанию (₽)
                      </label>
                      <input
                        type="number"
                        value={customAmountRub}
                        onChange={(e) => setCustomAmountRub(Number(e.target.value))}
                        className="w-full bg-slate-950 border border-slate-700 rounded-2xl px-3 py-2.5 text-xs text-emerald-300 font-bold font-mono focus:outline-none focus:border-blue-500"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="text-xs text-slate-300 font-bold block mb-1">
                      Плательщик (ФИО представителя или спортсмена)
                    </label>
                    <input
                      type="text"
                      placeholder="Иванов Даниил Сергеевич"
                      value={payerName}
                      onChange={(e) => setPayerName(e.target.value)}
                      className="w-full bg-slate-950 border border-slate-700 rounded-2xl px-3 py-2 text-xs text-slate-200 focus:outline-none focus:border-blue-500"
                    />
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div>
                      <label className="text-xs text-slate-300 font-bold block mb-1">
                        Email для электронного чека
                      </label>
                      <input
                        type="email"
                        placeholder="athlete@mail.ru"
                        value={payerEmail}
                        onChange={(e) => setPayerEmail(e.target.value)}
                        className="w-full bg-slate-950 border border-slate-700 rounded-2xl px-3 py-2 text-xs text-slate-200 focus:outline-none focus:border-blue-500"
                      />
                    </div>
                    <div>
                      <label className="text-xs text-slate-300 font-bold block mb-1">
                        Телефон
                      </label>
                      <input
                        type="text"
                        value={payerPhone}
                        onChange={(e) => setPayerPhone(e.target.value)}
                        className="w-full bg-slate-950 border border-slate-700 rounded-2xl px-3 py-2 text-xs text-slate-200 focus:outline-none focus:border-blue-500"
                      />
                    </div>
                  </div>

                  {/* Choice of Payment Method */}
                  <div>
                    <label className="text-xs text-slate-300 font-bold block mb-2">
                      Выберите платежный шлюз:
                    </label>
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                      <button
                        type="button"
                        onClick={() => setSelectedMethod('sbp_qr')}
                        className={`p-3 rounded-2xl border flex flex-col items-center justify-center gap-1.5 transition-all cursor-pointer ${
                          selectedMethod === 'sbp_qr'
                            ? 'bg-teal-950 border-teal-500 text-teal-300 shadow-lg'
                            : 'bg-slate-950/80 border-slate-800 text-slate-400 hover:text-white'
                        }`}
                      >
                        <QrCode className="w-5 h-5 text-teal-400" />
                        <span className="text-[11px] font-bold">СБП QR</span>
                      </button>

                      <button
                        type="button"
                        onClick={() => setSelectedMethod('card')}
                        className={`p-3 rounded-2xl border flex flex-col items-center justify-center gap-1.5 transition-all cursor-pointer ${
                          selectedMethod === 'card'
                            ? 'bg-indigo-950 border-indigo-500 text-indigo-300 shadow-lg'
                            : 'bg-slate-950/80 border-slate-800 text-slate-400 hover:text-white'
                        }`}
                      >
                        <CreditCard className="w-5 h-5 text-indigo-400" />
                        <span className="text-[11px] font-bold">Карта МИР</span>
                      </button>

                      <button
                        type="button"
                        onClick={() => setSelectedMethod('club_invoice')}
                        className={`p-3 rounded-2xl border flex flex-col items-center justify-center gap-1.5 transition-all cursor-pointer ${
                          selectedMethod === 'club_invoice'
                            ? 'bg-amber-950 border-amber-500 text-amber-300 shadow-lg'
                            : 'bg-slate-950/80 border-slate-800 text-slate-400 hover:text-white'
                        }`}
                      >
                        <Building2 className="w-5 h-5 text-amber-400" />
                        <span className="text-[11px] font-bold">Счет клубу</span>
                      </button>

                      <button
                        type="button"
                        onClick={() => setSelectedMethod('cash_mandate')}
                        className={`p-3 rounded-2xl border flex flex-col items-center justify-center gap-1.5 transition-all cursor-pointer ${
                          selectedMethod === 'cash_mandate'
                            ? 'bg-emerald-950 border-emerald-500 text-emerald-300 shadow-lg'
                            : 'bg-slate-950/80 border-slate-800 text-slate-400 hover:text-white'
                        }`}
                      >
                        <DollarSign className="w-5 h-5 text-emerald-400" />
                        <span className="text-[11px] font-bold">Касса мандата</span>
                      </button>
                    </div>
                  </div>

                  {/* SBP QR Code View */}
                  {selectedMethod === 'sbp_qr' && (
                    <div className="p-4 rounded-2xl bg-teal-950/30 border border-teal-800/60 flex flex-col sm:flex-row items-center gap-4">
                      {/* Authentic SVG QR code simulation */}
                      <div className="w-32 h-32 bg-white rounded-xl p-2 shrink-0 flex items-center justify-center shadow-md">
                        <svg viewBox="0 0 100 100" className="w-full h-full text-slate-900 fill-current">
                          {/* Corner Squares */}
                          <rect x="5" y="5" width="28" height="28" fill="none" stroke="currentColor" strokeWidth="6" />
                          <rect x="12" y="12" width="14" height="14" />
                          
                          <rect x="67" y="5" width="28" height="28" fill="none" stroke="currentColor" strokeWidth="6" />
                          <rect x="74" y="12" width="14" height="14" />

                          <rect x="5" y="67" width="28" height="28" fill="none" stroke="currentColor" strokeWidth="6" />
                          <rect x="12" y="74" width="14" height="14" />

                          {/* Data Matrix Dots */}
                          <rect x="40" y="10" width="8" height="8" />
                          <rect x="52" y="18" width="6" height="6" />
                          <rect x="40" y="28" width="10" height="10" />
                          <rect x="10" y="42" width="8" height="8" />
                          <rect x="24" y="42" width="6" height="6" />
                          <rect x="36" y="45" width="28" height="12" />
                          <rect x="70" y="42" width="10" height="8" />
                          <rect x="85" y="40" width="8" height="8" />
                          <rect x="42" y="65" width="12" height="12" />
                          <rect x="60" y="68" width="10" height="6" />
                          <rect x="75" y="65" width="18" height="18" />
                          <rect x="45" y="82" width="8" height="10" />
                        </svg>
                      </div>

                      <div className="space-y-1 text-center sm:text-left">
                        <div className="text-xs font-bold text-teal-300 flex items-center gap-1.5 justify-center sm:justify-start">
                          <QrCode className="w-4 h-4 text-teal-400" />
                          Динамический QR-код СБП готов к оплате
                        </div>
                        <p className="text-[11px] text-slate-300">
                          Откройте приложение любого банка (Сбер, Т-Банк, ВТБ, Альфа) и наведите камеру на QR-код.
                        </p>
                        <div className="text-[11px] text-teal-400 font-mono font-bold pt-1">
                          Сумма к оплате: {customAmountRub.toLocaleString('ru-RU')} ₽ · Без комиссии
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Card View Simulation */}
                  {selectedMethod === 'card' && (
                    <div className="p-4 rounded-2xl bg-indigo-950/30 border border-indigo-800/60 space-y-2.5">
                      <div className="text-xs font-bold text-indigo-300">
                        Данные карты МИР / Visa / Mastercard
                      </div>
                      <div>
                        <input
                          type="text"
                          value={cardDetails.number}
                          onChange={(e) => setCardDetails({ ...cardDetails, number: e.target.value })}
                          className="w-full bg-slate-950 border border-indigo-700/60 rounded-xl px-3 py-2 text-xs text-white font-mono"
                          placeholder="0000 0000 0000 0000"
                        />
                      </div>
                      <div className="grid grid-cols-2 gap-2">
                        <input
                          type="text"
                          value={cardDetails.exp}
                          onChange={(e) => setCardDetails({ ...cardDetails, exp: e.target.value })}
                          className="bg-slate-950 border border-indigo-700/60 rounded-xl px-3 py-2 text-xs text-white font-mono"
                          placeholder="MM/YY"
                        />
                        <input
                          type="password"
                          value={cardDetails.cvc}
                          onChange={(e) => setCardDetails({ ...cardDetails, cvc: e.target.value })}
                          className="bg-slate-950 border border-indigo-700/60 rounded-xl px-3 py-2 text-xs text-white font-mono"
                          placeholder="CVC"
                        />
                      </div>
                    </div>
                  )}

                  {/* Button to Execute */}
                  <div className="pt-2 flex justify-end gap-2">
                    <button
                      type="button"
                      onClick={() => setIsCheckoutOpen(false)}
                      className="px-4 py-2 rounded-2xl bg-slate-800 text-slate-300 hover:text-white text-xs font-mono"
                    >
                      Отмена
                    </button>
                    <button
                      type="button"
                      onClick={handleExecutePayment}
                      className="px-5 py-2 rounded-2xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white text-xs font-bold font-mono flex items-center gap-2 shadow-lg shadow-emerald-900/40 cursor-pointer"
                    >
                      <Check className="w-4 h-4" />
                      <span>Подтвердить оплату {customAmountRub.toLocaleString('ru-RU')} ₽</span>
                    </button>
                  </div>
                </div>
              )}

              {checkoutStep === 'processing' && (
                <div className="py-12 text-center space-y-3 animate-fadeIn">
                  <div className="w-12 h-12 rounded-full border-4 border-emerald-500 border-t-transparent animate-spin mx-auto" />
                  <h4 className="text-sm font-bold text-white">
                    Связь с банком-эквайером...
                  </h4>
                  <p className="text-xs text-slate-400">
                    Обработка авторизации, проверка лимитов и генерация фискального чека 54-ФЗ
                  </p>
                </div>
              )}

              {checkoutStep === 'success' && (
                <div className="py-8 text-center space-y-4 animate-fadeIn">
                  <div className="w-14 h-14 rounded-full bg-emerald-950 border border-emerald-500 text-emerald-400 flex items-center justify-center mx-auto shadow-lg">
                    <CheckCircle2 className="w-8 h-8" />
                  </div>
                  <div>
                    <h4 className="text-lg font-bold text-white">
                      Взнос успешно оплачен!
                    </h4>
                    <p className="text-xs text-slate-400 mt-1">
                      Платеж зарегистрирован, участник допущен к жеребьевке турнира
                    </p>
                  </div>

                  <div className="flex justify-center gap-2 pt-2">
                    <button
                      onClick={() => {
                        setIsCheckoutOpen(false);
                        setCheckoutStep('details');
                      }}
                      className="px-4 py-2 rounded-2xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-mono"
                    >
                      Закрыть
                    </button>
                    <button
                      onClick={() => {
                        setIsCheckoutOpen(false);
                      }}
                      className="px-4 py-2 rounded-2xl bg-blue-600 hover:bg-blue-500 text-white text-xs font-mono font-bold flex items-center gap-1.5"
                    >
                      <FileText className="w-4 h-4" />
                      <span>Посмотреть чек</span>
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* 2. Modal: Electronic Fiscal Receipt (54-ФЗ) */}
      {selectedReceipt && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-950/80 backdrop-blur-md animate-fadeIn">
          <div 
            className="w-full max-w-md rounded-3xl bg-slate-900 border border-slate-700 shadow-2xl overflow-hidden flex flex-col text-slate-100"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Header */}
            <div className="p-4 border-b border-slate-800 bg-slate-950 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Receipt className="w-4 h-4 text-emerald-400" />
                <span className="text-xs font-bold font-mono text-white">Электронный кассовый чек</span>
              </div>
              <button
                onClick={() => setSelectedReceipt(null)}
                className="text-slate-400 hover:text-white text-xs font-mono p-1"
              >
                ✕
              </button>
            </div>

            {/* Authentic Receipt Slip Layout */}
            <div className="p-6 bg-slate-950/90 text-slate-300 font-mono text-xs space-y-3 border-y border-dashed border-slate-800">
              <div className="text-center space-y-0.5 border-b border-dashed border-slate-800 pb-3">
                <div className="font-black text-white text-sm uppercase tracking-wider">
                  ООО «СПОРТИВНЫЕ СИСТЕМЫ UVENTEX»
                </div>
                <div className="text-[11px] text-slate-400">
                  ОФД: Первый ОФД · ККТ: 000491829104
                </div>
                <div className="text-[11px] text-slate-400">
                  ИНН: 7701928410 · Сайт ФНС: nalog.gov.ru
                </div>
              </div>

              <div className="flex justify-between text-[11px] text-slate-400">
                <span>ЧЕК № {selectedReceipt.fiscalReceiptNumber}</span>
                <span>ПРИХОД</span>
              </div>

              <div className="border-b border-dashed border-slate-800 pb-2 space-y-1">
                <div className="font-bold text-white">
                  {selectedReceipt.description || 'Стартовый взнос за участие в соревнованиях'}
                </div>
                <div className="flex justify-between text-slate-400 text-[11px]">
                  <span>1 шт × {selectedReceipt.amountRub.toLocaleString('ru-RU')} ₽</span>
                  <span className="text-white font-bold">{selectedReceipt.amountRub.toLocaleString('ru-RU')} ₽</span>
                </div>
                <div className="text-[10px] text-slate-500">
                  Ставка НДС: Без НДС (ст. 149 НК РФ)
                </div>
              </div>

              <div className="flex justify-between text-sm font-black text-white pt-1">
                <span>ИТОГ К ОПЛАТЕ:</span>
                <span className="text-emerald-400">{selectedReceipt.amountRub.toLocaleString('ru-RU')} ₽</span>
              </div>

              <div className="space-y-1 text-[10px] text-slate-400 border-t border-dashed border-slate-800 pt-2">
                <div className="flex justify-between">
                  <span>ФОРМА РАСЧЕТА:</span>
                  <span className="text-slate-200 uppercase">{selectedReceipt.paymentMethod}</span>
                </div>
                <div className="flex justify-between">
                  <span>ПЛАТЕЛЬЩИК:</span>
                  <span className="text-slate-200">{selectedReceipt.payerName}</span>
                </div>
                <div className="flex justify-between">
                  <span>ФД:</span>
                  <span className="text-slate-200">{selectedReceipt.fiscalReceiptNumber}</span>
                </div>
                <div className="flex justify-between">
                  <span>ФПД:</span>
                  <span className="text-slate-200">{selectedReceipt.fiscalSign || '9841029412'}</span>
                </div>
                <div className="flex justify-between">
                  <span>ДАТА/ВРЕМЯ:</span>
                  <span className="text-slate-200">{new Date(selectedReceipt.createdAt).toLocaleString('ru-RU')}</span>
                </div>
              </div>

              {/* QR Verification Code */}
              <div className="pt-2 text-center">
                <div className="w-24 h-24 bg-white rounded-lg p-1.5 mx-auto mb-1 flex items-center justify-center">
                  <svg viewBox="0 0 100 100" className="w-full h-full text-slate-900 fill-current">
                    <rect x="5" y="5" width="28" height="28" fill="none" stroke="currentColor" strokeWidth="6" />
                    <rect x="12" y="12" width="14" height="14" />
                    <rect x="67" y="5" width="28" height="28" fill="none" stroke="currentColor" strokeWidth="6" />
                    <rect x="74" y="12" width="14" height="14" />
                    <rect x="5" y="67" width="28" height="28" fill="none" stroke="currentColor" strokeWidth="6" />
                    <rect x="12" y="74" width="14" height="14" />
                    <rect x="40" y="20" width="15" height="15" />
                    <rect x="60" y="50" width="15" height="15" />
                    <rect x="25" y="45" width="15" height="15" />
                  </svg>
                </div>
                <div className="text-[10px] text-slate-500">
                  Проверка чека в приложении ФНС России
                </div>
              </div>
            </div>

            {/* Actions */}
            <div className="p-4 bg-slate-950 flex items-center justify-between gap-2">
              <button
                onClick={() => window.print()}
                className="px-3 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-mono flex items-center gap-1.5 cursor-pointer"
              >
                <Printer className="w-3.5 h-3.5" />
                <span>Печать</span>
              </button>

              <button
                onClick={() => {
                  alert(`Чек №${selectedReceipt.fiscalReceiptNumber} отправлен на ${selectedReceipt.payerEmail}`);
                  setSelectedReceipt(null);
                }}
                className="px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-500 text-white text-xs font-mono font-bold flex items-center gap-1.5 cursor-pointer"
              >
                <Send className="w-3.5 h-3.5" />
                <span>Отправить на Email</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
