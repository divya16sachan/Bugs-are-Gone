"use client";

import Link from "next/link";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { HugeiconsIcon } from "@hugeicons/react";
import {
  Leaf01Icon,
  Facebook01Icon,
  TwitterIcon,
  InstagramIcon,
  PinterestIcon,
} from "@hugeicons/core-free-icons";

export function ShopFooter() {
  return (
    <footer className={cn("w-full bg-emerald-950 text-emerald-100 py-16 border-t border-emerald-900")}>
      <div className={cn("max-w-7xl mx-auto px-4 grid grid-cols-1 md:grid-cols-4 gap-10")}>
        {/* Col 1: Brand Info */}
        <div className={cn("space-y-4 md:col-span-1")}>
          <div className={cn("flex items-center gap-2.5")}>
            <div className={cn("size-8 rounded-full bg-white text-emerald-950 flex items-center justify-center")}>
              <HugeiconsIcon icon={Leaf01Icon} className={cn("size-5")} />
            </div>
            <span className={cn("font-serif text-xl font-bold tracking-tight text-white")}>
              Beauty Shop<span className={cn("text-emerald-400")}>.</span>
            </span>
          </div>
          <p className={cn("text-xs text-emerald-300/80 leading-relaxed")}>
            Discover luxury, clean and scientifically proven botanical skincare and
            beauty essentials crafted to nourish your natural glow.
          </p>
          <div className={cn("flex items-center gap-3 pt-2")}>
            <a href="#" aria-label="Facebook" className={cn("text-emerald-300 hover:text-white transition-colors")}>
              <HugeiconsIcon icon={Facebook01Icon} className={cn("size-4")} />
            </a>
            <a href="#" aria-label="Twitter" className={cn("text-emerald-300 hover:text-white transition-colors")}>
              <HugeiconsIcon icon={TwitterIcon} className={cn("size-4")} />
            </a>
            <a href="#" aria-label="Instagram" className={cn("text-emerald-300 hover:text-white transition-colors")}>
              <HugeiconsIcon icon={InstagramIcon} className={cn("size-4")} />
            </a>
            <a href="#" aria-label="Pinterest" className={cn("text-emerald-300 hover:text-white transition-colors")}>
              <HugeiconsIcon icon={PinterestIcon} className={cn("size-4")} />
            </a>
          </div>
        </div>

        {/* Col 2: Quick Links */}
        <div className={cn("space-y-3")}>
          <h4 className={cn("text-sm font-semibold text-white")}>Shop Categories</h4>
          <ul className={cn("space-y-2 text-xs text-emerald-200/80")}>
            <li>
              <Link href="/?category=Skin+Care" className={cn("hover:text-white transition-colors")}>
                Skin Care
              </Link>
            </li>
            <li>
              <Link href="/?category=Makeup" className={cn("hover:text-white transition-colors")}>
                Makeup Essentials
              </Link>
            </li>
            <li>
              <Link href="/?category=Hair+Care" className={cn("hover:text-white transition-colors")}>
                Hair Care
              </Link>
            </li>
            <li>
              <Link href="/?category=Body+Care" className={cn("hover:text-white transition-colors")}>
                Body &amp; Bath
              </Link>
            </li>
          </ul>
        </div>

        {/* Col 3: Customer Support */}
        <div className={cn("space-y-3")}>
          <h4 className={cn("text-sm font-semibold text-white")}>Customer Care</h4>
          <ul className={cn("space-y-2 text-xs text-emerald-200/80")}>
            <li>
              <a href="#" className={cn("hover:text-white transition-colors")}>
                Order Tracking
              </a>
            </li>
            <li>
              <a href="#" className={cn("hover:text-white transition-colors")}>
                Shipping &amp; Delivery
              </a>
            </li>
            <li>
              <a href="#" className={cn("hover:text-white transition-colors")}>
                Returns &amp; Refunds
              </a>
            </li>
            <li>
              <a href="#" className={cn("hover:text-white transition-colors")}>
                Privacy &amp; Terms
              </a>
            </li>
          </ul>
        </div>

        {/* Col 4: Newsletter */}
        <div className={cn("space-y-3 md:col-span-1")}>
          <h4 className={cn("text-sm font-semibold text-white")}>Stay in the Glow</h4>
          <p className={cn("text-xs text-emerald-200/80")}>
            Subscribe for 20% off your first purchase and exclusive botanical tips.
          </p>
          <form
            onSubmit={(e) => e.preventDefault()}
            className={cn("flex flex-col sm:flex-row gap-2 pt-1")}
          >
            <Input
              type="email"
              placeholder="Your email address"
              className={cn("bg-emerald-900/60 border-emerald-800 text-white placeholder:text-emerald-400/60 text-xs h-9")}
            />
            <Button
              type="submit"
              className={cn("bg-white text-emerald-950 hover:bg-emerald-100 font-semibold text-xs h-9 shrink-0 px-4")}
            >
              Subscribe
            </Button>
          </form>
        </div>
      </div>

      <div className={cn("max-w-7xl mx-auto px-4 mt-12 pt-6 border-t border-emerald-900/80 flex flex-col sm:flex-row items-center justify-between text-xs text-emerald-300/60 gap-4")}>
        <p>&copy; {new Date().getFullYear()} Beauty Shop. All rights reserved.</p>
        <p>Crafted for pure natural beauty and wellness.</p>
      </div>
    </footer>
  );
}
