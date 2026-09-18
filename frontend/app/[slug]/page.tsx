import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { MOCK_PRODUCTS } from "../_components/mock-products";
import { ShopAnnouncement } from "../_components/shop-announcement";
import { ShopNavbar } from "../_components/shop-navbar";
import { ShopFooter } from "../_components/shop-footer";
import ProductGallery from "./_components/product-gallery";
import ProductInfo from "./_components/product-info";
import ProductActions from "./_components/product-actions";
import ProductDetails from "./_components/product-details";
import ProductReviews from "./_components/product-reviews";
import RelatedProducts from "./_components/related-products";

interface PageProps {
  params: Promise<{ slug: string }>;
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { slug } = await params;
  const product = MOCK_PRODUCTS.find((p) => p.slug === slug || p.id === slug);

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
  const { slug } = await params;
  const product = MOCK_PRODUCTS.find((p) => p.slug === slug || p.id === slug);

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
        {/* Sticky Breadcrumbs Bar */}
        <div className="sticky top-20 z-30 w-full border-b border-stone-200/80 bg-stone-50/95 backdrop-blur-md">
          <div className="mx-auto max-w-7xl px-4 py-3 sm:px-6 lg:px-8">
            <nav aria-label="Breadcrumbs" className="flex flex-wrap items-center text-xs sm:text-sm text-stone-500">
              <Link href="/" className="transition hover:text-emerald-800">
                Home
              </Link>
              <span className="mx-2 text-stone-400">/</span>
              <Link
                href={`/?category=${encodeURIComponent(product.category)}`}
                className="transition hover:text-emerald-800"
              >
                {product.category}
              </Link>
              <span className="mx-2 text-stone-400">/</span>
              <span className="font-medium text-stone-900 truncate max-w-[200px] sm:max-w-md">
                {product.title}
              </span>
            </nav>
          </div>
        </div>

        <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
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
