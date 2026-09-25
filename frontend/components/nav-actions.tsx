"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import {
  Popover,
  PopoverTrigger,
  PopoverContent,
} from "@/components/ui/popover";
import { Separator } from "@/components/ui/separator";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { useSession, useLogout } from "@/features/auth/hooks";
import { useCartStore } from "@/lib/cart-store";
import { useWishlistStore } from "@/lib/wishlist-store";
import { getUserAvatar } from "@/lib/avatar";
import { CartSheet } from "@/app/_components/cart-sheet";
import { WishlistSheet } from "@/app/_components/wishlist-sheet";
import { HugeiconsIcon } from "@hugeicons/react";
import {
  DashboardSquare01Icon,
  Store01Icon,
  FavouriteIcon,
  ShoppingBag01Icon,
  UserIcon,
  Logout01Icon,
  Mail01Icon,
  Book02Icon,
} from "@hugeicons/core-free-icons";

export function NavActions({ className }: { className?: string }) {
  const pathname = usePathname();
  const isDashboard = pathname?.startsWith("/dashboard");
  const { data: user, isLoading } = useSession();
  const logout = useLogout();
  const { openCart, getTotalItems } = useCartStore();
  const { openWishlist, getTotalItems: getWishlistCount } = useWishlistStore();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  const totalCartItems = mounted ? getTotalItems() : 0;
  const totalWishlistItems = mounted ? getWishlistCount() : 0;

  const userInitials = user?.name
    ? user.name
        .split(" ")
        .map((n) => n[0])
        .join("")
        .toUpperCase()
        .slice(0, 2)
    : "US";

  return (
    <TooltipProvider delay={100}>
      <div className={cn("flex items-center gap-1.5 sm:gap-2", className)}>
        {/* Cart & Wishlist Slide-Out Sheets */}
        <CartSheet />
        <WishlistSheet />

        {/* API Docs Button */}
        <Tooltip>
          <TooltipTrigger
            render={
              <Link
                href="/docs"
                className={cn(
                  "flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold text-emerald-900 dark:text-emerald-300 bg-emerald-50 dark:bg-emerald-950/60 border border-emerald-200 dark:border-emerald-800/60 hover:bg-emerald-100 dark:hover:bg-emerald-900 transition-colors",
                )}
              >
                <HugeiconsIcon icon={Book02Icon} className="size-3.5" />
                <span className="hidden sm:inline">Docs</span>
              </Link>
            }
          />
          <TooltipContent>
            <p className="text-xs">Interactive API Docs (Swagger)</p>
          </TooltipContent>
        </Tooltip>

        {/* Store / Dashboard View Switcher */}
        {!isDashboard && (
          <Button
            variant="ghost"
            size="icon"
            tooltip="Admin Dashboard"
            className="rounded-full text-foreground hover:text-emerald-800 hover:bg-muted cursor-pointer size-9"
          >
            <Link href="/dashboard">
              <HugeiconsIcon
                icon={DashboardSquare01Icon}
                className="size-4 text-emerald-600 dark:text-emerald-400"
              />
            </Link>
          </Button>
        )}

        {/* Wishlist Button */}
        <Tooltip>
          <TooltipTrigger
            render={
              <Button
                type="button"
                variant="ghost"
                size="icon"
                onClick={openWishlist}
                className="rounded-full text-foreground hover:text-emerald-800 hover:bg-muted relative size-9 cursor-pointer"
              >
                <HugeiconsIcon icon={FavouriteIcon} className="size-4" />
                {totalWishlistItems > 0 && (
                  <span className="absolute 0.5 top-0.5 right-0.5 size-4 rounded-full bg-rose-600 text-white text-[10px] font-semibold flex items-center justify-center leading-none animate-in zoom-in-50">
                    {totalWishlistItems}
                  </span>
                )}
              </Button>
            }
          />
          <TooltipContent>
            <p className="text-xs">Wishlist ({totalWishlistItems} items)</p>
          </TooltipContent>
        </Tooltip>

        {/* Cart Button */}
        <Tooltip>
          <TooltipTrigger
            render={
              <Button
                type="button"
                variant="ghost"
                size="icon"
                onClick={openCart}
                className="rounded-full text-foreground hover:text-emerald-800 hover:bg-muted relative cursor-pointer size-9"
              >
                <HugeiconsIcon icon={ShoppingBag01Icon} className="size-4" />
                {totalCartItems > 0 && (
                  <span className="absolute 0.5 top-0.5 right-0.5 size-4 rounded-full bg-emerald-900 text-white text-[10px] font-semibold flex items-center justify-center leading-none animate-in zoom-in-50">
                    {totalCartItems}
                  </span>
                )}
              </Button>
            }
          />
          <TooltipContent>
            <p className="text-xs">Shopping Cart ({totalCartItems} items)</p>
          </TooltipContent>
        </Tooltip>

        {/* User Account Section */}
        {isLoading ? (
          <Skeleton className="size-9 rounded-full" />
        ) : user ? (
          <Popover>
            <PopoverTrigger
              className="size-9 rounded-full overflow-hidden border border-border/80 flex items-center justify-center shrink-0 cursor-pointer shadow-xs hover:ring-2 hover:ring-primary/30 transition-all"
              aria-label="User Account"
            >
              <Avatar className="size-full">
                <AvatarImage
                  src={getUserAvatar(user.id, user.email)}
                  alt={user.name || "User"}
                />
                <AvatarFallback className="bg-emerald-900 text-emerald-100 font-bold text-xs">
                  {userInitials}
                </AvatarFallback>
              </Avatar>
            </PopoverTrigger>

            <PopoverContent
              align="end"
              sideOffset={8}
              className="w-72 p-0 rounded-2xl shadow-xl border border-border/80 overflow-hidden bg-background"
            >
              {/* User Details Header */}
              <div className="p-4 bg-muted/40">
                <div className="flex items-center gap-3">
                  <Avatar className="size-11 rounded-full border border-border shrink-0 shadow-sm">
                    <AvatarImage
                      src={getUserAvatar(user.id, user.email)}
                      alt={user.name || "User"}
                    />
                    <AvatarFallback className="bg-emerald-900 text-emerald-100 font-bold text-sm">
                      {userInitials}
                    </AvatarFallback>
                  </Avatar>
                  <div className="flex flex-col min-w-0 flex-1">
                    <div className="flex items-center gap-2">
                      <span className="font-semibold text-sm text-foreground truncate">
                        {user.name || "User"}
                      </span>
                    </div>
                    <p className="text-xs text-muted-foreground truncate mt-0.5 flex items-center gap-1">
                      <HugeiconsIcon
                        icon={Mail01Icon}
                        className="size-3.5 shrink-0 text-muted-foreground/70"
                      />
                      <span className="truncate">{user.email}</span>
                    </p>
                  </div>
                </div>
              </div>

              <Separator />

              {/* Popover Actions */}
              <div className="p-2">
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={() => logout()}
                  className="w-full justify-start text-red-600 hover:text-red-700 hover:bg-red-50 dark:hover:bg-red-950/30 gap-2 h-9 rounded-lg font-medium text-xs transition-colors cursor-pointer"
                >
                  <HugeiconsIcon icon={Logout01Icon} className="size-4" />
                  Sign out
                </Button>
              </div>
            </PopoverContent>
          </Popover>
        ) : (
          <Link href="/login">
            <Button
              variant="ghost"
              size="sm"
              className="rounded-full text-xs font-semibold text-foreground hover:text-emerald-800 hover:bg-muted px-3"
            >
              Sign in
            </Button>
          </Link>
        )}
      </div>
    </TooltipProvider>
  );
}
