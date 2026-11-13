import type { Agent, Product, ProductAvailability } from '../types/tradelink';

/** Digits only, country code included, no leading + (the format wa.me expects). */
export function toDigits(phone: string): string {
  return phone.replace(/\D/g, '');
}

export function getAvailability(product: Pick<Product, 'stockQty' | 'minStockQty'>): ProductAvailability {
  if (product.stockQty <= 0) return 'out_of_stock';
  if (product.stockQty <= product.minStockQty) return 'low_stock';
  return 'in_stock';
}

export function buildWhatsAppUrl(agent: Agent, message: string): string {
  const number = toDigits(agent.whatsapp || agent.phone);
  return `https://wa.me/${number}?text=${encodeURIComponent(message)}`;
}

/**
 * Telegram deep links work with a username only. The prefilled text is passed through the
 * share endpoint so the customer lands in a chat with the agent and can send in one tap.
 */
export function buildTelegramUrl(agent: Agent, message: string): string | null {
  if (!agent.telegram) return null;
  const handle = agent.telegram.replace(/^@/, '');
  return `https://t.me/${handle}?text=${encodeURIComponent(message)}`;
}

export function buildCallUrl(agent: Agent): string {
  return `tel:+${toDigits(agent.phone)}`;
}

/** Whole days since the given ISO time, or null when the time is missing or invalid. */
export function daysSince(iso?: string, now: Date = new Date()): number | null {
  if (!iso) return null;
  const then = new Date(iso).getTime();
  if (Number.isNaN(then)) return null;
  return Math.max(0, Math.floor((now.getTime() - then) / 86_400_000));
}

export function formatStockUpdate(iso: string | undefined, locale: string): string | null {
  if (!iso) return null;
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return null;
  return new Intl.DateTimeFormat(locale, { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' }).format(d);
}
