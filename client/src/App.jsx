import { lazy, Suspense, useEffect, useState } from 'react';
import { api } from './api.js';
import { useCart } from './cart.jsx';
import CartDrawer from './components/CartDrawer.jsx';
import Configurator from './components/Configurator.jsx';
import Faq from './components/Faq.jsx';

const HeroScene = lazy(() => import('./three/Scenes.jsx').then((m) => ({ default: m.HeroScene })));

export default function App() {
  const [catalog, setCatalog] = useState(null);
  const [error, setError] = useState('');
  const [activeId, setActiveId] = useState('hoodie');
  const { count, setOpen } = useCart();
  const [hidden, setHidden] = useState(false);

  useEffect(() => {
    api.products().then(setCatalog).catch((e) => setError(e.message));
  }, []);

  // Header hides on scroll down, returns on scroll up.
  useEffect(() => {
    let last = window.scrollY;
    const onScroll = () => {
      const y = window.scrollY;
      setHidden(y > last && y > 120);
      last = y;
    };
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  const products = catalog?.products ?? [];
  const active = products.find((p) => p.id === activeId);

  const pick = (id) => {
    setActiveId(id);
    document.getElementById('studio')?.scrollIntoView({ behavior: 'smooth' });
  };

  return (
    <>
      <header className={`header ${hidden ? 'is-hidden' : ''}`}>
        <a href="#top" className="logo" aria-label="Polygon Supply home">
          <svg viewBox="0 0 32 32" width="26" height="26" aria-hidden="true">
            <path d="M16 4 L28 26 H4 Z" fill="none" stroke="currentColor" strokeWidth="3" strokeLinejoin="round" />
            <path d="M16 4 L16 18 M28 26 L16 18 M4 26 L16 18" stroke="currentColor" strokeWidth="1.5" />
            <circle cx="16" cy="18" r="3" fill="var(--accent)" />
          </svg>
          <span>Polygon&nbsp;Supply</span>
        </a>
        <nav className="nav">
          <a href="#drop">Drop</a>
          <a href="#studio">Studio</a>
          <a href="#faq">FAQ</a>
        </nav>
        <button className="cart-btn" onClick={() => setOpen(true)} aria-label={`Open cart, ${count} items`}>
          Cart <span className="badge">{count}</span>
        </button>
      </header>

      <main id="top">
        <section className="hero">
          <div className="hero-copy">
            <p className="eyebrow mono">// drop_001.glb — now rendering</p>
            <h1>
              <span className="hl">Merch you can</span>
              <span className="hl">
                <em>orbit</em> before
              </span>
              <span className="hl">you buy it.</span>
            </h1>
            <p className="lede">
              Hoodies, tees, mugs and stickers — modelled in real-time 3D. Drag them, dye them, then wear them.
            </p>
            <div className="cta-row">
              <a href="#studio" className="btn btn-primary">Open the studio</a>
              <a href="#drop" className="btn btn-ghost">See the drop ↓</a>
            </div>
          </div>
          <div className="hero-canvas">
            <span className="corner tl" /><span className="corner tr" /><span className="corner bl" /><span className="corner br" />
            <span className="canvas-label mono">viewport · perspective</span>
            <Suspense fallback={<div className="canvas-fallback mono">loading meshes…</div>}>
              <HeroScene />
            </Suspense>
          </div>
        </section>

        <section className="statement">
          <p>
            Every item here is <mark>a mesh first</mark> and a garment second — built in code, lit in a virtual
            studio, and printed only when you order.
          </p>
        </section>

        <section id="drop" className="drop">
          <div className="section-head">
            <h2>The drop</h2>
            <span className="mono muted">{products.length} objects · scroll →</span>
          </div>
          {error && <p className="error">Couldn't reach the API: {error}. Is the server running?</p>}
          <div className="strip">
            {products.map((p, i) => (
              <button key={p.id} className={`card ${p.id === activeId ? 'is-active' : ''}`} onClick={() => pick(p.id)}>
                <span className="mono card-idx">0{i + 1}</span>
                <span className="card-art" style={{ '--c': p.colors[0].hex }}>
                  <CardGlyph model={p.model} />
                </span>
                <span className="card-name">{p.name}</span>
                <span className="card-meta">
                  <span className="dots">
                    {p.colors.map((c) => (
                      <i key={c.id} style={{ background: c.hex }} title={c.name} />
                    ))}
                  </span>
                  <span className="mono">${p.price}</span>
                </span>
              </button>
            ))}
          </div>
        </section>

        {active && <Configurator product={active} products={products} onPick={setActiveId} />}

        <section className="specs">
          <div className="section-head">
            <h2>Size chart</h2>
            <span className="mono muted">cm · laid flat</span>
          </div>
          <div className="table-wrap">
            <table>
              <thead>
                <tr><th>Size</th><th>Chest</th><th>Length</th><th>Sleeve</th></tr>
              </thead>
              <tbody>
                {[['S', 54, 70, 62], ['M', 57, 72, 63], ['L', 60, 74, 64], ['XL', 63, 76, 65], ['XXL', 66, 78, 66]].map((r) => (
                  <tr key={r[0]}>{r.map((v, i) => <td key={i}>{v}</td>)}</tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>

        <Faq />
      </main>

      <footer className="footer">
        <div className="footer-big">POLYGON<br />SUPPLY</div>
        <div className="footer-links">
          <a href="#drop">Shop</a>
          <a href="#studio">Studio</a>
          <a href="#faq">Help</a>
        </div>
        <div className="statusbar mono">
          <span>● api {error ? 'offline' : 'online'}</span>
          <span>three.js · react · node</span>
          <span>UTF-8</span>
          <span>© {new Date().getFullYear()}</span>
        </div>
      </footer>

      <CartDrawer products={products} shipping={catalog?.shipping} />
    </>
  );
}

function CardGlyph({ model }) {
  const paths = {
    hoodie: 'M30 18 Q40 8 50 18 L66 26 L74 70 L64 72 L60 40 L60 82 L20 82 L20 40 L16 72 L6 70 L14 26 Z',
    tee: 'M30 16 Q40 24 50 16 L72 26 L66 40 L58 36 L58 82 L22 82 L22 36 L14 40 L8 26 Z',
    mug: 'M18 20 H56 V78 Q56 82 52 82 H22 Q18 82 18 78 Z M56 34 Q72 34 72 50 Q72 64 56 64',
    stickers: 'M40 10 L48 30 L70 30 L52 44 L60 66 L40 52 L20 66 L28 44 L10 30 L32 30 Z'
  };
  return (
    <svg viewBox="0 0 80 92" aria-hidden="true">
      <path d={paths[model]} fill="var(--c)" stroke="var(--ink)" strokeWidth="2.5" strokeLinejoin="round" />
    </svg>
  );
}
