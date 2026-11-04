export function validatePost(req, res, next) {
  const body = req.body;

  if (!body || typeof body !== "object" || Array.isArray(body)) {
    return res.status(400).json({
      message: "Debes enviar los datos de la publicación en un objeto JSON",
    });
  }

  if (Object.hasOwn(body, "user_id")) {
    return res.status(400).json({
      message: "El propietario se obtiene del token. No envíes user_id",
    });
  }

  const {
    title,
    description,
    price,
    price_type = "fixed",
    image_url,
    category_id,
  } = body;

  if (
    typeof title !== "string" ||
    typeof description !== "string" ||
    typeof image_url !== "string"
  ) {
    return res.status(400).json({
      message: "Título, descripción e imagen son obligatorios y deben ser texto",
    });
  }

  const normalizedTitle = title.trim();
  const normalizedDescription = description.trim();
  const normalizedImageUrl = image_url.trim();

  if (
    normalizedTitle.length === 0 ||
    [...normalizedTitle].length > 150 ||
    normalizedTitle.includes("\u0000")
  ) {
    return res.status(400).json({
      message: "El título debe contener entre 1 y 150 caracteres válidos",
    });
  }

  if (
    normalizedDescription.length === 0 ||
    normalizedDescription.includes("\u0000")
  ) {
    return res.status(400).json({
      message: "La descripción es obligatoria y debe contener texto válido",
    });
  }

  if (!["fixed", "from", "quote"].includes(price_type)) {
    return res.status(400).json({
      message: "price_type debe ser fixed, from o quote",
    });
  }

  if (price_type === "quote") {
    if (price !== null) {
      return res.status(400).json({
        message: "Los servicios a cotizar deben enviar price como null",
      });
    }
  } else if (
    typeof price !== "number" ||
    !Number.isSafeInteger(price) ||
    price <= 0 ||
    price > 999999999999
  ) {
    return res.status(400).json({
      message: "El precio debe ser un entero positivo de hasta 12 dígitos",
    });
  }

  if (
    typeof category_id !== "number" ||
    !Number.isInteger(category_id) ||
    category_id <= 0 ||
    category_id > 2147483647
  ) {
    return res.status(400).json({
      message: "category_id debe ser un número entero positivo válido",
    });
  }

  try {
    const imageUrl = new URL(normalizedImageUrl);

    if (
      !["http:", "https:"].includes(imageUrl.protocol) ||
      imageUrl.username ||
      imageUrl.password ||
      normalizedImageUrl.includes("\u0000")
    ) {
      throw new Error("URL no permitida");
    }
  } catch {
    return res.status(400).json({
      message: "La imagen debe ser una URL válida con protocolo HTTP o HTTPS",
    });
  }

  req.postInput = {
    title: normalizedTitle,
    description: normalizedDescription,
    price,
    price_type,
    image_url: normalizedImageUrl,
    category_id,
  };

  return next();
}