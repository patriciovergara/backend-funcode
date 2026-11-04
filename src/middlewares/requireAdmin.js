import { findUserById } from "../models/usersModel.js";

export async function requireAdmin(req, res, next) {
  if (!req.auth?.userId) {
    return res.status(401).json({
      message: "Debes iniciar sesion.",
    });
  }

  try {
    const user = await findUserById(req.auth.userId);

    if (!user) {
      return res.status(401).json({
        message: "El usuario autenticado ya no existe.",
      });
    }

    if (user.role !== "admin") {
      return res.status(403).json({
        message: "Solo los administradores pueden gestionar servicios.",
      });
    }

    return next();
  } catch (error) {
    return next(error);
  }
}