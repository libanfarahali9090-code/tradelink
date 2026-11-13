import { useEffect, useMemo, useRef, useState } from 'react';
import { AnimatePresence, motion } from 'motion/react';
import { Boxes, Clock, Handshake, MapPin, MessageCircle, Moon, PackageCheck, PackageSearch, Search, Sun, UserRound, X } from 'lucide-react';
import { CATEGORY_IMAGES, HERO_WAREHOUSE_IMAGE, resolveProductImage } from '../../data/productImages';
import { formatStockUpdate, toDigits } from '../../lib/contact';
import { MARKETPLACE_STRINGS, type MarketplaceStrings } from '../../i18n/marketplace';
import { TRANSLATIONS, getProductTitle } from '../../i18n/translations';
import { FOOD_CATEGORIES } from '../../types/tradelink';
import type {
  Agent,
  Language,
  PlatformSettings,
  ProductAvailability,
  PublicListing,
  ProductCategory,
  ThemeMode,
} from '../../types/tradelink';
import { AgentContact } from './AgentContact';

interface Props {
  lang: Language;
  theme: ThemeMode;
  listings: PublicListing[];
  agents: Agent[];
  settings: PlatformSettings;
  loading: boolean;
  loadError: boolean;
  onChangeLang: (lang: Language) => void;
  onToggleTheme: () => void;
  staffHref: string;
}

const LANGS: { code: Language; label: string }[] = [
  { code: 'en', label: 'EN' },
  { code: 'so', label: 'SO' },
  { code: 'am', label: 'አማ' },
];

const AVAILABILITY_RANK: Record<ProductAvailability, number> = {
  in_stock: 0,
  low_stock: 1,
  out_of_stock: 2,
};

const AVAILABILITY_STYLE: Record<ProductAvailability, { bg: string; fg: string; bd: string }> = {
  in_stock: { bg: 'var(--status-success-bg)', fg: 'var(--status-success-fg)', bd: 'var(--status-success-bd)' },
  low_stock: { bg: 'var(--status-warn-bg)', fg: 'var(--status-warn-fg)', bd: 'var(--status-warn-bd)' },
  out_of_stock: { bg: 'var(--status-danger-bg)', fg: 'var(--status-danger-fg)', bd: 'var(--status-danger-bd)' },
};

function AvailabilityBadge({ status, t }: { status: ProductAvailability; t: MarketplaceStrings }) {
  const s = AVAILABILITY_STYLE[status];
  return (
    // Solid surface underneath keeps the tinted pill readable on top of photos.
    <span className="inline-flex rounded-full bg-surface">
      <span
        className="inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-[12px] font-semibold"
        style={{ background: s.bg, color: s.fg, borderColor: s.bd }}
      >
        <span className="h-1.5 w-1.5 rounded-full" style={{ background: s.fg }} aria-hidden="true" />
        {t.availability[status]}
      </span>
    </span>
  );
}

function resolveAgent(product: PublicListing, agents: Agent[], settings: PlatformSettings, t: MarketplaceStrings): Agent {
  const match = agents.find((a) => a.id === product.agentId && a.status === 'active');
  if (match) return match;
  // No agent assigned: route to the TradeLink office so a customer can always reach someone.
  const phone = settings.phone ? `+${toDigits(settings.phone)}` : '';
  return {
    id: 'office',
    code: t.officeLabel,
    name: t.officeLabel,
    phone,
    whatsapp: phone,
    languages: ['en', 'so', 'am'],
    status: 'active',
  };
}

function collectionOf(product: PublicListing, settings: PlatformSettings): string {
  return product.collectionLocation || [settings.warehouseName, product.warehouseBay].filter(Boolean).join(', ');
}

export function PublicMarketplace({
  lang,
  theme,
  listings,
  agents,
  settings,
  loading,
  loadError,
  onChangeLang,
  onToggleTheme,
  staffHref,
}: Props) {
  const t = MARKETPLACE_STRINGS[lang];
  const categoryLabels = TRANSLATIONS[lang].categories;

  const [query, setQuery] = useState('');
  const [category, setCategory] = useState<ProductCategory | 'all'>('all');
  const [inStockOnly, setInStockOnly] = useState(false);
  const [openId, setOpenId] = useState<string | null>(null);
  const lastTrigger = useRef<HTMLElement | null>(null);

  useEffect(() => {
    document.documentElement.lang = lang;
  }, [lang]);

  const visible = useMemo(() => {
    const q = query.trim().toLowerCase();
    return listings
      .filter((p) => category === 'all' || p.category === category)
      .filter((p) => !inStockOnly || p.availability !== 'out_of_stock')
      .filter((p) => {
        if (!q) return true;
        return [p.name, p.nameSo, p.nameAm, p.sku, p.origin, categoryLabels[p.category]]
          .filter(Boolean)
          .join(' ')
          .toLowerCase()
          .includes(q);
      })
      .sort((a, b) => {
        const rank = AVAILABILITY_RANK[a.availability] - AVAILABILITY_RANK[b.availability];
        return rank !== 0 ? rank : a.name.localeCompare(b.name);
      });
  }, [listings, query, category, inStockOnly, categoryLabels]);

  const opened = openId ? listings.find((p) => p.id === openId) ?? null : null;
  const hasFilters = query !== '' || category !== 'all' || inStockOnly;

  const openProduct = (product: PublicListing, trigger: HTMLElement) => {
    lastTrigger.current = trigger;
    setOpenId(product.id);
  };
  const closeProduct = () => {
    setOpenId(null);
    lastTrigger.current?.focus();
  };
  const clearFilters = () => {
    setQuery('');
    setCategory('all');
    setInStockOnly(false);
  };

  const stepIcons = [MessageCircle, Handshake, PackageCheck];

  return (
    <div className="min-h-screen bg-canvas text-ink">
      <a
        href="#products"
        className="sr-only focus:not-sr-only focus:fixed focus:top-3 focus:left-3 focus:z-[60] focus:rounded-[10px] focus:bg-accent focus:px-4 focus:py-2 text-on-accent font-semibold"
      >
        {t.skip}
      </a>

      {/* Hero: full-bleed photo, header floats on top of it */}
      <section className="relative isolate">
        <img src={HERO_WAREHOUSE_IMAGE} alt="" className="absolute inset-0 -z-10 h-full w-full object-cover" />
        <div className="absolute inset-0 -z-10 bg-gradient-to-b from-[#06141B]/80 via-[#06141B]/45 to-[#06141B]/85" />

        <header className="mx-auto flex h-16 max-w-6xl items-center justify-between gap-3 px-4 sm:px-6">
          <div className="flex min-w-0 items-center gap-2.5 text-white">
            <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-[10px] bg-accent text-on-accent font-display text-sm font-bold">
              TL
            </div>
            <span className="font-display text-[17px] font-bold tracking-tight">TradeLink</span>
          </div>
          <div className="flex items-center gap-2">
            <div role="group" aria-label={t.language} className="flex rounded-[10px] border border-white/30 p-0.5">
              {LANGS.map((l) => (
                <button
                  key={l.code}
                  type="button"
                  onClick={() => onChangeLang(l.code)}
                  aria-pressed={lang === l.code}
                  className={`h-8 min-w-9 rounded-[8px] px-2 text-[13px] font-semibold transition-colors ${
                    lang === l.code ? 'bg-white text-[#06141B]' : 'text-white/80 hover:text-white'
                  }`}
                >
                  {l.label}
                </button>
              ))}
            </div>
            <button
              type="button"
              onClick={onToggleTheme}
              aria-label={t.theme}
              className="flex h-9 w-9 items-center justify-center rounded-[10px] border border-white/30 text-white/80 hover:text-white"
            >
              {theme === 'dark' ? <Sun className="h-4 w-4" aria-hidden="true" /> : <Moon className="h-4 w-4" aria-hidden="true" />}
            </button>
            <a href={staffHref} className="hidden text-[13px] font-medium text-white/80 hover:text-white sm:block">
              {t.staffSignIn}
            </a>
          </div>
        </header>

        <div className="mx-auto max-w-6xl px-4 pb-16 pt-10 sm:px-6 sm:pb-24 sm:pt-16">
          <h1 className="max-w-[16ch] text-[38px] font-bold leading-[1.05] tracking-tight text-white sm:text-[56px]">
            {t.heroTitle}
          </h1>
          <p className="mt-3 text-[17px] text-white/85">{t.heroBody}</p>

          <div className="relative mt-7 max-w-xl">
            <label htmlFor="market-search" className="sr-only">
              {t.searchLabel}
            </label>
            <Search className="pointer-events-none absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-[#4A5C6A]" aria-hidden="true" />
            <input
              id="market-search"
              type="search"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder={t.searchPlaceholder}
              className="h-14 w-full rounded-full border-0 bg-white pl-12 pr-5 text-[16px] text-[#06141B] shadow-lg placeholder:text-[#4A5C6A]"
            />
          </div>
        </div>
      </section>

      <main>
        <section id="products" className="mx-auto max-w-6xl scroll-mt-4 px-4 py-8 sm:px-6">
          {/* Category tiles: photos, not words */}
          <div
            role="group"
            aria-label={t.allCategories}
            className="-mx-4 flex gap-4 overflow-x-auto px-4 pb-2 sm:mx-0 sm:px-0"
          >
            {(['all', ...FOOD_CATEGORIES] as const).map((c) => {
              const active = category === c;
              const label = c === 'all' ? t.allCategories : categoryLabels[c];
              return (
                <button
                  key={c}
                  type="button"
                  onClick={() => setCategory(c)}
                  aria-pressed={active}
                  className="group flex w-[76px] shrink-0 flex-col items-center gap-2"
                >
                  <span
                    className={`h-16 w-16 overflow-hidden rounded-full ring-offset-2 ring-offset-[var(--bg-canvas)] transition-shadow ${
                      active ? 'ring-[3px] ring-[var(--accent-primary)]' : 'ring-1 ring-[var(--border-hairline)]'
                    }`}
                  >
                    <img
                      src={c === 'all' ? HERO_WAREHOUSE_IMAGE : CATEGORY_IMAGES[c]}
                      alt=""
                      className="h-full w-full object-cover"
                    />
                  </span>
                  <span className={`line-clamp-2 text-center text-[12px] leading-tight ${active ? 'font-bold' : 'font-medium text-muted'}`}>
                    {label}
                  </span>
                </button>
              );
            })}
          </div>

          <div className="mt-5 flex items-center justify-between gap-3">
            <p className="text-[14px] text-muted" aria-live="polite">
              {loading || loadError ? '' : t.resultCount(visible.length)}
            </p>
            <label className="flex cursor-pointer items-center gap-2 text-[14px] font-medium">
              <input
                type="checkbox"
                checked={inStockOnly}
                onChange={(e) => setInStockOnly(e.target.checked)}
                className="h-4 w-4 accent-[var(--accent-primary)]"
              />
              {t.inStockOnly}
            </label>
          </div>

          {loading ? (
            <ul className="mt-4 grid gap-5 sm:grid-cols-2 lg:grid-cols-3" aria-label={t.loading}>
              {[0, 1, 2].map((i) => (
                <li key={i} className="aspect-[4/5] animate-pulse rounded-[20px] bg-subtle" />
              ))}
            </ul>
          ) : loadError ? (
            <p role="alert" className="mt-6 rounded-[12px] border border-hairline p-4 text-[14px]">
              {t.loadError}
            </p>
          ) : visible.length === 0 ? (
            <div className="mt-6 flex flex-col items-center rounded-[20px] border border-dashed border-hairline px-6 py-14 text-center">
              <PackageSearch className="h-9 w-9 text-muted" aria-hidden="true" />
              <h2 className="mt-3 text-[18px] font-bold">{t.noResultsTitle}</h2>
              {hasFilters && (
                <button
                  type="button"
                  onClick={clearFilters}
                  className="mt-4 h-10 rounded-full bg-accent px-5 text-[14px] font-semibold text-on-accent"
                >
                  {t.clearFilters}
                </button>
              )}
            </div>
          ) : (
            <ul className="mt-4 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
              {visible.map((product) => {
                const agent = resolveAgent(product, agents, settings, t);
                const title = getProductTitle(product, lang);
                const updated = formatStockUpdate(product.stockUpdatedAt, t.locale);
                const faded = product.availability === 'out_of_stock';
                return (
                  <li key={product.id}>
                    <article className="overflow-hidden rounded-[20px] border border-hairline bg-surface shadow-saas">
                      <button
                        type="button"
                        onClick={(e) => openProduct(product, e.currentTarget)}
                        aria-label={`${title}. ${t.viewDetails}`}
                        className="relative block aspect-[4/3] w-full overflow-hidden text-left"
                      >
                        <img
                          src={resolveProductImage(product.photoUrl, product.category)}
                          alt=""
                          loading="lazy"
                          className={`h-full w-full object-cover ${faded ? 'grayscale' : ''}`}
                        />
                        <span className="absolute inset-0 bg-gradient-to-t from-[#06141B]/85 via-[#06141B]/10 to-transparent" />
                        <span className="absolute left-3 top-3">
                          <AvailabilityBadge status={product.availability} t={t} />
                        </span>
                        <span className="absolute inset-x-4 bottom-3 block">
                          <span className="block font-display text-[20px] font-bold leading-tight text-white">{title}</span>
                          <span className="mt-0.5 block text-[13px] text-white/80">{product.unit}</span>
                        </span>
                      </button>

                      <div className="space-y-3 p-4">
                        <div className="flex items-center justify-between gap-3 text-[13px]">
                          <span className="flex min-w-0 items-center gap-1.5 text-muted">
                            <MapPin className="h-4 w-4 shrink-0" aria-hidden="true" />
                            <span className="sr-only">{t.collectFrom}: </span>
                            <span className="truncate">{collectionOf(product, settings)}</span>
                          </span>
                          <span className="shrink-0 font-bold">{t.negotiable}</span>
                        </div>
                        <div className="flex items-center justify-between gap-3 text-[13px] text-muted">
                          <span className="flex items-center gap-1.5">
                            <Clock className="h-4 w-4" aria-hidden="true" />
                            <span className="sr-only">{t.stockUpdated}: </span>
                            {updated ?? t.notUpdated}
                          </span>
                          <span className="flex items-center gap-1.5">
                            <UserRound className="h-4 w-4" aria-hidden="true" />
                            <span className="font-semibold text-ink">{agent.code}</span>
                          </span>
                        </div>
                        <AgentContact
                          agent={agent}
                          message={t.message(agent.code, title, product.sku || product.id)}
                          t={t}
                          variant="card"
                        />
                      </div>
                    </article>
                  </li>
                );
              })}
            </ul>
          )}
        </section>

        {/* Three steps, icons first */}
        <section className="border-t border-hairline bg-subtle">
          <ol className="mx-auto grid max-w-6xl gap-6 px-4 py-10 sm:grid-cols-3 sm:px-6">
            {t.steps.map((step, i) => {
              const Icon = stepIcons[i];
              return (
                <li key={step.title} className="flex items-center gap-4">
                  <span className="flex h-14 w-14 shrink-0 items-center justify-center rounded-full bg-accent text-on-accent">
                    <Icon className="h-6 w-6" aria-hidden="true" />
                  </span>
                  <span className="text-[16px] font-bold leading-snug">{step.title}</span>
                </li>
              );
            })}
          </ol>
        </section>
      </main>

      <footer className="border-t border-hairline">
        <div className="mx-auto flex max-w-6xl items-center justify-between gap-3 px-4 py-5 text-[13px] text-muted sm:px-6">
          <p>{t.footerNote}</p>
          <a href={staffHref} className="shrink-0 font-medium hover:text-ink sm:hidden">
            {t.staffSignIn}
          </a>
        </div>
      </footer>

      <AnimatePresence>
        {opened && (
          <ProductDialog
            key={opened.id}
            product={opened}
            agent={resolveAgent(opened, agents, settings, t)}
            lang={lang}
            t={t}
            collection={collectionOf(opened, settings)}
            onClose={closeProduct}
          />
        )}
      </AnimatePresence>
    </div>
  );
}

function Fact({
  icon: Icon,
  label,
  value,
  warn,
}: {
  icon: typeof MapPin;
  label: string;
  value: string;
  warn?: boolean;
}) {
  return (
    <div className="rounded-[14px] bg-subtle p-3">
      <Icon className="h-5 w-5 text-muted" aria-hidden="true" />
      <dt className="mt-2 text-[12px] text-muted">{label}</dt>
      <dd className="mt-0.5 text-[14px] font-bold leading-snug" style={warn ? { color: 'var(--status-danger-fg)' } : undefined}>
        {value}
      </dd>
    </div>
  );
}

function ProductDialog({
  product,
  agent,
  lang,
  t,
  collection,
  onClose,
}: {
  product: PublicListing;
  agent: Agent;
  lang: Language;
  t: MarketplaceStrings;
  collection: string;
  onClose: () => void;
}) {
  const panelRef = useRef<HTMLDivElement>(null);
  const closeRef = useRef<HTMLButtonElement>(null);
  const title = getProductTitle(product, lang);
  const updated = formatStockUpdate(product.stockUpdatedAt, t.locale);
  const expiry = product.expiryDate ? new Date(product.expiryDate) : null;
  const expiryValid = expiry !== null && !Number.isNaN(expiry.getTime());
  const expired = expiryValid && expiry.getTime() < Date.now();
  const expiryText = expiryValid
    ? new Intl.DateTimeFormat(t.locale, { dateStyle: 'medium' }).format(expiry)
    : null;

  useEffect(() => {
    closeRef.current?.focus();
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose();
        return;
      }
      if (e.key !== 'Tab' || !panelRef.current) return;
      const focusable = panelRef.current.querySelectorAll<HTMLElement>('a[href], button:not([disabled])');
      if (focusable.length === 0) return;
      const first = focusable[0];
      const last = focusable[focusable.length - 1];
      if (e.shiftKey && document.activeElement === first) {
        e.preventDefault();
        last.focus();
      } else if (!e.shiftKey && document.activeElement === last) {
        e.preventDefault();
        first.focus();
      }
    };
    document.addEventListener('keydown', onKeyDown);
    return () => {
      document.removeEventListener('keydown', onKeyDown);
      document.body.style.overflow = previousOverflow;
    };
  }, [onClose]);

  return (
    <motion.div
      className="fixed inset-0 z-50 flex items-end justify-center sm:items-center sm:p-6"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.15 }}
    >
      <div className="absolute inset-0 bg-backdrop" onClick={onClose} aria-hidden="true" />
      <motion.div
        ref={panelRef}
        role="dialog"
        aria-modal="true"
        aria-label={title}
        className="relative flex max-h-[94vh] w-full max-w-xl flex-col overflow-hidden rounded-t-[24px] bg-surface sm:rounded-[24px]"
        initial={{ y: 24 }}
        animate={{ y: 0 }}
        exit={{ y: 24 }}
        transition={{ duration: 0.2, ease: [0.16, 1, 0.3, 1] }}
      >
        <div className="overflow-y-auto">
          <div className="relative">
            <img
              src={resolveProductImage(product.photoUrl, product.category)}
              alt=""
              className="aspect-[4/3] w-full object-cover"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-[#06141B]/85 via-transparent to-[#06141B]/30" />
            <button
              ref={closeRef}
              type="button"
              onClick={onClose}
              aria-label={t.close}
              className="absolute right-3 top-3 flex h-10 w-10 items-center justify-center rounded-full bg-surface text-ink shadow-saas"
            >
              <X className="h-5 w-5" aria-hidden="true" />
            </button>
            <div className="absolute inset-x-5 bottom-4">
              <AvailabilityBadge status={product.availability} t={t} />
              <h2 className="mt-2 font-display text-[26px] font-bold leading-tight text-white">{title}</h2>
            </div>
          </div>

          <dl className="grid grid-cols-2 gap-3 p-5">
            <Fact icon={MapPin} label={t.collectFrom} value={collection} />
            <Fact icon={Clock} label={t.stockUpdated} value={updated ?? t.notUpdated} />
            <Fact icon={Boxes} label={t.quantity} value={`${product.stockQty.toLocaleString(t.locale)} ${product.unit}`} />
            <Fact icon={Handshake} label={t.price} value={t.negotiable} />
            {expiryText && (
              <Fact
                icon={Clock}
                label={t.bestBefore}
                value={expired ? `${expiryText} — ${t.pastDate}` : expiryText}
                warn={expired}
              />
            )}
            {product.origin && <Fact icon={PackageCheck} label={t.origin} value={product.origin} />}
          </dl>
        </div>

        <div className="space-y-3 border-t border-hairline bg-surface p-5">
          <div className="flex items-center justify-between gap-3">
            <h3 className="text-[16px] font-bold">{t.contactTitle}</h3>
            <span className="flex items-center gap-1.5 text-[13px] font-semibold">
              <UserRound className="h-4 w-4 text-muted" aria-hidden="true" />
              {agent.code}
              <span className="font-normal text-muted">· {agent.languages.map((l) => t.languageNames[l]).join(', ')}</span>
            </span>
          </div>
          <AgentContact
            agent={agent}
            message={t.message(agent.code, title, product.sku || product.id)}
            t={t}
            variant="panel"
          />
        </div>
      </motion.div>
    </motion.div>
  );
}
