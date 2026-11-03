import { Router } from "express";
import {
  registerUser,
  getCurrentUser,
} from "../controllers/usersController.js";
import { validateRegister } from "../middlewares/validateRegister.js";
import { requireAuth } from "../middlewares/requireAuth.js";
import { getMyPosts } from "../controllers/postsController.js";
import { validateMyPostsQuery } from "../middlewares/validateMyPostsQuery.js";

const router = Router();

router.post("/", validateRegister, registerUser);
router.get("/me/posts", requireAuth, validateMyPostsQuery, getMyPosts);

router.get("/me", requireAuth, getCurrentUser);

export default router;