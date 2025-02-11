import {Request, Response} from "express";
import {ExtendedRequest} from "../@types/express";
import asyncHandler from "express-async-handler";
import {PrismaClient} from "@prisma/client";
import {withAccelerate} from "@prisma/extension-accelerate";

const prisma = new PrismaClient({
    transactionOptions: {
        timeout: 15000,
        maxWait: 5000
    }
}).$extends(withAccelerate());
const Order = prisma.order
const Product = prisma.product
const OrderItem = prisma.orderItem
const Payment = prisma.payment

// @ desc --- Create Order
// @ route  --POST-- [base_api]/orders
export const createOrder = asyncHandler(async (req: ExtendedRequest, res: Response) => {
    const {user} = req;
    const userID = user?.userID as number;
    const {
        items, // [ {productID, quantity}, {...}]
        deliveryMethod,
        shippingAddress,

        paymentGatewayProvider,
        paymentMethod,
        paymentMode
    } = req.body;

    console.log("body", req.body);

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
                user: {connect: {id: userID}},
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
                    user: {connect: {id: userID}},
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
                    payment: {connect: {id: payment.id}}  // Connect the order to payment
                },
            });

            return {order, payment};
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

// @ desc --- Get Multiple Orders
// @ route  --GET-- [base_api]/orders
export const fetchOrders = asyncHandler(async (req: Request, res: Response) => {
    let {page, limit} = req.query
    const pageNumber = parseInt(page as string) - 1 || 0
    const intLimit = parseInt(limit as string) || 10
    const skipValues = pageNumber * intLimit

    const totalCount = await Order.count()
    const orders = await Order.findMany({
        where: {status: {not: "CANCELLED"}},
        skip: skipValues,
        take: intLimit,
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
            user: {select: {email: true}},
            // payment: true
        },
        cacheStrategy: {
            ttl: 60, // 1 min
            swr: 120 // 2 min
        }
    });
    res.status(200).json({
        page: pageNumber + 1,
        count: orders.length,
        totalCount,
        data: orders
    });
});

// @ desc --- Get Single Order
// @ route  --GET-- [base_api]/orders/get/:id
export const getOrder = asyncHandler(async (req: Request, res: Response) => {
    const {id} = req.params;
    const order = await Order.findUnique({
        where: {id: parseInt(id as string)},
        include: {
            user: {select: {email: true}},
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
        res.status(404).json({
            message: "Order not found or may have been deleted"
        })
        return
    }
    res.status(200).json({
        data: order
    });
});

// @ desc --- Search for Order(s)
// @ route  --GET-- [base_api]/orders/search/s
export const searchOrder = asyncHandler(async (req: Request, res: Response) => {
    const shippingAddress = req.query.shippingAddress as string
    const billingAddress = req.query.billingAddress as string
    const minPrice = req.query.minPrice as string
    const maxPrice = req.query.maxPrice as string

    const data = await Order.findMany({
        where: {status: {not: "CANCELLED"}},

        // where: {
        //     AND: [
        //         { shippingAddress: { contains: shippingAddress, mode: 'insensitive' } },
        //         { billingAddress: billingAddress }
        //     ]
        // },
        take: 25
    })

    res.status(200).json({data})
})


// @ desc --- Update Product
// @ route  --PUT-- [base_api]/orders/:id
export const updateOrder = asyncHandler(async (req: Request, res: Response) => {
    const {id} = req.params;
    const {status, shippingAddress, deliveryMethod} = req.body;

    const updateOrder = await Order.update({
        where: {id: Number(id)},
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
    const {id} = req.params;

    const deleteOrder = await Order.update({
        where: {id: Number(id)},
        data: {
            status: "CANCELLED",
        }
    });

    if (!deleteOrder) {
        res.status(400);
        throw new Error("Failed to delete Order. Try again later");
    }

    res.status(200).json({message: "Order deleted successfully"});
})
