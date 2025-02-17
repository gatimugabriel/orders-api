import { Router } from 'express'
import {
    createProduct,
    deleteProduct,
    fetchFeaturedProducts,
    getAllProducts,
    getProduct,
    searchProduct,
    updateProduct
} from '../controllers/product.controller'
import { requireBody, validate } from "../middleware/validation/base.middleware"
import { authenticate } from "../middleware/auth/auth.middleware"
import { validateProductEntry } from "../middleware/validation/product.middleware"
import { isAdminOrManager } from "../middleware/auth/role.middleware"

const router = Router()

//___ public routes ___//
router.get('/', getAllProducts)
router.get('/:id', getProduct)
router.get('/search/s', searchProduct)
router.get('/featured', fetchFeaturedProducts)

//___ private routes ____//
router.use(authenticate)

router.post('/',
    [
        requireBody,
        isAdminOrManager,
        ...validateProductEntry,
        validate
    ],
    createProduct
)

router.route('/:id')
    .put([
        requireBody,
        isAdminOrManager
    ], updateProduct)
    .delete(isAdminOrManager, deleteProduct)

export default router