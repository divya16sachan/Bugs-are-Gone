"use client";

import { create } from "zustand";
import { persist, createJSONStorage } from "zustand/middleware";
import { toast } from "sonner";

export interface WishlistItem {
  id: string;
  productId?: string;
  title?: string;
  name?: string;
  price: number;
  originalPrice?: number;
  imageUrl: string;
  category?: string;
  rating?: number;
  stock?: number;
}

interface WishlistStore {
  items: WishlistItem[];
  isOpen: boolean;
  openWishlist: () => void;
  closeWishlist: () => void;
  setWishlistOpen: (open: boolean) => void;
  addItem: (item: any) => void;
  removeItem: (id: string) => void;
  toggleItem: (item: any) => void;
  isInWishlist: (id: string) => boolean;
  clearWishlist: () => void;
  getTotalItems: () => number;
}

const normalizeItem = (item: any): WishlistItem => {
  const id = String(item.id || item.productId);
  return {
    id,
    productId: id,
    title: item.title || item.name || "Product",
    name: item.name || item.title || "Product",
    price: typeof item.price === "number" ? item.price : Number(item.price) || 0,
    originalPrice: item.originalPrice ? Number(item.originalPrice) : undefined,
    imageUrl: item.imageUrl || "/placeholder.png",
    category: item.category || "Beauty",
    rating: item.rating ? Number(item.rating) : undefined,
    stock: item.stock !== undefined ? Number(item.stock) : 25,
  };
};

export const useWishlistStore = create<WishlistStore>()(
  persist(
    (set, get) => ({
      items: [],
      isOpen: false,
      openWishlist: () => set({ isOpen: true }),
      closeWishlist: () => set({ isOpen: false }),
      setWishlistOpen: (open) => set({ isOpen: open }),
      addItem: (rawItem) => {
        const item = normalizeItem(rawItem);
        const { items } = get();
        if (!items.some((i) => i.id === item.id)) {
          set({ items: [item, ...items] });
          toast.success(`Added ${item.title} to wishlist`);
        }
      },
      removeItem: (id) => {
        const item = get().items.find((i) => i.id === id);
        set({ items: get().items.filter((i) => i.id !== id) });
        toast.info(`Removed ${item?.title || "item"} from wishlist`);
      },
      toggleItem: (rawItem) => {
        const item = normalizeItem(rawItem);
        const { items } = get();
        const exists = items.some((i) => i.id === item.id);
        if (exists) {
          set({ items: items.filter((i) => i.id !== item.id) });
          toast.info(`Removed ${item.title} from wishlist`);
        } else {
          set({ items: [item, ...items] });
          toast.success(`Added ${item.title} to wishlist`);
        }
      },
      isInWishlist: (id) => get().items.some((i) => i.id === String(id)),
      clearWishlist: () => {
        set({ items: [] });
        toast.info("Wishlist cleared");
      },
      getTotalItems: () => get().items.length,
    }),
    {
      name: "ecommerce-wishlist-storage",
      storage: createJSONStorage(() => localStorage),
      partialize: (state) => ({ items: state.items }),
    }
  )
);
