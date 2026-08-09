/** Stock photography for catalog products (Unsplash). Used when `image` is missing. */
export const PRODUCT_IMAGES_BY_ID = {
  1: "https://images.unsplash.com/photo-1564257631407-4deb1f99d992?w=900&q=65&auto=format&fit=crop",
  2: "https://images.unsplash.com/photo-1594938298603-c8148c4dae35?w=900&q=65&auto=format&fit=crop",
  3: "https://images.unsplash.com/photo-1584917865442-de89df76afd3?w=900&q=65&auto=format&fit=crop",
  4: "https://images.unsplash.com/photo-1594633312681-425c7b97ccd1?w=900&q=65&auto=format&fit=crop",
  5: "https://images.unsplash.com/photo-1614252238874-99288389fd30?w=900&q=65&auto=format&fit=crop",
  6: "https://images.unsplash.com/photo-1520903921690-38899979b825?w=900&q=65&auto=format&fit=crop",
  7: "https://images.unsplash.com/photo-1595777457583-95e059d581b8?w=900&q=65&auto=format&fit=crop",
  8: "https://images.unsplash.com/photo-1473966962634-6d54e062c87a?w=900&q=65&auto=format&fit=crop",
  9: "https://images.unsplash.com/photo-1535632066927-ab7c754b467f?w=900&q=65&auto=format&fit=crop",
  10: "https://images.unsplash.com/photo-1596783074918-84b8414ab73a?w=900&q=65&auto=format&fit=crop",
  11: "https://images.unsplash.com/photo-1620799140408-edc6dcb6e633?w=900&q=65&auto=format&fit=crop",
  12: "https://images.unsplash.com/photo-1553062407-98eeb64c6a62?w=900&q=65&auto=format&fit=crop",
  13: "https://images.unsplash.com/photo-1519238263530-0a9d3e99446a?w=900&q=65&auto=format&fit=crop",
  14: "https://images.unsplash.com/photo-1503919545889-aef32e66f22c?w=900&q=65&auto=format&fit=crop",
  15: "https://images.unsplash.com/photo-1522771930-783f89d76985?w=900&q=65&auto=format&fit=crop",
  16: "https://images.unsplash.com/photo-1514098040524-4e456c594813?w=900&q=65&auto=format&fit=crop",
  17: "https://images.unsplash.com/photo-1519340241574-2cec6aef0c01?w=900&q=65&auto=format&fit=crop",
  18: "https://images.unsplash.com/photo-1516726817505-f5ed825624d8?w=900&q=65&auto=format&fit=crop",
  19: "https://images.unsplash.com/photo-1503919005314-30d93d07d823?w=900&q=65&auto=format&fit=crop",
  20: "https://images.unsplash.com/photo-1470071459604-3b5ec3a7fe05?w=900&q=65&auto=format&fit=crop",
};

export const CATEGORY_FALLBACK_IMAGES = {
  Women: "https://images.unsplash.com/photo-1487412720507-e7ab37603c6f?w=900&q=65&auto=format&fit=crop",
  Men: "https://images.unsplash.com/photo-1617137968427-85924c800a22?w=900&q=65&auto=format&fit=crop",
  Kids: "https://images.unsplash.com/photo-1519238263530-0a9d3e99446a?w=900&q=65&auto=format&fit=crop",
  Accessories: "https://images.unsplash.com/photo-1548036328-c9fa89d128fa?w=900&q=65&auto=format&fit=crop",
};

const GENERIC =
  "https://images.unsplash.com/photo-1445205170230-053b83016050?w=900&q=65&auto=format&fit=crop";

export function getProductImage(product) {
  const url = typeof product?.image === "string" ? product.image.trim() : "";
  if (url) return url;
  if (product?.id != null && PRODUCT_IMAGES_BY_ID[product.id]) {
    return PRODUCT_IMAGES_BY_ID[product.id];
  }
  const cat = product?.category;
  if (cat && CATEGORY_FALLBACK_IMAGES[cat]) return CATEGORY_FALLBACK_IMAGES[cat];
  return GENERIC;
}

/** Returns an array of all photo URLs for a product's gallery. Falls back to the single `image`. */
export function getProductImages(product) {
  if (Array.isArray(product?.images) && product.images.length > 0) {
    const cleaned = product.images
      .filter(u => typeof u === "string" && u.trim())
      .map(u => u.trim());
    if (cleaned.length > 0) return cleaned;
  }
  const single = getProductImage(product);
  return single ? [single] : [];
}

/** Strip legacy `emoji` and ensure every product has a photo URL + gallery array. */
export function normalizeProduct(raw) {
  if (!raw || typeof raw !== "object") return raw;
  const { emoji: _emoji, ...rest } = raw;
  const cover = getProductImage(rest);
  const images = Array.isArray(rest.images)
    ? rest.images.filter(u => typeof u === "string" && u.trim()).map(u => u.trim())
    : [];
  return { ...rest, image: cover, images: images.length > 0 ? images : [cover] };
}

export function normalizeProductList(list) {
  return Array.isArray(list) ? list.map(normalizeProduct) : [];
}
