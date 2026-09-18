"use client";

import { Product } from "../../_components/types";
import { StarIcon } from "./icons";

interface ProductReviewsProps {
  product: Product;
}

export default function ProductReviews({ product }: ProductReviewsProps) {
  const reviews = [
    {
      name: "Aarav Sharma",
      rating: 5,
      date: "2 weeks ago",
      comment: `Really loved the ${product.title}! The texture is wonderful and it delivered results right away.`,
    },
    {
      name: "Meera Kapoor",
      rating: Math.max(4, Math.floor(product.rating)),
      date: "1 month ago",
      comment:
        "Good product and high quality formulation. The packaging feels very luxurious and botanical.",
    },
    {
      name: "Riya Malhotra",
      rating: 5,
      date: "2 months ago",
      comment:
        "I have been using this regularly in my routine and notice a remarkable improvement. Highly recommended!",
    },
  ];

  return (
    <section className="border-t border-stone-200 pt-10">
      <div className="flex flex-col gap-6 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="text-sm font-medium text-stone-500">Customer feedback</p>
          <h2 className="mt-1 text-2xl font-semibold tracking-tight text-stone-900">
            Reviews
          </h2>
        </div>

        <div className="flex items-center gap-3">
          <div className="flex items-center gap-1">
            <StarIcon size={20} className="fill-amber-400 text-amber-400" />
            <span className="text-xl font-semibold text-stone-900">{product.rating.toFixed(1)}</span>
          </div>

          <span className="text-sm text-stone-500">({product.reviewCount} reviews)</span>
        </div>
      </div>

      <div className="mt-8 divide-y divide-stone-200">
        {reviews.map((review) => (
          <article key={review.name} className="py-6 first:pt-0">
            <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
              <div>
                <h3 className="font-semibold text-stone-900">{review.name}</h3>

                <div className="mt-2 flex items-center gap-1">
                  {Array.from({ length: review.rating }).map((_, index) => (
                    <StarIcon
                      key={index}
                      size={16}
                      className="fill-amber-400 text-amber-400"
                    />
                  ))}
                </div>
              </div>

              <span className="text-xs text-stone-400">{review.date}</span>
            </div>

            <p className="mt-4 max-w-3xl text-sm leading-6 text-stone-600">
              {review.comment}
            </p>
          </article>
        ))}
      </div>

      <button
        type="button"
        className="mt-4 rounded-full border border-stone-300 px-5 py-2.5 text-sm font-medium text-stone-900 transition hover:border-emerald-800 hover:text-emerald-900 cursor-pointer"
      >
        Write a Review
      </button>
    </section>
  );
}
