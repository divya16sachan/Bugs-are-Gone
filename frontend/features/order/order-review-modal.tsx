"use client";

import React, { useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { useCart } from "../cart/cart-context";
import { useCreateOrder } from "./hooks";
import { HugeiconsIcon } from "@hugeicons/react";
import {
  MinusSignIcon,
  PlusSignIcon,
  CheckmarkCircle02Icon,
  ShoppingBag01Icon,
  Cancel01Icon,
  Loading03Icon,
  ArrowRight01Icon,
  Store01Icon,
  DeliveryTruck01Icon,
} from "@hugeicons/core-free-icons";

export function OrderReviewModal() {
  const {
    isCheckoutOpen,
    closeCheckout,
    checkoutSource,
    checkoutItems,
    updateCheckoutQuantity,
    clearCart,
  } = useCart();

  const createOrderMutation = useCreateOrder();

  const [step, setStep] = useState<"review" | "confirmed">("review");
  const [confirmedOrderId, setConfirmedOrderId] = useState<string>("");

  // Shipping Form State
  const [fullName, setFullName] = useState("Jane Doe");
  const [email, setEmail] = useState("jane.doe@example.com");
  const [address, setAddress] = useState("742 Evergreen Terrace");
  const [city, setCity] = useState("Springfield");
  const [zipCode, setZipCode] = useState("97477");
  const [formError, setFormError] = useState("");

  const subtotal = checkoutItems.reduce(
    (sum, item) => sum + item.price * item.quantity,
    0
  );
  const shipping = subtotal >= 50 || subtotal === 0 ? 0 : 5;
  const total = subtotal + shipping;

  const handleClose = () => {
    closeCheckout();
    // Reset to review step for next time
    setTimeout(() => {
      setStep("review");
      setConfirmedOrderId("");
      setFormError("");
    }, 300);
  };

  const handlePlaceOrder = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError("");

    if (!fullName.trim() || !address.trim() || !city.trim() || !zipCode.trim()) {
      setFormError("Please fill in all required shipping address fields.");
      return;
    }

    if (checkoutItems.length === 0) {
      setFormError("There are no items in your order.");
      return;
    }

    const fullShippingAddress = `${fullName}, ${address}, ${city} ${zipCode}`;

    try {
      const order = await createOrderMutation.mutateAsync({
        items: checkoutItems.map((item) => ({
          productId: item.productId,
          quantity: item.quantity,
        })),
        shippingAddress: fullShippingAddress,
        customerName: fullName,
        customerEmail: email,
      });

      setConfirmedOrderId(order.id);
      setStep("confirmed");

      // If checking out from cart, empty the cart
      if (checkoutSource === "cart") {
        clearCart();
      }
    } catch (err: any) {
      console.error("Order submission failed:", err);
      setFormError(err.message || "Failed to process order. Please try again.");
    }
  };

  if (!isCheckoutOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 overflow-y-auto bg-black/60 backdrop-blur-xs animate-in fade-in duration-200">
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="order-review-title"
        className="relative w-full max-w-2xl rounded-3xl bg-background border border-border shadow-2xl overflow-hidden flex flex-col max-h-[92vh]"
      >
        {/* Modal Header */}
        <div className="px-6 py-5 border-b border-border/80 flex items-center justify-between bg-muted/20 shrink-0">
          <div className="flex items-center gap-2.5">
            <div className="size-9 rounded-full bg-emerald-100 dark:bg-emerald-950 flex items-center justify-center text-emerald-800 dark:text-emerald-300">
              <HugeiconsIcon icon={ShoppingBag01Icon} className="size-5" />
            </div>
            <div>
              <h2
                id="order-review-title"
                className="text-lg font-serif font-bold text-foreground"
              >
                {step === "review" ? "Order Review & Checkout" : "Order Confirmed!"}
              </h2>
              <div className="flex items-center gap-2 mt-0.5">
                <p className="text-xs text-muted-foreground">
                  {step === "review"
                    ? "Review your items and shipping details"
                    : `Order reference: ${confirmedOrderId}`}
                </p>
                {step === "review" && (
                  <Badge
                    variant="outline"
                    className={cn(
                      "text-[10px] px-2 py-0 border-emerald-300 dark:border-emerald-800 text-emerald-800 dark:text-emerald-300 bg-emerald-50 dark:bg-emerald-950/60 font-semibold"
                    )}
                  >
                    {checkoutSource === "buy_now" ? "Buy Now Direct" : "Bag Checkout"}
                  </Badge>
                )}
              </div>
            </div>
          </div>

          <Button
            type="button"
            variant="ghost"
            size="icon"
            onClick={handleClose}
            aria-label="Close checkout modal"
            className="size-8 rounded-full text-muted-foreground hover:text-foreground cursor-pointer"
          >
            <HugeiconsIcon icon={Cancel01Icon} className="size-4" />
          </Button>
        </div>

        {/* Modal Body */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6">
          {step === "review" ? (
            <form id="order-review-form" onSubmit={handlePlaceOrder} className="space-y-6">
              {/* Order Items Review */}
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <h3 className="text-sm font-semibold text-foreground uppercase tracking-wider text-[11px]">
                    Items in Order ({checkoutItems.length})
                  </h3>
                  <span className="text-xs text-muted-foreground">
                    Quantity editable
                  </span>
                </div>

                <div className="divide-y divide-border/60 rounded-2xl border border-border/80 bg-muted/10 p-3 sm:p-4">
                  {checkoutItems.map((item) => (
                    <div
                      key={item.productId}
                      className="py-3 first:pt-0 last:pb-0 flex items-center gap-4"
                    >
                      <div className="relative size-16 rounded-xl overflow-hidden bg-stone-100 dark:bg-stone-900 shrink-0 border border-border/60">
                        <Image
                          src={item.imageUrl}
                          alt={item.title}
                          fill
                          sizes="64px"
                          className="object-cover"
                        />
                      </div>

                      <div className="flex-1 min-w-0">
                        <h4 className="text-sm font-semibold text-foreground truncate">
                          {item.title}
                        </h4>
                        <p className="text-xs text-muted-foreground mt-0.5">
                          ${item.price.toFixed(2)} each
                        </p>
                      </div>

                      {/* Inline Quantity Controls */}
                      <div className="flex items-center rounded-full border border-border bg-background overflow-hidden shrink-0">
                        <button
                          type="button"
                          onClick={() => updateCheckoutQuantity(item.productId, -1)}
                          disabled={item.quantity <= 1}
                          aria-label={`Decrease ${item.title} quantity`}
                          className="size-7 flex items-center justify-center text-foreground hover:bg-muted active:scale-95 disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer transition-colors"
                        >
                          <HugeiconsIcon icon={MinusSignIcon} className="size-3" />
                        </button>

                        <span className="w-7 text-center text-xs font-semibold text-foreground select-none">
                          {item.quantity}
                        </span>

                        <button
                          type="button"
                          onClick={() => updateCheckoutQuantity(item.productId, 1)}
                          aria-label={`Increase ${item.title} quantity`}
                          className="size-7 flex items-center justify-center text-foreground hover:bg-muted active:scale-95 cursor-pointer transition-colors"
                        >
                          <HugeiconsIcon icon={PlusSignIcon} className="size-3" />
                        </button>
                      </div>

                      {/* Line Total */}
                      <div className="w-18 text-right shrink-0">
                        <span className="text-sm font-bold text-emerald-950 dark:text-emerald-200">
                          ${(item.price * item.quantity).toFixed(2)}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Shipping Information Form */}
              <div className="space-y-4">
                <div className="flex items-center gap-2">
                  <HugeiconsIcon icon={DeliveryTruck01Icon} className="size-4 text-emerald-700 dark:text-emerald-400" />
                  <h3 className="text-sm font-semibold text-foreground uppercase tracking-wider text-[11px]">
                    Shipping Address
                  </h3>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                  <div className="space-y-1.5 sm:col-span-2">
                    <Label htmlFor="order-fullname" className="text-xs font-medium">
                      Full Name *
                    </Label>
                    <Input
                      id="order-fullname"
                      required
                      value={fullName}
                      onChange={(e) => setFullName(e.target.value)}
                      placeholder="Jane Doe"
                      className="h-10 text-sm rounded-xl"
                    />
                  </div>

                  <div className="space-y-1.5 sm:col-span-2">
                    <Label htmlFor="order-email" className="text-xs font-medium">
                      Email Address (for order tracking)
                    </Label>
                    <Input
                      id="order-email"
                      type="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder="jane.doe@example.com"
                      className="h-10 text-sm rounded-xl"
                    />
                  </div>

                  <div className="space-y-1.5 sm:col-span-2">
                    <Label htmlFor="order-address" className="text-xs font-medium">
                      Street Address *
                    </Label>
                    <Input
                      id="order-address"
                      required
                      value={address}
                      onChange={(e) => setAddress(e.target.value)}
                      placeholder="123 Luxury Avenue"
                      className="h-10 text-sm rounded-xl"
                    />
                  </div>

                  <div className="space-y-1.5">
                    <Label htmlFor="order-city" className="text-xs font-medium">
                      City *
                    </Label>
                    <Input
                      id="order-city"
                      required
                      value={city}
                      onChange={(e) => setCity(e.target.value)}
                      placeholder="Springfield"
                      className="h-10 text-sm rounded-xl"
                    />
                  </div>

                  <div className="space-y-1.5">
                    <Label htmlFor="order-zip" className="text-xs font-medium">
                      Postal / ZIP Code *
                    </Label>
                    <Input
                      id="order-zip"
                      required
                      value={zipCode}
                      onChange={(e) => setZipCode(e.target.value)}
                      placeholder="97477"
                      className="h-10 text-sm rounded-xl"
                    />
                  </div>
                </div>
              </div>

              {/* Order Summary Pricing Breakdown */}
              <div className="rounded-2xl bg-muted/30 border border-border p-4 space-y-2 text-xs">
                <div className="flex items-center justify-between text-muted-foreground">
                  <span>Items Subtotal</span>
                  <span className="font-semibold text-foreground">
                    ${subtotal.toFixed(2)}
                  </span>
                </div>
                <div className="flex items-center justify-between text-muted-foreground">
                  <span>Botanical Carbon-Neutral Shipping</span>
                  <span>
                    {shipping === 0 ? (
                      <span className="font-semibold text-emerald-700 dark:text-emerald-400">
                        FREE
                      </span>
                    ) : (
                      `$${shipping.toFixed(2)}`
                    )}
                  </span>
                </div>
                <div className="flex items-center justify-between text-muted-foreground">
                  <span>Estimated Tax</span>
                  <span className="font-semibold text-foreground">$0.00</span>
                </div>
                <Separator className="my-2" />
                <div className="flex items-center justify-between text-sm font-bold text-foreground">
                  <span>Total Amount</span>
                  <span className="text-base text-emerald-950 dark:text-emerald-200">
                    ${total.toFixed(2)}
                  </span>
                </div>
              </div>

              {formError && (
                <div className="p-3 rounded-xl bg-destructive/10 border border-destructive/20 text-destructive text-xs">
                  {formError}
                </div>
              )}
            </form>
          ) : (
            /* Confirmation View */
            <div className="py-6 flex flex-col items-center text-center space-y-5 animate-in zoom-in-95 duration-200">
              <div className="size-20 rounded-full bg-emerald-100 dark:bg-emerald-900/60 border border-emerald-300 dark:border-emerald-700 flex items-center justify-center text-emerald-700 dark:text-emerald-300 shadow-sm">
                <HugeiconsIcon icon={CheckmarkCircle02Icon} className="size-11" />
              </div>

              <div className="space-y-1.5">
                <h3 className="text-2xl font-serif font-bold text-foreground">
                  Thank You for Your Order!
                </h3>
                <p className="text-sm text-muted-foreground max-w-md mx-auto">
                  Your botanical luxury essentials are being lovingly prepared and will ship to:
                </p>
                <p className="text-sm font-semibold text-foreground pt-1">
                  {fullName}, {address}, {city} {zipCode}
                </p>
              </div>

              <div className="w-full rounded-2xl bg-muted/30 border border-border p-5 text-left space-y-3">
                <div className="flex items-center justify-between text-xs border-b border-border/60 pb-2">
                  <span className="text-muted-foreground">Order Reference:</span>
                  <span className="font-mono font-bold text-emerald-900 dark:text-emerald-300">
                    #{confirmedOrderId}
                  </span>
                </div>
                <div className="flex items-center justify-between text-xs border-b border-border/60 pb-2">
                  <span className="text-muted-foreground">Payment Status:</span>
                  <Badge variant="outline" className="text-[10px] bg-emerald-50 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-300 border-emerald-200 dark:border-emerald-800">
                    COMPLETED
                  </Badge>
                </div>
                <div className="flex items-center justify-between text-xs">
                  <span className="text-muted-foreground">Total Paid:</span>
                  <span className="font-bold text-foreground">${total.toFixed(2)}</span>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Modal Footer */}
        <div className="px-6 py-4 border-t border-border/80 bg-muted/20 shrink-0 flex items-center justify-end gap-3">
          {step === "review" ? (
            <>
              <Button
                type="button"
                variant="outline"
                onClick={handleClose}
                className="rounded-full text-xs h-10 px-5 cursor-pointer"
              >
                Back to {checkoutSource === "buy_now" ? "Product" : "Bag"}
              </Button>

              <Button
                type="submit"
                form="order-review-form"
                disabled={createOrderMutation.isPending || checkoutItems.length === 0}
                className="rounded-full bg-emerald-900 hover:bg-emerald-800 text-white text-xs h-10 px-6 font-semibold flex items-center gap-2 shadow-md active:scale-98 cursor-pointer disabled:opacity-50"
              >
                {createOrderMutation.isPending ? (
                  <>
                    <HugeiconsIcon icon={Loading03Icon} className="size-4 animate-spin" />
                    <span>Processing Order...</span>
                  </>
                ) : (
                  <>
                    <span>Place Order (${total.toFixed(2)})</span>
                    <HugeiconsIcon icon={ArrowRight01Icon} className="size-3.5" />
                  </>
                )}
              </Button>
            </>
          ) : (
            <Button
              type="button"
              onClick={handleClose}
              className="w-full rounded-full bg-emerald-900 hover:bg-emerald-800 text-white text-xs h-10 font-semibold cursor-pointer"
            >
              Continue Shopping
            </Button>
          )}
        </div>
      </div>
    </div>
  );
}
