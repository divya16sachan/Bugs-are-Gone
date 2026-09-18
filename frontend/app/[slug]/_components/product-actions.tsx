"use client";

import { useState } from "react";
import { Product } from "../../_components/types";
import {
  FavouriteIcon,
  MinusSignIcon,
  PlusSignIcon,
  ShoppingCart01Icon,
} from "./icons";

interface ProductActionsProps {
  product: Product;
}

export default function ProductActions({ product }: ProductActionsProps) {
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

  const addToCart = () => {
    const cart = JSON.parse(localStorage.getItem("cart") || "[]");

    const existingItem = cart.find(
      (item: { productId: string }) => item.productId === product.id
    );

    if (existingItem) {
      existingItem.quantity += quantity;
    } else {
      cart.push({
        productId: product.id,
        title: product.title,
        price: product.price,
        imageUrl: product.imageUrl,
        quantity,
      });
    }

    localStorage.setItem("cart", JSON.stringify(cart));

    setAddedToCart(true);
    setMessage(`${quantity} item${quantity > 1 ? "s" : ""} added to cart`);

    setTimeout(() => {
      setAddedToCart(false);
      setMessage("");
    }, 2000);
  };

  const toggleWishlist = () => {
    setLiked((current) => !current);
    setMessage(liked ? "Removed from wishlist" : "Added to wishlist");

    setTimeout(() => {
      setMessage("");
    }, 2000);
  };

  const buyNow = () => {
    addToCart();
    setMessage("Proceeding to checkout...");
  };

  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-wrap items-center gap-3">
        <div className="flex items-center overflow-hidden rounded-full border border-stone-200 bg-white">
          <button
            type="button"
            onClick={decreaseQuantity}
            className="flex h-11 w-11 items-center justify-center text-stone-700 transition hover:bg-stone-100 active:scale-95 cursor-pointer"
            aria-label="Decrease quantity"
          >
            <MinusSignIcon size={20} />
          </button>

          <span className="flex h-11 min-w-10 items-center justify-center text-sm font-semibold text-stone-900">
            {quantity}
          </span>

          <button
            type="button"
            onClick={increaseQuantity}
            className="flex h-11 w-11 items-center justify-center text-stone-700 transition hover:bg-stone-100 active:scale-95 cursor-pointer"
            aria-label="Increase quantity"
          >
            <PlusSignIcon size={20} />
          </button>
        </div>

        <button
          type="button"
          onClick={addToCart}
          disabled={!product.inStock}
          className="flex items-center justify-center gap-2 rounded-full bg-emerald-900 px-6 py-3 text-sm font-semibold text-white transition hover:bg-emerald-800 active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
        >
          <ShoppingCart01Icon size={19} />
          {addedToCart ? "Added ✓" : product.inStock ? "Add to Cart" : "Out of Stock"}
        </button>

        <button
          type="button"
          onClick={toggleWishlist}
          className={`flex h-11 w-11 items-center justify-center rounded-full border transition active:scale-95 cursor-pointer ${
            liked
              ? "border-emerald-800 bg-emerald-50 text-emerald-800"
              : "border-stone-200 bg-white text-stone-700 hover:border-emerald-700"
          }`}
          aria-label={liked ? "Remove from wishlist" : "Add to wishlist"}
        >
          <FavouriteIcon
            size={20}
            className={liked ? "fill-current" : ""}
          />
        </button>
      </div>

      <button
        type="button"
        onClick={buyNow}
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
