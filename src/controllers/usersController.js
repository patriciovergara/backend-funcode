import bcrypt from "bcryptjs";
import {
  createUser,
  findUserById,
} from "../models/usersModel.js";

export async function registerUser(req, res, next) {
  try {
    const { name, email, password } = req.registration;

    const passwordHash = await bcrypt.hash(password, 12);

    const user = await createUser({
      name,
      email,
      passwordHash,
    });

    return res.status(201).json({
      message: "Usuario registrado correctamente",
      user,
    });
  } catch (error) {
    if (
      error.code === "23505" &&
      error.constraint === "users_email_key"
    ) {
      return res.status(409).json({
        message: "El correo ya está registrado",
      });
    }

    return next(error);
  }
}
export async function getCurrentUser(req, res, next) {
  try {
    const user = await findUserById(req.auth.userId);

    if (!user) {
      return res.status(401).json({
        message: "La sesión no corresponde a un usuario disponible",
      });
    }

    return res.status(200).json({
      user,
    });
  } catch (error) {
    return next(error);
  }
}