import type { Language, ProductAvailability } from '../types/tradelink';

export interface MarketplaceStrings {
  skip: string;
  staffSignIn: string;
  theme: string;
  language: string;
  heroTitle: string;
  heroBody: string;
  searchLabel: string;
  searchPlaceholder: string;
  allCategories: string;
  inStockOnly: string;
  resultCount: (n: number) => string;
  loading: string;
  loadError: string;
  noResultsTitle: string;
  noResultsBody: string;
  clearFilters: string;
  availability: Record<ProductAvailability, string>;
  price: string;
  negotiable: string;
  agent: string;
  collectFrom: string;
  stockUpdated: string;
  notUpdated: string;
  quantity: string;
  origin: string;
  bestBefore: string;
  pastDate: string;
  sku: string;
  viewDetails: string;
  close: string;
  contactTitle: string;
  contactIntro: string;
  whatsapp: string;
  telegram: string;
  callAgent: string;
  speaks: string;
  languageNames: Record<Language, string>;
  officeLabel: string;
  message: (agent: string, product: string, sku: string) => string;
  howTitle: string;
  steps: { title: string; body: string }[];
  footerNote: string;
  locale: string;
}

export const MARKETPLACE_STRINGS: Record<Language, MarketplaceStrings> = {
  en: {
    skip: 'Skip to products',
    staffSignIn: 'Staff sign in',
    theme: 'Switch light and dark theme',
    language: 'Language',
    heroTitle: 'Wholesale food, straight from the warehouse',
    heroBody:
      'Message an agent. No account needed.',
    searchLabel: 'Search products',
    searchPlaceholder: 'Search rice, flour, oil…',
    allCategories: 'All food',
    inStockOnly: 'In stock only',
    resultCount: (n) => `${n} ${n === 1 ? 'product' : 'products'}`,
    loading: 'Loading products…',
    loadError: 'Products could not be loaded. Check your connection and reload the page.',
    noResultsTitle: 'No products match',
    noResultsBody: 'Try a different word, or show all categories.',
    clearFilters: 'Clear filters',
    availability: { in_stock: 'In stock', low_stock: 'Low stock', out_of_stock: 'Out of stock' },
    price: 'Price',
    negotiable: 'Negotiable',
    agent: 'Agent',
    collectFrom: 'Collect from',
    stockUpdated: 'Stock updated',
    notUpdated: 'Not recorded',
    quantity: 'Quantity on hand',
    origin: 'Origin',
    bestBefore: 'Best before',
    pastDate: 'Date has passed',
    sku: 'Product code',
    viewDetails: 'View details',
    close: 'Close',
    contactTitle: 'Contact the agent',
    contactIntro: 'No account needed.',
    whatsapp: 'Contact on WhatsApp',
    telegram: 'Contact on Telegram',
    callAgent: 'Call agent',
    speaks: 'Speaks',
    languageNames: { en: 'English', so: 'Somali', am: 'Amharic' },
    officeLabel: 'TradeLink office',
    message: (agent, product, sku) =>
      `Hello ${agent}, I found ${product} (${sku}) on TradeLink. Is it available, and what is your price for my quantity?`,
    howTitle: 'How buying works',
    steps: [
      { title: 'Contact the agent', body: 'Use WhatsApp, Telegram or a phone call. No registration.' },
      { title: 'Agree price and quantity', body: 'Prices are negotiable. You settle them with the agent.' },
      { title: 'Collect at the warehouse', body: 'Arrive with your own vehicle. Staff record the collection.' },
    ],
    footerNote:
      'No delivery or online payment. Collect at the warehouse.',
    locale: 'en-GB',
  },
  so: {
    skip: 'U gudub badeecooyinka',
    staffSignIn: 'Gelida shaqaalaha',
    theme: 'Beddel muuqaalka iftiinka iyo mugdiga',
    language: 'Luqad',
    heroTitle: 'Cunto jumlo ah, tooska ah ka bakhaarka',
    heroBody:
      'U fariin wakiil. Koonto looma baahna.',
    searchLabel: 'Raadi badeeco',
    searchPlaceholder: 'Raadi bariis, bur, saliid…',
    allCategories: 'Cunto oo dhan',
    inStockOnly: 'Waa jira oo keliya',
    resultCount: (n) => `${n} badeeco`,
    loading: 'Badeecooyinka waa la soo rarayaa…',
    loadError: 'Badeecooyinka lama soo rari karin. Hubi isku xirka internetka oo dib u cusboonaysii bogga.',
    noResultsTitle: 'Badeeco ku habboon lama helin',
    noResultsBody: 'Isku day erey kale, ama muuji dhammaan qaybaha.',
    clearFilters: 'Tirtir shaandheynta',
    availability: { in_stock: 'Waa jira', low_stock: 'Waa yaraaday', out_of_stock: 'Waa dhammaaday' },
    price: 'Qiimaha',
    negotiable: 'La gorgortami karo',
    agent: 'Wakiil',
    collectFrom: 'Laga qaadanayo',
    stockUpdated: 'Kaydka la cusboonaysiiyay',
    notUpdated: 'Lama diiwaangelin',
    quantity: 'Tirada jirta',
    origin: 'Asalka',
    bestBefore: 'Wuu dhacayaa',
    pastDate: 'Taariikhdu way dhaaftay',
    sku: 'Koodhka badeecada',
    viewDetails: 'Eeg faahfaahinta',
    close: 'Xidh',
    contactTitle: 'La xiriir wakiilka',
    contactIntro: 'Koonto looma baahna.',
    whatsapp: 'La xiriir WhatsApp',
    telegram: 'La xiriir Telegram',
    callAgent: 'Wac wakiilka',
    speaks: 'Wuxuu ku hadlaa',
    languageNames: { en: 'Ingiriisi', so: 'Soomaali', am: 'Amxaari' },
    officeLabel: 'Xafiiska TradeLink',
    message: (agent, product, sku) =>
      `Salaan ${agent}, waxaan ka helay ${product} (${sku}) TradeLink. Ma jirtaa, qiimahana waa imisa tirada aan rabo?`,
    howTitle: 'Sida wax loo iibsado',
    steps: [
      { title: 'La xiriir wakiilka', body: 'Isticmaal WhatsApp, Telegram ama wicitaan. Diiwaangelin looma baahna.' },
      { title: 'Ku heshiiya qiimaha iyo tirada', body: 'Qiimaha waa la gorgortami karaa. Wakiilka ayaad kula heshiisaa.' },
      { title: 'Ka qaad bakhaarka', body: 'Ku kaalay gaarigaaga. Shaqaalaha ayaa diiwaangeliya qaadashada.' },
    ],
    footerNote:
      'Gaarsiin iyo lacag internetka ah ma jirto. Ka qaad bakhaarka.',
    locale: 'so-SO',
  },
  am: {
    skip: 'ወደ ምርቶች ዝለል',
    staffSignIn: 'የሠራተኞች መግቢያ',
    theme: 'ብሩህና ጨለማ ገጽታ ቀይር',
    language: 'ቋንቋ',
    heroTitle: 'የጅምላ ምግብ፣ በቀጥታ ከመጋዘን',
    heroBody:
      'ወኪል ይጻፉ። መመዝገብ አያስፈልግም።',
    searchLabel: 'ምርት ይፈልጉ',
    searchPlaceholder: 'ሩዝ፣ ዱቄት፣ ዘይት ይፈልጉ…',
    allCategories: 'ሁሉም ምግብ',
    inStockOnly: 'የሚገኙ ብቻ',
    resultCount: (n) => `${n} ምርቶች`,
    loading: 'ምርቶች በመጫን ላይ…',
    loadError: 'ምርቶችን መጫን አልተቻለም። ግንኙነትዎን ያረጋግጡና ገጹን እንደገና ይጫኑ።',
    noResultsTitle: 'የሚመሳሰል ምርት አልተገኘም',
    noResultsBody: 'ሌላ ቃል ይሞክሩ ወይም ሁሉንም ምድቦች ያሳዩ።',
    clearFilters: 'ማጣሪያዎችን አጽዳ',
    availability: { in_stock: 'ይገኛል', low_stock: 'ጥቂት ቀርቷል', out_of_stock: 'አልቋል' },
    price: 'ዋጋ',
    negotiable: 'በድርድር',
    agent: 'ወኪል',
    collectFrom: 'የሚወሰድበት',
    stockUpdated: 'ክምችት የተሻሻለው',
    notUpdated: 'አልተመዘገበም',
    quantity: 'ያለው መጠን',
    origin: 'የመጣበት',
    bestBefore: 'የሚያበቃበት',
    pastDate: 'ጊዜው አልፏል',
    sku: 'የምርት ኮድ',
    viewDetails: 'ዝርዝር ይመልከቱ',
    close: 'ዝጋ',
    contactTitle: 'ወኪሉን ያነጋግሩ',
    contactIntro: 'መመዝገብ አያስፈልግም።',
    whatsapp: 'በዋትስአፕ ያነጋግሩ',
    telegram: 'በቴሌግራም ያነጋግሩ',
    callAgent: 'ወኪሉን ይደውሉ',
    speaks: 'የሚናገረው',
    languageNames: { en: 'እንግሊዝኛ', so: 'ሶማሊኛ', am: 'አማርኛ' },
    officeLabel: 'የትሬድሊንክ ቢሮ',
    message: (agent, product, sku) =>
      `ሰላም ${agent}፣ ${product} (${sku}) በትሬድሊንክ ላይ አየሁ። አለ? ለሚያስፈልገኝ መጠን ዋጋው ስንት ነው?`,
    howTitle: 'ግዢ እንዴት ይከናወናል',
    steps: [
      { title: 'ወኪሉን ያነጋግሩ', body: 'በዋትስአፕ፣ በቴሌግራም ወይም በስልክ። መመዝገብ አያስፈልግም።' },
      { title: 'ዋጋና መጠን ይስማሙ', body: 'ዋጋው በድርድር ነው። ከወኪሉ ጋር ይስማማሉ።' },
      { title: 'ከመጋዘን ይውሰዱ', body: 'በራስዎ ተሽከርካሪ ይምጡ። ሠራተኞች ርክክቡን ይመዘግባሉ።' },
    ],
    footerNote:
      'ማድረስ እና በመስመር ላይ ክፍያ የለም። ከመጋዘን ይውሰዱ።',
    locale: 'am-ET',
  },
};
