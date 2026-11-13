/**
 * TradeLink Firestore Rules Verification Spec (Dirty Dozen Payload Audit)
 * Validates structural invariants and adversarial payload rejection against DRAFT_firestore.rules / firestore.rules.
 */

interface MockAuth {
  uid: string;
  email: string;
  emailVerified: boolean;
  role: 'admin' | 'agent' | 'warehouse_staff' | 'pending' | 'public';
}

interface RuleTestCase {
  name: string;
  collection: string;
  operation: 'create' | 'update' | 'get' | 'list' | 'delete';
  auth: MockAuth | null;
  payload?: Record<string, unknown>;
  existing?: Record<string, unknown>;
  expected: 'ALLOW' | 'PERMISSION_DENIED';
}

export const dirtyDozenTests: RuleTestCase[] = [
  {
    name: '1. Self-Role Escalation on user creation',
    collection: 'users/user_1',
    operation: 'create',
    auth: { uid: 'user_1', email: 'buyer@example.com', emailVerified: true, role: 'pending' },
    payload: { uid: 'user_1', email: 'buyer@example.com', displayName: 'Buyer', role: 'admin', active: true },
    expected: 'PERMISSION_DENIED',
  },
  {
    name: '2. Profile Role Tampering on user update',
    collection: 'users/agent_1',
    operation: 'update',
    auth: { uid: 'agent_1', email: 'agent@example.com', emailVerified: true, role: 'agent' },
    existing: { uid: 'agent_1', email: 'agent@example.com', displayName: 'Agent', role: 'agent', active: true },
    payload: { uid: 'agent_1', email: 'agent@example.com', displayName: 'Agent', role: 'admin', active: true },
    expected: 'PERMISSION_DENIED',
  },
  {
    name: '3. Agent Self-Approval on product creation',
    collection: 'products/prod_1',
    operation: 'create',
    auth: { uid: 'agent_1', email: 'agent@example.com', emailVerified: true, role: 'agent' },
    payload: { id: 'prod_1', agentUid: 'agent_1', status: 'approved', onHandQty: 0, reservedQty: 0, availableQty: 0 },
    expected: 'PERMISSION_DENIED',
  },
  {
    name: '4. Agent Stock Inflation on own product',
    collection: 'products/prod_1',
    operation: 'update',
    auth: { uid: 'agent_1', email: 'agent@example.com', emailVerified: true, role: 'agent' },
    existing: { id: 'prod_1', agentUid: 'agent_1', status: 'approved', onHandQty: 100, reservedQty: 0, availableQty: 100 },
    payload: { id: 'prod_1', agentUid: 'agent_1', status: 'pending_review', onHandQty: 9999, reservedQty: 0, availableQty: 9999 },
    expected: 'PERMISSION_DENIED',
  },
  {
    name: '5. Agent Cross-Ownership Edit',
    collection: 'products/prod_other',
    operation: 'update',
    auth: { uid: 'agent_1', email: 'agent@example.com', emailVerified: true, role: 'agent' },
    existing: { id: 'prod_other', agentUid: 'agent_2', status: 'pending_review', onHandQty: 0, reservedQty: 0, availableQty: 0 },
    payload: { id: 'prod_other', agentUid: 'agent_2', status: 'pending_review', name: 'Hijacked' },
    expected: 'PERMISSION_DENIED',
  },
  {
    name: '6. Public Unapproved Product Read',
    collection: 'products/prod_pending',
    operation: 'get',
    auth: null,
    existing: { id: 'prod_pending', agentUid: 'agent_1', status: 'pending_review' },
    expected: 'PERMISSION_DENIED',
  },
  {
    name: '7. Agent Posts Warehouse Movement',
    collection: 'stock_movements/mov_1',
    operation: 'create',
    auth: { uid: 'agent_1', email: 'agent@example.com', emailVerified: true, role: 'agent' },
    payload: { id: 'mov_1', productId: 'prod_1', type: 'receipt', quantityDelta: 500, actorUid: 'agent_1' },
    expected: 'PERMISSION_DENIED',
  },
  {
    name: '8. Warehouse Ledger Mutation',
    collection: 'stock_movements/mov_1',
    operation: 'delete',
    auth: { uid: 'wh_1', email: 'wh@example.com', emailVerified: true, role: 'warehouse_staff' },
    existing: { id: 'mov_1', productId: 'prod_1', type: 'receipt', quantityDelta: 500 },
    expected: 'PERMISSION_DENIED',
  },
  {
    name: '9. Warehouse Reads Commission Agreement',
    collection: 'commission_agreements/agr_1',
    operation: 'get',
    auth: { uid: 'wh_1', email: 'wh@example.com', emailVerified: true, role: 'warehouse_staff' },
    existing: { id: 'agr_1', importerId: 'imp_1', feeType: 'percentage', rateValue: 2.5 },
    expected: 'PERMISSION_DENIED',
  },
  {
    name: '10. Terminal Order Tampering after collection',
    collection: 'orders/ord_1',
    operation: 'update',
    auth: { uid: 'wh_1', email: 'wh@example.com', emailVerified: true, role: 'warehouse_staff' },
    existing: { id: 'ord_1', status: 'collected', quantity: 50 },
    payload: { id: 'ord_1', status: 'cancelled', quantity: 50 },
    expected: 'PERMISSION_DENIED',
  },
  {
    name: '11. Shadow Field Injection on public inquiry',
    collection: 'inquiries/inq_1',
    operation: 'create',
    auth: null,
    payload: { id: 'inq_1', productId: 'prod_1', status: 'new', isVerified: true },
    expected: 'PERMISSION_DENIED',
  },
  {
    name: '12. Resource Poisoning / Invalid Path ID',
    collection: 'products/../../admin_override',
    operation: 'create',
    auth: { uid: 'agent_1', email: 'agent@example.com', emailVerified: true, role: 'agent' },
    payload: { id: '../../admin_override', status: 'pending_review' },
    expected: 'PERMISSION_DENIED',
  },
];
