"use client";

import { useState } from "react";
import { cn } from "@/lib/utils";
import { HugeiconsIcon } from "@hugeicons/react";
import {
  ArrowLeft01Icon,
  ArrowRight01Icon,
  Search01Icon,
} from "@hugeicons/core-free-icons";
import { Button } from "@/components/ui/button";
import { ProductFilters, SortOption } from "./types";
import { useProducts } from "./use-products";
import { FilterSidebar } from "./filter-sidebar";
import { MobileFilterDrawer } from "./mobile-filter-drawer";
import { ProductToolbar } from "./product-toolbar";
import { ActiveFilters } from "./active-filters";
import { ProductCard } from "./product-card";

const INITIAL_FILTERS: ProductFilters = {
  categories: [],
  skinTypes: [],
  priceRange: [10, 100],
  minRating: null,
  promotions: ["Best Sellers"],
  availability: ["In Stock"],
  sortBy: "default",
  page: 1,
  pageSize: 12,
};

export function ProductGrid() {
  const [filters, setFilters] = useState<ProductFilters>(INITIAL_FILTERS);

  // TanStack Query hook - strictly no fetch/axios
  const { data, isLoading, isError, error, refetch } = useProducts(filters);

  const handleSortChange = (sort: SortOption) => {
    setFilters((prev) => ({
      ...prev,
      page: 1,
      sortBy: sort,
    }));
  };

  const handlePageChange = (newPage: number) => {
    setFilters((prev) => ({
      ...prev,
      page: newPage,
    }));
    window.scrollTo({ top: 250, behavior: "smooth" });
  };

  const totalPages = data?.totalPages || 1;
  const currentPage = data?.page || 1;

  return (
    <div className={cn("max-w-7xl mx-auto px-4 py-8")}>
      <div className={cn("grid grid-cols-1 lg:grid-cols-4 gap-8")}>
        {/* Left Column: Filter Sidebar (Desktop) */}
        <div className={cn("hidden lg:block lg:col-span-1")}>
          <div
            className={cn(
              "sticky top-20 h-[calc(100vh-5rem)] overflow-y-auto pr-4 pb-8 [scrollbar-width:thin] [&::-webkit-scrollbar]:w-1.5 [&::-webkit-scrollbar-thumb]:rounded-full [&::-webkit-scrollbar-thumb]:bg-border hover:[&::-webkit-scrollbar-thumb]:bg-muted-foreground/40"
            )}
          >
            <FilterSidebar filters={filters} onFilterChange={setFilters} />
          </div>
        </div>

        {/* Right Column: Catalog Content */}
        <div className={cn("lg:col-span-3 flex flex-col")}>
          {/* Toolbar: Counter, Mobile Filter Trigger, Sort */}
          <ProductToolbar
            totalCount={data?.totalCount ?? 0}
            currentPage={currentPage}
            pageSize={filters.pageSize}
            sortBy={filters.sortBy}
            onSortChange={handleSortChange}
            mobileFilterTrigger={
              <MobileFilterDrawer
                filters={filters}
                onFilterChange={setFilters}
              />
            }
          />

          {/* Active Filters Pill Bar */}
          <ActiveFilters filters={filters} onFilterChange={setFilters} />

          {/* Loading Skeleton */}
          {isLoading && (
            <div className={cn("grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-6")}>
              {Array.from({ length: 6 }).map((_, index) => (
                <div
                  key={index}
                  className={cn(
                    "rounded-2xl border border-border/50 bg-card p-4 space-y-4 animate-pulse"
                  )}
                >
                  <div className={cn("aspect-square w-full rounded-xl bg-muted")} />
                  <div className={cn("space-y-2")}>
                    <div className={cn("h-3 w-1/3 bg-muted rounded")} />
                    <div className={cn("h-4 w-3/4 bg-muted rounded")} />
                    <div className={cn("h-4 w-1/4 bg-muted rounded")} />
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Error State */}
          {isError && (
            <div
              className={cn(
                "rounded-2xl border border-destructive/20 bg-destructive/5 p-12 text-center space-y-4 my-8"
              )}
            >
              <p className={cn("text-base font-medium text-destructive")}>
                Failed to load products: {(error as Error)?.message || "Unknown error"}
              </p>
              <Button
                variant="outline"
                onClick={() => refetch()}
                className={cn("border-destructive text-destructive hover:bg-destructive/10")}
              >
                Try Again
              </Button>
            </div>
          )}

          {/* Empty State */}
          {!isLoading && !isError && data && data.products.length === 0 && (
            <div
              className={cn(
                "rounded-2xl border border-border bg-card p-12 text-center space-y-4 my-8"
              )}
            >
              <div
                className={cn(
                  "size-12 rounded-full bg-muted flex items-center justify-center mx-auto text-muted-foreground"
                )}
              >
                <HugeiconsIcon icon={Search01Icon} className={cn("size-6")} />
              </div>
              <h3 className={cn("text-lg font-semibold text-foreground")}>
                No products found
              </h3>
              <p className={cn("text-sm text-muted-foreground max-w-md mx-auto")}>
                We couldn&apos;t find any beauty items matching your current filters. Try
                clearing some filters or expanding your price range.
              </p>
              <Button
                variant="outline"
                onClick={() => setFilters(INITIAL_FILTERS)}
                className={cn("mt-2")}
              >
                Reset Filters
              </Button>
            </div>
          )}

          {/* Product Cards Grid */}
          {!isLoading && !isError && data && data.products.length > 0 && (
            <div className={cn("grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-6")}>
              {data.products.map((product) => (
                <ProductCard key={product.id} product={product} />
              ))}
            </div>
          )}

          {/* Pagination */}
          {!isLoading && !isError && data && totalPages > 1 && (
            <nav
              aria-label="Product pagination"
              className={cn(
                "mt-12 mb-6 flex items-center justify-center gap-2 select-none"
              )}
            >
              {/* Prev Page */}
              <button
                type="button"
                onClick={() => handlePageChange(Math.max(1, currentPage - 1))}
                disabled={currentPage === 1}
                aria-label="Previous page"
                className={cn(
                  "size-9 rounded-full border border-border flex items-center justify-center transition-colors text-foreground",
                  currentPage === 1
                    ? "opacity-40 cursor-not-allowed"
                    : "hover:bg-muted cursor-pointer"
                )}
              >
                <HugeiconsIcon icon={ArrowLeft01Icon} className={cn("size-4")} />
              </button>

              {/* Page 1 */}
              <button
                type="button"
                onClick={() => handlePageChange(1)}
                className={cn(
                  "size-9 rounded-full text-sm font-medium transition-colors flex items-center justify-center cursor-pointer",
                  currentPage === 1
                    ? "bg-emerald-950 text-white dark:bg-emerald-800"
                    : "text-foreground hover:bg-muted"
                )}
              >
                1
              </button>

              {/* Page 2 */}
              {totalPages >= 2 && (
                <button
                  type="button"
                  onClick={() => handlePageChange(2)}
                  className={cn(
                    "size-9 rounded-full text-sm font-medium transition-colors flex items-center justify-center cursor-pointer",
                    currentPage === 2
                      ? "bg-emerald-950 text-white dark:bg-emerald-800"
                      : "text-foreground hover:bg-muted"
                  )}
                >
                  2
                </button>
              )}

              {/* Page 3 */}
              {totalPages >= 3 && (
                <button
                  type="button"
                  onClick={() => handlePageChange(3)}
                  className={cn(
                    "size-9 rounded-full text-sm font-medium transition-colors flex items-center justify-center cursor-pointer",
                    currentPage === 3
                      ? "bg-emerald-950 text-white dark:bg-emerald-800"
                      : "text-foreground hover:bg-muted"
                  )}
                >
                  3
                </button>
              )}

              {/* Ellipsis if > 4 */}
              {totalPages > 4 && (
                <span className={cn("px-2 text-sm text-muted-foreground")}>...</span>
              )}

              {/* Last Page (e.g. 10) */}
              {totalPages > 3 && (
                <button
                  type="button"
                  onClick={() => handlePageChange(totalPages)}
                  className={cn(
                    "size-9 rounded-full text-sm font-medium transition-colors flex items-center justify-center cursor-pointer",
                    currentPage === totalPages
                      ? "bg-emerald-950 text-white dark:bg-emerald-800"
                      : "text-foreground hover:bg-muted"
                  )}
                >
                  {totalPages}
                </button>
              )}

              {/* Next Page */}
              <button
                type="button"
                onClick={() => handlePageChange(Math.min(totalPages, currentPage + 1))}
                disabled={currentPage === totalPages}
                aria-label="Next page"
                className={cn(
                  "size-9 rounded-full border border-border flex items-center justify-center transition-colors text-foreground",
                  currentPage === totalPages
                    ? "opacity-40 cursor-not-allowed"
                    : "hover:bg-muted cursor-pointer"
                )}
              >
                <HugeiconsIcon icon={ArrowRight01Icon} className={cn("size-4")} />
              </button>
            </nav>
          )}
        </div>
      </div>
    </div>
  );
}
