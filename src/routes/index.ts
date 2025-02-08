import { Express, Router } from 'express'
import authRoutes from './auth.routes'
import productRoutes from './product.routes'
import orderRoutes from "./order.routes";

const routes = (app: Express, base_api: string) => {
    const router = Router()

    router.use('/auth', authRoutes)
    router.use('/orders', orderRoutes)
    router.use('/products', productRoutes)
    // router.use('/pay', paymentRoutes)

    //--- SSE Endpoints ---//
    // router.use('/sse/pay', paymentEvents)

    app.use(`${base_api}`, router)
}

export default routes
