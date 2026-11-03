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
import { validatePost } from "../middlewares/validatePost.js";
import { validatePostId } from "../middlewares/validatePostId.js";

const router = Router();

router.get("/", validateCatalogQuery, getPosts);

router.get("/:id", validatePostId, getPostById);

router.put("/:id", requireAuth, validatePostId, validatePost, updatePublication);

router.post("/", requireAuth, validatePost, createPublication);

router.delete("/:id", requireAuth, validatePostId, deletePublication);

export default router;