import React, { useEffect, useMemo, useRef, useState } from 'react';
import { AnimatePresence, motion } from 'motion/react';
import {
  Activity,
  ArrowLeftRight,
  BarChart3,
  Boxes,
  Building2,
  CornerDownLeft,
  CreditCard,
  FileSpreadsheet,
  LayoutDashboard,
  Moon,
  Package,
  PackagePlus,
  Percent,
  Plus,
  Receipt,
  Search,
  Settings,
  ShoppingCart,
  Sun,
  Truck,
  UserCheck,
  Users,
  Warehouse,
} from 'lucide-react';
import type {
  AppRoute,
  Buyer,
  Language,
  Order,
  Product,
  Supplier,
  ThemeMode,
} from '../../types/tradelink';
import { TRANSLATIONS, formatMoney, getProductTitle } from '../../i18n/translations';
import { modalBackdropMotion, modalPanelMotion } from '../../lib/motion';

interface CommandItem {
  id: string;
  group: 'quick' | 'nav' | 'record';
  title: string;
  subtitle?: string;
  badge?: string;
  icon: React.ReactNode;
  onSelect: () => void;
}

const ROUTE_ICONS: Record<AppRoute, React.ComponentType<{ className?: string }>> = {
  overview: LayoutDashboard,
  products: Package,
  orders: ShoppingCart,
  suppliers: Building2,
  buyers: UserCheck,
  inventory: Boxes,
  warehouse: Warehouse,
  stock_movements: ArrowLeftRight,
  deliveries: Truck,
  payments: CreditCard,
  commissions: Percent,
  transactions: Receipt,
  financial_reports: FileSpreadsheet,
  analytics: BarChart3,
  team_members: Users,
  activity_logs: Activity,
  settings: Settings,
};

const ALL_ROUTES: AppRoute[] = [
  'overview',
  'products',
  'orders',
  'suppliers',
  'buyers',
  'inventory',
  'warehouse',
  'stock_movements',
  'deliveries',
  'payments',
  'commissions',
  'transactions',
  'financial_reports',
  'analytics',
  'team_members',
  'activity_logs',
  'settings',
];

export function CommandPalette({
  open,
  onClose,
  lang,
  theme,
  onToggleTheme,
  onNavigate,
  onOpenNewOrder,
  onOpenNewProduct,
  onSelectOrder,
  products,
  orders,
  buyers,
  suppliers,
}: {
  open: boolean;
  onClose: () => void;
  lang: Language;
  theme: ThemeMode;
  onToggleTheme: () => void;
  onNavigate: (route: AppRoute) => void;
  onOpenNewOrder: () => void;
  onOpenNewProduct: () => void;
  onSelectOrder: (order: Order) => void;
  products: Product[];
  orders: Order[];
  buyers: Buyer[];
  suppliers: Supplier[];
}) {
  const t = TRANSLATIONS[lang];
  const [query, setQuery] = useState('');
  const [activeIndex, setActiveIndex] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (open) {
      setQuery('');
      setActiveIndex(0);
      const timer = window.setTimeout(() => inputRef.current?.focus(), 20);
      return () => window.clearTimeout(timer);
    }
  }, [open]);

  const items = useMemo<CommandItem[]>(() => {
    const q = query.trim().toLowerCase();

    const quickItems: CommandItem[] = [
      {
        id: 'qa-new-order',
        group: 'quick',
        title: t.command.newOrder,
        badge: t.nav.orders,
        icon: <Plus className="w-4 h-4 text-accent" />,
        onSelect: () => {
          onOpenNewOrder();
          onClose();
        },
      },
      {
        id: 'qa-add-product',
        group: 'quick',
        title: t.command.addProduct,
        badge: t.nav.products,
        icon: <PackagePlus className="w-4 h-4 text-accent" />,
        onSelect: () => {
          onOpenNewProduct();
          onClose();
        },
      },
      {
        id: 'qa-toggle-theme',
        group: 'quick',
        title: t.command.toggleTheme,
        badge: theme === 'dark' ? t.topbar.themeLight : t.topbar.themeDark,
        icon: theme === 'dark' ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />,
        onSelect: () => {
          onToggleTheme();
          onClose();
        },
      },
      {
        id: 'qa-settings',
        group: 'quick',
        title: t.command.openSettings,
        badge: t.nav.settings,
        icon: <Settings className="w-4 h-4" />,
        onSelect: () => {
          onNavigate('settings');
          onClose();
        },
      },
    ];

    const navItems: CommandItem[] = ALL_ROUTES.map((route) => {
      const Icon = ROUTE_ICONS[route];
      return {
        id: `nav-${route}`,
        group: 'nav',
        title: t.nav[route],
        badge: t.command.navigateTo,
        icon: <Icon className="w-4 h-4" />,
        onSelect: () => {
          onNavigate(route);
          onClose();
        },
      };
    });

    const recordItems: CommandItem[] = [];
    if (q.length > 0) {
      orders
        .filter(
          (o) =>
            o.orderCode.toLowerCase().includes(q) ||
            o.buyerName.toLowerCase().includes(q) ||
            o.productName.toLowerCase().includes(q)
        )
        .slice(0, 4)
        .forEach((ord) =>
          recordItems.push({
            id: `rec-ord-${ord.id}`,
            group: 'record',
            title: `${ord.orderCode} · ${ord.buyerName}`,
            subtitle: `${ord.productName} · ${formatMoney(ord.totalAmount, ord.currency)}`,
            badge: t.nav.orders,
            icon: <ShoppingCart className="w-4 h-4 text-accent" />,
            onSelect: () => {
              onSelectOrder(ord);
              onClose();
            },
          })
        );

      products
        .filter(
          (p) =>
            p.name.toLowerCase().includes(q) ||
            (p.nameSo || '').toLowerCase().includes(q) ||
            (p.nameAm || '').toLowerCase().includes(q) ||
            (p.sku || '').toLowerCase().includes(q)
        )
        .slice(0, 4)
        .forEach((prod) =>
          recordItems.push({
            id: `rec-prod-${prod.id}`,
            group: 'record',
            title: getProductTitle(prod, lang),
            subtitle: `${prod.stockQty} ${prod.unit} · ${formatMoney(prod.sellingPrice, prod.currency)}`,
            badge: t.nav.products,
            icon: <Package className="w-4 h-4 text-accent" />,
            onSelect: () => {
              onNavigate('products');
              onClose();
            },
          })
        );

      buyers
        .filter(
          (b) =>
            b.businessName.toLowerCase().includes(q) ||
            b.contactName.toLowerCase().includes(q)
        )
        .slice(0, 3)
        .forEach((b) =>
          recordItems.push({
            id: `rec-buy-${b.id}`,
            group: 'record',
            title: b.businessName,
            subtitle: `${b.contactName} · ${b.city || ''}`,
            badge: t.nav.buyers,
            icon: <UserCheck className="w-4 h-4" />,
            onSelect: () => {
              onNavigate('buyers');
              onClose();
            },
          })
        );

      suppliers
        .filter(
          (s) =>
            s.name.toLowerCase().includes(q) ||
            s.contactName.toLowerCase().includes(q)
        )
        .slice(0, 3)
        .forEach((s) =>
          recordItems.push({
            id: `rec-sup-${s.id}`,
            group: 'record',
            title: s.name,
            subtitle: `${s.contactName} · ${s.city || ''}`,
            badge: t.nav.suppliers,
            icon: <Building2 className="w-4 h-4" />,
            onSelect: () => {
              onNavigate('suppliers');
              onClose();
            },
          })
        );
    }

    const filteredQuick = q
      ? quickItems.filter((item) => item.title.toLowerCase().includes(q))
      : quickItems;
    const filteredNav = q
      ? navItems.filter((item) => item.title.toLowerCase().includes(q))
      : navItems.slice(0, 6);

    return [...recordItems, ...filteredQuick, ...filteredNav];
  }, [
    query,
    t,
    theme,
    lang,
    orders,
    products,
    buyers,
    suppliers,
    onToggleTheme,
    onNavigate,
    onOpenNewOrder,
    onOpenNewProduct,
    onSelectOrder,
    onClose,
  ]);

  useEffect(() => {
    setActiveIndex(0);
  }, [query]);

  useEffect(() => {
    if (!open) return;
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        e.preventDefault();
        onClose();
      } else if (e.key === 'ArrowDown') {
        e.preventDefault();
        setActiveIndex((prev) => (items.length === 0 ? 0 : (prev + 1) % items.length));
      } else if (e.key === 'ArrowUp') {
        e.preventDefault();
        setActiveIndex((prev) =>
          items.length === 0 ? 0 : (prev - 1 + items.length) % items.length
        );
      } else if (e.key === 'Enter' && items[activeIndex]) {
        e.preventDefault();
        items[activeIndex].onSelect();
      }
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [open, items, activeIndex, onClose]);

  const sections = [
    { key: 'record' as const, label: t.command.records },
    { key: 'quick' as const, label: t.command.quickActions },
    { key: 'nav' as const, label: t.command.navigateTo },
  ];

  let runningIdx = -1;

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          {...modalBackdropMotion}
          role="dialog"
          aria-modal="true"
          aria-label={t.command.placeholder}
          className="fixed inset-0 z-[70] flex items-start justify-center pt-[12vh] px-4 bg-backdrop backdrop-blur-[3px] no-print"
        >
          <div className="fixed inset-0" onClick={onClose} aria-hidden="true" />
          <motion.div
            {...modalPanelMotion}
            className="relative z-10 w-full max-w-xl bg-surface border border-hairline rounded-[14px] shadow-2xl overflow-hidden flex flex-col max-h-[72vh]"
          >
            {/* Search Input Bar */}
            <div className="flex items-center gap-2.5 px-4 py-3 border-b border-hairline">
              <Search className="w-4 h-4 text-muted shrink-0" />
              <input
                ref={inputRef}
                type="text"
                role="combobox"
                aria-expanded="true"
                aria-controls="command-listbox"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder={t.command.placeholder}
                className="flex-1 bg-transparent text-sm text-ink placeholder:text-muted focus:outline-none"
              />
              <kbd className="px-1.5 py-0.5 text-[10px] font-mono rounded border border-hairline bg-subtle text-muted">
                ESC
              </kbd>
            </div>

            {/* Results */}
            <div
              id="command-listbox"
              role="listbox"
              className="flex-1 overflow-y-auto p-2 space-y-3"
            >
              {items.length === 0 ? (
                <div className="py-10 text-center text-xs text-muted">
                  {t.command.noMatches}
                </div>
              ) : (
                sections.map((section) => {
                  const groupItems = items.filter((item) => item.group === section.key);
                  if (groupItems.length === 0) return null;
                  return (
                    <div key={section.key}>
                      <div className="px-2.5 pb-1 text-[10px] font-semibold tracking-wider uppercase text-muted">
                        {section.label}
                      </div>
                      <div className="space-y-0.5">
                        {groupItems.map((item) => {
                          runningIdx += 1;
                          const idx = runningIdx;
                          const isSelected = idx === activeIndex;
                          return (
                            <button
                              key={item.id}
                              type="button"
                              role="option"
                              aria-selected={isSelected}
                              onMouseEnter={() => setActiveIndex(idx)}
                              onClick={item.onSelect}
                              className={`w-full px-3 py-2 rounded-[10px] flex items-center justify-between gap-3 text-left transition-colors ${
                                isSelected ? 'bg-accent-subtle text-ink' : 'text-ink bg-hover'
                              }`}
                            >
                              <div className="flex items-center gap-2.5 min-w-0">
                                <span className="shrink-0 text-muted">{item.icon}</span>
                                <div className="min-w-0">
                                  <div className="text-xs font-medium truncate">
                                    {item.title}
                                  </div>
                                  {item.subtitle && (
                                    <div className="text-[11px] text-muted truncate">
                                      {item.subtitle}
                                    </div>
                                  )}
                                </div>
                              </div>
                              {item.badge && (
                                <span className="text-[11px] text-muted shrink-0">
                                  {item.badge}
                                </span>
                              )}
                            </button>
                          );
                        })}
                      </div>
                    </div>
                  );
                })
              )}
            </div>

            {/* Footer Hints */}
            <div className="px-4 py-2 border-t border-hairline bg-subtle/60 flex items-center justify-between text-[11px] text-muted">
              <div className="flex items-center gap-3">
                <span className="inline-flex items-center gap-1">
                  <kbd className="px-1 py-0.5 rounded border border-hairline bg-surface font-mono text-[10px]">
                    ↑↓
                  </kbd>
                  <span>{t.command.hintNavigate}</span>
                </span>
                <span className="inline-flex items-center gap-1">
                  <kbd className="px-1 py-0.5 rounded border border-hairline bg-surface font-mono text-[10px]">
                    <CornerDownLeft className="w-2.5 h-2.5" />
                  </kbd>
                  <span>{t.command.hintSelect}</span>
                </span>
              </div>
              <span>{t.command.hintClose}: ESC</span>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
