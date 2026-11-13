import { MessageCircle, Phone, Send } from 'lucide-react';
import { buildCallUrl, buildTelegramUrl, buildWhatsAppUrl } from '../../lib/contact';
import type { MarketplaceStrings } from '../../i18n/marketplace';
import type { Agent } from '../../types/tradelink';

interface Props {
  agent: Agent;
  message: string;
  t: MarketplaceStrings;
  /** "card" is a compact row for listings; "panel" is the full-width stack used in product details. */
  variant: 'card' | 'panel';
}

const base =
  'inline-flex items-center justify-center gap-2 rounded-[10px] font-semibold text-white transition-colors focus-visible:outline-offset-2';
const whatsappColor = 'bg-[#11833F] hover:bg-[#0E6E35]';
const telegramColor = 'bg-[#1578A8] hover:bg-[#106590]';
const callColor = 'bg-[var(--brand-slate)] hover:bg-[var(--brand-navy)]';

export function AgentContact({ agent, message, t, variant }: Props) {
  const whatsappUrl = buildWhatsAppUrl(agent, message);
  const telegramUrl = buildTelegramUrl(agent, message);
  const callUrl = buildCallUrl(agent);
  const isCard = variant === 'card';
  const size = isCard ? 'h-10 px-3 text-[13px]' : 'h-12 px-4 text-[15px] w-full';

  return (
    <div className={isCard ? 'flex gap-2' : 'flex flex-col gap-2.5'}>
      <a
        href={whatsappUrl}
        target="_blank"
        rel="noopener noreferrer"
        className={`${base} ${whatsappColor} ${size} ${isCard ? 'flex-1 min-w-0' : ''}`}
        aria-label={`${t.whatsapp} — ${agent.code}`}
      >
        <MessageCircle className="w-[18px] h-[18px] shrink-0" aria-hidden="true" />
        <span className="truncate">{isCard ? 'WhatsApp' : t.whatsapp}</span>
      </a>

      {telegramUrl && (
        <a
          href={telegramUrl}
          target="_blank"
          rel="noopener noreferrer"
          className={`${base} ${telegramColor} ${size} ${isCard ? 'flex-1 min-w-0' : ''}`}
          aria-label={`${t.telegram} — ${agent.code}`}
        >
          <Send className="w-[18px] h-[18px] shrink-0" aria-hidden="true" />
          <span className="truncate">{isCard ? 'Telegram' : t.telegram}</span>
        </a>
      )}

      <a
        href={callUrl}
        className={`${base} ${callColor} ${size} ${isCard ? 'w-11 px-0 shrink-0' : ''}`}
        aria-label={`${t.callAgent} — ${agent.code}`}
      >
        <Phone className="w-[18px] h-[18px] shrink-0" aria-hidden="true" />
        {!isCard && <span>{t.callAgent}</span>}
      </a>
    </div>
  );
}
