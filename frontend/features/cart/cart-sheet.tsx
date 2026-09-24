"use client";

import Image from "next/image";
import Link from "next/link";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetFooter,
} from "@/components/ui/sheet";
import { useCart } from "./cart-context";
import { HugeiconsIcon } from "@hugeicons/react";
import {
  ShoppingBag01Icon,
  MinusSignIcon,
  PlusSignIcon,
  Delete02Icon,
  ArrowRight01Icon,
} from "@hugeicons/core-free-icons";

export function CartSheet() {
  const {
    items,
    isCartOpen,
    closeCart,
    updateQuantity,
    removeFromCart,
    subtotal,
    totalCount,
    openCheckout,
  } = useCart();

  const shipping = subtotal >= 50 || subtotal === 0 ? 0 : 5;
  const total = subtotal + shipping;

  const handleProceedToReview = () => {
    openCheckout("cart");
  };

  return (
    <Sheet open={isCartOpen} onOpenChange={(open) => !open && closeCart()}>
      <SheetContent
        side="right"
        className="w-full sm:max-w-md flex flex-col p-0 bg-background text-foreground border-l border-border shadow-2xl z-50"
      >
        {/* Header */}
        <SheetHeader className="px-6 py-5 border-b border-border/80 flex flex-row items-center justify-between gap-3">
          <div className="flex items-center gap-2.5">
            <div className="size-9 rounded-full bg-emerald-100 dark:bg-emerald-950 flex items-center justify-center text-emerald-800 dark:text-emerald-300">
              <HugeiconsIcon icon={ShoppingBag01Icon} className="size-5" />
            </div>
            <div>
              <SheetTitle className="text-lg font-serif font-bold text-foreground">
                Shopping Bag
              </SheetTitle>
              <p className="text-xs text-muted-foreground">
                {totalCount} {totalCount === 1 ? "item" : "items"} in your luxury bag
              </p>
            </div>
          </div>
        </SheetHeader>

        {/* Content Body */}
        {items.length === 0 ? (
          <div className="flex-1 flex flex-col items-center justify-center p-8 text-center space-y-4">
            <div className="size-20 rounded-full bg-emerald-50 dark:bg-emerald-950/50 border border-emerald-200 dark:border-emerald-800 flex items-center justify-center text-emerald-800 dark:text-emerald-300">
              <HugeiconsIcon icon={ShoppingBag01Icon} className="size-10 stroke-1" />
            </div>
            <div className="space-y-1">
              <h3 className="text-base font-semibold text-foreground">
                Your bag is empty
              </h3>
              <p className="text-xs text-muted-foreground max-w-xs">
                Explore our curated botanical serums, creams, and organic essentials to begin.
              </p>
            </div>
            <Button
              type="button"
              onClick={closeCart}
              className="mt-2 rounded-full bg-emerald-900 text-white hover:bg-emerald-800 text-xs px-6 py-2 h-9 font-medium cursor-pointer"
            >
              Discover Products
            </Button>
          </div>
        ) : (
          <div className="flex-1 overflow-y-auto px-6 py-4 divide-y divide-border/60">
            {items.map((item) => (
              <div
                key={item.productId}
                className="py-4 first:pt-1 last:pb-2 flex gap-4 items-start"
              >
                {/* Thumbnail */}
                <Link
                  href={`/${item.productId}`}
                  onClick={closeCart}
                  className="relative size-20 rounded-xl overflow-hidden bg-stone-100 dark:bg-stone-900 shrink-0 border border-border/50 group"
                >
                  <Image
                    src={item.imageUrl}
                    alt={item.title}
                    fill
                    sizes="80px"
                    className="object-cover transition-transform group-hover:scale-105"
                  />
                </Link>

                {/* Info & Quantity controls */}
                <div className="flex-1 min-w-0 flex flex-col justify-between">
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      {item.category && (
                        <span className="text-[10px] uppercase tracking-wider text-muted-foreground font-semibold">
                          {item.category}
                        </span>
                      )}
                      <h4 className="text-sm font-semibold text-foreground line-clamp-1">
                        <Link
                          href={`/${item.productId}`}
                          onClick={closeCart}
                          className="hover:text-emerald-800 dark:hover:text-emerald-300 transition-colors"
                        >
                          {item.title}
                        </Link>
                      </h4>
                    </div>

                    {/* Delete button */}
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      onClick={() => removeFromCart(item.productId)}
                      tooltip="Remove from cart"
                      aria-label={`Remove ${item.title} from bag`}
                      className="size-7 rounded-full text-muted-foreground hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-950/40 shrink-0 cursor-pointer"
                    >
                      <HugeiconsIcon icon={Delete02Icon} className="size-4" />
                    </Button>
                  </div>

                  <div className="mt-2.5 flex items-center justify-between">
                    {/* Quantity controls */}
                    <div className="flex items-center rounded-full border border-border bg-muted/40 overflow-hidden">
                      <button
                        type="button"
                        onClick={() => updateQuantity(item.productId, item.quantity - 1)}
                        aria-label="Decrease quantity"
                        className="size-7 flex items-center justify-center text-foreground hover:bg-muted active:scale-95 transition-colors cursor-pointer"
                      >
                        <HugeiconsIcon icon={MinusSignIcon} className="size-3.5" />
                      </button>

                      <span className="w-8 text-center text-xs font-semibold text-foreground select-none">
                        {item.quantity}
                      </span>

                      <button
                        type="button"
                        onClick={() => updateQuantity(item.productId, item.quantity + 1)}
                        aria-label="Increase quantity"
                        className="size-7 flex items-center justify-center text-foreground hover:bg-muted active:scale-95 transition-colors cursor-pointer"
                      >
                        <HugeiconsIcon icon={PlusSignIcon} className="size-3.5" />
                      </button>
                    </div>

                    {/* Price */}
                    <div className="text-right">
                      <span className="text-sm font-bold text-emerald-950 dark:text-emerald-200">
                        ${(item.price * item.quantity).toFixed(2)}
                      </span>
                      {item.quantity > 1 && (
                        <p className="text-[10px] text-muted-foreground">
                          ${item.price.toFixed(2)} each
                        </p>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Footer / Summary */}
        {items.length > 0 && (
          <SheetFooter className="p-6 border-t border-border/80 bg-muted/20 flex flex-col gap-3">
            <div className="space-y-2 text-xs">
              <div className="flex items-center justify-between text-muted-foreground">
                <span>Subtotal</span>
                <span className="font-semibold text-foreground">
                  ${subtotal.toFixed(2)}
                </span>
              </div>
              <div className="flex items-center justify-between text-muted-foreground">
                <span>Shipping</span>
                <span>
                  {shipping === 0 ? (
                    <span className="text-emerald-700 dark:text-emerald-400 font-semibold">
                      FREE
                    </span>
                  ) : (
                    `$${shipping.toFixed(2)}`
                  )}
                </span>
              </div>
              <Separator className="my-1" />
              <div className="flex items-center justify-between text-sm font-bold text-foreground pt-1">
                <span>Estimated Total</span>
                <span className="text-base text-emerald-950 dark:text-emerald-200">
                  ${total.toFixed(2)}
                </span>
              </div>
            </div>

            <Button
              type="button"
              onClick={handleProceedToReview}
              className="w-full h-11 rounded-full bg-emerald-900 hover:bg-emerald-800 text-white font-semibold text-sm flex items-center justify-center gap-2 shadow-md hover:shadow-lg transition-all active:scale-98 cursor-pointer mt-2"
            >
              <span>Proceed to Checkout</span>
              <HugeiconsIcon icon={ArrowRight01Icon} className="size-4" />
            </Button>

            <button
              type="button"
              onClick={closeCart}
              className="w-full text-center text-xs text-muted-foreground hover:text-foreground transition-colors cursor-pointer py-1"
            >
              Continue Shopping
            </button>
          </SheetFooter>
        )}
      </SheetContent>
    </Sheet>
  );
}
