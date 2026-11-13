# TradeLink Firestore Security Specification

## 1. Data Invariants
1. **Approved-Only Public Catalogue**: Unauthenticated visitors and non-owning users can read `/products/{productId}` ONLY when `resource.data.status == 'approved'`.
2. **No Self-Approval or Stock Spoofing by Agents**: Agents may create products only with `status == 'pending_review'` and zero stock (`onHandQty == 0`, `reservedQty == 0`, `availableQty == 0`), and may never update `status` to `'approved'` or alter stock quantities.
3. **Immutable Warehouse Stock Ledger**: `/stock_movements/{movementId}` records are append-only (`update` and `delete` denied for all roles). Only Warehouse Staff or Admin may post movements, and `actorUid` must equal `request.auth.uid`.
4. **No Warehouse Access to Commission Settings**: Warehouse staff cannot read or modify `/commission_agreements/{agreementId}` or `/commission_ledger/{entryId}`.
5. **PII Isolation & Anti-Escalation**: `/users/{userId}` restricts `get` to `isOwner(userId)` or `isAdmin()`, and forbids users from changing their own `role` or `active` fields.
6. **Terminal Order Locking**: Once `/orders/{orderId}` reaches `status == 'collected'` or `'cancelled'`, non-admin users cannot modify it.
7. **Server-Enforced Timestamps & Bounded Strings**: Every document write validates `createdAt == request.time` (on create) and `updatedAt == request.time` (on create/update where applicable), strict `keys().hasAll` + `keys().hasOnly`, ID regex `^[a-zA-Z0-9_\-]+$`, and explicit `.size()` bounds on all strings.

## 2. The "Dirty Dozen" Adversarial Payloads
1. **Self-Role Escalation**: User creates `/users/{uid}` with `role: 'admin'`. -> `PERMISSION_DENIED`.
2. **Profile Role Tampering**: Authenticated agent updates `/users/{uid}` changing `role` from `'agent'` to `'admin'`. -> `PERMISSION_DENIED`.
3. **Agent Self-Approval**: Agent creates `/products/{id}` with `status: 'approved'`. -> `PERMISSION_DENIED`.
4. **Agent Stock Inflation**: Agent updates own product's `onHandQty` or `availableQty` directly. -> `PERMISSION_DENIED`.
5. **Agent Cross-Ownership Edit**: Agent A updates Agent B's product listing. -> `PERMISSION_DENIED`.
6. **Public Unapproved Product Read**: Unauthenticated client reads `/products/{id}` where `status == 'pending_review'`. -> `PERMISSION_DENIED`.
7. **Agent Posts Warehouse Movement**: Agent attempts to create `/stock_movements/{id}`. -> `PERMISSION_DENIED`.
8. **Ledger Mutation**: Warehouse staff attempts to `update` or `delete` `/stock_movements/{id}`. -> `PERMISSION_DENIED`.
9. **Warehouse Reads Commission Agreement**: Warehouse staff attempts to `get` or `list` `/commission_agreements`. -> `PERMISSION_DENIED`.
10. **Terminal Order Tampering**: Warehouse staff or Agent attempts to modify `/orders/{id}` after `status == 'collected'`. -> `PERMISSION_DENIED`.
11. **Shadow / Ghost Field Injection**: Client submits `/inquiries/{id}` with extra field `isVerified: true`. -> `PERMISSION_DENIED`.
12. **Resource Poisoning / Oversized ID**: Client creates document with 500-char ID or invalid characters (`../admin`). -> `PERMISSION_DENIED`.
