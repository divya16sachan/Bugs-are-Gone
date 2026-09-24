"use client";

import React from "react";
import { CartProvider } from "@/features/cart/cart-context";
import { CartSheet } from "@/features/cart/cart-sheet";
import { OrderReviewModal } from "@/features/order/order-review-modal";

export function AppCartProvider({ children }: { children: React.ReactNode }) {
  return (
    <CartProvider>
      {children}
      <CartSheet />
      <OrderReviewModal />
    </CartProvider>
  );
}
