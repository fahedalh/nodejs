import { createContext, useContext, useEffect, useMemo, useReducer } from 'react';

const CartContext = createContext(null);
const KEY = 'polygon-cart-v1';

const keyOf = (i) => `${i.productId}|${i.colorId}|${i.size}`;

function reducer(state, action) {
  switch (action.type) {
    case 'add': {
      const k = keyOf(action.item);
      const existing = state.items.find((i) => keyOf(i) === k);
      const items = existing
        ? state.items.map((i) => (keyOf(i) === k ? { ...i, qty: Math.min(20, i.qty + action.item.qty) } : i))
        : [...state.items, action.item];
      return { ...state, items, open: true };
    }
    case 'qty':
      return {
        ...state,
        items: state.items
          .map((i) => (keyOf(i) === action.key ? { ...i, qty: Math.max(0, Math.min(20, action.qty)) } : i))
          .filter((i) => i.qty > 0)
      };
    case 'clear':
      return { ...state, items: [] };
    case 'open':
      return { ...state, open: action.open };
    default:
      return state;
  }
}

function initial() {
  try {
    return { items: JSON.parse(localStorage.getItem(KEY)) || [], open: false };
  } catch {
    return { items: [], open: false };
  }
}

export function CartProvider({ children }) {
  const [state, dispatch] = useReducer(reducer, undefined, initial);
  useEffect(() => {
    try {
      localStorage.setItem(KEY, JSON.stringify(state.items));
    } catch {}
  }, [state.items]);

  const value = useMemo(
    () => ({
      items: state.items,
      open: state.open,
      count: state.items.reduce((n, i) => n + i.qty, 0),
      add: (item) => dispatch({ type: 'add', item }),
      setQty: (key, qty) => dispatch({ type: 'qty', key, qty }),
      clear: () => dispatch({ type: 'clear' }),
      setOpen: (open) => dispatch({ type: 'open', open }),
      keyOf
    }),
    [state]
  );
  return <CartContext.Provider value={value}>{children}</CartContext.Provider>;
}

export const useCart = () => useContext(CartContext);
