import { Request, Response } from "express";
import { OrderCacheService } from "../services/cache/order-cache.service";
import { ExtendedRequest } from "../@types/express";
import asyncHandler from "express-async-handler";
import { OrderStatus, Prisma, PrismaClient } from "@prisma/client";
import { queueOrderConfirmationEmail } from "../workers/email.worker";
import { withAccelerate } from "@prisma/extension-accelerate";
import { SearchOrderQuery } from "../@types/types";

const prisma = new PrismaClient({
    transactionOptions: {
        timeout: 15000,
        maxWait: 5000
    }
}).$extends(withAccelerate());
const Order = prisma.order


// @ desc --- Create Order
// @ route  --POST-- [base_api]/orders
export const createOrder = asyncHandler(async (req: ExtendedRequest, res: Response) => {
    const { user } = req;
    const userID = user?.userID as number;
    const {
        items, // [ {productID, quantity}, {...}]
        deliveryMethod,
        shippingAddress,

        paymentGatewayProvider,
        paymentMethod,
        paymentMode
    } = req.body;

    // --- START TRANSACTION --- //
    try {
        const transaction = await prisma.$transaction(async (tx: any) => {

            // Fetch all products and calculate totals
            const products = await tx.product.findMany({
                where: {
                    id: {
                        in: items.map((item: any) => item.productID)
                    }
                }
            });

            // Validate all products exist
            if (products.length !== items.length) {
                // Get which products are missing in fetched products
                const missingProducts = items.filter((item: any) => !products.find((p: any) => p.id === item.productID));
                res.status(404);
                throw new Error(`Product(s) with id(s) ${missingProducts.map((p: any) => p.productID).join(', ')} not found`);
            }

            let totalItems = 0;
            let totalPrice = 0;

            const orderItems = items.map((item: any) => {
                const product = products.find((p: any) => p.id === item.productID);
                if (!product) throw new Error(`Product ${item.productId} not found`);

                totalItems += item.quantity;
                const itemPrice = product.price * item.quantity;
                const discountedPrice = product.discountRate
                    ? itemPrice * (1 - (product.discountRate / 100))
                    : itemPrice;
                totalPrice += discountedPrice;

                return {
                    productID: product.id,
                    quantity: item.quantity,
                    price_at_time: product.price,
                    discount_rate_at_time: product.discountRate || null
                };
            });

            const orderData = {
                user: { connect: { id: userID } },
                totalItems,
                totalPrice,
                deliveryMethod,
                shippingAddress,
                items: {
                    create: orderItems
                }
            };

            //____ Create PAYMENT record ____//
            const payment = await tx.payment.create({
                data: {
                    user: { connect: { id: userID } },
                    amount: totalPrice,
                    paymentGatewayProvider,
                    paymentMethod,
                    paymentMode
                },
            });

            //____ Create ORDER ____//
            const order = await tx.order.create({
                data: {
                    ...orderData,
                    payment: { connect: { id: payment.id } }  // Connect the order to payment
                },
                include: {
                    user: true
                }
            });

            // Cache the order
            await OrderCacheService.cacheOrder(order.id, order);

            // Queue order confirmation email
            await queueOrderConfirmationEmail(order);

            return { order, payment };
        });

        res.status(201).json({
            message: 'Order placed successfully. You will receive an email confirmation',
            data: transaction
        });
    } catch (error: any) {
        console.error('\t\t Error : \n', error);
        res.status(500);
        throw new Error(error.message || error || 'Something went wrong');
    }
});

// @ desc --- Get Single Order by ID
// @ route  --GET-- [base_api]/orders/:id
export const getOrderById = asyncHandler(async (req: Request, res: Response) => {
    const orderId = parseInt(req.params.id);

    // Try to get from cache first
    const cachedOrder = await OrderCacheService.getCachedOrder(orderId);
    if (cachedOrder) {
        res.json({
            success: true,
            data: cachedOrder,
            source: "cache"
        })
        return
    }

    // If not in cache, get from database
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
    if (!order) {
        res.status(404);
        throw new Error("Order not found or may have been deleted");
    }

    // Cache the order for future requests
    await OrderCacheService.cacheOrder(orderId, order);

    res.json({
        success: true,
        data: order,
        source: "database"
    });
});

/**
 * @swagger
 * /orders:
 *   get:
 *     summary: Get all orders with pagination
 *     tags: [Orders]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *           minimum: 1
 *           default: 1
 *         description: Page number for pagination
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           minimum: 1
 *           maximum: 100
 *           default: 10
 *         description: Number of items per page
 *       - in: query
 *         name: status
 *         schema:
 *           type: string
 *           enum: [PENDING, PROCESSING, COMPLETED, CANCELLED]
 *         description: Filter orders by status
 *     responses:
 *       200:
 *         description: List of orders retrieved successfully
 *       401:
 *         description: Unauthorized access
 */
export const getAllOrders = asyncHandler(async (req: Request, res: Response) => {
    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 10;
    const status = req.query.status as string;
    const skip = (page - 1) * limit;

    // Try to get from cache first if no status filter
    if (!status) {
        const cachedOrders = await OrderCacheService.getCachedOrders(page);
        if (cachedOrders) {
            res.json({
                success: true,
                data: cachedOrders,
                source: "cache"
            });
        }
        return
    }

    const orders = await Order.findMany({
        skip,
        take: limit,
        include: {
            items: {
                include: {
                    product: {
                        select: {
                            name: true,
                            description: true,
                            images: true,
                            category: true,
                            brand: true,
                            slug: true
                        }
                    }
                }
            },
            user: { select: { email: true } },
            // payment: true
        },
        orderBy: {
            createdAt: 'desc'
        },
        cacheStrategy: {
            ttl: 60, // 1 min
            swr: 120 // 2 min
        }

    });
    const total = await Order.count();

    res.json({
        pagination: {
            page,
            limit,
            total,
            pages: Math.ceil(total / limit)
        },
        data: orders,
        source: "database"
    });
});

// @ desc --- Search for Order(s) with pagination
// @ route  --GET-- [base_api]/orders/search
export const searchOrder = asyncHandler(async (req: Request, res: Response) => {
    const {
        shippingAddress,
        deliveryMethod,
        status,
        minPrice,
        maxPrice,
        minItems,
        maxItems,
        startDate,
        endDate,
        userID,
        page = '1',
        limit = '10'
    } = req.query as SearchOrderQuery

    const pageNum = Math.max(1, parseInt(page))
    const limitNum = Math.max(1, Math.min(50, parseInt(limit))) // 50 items per page
    const skip = (pageNum - 1) * limitNum

    const whereClause: Prisma.OrderWhereInput = {
        AND: []
    }

    // @ts-ignore
    whereClause.AND.push({ status: { not: 'CANCELLED' } })

    // optional filters
    if (shippingAddress) {
        // @ts-ignore
        whereClause.AND.push({
            shippingAddress: { contains: shippingAddress, mode: 'insensitive' }
        })
    }

    if (deliveryMethod) {
        // @ts-ignore
        whereClause.AND.push({
            deliveryMethod: { contains: deliveryMethod, mode: 'insensitive' }
        })
    }

    if (status && Object.values(OrderStatus).includes(status as OrderStatus)) {
        // @ts-ignore
        whereClause.AND.push({ status })
    }

    if (minPrice || maxPrice) {
        // @ts-ignore
        whereClause.AND.push({
            totalPrice: {
                gte: minPrice ? parseFloat(minPrice) : undefined,
                lte: maxPrice ? parseFloat(maxPrice) : undefined
            }
        })
    }

    if (minItems || maxItems) {
        // @ts-ignore
        whereClause.AND.push({
            totalItems: {
                gte: minItems ? parseInt(minItems) : undefined,
                lte: maxItems ? parseInt(maxItems) : undefined
            }
        })
    }

    if (startDate || endDate) {
        // @ts-ignore
        whereClause.AND.push({
            createdAt: {
                gte: startDate ? new Date(startDate) : undefined,
                lte: endDate ? new Date(endDate) : undefined
            }
        })
    }

    if (userID) {
        // @ts-ignore
        whereClause.AND.push({
            userID: parseInt(userID)
        })
    }

    // Execute query with pagination
    const [data, total] = await Promise.all([
        Order.findMany({
            where: whereClause,
            include: {
                items: {
                    include: {
                        product: {
                            select: {
                                id: true,
                                name: true,
                                images: true
                            }
                        }
                    }
                },
                user: {
                    select: {
                        id: true,
                        email: true
                    }
                },
                payment: {
                    select: {
                        id: true,
                        status: true,
                        paymentMethod: true,
                        paymentGatewayProvider: true,
                        paymentMode: true
                    }
                }
            },
            skip,
            take: limitNum,
            orderBy: {
                createdAt: 'desc'
            }
        }),
        Order.count({ where: whereClause })
    ])

    // pagination metadata
    const totalPages = Math.ceil(total / limitNum)
    const hasNext = pageNum < totalPages
    const hasPrev = pageNum > 1

    res.status(200).json({
        success: true,
        pagination: {
            page: pageNum,
            limit: limitNum,
            total,
            totalPages,
            hasNext,
            hasPrev
        },
        data,
    })
})

// @ desc --- Update Product
// @ route  --PUT-- [base_api]/orders/:id
export const updateOrder = asyncHandler(async (req: Request, res: Response) => {
    const { id } = req.params;
    const { status, shippingAddress, deliveryMethod } = req.body;

    const updateOrder = await Order.update({
        where: { id: Number(id) },
        data: {
            status,
            shippingAddress,
            deliveryMethod,
        },
    });
    if (!updateOrder) {
        res.status(400);
        throw new Error("Order failed to update. Try again later");
    }

    res.status(200).json({
        message: "Order updated successfully",
        data: updateOrder
    });
});

// @ desc --- Delete Order
// @ route  --DELETE-- [base_api]/orders/:id
export const deleteOrder = asyncHandler(async (req: Request, res: Response) => {
    const { id } = req.params;

    const deleteOrder = await Order.update({
        where: { id: Number(id) },
        data: {
            status: "CANCELLED",
        }
    });

    if (!deleteOrder) {
        res.status(400);
        throw new Error("Failed to delete Order. Try again later");
    }

    res.status(200).json({ message: "Order deleted successfully" });
})
