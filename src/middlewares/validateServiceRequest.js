const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

function validateServiceRequest(req, res, next) {
  const errors = [];
  const body = req.body ?? {};

  const postId = Number(body.post_id);

  if (!Number.isSafeInteger(postId) || postId <= 0) {
    errors.push("Debes seleccionar un servicio válido.");
  }

  const fullName = typeof body.full_name === "string"
    ? body.full_name.trim()
    : "";

  if (fullName.length < 2 || fullName.length > 120) {
    errors.push("El nombre debe tener entre 2 y 120 caracteres.");
  }

  const email = typeof body.email === "string"
    ? body.email.trim().toLowerCase()
    : "";

  if (!EMAIL_PATTERN.test(email) || email.length > 180) {
    errors.push("Ingresa un correo electrónico válido.");
  }

  let phone = null;

  if (body.phone !== undefined && body.phone !== null && body.phone !== "") {
    phone = String(body.phone).trim();

    if (phone.length < 7 || phone.length > 30) {
      errors.push("El teléfono debe tener entre 7 y 30 caracteres.");
    }
  }

  const message = typeof body.message === "string"
    ? body.message.trim()
    : "";

  if (message.length < 10 || message.length > 2000) {
    errors.push("El mensaje debe tener entre 10 y 2000 caracteres.");
  }

  if (errors.length > 0) {
    return res.status(400).json({
      error: "Datos inválidos",
      details: errors,
    });
  }

  req.validatedServiceRequest = {
    post_id: postId,
    full_name: fullName,
    email,
    phone,
    message,
  };

  next();
}

export default validateServiceRequest;