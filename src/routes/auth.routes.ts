import {Router} from 'express';
import {signIn, signOut, signUp} from '../controllers/auth.controller';
import {validatePassword, validateSignupData} from "../middleware/validation/user.middleware";
import {requireBody, validate} from "../middleware/validation/base.middleware";

const router = Router();

router.post('/signup', [
        requireBody,
        ...validateSignupData,
        ...validatePassword,
        validate
    ]
    , signUp);

router.post('/signin', [requireBody], signIn);
router.get('/signout', signOut);

export default router;
