import React, { useEffect, useMemo, useState } from 'react';
import { motion } from 'motion/react';
import {
  ArrowUpDown,
  CheckCircle2,
  Clock,
  Edit3,
  Eye,
  Plus,
  Printer,
  Search,
  ShoppingCart,
} from 'lucide-react';
import {
  ORDER_STATUS_FLOW,
  type Buyer,
  type CurrencyCode,
  type Language,
  type Order,
  type OrderHistoryEvent,
  type OrderStatus,
  type PaymentStatus,
  type Product,
} from '../../types/tradelink';
import { TRANSLATIONS, formatMoney } from '../../i18n/translations';
import { DURATIONS, EASE_SAAS, tabSlideTransition } from '../../lib/motion';
import {
  Drawer,
  EmptyState,
  Modal,
  PaginationBar,
  StatusTag,
} from '../ui/SaasPrimitives';
import { orderStatusTone } from './OverviewPage';
import { makeId } from '../../services/firestoreService';

const TIMELINE_STEPS: OrderStatus[] = [
  'pending',
  'confirmed',
  'processing',
  'ready_for_dispatch',
  'delivered',
];

export function OrdersPage({
  lang,
  currency,
  orders,
  products,
  buyers,
  onSaveOrder,
  onTransitionStatus,
  loadHistory,
  externalCreateOpen,
  onCloseExternalCreate,
  selectedOrderFromOutside,
  onClearExternalOrder,
}: {
  lang: Language;
  currency: CurrencyCode;
  orders: Order[];
  products: Product[];
  buyers: Buyer[];
  onSaveOrder: (
    order: Omit<Order, 'createdAt' | 'updatedAt'>,
    isNew: boolean
  ) => Promise<void>;
  onTransitionStatus: (order: Order, nextStatus: OrderStatus) => Promise<void>;
  loadHistory: (orderId: string) => Promise<OrderHistoryEvent[]>;
  externalCreateOpen: boolean;
  onCloseExternalCreate: () => void;
  selectedOrderFromOutside: Order | null;
  onClearExternalOrder: () => void;
}) {
  const t = TRANSLATIONS[lang];
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | OrderStatus>('all');
  const [dateFilter, setDateFilter] = useState('');
  const [sortBy, setSortBy] = useState<'date' | 'total' | 'code'>('date');
  const [sortDir, setSortDir] = useState<'asc' | 'desc'>('desc');
  const [page, setPage] = useState(1);

  const [modalOpen, setModalOpen] = useState(false);
  const [modalStep, setModalStep] = useState<1 | 2>(1);
  const [formErrors, setFormErrors] = useState<Record<string, string>>({});
  const [editing, setEditing] = useState<Order | null>(null);
  const [saving, setSaving] = useState(false);

  const [detailOrder, setDetailOrder] = useState<Order | null>(null);
  const [history, setHistory] = useState<OrderHistoryEvent[]>([]);
  const [historyLoading, setHistoryLoading] = useState(false);

  const [form, setForm] = useState({
    id: '',
    orderCode: '',
    buyerId: buyers[0]?.id || '',
    productId: products[0]?.id || '',
    quantity: 1,
    unitPrice: products[0]?.sellingPrice || 0,
    status: 'pending' as OrderStatus,
    paymentStatus: 'unpaid' as PaymentStatus,
    orderDate: new Date().toISOString().slice(0, 10),
    notes: '',
  });

  const openCreateModal = () => {
    const firstProd = products.find((p) => p.stockQty > 0) || products[0];
    setEditing(null);
    setModalStep(1);
    setFormErrors({});
    setForm({
      id: makeId('ord'),
      orderCode: `ORD-${Math.floor(1042 + Math.random() * 8900)}`,
      buyerId: buyers[0]?.id || '',
      productId: firstProd?.id || '',
      quantity: Math.min(5, Math.max(1, firstProd?.stockQty || 1)),
      unitPrice: firstProd?.sellingPrice || 0,
      status: 'pending',
      paymentStatus: 'unpaid',
      orderDate: new Date().toISOString().slice(0, 10),
      notes: '',
    });
    setModalOpen(true);
  };

  useEffect(() => {
    if (externalCreateOpen) {
      openCreateModal();
      onCloseExternalCreate();
    }
  }, [externalCreateOpen]);

  useEffect(() => {
    if (selectedOrderFromOutside) {
      openDetail(selectedOrderFromOutside);
      onClearExternalOrder();
    }
  }, [selectedOrderFromOutside]);

  const openEditModal = (ord: Order) => {
    setEditing(ord);
    setModalStep(1);
    setFormErrors({});
    setForm({
      id: ord.id,
      orderCode: ord.orderCode,
      buyerId: ord.buyerId,
      productId: ord.productId,
      quantity: ord.quantity,
      unitPrice: ord.unitPrice,
      status: ord.status,
      paymentStatus: ord.paymentStatus,
      orderDate: ord.orderDate,
      notes: ord.notes || '',
    });
    setModalOpen(true);
  };

  const openDetail = async (ord: Order) => {
    setDetailOrder(ord);
    setHistoryLoading(true);
    try {
      const items = await loadHistory(ord.id);
      setHistory(items);
    } catch {
      setHistory([
        {
          id: 'local_1',
          orderId: ord.id,
          fromStatus: 'new',
          toStatus: ord.status,
          actorUid: 'owner',
          actorName: 'Liban Abdullahi',
          note: `Order ${ord.orderCode} created.`,
        },
      ]);
    } finally {
      setHistoryLoading(false);
    }
  };

  useEffect(() => {
    if (detailOrder) {
      const updated = orders.find((o) => o.id === detailOrder.id);
      if (updated) setDetailOrder(updated);
    }
  }, [orders, detailOrder?.id]);

  const toggleSort = (col: 'date' | 'total' | 'code') => {
    if (sortBy === col) {
      setSortDir((d) => (d === 'asc' ? 'desc' : 'asc'));
    } else {
      setSortBy(col);
      setSortDir(col === 'code' ? 'asc' : 'desc');
    }
  };

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    const mult = sortDir === 'asc' ? 1 : -1;
    return orders
      .filter((o) => (statusFilter === 'all' ? true : o.status === statusFilter))
      .filter((o) => (dateFilter ? o.orderDate === dateFilter : true))
      .filter((o) => {
        if (!q) return true;
        return (
          o.orderCode.toLowerCase().includes(q) ||
          o.buyerName.toLowerCase().includes(q) ||
          o.productName.toLowerCase().includes(q)
        );
      })
      .sort((a, b) => {
        if (sortBy === 'total') return (a.totalAmount - b.totalAmount) * mult;
        if (sortBy === 'code') return a.orderCode.localeCompare(b.orderCode) * mult;
        return a.orderDate.localeCompare(b.orderDate) * mult;
      });
  }, [orders, statusFilter, dateFilter, search, sortBy, sortDir]);

  const pageSize = 8;
  const paged = filtered.slice((page - 1) * pageSize, page * pageSize);

  const selectedProduct = products.find((p) => p.id === form.productId);
  const selectedBuyer = buyers.find((b) => b.id === form.buyerId);

  const validateStep1 = () => {
    const errs: Record<string, string> = {};
    if (!form.orderCode.trim()) errs.orderCode = t.form.requiredField;
    if (!form.orderDate) errs.orderDate = t.form.requiredField;
    if (!selectedBuyer) errs.buyerId = t.form.requiredField;
    if (!selectedProduct) errs.productId = t.form.requiredField;
    setFormErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const validateStep2 = () => {
    const errs: Record<string, string> = {};
    const qty = Number(form.quantity);
    const unitPrice = Number(form.unitPrice);
    if (!Number.isFinite(qty) || qty < 1) {
      errs.quantity = t.form.invalidNumber;
    } else if (!editing && selectedProduct && qty > selectedProduct.stockQty) {
      errs.quantity = `${t.form.insufficientStock} (${selectedProduct.stockQty} ${selectedProduct.unit})`;
    }
    if (!Number.isFinite(unitPrice) || unitPrice < 0) {
      errs.unitPrice = t.form.invalidNumber;
    }
    setFormErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (modalStep === 1) {
      if (validateStep1()) setModalStep(2);
      return;
    }
    if (!validateStep1()) {
      setModalStep(1);
      return;
    }
    if (!validateStep2() || !selectedProduct || !selectedBuyer) return;

    setSaving(true);
    try {
      const qty = Math.max(1, Number(form.quantity) || 1);
      const unitPrice = Math.max(0, Number(form.unitPrice) || 0);
      await onSaveOrder(
        {
          id: form.id,
          orderCode: form.orderCode.trim(),
          buyerId: selectedBuyer.id,
          buyerName: selectedBuyer.businessName,
          productId: selectedProduct.id,
          productName: selectedProduct.name,
          unit: selectedProduct.unit,
          quantity: qty,
          unitPrice,
          totalAmount: Math.round(qty * unitPrice),
          currency,
          status: form.status,
          paymentStatus: form.paymentStatus,
          orderDate: form.orderDate,
          notes: form.notes || undefined,
        },
        !editing
      );
      setModalOpen(false);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 no-print">
        <div>
          <h1 className="text-xl font-display font-bold text-ink">{t.nav.orders}</h1>
          <p className="text-xs text-muted mt-0.5">
            Track wholesale orders from pending confirmation through dispatch, delivery, and printable invoices.
          </p>
        </div>
        <motion.button
          type="button"
          whileHover={{ y: -1 }}
          whileTap={{ scale: 0.98 }}
          transition={{ duration: DURATIONS.button, ease: EASE_SAAS }}
          onClick={openCreateModal}
          className="inline-flex items-center gap-1.5 px-3.5 py-2 text-xs font-medium rounded-[10px] bg-accent text-on-accent transition-colors self-start sm:self-auto shadow-sm"
        >
          <Plus className="w-3.5 h-3.5" />
          <span>{t.dashboard.newOrder}</span>
        </motion.button>
      </div>

      {/* Filters */}
      <div className="bg-surface border border-hairline rounded-[14px] p-3.5 space-y-3 shadow-saas no-print">
        <div className="flex flex-col md:flex-row gap-3">
          <div className="relative flex-1">
            <Search className="w-4 h-4 text-muted absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={search}
              onChange={(e) => {
                setSearch(e.target.value);
                setPage(1);
              }}
              placeholder="Search Order ID, buyer, or food item..."
              className="w-full pl-9 pr-3 py-2 text-xs bg-subtle border border-hairline rounded-[10px] text-ink"
            />
          </div>
          <div className="flex items-center gap-2">
            <input
              type="date"
              value={dateFilter}
              onChange={(e) => {
                setDateFilter(e.target.value);
                setPage(1);
              }}
              className="px-3 py-2 text-xs bg-subtle border border-hairline rounded-[10px] text-ink"
            />
            {dateFilter && (
              <button
                type="button"
                onClick={() => setDateFilter('')}
                className="px-2.5 py-2 text-xs rounded-[10px] border border-hairline bg-hover text-muted"
              >
                Clear
              </button>
            )}
          </div>
        </div>

        <div className="flex items-center gap-1.5 overflow-x-auto pb-1">
          <button
            type="button"
            onClick={() => {
              setStatusFilter('all');
              setPage(1);
            }}
            className={`relative px-3 py-1.5 rounded-lg text-xs font-medium whitespace-nowrap transition-colors ${
              statusFilter === 'all' ? 'text-on-accent' : 'bg-subtle text-muted hover:text-ink'
            }`}
          >
            {statusFilter === 'all' && (
              <motion.span
                layoutId="orders-status-pill"
                transition={tabSlideTransition}
                className="absolute inset-0 bg-accent rounded-lg"
              />
            )}
            <span className="relative z-10">
              {t.common.all} ({orders.length})
            </span>
          </button>
          {ORDER_STATUS_FLOW.map((st) => {
            const count = orders.filter((o) => o.status === st).length;
            return (
              <button
                key={st}
                type="button"
                onClick={() => {
                  setStatusFilter(st);
                  setPage(1);
                }}
                className={`relative px-3 py-1.5 rounded-lg text-xs font-medium whitespace-nowrap transition-colors ${
                  statusFilter === st ? 'text-on-accent' : 'bg-subtle text-muted hover:text-ink'
                }`}
              >
                {statusFilter === st && (
                  <motion.span
                    layoutId="orders-status-pill"
                    transition={tabSlideTransition}
                    className="absolute inset-0 bg-accent rounded-lg"
                  />
                )}
                <span className="relative z-10">
                  {t.statuses[st]} ({count})
                </span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Table / Mobile Cards */}
      {filtered.length === 0 ? (
        <EmptyState
          icon={<ShoppingCart className="w-6 h-6" />}
          title="No orders match this filter"
          description="Create a new wholesale order or reset the status/date filters."
          actionLabel={t.dashboard.newOrder}
          onAction={openCreateModal}
        />
      ) : (
        <div className="bg-surface border border-hairline rounded-[14px] shadow-saas overflow-hidden no-print">
          {/* Mobile Cards */}
          <div className="md:hidden divide-y divide-hairline">
            {paged.map((ord) => (
              <div key={ord.id} className="p-4 space-y-2.5">
                <div className="flex items-center justify-between gap-2">
                  <span className="font-mono text-xs font-semibold text-ink">
                    {ord.orderCode}
                  </span>
                  <div className="flex items-center gap-1.5">
                    <StatusTag
                      tone={
                        ord.paymentStatus === 'paid'
                          ? 'emerald'
                          : ord.paymentStatus === 'partial'
                            ? 'amber'
                            : 'rose'
                      }
                      label={ord.paymentStatus}
                    />
                    <StatusTag
                      tone={orderStatusTone(ord.status)}
                      label={t.statuses[ord.status]}
                    />
                  </div>
                </div>
                <div className="text-xs font-medium text-ink">{ord.buyerName}</div>
                <div className="flex items-center justify-between text-xs text-muted">
                  <span className="truncate">
                    {ord.productName} · {ord.quantity} {ord.unit}
                  </span>
                  <span className="font-mono font-semibold text-ink shrink-0 ml-2">
                    {formatMoney(ord.totalAmount, ord.currency)}
                  </span>
                </div>
                <div className="flex items-center justify-between pt-1">
                  <span className="text-[11px] font-mono text-muted">{ord.orderDate}</span>
                  <div className="inline-flex items-center gap-1.5">
                    <button
                      type="button"
                      onClick={() => openDetail(ord)}
                      className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg border border-hairline bg-hover text-xs text-ink"
                    >
                      <Eye className="w-3 h-3" />
                      <span>Detail</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => openEditModal(ord)}
                      className="p-1.5 rounded-lg border border-hairline bg-hover text-ink"
                      aria-label={t.common.edit}
                    >
                      <Edit3 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* Desktop Table */}
          <div className="hidden md:block overflow-x-auto max-h-[540px]">
            <table className="w-full text-left border-collapse text-xs">
              <thead className="sticky top-0 z-10 bg-surface border-b border-hairline text-muted">
                <tr>
                  <th className="py-3 px-4 font-medium">
                    <button
                      type="button"
                      onClick={() => toggleSort('code')}
                      className="inline-flex items-center gap-1 hover:text-ink"
                    >
                      <span>Order ID</span>
                      <ArrowUpDown className="w-3 h-3" />
                    </button>
                  </th>
                  <th className="py-3 px-4 font-medium">Buyer</th>
                  <th className="py-3 px-4 font-medium">Product</th>
                  <th className="py-3 px-4 font-medium text-right">Qty</th>
                  <th className="py-3 px-4 font-medium text-right">
                    <button
                      type="button"
                      onClick={() => toggleSort('total')}
                      className="inline-flex items-center gap-1 hover:text-ink"
                    >
                      <span>Total</span>
                      <ArrowUpDown className="w-3 h-3" />
                    </button>
                  </th>
                  <th className="py-3 px-4 font-medium">Payment</th>
                  <th className="py-3 px-4 font-medium">
                    <button
                      type="button"
                      onClick={() => toggleSort('date')}
                      className="inline-flex items-center gap-1 hover:text-ink"
                    >
                      <span>Date</span>
                      <ArrowUpDown className="w-3 h-3" />
                    </button>
                  </th>
                  <th className="py-3 px-4 font-medium">Status</th>
                  <th className="py-3 px-4 font-medium text-right">{t.common.actions}</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-hairline">
                {paged.map((ord) => (
                  <tr key={ord.id} className="bg-hover transition-colors">
                    <td className="py-3 px-4 font-mono font-semibold text-ink whitespace-nowrap">
                      {ord.orderCode}
                    </td>
                    <td className="py-3 px-4 font-medium text-ink whitespace-nowrap">
                      {ord.buyerName}
                    </td>
                    <td className="py-3 px-4 text-muted max-w-[200px] truncate">
                      {ord.productName}
                    </td>
                    <td className="py-3 px-4 text-right font-mono tabular-nums text-ink whitespace-nowrap">
                      {ord.quantity} {ord.unit}
                    </td>
                    <td className="py-3 px-4 text-right font-mono tabular-nums font-semibold text-ink whitespace-nowrap">
                      {formatMoney(ord.totalAmount, ord.currency)}
                    </td>
                    <td className="py-3 px-4">
                      <StatusTag
                        tone={
                          ord.paymentStatus === 'paid'
                            ? 'emerald'
                            : ord.paymentStatus === 'partial'
                              ? 'amber'
                              : 'rose'
                        }
                        label={ord.paymentStatus}
                      />
                    </td>
                    <td className="py-3 px-4 font-mono tabular-nums text-muted whitespace-nowrap">
                      {ord.orderDate}
                    </td>
                    <td className="py-3 px-4">
                      <StatusTag
                        tone={orderStatusTone(ord.status)}
                        label={t.statuses[ord.status]}
                      />
                    </td>
                    <td className="py-3 px-4 text-right whitespace-nowrap">
                      <div className="inline-flex items-center gap-1.5">
                        <button
                          type="button"
                          onClick={() => openDetail(ord)}
                          className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg border border-hairline bg-hover text-ink"
                        >
                          <Eye className="w-3 h-3" />
                          <span>Detail</span>
                        </button>
                        <button
                          type="button"
                          onClick={() => openEditModal(ord)}
                          className="p-1.5 rounded-lg border border-hairline bg-hover text-ink"
                          title={t.common.edit}
                          aria-label={t.common.edit}
                        >
                          <Edit3 className="w-3.5 h-3.5" />
                        </button>
                      </div>
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

      {/* Multi-Step Create / Edit Order Modal */}
      <Modal
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        title={editing ? `Edit ${editing.orderCode}` : 'Create Wholesale Order'}
        subtitle={`${t.form.stepOf} ${modalStep} / 2 · Malka Jabdu central stock reservation`}
      >
        <form onSubmit={handleSubmit} noValidate className="space-y-4 text-xs">
          {/* Step Indicator */}
          <div className="flex items-center gap-2">
            {[1, 2].map((stepNum) => (
              <button
                key={stepNum}
                type="button"
                onClick={() => {
                  if (stepNum === 1 || validateStep1()) setModalStep(stepNum as 1 | 2);
                }}
                className="flex-1 text-left space-y-1.5"
              >
                <div
                  style={{
                    backgroundColor:
                      modalStep >= stepNum ? 'var(--accent-primary)' : 'var(--bg-subtle)',
                  }}
                  className="h-1.5 rounded-full transition-colors"
                />
                <span
                  className={`text-[11px] font-medium ${
                    modalStep === stepNum ? 'text-ink' : 'text-muted'
                  }`}
                >
                  {stepNum === 1 ? '1. Buyer & Food Item' : '2. Quantity, Pricing & Payment'}
                </span>
              </button>
            ))}
          </div>

          {modalStep === 1 ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
              <div>
                <label className="block font-medium text-ink mb-1">Order Code</label>
                <input
                  disabled={Boolean(editing)}
                  value={form.orderCode}
                  onChange={(e) => {
                    setForm({ ...form, orderCode: e.target.value });
                    if (formErrors.orderCode) setFormErrors({ ...formErrors, orderCode: '' });
                  }}
                  className="w-full px-3 py-2 rounded-[10px] bg-subtle border border-hairline text-ink font-mono disabled:opacity-60"
                />
                {formErrors.orderCode && (
                  <p style={{ color: 'var(--status-danger-fg)' }} className="mt-1 text-[11px]">
                    {formErrors.orderCode}
                  </p>
                )}
              </div>
              <div>
                <label className="block font-medium text-ink mb-1">Order Date</label>
                <input
                  type="date"
                  value={form.orderDate}
                  onChange={(e) => setForm({ ...form, orderDate: e.target.value })}
                  className="w-full px-3 py-2 rounded-[10px] bg-subtle border border-hairline text-ink"
                />
              </div>
              <div className="sm:col-span-2">
                <label className="block font-medium text-ink mb-1">Buyer *</label>
                <select
                  value={form.buyerId}
                  onChange={(e) => setForm({ ...form, buyerId: e.target.value })}
                  className="w-full px-3 py-2 rounded-[10px] bg-subtle border border-hairline text-ink"
                >
                  {buyers.map((b) => (
                    <option key={b.id} value={b.id}>
                      {b.businessName} ({b.city || b.phone})
                    </option>
                  ))}
                </select>
                {formErrors.buyerId && (
                  <p style={{ color: 'var(--status-danger-fg)' }} className="mt-1 text-[11px]">
                    {formErrors.buyerId}
                  </p>
                )}
              </div>
              <div className="sm:col-span-2">
                <label className="block font-medium text-ink mb-1">Food Product *</label>
                <select
                  value={form.productId}
                  onChange={(e) => {
                    const p = products.find((item) => item.id === e.target.value);
                    setForm({
                      ...form,
                      productId: e.target.value,
                      unitPrice: p?.sellingPrice ?? form.unitPrice,
                    });
                  }}
                  className="w-full px-3 py-2 rounded-[10px] bg-subtle border border-hairline text-ink"
                >
                  {products.map((p) => (
                    <option key={p.id} value={p.id}>
                      {p.name} — {p.stockQty} {p.unit} available ({formatMoney(p.sellingPrice, p.currency)})
                    </option>
                  ))}
                </select>
                {selectedProduct && (
                  <div className="mt-2 p-2.5 rounded-lg bg-subtle border border-hairline flex items-center justify-between text-[11px]">
                    <span className="text-muted">Available warehouse stock:</span>
                    <span className="font-mono font-semibold text-accent">
                      {selectedProduct.stockQty} {selectedProduct.unit}
                    </span>
                  </div>
                )}
              </div>
            </div>
          ) : (
            <div className="space-y-3.5">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                <div>
                  <label className="block font-medium text-ink mb-1">
                    Quantity {selectedProduct ? `(max ${selectedProduct.stockQty})` : ''} *
                  </label>
                  <input
                    type="number"
                    min={1}
                    value={form.quantity}
                    onChange={(e) => {
                      setForm({ ...form, quantity: Number(e.target.value) });
                      if (formErrors.quantity) setFormErrors({ ...formErrors, quantity: '' });
                    }}
                    className="w-full px-3 py-2 rounded-[10px] bg-subtle border border-hairline text-ink font-mono"
                  />
                  {formErrors.quantity && (
                    <p style={{ color: 'var(--status-danger-fg)' }} className="mt-1 text-[11px]">
                      {formErrors.quantity}
                    </p>
                  )}
                </div>
                <div>
                  <label className="block font-medium text-ink mb-1">Unit Price ({currency})</label>
                  <input
                    type="number"
                    min={0}
                    value={form.unitPrice}
                    onChange={(e) => {
                      setForm({ ...form, unitPrice: Number(e.target.value) });
                      if (formErrors.unitPrice) setFormErrors({ ...formErrors, unitPrice: '' });
                    }}
                    className="w-full px-3 py-2 rounded-[10px] bg-subtle border border-hairline text-ink font-mono"
                  />
                  {formErrors.unitPrice && (
                    <p style={{ color: 'var(--status-danger-fg)' }} className="mt-1 text-[11px]">
                      {formErrors.unitPrice}
                    </p>
                  )}
                </div>
                <div>
                  <label className="block font-medium text-ink mb-1">Payment Status</label>
                  <select
                    value={form.paymentStatus}
                    onChange={(e) =>
                      setForm({ ...form, paymentStatus: e.target.value as PaymentStatus })
                    }
                    className="w-full px-3 py-2 rounded-[10px] bg-subtle border border-hairline text-ink"
                  >
                    <option value="unpaid">Unpaid</option>
                    <option value="partial">Partial</option>
                    <option value="paid">Paid</option>
                  </select>
                </div>
                <div>
                  <label className="block font-medium text-ink mb-1">Calculated Total</label>
                  <div className="px-3 py-2 rounded-[10px] bg-subtle border border-hairline font-mono font-bold text-ink">
                    {formatMoney(
                      Math.round((Number(form.quantity) || 0) * (Number(form.unitPrice) || 0)),
                      currency
                    )}
                  </div>
                </div>
              </div>

              <div>
                <label className="block font-medium text-ink mb-1">Delivery / Order Notes</label>
                <textarea
                  rows={2}
                  value={form.notes}
                  onChange={(e) => setForm({ ...form, notes: e.target.value })}
                  className="w-full px-3 py-2 rounded-[10px] bg-subtle border border-hairline text-ink"
                />
              </div>
            </div>
          )}

          <div className="flex justify-between gap-2 pt-2">
            <div>
              {modalStep === 2 && (
                <button
                  type="button"
                  onClick={() => setModalStep(1)}
                  className="px-4 py-2 rounded-[10px] border border-hairline text-ink bg-hover"
                >
                  {t.form.back}
                </button>
              )}
            </div>
            <div className="flex gap-2">
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
                className="px-4 py-2 rounded-[10px] bg-accent text-on-accent font-medium disabled:opacity-60"
              >
                {modalStep === 1
                  ? t.form.next
                  : saving
                    ? t.common.loading
                    : t.common.save}
              </button>
            </div>
          </div>
        </form>
      </Modal>

      {/* Order Detail & Printable Invoice Drawer */}
      <Drawer
        open={Boolean(detailOrder)}
        onClose={() => setDetailOrder(null)}
        title={detailOrder ? `${detailOrder.orderCode} · ${detailOrder.buyerName}` : ''}
        subtitle={detailOrder ? `${detailOrder.productName} · ${detailOrder.orderDate}` : ''}
        headerActions={
          detailOrder && (
            <button
              type="button"
              onClick={() => window.print()}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-lg border border-hairline bg-hover text-ink"
            >
              <Printer className="w-3.5 h-3.5" />
              <span>{t.common.printInvoice}</span>
            </button>
          )
        }
      >
        {detailOrder && (
          <div className="space-y-6 text-xs">
            {/* Printable Commercial Invoice Block */}
            <div className="p-5 rounded-[14px] border border-hairline bg-subtle/40 space-y-4">
              <div className="flex items-start justify-between border-b border-hairline pb-4">
                <div>
                  <div className="text-base font-display font-bold text-ink">
                    TradeLink Food Trading PLC
                  </div>
                  <div className="text-[11px] text-muted mt-0.5">
                    Malka Jabdu Central Warehouse · Dire Dawa Corridor
                  </div>
                </div>
                <div className="text-right">
                  <div className="text-xs font-semibold text-ink uppercase tracking-wider">
                    Wholesale Invoice
                  </div>
                  <div className="font-mono font-bold text-sm text-accent">
                    {detailOrder.orderCode}
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <div className="text-[11px] text-muted">Billed To</div>
                  <div className="font-semibold text-ink mt-0.5">{detailOrder.buyerName}</div>
                </div>
                <div className="text-right">
                  <div className="text-[11px] text-muted">Order Date</div>
                  <div className="font-mono text-ink mt-0.5">{detailOrder.orderDate}</div>
                </div>
              </div>

              <table className="w-full border-t border-b border-hairline">
                <thead>
                  <tr className="text-muted border-b border-hairline">
                    <th className="py-2 text-left font-medium">Item</th>
                    <th className="py-2 text-right font-medium">Qty</th>
                    <th className="py-2 text-right font-medium">Unit Price</th>
                    <th className="py-2 text-right font-medium">Total</th>
                  </tr>
                </thead>
                <tbody>
                  <tr>
                    <td className="py-2.5 font-medium text-ink">{detailOrder.productName}</td>
                    <td className="py-2.5 text-right font-mono tabular-nums text-ink">
                      {detailOrder.quantity} {detailOrder.unit}
                    </td>
                    <td className="py-2.5 text-right font-mono tabular-nums text-ink">
                      {formatMoney(detailOrder.unitPrice, detailOrder.currency)}
                    </td>
                    <td className="py-2.5 text-right font-mono tabular-nums font-bold text-ink">
                      {formatMoney(detailOrder.totalAmount, detailOrder.currency)}
                    </td>
                  </tr>
                </tbody>
              </table>

              <div className="flex items-center justify-between pt-1">
                <div className="flex items-center gap-2">
                  <StatusTag
                    tone={orderStatusTone(detailOrder.status)}
                    label={t.statuses[detailOrder.status]}
                  />
                  <StatusTag
                    tone={detailOrder.paymentStatus === 'paid' ? 'emerald' : 'amber'}
                    label={`Payment: ${detailOrder.paymentStatus}`}
                  />
                </div>
                <div className="text-right">
                  <span className="text-muted mr-2">Invoice Total:</span>
                  <span className="font-mono font-bold text-base text-ink">
                    {formatMoney(detailOrder.totalAmount, detailOrder.currency)}
                  </span>
                </div>
              </div>
            </div>

            {/* Visual Status Progress Timeline */}
            <div className="no-print space-y-3">
              <h3 className="text-xs font-semibold text-ink uppercase tracking-wider">
                Fulfillment Progress
              </h3>
              {detailOrder.status === 'cancelled' ? (
                <div
                  style={{
                    backgroundColor: 'var(--status-danger-bg)',
                    borderColor: 'var(--status-danger-bd)',
                    color: 'var(--status-danger-fg)',
                  }}
                  className="p-3 rounded-[10px] border"
                >
                  Order was cancelled and warehouse stock was restored.
                </div>
              ) : (
                <div className="grid grid-cols-5 gap-2">
                  {TIMELINE_STEPS.map((step, idx) => {
                    const activeIdx = TIMELINE_STEPS.indexOf(detailOrder.status);
                    const reached = idx <= activeIdx;
                    return (
                      <div key={step} className="space-y-1.5">
                        <div className="h-1.5 rounded-full bg-subtle overflow-hidden">
                          <motion.div
                            initial={{ scaleX: 0 }}
                            animate={{ scaleX: reached ? 1 : 0 }}
                            transition={{
                              delay: idx * 0.04,
                              duration: DURATIONS.page,
                              ease: EASE_SAAS,
                            }}
                            style={{
                              transformOrigin: 'left',
                              backgroundColor: 'var(--accent-primary)',
                            }}
                            className="h-full rounded-full"
                          />
                        </div>
                        <div
                          className={`text-[11px] font-medium leading-tight ${
                            reached ? 'text-ink' : 'text-muted'
                          }`}
                        >
                          {t.statuses[step]}
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}

              {/* Quick Transition Actions */}
              {detailOrder.status !== 'delivered' && detailOrder.status !== 'cancelled' && (
                <div className="flex flex-wrap gap-2 pt-2">
                  {TIMELINE_STEPS.map((nextSt) => {
                    const currentIdx = TIMELINE_STEPS.indexOf(detailOrder.status);
                    const targetIdx = TIMELINE_STEPS.indexOf(nextSt);
                    if (targetIdx <= currentIdx) return null;
                    return (
                      <button
                        key={nextSt}
                        type="button"
                        onClick={() => onTransitionStatus(detailOrder, nextSt)}
                        className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-accent text-on-accent font-medium transition-colors"
                      >
                        <CheckCircle2 className="w-3.5 h-3.5" />
                        <span>Mark {t.statuses[nextSt]}</span>
                      </button>
                    );
                  })}
                  <button
                    type="button"
                    onClick={() => onTransitionStatus(detailOrder, 'cancelled')}
                    style={{
                      borderColor: 'var(--status-danger-bd)',
                      color: 'var(--status-danger-fg)',
                    }}
                    className="px-3 py-1.5 rounded-lg border bg-hover font-medium transition-colors"
                  >
                    Cancel & Restore Stock
                  </button>
                </div>
              )}
            </div>

            {/* Order History Ledger */}
            <div className="no-print space-y-3">
              <h3 className="text-xs font-semibold text-ink uppercase tracking-wider">
                Order History
              </h3>
              {historyLoading ? (
                <p className="text-muted">{t.common.loading}</p>
              ) : (
                <div className="space-y-2.5">
                  {history.map((h) => (
                    <div
                      key={h.id}
                      className="flex items-start gap-2.5 p-3 rounded-[10px] bg-subtle border border-hairline"
                    >
                      <Clock className="w-3.5 h-3.5 text-accent mt-0.5 shrink-0" />
                      <div>
                        <div className="font-medium text-ink">
                          {h.fromStatus} → {h.toStatus}
                        </div>
                        {h.note && <div className="text-muted mt-0.5">{h.note}</div>}
                        <div className="text-[10px] text-muted mt-1">By {h.actorName}</div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}
      </Drawer>
    </div>
  );
}
