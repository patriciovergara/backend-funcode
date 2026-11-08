import { Router } from "express";
import { loginUser, logoutUser } from "../controllers/authController.js";
import { validateLogin } from "../middlewares/validateLogin.js";

const router = Router();

router.post("/login", validateLogin, loginUser);
router.post("/logout", logoutUser);

export default router;
