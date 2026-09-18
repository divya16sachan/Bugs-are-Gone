import { prisma } from "../lib/prisma.js";
import { catalogClient, ReserveItem } from "./catalog.client.js";
import { publishOrderCreated } from "../events/rabbitmq.js";
import { orderMetrics } from "../middleware/metrics.middleware.js";

export interface CreateOrderItemInput {
  productId: string;
  quantity: number;
}

export interface CreateOrderInput {
  userId: string;
  items: CreateOrderItemInput[];
  shippingAddress: string;
}

export class OrderService {
  async createOrder(input: CreateOrderInput) {
    const timer = orderMetrics.orderProcessingDurationSeconds.startTimer();

    try {
      // 1. Reserve stock in Catalog Service first & fetch authoritative item prices
      const reserveItems: ReserveItem[] = input.items.map((i) => ({
        productId: i.productId,
        quantity: i.quantity,
      }));

      // Generate reference for stock reservation
      const reservationRef = `res_${Date.now()}_${Math.random().toString(36).substring(7)}`;
      const reservation = await catalogClient.reserveStock(reservationRef, reserveItems);

      // 2. Calculate authoritative totalAmount from catalog prices
      const authoritativeItems = reservation.items.map((item) => ({
        productId: item.productId,
        quantity: item.quantity,
        unitPrice: item.unitPrice,
      }));

      const totalAmount = authoritativeItems.reduce(
        (sum, item) => sum + item.quantity * item.unitPrice,
        0
      );

      // 3. Create order in DB with PENDING_PAYMENT status
      const order = await prisma.order.create({
        data: {
          userId: input.userId,
          status: "PENDING_PAYMENT",
          totalAmount,
          shippingAddress: input.shippingAddress,
          items: {
            create: authoritativeItems.map((item) => ({
              productId: item.productId,
              quantity: item.quantity,
              unitPrice: item.unitPrice,
            })),
          },
        },
        include: { items: true },
      });

      // 4. Publish asynchronous order.created event to RabbitMQ
      await publishOrderCreated({
        id: order.id,
        userId: order.userId,
        totalAmount: order.totalAmount,
        items: authoritativeItems,
      });

      orderMetrics.ordersCreatedTotal.inc();
      timer();

      return order;
    } catch (err) {
      timer();
      throw err;
    }
  }

  async listUserOrders(userId: string, page: number = 1, limit: number = 10) {
    const skip = (page - 1) * limit;
    const [orders, totalCount] = await Promise.all([
      prisma.order.findMany({
        where: { userId },
        skip,
        take: limit,
        orderBy: { createdAt: "desc" },
        include: { items: true },
      }),
      prisma.order.count({ where: { userId } }),
    ]);

    return {
      orders,
      totalCount,
      page,
      limit,
      totalPages: Math.ceil(totalCount / limit),
    };
  }

  async getOrderById(orderId: string, userId: string) {
    const order = await prisma.order.findUnique({
      where: { id: orderId },
      include: { items: true },
    });

    if (!order || order.userId !== userId) {
      return null;
    }

    return order;
  }
}

export const orderService = new OrderService();
