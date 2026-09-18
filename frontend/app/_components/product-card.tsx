"use client";

import { useState, ViewTransition } from "react";
import Link from "next/link";
import Image from "next/image";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { HugeiconsIcon } from "@hugeicons/react";
import {
  FavouriteIcon,
  ShoppingBag01Icon,
  Maximize01Icon,
  StarIcon,
} from "@hugeicons/core-free-icons";
import { Product } from "./types";

interface ProductCardProps {
  product: Product;
  className?: string;
  priority?: boolean;
  onQuickView?: (product: Product) => void;
  onAddToCart?: (product: Product) => void;
}

export function ProductCard({
  product,
  className,
  priority = false,
  onQuickView,
  onAddToCart,
}: ProductCardProps) {
  const [isWishlisted, setIsWishlisted] = useState(false);

  return (
    <div
      className={cn(
        "group relative flex flex-col rounded-2xl bg-card border border-border/70 overflow-hidden hover:shadow-lg transition-all duration-300",
        className,
      )}
    >
      {/* Product Image & Badges */}
      <div
        className={cn(
          "relative aspect-square w-full bg-stone-100 dark:bg-stone-900 overflow-hidden",
        )}
      >
        {/* Discount Badge */}
        {product.discountPercent && (
          <div
            className={cn(
              "absolute top-3 left-3 z-10 px-2.5 py-1 rounded-md text-xs font-semibold bg-emerald-950 text-emerald-50 dark:bg-emerald-900 shadow-sm",
            )}
          >
            {product.discountPercent}% off
          </div>
        )}

        {/* Floating Quick Action Buttons */}
        <div
          className={cn(
            "absolute top-3 right-3 z-10 flex flex-col gap-2 transition-opacity duration-200 opacity-90 sm:opacity-0 sm:group-hover:opacity-100",
          )}
        >
          {/* Wishlist Button */}
          <Button
            type="button"
            variant="ghost"
            size="icon"
            onClick={() => setIsWishlisted(!isWishlisted)}
            tooltip={isWishlisted ? "Remove from wishlist" : "Add to wishlist"}
            aria-label={
              isWishlisted ? "Remove from wishlist" : "Add to wishlist"
            }
            className={cn(
              "size-8 rounded-full bg-white/90 dark:bg-zinc-900/90 backdrop-blur-xs flex items-center justify-center shadow-sm transition-all hover:scale-110",
              isWishlisted
                ? "text-red-500 hover:text-red-600"
                : "text-zinc-700 dark:text-zinc-200 hover:text-emerald-900",
            )}
          >
            <HugeiconsIcon
              icon={FavouriteIcon}
              className={cn("size-4", isWishlisted && "fill-current")}
            />
          </Button>

          {/* Quick View Button */}
          <Button
            type="button"
            variant="ghost"
            size="icon"
            onClick={() => onQuickView?.(product)}
            tooltip="Quick view"
            aria-label="Quick view product"
            className={cn(
              "size-8 rounded-full bg-white/90 dark:bg-zinc-900/90 backdrop-blur-xs flex items-center justify-center text-zinc-700 dark:text-zinc-200 shadow-sm transition-all hover:scale-110 hover:text-emerald-900",
            )}
          >
            <HugeiconsIcon icon={Maximize01Icon} className={cn("size-4")} />
          </Button>

          {/* Add to Cart Button */}
          <Button
            type="button"
            variant="ghost"
            size="icon"
            onClick={() => onAddToCart?.(product)}
            tooltip="Add to cart"
            aria-label="Add to cart"
            className={cn(
              "size-8 rounded-full bg-white/90 dark:bg-zinc-900/90 backdrop-blur-xs flex items-center justify-center text-zinc-700 dark:text-zinc-200 shadow-sm transition-all hover:scale-110 hover:bg-emerald-950 hover:text-white",
            )}
          >
            <HugeiconsIcon icon={ShoppingBag01Icon} className={cn("size-4")} />
          </Button>
        </div>

        {/* Image */}
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
                "object-cover object-center transition-transform duration-500 group-hover:scale-105",
              )}
            />
          </ViewTransition>
        </Link>
      </div>

      {/* Content */}
      <div className={cn("p-4 flex flex-col flex-1 justify-between gap-2")}>
        {/* Category & Rating */}
        <div className={cn("flex items-center justify-between text-xs")}>
          <span className={cn("text-muted-foreground font-normal")}>
            {product.category}
          </span>
          <div
            className={cn(
              "flex items-center gap-1 font-semibold text-foreground",
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
            "font-medium text-sm sm:text-base text-foreground line-clamp-1 hover:text-emerald-800 transition-colors",
          )}
        >
          {product.title}
        </Link>

        {/* Price Row */}
        <div className={cn("flex items-baseline gap-2 pt-1")}>
          <span
            className={cn(
              "font-bold text-base text-emerald-950 dark:text-emerald-200",
            )}
          >
            ${product.price.toFixed(2)}
          </span>
          {product.originalPrice && (
            <span
              className={cn(
                "text-xs text-muted-foreground line-through font-normal",
              )}
            >
              ${product.originalPrice.toFixed(2)}
            </span>
          )}
        </div>
      </div>
    </div>
  );
}
