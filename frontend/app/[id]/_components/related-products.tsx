"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import Image from "next/image";
import { Product } from "../../_components/types";
import { MOCK_PRODUCTS } from "../../_components/mock-products";
import { Button } from "@/components/ui/button";
import { useWishlistStore } from "@/lib/wishlist-store";
import { useCartStore } from "@/lib/cart-store";
import { FavouriteIcon, ShoppingCart01Icon } from "./icons";
import { cn } from "@/lib/utils";

interface RelatedProductsProps {
  currentProduct: Product;
}

export default function RelatedProducts({ currentProduct }: RelatedProductsProps) {
  const { toggleItem, isInWishlist } = useWishlistStore();
  const { addItem } = useCartStore();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  // Find products in the same category first, or others if needed
  const sameCategory = MOCK_PRODUCTS.filter(
    (p) => p.id !== currentProduct.id && p.category === currentProduct.category
  );
  const otherProducts = MOCK_PRODUCTS.filter(
    (p) => p.id !== currentProduct.id && p.category !== currentProduct.category
  );
  const related = [...sameCategory, ...otherProducts].slice(0, 4);

  return (
    <section className="border-t border-stone-200 pt-10">
      <div className="mb-6">
        <p className="text-sm font-medium text-stone-500">You may also like</p>

        <h2 className="mt-1 text-2xl font-semibold tracking-tight text-stone-900">
          Related Products
        </h2>
      </div>

      <div className="grid grid-cols-2 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {related.map((product) => {
          const isWishlisted = mounted ? isInWishlist(product.id) : false;
          return (
            <article
              key={product.id}
              className="group relative flex flex-col rounded-2xl bg-card border border-border/70 overflow-hidden hover:shadow-md hover:border-border transition-all duration-300"
            >
              {/* Product Image */}
              <div className="relative aspect-square overflow-hidden bg-stone-100 dark:bg-stone-900">
                <Link href={`/${product.id}`} className="block h-full w-full">
                  <Image
                    src={product.imageUrl}
                    alt={product.title}
                    fill
                    sizes="(max-width: 640px) 50vw, 25vw"
                    className="h-full w-full object-cover transition duration-500 group-hover:scale-105"
                  />
                </Link>
              </div>

              {/* Product Details & Actions */}
              <div className="p-3.5 flex flex-col flex-1 justify-between gap-2.5">
                <div>
                  <p className="text-xs text-muted-foreground">{product.category}</p>
                  <h3 className="mt-0.5 text-sm font-semibold text-foreground line-clamp-1">
                    <Link
                      href={`/${product.id}`}
                      className="hover:text-emerald-800 transition-colors"
                      title={product.title}
                    >
                      {product.title}
                    </Link>
                  </h3>
                </div>

                {/* Bottom Row: Price & Actions */}
                <div className="flex items-center justify-between pt-1.5 border-t border-border/40">
                  <div className="flex items-baseline gap-1">
                    <p className="text-sm font-bold text-emerald-950 dark:text-emerald-200">
                      ${product.price.toFixed(2)}
                    </p>
                    {product.originalPrice && (
                      <p className="text-[11px] text-muted-foreground line-through font-normal">
                        ${product.originalPrice.toFixed(2)}
                      </p>
                    )}
                  </div>

                  {/* Actions on Bottom Right */}
                  <div className="flex items-center gap-1">
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      onClick={() => toggleItem(product)}
                      tooltip={isWishlisted ? "Remove from wishlist" : "Add to wishlist"}
                      aria-label={isWishlisted ? "Remove from wishlist" : "Add to wishlist"}
                      className={cn(
                        "size-7 rounded-full border transition-all cursor-pointer shadow-2xs",
                        isWishlisted
                          ? "border-rose-200 bg-rose-50 text-rose-600 hover:bg-rose-100 dark:bg-rose-950/40 dark:border-rose-900"
                          : "border-border/70 bg-background/80 text-muted-foreground hover:text-rose-600 hover:border-rose-200 hover:bg-rose-50/50"
                      )}
                    >
                      <FavouriteIcon
                        size={14}
                        className={isWishlisted ? "fill-current text-rose-600" : ""}
                      />
                    </Button>

                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      onClick={() => addItem(product, 1)}
                      tooltip="Add to cart"
                      aria-label="Add to cart"
                      className="size-7 rounded-full bg-emerald-900 text-white hover:bg-emerald-800 hover:text-white transition-all cursor-pointer shadow-2xs active:scale-95"
                    >
                      <ShoppingCart01Icon size={14} />
                    </Button>
                  </div>
                </div>
              </div>
            </article>
          );
        })}
      </div>
    </section>
  );
}
