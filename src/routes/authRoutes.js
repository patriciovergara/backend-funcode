import { Router } from "express";
import { loginUser } from "../controllers/authController.js";
import { validateLogin } from "../middlewares/validateLogin.js";

const router = Router();

router.post("/login", validateLogin, loginUser);

export default router;