"use client";

import { useState } from "react";
import { StarIcon } from "./icons";

const sizes = ["30 ml", "60 ml", "80 ml", "100 ml"];

export default function ProductInfo() {
  const [selectedSize, setSelectedSize] = useState("30 ml");

  return (
    <div className="flex flex-col justify-center space-y-5">
      <div>
        <p className="text-sm font-medium text-stone-500">Skin Care</p>

        <div className="mt-1 flex flex-wrap items-center gap-3">
          <h1 className="text-2xl font-semibold tracking-tight text-stone-900 sm:text-3xl">
            SilkSkin Serum
          </h1>

          <span className="rounded-full border border-emerald-200 bg-emerald-50 px-3 py-1 text-xs font-medium text-emerald-700">
            In Stock
          </span>
        </div>
      </div>

      <div className="flex items-center gap-2">
        <div className="flex items-center gap-1">
          <StarIcon size={18} className="fill-amber-400 text-amber-400" />
          <span className="font-medium text-stone-900">4.8</span>
        </div>

        <span className="text-sm text-stone-500">(245 Reviews)</span>
      </div>

      <div className="flex items-center gap-3">
        <span className="text-2xl font-semibold text-emerald-900">$48.00</span>
        <span className="text-base text-stone-400 line-through">$60.00</span>

        <span className="rounded-full bg-emerald-100 px-2.5 py-1 text-xs font-semibold text-emerald-800">
          20% OFF
        </span>
      </div>

      <p className="max-w-xl text-sm leading-6 text-stone-600">
        A lightweight skincare serum designed to hydrate and refresh the skin.
        Perfect for daily use and suitable for multiple skin types.
      </p>

      <div className="space-y-3">
        <h2 className="text-sm font-semibold text-stone-900">Size / Volume</h2>

        <div className="flex flex-wrap gap-2">
          {sizes.map((size) => (
            <button
              key={size}
              type="button"
              onClick={() => setSelectedSize(size)}
              className={`rounded-full border px-4 py-2 text-sm font-medium transition ${
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

      <div className="flex flex-col gap-3 sm:flex-row">
        <button
          type="button"
          className="rounded-full bg-emerald-900 px-7 py-3 text-sm font-semibold text-white transition hover:bg-emerald-800"
        >
          Add to Cart
        </button>

        <button
          type="button"
          className="rounded-full border border-stone-300 bg-white px-7 py-3 text-sm font-semibold text-stone-900 transition hover:border-emerald-800"
        >
          Buy Now
        </button>
      </div>

      <div className="border-t border-stone-200 pt-4 text-sm text-stone-600">
        <p>
          <span className="font-semibold text-stone-900">SKU:</span> GFR85648HGJ
        </p>

        <p className="mt-2">
          <span className="font-semibold text-stone-900">Tags:</span> Skincare,
          Serum, Vitamin C
        </p>
      </div>
    </div>
  );
}
