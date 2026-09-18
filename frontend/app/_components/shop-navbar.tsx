"use client";

import Link from "next/link";
import { cn } from "@/lib/utils";
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
        <div className={cn("flex items-center gap-3 sm:gap-4")}>
          <button
            type="button"
            aria-label="Search products"
            className={cn(
              "p-2 text-foreground hover:text-emerald-800 transition-colors rounded-full hover:bg-muted cursor-pointer"
            )}
          >
            <HugeiconsIcon icon={Search01Icon} className={cn("size-5")} />
          </button>

          <button
            type="button"
            aria-label="Wishlist"
            className={cn(
              "p-2 text-foreground hover:text-emerald-800 transition-colors rounded-full hover:bg-muted relative cursor-pointer"
            )}
          >
            <HugeiconsIcon icon={FavouriteIcon} className={cn("size-5")} />
            <span
              className={cn(
                "absolute top-1 right-1 size-2 rounded-full bg-emerald-700 ring-2 ring-background"
              )}
            />
          </button>

          <button
            type="button"
            aria-label="Shopping Cart"
            className={cn(
              "p-2 text-foreground hover:text-emerald-800 transition-colors rounded-full hover:bg-muted relative cursor-pointer"
            )}
          >
            <HugeiconsIcon icon={ShoppingBag01Icon} className={cn("size-5")} />
            <span
              className={cn(
                "absolute -top-0.5 -right-0.5 size-4 rounded-full bg-emerald-900 text-white text-xs font-semibold flex items-center justify-center leading-none"
              )}
            >
              3
            </span>
          </button>

          <button
            type="button"
            aria-label="User Account"
            className={cn(
              "p-2 text-foreground hover:text-emerald-800 transition-colors rounded-full hover:bg-muted cursor-pointer"
            )}
          >
            <HugeiconsIcon icon={UserIcon} className={cn("size-5")} />
          </button>
        </div>
      </div>
    </header>
  );
}
