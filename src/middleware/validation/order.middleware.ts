import { check } from "express-validator";

//  Order Inout Validation
export const validateOrderEntry = [
    check("items", "Order items are required").not().isEmpty(),
    check("totalCartValue", "Cart Value is required").not().isEmpty(),
    check("totalCartQuantity", "Items quantity is required").not().isEmpty(),
    check("deliveryMethod", "Delivery Method is required").not().isEmpty(),
    check("addressBook", "Customer phone number is required").not().isEmpty(),
    check("isPrimaryAddress", "Address state (primary / custom) is required").not().isEmpty(),
    check("paymentMethod", "Payment Method is required").not().isEmpty(),
    check("paymentGatewayProvider", "Payment Service Provider is required").not().isEmpty(),
]