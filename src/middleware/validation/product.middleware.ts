import { check } from "express-validator";

// product body validation
export const validateProductEntry = [
    check("name", "Product name is required").not().isEmpty(),
    check("description", "Product description is required").not().isEmpty(),
    check("price", "Product price is required").not().isEmpty(),
    // check("discountRate", "Product discount rate is required").not().isEmpty(),
    check("category", "Product category is required").not().isEmpty(),
    check("stock", "Product stock is required").not().isEmpty(),
    check("slug", "Product slug is required").not().isEmpty(),
    check("brand", "Product brand is required").not().isEmpty(),
    check("quantity", "Product weight is required").not().isEmpty(),
    // check("dimensions", "Product dimensions is required").not().isEmpty(),
    check('images').custom((value, { req }) => {
        if (!req.files || Object.keys(req.files).length === 0) {
            throw new Error('At least one image is required');
        }
        return true;
    }),
]
