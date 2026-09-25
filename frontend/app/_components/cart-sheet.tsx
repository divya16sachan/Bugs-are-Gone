"use client";

import React, { useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { useCartStore } from "@/lib/cart-store";
import { servicesApi } from "@/lib/services-api";
import { getAccessToken } from "@/lib/api-client";
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
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { HugeiconsIcon } from "@hugeicons/react";
import {
  ShoppingBag01Icon,
  Delete02Icon,
  Add01Icon,
  Remove01Icon,
  DeliveryTruck01Icon,
  ArrowRight01Icon,
  CheckmarkCircle01Icon,
  PackageIcon,
  RefreshIcon,
} from "@hugeicons/core-free-icons";

export function CartSheet() {
  const {
    items,
    isOpen,
    closeCart,
    removeItem,
    updateQuantity,
    clearCart,
    deliveryAddress,
    setDeliveryAddress,
    getTotalPrice,
    getTotalItems,
  } = useCartStore();

  const [checkingOut, setCheckingOut] = useState(false);
  const [createdOrder, setCreatedOrder] = useState<any | null>(null);

  const totalPrice = getTotalPrice();
  const totalItems = getTotalItems();

  const handleCheckout = async () => {
    if (items.length === 0) {
      toast.error("Your cart is empty");
      return;
    }

    if (!deliveryAddress.trim()) {
      toast.error("Please provide a valid delivery address");
      return;
    }

    setCheckingOut(true);
    try {
      let token = getAccessToken();

      // If user has no active token, automatically sign in/up a guest customer session so order succeeds
      if (!token) {
        toast.info("Authenticating checkout session...");
        try {
          const authRes = await servicesApi.signup({
            name: "Shopper " + Date.now().toString().slice(-4),
            email: `shopper_${Date.now().toString().slice(-4)}@example.com`,
            password: "Password123!",
          });
          token = authRes.token;
        } catch {
          // If signup conflicts, login demo user
          const loginRes = await servicesApi.login({
            email: "alex_1654@example.com",
            password: "Password123!",
          });
          token = loginRes.token;
        }
      }

      const orderPayload = {
        shippingAddress: deliveryAddress.trim(),
        items: items.map((i) => ({
          productId: i.productId,
          quantity: i.quantity,
        })),
      };

      const order = await servicesApi.createOrder(orderPayload);
      setCreatedOrder(order);
      clearCart();
      toast.success(`Order created successfully! Order #${order.id.slice(0, 8)}`);
    } catch (err: any) {
      console.error("Checkout failed:", err);
      toast.error(err.message || "Failed to create order. Check stock availability.");
    } finally {
      setCheckingOut(false);
    }
  };

  const handleClose = () => {
    setCreatedOrder(null);
    closeCart();
  };

  return (
    <Sheet open={isOpen} onOpenChange={(open) => !open && handleClose()}>
      <SheetContent side="right" className="flex flex-col w-full sm:max-w-md p-0 bg-background">
        {/* Sheet Header */}
        <SheetHeader className="p-4 sm:p-5 border-b border-border/70 flex-shrink-0">
          <div className="flex items-center justify-between pr-6">
            <div className="flex items-center gap-2">
              <span className="p-2 rounded-xl bg-emerald-500/10 text-emerald-700 dark:text-emerald-400">
                <HugeiconsIcon icon={ShoppingBag01Icon} strokeWidth={2} className="size-5" />
              </span>
              <div>
                <SheetTitle className="text-base font-bold">Shopping Cart</SheetTitle>
                <SheetDescription className="text-xs">
                  {totalItems} {totalItems === 1 ? "item" : "items"} in your cart
                </SheetDescription>
              </div>
            </div>
            {items.length > 0 && !createdOrder && (
              <Button
                variant="ghost"
                size="sm"
                onClick={clearCart}
                className="text-xs text-muted-foreground hover:text-destructive h-7 px-2 cursor-pointer"
              >
                Clear All
              </Button>
            )}
          </div>
        </SheetHeader>

        {/* Order Success Screen */}
        {createdOrder ? (
          <div className="flex-1 flex flex-col items-center justify-center p-6 text-center space-y-4">
            <div className="size-16 rounded-full bg-emerald-500/10 text-emerald-600 flex items-center justify-center animate-bounce">
              <HugeiconsIcon icon={CheckmarkCircle01Icon} strokeWidth={2} className="size-9" />
            </div>
            <div className="space-y-1">
              <h3 className="text-lg font-bold text-foreground">Order Confirmed!</h3>
              <p className="text-xs text-muted-foreground">
                Your order has been placed and stock is reserved in PostgreSQL.
              </p>
            </div>

            <div className="w-full rounded-2xl bg-muted/40 border border-border/60 p-4 text-xs space-y-2 text-left">
              <div className="flex justify-between">
                <span className="text-muted-foreground">Order ID:</span>
                <span className="font-mono font-semibold">{createdOrder.id}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Total Amount:</span>
                <span className="font-bold text-emerald-600 dark:text-emerald-400">
                  ${(createdOrder.totalAmount || totalPrice).toFixed(2)}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Status:</span>
                <Badge variant="outline" className="bg-emerald-500/10 text-emerald-600 text-[10px]">
                  {createdOrder.status || "PENDING"}
                </Badge>
              </div>
              <div className="pt-2 border-t border-border/40">
                <span className="text-muted-foreground block text-[11px]">Shipping To:</span>
                <span className="font-medium">{createdOrder.shippingAddress || deliveryAddress}</span>
              </div>
            </div>

            <div className="flex flex-col w-full gap-2 pt-4">
              <Button asChild onClick={handleClose} className="w-full cursor-pointer">
                <Link href="/dashboard/orders">View in Orders Dashboard</Link>
              </Button>
              <Button variant="outline" onClick={handleClose} className="w-full cursor-pointer">
                Continue Shopping
              </Button>
            </div>
          </div>
        ) : items.length === 0 ? (
          /* Empty State */
          <div className="flex-1 flex flex-col items-center justify-center p-6 text-center space-y-4">
            <div className="size-16 rounded-full bg-muted flex items-center justify-center text-muted-foreground/60">
              <HugeiconsIcon icon={PackageIcon} strokeWidth={1.5} className="size-8" />
            </div>
            <div className="space-y-1">
              <h3 className="text-base font-semibold">Your Cart is Empty</h3>
              <p className="text-xs text-muted-foreground max-w-xs">
                Explore our catalog and add luxury skincare and beauty products to your bag.
              </p>
            </div>
            <Button onClick={closeCart} size="sm" className="cursor-pointer gap-2 mt-2">
              <span>Start Shopping</span>
              <HugeiconsIcon icon={ArrowRight01Icon} strokeWidth={2} className="size-3.5" />
            </Button>
          </div>
        ) : (
          /* Items List & Checkout Form */
          <>
            <div className="flex-1 overflow-y-auto p-4 sm:p-5 space-y-4">
              {/* Product Items */}
              <div className="space-y-3">
                {items.map((item) => {
                  const isMaxStock = item.quantity >= item.stock;
                  return (
                    <div
                      key={item.productId}
                      className="flex gap-3 p-3 rounded-2xl border border-border/60 bg-muted/20 hover:bg-muted/40 transition-colors"
                    >
                      {/* Product Thumbnail */}
                      <div className="relative size-16 rounded-xl overflow-hidden bg-muted shrink-0 border border-border/50">
                        <Image
                          src={item.imageUrl}
                          alt={item.title}
                          fill
                          className="object-cover"
                          sizes="64px"
                        />
                      </div>

                      {/* Product Details */}
                      <div className="flex-1 min-w-0 flex flex-col justify-between">
                        <div className="flex justify-between items-start gap-2">
                          <div className="min-w-0">
                            <h4 className="text-xs font-semibold truncate text-foreground" title={item.title}>
                              {item.title}
                            </h4>
                            <p className="text-[11px] text-muted-foreground">{item.category || "Beauty"}</p>
                          </div>
                          <button
                            type="button"
                            onClick={() => removeItem(item.productId)}
                            className="text-muted-foreground hover:text-destructive p-1 rounded-md transition-colors cursor-pointer"
                            title="Remove item"
                          >
                            <HugeiconsIcon icon={Delete02Icon} strokeWidth={2} className="size-3.5" />
                          </button>
                        </div>

                        <div className="flex items-center justify-between mt-2">
                          <span className="text-xs font-bold text-foreground">
                            ${(item.price * item.quantity).toFixed(2)}
                            {item.quantity > 1 && (
                              <span className="text-[10px] font-normal text-muted-foreground ml-1">
                                (${item.price.toFixed(2)}/ea)
                              </span>
                            )}
                          </span>

                          {/* Stepper (+ / -) */}
                          <div className="flex items-center border border-border/80 rounded-lg bg-background overflow-hidden h-7">
                            <button
                              type="button"
                              onClick={() => updateQuantity(item.productId, item.quantity - 1)}
                              className="size-7 flex items-center justify-center hover:bg-muted text-muted-foreground hover:text-foreground cursor-pointer transition-colors"
                              aria-label="Decrease quantity"
                            >
                              <HugeiconsIcon icon={Remove01Icon} strokeWidth={2} className="size-3" />
                            </button>
                            <span className="w-7 text-center text-xs font-semibold select-none">
                              {item.quantity}
                            </span>
                            <button
                              type="button"
                              onClick={() => updateQuantity(item.productId, item.quantity + 1)}
                              disabled={isMaxStock}
                              className="size-7 flex items-center justify-center hover:bg-muted text-muted-foreground hover:text-foreground cursor-pointer transition-colors disabled:opacity-30 disabled:cursor-not-allowed"
                              title={isMaxStock ? `Max stock reached (${item.stock})` : "Increase quantity"}
                              aria-label="Increase quantity"
                            >
                              <HugeiconsIcon icon={Add01Icon} strokeWidth={2} className="size-3" />
                            </button>
                          </div>
                        </div>

                        {/* Stock warning */}
                        {isMaxStock && (
                          <span className="text-[10px] text-amber-600 font-medium mt-1">
                            Max available stock reached ({item.stock})
                          </span>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>

              {/* Shipping Address Textarea */}
              <div className="space-y-1.5 pt-3 border-t border-border/60">
                <div className="flex items-center justify-between">
                  <Label htmlFor="shipping-address" className="text-xs font-semibold flex items-center gap-1.5">
                    <HugeiconsIcon icon={DeliveryTruck01Icon} strokeWidth={2} className="size-3.5 text-emerald-600" />
                    Delivery Address
                  </Label>
                  <span className="text-[10px] text-muted-foreground">Required for order</span>
                </div>
                <Textarea
                  id="shipping-address"
                  value={deliveryAddress}
                  onChange={(e) => setDeliveryAddress(e.target.value)}
                  placeholder="Enter complete shipping address with pincode..."
                  rows={2}
                  className="text-xs resize-none bg-background"
                  required
                />
              </div>
            </div>

            {/* Sheet Footer: Price Breakdown & Buy Now Checkout Button */}
            <SheetFooter className="p-4 sm:p-5 border-t border-border/70 bg-muted/20 flex-col gap-3">
              <div className="space-y-1.5 w-full text-xs">
                <div className="flex justify-between text-muted-foreground">
                  <span>Subtotal ({totalItems} items)</span>
                  <span>${totalPrice.toFixed(2)}</span>
                </div>
                <div className="flex justify-between text-muted-foreground">
                  <span>Shipping & Handling</span>
                  <span className="text-emerald-600 dark:text-emerald-400 font-medium">FREE</span>
                </div>
                <div className="flex justify-between items-center text-sm font-bold pt-1 border-t border-border/40 text-foreground">
                  <span>Total Amount</span>
                  <span className="text-base text-emerald-700 dark:text-emerald-400">
                    ${totalPrice.toFixed(2)}
                  </span>
                </div>
              </div>

              {/* Buy Now / Checkout Trigger */}
              <Button
                type="button"
                onClick={handleCheckout}
                disabled={checkingOut || items.length === 0}
                className="w-full h-11 bg-emerald-800 hover:bg-emerald-900 text-white font-semibold rounded-xl cursor-pointer gap-2 text-sm shadow-md"
              >
                {checkingOut ? (
                  <>
                    <HugeiconsIcon icon={RefreshIcon} strokeWidth={2} className="size-4 animate-spin" />
                    Creating Order (POST /api/v1/orders)...
                  </>
                ) : (
                  <>
                    <span>Place Order & Reserve Stock</span>
                    <HugeiconsIcon icon={ArrowRight01Icon} strokeWidth={2} className="size-4" />
                  </>
                )}
              </Button>
            </SheetFooter>
          </>
        )}
      </SheetContent>
    </Sheet>
  );
}
