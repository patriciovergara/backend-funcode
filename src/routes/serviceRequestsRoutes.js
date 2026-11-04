import { Router } from "express";

import validateServiceRequest from "../middlewares/validateServiceRequest.js";
import { createServiceRequestController } from "../controllers/serviceRequestsController.js";

const router = Router();

router.post(
  "/",
  validateServiceRequest,
  createServiceRequestController
);

export default router;