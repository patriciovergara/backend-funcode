import { Router } from "express";

import validateContact from "../middlewares/validateContact.js";
import { submitContactForm } from "../controllers/contactController.js";

const router = Router();

router.post("/", validateContact, submitContactForm);

export default router;
