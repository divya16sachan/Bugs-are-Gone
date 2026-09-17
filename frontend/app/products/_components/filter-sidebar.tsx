"use client";

import { cn } from "@/lib/utils";
import { Checkbox } from "@/components/ui/checkbox";
import { Slider } from "@/components/ui/slider";
import { HugeiconsIcon } from "@hugeicons/react";
import { StarIcon } from "@hugeicons/core-free-icons";
import { Category, SkinType, Promotion, Availability, ProductFilters } from "./types";

const CATEGORIES: Category[] = [
  "Skin Care",
  "Makeup",
  "Hair Care",
  "Fragrances",
  "Nail Care",
  "Body Care",
];

const SKIN_TYPES: SkinType[] = [
  "Normal",
  "Oily",
  "Dry",
  "Combination",
  "Sensitive",
];

const PROMOTIONS: Promotion[] = ["New Arrivals", "Best Sellers", "On Sale"];

const AVAILABILITY_OPTIONS: Availability[] = ["In Stock", "Out of Stocks"];

const RATING_OPTIONS = [5, 4, 3, 2, 1];

interface FilterSidebarProps {
  filters: ProductFilters;
  onFilterChange: (updater: (prev: ProductFilters) => ProductFilters) => void;
  className?: string;
}

export function FilterSidebar({ filters, onFilterChange, className }: FilterSidebarProps) {
  const toggleCategory = (cat: Category) => {
    onFilterChange((prev) => ({
      ...prev,
      page: 1,
      categories: prev.categories.includes(cat)
        ? prev.categories.filter((c) => c !== cat)
        : [...prev.categories, cat],
    }));
  };

  const toggleSkinType = (st: SkinType) => {
    onFilterChange((prev) => ({
      ...prev,
      page: 1,
      skinTypes: prev.skinTypes.includes(st)
        ? prev.skinTypes.filter((s) => s !== st)
        : [...prev.skinTypes, st],
    }));
  };

  const handlePriceChange = (val: number | readonly number[]) => {
    if (Array.isArray(val) && val.length >= 2) {
      onFilterChange((prev) => ({
        ...prev,
        page: 1,
        priceRange: [val[0], val[1]],
      }));
    }
  };

  const toggleRating = (rating: number) => {
    onFilterChange((prev) => ({
      ...prev,
      page: 1,
      minRating: prev.minRating === rating ? null : rating,
    }));
  };

  const togglePromotion = (promo: Promotion) => {
    onFilterChange((prev) => ({
      ...prev,
      page: 1,
      promotions: prev.promotions.includes(promo)
        ? prev.promotions.filter((p) => p !== promo)
        : [...prev.promotions, promo],
    }));
  };

  const toggleAvailability = (avail: Availability) => {
    onFilterChange((prev) => ({
      ...prev,
      page: 1,
      availability: prev.availability.includes(avail)
        ? prev.availability.filter((a) => a !== avail)
        : [...prev.availability, avail],
    }));
  };

  return (
    <aside className={cn("w-full space-y-7 select-none", className)}>
      <h2 className={cn("text-lg font-semibold tracking-tight text-foreground")}>
        Filter Options
      </h2>

      {/* 1. By Categories */}
      <div className={cn("space-y-3.5")}>
        <h3 className={cn("text-sm font-semibold text-foreground")}>By Categories</h3>
        <div className={cn("space-y-2.5")}>
          {CATEGORIES.map((cat) => {
            const isChecked = filters.categories.includes(cat);
            return (
              <label
                key={cat}
                className={cn(
                  "flex items-center gap-3 text-sm cursor-pointer transition-colors hover:text-foreground",
                  isChecked ? "text-foreground font-medium" : "text-muted-foreground"
                )}
              >
                <Checkbox
                  checked={isChecked}
                  onCheckedChange={() => toggleCategory(cat)}
                />
                <span>{cat}</span>
              </label>
            );
          })}
        </div>
      </div>

      <div className={cn("h-px w-full bg-border/60")} />

      {/* 2. By Skin Type */}
      <div className={cn("space-y-3.5")}>
        <h3 className={cn("text-sm font-semibold text-foreground")}>By Skin Type</h3>
        <div className={cn("space-y-2.5")}>
          {SKIN_TYPES.map((st) => {
            const isChecked = filters.skinTypes.includes(st);
            return (
              <label
                key={st}
                className={cn(
                  "flex items-center gap-3 text-sm cursor-pointer transition-colors hover:text-foreground",
                  isChecked ? "text-foreground font-medium" : "text-muted-foreground"
                )}
              >
                <Checkbox
                  checked={isChecked}
                  onCheckedChange={() => toggleSkinType(st)}
                />
                <span>{st}</span>
              </label>
            );
          })}
        </div>
      </div>

      <div className={cn("h-px w-full bg-border/60")} />

      {/* 3. Price Range Slider */}
      <div className={cn("space-y-3.5")}>
        <div className={cn("flex items-center justify-between")}>
          <h3 className={cn("text-sm font-semibold text-foreground")}>Price</h3>
        </div>
        <p className={cn("text-xs font-medium text-muted-foreground")}>
          ${filters.priceRange[0].toFixed(2)} - ${filters.priceRange[1].toFixed(2)}
        </p>
        <div className={cn("pt-2 px-1")}>
          <Slider
            min={0}
            max={150}
            step={5}
            value={[filters.priceRange[0], filters.priceRange[1]]}
            onValueChange={handlePriceChange}
            className={cn("w-full")}
          />
        </div>
      </div>

      <div className={cn("h-px w-full bg-border/60")} />

      {/* 4. Review Stars */}
      <div className={cn("space-y-3.5")}>
        <h3 className={cn("text-sm font-semibold text-foreground")}>Review</h3>
        <div className={cn("space-y-2")}>
          {RATING_OPTIONS.map((rating) => {
            const isChecked = filters.minRating === rating;
            return (
              <label
                key={rating}
                className={cn(
                  "flex items-center gap-3 text-sm cursor-pointer transition-colors hover:text-foreground",
                  isChecked ? "text-foreground font-medium" : "text-muted-foreground"
                )}
              >
                <Checkbox
                  checked={isChecked}
                  onCheckedChange={() => toggleRating(rating)}
                />
                <div className={cn("flex items-center gap-1")}>
                  {Array.from({ length: 5 }).map((_, i) => (
                    <HugeiconsIcon
                      key={i}
                      icon={StarIcon}
                      className={cn(
                        "size-3.5",
                        i < rating
                          ? "text-amber-500 fill-amber-500"
                          : "text-zinc-300 dark:text-zinc-700"
                      )}
                    />
                  ))}
                  <span className={cn("ml-1.5 text-xs text-muted-foreground")}>
                    {rating} Star
                  </span>
                </div>
              </label>
            );
          })}
        </div>
      </div>

      <div className={cn("h-px w-full bg-border/60")} />

      {/* 5. By Promotions */}
      <div className={cn("space-y-3.5")}>
        <h3 className={cn("text-sm font-semibold text-foreground")}>By Promotions</h3>
        <div className={cn("space-y-2.5")}>
          {PROMOTIONS.map((promo) => {
            const isChecked = filters.promotions.includes(promo);
            return (
              <label
                key={promo}
                className={cn(
                  "flex items-center gap-3 text-sm cursor-pointer transition-colors hover:text-foreground",
                  isChecked ? "text-foreground font-medium" : "text-muted-foreground"
                )}
              >
                <Checkbox
                  checked={isChecked}
                  onCheckedChange={() => togglePromotion(promo)}
                />
                <span>{promo}</span>
              </label>
            );
          })}
        </div>
      </div>

      <div className={cn("h-px w-full bg-border/60")} />

      {/* 6. Availability */}
      <div className={cn("space-y-3.5")}>
        <h3 className={cn("text-sm font-semibold text-foreground")}>Availability</h3>
        <div className={cn("space-y-2.5")}>
          {AVAILABILITY_OPTIONS.map((avail) => {
            const isChecked = filters.availability.includes(avail);
            return (
              <label
                key={avail}
                className={cn(
                  "flex items-center gap-3 text-sm cursor-pointer transition-colors hover:text-foreground",
                  isChecked ? "text-foreground font-medium" : "text-muted-foreground"
                )}
              >
                <Checkbox
                  checked={isChecked}
                  onCheckedChange={() => toggleAvailability(avail)}
                />
                <span>{avail}</span>
              </label>
            );
          })}
        </div>
      </div>
    </aside>
  );
}
