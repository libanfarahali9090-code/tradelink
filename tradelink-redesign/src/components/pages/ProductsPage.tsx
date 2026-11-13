import React, { useMemo, useState } from 'react';
import { motion } from 'motion/react';
import {
  AlertTriangle,
  ArrowUpDown,
  Edit3,
  Package,
  Plus,
  Search,
  Trash2,
} from 'lucide-react';
import {
  FOOD_CATEGORIES,
  type CurrencyCode,
  type Language,
  type Product,
  type ProductCategory,
  type ProductStatus,
  type Agent,
  type Supplier,
} from '../../types/tradelink';
import { TRANSLATIONS, formatMoney, getProductTitle } from '../../i18n/translations';
import { PRODUCT_PHOTO_PRESETS, resolveProductImage } from '../../data/productImages';
import { DURATIONS, EASE_SAAS, tabSlideTransition } from '../../lib/motion';
import {
  ConfirmDialog,
  EmptyState,
  Modal,
  PaginationBar,
  StatusTag,
} from '../ui/SaasPrimitives';
import { makeId } from '../../services/firestoreService';

export function ProductsPage({
  lang,
  currency,
  products,
  suppliers,
  agents,
  canManage,
  canDelete,
  onSaveProduct,
  onDeleteProduct,
  externalCreateOpen,
  onCloseExternalCreate,
}: {
  lang: Language;
  currency: CurrencyCode;
  products: Product[];
  suppliers: Supplier[];
  agents: Agent[];
  canManage: boolean;
  canDelete: boolean;
  onSaveProduct: (p: Omit<Product, 'createdAt' | 'updatedAt'>, isNew: boolean) => Promise<void>;
  onDeleteProduct: (p: Product) => Promise<void>;
  externalCreateOpen: boolean;
  onCloseExternalCreate: () => void;
}) {
  const t = TRANSLATIONS[lang];
  const [search, setSearch] = useState('');
  const [categoryFilter, setCategoryFilter] = useState<'all' | ProductCategory>('all');
  const [statusFilter, setStatusFilter] = useState<'all' | ProductStatus>('all');
  const [sortBy, setSortBy] = useState<'name' | 'stock' | 'price'>('name');
  const [sortDir, setSortDir] = useState<'asc' | 'desc'>('asc');
  const [page, setPage] = useState(1);

  const [editing, setEditing] = useState<Product | null>(null);
  const [modalOpen, setModalOpen] = useState(false);
  const [modalStep, setModalStep] = useState<1 | 2>(1);
  const [formErrors, setFormErrors] = useState<Record<string, string>>({});
  const [deleteTarget, setDeleteTarget] = useState<Product | null>(null);
  const [saving, setSaving] = useState(false);

  const [form, setForm] = useState<Omit<Product, 'createdAt' | 'updatedAt'>>({
    id: '',
    sku: '',
    name: '',
    nameSo: '',
    nameAm: '',
    category: 'rice',
    description: '',
    unit: '50kg Sack',
    purchasePrice: 0,
    sellingPrice: 0,
    currency,
    stockQty: 0,
    minStockQty: 25,
    status: 'active',
    photoUrl: 'preset:rice',
    supplierId: suppliers[0]?.id || '',
    supplierName: suppliers[0]?.name || '',
    warehouseBay: 'Bay A1',
    origin: 'Ethiopia',
    expiryDate: '2026-12-31',
    agentId: '',
    collectionLocation: '',
  });

  const openCreateModal = () => {
    setEditing(null);
    setModalStep(1);
    setFormErrors({});
    setForm({
      id: makeId('prod'),
      sku: `TL-FD-${Math.floor(100 + Math.random() * 899)}`,
      name: '',
      nameSo: '',
      nameAm: '',
      category: 'rice',
      description: '',
      unit: '50kg Sack',
      purchasePrice: 2500,
      sellingPrice: 2950,
      currency,
      stockQty: 50,
      minStockQty: 25,
      status: 'active',
      photoUrl: 'preset:rice',
      supplierId: suppliers[0]?.id || '',
      supplierName: suppliers[0]?.name || '',
      warehouseBay: 'Bay A1',
      origin: 'Ethiopia',
      expiryDate: '2026-12-31',
      agentId: agents[0]?.id || '',
      collectionLocation: '',
    });
    setModalOpen(true);
  };

  React.useEffect(() => {
    if (externalCreateOpen) {
      openCreateModal();
      onCloseExternalCreate();
    }
  }, [externalCreateOpen]);

  const openEditModal = (p: Product) => {
    setEditing(p);
    setModalStep(1);
    setFormErrors({});
    setForm({
      id: p.id,
      sku: p.sku || '',
      name: p.name,
      nameSo: p.nameSo || '',
      nameAm: p.nameAm || '',
      category: p.category,
      description: p.description || '',
      unit: p.unit,
      purchasePrice: p.purchasePrice,
      sellingPrice: p.sellingPrice,
      currency: p.currency,
      stockQty: p.stockQty,
      minStockQty: p.minStockQty,
      status: p.status,
      photoUrl: p.photoUrl || 'preset:rice',
      supplierId: p.supplierId || '',
      supplierName: p.supplierName || '',
      warehouseBay: p.warehouseBay || '',
      origin: p.origin || '',
      expiryDate: p.expiryDate || '',
      agentId: p.agentId || '',
      collectionLocation: p.collectionLocation || '',
      stockUpdatedAt: p.stockUpdatedAt,
    });
    setModalOpen(true);
  };

  const toggleSort = (col: 'name' | 'stock' | 'price') => {
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
    return products
      .filter((p) => (categoryFilter === 'all' ? true : p.category === categoryFilter))
      .filter((p) => (statusFilter === 'all' ? true : p.status === statusFilter))
      .filter((p) => {
        if (!q) return true;
        return (
          p.name.toLowerCase().includes(q) ||
          (p.sku || '').toLowerCase().includes(q) ||
          (p.supplierName || '').toLowerCase().includes(q) ||
          t.categories[p.category].toLowerCase().includes(q)
        );
      })
      .sort((a, b) => {
        if (sortBy === 'stock') return (a.stockQty - b.stockQty) * mult;
        if (sortBy === 'price') return (a.sellingPrice - b.sellingPrice) * mult;
        return a.name.localeCompare(b.name) * mult;
      });
  }, [products, categoryFilter, statusFilter, search, sortBy, sortDir, t.categories]);

  const pageSize = 8;
  const paged = filtered.slice((page - 1) * pageSize, page * pageSize);

  const validateStep1 = () => {
    const errs: Record<string, string> = {};
    if (!form.name.trim()) errs.name = t.form.requiredField;
    setFormErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const validateStep2 = () => {
    const errs: Record<string, string> = {};
    if (!form.unit.trim()) errs.unit = t.form.requiredField;
    if (!Number.isFinite(form.purchasePrice) || form.purchasePrice < 0)
      errs.purchasePrice = t.form.invalidNumber;
    if (!Number.isFinite(form.sellingPrice) || form.sellingPrice <= 0)
      errs.sellingPrice = t.form.invalidNumber;
    if (!Number.isFinite(form.stockQty) || form.stockQty < 0)
      errs.stockQty = t.form.invalidNumber;
    if (!Number.isFinite(form.minStockQty) || form.minStockQty < 0)
      errs.minStockQty = t.form.invalidNumber;
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
    if (!validateStep2()) return;

    setSaving(true);
    try {
      const sup = suppliers.find((s) => s.id === form.supplierId);
      await onSaveProduct(
        {
          ...form,
          name: form.name.trim(),
          unit: form.unit.trim(),
          supplierName: sup?.name || form.supplierName,
          stockQty: Math.max(0, Number(form.stockQty) || 0),
          minStockQty: Math.max(0, Number(form.minStockQty) || 0),
          purchasePrice: Math.max(0, Number(form.purchasePrice) || 0),
          sellingPrice: Math.max(0, Number(form.sellingPrice) || 0),
          // Stamp the time whenever stock is first entered or its quantity changes.
          stockUpdatedAt:
            !editing || editing.stockQty !== Math.max(0, Number(form.stockQty) || 0)
              ? new Date().toISOString()
              : form.stockUpdatedAt,
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
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div>
          <h1 className="text-xl font-display font-bold text-ink">{t.nav.products}</h1>
          <p className="text-xs text-muted mt-0.5">
            Food products only — {products.length} catalog SKUs in Malka Jabdu central warehouse.
          </p>
        </div>
        {canManage && (
          <motion.button
            type="button"
            whileHover={{ y: -1 }}
            whileTap={{ scale: 0.98 }}
            transition={{ duration: DURATIONS.button, ease: EASE_SAAS }}
            onClick={openCreateModal}
            className="inline-flex items-center gap-1.5 px-3.5 py-2 text-xs font-medium rounded-[10px] bg-accent text-on-accent transition-colors self-start sm:self-auto shadow-sm"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>{t.dashboard.addProduct}</span>
          </motion.button>
        )}
      </div>

      {/* Filters Toolbar */}
      <div className="bg-surface border border-hairline rounded-[14px] p-3.5 space-y-3 shadow-saas">
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
              placeholder="Search food name, SKU, supplier..."
              className="w-full pl-9 pr-3 py-2 text-xs bg-subtle border border-hairline rounded-[10px] text-ink placeholder:text-muted"
            />
          </div>
          <div className="flex items-center gap-2">
            <select
              value={statusFilter}
              onChange={(e) => {
                setStatusFilter(e.target.value as 'all' | ProductStatus);
                setPage(1);
              }}
              className="px-3 py-2 text-xs bg-subtle border border-hairline rounded-[10px] text-ink"
            >
              <option value="all">All statuses</option>
              <option value="active">Active</option>
              <option value="inactive">Inactive</option>
              <option value="archived">Archived</option>
            </select>
            <select
              value={sortBy}
              onChange={(e) => {
                const v = e.target.value as 'name' | 'stock' | 'price';
                setSortBy(v);
                setSortDir(v === 'name' ? 'asc' : 'desc');
              }}
              className="px-3 py-2 text-xs bg-subtle border border-hairline rounded-[10px] text-ink"
            >
              <option value="name">Sort: Name</option>
              <option value="stock">Sort: Stock</option>
              <option value="price">Sort: Price</option>
            </select>
          </div>
        </div>

        {/* Category Filter Tabs */}
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1">
          <button
            type="button"
            onClick={() => {
              setCategoryFilter('all');
              setPage(1);
            }}
            className={`relative px-3 py-1.5 rounded-lg text-xs font-medium whitespace-nowrap transition-colors ${
              categoryFilter === 'all' ? 'text-on-accent' : 'bg-subtle text-muted hover:text-ink'
            }`}
          >
            {categoryFilter === 'all' && (
              <motion.span
                layoutId="products-category-pill"
                transition={tabSlideTransition}
                className="absolute inset-0 bg-accent rounded-lg"
              />
            )}
            <span className="relative z-10">{t.common.all}</span>
          </button>
          {FOOD_CATEGORIES.map((cat) => (
            <button
              key={cat}
              type="button"
              onClick={() => {
                setCategoryFilter(cat);
                setPage(1);
              }}
              className={`relative px-3 py-1.5 rounded-lg text-xs font-medium whitespace-nowrap transition-colors ${
                categoryFilter === cat ? 'text-on-accent' : 'bg-subtle text-muted hover:text-ink'
              }`}
            >
              {categoryFilter === cat && (
                <motion.span
                  layoutId="products-category-pill"
                  transition={tabSlideTransition}
                  className="absolute inset-0 bg-accent rounded-lg"
                />
              )}
              <span className="relative z-10">{t.categories[cat]}</span>
            </button>
          ))}
        </div>
      </div>

      {/* Product Table / Mobile Cards */}
      {filtered.length === 0 ? (
        <EmptyState
          icon={<Package className="w-6 h-6" />}
          title="No matching food products"
          description="Adjust your category filter or add a new food SKU to the central warehouse."
          actionLabel={canManage ? t.dashboard.addProduct : undefined}
          onAction={canManage ? openCreateModal : undefined}
        />
      ) : (
        <div className="bg-surface border border-hairline rounded-[14px] shadow-saas overflow-hidden">
          {/* Mobile Cards */}
          <div className="md:hidden divide-y divide-hairline">
            {paged.map((p) => {
              const isLow = p.stockQty <= p.minStockQty;
              return (
                <div key={p.id} className="p-4 space-y-3">
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex items-center gap-3 min-w-0">
                      <img
                        src={resolveProductImage(p.photoUrl, p.category)}
                        alt={p.name}
                        referrerPolicy="no-referrer"
                        className="w-11 h-11 rounded-lg object-cover border border-hairline shrink-0"
                      />
                      <div className="min-w-0">
                        <div className="text-xs font-semibold text-ink truncate">
                          {getProductTitle(p, lang)}
                        </div>
                        <div className="text-[11px] text-muted font-mono">
                          {p.sku || p.id} · {t.categories[p.category]}
                        </div>
                      </div>
                    </div>
                    <StatusTag
                      tone={
                        p.status === 'active'
                          ? 'emerald'
                          : p.status === 'inactive'
                            ? 'amber'
                            : 'slate'
                      }
                      label={p.status}
                    />
                  </div>
                  <div className="flex items-center justify-between text-xs">
                    <div>
                      <span className="text-muted">Selling: </span>
                      <span className="font-mono font-semibold text-ink">
                        {formatMoney(p.sellingPrice, p.currency)}
                      </span>
                    </div>
                    <div className="font-mono tabular-nums">
                      <span
                        style={{ color: isLow ? 'var(--status-warn-fg)' : undefined }}
                        className="font-semibold text-ink"
                      >
                        {p.stockQty} {p.unit}
                      </span>
                    </div>
                  </div>
                  {(canManage || canDelete) && (
                    <div className="flex justify-end gap-2 pt-1">
                      {canManage && (
                        <button
                          type="button"
                          onClick={() => openEditModal(p)}
                          className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg border border-hairline bg-hover text-xs text-ink"
                        >
                          <Edit3 className="w-3 h-3" />
                          <span>{t.common.edit}</span>
                        </button>
                      )}
                      {canDelete && (
                        <button
                          type="button"
                          onClick={() => setDeleteTarget(p)}
                          style={{ color: 'var(--status-danger-fg)' }}
                          className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg border border-hairline bg-hover text-xs"
                        >
                          <Trash2 className="w-3 h-3" />
                          <span>{t.common.delete}</span>
                        </button>
                      )}
                    </div>
                  )}
                </div>
              );
            })}
          </div>

          {/* Desktop Sticky Header Table */}
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
                      <span>Product</span>
                      <ArrowUpDown className="w-3 h-3" />
                    </button>
                  </th>
                  <th className="py-3 px-4 font-medium">Category</th>
                  <th className="py-3 px-4 font-medium">Unit</th>
                  <th className="py-3 px-4 font-medium text-right">Purchase</th>
                  <th className="py-3 px-4 font-medium text-right">
                    <button
                      type="button"
                      onClick={() => toggleSort('price')}
                      className="inline-flex items-center gap-1 hover:text-ink"
                    >
                      <span>Selling</span>
                      <ArrowUpDown className="w-3 h-3" />
                    </button>
                  </th>
                  <th className="py-3 px-4 font-medium text-right">
                    <button
                      type="button"
                      onClick={() => toggleSort('stock')}
                      className="inline-flex items-center gap-1 hover:text-ink"
                    >
                      <span>Stock</span>
                      <ArrowUpDown className="w-3 h-3" />
                    </button>
                  </th>
                  <th className="py-3 px-4 font-medium">Status</th>
                  <th className="py-3 px-4 font-medium text-right">{t.common.actions}</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-hairline">
                {paged.map((p) => {
                  const isLow = p.stockQty <= p.minStockQty;
                  return (
                    <tr key={p.id} className="bg-hover transition-colors">
                      <td className="py-3 px-4">
                        <div className="flex items-center gap-3">
                          <img
                            src={resolveProductImage(p.photoUrl, p.category)}
                            alt={p.name}
                            referrerPolicy="no-referrer"
                            className="w-10 h-10 rounded-lg object-cover border border-hairline shrink-0"
                          />
                          <div className="min-w-0">
                            <div className="font-semibold text-ink truncate max-w-[220px]">
                              {getProductTitle(p, lang)}
                            </div>
                            <div className="text-[11px] text-muted font-mono">
                              {p.sku || p.id} · {p.warehouseBay || 'Central Bay'}
                            </div>
                          </div>
                        </div>
                      </td>
                      <td className="py-3 px-4 text-ink whitespace-nowrap">
                        {t.categories[p.category]}
                      </td>
                      <td className="py-3 px-4 text-muted whitespace-nowrap">{p.unit}</td>
                      <td className="py-3 px-4 text-right font-mono tabular-nums text-muted whitespace-nowrap">
                        {formatMoney(p.purchasePrice, p.currency)}
                      </td>
                      <td className="py-3 px-4 text-right font-mono tabular-nums font-semibold text-ink whitespace-nowrap">
                        {formatMoney(p.sellingPrice, p.currency)}
                      </td>
                      <td className="py-3 px-4 text-right whitespace-nowrap">
                        <span
                          style={{ color: isLow ? 'var(--status-warn-fg)' : undefined }}
                          className="inline-flex items-center gap-1 font-mono tabular-nums font-semibold text-ink"
                        >
                          {isLow && <AlertTriangle className="w-3 h-3" />}
                          {p.stockQty}
                        </span>
                        <span className="text-[11px] text-muted ml-1">/ {p.minStockQty}</span>
                      </td>
                      <td className="py-3 px-4">
                        <StatusTag
                          tone={
                            p.status === 'active'
                              ? 'emerald'
                              : p.status === 'inactive'
                                ? 'amber'
                                : 'slate'
                          }
                          label={p.status}
                        />
                      </td>
                      <td className="py-3 px-4 text-right whitespace-nowrap">
                        <div className="inline-flex items-center gap-1.5">
                          {canManage && (
                            <button
                              type="button"
                              onClick={() => openEditModal(p)}
                              className="p-1.5 rounded-lg border border-hairline bg-hover text-ink transition-colors"
                              title={t.common.edit}
                              aria-label={t.common.edit}
                            >
                              <Edit3 className="w-3.5 h-3.5" />
                            </button>
                          )}
                          {canDelete && (
                            <button
                              type="button"
                              onClick={() => setDeleteTarget(p)}
                              style={{ color: 'var(--status-danger-fg)' }}
                              className="p-1.5 rounded-lg border border-hairline bg-hover transition-colors"
                              title={t.common.delete}
                              aria-label={t.common.delete}
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })}
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

      {/* Multi-Step Add / Edit Product Modal */}
      <Modal
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        title={editing ? `Edit ${editing.name}` : 'Add Food Product'}
        subtitle={`${t.form.stepOf} ${modalStep} / 2 · Food staples across 8 categories`}
        maxWidth="max-w-2xl"
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
                  {stepNum === 1 ? '1. Product & Localization' : '2. Pricing & Warehouse Stock'}
                </span>
              </button>
            ))}
          </div>

          {modalStep === 1 ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
              <div>
                <label className="block font-medium text-ink mb-1">Product Name (EN) *</label>
                <input
                  value={form.name}
                  onChange={(e) => {
                    setForm({ ...form, name: e.target.value });
                    if (formErrors.name) setFormErrors({ ...formErrors, name: '' });
                  }}
                  className="w-full px-3 py-2 rounded-[10px] bg-subtle border border-hairline text-ink"
                  placeholder="e.g., Long-Grain Basmati Rice (50kg)"
                />
                {formErrors.name && (
                  <p style={{ color: 'var(--status-danger-fg)' }} className="mt-1 text-[11px]">
                    {formErrors.name}
                  </p>
                )}
              </div>
              <div>
                <label className="block font-medium text-ink mb-1">SKU</label>
                <input
                  value={form.sku || ''}
                  onChange={(e) => setForm({ ...form, sku: e.target.value })}
                  className="w-full px-3 py-2 rounded-[10px] bg-subtle border border-hairline text-ink font-mono"
                />
              </div>
              <div>
                <label className="block font-medium text-ink mb-1">Name (Somali)</label>
                <input
                  value={form.nameSo || ''}
                  onChange={(e) => setForm({ ...form, nameSo: e.target.value })}
                  className="w-full px-3 py-2 rounded-[10px] bg-subtle border border-hairline text-ink"
                />
              </div>
              <div>
                <label className="block font-medium text-ink mb-1">Name (Amharic)</label>
                <input
                  value={form.nameAm || ''}
                  onChange={(e) => setForm({ ...form, nameAm: e.target.value })}
                  className="w-full px-3 py-2 rounded-[10px] bg-subtle border border-hairline text-ink"
                />
              </div>
              <div>
                <label className="block font-medium text-ink mb-1">Food Category *</label>
                <select
                  value={form.category}
                  onChange={(e) =>
                    setForm({ ...form, category: e.target.value as ProductCategory })
                  }
                  className="w-full px-3 py-2 rounded-[10px] bg-subtle border border-hairline text-ink"
                >
                  {FOOD_CATEGORIES.map((c) => (
                    <option key={c} value={c}>
                      {t.categories[c]}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block font-medium text-ink mb-1">Supplier</label>
                <select
                  value={form.supplierId || ''}
                  onChange={(e) => setForm({ ...form, supplierId: e.target.value })}
                  className="w-full px-3 py-2 rounded-[10px] bg-subtle border border-hairline text-ink"
                >
                  <option value="">Select supplier</option>
                  {suppliers.map((s) => (
                    <option key={s.id} value={s.id}>
                      {s.name}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block font-medium text-ink mb-1">Product Image Preset</label>
                <select
                  value={form.photoUrl || 'preset:rice'}
                  onChange={(e) => setForm({ ...form, photoUrl: e.target.value })}
                  className="w-full px-3 py-2 rounded-[10px] bg-subtle border border-hairline text-ink"
                >
                  {PRODUCT_PHOTO_PRESETS.map((preset) => (
                    <option key={preset.key} value={preset.key}>
                      {preset.label}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block font-medium text-ink mb-1">Warehouse Bay</label>
                <input
                  value={form.warehouseBay || ''}
                  onChange={(e) => setForm({ ...form, warehouseBay: e.target.value })}
                  className="w-full px-3 py-2 rounded-[10px] bg-subtle border border-hairline text-ink"
                  placeholder="Bay A1 — Dry Grains"
                />
              </div>
              <div>
                <label className="block font-medium text-ink mb-1">Agent (public contact)</label>
                <select
                  value={form.agentId || ''}
                  onChange={(e) => setForm({ ...form, agentId: e.target.value })}
                  className="w-full px-3 py-2 rounded-[10px] bg-subtle border border-hairline text-ink"
                >
                  <option value="">No agent — customers reach the TradeLink office</option>
                  {agents
                    .filter((a) => a.status === 'active')
                    .map((a) => (
                      <option key={a.id} value={a.id}>
                        {a.code} — {a.name}
                      </option>
                    ))}
                </select>
              </div>
              <div>
                <label className="block font-medium text-ink mb-1">Collection location</label>
                <input
                  value={form.collectionLocation || ''}
                  onChange={(e) => setForm({ ...form, collectionLocation: e.target.value })}
                  className="w-full px-3 py-2 rounded-[10px] bg-subtle border border-hairline text-ink"
                  placeholder="Malka Jabdu Central Warehouse, Bay A1"
                />
                <p className="text-xs text-muted mt-1">Shown to customers. Leave blank to use the warehouse name and bay.</p>
              </div>
            </div>
          ) : (
            <div className="space-y-3.5">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                <div>
                  <label className="block font-medium text-ink mb-1">Unit of Measurement *</label>
                  <input
                    value={form.unit}
                    onChange={(e) => {
                      setForm({ ...form, unit: e.target.value });
                      if (formErrors.unit) setFormErrors({ ...formErrors, unit: '' });
                    }}
                    className="w-full px-3 py-2 rounded-[10px] bg-subtle border border-hairline text-ink"
                    placeholder="50kg Sack / 20L Jerrycan / Carton"
                  />
                  {formErrors.unit && (
                    <p style={{ color: 'var(--status-danger-fg)' }} className="mt-1 text-[11px]">
                      {formErrors.unit}
                    </p>
                  )}
                </div>
                <div>
                  <label className="block font-medium text-ink mb-1">Status</label>
                  <select
                    value={form.status}
                    onChange={(e) => setForm({ ...form, status: e.target.value as ProductStatus })}
                    className="w-full px-3 py-2 rounded-[10px] bg-subtle border border-hairline text-ink"
                  >
                    <option value="active">Active</option>
                    <option value="inactive">Inactive</option>
                    <option value="archived">Archived</option>
                  </select>
                </div>
                <div>
                  <label className="block font-medium text-ink mb-1">
                    Purchase Price ({form.currency})
                  </label>
                  <input
                    type="number"
                    min={0}
                    value={form.purchasePrice}
                    onChange={(e) => setForm({ ...form, purchasePrice: Number(e.target.value) })}
                    className="w-full px-3 py-2 rounded-[10px] bg-subtle border border-hairline text-ink font-mono"
                  />
                  {formErrors.purchasePrice && (
                    <p style={{ color: 'var(--status-danger-fg)' }} className="mt-1 text-[11px]">
                      {formErrors.purchasePrice}
                    </p>
                  )}
                </div>
                <div>
                  <label className="block font-medium text-ink mb-1">
                    Selling Price ({form.currency}) *
                  </label>
                  <input
                    type="number"
                    min={1}
                    value={form.sellingPrice}
                    onChange={(e) => setForm({ ...form, sellingPrice: Number(e.target.value) })}
                    className="w-full px-3 py-2 rounded-[10px] bg-subtle border border-hairline text-ink font-mono"
                  />
                  {formErrors.sellingPrice && (
                    <p style={{ color: 'var(--status-danger-fg)' }} className="mt-1 text-[11px]">
                      {formErrors.sellingPrice}
                    </p>
                  )}
                </div>
                <div>
                  <label className="block font-medium text-ink mb-1">Available Stock *</label>
                  <input
                    type="number"
                    min={0}
                    value={form.stockQty}
                    onChange={(e) => setForm({ ...form, stockQty: Number(e.target.value) })}
                    className="w-full px-3 py-2 rounded-[10px] bg-subtle border border-hairline text-ink font-mono"
                  />
                  {formErrors.stockQty && (
                    <p style={{ color: 'var(--status-danger-fg)' }} className="mt-1 text-[11px]">
                      {formErrors.stockQty}
                    </p>
                  )}
                </div>
                <div>
                  <label className="block font-medium text-ink mb-1">Minimum Stock Alert *</label>
                  <input
                    type="number"
                    min={0}
                    value={form.minStockQty}
                    onChange={(e) => setForm({ ...form, minStockQty: Number(e.target.value) })}
                    className="w-full px-3 py-2 rounded-[10px] bg-subtle border border-hairline text-ink font-mono"
                  />
                  {formErrors.minStockQty && (
                    <p style={{ color: 'var(--status-danger-fg)' }} className="mt-1 text-[11px]">
                      {formErrors.minStockQty}
                    </p>
                  )}
                </div>
              </div>
              <div>
                <label className="block font-medium text-ink mb-1">Description</label>
                <textarea
                  rows={2}
                  value={form.description || ''}
                  onChange={(e) => setForm({ ...form, description: e.target.value })}
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
                className="px-4 py-2 rounded-[10px] bg-accent text-on-accent font-medium disabled:opacity-60 transition-colors"
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

      {/* Delete Confirmation */}
      <ConfirmDialog
        open={Boolean(deleteTarget)}
        title="Delete Product"
        message={`${t.common.confirmDelete} (${deleteTarget?.name || ''})`}
        confirmLabel={t.common.delete}
        cancelLabel={t.common.cancel}
        onCancel={() => setDeleteTarget(null)}
        onConfirm={async () => {
          if (!deleteTarget) return;
          const target = deleteTarget;
          setDeleteTarget(null);
          await onDeleteProduct(target);
        }}
      />
    </div>
  );
}
