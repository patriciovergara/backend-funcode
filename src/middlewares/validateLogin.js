import bcrypt from "bcryptjs";

export function validateLogin(req, res, next) {
  const body = req.body;

  if (!body || typeof body !== "object" || Array.isArray(body)) {
    return res.status(400).json({
      message: "Debes enviar un objeto JSON con email y password",
    });
  }

  const { email, password } = body;

  if (
    typeof email !== "string" ||
    typeof password !== "string" ||
    email.trim().length === 0 ||
    password.length === 0
  ) {
    return res.status(400).json({
      message: "Correo y contraseña son obligatorios y deben ser texto",
    });
  }

  const normalizedEmail = email.trim().toLowerCase();

  if (
    [...normalizedEmail].length > 254 ||
    normalizedEmail.includes("\u0000") ||
    bcrypt.truncates(password)
  ) {
    return res.status(401).json({
      message: "Correo o contraseña incorrectos",
    });
  }

  req.loginCredentials = {
    email: normalizedEmail,
    password,
  };

  next();
}