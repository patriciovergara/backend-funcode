export function validateProjectId(req, res, next) {
  const id = Number(req.params.id);

  if (!Number.isSafeInteger(id) || id <= 0) {
    return res.status(400).json({
      message: "El identificador del proyecto no es válido.",
    });
  }

  req.projectId = id;
  return next();
}
