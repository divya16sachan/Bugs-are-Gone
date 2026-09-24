"use client";

import { useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Popover,
  PopoverTrigger,
  PopoverContent,
} from "@/components/ui/popover";
import { Separator } from "@/components/ui/separator";
import { useSession, useLogout } from "@/features/auth/hooks";
import { HugeiconsIcon } from "@hugeicons/react";
import {
  Search01Icon,
  FavouriteIcon,
  ShoppingBag01Icon,
  Logout01Icon,
  Mail01Icon,
  Book02Icon,
} from "@hugeicons/core-free-icons";

export function ShopNavbar() {
  const router = useRouter();
  const { data: user, isLoading } = useSession();
  const logout = useLogout();
<<<<<<< HEAD
  const { totalCount, openCart } = useCart();
=======
  const { itemCount: cartCount, openCart } = useCart();
  const { itemCount: wishlistCount, openWishlist } = useWishlist();

  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");

  const grafanaUrl = process.env.NEXT_PUBLIC_GRAFANA_URL || "http://localhost:3010";
>>>>>>> 816d700 (feat: complete e-commerce UI, stabilize k8s external routing, and configure prometheus metrics)

  const userInitials = user?.name
    ? user.name
      .split(" ")
      .map((part) => part[0])
      .join("")
      .slice(0, 2)
      .toUpperCase()
    : "U";

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const query = searchQuery.trim();
    if (query) {
      router.push(`/?search=${encodeURIComponent(query)}`);
      setIsSearchOpen(false);
    }
  };

  return (
    <>
      <header className={cn("sticky top-0 z-40 w-full bg-background border-b border-border")}>
        <div className={cn("max-w-7xl mx-auto px-4 h-20 flex items-center justify-between gap-8")}>
          {/* Brand Logo & Nav Links */}
          <div className="flex items-center gap-6">
            <Link href="/" className={cn("flex items-center gap-2.5 group")}>
              <Image
                src="/logo.svg"
                alt="Beauty Shop"
                width={36}
                height={36}
                className="size-9 rounded-full object-cover transition-transform group-hover:scale-105 shadow-sm shrink-0"
                priority
              />
              <span className={cn("font-serif text-xl font-bold tracking-tight text-foreground")}>
                Beauty Shop<span className={cn("text-emerald-700")}>.</span>
              </span>
            </Link>

            <nav className="hidden md:flex items-center gap-2">
              <Link
                href="/docs"
                className={cn(
                  "flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold text-emerald-900 dark:text-emerald-300 bg-emerald-50 dark:bg-emerald-950/60 border border-emerald-200 dark:border-emerald-800/60 hover:bg-emerald-100 dark:hover:bg-emerald-900 transition-colors"
                )}
              >
                <HugeiconsIcon icon={Book02Icon} className="size-3.5" />
                <span>API Docs</span>
              </Link>

              <a
                href={grafanaUrl}
                target="_blank"
                rel="noopener noreferrer"
                className={cn(
                  "flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold text-orange-950 dark:text-orange-300 bg-orange-50 dark:bg-orange-950/60 border border-orange-200 dark:border-orange-800/60 hover:bg-orange-100 dark:hover:bg-orange-900 transition-colors"
                )}
              >
                <GrafanaIcon className="size-3.5 text-[#F46800]" />
                <span>Grafana</span>
              </a>
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

<<<<<<< HEAD
  {/* Right Actions */ }
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
      onClick={openCart}
      id="navbar-cart-btn"
      tooltip={`Shopping Bag (${totalCount} items)`}
      aria-label={`Shopping Bag (${totalCount} items)`}
      className={cn("rounded-full text-foreground hover:text-emerald-800 hover:bg-muted relative cursor-pointer")}
    >
      <HugeiconsIcon icon={ShoppingBag01Icon} className={cn("size-5")} />
      {totalCount > 0 && (
        <span
          className={cn(
            "absolute top-0.5 right-0.5 min-w-4 h-4 px-1 rounded-full bg-emerald-900 text-white text-[10px] font-semibold flex items-center justify-center leading-none shadow-xs"
          )}
        >
          {totalCount}
        </span>
      )}
    </Button>
=======
            {/* Grafana Icon Header Button */}
    <Button
      type="button"
      variant="ghost"
      size="icon"
      onClick={() => window.open(grafanaUrl, "_blank", "noopener,noreferrer")}
      tooltip="Grafana Dashboard (Port 3010)"
      aria-label="Open Grafana Dashboard"
      className={cn("rounded-full text-[#F46800] hover:bg-orange-50 dark:hover:bg-orange-950/40 hover:text-orange-600 cursor-pointer")}
    >
      <GrafanaIcon className="size-5" />
    </Button>
>>>>>>> 816d700 (feat: complete e-commerce UI, stabilize k8s external routing, and configure prometheus metrics)

    {/* Search Popover */}
    <Popover open={isSearchOpen} onOpenChange={setIsSearchOpen}>
      <PopoverTrigger
        className={cn(
          "inline-flex size-9 items-center justify-center rounded-full text-foreground hover:text-emerald-800 hover:bg-muted transition-colors cursor-pointer"
        )}
        aria-label="Search products"
      >
        <HugeiconsIcon icon={Search01Icon} className={cn("size-5")} />
      </PopoverTrigger>
      <PopoverContent
        align="end"
        sideOffset={8}
        className={cn("w-80 p-2.5 rounded-2xl shadow-xl border border-border bg-background")}
      >
        <form onSubmit={handleSearchSubmit} className="flex items-center gap-2">
          <div className="relative flex-1">
            <HugeiconsIcon
              icon={Search01Icon}
              className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground"
            />
            <Input
              type="search"
              placeholder="Search products..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-9 pr-3 h-9 text-xs rounded-xl"
              autoFocus
            />
          </div>
          <Button
            type="submit"
            size="sm"
            className="h-9 px-3 rounded-xl bg-emerald-950 hover:bg-emerald-900 text-white text-xs font-semibold"
          >
            Search
          </Button>
        </form>
      </PopoverContent>
    </Popover>

    {/* Wishlist Button */}
    <Button
      type="button"
      variant="ghost"
      size="icon"
      onClick={openWishlist}
      tooltip="Wishlist"
      aria-label="Wishlist"
      className={cn("rounded-full text-foreground hover:text-emerald-800 hover:bg-muted relative")}
    >
      <HugeiconsIcon
        icon={FavouriteIcon}
        className={cn("size-5", wishlistCount > 0 && "text-emerald-800 fill-emerald-800/20")}
      />
      {wishlistCount > 0 && (
        <span
          className={cn(
            "absolute 0.5 top-0.5 right-0.5 size-4 rounded-full bg-emerald-800 text-white text-[10px] font-semibold flex items-center justify-center leading-none"
          )}
        >
          {wishlistCount}
        </span>
      )}
    </Button>

    {/* Shopping Cart Button */}
    <Button
      type="button"
      variant="ghost"
      size="icon"
      onClick={openCart}
      tooltip="Shopping Cart"
      aria-label="Shopping Cart"
      className={cn("rounded-full text-foreground hover:text-emerald-800 hover:bg-muted relative")}
    >
      <HugeiconsIcon icon={ShoppingBag01Icon} className={cn("size-5")} />
      {cartCount > 0 && (
        <span
          className={cn(
            "absolute 0.5 top-0.5 right-0.5 size-4 rounded-full bg-emerald-900 text-white text-[10px] font-semibold flex items-center justify-center leading-none"
          )}
        >
          {cartCount}
        </span>
      )}
    </Button>

    {/* User Account Section */}
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
        </div >
      </header >

    {/* Global Slide-Over Drawers */ }
    < CartSheet />
    <WishlistSheet />
    </>
  );
}
