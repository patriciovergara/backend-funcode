export function validatePostId(req, res, next) {
  const { id } = req.params;

  if (
    typeof id !== "string" ||
    !/^[1-9][0-9]{0,9}$/.test(id)
  ) {
    return res.status(400).json({
      message: "El identificador debe ser un número entero positivo válido",
    });
  }

  const postId = Number(id);

  if (postId > 2147483647) {
    return res.status(400).json({
      message: "El identificador debe ser un número entero positivo válido",
    });
  }

  req.postId = postId;

  return next();
}