import { prisma } from "../lib/prisma.js";
import { getCached, setCached, invalidateCache } from "./redis.service.js";
import { catalogMetrics } from "../middleware/metrics.middleware.js";

export interface ListProductsFilters {
  category?: string;
  categories?: string[];
  skinType?: string;
  skinTypes?: string[];
  minPrice?: number;
  maxPrice?: number;
  minRating?: number;
  promotions?: string[];
  isBestSeller?: boolean;
  isNewArrival?: boolean;
  isOnSale?: boolean;
  availability?: string[];
  sortBy?: "default" | "price-asc" | "price-desc" | "rating-desc" | "best-selling" | string;
  search?: string;
  q?: string;
  page?: number;
  limit?: number;
}

export interface ReserveItem {
  productId: string;
  quantity: number;
}

export class CatalogService {
  async listProducts(filters: ListProductsFilters) {
    const page = Math.max(1, filters.page || 1);
    const limit = Math.max(1, Math.min(100, filters.limit || 12));
    const skip = (page - 1) * limit;

    const categories = [
      ...(filters.categories || []),
      ...(filters.category ? [filters.category] : []),
    ];

    const skinTypes = [
      ...(filters.skinTypes || []),
      ...(filters.skinType ? [filters.skinType] : []),
    ];

    const promotions = filters.promotions || [];
    const availability = filters.availability || [];
    const searchQuery = (filters.search || filters.q || "").trim();

    const hasCustomFilters =
      searchQuery.length > 0 ||
      categories.length > 0 ||
      skinTypes.length > 0 ||
      promotions.length > 0 ||
      availability.length > 0 ||
      filters.minPrice !== undefined ||
      filters.maxPrice !== undefined ||
      filters.minRating !== undefined ||
      filters.isBestSeller !== undefined ||
      filters.isNewArrival !== undefined ||
      filters.isOnSale !== undefined ||
      (filters.sortBy && filters.sortBy !== "default") ||
      page > 1;

    // Cache-aside: Cache unfiltered queries per page and limit
    const cacheKey = `catalog:products:p${page}:l${limit}`;
    if (!hasCustomFilters) {
      const cached = await getCached<any>(cacheKey);
      if (
        cached &&
        Array.isArray(cached.products) &&
        cached.products.length > 0 &&
        cached.limit === limit
      ) {
        return cached;
      }
    }

    const where: any = {};

    // 0. Search keyword
    if (searchQuery) {
      where.OR = [
        { title: { contains: searchQuery, mode: "insensitive" } },
        { description: { contains: searchQuery, mode: "insensitive" } },
        { category: { contains: searchQuery, mode: "insensitive" } },
      ];
    }

    // 1. Categories
    if (categories.length === 1) {
      where.category = categories[0];
    } else if (categories.length > 1) {
      where.category = { in: categories };
    }

    // 2. Skin Types
    if (skinTypes.length === 1) {
      where.skinTypes = { has: skinTypes[0] };
    } else if (skinTypes.length > 1) {
      where.skinTypes = { hasSome: skinTypes };
    }

    // 3. Price Range
    if (filters.minPrice !== undefined || filters.maxPrice !== undefined) {
      where.price = {};
      if (filters.minPrice !== undefined) {
        where.price.gte = filters.minPrice;
      }
      if (filters.maxPrice !== undefined) {
        where.price.lte = filters.maxPrice;
      }
    }

    // 4. Rating
    if (filters.minRating !== undefined && filters.minRating !== null) {
      where.rating = { gte: filters.minRating };
    }

    // 5. Promotions
    const promoConditions: any[] = [];
    if (promotions.includes("Best Sellers") || filters.isBestSeller === true) {
      promoConditions.push({ isBestSeller: true });
    }
    if (promotions.includes("New Arrivals") || filters.isNewArrival === true) {
      promoConditions.push({ isNewArrival: true });
    }
    if (promotions.includes("On Sale") || filters.isOnSale === true) {
      promoConditions.push({ isOnSale: true });
    }

    if (promoConditions.length === 1) {
      Object.assign(where, promoConditions[0]);
    } else if (promoConditions.length > 1) {
      where.OR = promoConditions;
    }

    // 6. Availability
    const hasInStock = availability.includes("In Stock");
    const hasOutOfStock = availability.includes("Out of Stocks");
    if (hasInStock && !hasOutOfStock) {
      where.stock = { gt: 0 };
    } else if (hasOutOfStock && !hasInStock) {
      where.stock = { lte: 0 };
    }

    // 7. Sorting
    let orderBy: any = { createdAt: "desc" };
    if (filters.sortBy === "price-asc") {
      orderBy = { price: "asc" };
    } else if (filters.sortBy === "price-desc") {
      orderBy = { price: "desc" };
    } else if (filters.sortBy === "rating-desc") {
      orderBy = { rating: "desc" };
    } else if (filters.sortBy === "best-selling") {
      orderBy = [{ isBestSeller: "desc" }, { reviewCount: "desc" }];
    }

    const [products, totalCount] = await Promise.all([
      prisma.product.findMany({
        where,
        skip,
        take: limit,
        orderBy,
      }),
      prisma.product.count({ where }),
    ]);

    const totalPages = Math.max(1, Math.ceil(totalCount / limit));
    const response = {
      products,
      totalCount,
      page,
      limit,
      totalPages,
    };

    if (!hasCustomFilters) {
      await setCached(cacheKey, response, 60);
    }

    return response;
  }

  async getProductById(id: string) {
    const cacheKey = `product:${id}`;
    const cached = await getCached<any>(cacheKey);
    if (cached) return cached;

    const product = await prisma.product.findUnique({
      where: { id },
    });

    if (product) {
      await setCached(cacheKey, product, 120);
    }

    return product;
  }

  async reserveStock(orderId: string, items: ReserveItem[]) {
    try {
      const result = await prisma.$transaction(async (tx: any) => {
        const reservedItems: Array<{
          productId: string;
          quantity: number;
          unitPrice: number;
          title: string;
        }> = [];

        for (const item of items) {
          const product = await tx.product.findUnique({
            where: { id: item.productId },
          });

          if (!product) {
            throw new Error(`PRODUCT_NOT_FOUND:${item.productId}`);
          }

          if (product.stock < item.quantity) {
            throw new Error(`INSUFFICIENT_STOCK:${item.productId}`);
          }

          await tx.product.update({
            where: { id: item.productId },
            data: { stock: product.stock - item.quantity },
          });

          reservedItems.push({
            productId: product.id,
            quantity: item.quantity,
            unitPrice: product.price,
            title: product.title,
          });
        }

        return { reserved: true, orderId, items: reservedItems };
      });

      // Invalidate relevant cache keys
      await invalidateCache("catalog:products:page1");
      for (const item of items) {
        await invalidateCache(`product:${item.productId}`);
      }

      catalogMetrics.stockReservationsTotal.inc({ status: "success" });
      return result;
    } catch (err: any) {
      catalogMetrics.stockReservationsTotal.inc({ status: "out_of_stock" });
      throw err;
    }
  }

  async seedProducts() {
    for (const product of DEFAULT_PRODUCTS) {
      await prisma.product.upsert({
        where: { id: product.id },
        update: product,
        create: product,
      });
    }

    // Invalidate all Redis catalog caches
    await invalidateCache("catalog:*");
    await invalidateCache("catalog:products:page1");
    await invalidateCache("product:*");
    for (const product of DEFAULT_PRODUCTS) {
      await invalidateCache(`product:${product.id}`);
    }

    return {
      success: true,
      message: `Successfully seeded ${DEFAULT_PRODUCTS.length} products into the catalog database.`,
      count: DEFAULT_PRODUCTS.length,
      products: DEFAULT_PRODUCTS,
    };
  }
}

export const DEFAULT_PRODUCTS = [
  {
    id: "prod-1",
    title: "SilkSculpt Serum",
    category: "Skin Care",
    skinTypes: ["Combination", "Dry", "Normal"],
    rating: 4.9,
    reviewCount: 312,
    price: 35.0,
    originalPrice: 70.0,
    discountPercent: 50,
    imageUrl:
      "https://images.unsplash.com/photo-1620916566398-39f1143ab7be?auto=format&fit=crop&w=600&q=80",
    stock: 50,
    isBestSeller: true,
    isNewArrival: false,
    isOnSale: true,
    description: "Intensive botanical peptide serum for radiant, smooth skin texture.",
  },
  {
    id: "prod-2",
    title: "SilkSkin Serum",
    category: "Skin Care",
    skinTypes: ["Sensitive", "Dry", "Normal"],
    rating: 4.8,
    reviewCount: 245,
    price: 48.0,
    originalPrice: 60.0,
    discountPercent: 20,
    imageUrl:
      "https://images.unsplash.com/photo-1707539160277-e39464517645?q=80&w=687&auto=format&fit=crop&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D",
    stock: 50,
    isBestSeller: true,
    isNewArrival: false,
    isOnSale: true,
    description: "Deep hydration antioxidant booster infused with organic botanical extracts.",
  },
  {
    id: "prod-3",
    title: "Argan Glow",
    category: "Hair Care",
    skinTypes: ["Normal", "Dry"],
    rating: 5.0,
    reviewCount: 189,
    price: 63.0,
    originalPrice: 90.0,
    discountPercent: 30,
    imageUrl:
      "https://images.unsplash.com/photo-1601049541289-9b1b7bbbfe19?auto=format&fit=crop&w=600&q=80",
    stock: 50,
    isBestSeller: true,
    isNewArrival: false,
    isOnSale: true,
    description: "Pure cold-pressed Moroccan argan elixir for weightless shine and nourishment.",
  },
  {
    id: "prod-4",
    title: "Nephrolepis exaltata",
    category: "Body Care",
    skinTypes: ["Sensitive", "Normal", "Dry"],
    rating: 5.0,
    reviewCount: 120,
    price: 45.0,
    originalPrice: 50.0,
    discountPercent: 10,
    imageUrl:
      "https://images.unsplash.com/photo-1556228720-195a672e8a03?auto=format&fit=crop&w=600&q=80",
    stock: 50,
    isBestSeller: true,
    isNewArrival: true,
    isOnSale: true,
    description: "Botanical fern extract smoothing emulsion for ultra-soft body rejuvenation.",
  },
  {
    id: "prod-5",
    title: "Smooth Foundation",
    category: "Makeup",
    skinTypes: ["Combination", "Oily", "Normal"],
    rating: 5.0,
    reviewCount: 410,
    price: 20.0,
    originalPrice: 40.0,
    discountPercent: 50,
    imageUrl:
      "https://images.unsplash.com/photo-1631729371254-42c2892f0e6e?auto=format&fit=crop&w=600&q=80",
    stock: 50,
    isBestSeller: true,
    isNewArrival: false,
    isOnSale: true,
    description: "Velvety seamless matte coverage with 24-hour breathable wear.",
  },
  {
    id: "prod-6",
    title: "Smooth Body Cream",
    category: "Body Care",
    skinTypes: ["Dry", "Sensitive", "Normal"],
    rating: 5.0,
    reviewCount: 388,
    price: 30.0,
    originalPrice: 60.0,
    discountPercent: 50,
    imageUrl:
      "https://images.unsplash.com/photo-1571781926291-c477ebfd024b?auto=format&fit=crop&w=600&q=80",
    stock: 50,
    isBestSeller: true,
    isNewArrival: false,
    isOnSale: true,
    description: "Rich whipped shea and floral butter cream to deeply nourish parched skin.",
  },
  {
    id: "prod-7",
    title: "AquaAura Wellness",
    category: "Body Care",
    skinTypes: ["Combination", "Dry", "Sensitive"],
    rating: 4.8,
    reviewCount: 167,
    price: 30.0,
    originalPrice: 60.0,
    discountPercent: 50,
    imageUrl:
      "https://images.unsplash.com/photo-1598440947619-2c35fc9aa908?auto=format&fit=crop&w=600&q=80",
    stock: 50,
    isBestSeller: true,
    isNewArrival: false,
    isOnSale: true,
    description: "Holistic mineral moisturizing cream infused with marine botanicals.",
  },
  {
    id: "prod-8",
    title: "Velvet Rose",
    category: "Makeup",
    skinTypes: ["Normal", "Sensitive"],
    rating: 4.9,
    reviewCount: 290,
    price: 10.0,
    originalPrice: 20.0,
    discountPercent: 50,
    imageUrl:
      "https://images.unsplash.com/photo-1586495777744-4413f21062fa?auto=format&fit=crop&w=600&q=80",
    stock: 50,
    isBestSeller: true,
    isNewArrival: true,
    isOnSale: true,
    description: "Couture satin petal lipstick enriched with organic rose hip oil.",
  },
  {
    id: "prod-9",
    title: "Herbal Haven",
    category: "Body Care",
    skinTypes: ["Oily", "Combination", "Normal"],
    rating: 5.0,
    reviewCount: 315,
    price: 10.0,
    originalPrice: 20.0,
    discountPercent: 50,
    imageUrl:
      "https://images.unsplash.com/photo-1635867264346-ed6a8d912ecf?q=80&w=1170&auto=format&fit=crop&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D",
    stock: 50,
    isBestSeller: true,
    isNewArrival: false,
    isOnSale: true,
    description: "Artisanal botanical cleansing bar with calming chamomile and olive oil.",
  },
  {
    id: "prod-10",
    title: "Essence Body Gel",
    category: "Body Care",
    skinTypes: ["Normal", "Sensitive", "Dry"],
    rating: 4.8,
    reviewCount: 142,
    price: 30.0,
    originalPrice: 60.0,
    discountPercent: 50,
    imageUrl:
      "https://images.unsplash.com/photo-1617897903246-719242758050?auto=format&fit=crop&w=600&q=80",
    stock: 50,
    isBestSeller: true,
    isNewArrival: false,
    isOnSale: true,
    description: "Aromatherapy soothing shower and bath gel with calming lavender essence.",
  },
  {
    id: "prod-11",
    title: "HydraLuxe Serum",
    category: "Skin Care",
    skinTypes: ["Dry", "Combination", "Sensitive"],
    rating: 4.9,
    reviewCount: 228,
    price: 20.0,
    originalPrice: 40.0,
    discountPercent: 50,
    imageUrl:
      "https://images.unsplash.com/photo-1616683693504-3ea7e9ad6fec?auto=format&fit=crop&w=600&q=80",
    stock: 50,
    isBestSeller: true,
    isNewArrival: true,
    isOnSale: true,
    description: "Multi-molecular hyaluronic acid serum with deep moisture retention.",
  },
  {
    id: "prod-12",
    title: "OceanMist Moisturizer",
    category: "Skin Care",
    skinTypes: ["Normal", "Combination", "Oily"],
    rating: 4.8,
    reviewCount: 195,
    price: 20.0,
    originalPrice: 40.0,
    discountPercent: 50,
    imageUrl:
      "https://images.unsplash.com/photo-1522337360788-8b13dee7a37e?auto=format&fit=crop&w=600&q=80",
    stock: 50,
    isBestSeller: true,
    isNewArrival: false,
    isOnSale: true,
    description: "Lightweight marine collagen cloud cream for instant radiance.",
  },
  {
    id: "prod-13",
    title: "Amber Botanica Parfum",
    category: "Fragrances",
    skinTypes: ["Normal"],
    rating: 4.9,
    reviewCount: 88,
    price: 85.0,
    originalPrice: 110.0,
    discountPercent: 22,
    imageUrl:
      "https://images.unsplash.com/photo-1594035910387-fea47794261f?auto=format&fit=crop&w=600&q=80",
    stock: 50,
    isBestSeller: false,
    isNewArrival: true,
    isOnSale: true,
    description: "Warm amber and bergamot artisan eau de parfum with earthy undertones.",
  },
  {
    id: "prod-14",
    title: "Botanical Nail Elixir",
    category: "Nail Care",
    skinTypes: ["Normal", "Dry"],
    rating: 4.7,
    reviewCount: 64,
    price: 18.0,
    originalPrice: 25.0,
    discountPercent: 28,
    imageUrl:
      "https://images.unsplash.com/photo-1632345031435-8727f6897d53?auto=format&fit=crop&w=600&q=80",
    stock: 0,
    isBestSeller: false,
    isNewArrival: false,
    isOnSale: true,
    description: "Nutritive jojoba cuticle oil and keratin strengthening treatment.",
  },
  {
    id: "prod-15",
    title: "Glow Complexion Blush",
    category: "Makeup",
    skinTypes: ["Normal", "Combination"],
    rating: 4.8,
    reviewCount: 140,
    price: 24.0,
    originalPrice: 32.0,
    discountPercent: 25,
    imageUrl:
      "https://images.unsplash.com/photo-1512496015851-a90fb38ba796?auto=format&fit=crop&w=600&q=80",
    stock: 50,
    isBestSeller: false,
    isNewArrival: true,
    isOnSale: true,
    description: "Silky mineral powder blush for a naturally flushed, luminous finish.",
  },
];

export const catalogService = new CatalogService();

