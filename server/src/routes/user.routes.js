import { Router } from 'express';
import { loginUser, registerUser, logoutUser, refreshAcessToken, changeCurrentPassword, getCurrentUser } from '../controllers/auth.controllers.js';
import { verifyJWT } from '../middlewares/auth.middleware.js';

const router = Router();

router.route('/register').post(registerUser);

router.route('/login').post(loginUser);

router.route('/logout').post(verifyJWT, logoutUser);
router.route('/refresh-token').post(refreshAcessToken)
router.route("/change-password").post(verifyJWT, changeCurrentPassword)
router.route("/current-user").get(verifyJWT, getCurrentUser)

export default router;
