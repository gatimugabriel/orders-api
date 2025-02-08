import { check } from "express-validator";

export const validateSignupData = [
    check("email", "Please include a valid email").isEmail(),
    check("first_name", "First Name is Required").isLength({ min: 3 }).withMessage("Name should be at least 3 characters"),
    check("last_name", "Last Name is Required").isLength({ min: 3 }).withMessage("Name should be at least 3 characters"),
    check("confirm_password", "Confirm password is required")
        .not().isEmpty()
        .isLength({ min: 6 })
        .withMessage("Password should be at least 6 characters long")
        .isStrongPassword()
        .withMessage(
            "Password should contain an uppercase and lowercase letters, a number, and a special characters"
        ),
]

export const validatePassword = [
    check("password", "Password is required")
        .not().isEmpty()
        .isLength({ min: 6 })
        .withMessage("Password should be at least 6 characters long")
        .isStrongPassword()
        .withMessage(
            "Password should have both uppercase and lowercase letters, numbers, and special characters"
        ),
];

