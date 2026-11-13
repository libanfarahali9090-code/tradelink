import React, { useMemo, useState } from 'react';
import { motion } from 'motion/react';
import {
  ArrowUpDown,
  Building2,
  Edit3,
  Eye,
  Mail,
  MapPin,
  Phone,
  Plus,
  Search,
  UserCheck,
} from 'lucide-react';
import type {
  Buyer,
  CurrencyCode,
  FinancialTransaction,
  Language,
  Order,
  Product,
  Supplier,
} from '../../types/tradelink';
import { TRANSLATIONS, formatMoney } from '../../i18n/translations';
import { DURATIONS, EASE_SAAS, staggerItem } from '../../lib/motion';
import {
  Drawer,
  EmptyState,
  Modal,
  PaginationBar,
  StatusTag,
} from '../ui/SaasPrimitives';
import { makeId } from '../../services/firestoreService';

export function SuppliersPage({
  lang,
  currency,
  suppliers,
  products,
  transactions,
  canManage,
  onSaveSupplier,
}: {
  lang: Language;
  currency: CurrencyCode;
  suppliers: Supplier[];
  products: Product[];
  transactions: FinancialTransaction[];
  canManage: boolean;
  onSaveSupplier: (s: Omit<Supplier, 'createdAt' | 'updatedAt'>, isNew: boolean) => Promise<void>;
}) {
  const t = TRANSLATIONS[lang];
  const [search, setSearch] = useState('');
  const [selected, setSelected] = useState<Supplier | null>(null);
  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState<Supplier | null>(null);
  const [formErrors, setFormErrors] = useState<Record<string, string>>({});
  const [saving, setSaving] = useState(false);

  const [form, setForm] = useState<Omit<Supplier, 'createdAt' | 'updatedAt'>>({
    id: '',
    name: '',
    contactName: '',
    phone: '',
    email: '',
    city: '',
    suppliedCategories: 'Rice, Flour',
    totalPurchased: 0,
    outstandingBalance: 0,
    onTimeRate: 95,
    status: 'active',
  });

  const openCreate = () => {
    setEditing(null);
    setFormErrors({});
    setForm({
      id: makeId('sup'),
      name: '',
      contactName: '',
      phone: '+251 9',
      email: '',
      city: 'Dire Dawa',
      suppliedCategories: 'Rice, Cooking Oil',
      totalPurchased: 0,
      outstandingBalance: 0,
      onTimeRate: 95,
      status: 'active',
    });
    setModalOpen(true);
  };

  const openEdit = (s: Supplier) => {
    setEditing(s);
    setFormErrors({});
    setForm({
      id: s.id,
      name: s.name,
      contactName: s.contactName,
      phone: s.phone,
      email: s.email || '',
      city: s.city || '',
      suppliedCategories: s.suppliedCategories || '',
      totalPurchased: s.totalPurchased,
      outstandingBalance: s.outstandingBalance,
      onTimeRate: s.onTimeRate,
      status: s.status,
    });
    setModalOpen(true);
  };

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    return suppliers.filter(
      (s) =>
        !q ||
        s.name.toLowerCase().includes(q) ||
        s.contactName.toLowerCase().includes(q) ||
        (s.city || '').toLowerCase().includes(q)
    );
  }, [suppliers, search]);

  return (
    <div className="space-y-5">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div>
          <h1 className="text-xl font-display font-bold text-ink">{t.nav.suppliers}</h1>
          <p className="text-xs text-muted mt-0.5">
            Food importers and mills supplying Malka Jabdu central warehouse.
          </p>
        </div>
        {canManage && (
          <motion.button
            type="button"
            whileHover={{ y: -1 }}
            whileTap={{ scale: 0.98 }}
            transition={{ duration: DURATIONS.button, ease: EASE_SAAS }}
            onClick={openCreate}
            className="inline-flex items-center gap-1.5 px-3.5 py-2 text-xs font-medium rounded-[10px] bg-accent text-on-accent self-start sm:self-auto shadow-sm transition-colors"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Add supplier</span>
          </motion.button>
        )}
      </div>

      <div className="bg-surface border border-hairline rounded-[14px] p-3.5 shadow-saas">
        <div className="relative max-w-md">
          <Search className="w-4 h-4 text-muted absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search supplier name, contact, or city..."
            className="w-full pl-9 pr-3 py-2 text-xs bg-subtle border border-hairline rounded-[10px] text-ink"
          />
        </div>
      </div>

      {filtered.length === 0 ? (
        <EmptyState
          icon={<Building2 className="w-6 h-6" />}
          title="No suppliers found"
          description="Try clearing your search or register a new wholesale food supplier."
          actionLabel={canManage ? 'Add supplier' : undefined}
          onAction={canManage ? openCreate : undefined}
        />
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {filtered.map((s, idx) => (
            <motion.div
              key={s.id}
              {...staggerItem(idx, DURATIONS.dropdown)}
              whileHover={{ y: -2 }}
              className="bg-surface border border-hairline rounded-[14px] p-5 space-y-4 shadow-saas hover:border-accent transition-colors"
            >
              <div className="flex items-start justify-between gap-3">
                <div className="flex items-start gap-3">
                  <div className="p-2.5 rounded-xl bg-accent-subtle text-accent">
                    <Building2 className="w-4 h-4" />
                  </div>
                  <div>
                    <h3 className="text-sm font-semibold text-ink">{s.name}</h3>
                    <p className="text-xs text-muted mt-0.5">
                      {s.contactName} · {s.city || 'Ethiopia'}
                    </p>
                  </div>
                </div>
                <StatusTag
                  tone={s.status === 'active' ? 'emerald' : 'slate'}
                  label={s.status}
                />
              </div>

              <div className="grid grid-cols-3 gap-3 pt-1 text-xs">
                <div>
                  <div className="text-[11px] text-muted">Purchased</div>
                  <div className="font-mono font-semibold text-ink tabular-nums mt-0.5">
                    {formatMoney(s.totalPurchased, currency)}
                  </div>
                </div>
                <div>
                  <div className="text-[11px] text-muted">Outstanding</div>
                  <div
                    style={{ color: 'var(--status-warn-fg)' }}
                    className="font-mono font-semibold tabular-nums mt-0.5"
                  >
                    {formatMoney(s.outstandingBalance, currency)}
                  </div>
                </div>
                <div>
                  <div className="text-[11px] text-muted">On-Time</div>
                  <div className="font-mono font-semibold text-accent tabular-nums mt-0.5">
                    {s.onTimeRate}%
                  </div>
                </div>
              </div>

              <div className="h-1.5 rounded-full bg-subtle overflow-hidden">
                <motion.div
                  initial={{ scaleX: 0 }}
                  animate={{ scaleX: 1 }}
                  transition={{
                    delay: idx * 0.035,
                    duration: 0.4,
                    ease: EASE_SAAS,
                  }}
                  style={{
                    width: `${Math.min(100, s.onTimeRate)}%`,
                    transformOrigin: 'left',
                    backgroundColor: 'var(--accent-primary)',
                  }}
                  className="h-full rounded-full"
                />
              </div>

              <div className="flex items-center justify-between pt-3 border-t border-hairline text-xs">
                <span className="text-muted truncate">{s.suppliedCategories}</span>
                <div className="flex items-center gap-1.5 shrink-0">
                  <button
                    type="button"
                    onClick={() => setSelected(s)}
                    className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg border border-hairline bg-hover text-ink transition-colors"
                  >
                    <Eye className="w-3 h-3" />
                    <span>Profile</span>
                  </button>
                  {canManage && (
                    <button
                      type="button"
                      onClick={() => openEdit(s)}
                      className="p-1.5 rounded-lg border border-hairline bg-hover text-ink transition-colors"
                      aria-label={t.common.edit}
                    >
                      <Edit3 className="w-3.5 h-3.5" />
                    </button>
                  )}
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      )}

      {/* Supplier Profile Drawer */}
      <Drawer
        open={Boolean(selected)}
        onClose={() => setSelected(null)}
        title={selected?.name || ''}
        subtitle={`${selected?.contactName || ''} · ${selected?.city || ''}`}
      >
        {selected && (
          <div className="space-y-6 text-xs">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 p-4 rounded-[12px] bg-subtle border border-hairline">
              <div className="flex items-center gap-2 text-ink">
                <Phone className="w-3.5 h-3.5 text-muted" />
                <span className="font-mono">{selected.phone}</span>
              </div>
              <div className="flex items-center gap-2 text-ink">
                <Mail className="w-3.5 h-3.5 text-muted" />
                <span>{selected.email || '—'}</span>
              </div>
              <div className="flex items-center gap-2 text-ink">
                <MapPin className="w-3.5 h-3.5 text-muted" />
                <span>{selected.city || '—'}</span>
              </div>
              <div className="text-ink font-medium">
                On-time performance:{' '}
                <span className="font-mono text-accent">{selected.onTimeRate}%</span>
              </div>
            </div>

            <div>
              <h3 className="font-semibold text-ink mb-2">Supplied Catalog Products</h3>
              <div className="divide-y divide-hairline border border-hairline rounded-[12px] overflow-hidden">
                {products
                  .filter((p) => p.supplierId === selected.id)
                  .map((p) => (
                    <div key={p.id} className="px-4 py-2.5 flex items-center justify-between">
                      <div>
                        <div className="font-medium text-ink">{p.name}</div>
                        <div className="text-[11px] text-muted">{p.unit}</div>
                      </div>
                      <div className="text-right font-mono">
                        <div className="font-semibold text-ink">{p.stockQty} in stock</div>
                        <div className="text-[11px] text-muted">
                          Cost {formatMoney(p.purchasePrice, p.currency)}
                        </div>
                      </div>
                    </div>
                  ))}
              </div>
            </div>

            <div>
              <h3 className="font-semibold text-ink mb-2">Supplier Transactions</h3>
              <div className="divide-y divide-hairline border border-hairline rounded-[12px] overflow-hidden">
                {transactions
                  .filter((tx) => tx.partyId === selected.id)
                  .map((tx) => (
                    <div key={tx.id} className="px-4 py-2.5 flex items-center justify-between">
                      <div>
                        <div className="font-mono font-medium text-ink">{tx.txCode}</div>
                        <div className="text-[11px] text-muted">
                          {tx.date} · {tx.notes}
                        </div>
                      </div>
                      <div className="font-mono font-semibold text-ink">
                        {formatMoney(tx.amount, tx.currency)}
                      </div>
                    </div>
                  ))}
                {transactions.filter((tx) => tx.partyId === selected.id).length === 0 && (
                  <div className="p-4 text-muted">No supplier transactions logged yet.</div>
                )}
              </div>
            </div>
          </div>
        )}
      </Drawer>

      {/* Add/Edit Supplier Modal */}
      <Modal
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        title={editing ? `Edit ${editing.name}` : 'Add Food Supplier'}
      >
        <form
          noValidate
          onSubmit={async (e) => {
            e.preventDefault();
            const errs: Record<string, string> = {};
            if (!form.name.trim()) errs.name = t.form.requiredField;
            if (!form.contactName.trim()) errs.contactName = t.form.requiredField;
            if (form.phone.trim().length < 7) errs.phone = t.form.requiredField;
            setFormErrors(errs);
            if (Object.keys(errs).length > 0) return;

            setSaving(true);
            try {
              await onSaveSupplier(
                {
                  ...form,
                  name: form.name.trim(),
                  contactName: form.contactName.trim(),
                  phone: form.phone.trim(),
                },
                !editing
              );
              setModalOpen(false);
            } finally {
              setSaving(false);
            }
          }}
          className="space-y-3.5 text-xs"
        >
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div className="sm:col-span-2">
              <label className="block font-medium text-ink mb-1">Company Name *</label>
              <input
                value={form.name}
                onChange={(e) => {
                  setForm({ ...form, name: e.target.value });
                  if (formErrors.name) setFormErrors({ ...formErrors, name: '' });
                }}
                className="w-full px-3 py-2 rounded-[10px] bg-subtle border border-hairline text-ink"
              />
              {formErrors.name && (
                <p style={{ color: 'var(--status-danger-fg)' }} className="mt-1 text-[11px]">
                  {formErrors.name}
                </p>
              )}
            </div>
            <div>
              <label className="block font-medium text-ink mb-1">Contact Person *</label>
              <input
                value={form.contactName}
                onChange={(e) => {
                  setForm({ ...form, contactName: e.target.value });
                  if (formErrors.contactName) setFormErrors({ ...formErrors, contactName: '' });
                }}
                className="w-full px-3 py-2 rounded-[10px] bg-subtle border border-hairline text-ink"
              />
              {formErrors.contactName && (
                <p style={{ color: 'var(--status-danger-fg)' }} className="mt-1 text-[11px]">
                  {formErrors.contactName}
                </p>
              )}
            </div>
            <div>
              <label className="block font-medium text-ink mb-1">Phone *</label>
              <input
                value={form.phone}
                onChange={(e) => {
                  setForm({ ...form, phone: e.target.value });
                  if (formErrors.phone) setFormErrors({ ...formErrors, phone: '' });
                }}
                className="w-full px-3 py-2 rounded-[10px] bg-subtle border border-hairline text-ink font-mono"
              />
              {formErrors.phone && (
                <p style={{ color: 'var(--status-danger-fg)' }} className="mt-1 text-[11px]">
                  {formErrors.phone}
                </p>
              )}
            </div>
            <div>
              <label className="block font-medium text-ink mb-1">Email</label>
              <input
                value={form.email || ''}
                onChange={(e) => setForm({ ...form, email: e.target.value })}
                className="w-full px-3 py-2 rounded-[10px] bg-subtle border border-hairline text-ink"
              />
            </div>
            <div>
              <label className="block font-medium text-ink mb-1">City / Corridor</label>
              <input
                value={form.city || ''}
                onChange={(e) => setForm({ ...form, city: e.target.value })}
                className="w-full px-3 py-2 rounded-[10px] bg-subtle border border-hairline text-ink"
              />
            </div>
            <div>
              <label className="block font-medium text-ink mb-1">Supplied Categories</label>
              <input
                value={form.suppliedCategories || ''}
                onChange={(e) => setForm({ ...form, suppliedCategories: e.target.value })}
                className="w-full px-3 py-2 rounded-[10px] bg-subtle border border-hairline text-ink"
              />
            </div>
            <div>
              <label className="block font-medium text-ink mb-1">On-Time Rate (%)</label>
              <input
                type="number"
                min={0}
                max={100}
                value={form.onTimeRate}
                onChange={(e) => setForm({ ...form, onTimeRate: Number(e.target.value) })}
                className="w-full px-3 py-2 rounded-[10px] bg-subtle border border-hairline text-ink font-mono"
              />
            </div>
          </div>
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
              {saving ? t.common.loading : t.common.save}
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
}

export function BuyersPage({
  lang,
  currency,
  buyers,
  orders,
  transactions,
  onSaveBuyer,
}: {
  lang: Language;
  currency: CurrencyCode;
  buyers: Buyer[];
  orders: Order[];
  transactions: FinancialTransaction[];
  onSaveBuyer: (b: Omit<Buyer, 'createdAt' | 'updatedAt'>, isNew: boolean) => Promise<void>;
}) {
  const t = TRANSLATIONS[lang];
  const [search, setSearch] = useState('');
  const [sortBy, setSortBy] = useState<'name' | 'spent' | 'outstanding'>('name');
  const [sortDir, setSortDir] = useState<'asc' | 'desc'>('asc');
  const [page, setPage] = useState(1);

  const [selected, setSelected] = useState<Buyer | null>(null);
  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState<Buyer | null>(null);
  const [formErrors, setFormErrors] = useState<Record<string, string>>({});
  const [saving, setSaving] = useState(false);

  const [form, setForm] = useState<Omit<Buyer, 'createdAt' | 'updatedAt'>>({
    id: '',
    businessName: '',
    contactName: '',
    phone: '',
    email: '',
    city: 'Malka Jabdu',
    totalOrders: 0,
    totalSpent: 0,
    outstandingBalance: 0,
    status: 'active',
  });

  const openCreate = () => {
    setEditing(null);
    setFormErrors({});
    setForm({
      id: makeId('buy'),
      businessName: '',
      contactName: '',
      phone: '+251 9',
      email: '',
      city: 'Malka Jabdu',
      totalOrders: 0,
      totalSpent: 0,
      outstandingBalance: 0,
      status: 'active',
    });
    setModalOpen(true);
  };

  const openEdit = (b: Buyer) => {
    setEditing(b);
    setFormErrors({});
    setForm({
      id: b.id,
      businessName: b.businessName,
      contactName: b.contactName,
      phone: b.phone,
      email: b.email || '',
      city: b.city || '',
      totalOrders: b.totalOrders,
      totalSpent: b.totalSpent,
      outstandingBalance: b.outstandingBalance,
      status: b.status,
    });
    setModalOpen(true);
  };

  const toggleSort = (col: 'name' | 'spent' | 'outstanding') => {
    if (sortBy === col) {
      setSortDir((d) => (d === 'asc' ? 'desc' : 'asc'));
    } else {
      setSortBy(col);
      setSortDir(col === 'name' ? 'asc' : 'desc');
    }
  };

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    const mult = sortDir === 'asc' ? 1 : -1;
    return buyers
      .filter(
        (b) =>
          !q ||
          b.businessName.toLowerCase().includes(q) ||
          b.contactName.toLowerCase().includes(q) ||
          (b.city || '').toLowerCase().includes(q)
      )
      .sort((a, b) => {
        if (sortBy === 'spent') return (a.totalSpent - b.totalSpent) * mult;
        if (sortBy === 'outstanding')
          return (a.outstandingBalance - b.outstandingBalance) * mult;
        return a.businessName.localeCompare(b.businessName) * mult;
      });
  }, [buyers, search, sortBy, sortDir]);

  const pageSize = 8;
  const paged = filtered.slice((page - 1) * pageSize, page * pageSize);

  return (
    <div className="space-y-5">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div>
          <h1 className="text-xl font-display font-bold text-ink">{t.nav.buyers}</h1>
          <p className="text-xs text-muted mt-0.5">
            Registered B2B retailers, cooperatives, and provision stores purchasing from TradeLink.
          </p>
        </div>
        <motion.button
          type="button"
          whileHover={{ y: -1 }}
          whileTap={{ scale: 0.98 }}
          transition={{ duration: DURATIONS.button, ease: EASE_SAAS }}
          onClick={openCreate}
          className="inline-flex items-center gap-1.5 px-3.5 py-2 text-xs font-medium rounded-[10px] bg-accent text-on-accent self-start sm:self-auto shadow-sm transition-colors"
        >
          <Plus className="w-3.5 h-3.5" />
          <span>Register buyer</span>
        </motion.button>
      </div>

      <div className="bg-surface border border-hairline rounded-[14px] p-3.5 shadow-saas">
        <div className="relative max-w-md">
          <Search className="w-4 h-4 text-muted absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            value={search}
            onChange={(e) => {
              setSearch(e.target.value);
              setPage(1);
            }}
            placeholder="Search business name, contact, or city..."
            className="w-full pl-9 pr-3 py-2 text-xs bg-subtle border border-hairline rounded-[10px] text-ink"
          />
        </div>
      </div>

      {filtered.length === 0 ? (
        <EmptyState
          icon={<UserCheck className="w-6 h-6" />}
          title="No buyers match this search"
          description="Adjust your search term or register a new wholesale retail buyer."
          actionLabel="Register buyer"
          onAction={openCreate}
        />
      ) : (
        <div className="bg-surface border border-hairline rounded-[14px] shadow-saas overflow-hidden">
          <div className="md:hidden divide-y divide-hairline">
            {paged.map((b) => (
              <div key={b.id} className="p-4 space-y-2.5">
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <div className="text-xs font-semibold text-ink">{b.businessName}</div>
                    <div className="text-[11px] text-muted">
                      {b.contactName} · {b.city || '—'}
                    </div>
                  </div>
                  <StatusTag
                    tone={b.status === 'active' ? 'emerald' : 'slate'}
                    label={b.status}
                  />
                </div>
                <div className="flex items-center justify-between text-xs">
                  <span className="font-mono font-semibold text-ink">
                    {formatMoney(b.totalSpent, currency)}
                  </span>
                  <span
                    style={{ color: 'var(--status-warn-fg)' }}
                    className="font-mono font-semibold"
                  >
                    Due: {formatMoney(b.outstandingBalance, currency)}
                  </span>
                </div>
                <div className="flex justify-end gap-1.5">
                  <button
                    type="button"
                    onClick={() => setSelected(b)}
                    className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg border border-hairline bg-hover text-xs text-ink"
                  >
                    <UserCheck className="w-3 h-3" />
                    <span>Profile</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => openEdit(b)}
                    className="p-1.5 rounded-lg border border-hairline bg-hover text-ink"
                    aria-label={t.common.edit}
                  >
                    <Edit3 className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            ))}
          </div>

          <div className="hidden md:block overflow-x-auto max-h-[540px]">
            <table className="w-full text-left border-collapse text-xs">
              <thead className="sticky top-0 z-10 bg-surface border-b border-hairline text-muted">
                <tr>
                  <th className="py-3 px-4 font-medium">
                    <button
                      type="button"
                      onClick={() => toggleSort('name')}
                      className="inline-flex items-center gap-1 hover:text-ink"
                    >
                      <span>Business</span>
                      <ArrowUpDown className="w-3 h-3" />
                    </button>
                  </th>
                  <th className="py-3 px-4 font-medium">Contact</th>
                  <th className="py-3 px-4 font-medium">City</th>
                  <th className="py-3 px-4 font-medium text-right">Orders</th>
                  <th className="py-3 px-4 font-medium text-right">
                    <button
                      type="button"
                      onClick={() => toggleSort('spent')}
                      className="inline-flex items-center gap-1 hover:text-ink"
                    >
                      <span>Total Spent</span>
                      <ArrowUpDown className="w-3 h-3" />
                    </button>
                  </th>
                  <th className="py-3 px-4 font-medium text-right">
                    <button
                      type="button"
                      onClick={() => toggleSort('outstanding')}
                      className="inline-flex items-center gap-1 hover:text-ink"
                    >
                      <span>Outstanding</span>
                      <ArrowUpDown className="w-3 h-3" />
                    </button>
                  </th>
                  <th className="py-3 px-4 font-medium">Status</th>
                  <th className="py-3 px-4 font-medium text-right">{t.common.actions}</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-hairline">
                {paged.map((b) => (
                  <tr key={b.id} className="bg-hover transition-colors">
                    <td className="py-3 px-4 font-semibold text-ink">{b.businessName}</td>
                    <td className="py-3 px-4 text-muted">
                      <div>{b.contactName}</div>
                      <div className="text-[11px] font-mono">{b.phone}</div>
                    </td>
                    <td className="py-3 px-4 text-ink">{b.city || '—'}</td>
                    <td className="py-3 px-4 text-right font-mono tabular-nums text-ink">
                      {b.totalOrders}
                    </td>
                    <td className="py-3 px-4 text-right font-mono tabular-nums font-semibold text-ink">
                      {formatMoney(b.totalSpent, currency)}
                    </td>
                    <td
                      style={{ color: 'var(--status-warn-fg)' }}
                      className="py-3 px-4 text-right font-mono tabular-nums font-semibold"
                    >
                      {formatMoney(b.outstandingBalance, currency)}
                    </td>
                    <td className="py-3 px-4">
                      <StatusTag
                        tone={b.status === 'active' ? 'emerald' : 'slate'}
                        label={b.status}
                      />
                    </td>
                    <td className="py-3 px-4 text-right whitespace-nowrap">
                      <div className="inline-flex items-center gap-1.5">
                        <button
                          type="button"
                          onClick={() => setSelected(b)}
                          className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg border border-hairline bg-hover text-ink transition-colors"
                        >
                          <UserCheck className="w-3 h-3" />
                          <span>Profile</span>
                        </button>
                        <button
                          type="button"
                          onClick={() => openEdit(b)}
                          className="p-1.5 rounded-lg border border-hairline bg-hover text-ink transition-colors"
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

      {/* Buyer Profile Drawer */}
      <Drawer
        open={Boolean(selected)}
        onClose={() => setSelected(null)}
        title={selected?.businessName || ''}
        subtitle={`${selected?.contactName || ''} · ${selected?.city || ''}`}
      >
        {selected && (
          <div className="space-y-6 text-xs">
            <div className="grid grid-cols-3 gap-3 p-4 rounded-[12px] bg-subtle border border-hairline">
              <div>
                <div className="text-[11px] text-muted">Total Orders</div>
                <div className="text-base font-mono font-bold text-ink mt-0.5">
                  {selected.totalOrders}
                </div>
              </div>
              <div>
                <div className="text-[11px] text-muted">Total Spent</div>
                <div className="text-base font-mono font-bold text-ink mt-0.5">
                  {formatMoney(selected.totalSpent, currency)}
                </div>
              </div>
              <div>
                <div className="text-[11px] text-muted">Outstanding</div>
                <div
                  style={{ color: 'var(--status-warn-fg)' }}
                  className="text-base font-mono font-bold mt-0.5"
                >
                  {formatMoney(selected.outstandingBalance, currency)}
                </div>
              </div>
            </div>

            <div>
              <h3 className="font-semibold text-ink mb-2">Purchase History</h3>
              <div className="divide-y divide-hairline border border-hairline rounded-[12px] overflow-hidden">
                {orders
                  .filter((o) => o.buyerId === selected.id)
                  .map((o) => (
                    <div key={o.id} className="px-4 py-2.5 flex items-center justify-between">
                      <div>
                        <div className="font-mono font-semibold text-ink">{o.orderCode}</div>
                        <div className="text-[11px] text-muted">
                          {o.productName} · {o.orderDate}
                        </div>
                      </div>
                      <div className="text-right">
                        <div className="font-mono font-semibold text-ink">
                          {formatMoney(o.totalAmount, o.currency)}
                        </div>
                        <div className="text-[11px] text-muted">{o.status}</div>
                      </div>
                    </div>
                  ))}
              </div>
            </div>

            <div>
              <h3 className="font-semibold text-ink mb-2">Payment History</h3>
              <div className="divide-y divide-hairline border border-hairline rounded-[12px] overflow-hidden">
                {transactions
                  .filter((tx) => tx.partyId === selected.id)
                  .map((tx) => (
                    <div key={tx.id} className="px-4 py-2.5 flex items-center justify-between">
                      <div>
                        <div className="font-mono font-medium text-ink">{tx.txCode}</div>
                        <div className="text-[11px] text-muted">
                          {tx.date} · {tx.method}
                        </div>
                      </div>
                      <div className="font-mono font-semibold text-accent">
                        {formatMoney(tx.amount, tx.currency)}
                      </div>
                    </div>
                  ))}
                {transactions.filter((tx) => tx.partyId === selected.id).length === 0 && (
                  <div className="p-4 text-muted">No recorded payments for this buyer yet.</div>
                )}
              </div>
            </div>
          </div>
        )}
      </Drawer>

      {/* Register / Edit Buyer Modal */}
      <Modal
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        title={editing ? `Edit ${editing.businessName}` : 'Register Wholesale Buyer'}
      >
        <form
          noValidate
          onSubmit={async (e) => {
            e.preventDefault();
            const errs: Record<string, string> = {};
            if (!form.businessName.trim()) errs.businessName = t.form.requiredField;
            if (!form.contactName.trim()) errs.contactName = t.form.requiredField;
            if (form.phone.trim().length < 7) errs.phone = t.form.requiredField;
            setFormErrors(errs);
            if (Object.keys(errs).length > 0) return;

            setSaving(true);
            try {
              await onSaveBuyer(
                {
                  ...form,
                  businessName: form.businessName.trim(),
                  contactName: form.contactName.trim(),
                  phone: form.phone.trim(),
                },
                !editing
              );
              setModalOpen(false);
            } finally {
              setSaving(false);
            }
          }}
          className="space-y-3.5 text-xs"
        >
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div className="sm:col-span-2">
              <label className="block font-medium text-ink mb-1">Business Name *</label>
              <input
                value={form.businessName}
                onChange={(e) => {
                  setForm({ ...form, businessName: e.target.value });
                  if (formErrors.businessName)
                    setFormErrors({ ...formErrors, businessName: '' });
                }}
                className="w-full px-3 py-2 rounded-[10px] bg-subtle border border-hairline text-ink"
              />
              {formErrors.businessName && (
                <p style={{ color: 'var(--status-danger-fg)' }} className="mt-1 text-[11px]">
                  {formErrors.businessName}
                </p>
              )}
            </div>
            <div>
              <label className="block font-medium text-ink mb-1">Contact Person *</label>
              <input
                value={form.contactName}
                onChange={(e) => {
                  setForm({ ...form, contactName: e.target.value });
                  if (formErrors.contactName)
                    setFormErrors({ ...formErrors, contactName: '' });
                }}
                className="w-full px-3 py-2 rounded-[10px] bg-subtle border border-hairline text-ink"
              />
              {formErrors.contactName && (
                <p style={{ color: 'var(--status-danger-fg)' }} className="mt-1 text-[11px]">
                  {formErrors.contactName}
                </p>
              )}
            </div>
            <div>
              <label className="block font-medium text-ink mb-1">Phone *</label>
              <input
                value={form.phone}
                onChange={(e) => {
                  setForm({ ...form, phone: e.target.value });
                  if (formErrors.phone) setFormErrors({ ...formErrors, phone: '' });
                }}
                className="w-full px-3 py-2 rounded-[10px] bg-subtle border border-hairline text-ink font-mono"
              />
              {formErrors.phone && (
                <p style={{ color: 'var(--status-danger-fg)' }} className="mt-1 text-[11px]">
                  {formErrors.phone}
                </p>
              )}
            </div>
            <div>
              <label className="block font-medium text-ink mb-1">Email</label>
              <input
                value={form.email || ''}
                onChange={(e) => setForm({ ...form, email: e.target.value })}
                className="w-full px-3 py-2 rounded-[10px] bg-subtle border border-hairline text-ink"
              />
            </div>
            <div>
              <label className="block font-medium text-ink mb-1">City</label>
              <input
                value={form.city || ''}
                onChange={(e) => setForm({ ...form, city: e.target.value })}
                className="w-full px-3 py-2 rounded-[10px] bg-subtle border border-hairline text-ink"
              />
            </div>
          </div>
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
              className="px-4 py-2 rounded-[10px] bg-accent text-on-accent font-medium transition-colors"
            >
              {saving ? t.common.loading : t.common.save}
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
