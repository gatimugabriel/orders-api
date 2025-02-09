import { Router } from 'express';
import { fetchOrders, getOrder, searchOrder, createOrder, updateOrder, deleteOrder } from '../controllers/order.controller';
import { authenticate } from "../middleware/auth/auth.middleware";
import { requireBody, validate } from "../middleware/validation/base.middleware";
import { validateOrderEntry } from "../middleware/validation/order.middleware";

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

router.get('/', fetchOrders);
router.get('/search', searchOrder);
router.route('/:id')
    .get(getOrder) 
    .put([requireBody], updateOrder) 
    .delete(deleteOrder); 


export default router;
