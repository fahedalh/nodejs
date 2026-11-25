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

export const api = {
  products: () => request('/products'),
  quote: (items) => request('/cart/quote', { method: 'POST', body: { items } }),
  order: (items, customer) => request('/orders', { method: 'POST', body: { items, customer } })
};
