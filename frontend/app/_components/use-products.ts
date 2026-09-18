"use client";

import { useQuery } from "@tanstack/react-query";
import { catalogKeys } from "./query-keys";
import { Product, ProductFilters } from "./types";
import {
  fetchProducts,
  fetchProductById,
  applyFiltersAndPagination,
} from "@/lib/catalog-api";

export { fetchProducts, fetchProductById, applyFiltersAndPagination };

export function useProducts(filters: ProductFilters) {
  return useQuery({
    queryKey: catalogKeys.list(filters),
    queryFn: () => fetchProducts(filters),
  });
}

export function useProduct(id: string, initialData?: Product | null) {
  return useQuery({
    queryKey: catalogKeys.detail(id),
    queryFn: () => fetchProductById(id),
    initialData: initialData ?? undefined,
    staleTime: 60 * 1000,
  });
}
