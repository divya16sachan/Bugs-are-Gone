"use client";

import { useState } from "react";
import { Product } from "../../_components/types";
import { StarIcon } from "./icons";

const sizes = ["30 ml", "60 ml", "80 ml", "100 ml"];

interface ProductInfoProps {
  product: Product;
}

export default function ProductInfo({ product }: ProductInfoProps) {
  const [selectedSize, setSelectedSize] = useState("30 ml");

  const sku = `SKU-${product.id.toUpperCase()}`;
  const tags = [product.category, ...product.skinTypes].join(", ");

  return (
    <div className="flex flex-col justify-center space-y-5">
      <div>
        <p className="text-sm font-medium text-stone-500">{product.category}</p>

        <div className="mt-1 flex flex-wrap items-center gap-3">
          <h1 className="text-2xl font-semibold tracking-tight text-stone-900 sm:text-3xl">
            {product.title}
          </h1>

          {product.inStock ? (
            <span className="rounded-full border border-emerald-200 bg-emerald-50 px-3 py-1 text-xs font-medium text-emerald-700">
              In Stock
            </span>
          ) : (
            <span className="rounded-full border border-rose-200 bg-rose-50 px-3 py-1 text-xs font-medium text-rose-700">
              Out of Stock
            </span>
          )}
        </div>
      </div>

      <div className="flex items-center gap-2">
        <div className="flex items-center gap-1">
          <StarIcon size={18} className="fill-amber-400 text-amber-400" />
          <span className="font-medium text-stone-900">{product.rating.toFixed(1)}</span>
        </div>

        <span className="text-sm text-stone-500">({product.reviewCount} Reviews)</span>
      </div>

      <div className="flex items-center gap-3">
        <span className="text-2xl font-semibold text-emerald-900">${product.price.toFixed(2)}</span>
        {product.originalPrice && (
          <span className="text-base text-stone-400 line-through">${product.originalPrice.toFixed(2)}</span>
        )}

        {product.discountPercent && (
          <span className="rounded-full bg-emerald-100 px-2.5 py-1 text-xs font-semibold text-emerald-800">
            {product.discountPercent}% OFF
          </span>
        )}
      </div>

      <p className="max-w-xl text-sm leading-6 text-stone-600">
        {product.description}
      </p>

      {/* Skin Type tags */}
      {product.skinTypes && product.skinTypes.length > 0 && (
        <div className="space-y-1.5">
          <h2 className="text-xs font-semibold uppercase tracking-wider text-stone-500">Skin Types</h2>
          <div className="flex flex-wrap gap-1.5">
            {product.skinTypes.map((st) => (
              <span
                key={st}
                className="rounded-md bg-stone-100 px-2.5 py-1 text-xs font-medium text-stone-700"
              >
                {st}
              </span>
            ))}
          </div>
        </div>
      )}

      <div className="space-y-3">
        <h2 className="text-sm font-semibold text-stone-900">Size / Volume</h2>

        <div className="flex flex-wrap gap-2">
          {sizes.map((size) => (
            <button
              key={size}
              type="button"
              onClick={() => setSelectedSize(size)}
              className={`rounded-full border px-4 py-2 text-sm font-medium transition cursor-pointer ${
                selectedSize === size
                  ? "border-emerald-900 bg-emerald-900 text-white"
                  : "border-stone-200 bg-white text-stone-700 hover:border-emerald-700"
              }`}
            >
              {size}
            </button>
          ))}
        </div>
      </div>

      <div className="border-t border-stone-200 pt-4 text-sm text-stone-600">
        <p>
          <span className="font-semibold text-stone-900">SKU:</span> {sku}
        </p>

        <p className="mt-2">
          <span className="font-semibold text-stone-900">Tags:</span> {tags}
        </p>
      </div>
    </div>
  );
}
