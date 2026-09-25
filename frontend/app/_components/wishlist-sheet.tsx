"use client";

import React, { useState, useEffect } from "react";
import Image from "next/image";
import Link from "next/link";
import { useWishlistStore, WishlistItem } from "@/lib/wishlist-store";
import { useCartStore } from "@/lib/cart-store";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
  SheetFooter,
} from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import { HugeiconsIcon } from "@hugeicons/react";
import {
  FavouriteIcon,
  Delete02Icon,
  ShoppingBag01Icon,
  ArrowRight01Icon,
  StarIcon,
  ShoppingBasket01Icon,
} from "@hugeicons/core-free-icons";

export function WishlistSheet() {
  const {
    items,
    isOpen,
    closeWishlist,
    removeItem,
    clearWishlist,
    getTotalItems,
  } = useWishlistStore();

  const { addItem: addToCart, openCart } = useCartStore();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  const totalItems = mounted ? getTotalItems() : 0;
  const currentItems = mounted ? items : [];

  const handleMoveToCart = (item: WishlistItem) => {
    addToCart(
      {
        id: item.id,
        title: item.title || item.name || "Product",
        price: item.price,
        imageUrl: item.imageUrl,
        category: item.category || "Beauty",
        stock: item.stock || 25,
      },
      1
    );
  };

  const handleMoveAllToCart = () => {
    if (currentItems.length === 0) return;
    let addedCount = 0;
    currentItems.forEach((item) => {
      const ok = addToCart(
        {
          id: item.id,
          title: item.title || item.name || "Product",
          price: item.price,
          imageUrl: item.imageUrl,
          category: item.category || "Beauty",
          stock: item.stock || 25,
        },
        1
      );
      if (ok) addedCount++;
    });

    closeWishlist();
    openCart();
    toast.success(`Moved ${addedCount} wishlist items to your cart`);
  };

  return (
    <Sheet open={isOpen} onOpenChange={(open) => !open && closeWishlist()}>
      <SheetContent side="right" className="flex flex-col w-full sm:max-w-md p-0 bg-background">
        {/* Sheet Header */}
        <SheetHeader className="p-4 sm:p-5 border-b border-border/70 flex-shrink-0">
          <div className="flex items-center justify-between pr-6">
            <div className="flex items-center gap-2.5">
              <span className="p-2 rounded-xl bg-rose-500/10 text-rose-600 dark:text-rose-400">
                <HugeiconsIcon icon={FavouriteIcon} strokeWidth={2} className="size-5 fill-rose-500/20" />
              </span>
              <div>
                <SheetTitle className="text-base font-bold">My Wishlist</SheetTitle>
                <SheetDescription className="text-xs">
                  {totalItems} {totalItems === 1 ? "item" : "items"} saved for later
                </SheetDescription>
              </div>
            </div>
            {currentItems.length > 0 && (
              <Button
                variant="ghost"
                size="sm"
                onClick={clearWishlist}
                className="text-xs text-muted-foreground hover:text-destructive h-7 px-2 cursor-pointer"
              >
                Clear All
              </Button>
            )}
          </div>
        </SheetHeader>

        {/* Wishlist Items List / Empty State */}
        {currentItems.length === 0 ? (
          /* Empty State */
          <div className="flex-1 flex flex-col items-center justify-center p-6 text-center space-y-4">
            <div className="size-16 rounded-full bg-rose-500/10 flex items-center justify-center text-rose-500/60">
              <HugeiconsIcon icon={FavouriteIcon} strokeWidth={1.5} className="size-8" />
            </div>
            <div className="space-y-1">
              <h3 className="text-base font-semibold">Your Wishlist is Empty</h3>
              <p className="text-xs text-muted-foreground max-w-xs">
                Explore our catalog and click the heart icon on any product to save your favourites here.
              </p>
            </div>
            <Button onClick={closeWishlist} size="sm" className="cursor-pointer gap-2 mt-2 bg-emerald-900 hover:bg-emerald-800 text-white">
              <span>Start Exploring</span>
              <HugeiconsIcon icon={ArrowRight01Icon} strokeWidth={2} className="size-3.5" />
            </Button>
          </div>
        ) : (
          /* Items List */
          <div className="flex-1 overflow-y-auto p-4 sm:p-5 space-y-3">
            {currentItems.map((item) => (
              <div
                key={item.id}
                className="flex gap-3 p-3 rounded-2xl border border-border/60 bg-muted/20 hover:bg-muted/40 transition-all group"
              >
                {/* Product Thumbnail */}
                <Link
                  href={`/${item.id}`}
                  onClick={closeWishlist}
                  className="relative size-20 rounded-xl overflow-hidden bg-muted shrink-0 border border-border/50 block"
                >
                  <Image
                    src={item.imageUrl}
                    alt={item.title || "Product image"}
                    fill
                    className="object-cover transition-transform group-hover:scale-105 duration-300"
                    sizes="80px"
                  />
                </Link>

                {/* Product Info & Action */}
                <div className="flex-1 min-w-0 flex flex-col justify-between">
                  <div className="flex justify-between items-start gap-2">
                    <div className="min-w-0">
                      <Link
                        href={`/${item.id}`}
                        onClick={closeWishlist}
                        className="text-xs font-semibold truncate text-foreground hover:text-emerald-700 transition-colors block"
                        title={item.title}
                      >
                        {item.title}
                      </Link>
                      <div className="flex items-center gap-2 mt-0.5">
                        <span className="text-[11px] text-muted-foreground">{item.category || "Beauty"}</span>
                        {item.rating && (
                          <span className="inline-flex items-center gap-0.5 text-[10px] text-amber-600 font-medium">
                            <HugeiconsIcon icon={StarIcon} className="size-3 fill-amber-500 text-amber-500" />
                            {item.rating.toFixed(1)}
                          </span>
                        )}
                      </div>
                    </div>
                    <button
                      type="button"
                      onClick={() => removeItem(item.id)}
                      className="text-muted-foreground hover:text-destructive p-1 rounded-md transition-colors cursor-pointer"
                      title="Remove from wishlist"
                    >
                      <HugeiconsIcon icon={Delete02Icon} strokeWidth={2} className="size-3.5" />
                    </button>
                  </div>

                  <div className="flex items-center justify-between mt-2 pt-1 border-t border-border/40">
                    <div className="flex items-baseline gap-1.5">
                      <span className="text-xs font-bold text-foreground">
                        ${item.price.toFixed(2)}
                      </span>
                      {item.originalPrice && (
                        <span className="text-[10px] text-muted-foreground line-through">
                          ${item.originalPrice.toFixed(2)}
                        </span>
                      )}
                    </div>

                    {/* Add to Cart Button */}
                    <Button
                      type="button"
                      size="sm"
                      onClick={() => handleMoveToCart(item)}
                      className="h-7 px-2.5 text-xs rounded-lg gap-1.5 bg-emerald-900 hover:bg-emerald-800 text-white cursor-pointer shadow-xs"
                    >
                      <HugeiconsIcon icon={ShoppingBag01Icon} strokeWidth={2} className="size-3.5" />
                      <span>Add to Cart</span>
                    </Button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Sheet Footer */}
        {currentItems.length > 0 && (
          <SheetFooter className="p-4 sm:p-5 border-t border-border/70 bg-muted/20 flex-col gap-2">
            <Button
              type="button"
              onClick={handleMoveAllToCart}
              className="w-full h-10 bg-emerald-900 hover:bg-emerald-800 text-white font-semibold rounded-xl cursor-pointer gap-2 text-xs shadow-md"
            >
              <HugeiconsIcon icon={ShoppingBasket01Icon} strokeWidth={2} className="size-4" />
              <span>Move All to Cart & Checkout</span>
            </Button>
            <Button
              type="button"
              variant="outline"
              onClick={closeWishlist}
              className="w-full h-9 rounded-xl text-xs cursor-pointer"
            >
              Continue Shopping
            </Button>
          </SheetFooter>
        )}
      </SheetContent>
    </Sheet>
  );
}
