"use client";

import { useState, useEffect, useCallback } from "react";

export interface CartItem {
  productId: string;
  title: string;
  price: number;
  imageUrl: string;
  quantity: number;
  category?: string;
}

const CART_STORAGE_KEY = "cart";
const CART_UPDATE_EVENT = "ecom-cart-updated";
const CART_SHEET_EVENT = "ecom-cart-sheet-toggle";

function getStoredCart(): CartItem[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = localStorage.getItem(CART_STORAGE_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

function setStoredCart(items: CartItem[]) {
  if (typeof window === "undefined") return;
  try {
    localStorage.setItem(CART_STORAGE_KEY, JSON.stringify(items));
    window.dispatchEvent(new CustomEvent(CART_UPDATE_EVENT, { detail: items }));
  } catch (err) {
    console.error("Failed to save cart to localStorage:", err);
  }
}

export function openCartSheet() {
  if (typeof window !== "undefined") {
    window.dispatchEvent(new CustomEvent(CART_SHEET_EVENT, { detail: { open: true } }));
  }
}

export function closeCartSheet() {
  if (typeof window !== "undefined") {
    window.dispatchEvent(new CustomEvent(CART_SHEET_EVENT, { detail: { open: false } }));
  }
}

export function useCart() {
  const [items, setItems] = useState<CartItem[]>([]);
  const [isOpen, setIsOpen] = useState(false);

  useEffect(() => {
    setItems(getStoredCart());

    const handleUpdate = () => {
      setItems(getStoredCart());
    };

    const handleSheetToggle = (e: Event) => {
      const custom = e as CustomEvent<{ open: boolean }>;
      if (custom.detail && typeof custom.detail.open === "boolean") {
        setIsOpen(custom.detail.open);
      }
    };

    window.addEventListener(CART_UPDATE_EVENT, handleUpdate);
    window.addEventListener("storage", handleUpdate);
    window.addEventListener(CART_SHEET_EVENT, handleSheetToggle);

    return () => {
      window.removeEventListener(CART_UPDATE_EVENT, handleUpdate);
      window.removeEventListener("storage", handleUpdate);
      window.removeEventListener(CART_SHEET_EVENT, handleSheetToggle);
    };
  }, []);

  const addToCart = useCallback(
    (
      product: {
        id: string;
        title: string;
        price: number;
        imageUrl: string;
        category?: string;
      },
      quantity = 1
    ) => {
      const current = getStoredCart();
      const existingIndex = current.findIndex(
        (item) => item.productId === product.id
      );

      let updated: CartItem[];
      if (existingIndex > -1) {
        updated = [...current];
        updated[existingIndex] = {
          ...updated[existingIndex],
          quantity: updated[existingIndex].quantity + quantity,
        };
      } else {
        updated = [
          ...current,
          {
            productId: product.id,
            title: product.title,
            price: product.price,
            imageUrl: product.imageUrl,
            category: product.category,
            quantity,
          },
        ];
      }

      setStoredCart(updated);
      setItems(updated);
    },
    []
  );

  const removeFromCart = useCallback((productId: string) => {
    const current = getStoredCart();
    const updated = current.filter((item) => item.productId !== productId);
    setStoredCart(updated);
    setItems(updated);
  }, []);

  const updateQuantity = useCallback((productId: string, quantity: number) => {
    if (quantity <= 0) {
      removeFromCart(productId);
      return;
    }
    const current = getStoredCart();
    const updated = current.map((item) =>
      item.productId === productId ? { ...item, quantity } : item
    );
    setStoredCart(updated);
    setItems(updated);
  }, [removeFromCart]);

  const clearCart = useCallback(() => {
    setStoredCart([]);
    setItems([]);
  }, []);

  const itemCount = items.reduce((sum, item) => sum + item.quantity, 0);
  const subtotal = items.reduce((sum, item) => sum + item.price * item.quantity, 0);

  return {
    items,
    itemCount,
    subtotal,
    isOpen,
    setIsOpen,
    openCart: openCartSheet,
    closeCart: closeCartSheet,
    addToCart,
    removeFromCart,
    updateQuantity,
    clearCart,
  };
}
