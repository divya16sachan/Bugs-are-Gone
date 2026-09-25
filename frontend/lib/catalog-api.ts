import { apiClient } from "./api-client";
import { Product, ProductFilters, ProductsResponse } from "@/app/_components/types";
import { MOCK_PRODUCTS } from "@/app/_components/mock-products";
import { createSearchParamsFromFilters } from "@/app/_components/filter-url-sync";

export function applyFiltersAndPagination(
  items: Product[],
  filters: ProductFilters,
  isMock: boolean
): ProductsResponse {
  let result = [...items];

  // Filter: Search Keyword
  if (filters.search) {
    const q = filters.search.toLowerCase();
    result = result.filter(
      (p) =>
        p.title.toLowerCase().includes(q) ||
        p.category.toLowerCase().includes(q) ||
        (p.description && p.description.toLowerCase().includes(q))
    );
  }

  // Filter: Categories
  if (filters.categories.length > 0) {
    result = result.filter((p) => filters.categories.includes(p.category));
  }

  // Filter: Skin Types
  if (filters.skinTypes.length > 0) {
    result = result.filter((p) =>
      p.skinTypes?.some((st) => filters.skinTypes.includes(st))
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
  const pageSize = filters.pageSize || 20;
  const totalPages = Math.max(1, Math.ceil(totalCount / pageSize));
  const startIndex = (page - 1) * pageSize;
  const pagedProducts = result.slice(startIndex, startIndex + pageSize);

  return {
    products: pagedProducts,
    totalCount,
    page,
    pageSize,
    totalPages,
    isMock,
  };
}

export async function fetchProducts(filters: ProductFilters): Promise<ProductsResponse> {
  try {
    const params = createSearchParamsFromFilters(filters);
    params.set("limit", (filters.pageSize || 20).toString());
    const qs = params.toString();
    const url = `/api/v1/products${qs ? `?${qs}` : ""}`;

    const res = await apiClient.get<{
      products: Array<Product & { stock?: number }>;
      totalCount: number;
      page: number;
      limit: number;
      totalPages: number;
    }>(url);

    if (res && Array.isArray(res.products)) {
      const mappedProducts: Product[] = res.products.map((p) => ({
        ...p,
        stock: p.stock !== undefined ? p.stock : (p.inStock ? 25 : 0),
        inStock: p.stock !== undefined ? p.stock > 0 : (p.inStock ?? true),
      }));

      return {
        products: mappedProducts,
        totalCount: res.totalCount,
        page: res.page,
        pageSize: res.limit || filters.pageSize || 20,
        totalPages: res.totalPages,
        isMock: false,
      };
    }

    throw new Error("No products returned from API");
  } catch (error) {
    console.warn("API product fetch failed, falling back to mock data:", error);
    return applyFiltersAndPagination(MOCK_PRODUCTS, filters, true);
  }
}

export async function fetchProductById(id: string): Promise<Product | null> {
  try {
    const raw = await apiClient.get<Product & { stock?: number }>(`/api/v1/products/${id}`);
    if (raw && raw.id) {
      return {
        ...raw,
        stock: raw.stock !== undefined ? raw.stock : (raw.inStock ? 25 : 0),
        inStock: raw.stock !== undefined ? raw.stock > 0 : (raw.inStock ?? true),
      };
    }
  } catch (err) {
    console.warn(`Product API fetch failed for id ${id}, falling back to mock:`, err);
  }
  return MOCK_PRODUCTS.find((p) => p.id === id) || null;
}
