"use client";

import { useState } from "react";
import { Product } from "../../_components/types";
import { Button } from "@/components/ui/button";
import { useCart } from "@/features/cart/use-cart";
import { useWishlist } from "@/features/wishlist/use-wishlist";
import { toast } from "sonner";
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
  const [addedToCart, setAddedToCart] = useState(false);
  const [message, setMessage] = useState("");

  const { addToCart, openCart } = useCart();
  const { isInWishlist, toggleWishlist } = useWishlist();

  const liked = isInWishlist(product.id);

  const decreaseQuantity = () => {
    setQuantity((current) => Math.max(1, current - 1));
  };

  const increaseQuantity = () => {
    setQuantity((current) => current + 1);
  };

  const handleAddToCart = () => {
    addToCart(
      {
        id: product.id,
        title: product.title,
        price: product.price,
        imageUrl: product.imageUrl,
        category: product.category,
      },
      quantity
    );

    setAddedToCart(true);
    const msg = `${quantity} item${quantity > 1 ? "s" : ""} added to cart`;
    setMessage(msg);
    toast.success(msg);

    setTimeout(() => {
      setAddedToCart(false);
      setMessage("");
    }, 2000);
  };

  const handleToggleWishlist = () => {
    const isAdded = toggleWishlist({
      id: product.id,
      title: product.title,
      price: product.price,
      imageUrl: product.imageUrl,
      category: product.category,
    });

    const msg = isAdded ? "Added to wishlist" : "Removed from wishlist";
    setMessage(msg);
    if (isAdded) {
      toast.success(`Added "${product.title}" to wishlist!`);
    } else {
      toast.info(`Removed "${product.title}" from wishlist`);
    }

    setTimeout(() => {
      setMessage("");
    }, 2000);
  };

  const handleBuyNow = () => {
    addToCart(
      {
        id: product.id,
        title: product.title,
        price: product.price,
        imageUrl: product.imageUrl,
        category: product.category,
      },
      quantity
    );
    toast.success("Proceeding to checkout...", {
      description: `${quantity}x ${product.title}`,
    });
    openCart();
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
          onClick={handleToggleWishlist}
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
            className={liked ? "fill-current text-emerald-800" : ""}
          />
        </Button>
      </div>

      <button
        type="button"
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
