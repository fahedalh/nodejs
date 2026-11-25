import { findProduct } from './products.js';

export const SHIPPING_FLAT = 6;
export const FREE_SHIPPING_OVER = 75;

// Prices a cart from the catalogue. Used by the API, and by the static demo build.
export function priceCart(items) {
  if (!Array.isArray(items) || items.length === 0) throw new Error('Cart is empty');
  if (items.length > 50) throw new Error('Too many line items');

  const lines = items.map((item) => {
    const product = findProduct(item?.productId);
    if (!product) throw new Error(`Unknown product: ${item?.productId}`);
    const color = product.colors.find((c) => c.id === item.colorId);
    if (!color) throw new Error(`Invalid colour for ${product.name}`);
    if (!product.sizes.includes(item.size)) throw new Error(`Invalid size for ${product.name}`);
    const qty = Number(item.qty);
    if (!Number.isInteger(qty) || qty < 1 || qty > 20) throw new Error('Quantity must be 1–20');
    return {
      productId: product.id,
      name: product.name,
      color: color.name,
      size: item.size,
      qty,
      unitPrice: product.price,
      lineTotal: product.price * qty
    };
  });

  const subtotal = lines.reduce((s, l) => s + l.lineTotal, 0);
  const shipping = subtotal >= FREE_SHIPPING_OVER ? 0 : SHIPPING_FLAT;
  return { lines, subtotal, shipping, total: subtotal + shipping };
}
