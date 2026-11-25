# Polygon Supply — 3D merch store

A React + Three.js storefront backed by a Node.js/Express API. Every product (hoodie, tee, mug, sticker pack) is modelled **procedurally in code** with react-three-fiber — no model files to download — so colour changes are instant material "dyes".

## Stack

| Layer   | Tech |
|---------|------|
| Client  | React 18, Vite 5, three.js, @react-three/fiber, @react-three/drei |
| Server  | Node.js 18+, Express 4 |
| Data    | Product catalogue in `server/products.js`; orders saved to `server/data/orders.json` |

## Run it

```bash
npm install
npm run dev        # API on :4000, Vite on :5173 (proxies /api)
```

Production (one process serves the API and the built client):

```bash
npm run build
npm start          # http://localhost:4000
```

## Features

- **Hero viewport** — floating 3D products with pointer parallax and soft contact shadows.
- **The drop** — snap-scrolling product strip.
- **Studio** — per-product 3D stage (drag to rotate), design-tool selection box, colour swatches that dye the model, sizes, quantity.
- **Cart drawer** — persisted in `localStorage`; totals and shipping are always priced by the server.
- **Checkout** — validated `POST /api/orders` that re-prices the cart from the catalogue (demo: no payment).
- FAQ as a chat thread, size chart, editor-style status bar footer, reduced-motion support, mobile layout.

## API

| Method | Path | Description |
|--------|------|-------------|
| GET  | `/api/health` | Health check |
| GET  | `/api/products` | Catalogue + shipping rules |
| GET  | `/api/products/:id` | One product |
| POST | `/api/cart/quote` | `{ items }` → server-priced subtotal/shipping/total |
| POST | `/api/orders` | `{ items, customer: { name, email } }` → created order |

`items` = `[{ productId, colorId, size, qty }]`.

## Where things live

```
server/index.js            Express API + static hosting of client/dist
server/products.js         Catalogue (prices, colours, sizes)
client/src/three/models.jsx   Procedural Hoodie / Tee / Mug / Stickers + printed logo texture
client/src/three/Scenes.jsx   Hero scene, product stage, studio lighting
client/src/components/     Configurator, CartDrawer, Faq
```

To use real product scans instead, drop `.glb` files in `client/public/models/` and swap the component in `ProductModel` for drei's `useGLTF`.
