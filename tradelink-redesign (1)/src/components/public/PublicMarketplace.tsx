import React, { useMemo, useState } from 'react';
import { AnimatePresence, motion } from 'motion/react';
import {
  ArrowLeft,
  ChevronDown,
  ExternalLink,
  Globe,
  LogIn,
  LogOut,
  MapPin,
  MessageCircle,
  Moon,
  Package,
  Phone,
  Search,
  Send,
  Sun,
  UserCheck,
} from 'lucide-react';
import {
  FOOD_CATEGORIES,
  type Language,
  type Product,
  type ProductCategory,
  type PublicStorefrontInfo,
  type ThemeMode,
} from '../../types/tradelink';
import {
  TRANSLATIONS,
  formatMoney,
  getProductTitle,
} from '../../i18n/translations';
import { HERO_WAREHOUSE_IMAGE, resolveProductImage } from '../../data/productImages';
import { DURATIONS, EASE_SAAS, tabSlideTransition } from '../../lib/motion';
import { EmptyState, ErrorBanner, Modal, StatusTag } from '../ui/SaasPrimitives';

function buildWhatsappUrl(rawPhone: string, message: string): string {
  const digits = rawPhone.replace(/[^\d]/g, '');
  const cleanDigits = digits.startsWith('0') ? `251${digits.slice(1)}` : digits;
  return `https://wa.me/${cleanDigits}?text=${encodeURIComponent(message)}`;
}

function buildTelegramUrl(handleOrPhone: string): string {
  const trimmed = handleOrPhone.trim();
  if (!trimmed) return 'https://t.me/tradelinkmalkajabdu';
  if (trimmed.startsWith('http://') || trimmed.startsWith('https://')) return trimmed;
  if (trimmed.startsWith('@')) return `https://t.me/${trimmed.slice(1)}`;
  if (trimmed.startsWith('+')) return `https://t.me/${trimmed}`;
  return `https://t.me/${trimmed}`;
}

function buildTelUrl(phone: string): string {
  const cleaned = phone.replace(/[^\d+]/g, '');
  return `tel:${cleaned}`;
}

export function PublicStorefrontPage({
  lang,
  onChangeLang,
  theme,
  onToggleTheme,
  products,
  productsError,
  onRetryProducts,
  storefront,
  isAuthenticated,
  isPendingApproval,
  canAccessWorkspace,
  onSignIn,
  onSignOut,
  onBackToWorkspace,
}: {
  lang: Language;
  onChangeLang: (lang: Language) => void;
  theme: ThemeMode;
  onToggleTheme: () => void;
  products: Product[];
  productsError?: { code?: string; message?: string } | null;
  onRetryProducts?: () => void;
  storefront: PublicStorefrontInfo;
  isAuthenticated: boolean;
  isPendingApproval: boolean;
  canAccessWorkspace: boolean;
  onSignIn: () => void;
  onSignOut: () => void;
  onBackToWorkspace?: () => void;
}) {
  const t = TRANSLATIONS[lang];
  const [search, setSearch] = useState('');
  const [categoryFilter, setCategoryFilter] = useState<'all' | ProductCategory>('all');
  const [sortBy, setSortBy] = useState<'name' | 'stock' | 'price'>('name');
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const [heroImgFailed, setHeroImgFailed] = useState(false);

  const approvedProducts = useMemo(
    () => products.filter((p) => p.status === 'active'),
    [products]
  );

  const filteredProducts = useMemo(() => {
    const q = search.trim().toLowerCase();
    return approvedProducts
      .filter((p) => (categoryFilter === 'all' ? true : p.category === categoryFilter))
      .filter((p) => {
        if (!q) return true;
        return (
          p.name.toLowerCase().includes(q) ||
          (p.nameSo || '').toLowerCase().includes(q) ||
          (p.nameAm || '').toLowerCase().includes(q) ||
          (p.description || '').toLowerCase().includes(q) ||
          (p.origin || '').toLowerCase().includes(q) ||
          (p.sku || '').toLowerCase().includes(q) ||
          t.categories[p.category].toLowerCase().includes(q)
        );
      })
      .sort((a, b) => {
        if (sortBy === 'stock') return b.stockQty - a.stockQty;
        if (sortBy === 'price') return a.sellingPrice - b.sellingPrice;
        return getProductTitle(a, lang).localeCompare(getProductTitle(b, lang));
      });
  }, [approvedProducts, categoryFilter, search, sortBy, lang, t.categories]);

  const getAgentInfo = (p: Product) => {
    const name = p.agentName?.trim() || storefront.agentName;
    const phone = p.agentPhone?.trim() || storefront.agentPhone;
    const whatsapp = p.agentWhatsapp?.trim() || phone || storefront.agentWhatsapp;
    const telegram = p.agentTelegram?.trim() || storefront.agentTelegram;
    const location =
      p.collectionLocation?.trim() ||
      (p.warehouseBay
        ? `${storefront.warehouseName} · ${p.warehouseBay}`
        : storefront.collectionLocation);
    return { name, phone, whatsapp, telegram, location };
  };

  return (
    <div className="min-h-screen flex flex-col bg-canvas text-ink">
      {/* Clean 3-Zone Public Top Bar */}
      <header className="sticky top-0 z-30 h-16 bg-surface/95 backdrop-blur-md border-b border-hairline">
        <div className="max-w-[1280px] mx-auto h-full px-4 lg:px-8 flex items-center justify-between gap-6">
          {/* Zone 1: Single-line Brand Wordmark */}
          <a
            href="#catalog"
            className="flex items-center gap-2.5 whitespace-nowrap shrink-0"
          >
            <span className="w-8 h-8 rounded-[10px] bg-accent text-on-accent flex items-center justify-center font-display font-bold text-sm">
              TL
            </span>
            <span className="font-display font-bold text-lg tracking-tight text-ink">
              TradeLink
            </span>
          </a>

          {/* Zone 2: Concise single-line navigation links */}
          <nav
            aria-label="Public marketplace navigation"
            className="hidden md:flex items-center gap-7 text-xs font-medium text-muted"
          >
            <a
              href="#catalog"
              className="hover:text-ink transition-colors whitespace-nowrap shrink-0"
            >
              {t.public.navCatalog}
            </a>
            <a
              href="#collection-hub"
              className="hover:text-ink transition-colors whitespace-nowrap shrink-0"
            >
              {t.public.navCollection}
            </a>
            <a
              href={buildTelegramUrl(storefront.telegramChannelUrl)}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1.5 hover:text-accent transition-colors whitespace-nowrap shrink-0"
            >
              <span>{t.public.navChannel}</span>
              <ExternalLink className="w-3 h-3" />
            </a>
          </nav>

          {/* Zone 3: Language, Theme & Primary Action */}
          <div className="flex items-center gap-2 shrink-0">
            <div className="relative flex items-center">
              <Globe className="w-3.5 h-3.5 text-muted absolute left-2.5 pointer-events-none" />
              <select
                aria-label="Language"
                value={lang}
                onChange={(e) => onChangeLang(e.target.value as Language)}
                className="pl-7 pr-6 py-1.5 text-xs font-medium bg-subtle border border-hairline rounded-[10px] text-ink appearance-none cursor-pointer"
              >
                <option value="en">EN</option>
                <option value="so">SO</option>
                <option value="am">AM</option>
              </select>
              <ChevronDown className="w-3 h-3 text-muted absolute right-2 pointer-events-none" />
            </div>

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

            {canAccessWorkspace && onBackToWorkspace ? (
              <button
                type="button"
                onClick={onBackToWorkspace}
                className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-[10px] bg-accent text-on-accent text-xs font-medium whitespace-nowrap shrink-0 transition-colors"
              >
                <ArrowLeft className="w-3.5 h-3.5" />
                <span>{t.topbar.backToWorkspace}</span>
              </button>
            ) : isAuthenticated ? (
              <button
                type="button"
                onClick={onSignOut}
                className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-[10px] border border-hairline bg-surface bg-hover text-ink text-xs font-medium whitespace-nowrap shrink-0 transition-colors"
              >
                <LogOut className="w-3.5 h-3.5" />
                <span>{t.topbar.signOut}</span>
              </button>
            ) : (
              <button
                type="button"
                onClick={onSignIn}
                className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-[10px] border border-hairline bg-surface bg-hover text-ink text-xs font-medium whitespace-nowrap shrink-0 transition-colors"
              >
                <LogIn className="w-3.5 h-3.5" />
                <span>{t.topbar.staffSignIn}</span>
              </button>
            )}
          </div>
        </div>
      </header>

      {/* Pending approval notice when signed in without active team role */}
      {isPendingApproval && (
        <div className="border-b border-hairline bg-subtle">
          <div className="max-w-[1280px] mx-auto px-4 lg:px-8 py-2.5 flex flex-wrap items-center justify-between gap-2 text-xs">
            <span className="text-ink font-medium">{t.topbar.pendingApprovalNotice}</span>
            <button
              type="button"
              onClick={onSignOut}
              className="text-accent font-semibold hover:underline"
            >
              {t.topbar.signOut}
            </button>
          </div>
        </div>
      )}

      <main className="flex-1">
        {/* Section 1: Split Storefront Hero */}
        <section className="border-b border-hairline">
          <div className="max-w-[1280px] mx-auto px-4 lg:px-8 py-8 lg:py-12">
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-stretch">
              <div className="lg:col-span-7 flex flex-col justify-between space-y-6">
                <div className="space-y-4">
                  <div className="text-xs font-medium text-muted">
                    {storefront.businessName} · {storefront.warehouseName}
                  </div>
                  <h1 className="text-3xl sm:text-4xl lg:text-[42px] font-display font-bold tracking-tight text-ink leading-[1.12]">
                    {t.public.heroHeadline}
                  </h1>
                  <p className="text-sm sm:text-[15px] text-muted leading-relaxed max-w-2xl">
                    {t.public.heroSubtitle}
                  </p>
                </div>

                <div className="flex flex-wrap items-center gap-3 pt-2">
                  <a
                    href="#catalog"
                    className="inline-flex items-center gap-2 px-5 py-2.5 rounded-[10px] bg-accent text-on-accent text-xs sm:text-sm font-medium transition-colors whitespace-nowrap"
                  >
                    <Package className="w-4 h-4" />
                    <span>{t.public.browseGoods}</span>
                  </a>
                  <a
                    href={buildTelegramUrl(storefront.telegramChannelUrl)}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-2 px-5 py-2.5 rounded-[10px] border border-hairline bg-surface bg-hover text-ink text-xs sm:text-sm font-medium transition-colors whitespace-nowrap"
                  >
                    <Send className="w-4 h-4 text-accent" />
                    <span>{t.public.joinTelegramChannel}</span>
                    <ExternalLink className="w-3.5 h-3.5 text-muted" />
                  </a>
                </div>
              </div>

              <div className="lg:col-span-5">
                <div className="h-60 sm:h-72 lg:h-full min-h-[260px] rounded-[14px] overflow-hidden border border-hairline bg-subtle shadow-saas">
                  {!heroImgFailed ? (
                    <img
                      src={HERO_WAREHOUSE_IMAGE}
                      alt={storefront.warehouseName}
                      referrerPolicy="no-referrer"
                      onError={() => setHeroImgFailed(true)}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <div className="w-full h-full flex flex-col items-center justify-center p-6 text-center gap-2">
                      <Package className="w-8 h-8 text-accent" />
                      <div className="text-sm font-semibold text-ink">
                        {storefront.warehouseName}
                      </div>
                      <div className="text-xs text-muted">{storefront.collectionLocation}</div>
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Full-Width 4-Column Summary Strip below Hero Split */}
            <div className="mt-8 pt-6 border-t border-hairline grid grid-cols-2 lg:grid-cols-4 gap-4 text-xs">
              <div className="space-y-1">
                <div className="text-muted">{t.public.approvedGoodsCount}</div>
                <div className="font-display font-bold text-lg tabular-nums text-ink">
                  {approvedProducts.length}
                </div>
              </div>
              <div className="space-y-1">
                <div className="text-muted">{t.public.collectionPointLabel}</div>
                <div className="font-semibold text-ink truncate">{storefront.warehouseName}</div>
              </div>
              <div className="space-y-1">
                <div className="text-muted">{t.public.directAgentLabel}</div>
                <div className="font-semibold text-ink">WhatsApp · Telegram · Phone</div>
              </div>
              <div className="space-y-1">
                <div className="text-muted">{t.public.telegramUpdatesLabel}</div>
                <a
                  href={buildTelegramUrl(storefront.telegramChannelUrl)}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1 font-semibold text-accent hover:underline"
                >
                  <span>{t.public.openOfficialChannel}</span>
                  <ExternalLink className="w-3 h-3" />
                </a>
              </div>
            </div>
          </div>
        </section>

        {/* Section 2: Search, Filter & Approved Product Catalog */}
        <section id="catalog" className="max-w-[1280px] mx-auto px-4 lg:px-8 py-8 lg:py-10 space-y-6">
          {/* Search & Category Controls */}
          <div className="bg-surface border border-hairline rounded-[14px] p-4 space-y-3.5 shadow-saas">
            <div className="flex flex-col md:flex-row gap-3">
              <div className="relative flex-1">
                <Search className="w-4 h-4 text-muted absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
                <input
                  type="text"
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  placeholder={t.public.searchPlaceholder}
                  aria-label={t.public.searchPlaceholder}
                  className="w-full pl-9 pr-3 py-2.5 text-xs bg-subtle border border-hairline rounded-[10px] text-ink placeholder:text-muted"
                />
              </div>
              <select
                aria-label="Sort products"
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value as 'name' | 'stock' | 'price')}
                className="px-3 py-2.5 text-xs bg-subtle border border-hairline rounded-[10px] text-ink"
              >
                <option value="name">{t.public.sortName}</option>
                <option value="stock">{t.public.sortStock}</option>
                <option value="price">{t.public.sortPrice}</option>
              </select>
            </div>

            <div className="flex items-center gap-1.5 overflow-x-auto pb-1">
              <button
                type="button"
                onClick={() => setCategoryFilter('all')}
                className={`relative px-3 py-1.5 rounded-lg text-xs font-medium whitespace-nowrap shrink-0 transition-colors ${
                  categoryFilter === 'all'
                    ? 'text-on-accent'
                    : 'bg-subtle text-muted hover:text-ink'
                }`}
              >
                {categoryFilter === 'all' && (
                  <motion.span
                    layoutId="public-cat-pill"
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
                  onClick={() => setCategoryFilter(cat)}
                  className={`relative px-3 py-1.5 rounded-lg text-xs font-medium whitespace-nowrap shrink-0 transition-colors ${
                    categoryFilter === cat
                      ? 'text-on-accent'
                      : 'bg-subtle text-muted hover:text-ink'
                  }`}
                >
                  {categoryFilter === cat && (
                    <motion.span
                      layoutId="public-cat-pill"
                      transition={tabSlideTransition}
                      className="absolute inset-0 bg-accent rounded-lg"
                    />
                  )}
                  <span className="relative z-10">{t.categories[cat]}</span>
                </button>
              ))}
            </div>
          </div>

          {/* Product Load Error Banner (shows error.code in development) */}
          {productsError && (
            <ErrorBanner
              title={t.common.errorTitle}
              message={`${t.public.loadProductsError}${
                import.meta.env.DEV && productsError.code
                  ? ` [${productsError.code}${productsError.message ? `: ${productsError.message}` : ''}]`
                  : ''
              }`}
              retryLabel={t.common.retry}
              onRetry={onRetryProducts || (() => window.location.reload())}
            />
          )}

          {/* Product Grid */}
          {filteredProducts.length === 0 ? (
            <EmptyState
              icon={<Package className="w-6 h-6" />}
              title={t.public.emptyCatalogTitle}
              description={t.public.emptyCatalogDesc}
            />
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {filteredProducts.map((product) => {
                const title = getProductTitle(product, lang);
                const agent = getAgentInfo(product);
                const inStock = product.stockQty > 0;
                const waMsg = `${t.public.whatsappPreset} ${title} (${product.unit}).`;

                return (
                  <motion.article
                    key={product.id}
                    whileHover={{ y: -2 }}
                    transition={{ duration: DURATIONS.micro, ease: EASE_SAAS }}
                    className="bg-surface border border-hairline rounded-[14px] overflow-hidden shadow-saas flex flex-col"
                  >
                    <button
                      type="button"
                      onClick={() => setSelectedProduct(product)}
                      className="block w-full aspect-[4/3] bg-subtle overflow-hidden text-left"
                    >
                      <img
                        src={resolveProductImage(product.photoUrl, product.category)}
                        alt={title}
                        referrerPolicy="no-referrer"
                        className="w-full h-full object-cover transition-transform duration-300 hover:scale-[1.02]"
                      />
                    </button>

                    <div className="p-5 flex-1 flex flex-col justify-between space-y-4">
                      <div className="space-y-2.5">
                        {/* Quiet unboxed metadata line */}
                        <div className="flex items-center justify-between gap-2 text-xs text-muted">
                          <span className="truncate">
                            {t.categories[product.category]}
                            {product.origin ? ` · ${product.origin}` : ''}
                          </span>
                          <StatusTag
                            tone={inStock ? 'emerald' : 'rose'}
                            label={
                              inStock
                                ? `${product.stockQty.toLocaleString()} ${product.unit}`
                                : t.public.outOfStock
                            }
                          />
                        </div>

                        <button
                          type="button"
                          onClick={() => setSelectedProduct(product)}
                          className="text-left block w-full"
                        >
                          <h2 className="text-base font-display font-semibold text-ink leading-snug hover:text-accent transition-colors">
                            {title}
                          </h2>
                        </button>

                        {product.description && (
                          <p className="text-xs text-muted line-clamp-2 leading-relaxed">
                            {product.description}
                          </p>
                        )}
                      </div>

                      <div className="space-y-3 pt-2 border-t border-hairline text-xs">
                        <div className="flex items-baseline justify-between gap-2">
                          <span className="text-muted">{t.public.referencePrice}</span>
                          <span className="font-mono font-semibold text-sm text-ink tabular-nums">
                            {formatMoney(product.sellingPrice, product.currency)}
                            <span className="text-[11px] font-normal text-muted">
                              {' '}
                              / {product.unit}
                            </span>
                          </span>
                        </div>

                        <div className="flex items-start gap-2 text-muted">
                          <MapPin className="w-3.5 h-3.5 text-accent shrink-0 mt-0.5" />
                          <span className="line-clamp-1">{agent.location}</span>
                        </div>

                        <div className="flex items-center gap-2 text-muted">
                          <UserCheck className="w-3.5 h-3.5 text-accent shrink-0" />
                          <span className="truncate">
                            <strong className="font-medium text-ink">{agent.name}</strong> ·{' '}
                            <span className="font-mono">{agent.phone}</span>
                          </span>
                        </div>

                        {/* Direct Actions: Details, WhatsApp, Telegram, Call */}
                        <div className="grid grid-cols-4 gap-1.5 pt-1">
                          <button
                            type="button"
                            onClick={() => setSelectedProduct(product)}
                            className="px-2 py-2 rounded-lg border border-hairline bg-subtle bg-hover text-ink text-[11px] font-medium whitespace-nowrap text-center transition-colors"
                          >
                            {t.public.viewDetails}
                          </button>
                          <a
                            href={buildWhatsappUrl(agent.whatsapp, waMsg)}
                            target="_blank"
                            rel="noopener noreferrer"
                            aria-label={`${t.public.openWhatsapp} — ${agent.name}`}
                            className="inline-flex items-center justify-center gap-1 px-2 py-2 rounded-lg bg-accent text-on-accent text-[11px] font-medium whitespace-nowrap transition-colors"
                          >
                            <MessageCircle className="w-3.5 h-3.5 shrink-0" />
                            <span>WA</span>
                          </a>
                          <a
                            href={buildTelegramUrl(agent.telegram)}
                            target="_blank"
                            rel="noopener noreferrer"
                            aria-label={`${t.public.openTelegram} — ${agent.name}`}
                            className="inline-flex items-center justify-center gap-1 px-2 py-2 rounded-lg border border-hairline bg-surface bg-hover text-ink text-[11px] font-medium whitespace-nowrap transition-colors"
                          >
                            <Send className="w-3.5 h-3.5 text-accent shrink-0" />
                            <span>TG</span>
                          </a>
                          <a
                            href={buildTelUrl(agent.phone)}
                            aria-label={`${t.public.callAgent} — ${agent.name}`}
                            className="inline-flex items-center justify-center gap-1 px-2 py-2 rounded-lg border border-hairline bg-surface bg-hover text-ink text-[11px] font-medium whitespace-nowrap transition-colors"
                          >
                            <Phone className="w-3.5 h-3.5 text-accent shrink-0" />
                            <span>Call</span>
                          </a>
                        </div>
                      </div>
                    </div>
                  </motion.article>
                );
              })}
            </div>
          )}
        </section>

        {/* Section 3: Collection Hub & Official Telegram Channel */}
        <section id="collection-hub" className="border-t border-hairline bg-subtle/40">
          <div className="max-w-[1280px] mx-auto px-4 lg:px-8 py-10 grid grid-cols-1 lg:grid-cols-2 gap-6">
            <div className="bg-surface border border-hairline rounded-[14px] p-6 space-y-3 shadow-saas">
              <div className="flex items-center gap-2 text-ink font-display font-semibold text-base">
                <MapPin className="w-4 h-4 text-accent" />
                <h2>{t.public.collectionHubTitle}</h2>
              </div>
              <p className="text-xs text-muted leading-relaxed">{t.public.collectionHubDesc}</p>
              <div className="pt-2 space-y-1.5 text-xs">
                <div className="font-semibold text-ink">{storefront.warehouseName}</div>
                <div className="text-muted">{storefront.collectionLocation}</div>
                <div className="text-muted">{t.public.selfPickupNotice}</div>
              </div>
            </div>

            <div className="bg-surface border border-hairline rounded-[14px] p-6 flex flex-col justify-between space-y-4 shadow-saas">
              <div className="space-y-2">
                <div className="flex items-center gap-2 text-ink font-display font-semibold text-base">
                  <Send className="w-4 h-4 text-accent" />
                  <h2>{t.public.officialChannelTitle}</h2>
                </div>
                <p className="text-xs text-muted leading-relaxed">
                  {t.public.officialChannelDesc}
                </p>
              </div>
              <div className="flex flex-wrap items-center justify-between gap-3 pt-2">
                <span className="text-xs text-muted">{t.public.noAccountRequired}</span>
                <a
                  href={buildTelegramUrl(storefront.telegramChannelUrl)}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-2 px-4 py-2 rounded-[10px] bg-accent text-on-accent text-xs font-medium whitespace-nowrap transition-colors"
                >
                  <Send className="w-3.5 h-3.5" />
                  <span>{t.public.openOfficialChannel}</span>
                  <ExternalLink className="w-3.5 h-3.5" />
                </a>
              </div>
            </div>
          </div>
        </section>
      </main>

      <footer className="border-t border-hairline bg-surface">
        <div className="max-w-[1280px] mx-auto px-4 lg:px-8 py-5 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs text-muted">
          <div>
            {storefront.businessName} · {storefront.collectionLocation}
          </div>
          <div className="flex items-center gap-4">
            <a
              href={buildTelegramUrl(storefront.telegramChannelUrl)}
              target="_blank"
              rel="noopener noreferrer"
              className="hover:text-accent transition-colors"
            >
              {t.public.joinTelegramChannel}
            </a>
            <span>{t.public.noAccountRequired}</span>
          </div>
        </div>
      </footer>

      {/* Product Details Modal (Public-Safe Fields Only) */}
      <Modal
        open={Boolean(selectedProduct)}
        onClose={() => setSelectedProduct(null)}
        title={selectedProduct ? getProductTitle(selectedProduct, lang) : ''}
        subtitle={
          selectedProduct
            ? `${t.categories[selectedProduct.category]}${selectedProduct.sku ? ` · ${selectedProduct.sku}` : ''}`
            : undefined
        }
        maxWidth="max-w-2xl"
      >
        {selectedProduct &&
          (() => {
            const title = getProductTitle(selectedProduct, lang);
            const agent = getAgentInfo(selectedProduct);
            const inStock = selectedProduct.stockQty > 0;
            const waMsg = `${t.public.whatsappPreset} ${title} (${selectedProduct.unit}).`;

            return (
              <div className="grid grid-cols-1 md:grid-cols-12 gap-5 text-xs">
                <div className="md:col-span-5 space-y-3">
                  <div className="aspect-[4/3] rounded-[12px] overflow-hidden border border-hairline bg-subtle">
                    <img
                      src={resolveProductImage(selectedProduct.photoUrl, selectedProduct.category)}
                      alt={title}
                      referrerPolicy="no-referrer"
                      className="w-full h-full object-cover"
                    />
                  </div>
                  <div className="space-y-1.5 text-xs">
                    {selectedProduct.sku && (
                      <div className="flex justify-between gap-2">
                        <span className="text-muted">{t.public.skuLabel}</span>
                        <span className="font-mono text-ink">{selectedProduct.sku}</span>
                      </div>
                    )}
                    <div className="flex justify-between gap-2">
                      <span className="text-muted">{t.public.unitLabel}</span>
                      <span className="font-medium text-ink">{selectedProduct.unit}</span>
                    </div>
                    {selectedProduct.origin && (
                      <div className="flex justify-between gap-2">
                        <span className="text-muted">{t.public.originLabel}</span>
                        <span className="font-medium text-ink">{selectedProduct.origin}</span>
                      </div>
                    )}
                    {selectedProduct.expiryDate && (
                      <div className="flex justify-between gap-2">
                        <span className="text-muted">{t.public.expiryLabel}</span>
                        <span className="font-mono text-ink">{selectedProduct.expiryDate}</span>
                      </div>
                    )}
                  </div>
                </div>

                <div className="md:col-span-7 space-y-4">
                  <div className="space-y-1.5">
                    <div className="flex items-baseline justify-between gap-3">
                      <span className="text-muted">{t.public.referencePrice}</span>
                      <span className="text-lg font-display font-bold font-mono tabular-nums text-ink">
                        {formatMoney(selectedProduct.sellingPrice, selectedProduct.currency)}{' '}
                        <span className="text-xs font-normal text-muted">
                          / {selectedProduct.unit}
                        </span>
                      </span>
                    </div>
                    <p className="text-[11px] text-muted">{t.public.negotiablePricing}</p>
                  </div>

                  {selectedProduct.description && (
                    <p className="text-ink leading-relaxed">{selectedProduct.description}</p>
                  )}

                  <div className="p-3.5 rounded-[12px] bg-subtle border border-hairline space-y-2.5">
                    <div className="flex items-center justify-between gap-2">
                      <span className="text-muted">{t.public.availableQty}</span>
                      <StatusTag
                        tone={inStock ? 'emerald' : 'rose'}
                        label={
                          inStock
                            ? `${selectedProduct.stockQty.toLocaleString()} ${selectedProduct.unit}`
                            : t.public.outOfStock
                        }
                      />
                    </div>
                    <div className="flex items-start justify-between gap-3 pt-2 border-t border-hairline">
                      <span className="text-muted shrink-0">{t.public.collectionLocation}</span>
                      <span className="font-medium text-ink text-right">{agent.location}</span>
                    </div>
                  </div>

                  <div className="p-3.5 rounded-[12px] border border-hairline bg-surface space-y-3">
                    <div className="flex items-center justify-between gap-2">
                      <div>
                        <div className="text-[11px] text-muted">{t.public.assignedAgent}</div>
                        <div className="text-sm font-semibold text-ink">{agent.name}</div>
                      </div>
                      <div className="font-mono text-xs text-ink">{agent.phone}</div>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                      <a
                        href={buildWhatsappUrl(agent.whatsapp, waMsg)}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center justify-center gap-1.5 px-3 py-2 rounded-[10px] bg-accent text-on-accent font-medium whitespace-nowrap transition-colors"
                      >
                        <MessageCircle className="w-3.5 h-3.5" />
                        <span>{t.public.openWhatsapp}</span>
                      </a>
                      <a
                        href={buildTelegramUrl(agent.telegram)}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center justify-center gap-1.5 px-3 py-2 rounded-[10px] border border-hairline bg-subtle bg-hover text-ink font-medium whitespace-nowrap transition-colors"
                      >
                        <Send className="w-3.5 h-3.5 text-accent" />
                        <span>{t.public.openTelegram}</span>
                      </a>
                      <a
                        href={buildTelUrl(agent.phone)}
                        className="inline-flex items-center justify-center gap-1.5 px-3 py-2 rounded-[10px] border border-hairline bg-subtle bg-hover text-ink font-medium whitespace-nowrap transition-colors"
                      >
                        <Phone className="w-3.5 h-3.5 text-accent" />
                        <span>{t.public.callAgent}</span>
                      </a>
                    </div>
                  </div>

                  <div className="flex items-center justify-between pt-1">
                    <a
                      href={buildTelegramUrl(storefront.telegramChannelUrl)}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-1.5 text-xs font-medium text-accent hover:underline"
                    >
                      <Send className="w-3.5 h-3.5" />
                      <span>{t.public.openOfficialChannel}</span>
                      <ExternalLink className="w-3 h-3" />
                    </a>
                    <button
                      type="button"
                      onClick={() => setSelectedProduct(null)}
                      className="px-4 py-2 rounded-[10px] border border-hairline text-ink bg-hover"
                    >
                      {t.common.close}
                    </button>
                  </div>
                </div>
              </div>
            );
          })()}
      </Modal>
    </div>
  );
}
