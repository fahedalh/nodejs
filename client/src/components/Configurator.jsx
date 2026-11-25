import { lazy, Suspense, useEffect, useState } from 'react';
import { useCart } from '../cart.jsx';

const ProductStage = lazy(() => import('../three/Scenes.jsx').then((m) => ({ default: m.ProductStage })));

export default function Configurator({ product, products, onPick }) {
  const [colorId, setColorId] = useState(product.colors[0].id);
  const [size, setSize] = useState(product.sizes.includes('M') ? 'M' : product.sizes[0]);
  const [qty, setQty] = useState(1);
  const [added, setAdded] = useState(false);
  const { add } = useCart();

  // Reset options when switching product (keeps the same WebGL canvas alive).
  useEffect(() => {
    setColorId(product.colors[0].id);
    setSize(product.sizes.includes('M') ? 'M' : product.sizes[0]);
    setQty(1);
  }, [product]);
  const color = product.colors.find((c) => c.id === colorId) ?? product.colors[0];

  const addToCart = () => {
    add({ productId: product.id, colorId: color.id, size, qty });
    setAdded(true);
    setTimeout(() => setAdded(false), 1400);
  };

  return (
    <section id="studio" className="studio">
      <div className="tabs" role="tablist" aria-label="Products">
        {products.map((p) => (
          <button
            key={p.id}
            role="tab"
            aria-selected={p.id === product.id}
            className={`tab mono ${p.id === product.id ? 'is-active' : ''}`}
            onClick={() => onPick(p.id)}
          >
            {p.id}.glb
          </button>
        ))}
      </div>

      <div className="studio-grid">
        <div className="stage">
          <div className="selection">
            <span className="handle h1" /><span className="handle h2" /><span className="handle h3" /><span className="handle h4" />
            <span className="sel-label mono">
              {product.name} · {color.name}
            </span>
          </div>
          <Suspense fallback={<div className="canvas-fallback mono">compiling shaders…</div>}>
            <ProductStage model={product.model} color={color.hex} />
          </Suspense>
          <p className="hint mono">drag to rotate</p>
        </div>

        <aside className="panel">
          <div className="panel-row mono muted">inspector</div>
          <h2 className="p-name">{product.name}</h2>
          <p className="p-price">${product.price}</p>
          <p className="p-tag">{product.tagline}</p>

          <fieldset>
            <legend className="mono">fill · {color.name}</legend>
            <div className="swatches">
              {product.colors.map((c) => (
                <button
                  key={c.id}
                  className={`swatch ${c.id === colorId ? 'is-active' : ''}`}
                  style={{ background: c.hex }}
                  onClick={() => setColorId(c.id)}
                  aria-label={c.name}
                  aria-pressed={c.id === colorId}
                  title={c.name}
                />
              ))}
            </div>
          </fieldset>

          {product.sizes.length > 1 && (
            <fieldset>
              <legend className="mono">size</legend>
              <div className="sizes">
                {product.sizes.map((s) => (
                  <button key={s} className={`size ${s === size ? 'is-active' : ''}`} onClick={() => setSize(s)} aria-pressed={s === size}>
                    {s}
                  </button>
                ))}
              </div>
            </fieldset>
          )}

          <fieldset>
            <legend className="mono">quantity</legend>
            <div className="qty">
              <button onClick={() => setQty((q) => Math.max(1, q - 1))} aria-label="Decrease">−</button>
              <span className="mono">{qty}</span>
              <button onClick={() => setQty((q) => Math.min(20, q + 1))} aria-label="Increase">+</button>
            </div>
          </fieldset>

          <button className="btn btn-primary btn-block" onClick={addToCart}>
            {added ? '✓ Added to cart' : `Add to cart — $${product.price * qty}`}
          </button>

          <ul className="details">
            {product.details.map((d) => (
              <li key={d}>{d}</li>
            ))}
          </ul>
        </aside>
      </div>
    </section>
  );
}
