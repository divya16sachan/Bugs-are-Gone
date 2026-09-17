"use client";

import { useState } from "react";
import { ArrowDown01Icon, ArrowUp01Icon } from "./icons";

const details = [
  {
    title: "Description",
    content:
      "SilkSkin Serum is a lightweight daily skincare formula designed to hydrate, refresh, and support healthy-looking skin.",
  },
  {
    title: "Key Benefits",
    content:
      "Provides lightweight hydration, helps refresh the skin, and fits easily into a simple daily skincare routine.",
  },
  {
    title: "How to Use",
    content:
      "Apply a small amount to clean skin and gently massage until absorbed. Use as part of your regular skincare routine.",
  },
  {
    title: "Additional Information",
    content:
      "Suitable for daily use. Store in a cool, dry place and keep the product away from direct sunlight.",
  },
];

export default function ProductDetails() {
  const [openIndex, setOpenIndex] = useState(0);

  const toggleDetails = (index: number) => {
    setOpenIndex((current) => (current === index ? -1 : index));
  };

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
                className="flex w-full items-center justify-between py-5 text-left"
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
