/* ─── Product list validator ────────────────────────────────── */
export function validateProductList(list) {
  if (!Array.isArray(list) || list.length === 0)
    return "Catalog must be a non-empty JSON array.";

  const seen = new Set();
  for (let i = 0; i < list.length; i++) {
    const p = list[i];
    if (!p || typeof p !== "object") return `Row ${i + 1}: invalid object.`;
    if (typeof p.id !== "number")     return `Row ${i + 1}: "id" must be a number.`;
    if (seen.has(p.id))               return `Duplicate id: ${p.id}.`;
    seen.add(p.id);

    for (const k of ["name", "brand", "price", "category", "sizes", "bg", "desc", "image"]) {
      if (!(k in p)) return `Row ${i + 1}: missing "${k}".`;
    }

    if (typeof p.name  !== "string" || !p.name.trim())   return `Row ${i + 1}: invalid name.`;
    if (typeof p.brand !== "string")                       return `Row ${i + 1}: invalid brand.`;
    if (typeof p.price !== "number" || p.price < 0)       return `Row ${i + 1}: invalid price.`;
    if (typeof p.category !== "string")                    return `Row ${i + 1}: invalid category.`;
    if (typeof p.image !== "string" || !p.image.trim())   return `Row ${i + 1}: product photo (image URL) is required.`;
    if (!Array.isArray(p.sizes) || p.sizes.length === 0)  return `Row ${i + 1}: sizes must be a non-empty array.`;
    if (!Array.isArray(p.bg)    || p.bg.length < 2)       return `Row ${i + 1}: bg must be [color, color].`;
    if (typeof p.desc !== "string")                        return `Row ${i + 1}: invalid desc.`;
  }
  return null;
}
