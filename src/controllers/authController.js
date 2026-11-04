import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import { randomBytes } from "node:crypto";
import { jwtConfig } from "../config/jwt.js";
import { findUserByEmail } from "../models/usersModel.js";

const dummyPasswordHash = await bcrypt.hash(
  randomBytes(32).toString("hex"),
  12,
);

export async function loginUser(req, res, next) {
  try {
    const { email, password } = req.loginCredentials;

    const user = await findUserByEmail(email);

    const passwordMatches = await bcrypt.compare(
      password,
      user?.password_hash ?? dummyPasswordHash,
    );

    if (!user || !passwordMatches) {
      return res.status(401).json({
        message: "Correo o contraseña incorrectos",
      });
    }

    const token = jwt.sign({}, jwtConfig.secret, {
      algorithm: jwtConfig.algorithm,
      expiresIn: jwtConfig.expiresIn,
      subject: String(user.id),
      issuer: jwtConfig.issuer,
      audience: jwtConfig.audience,
    });

    return res.status(200).json({
      message: "Sesión iniciada correctamente",
      token,
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role,
      },
    });
  } catch (error) {
    return next(error);
  }
}