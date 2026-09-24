"use client";

import { useState, useEffect, useCallback } from "react";

export interface WishlistItem {
  productId: string;
  title: string;
  price: number;
  imageUrl: string;
  category?: string;
}

const WISHLIST_STORAGE_KEY = "wishlist";
const WISHLIST_UPDATE_EVENT = "ecom-wishlist-updated";
const WISHLIST_SHEET_EVENT = "ecom-wishlist-sheet-toggle";

function getStoredWishlist(): WishlistItem[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = localStorage.getItem(WISHLIST_STORAGE_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

function setStoredWishlist(items: WishlistItem[]) {
  if (typeof window === "undefined") return;
  try {
    localStorage.setItem(WISHLIST_STORAGE_KEY, JSON.stringify(items));
    window.dispatchEvent(
      new CustomEvent(WISHLIST_UPDATE_EVENT, { detail: items })
    );
  } catch (err) {
    console.error("Failed to save wishlist to localStorage:", err);
  }
}

export function openWishlistSheet() {
  if (typeof window !== "undefined") {
    window.dispatchEvent(
      new CustomEvent(WISHLIST_SHEET_EVENT, { detail: { open: true } })
    );
  }
}

export function closeWishlistSheet() {
  if (typeof window !== "undefined") {
    window.dispatchEvent(
      new CustomEvent(WISHLIST_SHEET_EVENT, { detail: { open: false } })
    );
  }
}

export function useWishlist() {
  const [items, setItems] = useState<WishlistItem[]>([]);
  const [isOpen, setIsOpen] = useState(false);

  useEffect(() => {
    setItems(getStoredWishlist());

    const handleUpdate = () => {
      setItems(getStoredWishlist());
    };

    const handleSheetToggle = (e: Event) => {
      const custom = e as CustomEvent<{ open: boolean }>;
      if (custom.detail && typeof custom.detail.open === "boolean") {
        setIsOpen(custom.detail.open);
      }
    };

    window.addEventListener(WISHLIST_UPDATE_EVENT, handleUpdate);
    window.addEventListener("storage", handleUpdate);
    window.addEventListener(WISHLIST_SHEET_EVENT, handleSheetToggle);

    return () => {
      window.removeEventListener(WISHLIST_UPDATE_EVENT, handleUpdate);
      window.removeEventListener("storage", handleUpdate);
      window.removeEventListener(WISHLIST_SHEET_EVENT, handleSheetToggle);
    };
  }, []);

  const isInWishlist = useCallback(
    (productId: string) => {
      return items.some((item) => item.productId === productId);
    },
    [items]
  );

  const toggleWishlist = useCallback(
    (product: {
      id: string;
      title: string;
      price: number;
      imageUrl: string;
      category?: string;
    }) => {
      const current = getStoredWishlist();
      const exists = current.some((item) => item.productId === product.id);

      let updated: WishlistItem[];
      if (exists) {
        updated = current.filter((item) => item.productId !== product.id);
      } else {
        updated = [
          ...current,
          {
            productId: product.id,
            title: product.title,
            price: product.price,
            imageUrl: product.imageUrl,
            category: product.category,
          },
        ];
      }

      setStoredWishlist(updated);
      setItems(updated);
      return !exists; // returns true if added, false if removed
    },
    []
  );

  const removeFromWishlist = useCallback((productId: string) => {
    const current = getStoredWishlist();
    const updated = current.filter((item) => item.productId !== productId);
    setStoredWishlist(updated);
    setItems(updated);
  }, []);

  const clearWishlist = useCallback(() => {
    setStoredWishlist([]);
    setItems([]);
  }, []);

  return {
    items,
    itemCount: items.length,
    isOpen,
    setIsOpen,
    openWishlist: openWishlistSheet,
    closeWishlist: closeWishlistSheet,
    isInWishlist,
    toggleWishlist,
    removeFromWishlist,
    clearWishlist,
  };
}
