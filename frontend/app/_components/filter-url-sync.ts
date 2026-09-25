import {
  Category,
  SkinType,
  Promotion,
  Availability,
  SortOption,
  ProductFilters,
} from "./types";

const VALID_CATEGORIES: Category[] = [
  "Skin Care",
  "Makeup",
  "Hair Care",
  "Fragrances",
  "Nail Care",
  "Body Care",
];

const VALID_SKIN_TYPES: SkinType[] = [
  "Normal",
  "Oily",
  "Dry",
  "Combination",
  "Sensitive",
];

const VALID_PROMOTIONS: Promotion[] = ["New Arrivals", "Best Sellers", "On Sale"];

const VALID_AVAILABILITY: Availability[] = ["In Stock", "Out of Stocks"];

const VALID_SORT: SortOption[] = [
  "default",
  "price-asc",
  "price-desc",
  "rating-desc",
  "best-selling",
];

export function parseFiltersFromSearchParams(
  searchParams: { get: (k: string) => string | null; getAll: (k: string) => string[] }
): ProductFilters {
  // Categories (support ?category=X, ?categories=X,Y)
  const categoryRaw = [
    ...searchParams.getAll("category"),
    ...searchParams.getAll("categories").flatMap((c) => c.split(",")),
  ]
    .map((c) => c.trim())
    .filter(Boolean);

  const categories = categoryRaw.filter((c): c is Category =>
    VALID_CATEGORIES.includes(c as Category)
  );

  // Skin Types (support ?skinType=X, ?skinTypes=X,Y)
  const skinTypeRaw = [
    ...searchParams.getAll("skinType"),
    ...searchParams.getAll("skinTypes").flatMap((s) => s.split(",")),
  ]
    .map((s) => s.trim())
    .filter(Boolean);

  const skinTypes = skinTypeRaw.filter((s): s is SkinType =>
    VALID_SKIN_TYPES.includes(s as SkinType)
  );

  // Price Range
  const minPriceStr = searchParams.get("minPrice");
  const maxPriceStr = searchParams.get("maxPrice");
  const minPrice =
    minPriceStr !== null && !isNaN(Number(minPriceStr)) ? Number(minPriceStr) : 0;
  const maxPrice =
    maxPriceStr !== null && !isNaN(Number(maxPriceStr)) ? Number(maxPriceStr) : 150;

  // Rating
  const ratingStr = searchParams.get("rating") || searchParams.get("minRating");
  const minRating =
    ratingStr !== null && !isNaN(Number(ratingStr)) ? Number(ratingStr) : null;

  // Promotions
  const promoRaw = [
    ...searchParams.getAll("promotion"),
    ...searchParams.getAll("promotions").flatMap((p) => p.split(",")),
  ]
    .map((p) => p.trim())
    .filter(Boolean);

  const promotions = promoRaw.filter((p): p is Promotion =>
    VALID_PROMOTIONS.includes(p as Promotion)
  );

  // Availability
  const availRaw = [
    ...searchParams.getAll("availability").flatMap((a) => a.split(",")),
  ]
    .map((a) => a.trim())
    .filter(Boolean);

  const availability = availRaw.filter((a): a is Availability =>
    VALID_AVAILABILITY.includes(a as Availability)
  );

  // Sort By
  const sortRaw = searchParams.get("sortBy") || searchParams.get("sort") || "default";
  const sortBy: SortOption = VALID_SORT.includes(sortRaw as SortOption)
    ? (sortRaw as SortOption)
    : "default";

  // Page
  const pageRaw = searchParams.get("page");
  const page =
    pageRaw && !isNaN(Number(pageRaw)) && Number(pageRaw) > 0
      ? Number(pageRaw)
      : 1;

  return {
    categories,
    skinTypes,
    priceRange: [Math.max(0, minPrice), Math.min(150, maxPrice)],
    minRating,
    promotions,
    availability,
    sortBy,
    page,
    pageSize: 20,
  };
}

export function createSearchParamsFromFilters(filters: ProductFilters): URLSearchParams {
  const params = new URLSearchParams();

  if (filters.categories && filters.categories.length > 0) {
    filters.categories.forEach((cat) => params.append("category", cat));
  }

  if (filters.skinTypes && filters.skinTypes.length > 0) {
    filters.skinTypes.forEach((st) => params.append("skinType", st));
  }

  if (filters.priceRange && (filters.priceRange[0] > 0 || filters.priceRange[1] < 150)) {
    if (filters.priceRange[0] > 0) {
      params.set("minPrice", filters.priceRange[0].toString());
    }
    if (filters.priceRange[1] < 150) {
      params.set("maxPrice", filters.priceRange[1].toString());
    }
  }

  if (filters.minRating !== null && filters.minRating !== undefined) {
    params.set("rating", filters.minRating.toString());
  }

  if (filters.promotions && filters.promotions.length > 0) {
    filters.promotions.forEach((promo) => params.append("promotion", promo));
  }

  if (filters.availability && filters.availability.length > 0) {
    filters.availability.forEach((avail) => params.append("availability", avail));
  }

  if (filters.sortBy && filters.sortBy !== "default") {
    params.set("sortBy", filters.sortBy);
  }

  if (filters.page && filters.page > 1) {
    params.set("page", filters.page.toString());
  }

  return params;
}
