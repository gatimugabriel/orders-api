import {OrderCacheService} from "../cache/order_cache.service";
import {PrismaClient} from "@prisma/client";
import {withAccelerate} from "@prisma/extension-accelerate";

const prisma = new PrismaClient({
    transactionOptions: {
        timeout: 15000,
        maxWait: 5000
    }
}).$extends(withAccelerate());
const Order = prisma.order

export const getOrderWithCaching = async (orderId: number) => {
    // Check cache first
    const cachedOrder = await OrderCacheService.getCachedOrder(orderId);
    if (cachedOrder) return {order: cachedOrder, orderSource: "cache"};

    // Fetch from database if not in cache
    const order = await Order.findUnique({
        where: { id: orderId },
        include: {
            user: { select: { email: true } },
            items: {
                include: {
                    product: true
                }
            },
            // payment: true,
        },
        cacheStrategy: {
            ttl: 3600, // 1 hour
            swr: 7200 // 2 hours
        }
    });

    if (order) {
        await OrderCacheService.cacheOrder(orderId, order);
    }

    return {order, orderSource: "database"};
};