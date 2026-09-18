"use client";

import { useState } from "react";
import { Product } from "../../_components/types";
import { ArrowDown01Icon, ArrowUp01Icon } from "./icons";

interface ProductDetailsProps {
  product: Product;
}

export default function ProductDetails({ product }: ProductDetailsProps) {
  const [openIndex, setOpenIndex] = useState(0);

  const toggleDetails = (index: number) => {
    setOpenIndex((current) => (current === index ? -1 : index));
  };

  const details = [
    {
      title: "Description",
      content:
        product.description ||
        `${product.title} is a premium botanical formula designed to deliver exceptional results and support healthy, radiant beauty.`,
    },
    {
      title: "Key Benefits & Skin Types",
      content: `Tailored for ${product.skinTypes.join(", ")} skin. Delivers active nourishment, long-lasting moisture balance, and promotes a naturally revitalized complexion.`,
    },
    {
      title: "How to Use",
      content:
        "Apply a small amount to clean, dry skin. Gently massage in upward circular motions until fully absorbed. Suitable for daily morning and evening use.",
    },
    {
      title: "Additional Information",
      content:
        "Formulated with pure organic botanicals. 100% cruelty-free, vegan-friendly, and dermatologist tested. Store in a cool, dry place away from direct sunlight.",
    },
  ];

  return (
    <section className="border-t border-stone-200 pt-8">
      <div className="space-y-2">
        {details.map((detail, index) => {
          const isOpen = openIndex === index;

          return (
            <div
              key={detail.title}
              className="border-b border-stone-200"
            >
              <button
                type="button"
                onClick={() => toggleDetails(index)}
                className="flex w-full items-center justify-between py-5 text-left cursor-pointer"
                aria-expanded={isOpen}
              >
                <span className="text-sm font-semibold text-stone-900 sm:text-base">
                  {detail.title}
                </span>

                {isOpen ? (
                  <ArrowUp01Icon size={20} />
                ) : (
                  <ArrowDown01Icon size={20} />
                )}
              </button>

              {isOpen && (
                <p className="max-w-3xl pb-5 text-sm leading-6 text-stone-600">
                  {detail.content}
                </p>
              )}
            </div>
          );
        })}
      </div>
    </section>
  );
}
