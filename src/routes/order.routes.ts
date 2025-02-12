import { Router } from 'express';
import { searchOrder, createOrder, updateOrder, deleteOrder, getAllOrders, getOrderById } from '../controllers/order.controller';
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

router.get('/', getAllOrders);
router.get('/search/s', searchOrder);
router.route('/:id')
    .get(getOrderById) 
    .put([requireBody], updateOrder) 
    .delete(deleteOrder); 


export default router;
