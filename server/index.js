import express from 'express';
import cors from 'cors';
import { randomUUID } from 'node:crypto';
import { mkdir, readFile, writeFile } from 'node:fs/promises';
import { existsSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { products, findProduct } from './products.js';
import { priceCart, SHIPPING_FLAT, FREE_SHIPPING_OVER } from './pricing.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const PORT = process.env.PORT || 4000;
const DATA_DIR = path.join(__dirname, 'data');
const ORDERS_FILE = path.join(DATA_DIR, 'orders.json');
const CLIENT_DIST = path.join(__dirname, '..', 'client', 'dist');

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
