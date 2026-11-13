import {
  collection,
  deleteDoc,
  doc,
  getDoc,
  getDocs,
  limit,
  onSnapshot,
  orderBy,
  query,
  serverTimestamp,
  setDoc,
  updateDoc,
  where,
  writeBatch,
  type Unsubscribe,
} from 'firebase/firestore';
import type { User } from 'firebase/auth';
import { toPublicListing } from '../lib/listings';
import {
  BOOTSTRAPPED_ADMIN_EMAIL,
  OperationType,
  db,
  handleFirestoreError,
} from '../lib/firebase';
import {
  SEED_AUDIT_EVENTS,
  SEED_AGENTS,
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
} from '../data/seedData';
import type {
  Agent,
  AuditEvent,
  Buyer,
  CommissionRecord,
  Delivery,
  DeliveryStatus,
  FinancialTransaction,
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
  UserProfile,
  UserRole,
} from '../types/tradelink';

function stripUndefined<T extends Record<string, unknown>>(obj: T): T {
  const out: Record<string, unknown> = {};
  for (const [k, v] of Object.entries(obj)) {
    if (v !== undefined) {
      out[k] = v;
    }
  }
  return out as T;
}

export function makeId(prefix: string): string {
  const rand = Math.random().toString(36).slice(2, 8);
  return `${prefix}_${Date.now().toString(36)}_${rand}`.replace(/[^a-zA-Z0-9_-]/g, '');
}

export async function ensureUserProfile(user: User): Promise<UserProfile> {
  const path = `users/${user.uid}`;
  const ref = doc(db, 'users', user.uid);
  try {
    const snap = await getDoc(ref);
    const isBootstrapAdmin =
      (user.email || '').toLowerCase() === BOOTSTRAPPED_ADMIN_EMAIL.toLowerCase();

    if (snap.exists()) {
      const data = snap.data() as UserProfile;
      if (isBootstrapAdmin && data.role !== 'owner' && data.role !== 'admin') {
        await updateDoc(ref, {
          role: 'owner',
          active: true,
          updatedAt: serverTimestamp(),
        });
        return { ...data, role: 'owner', active: true };
      }
      return data;
    }

    const profile: UserProfile = {
      uid: user.uid,
      email: user.email || 'unknown@tradelinkfood.et',
      displayName: user.displayName || (isBootstrapAdmin ? 'Liban Abdullahi' : 'Team Member'),
      role: isBootstrapAdmin ? 'owner' : 'pending',
      phone: user.phoneNumber || undefined,
      active: true,
    };

    await setDoc(
      ref,
      stripUndefined({
        ...profile,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      })
    );

    if (isBootstrapAdmin) {
      await setDoc(doc(db, 'admins', user.uid), {
        uid: user.uid,
        email: profile.email,
        createdAt: serverTimestamp(),
      });
    }

    return profile;
  } catch (error) {
    handleFirestoreError(error, OperationType.WRITE, path);
  }
}

export async function seedInitialWorkspace(uid: string, actorName: string): Promise<void> {
  try {
    // 1. Settings
    const settingsSnap = await getDoc(doc(db, 'settings', 'default'));
    if (!settingsSnap.exists()) {
      await setDoc(doc(db, 'settings', 'default'), {
        ...SEED_SETTINGS,
        updatedAt: serverTimestamp(),
      });
    }

    // 2. Suppliers
    const suppliersSnap = await getDocs(query(collection(db, 'suppliers'), limit(2)));
    if (suppliersSnap.empty) {
      const b = writeBatch(db);
      for (const s of SEED_SUPPLIERS) {
        b.set(
          doc(db, 'suppliers', s.id),
          stripUndefined({ ...s, createdAt: serverTimestamp(), updatedAt: serverTimestamp() })
        );
      }
      await b.commit();
    }

    // 2b. Agents (public contact details for the marketplace)
    const agentsSnap = await getDocs(query(collection(db, 'agents'), limit(1)));
    if (agentsSnap.empty) {
      const b = writeBatch(db);
      for (const a of SEED_AGENTS) {
        b.set(
          doc(db, 'agents', a.id),
          stripUndefined({ ...a, createdAt: serverTimestamp(), updatedAt: serverTimestamp() })
        );
      }
      await b.commit();
    }

    // 3. Buyers
    const buyersSnap = await getDocs(query(collection(db, 'buyers'), limit(2)));
    if (buyersSnap.empty) {
      const b = writeBatch(db);
      for (const buyer of SEED_BUYERS) {
        b.set(
          doc(db, 'buyers', buyer.id),
          stripUndefined({ ...buyer, createdAt: serverTimestamp(), updatedAt: serverTimestamp() })
        );
      }
      await b.commit();
    }

    // 4. Products (also clean up legacy v1 products if they exist)
    const productsSnap = await getDocs(collection(db, 'products'));
    const hasModernProduct = productsSnap.docs.some((d) => 'sellingPrice' in d.data());
    if (!hasModernProduct) {
      const b = writeBatch(db);
      for (const oldDoc of productsSnap.docs) {
        b.delete(doc(db, 'products', oldDoc.id));
      }
      for (const p of SEED_PRODUCTS) {
        b.set(
          doc(db, 'products', p.id),
          stripUndefined({ ...p, createdAt: serverTimestamp(), updatedAt: serverTimestamp() })
        );
        syncListing(b, p);
      }
      await b.commit();
    }

    // 4b. Public listings: backfill from products when none exist yet (first run after upgrade)
    const listingsSnap = await getDocs(query(collection(db, 'public_listings'), limit(1)));
    if (listingsSnap.empty) {
      const allProducts = await getDocs(collection(db, 'products'));
      const b = writeBatch(db);
      for (const d of allProducts.docs) {
        syncListing(b, { ...(d.data() as Product), id: d.id });
      }
      await b.commit();
    }

    // 5. Orders + initial history
    const ordersSnap = await getDocs(query(collection(db, 'orders'), limit(2)));
    const hasModernOrder = ordersSnap.docs.some((d) => 'orderCode' in d.data());
    if (!hasModernOrder) {
      const b = writeBatch(db);
      for (const ord of SEED_ORDERS) {
        b.set(
          doc(db, 'orders', ord.id),
          stripUndefined({ ...ord, createdAt: serverTimestamp(), updatedAt: serverTimestamp() })
        );
        const histId = `hist_${ord.id}`;
        b.set(doc(db, 'orders', ord.id, 'history', histId), {
          id: histId,
          orderId: ord.id,
          fromStatus: 'new',
          toStatus: ord.status,
          actorUid: uid,
          actorName,
          note: 'Initial order logged in TradeLink Malka Jabdu workspace.',
          createdAt: serverTimestamp(),
        });
      }
      await b.commit();
    }

    // 6. Stock movements
    const movSnap = await getDocs(query(collection(db, 'stock_movements'), limit(2)));
    if (movSnap.empty) {
      const b = writeBatch(db);
      for (const mov of SEED_MOVEMENTS) {
        b.set(
          doc(db, 'stock_movements', mov.id),
          stripUndefined({
            ...mov,
            actorUid: uid,
            createdAt: serverTimestamp(),
          })
        );
      }
      await b.commit();
    }

    // 7. Deliveries & Transactions
    const delSnap = await getDocs(query(collection(db, 'deliveries'), limit(2)));
    if (delSnap.empty) {
      const b = writeBatch(db);
      for (const del of SEED_DELIVERIES) {
        b.set(
          doc(db, 'deliveries', del.id),
          stripUndefined({ ...del, createdAt: serverTimestamp(), updatedAt: serverTimestamp() })
        );
      }
      await b.commit();
    }

    const txSnap = await getDocs(query(collection(db, 'transactions'), limit(2)));
    if (txSnap.empty) {
      const b = writeBatch(db);
      for (const tx of SEED_TRANSACTIONS) {
        b.set(
          doc(db, 'transactions', tx.id),
          stripUndefined({ ...tx, createdAt: serverTimestamp() })
        );
      }
      await b.commit();
    }

    // 8. Commissions & Audit events
    const comSnap = await getDocs(query(collection(db, 'commission_ledger'), limit(2)));
    if (comSnap.empty) {
      const b = writeBatch(db);
      for (const com of SEED_COMMISSIONS) {
        b.set(
          doc(db, 'commission_ledger', com.id),
          stripUndefined({ ...com, createdAt: serverTimestamp(), updatedAt: serverTimestamp() })
        );
      }
      await b.commit();
    }

    const evtSnap = await getDocs(query(collection(db, 'audit_events'), limit(2)));
    if (evtSnap.empty) {
      const b = writeBatch(db);
      for (const evt of SEED_AUDIT_EVENTS) {
        b.set(
          doc(db, 'audit_events', evt.id),
          stripUndefined({
            ...evt,
            actorUid: uid,
            createdAt: serverTimestamp(),
          })
        );
      }
      await b.commit();
    }

    // 9. Starter team members (excluding current owner email to avoid duplicate)
    const usersSnap = await getDocs(collection(db, 'users'));
    if (usersSnap.size <= 1) {
      const b = writeBatch(db);
      for (const member of SEED_TEAM_MEMBERS) {
        if (member.email.toLowerCase() === BOOTSTRAPPED_ADMIN_EMAIL.toLowerCase()) continue;
        b.set(
          doc(db, 'users', member.uid),
          stripUndefined({ ...member, createdAt: serverTimestamp(), updatedAt: serverTimestamp() })
        );
      }
      await b.commit();
    }
  } catch (error) {
    handleFirestoreError(error, OperationType.WRITE, 'workspace_seed');
  }
}

export function subscribePublicProducts(onData: (items: Product[]) => void): Unsubscribe {
  const q = query(
    collection(db, 'products'),
    where('status', '==', 'active'),
    orderBy('name', 'asc')
  );
  return onSnapshot(
    q,
    (snap) => {
      onData(snap.docs.map((d) => ({ id: d.id, ...d.data() } as Product)));
    },
    (error) => handleFirestoreError(error, OperationType.LIST, 'products')
  );
}

export function subscribeCollection<T>(
  collectionName: string,
  orderField: string,
  direction: 'asc' | 'desc',
  onData: (items: T[]) => void
): Unsubscribe {
  const q = query(collection(db, collectionName), orderBy(orderField, direction));
  return onSnapshot(
    q,
    (snap) => {
      onData(snap.docs.map((d) => ({ id: d.id, ...d.data() } as T)));
    },
    (error) => handleFirestoreError(error, OperationType.LIST, collectionName)
  );
}

/**
 * Keep the public, cost-free copy of a product in step with the product itself.
 * Only active products are listed; anything else is removed from the public view.
 */
function syncListing(batch: ReturnType<typeof writeBatch>, product: Product): void {
  const ref = doc(db, 'public_listings', product.id);
  if (product.status === 'active') {
    batch.set(ref, stripUndefined({ ...toPublicListing(product), updatedAt: serverTimestamp() }));
  } else {
    batch.delete(ref);
  }
}

export function subscribePublicListings(
  onData: (items: PublicListing[]) => void,
  onError: (error: Error) => void
): Unsubscribe {
  return onSnapshot(
    collection(db, 'public_listings'),
    (snap) => onData(snap.docs.map((d) => ({ ...d.data(), id: d.id } as PublicListing))),
    (error) => onError(error)
  );
}

export function subscribePublicAgents(
  onData: (items: Agent[]) => void,
  onError: (error: Error) => void
): Unsubscribe {
  return onSnapshot(
    query(collection(db, 'agents'), where('status', '==', 'active')),
    (snap) => onData(snap.docs.map((d) => ({ ...d.data(), id: d.id } as Agent))),
    (error) => onError(error)
  );
}

export function subscribeSettings(onData: (settings: PlatformSettings | null) => void): Unsubscribe {
  return onSnapshot(
    doc(db, 'settings', 'default'),
    (snap) => {
      onData(snap.exists() ? ({ id: snap.id, ...snap.data() } as PlatformSettings) : null);
    },
    (error) => handleFirestoreError(error, OperationType.GET, 'settings/default')
  );
}

export async function fetchOrderHistory(orderId: string): Promise<OrderHistoryEvent[]> {
  try {
    const q = query(collection(db, 'orders', orderId, 'history'), orderBy('createdAt', 'asc'));
    const snap = await getDocs(q);
    return snap.docs.map((d) => ({ id: d.id, ...d.data() } as OrderHistoryEvent));
  } catch (error) {
    handleFirestoreError(error, OperationType.LIST, `orders/${orderId}/history`);
  }
}

export async function saveProduct(
  product: Omit<Product, 'createdAt' | 'updatedAt'>,
  isNew: boolean,
  actor?: { uid: string; name: string; role: string }
): Promise<void> {
  const path = `products/${product.id}`;
  try {
    const batch = writeBatch(db);
    if (isNew) {
      batch.set(
        doc(db, 'products', product.id),
        stripUndefined({
          ...product,
          createdAt: serverTimestamp(),
          updatedAt: serverTimestamp(),
        })
      );
      if (actor && product.stockQty > 0) {
        const movId = makeId('mov');
        batch.set(doc(db, 'stock_movements', movId), {
          id: movId,
          productId: product.id,
          productName: product.name,
          type: 'received',
          quantityDelta: product.stockQty,
          balanceAfter: product.stockQty,
          referenceId: product.sku || product.id,
          actorUid: actor.uid,
          actorName: actor.name,
          notes: 'Opening stock added on product creation.',
          createdAt: serverTimestamp(),
        });
      }
    } else {
      const existingSnap = await getDoc(doc(db, 'products', product.id));
      const createdAt = existingSnap.exists() ? existingSnap.data().createdAt : serverTimestamp();
      batch.set(
        doc(db, 'products', product.id),
        stripUndefined({
          ...product,
          createdAt,
          updatedAt: serverTimestamp(),
        })
      );
    }

    syncListing(batch, product as Product);

    if (actor) {
      const evtId = makeId('evt');
      batch.set(doc(db, 'audit_events', evtId), {
        id: evtId,
        actorUid: actor.uid,
        actorName: actor.name,
        actorRole: actor.role,
        action: isNew ? 'PRODUCT_CREATED' : 'PRODUCT_UPDATED',
        category: 'inventory',
        summary: `${isNew ? 'Added' : 'Updated'} product "${product.name}" (${product.stockQty} ${product.unit}).`,
        createdAt: serverTimestamp(),
      });
    }

    await batch.commit();
  } catch (error) {
    handleFirestoreError(error, OperationType.WRITE, path);
  }
}

export async function deleteProductById(
  product: Product,
  actor?: { uid: string; name: string; role: string }
): Promise<void> {
  try {
    const delBatch = writeBatch(db);
    delBatch.delete(doc(db, 'products', product.id));
    delBatch.delete(doc(db, 'public_listings', product.id));
    await delBatch.commit();
    if (actor) {
      const evtId = makeId('evt');
      await setDoc(doc(db, 'audit_events', evtId), {
        id: evtId,
        actorUid: actor.uid,
        actorName: actor.name,
        actorRole: actor.role,
        action: 'PRODUCT_DELETED',
        category: 'inventory',
        summary: `Removed product "${product.name}" from catalog.`,
        createdAt: serverTimestamp(),
      });
    }
  } catch (error) {
    handleFirestoreError(error, OperationType.DELETE, `products/${product.id}`);
  }
}

export async function recordStockMovement(params: {
  product: Product;
  type: StockMovementType;
  delta: number;
  referenceId: string;
  notes?: string;
  actor: { uid: string; name: string; role: string };
}): Promise<number> {
  const { product, type, delta, referenceId, notes, actor } = params;
  const nextQty = product.stockQty + delta;
  if (nextQty < 0) {
    throw new Error(
      `Insufficient stock for ${product.name}. Available: ${product.stockQty}, requested deduction: ${Math.abs(delta)}.`
    );
  }

  try {
    const batch = writeBatch(db);
    const stampedAt = new Date().toISOString();
    batch.update(doc(db, 'products', product.id), {
      stockQty: nextQty,
      stockUpdatedAt: stampedAt,
      updatedAt: serverTimestamp(),
    });
    syncListing(batch, { ...product, stockQty: nextQty, stockUpdatedAt: stampedAt });

    const movId = makeId('mov');
    batch.set(
      doc(db, 'stock_movements', movId),
      stripUndefined({
        id: movId,
        productId: product.id,
        productName: product.name,
        type,
        quantityDelta: delta,
        balanceAfter: nextQty,
        referenceId: referenceId || product.sku || 'MANUAL',
        actorUid: actor.uid,
        actorName: actor.name,
        notes: notes || undefined,
        createdAt: serverTimestamp(),
      })
    );

    const evtId = makeId('evt');
    batch.set(doc(db, 'audit_events', evtId), {
      id: evtId,
      actorUid: actor.uid,
      actorName: actor.name,
      actorRole: actor.role,
      action: 'STOCK_MOVEMENT',
      category: 'inventory',
      summary: `${type.toUpperCase()} ${delta >= 0 ? `+${delta}` : delta} ${product.unit} on ${product.name} (new balance: ${nextQty}).`,
      createdAt: serverTimestamp(),
    });

    await batch.commit();
    return nextQty;
  } catch (error) {
    handleFirestoreError(error, OperationType.WRITE, `products/${product.id}`);
  }
}

export async function createOrUpdateOrder(params: {
  order: Omit<Order, 'createdAt' | 'updatedAt'>;
  isNew: boolean;
  product: Product;
  buyer?: Buyer;
  actor: { uid: string; name: string; role: string };
}): Promise<void> {
  const { order, isNew, product, buyer, actor } = params;
  if (isNew && order.quantity > product.stockQty) {
    throw new Error(
      `Cannot create order: requested ${order.quantity} ${product.unit}, but only ${product.stockQty} available.`
    );
  }

  try {
    const batch = writeBatch(db);
    if (isNew) {
      batch.set(
        doc(db, 'orders', order.id),
        stripUndefined({
          ...order,
          createdAt: serverTimestamp(),
          updatedAt: serverTimestamp(),
        })
      );

      // Deduct reserved stock from single warehouse safely (non-negative enforced)
      const nextStock = product.stockQty - order.quantity;
      const reservedAt = new Date().toISOString();
      batch.update(doc(db, 'products', product.id), {
        stockQty: nextStock,
        stockUpdatedAt: reservedAt,
        updatedAt: serverTimestamp(),
      });
      syncListing(batch, { ...product, stockQty: nextStock, stockUpdatedAt: reservedAt });

      const movId = makeId('mov');
      batch.set(doc(db, 'stock_movements', movId), {
        id: movId,
        productId: product.id,
        productName: product.name,
        type: 'issued',
        quantityDelta: -order.quantity,
        balanceAfter: nextStock,
        referenceId: order.orderCode,
        actorUid: actor.uid,
        actorName: actor.name,
        notes: `Reserved for ${order.buyerName} (${order.orderCode}).`,
        createdAt: serverTimestamp(),
      });

      if (buyer) {
        const balanceAdd = order.paymentStatus === 'paid' ? 0 : order.totalAmount;
        batch.update(doc(db, 'buyers', buyer.id), {
          totalOrders: buyer.totalOrders + 1,
          totalSpent: buyer.totalSpent + order.totalAmount,
          outstandingBalance: buyer.outstandingBalance + balanceAdd,
          updatedAt: serverTimestamp(),
        });
      }

      const histId = makeId('hist');
      batch.set(doc(db, 'orders', order.id, 'history', histId), {
        id: histId,
        orderId: order.id,
        fromStatus: 'new',
        toStatus: order.status,
        actorUid: actor.uid,
        actorName: actor.name,
        note: `Order ${order.orderCode} created for ${order.quantity} ${order.unit}.`,
        createdAt: serverTimestamp(),
      });
    } else {
      const existingSnap = await getDoc(doc(db, 'orders', order.id));
      const existingOrder = existingSnap.data() as Order | undefined;
      const createdAt = existingOrder?.createdAt ?? serverTimestamp();

      batch.set(
        doc(db, 'orders', order.id),
        stripUndefined({
          ...order,
          createdAt,
          updatedAt: serverTimestamp(),
        })
      );

      if (existingOrder && existingOrder.status !== order.status) {
        const histId = makeId('hist');
        batch.set(doc(db, 'orders', order.id, 'history', histId), {
          id: histId,
          orderId: order.id,
          fromStatus: existingOrder.status,
          toStatus: order.status,
          actorUid: actor.uid,
          actorName: actor.name,
          note: `Order updated to ${order.status}.`,
          createdAt: serverTimestamp(),
        });
      }
    }

    const evtId = makeId('evt');
    batch.set(doc(db, 'audit_events', evtId), {
      id: evtId,
      actorUid: actor.uid,
      actorName: actor.name,
      actorRole: actor.role,
      action: isNew ? 'ORDER_CREATED' : 'ORDER_UPDATED',
      category: 'order',
      summary: `${isNew ? 'Created' : 'Updated'} ${order.orderCode} for ${order.buyerName} (${order.currency} ${order.totalAmount.toLocaleString()}).`,
      createdAt: serverTimestamp(),
    });

    await batch.commit();
  } catch (error) {
    handleFirestoreError(error, OperationType.WRITE, `orders/${order.id}`);
  }
}

export async function transitionOrderStatus(params: {
  order: Order;
  nextStatus: OrderStatus;
  product?: Product;
  commissionRatePercent: number;
  actor: { uid: string; name: string; role: string };
  note?: string;
}): Promise<void> {
  const { order, nextStatus, product, commissionRatePercent, actor, note } = params;
  if (order.status === nextStatus) return;

  try {
    const batch = writeBatch(db);
    batch.update(doc(db, 'orders', order.id), {
      status: nextStatus,
      updatedAt: serverTimestamp(),
    });

    const histId = makeId('hist');
    batch.set(
      doc(db, 'orders', order.id, 'history', histId),
      stripUndefined({
        id: histId,
        orderId: order.id,
        fromStatus: order.status,
        toStatus: nextStatus,
        actorUid: actor.uid,
        actorName: actor.name,
        note: note || `Status changed from ${order.status} to ${nextStatus}.`,
        createdAt: serverTimestamp(),
      })
    );

    // If cancelled from a non-cancelled state, restore warehouse stock
    if (nextStatus === 'cancelled' && order.status !== 'cancelled' && product) {
      const restored = product.stockQty + order.quantity;
      const restoredAt = new Date().toISOString();
      batch.update(doc(db, 'products', product.id), {
        stockQty: restored,
        stockUpdatedAt: restoredAt,
        updatedAt: serverTimestamp(),
      });
      syncListing(batch, { ...product, stockQty: restored, stockUpdatedAt: restoredAt });
      const movId = makeId('mov');
      batch.set(doc(db, 'stock_movements', movId), {
        id: movId,
        productId: product.id,
        productName: product.name,
        type: 'adjustment',
        quantityDelta: order.quantity,
        balanceAfter: restored,
        referenceId: order.orderCode,
        actorUid: actor.uid,
        actorName: actor.name,
        notes: `Stock returned from cancelled order ${order.orderCode}.`,
        createdAt: serverTimestamp(),
      });
    }

    // If delivered, accrue owner-paid platform commission
    if (nextStatus === 'delivered' && order.status !== 'delivered') {
      const comId = `com_${order.id}`;
      const comAmount = Math.round((order.totalAmount * commissionRatePercent) / 100);
      batch.set(doc(db, 'commission_ledger', comId), {
        id: comId,
        orderId: order.id,
        orderCode: order.orderCode,
        productName: order.productName,
        saleAmount: order.totalAmount,
        ratePercent: commissionRatePercent,
        commissionAmount: comAmount,
        currency: order.currency,
        payer: 'owner',
        status: 'pending',
        date: new Date().toISOString().slice(0, 10),
        notes: 'Accrued upon delivery — strictly payable by TradeLink Owner.',
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      });
    }

    const evtId = makeId('evt');
    batch.set(doc(db, 'audit_events', evtId), {
      id: evtId,
      actorUid: actor.uid,
      actorName: actor.name,
      actorRole: actor.role,
      action: 'ORDER_STATUS_CHANGED',
      category: 'order',
      summary: `${order.orderCode} moved from ${order.status} to ${nextStatus}.`,
      createdAt: serverTimestamp(),
    });

    await batch.commit();
  } catch (error) {
    handleFirestoreError(error, OperationType.UPDATE, `orders/${order.id}`);
  }
}

export async function saveSupplier(
  supplier: Omit<Supplier, 'createdAt' | 'updatedAt'>,
  isNew: boolean,
  actor: { uid: string; name: string; role: string }
): Promise<void> {
  try {
    const batch = writeBatch(db);
    let createdAt: unknown = serverTimestamp();
    if (!isNew) {
      const snap = await getDoc(doc(db, 'suppliers', supplier.id));
      if (snap.exists()) createdAt = snap.data().createdAt;
    }
    batch.set(
      doc(db, 'suppliers', supplier.id),
      stripUndefined({ ...supplier, createdAt, updatedAt: serverTimestamp() })
    );

    const evtId = makeId('evt');
    batch.set(doc(db, 'audit_events', evtId), {
      id: evtId,
      actorUid: actor.uid,
      actorName: actor.name,
      actorRole: actor.role,
      action: isNew ? 'SUPPLIER_ADDED' : 'SUPPLIER_UPDATED',
      category: 'supplier',
      summary: `${isNew ? 'Added' : 'Updated'} supplier "${supplier.name}".`,
      createdAt: serverTimestamp(),
    });
    await batch.commit();
  } catch (error) {
    handleFirestoreError(error, OperationType.WRITE, `suppliers/${supplier.id}`);
  }
}

export async function saveBuyer(
  buyer: Omit<Buyer, 'createdAt' | 'updatedAt'>,
  isNew: boolean,
  actor: { uid: string; name: string; role: string }
): Promise<void> {
  try {
    const batch = writeBatch(db);
    let createdAt: unknown = serverTimestamp();
    if (!isNew) {
      const snap = await getDoc(doc(db, 'buyers', buyer.id));
      if (snap.exists()) createdAt = snap.data().createdAt;
    }
    batch.set(
      doc(db, 'buyers', buyer.id),
      stripUndefined({ ...buyer, createdAt, updatedAt: serverTimestamp() })
    );

    const evtId = makeId('evt');
    batch.set(doc(db, 'audit_events', evtId), {
      id: evtId,
      actorUid: actor.uid,
      actorName: actor.name,
      actorRole: actor.role,
      action: isNew ? 'BUYER_REGISTERED' : 'BUYER_UPDATED',
      category: 'buyer',
      summary: `${isNew ? 'Registered' : 'Updated'} buyer "${buyer.businessName}".`,
      createdAt: serverTimestamp(),
    });
    await batch.commit();
  } catch (error) {
    handleFirestoreError(error, OperationType.WRITE, `buyers/${buyer.id}`);
  }
}

export async function saveDelivery(
  delivery: Omit<Delivery, 'createdAt' | 'updatedAt'>,
  isNew: boolean,
  actor: { uid: string; name: string; role: string }
): Promise<void> {
  try {
    const batch = writeBatch(db);
    let createdAt: unknown = serverTimestamp();
    if (!isNew) {
      const snap = await getDoc(doc(db, 'deliveries', delivery.id));
      if (snap.exists()) createdAt = snap.data().createdAt;
    }
    batch.set(
      doc(db, 'deliveries', delivery.id),
      stripUndefined({ ...delivery, createdAt, updatedAt: serverTimestamp() })
    );

    const evtId = makeId('evt');
    batch.set(doc(db, 'audit_events', evtId), {
      id: evtId,
      actorUid: actor.uid,
      actorName: actor.name,
      actorRole: actor.role,
      action: isNew ? 'DELIVERY_SCHEDULED' : 'DELIVERY_UPDATED',
      category: 'order',
      summary: `Delivery for ${delivery.orderCode} (${delivery.vehiclePlate}) -> ${delivery.status}.`,
      createdAt: serverTimestamp(),
    });
    await batch.commit();
  } catch (error) {
    handleFirestoreError(error, OperationType.WRITE, `deliveries/${delivery.id}`);
  }
}

export async function updateDeliveryStatus(
  delivery: Delivery,
  status: DeliveryStatus,
  actor: { uid: string; name: string; role: string }
): Promise<void> {
  try {
    const batch = writeBatch(db);
    batch.update(doc(db, 'deliveries', delivery.id), {
      status,
      updatedAt: serverTimestamp(),
    });
    const evtId = makeId('evt');
    batch.set(doc(db, 'audit_events', evtId), {
      id: evtId,
      actorUid: actor.uid,
      actorName: actor.name,
      actorRole: actor.role,
      action: 'DELIVERY_STATUS',
      category: 'order',
      summary: `Dispatch ${delivery.orderCode} marked ${status}.`,
      createdAt: serverTimestamp(),
    });
    await batch.commit();
  } catch (error) {
    handleFirestoreError(error, OperationType.UPDATE, `deliveries/${delivery.id}`);
  }
}

export async function recordFinancialPayment(params: {
  tx: Omit<FinancialTransaction, 'createdAt'>;
  order?: Order;
  nextOrderPaymentStatus?: PaymentStatus;
  buyer?: Buyer;
  supplier?: Supplier;
  actor: { uid: string; name: string; role: string };
}): Promise<void> {
  const { tx, order, nextOrderPaymentStatus, buyer, supplier, actor } = params;
  try {
    const batch = writeBatch(db);
    batch.set(
      doc(db, 'transactions', tx.id),
      stripUndefined({ ...tx, createdAt: serverTimestamp() })
    );

    if (order && nextOrderPaymentStatus) {
      batch.update(doc(db, 'orders', order.id), {
        paymentStatus: nextOrderPaymentStatus,
        updatedAt: serverTimestamp(),
      });
    }

    if (buyer && tx.type === 'buyer_payment') {
      batch.update(doc(db, 'buyers', buyer.id), {
        outstandingBalance: Math.max(0, buyer.outstandingBalance - tx.amount),
        updatedAt: serverTimestamp(),
      });
    }

    if (supplier && tx.type === 'supplier_payment') {
      batch.update(doc(db, 'suppliers', supplier.id), {
        outstandingBalance: Math.max(0, supplier.outstandingBalance - tx.amount),
        updatedAt: serverTimestamp(),
      });
    }

    const evtId = makeId('evt');
    batch.set(doc(db, 'audit_events', evtId), {
      id: evtId,
      actorUid: actor.uid,
      actorName: actor.name,
      actorRole: actor.role,
      action: 'PAYMENT_RECORDED',
      category: 'payment',
      summary: `${tx.txCode}: ${tx.currency} ${tx.amount.toLocaleString()} (${tx.method}) — ${tx.partyName}.`,
      createdAt: serverTimestamp(),
    });

    await batch.commit();
  } catch (error) {
    handleFirestoreError(error, OperationType.WRITE, `transactions/${tx.id}`);
  }
}

export async function settleOwnerCommission(
  record: CommissionRecord,
  method: PaymentMethod,
  actor: { uid: string; name: string; role: string }
): Promise<void> {
  try {
    const batch = writeBatch(db);
    batch.update(doc(db, 'commission_ledger', record.id), {
      status: 'paid',
      updatedAt: serverTimestamp(),
    });

    const txId = makeId('tx');
    batch.set(doc(db, 'transactions', txId), {
      id: txId,
      txCode: `TX-${Math.floor(1000 + Math.random() * 8999)}`,
      type: 'commission_payment',
      partyName: 'TradeLink Owner Commission Settlement',
      orderId: record.orderId,
      amount: record.commissionAmount,
      currency: record.currency,
      method,
      status: 'completed',
      date: new Date().toISOString().slice(0, 10),
      notes: `Owner settlement for ${record.orderCode} (${record.ratePercent}%).`,
      createdAt: serverTimestamp(),
    });

    const evtId = makeId('evt');
    batch.set(doc(db, 'audit_events', evtId), {
      id: evtId,
      actorUid: actor.uid,
      actorName: actor.name,
      actorRole: actor.role,
      action: 'COMMISSION_SETTLED',
      category: 'payment',
      summary: `Owner settled ${record.currency} ${record.commissionAmount.toLocaleString()} commission for ${record.orderCode}.`,
      createdAt: serverTimestamp(),
    });

    await batch.commit();
  } catch (error) {
    handleFirestoreError(error, OperationType.UPDATE, `commission_ledger/${record.id}`);
  }
}

export async function updateTeamMemberRole(
  member: UserProfile,
  role: UserRole,
  active: boolean,
  actor: { uid: string; name: string; role: string }
): Promise<void> {
  try {
    const batch = writeBatch(db);
    batch.update(doc(db, 'users', member.uid), {
      role,
      active,
      updatedAt: serverTimestamp(),
    });
    const evtId = makeId('evt');
    batch.set(doc(db, 'audit_events', evtId), {
      id: evtId,
      actorUid: actor.uid,
      actorName: actor.name,
      actorRole: actor.role,
      action: 'TEAM_ROLE_UPDATED',
      category: 'team',
      summary: `Updated ${member.displayName} to role "${role}" (${active ? 'Active' : 'Suspended'}).`,
      createdAt: serverTimestamp(),
    });
    await batch.commit();
  } catch (error) {
    handleFirestoreError(error, OperationType.UPDATE, `users/${member.uid}`);
  }
}

export async function savePlatformSettings(
  settings: Omit<PlatformSettings, 'updatedAt'>,
  actor: { uid: string; name: string; role: string }
): Promise<void> {
  try {
    const batch = writeBatch(db);
    batch.set(
      doc(db, 'settings', 'default'),
      stripUndefined({ ...settings, id: 'default', updatedAt: serverTimestamp() })
    );
    const evtId = makeId('evt');
    batch.set(doc(db, 'audit_events', evtId), {
      id: evtId,
      actorUid: actor.uid,
      actorName: actor.name,
      actorRole: actor.role,
      action: 'SETTINGS_UPDATED',
      category: 'settings',
      summary: `Updated workspace settings (Warehouse: ${settings.warehouseName}, Owner Commission: ${settings.commissionRatePercent}%).`,
      createdAt: serverTimestamp(),
    });
    await batch.commit();
  } catch (error) {
    handleFirestoreError(error, OperationType.WRITE, 'settings/default');
  }
}
