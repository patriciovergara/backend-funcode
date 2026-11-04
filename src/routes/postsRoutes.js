import { Router } from "express";

import {
  getPosts,
  createPublication,
  getPostById,
  updatePublication,
  deletePublication,
} from "../controllers/postsController.js";

import { validateCatalogQuery } from "../middlewares/validateCatalogQuery.js";
import { requireAuth } from "../middlewares/requireAuth.js";
import { requireAdmin } from "../middlewares/requireAdmin.js";
import { validatePost } from "../middlewares/validatePost.js";
import { validatePostId } from "../middlewares/validatePostId.js";

const router = Router();

router.get("/", validateCatalogQuery, getPosts);

router.get("/:id", validatePostId, getPostById);

router.post(
  "/",
  requireAuth,
  requireAdmin,
  validatePost,
  createPublication
);

router.put(
  "/:id",
  requireAuth,
  requireAdmin,
  validatePostId,
  validatePost,
  updatePublication
);

router.delete(
  "/:id",
  requireAuth,
  requireAdmin,
  validatePostId,
  deletePublication
);

export default router;