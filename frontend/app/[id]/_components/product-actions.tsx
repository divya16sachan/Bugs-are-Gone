"use client";

import { useState } from "react";
import { Product } from "../../_components/types";
import { Button } from "@/components/ui/button";
import {
  FavouriteIcon,
  MinusSignIcon,
  PlusSignIcon,
  ShoppingCart01Icon,
} from "./icons";

import { useCart } from "@/features/cart/cart-context";

interface ProductActionsProps {
  product: Product;
}

export default function ProductActions({ product }: ProductActionsProps) {
  const { addToCart: cartAdd, buyNow: cartBuyNow } = useCart();

  const [quantity, setQuantity] = useState(1);
  const [liked, setLiked] = useState(false);
  const [addedToCart, setAddedToCart] = useState(false);
  const [message, setMessage] = useState("");

  const decreaseQuantity = () => {
    setQuantity((current) => Math.max(1, current - 1));
  };

  const increaseQuantity = () => {
    setQuantity((current) => current + 1);
  };

  const handleAddToCart = () => {
    if (!product.inStock) return;
    cartAdd(product, quantity);
    setAddedToCart(true);
    setMessage(`${quantity} item${quantity > 1 ? "s" : ""} added to bag ✓`);

    setTimeout(() => {
      setAddedToCart(false);
      setMessage("");
    }, 2500);
  };

  const toggleWishlist = () => {
    setLiked((current) => !current);
    setMessage(liked ? "Removed from wishlist" : "Added to wishlist");

    setTimeout(() => {
      setMessage("");
    }, 2000);
  };

  // Buy Now must NOT behave like Add to Cart!
  // Buy Now must directly follow the existing Buy Now → Order Review/Checkout flow.
  const handleBuyNow = () => {
    if (!product.inStock) return;
    cartBuyNow(product, quantity);
  };

  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-wrap items-center gap-3">
        <div className="flex items-center overflow-hidden rounded-full border border-stone-200 bg-white">
          <Button
            type="button"
            variant="ghost"
            size="icon"
            onClick={decreaseQuantity}
            tooltip="Decrease quantity"
            aria-label="Decrease quantity"
            className="size-11 rounded-none text-stone-700 hover:bg-stone-100 active:scale-95"
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
            tooltip="Increase quantity"
            aria-label="Increase quantity"
            className="size-11 rounded-none text-stone-700 hover:bg-stone-100 active:scale-95"
          >
            <PlusSignIcon size={20} />
          </Button>
        </div>

        <button
          type="button"
          id="add-to-cart-btn"
          onClick={handleAddToCart}
          disabled={!product.inStock}
          className="flex items-center justify-center gap-2 rounded-full bg-emerald-900 px-6 py-3 text-sm font-semibold text-white transition hover:bg-emerald-800 active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
        >
          <ShoppingCart01Icon size={19} />
          {addedToCart ? "Added ✓" : product.inStock ? "Add to Cart" : "Out of Stock"}
        </button>

        <Button
          type="button"
          variant="outline"
          size="icon"
          onClick={toggleWishlist}
          tooltip={liked ? "Remove from wishlist" : "Add to wishlist"}
          aria-label={liked ? "Remove from wishlist" : "Add to wishlist"}
          className={`size-11 rounded-full transition active:scale-95 ${
            liked
              ? "border-emerald-800 bg-emerald-50 text-emerald-800 hover:bg-emerald-100"
              : "border-stone-200 bg-white text-stone-700 hover:border-emerald-700 hover:bg-stone-50"
          }`}
        >
          <FavouriteIcon
            size={20}
            className={liked ? "fill-current" : ""}
          />
        </Button>
      </div>

      <button
        type="button"
        id="buy-now-btn"
        onClick={handleBuyNow}
        disabled={!product.inStock}
        className="w-full rounded-full bg-amber-600 px-6 py-3 text-sm font-semibold text-white transition hover:bg-amber-700 active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer sm:w-fit"
      >
        Buy Now
      </button>

      {message && (
        <p
          className="text-sm font-medium text-emerald-800"
          role="status"
          aria-live="polite"
        >
          {message}
        </p>
      )}
    </div>
  );
}
