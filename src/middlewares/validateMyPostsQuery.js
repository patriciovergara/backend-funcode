export function validateMyPostsQuery(req, res, next) {
  const rawPage = req.query.page ?? "1";

  if (
    typeof rawPage !== "string" ||
    !/^[1-9][0-9]{0,9}$/.test(rawPage)
  ) {
    return res.status(400).json({
      message: "page debe ser un número entero positivo válido",
    });
  }

  const page = Number(rawPage);

  if (page > 2147483647) {
    return res.status(400).json({
      message: "page debe ser un número entero positivo válido",
    });
  }

  req.myPostsQuery = {
    page,
    limit: 12,
  };

  return next();
}