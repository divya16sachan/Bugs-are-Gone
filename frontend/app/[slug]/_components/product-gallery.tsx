"use client";

import { useState } from "react";
import Image from "next/image";
import { Product } from "../../_components/types";
import {
  ArrowLeft01Icon,
  ArrowRight01Icon,
  FavouriteIcon,
} from "./icons";

interface ProductGalleryProps {
  product: Product;
}

export default function ProductGallery({ product }: ProductGalleryProps) {
  const productImages = [
    product.imageUrl,
    "https://images.unsplash.com/photo-1556228720-195a672e8a03",
    "https://images.unsplash.com/photo-1611930022073-b7a4ba5fcccd",
    "https://images.unsplash.com/photo-1571781926291-c477ebfd024b",
  ].filter((img, idx, self) => self.indexOf(img) === idx);

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
        <Image
          src={productImages[activeImage]}
          alt={product.title}
          fill
          priority
          sizes="(max-width: 1024px) 100vw, 50vw"
          className="h-full w-full object-cover"
        />

        {productImages.length > 1 && (
          <>
            <button
              type="button"
              onClick={previousImage}
              className="absolute left-4 top-1/2 z-10 flex h-11 w-11 -translate-y-1/2 items-center justify-center rounded-full bg-white/90 shadow-md transition hover:scale-105 cursor-pointer"
              aria-label="Previous image"
            >
              <ArrowLeft01Icon size={22} />
            </button>

            <button
              type="button"
              onClick={nextImage}
              className="absolute right-4 top-1/2 z-10 flex h-11 w-11 -translate-y-1/2 items-center justify-center rounded-full bg-white/90 shadow-md transition hover:scale-105 cursor-pointer"
              aria-label="Next image"
            >
              <ArrowRight01Icon size={22} />
            </button>
          </>
        )}

        <button
          type="button"
          className="absolute right-4 top-4 z-10 flex h-11 w-11 items-center justify-center rounded-full bg-white/90 shadow-md transition hover:scale-105 cursor-pointer"
          aria-label="Add to wishlist"
        >
          <FavouriteIcon size={22} />
        </button>
      </div>

      {productImages.length > 1 && (
        <div className="grid grid-cols-4 gap-3">
          {productImages.map((image, index) => (
            <button
              key={image}
              type="button"
              onClick={() => setActiveImage(index)}
              className={`relative aspect-square overflow-hidden rounded-xl border-2 transition cursor-pointer ${
                activeImage === index
                  ? "border-emerald-800 ring-2 ring-emerald-800/20"
                  : "border-transparent hover:border-stone-300"
              }`}
              aria-label={`View product image ${index + 1}`}
            >
              <Image
                src={image}
                alt={`${product.title} thumbnail ${index + 1}`}
                fill
                sizes="(max-width: 1024px) 25vw, 15vw"
                className="h-full w-full object-cover"
              />
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
