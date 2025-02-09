import { Request, Response } from "express";
import { ExtendedRequest } from "../@types/express";
import asyncHandler from "express-async-handler";
import { PrismaClient } from "@prisma/client";
import { withAccelerate } from "@prisma/extension-accelerate";

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
    const { user } = req;
    const userID = user?.userId as number;
    const {
        items,
        totalCartValue,
        totalCartQuantity,
        deliveryMethod,
        isPrimaryAddress,
        addressBook,
        paymentMethod,
        paymentGatewayProvider
    } = req.body;

    // --- START TRANSACTION --- //
    try {
        const transaction = await prisma.$transaction(async (tx: any) => {

            const orderData: any = {
                user: { connect: { id: userID } },
                totalItems: totalCartQuantity as number,
                totalPrice: totalCartValue,
                deliveryMethod,
                customShippingAddress: isPrimaryAddress
                    ? null
                    : JSON.stringify(addressBook), // custom address stored as a string
            };

            if (isPrimaryAddress) {
                orderData.userAddress = { connect: { id: addressBook.id } };
            }

            const order = await tx.order.create({
                data: orderData,
            });

            // Create order-items
            const orderItems = await Promise.all(
                items.map(async (item: any) => {
                    const { id: productID, quantity } = item;

                    const product = await Product.findUnique({
                        where: { id: productID },
                    });

                    if (!product) {
                        res.status(404);
                        throw new Error(`Product with id ${productID} not found`);
                    }

                    return tx.orderItem.create({
                        data: {
                            order: { connect: { id: order.id } },
                            product: { connect: { id: productID } },
                            price: product.price,
                            quantity,
                        },
                    });
                })
            );

            // Create payment record
            const payment = await tx.payment.create({
                data: {
                    user: { connect: { id: userID } },
                    order: { connect: { id: order.id } },
                    amount: totalCartValue,
                    paymentMethod,
                    paymentGatewayProvider
                },
            });

            return { order, orderItems, payment };
        })

        res.status(201).json({
            message: 'Order placed successfully. You will receive an email confirmation',
            data: transaction
        });
    } catch (error:any) {
        console.error('\t\t Error : \n', error);
        res.status(500)
        throw new Error(error.message || error || 'Something went wrong');
    }
});


// @ desc --- Get Multiple Orders
// @ route  --GET-- [base_api]/orders
export const fetchOrders = asyncHandler(async (req: Request, res: Response) => {
    const { page } = req.query
    const pageNumber = typeof page === "string" ? Number(page) - 1 : 0
    const limit = 12
    const skipValues = pageNumber * limit

    const totalCount = await Order.count()
    const orders = await Order.findMany({
        skip: skipValues,
        take: limit,
        include: {
            user: {select: {email: true}},
            items: {
                include: {
                    product: true,
                }
            },
            payment: true
        },
        cacheStrategy: {
            ttl: 60 , // 1 min
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
    const { id } = req.params;
    const order = await Order.findUnique({
        where: { id: Number(id) },
        include: {
            user: {select: {email: true}},
            items: {
                include: {
                    product: true
                }
            },
            payment: true,
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
        // where: {
        //     AND: [
        //         { shippingAddress: { contains: shippingAddress, mode: 'insensitive' } },
        //         { billingAddress: billingAddress }
        //     ]
        // },
        take: 25
    })

    res.status(200).json({ data })
})


// @ desc --- Update Product
// @ route  --PUT-- [base_api]/orders/:id
export const updateOrder = asyncHandler(async (req: Request, res: Response) => {
    const { id } = req.params;
    const { status, shippingAddress, billingAddress } = req.body;

    const updateOrder = await Order.update({
        where: { id: Number(id) },
        data: {
            status,
            // shippingAddress,
            // billingAddress,
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

    const deleteOrder = await Order.delete({
        where: { id: Number(id) }
    });

    if (!deleteOrder) {
        res.status(400);
        throw new Error("Failed to delete Order. Try again later");
    }

    res.status(200).json({ message: "Order deleted successfully" });
})
