function parsePositiveInteger(value) {
  if (
    typeof value !== "string" ||
    !/^[1-9][0-9]{0,9}$/.test(value)
  ) {
    return null;
  }

  const number = Number(value);

  return number <= 2147483647 ? number : null;
}

export function validateCatalogQuery(req, res, next) {
  const { page: rawPage, category: rawCategory, search: rawSearch } = req.query;

  const page = rawPage === undefined
    ? 1
    : parsePositiveInteger(rawPage);

  if (page === null) {
    return res.status(400).json({
      message: "page debe ser un número entero positivo válido",
    });
  }

  const categoryId = rawCategory === undefined
    ? null
    : parsePositiveInteger(rawCategory);

  if (rawCategory !== undefined && categoryId === null) {
    return res.status(400).json({
      message: "category debe ser un número entero positivo válido",
    });
  }

  let search = "";

  if (rawSearch !== undefined) {
    if (
      typeof rawSearch !== "string" ||
      [...rawSearch].length > 150 ||
      rawSearch.includes("\u0000")
    ) {
      return res.status(400).json({
        message: "search debe ser texto de hasta 150 caracteres",
      });
    }

    search = rawSearch.trim();
  }

  const limit = 12;

  req.catalogQuery = {
    page,
    limit,
    offset: (page - 1) * limit,
    categoryId,
    search,
  };

  return next();
}