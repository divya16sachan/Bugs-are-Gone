import { Suspense } from "react";
import type { Metadata } from "next";
import { ShopNavbar } from "./_components/shop-navbar";
import { ShopHero } from "./_components/shop-hero";
import { ProductGrid } from "./_components/product-grid";
import { FeaturesBanner } from "./_components/features-banner";
import { ShopFooter } from "./_components/shop-footer";
import { CatalogSkeleton } from "./_components/catalog-skeleton";

export const metadata: Metadata = {
  title: "Shop Beauty & Skincare Products | Beauty Shop",
  description:
    "Explore our curated collection of luxury botanical serums, moisturizers, makeup, and organic skincare essentials.",
};

export default function HomePage() {
  return (
    <div className="min-h-screen flex flex-col bg-background text-foreground">
      {/* Main Navigation */}
      <ShopNavbar />

      {/* Hero / Breadcrumbs Section */}
      <Suspense
        fallback={
          <section className="w-full py-12 sm:py-16 bg-gradient-to-b from-stone-50 via-stone-50 to-background dark:from-stone-950 dark:via-stone-900 dark:to-background border-b border-border/50 flex flex-col items-center justify-center text-center">
            <h1 className="text-3xl sm:text-4xl font-serif font-bold tracking-tight text-foreground mb-2">
              Shop
            </h1>
          </section>
        }
      >
        <ShopHero />
      </Suspense>

      {/* Main Catalog View with Suspense boundary for useSearchParams */}
      <main className="flex-1">
        <Suspense fallback={<CatalogSkeleton />}>
          <ProductGrid />
        </Suspense>
      </main>

      {/* Value Propositions / Features Banner */}
      <FeaturesBanner />

      {/* Footer */}
      <ShopFooter />
    </div>
  );
}
