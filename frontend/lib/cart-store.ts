import { create } from "zustand";
import { persist, createJSONStorage } from "zustand/middleware";
import { Product } from "@/app/_components/types";
import { toast } from "sonner";

export interface CartItem {
  productId: string;
  title: string;
  price: number;
  imageUrl: string;
  quantity: number;
  stock: number;
  category?: string;
}

export interface CartState {
  items: CartItem[];
  isOpen: boolean;
  deliveryAddress: string;
  
  // Sheet actions
  openCart: () => void;
  closeCart: () => void;
  toggleCart: () => void;
  setDeliveryAddress: (address: string) => void;

  // Cart item actions
  addItem: (product: Product | { id: string; title: string; price: number; imageUrl?: string; stock?: number; inStock?: boolean; category?: string }, quantity?: number) => boolean;
  removeItem: (productId: string) => void;
  updateQuantity: (productId: string, quantity: number) => void;
  clearCart: () => void;

  // Getters
  getTotalItems: () => number;
  getTotalPrice: () => number;
}

export const useCartStore = create<CartState>()(
  persist(
    (set, get) => ({
      items: [],
      isOpen: false,
      deliveryAddress: "Flat 402, Lotus Residency, MG Road, Bangalore, Karnataka - 560001",

      openCart: () => set({ isOpen: true }),
      closeCart: () => set({ isOpen: false }),
      toggleCart: () => set((state) => ({ isOpen: !state.isOpen })),
      setDeliveryAddress: (address: string) => set({ deliveryAddress: address }),

      addItem: (product, quantity = 1) => {
        const availableStock = product.stock !== undefined ? product.stock : (product.inStock !== false ? 99 : 0);
        if (availableStock <= 0) {
          toast.error("This product is currently out of stock");
          return false;
        }

        const items = get().items;
        const existingIndex = items.findIndex((i) => i.productId === product.id);

        if (existingIndex > -1) {
          const currentItem = items[existingIndex];
          const newQuantity = currentItem.quantity + quantity;

          if (newQuantity > availableStock) {
            const allowed = availableStock - currentItem.quantity;
            if (allowed <= 0) {
              toast.warning(`Maximum available stock (${availableStock}) already in your cart.`);
              return false;
            }
            // Max out
            const updatedItems = [...items];
            updatedItems[existingIndex] = {
              ...currentItem,
              quantity: availableStock,
              stock: availableStock,
            };
            set({ items: updatedItems });
            toast.info(`Adjusted to maximum available stock (${availableStock} items).`);
            return true;
          }

          const updatedItems = [...items];
          updatedItems[existingIndex] = {
            ...currentItem,
            quantity: newQuantity,
            stock: availableStock,
          };
          set({ items: updatedItems });
          toast.success(`Updated "${product.title}" in cart (${newQuantity} items).`);
          return true;
        }

        // New item
        const safeQuantity = Math.min(quantity, availableStock);
        const newItem: CartItem = {
          productId: product.id,
          title: product.title,
          price: product.price,
          imageUrl: product.imageUrl || "/images/placeholder.jpg",
          quantity: safeQuantity,
          stock: availableStock,
          category: product.category,
        };

        set({ items: [...items, newItem] });
        toast.success(`Added "${product.title}" to cart!`);
        return true;
      },

      removeItem: (productId: string) => {
        const item = get().items.find((i) => i.productId === productId);
        set((state) => ({
          items: state.items.filter((i) => i.productId !== productId),
        }));
        if (item) {
          toast.info(`Removed "${item.title}" from cart`);
        }
      },

      updateQuantity: (productId: string, quantity: number) => {
        const items = get().items;
        const item = items.find((i) => i.productId === productId);
        if (!item) return;

        if (quantity <= 0) {
          get().removeItem(productId);
          return;
        }

        if (quantity > item.stock) {
          toast.warning(`Only ${item.stock} items available in stock`);
          return;
        }

        set({
          items: items.map((i) =>
            i.productId === productId ? { ...i, quantity } : i
          ),
        });
      },

      clearCart: () => set({ items: [] }),

      getTotalItems: () => {
        return get().items.reduce((total, item) => total + item.quantity, 0);
      },

      getTotalPrice: () => {
        return get().items.reduce((total, item) => total + item.price * item.quantity, 0);
      },
    }),
    {
      name: "ecom-cart-storage",
      storage: createJSONStorage(() => localStorage),
      partialize: (state) => ({
        items: state.items,
        deliveryAddress: state.deliveryAddress,
      }),
    }
  )
);
