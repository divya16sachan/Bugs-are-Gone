import ProductGallery from "./_components/product-gallery";
import ProductInfo from "./_components/product-info";
import ProductActions from "./_components/product-actions";
import ProductDetails from "./_components/product-details";
import ProductReviews from "./_components/product-reviews";
import RelatedProducts from "./_components/related-products";

export default function ProductDetailPage() {
  return (
    <main className="min-h-screen bg-stone-50">
      <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
        <div className="mb-8 text-sm text-stone-500">
          Home <span className="mx-2">/</span> Products{" "}
          <span className="mx-2">/</span>{" "}
          <span className="text-stone-900">SilkSkin Serum</span>
        </div>

        <section className="grid gap-10 lg:grid-cols-2 lg:items-start lg:gap-16">
          <ProductGallery />

          <div className="space-y-7">
            <ProductInfo />
            <ProductActions />
          </div>
        </section>

        <div className="mt-14 space-y-12">
          <ProductDetails />
          <ProductReviews />
          <RelatedProducts />
        </div>
      </div>
    </main>
  );
}
