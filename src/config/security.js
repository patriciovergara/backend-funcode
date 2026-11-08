import jwt from "jsonwebtoken";
import pool from "./db.js";

export const revokedTokens = new Set();
export const failedLoginAttempts = new Map();

export function logSecurityEvent(eventType, details = {}) {
  const event = {
    event_type: eventType,
    email: details.email ?? null,
    ip: details.ip ?? null,
    message: details.message ?? "",
    created_at: new Date().toISOString(),
  };

  console.warn(JSON.stringify({ type: "security_event", ...event }));

  pool.query(
    `
      INSERT INTO security_events (event_type, email, ip, message)
      VALUES ($1, $2, $3, $4)
    `,
    [event.event_type, event.email, event.ip, event.message],
  ).catch((error) => {
    console.error("No se pudo registrar el evento de seguridad:", error.message);
  });
}

export async function revokeToken(token) {
  if (!token || typeof token !== "string") {
    return false;
  }

  try {
    const decoded = jwt.decode(token);

    if (!decoded || typeof decoded !== "object" || typeof decoded.jti !== "string") {
      return false;
    }

    revokedTokens.add(decoded.jti);

    const userId = Number(decoded.sub);

    await pool.query(
      `
        INSERT INTO revoked_tokens (jti, user_id, reason)
        VALUES ($1, $2, $3)
        ON CONFLICT (jti) DO NOTHING
      `,
      [decoded.jti, Number.isInteger(userId) && userId > 0 ? userId : null, "logout"],
    );

    logSecurityEvent("token_revoked", {
      message: "Token revocado.",
      email: decoded.email ?? null,
      ip: decoded.ip ?? null,
    });

    return true;
  } catch (error) {
    console.error("No se pudo revocar el token:", error.message);
    return false;
  }
}

export async function isTokenRevoked(payload) {
  if (!payload || typeof payload !== "object" || typeof payload.jti !== "string") {
    return false;
  }

  if (revokedTokens.has(payload.jti)) {
    return true;
  }

  try {
    const result = await pool.query(
      "SELECT 1 FROM revoked_tokens WHERE jti = $1 LIMIT 1",
      [payload.jti],
    );

    return result.rowCount > 0;
  } catch (error) {
    console.error("No se pudo verificar si el token estaba revocado:", error.message);
    return false;
  }
}

export function recordFailedLogin(email, ip) {
  const normalizedEmail = String(email ?? "").trim().toLowerCase();
  const normalizedIp = String(ip ?? "unknown");
  const key = `${normalizedIp}:${normalizedEmail}`;
  const now = Date.now();
  const attempts = (failedLoginAttempts.get(key) ?? []).filter(
    (timestamp) => now - timestamp < 15 * 60 * 1000,
  );

  attempts.push(now);
  failedLoginAttempts.set(key, attempts);

  if (attempts.length >= 5) {
    logSecurityEvent("login_failed_threshold", {
      email: normalizedEmail,
      ip: normalizedIp,
      message: "Se alcanzó el umbral de intentos fallidos de login.",
    });
  }
}

export function clearFailedLoginState(email, ip) {
  const normalizedEmail = String(email ?? "").trim().toLowerCase();
  const normalizedIp = String(ip ?? "unknown");
  const key = `${normalizedIp}:${normalizedEmail}`;
  failedLoginAttempts.delete(key);
}

