import { Product } from "@/app/_components/types";

export interface CartItem {
  productId: string;
  title: string;
  price: number;
  originalPrice?: number | null;
  discountPercent?: number | null;
  imageUrl: string;
  category?: string;
  quantity: number;
  inStock?: boolean;
}

export type CheckoutSource = "cart" | "buy_now";

export interface CartContextType {
  items: CartItem[];
  totalCount: number;
  subtotal: number;
  isCartOpen: boolean;
  isCheckoutOpen: boolean;
  checkoutSource: CheckoutSource;
  checkoutItems: CartItem[];
  openCart: () => void;
  closeCart: () => void;
  addToCart: (product: Product, quantity?: number) => void;
  updateQuantity: (productId: string, quantity: number) => void;
  removeFromCart: (productId: string) => void;
  clearCart: () => void;
  buyNow: (product: Product, quantity?: number) => void;
  openCheckout: (source?: CheckoutSource, directItem?: CartItem) => void;
  closeCheckout: () => void;
  updateCheckoutQuantity: (productId: string, delta: number) => void;
}
