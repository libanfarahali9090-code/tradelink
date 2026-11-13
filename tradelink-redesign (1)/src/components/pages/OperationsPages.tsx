import React, { useMemo, useState } from 'react';
import { motion } from 'motion/react';
import {
  AlertTriangle,
  ArrowDownLeft,
  ArrowUpDown,
  ArrowUpRight,
  Download,
  MapPin,
  Plus,
  Search,
  Truck,
  Warehouse,
} from 'lucide-react';
import type {
  CurrencyCode,
  Delivery,
  DeliveryStatus,
  Language,
  Order,
  PlatformSettings,
  Product,
  StockMovement,
  StockMovementType,
} from '../../types/tradelink';
import { TRANSLATIONS, formatMoney } from '../../i18n/translations';
import { HERO_WAREHOUSE_IMAGE } from '../../data/productImages';
import { DURATIONS, EASE_SAAS, staggerItem, tabSlideTransition } from '../../lib/motion';
import {
  AnimatedCounter,
  EmptyState,
  Modal,
  PaginationBar,
  StatusTag,
  exportToCsv,
} from '../ui/SaasPrimitives';
import { makeId } from '../../services/firestoreService';

export function InventoryPage({
  lang,
  currency,
  products,
  onAdjustStock,
}: {
  lang: Language;
  currency: CurrencyCode;
  products: Product[];
  onAdjustStock: (params: {
    product: Product;
    type: StockMovementType;
    delta: number;
    referenceId: string;
    notes?: string;
  }) => Promise<void>;
}) {
  const t = TRANSLATIONS[lang];
  const [search, setSearch] = useState('');
  const [onlyLow, setOnlyLow] = useState(false);
  const [sortBy, setSortBy] = useState<'name' | 'stock' | 'value'>('name');
  const [sortDir, setSortDir] = useState<'asc' | 'desc'>('asc');
  const [page, setPage] = useState(1);

  const [modalProduct, setModalProduct] = useState<Product | null>(null);
  const [moveType, setMoveType] = useState<StockMovementType>('received');
  const [qty, setQty] = useState(10);
  const [referenceId, setReferenceId] = useState('');
  const [notes, setNotes] = useState('');
  const [formError, setFormError] = useState('');
  const [saving, setSaving] = useState(false);

  const valuation = useMemo(() => {
    const costValue = products.reduce((s, p) => s + p.stockQty * p.purchasePrice, 0);
    const retailValue = products.reduce((s, p) => s + p.stockQty * p.sellingPrice, 0);
    const lowCount = products.filter((p) => p.stockQty <= p.minStockQty).length;
    return { costValue, retailValue, lowCount };
  }, [products]);

  const toggleSort = (col: 'name' | 'stock' | 'value') => {
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
      .filter((p) => (onlyLow ? p.stockQty <= p.minStockQty : true))
      .filter(
        (p) =>
          !q ||
          p.name.toLowerCase().includes(q) ||
          (p.sku || '').toLowerCase().includes(q) ||
          (p.warehouseBay || '').toLowerCase().includes(q)
      )
      .sort((a, b) => {
        if (sortBy === 'stock') return (a.stockQty - b.stockQty) * mult;
        if (sortBy === 'value')
          return (a.stockQty * a.purchasePrice - b.stockQty * b.purchasePrice) * mult;
        return a.name.localeCompare(b.name) * mult;
      });
  }, [products, search, onlyLow, sortBy, sortDir]);

  const pageSize = 8;
  const paged = filtered.slice((page - 1) * pageSize, page * pageSize);

  return (
    <div className="space-y-5">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div>
          <h1 className="text-xl font-display font-bold text-ink">{t.nav.inventory}</h1>
          <p className="text-xs text-muted mt-0.5">{t.common.singleWarehouseNotice}</p>
        </div>
        <button
          type="button"
          onClick={() =>
            exportToCsv(
              'tradelink-inventory.csv',
              products.map((p) => ({
                SKU: p.sku || p.id,
                Product: p.name,
                Category: t.categories[p.category],
                Bay: p.warehouseBay || 'Central',
                Stock: p.stockQty,
                MinStock: p.minStockQty,
                Unit: p.unit,
                CostValue: p.stockQty * p.purchasePrice,
                RetailValue: p.stockQty * p.sellingPrice,
              }))
            )
          }
          className="inline-flex items-center gap-1.5 px-3.5 py-2 text-xs font-medium rounded-[10px] border border-hairline bg-surface bg-hover text-ink self-start sm:self-auto"
        >
          <Download className="w-3.5 h-3.5" />
          <span>{t.common.exportCsv}</span>
        </button>
      </div>

      {/* Valuation Strip */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <motion.div
          {...staggerItem(0, DURATIONS.dropdown)}
          className="bg-surface border border-hairline rounded-[14px] p-4 shadow-saas"
        >
          <div className="text-xs text-muted">Warehouse Cost Valuation</div>
          <div className="text-xl font-display font-bold text-ink tabular-nums mt-1">
            <AnimatedCounter value={Math.round(valuation.costValue)} prefix={`${currency} `} />
          </div>
        </motion.div>
        <motion.div
          {...staggerItem(1, DURATIONS.dropdown)}
          className="bg-surface border border-hairline rounded-[14px] p-4 shadow-saas"
        >
          <div className="text-xs text-muted">Projected Wholesale Value</div>
          <div className="text-xl font-display font-bold text-accent tabular-nums mt-1">
            <AnimatedCounter value={Math.round(valuation.retailValue)} prefix={`${currency} `} />
          </div>
        </motion.div>
        <motion.div
          {...staggerItem(2, DURATIONS.dropdown)}
          className="bg-surface border border-hairline rounded-[14px] p-4 shadow-saas"
        >
          <div className="text-xs text-muted">Low-Stock Items</div>
          <div
            style={{ color: 'var(--status-warn-fg)' }}
            className="text-xl font-display font-bold tabular-nums mt-1"
          >
            <AnimatedCounter value={valuation.lowCount} suffix=" SKUs" />
          </div>
        </motion.div>
      </div>

      {/* Filters */}
      <div className="bg-surface border border-hairline rounded-[14px] p-3.5 shadow-saas flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
        <div className="relative flex-1 max-w-md">
          <Search className="w-4 h-4 text-muted absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            value={search}
            onChange={(e) => {
              setSearch(e.target.value);
              setPage(1);
            }}
            placeholder="Search SKU, item, or warehouse bay..."
            className="w-full pl-9 pr-3 py-2 text-xs bg-subtle border border-hairline rounded-[10px] text-ink"
          />
        </div>
        <label className="inline-flex items-center gap-2 text-xs text-ink cursor-pointer">
          <input
            type="checkbox"
            checked={onlyLow}
            onChange={(e) => {
              setOnlyLow(e.target.checked);
              setPage(1);
            }}
            className="rounded border-hairline accent-[var(--accent-primary)]"
          />
          <span>Show low-stock warnings only</span>
        </label>
      </div>

      {/* Inventory Table / Mobile Cards */}
      {filtered.length === 0 ? (
        <EmptyState
          icon={<Warehouse className="w-6 h-6" />}
          title="No matching inventory items"
          description="Try clearing your search query or disabling the low-stock filter."
        />
      ) : (
        <div className="bg-surface border border-hairline rounded-[14px] shadow-saas overflow-hidden">
          <div className="md:hidden divide-y divide-hairline">
            {paged.map((p) => {
              const isLow = p.stockQty <= p.minStockQty;
              return (
                <div key={p.id} className="p-4 space-y-2.5">
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <div className="text-xs font-semibold text-ink">{p.name}</div>
                      <div className="text-[11px] font-mono text-muted">
                        {p.sku || p.id} · {p.warehouseBay || 'Central Bay'}
                      </div>
                    </div>
                    <StatusTag
                      tone={isLow ? 'amber' : 'emerald'}
                      label={isLow ? t.dashboard.lowStock : t.dashboard.healthyStock}
                    />
                  </div>
                  <div className="flex items-center justify-between text-xs">
                    <span className="font-mono font-bold text-ink">
                      {p.stockQty} {p.unit}
                    </span>
                    <button
                      type="button"
                      onClick={() => {
                        setModalProduct(p);
                        setMoveType('received');
                        setQty(20);
                        setReferenceId(`ADJ-${Math.floor(100 + Math.random() * 899)}`);
                        setNotes('');
                        setFormError('');
                      }}
                      className="px-3 py-1 rounded-lg border border-hairline bg-hover text-ink font-medium"
                    >
                      Adjust Stock
                    </button>
                  </div>
                </div>
              );
            })}
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
                      <span>SKU / Product</span>
                      <ArrowUpDown className="w-3 h-3" />
                    </button>
                  </th>
                  <th className="py-3 px-4 font-medium">Bay</th>
                  <th className="py-3 px-4 font-medium text-right">
                    <button
                      type="button"
                      onClick={() => toggleSort('stock')}
                      className="inline-flex items-center gap-1 hover:text-ink"
                    >
                      <span>Available</span>
                      <ArrowUpDown className="w-3 h-3" />
                    </button>
                  </th>
                  <th className="py-3 px-4 font-medium text-right">Min Threshold</th>
                  <th className="py-3 px-4 font-medium text-right">
                    <button
                      type="button"
                      onClick={() => toggleSort('value')}
                      className="inline-flex items-center gap-1 hover:text-ink"
                    >
                      <span>Stock Value</span>
                      <ArrowUpDown className="w-3 h-3" />
                    </button>
                  </th>
                  <th className="py-3 px-4 font-medium">Health</th>
                  <th className="py-3 px-4 font-medium text-right">Adjust</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-hairline">
                {paged.map((p) => {
                  const isLow = p.stockQty <= p.minStockQty;
                  return (
                    <tr key={p.id} className="bg-hover transition-colors">
                      <td className="py-3 px-4">
                        <div className="font-semibold text-ink">{p.name}</div>
                        <div className="text-[11px] font-mono text-muted">{p.sku || p.id}</div>
                      </td>
                      <td className="py-3 px-4 text-muted">{p.warehouseBay || 'Central Bay'}</td>
                      <td className="py-3 px-4 text-right font-mono tabular-nums font-bold text-ink">
                        {p.stockQty} {p.unit}
                      </td>
                      <td className="py-3 px-4 text-right font-mono tabular-nums text-muted">
                        {p.minStockQty}
                      </td>
                      <td className="py-3 px-4 text-right font-mono tabular-nums text-ink">
                        {formatMoney(p.stockQty * p.purchasePrice, p.currency)}
                      </td>
                      <td className="py-3 px-4">
                        <StatusTag
                          tone={isLow ? 'amber' : 'emerald'}
                          label={isLow ? t.dashboard.lowStock : t.dashboard.healthyStock}
                        />
                      </td>
                      <td className="py-3 px-4 text-right">
                        <button
                          type="button"
                          onClick={() => {
                            setModalProduct(p);
                            setMoveType('received');
                            setQty(20);
                            setReferenceId(`ADJ-${Math.floor(100 + Math.random() * 899)}`);
                            setNotes('');
                            setFormError('');
                          }}
                          className="px-3 py-1 rounded-lg border border-hairline bg-hover text-ink font-medium"
                        >
                          Adjust Stock
                        </button>
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

      {/* Stock Adjustment Modal */}
      <Modal
        open={Boolean(modalProduct)}
        onClose={() => setModalProduct(null)}
        title={`Adjust Stock · ${modalProduct?.name || ''}`}
        subtitle={`Current available stock: ${modalProduct?.stockQty ?? 0} ${modalProduct?.unit || ''}. Negative inventory is blocked.`}
      >
        {modalProduct && (
          <form
            noValidate
            onSubmit={async (e) => {
              e.preventDefault();
              if (!referenceId.trim()) {
                setFormError(t.form.requiredField);
                return;
              }
              if (!Number.isFinite(qty) || qty === 0) {
                setFormError(t.form.invalidNumber);
                return;
              }
              if (moveType !== 'adjustment' && qty < 0) {
                setFormError(t.form.invalidNumber);
                return;
              }
              const signedDelta =
                moveType === 'issued'
                  ? -Math.abs(qty)
                  : moveType === 'received'
                    ? Math.abs(qty)
                    : qty;
              if (modalProduct.stockQty + signedDelta < 0) {
                setFormError(t.form.insufficientStock);
                return;
              }
              setFormError('');
              setSaving(true);
              try {
                await onAdjustStock({
                  product: modalProduct,
                  type: moveType,
                  delta: signedDelta,
                  referenceId: referenceId.trim() || 'MANUAL-ADJ',
                  notes,
                });
                setModalProduct(null);
              } finally {
                setSaving(false);
              }
            }}
            className="space-y-4 text-xs"
          >
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block font-medium text-ink mb-1">Movement Type</label>
                <select
                  value={moveType}
                  onChange={(e) => {
                    setMoveType(e.target.value as StockMovementType);
                    setFormError('');
                  }}
                  className="w-full px-3 py-2 rounded-[10px] bg-subtle border border-hairline text-ink"
                >
                  <option value="received">Receive Stock (+)</option>
                  <option value="issued">Issue Stock (-)</option>
                  <option value="adjustment">Cycle Count Adjustment (+/-)</option>
                </select>
              </div>
              <div>
                <label className="block font-medium text-ink mb-1">
                  Quantity ({moveType === 'adjustment' ? 'signed' : 'positive'})
                </label>
                <input
                  type="number"
                  value={qty}
                  onChange={(e) => {
                    setQty(Number(e.target.value));
                    setFormError('');
                  }}
                  className="w-full px-3 py-2 rounded-[10px] bg-subtle border border-hairline text-ink font-mono"
                />
              </div>
              <div className="col-span-2">
                <label className="block font-medium text-ink mb-1">Reference Code *</label>
                <input
                  value={referenceId}
                  onChange={(e) => {
                    setReferenceId(e.target.value);
                    setFormError('');
                  }}
                  className="w-full px-3 py-2 rounded-[10px] bg-subtle border border-hairline text-ink font-mono"
                />
              </div>
              <div className="col-span-2">
                <label className="block font-medium text-ink mb-1">Notes</label>
                <input
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  className="w-full px-3 py-2 rounded-[10px] bg-subtle border border-hairline text-ink"
                  placeholder="Supplier delivery note or audit reason"
                />
              </div>
            </div>
            {formError && (
              <p style={{ color: 'var(--status-danger-fg)' }} className="text-[11px] font-medium">
                {formError}
              </p>
            )}
            <div className="flex justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={() => setModalProduct(null)}
                className="px-4 py-2 rounded-[10px] border border-hairline text-ink bg-hover"
              >
                {t.common.cancel}
              </button>
              <button
                type="submit"
                disabled={saving}
                className="px-4 py-2 rounded-[10px] bg-accent text-on-accent font-medium"
              >
                {saving ? t.common.loading : 'Apply Movement'}
              </button>
            </div>
          </form>
        )}
      </Modal>
    </div>
  );
}

export function WarehousePage({
  lang,
  settings,
  products,
}: {
  lang: Language;
  settings: PlatformSettings;
  products: Product[];
}) {
  const t = TRANSLATIONS[lang];
  const bays = useMemo(() => {
    const map = new Map<string, Product[]>();
    for (const p of products) {
      const bay = p.warehouseBay || 'Bay A1 — General';
      const arr = map.get(bay) || [];
      arr.push(p);
      map.set(bay, arr);
    }
    return Array.from(map.entries());
  }, [products]);

  const totalUnits = products.reduce((s, p) => s + p.stockQty, 0);

  return (
    <div className="space-y-5">
      <div>
        <h1 className="text-xl font-display font-bold text-ink">{t.nav.warehouse}</h1>
        <p className="text-xs text-muted mt-0.5">{t.common.singleWarehouseNotice}</p>
      </div>

      {/* Single Warehouse Overview Card */}
      <div className="bg-surface border border-hairline rounded-[14px] shadow-saas overflow-hidden grid grid-cols-1 lg:grid-cols-3">
        <div className="lg:col-span-1 h-48 lg:h-auto relative">
          <img
            src={HERO_WAREHOUSE_IMAGE}
            alt={settings.warehouseName}
            referrerPolicy="no-referrer"
            className="w-full h-full object-cover"
          />
        </div>
        <div className="lg:col-span-2 p-6 flex flex-col justify-between gap-4">
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div>
              <div className="inline-flex items-center gap-1.5 text-[11px] font-semibold text-accent uppercase tracking-wider">
                <Warehouse className="w-3.5 h-3.5" />
                <span>Primary Single-Hub Architecture</span>
              </div>
              <h2 className="text-lg font-display font-bold text-ink mt-1">
                {settings.warehouseName}
              </h2>
              <p className="text-xs text-muted flex items-center gap-1.5 mt-1">
                <MapPin className="w-3.5 h-3.5" />
                <span>{settings.location || 'Malka Jabdu, Ethiopia'}</span>
              </p>
            </div>
            <StatusTag tone="emerald" label="Operational" />
          </div>

          <div className="grid grid-cols-3 gap-4 pt-3 border-t border-hairline text-xs">
            <div>
              <div className="text-muted">Active Storage Bays</div>
              <div className="text-lg font-mono font-bold text-ink mt-0.5">
                <AnimatedCounter value={bays.length} />
              </div>
            </div>
            <div>
              <div className="text-muted">Total Stored Units</div>
              <div className="text-lg font-mono font-bold text-ink mt-0.5">
                <AnimatedCounter value={totalUnits} />
              </div>
            </div>
            <div>
              <div className="text-muted">Capacity Utilization</div>
              <div className="text-lg font-mono font-bold text-accent mt-0.5">
                <AnimatedCounter
                  value={Math.min(96, Math.round((totalUnits / 1200) * 100))}
                  suffix="%"
                />
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Bay Breakdown Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
        {bays.map(([bayName, items], idx) => {
          const bayUnits = items.reduce((s, i) => s + i.stockQty, 0);
          const hasLow = items.some((i) => i.stockQty <= i.minStockQty);
          return (
            <motion.div
              key={bayName}
              {...staggerItem(idx, DURATIONS.dropdown)}
              whileHover={{ y: -2 }}
              className="bg-surface border border-hairline rounded-[14px] p-4 space-y-3 shadow-saas hover:border-accent transition-colors"
            >
              <div className="flex items-center justify-between">
                <h3 className="text-xs font-semibold text-ink">{bayName}</h3>
                {hasLow && (
                  <AlertTriangle
                    style={{ color: 'var(--status-warn-fg)' }}
                    className="w-4 h-4"
                  />
                )}
              </div>
              <div className="text-xs text-muted font-mono">
                {items.length} SKU(s) · {bayUnits.toLocaleString()} {t.common.units}
              </div>
              <div className="space-y-1.5 pt-2 border-t border-hairline">
                {items.map((item) => (
                  <div key={item.id} className="flex items-center justify-between text-xs">
                    <span className="text-ink truncate max-w-[190px]">{item.name}</span>
                    <span className="font-mono font-semibold text-ink tabular-nums">
                      {item.stockQty}
                    </span>
                  </div>
                ))}
              </div>
            </motion.div>
          );
        })}
      </div>
    </div>
  );
}

export function StockMovementsPage({
  lang,
  movements,
}: {
  lang: Language;
  movements: StockMovement[];
}) {
  const t = TRANSLATIONS[lang];
  const [typeFilter, setTypeFilter] = useState<'all' | StockMovementType>('all');
  const [page, setPage] = useState(1);

  const filtered = movements.filter((m) =>
    typeFilter === 'all' ? true : m.type === typeFilter
  );
  const pageSize = 10;
  const paged = filtered.slice((page - 1) * pageSize, page * pageSize);

  return (
    <div className="space-y-5">
      <div>
        <h1 className="text-xl font-display font-bold text-ink">{t.nav.stock_movements}</h1>
        <p className="text-xs text-muted mt-0.5">
          Immutable ledger of every intake, order dispatch, and cycle-count reconciliation.
        </p>
      </div>

      <div className="flex items-center gap-1.5 flex-wrap">
        {(['all', 'received', 'issued', 'adjustment'] as const).map((tp) => (
          <button
            key={tp}
            type="button"
            onClick={() => {
              setTypeFilter(tp);
              setPage(1);
            }}
            className={`relative px-3 py-1.5 rounded-lg text-xs font-medium capitalize transition-colors ${
              typeFilter === tp
                ? 'text-on-accent'
                : 'bg-surface border border-hairline text-muted hover:text-ink'
            }`}
          >
            {typeFilter === tp && (
              <motion.span
                layoutId="movements-type-pill"
                transition={tabSlideTransition}
                className="absolute inset-0 bg-accent rounded-lg"
              />
            )}
            <span className="relative z-10">{tp}</span>
          </button>
        ))}
      </div>

      {filtered.length === 0 ? (
        <EmptyState
          icon={<ArrowDownLeft className="w-6 h-6" />}
          title="No stock movements recorded"
          description="No warehouse movements match this filter yet."
        />
      ) : (
        <div className="bg-surface border border-hairline rounded-[14px] shadow-saas overflow-hidden">
          <div className="overflow-x-auto max-h-[540px]">
            <table className="w-full text-left border-collapse text-xs">
              <thead className="sticky top-0 z-10 bg-surface border-b border-hairline text-muted">
                <tr>
                  <th className="py-3 px-4 font-medium">Reference</th>
                  <th className="py-3 px-4 font-medium">Product</th>
                  <th className="py-3 px-4 font-medium">Type</th>
                  <th className="py-3 px-4 font-medium text-right">Delta</th>
                  <th className="py-3 px-4 font-medium text-right">Balance After</th>
                  <th className="py-3 px-4 font-medium">Actor</th>
                  <th className="py-3 px-4 font-medium">Notes</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-hairline">
                {paged.map((m) => (
                  <tr key={m.id} className="bg-hover transition-colors">
                    <td className="py-3 px-4 font-mono font-semibold text-ink whitespace-nowrap">
                      {m.referenceId}
                    </td>
                    <td className="py-3 px-4 font-medium text-ink whitespace-nowrap">
                      {m.productName}
                    </td>
                    <td className="py-3 px-4">
                      <StatusTag
                        tone={
                          m.type === 'received'
                            ? 'emerald'
                            : m.type === 'issued'
                              ? 'sky'
                              : 'amber'
                        }
                        label={m.type}
                      />
                    </td>
                    <td className="py-3 px-4 text-right font-mono tabular-nums font-semibold">
                      <span
                        style={{
                          color:
                            m.quantityDelta >= 0
                              ? 'var(--status-success-fg)'
                              : 'var(--status-danger-fg)',
                        }}
                        className="inline-flex items-center gap-1"
                      >
                        {m.quantityDelta >= 0 ? (
                          <ArrowDownLeft className="w-3 h-3" />
                        ) : (
                          <ArrowUpRight className="w-3 h-3" />
                        )}
                        {m.quantityDelta >= 0 ? `+${m.quantityDelta}` : m.quantityDelta}
                      </span>
                    </td>
                    <td className="py-3 px-4 text-right font-mono tabular-nums text-ink">
                      {m.balanceAfter}
                    </td>
                    <td className="py-3 px-4 text-muted whitespace-nowrap">{m.actorName}</td>
                    <td className="py-3 px-4 text-muted max-w-[240px] truncate">
                      {m.notes || '—'}
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

export function DeliveriesPage({
  lang,
  deliveries,
  orders,
  onSaveDelivery,
  onUpdateStatus,
}: {
  lang: Language;
  deliveries: Delivery[];
  orders: Order[];
  onSaveDelivery: (d: Omit<Delivery, 'createdAt' | 'updatedAt'>, isNew: boolean) => Promise<void>;
  onUpdateStatus: (d: Delivery, nextStatus: DeliveryStatus) => Promise<void>;
}) {
  const t = TRANSLATIONS[lang];
  const [modalOpen, setModalOpen] = useState(false);
  const [saving, setSaving] = useState(false);
  const [formError, setFormError] = useState('');

  const openOrders = orders.filter((o) => o.status !== 'cancelled');
  const [form, setForm] = useState({
    orderId: openOrders[0]?.id || '',
    destination: 'Dire Dawa — Sabian Corridor',
    vehiclePlate: 'ET-3-84210',
    driverName: 'Mustafe Yusuf',
    scheduledDate: new Date().toISOString().slice(0, 10),
    notes: '',
  });

  const handleSchedule = async (e: React.FormEvent) => {
    e.preventDefault();
    const ord = orders.find((o) => o.id === form.orderId);
    if (!ord || !form.destination.trim() || !form.driverName.trim() || !form.vehiclePlate.trim()) {
      setFormError(t.form.requiredField);
      return;
    }
    setFormError('');
    setSaving(true);
    try {
      await onSaveDelivery(
        {
          id: makeId('del'),
          orderId: ord.id,
          orderCode: ord.orderCode,
          buyerName: ord.buyerName,
          destination: form.destination.trim(),
          vehiclePlate: form.vehiclePlate.trim(),
          driverName: form.driverName.trim(),
          scheduledDate: form.scheduledDate,
          status: 'scheduled',
          notes: form.notes || undefined,
        },
        true
      );
      setModalOpen(false);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-5">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div>
          <h1 className="text-xl font-display font-bold text-ink">{t.nav.deliveries}</h1>
          <p className="text-xs text-muted mt-0.5">
            Outbound fleet dispatch and buyer pickup tracking from Malka Jabdu loading bays.
          </p>
        </div>
        <motion.button
          type="button"
          whileHover={{ y: -1 }}
          whileTap={{ scale: 0.98 }}
          transition={{ duration: DURATIONS.button, ease: EASE_SAAS }}
          onClick={() => {
            setFormError('');
            setModalOpen(true);
          }}
          className="inline-flex items-center gap-1.5 px-3.5 py-2 text-xs font-medium rounded-[10px] bg-accent text-on-accent self-start sm:self-auto shadow-sm transition-colors"
        >
          <Plus className="w-3.5 h-3.5" />
          <span>Schedule dispatch</span>
        </motion.button>
      </div>

      {deliveries.length === 0 ? (
        <EmptyState
          icon={<Truck className="w-6 h-6" />}
          title="No scheduled dispatches"
          description="Schedule your first truck dispatch from Malka Jabdu loading bays."
          actionLabel="Schedule dispatch"
          onAction={() => setModalOpen(true)}
        />
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
          {deliveries.map((del, idx) => (
            <motion.div
              key={del.id}
              {...staggerItem(idx, DURATIONS.dropdown)}
              whileHover={{ y: -2 }}
              className="bg-surface border border-hairline rounded-[14px] p-5 space-y-3.5 text-xs shadow-saas hover:border-accent transition-colors"
            >
              <div className="flex items-start justify-between">
                <div className="flex items-center gap-2.5">
                  <div className="p-2 rounded-lg bg-accent-subtle text-accent">
                    <Truck className="w-4 h-4" />
                  </div>
                  <div>
                    <div className="font-mono font-bold text-ink">{del.orderCode}</div>
                    <div className="text-muted">{del.buyerName}</div>
                  </div>
                </div>
                <StatusTag
                  tone={
                    del.status === 'delivered'
                      ? 'emerald'
                      : del.status === 'dispatched'
                        ? 'sky'
                        : del.status === 'loading'
                          ? 'indigo'
                          : 'amber'
                  }
                  label={del.status}
                />
              </div>

              <div className="space-y-1 text-muted pt-1">
                <div>
                  Route: <span className="text-ink font-medium">{del.destination}</span>
                </div>
                <div>
                  Driver: <span className="text-ink">{del.driverName}</span> ·{' '}
                  <span className="font-mono text-ink">{del.vehiclePlate}</span>
                </div>
                <div>
                  Scheduled: <span className="font-mono text-ink">{del.scheduledDate}</span>
                </div>
              </div>

              {del.status !== 'delivered' && (
                <div className="pt-2 border-t border-hairline flex gap-2">
                  {del.status === 'scheduled' && (
                    <button
                      type="button"
                      onClick={() => onUpdateStatus(del, 'loading')}
                      className="flex-1 py-1.5 rounded-lg bg-subtle hover:bg-[var(--accent-primary)] hover:text-[var(--text-on-accent)] text-ink font-medium transition-colors"
                    >
                      Start Loading
                    </button>
                  )}
                  {del.status === 'loading' && (
                    <button
                      type="button"
                      onClick={() => onUpdateStatus(del, 'dispatched')}
                      className="flex-1 py-1.5 rounded-lg bg-subtle hover:bg-[var(--accent-primary)] hover:text-[var(--text-on-accent)] text-ink font-medium transition-colors"
                    >
                      Mark Dispatched
                    </button>
                  )}
                  {del.status === 'dispatched' && (
                    <button
                      type="button"
                      onClick={() => onUpdateStatus(del, 'delivered')}
                      className="flex-1 py-1.5 rounded-lg bg-accent text-on-accent font-medium transition-colors"
                    >
                      Confirm Delivered
                    </button>
                  )}
                </div>
              )}
            </motion.div>
          ))}
        </div>
      )}

      <Modal
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        title="Schedule Order Dispatch"
      >
        <form onSubmit={handleSchedule} noValidate className="space-y-3.5 text-xs">
          <div>
            <label className="block font-medium text-ink mb-1">Order *</label>
            <select
              value={form.orderId}
              onChange={(e) => setForm({ ...form, orderId: e.target.value })}
              className="w-full px-3 py-2 rounded-[10px] bg-subtle border border-hairline text-ink"
            >
              {openOrders.map((o) => (
                <option key={o.id} value={o.id}>
                  {o.orderCode} — {o.buyerName} ({o.productName})
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="block font-medium text-ink mb-1">Destination *</label>
            <input
              value={form.destination}
              onChange={(e) => {
                setForm({ ...form, destination: e.target.value });
                setFormError('');
              }}
              className="w-full px-3 py-2 rounded-[10px] bg-subtle border border-hairline text-ink"
            />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block font-medium text-ink mb-1">Driver Name *</label>
              <input
                value={form.driverName}
                onChange={(e) => {
                  setForm({ ...form, driverName: e.target.value });
                  setFormError('');
                }}
                className="w-full px-3 py-2 rounded-[10px] bg-subtle border border-hairline text-ink"
              />
            </div>
            <div>
              <label className="block font-medium text-ink mb-1">Vehicle Plate *</label>
              <input
                value={form.vehiclePlate}
                onChange={(e) => {
                  setForm({ ...form, vehiclePlate: e.target.value });
                  setFormError('');
                }}
                className="w-full px-3 py-2 rounded-[10px] bg-subtle border border-hairline text-ink font-mono"
              />
            </div>
          </div>
          <div>
            <label className="block font-medium text-ink mb-1">Dispatch Date</label>
            <input
              type="date"
              value={form.scheduledDate}
              onChange={(e) => setForm({ ...form, scheduledDate: e.target.value })}
              className="w-full px-3 py-2 rounded-[10px] bg-subtle border border-hairline text-ink"
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
              className="px-4 py-2 rounded-[10px] bg-accent text-on-accent font-medium transition-colors"
            >
              {saving ? t.common.loading : 'Schedule'}
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
