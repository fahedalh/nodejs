import { useEffect, useState } from 'react';
import { api, isStatic } from '../api.js';
import { useCart } from '../cart.jsx';

export default function CartDrawer({ products, shipping }) {
  const { items, open, setOpen, setQty, clear, keyOf } = useCart();
  const [quote, setQuote] = useState(null);
  const [step, setStep] = useState('cart'); // cart | checkout | done
  const [form, setForm] = useState({ name: '', email: '' });
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const [order, setOrder] = useState(null);

  // Prices always come from the server.
  useEffect(() => {
    if (!items.length) return setQuote(null);
    let live = true;
    api.quote(items).then((q) => live && setQuote(q)).catch((e) => live && setError(e.message));
    return () => {
      live = false;
    };
  }, [items]);

  useEffect(() => {
    const onKey = (e) => e.key === 'Escape' && setOpen(false);
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [setOpen]);

  useEffect(() => {
    if (open && step === 'done') {
      setStep('cart');
      setOrder(null);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open]);

  const submit = async (e) => {
    e.preventDefault();
    setBusy(true);
    setError('');
    try {
      const o = await api.order(items, form);
      setOrder(o);
      setStep('done');
      clear();
    } catch (err) {
      setError(err.message);
    } finally {
      setBusy(false);
    }
  };

  const lookup = (item) => {
    const p = products.find((x) => x.id === item.productId);
    const c = p?.colors.find((x) => x.id === item.colorId);
    return { p, c };
  };

  return (
    <>
      <div className={`scrim ${open ? 'is-open' : ''}`} onClick={() => setOpen(false)} />
      <aside className={`drawer ${open ? 'is-open' : ''}`} aria-hidden={!open} aria-label="Cart">
        <div className="drawer-head">
          <h2>{step === 'done' ? 'Order placed' : step === 'checkout' ? 'Checkout' : 'Cart'}</h2>
          <button className="icon-btn" onClick={() => setOpen(false)} aria-label="Close cart">✕</button>
        </div>

        {step === 'done' && order && (
          <div className="drawer-body done">
            <div className="done-mark">✓</div>
            <p>Thanks, {order.customer.name.split(' ')[0]}! Your order is queued for printing.</p>
            <p className="mono order-id">{order.id}</p>
            <p className="muted">Total charged: ${order.total.toFixed(2)} (demo — no payment taken)</p>
            <button className="btn btn-primary btn-block" onClick={() => setOpen(false)}>Keep browsing</button>
          </div>
        )}

        {step !== 'done' && !items.length && (
          <div className="drawer-body empty">
            <p className="mono muted">cart.length === 0</p>
            <p>Nothing here yet. Spin something in the studio.</p>
          </div>
        )}

        {step !== 'done' && items.length > 0 && (
          <>
            <div className="drawer-body">
              {step === 'cart' &&
                items.map((item) => {
                  const { p, c } = lookup(item);
                  const k = keyOf(item);
                  return (
                    <div className="line" key={k}>
                      <span className="line-swatch" style={{ background: c?.hex }} />
                      <div className="line-info">
                        <strong>{p?.name ?? item.productId}</strong>
                        <span className="muted">{c?.name} · {item.size}</span>
                      </div>
                      <div className="qty small">
                        <button onClick={() => setQty(k, item.qty - 1)} aria-label="Decrease">−</button>
                        <span className="mono">{item.qty}</span>
                        <button onClick={() => setQty(k, item.qty + 1)} aria-label="Increase">+</button>
                      </div>
                      <span className="mono line-price">${(p?.price ?? 0) * item.qty}</span>
                    </div>
                  );
                })}

              {step === 'checkout' && (
                <form id="checkout" className="checkout" onSubmit={submit}>
                  <label>
                    Name
                    <input required minLength={2} value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} autoComplete="name" />
                  </label>
                  <label>
                    Email
                    <input required type="email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} autoComplete="email" />
                  </label>
                  <p className="muted small-print">{isStatic ? 'Preview build — nothing is sent or charged.' : 'Demo store — orders are saved by the Node API, no payment is taken.'}</p>
                </form>
              )}
            </div>

            <div className="drawer-foot">
              {quote && (
                <dl className="totals">
                  <div><dt>Subtotal</dt><dd>${quote.subtotal.toFixed(2)}</dd></div>
                  <div>
                    <dt>Shipping</dt>
                    <dd>{quote.shipping ? `$${quote.shipping.toFixed(2)}` : 'Free'}</dd>
                  </div>
                  <div className="grand"><dt>Total</dt><dd>${quote.total.toFixed(2)}</dd></div>
                </dl>
              )}
              {shipping && quote && quote.shipping > 0 && (
                <p className="muted small-print">Add ${(shipping.freeOver - quote.subtotal).toFixed(2)} more for free shipping.</p>
              )}
              {error && <p className="error">{error}</p>}
              {step === 'cart' ? (
                <button className="btn btn-primary btn-block" onClick={() => { setError(''); setStep('checkout'); }}>
                  Checkout
                </button>
              ) : (
                <div className="foot-row">
                  <button className="btn btn-ghost" onClick={() => setStep('cart')}>← Back</button>
                  <button className="btn btn-primary" form="checkout" type="submit" disabled={busy}>
                    {busy ? 'Placing…' : 'Place order'}
                  </button>
                </div>
              )}
            </div>
          </>
        )}
      </aside>
    </>
  );
}
