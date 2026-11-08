import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import { randomBytes, randomUUID } from "node:crypto";
import { jwtConfig } from "../config/jwt.js";
import { clearFailedLoginState, recordFailedLogin, revokeToken } from "../config/security.js";
import { findUserByEmail } from "../models/usersModel.js";

const dummyPasswordHash = await bcrypt.hash(
  randomBytes(32).toString("hex"),
  12,
);

function setAuthCookie(res, token) {
  const isProduction = process.env.NODE_ENV === "production";

  res.cookie("auth_token", token, {
    httpOnly: true,
    secure: isProduction,
    sameSite: "lax",
    path: "/",
    maxAge: 60 * 60 * 1000,
  });
}

function extractToken(req) {
  const authorization = req.get("Authorization");

  if (authorization) {
    const parts = authorization.trim().split(/\s+/);

    if (parts.length === 2 && parts[0].toLowerCase() === "bearer") {
      return parts[1];
    }

    return null;
  }

  const cookiesHeader = req.get("Cookie") ?? "";
  const cookies = Object.fromEntries(
    cookiesHeader
      .split(";")
      .map((segment) => segment.trim())
      .filter(Boolean)
      .map((segment) => {
        const equalsIndex = segment.indexOf("=");

        if (equalsIndex === -1) {
          return [segment, ""];
        }

        const key = segment.slice(0, equalsIndex);
        const value = segment.slice(equalsIndex + 1);

        return [key, decodeURIComponent(value)];
      }),
  );

  return cookies.auth_token ?? null;
}

export async function loginUser(req, res, next) {
  try {
    const { email, password } = req.loginCredentials;
    const clientIp = req.ip ?? req.headers["x-forwarded-for"] ?? "unknown";

    const user = await findUserByEmail(email);

    const passwordMatches = await bcrypt.compare(
      password,
      user?.password_hash ?? dummyPasswordHash,
    );

    if (!user || !passwordMatches) {
      recordFailedLogin(email, clientIp);
      return res.status(401).json({
        message: "Correo o contraseña incorrectos",
      });
    }

    clearFailedLoginState(email, clientIp);

    const token = jwt.sign({ jti: randomUUID() }, jwtConfig.secret, {
      algorithm: jwtConfig.algorithm,
      expiresIn: jwtConfig.expiresIn,
      subject: String(user.id),
      issuer: jwtConfig.issuer,
      audience: jwtConfig.audience,
    });

    setAuthCookie(res, token);

    return res.status(200).json({
      message: "Sesión iniciada correctamente",
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

export async function logoutUser(req, res) {
  const isProduction = process.env.NODE_ENV === "production";
  const token = extractToken(req);

  if (token) {
    await revokeToken(token);
  }

  res.clearCookie("auth_token", {
    httpOnly: true,
    secure: isProduction,
    sameSite: "lax",
    path: "/",
  });

  return res.status(200).json({
    message: "Sesión cerrada correctamente",
  });
}
