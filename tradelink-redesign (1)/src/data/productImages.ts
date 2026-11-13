import heroWarehouseImg from '../assets/images/hero_tradelink_warehouse_1794509580015.jpg';
import basmatiRiceImg from '../assets/images/product_basmati_rice_1794509580764.jpg';
import cookingOilImg from '../assets/images/product_cooking_oil_1794509582078.jpg';
import wheatFlourImg from '../assets/images/product_wheat_flour_1794509581591.jpg';
import sugarLentilsImg from '../assets/images/product_sugar_lentils_1794509581757.jpg';
import type { ProductCategory } from '../types/tradelink';

export const HERO_WAREHOUSE_IMAGE = heroWarehouseImg;

export const CATEGORY_IMAGES: Record<ProductCategory, string> = {
  rice: basmatiRiceImg,
  flour: wheatFlourImg,
  sugar: sugarLentilsImg,
  cooking_oil: cookingOilImg,
  dates: sugarLentilsImg,
  pasta: wheatFlourImg,
  beans: sugarLentilsImg,
  other_food: basmatiRiceImg,
};

export const PRODUCT_PHOTO_PRESETS = [
  { key: 'preset:rice', label: 'Basmati & Long Grain Rice (25kg / 50kg)', url: basmatiRiceImg },
  { key: 'preset:cooking_oil', label: 'Refined Cooking Oil (20L / 5L)', url: cookingOilImg },
  { key: 'preset:flour', label: 'Wheat Flour & Durum Pasta', url: wheatFlourImg },
  { key: 'preset:sugar_pulses', label: 'Cane Sugar, Dates & Beans', url: sugarLentilsImg },
];

export function resolveProductImage(photoUrl?: string, category?: ProductCategory): string {
  if (photoUrl && photoUrl.trim().length > 0) {
    if (photoUrl === 'preset:rice' || photoUrl === 'preset:rice_grains') return basmatiRiceImg;
    if (photoUrl === 'preset:cooking_oil') return cookingOilImg;
    if (photoUrl === 'preset:flour' || photoUrl === 'preset:flour_pasta') return wheatFlourImg;
    if (photoUrl === 'preset:sugar_pulses' || photoUrl === 'preset:sugar_sweeteners') return sugarLentilsImg;
    return photoUrl;
  }
  return category ? CATEGORY_IMAGES[category] : basmatiRiceImg;
}
