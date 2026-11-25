// Static demo build (npm run build:static) has no server: run the same
// catalogue and pricing code in the browser instead.
const STATIC = import.meta.env.VITE_STATIC === '1';

async function request(path, options = {}) {
  const res = await fetch(`/api${path}`, {
    headers: { 'Content-Type': 'application/json' },
    ...options,
    body: options.body ? JSON.stringify(options.body) : undefined
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(data.error || `Request failed (${res.status})`);
  return data;
}

async function local() {
  const [{ products }, pricing] = await Promise.all([
    import('../../server/products.js'),
    import('../../server/pricing.js')
  ]);
  return {
    products: async () => ({ products, shipping: { flat: pricing.SHIPPING_FLAT, freeOver: pricing.FREE_SHIPPING_OVER } }),
    quote: async (items) => pricing.priceCart(items),
    order: async (items, customer) => {
      const name = String(customer?.name ?? '').trim();
      const email = String(customer?.email ?? '').trim();
      if (name.length < 2) throw new Error('Please enter your name');
      if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) throw new Error('Please enter a valid email');
      const id = 'PS-' + Math.random().toString(16).slice(2, 10).toUpperCase();
      return { id, createdAt: new Date().toISOString(), customer: { name, email }, ...pricing.priceCart(items) };
    }
  };
}

const remote = {
  products: () => request('/products'),
  quote: (items) => request('/cart/quote', { method: 'POST', body: { items } }),
  order: (items, customer) => request('/orders', { method: 'POST', body: { items, customer } })
};

const impl = STATIC ? local() : Promise.resolve(remote);

export const isStatic = STATIC;
export const api = {
  products: () => impl.then((a) => a.products()),
  quote: (items) => impl.then((a) => a.quote(items)),
  order: (items, customer) => impl.then((a) => a.order(items, customer))
};
