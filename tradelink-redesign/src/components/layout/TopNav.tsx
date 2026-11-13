import React, { useEffect, useMemo, useRef, useState } from 'react';
import { AnimatePresence, motion } from 'motion/react';
import {
  AlertTriangle,
  Bell,
  Calendar,
  ChevronDown,
  Globe,
  LogIn,
  LogOut,
  Menu,
  Moon,
  Search,
  Shield,
  Sun,
} from 'lucide-react';
import type {
  AppRoute,
  Buyer,
  Language,
  Order,
  Product,
  Supplier,
  ThemeMode,
  UserProfile,
  UserRole,
} from '../../types/tradelink';
import { TRANSLATIONS, formatMoney } from '../../i18n/translations';
import { DURATIONS, EASE_SAAS, dropdownMotion } from '../../lib/motion';

export function TopNav({
  activeRoute,
  onNavigate,
  onOpenMobileNav,
  onOpenCommandPalette,
  lang,
  onChangeLang,
  theme,
  onToggleTheme,
  userProfile,
  isAuthenticated,
  onSignIn,
  onSignOut,
  previewRole,
  onChangePreviewRole,
  products,
  orders,
  buyers,
  suppliers,
}: {
  activeRoute: AppRoute;
  onNavigate: (route: AppRoute) => void;
  onOpenMobileNav: () => void;
  onOpenCommandPalette: () => void;
  lang: Language;
  onChangeLang: (lang: Language) => void;
  theme: ThemeMode;
  onToggleTheme: () => void;
  userProfile: UserProfile | null;
  isAuthenticated: boolean;
  onSignIn: () => void;
  onSignOut: () => void;
  previewRole: UserRole;
  onChangePreviewRole: (role: UserRole) => void;
  products: Product[];
  orders: Order[];
  buyers: Buyer[];
  suppliers: Supplier[];
}) {
  const t = TRANSLATIONS[lang];
  const [searchQuery, setSearchQuery] = useState('');
  const [searchOpen, setSearchOpen] = useState(false);
  const [notifOpen, setNotifOpen] = useState(false);
  const [accountOpen, setAccountOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setSearchOpen(false);
        setNotifOpen(false);
        setAccountOpen(false);
      }
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  const searchResults = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    if (!q) return [];
    const results: { type: string; title: string; subtitle: string; route: AppRoute }[] = [];

    orders
      .filter(
        (o) =>
          o.orderCode.toLowerCase().includes(q) ||
          o.buyerName.toLowerCase().includes(q) ||
          o.productName.toLowerCase().includes(q)
      )
      .slice(0, 3)
      .forEach((o) =>
        results.push({
          type: t.nav.orders,
          title: `${o.orderCode} · ${o.buyerName}`,
          subtitle: `${o.productName} (${formatMoney(o.totalAmount, o.currency)})`,
          route: 'orders',
        })
      );

    products
      .filter(
        (p) =>
          p.name.toLowerCase().includes(q) ||
          (p.sku || '').toLowerCase().includes(q) ||
          p.category.toLowerCase().includes(q)
      )
      .slice(0, 3)
      .forEach((p) =>
        results.push({
          type: t.nav.products,
          title: p.name,
          subtitle: `${p.stockQty} ${p.unit} · ${formatMoney(p.sellingPrice, p.currency)}`,
          route: 'products',
        })
      );

    buyers
      .filter(
        (b) =>
          b.businessName.toLowerCase().includes(q) || b.contactName.toLowerCase().includes(q)
      )
      .slice(0, 2)
      .forEach((b) =>
        results.push({
          type: t.nav.buyers,
          title: b.businessName,
          subtitle: `${b.city || ''} · ${b.phone}`,
          route: 'buyers',
        })
      );

    suppliers
      .filter(
        (s) => s.name.toLowerCase().includes(q) || s.contactName.toLowerCase().includes(q)
      )
      .slice(0, 2)
      .forEach((s) =>
        results.push({
          type: t.nav.suppliers,
          title: s.name,
          subtitle: `${s.city || ''} · ${s.phone}`,
          route: 'suppliers',
        })
      );

    return results;
  }, [searchQuery, orders, products, buyers, suppliers, t.nav]);

  const notifications = useMemo(() => {
    const items: {
      id: string;
      title: string;
      detail: string;
      route: AppRoute;
      tone: 'amber' | 'emerald';
    }[] = [];
    products
      .filter((p) => p.stockQty <= p.minStockQty)
      .forEach((p) =>
        items.push({
          id: `low_${p.id}`,
          title: `${t.dashboard.lowStock}: ${p.name}`,
          detail: `${p.stockQty} / ${p.minStockQty} ${p.unit}`,
          route: 'inventory',
          tone: 'amber',
        })
      );
    orders
      .filter((o) => o.status === 'pending')
      .slice(0, 3)
      .forEach((o) =>
        items.push({
          id: `ord_${o.id}`,
          title: `${o.orderCode} · ${t.statuses.pending}`,
          detail: `${o.buyerName} · ${formatMoney(o.totalAmount, o.currency)}`,
          route: 'orders',
          tone: 'emerald',
        })
      );
    return items;
  }, [products, orders, t.dashboard.lowStock, t.statuses.pending]);

  const currentDateLabel = useMemo(() => {
    const locale = lang === 'so' ? 'so-SO' : lang === 'am' ? 'am-ET' : 'en-US';
    try {
      return new Intl.DateTimeFormat(locale, {
        weekday: 'short',
        month: 'short',
        day: 'numeric',
        year: 'numeric',
      }).format(new Date());
    } catch {
      return new Date().toISOString().slice(0, 10);
    }
  }, [lang]);

  const displayName = userProfile?.displayName || 'Liban Abdullahi';
  const initials = displayName
    .split(' ')
    .map((p) => p[0])
    .join('')
    .slice(0, 2)
    .toUpperCase();

  return (
    <header
      ref={containerRef}
      className="sticky top-0 z-30 h-16 bg-surface/95 backdrop-blur-md border-b border-hairline px-4 lg:px-6 flex items-center justify-between gap-3 no-print"
    >
      {/* Left: Mobile Trigger + Global Search + Command Palette Trigger */}
      <div className="flex items-center gap-3 flex-1 min-w-0">
        <button
          type="button"
          onClick={onOpenMobileNav}
          className="lg:hidden p-2 rounded-lg text-muted hover:text-ink bg-hover transition-colors"
          aria-label="Open menu"
        >
          <Menu className="w-5 h-5" />
        </button>

        <div className="relative flex-1 max-w-md">
          <Search className="w-4 h-4 text-muted absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
          <input
            type="text"
            value={searchQuery}
            onFocus={() => setSearchOpen(true)}
            onChange={(e) => {
              setSearchQuery(e.target.value);
              setSearchOpen(true);
            }}
            placeholder={t.topbar.searchPlaceholder}
            aria-label={t.topbar.searchPlaceholder}
            className="w-full pl-9 pr-14 py-2 text-xs bg-subtle border border-hairline rounded-[10px] text-ink placeholder:text-muted focus:border-accent transition-colors"
          />
          <button
            type="button"
            onClick={onOpenCommandPalette}
            title={t.topbar.commandPalette}
            aria-label={t.topbar.commandPalette}
            className="absolute right-2 top-1/2 -translate-y-1/2 px-1.5 py-0.5 text-[10px] font-mono rounded-md bg-surface border border-hairline text-muted hover:text-ink transition-colors"
          >
            {t.topbar.searchShortcut}
          </button>

          <AnimatePresence>
            {searchOpen && searchQuery.trim().length > 0 && (
              <motion.div
                {...dropdownMotion}
                className="absolute left-0 right-0 mt-1.5 bg-surface border border-hairline rounded-[12px] shadow-xl overflow-hidden z-50"
              >
                {searchResults.length === 0 ? (
                  <div className="px-4 py-3 text-xs text-muted">{t.common.noResults}</div>
                ) : (
                  <div className="divide-y divide-hairline max-h-72 overflow-y-auto">
                    {searchResults.map((res, idx) => (
                      <button
                        key={`${res.type}-${idx}`}
                        type="button"
                        onClick={() => {
                          onNavigate(res.route);
                          setSearchOpen(false);
                          setSearchQuery('');
                        }}
                        className="w-full px-4 py-2.5 text-left bg-hover flex items-center justify-between gap-3 transition-colors"
                      >
                        <div className="min-w-0">
                          <div className="text-xs font-semibold text-ink truncate">{res.title}</div>
                          <div className="text-[11px] text-muted truncate">{res.subtitle}</div>
                        </div>
                        <span className="text-[11px] font-medium text-muted shrink-0">
                          {res.type}
                        </span>
                      </button>
                    ))}
                  </div>
                )}
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        <span className="hidden xl:inline-flex items-center gap-1.5 text-xs text-muted px-2.5 py-1 rounded-lg bg-subtle border border-hairline">
          <Calendar className="w-3.5 h-3.5" />
          <span className="tabular-nums">{currentDateLabel}</span>
        </span>
      </div>

      {/* Right Controls */}
      <div className="flex items-center gap-1.5 sm:gap-2 shrink-0">
        <a
          href="#market"
          className="hidden sm:inline-flex h-8 items-center rounded-[10px] border border-hairline px-3 text-[12px] font-medium text-muted hover:text-ink"
        >
          View marketplace
        </a>
        {/* Language Selector */}
        <div className="relative flex items-center">
          <Globe className="w-3.5 h-3.5 text-muted absolute left-2.5 pointer-events-none" />
          <select
            aria-label="Language"
            value={lang}
            onChange={(e) => onChangeLang(e.target.value as Language)}
            className="pl-7 pr-6 py-1.5 text-xs font-medium bg-subtle border border-hairline rounded-[10px] text-ink appearance-none cursor-pointer transition-colors"
          >
            <option value="en">EN</option>
            <option value="so">SO</option>
            <option value="am">AM</option>
          </select>
          <ChevronDown className="w-3 h-3 text-muted absolute right-2 pointer-events-none" />
        </div>

        {/* Animated Theme Toggle */}
        <motion.button
          type="button"
          whileTap={{ scale: 0.94 }}
          transition={{ duration: DURATIONS.micro, ease: EASE_SAAS }}
          onClick={onToggleTheme}
          title={theme === 'dark' ? t.topbar.themeLight : t.topbar.themeDark}
          aria-label={theme === 'dark' ? t.topbar.themeLight : t.topbar.themeDark}
          className="p-2 rounded-[10px] border border-hairline bg-surface bg-hover text-ink transition-colors"
        >
          <AnimatePresence mode="wait" initial={false}>
            <motion.span
              key={theme}
              initial={{ rotate: -18, opacity: 0, scale: 0.85 }}
              animate={{ rotate: 0, opacity: 1, scale: 1 }}
              exit={{ rotate: 18, opacity: 0, scale: 0.85 }}
              transition={{ duration: DURATIONS.micro, ease: EASE_SAAS }}
              className="block"
            >
              {theme === 'dark' ? (
                <Sun style={{ color: 'var(--status-warn-fg)' }} className="w-4 h-4" />
              ) : (
                <Moon className="w-4 h-4 text-muted" />
              )}
            </motion.span>
          </AnimatePresence>
        </motion.button>

        {/* Notifications Popover */}
        <div className="relative">
          <motion.button
            type="button"
            whileTap={{ scale: 0.95 }}
            transition={{ duration: DURATIONS.micro, ease: EASE_SAAS }}
            onClick={() => {
              setNotifOpen((v) => !v);
              setAccountOpen(false);
            }}
            aria-label={t.topbar.notifications}
            aria-expanded={notifOpen}
            aria-haspopup="menu"
            className="relative p-2 rounded-[10px] border border-hairline bg-surface bg-hover text-ink transition-colors"
          >
            <Bell className="w-4 h-4" />
            {notifications.length > 0 && (
              <span
                style={{
                  backgroundColor: 'var(--status-warn-fg)',
                  color: 'var(--text-on-solid)',
                }}
                className="absolute -top-1 -right-1 w-4 h-4 rounded-full text-[10px] font-mono font-semibold flex items-center justify-center"
              >
                {notifications.length}
              </span>
            )}
          </motion.button>

          <AnimatePresence>
            {notifOpen && (
              <motion.div
                {...dropdownMotion}
                role="menu"
                aria-label={t.topbar.notifications}
                className="absolute right-0 mt-2 w-80 bg-surface border border-hairline rounded-[12px] shadow-xl overflow-hidden z-50"
              >
                <div className="px-4 py-3 border-b border-hairline flex items-center justify-between">
                  <span className="text-xs font-semibold text-ink">{t.topbar.notifications}</span>
                  <span className="text-[11px] font-mono text-muted">{notifications.length}</span>
                </div>
                {notifications.length === 0 ? (
                  <div className="p-4 text-xs text-muted">{t.topbar.noAlerts}</div>
                ) : (
                  <div className="divide-y divide-hairline max-h-72 overflow-y-auto">
                    {notifications.map((n, idx) => (
                      <motion.button
                        key={n.id}
                        type="button"
                        role="menuitem"
                        initial={{ opacity: 0, x: -6 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{
                          delay: idx * 0.025,
                          duration: DURATIONS.micro,
                          ease: EASE_SAAS,
                        }}
                        onClick={() => {
                          onNavigate(n.route);
                          setNotifOpen(false);
                        }}
                        className="w-full px-4 py-3 text-left bg-hover flex items-start gap-2.5 transition-colors"
                      >
                        <AlertTriangle
                          style={{
                            color:
                              n.tone === 'amber'
                                ? 'var(--status-warn-fg)'
                                : 'var(--accent-primary)',
                          }}
                          className="w-4 h-4 shrink-0 mt-0.5"
                        />
                        <div className="min-w-0">
                          <div className="text-xs font-medium text-ink truncate">{n.title}</div>
                          <div className="text-[11px] text-muted mt-0.5">{n.detail}</div>
                        </div>
                      </motion.button>
                    ))}
                  </div>
                )}
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* Account Dropdown */}
        <div className="relative">
          <button
            type="button"
            aria-expanded={accountOpen}
            aria-haspopup="menu"
            onClick={() => {
              setAccountOpen((v) => !v);
              setNotifOpen(false);
            }}
            className="flex items-center gap-2 pl-1.5 pr-2.5 py-1 rounded-[10px] border border-hairline bg-surface bg-hover transition-colors"
          >
            <div className="w-7 h-7 rounded-lg bg-accent-subtle text-accent font-semibold text-xs flex items-center justify-center">
              {initials}
            </div>
            <div className="hidden md:block text-left leading-tight">
              <div className="text-xs font-semibold text-ink max-w-[110px] truncate">
                {displayName}
              </div>
              <div className="text-[10px] text-muted capitalize">{previewRole}</div>
            </div>
            <ChevronDown className="w-3.5 h-3.5 text-muted hidden sm:block" />
          </button>

          <AnimatePresence>
            {accountOpen && (
              <motion.div
                {...dropdownMotion}
                role="menu"
                className="absolute right-0 mt-2 w-64 bg-surface border border-hairline rounded-[12px] shadow-xl overflow-hidden z-50"
              >
                <div className="px-4 py-3 border-b border-hairline">
                  <div className="text-xs font-semibold text-ink">{displayName}</div>
                  <div className="text-[11px] text-muted truncate">
                    {userProfile?.email || 'kaafiebirr95@gmail.com'}
                  </div>
                  <div className="mt-1.5 text-[10px] font-medium text-accent">
                    {isAuthenticated ? t.topbar.liveSynced : t.topbar.sandboxMode}
                  </div>
                </div>

                <div className="px-4 py-2.5 border-b border-hairline space-y-1.5">
                  <div className="flex items-center gap-1.5 text-[11px] font-medium text-muted">
                    <Shield className="w-3.5 h-3.5" />
                    <span>{t.topbar.rolePreview}</span>
                  </div>
                  <div className="grid grid-cols-3 gap-1">
                    {(['owner', 'manager', 'employee'] as UserRole[]).map((roleOption) => (
                      <button
                        key={roleOption}
                        type="button"
                        onClick={() => onChangePreviewRole(roleOption)}
                        className={`px-2 py-1 rounded-md text-[11px] font-medium capitalize transition-colors ${
                          previewRole === roleOption
                            ? 'bg-accent text-on-accent'
                            : 'bg-subtle text-muted hover:text-ink'
                        }`}
                      >
                        {roleOption}
                      </button>
                    ))}
                  </div>
                </div>

                <div className="p-1.5">
                  <button
                    type="button"
                    role="menuitem"
                    onClick={() => {
                      onNavigate('settings');
                      setAccountOpen(false);
                    }}
                    className="w-full px-3 py-2 text-left text-xs text-ink bg-hover rounded-lg transition-colors"
                  >
                    {t.nav.settings} · {t.nav[activeRoute]}
                  </button>
                  {isAuthenticated ? (
                    <button
                      type="button"
                      role="menuitem"
                      onClick={() => {
                        onSignOut();
                        setAccountOpen(false);
                      }}
                      style={{ color: 'var(--status-danger-fg)' }}
                      className="w-full px-3 py-2 text-left text-xs bg-hover rounded-lg flex items-center gap-2 transition-colors"
                    >
                      <LogOut className="w-3.5 h-3.5" />
                      <span>{t.topbar.signOut}</span>
                    </button>
                  ) : (
                    <button
                      type="button"
                      role="menuitem"
                      onClick={() => {
                        onSignIn();
                        setAccountOpen(false);
                      }}
                      className="w-full px-3 py-2 text-left text-xs font-semibold text-accent bg-hover rounded-lg flex items-center gap-2 transition-colors"
                    >
                      <LogIn className="w-3.5 h-3.5" />
                      <span>{t.topbar.signIn}</span>
                    </button>
                  )}
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>
    </header>
  );
}
