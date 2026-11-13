import React, { useMemo, useState } from 'react';
import { motion } from 'motion/react';
import { Activity, Check, Download, Shield } from 'lucide-react';
import {
  FOOD_CATEGORIES,
  type AuditEvent,
  type Buyer,
  type CurrencyCode,
  type Language,
  type Order,
  type PlatformSettings,
  type Product,
  type Supplier,
  type ThemeMode,
  type UserProfile,
  type UserRole,
} from '../../types/tradelink';
import { TRANSLATIONS, formatMoney } from '../../i18n/translations';
import {
  DURATIONS,
  EASE_SAAS,
  staggerItem,
  tabSlideTransition,
} from '../../lib/motion';
import {
  EmptyState,
  PaginationBar,
  StatusTag,
  exportToCsv,
} from '../ui/SaasPrimitives';

export function AnalyticsPage({
  lang,
  currency,
  products,
  orders,
  buyers,
  suppliers,
}: {
  lang: Language;
  currency: CurrencyCode;
  products: Product[];
  orders: Order[];
  buyers: Buyer[];
  suppliers: Supplier[];
}) {
  const t = TRANSLATIONS[lang];

  const categoryBreakdown = useMemo(() => {
    return FOOD_CATEGORIES.map((cat) => {
      const catProds = products.filter((p) => p.category === cat);
      const stockUnits = catProds.reduce((s, p) => s + p.stockQty, 0);
      const catProdIds = new Set(catProds.map((p) => p.id));
      const sales = orders
        .filter((o) => o.status !== 'cancelled' && catProdIds.has(o.productId))
        .reduce((s, o) => s + o.totalAmount, 0);
      return {
        category: cat,
        label: t.categories[cat],
        stockUnits,
        sales,
      };
    }).sort((a, b) => b.sales - a.sales);
  }, [products, orders, t.categories]);

  const maxCatSales = Math.max(...categoryBreakdown.map((c) => c.sales), 1);

  return (
    <div className="space-y-5">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div>
          <h1 className="text-xl font-display font-bold text-ink">{t.nav.analytics}</h1>
          <p className="text-xs text-muted mt-0.5">
            Category performance, top wholesale buyers, supplier reliability, and unit margins.
          </p>
        </div>
        <button
          type="button"
          onClick={() =>
            exportToCsv(
              'tradelink-analytics.csv',
              categoryBreakdown.map((c) => ({
                Category: c.label,
                StockUnits: c.stockUnits,
                SalesRevenue: c.sales,
                Currency: currency,
              }))
            )
          }
          className="inline-flex items-center gap-1.5 px-3.5 py-2 text-xs font-medium rounded-[10px] border border-hairline bg-surface bg-hover text-ink self-start sm:self-auto"
        >
          <Download className="w-3.5 h-3.5" />
          <span>{t.common.exportCsv}</span>
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
        <div className="bg-surface border border-hairline rounded-[14px] p-5 space-y-4 text-xs shadow-saas">
          <h2 className="text-sm font-semibold text-ink">Sales by Food Category</h2>
          <div className="space-y-3">
            {categoryBreakdown.map((c, idx) => (
              <div key={c.category} className="space-y-1">
                <div className="flex justify-between">
                  <span className="font-medium text-ink">{c.label}</span>
                  <span className="font-mono tabular-nums text-ink">
                    {formatMoney(c.sales, currency)}
                  </span>
                </div>
                <div className="h-2 rounded-full bg-subtle overflow-hidden">
                  <motion.div
                    initial={{ scaleX: 0 }}
                    animate={{ scaleX: 1 }}
                    transition={{
                      delay: idx * 0.035,
                      duration: 0.4,
                      ease: EASE_SAAS,
                    }}
                    style={{
                      width: `${Math.max(4, Math.round((c.sales / maxCatSales) * 100))}%`,
                      transformOrigin: 'left',
                      backgroundColor: 'var(--accent-primary)',
                    }}
                    className="h-full rounded-full"
                  />
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="bg-surface border border-hairline rounded-[14px] p-5 space-y-4 text-xs shadow-saas">
          <h2 className="text-sm font-semibold text-ink">Top Buyers & Supplier Reliability</h2>
          <div className="space-y-2.5">
            <div className="text-[11px] font-semibold text-muted uppercase tracking-wider">
              Top Buyers by Volume
            </div>
            {[...buyers]
              .sort((a, b) => b.totalSpent - a.totalSpent)
              .slice(0, 4)
              .map((b) => (
                <div
                  key={b.id}
                  className="flex items-center justify-between py-1.5 border-b border-hairline last:border-0"
                >
                  <span className="font-medium text-ink">{b.businessName}</span>
                  <span className="font-mono font-semibold text-ink tabular-nums">
                    {formatMoney(b.totalSpent, currency)}
                  </span>
                </div>
              ))}
          </div>

          <div className="space-y-2.5 pt-2">
            <div className="text-[11px] font-semibold text-muted uppercase tracking-wider">
              Supplier On-Time Rate
            </div>
            {suppliers.map((s) => (
              <div key={s.id} className="flex items-center justify-between">
                <span className="text-ink">{s.name}</span>
                <span className="font-mono font-semibold text-accent">{s.onTimeRate}%</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

export function TeamMembersPage({
  lang,
  members,
  canManageTeam,
  onUpdateRole,
}: {
  lang: Language;
  members: UserProfile[];
  canManageTeam: boolean;
  onUpdateRole: (member: UserProfile, role: UserRole, active: boolean) => Promise<void>;
}) {
  const t = TRANSLATIONS[lang];

  return (
    <div className="space-y-5">
      <div>
        <h1 className="text-xl font-display font-bold text-ink">{t.nav.team_members}</h1>
        <p className="text-xs text-muted mt-0.5">
          Role-Based Access Control (RBAC): Owner has full access, Manager manages operations, Employee handles warehouse & orders.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-xs">
        {[
          {
            role: 'Owner / Admin',
            desc: 'Full platform control, owner commission settlement, team permissions, financial reports, and delete privileges.',
          },
          {
            role: 'Operations Manager',
            desc: 'Manage products, suppliers, buyers, stock adjustments, order dispatches, and financial transactions.',
          },
          {
            role: 'Warehouse Employee',
            desc: 'Process orders, record dispatch deliveries, view catalog, and update stock counts.',
          },
        ].map((item, idx) => (
          <motion.div
            key={item.role}
            {...staggerItem(idx, DURATIONS.dropdown)}
            className="bg-surface border border-hairline rounded-[14px] p-4 space-y-1.5 shadow-saas"
          >
            <div className="flex items-center gap-1.5 font-semibold text-ink">
              <Shield className="w-3.5 h-3.5 text-accent" />
              <span>{item.role}</span>
            </div>
            <p className="text-muted leading-relaxed">{item.desc}</p>
          </motion.div>
        ))}
      </div>

      <div className="bg-surface border border-hairline rounded-[14px] shadow-saas overflow-hidden">
        <div className="md:hidden divide-y divide-hairline">
          {members.map((m) => (
            <div key={m.uid} className="p-4 space-y-2.5 text-xs">
              <div className="flex items-center justify-between">
                <div>
                  <div className="font-semibold text-ink">{m.displayName}</div>
                  <div className="font-mono text-[11px] text-muted">{m.email}</div>
                </div>
                <StatusTag
                  tone={m.active ? 'emerald' : 'rose'}
                  label={m.active ? 'Active' : 'Suspended'}
                />
              </div>
              {canManageTeam && (
                <div className="flex items-center gap-2 pt-1">
                  <select
                    value={m.role}
                    onChange={(e) => onUpdateRole(m, e.target.value as UserRole, m.active)}
                    className="flex-1 px-2.5 py-1.5 rounded-lg bg-subtle border border-hairline text-ink text-xs"
                  >
                    <option value="owner">Owner</option>
                    <option value="manager">Manager</option>
                    <option value="employee">Employee</option>
                    <option value="pending">Pending</option>
                  </select>
                  <button
                    type="button"
                    onClick={() => onUpdateRole(m, m.role, !m.active)}
                    className="px-3 py-1.5 rounded-lg border border-hairline bg-hover text-ink"
                  >
                    {m.active ? 'Suspend' : 'Activate'}
                  </button>
                </div>
              )}
            </div>
          ))}
        </div>

        <div className="hidden md:block overflow-x-auto max-h-[500px]">
          <table className="w-full text-left border-collapse text-xs">
            <thead className="sticky top-0 z-10 bg-surface border-b border-hairline text-muted">
              <tr>
                <th className="py-3 px-4 font-medium">Member</th>
                <th className="py-3 px-4 font-medium">Email</th>
                <th className="py-3 px-4 font-medium">Role</th>
                <th className="py-3 px-4 font-medium">Status</th>
                {canManageTeam && <th className="py-3 px-4 font-medium text-right">Controls</th>}
              </tr>
            </thead>
            <tbody className="divide-y divide-hairline">
              {members.map((m) => (
                <tr key={m.uid} className="bg-hover transition-colors">
                  <td className="py-3 px-4 font-semibold text-ink">{m.displayName}</td>
                  <td className="py-3 px-4 font-mono text-muted">{m.email}</td>
                  <td className="py-3 px-4 capitalize font-medium text-ink">{m.role}</td>
                  <td className="py-3 px-4">
                    <StatusTag
                      tone={m.active ? 'emerald' : 'rose'}
                      label={m.active ? 'Active' : 'Suspended'}
                    />
                  </td>
                  {canManageTeam && (
                    <td className="py-3 px-4 text-right whitespace-nowrap">
                      <div className="inline-flex items-center gap-2">
                        <select
                          value={m.role}
                          onChange={(e) =>
                            onUpdateRole(m, e.target.value as UserRole, m.active)
                          }
                          className="px-2.5 py-1 rounded-lg bg-subtle border border-hairline text-ink text-xs"
                        >
                          <option value="owner">Owner</option>
                          <option value="manager">Manager</option>
                          <option value="employee">Employee</option>
                          <option value="pending">Pending</option>
                        </select>
                        <button
                          type="button"
                          onClick={() => onUpdateRole(m, m.role, !m.active)}
                          className="px-2.5 py-1 rounded-lg border border-hairline bg-hover text-ink"
                        >
                          {m.active ? 'Suspend' : 'Activate'}
                        </button>
                      </div>
                    </td>
                  )}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

export function ActivityLogsPage({
  lang,
  events,
}: {
  lang: Language;
  events: AuditEvent[];
}) {
  const t = TRANSLATIONS[lang];
  const [catFilter, setCatFilter] = useState<'all' | AuditEvent['category']>('all');
  const [page, setPage] = useState(1);

  const filtered = events.filter((e) =>
    catFilter === 'all' ? true : e.category === catFilter
  );
  const pageSize = 10;
  const paged = filtered.slice((page - 1) * pageSize, page * pageSize);

  return (
    <div className="space-y-5">
      <div>
        <h1 className="text-xl font-display font-bold text-ink">{t.nav.activity_logs}</h1>
        <p className="text-xs text-muted mt-0.5">
          Tamper-evident audit trail across orders, stock movements, payments, and settings.
        </p>
      </div>

      <div className="flex items-center gap-1.5 flex-wrap">
        {(
          ['all', 'order', 'inventory', 'payment', 'supplier', 'buyer', 'team', 'settings'] as const
        ).map((cat) => (
          <button
            key={cat}
            type="button"
            onClick={() => {
              setCatFilter(cat);
              setPage(1);
            }}
            className={`relative px-3 py-1.5 rounded-lg text-xs font-medium capitalize transition-colors ${
              catFilter === cat
                ? 'text-on-accent'
                : 'bg-surface border border-hairline text-muted hover:text-ink'
            }`}
          >
            {catFilter === cat && (
              <motion.span
                layoutId="activity-cat-pill"
                transition={tabSlideTransition}
                className="absolute inset-0 bg-accent rounded-lg"
              />
            )}
            <span className="relative z-10">{cat}</span>
          </button>
        ))}
      </div>

      {filtered.length === 0 ? (
        <EmptyState
          icon={<Activity className="w-6 h-6" />}
          title="No activity events in this category"
          description="Select another category or All to view the full operational audit trail."
        />
      ) : (
        <div className="bg-surface border border-hairline rounded-[14px] shadow-saas overflow-hidden">
          <div className="divide-y divide-hairline">
            {paged.map((evt, idx) => (
              <motion.div
                key={evt.id}
                initial={{ opacity: 0, x: -6 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{
                  delay: Math.min(idx * 0.025, 0.2),
                  duration: DURATIONS.dropdown,
                  ease: EASE_SAAS,
                }}
                className="px-5 py-3.5 flex items-start justify-between gap-4 text-xs bg-hover transition-colors"
              >
                <div className="flex items-start gap-3">
                  <div className="p-2 rounded-lg bg-subtle text-accent shrink-0">
                    <Activity className="w-3.5 h-3.5" />
                  </div>
                  <div>
                    <div className="font-medium text-ink">{evt.summary}</div>
                    <div className="text-[11px] text-muted mt-0.5">
                      {evt.actorName} ({evt.actorRole}) ·{' '}
                      <span className="font-mono">{evt.action}</span>
                    </div>
                  </div>
                </div>
                <StatusTag tone="slate" label={evt.category} />
              </motion.div>
            ))}
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

export function SettingsPage({
  lang,
  theme,
  settings,
  canEditSettings,
  onChangeLang,
  onToggleTheme,
  onSaveSettings,
}: {
  lang: Language;
  theme: ThemeMode;
  settings: PlatformSettings;
  canEditSettings: boolean;
  onChangeLang: (lang: Language) => void;
  onToggleTheme: () => void;
  onSaveSettings: (next: Omit<PlatformSettings, 'updatedAt'>) => Promise<void>;
}) {
  const t = TRANSLATIONS[lang];
  const [form, setForm] = useState<Omit<PlatformSettings, 'updatedAt'>>({
    id: settings.id || 'default',
    businessName: settings.businessName,
    warehouseName: settings.warehouseName,
    location: settings.location || '',
    phone: settings.phone || '',
    email: settings.email || '',
    currency: settings.currency,
    defaultLanguage: settings.defaultLanguage,
    commissionRatePercent: settings.commissionRatePercent,
    lowStockAlertEnabled: settings.lowStockAlertEnabled,
    orderAlertEnabled: settings.orderAlertEnabled ?? true,
    paymentAlertEnabled: settings.paymentAlertEnabled ?? true,
  });
  const [formErrors, setFormErrors] = useState<Record<string, string>>({});
  const [saving, setSaving] = useState(false);

  return (
    <div className="space-y-5 max-w-3xl">
      <div>
        <h1 className="text-xl font-display font-bold text-ink">{t.nav.settings}</h1>
        <p className="text-xs text-muted mt-0.5">
          Configure TradeLink business identity, single-warehouse hub, owner commission rate, language, and theme.
        </p>
      </div>

      <form
        noValidate
        onSubmit={async (e) => {
          e.preventDefault();
          const errs: Record<string, string> = {};
          if (!form.businessName.trim()) errs.businessName = t.form.requiredField;
          if (!form.warehouseName.trim()) errs.warehouseName = t.form.requiredField;
          if (
            !Number.isFinite(form.commissionRatePercent) ||
            form.commissionRatePercent < 0 ||
            form.commissionRatePercent > 50
          ) {
            errs.commissionRatePercent = t.form.invalidRate;
          }
          setFormErrors(errs);
          if (Object.keys(errs).length > 0) return;

          setSaving(true);
          try {
            await onSaveSettings({
              ...form,
              businessName: form.businessName.trim(),
              warehouseName: form.warehouseName.trim(),
            });
            onChangeLang(form.defaultLanguage);
          } finally {
            setSaving(false);
          }
        }}
        className="bg-surface border border-hairline rounded-[14px] p-6 space-y-5 text-xs shadow-saas"
      >
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="block font-medium text-ink mb-1">Business Name *</label>
            <input
              disabled={!canEditSettings}
              value={form.businessName}
              onChange={(e) => {
                setForm({ ...form, businessName: e.target.value });
                if (formErrors.businessName)
                  setFormErrors({ ...formErrors, businessName: '' });
              }}
              className="w-full px-3 py-2 rounded-[10px] bg-subtle border border-hairline text-ink disabled:opacity-60"
            />
            {formErrors.businessName && (
              <p style={{ color: 'var(--status-danger-fg)' }} className="mt-1 text-[11px]">
                {formErrors.businessName}
              </p>
            )}
          </div>
          <div>
            <label className="block font-medium text-ink mb-1">
              Central Warehouse (Single Hub) *
            </label>
            <input
              disabled={!canEditSettings}
              value={form.warehouseName}
              onChange={(e) => {
                setForm({ ...form, warehouseName: e.target.value });
                if (formErrors.warehouseName)
                  setFormErrors({ ...formErrors, warehouseName: '' });
              }}
              className="w-full px-3 py-2 rounded-[10px] bg-subtle border border-hairline text-ink disabled:opacity-60"
            />
            {formErrors.warehouseName && (
              <p style={{ color: 'var(--status-danger-fg)' }} className="mt-1 text-[11px]">
                {formErrors.warehouseName}
              </p>
            )}
          </div>
          <div>
            <label className="block font-medium text-ink mb-1">Location</label>
            <input
              disabled={!canEditSettings}
              value={form.location || ''}
              onChange={(e) => setForm({ ...form, location: e.target.value })}
              className="w-full px-3 py-2 rounded-[10px] bg-subtle border border-hairline text-ink disabled:opacity-60"
            />
          </div>
          <div>
            <label className="block font-medium text-ink mb-1">Contact Phone</label>
            <input
              disabled={!canEditSettings}
              value={form.phone || ''}
              onChange={(e) => setForm({ ...form, phone: e.target.value })}
              className="w-full px-3 py-2 rounded-[10px] bg-subtle border border-hairline text-ink disabled:opacity-60"
            />
          </div>
          <div>
            <label className="block font-medium text-ink mb-1">Default Language</label>
            <select
              value={form.defaultLanguage}
              onChange={(e) =>
                setForm({ ...form, defaultLanguage: e.target.value as Language })
              }
              className="w-full px-3 py-2 rounded-[10px] bg-subtle border border-hairline text-ink"
            >
              <option value="en">English</option>
              <option value="so">Soomaali (Somali)</option>
              <option value="am">አማርኛ (Amharic)</option>
            </select>
          </div>
          <div>
            <label className="block font-medium text-ink mb-1">Primary Currency</label>
            <select
              disabled={!canEditSettings}
              value={form.currency}
              onChange={(e) =>
                setForm({ ...form, currency: e.target.value as CurrencyCode })
              }
              className="w-full px-3 py-2 rounded-[10px] bg-subtle border border-hairline text-ink disabled:opacity-60"
            >
              <option value="ETB">ETB — Ethiopian Birr</option>
              <option value="USD">USD — US Dollar</option>
            </select>
          </div>
          <div>
            <label className="block font-medium text-ink mb-1">
              Owner Commission Rate (%)
            </label>
            <input
              type="number"
              step="0.1"
              min={0}
              max={50}
              disabled={!canEditSettings}
              value={form.commissionRatePercent}
              onChange={(e) => {
                setForm({ ...form, commissionRatePercent: Number(e.target.value) });
                if (formErrors.commissionRatePercent)
                  setFormErrors({ ...formErrors, commissionRatePercent: '' });
              }}
              className="w-full px-3 py-2 rounded-[10px] bg-subtle border border-hairline text-ink font-mono disabled:opacity-60"
            />
            {formErrors.commissionRatePercent && (
              <p style={{ color: 'var(--status-danger-fg)' }} className="mt-1 text-[11px]">
                {formErrors.commissionRatePercent}
              </p>
            )}
          </div>
          <div>
            <label className="block font-medium text-ink mb-1">Interface Theme</label>
            <button
              type="button"
              onClick={onToggleTheme}
              className="w-full px-3 py-2 rounded-[10px] bg-subtle border border-hairline text-ink text-left flex items-center justify-between"
            >
              <span className="capitalize">{theme} mode active</span>
              <span className="text-accent font-medium">Switch</span>
            </button>
          </div>
        </div>

        <div className="pt-3 border-t border-hairline space-y-2.5">
          <div className="font-semibold text-ink">Notification Preferences</div>
          {[
            {
              key: 'lowStockAlertEnabled' as const,
              label: 'Low-stock warehouse alerts (Rice, Flour, Cooking Oil, Sugar, Dates)',
            },
            {
              key: 'orderAlertEnabled' as const,
              label: 'New wholesale order & dispatch notifications',
            },
            {
              key: 'paymentAlertEnabled' as const,
              label: 'Pending buyer invoice & settlement alerts',
            },
          ].map((pref) => (
            <label key={pref.key} className="flex items-center gap-2.5 text-ink cursor-pointer">
              <input
                type="checkbox"
                checked={Boolean(form[pref.key])}
                onChange={(e) => setForm({ ...form, [pref.key]: e.target.checked })}
                className="rounded border-hairline accent-[var(--accent-primary)]"
              />
              <span>{pref.label}</span>
            </label>
          ))}
        </div>

        <div className="flex justify-end pt-2">
          <motion.button
            type="submit"
            whileTap={{ scale: 0.98 }}
            transition={{ duration: DURATIONS.button, ease: EASE_SAAS }}
            disabled={saving || !canEditSettings}
            className="inline-flex items-center gap-1.5 px-4 py-2 rounded-[10px] bg-accent text-on-accent font-medium disabled:opacity-50 transition-colors"
          >
            <Check className="w-3.5 h-3.5" />
            <span>{saving ? t.common.loading : t.common.save}</span>
          </motion.button>
        </div>
      </form>
    </div>
  );
}
