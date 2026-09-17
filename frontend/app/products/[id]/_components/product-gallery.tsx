"use client";

import { useState } from "react";
import {
  ArrowLeft01Icon,
  ArrowRight01Icon,
  FavouriteIcon,
} from "./icons";

const productImages = [
  "https://images.unsplash.com/photo-1556228720-195a672e8a03",
  "https://images.unsplash.com/photo-1611930022073-b7a4ba5fcccd",
  "https://images.unsplash.com/photo-1598440947619-2c35fc9aa908",
  "https://images.unsplash.com/photo-1571781926291-c477ebfd024b",
];

export default function ProductGallery() {
  const [activeImage, setActiveImage] = useState(0);

  const previousImage = () => {
    setActiveImage((current) =>
      current === 0 ? productImages.length - 1 : current - 1,
    );
  };

  const nextImage = () => {
    setActiveImage((current) =>
      current === productImages.length - 1 ? 0 : current + 1,
    );
  };

  return (
    <div className="space-y-4">
      <div className="relative aspect-square overflow-hidden rounded-3xl bg-stone-100">
        <img
          src={`${productImages[activeImage]}?auto=format&fit=crop&w=1000&q=85`}
          alt="Product"
          className="h-full w-full object-cover"
        />

        <button
          type="button"
          onClick={previousImage}
          className="absolute left-4 top-1/2 flex h-11 w-11 -translate-y-1/2 items-center justify-center rounded-full bg-white/90 shadow-md transition hover:scale-105"
          aria-label="Previous image"
        >
          <ArrowLeft01Icon size={22} />
        </button>

        <button
          type="button"
          onClick={nextImage}
          className="absolute right-4 top-1/2 flex h-11 w-11 -translate-y-1/2 items-center justify-center rounded-full bg-white/90 shadow-md transition hover:scale-105"
          aria-label="Next image"
        >
          <ArrowRight01Icon size={22} />
        </button>

        <button
          type="button"
          className="absolute right-4 top-4 flex h-11 w-11 items-center justify-center rounded-full bg-white/90 shadow-md transition hover:scale-105"
          aria-label="Add to wishlist"
        >
          <FavouriteIcon size={22} />
        </button>
      </div>

      <div className="grid grid-cols-4 gap-3">
        {productImages.map((image, index) => (
          <button
            key={image}
            type="button"
            onClick={() => setActiveImage(index)}
            className={`aspect-square overflow-hidden rounded-xl border-2 transition ${
              activeImage === index
                ? "border-emerald-800"
                : "border-transparent"
            }`}
            aria-label={`View product image ${index + 1}`}
          >
            <img
              src={`${image}?auto=format&fit=crop&w=300&q=80`}
              alt={`Product thumbnail ${index + 1}`}
              className="h-full w-full object-cover"
            />
          </button>
        ))}
      </div>
    </div>
  );
}
