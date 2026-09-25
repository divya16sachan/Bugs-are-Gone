"use client";

import NextImage from "next/image";
import Link from "next/link";
import { cn } from "@/lib/utils";
import { useWishlist } from "@/features/wishlist/use-wishlist";
import { useCart } from "@/features/cart/use-cart";
import { Button } from "@/components/ui/button";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
} from "@/components/ui/sheet";
import { HugeiconsIcon } from "@hugeicons/react";
import {
  FavouriteIcon,
  ShoppingBag01Icon,
  Cancel01Icon,
} from "@hugeicons/core-free-icons";
import { toast } from "sonner";

export function WishlistSheet() {
  const { items, itemCount, isOpen, setIsOpen, closeWishlist, removeFromWishlist } =
    useWishlist();
  const { addToCart, openCart } = useCart();

  const handleMoveToCart = (item: (typeof items)[number]) => {
    addToCart({
      id: item.productId,
      title: item.title,
      price: item.price,
      imageUrl: item.imageUrl,
      category: item.category,
    });
    toast.success(`Added "${item.title}" to cart!`);
  };

  return (
    <Sheet open={isOpen} onOpenChange={setIsOpen}>
      <SheetContent
        side="right"
        className="w-full sm:max-w-md flex flex-col p-0 bg-background border-l border-border"
      >
        <SheetHeader className="p-6 border-b border-border/80">
          <div className="flex items-center justify-between">
            <SheetTitle className="font-serif text-xl font-bold flex items-center gap-2">
              <HugeiconsIcon icon={FavouriteIcon} className="size-5 text-emerald-800" />
              <span>Wishlist</span>
              {itemCount > 0 && (
                <span className="text-xs font-normal text-muted-foreground ml-1">
                  ({itemCount} item{itemCount > 1 ? "s" : ""})
                </span>
              )}
            </SheetTitle>
          </div>
          <SheetDescription className="sr-only">
            View and manage your saved wishlist items
          </SheetDescription>
        </SheetHeader>

        {/* Wishlist Item List */}
        <div className="flex-1 overflow-y-auto p-6 space-y-4">
          {items.length === 0 ? (
            <div className="h-full flex flex-col items-center justify-center text-center py-12 space-y-4">
              <div className="size-16 rounded-full bg-emerald-50 dark:bg-emerald-950/60 flex items-center justify-center text-emerald-800 dark:text-emerald-300">
                <HugeiconsIcon icon={FavouriteIcon} className="size-8" />
              </div>
              <div className="space-y-1">
                <h4 className="font-medium text-base text-foreground">Your wishlist is empty</h4>
                <p className="text-xs text-muted-foreground max-w-xs">
                  Save your favorite botanical products and skincare routines here.
                </p>
              </div>
              <Button
                variant="outline"
                size="sm"
                onClick={closeWishlist}
                className="rounded-full text-xs font-semibold mt-2"
              >
                Browse Products
              </Button>
            </div>
          ) : (
            items.map((item) => (
              <div
                key={item.productId}
                className="flex items-center gap-4 p-3 rounded-xl border border-border/60 bg-card hover:border-border transition-colors"
              >
                <div className="relative size-16 rounded-lg overflow-hidden bg-stone-100 dark:bg-stone-900 shrink-0">
                  <NextImage
                    src={item.imageUrl}
                    alt={item.title}
                    fill
                    className="object-cover"
                    sizes="64px"
                  />
                </div>

                <div className="flex-1 min-w-0">
                  <Link
                    href={`/${item.productId}`}
                    onClick={closeWishlist}
                    className="font-medium text-sm text-foreground line-clamp-1 hover:text-emerald-800 transition-colors"
                  >
                    {item.title}
                  </Link>
                  <p className="text-xs text-emerald-900 dark:text-emerald-300 font-semibold mt-0.5">
                    ${item.price.toFixed(2)}
                  </p>

                  <div className="mt-2">
                    <Button
                      type="button"
                      size="sm"
                      variant="outline"
                      onClick={() => handleMoveToCart(item)}
                      className="h-7 text-xs rounded-full gap-1.5 px-2.5 hover:bg-emerald-950 hover:text-white"
                    >
                      <HugeiconsIcon icon={ShoppingBag01Icon} className="size-3" />
                      Add to Cart
                    </Button>
                  </div>
                </div>

                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  onClick={() => removeFromWishlist(item.productId)}
                  tooltip="Remove item"
                  aria-label="Remove item"
                  className="size-8 rounded-full text-muted-foreground hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-950/30"
                >
                  <HugeiconsIcon icon={Cancel01Icon} className="size-4" />
                </Button>
              </div>
            ))
          )}
        </div>
      </SheetContent>
    </Sheet>
  );
}
