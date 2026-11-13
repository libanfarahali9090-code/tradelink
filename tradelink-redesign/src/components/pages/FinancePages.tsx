import React, { useMemo, useState } from 'react';
import { motion } from 'motion/react';
import {
  ArrowUpDown,
  CheckCircle2,
  CreditCard,
  Download,
  Info,
  Percent,
  Plus,
  Search,
} from 'lucide-react';
import type {
  Buyer,
  CommissionRecord,
  CurrencyCode,
  FinancialTransaction,
  Language,
  Order,
  PaymentMethod,
  PaymentStatus,
  Product,
  Supplier,
  TransactionType,
} from '../../types/tradelink';
import { TRANSLATIONS, formatMoney } from '../../i18n/translations';
import { DURATIONS, EASE_SAAS, staggerItem } from '../../lib/motion';
import {
  AnimatedCounter,
  EmptyState,
  Modal,
  PaginationBar,
  StatusTag,
  exportToCsv,
} from '../ui/SaasPrimitives';
import { makeId } from '../../services/firestoreService';

export function PaymentsPage({
  lang,
  currency,
  orders,
  buyers,
  suppliers,
  onRecordPayment,
}: {
  lang: Language;
  currency: CurrencyCode;
  orders: Order[];
  buyers: Buyer[];
  suppliers: Supplier[];
  onRecordPayment: (params: {
    tx: Omit<FinancialTransaction, 'createdAt'>;
    order?: Order;
    nextOrderPaymentStatus?: PaymentStatus;
    buyer?: Buyer;
    supplier?: Supplier;
  }) => Promise<void>;
}) {
  const t = TRANSLATIONS[lang];
  const [modalOpen, setModalOpen] = useState(false);
  const [targetOrder, setTargetOrder] = useState<Order | null>(null);
  const [payType, setPayType] = useState<'buyer_payment' | 'supplier_payment'>('buyer_payment');
  const [partyId, setPartyId] = useState(buyers[0]?.id || '');
  const [amount, setAmount] = useState(0);
  const [method, setMethod] = useState<PaymentMethod>('bank_transfer');
  const [notes, setNotes] = useState('');
  const [formError, setFormError] = useState('');
  const [saving, setSaving] = useState(false);
  const [sortBy, setSortBy] = useState<'date' | 'amount'>('date');
  const [sortDir, setSortDir] = useState<'asc' | 'desc'>('desc');
  const [page, setPage] = useState(1);

  const unpaidOrders = useMemo(() => {
    const mult = sortDir === 'asc' ? 1 : -1;
    return orders
      .filter((o) => o.status !== 'cancelled' && o.paymentStatus !== 'paid')
      .sort((a, b) =>
        sortBy === 'amount'
          ? (a.totalAmount - b.totalAmount) * mult
          : a.orderDate.localeCompare(b.orderDate) * mult
      );
  }, [orders, sortBy, sortDir]);

  const pageSize = 8;
  const pagedUnpaid = unpaidOrders.slice((page - 1) * pageSize, page * pageSize);

  const totalReceivable = unpaidOrders.reduce((s, o) => s + o.totalAmount, 0);
  const totalPayable = suppliers.reduce((s, sup) => s + sup.outstandingBalance, 0);

  const openOrderPayment = (ord: Order) => {
    setTargetOrder(ord);
    setPayType('buyer_payment');
    setPartyId(ord.buyerId);
    setAmount(ord.totalAmount);
    setMethod('bank_transfer');
    setNotes(`Payment for ${ord.orderCode}`);
    setFormError('');
    setModalOpen(true);
  };

  return (
    <div className="space-y-5">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div>
          <h1 className="text-xl font-display font-bold text-ink">{t.nav.payments}</h1>
          <p className="text-xs text-muted mt-0.5">
            Track pending buyer invoices, supplier payables, and record Cash or Bank Transfer settlements.
          </p>
        </div>
        <motion.button
          type="button"
          whileHover={{ y: -1 }}
          whileTap={{ scale: 0.98 }}
          transition={{ duration: DURATIONS.button, ease: EASE_SAAS }}
          onClick={() => {
            setTargetOrder(null);
            setPayType('buyer_payment');
            setPartyId(buyers[0]?.id || '');
            setAmount(10000);
            setNotes('');
            setFormError('');
            setModalOpen(true);
          }}
          className="inline-flex items-center gap-1.5 px-3.5 py-2 text-xs font-medium rounded-[10px] bg-accent text-on-accent self-start sm:self-auto shadow-sm transition-colors"
        >
          <Plus className="w-3.5 h-3.5" />
          <span>Record payment</span>
        </motion.button>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <motion.div
          {...staggerItem(0, DURATIONS.dropdown)}
          className="bg-surface border border-hairline rounded-[14px] p-5 shadow-saas"
        >
          <div className="text-xs text-muted">Pending Buyer Receivables</div>
          <div
            style={{ color: 'var(--status-warn-fg)' }}
            className="text-2xl font-display font-bold tabular-nums mt-1"
          >
            <AnimatedCounter value={Math.round(totalReceivable)} prefix={`${currency} `} />
          </div>
          <div className="text-xs text-muted mt-1">{unpaidOrders.length} open invoices</div>
        </motion.div>
        <motion.div
          {...staggerItem(1, DURATIONS.dropdown)}
          className="bg-surface border border-hairline rounded-[14px] p-5 shadow-saas"
        >
          <div className="text-xs text-muted">Outstanding Supplier Balances</div>
          <div className="text-2xl font-display font-bold text-ink tabular-nums mt-1">
            <AnimatedCounter value={Math.round(totalPayable)} prefix={`${currency} `} />
          </div>
          <div className="text-xs text-muted mt-1">
            Across {suppliers.filter((s) => s.outstandingBalance > 0).length} suppliers
          </div>
        </motion.div>
      </div>

      {/* Unpaid Invoices Table / Mobile Cards */}
      <div className="bg-surface border border-hairline rounded-[14px] shadow-saas overflow-hidden">
        <div className="px-5 py-3.5 border-b border-hairline">
          <h2 className="text-sm font-semibold text-ink">Pending Buyer Invoices</h2>
        </div>

        <div className="md:hidden divide-y divide-hairline">
          {pagedUnpaid.map((o) => (
            <div key={o.id} className="p-4 space-y-2">
              <div className="flex items-center justify-between">
                <span className="font-mono text-xs font-semibold text-ink">{o.orderCode}</span>
                <StatusTag tone="amber" label={o.paymentStatus} />
              </div>
              <div className="text-xs text-ink font-medium">{o.buyerName}</div>
              <div className="flex items-center justify-between pt-1">
                <span className="font-mono text-xs font-bold text-ink">
                  {formatMoney(o.totalAmount, o.currency)}
                </span>
                <button
                  type="button"
                  onClick={() => openOrderPayment(o)}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-accent text-on-accent text-xs font-medium"
                >
                  <CreditCard className="w-3.5 h-3.5" />
                  <span>Settle</span>
                </button>
              </div>
            </div>
          ))}
          {unpaidOrders.length === 0 && (
            <div className="p-6 text-center text-xs text-muted">
              All active buyer orders have been paid in full.
            </div>
          )}
        </div>

        <div className="hidden md:block overflow-x-auto max-h-[500px]">
          <table className="w-full text-left border-collapse text-xs">
            <thead className="sticky top-0 z-10 bg-surface border-b border-hairline text-muted">
              <tr>
                <th className="py-3 px-4 font-medium">Order</th>
                <th className="py-3 px-4 font-medium">Buyer</th>
                <th className="py-3 px-4 font-medium">
                  <button
                    type="button"
                    onClick={() => {
                      setSortBy('date');
                      setSortDir((d) => (d === 'asc' ? 'desc' : 'asc'));
                    }}
                    className="inline-flex items-center gap-1 hover:text-ink"
                  >
                    <span>Date</span>
                    <ArrowUpDown className="w-3 h-3" />
                  </button>
                </th>
                <th className="py-3 px-4 font-medium text-right">
                  <button
                    type="button"
                    onClick={() => {
                      setSortBy('amount');
                      setSortDir((d) => (d === 'asc' ? 'desc' : 'asc'));
                    }}
                    className="inline-flex items-center gap-1 hover:text-ink"
                  >
                    <span>Amount Due</span>
                    <ArrowUpDown className="w-3 h-3" />
                  </button>
                </th>
                <th className="py-3 px-4 font-medium">Status</th>
                <th className="py-3 px-4 font-medium text-right">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-hairline">
              {pagedUnpaid.map((o) => (
                <tr key={o.id} className="bg-hover transition-colors">
                  <td className="py-3 px-4 font-mono font-semibold text-ink">{o.orderCode}</td>
                  <td className="py-3 px-4 font-medium text-ink">{o.buyerName}</td>
                  <td className="py-3 px-4 font-mono text-muted">{o.orderDate}</td>
                  <td className="py-3 px-4 text-right font-mono font-bold text-ink tabular-nums">
                    {formatMoney(o.totalAmount, o.currency)}
                  </td>
                  <td className="py-3 px-4">
                    <StatusTag tone="amber" label={o.paymentStatus} />
                  </td>
                  <td className="py-3 px-4 text-right">
                    <button
                      type="button"
                      onClick={() => openOrderPayment(o)}
                      className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-accent text-on-accent font-medium transition-colors"
                    >
                      <CreditCard className="w-3.5 h-3.5" />
                      <span>Settle</span>
                    </button>
                  </td>
                </tr>
              ))}
              {unpaidOrders.length === 0 && (
                <tr>
                  <td colSpan={6} className="py-8 text-center text-muted">
                    All active buyer orders have been paid in full.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
        <PaginationBar
          page={page}
          totalItems={unpaidOrders.length}
          pageSize={pageSize}
          onPageChange={setPage}
          showingLabel={t.common.showing}
        />
      </div>

      {/* Record Payment Modal */}
      <Modal
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        title={targetOrder ? `Collect Payment · ${targetOrder.orderCode}` : 'Record Financial Payment'}
      >
        <form
          noValidate
          onSubmit={async (e) => {
            e.preventDefault();
            if (!Number.isFinite(amount) || amount <= 0) {
              setFormError(t.form.invalidNumber);
              return;
            }
            setFormError('');
            setSaving(true);
            try {
              const buyerObj =
                payType === 'buyer_payment'
                  ? buyers.find((b) => b.id === (targetOrder?.buyerId || partyId))
                  : undefined;
              const supplierObj =
                payType === 'supplier_payment'
                  ? suppliers.find((s) => s.id === partyId)
                  : undefined;

              await onRecordPayment({
                tx: {
                  id: makeId('tx'),
                  txCode: `TX-${Math.floor(1000 + Math.random() * 8999)}`,
                  type: payType,
                  partyId: buyerObj?.id || supplierObj?.id,
                  partyName: buyerObj?.businessName || supplierObj?.name || 'Counterparty',
                  orderId: targetOrder?.id,
                  amount: Math.max(0, Number(amount) || 0),
                  currency,
                  method,
                  status: 'completed',
                  date: new Date().toISOString().slice(0, 10),
                  notes: notes || undefined,
                },
                order: targetOrder || undefined,
                nextOrderPaymentStatus:
                  targetOrder && amount >= targetOrder.totalAmount
                    ? 'paid'
                    : targetOrder
                      ? 'partial'
                      : undefined,
                buyer: buyerObj,
                supplier: supplierObj,
              });
              setModalOpen(false);
            } finally {
              setSaving(false);
            }
          }}
          className="space-y-3.5 text-xs"
        >
          {!targetOrder && (
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block font-medium text-ink mb-1">Payment Type</label>
                <select
                  value={payType}
                  onChange={(e) => {
                    const nextType = e.target.value as 'buyer_payment' | 'supplier_payment';
                    setPayType(nextType);
                    setPartyId(
                      nextType === 'buyer_payment' ? buyers[0]?.id || '' : suppliers[0]?.id || ''
                    );
                  }}
                  className="w-full px-3 py-2 rounded-[10px] bg-subtle border border-hairline text-ink"
                >
                  <option value="buyer_payment">Buyer Payment Received</option>
                  <option value="supplier_payment">Supplier Payment Sent</option>
                </select>
              </div>
              <div>
                <label className="block font-medium text-ink mb-1">Counterparty</label>
                <select
                  value={partyId}
                  onChange={(e) => setPartyId(e.target.value)}
                  className="w-full px-3 py-2 rounded-[10px] bg-subtle border border-hairline text-ink"
                >
                  {(payType === 'buyer_payment' ? buyers : suppliers).map((p) => (
                    <option key={p.id} value={p.id}>
                      {'businessName' in p ? p.businessName : p.name}
                    </option>
                  ))}
                </select>
              </div>
            </div>
          )}

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block font-medium text-ink mb-1">Amount ({currency}) *</label>
              <input
                type="number"
                min={1}
                value={amount}
                onChange={(e) => {
                  setAmount(Number(e.target.value));
                  setFormError('');
                }}
                className="w-full px-3 py-2 rounded-[10px] bg-subtle border border-hairline text-ink font-mono"
              />
            </div>
            <div>
              <label className="block font-medium text-ink mb-1">Method</label>
              <select
                value={method}
                onChange={(e) => setMethod(e.target.value as PaymentMethod)}
                className="w-full px-3 py-2 rounded-[10px] bg-subtle border border-hairline text-ink"
              >
                <option value="cash">Cash</option>
                <option value="bank_transfer">Bank Transfer</option>
                <option value="other">Other</option>
              </select>
            </div>
          </div>

          <div>
            <label className="block font-medium text-ink mb-1">Reference / Notes</label>
            <input
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              className="w-full px-3 py-2 rounded-[10px] bg-subtle border border-hairline text-ink"
              placeholder="CBE transaction ref or counter receipt"
            />
          </div>

          {formError && (
            <p style={{ color: 'var(--status-danger-fg)' }} className="text-[11px] font-medium">
              {formError}
            </p>
          )}

          <div className="flex justify-end gap-2 pt-2">
            <button
              type="button"
              onClick={() => setModalOpen(false)}
              className="px-4 py-2 rounded-[10px] border border-hairline text-ink bg-hover"
            >
              {t.common.cancel}
            </button>
            <button
              type="submit"
              disabled={saving}
              className="px-4 py-2 rounded-[10px] bg-accent text-on-accent font-medium"
            >
              {saving ? t.common.loading : 'Confirm Payment'}
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
}

export function CommissionsPage({
  lang,
  currency,
  commissions,
  commissionRatePercent,
  canSettle,
  onSettleCommission,
}: {
  lang: Language;
  currency: CurrencyCode;
  commissions: CommissionRecord[];
  commissionRatePercent: number;
  canSettle: boolean;
  onSettleCommission: (rec: CommissionRecord, method: PaymentMethod) => Promise<void>;
}) {
  const t = TRANSLATIONS[lang];
  const [settlingId, setSettlingId] = useState<string | null>(null);
  const [page, setPage] = useState(1);

  const totalAccrued = commissions.reduce((s, c) => s + c.commissionAmount, 0);
  const totalPaid = commissions
    .filter((c) => c.status === 'paid')
    .reduce((s, c) => s + c.commissionAmount, 0);
  const totalPending = totalAccrued - totalPaid;

  const pageSize = 10;
  const paged = commissions.slice((page - 1) * pageSize, page * pageSize);

  return (
    <div className="space-y-5">
      <div>
        <h1 className="text-xl font-display font-bold text-ink">{t.nav.commissions}</h1>
        <p className="text-xs text-muted mt-0.5">
          Platform commission ledger — strictly payable by the TradeLink Owner.
        </p>
      </div>

      {/* Explicit Owner-Payer Policy Notice */}
      <div className="p-4 rounded-[14px] bg-accent-subtle border border-accent flex items-start gap-3 text-xs">
        <Info className="w-4 h-4 text-accent shrink-0 mt-0.5" />
        <div>
          <div className="font-semibold text-ink">{t.common.ownerCommissionNotice}</div>
          <div className="text-muted mt-0.5">
            Current Owner platform fee rate:{' '}
            <strong className="font-mono text-ink">{commissionRatePercent}%</strong> on delivered orders.
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <motion.div
          {...staggerItem(0, DURATIONS.dropdown)}
          className="bg-surface border border-hairline rounded-[14px] p-4 shadow-saas"
        >
          <div className="text-xs text-muted">Total Owner Commission</div>
          <div className="text-xl font-display font-bold text-ink tabular-nums mt-1">
            <AnimatedCounter value={Math.round(totalAccrued)} prefix={`${currency} `} />
          </div>
        </motion.div>
        <motion.div
          {...staggerItem(1, DURATIONS.dropdown)}
          className="bg-surface border border-hairline rounded-[14px] p-4 shadow-saas"
        >
          <div className="text-xs text-muted">Settled by Owner</div>
          <div className="text-xl font-display font-bold text-accent tabular-nums mt-1">
            <AnimatedCounter value={Math.round(totalPaid)} prefix={`${currency} `} />
          </div>
        </motion.div>
        <motion.div
          {...staggerItem(2, DURATIONS.dropdown)}
          className="bg-surface border border-hairline rounded-[14px] p-4 shadow-saas"
        >
          <div className="text-xs text-muted">Pending Owner Settlement</div>
          <div
            style={{ color: 'var(--status-warn-fg)' }}
            className="text-xl font-display font-bold tabular-nums mt-1"
          >
            <AnimatedCounter value={Math.round(totalPending)} prefix={`${currency} `} />
          </div>
        </motion.div>
      </div>

      {commissions.length === 0 ? (
        <EmptyState
          icon={<Percent className="w-6 h-6" />}
          title="No commission records yet"
          description="Platform commissions accrue automatically when wholesale orders reach Delivered status."
        />
      ) : (
        <div className="bg-surface border border-hairline rounded-[14px] shadow-saas overflow-hidden">
          <div className="md:hidden divide-y divide-hairline">
            {paged.map((c) => (
              <div key={c.id} className="p-4 space-y-2">
                <div className="flex items-center justify-between">
                  <span className="font-mono text-xs font-semibold text-ink">{c.orderCode}</span>
                  <StatusTag
                    tone={c.status === 'paid' ? 'emerald' : 'amber'}
                    label={c.status}
                  />
                </div>
                <div className="text-xs text-ink">{c.productName}</div>
                <div className="flex items-center justify-between text-xs">
                  <span className="text-muted">Owner ({c.ratePercent}%)</span>
                  <span className="font-mono font-bold text-ink">
                    {formatMoney(c.commissionAmount, c.currency)}
                  </span>
                </div>
                {c.status === 'pending' && canSettle && (
                  <button
                    type="button"
                    disabled={settlingId === c.id}
                    onClick={async () => {
                      setSettlingId(c.id);
                      try {
                        await onSettleCommission(c, 'bank_transfer');
                      } finally {
                        setSettlingId(null);
                      }
                    }}
                    className="w-full py-1.5 rounded-lg bg-accent text-on-accent text-xs font-medium disabled:opacity-50"
                  >
                    Settle Owner Fee
                  </button>
                )}
              </div>
            ))}
          </div>

          <div className="hidden md:block overflow-x-auto max-h-[540px]">
            <table className="w-full text-left border-collapse text-xs">
              <thead className="sticky top-0 z-10 bg-surface border-b border-hairline text-muted">
                <tr>
                  <th className="py-3 px-4 font-medium">Order</th>
                  <th className="py-3 px-4 font-medium">Product</th>
                  <th className="py-3 px-4 font-medium text-right">Order Sale</th>
                  <th className="py-3 px-4 font-medium text-right">Rate</th>
                  <th className="py-3 px-4 font-medium text-right">Commission</th>
                  <th className="py-3 px-4 font-medium">Payer</th>
                  <th className="py-3 px-4 font-medium">Status</th>
                  <th className="py-3 px-4 font-medium text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-hairline">
                {paged.map((c) => (
                  <tr key={c.id} className="bg-hover transition-colors">
                    <td className="py-3 px-4 font-mono font-semibold text-ink">{c.orderCode}</td>
                    <td className="py-3 px-4 text-ink">{c.productName}</td>
                    <td className="py-3 px-4 text-right font-mono tabular-nums text-muted">
                      {formatMoney(c.saleAmount, c.currency)}
                    </td>
                    <td className="py-3 px-4 text-right font-mono tabular-nums text-ink">
                      {c.ratePercent}%
                    </td>
                    <td className="py-3 px-4 text-right font-mono tabular-nums font-bold text-ink">
                      {formatMoney(c.commissionAmount, c.currency)}
                    </td>
                    <td className="py-3 px-4">
                      <span className="inline-flex items-center gap-1 text-accent font-medium">
                        <Percent className="w-3 h-3" />
                        Owner
                      </span>
                    </td>
                    <td className="py-3 px-4">
                      <StatusTag
                        tone={c.status === 'paid' ? 'emerald' : 'amber'}
                        label={c.status}
                      />
                    </td>
                    <td className="py-3 px-4 text-right">
                      {c.status === 'pending' && canSettle ? (
                        <button
                          type="button"
                          disabled={settlingId === c.id}
                          onClick={async () => {
                            setSettlingId(c.id);
                            try {
                              await onSettleCommission(c, 'bank_transfer');
                            } finally {
                              setSettlingId(null);
                            }
                          }}
                          className="inline-flex items-center gap-1 px-3 py-1 rounded-lg bg-accent text-on-accent font-medium disabled:opacity-50"
                        >
                          <CheckCircle2 className="w-3 h-3" />
                          <span>Settle</span>
                        </button>
                      ) : (
                        <span className="text-muted">—</span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <PaginationBar
            page={page}
            totalItems={commissions.length}
            pageSize={pageSize}
            onPageChange={setPage}
            showingLabel={t.common.showing}
          />
        </div>
      )}
    </div>
  );
}

export function TransactionsPage({
  lang,
  transactions,
}: {
  lang: Language;
  transactions: FinancialTransaction[];
}) {
  const t = TRANSLATIONS[lang];
  const [search, setSearch] = useState('');
  const [typeFilter, setTypeFilter] = useState<'all' | TransactionType>('all');
  const [sortBy, setSortBy] = useState<'date' | 'amount'>('date');
  const [sortDir, setSortDir] = useState<'asc' | 'desc'>('desc');
  const [page, setPage] = useState(1);

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    const mult = sortDir === 'asc' ? 1 : -1;
    return transactions
      .filter((tx) => (typeFilter === 'all' ? true : tx.type === typeFilter))
      .filter(
        (tx) =>
          !q ||
          tx.txCode.toLowerCase().includes(q) ||
          tx.partyName.toLowerCase().includes(q) ||
          (tx.notes || '').toLowerCase().includes(q)
      )
      .sort((a, b) =>
        sortBy === 'amount'
          ? (a.amount - b.amount) * mult
          : a.date.localeCompare(b.date) * mult
      );
  }, [transactions, search, typeFilter, sortBy, sortDir]);

  const pageSize = 10;
  const paged = filtered.slice((page - 1) * pageSize, page * pageSize);

  return (
    <div className="space-y-5">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div>
          <h1 className="text-xl font-display font-bold text-ink">{t.nav.transactions}</h1>
          <p className="text-xs text-muted mt-0.5">
            Unified Cash, Bank Transfer, and Other transaction history.
          </p>
        </div>
        <button
          type="button"
          onClick={() =>
            exportToCsv(
              'tradelink-transactions.csv',
              filtered.map((tx) => ({
                Code: tx.txCode,
                Date: tx.date,
                Type: tx.type,
                Party: tx.partyName,
                Method: tx.method,
                Amount: tx.amount,
                Currency: tx.currency,
                Status: tx.status,
              }))
            )
          }
          className="inline-flex items-center gap-1.5 px-3.5 py-2 text-xs font-medium rounded-[10px] border border-hairline bg-surface bg-hover text-ink self-start sm:self-auto"
        >
          <Download className="w-3.5 h-3.5" />
          <span>{t.common.exportCsv}</span>
        </button>
      </div>

      <div className="bg-surface border border-hairline rounded-[14px] p-3.5 shadow-saas flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="w-4 h-4 text-muted absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            value={search}
            onChange={(e) => {
              setSearch(e.target.value);
              setPage(1);
            }}
            placeholder="Search TX code, counterparty, or memo..."
            className="w-full pl-9 pr-3 py-2 text-xs bg-subtle border border-hairline rounded-[10px] text-ink"
          />
        </div>
        <select
          value={typeFilter}
          onChange={(e) => {
            setTypeFilter(e.target.value as 'all' | TransactionType);
            setPage(1);
          }}
          className="px-3 py-2 text-xs bg-subtle border border-hairline rounded-[10px] text-ink"
        >
          <option value="all">All types</option>
          <option value="buyer_payment">Buyer Payment</option>
          <option value="supplier_payment">Supplier Payment</option>
          <option value="purchase_expense">Purchase Expense</option>
          <option value="commission_payment">Owner Commission</option>
        </select>
      </div>

      {filtered.length === 0 ? (
        <EmptyState
          icon={<CreditCard className="w-6 h-6" />}
          title="No matching transactions"
          description="Try clearing your search or selecting a different transaction type."
        />
      ) : (
        <div className="bg-surface border border-hairline rounded-[14px] shadow-saas overflow-hidden">
          <div className="md:hidden divide-y divide-hairline">
            {paged.map((tx) => (
              <div key={tx.id} className="p-4 space-y-1.5">
                <div className="flex items-center justify-between">
                  <span className="font-mono text-xs font-semibold text-ink">{tx.txCode}</span>
                  <StatusTag
                    tone={tx.status === 'completed' ? 'emerald' : 'amber'}
                    label={tx.status}
                  />
                </div>
                <div className="text-xs font-medium text-ink">{tx.partyName}</div>
                <div className="flex items-center justify-between text-xs text-muted">
                  <span className="capitalize">
                    {tx.date} · {tx.method.replace('_', ' ')}
                  </span>
                  <span className="font-mono font-semibold text-ink">
                    {formatMoney(tx.amount, tx.currency)}
                  </span>
                </div>
              </div>
            ))}
          </div>

          <div className="hidden md:block overflow-x-auto max-h-[540px]">
            <table className="w-full text-left border-collapse text-xs">
              <thead className="sticky top-0 z-10 bg-surface border-b border-hairline text-muted">
                <tr>
                  <th className="py-3 px-4 font-medium">TX Code</th>
                  <th className="py-3 px-4 font-medium">
                    <button
                      type="button"
                      onClick={() => {
                        setSortBy('date');
                        setSortDir((d) => (d === 'asc' ? 'desc' : 'asc'));
                      }}
                      className="inline-flex items-center gap-1 hover:text-ink"
                    >
                      <span>Date</span>
                      <ArrowUpDown className="w-3 h-3" />
                    </button>
                  </th>
                  <th className="py-3 px-4 font-medium">Type</th>
                  <th className="py-3 px-4 font-medium">Party</th>
                  <th className="py-3 px-4 font-medium">Method</th>
                  <th className="py-3 px-4 font-medium text-right">
                    <button
                      type="button"
                      onClick={() => {
                        setSortBy('amount');
                        setSortDir((d) => (d === 'asc' ? 'desc' : 'asc'));
                      }}
                      className="inline-flex items-center gap-1 hover:text-ink"
                    >
                      <span>Amount</span>
                      <ArrowUpDown className="w-3 h-3" />
                    </button>
                  </th>
                  <th className="py-3 px-4 font-medium">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-hairline">
                {paged.map((tx) => (
                  <tr key={tx.id} className="bg-hover transition-colors">
                    <td className="py-3 px-4 font-mono font-semibold text-ink">{tx.txCode}</td>
                    <td className="py-3 px-4 font-mono text-muted">{tx.date}</td>
                    <td className="py-3 px-4 capitalize text-ink">{tx.type.replace('_', ' ')}</td>
                    <td className="py-3 px-4 font-medium text-ink">{tx.partyName}</td>
                    <td className="py-3 px-4 capitalize text-muted">
                      {tx.method.replace('_', ' ')}
                    </td>
                    <td className="py-3 px-4 text-right font-mono font-semibold tabular-nums text-ink">
                      {formatMoney(tx.amount, tx.currency)}
                    </td>
                    <td className="py-3 px-4">
                      <StatusTag
                        tone={tx.status === 'completed' ? 'emerald' : 'amber'}
                        label={tx.status}
                      />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <PaginationBar
            page={page}
            totalItems={filtered.length}
            pageSize={pageSize}
            onPageChange={setPage}
            showingLabel={t.common.showing}
          />
        </div>
      )}
    </div>
  );
}

export function FinancialReportsPage({
  lang,
  currency,
  orders,
  products,
  transactions,
  commissions,
}: {
  lang: Language;
  currency: CurrencyCode;
  orders: Order[];
  products: Product[];
  transactions: FinancialTransaction[];
  commissions: CommissionRecord[];
}) {
  const t = TRANSLATIONS[lang];

  const report = useMemo(() => {
    const validOrders = orders.filter((o) => o.status !== 'cancelled');
    const grossRevenue = validOrders.reduce((s, o) => s + o.totalAmount, 0);
    const estimatedCogs = validOrders.reduce((s, o) => {
      const prod = products.find((p) => p.id === o.productId);
      return s + (prod ? prod.purchasePrice * o.quantity : o.totalAmount * 0.82);
    }, 0);
    const ownerCommissionCost = commissions.reduce((s, c) => s + c.commissionAmount, 0);
    const expenses = transactions
      .filter((tx) => tx.type === 'purchase_expense')
      .reduce((s, tx) => s + tx.amount, 0);
    const grossProfit = grossRevenue - estimatedCogs;
    const netProfit = grossProfit - ownerCommissionCost - expenses;

    const byMethod = {
      cash: transactions
        .filter((tx) => tx.method === 'cash')
        .reduce((s, tx) => s + tx.amount, 0),
      bank_transfer: transactions
        .filter((tx) => tx.method === 'bank_transfer')
        .reduce((s, tx) => s + tx.amount, 0),
      other: transactions
        .filter((tx) => tx.method === 'other')
        .reduce((s, tx) => s + tx.amount, 0),
    };

    return {
      grossRevenue,
      estimatedCogs,
      grossProfit,
      ownerCommissionCost,
      expenses,
      netProfit,
      byMethod,
    };
  }, [orders, products, transactions, commissions]);

  return (
    <div className="space-y-5">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div>
          <h1 className="text-xl font-display font-bold text-ink">{t.nav.financial_reports}</h1>
          <p className="text-xs text-muted mt-0.5">
            Real-time P&L summary, payment channel breakdown, and exportable statements.
          </p>
        </div>
        <motion.button
          type="button"
          whileHover={{ y: -1 }}
          whileTap={{ scale: 0.98 }}
          transition={{ duration: DURATIONS.button, ease: EASE_SAAS }}
          onClick={() =>
            exportToCsv('tradelink-financial-report.csv', [
              { Metric: 'Gross Sales Revenue', Amount: Math.round(report.grossRevenue), Currency: currency },
              { Metric: 'Estimated Cost of Goods', Amount: Math.round(report.estimatedCogs), Currency: currency },
              { Metric: 'Gross Margin', Amount: Math.round(report.grossProfit), Currency: currency },
              { Metric: 'Owner Platform Commissions', Amount: Math.round(report.ownerCommissionCost), Currency: currency },
              { Metric: 'Operating / Freight Expenses', Amount: Math.round(report.expenses), Currency: currency },
              { Metric: 'Net Operating Profit', Amount: Math.round(report.netProfit), Currency: currency },
            ])
          }
          className="inline-flex items-center gap-1.5 px-3.5 py-2 text-xs font-medium rounded-[10px] bg-accent text-on-accent self-start sm:self-auto shadow-sm transition-colors"
        >
          <Download className="w-3.5 h-3.5" />
          <span>{t.common.exportCsv}</span>
        </motion.button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
        <div className="bg-surface border border-hairline rounded-[14px] p-5 space-y-3 text-xs shadow-saas">
          <h2 className="text-sm font-semibold text-ink">Income & Margin Statement</h2>
          <div className="divide-y divide-hairline">
            <div className="py-2.5 flex justify-between">
              <span className="text-muted">Gross Sales Revenue</span>
              <span className="font-mono font-semibold text-ink tabular-nums">
                {formatMoney(report.grossRevenue, currency)}
              </span>
            </div>
            <div className="py-2.5 flex justify-between">
              <span className="text-muted">Cost of Goods Sold (COGS)</span>
              <span
                style={{ color: 'var(--status-danger-fg)' }}
                className="font-mono tabular-nums"
              >
                - {formatMoney(report.estimatedCogs, currency)}
              </span>
            </div>
            <div className="py-2.5 flex justify-between font-semibold">
              <span className="text-ink">Gross Trading Profit</span>
              <span className="font-mono text-ink tabular-nums">
                {formatMoney(report.grossProfit, currency)}
              </span>
            </div>
            <div className="py-2.5 flex justify-between">
              <span className="text-muted">Owner Platform Commissions</span>
              <span className="font-mono text-muted tabular-nums">
                - {formatMoney(report.ownerCommissionCost, currency)}
              </span>
            </div>
            <div className="py-2.5 flex justify-between">
              <span className="text-muted">Logistics & Purchase Expenses</span>
              <span className="font-mono text-muted tabular-nums">
                - {formatMoney(report.expenses, currency)}
              </span>
            </div>
            <div className="pt-3 flex justify-between text-sm font-bold">
              <span className="text-ink">Net Operating Profit</span>
              <span className="font-mono text-accent tabular-nums">
                <AnimatedCounter value={Math.round(report.netProfit)} prefix={`${currency} `} />
              </span>
            </div>
          </div>
        </div>

        <div className="bg-surface border border-hairline rounded-[14px] p-5 space-y-4 text-xs shadow-saas">
          <h2 className="text-sm font-semibold text-ink">Payment Methods Breakdown</h2>
          <div className="space-y-3">
            {[
              { label: 'Bank Transfer', val: report.byMethod.bank_transfer },
              { label: 'Cash Counter', val: report.byMethod.cash },
              { label: 'Other Methods', val: report.byMethod.other },
            ].map((row, idx) => {
              const total =
                report.byMethod.bank_transfer + report.byMethod.cash + report.byMethod.other || 1;
              const pct = Math.round((row.val / total) * 100);
              return (
                <div key={row.label} className="space-y-1.5">
                  <div className="flex justify-between">
                    <span className="font-medium text-ink">{row.label}</span>
                    <span className="font-mono text-ink tabular-nums">
                      {formatMoney(row.val, currency)} ({pct}%)
                    </span>
                  </div>
                  <div className="h-2 rounded-full bg-subtle overflow-hidden">
                    <motion.div
                      initial={{ scaleX: 0 }}
                      animate={{ scaleX: 1 }}
                      transition={{
                        delay: idx * 0.05,
                        duration: 0.4,
                        ease: EASE_SAAS,
                      }}
                      style={{
                        width: `${pct}%`,
                        transformOrigin: 'left',
                        backgroundColor: 'var(--accent-primary)',
                      }}
                      className="h-full rounded-full"
                    />
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}
