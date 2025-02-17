import { Response, NextFunction } from 'express';
import { ExtendedRequest } from '../../@types/express';
import asyncHandler from 'express-async-handler';
import {getOrderWithCaching} from "../../services/orders/order.service";

export const canAccessOrder = asyncHandler(async (
    req: ExtendedRequest,
    res: Response,
    next: NextFunction
) => {
    const orderId = parseInt(req.params.id);
    const user = req.user!;

    // Fetch order with caching
    const data = await getOrderWithCaching(orderId);
    if (!data.order) {
        res.status(404);
        throw new Error("Order not found or may have been deleted");
    }

    // Admins and Managers can access any order
    if (['ADMIN', 'MANAGER'].includes(user.role)) {
        req.order = data.order;
        req.orderSource = data.orderSource as "cache" | "database";
        next();
        return;
    }

    // Check ownership for non-admin/manager
    if (data.order.userID !== user.userID) {
        res.status(403)
        throw new Error("Insufficient permissions");
    }

    req.order = data.order;
    req.orderSource = data.orderSource as "cache" | "database";
    next();
});