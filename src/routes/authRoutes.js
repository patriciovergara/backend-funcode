import { Router } from "express";
import { loginUser, logoutUser } from "../controllers/authController.js";
import { validateLogin } from "../middlewares/validateLogin.js";
import { verifyRecaptcha } from "../middlewares/verifyRecaptcha.js";

const router = Router();

router.post("/login", validateLogin, verifyRecaptcha("login"), loginUser);
router.post("/logout", logoutUser);

export default router;
