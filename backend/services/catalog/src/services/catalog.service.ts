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

    const hasCustomFilters =
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

    // Cache-aside: Cache unfiltered first page
    const cacheKey = "catalog:products:page1";
    if (!hasCustomFilters) {
      const cached = await getCached<any>(cacheKey);
      if (cached) return cached;
    }

    const where: any = {};

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
}

export const catalogService = new CatalogService();
