import { Suspense } from "react";
import type { Metadata } from "next";
import { ShopAnnouncement } from "./_components/shop-announcement";
import { ShopNavbar } from "./_components/shop-navbar";
import { ShopHero } from "./_components/shop-hero";
import { ProductGrid } from "./_components/product-grid";
import { FeaturesBanner } from "./_components/features-banner";
import { ShopFooter } from "./_components/shop-footer";
import { QueryProvider } from "./_components/query-provider";

import { CatalogSkeleton } from "./_components/catalog-skeleton";

export const metadata: Metadata = {
  title: "Shop Beauty & Skincare Products | Beauty Shop",
  description:
    "Explore our curated collection of luxury botanical serums, moisturizers, makeup, and organic skincare essentials.",
};

export default function HomePage() {
  return (
    <div className="min-h-screen flex flex-col bg-background text-foreground">
      {/* Top Announcement Bar */}
      <ShopAnnouncement />

      {/* Main Navigation */}
      <ShopNavbar />

      {/* Hero / Breadcrumbs Section */}
      <ShopHero />

      {/* Main Catalog View with TanStack Query Provider and Suspense boundary for useSearchParams */}
      <main className="flex-1">
        <QueryProvider>
          <Suspense fallback={<CatalogSkeleton />}>
            <ProductGrid />
          </Suspense>
        </QueryProvider>
      </main>

      {/* Value Propositions / Features Banner */}
      <FeaturesBanner />

      {/* Footer */}
      <ShopFooter />
    </div>
  );
}
