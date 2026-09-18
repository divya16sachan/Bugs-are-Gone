import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { MOCK_PRODUCTS } from "../_components/mock-products";
import { ShopAnnouncement } from "../_components/shop-announcement";
import { ShopNavbar } from "../_components/shop-navbar";
import { ShopFooter } from "../_components/shop-footer";
import { BackButton } from "./_components/back-button";
import ProductGallery from "./_components/product-gallery";
import ProductInfo from "./_components/product-info";
import ProductActions from "./_components/product-actions";
import ProductDetails from "./_components/product-details";
import ProductReviews from "./_components/product-reviews";
import RelatedProducts from "./_components/related-products";

interface PageProps {
  params: Promise<{ id: string }>;
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { id } = await params;
  const product = MOCK_PRODUCTS.find((p) => p.id === id);

  if (!product) {
    return {
      title: "Product Not Found | Beauty Shop",
    };
  }

  return {
    title: `${product.title} | Beauty Shop`,
    description: product.description,
  };
}

export default async function ProductDetailPage({ params }: PageProps) {
  const { id } = await params;
  const product = MOCK_PRODUCTS.find((p) => p.id === id);

  if (!product) {
    notFound();
  }

  return (
    <div className="min-h-screen flex flex-col bg-stone-50 text-stone-900">
      {/* Top Announcement Bar */}
      <ShopAnnouncement />

      {/* Navigation Header */}
      <ShopNavbar />

      <main className="flex-1">
        {/* Back Button */}
        <div className="mx-auto max-w-7xl px-4 pt-6 pb-2 sm:px-6 lg:px-8">
          <BackButton />
        </div>

        <div className="mx-auto max-w-7xl px-4 py-4 sm:px-6 lg:px-8">
          {/* Product Hero Section: Gallery & Info/Actions */}
          <section className="grid gap-10 lg:grid-cols-2 lg:items-start lg:gap-16">
            <ProductGallery product={product} />

            <div className="space-y-7">
              <ProductInfo product={product} />
              <ProductActions product={product} />
            </div>
          </section>

          {/* Product Details, Reviews, and Related Items */}
          <div className="mt-14 space-y-12">
            <ProductDetails product={product} />
            <ProductReviews product={product} />
            <RelatedProducts currentProduct={product} />
          </div>
        </div>
      </main>

      {/* Footer */}
      <ShopFooter />
    </div>
  );
}
