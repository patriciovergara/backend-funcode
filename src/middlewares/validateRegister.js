import bcrypt from "bcryptjs";

export function validateRegister(req, res, next) {
  const body = req.body;

  if (!body || typeof body !== "object" || Array.isArray(body)) {
    return res.status(400).json({
      message: "Debes enviar un objeto JSON con name, email y password",
    });
  }

  const { name, email, password } = body;

  if (
    typeof name !== "string" ||
    typeof email !== "string" ||
    typeof password !== "string"
  ) {
    return res.status(400).json({
      message: "Nombre, correo y contraseña son obligatorios y deben ser texto",
    });
  }

  const normalizedName = name.trim();
  const normalizedEmail = email.trim().toLowerCase();

  if (
    normalizedName.length === 0 ||
    [...normalizedName].length > 100 ||
    normalizedName.includes("\u0000")
  ) {
    return res.status(400).json({
      message: "El nombre debe contener entre 1 y 100 caracteres válidos",
    });
  }

  const emailParts = normalizedEmail.split("@");
const localPart = emailParts[0];
const domain = emailParts[1] ?? "";
const lastDotIndex = domain.lastIndexOf(".");

const invalidEmail =
  [...normalizedEmail].length > 254 ||
  normalizedEmail.includes("\u0000") ||
  /\s/.test(normalizedEmail) ||
  emailParts.length !== 2 ||
  localPart.length === 0 ||
  lastDotIndex <= 0 ||
  lastDotIndex === domain.length - 1;

if (invalidEmail) {
  return res.status(400).json({
    message: "Debes ingresar un correo válido de hasta 254 caracteres",
  });
}

  if ([...password].length < 8 || password.trim().length === 0) {
    return res.status(400).json({
      message: "La contraseña debe tener al menos 8 caracteres",
    });
  }

  if (bcrypt.truncates(password)) {
    return res.status(400).json({
      message: "La contraseña no debe superar los 72 bytes en UTF-8",
    });
  }

  req.registration = {
    name: normalizedName,
    email: normalizedEmail,
    password,
  };

  next();
}