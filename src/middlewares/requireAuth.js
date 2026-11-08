import jwt from "jsonwebtoken";
import { jwtConfig } from "../config/jwt.js";
import { isTokenRevoked } from "../config/security.js";

function parseCookies(cookieHeader) {
  if (!cookieHeader) {
    return {};
  }

  return cookieHeader.split(";").reduce((accumulator, segment) => {
    const [name, ...rest] = segment.trim().split("=");

    if (!name) {
      return accumulator;
    }

    accumulator[name] = decodeURIComponent(rest.join("="));
    return accumulator;
  }, {});
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

  const cookies = parseCookies(req.get("Cookie"));
  return cookies.auth_token ?? null;
}

export async function requireAuth(req, res, next) {
  const token = extractToken(req);

  if (!token) {
    return res.status(401).json({
      message: "Debes enviar un token de autenticación",
    });
  }

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
    typeof payload.jti !== "string" ||
    !/^[1-9][0-9]{0,9}$/.test(payload.sub) ||
    !Number.isInteger(payload.exp)
  ) {
    return res.status(401).json({
      message: "El token no contiene una identidad válida",
    });
  }

  if (await isTokenRevoked(payload)) {
    return res.status(401).json({
      message: "El token ha sido revocado. Inicia sesión nuevamente",
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
