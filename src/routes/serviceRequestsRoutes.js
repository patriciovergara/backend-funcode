import { Router } from "express";

import validateServiceRequest from "../middlewares/validateServiceRequest.js";
import { createServiceRequestController } from "../controllers/serviceRequestsController.js";
import { verifyRecaptcha } from "../middlewares/verifyRecaptcha.js";

const router = Router();

router.post(
  "/",
  validateServiceRequest,
  verifyRecaptcha("quote"),
  createServiceRequestController
);

export default router;