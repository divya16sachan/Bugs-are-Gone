"use client";

import { useQuery } from "@tanstack/react-query";
import { catalogKeys } from "./query-keys";
import { ProductFilters, ProductsResponse } from "./types";
import { MOCK_PRODUCTS } from "./mock-products";

async function fetchProductsMock(filters: ProductFilters): Promise<ProductsResponse> {
  // Pure in-memory querying via TanStack Query without fetch/axios
  let result = [...MOCK_PRODUCTS];

  // Filter: Categories
  if (filters.categories.length > 0) {
    result = result.filter((p) => filters.categories.includes(p.category));
  }

  // Filter: Skin Types
  if (filters.skinTypes.length > 0) {
    result = result.filter((p) =>
      p.skinTypes.some((st) => filters.skinTypes.includes(st))
    );
  }

  // Filter: Price Range
  const [minPrice, maxPrice] = filters.priceRange;
  result = result.filter((p) => p.price >= minPrice && p.price <= maxPrice);

  // Filter: Min Rating
  if (filters.minRating !== null) {
    result = result.filter((p) => p.rating >= filters.minRating!);
  }

  // Filter: Promotions
  if (filters.promotions.length > 0) {
    result = result.filter((p) => {
      return filters.promotions.some((promo) => {
        if (promo === "Best Sellers") return p.isBestSeller;
        if (promo === "New Arrivals") return p.isNewArrival;
        if (promo === "On Sale") return p.isOnSale;
        return false;
      });
    });
  }

  // Filter: Availability
  if (filters.availability.length > 0) {
    result = result.filter((p) => {
      return filters.availability.some((avail) => {
        if (avail === "In Stock") return p.inStock;
        if (avail === "Out of Stocks") return !p.inStock;
        return false;
      });
    });
  }

  // Sort
  if (filters.sortBy === "price-asc") {
    result.sort((a, b) => a.price - b.price);
  } else if (filters.sortBy === "price-desc") {
    result.sort((a, b) => b.price - a.price);
  } else if (filters.sortBy === "rating-desc") {
    result.sort((a, b) => b.rating - a.rating);
  } else if (filters.sortBy === "best-selling") {
    result.sort((a, b) => (b.isBestSeller ? 1 : 0) - (a.isBestSeller ? 1 : 0));
  }

  const totalCount = result.length;
  const page = Math.max(1, filters.page);
  const pageSize = filters.pageSize || 12;
  const totalPages = Math.max(1, Math.ceil(totalCount / pageSize));
  const startIndex = (page - 1) * pageSize;
  const pagedProducts = result.slice(startIndex, startIndex + pageSize);

  return {
    products: pagedProducts,
    totalCount,
    page,
    pageSize,
    totalPages,
  };
}

export function useProducts(filters: ProductFilters) {
  return useQuery({
    queryKey: catalogKeys.list(filters),
    queryFn: () => fetchProductsMock(filters),
  });
}
