// Catalogue: single source of truth for products and prices.
// The client renders from this; the server re-prices every order from it.
export const products = [
  {
    id: 'hoodie',
    name: 'Vertex Hoodie',
    model: 'hoodie',
    price: 64,
    tagline: 'Heavyweight 400gsm fleece. Built like a low-poly mesh, feels like a cloud.',
    sizes: ['S', 'M', 'L', 'XL', 'XXL'],
    colors: [
      { id: 'black', name: 'Black', hex: '#1b1b1d' },
      { id: 'white', name: 'Off White', hex: '#efece4' },
      { id: 'grey', name: 'Heather Grey', hex: '#9a9a9e' },
      { id: 'burgundy', name: 'Burgundy', hex: '#6d1f2e' },
      { id: 'navy', name: 'Navy', hex: '#1d2a4a' }
    ],
    details: ['80% cotton / 20% polyester', 'Double-lined hood', 'Kangaroo pocket', 'Screen-printed front']
  },
  {
    id: 'tee',
    name: 'Wireframe Tee',
    model: 'tee',
    price: 32,
    tagline: 'Boxy fit, 220gsm combed cotton. The everyday render.',
    sizes: ['S', 'M', 'L', 'XL', 'XXL'],
    colors: [
      { id: 'white', name: 'Off White', hex: '#efece4' },
      { id: 'black', name: 'Black', hex: '#1b1b1d' },
      { id: 'grey', name: 'Heather Grey', hex: '#9a9a9e' },
      { id: 'burgundy', name: 'Burgundy', hex: '#6d1f2e' }
    ],
    details: ['100% combed cotton', 'Drop shoulder', 'Pre-shrunk', 'Water-based print']
  },
  {
    id: 'mug',
    name: 'Shader Mug',
    model: 'mug',
    price: 18,
    tagline: '11oz ceramic. Holds coffee, holds ideas, survives the dishwasher.',
    sizes: ['11oz'],
    colors: [
      { id: 'black', name: 'Matte Black', hex: '#202022' },
      { id: 'white', name: 'Gloss White', hex: '#f4f2ec' },
      { id: 'yellow', name: 'Signal Yellow', hex: '#ffcf3a' }
    ],
    details: ['Stoneware ceramic', 'Dishwasher safe', 'Microwave safe', 'Glazed interior']
  },
  {
    id: 'stickers',
    name: 'Primitive Sticker Pack',
    model: 'stickers',
    price: 9,
    tagline: 'Six die-cut vinyl stickers. Decorate the laptop you render on.',
    sizes: ['Pack of 6'],
    colors: [{ id: 'mixed', name: 'Mixed', hex: '#ffcf3a' }],
    details: ['Waterproof vinyl', 'Matte laminate', 'Up to 7.5cm', 'UV resistant']
  }
];

export const findProduct = (id) => products.find((p) => p.id === id);
