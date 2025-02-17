import { Router } from 'express';
import {
    searchOrder,
    createOrder,
    updateOrder,
    deleteOrder,
    getAllOrders,
    getOrderById,
    getMyOrders, searchMyOrders
} from '../controllers/order.controller';
import { authenticate } from "../middleware/auth/auth.middleware";
import { requireBody, validate } from "../middleware/validation/base.middleware";
import { validateOrderEntry } from "../middleware/validation/order.middleware";
import {canAccessOrder} from "../middleware/auth/order_access.middleware";
import {isAdminOrManager} from "../middleware/auth/role.middleware";

const router = Router();

// --- all routes are private
router.use(authenticate);

router.post('/',
    [
        requireBody,
        ...validateOrderEntry,
        validate
    ],
    createOrder
)

//____ self(only resource owner can access) routes ____//
router.get('/me', getMyOrders);
router.get('/me/search/s', searchMyOrders);

//___ resource owner or ADMIN/MANAGER can access ____//
router.route('/:id')
    .get(canAccessOrder, getOrderById)
    .put(canAccessOrder, [requireBody], updateOrder)
    .delete(canAccessOrder, deleteOrder);

//____ The following routes require ADMIN or MANAGER privileges ____//
router.use(isAdminOrManager);

router.get('/', getAllOrders);
router.get('/search/s', searchOrder);

export default router;
