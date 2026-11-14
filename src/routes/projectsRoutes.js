import { Router } from "express";

import {
  createProjectController,
  deleteProjectController,
  getProjects,
  getProjectsForAdmin,
  updateProjectController,
} from "../controllers/projectsController.js";
import { requireAdmin } from "../middlewares/requireAdmin.js";
import { requireAuth } from "../middlewares/requireAuth.js";
import { validateProject } from "../middlewares/validateProject.js";
import { validateProjectId } from "../middlewares/validateProjectId.js";

const router = Router();

router.get("/", getProjects);
router.get("/manage", requireAuth, requireAdmin, getProjectsForAdmin);
router.post("/", requireAuth, requireAdmin, validateProject, createProjectController);
router.put(
  "/:id",
  requireAuth,
  requireAdmin,
  validateProjectId,
  validateProject,
  updateProjectController,
);
router.delete(
  "/:id",
  requireAuth,
  requireAdmin,
  validateProjectId,
  deleteProjectController,
);

export default router;
