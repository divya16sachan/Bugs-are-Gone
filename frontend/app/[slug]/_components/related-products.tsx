import Link from "next/link";
import Image from "next/image";
import { Product } from "../../_components/types";
import { MOCK_PRODUCTS } from "../../_components/mock-products";
import { Button } from "@/components/ui/button";
import { FavouriteIcon } from "./icons";

interface RelatedProductsProps {
  currentProduct: Product;
}

export default function RelatedProducts({ currentProduct }: RelatedProductsProps) {
  // Find products in the same category first, or others if needed
  const sameCategory = MOCK_PRODUCTS.filter(
    (p) => p.id !== currentProduct.id && p.category === currentProduct.category
  );
  const otherProducts = MOCK_PRODUCTS.filter(
    (p) => p.id !== currentProduct.id && p.category !== currentProduct.category
  );
  const related = [...sameCategory, ...otherProducts].slice(0, 4);

  return (
    <section className="border-t border-stone-200 pt-10">
      <div className="mb-6">
        <p className="text-sm font-medium text-stone-500">You may also like</p>

        <h2 className="mt-1 text-2xl font-semibold tracking-tight text-stone-900">
          Related Products
        </h2>
      </div>

      <div className="grid grid-cols-2 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {related.map((product) => (
          <article key={product.id} className="group relative">
            <div className="relative aspect-square overflow-hidden rounded-2xl bg-stone-100">
              <Link href={`/${product.slug}`} className="block h-full w-full">
                <Image
                  src={product.imageUrl}
                  alt={product.title}
                  fill
                  sizes="(max-width: 640px) 50vw, 25vw"
                  className="h-full w-full object-cover transition duration-500 group-hover:scale-105"
                />
              </Link>

              <Button
                type="button"
                variant="ghost"
                size="icon"
                tooltip="Add to wishlist"
                aria-label={`Add ${product.title} to wishlist`}
                className="absolute right-3 top-3 z-10 size-9 rounded-full bg-white/90 text-stone-800 shadow-sm transition hover:scale-105 hover:bg-white"
              >
                <FavouriteIcon size={18} />
              </Button>
            </div>

            <div className="pt-3">
              <p className="text-xs text-stone-500">{product.category}</p>

              <h3 className="mt-1 text-sm font-semibold text-stone-900 line-clamp-1">
                <Link
                  href={`/${product.slug}`}
                  className="hover:text-emerald-800 transition-colors"
                >
                  {product.title}
                </Link>
              </h3>

              <div className="mt-1 flex items-baseline gap-2">
                <p className="text-sm font-medium text-emerald-900">
                  ${product.price.toFixed(2)}
                </p>
                {product.originalPrice && (
                  <p className="text-xs text-stone-400 line-through">
                    ${product.originalPrice.toFixed(2)}
                  </p>
                )}
              </div>
            </div>
          </article>
        ))}
      </div>
    </section>
  );
}
