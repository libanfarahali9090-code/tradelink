import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { AnimatePresence, MotionConfig, motion } from 'motion/react';
import { onAuthStateChanged, signInWithPopup, signOut, type User } from 'firebase/auth';
import { LogIn } from 'lucide-react';
import { auth, googleAuthProvider } from './lib/firebase';
import {
  SEED_AGENTS,
  SEED_AUDIT_EVENTS,
  SEED_BUYERS,
  SEED_COMMISSIONS,
  SEED_DELIVERIES,
  SEED_MOVEMENTS,
  SEED_ORDERS,
  SEED_PRODUCTS,
  SEED_SETTINGS,
  SEED_SUPPLIERS,
  SEED_TEAM_MEMBERS,
  SEED_TRANSACTIONS,
} from './data/seedData';
import { TRANSLATIONS } from './i18n/translations';
import { pageTransition } from './lib/motion';
import { toPublicListing } from './lib/listings';
import {
  createOrUpdateOrder,
  deleteProductById,
  ensureUserProfile,
  fetchOrderHistory,
  makeId,
  recordFinancialPayment,
  recordStockMovement,
  saveBuyer,
  saveDelivery,
  savePlatformSettings,
  saveProduct,
  saveSupplier,
  seedInitialWorkspace,
  settleOwnerCommission,
  subscribeCollection,
  subscribePublicAgents,
  subscribePublicListings,
  subscribeSettings,
  transitionOrderStatus,
  updateDeliveryStatus,
  updateTeamMemberRole,
} from './services/firestoreService';
import type {
  Agent,
  AppRoute,
  AuditEvent,
  Buyer,
  CommissionRecord,
  Delivery,
  DeliveryStatus,
  FinancialTransaction,
  Language,
  Order,
  OrderHistoryEvent,
  OrderStatus,
  PaymentMethod,
  PaymentStatus,
  PlatformSettings,
  Product,
  PublicListing,
  StockMovement,
  StockMovementType,
  Supplier,
  ThemeMode,
  ToastMessage,
  UserProfile,
  UserRole,
} from './types/tradelink';
import { PublicMarketplace } from './components/public/PublicMarketplace';
import { Sidebar } from './components/layout/Sidebar';
import { TopNav } from './components/layout/TopNav';
import { CommandPalette } from './components/ui/CommandPalette';
import {
  CardGridSkeleton,
  DashboardSkeleton,
  ErrorBanner,
  TableSkeleton,
  ToastHost,
} from './components/ui/SaasPrimitives';
import { OverviewPage } from './components/pages/OverviewPage';
import { ProductsPage } from './components/pages/ProductsPage';
import { OrdersPage } from './components/pages/OrdersPage';
import { BuyersPage, SuppliersPage } from './components/pages/PartnersPages';
import {
  DeliveriesPage,
  InventoryPage,
  StockMovementsPage,
  WarehousePage,
} from './components/pages/OperationsPages';
import {
  CommissionsPage,
  FinancialReportsPage,
  PaymentsPage,
  TransactionsPage,
} from './components/pages/FinancePages';
import {
  ActivityLogsPage,
  AnalyticsPage,
  SettingsPage,
  TeamMembersPage,
} from './components/pages/ManagementPages';

const CARD_GRID_ROUTES: AppRoute[] = ['products', 'warehouse', 'analytics', 'financial_reports'];

export default function App() {
  const [theme, setTheme] = useState<ThemeMode>(() => {
    try {
      const saved = localStorage.getItem('tradelink_theme');
      return saved === 'dark' ? 'dark' : 'light';
    } catch {
      return 'light';
    }
  });

  const [lang, setLang] = useState<Language>(() => {
    try {
      const saved = localStorage.getItem('tradelink_lang');
      return saved === 'so' || saved === 'am' ? saved : 'en';
    } catch {
      return 'en';
    }
  });

  // The public marketplace is the front door. Staff reach the workspace at #staff.
  const [view, setView] = useState<'market' | 'workspace'>(() =>
    typeof window !== 'undefined' && window.location.hash === '#staff' ? 'workspace' : 'market'
  );

  useEffect(() => {
    const onHashChange = () => {
      if (window.location.hash === '#staff') setView('workspace');
      else if (window.location.hash === '#market') setView('market');
    };
    window.addEventListener('hashchange', onHashChange);
    return () => window.removeEventListener('hashchange', onHashChange);
  }, []);

  const [activeRoute, setActiveRoute] = useState<AppRoute>('overview');
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [mobileNavOpen, setMobileNavOpen] = useState(false);
  const [cmdOpen, setCmdOpen] = useState(false);

  const [authUser, setAuthUser] = useState<User | null>(null);
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null);
  const [previewRole, setPreviewRole] = useState<UserRole>('owner');
  const [isHydrating, setIsHydrating] = useState(false);
  const [syncError, setSyncError] = useState<string | null>(null);

  // Operational state (live Firestore when authenticated as team member; starter sandbox otherwise)
  const [products, setProducts] = useState<Product[]>(SEED_PRODUCTS);
  const [orders, setOrders] = useState<Order[]>(SEED_ORDERS);
  const [suppliers, setSuppliers] = useState<Supplier[]>(SEED_SUPPLIERS);
  const [buyers, setBuyers] = useState<Buyer[]>(SEED_BUYERS);
  const [agents, setAgents] = useState<Agent[]>(SEED_AGENTS);

  // What the public marketplace shows. Visitors read the cost-free `public_listings` and active
  // `agents` collections; they never touch `products`. Set VITE_PUBLIC_DEMO_DATA=true to show the
  // built-in sample catalogue instead (local demos only).
  const useDemoData = import.meta.env.VITE_PUBLIC_DEMO_DATA === 'true';
  const [publicListings, setPublicListings] = useState<PublicListing[]>([]);
  const [publicAgents, setPublicAgents] = useState<Agent[]>([]);
  const [publicLoading, setPublicLoading] = useState(!useDemoData);
  const [publicError, setPublicError] = useState(false);

  useEffect(() => {
    if (useDemoData) return;
    let listingsReady = false;
    let agentsReady = false;
    const markReady = () => {
      if (listingsReady && agentsReady) setPublicLoading(false);
    };
    const fail = () => {
      setPublicError(true);
      setPublicLoading(false);
    };
    const stopListings = subscribePublicListings((items) => {
      setPublicListings(items);
      setPublicError(false);
      listingsReady = true;
      markReady();
    }, fail);
    const stopAgents = subscribePublicAgents((items) => {
      setPublicAgents(items);
      agentsReady = true;
      markReady();
    }, fail);
    return () => {
      stopListings();
      stopAgents();
    };
  }, [useDemoData]);

  const demoListings = useMemo(
    () => products.filter((p) => p.status === 'active').map(toPublicListing),
    [products]
  );
  const [movements, setMovements] = useState<StockMovement[]>(SEED_MOVEMENTS);
  const [deliveries, setDeliveries] = useState<Delivery[]>(SEED_DELIVERIES);
  const [transactions, setTransactions] = useState<FinancialTransaction[]>(SEED_TRANSACTIONS);
  const [commissions, setCommissions] = useState<CommissionRecord[]>(SEED_COMMISSIONS);
  const [auditEvents, setAuditEvents] = useState<AuditEvent[]>(SEED_AUDIT_EVENTS);
  const [teamMembers, setTeamMembers] = useState<UserProfile[]>(SEED_TEAM_MEMBERS);
  const [settings, setSettings] = useState<PlatformSettings>(SEED_SETTINGS);

  const [toasts, setToasts] = useState<ToastMessage[]>([]);
  const [triggerNewOrder, setTriggerNewOrder] = useState(false);
  const [triggerNewProduct, setTriggerNewProduct] = useState(false);
  const [externalSelectedOrder, setExternalSelectedOrder] = useState<Order | null>(null);

  const pushToast = useCallback(
    (kind: ToastMessage['kind'], title: string, detail?: string) => {
      const id = makeId('toast');
      setToasts((prev) => [...prev, { id, kind, title, detail }]);
      window.setTimeout(() => {
        setToasts((prev) => prev.filter((item) => item.id !== id));
      }, 4500);
    },
    []
  );

  // Global Ctrl+K / Cmd+K shortcut for Command Palette
  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault();
        setCmdOpen((prev) => !prev);
      }
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, []);

  // Sync light/dark class on <html>
  useEffect(() => {
    const root = document.documentElement;
    if (theme === 'dark') {
      root.classList.add('dark');
    } else {
      root.classList.remove('dark');
    }
    try {
      localStorage.setItem('tradelink_theme', theme);
    } catch {
      // ignore storage errors
    }
  }, [theme]);

  useEffect(() => {
    try {
      localStorage.setItem('tradelink_lang', lang);
    } catch {
      // ignore storage errors
    }
  }, [lang]);

  // Auth listener & Firestore subscriptions
  useEffect(() => {
    let unsubs: (() => void)[] = [];

    const clearSubs = () => {
      unsubs.forEach((u) => u());
      unsubs = [];
    };

    const unsubAuth = onAuthStateChanged(auth, async (user) => {
      clearSubs();
      setAuthUser(user);
      setSyncError(null);

      if (!user) {
        setUserProfile(null);
        setPreviewRole('owner');
        setIsHydrating(false);
        return;
      }

      setIsHydrating(true);
      try {
        const profile = await ensureUserProfile(user);
        setUserProfile(profile);
        setPreviewRole(profile.role === 'pending' ? 'employee' : profile.role);

        const isTeam =
          profile.active &&
          ['owner', 'admin', 'manager', 'employee'].includes(profile.role);

        if (!isTeam) {
          pushToast(
            'info',
            'Account awaiting role approval',
            'Signed in as pending user. Viewing workspace preview until Owner activates access.'
          );
          return;
        }

        if (profile.role === 'owner' || profile.role === 'admin') {
          await seedInitialWorkspace(user.uid, profile.displayName);
        }

        unsubs.push(subscribeCollection<Product>('products', 'name', 'asc', setProducts));
        unsubs.push(subscribeCollection<Order>('orders', 'orderDate', 'desc', setOrders));
        unsubs.push(subscribeCollection<Supplier>('suppliers', 'name', 'asc', setSuppliers));
        unsubs.push(subscribeCollection<Buyer>('buyers', 'businessName', 'asc', setBuyers));
        unsubs.push(subscribeCollection<Agent>('agents', 'code', 'asc', setAgents));
        unsubs.push(
          subscribeCollection<StockMovement>('stock_movements', 'createdAt', 'desc', setMovements)
        );
        unsubs.push(
          subscribeCollection<Delivery>('deliveries', 'scheduledDate', 'desc', setDeliveries)
        );

        if (['owner', 'admin', 'manager'].includes(profile.role)) {
          unsubs.push(
            subscribeCollection<FinancialTransaction>('transactions', 'date', 'desc', setTransactions)
          );
          unsubs.push(
            subscribeCollection<AuditEvent>('audit_events', 'createdAt', 'desc', setAuditEvents)
          );
        }

        if (['owner', 'admin'].includes(profile.role)) {
          unsubs.push(
            subscribeCollection<CommissionRecord>('commission_ledger', 'date', 'desc', setCommissions)
          );
          unsubs.push(
            subscribeCollection<UserProfile>('users', 'displayName', 'asc', setTeamMembers)
          );
        }

        unsubs.push(
          subscribeSettings((loaded) => {
            if (loaded) setSettings(loaded);
          })
        );
      } catch (err) {
        const msg = err instanceof Error ? err.message : 'Unable to sync Firestore workspace.';
        setSyncError(msg);
        pushToast('error', 'Workspace sync error', msg);
      } finally {
        setIsHydrating(false);
      }
    });

    return () => {
      clearSubs();
      unsubAuth();
    };
  }, [pushToast]);

  const isLiveTeam = Boolean(
    authUser &&
      userProfile &&
      userProfile.active &&
      ['owner', 'admin', 'manager', 'employee'].includes(userProfile.role)
  );

  const actor = useMemo(
    () => ({
      uid: authUser?.uid || 'sandbox_owner',
      name: userProfile?.displayName || 'Liban Abdullahi',
      role: previewRole,
    }),
    [authUser?.uid, userProfile?.displayName, previewRole]
  );

  const firstName = useMemo(
    () => (userProfile?.displayName || 'Liban').split(' ')[0] || 'Liban',
    [userProfile?.displayName]
  );

  const effectiveRole = previewRole;
  const isOwnerOrAdmin = effectiveRole === 'owner' || effectiveRole === 'admin';
  const isManagerOrAbove = isOwnerOrAdmin || effectiveRole === 'manager';

  const appendSandboxAudit = (
    action: string,
    category: AuditEvent['category'],
    summary: string
  ) => {
    setAuditEvents((prev) => [
      {
        id: makeId('evt'),
        actorUid: actor.uid,
        actorName: actor.name,
        actorRole: actor.role,
        action,
        category,
        summary,
      },
      ...prev,
    ]);
  };

  // Action Handlers
  const handleSignIn = async () => {
    try {
      await signInWithPopup(auth, googleAuthProvider);
      pushToast('success', 'Signed in to TradeLink');
    } catch (err) {
      pushToast(
        'error',
        'Sign-in cancelled or failed',
        err instanceof Error ? err.message : undefined
      );
    }
  };

  const handleSignOut = async () => {
    await signOut(auth);
    setProducts(SEED_PRODUCTS);
    setOrders(SEED_ORDERS);
    setSuppliers(SEED_SUPPLIERS);
    setBuyers(SEED_BUYERS);
    setAgents(SEED_AGENTS);
    setMovements(SEED_MOVEMENTS);
    setDeliveries(SEED_DELIVERIES);
    setTransactions(SEED_TRANSACTIONS);
    setCommissions(SEED_COMMISSIONS);
    setAuditEvents(SEED_AUDIT_EVENTS);
    setTeamMembers(SEED_TEAM_MEMBERS);
    setSettings(SEED_SETTINGS);
    pushToast('info', 'Signed out', 'Returned to preview workspace.');
  };

  const handleSaveProduct = async (
    product: Omit<Product, 'createdAt' | 'updatedAt'>,
    isNew: boolean
  ) => {
    try {
      if (isLiveTeam) {
        await saveProduct(product, isNew, actor);
      } else {
        setProducts((prev) =>
          isNew ? [product, ...prev] : prev.map((p) => (p.id === product.id ? product : p))
        );
        appendSandboxAudit(
          isNew ? 'PRODUCT_CREATED' : 'PRODUCT_UPDATED',
          'inventory',
          `${isNew ? 'Added' : 'Updated'} ${product.name} (${product.stockQty} ${product.unit}).`
        );
      }
      pushToast('success', isNew ? 'Product added' : 'Product updated', product.name);
    } catch (err) {
      pushToast('error', 'Could not save product', err instanceof Error ? err.message : undefined);
    }
  };

  const handleDeleteProduct = async (product: Product) => {
    try {
      if (isLiveTeam) {
        await deleteProductById(product, actor);
      } else {
        setProducts((prev) => prev.filter((p) => p.id !== product.id));
        appendSandboxAudit('PRODUCT_DELETED', 'inventory', `Removed ${product.name}.`);
      }
      pushToast('success', 'Product deleted', product.name);
    } catch (err) {
      pushToast('error', 'Could not delete product', err instanceof Error ? err.message : undefined);
    }
  };

  const handleAdjustStock = async (params: {
    product: Product;
    type: StockMovementType;
    delta: number;
    referenceId: string;
    notes?: string;
  }) => {
    const nextQty = params.product.stockQty + params.delta;
    if (nextQty < 0) {
      pushToast('error', 'Negative inventory blocked', 'Available stock cannot go below zero.');
      return;
    }
    try {
      if (isLiveTeam) {
        await recordStockMovement({ ...params, actor });
      } else {
        setProducts((prev) =>
          prev.map((p) =>
            p.id === params.product.id
              ? { ...p, stockQty: nextQty, stockUpdatedAt: new Date().toISOString() }
              : p
          )
        );
        setMovements((prev) => [
          {
            id: makeId('mov'),
            productId: params.product.id,
            productName: params.product.name,
            type: params.type,
            quantityDelta: params.delta,
            balanceAfter: nextQty,
            referenceId: params.referenceId,
            actorUid: actor.uid,
            actorName: actor.name,
            notes: params.notes,
          },
          ...prev,
        ]);
        appendSandboxAudit(
          'STOCK_MOVEMENT',
          'inventory',
          `${params.type} ${params.delta >= 0 ? `+${params.delta}` : params.delta} on ${params.product.name}.`
        );
      }
      pushToast(
        'success',
        'Warehouse stock updated',
        `${params.product.name}: ${nextQty} ${params.product.unit}`
      );
    } catch (err) {
      pushToast('error', 'Stock update failed', err instanceof Error ? err.message : undefined);
    }
  };

  const handleSaveOrder = async (
    order: Omit<Order, 'createdAt' | 'updatedAt'>,
    isNew: boolean
  ) => {
    const prod = products.find((p) => p.id === order.productId);
    const buyer = buyers.find((b) => b.id === order.buyerId);
    if (!prod) return;
    if (isNew && order.quantity > prod.stockQty) {
      pushToast(
        'error',
        'Insufficient warehouse stock',
        `Only ${prod.stockQty} ${prod.unit} available.`
      );
      return;
    }

    try {
      if (isLiveTeam) {
        await createOrUpdateOrder({ order, isNew, product: prod, buyer, actor });
      } else {
        setOrders((prev) =>
          isNew ? [order, ...prev] : prev.map((o) => (o.id === order.id ? order : o))
        );
        if (isNew) {
          const nextStock = prod.stockQty - order.quantity;
          setProducts((prev) =>
            prev.map((p) =>
              p.id === prod.id
                ? { ...p, stockQty: nextStock, stockUpdatedAt: new Date().toISOString() }
                : p
            )
          );
          setMovements((prev) => [
            {
              id: makeId('mov'),
              productId: prod.id,
              productName: prod.name,
              type: 'issued',
              quantityDelta: -order.quantity,
              balanceAfter: nextStock,
              referenceId: order.orderCode,
              actorUid: actor.uid,
              actorName: actor.name,
              notes: `Reserved for ${order.buyerName}`,
            },
            ...prev,
          ]);
          if (buyer) {
            setBuyers((prev) =>
              prev.map((b) =>
                b.id === buyer.id
                  ? {
                      ...b,
                      totalOrders: b.totalOrders + 1,
                      totalSpent: b.totalSpent + order.totalAmount,
                      outstandingBalance:
                        b.outstandingBalance +
                        (order.paymentStatus === 'paid' ? 0 : order.totalAmount),
                    }
                  : b
              )
            );
          }
        }
        appendSandboxAudit(
          isNew ? 'ORDER_CREATED' : 'ORDER_UPDATED',
          'order',
          `${order.orderCode} for ${order.buyerName} (${order.currency} ${order.totalAmount.toLocaleString()}).`
        );
      }
      pushToast('success', isNew ? 'Order created' : 'Order updated', order.orderCode);
    } catch (err) {
      pushToast('error', 'Order failed', err instanceof Error ? err.message : undefined);
    }
  };

  const handleTransitionOrder = async (order: Order, nextStatus: OrderStatus) => {
    const prod = products.find((p) => p.id === order.productId);
    try {
      if (isLiveTeam) {
        await transitionOrderStatus({
          order,
          nextStatus,
          product: prod,
          commissionRatePercent: settings.commissionRatePercent,
          actor,
        });
      } else {
        setOrders((prev) =>
          prev.map((o) => (o.id === order.id ? { ...o, status: nextStatus } : o))
        );
        if (nextStatus === 'cancelled' && order.status !== 'cancelled' && prod) {
          const restored = prod.stockQty + order.quantity;
          setProducts((prev) =>
            prev.map((p) => (p.id === prod.id ? { ...p, stockQty: restored } : p))
          );
        }
        if (nextStatus === 'delivered' && order.status !== 'delivered') {
          setCommissions((prev) => [
            {
              id: `com_${order.id}`,
              orderId: order.id,
              orderCode: order.orderCode,
              productName: order.productName,
              saleAmount: order.totalAmount,
              ratePercent: settings.commissionRatePercent,
              commissionAmount: Math.round(
                (order.totalAmount * settings.commissionRatePercent) / 100
              ),
              currency: order.currency,
              payer: 'owner',
              status: 'pending',
              date: new Date().toISOString().slice(0, 10),
              notes: 'Accrued on delivery — Owner payable.',
            },
            ...prev,
          ]);
        }
        appendSandboxAudit(
          'ORDER_STATUS_CHANGED',
          'order',
          `${order.orderCode} changed to ${nextStatus}.`
        );
      }
      pushToast('success', 'Order status updated', `${order.orderCode} → ${nextStatus}`);
    } catch (err) {
      pushToast('error', 'Status update failed', err instanceof Error ? err.message : undefined);
    }
  };

  const handleLoadOrderHistory = async (orderId: string): Promise<OrderHistoryEvent[]> => {
    if (isLiveTeam) {
      return fetchOrderHistory(orderId);
    }
    const ord = orders.find((o) => o.id === orderId);
    return [
      {
        id: `hist_${orderId}`,
        orderId,
        fromStatus: 'new',
        toStatus: ord?.status || 'pending',
        actorUid: actor.uid,
        actorName: actor.name,
        note: `Order ${ord?.orderCode || orderId} logged at Malka Jabdu desk.`,
      },
    ];
  };

  const handleSaveSupplier = async (
    s: Omit<Supplier, 'createdAt' | 'updatedAt'>,
    isNew: boolean
  ) => {
    try {
      if (isLiveTeam) {
        await saveSupplier(s, isNew, actor);
      } else {
        setSuppliers((prev) => (isNew ? [s, ...prev] : prev.map((i) => (i.id === s.id ? s : i))));
        appendSandboxAudit(isNew ? 'SUPPLIER_ADDED' : 'SUPPLIER_UPDATED', 'supplier', s.name);
      }
      pushToast('success', isNew ? 'Supplier added' : 'Supplier updated', s.name);
    } catch (err) {
      pushToast('error', 'Supplier save failed', err instanceof Error ? err.message : undefined);
    }
  };

  const handleSaveBuyer = async (b: Omit<Buyer, 'createdAt' | 'updatedAt'>, isNew: boolean) => {
    try {
      if (isLiveTeam) {
        await saveBuyer(b, isNew, actor);
      } else {
        setBuyers((prev) => (isNew ? [b, ...prev] : prev.map((i) => (i.id === b.id ? b : i))));
        appendSandboxAudit(isNew ? 'BUYER_REGISTERED' : 'BUYER_UPDATED', 'buyer', b.businessName);
      }
      pushToast('success', isNew ? 'Buyer registered' : 'Buyer updated', b.businessName);
    } catch (err) {
      pushToast('error', 'Buyer save failed', err instanceof Error ? err.message : undefined);
    }
  };

  const handleSaveDelivery = async (
    d: Omit<Delivery, 'createdAt' | 'updatedAt'>,
    isNew: boolean
  ) => {
    try {
      if (isLiveTeam) {
        await saveDelivery(d, isNew, actor);
      } else {
        setDeliveries((prev) =>
          isNew ? [d, ...prev] : prev.map((item) => (item.id === d.id ? d : item))
        );
      }
      pushToast('success', 'Dispatch scheduled', `${d.orderCode} (${d.vehiclePlate})`);
    } catch (err) {
      pushToast('error', 'Dispatch failed', err instanceof Error ? err.message : undefined);
    }
  };

  const handleUpdateDeliveryStatus = async (d: Delivery, status: DeliveryStatus) => {
    try {
      if (isLiveTeam) {
        await updateDeliveryStatus(d, status, actor);
      } else {
        setDeliveries((prev) => prev.map((i) => (i.id === d.id ? { ...i, status } : i)));
      }
      pushToast('success', 'Dispatch updated', `${d.orderCode} → ${status}`);
    } catch (err) {
      pushToast('error', 'Update failed', err instanceof Error ? err.message : undefined);
    }
  };

  const handleRecordPayment = async (params: {
    tx: Omit<FinancialTransaction, 'createdAt'>;
    order?: Order;
    nextOrderPaymentStatus?: PaymentStatus;
    buyer?: Buyer;
    supplier?: Supplier;
  }) => {
    try {
      if (isLiveTeam) {
        await recordFinancialPayment({ ...params, actor });
      } else {
        setTransactions((prev) => [params.tx, ...prev]);
        if (params.order && params.nextOrderPaymentStatus) {
          setOrders((prev) =>
            prev.map((o) =>
              o.id === params.order!.id
                ? { ...o, paymentStatus: params.nextOrderPaymentStatus! }
                : o
            )
          );
        }
        if (params.buyer && params.tx.type === 'buyer_payment') {
          setBuyers((prev) =>
            prev.map((b) =>
              b.id === params.buyer!.id
                ? {
                    ...b,
                    outstandingBalance: Math.max(0, b.outstandingBalance - params.tx.amount),
                  }
                : b
            )
          );
        }
        if (params.supplier && params.tx.type === 'supplier_payment') {
          setSuppliers((prev) =>
            prev.map((s) =>
              s.id === params.supplier!.id
                ? {
                    ...s,
                    outstandingBalance: Math.max(0, s.outstandingBalance - params.tx.amount),
                  }
                : s
            )
          );
        }
        appendSandboxAudit(
          'PAYMENT_RECORDED',
          'payment',
          `${params.tx.txCode}: ${params.tx.currency} ${params.tx.amount.toLocaleString()} — ${params.tx.partyName}`
        );
      }
      pushToast('success', 'Payment recorded', `${params.tx.txCode} · ${params.tx.partyName}`);
    } catch (err) {
      pushToast('error', 'Payment failed', err instanceof Error ? err.message : undefined);
    }
  };

  const handleSettleCommission = async (rec: CommissionRecord, method: PaymentMethod) => {
    try {
      if (isLiveTeam) {
        await settleOwnerCommission(rec, method, actor);
      } else {
        setCommissions((prev) =>
          prev.map((c) => (c.id === rec.id ? { ...c, status: 'paid' } : c))
        );
        setTransactions((prev) => [
          {
            id: makeId('tx'),
            txCode: `TX-${Math.floor(1000 + Math.random() * 8999)}`,
            type: 'commission_payment',
            partyName: 'TradeLink Owner Commission Settlement',
            orderId: rec.orderId,
            amount: rec.commissionAmount,
            currency: rec.currency,
            method,
            status: 'completed',
            date: new Date().toISOString().slice(0, 10),
            notes: `Owner settlement for ${rec.orderCode}`,
          },
          ...prev,
        ]);
      }
      pushToast('success', 'Owner commission settled', `${rec.orderCode}`);
    } catch (err) {
      pushToast('error', 'Settlement failed', err instanceof Error ? err.message : undefined);
    }
  };

  const handleUpdateMemberRole = async (member: UserProfile, role: UserRole, active: boolean) => {
    try {
      if (isLiveTeam) {
        await updateTeamMemberRole(member, role, active, actor);
      } else {
        setTeamMembers((prev) =>
          prev.map((m) => (m.uid === member.uid ? { ...m, role, active } : m))
        );
      }
      pushToast('success', 'Team permissions updated', `${member.displayName} → ${role}`);
    } catch (err) {
      pushToast('error', 'Permission update failed', err instanceof Error ? err.message : undefined);
    }
  };

  const handleSaveSettings = async (next: Omit<PlatformSettings, 'updatedAt'>) => {
    try {
      if (isLiveTeam) {
        await savePlatformSettings(next, actor);
      } else {
        setSettings(next);
      }
      pushToast('success', 'Settings saved', next.warehouseName);
    } catch (err) {
      pushToast('error', 'Settings save failed', err instanceof Error ? err.message : undefined);
    }
  };

  const lowStockCount = products.filter((p) => p.stockQty <= p.minStockQty).length;
  const pendingOrderCount = orders.filter((o) => o.status === 'pending').length;
  const t = TRANSLATIONS[lang];

  if (view === 'market') {
    return (
      <MotionConfig reducedMotion="user">
        <PublicMarketplace
          lang={lang}
          theme={theme}
          listings={useDemoData ? demoListings : publicListings}
          agents={useDemoData ? agents : publicAgents}
          settings={settings}
          loading={publicLoading}
          loadError={publicError}
          onChangeLang={setLang}
          onToggleTheme={() => setTheme((prev) => (prev === 'dark' ? 'light' : 'dark'))}
          staffHref="#staff"
        />
      </MotionConfig>
    );
  }

  return (
    <MotionConfig reducedMotion="user">
      <div className="min-h-screen flex bg-canvas text-ink">
        <Sidebar
          activeRoute={activeRoute}
          onNavigate={setActiveRoute}
          collapsed={sidebarCollapsed}
          onToggleCollapse={() => setSidebarCollapsed((c) => !c)}
          mobileOpen={mobileNavOpen}
          onCloseMobile={() => setMobileNavOpen(false)}
          lang={lang}
          lowStockCount={lowStockCount}
          pendingOrderCount={pendingOrderCount}
        />

        <div className="flex-1 min-w-0 flex flex-col">
          <TopNav
            activeRoute={activeRoute}
            onNavigate={setActiveRoute}
            onOpenMobileNav={() => setMobileNavOpen(true)}
            onOpenCommandPalette={() => setCmdOpen(true)}
            lang={lang}
            onChangeLang={setLang}
            theme={theme}
            onToggleTheme={() => setTheme((prev) => (prev === 'dark' ? 'light' : 'dark'))}
            userProfile={userProfile}
            isAuthenticated={Boolean(authUser)}
            onSignIn={handleSignIn}
            onSignOut={handleSignOut}
            previewRole={previewRole}
            onChangePreviewRole={setPreviewRole}
            products={products}
            orders={orders}
            buyers={buyers}
            suppliers={suppliers}
          />

          {/* Subtle Auth / Error Banner when needed */}
          {(!authUser || syncError) && (
            <div className="px-4 lg:px-6 pt-4 no-print">
              {syncError ? (
                <ErrorBanner
                  title={t.common.errorTitle}
                  message={syncError}
                  retryLabel={t.common.retry}
                  onRetry={() => setSyncError(null)}
                />
              ) : (
                <div className="px-4 py-2.5 rounded-[12px] bg-surface border border-hairline shadow-saas text-xs flex flex-wrap items-center justify-between gap-2">
                  <span className="text-muted">{t.topbar.sandboxMode}</span>
                  <button
                    type="button"
                    onClick={handleSignIn}
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-accent text-on-accent font-medium transition-colors"
                  >
                    <LogIn className="w-3.5 h-3.5" />
                    <span>{t.topbar.signIn}</span>
                  </button>
                </div>
              )}
            </div>
          )}

          <main className="flex-1 p-4 lg:p-6 max-w-[1440px] w-full mx-auto">
            {isHydrating ? (
              activeRoute === 'overview' ? (
                <DashboardSkeleton />
              ) : CARD_GRID_ROUTES.includes(activeRoute) ? (
                <CardGridSkeleton />
              ) : (
                <TableSkeleton />
              )
            ) : (
              <AnimatePresence mode="wait">
                <motion.div
                  key={activeRoute}
                  {...pageTransition}
                >
                  {activeRoute === 'overview' && (
                    <OverviewPage
                      lang={lang}
                      currency={settings.currency}
                      firstName={firstName}
                      products={products}
                      orders={orders}
                      auditEvents={auditEvents}
                      onNavigate={setActiveRoute}
                      onOpenNewOrder={() => {
                        setActiveRoute('orders');
                        setTriggerNewOrder(true);
                      }}
                      onOpenNewProduct={() => {
                        setActiveRoute('products');
                        setTriggerNewProduct(true);
                      }}
                      onSelectOrder={(ord) => {
                        setExternalSelectedOrder(ord);
                        setActiveRoute('orders');
                      }}
                    />
                  )}

                  {activeRoute === 'products' && (
                    <ProductsPage
                      agents={agents}
                      lang={lang}
                      currency={settings.currency}
                      products={products}
                      suppliers={suppliers}
                      canManage={isManagerOrAbove}
                      canDelete={isOwnerOrAdmin}
                      onSaveProduct={handleSaveProduct}
                      onDeleteProduct={handleDeleteProduct}
                      externalCreateOpen={triggerNewProduct}
                      onCloseExternalCreate={() => setTriggerNewProduct(false)}
                    />
                  )}

                  {activeRoute === 'orders' && (
                    <OrdersPage
                      lang={lang}
                      currency={settings.currency}
                      orders={orders}
                      products={products}
                      buyers={buyers}
                      onSaveOrder={handleSaveOrder}
                      onTransitionStatus={handleTransitionOrder}
                      loadHistory={handleLoadOrderHistory}
                      externalCreateOpen={triggerNewOrder}
                      onCloseExternalCreate={() => setTriggerNewOrder(false)}
                      selectedOrderFromOutside={externalSelectedOrder}
                      onClearExternalOrder={() => setExternalSelectedOrder(null)}
                    />
                  )}

                  {activeRoute === 'suppliers' && (
                    <SuppliersPage
                      lang={lang}
                      currency={settings.currency}
                      suppliers={suppliers}
                      products={products}
                      transactions={transactions}
                      canManage={isManagerOrAbove}
                      onSaveSupplier={handleSaveSupplier}
                    />
                  )}

                  {activeRoute === 'buyers' && (
                    <BuyersPage
                      lang={lang}
                      currency={settings.currency}
                      buyers={buyers}
                      orders={orders}
                      transactions={transactions}
                      onSaveBuyer={handleSaveBuyer}
                    />
                  )}

                  {activeRoute === 'inventory' && (
                    <InventoryPage
                      lang={lang}
                      currency={settings.currency}
                      products={products}
                      onAdjustStock={handleAdjustStock}
                    />
                  )}

                  {activeRoute === 'warehouse' && (
                    <WarehousePage lang={lang} settings={settings} products={products} />
                  )}

                  {activeRoute === 'stock_movements' && (
                    <StockMovementsPage lang={lang} movements={movements} />
                  )}

                  {activeRoute === 'deliveries' && (
                    <DeliveriesPage
                      lang={lang}
                      deliveries={deliveries}
                      orders={orders}
                      onSaveDelivery={handleSaveDelivery}
                      onUpdateStatus={handleUpdateDeliveryStatus}
                    />
                  )}

                  {activeRoute === 'payments' && (
                    <PaymentsPage
                      lang={lang}
                      currency={settings.currency}
                      orders={orders}
                      buyers={buyers}
                      suppliers={suppliers}
                      onRecordPayment={handleRecordPayment}
                    />
                  )}

                  {activeRoute === 'commissions' && (
                    <CommissionsPage
                      lang={lang}
                      currency={settings.currency}
                      commissions={commissions}
                      commissionRatePercent={settings.commissionRatePercent}
                      canSettle={isOwnerOrAdmin}
                      onSettleCommission={handleSettleCommission}
                    />
                  )}

                  {activeRoute === 'transactions' && (
                    <TransactionsPage lang={lang} transactions={transactions} />
                  )}

                  {activeRoute === 'financial_reports' && (
                    <FinancialReportsPage
                      lang={lang}
                      currency={settings.currency}
                      orders={orders}
                      products={products}
                      transactions={transactions}
                      commissions={commissions}
                    />
                  )}

                  {activeRoute === 'analytics' && (
                    <AnalyticsPage
                      lang={lang}
                      currency={settings.currency}
                      products={products}
                      orders={orders}
                      buyers={buyers}
                      suppliers={suppliers}
                    />
                  )}

                  {activeRoute === 'team_members' && (
                    <TeamMembersPage
                      lang={lang}
                      members={teamMembers}
                      canManageTeam={isOwnerOrAdmin}
                      onUpdateRole={handleUpdateMemberRole}
                    />
                  )}

                  {activeRoute === 'activity_logs' && (
                    <ActivityLogsPage lang={lang} events={auditEvents} />
                  )}

                  {activeRoute === 'settings' && (
                    <SettingsPage
                      lang={lang}
                      theme={theme}
                      settings={settings}
                      canEditSettings={isOwnerOrAdmin}
                      onChangeLang={setLang}
                      onToggleTheme={() => setTheme((prev) => (prev === 'dark' ? 'light' : 'dark'))}
                      onSaveSettings={handleSaveSettings}
                    />
                  )}
                </motion.div>
              </AnimatePresence>
            )}
          </main>
        </div>

        <CommandPalette
          open={cmdOpen}
          onClose={() => setCmdOpen(false)}
          lang={lang}
          theme={theme}
          onToggleTheme={() => setTheme((prev) => (prev === 'dark' ? 'light' : 'dark'))}
          onNavigate={setActiveRoute}
          onOpenNewOrder={() => {
            setActiveRoute('orders');
            setTriggerNewOrder(true);
          }}
          onOpenNewProduct={() => {
            setActiveRoute('products');
            setTriggerNewProduct(true);
          }}
          onSelectOrder={(ord) => {
            setExternalSelectedOrder(ord);
            setActiveRoute('orders');
          }}
          products={products}
          orders={orders}
          buyers={buyers}
          suppliers={suppliers}
        />

        <ToastHost
          toasts={toasts}
          onDismiss={(id) => setToasts((prev) => prev.filter((item) => item.id !== id))}
        />
      </div>
    </MotionConfig>
  );
}
