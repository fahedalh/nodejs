import express from 'express';
import cors from 'cors';
import { randomUUID } from 'node:crypto';
import { mkdir, readFile, writeFile } from 'node:fs/promises';
import { existsSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { products, findProduct } from './products.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const PORT = process.env.PORT || 4000;
const DATA_DIR = path.join(__dirname, 'data');
const ORDERS_FILE = path.join(DATA_DIR, 'orders.json');
const CLIENT_DIST = path.join(__dirname, '..', 'client', 'dist');

const SHIPPING_FLAT = 6;
const FREE_SHIPPING_OVER = 75;

const app = express();
app.use(cors());
app.use(express.json({ limit: '50kb' }));

// --- Orders persistence (simple JSON file; swap for a DB in production) ---
async function loadOrders() {
  try {
    return JSON.parse(await readFile(ORDERS_FILE, 'utf8'));
  } catch {
    return [];
  }
}
async function saveOrders(orders) {
  await mkdir(DATA_DIR, { recursive: true });
  await writeFile(ORDERS_FILE, JSON.stringify(orders, null, 2));
}

// --- Pricing: always computed server-side from the catalogue ---
function priceCart(items) {
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

// --- API ---
app.get('/api/health', (_req, res) => res.json({ ok: true }));

app.get('/api/products', (_req, res) => {
  res.json({ products, shipping: { flat: SHIPPING_FLAT, freeOver: FREE_SHIPPING_OVER } });
});

app.get('/api/products/:id', (req, res) => {
  const product = findProduct(req.params.id);
  if (!product) return res.status(404).json({ error: 'Not found' });
  res.json(product);
});

app.post('/api/cart/quote', (req, res) => {
  try {
    res.json(priceCart(req.body?.items));
  } catch (e) {
    res.status(400).json({ error: e.message });
  }
});

app.post('/api/orders', async (req, res) => {
  const { items, customer } = req.body ?? {};
  const name = String(customer?.name ?? '').trim();
  const email = String(customer?.email ?? '').trim();
  if (name.length < 2 || name.length > 100) return res.status(400).json({ error: 'Please enter your name' });
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email) || email.length > 200)
    return res.status(400).json({ error: 'Please enter a valid email' });

  try {
    const quote = priceCart(items);
    const order = {
      id: 'PS-' + randomUUID().slice(0, 8).toUpperCase(),
      createdAt: new Date().toISOString(),
      customer: { name, email },
      ...quote
    };
    const orders = await loadOrders();
    orders.push(order);
    await saveOrders(orders);
    res.status(201).json(order);
  } catch (e) {
    res.status(400).json({ error: e.message });
  }
});

app.use('/api', (_req, res) => res.status(404).json({ error: 'Not found' }));

// --- Serve the built React app in production ---
if (existsSync(CLIENT_DIST)) {
  app.use(express.static(CLIENT_DIST, { maxAge: '1h', index: false }));
  app.get('*', (_req, res) => res.sendFile(path.join(CLIENT_DIST, 'index.html')));
}

app.listen(PORT, () => console.log(`API listening on http://localhost:${PORT}`));
