## Caching Implementation

### 1. Redis
This is the main caching system I have implemented and it uses Redis for:

1. Product caching:
   - Single product lookups (1 hour TTL)
   - Paginated product lists (5 minutes TTL)
   - Auto-invalidation on updates

2. Order caching:
   - Single order lookups
   - Paginated order lists
   - Cache invalidation on order status changes

Cache keys:
- Single product: `product:{id}`
- Product list: `products:page:{pageNum}`
- Single order: `order:{id}`
- Order list: `orders:page:{pageNum}`


### 2. Database Level
Prisma itself also has its own caching techniques for get queries.
Such techniques is using accelerate extension. I have enabled it in get queries.
You can see more about prisma and these techniques and strategies in  [PRISMA.md](PRISMA.md) document.

