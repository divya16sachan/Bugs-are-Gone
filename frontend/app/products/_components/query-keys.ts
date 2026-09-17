import { ProductFilters } from "./types";

export const catalogKeys = {
  all: ["catalog"] as const,
  list: (filters: ProductFilters) => [...catalogKeys.all, "list", filters] as const,
  detail: (slug: string) => [...catalogKeys.all, "detail", slug] as const,
};
