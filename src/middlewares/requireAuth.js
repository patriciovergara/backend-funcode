import jwt from "jsonwebtoken";
import { jwtConfig } from "../config/jwt.js";

export function requireAuth(req, res, next) {
  const authorization = req.get("Authorization");

  if (!authorization) {
    return res.status(401).json({
      message: "Debes enviar un token de autenticación",
    });
  }

  const parts = authorization.trim().split(/\s+/);

  if (
    parts.length !== 2 ||
    parts[0].toLowerCase() !== "bearer"
  ) {
    return res.status(401).json({
      message: "El encabezado debe usar el formato Bearer <token>",
    });
  }

  const token = parts[1];

  let payload;

  try {
    payload = jwt.verify(token, jwtConfig.secret, {
      algorithms: [jwtConfig.algorithm],
      issuer: jwtConfig.issuer,
      audience: jwtConfig.audience,
    });
  } catch (error) {
    if (error.name === "TokenExpiredError") {
      return res.status(401).json({
        message: "El token ha expirado. Inicia sesión nuevamente",
      });
    }

    if (
      error.name === "JsonWebTokenError" ||
      error.name === "NotBeforeError"
    ) {
      return res.status(401).json({
        message: "El token es inválido",
      });
    }

    return next(error);
  }

  if (
    !payload ||
    typeof payload !== "object" ||
    typeof payload.sub !== "string" ||
    !/^[1-9][0-9]{0,9}$/.test(payload.sub) ||
    !Number.isInteger(payload.exp)
  ) {
    return res.status(401).json({
      message: "El token no contiene una identidad válida",
    });
  }

  const userId = Number(payload.sub);

  if (userId > 2147483647) {
    return res.status(401).json({
      message: "El token no contiene una identidad válida",
    });
  }

  req.auth = {
    userId,
  };

  return next();
}