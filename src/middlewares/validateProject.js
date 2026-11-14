function isHttpUrl(value) {
  try {
    const url = new URL(value);
    return (
      ["http:", "https:"].includes(url.protocol) &&
      !url.username &&
      !url.password
    );
  } catch {
    return false;
  }
}

export function validateProject(req, res, next) {
  const body = req.body;

  if (!body || typeof body !== "object" || Array.isArray(body)) {
    return res.status(400).json({
      message: "Debes enviar los datos del proyecto en un objeto JSON.",
    });
  }

  const title = typeof body.title === "string" ? body.title.trim() : "";
  const description =
    typeof body.description === "string" ? body.description.trim() : "";
  const projectUrl =
    typeof body.project_url === "string" ? body.project_url.trim() : "";
  const imageUrl =
    typeof body.image_url === "string" ? body.image_url.trim() : "";
  const technologies = body.technologies ?? [];
  const featured = body.featured ?? false;
  const isPublished = body.is_published ?? true;
  const displayOrder = body.display_order ?? 0;

  if (!title || [...title].length > 150 || title.includes("\u0000")) {
    return res.status(400).json({
      message: "El nombre debe contener entre 1 y 150 caracteres válidos.",
    });
  }

  if (
    !description ||
    [...description].length > 3000 ||
    description.includes("\u0000")
  ) {
    return res.status(400).json({
      message: "La descripción debe contener entre 1 y 3000 caracteres.",
    });
  }

  if (projectUrl.length > 500 || !isHttpUrl(projectUrl)) {
    return res.status(400).json({
      message: "Ingresa una URL HTTP o HTTPS válida para el proyecto.",
    });
  }

  if (imageUrl && (imageUrl.length > 1000 || !isHttpUrl(imageUrl))) {
    return res.status(400).json({
      message: "La imagen debe ser una URL HTTP o HTTPS válida.",
    });
  }

  if (
    !Array.isArray(technologies) ||
    technologies.length > 12 ||
    technologies.some(
      (technology) =>
        typeof technology !== "string" ||
        technology.trim().length === 0 ||
        technology.trim().length > 40,
    )
  ) {
    return res.status(400).json({
      message: "Las tecnologías deben ser una lista de hasta 12 etiquetas válidas.",
    });
  }

  if (typeof featured !== "boolean" || typeof isPublished !== "boolean") {
    return res.status(400).json({
      message: "Los campos destacado y publicado deben ser booleanos.",
    });
  }

  if (
    !Number.isSafeInteger(displayOrder) ||
    displayOrder < 0 ||
    displayOrder > 100000
  ) {
    return res.status(400).json({
      message: "El orden debe ser un entero entre 0 y 100000.",
    });
  }

  req.validatedProject = {
    title,
    description,
    project_url: projectUrl,
    image_url: imageUrl || null,
    technologies: [...new Set(technologies.map((item) => item.trim()))],
    featured,
    is_published: isPublished,
    display_order: displayOrder,
  };

  return next();
}
