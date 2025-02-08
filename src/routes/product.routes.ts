import { Router } from 'express';
import { fetchProducts, fetchFeaturedProducts, getProduct, searchProduct, addProduct, updateProduct, deleteProduct} from '../controllers/product.controller';
import {requireBody, validate} from "../middleware/validation/base.middleware";
import {authenticate} from "../middleware/auth/auth.middleware";
import {validateProductEntry} from "../middleware/validation/product.middleware";

const router = Router();

// --- public routes
router.get('/all', fetchProducts);
router.get('/featured', fetchFeaturedProducts);
router.get('/get/:id', getProduct);
router.get('/search/s', searchProduct);

// --- private routes
router.use(authenticate);

// add product
router.post('/',
    [
        requireBody,
        ...validateProductEntry,
        validate
    ],
    addProduct
)

router.route('/:id')
    .put([requireBody], updateProduct) // update
    .delete(deleteProduct); // delete


export default router;
