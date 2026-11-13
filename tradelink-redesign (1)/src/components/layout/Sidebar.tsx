import React from 'react';
import { AnimatePresence, motion } from 'motion/react';
import {
  Activity,
  ArrowLeftRight,
  BarChart3,
  Boxes,
  Building2,
  ChevronLeft,
  ChevronRight,
  CreditCard,
  FileSpreadsheet,
  LayoutDashboard,
  Package,
  Percent,
  Receipt,
  Settings,
  ShoppingCart,
  Truck,
  UserCheck,
  Users,
  Warehouse,
  X,
} from 'lucide-react';
import type { AppRoute, Language } from '../../types/tradelink';
import { TRANSLATIONS } from '../../i18n/translations';
import {
  DURATIONS,
  EASE_SAAS,
  modalBackdropMotion,
  tabSlideTransition,
} from '../../lib/motion';

interface NavGroup {
  key: 'main' | 'operations' | 'finance' | 'management';
  items: { id: AppRoute; icon: React.ComponentType<{ className?: string }> }[];
}

const NAV_GROUPS: NavGroup[] = [
  {
    key: 'main',
    items: [
      { id: 'overview', icon: LayoutDashboard },
      { id: 'products', icon: Package },
      { id: 'orders', icon: ShoppingCart },
      { id: 'suppliers', icon: Building2 },
      { id: 'buyers', icon: UserCheck },
    ],
  },
  {
    key: 'operations',
    items: [
      { id: 'inventory', icon: Boxes },
      { id: 'warehouse', icon: Warehouse },
      { id: 'stock_movements', icon: ArrowLeftRight },
      { id: 'deliveries', icon: Truck },
    ],
  },
  {
    key: 'finance',
    items: [
      { id: 'payments', icon: CreditCard },
      { id: 'commissions', icon: Percent },
      { id: 'transactions', icon: Receipt },
      { id: 'financial_reports', icon: FileSpreadsheet },
    ],
  },
  {
    key: 'management',
    items: [
      { id: 'analytics', icon: BarChart3 },
      { id: 'team_members', icon: Users },
      { id: 'activity_logs', icon: Activity },
      { id: 'settings', icon: Settings },
    ],
  },
];

export function Sidebar({
  activeRoute,
  onNavigate,
  collapsed,
  onToggleCollapse,
  mobileOpen,
  onCloseMobile,
  lang,
  lowStockCount,
  pendingOrderCount,
}: {
  activeRoute: AppRoute;
  onNavigate: (route: AppRoute) => void;
  collapsed: boolean;
  onToggleCollapse: () => void;
  mobileOpen: boolean;
  onCloseMobile: () => void;
  lang: Language;
  lowStockCount: number;
  pendingOrderCount: number;
}) {
  const t = TRANSLATIONS[lang];

  const renderNavBody = (isMobile: boolean) => {
    const isMini = !isMobile && collapsed;
    return (
      <div className="flex flex-col h-full bg-surface border-r border-hairline select-none">
        {/* Brand Header */}
        <div className="h-16 px-4 flex items-center justify-between border-b border-hairline shrink-0">
          <button
            type="button"
            onClick={() => {
              onNavigate('overview');
              if (isMobile) onCloseMobile();
            }}
            className="flex items-center gap-2.5 min-w-0 text-left"
          >
            <div className="w-8 h-8 rounded-[10px] bg-accent text-on-accent flex items-center justify-center font-display font-bold text-sm shrink-0 shadow-sm">
              TL
            </div>
            {!isMini && (
              <div className="min-w-0">
                <div className="font-display font-bold text-[15px] tracking-tight text-ink leading-none">
                  TradeLink
                </div>
                <div className="text-[11px] text-muted mt-1 truncate">
                  {t.brandTag}
                </div>
              </div>
            )}
          </button>

          {isMobile ? (
            <button
              type="button"
              onClick={onCloseMobile}
              className="p-1.5 rounded-lg text-muted hover:text-ink bg-hover transition-colors"
              aria-label="Close navigation"
            >
              <X className="w-4 h-4" />
            </button>
          ) : (
            <button
              type="button"
              onClick={onToggleCollapse}
              className="p-1.5 rounded-lg text-muted hover:text-ink bg-hover transition-colors"
              title={collapsed ? 'Expand sidebar' : 'Collapse sidebar'}
              aria-label={collapsed ? 'Expand sidebar' : 'Collapse sidebar'}
            >
              {collapsed ? (
                <ChevronRight className="w-4 h-4" />
              ) : (
                <ChevronLeft className="w-4 h-4" />
              )}
            </button>
          )}
        </div>

        {/* Navigation Groups */}
        <nav aria-label="Primary navigation" className="flex-1 overflow-y-auto px-2.5 py-4 space-y-5">
          {NAV_GROUPS.map((group) => (
            <div key={group.key}>
              {!isMini ? (
                <div className="px-2.5 mb-1.5 text-[10px] font-semibold tracking-wider text-muted uppercase">
                  {t.groups[group.key]}
                </div>
              ) : (
                <div className="mx-2 my-2 border-t border-hairline" />
              )}
              <div className="space-y-0.5">
                {group.items.map((item) => {
                  const Icon = item.icon;
                  const isActive = activeRoute === item.id;
                  const label = t.nav[item.id];
                  const badgeCount =
                    item.id === 'orders' && pendingOrderCount > 0
                      ? pendingOrderCount
                      : item.id === 'inventory' && lowStockCount > 0
                        ? lowStockCount
                        : 0;

                  return (
                    <button
                      key={item.id}
                      type="button"
                      title={isMini ? label : undefined}
                      aria-current={isActive ? 'page' : undefined}
                      onClick={() => {
                        onNavigate(item.id);
                        if (isMobile) onCloseMobile();
                      }}
                      className={`group relative w-full flex items-center ${
                        isMini ? 'justify-center px-2' : 'justify-between px-2.5'
                      } py-2 rounded-[10px] text-[13px] font-medium transition-colors whitespace-nowrap ${
                        isActive ? 'text-accent' : 'text-muted hover:text-ink bg-hover'
                      }`}
                    >
                      {isActive && (
                        <motion.span
                          layoutId={isMobile ? 'sidebar-active-mobile' : 'sidebar-active-desktop'}
                          transition={tabSlideTransition}
                          className="absolute inset-0 rounded-[10px] bg-accent-subtle border border-accent pointer-events-none"
                        />
                      )}

                      <span className="relative z-10 flex items-center gap-2.5 min-w-0">
                        <Icon
                          className={`w-4 h-4 shrink-0 transition-colors ${
                            isActive ? 'text-accent' : 'text-muted group-hover:text-ink'
                          }`}
                        />
                        {!isMini && <span className="truncate">{label}</span>}
                      </span>
                      {!isMini && badgeCount > 0 && (
                        <span
                          style={
                            item.id === 'inventory'
                              ? {
                                  backgroundColor: 'var(--status-warn-bg)',
                                  color: 'var(--status-warn-fg)',
                                }
                              : undefined
                          }
                          className={`relative z-10 text-[11px] font-mono tabular-nums px-1.5 py-0.5 rounded-md ${
                            item.id === 'inventory'
                              ? ''
                              : 'bg-subtle text-ink border border-hairline'
                          }`}
                        >
                          {badgeCount}
                        </span>
                      )}
                      {isMini && (
                        <span className="pointer-events-none opacity-0 group-hover:opacity-100 transition-opacity absolute left-full ml-2.5 px-2.5 py-1 rounded-lg bg-tooltip text-tooltip text-xs whitespace-nowrap shadow-lg z-50">
                          {label}
                        </span>
                      )}
                    </button>
                  );
                })}
              </div>
            </div>
          ))}
        </nav>

        {/* Single Warehouse Footer Note */}
        {!isMini && (
          <div className="p-3 border-t border-hairline">
            <div className="px-3 py-2.5 rounded-[10px] bg-subtle border border-hairline text-[11px]">
              <div className="font-semibold text-ink">Single Central Hub</div>
              <div className="text-muted mt-0.5 truncate">Malka Jabdu Warehouse</div>
            </div>
          </div>
        )}
      </div>
    );
  };

  return (
    <>
      {/* Desktop Animated Rail */}
      <motion.aside
        initial={false}
        animate={{ width: collapsed ? 72 : 248 }}
        transition={{ duration: DURATIONS.dropdown, ease: EASE_SAAS }}
        className="hidden lg:block shrink-0 overflow-x-hidden no-print"
      >
        <div className="sticky top-0 h-screen">{renderNavBody(false)}</div>
      </motion.aside>

      {/* Mobile Animated Drawer */}
      <AnimatePresence>
        {mobileOpen && (
          <motion.div
            {...modalBackdropMotion}
            className="fixed inset-0 z-50 flex lg:hidden no-print"
          >
            <div
              className="fixed inset-0 bg-backdrop backdrop-blur-[2px]"
              onClick={onCloseMobile}
              aria-hidden="true"
            />
            <motion.div
              initial={{ x: '-100%' }}
              animate={{ x: 0 }}
              exit={{ x: '-100%' }}
              transition={{ duration: DURATIONS.modal, ease: EASE_SAAS }}
              className="relative w-[264px] max-w-[85vw] h-full z-10 shadow-2xl"
            >
              {renderNavBody(true)}
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
