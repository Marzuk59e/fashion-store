// ─── Run once if Excel upload fails: npm install xlsx ────────
import { getProductImage, normalizeProduct } from "../../data/productImages.js";

export async function parseExcelFile(file) {
  let XLSX;
  try { XLSX = await import("xlsx"); }
  catch { throw new Error("xlsx package not found. Run: npm install xlsx"); }

  const buffer = await file.arrayBuffer();
  const wb = XLSX.read(buffer, { type: "array" });
  const ws = wb.Sheets[wb.SheetNames[0]];
  const rows = XLSX.utils.sheet_to_json(ws, { defval: "" });

  if (!rows.length) throw new Error("Excel file is empty.");

  return rows
    .map((row, i) => {
      const bgRaw    = String(row.bg    || "#F5EEE6,#EDE4D8");
      const sizesRaw = String(row.sizes || "S,M,L");
      return {
        id:       Number(row.id) || (Date.now() + i),
        name:     String(row.name     || "").trim(),
        brand:    String(row.brand    || "").trim(),
        price:    Number(row.price)   || 0,
        category: String(row.category || "Women").trim(),
        sizes:    sizesRaw.split(",").map(s => s.trim()).filter(Boolean),
        badge:    row.badge ? String(row.badge).trim() : null,
        bg:       bgRaw.split(",").map(s => s.trim()).filter(Boolean),
        desc:     String(row.desc || "").trim(),
        ...(String(row.image || "").trim() ? { image: String(row.image || "").trim() } : {}),
        ...(row.compareAt ? { compareAt: Number(row.compareAt) } : {}),
      };
    })
    .map(normalizeProduct)
    .filter(p => p.name);
}
