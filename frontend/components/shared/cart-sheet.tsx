"use client";

import Image from "next/link";
import NextImage from "next/image";
import Link from "next/link";
import { cn } from "@/lib/utils";
import { useCart } from "@/features/cart/use-cart";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
  SheetFooter,
} from "@/components/ui/sheet";
import { HugeiconsIcon } from "@hugeicons/react";
import {
  ShoppingBag01Icon,
  MinusSignIcon,
  PlusSignIcon,
  Cancel01Icon,
  ArrowRight01Icon,
} from "@hugeicons/core-free-icons";
import { toast } from "sonner";

export function CartSheet() {
  const {
    items,
    itemCount,
    subtotal,
    isOpen,
    setIsOpen,
    closeCart,
    removeFromCart,
    updateQuantity,
    clearCart,
  } = useCart();

  const handleCheckout = () => {
    toast.success("Order placed successfully! Thank you for your purchase.", {
      description: `Total charged: $${subtotal.toFixed(2)}`,
    });
    clearCart();
    closeCart();
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
              <HugeiconsIcon icon={ShoppingBag01Icon} className="size-5 text-emerald-800" />
              <span>Shopping Cart</span>
              {itemCount > 0 && (
                <span className="text-xs font-normal text-muted-foreground ml-1">
                  ({itemCount} item{itemCount > 1 ? "s" : ""})
                </span>
              )}
            </SheetTitle>
          </div>
          <SheetDescription className="sr-only">
            View and manage items in your shopping cart
          </SheetDescription>
        </SheetHeader>

        {/* Cart Item List */}
        <div className="flex-1 overflow-y-auto p-6 space-y-4">
          {items.length === 0 ? (
            <div className="h-full flex flex-col items-center justify-center text-center py-12 space-y-4">
              <div className="size-16 rounded-full bg-emerald-50 dark:bg-emerald-950/60 flex items-center justify-center text-emerald-800 dark:text-emerald-300">
                <HugeiconsIcon icon={ShoppingBag01Icon} className="size-8" />
              </div>
              <div className="space-y-1">
                <h4 className="font-medium text-base text-foreground">Your cart is empty</h4>
                <p className="text-xs text-muted-foreground max-w-xs">
                  Explore our curated botanical serums, moisturizers, and organic essentials.
                </p>
              </div>
              <Button
                variant="outline"
                size="sm"
                onClick={closeCart}
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
                    onClick={closeCart}
                    className="font-medium text-sm text-foreground line-clamp-1 hover:text-emerald-800 transition-colors"
                  >
                    {item.title}
                  </Link>
                  <p className="text-xs text-emerald-900 dark:text-emerald-300 font-semibold mt-0.5">
                    ${item.price.toFixed(2)}
                  </p>

                  <div className="flex items-center gap-2 mt-2">
                    <div className="flex items-center rounded-lg border border-border bg-muted/40">
                      <button
                        type="button"
                        onClick={() => updateQuantity(item.productId, item.quantity - 1)}
                        className="size-6 flex items-center justify-center text-muted-foreground hover:text-foreground transition-colors"
                        aria-label="Decrease quantity"
                      >
                        <HugeiconsIcon icon={MinusSignIcon} className="size-3" />
                      </button>
                      <span className="text-xs font-semibold px-2 min-w-6 text-center">
                        {item.quantity}
                      </span>
                      <button
                        type="button"
                        onClick={() => updateQuantity(item.productId, item.quantity + 1)}
                        className="size-6 flex items-center justify-center text-muted-foreground hover:text-foreground transition-colors"
                        aria-label="Increase quantity"
                      >
                        <HugeiconsIcon icon={PlusSignIcon} className="size-3" />
                      </button>
                    </div>
                  </div>
                </div>

                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  onClick={() => removeFromCart(item.productId)}
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

        {/* Cart Footer */}
        {items.length > 0 && (
          <SheetFooter className="p-6 border-t border-border/80 bg-muted/20 flex flex-col gap-4">
            <div className="space-y-2 w-full">
              <div className="flex items-center justify-between text-xs text-muted-foreground">
                <span>Shipping</span>
                <span className="text-emerald-700 dark:text-emerald-400 font-medium">Free</span>
              </div>
              <Separator />
              <div className="flex items-center justify-between text-base font-semibold text-foreground">
                <span>Subtotal</span>
                <span>${subtotal.toFixed(2)}</span>
              </div>
            </div>

            <Button
              type="button"
              onClick={handleCheckout}
              className="w-full rounded-full bg-emerald-950 hover:bg-emerald-900 text-white font-semibold h-11 flex items-center justify-center gap-2 shadow-sm"
            >
              <span>Proceed to Checkout</span>
              <HugeiconsIcon icon={ArrowRight01Icon} className="size-4" />
            </Button>
          </SheetFooter>
        )}
      </SheetContent>
    </Sheet>
  );
}
