"use client";

import { useProduct } from "../../_components/use-products";
import ProductGallery from "./product-gallery";
import ProductInfo from "./product-info";
import ProductActions from "./product-actions";
import ProductDetails from "./product-details";
import ProductReviews from "./product-reviews";
import RelatedProducts from "./related-products";

interface ProductDetailClientProps {
  id: string;
}

export default function ProductDetailClient({ id }: ProductDetailClientProps) {
  const { data: product, isLoading, isError } = useProduct(id);

  if (isLoading) {
    return (
      <div className="mx-auto max-w-7xl px-4 py-4 sm:px-6 lg:px-8">
        <section className="grid gap-10 lg:grid-cols-2 lg:items-start lg:gap-16">
          <div className="aspect-square w-full rounded-3xl bg-muted animate-pulse" />
          <div className="space-y-6">
            <div className="h-8 w-3/4 bg-muted rounded-md animate-pulse" />
            <div className="h-6 w-1/4 bg-muted rounded-md animate-pulse" />
            <div className="h-24 w-full bg-muted rounded-md animate-pulse" />
            <div className="h-12 w-1/2 bg-muted rounded-md animate-pulse" />
          </div>
        </section>
      </div>
    );
  }

  if (isError || !product) {
    return (
      <div className="mx-auto max-w-7xl px-4 py-16 text-center">
        <h2 className="text-xl font-semibold text-foreground">Product not found</h2>
        <p className="text-muted-foreground mt-2">The requested product could not be loaded.</p>
      </div>
    );
  }

  return (
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
  );
}
