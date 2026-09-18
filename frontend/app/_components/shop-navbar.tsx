"use client";

import Link from "next/link";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import {
  Popover,
  PopoverTrigger,
  PopoverContent,
} from "@/components/ui/popover";
import { Separator } from "@/components/ui/separator";
import { Badge } from "@/components/ui/badge";
import { useSession, useLogout } from "@/features/auth/hooks";
import { HugeiconsIcon } from "@hugeicons/react";
import {
  Leaf01Icon,
  Search01Icon,
  FavouriteIcon,
  ShoppingBag01Icon,
  UserIcon,
  Logout01Icon,
  Mail01Icon,
  Book02Icon,
} from "@hugeicons/core-free-icons";

export function ShopNavbar() {
  const { data: user, isLoading } = useSession();
  const logout = useLogout();

  const userInitials = user?.name
    ? user.name
        .split(" ")
        .map((part) => part[0])
        .join("")
        .slice(0, 2)
        .toUpperCase()
    : "U";

  return (
    <header className={cn("sticky top-0 z-40 w-full bg-background border-b border-border")}>
      <div className={cn("max-w-7xl mx-auto px-4 h-20 flex items-center justify-between gap-8")}>
        {/* Brand Logo & Nav Links */}
        <div className="flex items-center gap-6">
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

          <nav className="hidden md:flex items-center gap-1.5">
            <Link
              href="/docs"
              className={cn(
                "flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold text-emerald-900 dark:text-emerald-300 bg-emerald-50 dark:bg-emerald-950/60 border border-emerald-200 dark:border-emerald-800/60 hover:bg-emerald-100 dark:hover:bg-emerald-900 transition-colors"
              )}
            >
              <HugeiconsIcon icon={Book02Icon} className="size-3.5" />
              <span>API Docs</span>
            </Link>
          </nav>
        </div>

        {/* Right Actions */}
        <div className={cn("flex items-center gap-1 sm:gap-2")}>
          <Link
            href="/docs"
            className={cn(
              "md:hidden flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold text-emerald-900 dark:text-emerald-300 bg-emerald-50 dark:bg-emerald-950/60 border border-emerald-200 dark:border-emerald-800/60 mr-1"
            )}
            aria-label="API Docs"
          >
            <HugeiconsIcon icon={Book02Icon} className="size-3.5" />
            <span>Docs</span>
          </Link>
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

          {/* User Account Section — Only shown for authenticated users */}
          {!isLoading && user ? (
            <Popover>
              <PopoverTrigger
                className={"size-9 rounded-full bg-emerald-900 text-emerald-100 font-bold text-sm flex items-center justify-center shrink-0 shadow-inner"}
                aria-label="User Account"
              >
                {userInitials}
              </PopoverTrigger>

              <PopoverContent
                align="end"
                sideOffset={8}
                className={cn("w-72 p-0 rounded-2xl shadow-xl border border-border/80 overflow-hidden bg-background")}
              >
                {/* User Details Header */}
                <div className="p-4 bg-muted/40">
                  <div className="flex items-center gap-3">
                    <div className="size-11 rounded-full bg-emerald-900 text-emerald-100 font-bold text-sm flex items-center justify-center shrink-0 shadow-inner">
                      {userInitials}
                    </div>
                    <div className="flex flex-col min-w-0 flex-1">
                      <div className="flex items-center gap-2">
                        <span className="font-semibold text-sm text-foreground truncate">
                          {user.name || "User"}
                        </span>
                      </div>
                      <p className="text-xs text-muted-foreground truncate mt-0.5 flex items-center gap-1">
                        <HugeiconsIcon icon={Mail01Icon} className="size-3.5 shrink-0 text-muted-foreground/70" />
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
          ) : !isLoading ? (
            <Link href="/login">
              <Button
                variant="ghost"
                size="sm"
                className="rounded-full text-xs font-semibold text-foreground hover:text-emerald-800 hover:bg-muted px-3"
              >
                Sign in
              </Button>
            </Link>
          ) : null}
        </div>
      </div>
    </header>
  );
}
