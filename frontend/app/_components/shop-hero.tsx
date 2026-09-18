import Link from "next/link";
import { cn } from "@/lib/utils";

export function ShopHero() {
  return (
    <section
      className={cn(
        "relative w-full py-12 sm:py-16 bg-gradient-to-b from-stone-50 via-stone-50 to-background dark:from-stone-950 dark:via-stone-900 dark:to-background border-b border-border/50 overflow-hidden"
      )}
    >
      {/* Subtle Botanical / Dot Motif Ornaments */}
      <div
        aria-hidden="true"
        className={cn(
          "absolute left-6 top-1/2 -translate-y-1/2 opacity-20 pointer-events-none hidden md:block"
        )}
      >
        <svg
          className={cn("w-32 h-32 text-stone-400")}
          fill="currentColor"
          viewBox="0 0 100 100"
        >
          <circle cx="20" cy="20" r="3" />
          <circle cx="40" cy="15" r="2" />
          <circle cx="60" cy="25" r="4" />
          <circle cx="30" cy="40" r="2" />
          <circle cx="50" cy="50" r="3" />
          <circle cx="70" cy="45" r="2" />
          <circle cx="25" cy="70" r="3" />
          <circle cx="55" cy="75" r="4" />
          <circle cx="80" cy="70" r="2" />
        </svg>
      </div>

      <div
        aria-hidden="true"
        className={cn(
          "absolute right-6 top-1/2 -translate-y-1/2 opacity-20 pointer-events-none hidden md:block"
        )}
      >
        <svg
          className={cn("w-32 h-32 text-stone-400")}
          fill="currentColor"
          viewBox="0 0 100 100"
        >
          <circle cx="30" cy="25" r="4" />
          <circle cx="50" cy="15" r="2" />
          <circle cx="75" cy="30" r="3" />
          <circle cx="40" cy="55" r="3" />
          <circle cx="65" cy="50" r="2" />
          <circle cx="85" cy="60" r="4" />
          <circle cx="35" cy="80" r="2" />
          <circle cx="60" cy="75" r="3" />
        </svg>
      </div>

      <div className={cn("max-w-7xl mx-auto px-4 flex flex-col items-center justify-center text-center")}>
        <h1 className={cn("text-3xl sm:text-4xl font-serif font-bold tracking-tight text-foreground mb-2")}>
          Shop
        </h1>
        <nav aria-label="Breadcrumb" className={cn("flex items-center gap-2 text-sm text-muted-foreground")}>
          <Link
            href="/"
            className={cn("hover:text-foreground transition-colors font-normal")}
          >
            Home
          </Link>
          <span>/</span>
          <span className={cn("text-foreground font-medium")}>Shop</span>
        </nav>
      </div>
    </section>
  );
}
