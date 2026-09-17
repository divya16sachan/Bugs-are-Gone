"use client";

import { useState } from "react";
import Link from "next/link";
import { cn } from "@/lib/utils";
import { HugeiconsIcon } from "@hugeicons/react";
import {
  Leaf01Icon,
  Search01Icon,
  FavouriteIcon,
  ShoppingBag01Icon,
  UserIcon,
  Menu01Icon,
  Cancel01Icon,
} from "@hugeicons/core-free-icons";

const NAV_LINKS = [
  { label: "Home", href: "/" },
  { label: "Shop", href: "/products", active: true },
  { label: "Skin Care", href: "/products?category=Skin+Care" },
  { label: "Makeup", href: "/products?category=Makeup" },
  { label: "Hair Care", href: "/products?category=Hair+Care" },
  { label: "About Us", href: "/about" },
  { label: "Blogs", href: "/blogs" },
];

export function ShopNavbar() {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

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

        {/* Center Desktop Navigation */}
        <nav className={cn("hidden lg:flex items-center gap-8")}>
          {NAV_LINKS.map((link) => (
            <Link
              key={link.label}
              href={link.href}
              className={cn(
                "text-sm transition-colors relative py-1",
                link.active
                  ? "font-semibold text-emerald-900 dark:text-emerald-400 after:absolute after:bottom-0 after:left-0 after:right-0 after:h-0.5 after:bg-emerald-900 dark:after:bg-emerald-400"
                  : "text-muted-foreground hover:text-foreground font-normal"
              )}
            >
              {link.label}
            </Link>
          ))}
        </nav>

        {/* Right Actions */}
        <div className={cn("flex items-center gap-3 sm:gap-4")}>
          <button
            type="button"
            aria-label="Search products"
            className={cn(
              "p-2 text-foreground hover:text-emerald-800 transition-colors rounded-full hover:bg-muted"
            )}
          >
            <HugeiconsIcon icon={Search01Icon} className={cn("size-5")} />
          </button>

          <button
            type="button"
            aria-label="Wishlist"
            className={cn(
              "p-2 text-foreground hover:text-emerald-800 transition-colors rounded-full hover:bg-muted relative"
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
              "p-2 text-foreground hover:text-emerald-800 transition-colors rounded-full hover:bg-muted relative"
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
              "p-2 text-foreground hover:text-emerald-800 transition-colors rounded-full hover:bg-muted"
            )}
          >
            <HugeiconsIcon icon={UserIcon} className={cn("size-5")} />
          </button>

          {/* Mobile Menu Trigger */}
          <button
            type="button"
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            aria-label="Toggle navigation menu"
            className={cn(
              "lg:hidden p-2 text-foreground hover:text-emerald-800 transition-colors rounded-md"
            )}
          >
            <HugeiconsIcon
              icon={mobileMenuOpen ? Cancel01Icon : Menu01Icon}
              className={cn("size-6")}
            />
          </button>
        </div>
      </div>

      {/* Mobile Menu Dropdown */}
      {mobileMenuOpen && (
        <div className={cn("lg:hidden border-t border-border bg-background px-4 py-4")}>
          <nav className={cn("flex flex-col gap-3")}>
            {NAV_LINKS.map((link) => (
              <Link
                key={link.label}
                href={link.href}
                onClick={() => setMobileMenuOpen(false)}
                className={cn(
                  "py-2 text-sm font-medium transition-colors",
                  link.active
                    ? "text-emerald-900 dark:text-emerald-400 font-semibold"
                    : "text-muted-foreground hover:text-foreground"
                )}
              >
                {link.label}
              </Link>
            ))}
          </nav>
        </div>
      )}
    </header>
  );
}
