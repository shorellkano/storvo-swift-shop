import { useState, useEffect, useCallback } from "react";

export interface CartItem {
  product: any;
  quantity: number;
}

const CART_PREFIX = "storvo_cart_";

export const useCart = (storeSlug: string | undefined) => {
  const key = `${CART_PREFIX}${storeSlug || ""}`;

  const read = (): CartItem[] => {
    if (!storeSlug || typeof window === "undefined") return [];
    try {
      const raw = sessionStorage.getItem(key);
      return raw ? JSON.parse(raw) : [];
    } catch {
      return [];
    }
  };

  const [cart, setCartState] = useState<CartItem[]>(read);

  useEffect(() => {
    setCartState(read());
  }, [key]);

  const persist = useCallback(
    (next: CartItem[]) => {
      try {
        sessionStorage.setItem(key, JSON.stringify(next));
      } catch {}
      setCartState(next);
    },
    [key]
  );

  const addToCart = useCallback(
    (product: any, qty = 1) => {
      const current = read();
      const existing = current.find((i) => i.product.id === product.id);
      const next = existing
        ? current.map((i) =>
            i.product.id === product.id
              ? { ...i, quantity: i.quantity + qty }
              : i
          )
        : [...current, { product, quantity: qty }];
      persist(next);
    },
    [persist]
  );

  const removeFromCart = useCallback(
    (productId: string) => {
      persist(read().filter((i) => i.product.id !== productId));
    },
    [persist]
  );

  const updateQuantity = useCallback(
    (productId: string, delta: number) => {
      persist(
        read()
          .map((i) =>
            i.product.id === productId
              ? { ...i, quantity: i.quantity + delta }
              : i
          )
          .filter((i) => i.quantity > 0)
      );
    },
    [persist]
  );

  const clearCart = useCallback(() => {
    try {
      sessionStorage.removeItem(key);
    } catch {}
    setCartState([]);
  }, [key]);

  const cartCount = cart.reduce((s, i) => s + i.quantity, 0);
  const cartTotal = cart.reduce(
    (s, i) => s + Number(i.product.price) * i.quantity,
    0
  );

  return {
    cart,
    addToCart,
    removeFromCart,
    updateQuantity,
    clearCart,
    cartCount,
    cartTotal,
  };
};
