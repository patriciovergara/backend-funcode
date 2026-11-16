import { Router } from "express";

import validateContact from "../middlewares/validateContact.js";
import { submitContactForm } from "../controllers/contactController.js";
import { verifyRecaptcha } from "../middlewares/verifyRecaptcha.js";

const router = Router();

router.post("/", validateContact, verifyRecaptcha("contact"), submitContactForm);

export default router;
