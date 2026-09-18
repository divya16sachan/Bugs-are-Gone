"use client";

import Link from "next/link";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { HugeiconsIcon } from "@hugeicons/react";
import {
  Leaf01Icon,
  Search01Icon,
  FavouriteIcon,
  ShoppingBag01Icon,
  UserIcon,
} from "@hugeicons/core-free-icons";

export function ShopNavbar() {
  return (
    <header className={cn("sticky top-0 z-40 w-full bg-background border-b border-border")}>
      <div className={cn("max-w-7xl mx-auto px-4 h-20 flex items-center justify-between gap-8")}>
        {/* Brand Logo */}
        <Link href="/" className={cn("flex items-center gap-2.5 group")}>
          <div
            className={cn(
              "size-9 rounded-full bg-emerald-950 flex items-center justify-center text-emerald-300 transition-transform group-hover:scale-105"
            )}
          >
            <HugeiconsIcon icon={Leaf01Icon} className={cn("size-5")} />
          </div>
          <span className={cn("font-serif text-xl font-bold tracking-tight text-foreground")}>
            Beauty Shop<span className={cn("text-emerald-700")}>.</span>
          </span>
        </Link>

        {/* Right Actions */}
        <div className={cn("flex items-center gap-1 sm:gap-2")}>
          <Button
            type="button"
            variant="ghost"
            size="icon"
            tooltip="Search products"
            aria-label="Search products"
            className={cn("rounded-full text-foreground hover:text-emerald-800 hover:bg-muted")}
          >
            <HugeiconsIcon icon={Search01Icon} className={cn("size-5")} />
          </Button>

          <Button
            type="button"
            variant="ghost"
            size="icon"
            tooltip="Wishlist"
            aria-label="Wishlist"
            className={cn("rounded-full text-foreground hover:text-emerald-800 hover:bg-muted relative")}
          >
            <HugeiconsIcon icon={FavouriteIcon} className={cn("size-5")} />
            <span
              className={cn(
                "absolute top-1.5 right-1.5 size-2 rounded-full bg-emerald-700 ring-2 ring-background"
              )}
            />
          </Button>

          <Button
            type="button"
            variant="ghost"
            size="icon"
            tooltip="Shopping Cart"
            aria-label="Shopping Cart"
            className={cn("rounded-full text-foreground hover:text-emerald-800 hover:bg-muted relative")}
          >
            <HugeiconsIcon icon={ShoppingBag01Icon} className={cn("size-5")} />
            <span
              className={cn(
                "absolute 0.5 top-0.5 right-0.5 size-4 rounded-full bg-emerald-900 text-white text-[10px] font-semibold flex items-center justify-center leading-none"
              )}
            >
              3
            </span>
          </Button>

          <Button
            type="button"
            variant="ghost"
            size="icon"
            tooltip="User Account"
            aria-label="User Account"
            className={cn("rounded-full text-foreground hover:text-emerald-800 hover:bg-muted")}
          >
            <HugeiconsIcon icon={UserIcon} className={cn("size-5")} />
          </Button>
        </div>
      </div>
    </header>
  );
}
