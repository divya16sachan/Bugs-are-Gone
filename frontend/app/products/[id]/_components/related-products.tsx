import { FavouriteIcon } from "./icons";

const relatedProducts = [
  {
    id: 1,
    name: "Hydra Glow Cream",
    category: "Moisturizer",
    price: "$36.00",
    image:
      "https://images.unsplash.com/photo-1556229010-6c3f2c9ca5f8",
  },
  {
    id: 2,
    name: "Pure Glow Cleanser",
    category: "Cleanser",
    price: "$28.00",
    image:
      "https://images.unsplash.com/photo-1556228578-8c89e6adf883",
  },
  {
    id: 3,
    name: "Daily Face Mist",
    category: "Face Care",
    price: "$24.00",
    image:
      "https://images.unsplash.com/photo-1608248543803-ba4f8c70ae0b",
  },
  {
    id: 4,
    name: "Vitamin Glow Oil",
    category: "Face Oil",
    price: "$42.00",
    image:
      "https://images.unsplash.com/photo-1612817288484-6f916006741a",
  },
];

export default function RelatedProducts() {
  return (
    <section className="border-t border-stone-200 pt-10">
      <div className="mb-6">
        <p className="text-sm font-medium text-stone-500">You may also like</p>

        <h2 className="mt-1 text-2xl font-semibold tracking-tight text-stone-900">
          Related Products
        </h2>
      </div>

      <div className="grid grid-cols-2 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {relatedProducts.map((product) => (
          <article key={product.id} className="group">
            <div className="relative aspect-square overflow-hidden rounded-2xl bg-stone-100">
              <img
                src={`${product.image}?auto=format&fit=crop&w=600&q=85`}
                alt={product.name}
                className="h-full w-full object-cover transition duration-500 group-hover:scale-105"
              />

              <button
                type="button"
                className="absolute right-3 top-3 flex h-9 w-9 items-center justify-center rounded-full bg-white/90 shadow-sm transition hover:scale-105"
                aria-label={`Add ${product.name} to wishlist`}
              >
                <FavouriteIcon size={18} />
              </button>
            </div>

            <div className="pt-3">
              <p className="text-xs text-stone-500">{product.category}</p>

              <h3 className="mt-1 text-sm font-semibold text-stone-900">
                {product.name}
              </h3>

              <p className="mt-1 text-sm font-medium text-emerald-900">
                {product.price}
              </p>
            </div>
          </article>
        ))}
      </div>
    </section>
  );
}
