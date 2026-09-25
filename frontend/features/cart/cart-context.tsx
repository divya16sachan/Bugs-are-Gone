"use client";

import React, {
  createContext,
  useContext,
  useState,
  useEffect,
  useCallback,
  useMemo,
} from "react";
import { toast } from "sonner";
import { Product } from "@/app/_components/types";
import { CartItem, CartContextType, CheckoutSource } from "./types";

const CART_STORAGE_KEY = "cart";

const CartContext = createContext<CartContextType | undefined>(undefined);

export function CartProvider({ children }: { children: React.ReactNode }) {
  const [items, setItems] = useState<CartItem[]>([]);
  const [isCartOpen, setIsCartOpen] = useState(false);
  const [isCheckoutOpen, setIsCheckoutOpen] = useState(false);
  const [checkoutSource, setCheckoutSource] = useState<CheckoutSource>("cart");
  const [checkoutItems, setCheckoutItems] = useState<CartItem[]>([]);
  const [isInitialized, setIsInitialized] = useState(false);

  // Initialize cart from localStorage safely on client mount
  useEffect(() => {
    try {
      const stored = localStorage.getItem(CART_STORAGE_KEY);
      if (stored) {
        const parsed = JSON.parse(stored);
        if (Array.isArray(parsed)) {
          setItems(parsed);
        }
      }
    } catch (e) {
      console.error("Failed to parse cart from localStorage:", e);
    } finally {
      setIsInitialized(true);
    }

    const handleStorageChange = (e: StorageEvent) => {
      if (e.key === CART_STORAGE_KEY && e.newValue) {
        try {
          const parsed = JSON.parse(e.newValue);
          if (Array.isArray(parsed)) {
            setItems(parsed);
          }
        } catch {
          // ignore
        }
      }
    };

    window.addEventListener("storage", handleStorageChange);
    return () => window.removeEventListener("storage", handleStorageChange);
  }, []);

  // Save items to localStorage whenever they change
  useEffect(() => {
    if (!isInitialized) return;
    try {
      localStorage.setItem(CART_STORAGE_KEY, JSON.stringify(items));
    } catch (e) {
      console.error("Failed to save cart to localStorage:", e);
    }
  }, [items, isInitialized]);

  const openCart = useCallback(() => setIsCartOpen(true), []);
  const closeCart = useCallback(() => setIsCartOpen(false), []);

  const addToCart = useCallback((product: Product, quantity = 1) => {
    const qtyToAdd = Math.max(1, quantity);

    setItems((prev) => {
      const existingIndex = prev.findIndex((item) => item.productId === product.id);

      if (existingIndex > -1) {
        const updated = [...prev];
        const currentQty = updated[existingIndex].quantity;
        updated[existingIndex] = {
          ...updated[existingIndex],
          quantity: currentQty + qtyToAdd,
        };
        return updated;
      }

      const newItem: CartItem = {
        productId: product.id,
        title: product.title,
        price: product.price,
        originalPrice: product.originalPrice,
        discountPercent: product.discountPercent,
        imageUrl: product.imageUrl,
        category: product.category,
        quantity: qtyToAdd,
        inStock: product.inStock,
      };

      return [...prev, newItem];
    });

    toast.success(
      `Added ${qtyToAdd} ${qtyToAdd > 1 ? "items" : "item"} of "${product.title}" to bag`,
      {
        description: "Your luxury bag has been updated.",
        duration: 3000,
      }
    );
  }, []);

  const updateQuantity = useCallback((productId: string, quantity: number) => {
    if (quantity <= 0) {
      setItems((prev) => prev.filter((item) => item.productId !== productId));
      toast.info("Item removed from your bag");
      return;
    }

    setItems((prev) =>
      prev.map((item) =>
        item.productId === productId ? { ...item, quantity } : item
      )
    );
  }, []);

  const removeFromCart = useCallback((productId: string) => {
    setItems((prev) => {
      const target = prev.find((item) => item.productId === productId);
      if (target) {
        toast.info(`Removed "${target.title}" from bag`);
      }
      return prev.filter((item) => item.productId !== productId);
    });
  }, []);

  const clearCart = useCallback(() => {
    setItems([]);
    try {
      localStorage.setItem(CART_STORAGE_KEY, "[]");
    } catch {
      // ignore
    }
  }, []);

  // Buy Now: must NOT behave like Add to Cart! Directly initiates Buy Now -> Order Review / Checkout flow
  const buyNow = useCallback((product: Product, quantity = 1) => {
    const qty = Math.max(1, quantity);
    const directItem: CartItem = {
      productId: product.id,
      title: product.title,
      price: product.price,
      originalPrice: product.originalPrice,
      discountPercent: product.discountPercent,
      imageUrl: product.imageUrl,
      category: product.category,
      quantity: qty,
      inStock: product.inStock,
    };

    setCheckoutSource("buy_now");
    setCheckoutItems([directItem]);
    setIsCartOpen(false);
    setIsCheckoutOpen(true);
  }, []);

  const openCheckout = useCallback(
    (source: CheckoutSource = "cart", directItem?: CartItem) => {
      if (source === "buy_now" && directItem) {
        setCheckoutSource("buy_now");
        setCheckoutItems([directItem]);
      } else {
        setCheckoutSource("cart");
        setCheckoutItems(items);
      }
      setIsCartOpen(false);
      setIsCheckoutOpen(true);
    },
    [items]
  );

  const closeCheckout = useCallback(() => {
    setIsCheckoutOpen(false);
  }, []);

  const updateCheckoutQuantity = useCallback(
    (productId: string, delta: number) => {
      setCheckoutItems((prev) =>
        prev
          .map((item) => {
            if (item.productId === productId) {
              const newQty = Math.max(1, item.quantity + delta);
              return { ...item, quantity: newQty };
            }
            return item;
          })
          .filter((item) => item.quantity > 0)
      );

      // If checking out from cart, sync the quantity with cart state as well
      if (checkoutSource === "cart") {
        setItems((prev) =>
          prev
            .map((item) => {
              if (item.productId === productId) {
                const newQty = Math.max(1, item.quantity + delta);
                return { ...item, quantity: newQty };
              }
              return item;
            })
            .filter((item) => item.quantity > 0)
        );
      }
    },
    [checkoutSource]
  );

  const totalCount = useMemo(() => {
    return items.reduce((sum, item) => sum + item.quantity, 0);
  }, [items]);

  const subtotal = useMemo(() => {
    return items.reduce((sum, item) => sum + item.price * item.quantity, 0);
  }, [items]);

  const value = useMemo(
    () => ({
      items,
      totalCount,
      subtotal,
      isCartOpen,
      isCheckoutOpen,
      checkoutSource,
      checkoutItems,
      openCart,
      closeCart,
      addToCart,
      updateQuantity,
      removeFromCart,
      clearCart,
      buyNow,
      openCheckout,
      closeCheckout,
      updateCheckoutQuantity,
    }),
    [
      items,
      totalCount,
      subtotal,
      isCartOpen,
      isCheckoutOpen,
      checkoutSource,
      checkoutItems,
      openCart,
      closeCart,
      addToCart,
      updateQuantity,
      removeFromCart,
      clearCart,
      buyNow,
      openCheckout,
      closeCheckout,
      updateCheckoutQuantity,
    ]
  );

  return <CartContext.Provider value={value}>{children}</CartContext.Provider>;
}

export function useCart(): CartContextType {
  const context = useContext(CartContext);
  if (!context) {
    throw new Error("useCart must be used within a CartProvider");
  }
  return context;
}
