
export const fmt = (n) => `$${n.toLocaleString()}`;

export const saleDiscountPercent = (p) => {
  if (p.compareAt == null || p.compareAt <= p.price) return 0;
  return Math.round((1 - p.price / p.compareAt) * 100);
};

export const productMatchesSearch = (p, query) => {
  const words = query.trim().toLowerCase().split(/\s+/).filter(Boolean);
  if (words.length === 0) return false;
  const hay = `${p.name} ${p.brand} ${p.category}`.toLowerCase();
  return words.every((w) => hay.includes(w));
};

export const isOnSale = (p) => p.compareAt != null && p.compareAt > p.price;

