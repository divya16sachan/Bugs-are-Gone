import { FastifyReply, FastifyRequest } from "fastify";
import { catalogService } from "../services/catalog.service.js";

function toArray(val: unknown): string[] {
  if (!val) return [];
  if (Array.isArray(val)) {
    return val
      .flatMap((v) => (typeof v === "string" ? v.split(",") : []))
      .map((s) => s.trim())
      .filter(Boolean);
  }
  if (typeof val === "string") {
    return val
      .split(",")
      .map((s) => s.trim())
      .filter(Boolean);
  }
  return [];
}

export async function getProductsHandler(req: FastifyRequest, reply: FastifyReply) {
  const query = req.query as Record<string, any>;

  const categories = [
    ...toArray(query.category),
    ...toArray(query.categories),
  ];

  const skinTypes = [
    ...toArray(query.skinType),
    ...toArray(query.skinTypes),
  ];

  const promotions = [
    ...toArray(query.promotion),
    ...toArray(query.promotions),
  ];

  const availability = [
    ...toArray(query.availability),
  ];

  const minPrice =
    query.minPrice !== undefined && query.minPrice !== ""
      ? parseFloat(query.minPrice)
      : undefined;

  const maxPrice =
    query.maxPrice !== undefined && query.maxPrice !== ""
      ? parseFloat(query.maxPrice)
      : undefined;

  const minRating =
    query.rating !== undefined && query.rating !== ""
      ? parseFloat(query.rating)
      : query.minRating !== undefined && query.minRating !== ""
      ? parseFloat(query.minRating)
      : undefined;

  const isBestSeller =
    query.isBestSeller !== undefined ? query.isBestSeller === "true" : undefined;
  const isNewArrival =
    query.isNewArrival !== undefined ? query.isNewArrival === "true" : undefined;
  const isOnSale =
    query.isOnSale !== undefined ? query.isOnSale === "true" : undefined;

  const sortBy = query.sortBy || query.sort;
  const page = query.page ? parseInt(query.page, 10) : 1;
  const limit = query.limit
    ? parseInt(query.limit, 10)
    : query.pageSize
    ? parseInt(query.pageSize, 10)
    : 12;

  const filters = {
    categories: categories.length > 0 ? categories : undefined,
    skinTypes: skinTypes.length > 0 ? skinTypes : undefined,
    minPrice: isNaN(minPrice as number) ? undefined : minPrice,
    maxPrice: isNaN(maxPrice as number) ? undefined : maxPrice,
    minRating: isNaN(minRating as number) ? undefined : minRating,
    promotions: promotions.length > 0 ? promotions : undefined,
    isBestSeller,
    isNewArrival,
    isOnSale,
    availability: availability.length > 0 ? availability : undefined,
    sortBy,
    page: isNaN(page) ? 1 : page,
    limit: isNaN(limit) ? 12 : limit,
  };

  const result = await catalogService.listProducts(filters);
  return reply.status(200).send(result);
}

export async function getProductByIdHandler(req: FastifyRequest, reply: FastifyReply) {
  const { id } = req.params as { id: string };
  const product = await catalogService.getProductById(id);

  if (!product) {
    return reply.status(404).send({
      error: "NotFound",
      message: `Product with id '${id}' not found`,
      statusCode: 404,
    });
  }

  return reply.status(200).send(product);
}

export async function reserveStockHandler(req: FastifyRequest, reply: FastifyReply) {
  const body = req.body as {
    orderId: string;
    items: Array<{ productId: string; quantity: number }>;
  };

  if (!body.orderId || !body.items || !Array.isArray(body.items) || body.items.length === 0) {
    return reply.status(400).send({
      error: "BadRequest",
      message: "Missing orderId or items list",
      statusCode: 400,
    });
  }

  try {
    const result = await catalogService.reserveStock(body.orderId, body.items);
    return reply.status(200).send(result);
  } catch (err: any) {
    if (err.message?.startsWith("PRODUCT_NOT_FOUND")) {
      return reply.status(404).send({
        error: "NotFound",
        message: err.message,
        statusCode: 404,
      });
    }

    if (err.message?.startsWith("INSUFFICIENT_STOCK")) {
      return reply.status(409).send({
        error: "InsufficientStock",
        message: err.message,
        statusCode: 409,
      });
    }

    throw err;
  }
}
