import {Order} from '@prisma/client';
import {redis} from "../../config/redis.config";

/**
 * Service for handling order-related caching operations using Redis
 */
export class OrderCacheService {
    private static CACHE_TTL = 3600; // 1 hour
    private static PAGINATED_CACHE_TTL = 300; // 5 minutes for paginated results

    /**
     * Cache paginated list of orders
     */
    static async cachePageOrders(page: number, limit: number, orders: Order[]) {
        const key = `orders:page:${page}:limit:${limit}`;
        await redis.setex(key, this.PAGINATED_CACHE_TTL, JSON.stringify(orders));
    }

    /**
     * GET cached paginated list of orders
     */
    static async getCachedPageOrders(page: number, limit: number): Promise<Order[] | null> {
        const key = `orders:page:${page}:limit:${limit}`;
        const cachedData = await redis.get(key);
        return cachedData ? JSON.parse(cachedData) : null;
    }


    /**
     * Cache paginated list of certain USER orders
     */
    static async cacheUserOrders(userID: number | string, limit: number, orders: Order[]) {
        const key = `orders:user:${userID}:limit:${limit}`;
        await redis.setex(key, this.PAGINATED_CACHE_TTL, JSON.stringify(orders));
    }

    /**
     * Get cached paginated list of certain USER orders
     */
    static async getCachedUserOrders(userID: number | string, limit: number): Promise<Order[] | null> {
        const key = `orders:user:${userID}:limit:${limit}`;
        const cachedData = await redis.get(key);
        return cachedData ? JSON.parse(cachedData) : null;
    }


    /**
     * Cache a single order by ID
     */
    static async cacheOrder(orderId: number, orderData: Order) {
        const key = `order:${orderId}`;
        await redis.setex(key, this.CACHE_TTL, JSON.stringify(orderData));
    }

    static async getCachedOrder(orderId: number): Promise<Order | null> {
        const key = `order:${orderId}`;
        const cachedData = await redis.get(key);
        return cachedData ? JSON.parse(cachedData) : null;
    }

    static async invalidateOrderCache(orderId: number) {
        const key = `order:${orderId}`;
        await redis.del(key);

        // invalidate paginated lists when an order changes
        const keys = await redis.keys('orders:page:*');
        if (keys.length > 0) {
            await redis.del(...keys);
        }

        const userKeys = await redis.keys('orders:user:*');
        if (userKeys.length > 0) {
            await redis.del(...userKeys);
        }
    }
}