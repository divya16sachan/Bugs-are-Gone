import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { fetchProductById } from "@/lib/catalog-api";
import { ShopNavbar } from "../_components/shop-navbar";
import { ShopFooter } from "../_components/shop-footer";
import { BackButton } from "./_components/back-button";
import ProductDetailClient from "./_components/product-detail-client";

interface PageProps {
  params: Promise<{ id: string }>;
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { id } = await params;
  const product = await fetchProductById(id);

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

  return (
    <div className="min-h-screen flex flex-col bg-stone-50 text-stone-900">
      {/* Navigation Header */}
      <ShopNavbar />

      <main className="flex-1">
        {/* Back Button */}
        <div className="mx-auto max-w-7xl px-4 pt-6 pb-2 sm:px-6 lg:px-8">
          <BackButton />
        </div>

        <ProductDetailClient id={id} />
      </main>

      {/* Footer */}
      <ShopFooter />
    </div>
  );
}
