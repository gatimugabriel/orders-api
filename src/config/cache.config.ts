/**
 * Redis cache configuration
 */
export const CACHE_CONFIG = {
  // Cache TTLs in seconds
  CACHE_TTL: 3600, // 1 hour for single items
  PAGINATED_CACHE_TTL: 300, // 5 minutes for paginated lists
  
  // Redis connection config
  REDIS_HOST: process.env.REDIS_HOST || 'localhost',
  REDIS_PORT: parseInt(process.env.REDIS_PORT || '6379'),
  
  // Key prefixes
  KEY_PREFIXES: {
    PRODUCT: 'product',
    PRODUCTS_PAGE: 'products:page',
    ORDER: 'order', 
    ORDERS_PAGE: 'orders:page'
  }
};