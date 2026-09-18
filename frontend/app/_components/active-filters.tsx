"use client";

import { cn } from "@/lib/utils";
import { HugeiconsIcon } from "@hugeicons/react";
import { Cancel01Icon } from "@hugeicons/core-free-icons";
import { ProductFilters, Category, SkinType, Promotion, Availability } from "./types";

interface ActiveFiltersProps {
  filters: ProductFilters;
  onFilterChange: (updater: (prev: ProductFilters) => ProductFilters) => void;
  className?: string;
}

export function ActiveFilters({
  filters,
  onFilterChange,
  className,
}: ActiveFiltersProps) {
  const isPriceFiltered =
    filters.priceRange[0] > 0 || filters.priceRange[1] < 150;
  const hasActiveFilters =
    filters.categories.length > 0 ||
    filters.skinTypes.length > 0 ||
    isPriceFiltered ||
    filters.minRating !== null ||
    filters.promotions.length > 0 ||
    filters.availability.length > 0;

  if (!hasActiveFilters) {
    return null;
  }

  const removePrice = () => {
    onFilterChange((prev) => ({
      ...prev,
      page: 1,
      priceRange: [0, 150],
    }));
  };

  const removeCategory = (cat: Category) => {
    onFilterChange((prev) => ({
      ...prev,
      page: 1,
      categories: prev.categories.filter((c) => c !== cat),
    }));
  };

  const removeSkinType = (st: SkinType) => {
    onFilterChange((prev) => ({
      ...prev,
      page: 1,
      skinTypes: prev.skinTypes.filter((s) => s !== st),
    }));
  };

  const removeRating = () => {
    onFilterChange((prev) => ({
      ...prev,
      page: 1,
      minRating: null,
    }));
  };

  const removePromotion = (promo: Promotion) => {
    onFilterChange((prev) => ({
      ...prev,
      page: 1,
      promotions: prev.promotions.filter((p) => p !== promo),
    }));
  };

  const removeAvailability = (avail: Availability) => {
    onFilterChange((prev) => ({
      ...prev,
      page: 1,
      availability: prev.availability.filter((a) => a !== avail),
    }));
  };

  const clearAll = () => {
    onFilterChange((prev) => ({
      ...prev,
      page: 1,
      categories: [],
      skinTypes: [],
      priceRange: [0, 150],
      minRating: null,
      promotions: [],
      availability: [],
    }));
  };

  return (
    <div
      className={cn(
        "flex flex-wrap items-center gap-2.5 pb-6 select-none",
        className
      )}
    >
      <span className={cn("text-xs font-semibold text-foreground mr-1")}>
        Active Filter
      </span>

      {/* Price Pill */}
      {isPriceFiltered && (
        <span
          className={cn(
            "inline-flex items-center gap-1.5 px-3 py-1 rounded-md text-xs font-medium bg-emerald-950 text-white dark:bg-emerald-900 shadow-xs"
          )}
        >
          Price : ${filters.priceRange[0].toFixed(2)} - ${filters.priceRange[1].toFixed(2)}
          <button
            type="button"
            onClick={removePrice}
            className={cn("p-0.5 hover:text-emerald-200 transition-colors")}
            aria-label="Remove price filter"
          >
            <HugeiconsIcon icon={Cancel01Icon} className={cn("size-3")} />
          </button>
        </span>
      )}

      {/* Promotion Pills */}
      {filters.promotions.map((promo) => (
        <span
          key={promo}
          className={cn(
            "inline-flex items-center gap-1.5 px-3 py-1 rounded-md text-xs font-medium bg-emerald-950 text-white dark:bg-emerald-900 shadow-xs"
          )}
        >
          {promo}
          <button
            type="button"
            onClick={() => removePromotion(promo)}
            className={cn("p-0.5 hover:text-emerald-200 transition-colors")}
            aria-label={`Remove ${promo} filter`}
          >
            <HugeiconsIcon icon={Cancel01Icon} className={cn("size-3")} />
          </button>
        </span>
      ))}

      {/* Availability Pills */}
      {filters.availability.map((avail) => (
        <span
          key={avail}
          className={cn(
            "inline-flex items-center gap-1.5 px-3 py-1 rounded-md text-xs font-medium bg-emerald-950 text-white dark:bg-emerald-900 shadow-xs"
          )}
        >
          {avail}
          <button
            type="button"
            onClick={() => removeAvailability(avail)}
            className={cn("p-0.5 hover:text-emerald-200 transition-colors")}
            aria-label={`Remove ${avail} filter`}
          >
            <HugeiconsIcon icon={Cancel01Icon} className={cn("size-3")} />
          </button>
        </span>
      ))}

      {/* Category Pills */}
      {filters.categories.map((cat) => (
        <span
          key={cat}
          className={cn(
            "inline-flex items-center gap-1.5 px-3 py-1 rounded-md text-xs font-medium bg-emerald-950 text-white dark:bg-emerald-900 shadow-xs"
          )}
        >
          {cat}
          <button
            type="button"
            onClick={() => removeCategory(cat)}
            className={cn("p-0.5 hover:text-emerald-200 transition-colors")}
            aria-label={`Remove ${cat} filter`}
          >
            <HugeiconsIcon icon={Cancel01Icon} className={cn("size-3")} />
          </button>
        </span>
      ))}

      {/* Skin Type Pills */}
      {filters.skinTypes.map((st) => (
        <span
          key={st}
          className={cn(
            "inline-flex items-center gap-1.5 px-3 py-1 rounded-md text-xs font-medium bg-emerald-950 text-white dark:bg-emerald-900 shadow-xs"
          )}
        >
          {st}
          <button
            type="button"
            onClick={() => removeSkinType(st)}
            className={cn("p-0.5 hover:text-emerald-200 transition-colors")}
            aria-label={`Remove ${st} filter`}
          >
            <HugeiconsIcon icon={Cancel01Icon} className={cn("size-3")} />
          </button>
        </span>
      ))}

      {/* Rating Pill */}
      {filters.minRating !== null && (
        <span
          className={cn(
            "inline-flex items-center gap-1.5 px-3 py-1 rounded-md text-xs font-medium bg-emerald-950 text-white dark:bg-emerald-900 shadow-xs"
          )}
        >
          ★ {filters.minRating}+ Star
          <button
            type="button"
            onClick={removeRating}
            className={cn("p-0.5 hover:text-emerald-200 transition-colors")}
            aria-label="Remove rating filter"
          >
            <HugeiconsIcon icon={Cancel01Icon} className={cn("size-3")} />
          </button>
        </span>
      )}

      {/* Clear All Button */}
      <button
        type="button"
        onClick={clearAll}
        className={cn(
          "text-xs font-medium text-stone-600 dark:text-stone-400 hover:text-emerald-900 dark:hover:text-emerald-300 underline underline-offset-2 ml-1 cursor-pointer transition-colors"
        )}
      >
        Clear All
      </button>
    </div>
  );
}
