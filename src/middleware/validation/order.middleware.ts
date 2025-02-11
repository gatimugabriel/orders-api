import { check } from "express-validator";

//  Order Input Validation
export const validateOrderEntry = [
    check("items.*.productID", "Product ID is required").not().isEmpty(),
    check("items.*.quantity", "Quantity is required").not().isEmpty(),
    check("items.*.quantity", "Quantity must be greater than 0").isInt({min: 1}), 
    check("shippingAddress", "Shipping Address is required").not().isEmpty(),

    check("deliveryMethod", "Delivery Method is required").not().isEmpty(),
    check("paymentGatewayProvider", "Payment Service Provider is required").not().isEmpty().isIn(["STRIPE", "PAYPAL", "HELCIM"]).withMessage("must be one of : STRIPE, PAYPAL, HELCIM"),
    check("paymentMethod", "Payment Service Provider is required").not().isEmpty().isIn(["CARD", "CRYPTO", "PAYPAL"]).withMessage("must be one of : CARD, PAYPAL, CRYPTO"),
    check("paymentMode", "Payment Mode is required").not().isEmpty().isIn(["ONLINE", "ONDELIVERY"]).withMessage("must be either 'ONLINE' (which means now) / 'ONDELIVERY' "),
]