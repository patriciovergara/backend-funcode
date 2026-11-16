import { createHmac, randomInt, randomUUID, timingSafeEqual } from "node:crypto";
import pool from "../config/db.js";
import { jwtConfig } from "../config/jwt.js";
import { sendContactEmail, sendVerificationEmail } from "../config/mailer.js";
import { findUserById } from "../models/usersModel.js";

function hashCode(id, code) {
  return createHmac("sha256", jwtConfig.secret)
    .update(`contact-verification:${id}:${code}`)
    .digest("hex");
}

export async function submitContactForm(req, res) {
  try {
    const contact = req.validatedContact;

    if (req.auth) {
      const user = await findUserById(req.auth.userId);
      if (!user) {
        return res.status(401).json({ message: "La sesión no corresponde a un usuario disponible." });
      }
      if (contact.email !== user.email.trim().toLowerCase()) {
        return res.status(400).json({ message: "Usa el correo asociado a tu cuenta para enviar el mensaje." });
      }
      if (user.email_verified_at) {
        await sendContactEmail(contact);
        return res.status(200).json({ message: "Tu mensaje ha sido enviado correctamente." });
      }
    }

    const id = randomUUID();
    const code = String(randomInt(0, 1000000)).padStart(6, "0");
    await pool.query("DELETE FROM pending_contact_verifications WHERE expires_at < NOW()");
    await pool.query(
      `INSERT INTO pending_contact_verifications
        (id, name, email, phone, message, code_hash, expires_at)
       VALUES ($1, $2, $3, $4, $5, $6, NOW() + INTERVAL '10 minutes')`,
      [id, contact.name, contact.email, contact.phone, contact.message, hashCode(id, code)],
    );

    try {
      await sendVerificationEmail({ email: contact.email, code, purpose: "contact" });
    } catch (error) {
      await pool.query("DELETE FROM pending_contact_verifications WHERE id = $1", [id]);
      throw error;
    }

    return res.status(202).json({
      message: "Enviamos un código de verificación a tu correo.",
      verificationId: id,
    });
  } catch (error) {
    console.error("Error al enviar el formulario de contacto:", error);

    if (error.message === "SMTP no configurado") {
      return res.status(503).json({
        message:
          "El correo corporativo aún no está configurado. Puedes escribir directamente a contacto@funcode.cl.",
      });
    }

    return res.status(500).json({
      message: "No pudimos enviar tu mensaje. Inténtalo nuevamente.",
    });
  }
}

export async function verifyContactForm(req, res, next) {
  const { verificationId, code } = req.body ?? {};
  if (
    typeof verificationId !== "string" ||
    !/^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(verificationId) ||
    typeof code !== "string" ||
    !/^\d{6}$/.test(code)
  ) {
    return res.status(400).json({ message: "Ingresa un código de 6 dígitos válido." });
  }

  let client;
  try {
    client = await pool.connect();
    await client.query("BEGIN");
    const result = await client.query(
      `SELECT *, expires_at > NOW() AS valid_time
       FROM pending_contact_verifications WHERE id = $1 FOR UPDATE`,
      [verificationId],
    );
    const pending = result.rows[0];
    if (!pending || !pending.valid_time || pending.attempts >= 5) {
      await client.query("ROLLBACK");
      return res.status(400).json({ message: "El código expiró o ya no es válido. Inicia el envío nuevamente." });
    }

    const expected = Buffer.from(pending.code_hash, "hex");
    const supplied = Buffer.from(hashCode(verificationId, code), "hex");
    if (expected.length !== supplied.length || !timingSafeEqual(expected, supplied)) {
      await client.query(
        "UPDATE pending_contact_verifications SET attempts = attempts + 1 WHERE id = $1",
        [verificationId],
      );
      await client.query("COMMIT");
      return res.status(400).json({ message: "Código incorrecto. Si agotas los intentos, inicia el envío nuevamente." });
    }

    await sendContactEmail(pending);
    if (req.auth) {
      await client.query(
        `UPDATE users SET email_verified_at = COALESCE(email_verified_at, NOW())
         WHERE id = $1 AND LOWER(email) = $2`,
        [req.auth.userId, pending.email],
      );
    }
    await client.query("DELETE FROM pending_contact_verifications WHERE id = $1", [verificationId]);
    await client.query("COMMIT");
    return res.status(200).json({ message: "Tu mensaje ha sido enviado correctamente." });
  } catch (error) {
    if (client) await client.query("ROLLBACK");
    console.error("No se pudo verificar o enviar el mensaje de contacto:", error.message);
    return next(error);
  } finally {
    client?.release();
  }
}
