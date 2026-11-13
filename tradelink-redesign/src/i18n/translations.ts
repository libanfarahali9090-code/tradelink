import type { Language, OrderStatus, ProductCategory } from '../types/tradelink';

interface TranslationBundle {
  brandTag: string;
  groups: {
    main: string;
    operations: string;
    finance: string;
    management: string;
  };
  nav: {
    overview: string;
    products: string;
    orders: string;
    suppliers: string;
    buyers: string;
    inventory: string;
    warehouse: string;
    stock_movements: string;
    deliveries: string;
    payments: string;
    commissions: string;
    transactions: string;
    financial_reports: string;
    analytics: string;
    team_members: string;
    activity_logs: string;
    settings: string;
  };
  topbar: {
    searchPlaceholder: string;
    commandPalette: string;
    searchShortcut: string;
    notifications: string;
    themeLight: string;
    themeDark: string;
    signIn: string;
    signOut: string;
    sandboxMode: string;
    liveSynced: string;
    rolePreview: string;
    noAlerts: string;
  };
  command: {
    placeholder: string;
    quickActions: string;
    navigateTo: string;
    records: string;
    noMatches: string;
    toggleTheme: string;
    newOrder: string;
    addProduct: string;
    openSettings: string;
    hintNavigate: string;
    hintSelect: string;
    hintClose: string;
  };
  dashboard: {
    greeting: string;
    subtitle: string;
    totalSales: string;
    activeOrders: string;
    pendingPayments: string;
    inventoryItems: string;
    inventoryValue: string;
    salesOverview: string;
    daily: string;
    weekly: string;
    monthly: string;
    yearly: string;
    recentOrders: string;
    warehouseStock: string;
    recentActivity: string;
    lowStock: string;
    healthyStock: string;
    viewAll: string;
    newOrder: string;
    addProduct: string;
    vsPrevious: string;
  };
  form: {
    stepOf: string;
    next: string;
    back: string;
    requiredField: string;
    invalidNumber: string;
    insufficientStock: string;
    invalidRate: string;
  };
  categories: Record<ProductCategory, string>;
  statuses: Record<OrderStatus, string>;
  common: {
    search: string;
    all: string;
    save: string;
    cancel: string;
    delete: string;
    edit: string;
    create: string;
    close: string;
    exportCsv: string;
    printInvoice: string;
    actions: string;
    status: string;
    date: string;
    amount: string;
    quantity: string;
    noResults: string;
    loading: string;
    confirmDelete: string;
    units: string;
    retry: string;
    errorTitle: string;
    showing: string;
    singleWarehouseNotice: string;
    ownerCommissionNotice: string;
  };
}

export const TRANSLATIONS: Record<Language, TranslationBundle> = {
  en: {
    brandTag: 'Malka Jabdu Hub',
    groups: {
      main: 'MAIN',
      operations: 'OPERATIONS',
      finance: 'FINANCE',
      management: 'MANAGEMENT',
    },
    nav: {
      overview: 'Overview',
      products: 'Products',
      orders: 'Orders',
      suppliers: 'Suppliers',
      buyers: 'Buyers',
      inventory: 'Inventory',
      warehouse: 'Warehouse',
      stock_movements: 'Stock Movements',
      deliveries: 'Deliveries',
      payments: 'Payments',
      commissions: 'Commissions',
      transactions: 'Transactions',
      financial_reports: 'Financial Reports',
      analytics: 'Analytics',
      team_members: 'Team Members',
      activity_logs: 'Activity Logs',
      settings: 'Settings',
    },
    topbar: {
      searchPlaceholder: 'Search orders, products, buyers, suppliers...',
      commandPalette: 'Quick search & commands...',
      searchShortcut: '⌘K',
      notifications: 'Notifications',
      themeLight: 'Light mode',
      themeDark: 'Dark mode',
      signIn: 'Sign in with Google',
      signOut: 'Sign out',
      sandboxMode: 'Preview workspace — sign in to sync live',
      liveSynced: 'Live Firestore synced',
      rolePreview: 'Role View',
      noAlerts: 'All stock and orders are operating normally.',
    },
    command: {
      placeholder: 'Type a command or search orders, products, buyers...',
      quickActions: 'Quick actions',
      navigateTo: 'Pages',
      records: 'Matching records',
      noMatches: 'No matching commands or records found.',
      toggleTheme: 'Toggle light / dark theme',
      newOrder: 'Create new B2B order',
      addProduct: 'Add food product to catalog',
      openSettings: 'Open platform settings',
      hintNavigate: 'Navigate',
      hintSelect: 'Open',
      hintClose: 'Close',
    },
    dashboard: {
      greeting: 'Good morning, Liban',
      subtitle: "Here's what's happening across your food trade today.",
      totalSales: 'Total Sales',
      activeOrders: 'Active Orders',
      pendingPayments: 'Pending Payments',
      inventoryItems: 'Inventory Items',
      inventoryValue: 'Inventory Value',
      salesOverview: 'Sales overview',
      daily: 'Daily',
      weekly: 'Weekly',
      monthly: 'Monthly',
      yearly: 'Yearly',
      recentOrders: 'Recent orders',
      warehouseStock: 'Warehouse stock',
      recentActivity: 'Recent activity',
      lowStock: 'Low stock',
      healthyStock: 'In stock',
      viewAll: 'View all',
      newOrder: 'Create order',
      addProduct: 'Add product',
      vsPrevious: 'vs previous period',
    },
    form: {
      stepOf: 'Step',
      next: 'Continue',
      back: 'Back',
      requiredField: 'This field is required.',
      invalidNumber: 'Enter a valid positive number.',
      insufficientStock: 'Requested quantity exceeds available warehouse stock.',
      invalidRate: 'Commission rate must be between 0% and 50%.',
    },
    categories: {
      rice: 'Rice',
      flour: 'Flour',
      sugar: 'Sugar',
      cooking_oil: 'Cooking Oil',
      dates: 'Dates',
      pasta: 'Pasta',
      beans: 'Beans',
      other_food: 'Other Food Products',
    },
    statuses: {
      pending: 'Pending',
      confirmed: 'Confirmed',
      processing: 'Processing',
      ready_for_dispatch: 'Ready for Dispatch',
      delivered: 'Delivered',
      cancelled: 'Cancelled',
    },
    common: {
      search: 'Search...',
      all: 'All',
      save: 'Save changes',
      cancel: 'Cancel',
      delete: 'Delete',
      edit: 'Edit',
      create: 'Create',
      close: 'Close',
      exportCsv: 'Export CSV',
      printInvoice: 'Print invoice',
      actions: 'Actions',
      status: 'Status',
      date: 'Date',
      amount: 'Amount',
      quantity: 'Quantity',
      noResults: 'No matching records found.',
      loading: 'Loading data...',
      confirmDelete: 'Are you sure you want to delete this record? This action cannot be undone.',
      units: 'units',
      retry: 'Retry',
      errorTitle: 'Something went wrong',
      showing: 'Showing',
      singleWarehouseNotice: 'TradeLink Central Warehouse — Single Warehouse Architecture (Malka Jabdu)',
      ownerCommissionNotice: 'Platform commissions are paid exclusively by the TradeLink Owner — buyers and suppliers are never charged.',
    },
  },
  so: {
    brandTag: 'Xarunta Malka Jabdu',
    groups: {
      main: 'UGU MUHIIMSAN',
      operations: 'HAWLGALKA',
      finance: 'MAALIYADDA',
      management: 'MAAMULKA',
    },
    nav: {
      overview: 'Guudmar',
      products: 'Alaabta',
      orders: 'Dalabaadka',
      suppliers: 'Keenayaasha',
      buyers: 'Iibsadayaasha',
      inventory: 'Kaydka',
      warehouse: 'Bakhaarka',
      stock_movements: 'Dhaqdhaqaaqa Kaydka',
      deliveries: 'Gaarsiinta',
      payments: 'Lacag-bixinta',
      commissions: 'Koomishanka',
      transactions: 'Xisaabaadka',
      financial_reports: 'Warbixinaha Maaliyadda',
      analytics: 'Falanqaynta',
      team_members: 'Shaqaalaha',
      activity_logs: 'Diiwaanka Hawlaha',
      settings: 'Dejinta',
    },
    topbar: {
      searchPlaceholder: 'Raadi dalabaad, alaab, iibsadayaal...',
      commandPalette: 'Raadin degdeg ah iyo amarro...',
      searchShortcut: '⌘K',
      notifications: 'Ogeysiisyada',
      themeLight: 'Habka Iftiinka',
      themeDark: 'Habka Madow',
      signIn: 'Ku soo gal Google',
      signOut: 'Ka bax',
      sandboxMode: 'Habka tijaabada — soo gal si aad toos ugu kaydiso',
      liveSynced: 'Toos ayuu u xiran yahay',
      rolePreview: 'Aragtida Doorka',
      noAlerts: 'Kaydka iyo dalabaadku si caadi ah ayay u shaqeynayaan.',
    },
    command: {
      placeholder: 'Qor amar ama raadi dalab, alaab, iibsade...',
      quickActions: 'Ficillo degdeg ah',
      navigateTo: 'Bogagga',
      records: 'Diiwaannada la helay',
      noMatches: 'Wax amar ama diiwaan ah lama helin.',
      toggleTheme: 'Beddel habka iftiinka / madowga',
      newOrder: 'Abuur dalab B2B cusub',
      addProduct: 'Ku dar alaab cunto cusub',
      openSettings: 'Fur dejinta madasha',
      hintNavigate: 'Dooro',
      hintSelect: 'Fur',
      hintClose: 'Xir',
    },
    dashboard: {
      greeting: 'Subax wanaagsan, Liban',
      subtitle: 'Waa kan waxa maanta ka socda ganacsigaaga cuntada.',
      totalSales: 'Wadarta Iibka',
      activeOrders: 'Dalabaadka Firfircoon',
      pendingPayments: 'Lacagaha Maqan',
      inventoryItems: 'Alaabta Kaydka',
      inventoryValue: 'Qiimaha Kaydka',
      salesOverview: 'Guudmarka Iibka',
      daily: 'Maalinle',
      weekly: 'Toddobaadle',
      monthly: 'Bille',
      yearly: 'Sanadle',
      recentOrders: 'Dalabaadkii u dambeeyay',
      warehouseStock: 'Kaydka Bakhaarka',
      recentActivity: 'Dhaqdhaqaaqii u dambeeyay',
      lowStock: 'Kayd yar',
      healthyStock: 'Kayd ku filan',
      viewAll: 'Eeg dhammaan',
      newOrder: 'Dalab cusub',
      addProduct: 'Ku dar alaab',
      vsPrevious: 'marka loo eego hore',
    },
    form: {
      stepOf: 'Tallaabo',
      next: 'Sii wad',
      back: 'Dib u noqo',
      requiredField: 'Meelahan waa lagama maarmaan.',
      invalidNumber: 'Geli tiro sax ah.',
      insufficientStock: 'Tirada la dalbaday waxay ka badan tahay kaydka bakhaarka.',
      invalidRate: 'Heerka koomishanku waa inuu u dhexeeyaa 0% iyo 50%.',
    },
    categories: {
      rice: 'Bariis',
      flour: 'Bur',
      sugar: 'Sonkor',
      cooking_oil: 'Saliid Cunto',
      dates: 'Timir',
      pasta: 'Baasto',
      beans: 'Digir & Misir',
      other_food: 'Cuntooyin Kale',
    },
    statuses: {
      pending: 'Sugitaan',
      confirmed: 'La Xaqiijiyay',
      processing: 'Diyaarin',
      ready_for_dispatch: 'Diyaar u ah Raridda',
      delivered: 'La Gaarsiiyay',
      cancelled: 'La Joojiyay',
    },
    common: {
      search: 'Raadi...',
      all: 'Dhammaan',
      save: 'Kaydi isbeddelka',
      cancel: 'Jooji',
      delete: 'Tirtir',
      edit: 'Wax ka beddel',
      create: 'Abuur',
      close: 'Xir',
      exportCsv: 'Soo saar CSV',
      printInvoice: 'Daabac rasiidka',
      actions: 'Ficillo',
      status: 'Xaaladda',
      date: 'Taariikhda',
      amount: 'Qiimaha',
      quantity: 'Tirada',
      noResults: 'Wax diiwaan ah lama helin.',
      loading: 'Waa la soo rarayaa...',
      confirmDelete: 'Ma hubtaa inaad tirtirto diiwaankan? Dib looma celin karo.',
      units: 'xabo',
      retry: 'Isku day mar kale',
      errorTitle: 'Khalad ayaa dhacay',
      showing: 'Muujinaya',
      singleWarehouseNotice: 'Bakhaarka Dhexe ee TradeLink — Nidaam Hal Bakhaar ah (Malka Jabdu)',
      ownerCommissionNotice: 'Koomishanka madasha waxaa bixiya oo keliya Milkiilaha TradeLink — iibsadaha iyo keenaha lagama qaado.',
    },
  },
  am: {
    brandTag: 'የመልካ ጀብዱ ማዕከል',
    groups: {
      main: 'ዋና',
      operations: 'ክንውኖች',
      finance: 'ፋይናንስ',
      management: 'አስተዳደር',
    },
    nav: {
      overview: 'አጠቃላይ እይታ',
      products: 'ምርቶች',
      orders: 'ትዕዛዞች',
      suppliers: 'አቅራቢዎች',
      buyers: 'ገዢዎች',
      inventory: 'ክምችት',
      warehouse: 'መጋዘን',
      stock_movements: 'የክምችት እንቅስቃሴ',
      deliveries: 'አቅርቦትና ጭነት',
      payments: 'ክፍያዎች',
      commissions: 'ኮሚሽን',
      transactions: 'ግብይቶች',
      financial_reports: 'የፋይናንስ ሪፖርቶች',
      analytics: 'ትንተና',
      team_members: 'የቡድን አባላት',
      activity_logs: 'የእንቅስቃሴ መዝገብ',
      settings: 'ቅንብሮች',
    },
    topbar: {
      searchPlaceholder: 'ትዕዛዞችን፣ ምርቶችን፣ ገዢዎችን ይፈልጉ...',
      commandPalette: 'ፈጣን ፍለጋ እና ትዕዛዞች...',
      searchShortcut: '⌘K',
      notifications: 'ማሳወቂያዎች',
      themeLight: 'ብርሃን ገጽታ',
      themeDark: 'ጨለማ ገጽታ',
      signIn: 'በGoogle ይግቡ',
      signOut: 'ውጣ',
      sandboxMode: 'የቅድመ-እይታ ሁኔታ — በቀጥታ ለማስቀመጥ ይግቡ',
      liveSynced: 'ቀጥታ ከFirestore ጋር ተገናኝቷል',
      rolePreview: 'የሚና እይታ',
      noAlerts: 'ክምችት እና ትዕዛዞች በመደበኛ ሁኔታ ላይ ናቸው።',
    },
    command: {
      placeholder: 'ትዕዛዝ ይጻፉ ወይም ምርቶችን፣ ትዕዛዞችን፣ ገዢዎችን ይፈልጉ...',
      quickActions: 'ፈጣን እርምጃዎች',
      navigateTo: 'ገጾች',
      records: 'የተገኙ መዝገቦች',
      noMatches: 'ምንም ተዛማጅ ትዕዛዝ ወይም መዝገብ አልተገኘም።',
      toggleTheme: 'ብርሃን / ጨለማ ገጽታ ቀይር',
      newOrder: 'አዲስ የB2B ትዕዛዝ ፍጠር',
      addProduct: 'አዲስ የምግብ ምርት ጨምር',
      openSettings: 'የመድረክ ቅንብሮችን ክፈት',
      hintNavigate: 'ምረጥ',
      hintSelect: 'ክፈት',
      hintClose: 'ዝጋ',
    },
    dashboard: {
      greeting: 'እንደምን አደሩ ሊባን',
      subtitle: 'ዛሬ በምግብ ንግድዎ ውስጥ የሚከናወነው ሁኔታ ይህ ነው።',
      totalSales: 'ጠቅላላ ሽያጭ',
      activeOrders: 'ንቁ ትዕዛዞች',
      pendingPayments: 'ቀሪ ክፍያዎች',
      inventoryItems: 'የክምችት ዕቃዎች',
      inventoryValue: 'የክምችት ዋጋ',
      salesOverview: 'የሽያጭ አጠቃላይ እይታ',
      daily: 'ዕለታዊ',
      weekly: 'ሳምንታዊ',
      monthly: 'ወርሃዊ',
      yearly: 'ዓመታዊ',
      recentOrders: 'የቅርብ ጊዜ ትዕዛዞች',
      warehouseStock: 'የመጋዘን ክምችት',
      recentActivity: 'የቅርብ ጊዜ እንቅስቃሴ',
      lowStock: 'አነስተኛ ክምችት',
      healthyStock: 'በቂ ክምችት',
      viewAll: 'ሁሉንም ይመልከቱ',
      newOrder: 'ትዕዛዝ ፍጠር',
      addProduct: 'ምርት ጨምር',
      vsPrevious: 'ካለፈው ጊዜ ጋር ሲነጻጸር',
    },
    form: {
      stepOf: 'ደረጃ',
      next: 'ቀጥል',
      back: 'ተመለስ',
      requiredField: 'ይህ መስክ አስፈላጊ ነው።',
      invalidNumber: 'ትክክለኛ አዎንታዊ ቁጥር ያስገቡ።',
      insufficientStock: 'የተጠየቀው ብዛት ካለው የመጋዘን ክምችት ይበልጣል።',
      invalidRate: 'የኮሚሽን መጠን ከ0% እስከ 50% መካከል መሆን አለበት።',
    },
    categories: {
      rice: 'ሩዝ',
      flour: 'ዱቄት',
      sugar: 'ስኳር',
      cooking_oil: 'የምግብ ዘይት',
      dates: 'ቴምር',
      pasta: 'ፓስታ',
      beans: 'ባቄላና ምስር',
      other_food: 'ሌሎች የምግብ ምርቶች',
    },
    statuses: {
      pending: 'በመጠባበቅ ላይ',
      confirmed: 'ተረጋግጧል',
      processing: 'በዝግጅት ላይ',
      ready_for_dispatch: 'ለመጫን ዝግጁ',
      delivered: 'ደርሷል',
      cancelled: 'ተሰርዟል',
    },
    common: {
      search: 'ፈልግ...',
      all: 'ሁሉም',
      save: 'ለውጦችን አስቀምጥ',
      cancel: 'ሰርዝ',
      delete: 'አጥፋ',
      edit: 'አስተካክል',
      create: 'ፍጠር',
      close: 'ዝጋ',
      exportCsv: 'CSV አውርድ',
      printInvoice: 'ደረሰኝ አትም',
      actions: 'ድርጊቶች',
      status: 'ሁኔታ',
      date: 'ቀን',
      amount: 'መጠን',
      quantity: 'ብዛት',
      noResults: 'ምንም ተዛማጅ መዝገብ አልተገኘም።',
      loading: 'በመጫን ላይ...',
      confirmDelete: 'ይህን መዝገብ መሰረዝ ይፈልጋሉ? ይህ እርምጃ ሊመለስ አይችልም።',
      units: 'ክፍሎች',
      retry: 'እንደገና ሞክር',
      errorTitle: 'ችግር ተፈጥሯል',
      showing: 'በማሳየት ላይ',
      singleWarehouseNotice: 'የTradeLink ማዕከላዊ መጋዘን — አንድ መጋዘን መዋቅር (መልካ ጀብዱ)',
      ownerCommissionNotice: 'የመድረኩ ኮሚሽን የሚከፈለው በTradeLink ባለቤት ብቻ ነው — ገዢዎች እና አቅራቢዎች አይከፍሉም።',
    },
  },
};

export function getGreeting(lang: Language, firstName: string): string {
  const safeName = firstName.trim() || 'Liban';
  if (lang === 'so') return `Subax wanaagsan, ${safeName}`;
  if (lang === 'am') return `እንደምን አደሩ ${safeName}`;
  return `Good morning, ${safeName}`;
}

export function formatMoney(amount: number, currency: 'ETB' | 'USD' = 'ETB'): string {
  const safe = Number.isFinite(amount) ? amount : 0;
  return `${currency} ${safe.toLocaleString('en-US', {
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  })}`;
}

export function getProductTitle(
  product: { name: string; nameSo?: string; nameAm?: string },
  lang: Language
): string {
  if (lang === 'so' && product.nameSo) return product.nameSo;
  if (lang === 'am' && product.nameAm) return product.nameAm;
  return product.name;
}
