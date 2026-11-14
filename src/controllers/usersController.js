import bcrypt from "bcryptjs";
import { createHmac, randomInt, randomUUID } from "node:crypto";
import pool from "../config/db.js";
import { jwtConfig } from "../config/jwt.js";
import { sendVerificationEmail } from "../config/mailer.js";
import {
  findUserByEmail,
  findUserById,
} from "../models/usersModel.js";

function hashCode(id, code) {
  return createHmac("sha256", jwtConfig.secret)
    .update(`email-verification:${id}:${code}`)
    .digest("hex");
}

export async function registerUser(req, res, next) {
  try {
    const { name, email, password } = req.registration;

    if (await findUserByEmail(email)) {
      return res.status(409).json({ message: "El correo ya está registrado" });
    }

    const passwordHash = await bcrypt.hash(password, 12);
    const id = randomUUID();
    const code = String(randomInt(0, 1000000)).padStart(6, "0");

    await pool.query("DELETE FROM pending_registrations WHERE expires_at < NOW()");
    await pool.query(
      `INSERT INTO pending_registrations
        (id, name, email, password_hash, code_hash, expires_at)
       VALUES ($1, $2, $3, $4, $5, NOW() + INTERVAL '10 minutes')`,
      [id, name, email, passwordHash, hashCode(id, code)],
    );

    try {
      await sendVerificationEmail({ email, code });
    } catch (error) {
      await pool.query("DELETE FROM pending_registrations WHERE id = $1", [id]);
      console.error("No se pudo enviar el código de verificación:", error.message);
      return res.status(503).json({
        message: "No pudimos enviar el código. Inténtalo más tarde.",
      });
    }

    return res.status(202).json({
      message: "Enviamos un código de verificación a tu correo",
      verificationId: id,
    });
  } catch (error) {
    return next(error);
  }
}

export async function verifyRegistration(req, res, next) {
  const { verificationId, code } = req.body ?? {};
  if (
    typeof verificationId !== "string" ||
    !/^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(verificationId) ||
    typeof code !== "string" ||
    !/^\d{6}$/.test(code)
  ) {
    return res.status(400).json({ message: "Ingresa un código de 6 dígitos válido" });
  }

  let client;
  try {
    client = await pool.connect();
    await client.query("BEGIN");
    const result = await client.query(
      `SELECT *, expires_at > NOW() AS valid_time
       FROM pending_registrations WHERE id = $1 FOR UPDATE`,
      [verificationId],
    );
    const pending = result.rows[0];
    if (!pending || !pending.valid_time || pending.attempts >= 5) {
      await client.query("ROLLBACK");
      return res.status(400).json({
        message: "El código expiró o ya no es válido. Inicia el registro nuevamente.",
      });
    }

    if (pending.code_hash !== hashCode(verificationId, code)) {
      await client.query(
        "UPDATE pending_registrations SET attempts = attempts + 1 WHERE id = $1",
        [verificationId],
      );
      await client.query("COMMIT");
      return res.status(400).json({
        message: "Código incorrecto. Si agotas los intentos, inicia el registro nuevamente.",
      });
    }

    await client.query(
      "INSERT INTO users (name, email, password_hash) VALUES ($1, $2, $3)",
      [pending.name, pending.email, pending.password_hash],
    );
    await client.query("DELETE FROM pending_registrations WHERE id = $1", [verificationId]);
    await client.query("COMMIT");
    return res.status(201).json({ message: "Correo verificado y cuenta creada correctamente" });
  } catch (error) {
    if (client) await client.query("ROLLBACK");
    if (error.code === "23505" && error.constraint === "users_email_key") {
      return res.status(409).json({ message: "El correo ya está registrado" });
    }
    return next(error);
  } finally {
    client?.release();
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