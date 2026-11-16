import { Router } from "express";

import validateContact from "../middlewares/validateContact.js";
import { submitContactForm, verifyContactForm } from "../controllers/contactController.js";
import { verifyRecaptcha } from "../middlewares/verifyRecaptcha.js";
import { optionalAuth } from "../middlewares/optionalAuth.js";
import rateLimit from "express-rate-limit";

const router = Router();

const verificationLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 30,
  standardHeaders: true,
  legacyHeaders: false,
  message: { message: "Demasiados intentos de verificación. Inténtalo más tarde." },
});

const contactLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 10,
  standardHeaders: true,
  legacyHeaders: false,
  message: { message: "Demasiados intentos de contacto. Inténtalo más tarde." },
});

router.post("/", contactLimiter, validateContact, optionalAuth, verifyRecaptcha("contact"), submitContactForm);
router.post("/verify", verificationLimiter, optionalAuth, verifyContactForm);

export default router;
