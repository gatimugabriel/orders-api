import Redis from 'ioredis';
import { Order } from '@prisma/client';

const redis = new Redis({
  host: process.env.REDIS_HOST || 'localhost',
  port: parseInt(process.env.REDIS_PORT || '6379')
});

export class CacheService {
  private static CACHE_TTL = 3600; // 1 hour 

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
  }
}