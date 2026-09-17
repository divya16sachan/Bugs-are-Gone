import type { Metadata } from "next";
import { ShopAnnouncement } from "./_components/shop-announcement";
import { ShopNavbar } from "./_components/shop-navbar";
import { ShopHero } from "./_components/shop-hero";
import { ProductGrid } from "./_components/product-grid";
import { FeaturesBanner } from "./_components/features-banner";
import { ShopFooter } from "./_components/shop-footer";
import { QueryProvider } from "./_components/query-provider";

export const metadata: Metadata = {
    title: "Shop Beauty & Skincare Products | Beauty Shop",
    description:
        "Explore our curated collection of luxury botanical serums, moisturizers, makeup, and organic skincare essentials.",
};

export default function ProductsPage() {
    return (
        <div className="min-h-screen flex flex-col bg-background text-foreground">
            {/* Top Announcement Bar */}
            <ShopAnnouncement />

            {/* Main Navigation */}
            <ShopNavbar />

            {/* Hero / Breadcrumbs Section */}
            <ShopHero />

            {/* Main Catalog View with TanStack Query Provider */}
            <main className="flex-1">
                <QueryProvider>
                    <ProductGrid />
                </QueryProvider>
            </main>

            {/* Value Propositions / Features Banner */}
            <FeaturesBanner />

            {/* Footer */}
            <ShopFooter />
        </div>
    );
}
