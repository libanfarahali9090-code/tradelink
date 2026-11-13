import type { Product, PublicListing } from '../types/tradelink';
import { getAvailability } from './contact';

/** Copy only the fields that are safe to show publicly. Never spread the product here. */
export function toPublicListing(product: Product): PublicListing {
  return {
    id: product.id,
    sku: product.sku,
    name: product.name,
    nameSo: product.nameSo,
    nameAm: product.nameAm,
    category: product.category,
    description: product.description,
    unit: product.unit,
    origin: product.origin,
    expiryDate: product.expiryDate,
    photoUrl: product.photoUrl,
    availability: getAvailability(product),
    stockQty: product.stockQty,
    agentId: product.agentId,
    collectionLocation: product.collectionLocation,
    warehouseBay: product.warehouseBay,
    stockUpdatedAt: product.stockUpdatedAt,
  };
}
