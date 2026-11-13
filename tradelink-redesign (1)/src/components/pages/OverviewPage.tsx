import React, { useMemo, useState } from 'react';
import { motion } from 'motion/react';
import {
  AlertTriangle,
  ArrowDownRight,
  ArrowUpRight,
  Boxes,
  Clock,
  CreditCard,
  Eye,
  PackagePlus,
  Plus,
  ShoppingCart,
  TrendingUp,
} from 'lucide-react';
import type {
  AppRoute,
  AuditEvent,
  CurrencyCode,
  Language,
  Order,
  OrderStatus,
  Product,
  ProductCategory,
} from '../../types/tradelink';
import {
  TRANSLATIONS,
  formatMoney,
  getGreeting,
  getProductTitle,
} from '../../i18n/translations';
import { DURATIONS, EASE_SAAS, staggerItem, tabSlideTransition } from '../../lib/motion';
import { AnimatedCounter, StatusTag } from '../ui/SaasPrimitives';

type Timeframe = 'daily' | 'weekly' | 'monthly' | 'yearly';

const BASE_CHART_SERIES: Record<Timeframe, { label: string; sales: number; orders: number }[]> = {
  daily: [
    { label: 'Mon', sales: 28400, orders: 4 },
    { label: 'Tue', sales: 34200, orders: 5 },
    { label: 'Wed', sales: 26900, orders: 4 },
    { label: 'Thu', sales: 41800, orders: 6 },
    { label: 'Fri', sales: 38600, orders: 5 },
    { label: 'Sat', sales: 49200, orders: 7 },
    { label: 'Sun', sales: 29400, orders: 5 },
  ],
  weekly: [
    { label: 'W1', sales: 182000, orders: 22 },
    { label: 'W2', sales: 214500, orders: 27 },
    { label: 'W3', sales: 196800, orders: 24 },
    { label: 'W4', sales: 248500, orders: 36 },
  ],
  monthly: [
    { label: 'Dec', sales: 690000, orders: 84 },
    { label: 'Jan', sales: 742000, orders: 91 },
    { label: 'Feb', sales: 815000, orders: 98 },
    { label: 'Mar', sales: 788000, orders: 94 },
    { label: 'Apr', sales: 864000, orders: 106 },
    { label: 'May', sales: 942000, orders: 118 },
  ],
  yearly: [
    { label: '2022', sales: 5420000, orders: 610 },
    { label: '2023', sales: 7180000, orders: 795 },
    { label: '2024', sales: 8940000, orders: 1012 },
    { label: '2025', sales: 10650000, orders: 1184 },
  ],
};

export function orderStatusTone(
  status: OrderStatus
): 'emerald' | 'amber' | 'rose' | 'sky' | 'indigo' | 'slate' {
  switch (status) {
    case 'delivered':
      return 'emerald';
    case 'ready_for_dispatch':
      return 'sky';
    case 'processing':
      return 'indigo';
    case 'confirmed':
      return 'emerald';
    case 'pending':
      return 'amber';
    case 'cancelled':
      return 'rose';
  }
}

function MiniSparkline({
  points,
  color = 'var(--accent-primary)',
}: {
  points: number[];
  color?: string;
}) {
  const safePoints = points.length >= 2 ? points : [1, 1];
  const min = Math.min(...safePoints);
  const max = Math.max(...safePoints);
  const range = Math.max(1, max - min);
  const W = 76;
  const H = 26;
  const coords = safePoints.map((v, i) => {
    const x = (i / (safePoints.length - 1)) * (W - 4) + 2;
    const y = H - 3 - ((v - min) / range) * (H - 6);
    return `${x.toFixed(1)},${y.toFixed(1)}`;
  });

  return (
    <svg
      width={W}
      height={H}
      viewBox={`0 0 ${W} ${H}`}
      aria-hidden="true"
      className="shrink-0 overflow-visible"
    >
      <motion.polyline
        initial={{ pathLength: 0, opacity: 0.4 }}
        animate={{ pathLength: 1, opacity: 1 }}
        transition={{ duration: 0.45, ease: EASE_SAAS }}
        fill="none"
        stroke={color}
        strokeWidth={2}
        strokeLinecap="round"
        strokeLinejoin="round"
        points={coords.join(' ')}
      />
    </svg>
  );
}

export function OverviewPage({
  lang,
  currency,
  firstName = 'Liban',
  products,
  orders,
  auditEvents,
  onNavigate,
  onOpenNewOrder,
  onOpenNewProduct,
  onSelectOrder,
}: {
  lang: Language;
  currency: CurrencyCode;
  firstName?: string;
  products: Product[];
  orders: Order[];
  auditEvents: AuditEvent[];
  onNavigate: (route: AppRoute) => void;
  onOpenNewOrder: () => void;
  onOpenNewProduct: () => void;
  onSelectOrder: (order: Order) => void;
}) {
  const t = TRANSLATIONS[lang];
  const [timeframe, setTimeframe] = useState<Timeframe>('daily');
  const [chartMode, setChartMode] = useState<'area' | 'bars'>('area');
  const [hoveredIdx, setHoveredIdx] = useState<number | null>(null);

  const metrics = useMemo(() => {
    const validOrders = orders.filter((o) => o.status !== 'cancelled');
    const totalSales = validOrders.reduce((sum, o) => sum + o.totalAmount, 0);
    const activeOrdersCount = orders.filter(
      (o) => o.status !== 'delivered' && o.status !== 'cancelled'
    ).length;
    const pendingPayments = validOrders
      .filter((o) => o.paymentStatus !== 'paid')
      .reduce((sum, o) => sum + o.totalAmount, 0);
    const unpaidShare =
      totalSales > 0 ? Math.round((pendingPayments / totalSales) * 100) : 0;

    const inventoryValue = products.reduce(
      (sum, p) => sum + p.stockQty * p.sellingPrice,
      0
    );
    const totalUnits = products.reduce((sum, p) => sum + p.stockQty, 0);
    const lowStockCount = products.filter((p) => p.stockQty <= p.minStockQty).length;

    const sortedOrders = [...validOrders].sort((a, b) =>
      a.orderDate.localeCompare(b.orderDate)
    );
    const mid = Math.max(1, Math.floor(sortedOrders.length / 2));
    const earlierSum = sortedOrders
      .slice(0, mid)
      .reduce((s, o) => s + o.totalAmount, 0);
    const recentSum = sortedOrders
      .slice(mid)
      .reduce((s, o) => s + o.totalAmount, 0);
    const salesDeltaPct =
      earlierSum > 0
        ? Math.round(((recentSum - earlierSum) / earlierSum) * 1000) / 10
        : 0;

    const activeSharePct =
      orders.length > 0 ? Math.round((activeOrdersCount / orders.length) * 100) : 0;

    const salesSpark = sortedOrders.slice(-6).map((o) => o.totalAmount);
    const stockSpark = products.slice(0, 6).map((p) => p.stockQty * p.sellingPrice);

    return {
      totalSales,
      salesDeltaPct,
      activeOrdersCount,
      activeSharePct,
      pendingPayments,
      unpaidShare,
      inventoryValue,
      productCount: products.length,
      totalUnits,
      lowStockCount,
      salesSpark: salesSpark.length >= 2 ? salesSpark : [24000, 31000, 29000, totalSales],
      stockSpark: stockSpark.length >= 2 ? stockSpark : [120000, 145000, inventoryValue],
    };
  }, [orders, products]);

  const warehouseStaples = useMemo(() => {
    const targetCategories: ProductCategory[] = [
      'rice',
      'flour',
      'cooking_oil',
      'sugar',
      'dates',
    ];
    return targetCategories.map((cat) => {
      const catProducts = products.filter((p) => p.category === cat);
      const stock = catProducts.reduce((s, p) => s + p.stockQty, 0);
      const minStock = catProducts.reduce((s, p) => s + p.minStockQty, 0);
      const unit = catProducts[0]?.unit || 'Units';
      const isLow =
        catProducts.some((p) => p.stockQty <= p.minStockQty) || stock <= minStock;
      const pct =
        minStock > 0
          ? Math.min(100, Math.round((stock / (minStock * 2.5)) * 100))
          : 75;
      return {
        category: cat,
        label: t.categories[cat],
        stock,
        minStock,
        unit,
        isLow,
        pct,
      };
    });
  }, [products, t.categories]);

  const series = useMemo(() => {
    const base = BASE_CHART_SERIES[timeframe];
    const delta = metrics.totalSales - 248500;
    if (timeframe === 'daily' || timeframe === 'weekly') {
      return base.map((pt, idx) =>
        idx === base.length - 1
          ? {
              ...pt,
              sales: Math.max(0, pt.sales + delta),
              orders: Math.max(1, pt.orders + (orders.length - 8)),
            }
          : pt
      );
    }
    return base;
  }, [timeframe, metrics.totalSales, orders.length]);

  const maxSales = Math.max(...series.map((s) => s.sales), 1);
  const periodTotal = series.reduce((sum, s) => sum + s.sales, 0);

  const areaGeometry = useMemo(() => {
    const W = 600;
    const H = 190;
    const padX = 24;
    const padTop = 20;
    const padBottom = 16;
    const innerW = W - padX * 2;
    const innerH = H - padTop - padBottom;
    const pts = series.map((item, idx) => {
      const x =
        series.length === 1 ? W / 2 : padX + (idx / (series.length - 1)) * innerW;
      const y = padTop + innerH - (item.sales / maxSales) * innerH;
      return { x, y, ...item };
    });

    if (pts.length === 0) {
      return { W, H, pts, linePath: '', areaPath: '' };
    }

    let linePath = `M ${pts[0].x.toFixed(1)} ${pts[0].y.toFixed(1)}`;
    for (let i = 0; i < pts.length - 1; i++) {
      const p0 = pts[i];
      const p1 = pts[i + 1];
      const cx = ((p0.x + p1.x) / 2).toFixed(1);
      linePath += ` C ${cx} ${p0.y.toFixed(1)}, ${cx} ${p1.y.toFixed(1)}, ${p1.x.toFixed(1)} ${p1.y.toFixed(1)}`;
    }
    const last = pts[pts.length - 1];
    const first = pts[0];
    const areaPath = `${linePath} L ${last.x.toFixed(1)} ${H - padBottom} L ${first.x.toFixed(1)} ${H - padBottom} Z`;
    return { W, H, pts, linePath, areaPath };
  }, [series, maxSales]);

  const kpiCards = [
    {
      label: t.dashboard.totalSales,
      icon: <TrendingUp className="w-4 h-4 text-accent" />,
      value: <AnimatedCounter value={metrics.totalSales} prefix={`${currency} `} />,
      spark: metrics.salesSpark,
      sparkColor: 'var(--accent-primary)',
      deltaPositive: metrics.salesDeltaPct >= 0,
      deltaText: `${metrics.salesDeltaPct >= 0 ? '+' : ''}${metrics.salesDeltaPct}%`,
      subText: t.dashboard.vsPrevious,
      onClick: () => onNavigate('financial_reports'),
    },
    {
      label: t.dashboard.activeOrders,
      icon: <ShoppingCart className="w-4 h-4 text-accent" />,
      value: (
        <>
          <AnimatedCounter value={metrics.activeOrdersCount} />
          <span className="text-sm font-normal text-muted ml-1.5">
            / {orders.length}
          </span>
        </>
      ),
      spark: [3, 4, 5, Math.max(1, metrics.activeOrdersCount)],
      sparkColor: 'var(--accent-primary)',
      deltaPositive: true,
      deltaText: `${metrics.activeSharePct}%`,
      subText: `${orders.filter((o) => o.status === 'pending').length} ${t.statuses.pending.toLowerCase()}`,
      onClick: () => onNavigate('orders'),
    },
    {
      label: t.dashboard.pendingPayments,
      icon: (
        <CreditCard
          style={{ color: 'var(--status-warn-fg)' }}
          className="w-4 h-4"
        />
      ),
      value: (
        <AnimatedCounter value={metrics.pendingPayments} prefix={`${currency} `} />
      ),
      spark: [
        Math.round(metrics.pendingPayments * 0.72),
        Math.round(metrics.pendingPayments * 0.88),
        metrics.pendingPayments,
      ],
      sparkColor: 'var(--status-warn-fg)',
      deltaPositive: metrics.unpaidShare <= 35,
      deltaText: `${metrics.unpaidShare}%`,
      subText: `${orders.filter((o) => o.status !== 'cancelled' && o.paymentStatus !== 'paid').length} open`,
      onClick: () => onNavigate('payments'),
    },
    {
      label: t.dashboard.inventoryValue,
      icon: <Boxes className="w-4 h-4 text-accent" />,
      value: (
        <AnimatedCounter value={metrics.inventoryValue} prefix={`${currency} `} />
      ),
      spark: metrics.stockSpark,
      sparkColor:
        metrics.lowStockCount > 0
          ? 'var(--status-warn-fg)'
          : 'var(--accent-primary)',
      deltaPositive: metrics.lowStockCount === 0,
      deltaText: `${metrics.totalUnits} ${t.common.units}`,
      subText:
        metrics.lowStockCount > 0
          ? `${metrics.lowStockCount} ${t.dashboard.lowStock.toLowerCase()}`
          : t.dashboard.healthyStock,
      onClick: () => onNavigate('inventory'),
    },
  ];

  return (
    <div className="space-y-6">
      {/* Executive Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-display font-bold tracking-tight text-ink">
            {getGreeting(lang, firstName)}
          </h1>
          <p className="text-sm text-muted mt-1">{t.dashboard.subtitle}</p>
        </div>
        <div className="flex items-center gap-2 shrink-0">
          <motion.button
            type="button"
            whileHover={{ y: -1 }}
            whileTap={{ scale: 0.98 }}
            transition={{ duration: DURATIONS.button, ease: EASE_SAAS }}
            onClick={onOpenNewProduct}
            className="inline-flex items-center gap-1.5 px-3.5 py-2 text-xs font-medium rounded-[10px] border border-hairline bg-surface bg-hover text-ink transition-colors whitespace-nowrap shadow-saas"
          >
            <PackagePlus className="w-3.5 h-3.5" />
            <span>{t.dashboard.addProduct}</span>
          </motion.button>
          <motion.button
            type="button"
            whileHover={{ y: -1 }}
            whileTap={{ scale: 0.98 }}
            transition={{ duration: DURATIONS.button, ease: EASE_SAAS }}
            onClick={onOpenNewOrder}
            className="inline-flex items-center gap-1.5 px-3.5 py-2 text-xs font-medium rounded-[10px] bg-accent text-on-accent transition-colors whitespace-nowrap shadow-sm"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>{t.dashboard.newOrder}</span>
          </motion.button>
        </div>
      </div>

      {/* 4 Animated KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
        {kpiCards.map((card, i) => (
          <motion.button
            key={card.label}
            type="button"
            {...staggerItem(i, DURATIONS.dropdown)}
            whileHover={{ y: -2 }}
            onClick={card.onClick}
            className="text-left bg-surface border border-hairline rounded-[14px] p-5 shadow-saas hover:border-accent transition-colors flex flex-col justify-between"
          >
            <div className="flex items-center justify-between text-xs text-muted">
              <span>{card.label}</span>
              {card.icon}
            </div>

            <div className="mt-2.5 flex items-end justify-between gap-2">
              <div className="text-xl lg:text-2xl font-display font-bold text-ink tabular-nums leading-tight">
                {card.value}
              </div>
              <MiniSparkline points={card.spark} color={card.sparkColor} />
            </div>

            <div className="mt-3 flex items-center gap-1.5 text-xs">
              <span
                style={{
                  color: card.deltaPositive
                    ? 'var(--status-success-fg)'
                    : 'var(--status-warn-fg)',
                }}
                className="inline-flex items-center font-medium tabular-nums"
              >
                {card.deltaPositive ? (
                  <ArrowUpRight className="w-3.5 h-3.5" />
                ) : (
                  <ArrowDownRight className="w-3.5 h-3.5" />
                )}
                {card.deltaText}
              </span>
              <span className="text-muted truncate">{card.subText}</span>
            </div>
          </motion.button>
        ))}
      </div>

      {/* Main Chart + Warehouse Stock Grid */}
      <div className="grid grid-cols-1 xl:grid-cols-3 gap-5">
        {/* Interactive Animated Revenue Chart */}
        <div className="xl:col-span-2 bg-surface border border-hairline rounded-[14px] p-5 shadow-saas flex flex-col">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 mb-4">
            <div>
              <h2 className="text-sm font-semibold text-ink">{t.dashboard.salesOverview}</h2>
              <p className="text-xs text-muted mt-0.5 tabular-nums">
                {t.dashboard.totalSales}:{' '}
                <span className="font-semibold text-ink">
                  <AnimatedCounter value={periodTotal} prefix={`${currency} `} />
                </span>
              </p>
            </div>
            <div className="flex items-center gap-2 flex-wrap">
              <div className="inline-flex p-1 rounded-[10px] bg-subtle border border-hairline">
                {(['area', 'bars'] as const).map((mode) => {
                  const active = chartMode === mode;
                  return (
                    <button
                      key={mode}
                      type="button"
                      onClick={() => setChartMode(mode)}
                      className={`relative px-2.5 py-1 text-[11px] font-medium rounded-lg capitalize transition-colors ${
                        active ? 'text-ink' : 'text-muted hover:text-ink'
                      }`}
                    >
                      {active && (
                        <motion.span
                          layoutId="chart-mode-pill"
                          transition={tabSlideTransition}
                          className="absolute inset-0 bg-surface rounded-lg shadow-sm border border-hairline"
                        />
                      )}
                      <span className="relative z-10">{mode}</span>
                    </button>
                  );
                })}
              </div>

              <div className="inline-flex p-1 rounded-[10px] bg-subtle border border-hairline">
                {(['daily', 'weekly', 'monthly', 'yearly'] as Timeframe[]).map((tf) => {
                  const active = timeframe === tf;
                  return (
                    <button
                      key={tf}
                      type="button"
                      onClick={() => setTimeframe(tf)}
                      className={`relative px-2.5 py-1 text-xs font-medium rounded-lg transition-colors whitespace-nowrap ${
                        active ? 'text-ink' : 'text-muted hover:text-ink'
                      }`}
                    >
                      {active && (
                        <motion.span
                          layoutId="chart-timeframe-pill"
                          transition={tabSlideTransition}
                          className="absolute inset-0 bg-surface rounded-lg shadow-sm border border-hairline"
                        />
                      )}
                      <span className="relative z-10">{t.dashboard[tf]}</span>
                    </button>
                  );
                })}
              </div>
            </div>
          </div>

          {chartMode === 'area' ? (
            <div className="flex-1 flex flex-col justify-end pt-3">
              <div className="relative h-48 w-full">
                <svg
                  viewBox={`0 0 ${areaGeometry.W} ${areaGeometry.H}`}
                  className="w-full h-full overflow-visible"
                  preserveAspectRatio="none"
                >
                  <defs>
                    <linearGradient id="tl-sales-area" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor="var(--accent-primary)" stopOpacity="0.24" />
                      <stop offset="100%" stopColor="var(--accent-primary)" stopOpacity="0" />
                    </linearGradient>
                  </defs>

                  {[0.25, 0.5, 0.75].map((tick) => {
                    const y = 20 + (190 - 36) * tick;
                    return (
                      <line
                        key={tick}
                        x1={24}
                        x2={576}
                        y1={y}
                        y2={y}
                        stroke="currentColor"
                        strokeOpacity={0.08}
                        strokeDasharray="3 4"
                      />
                    );
                  })}

                  <motion.path
                    key={`area-${timeframe}`}
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ duration: DURATIONS.page, ease: EASE_SAAS }}
                    d={areaGeometry.areaPath}
                    fill="url(#tl-sales-area)"
                  />

                  <motion.path
                    key={`line-${timeframe}`}
                    initial={{ pathLength: 0, opacity: 0.4 }}
                    animate={{ pathLength: 1, opacity: 1 }}
                    transition={{ duration: 0.5, ease: EASE_SAAS }}
                    d={areaGeometry.linePath}
                    fill="none"
                    stroke="var(--accent-primary)"
                    strokeWidth={2.5}
                    strokeLinecap="round"
                  />

                  {areaGeometry.pts.map((pt, idx) => {
                    const active = hoveredIdx === idx;
                    return (
                      <g
                        key={`${timeframe}-pt-${pt.label}`}
                        onMouseEnter={() => setHoveredIdx(idx)}
                        onMouseLeave={() => setHoveredIdx(null)}
                        className="cursor-pointer"
                      >
                        <rect
                          x={pt.x - 28}
                          y={0}
                          width={56}
                          height={areaGeometry.H}
                          fill="transparent"
                        />
                        {active && (
                          <line
                            x1={pt.x}
                            x2={pt.x}
                            y1={12}
                            y2={areaGeometry.H - 16}
                            stroke="var(--accent-primary)"
                            strokeOpacity={0.35}
                            strokeDasharray="3 3"
                          />
                        )}
                        <circle
                          cx={pt.x}
                          cy={pt.y}
                          r={active ? 5.5 : 3.5}
                          fill={active ? 'var(--accent-primary)' : 'var(--bg-surface)'}
                          stroke="var(--accent-primary)"
                          strokeWidth={2}
                        />
                      </g>
                    );
                  })}
                </svg>

                {hoveredIdx !== null && areaGeometry.pts[hoveredIdx] && (
                  <motion.div
                    initial={{ opacity: 0, y: 4, scale: 0.96 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    transition={{ duration: DURATIONS.micro, ease: EASE_SAAS }}
                    style={{
                      left: `${(areaGeometry.pts[hoveredIdx].x / areaGeometry.W) * 100}%`,
                      top: `${Math.max(4, (areaGeometry.pts[hoveredIdx].y / areaGeometry.H) * 100 - 24)}%`,
                    }}
                    className="absolute -translate-x-1/2 z-10 px-2.5 py-1.5 rounded-lg bg-tooltip text-tooltip text-[11px] whitespace-nowrap shadow-lg pointer-events-none"
                  >
                    <div className="font-semibold tabular-nums">
                      {formatMoney(areaGeometry.pts[hoveredIdx].sales, currency)}
                    </div>
                    <div className="text-[10px] opacity-80 tabular-nums">
                      {areaGeometry.pts[hoveredIdx].label} · {areaGeometry.pts[hoveredIdx].orders} orders
                    </div>
                  </motion.div>
                )}
              </div>

              <div className="flex items-center justify-between px-4 pt-2 border-t border-hairline">
                {series.map((item, idx) => (
                  <button
                    key={`${timeframe}-lbl-${item.label}`}
                    type="button"
                    onMouseEnter={() => setHoveredIdx(idx)}
                    onMouseLeave={() => setHoveredIdx(null)}
                    className={`text-[11px] font-medium transition-colors ${
                      hoveredIdx === idx ? 'text-accent' : 'text-muted'
                    }`}
                  >
                    {item.label}
                  </button>
                ))}
              </div>
            </div>
          ) : (
            <div className="flex-1 flex items-end gap-3 h-56 pt-8 pb-2 px-1">
              {series.map((item, idx) => {
                const ratio = Math.max(0.12, item.sales / maxSales);
                const isHovered = hoveredIdx === idx;
                return (
                  <div
                    key={`${timeframe}-${item.label}`}
                    onMouseEnter={() => setHoveredIdx(idx)}
                    onMouseLeave={() => setHoveredIdx(null)}
                    className="flex-1 flex flex-col items-center h-full justify-end group relative cursor-pointer"
                  >
                    {isHovered && (
                      <motion.div
                        initial={{ opacity: 0, y: 4, scale: 0.96 }}
                        animate={{ opacity: 1, y: 0, scale: 1 }}
                        transition={{ duration: DURATIONS.micro, ease: EASE_SAAS }}
                        className="absolute -top-3 z-10 px-2.5 py-1.5 rounded-lg bg-tooltip text-tooltip text-[11px] whitespace-nowrap shadow-lg pointer-events-none"
                      >
                        <div className="font-semibold tabular-nums">
                          {formatMoney(item.sales, currency)}
                        </div>
                        <div className="text-[10px] opacity-80 tabular-nums">
                          {item.orders} orders
                        </div>
                      </motion.div>
                    )}
                    <div className="w-full flex-1 flex items-end justify-center">
                      <motion.div
                        initial={{ scaleY: 0 }}
                        animate={{ scaleY: 1 }}
                        transition={{
                          delay: idx * 0.035,
                          duration: 0.35,
                          ease: EASE_SAAS,
                        }}
                        style={{
                          height: `${Math.round(ratio * 100)}%`,
                          transformOrigin: 'bottom',
                          backgroundColor: isHovered
                            ? 'var(--accent-hover)'
                            : 'var(--accent-primary)',
                        }}
                        className="w-full max-w-[46px] rounded-t-[8px] transition-colors duration-150"
                      />
                    </div>
                    <div className="mt-2.5 text-[11px] font-medium text-muted">{item.label}</div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Warehouse Stock Monitor (Single Hub) */}
        <div className="bg-surface border border-hairline rounded-[14px] p-5 shadow-saas flex flex-col">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h2 className="text-sm font-semibold text-ink">{t.dashboard.warehouseStock}</h2>
              <p className="text-[11px] text-muted mt-0.5">Malka Jabdu Central Hub</p>
            </div>
            <button
              type="button"
              onClick={() => onNavigate('inventory')}
              className="text-xs font-medium text-accent hover:underline"
            >
              {t.dashboard.viewAll}
            </button>
          </div>

          <div className="space-y-4 flex-1">
            {warehouseStaples.map((row, idx) => (
              <div key={row.category} className="space-y-1.5">
                <div className="flex items-center justify-between text-xs">
                  <div className="flex items-center gap-2 font-medium text-ink">
                    <span>{row.label}</span>
                    {row.isLow && (
                      <AlertTriangle
                        style={{ color: 'var(--status-warn-fg)' }}
                        className="w-3.5 h-3.5 shrink-0"
                      />
                    )}
                  </div>
                  <span className="font-mono tabular-nums text-xs text-muted">
                    <strong className="text-ink">{row.stock}</strong> / min {row.minStock}
                  </span>
                </div>
                <div className="h-2 rounded-full bg-subtle overflow-hidden">
                  <motion.div
                    initial={{ scaleX: 0 }}
                    animate={{ scaleX: 1 }}
                    transition={{
                      delay: idx * 0.04,
                      duration: 0.4,
                      ease: EASE_SAAS,
                    }}
                    style={{
                      width: `${row.pct}%`,
                      transformOrigin: 'left',
                      backgroundColor: row.isLow
                        ? 'var(--status-warn-fg)'
                        : 'var(--accent-primary)',
                    }}
                    className="h-full rounded-full"
                  />
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Bottom Row: Recent Orders Table/Cards + Recent Activity Feed */}
      <div className="grid grid-cols-1 xl:grid-cols-3 gap-5">
        <div className="xl:col-span-2 bg-surface border border-hairline rounded-[14px] shadow-saas overflow-hidden">
          <div className="px-5 py-4 border-b border-hairline flex items-center justify-between">
            <h2 className="text-sm font-semibold text-ink">{t.dashboard.recentOrders}</h2>
            <button
              type="button"
              onClick={() => onNavigate('orders')}
              className="text-xs font-medium text-accent hover:underline"
            >
              {t.dashboard.viewAll}
            </button>
          </div>

          {/* Mobile Card Layout */}
          <div className="md:hidden divide-y divide-hairline">
            {orders.slice(0, 6).map((ord) => {
              const matchedProd = products.find((p) => p.id === ord.productId);
              return (
                <button
                  key={ord.id}
                  type="button"
                  onClick={() => onSelectOrder(ord)}
                  className="w-full p-4 text-left bg-hover transition-colors space-y-2"
                >
                  <div className="flex items-center justify-between gap-2">
                    <span className="font-mono text-xs font-semibold text-ink">
                      {ord.orderCode}
                    </span>
                    <StatusTag
                      tone={orderStatusTone(ord.status)}
                      label={t.statuses[ord.status]}
                    />
                  </div>
                  <div className="text-xs font-medium text-ink">{ord.buyerName}</div>
                  <div className="flex items-center justify-between text-xs text-muted">
                    <span className="truncate">
                      {matchedProd ? getProductTitle(matchedProd, lang) : ord.productName} ×{' '}
                      {ord.quantity}
                    </span>
                    <span className="font-mono tabular-nums font-semibold text-ink shrink-0 ml-2">
                      {formatMoney(ord.totalAmount, ord.currency)}
                    </span>
                  </div>
                </button>
              );
            })}
          </div>

          {/* Desktop Table */}
          <div className="hidden md:block overflow-x-auto max-h-[380px]">
            <table className="w-full text-left border-collapse text-xs">
              <thead className="sticky top-0 z-10 bg-surface border-b border-hairline text-muted">
                <tr>
                  <th className="py-2.5 px-4 font-medium">Order ID</th>
                  <th className="py-2.5 px-4 font-medium">Buyer</th>
                  <th className="py-2.5 px-4 font-medium">Product</th>
                  <th className="py-2.5 px-4 font-medium text-right">Qty</th>
                  <th className="py-2.5 px-4 font-medium text-right">Total</th>
                  <th className="py-2.5 px-4 font-medium">Date</th>
                  <th className="py-2.5 px-4 font-medium">Status</th>
                  <th className="py-2.5 px-4 font-medium text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-hairline">
                {orders.slice(0, 6).map((ord) => {
                  const matchedProd = products.find((p) => p.id === ord.productId);
                  return (
                    <tr key={ord.id} className="bg-hover transition-colors">
                      <td className="py-3 px-4 font-mono font-semibold text-ink whitespace-nowrap">
                        {ord.orderCode}
                      </td>
                      <td className="py-3 px-4 text-ink font-medium whitespace-nowrap">
                        {ord.buyerName}
                      </td>
                      <td className="py-3 px-4 text-muted max-w-[180px] truncate">
                        {matchedProd ? getProductTitle(matchedProd, lang) : ord.productName}
                      </td>
                      <td className="py-3 px-4 text-right font-mono tabular-nums text-ink">
                        {ord.quantity}
                      </td>
                      <td className="py-3 px-4 text-right font-mono tabular-nums font-semibold text-ink whitespace-nowrap">
                        {formatMoney(ord.totalAmount, ord.currency)}
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
                      <td className="py-3 px-4 text-right">
                        <button
                          type="button"
                          onClick={() => onSelectOrder(ord)}
                          className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg border border-hairline bg-hover text-ink transition-colors"
                        >
                          <Eye className="w-3 h-3" />
                          <span>View</span>
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>

        {/* Recent Activity Feed */}
        <div className="bg-surface border border-hairline rounded-[14px] p-5 shadow-saas flex flex-col">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-sm font-semibold text-ink">{t.dashboard.recentActivity}</h2>
            <button
              type="button"
              onClick={() => onNavigate('activity_logs')}
              className="text-xs font-medium text-accent hover:underline"
            >
              {t.dashboard.viewAll}
            </button>
          </div>
          <div className="space-y-3.5 flex-1">
            {auditEvents.slice(0, 6).map((evt, idx) => (
              <motion.div
                key={evt.id}
                initial={{ opacity: 0, x: -6 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{
                  delay: idx * 0.03,
                  duration: DURATIONS.dropdown,
                  ease: EASE_SAAS,
                }}
                className="flex items-start gap-3"
              >
                <div className="w-7 h-7 rounded-lg bg-subtle border border-hairline flex items-center justify-center shrink-0 mt-0.5">
                  <Clock className="w-3.5 h-3.5 text-accent" />
                </div>
                <div className="min-w-0">
                  <p className="text-xs text-ink leading-snug">{evt.summary}</p>
                  <p className="text-[11px] text-muted mt-0.5">
                    {evt.actorName} · {evt.category}
                  </p>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
