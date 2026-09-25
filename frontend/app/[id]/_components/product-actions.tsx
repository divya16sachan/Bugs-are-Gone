"use client";

import { useState, useEffect } from "react";
import { Product } from "../../_components/types";
import { Button } from "@/components/ui/button";
import { useCartStore } from "@/lib/cart-store";
import { useWishlistStore } from "@/lib/wishlist-store";
import {
  FavouriteIcon,
  MinusSignIcon,
  PlusSignIcon,
  ShoppingCart01Icon,
} from "./icons";
import { HugeiconsIcon } from "@hugeicons/react";
import { ArrowRight01Icon, AlertCircleIcon } from "@hugeicons/core-free-icons";

interface ProductActionsProps {
  product: Product;
}

export default function ProductActions({ product }: ProductActionsProps) {
  const { items, addItem, openCart } = useCartStore();
  const { toggleItem, isInWishlist } = useWishlistStore();
  const [quantity, setQuantity] = useState(1);
  const [addedToCart, setAddedToCart] = useState(false);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  const liked = mounted ? isInWishlist(product.id) : false;
  const totalCartCount = mounted ? items.reduce((acc, i) => acc + i.quantity, 0) : 0;
  const currentInCart = mounted ? (items.find((i) => i.productId === product.id)?.quantity || 0) : 0;
  const availableStock = product.stock !== undefined ? product.stock : (product.inStock !== false ? 25 : 0);
  const remainingStock = Math.max(0, availableStock - currentInCart);

  const decreaseQuantity = () => {
    setQuantity((current) => Math.max(1, current - 1));
  };

  const increaseQuantity = () => {
    setQuantity((current) => {
      if (current >= remainingStock && remainingStock > 0) {
        return current;
      }
      return current + 1;
    });
  };

  const handleAddToCart = () => {
    if (availableStock <= 0 || remainingStock <= 0) return;
    const success = addItem(product, quantity);
    if (success) {
      setAddedToCart(true);
      setQuantity(1);
      setTimeout(() => setAddedToCart(false), 2000);
    }
  };

  const toggleWishlist = () => {
    toggleItem(product);
  };

  const handleBuyNow = () => {
    // If current item is not yet in cart, add it first, then open cart sheet
    if (currentInCart === 0 && remainingStock > 0) {
      addItem(product, quantity);
    }
    openCart();
  };

  const isOutOfStock = availableStock <= 0;
  const isMaxStockInCart = remainingStock <= 0 && availableStock > 0;

  return (
    <div className="flex flex-col gap-4">
      {/* Stock availability indicator */}
      <div className="flex items-center gap-2 text-xs">
        {isOutOfStock ? (
          <span className="inline-flex items-center gap-1 font-medium text-destructive">
            <HugeiconsIcon icon={AlertCircleIcon} strokeWidth={2} className="size-3.5" />
            Out of Stock
          </span>
        ) : (
          <span className="inline-flex items-center gap-1 font-medium text-emerald-700 dark:text-emerald-400">
            <span className="size-2 rounded-full bg-emerald-600 animate-pulse" />
            {availableStock} items in stock {currentInCart > 0 && `(${currentInCart} in your cart)`}
          </span>
        )}
      </div>

      <div className="flex flex-wrap items-center gap-3">
        {/* Quantity Stepper */}
        <div className="flex items-center overflow-hidden rounded-full border border-stone-200 bg-white">
          <Button
            type="button"
            variant="ghost"
            size="icon"
            onClick={decreaseQuantity}
            disabled={quantity <= 1 || isOutOfStock || isMaxStockInCart}
            tooltip="Decrease quantity"
            aria-label="Decrease quantity"
            className="size-11 rounded-none text-stone-700 hover:bg-stone-100 active:scale-95 disabled:opacity-40"
          >
            <MinusSignIcon size={20} />
          </Button>

          <span className="flex h-11 min-w-10 items-center justify-center text-sm font-semibold text-stone-900 select-none">
            {quantity}
          </span>

          <Button
            type="button"
            variant="ghost"
            size="icon"
            onClick={increaseQuantity}
            disabled={quantity >= remainingStock || isOutOfStock || isMaxStockInCart}
            tooltip="Increase quantity"
            aria-label="Increase quantity"
            className="size-11 rounded-none text-stone-700 hover:bg-stone-100 active:scale-95 disabled:opacity-40"
          >
            <PlusSignIcon size={20} />
          </Button>
        </div>

        {/* Add to Cart Button */}
        <button
          type="button"
          onClick={handleAddToCart}
          disabled={isOutOfStock || isMaxStockInCart}
          className="flex items-center justify-center gap-2 rounded-full bg-emerald-900 px-6 py-3 text-sm font-semibold text-white transition hover:bg-emerald-800 active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer shadow-sm"
        >
          <ShoppingCart01Icon size={19} />
          {addedToCart
            ? "Added to Cart ✓"
            : isOutOfStock
            ? "Out of Stock"
            : isMaxStockInCart
            ? "Max in Cart"
            : "Add to Cart"}
        </button>

        {/* Wishlist Button */}
        <Button
          type="button"
          variant="outline"
          size="icon"
          onClick={toggleWishlist}
          tooltip={liked ? "Remove from wishlist" : "Add to wishlist"}
          aria-label={liked ? "Remove from wishlist" : "Add to wishlist"}
          className={`size-11 rounded-full transition active:scale-95 cursor-pointer ${
            liked
              ? "border-emerald-800 bg-emerald-50 text-emerald-800 hover:bg-emerald-100"
              : "border-stone-200 bg-white text-stone-700 hover:border-emerald-700 hover:bg-stone-50"
          }`}
        >
          <FavouriteIcon
            size={20}
            className={liked ? "fill-current text-emerald-800" : ""}
          />
        </Button>
      </div>

      {/* Buy Now Button — only shown when there's something in cart or ready to buy */}
      {totalCartCount > 0 && (
        <button
          type="button"
          onClick={handleBuyNow}
          className="w-full sm:w-fit flex items-center justify-center gap-2 rounded-full bg-amber-600 hover:bg-amber-700 px-7 py-3 text-sm font-semibold text-white transition active:scale-95 cursor-pointer shadow-sm animate-in fade-in slide-in-from-bottom-2"
        >
          <span>Buy Now ({totalCartCount} items)</span>
          <HugeiconsIcon icon={ArrowRight01Icon} strokeWidth={2} className="size-4" />
        </button>
      )}
    </div>
  );
}
