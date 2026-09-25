"use client";

import { ViewTransition } from "react";
import Link from "next/link";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { HugeiconsIcon } from "@hugeicons/react";
import {
  FavouriteIcon,
  ShoppingBag01Icon,
  StarIcon,
} from "@hugeicons/core-free-icons";
import { Product } from "./types";
import { useCartStore } from "@/lib/cart-store";
import { useWishlistStore } from "@/lib/wishlist-store";

interface ProductCardProps {
  product: Product;
  className?: string;
  priority?: boolean;
  onAddToCart?: (product: Product) => void;
}

export function ProductCard({
  product,
  className,
  priority = false,
  onAddToCart,
}: ProductCardProps) {
  const { toggleItem, isInWishlist } = useWishlistStore();
  const isWishlisted = isInWishlist(product.id);
  const { addItem } = useCartStore();

  const handleAdd = () => {
    if (onAddToCart) {
      onAddToCart(product);
    } else {
      addItem(product, 1);
    }
  };

  return (
    <div
      className={cn(
        "group relative flex flex-col rounded-2xl bg-card border border-border/70 overflow-hidden hover:shadow-md hover:border-border transition-all duration-300",
        className
      )}
    >
      {/* Product Image & Badges */}
      <div
        className={cn(
          "relative aspect-square w-full bg-stone-100 dark:bg-stone-900 overflow-hidden"
        )}
      >
        {/* Discount Badge */}
        {product.discountPercent && (
          <div
            className={cn(
              "absolute top-3 left-3 z-10 px-2.5 py-1 rounded-md text-xs font-semibold bg-emerald-950 text-emerald-50 dark:bg-emerald-900 shadow-sm"
            )}
          >
            {product.discountPercent}% off
          </div>
        )}

        {/* Image Link */}
        <Link
          href={`/${product.id}`}
          className={cn("block w-full h-full relative")}
        >
          <ViewTransition
            name={`product-image-${product.id}`}
            share="morph"
            default="none"
          >
            <Image
              src={product.imageUrl}
              alt={product.title}
              fill
              priority={priority}
              sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
              className={cn(
                "object-cover object-center transition-transform duration-500 group-hover:scale-105"
              )}
            />
          </ViewTransition>
        </Link>
      </div>

      {/* Content */}
      <div className={cn("p-4 flex flex-col flex-1 justify-between gap-3")}>
        <div className="space-y-1.5">
          {/* Category & Rating */}
          <div className={cn("flex items-center justify-between text-xs")}>
            <span className={cn("text-muted-foreground font-normal")}>
              {product.category}
            </span>
            <div
              className={cn(
                "flex items-center gap-1 font-semibold text-foreground"
              )}
            >
              <HugeiconsIcon
                icon={StarIcon}
                className={cn("size-3.5 text-amber-500 fill-amber-500")}
              />
              <span>{product.rating.toFixed(1)}</span>
            </div>
          </div>

          {/* Product Title */}
          <Link
            href={`/${product.id}`}
            className={cn(
              "font-medium text-sm sm:text-base text-foreground line-clamp-1 hover:text-emerald-800 transition-colors"
            )}
            title={product.title}
          >
            {product.title}
          </Link>
        </div>

        {/* Bottom Row: Price & Action Buttons */}
        <div className={cn("flex items-center justify-between pt-2 border-t border-border/40")}>
          {/* Price */}
          <div className={cn("flex items-baseline gap-1.5")}>
            <span
              className={cn(
                "font-bold text-base text-emerald-950 dark:text-emerald-200"
              )}
            >
              ${product.price.toFixed(2)}
            </span>
            {product.originalPrice && (
              <span
                className={cn(
                  "text-xs text-muted-foreground line-through font-normal"
                )}
              >
                ${product.originalPrice.toFixed(2)}
              </span>
            )}
          </div>

          {/* Right-aligned Actions: Wishlist & Add to Cart */}
          <div className="flex items-center gap-1.5">
            {/* Wishlist Button */}
            <Button
              type="button"
              variant="ghost"
              size="icon"
              onClick={() => toggleItem(product)}
              tooltip={isWishlisted ? "Remove from wishlist" : "Add to wishlist"}
              aria-label={
                isWishlisted ? "Remove from wishlist" : "Add to wishlist"
              }
              className={cn(
                "size-8 rounded-full border transition-all cursor-pointer shadow-2xs",
                isWishlisted
                  ? "border-rose-200 bg-rose-50 text-rose-600 hover:bg-rose-100 dark:bg-rose-950/40 dark:border-rose-900"
                  : "border-border/70 bg-background/80 text-muted-foreground hover:text-rose-600 hover:border-rose-200 hover:bg-rose-50/50"
              )}
            >
              <HugeiconsIcon
                icon={FavouriteIcon}
                className={cn(
                  "size-4",
                  isWishlisted ? "fill-current text-rose-600" : ""
                )}
              />
            </Button>

            {/* Add to Cart Button */}
            <Button
              type="button"
              variant="ghost"
              size="icon"
              onClick={handleAdd}
              tooltip="Add to cart"
              aria-label="Add to cart"
              className={cn(
                "size-8 rounded-full bg-emerald-900 text-white hover:bg-emerald-800 hover:text-white transition-all cursor-pointer shadow-2xs active:scale-95"
              )}
            >
              <HugeiconsIcon icon={ShoppingBag01Icon} className={cn("size-4")} />
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
