"use client";

import Link from "next/link";
import Image from "next/image";
import { cn } from "@/lib/utils";
import { NavActions } from "@/components/nav-actions";

export function ShopNavbar() {
  return (
    <header className={cn("sticky top-0 z-40 w-full bg-background/80 backdrop-blur-md border-b border-border/60")}>
      <div className={cn("max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between gap-4")}>
        {/* Brand Logo */}
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
        </div>

        {/* Shared Right Actions */}
        <NavActions />
      </div>
    </header>
  );
}
