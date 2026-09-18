"use client";

import { useState, ViewTransition } from "react";
import Image from "next/image";
import { Product } from "../../_components/types";
import { Button } from "@/components/ui/button";
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
        <ViewTransition
          name={`product-image-${product.id}`}
          share="morph"
          default="none"
        >
          <Image
            src={productImages[activeImage]}
            alt={product.title}
            fill
            priority
            sizes="(max-width: 1024px) 100vw, 50vw"
            className="h-full w-full object-cover"
          />
        </ViewTransition>

        {productImages.length > 1 && (
          <>
            <Button
              type="button"
              variant="ghost"
              size="icon"
              onClick={previousImage}
              tooltip="Previous image"
              aria-label="Previous image"
              className="absolute left-4 top-1/2 z-10 size-11 -translate-y-1/2 rounded-full bg-white/90 text-stone-800 shadow-md transition hover:scale-105 hover:bg-white"
            >
              <ArrowLeft01Icon size={22} />
            </Button>

            <Button
              type="button"
              variant="ghost"
              size="icon"
              onClick={nextImage}
              tooltip="Next image"
              aria-label="Next image"
              className="absolute right-4 top-1/2 z-10 size-11 -translate-y-1/2 rounded-full bg-white/90 text-stone-800 shadow-md transition hover:scale-105 hover:bg-white"
            >
              <ArrowRight01Icon size={22} />
            </Button>
          </>
        )}

        <Button
          type="button"
          variant="ghost"
          size="icon"
          tooltip="Add to wishlist"
          aria-label="Add to wishlist"
          className="absolute right-4 top-4 z-10 size-11 rounded-full bg-white/90 text-stone-800 shadow-md transition hover:scale-105 hover:bg-white"
        >
          <FavouriteIcon size={22} />
        </Button>
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
