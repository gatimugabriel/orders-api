import {Router} from 'express';
import {fetchOrders, getOrder, searchOrder, createOrder, updateOrder, deleteOrder} from '../controllers/order.controller';
import {authenticate} from "../middleware/auth/auth.middleware";
import {requireBody, validate} from "../middleware/validation/base.middleware";
import {validateOrderEntry} from "../middleware/validation/order.middleware";

const router = Router();

// --- all routes are private
router.use(authenticate);

router.get('/all', fetchOrders);
router.get('/get/:id', getOrder);
router.get('/search/s', searchOrder);

// add product
router.post('/',
    [
        requireBody,
        ...validateOrderEntry,
        validate
    ],
    createOrder
)

router.route('/:id')
    .put([requireBody], updateOrder) // update
    .delete(deleteOrder); // delete


export default router;
