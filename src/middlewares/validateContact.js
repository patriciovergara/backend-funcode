const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

function validateContact(req, res, next) {
  const errors = [];
  const body = req.body ?? {};

  const name = typeof body.name === "string" ? body.name.trim() : "";

  if (name.length < 2 || name.length > 120) {
    errors.push("El nombre debe tener entre 2 y 120 caracteres.");
  }

  const email = typeof body.email === "string" ? body.email.trim().toLowerCase() : "";

  if (!EMAIL_PATTERN.test(email) || email.length > 180) {
    errors.push("Ingresa un correo electrónico válido.");
  }

  const phone = typeof body.phone === "string" ? body.phone.trim() : "";

  if (phone && (phone.length < 7 || phone.length > 30)) {
    errors.push("El teléfono debe tener entre 7 y 30 caracteres.");
  }

  const message = typeof body.message === "string" ? body.message.trim() : "";

  if (message.length < 10 || message.length > 2000) {
    errors.push("El mensaje debe tener entre 10 y 2000 caracteres.");
  }

  if (errors.length > 0) {
    return res.status(400).json({
      message: "Datos inválidos",
      details: errors,
    });
  }

  req.validatedContact = {
    name,
    email,
    phone: phone || null,
    message,
  };

  return next();
}

export default validateContact;
