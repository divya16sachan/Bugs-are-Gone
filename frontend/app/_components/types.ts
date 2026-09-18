export type Category =
  | "Skin Care"
  | "Makeup"
  | "Hair Care"
  | "Fragrances"
  | "Nail Care"
  | "Body Care";

export type SkinType =
  | "Normal"
  | "Oily"
  | "Dry"
  | "Combination"
  | "Sensitive";

export type Promotion = "New Arrivals" | "Best Sellers" | "On Sale";

export type Availability = "In Stock" | "Out of Stocks";

export type SortOption =
  | "default"
  | "price-asc"
  | "price-desc"
  | "rating-desc"
  | "best-selling";

export interface Product {
  id: string;
  slug: string;
  title: string;
  category: Category;
  skinTypes: SkinType[];
  rating: number;
  reviewCount: number;
  price: number;
  originalPrice?: number;
  discountPercent?: number;
  imageUrl: string;
  inStock: boolean;
  isBestSeller: boolean;
  isNewArrival: boolean;
  isOnSale: boolean;
  description?: string;
}

export interface ProductFilters {
  categories: Category[];
  skinTypes: SkinType[];
  priceRange: [number, number];
  minRating: number | null;
  promotions: Promotion[];
  availability: Availability[];
  sortBy: SortOption;
  page: number;
  pageSize: number;
}

export interface ProductsResponse {
  products: Product[];
  totalCount: number;
  page: number;
  pageSize: number;
  totalPages: number;
}
