import {
  listPosts,
  createPost,
  findPostById,
  updatePost,
  deletePost,
  listOwnPosts,
} from "../models/postsModel.js";

export async function getPosts(req, res, next) {
  try {
    const result = await listPosts(req.catalogQuery);

    return res.status(200).json(result);
  } catch (error) {
    return next(error);
  }
}
export async function createPublication(req, res, next) {
  try {
    const post = await createPost({
      ...req.postInput,
      userId: req.auth.userId,
    });

    return res.status(201).json({
      message: "Publicación creada correctamente",
      post,
    });
  } catch (error) {
    if (
      error.code === "23503" &&
      error.constraint === "posts_category_fk"
    ) {
      return res.status(400).json({
        message: "La categoría seleccionada no existe",
      });
    }

    if (
      error.code === "23503" &&
      error.constraint === "posts_user_fk"
    ) {
      return res.status(401).json({
        message: "La sesión no corresponde a un usuario disponible",
      });
    }

    return next(error);
  }
}
export async function getPostById(req, res, next) {
  try {
    const post = await findPostById(req.postId);

    if (!post) {
      return res.status(404).json({
        message: "Publicación no encontrada",
      });
    }

    return res.status(200).json({
      post,
    });
  } catch (error) {
    return next(error);
  }
}
export async function updatePublication(req, res, next) {
  try {
    const {
      title,
      description,
      price,
      price_type,
      image_url,
      category_id,
    } = req.postInput;

    const post = await updatePost({
      postId: req.postId,
      userId: req.auth.userId,
      title,
      description,
      price,
      priceType: price_type,
      imageUrl: image_url,
      categoryId: category_id,
    });

    if (!post) {
      return res.status(404).json({
        message:
          "Publicación no encontrada o no pertenece al usuario autenticado",
      });
    }

    return res.status(200).json({
      message: "Publicación actualizada correctamente",
      post,
    });
  } catch (error) {
    if (
      error.code === "CATEGORY_NOT_FOUND" ||
      (
        error.code === "23503" &&
        error.constraint === "posts_category_fk"
      )
    ) {
      return res.status(400).json({
        message: "La categoría seleccionada no existe",
      });
    }

    return next(error);
  }
}
export async function deletePublication(req, res, next) {
  try {
    const deleted = await deletePost({
      postId: req.postId,
      userId: req.auth.userId,
    });

    if (!deleted) {
      return res.status(404).json({
        message:
          "Publicación no encontrada o no pertenece al usuario autenticado",
      });
    }

    return res.status(204).end();
  } catch (error) {
    return next(error);
  }
}
export async function getMyPosts(req, res, next) {
  try {
    const { page, limit } = req.myPostsQuery;

    const result = await listOwnPosts({
      userId: req.auth.userId,
      page,
      limit,
    });

    return res.status(200).json(result);
  } catch (error) {
    return next(error);
  }
}