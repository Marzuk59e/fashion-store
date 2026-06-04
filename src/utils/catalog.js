import { DEFAULT_PRODUCTS } from "../data/catalog.js";
import { normalizeProductList } from "../data/productImages.js";
import { MIN_KIDS_PRODUCTS } from "../constants/checkout.js";

export function enrichCatalogWithKidsFallback(list) {
  const normalized = normalizeProductList(Array.isArray(list) ? list : []);
  const fallbackKids = normalizeProductList(DEFAULT_PRODUCTS).filter((p) => p.category === "Kids");
  const byId = new Map(normalized.map((p) => [p.id, p]));
  const kidsCount = normalized.filter((p) => p.category === "Kids").length;
  if (kidsCount >= MIN_KIDS_PRODUCTS) return normalized;

  for (const fp of fallbackKids) {
    if (!byId.has(fp.id)) {
      normalized.push(fp);
      byId.set(fp.id, fp);
    }
    if (normalized.filter((p) => p.category === "Kids").length >= MIN_KIDS_PRODUCTS) break;
  }
  return normalized;
}
