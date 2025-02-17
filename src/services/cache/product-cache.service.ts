import {Product} from '@prisma/client';
import {redis} from "../../config/redis.config";

export class ProductCacheService {
    private static CACHE_TTL = 3600; // 1 hour
    private static PAGINATED_CACHE_TTL = 300; // 5 minutes for paginated results

    /**
     * Caches a single product by its ID
     */
    static async cacheProduct(productId: number, productData: Product) {
        const key = `product:${productId}`;
        await redis.setex(key, this.CACHE_TTL, JSON.stringify(productData));
    }

    /**
     * Retrieves a cached product by its ID
     */
    static async getCachedProduct(productId: number): Promise<Product | null> {
        const key = `product:${productId}`;
        const cachedData = await redis.get(key);
        return cachedData ? JSON.parse(cachedData) : null;
    }

    /**
     * Caches a paginated list of products
     */
    static async cacheAllProducts(page: number, products: Product[]) {
        const key = `products:page:${page}`;
        await redis.setex(key, this.PAGINATED_CACHE_TTL, JSON.stringify(products));
    }

    /**
     * Retrieves a cached paginated list of products
     */
    static async getCachedProducts(page: number): Promise<Product[] | null> {
        const key = `products:page:${page}`;
        const cachedData = await redis.get(key);
        return cachedData ? JSON.parse(cachedData) : null;
    }

    /**
     * Invalidates product cache and related paginated lists
     */
    static async invalidateProductCache(productId: number) {
        const key = `product:${productId}`;
        await redis.del(key);

        //  clear paginated product lists as they might be outdated
        const keys = await redis.keys('products:page:*');
        if (keys.length > 0) {
            await redis.del(...keys);
        }
    }
}