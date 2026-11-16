import { requireAuth } from "./requireAuth.js";

export function optionalAuth(req, res, next) {
  const hasCookie = (req.get("Cookie") ?? "")
    .split(";")
    .some((part) => part.trim().startsWith("auth_token="));
  if (!req.get("Authorization") && !hasCookie) return next();
  return requireAuth(req, res, next);
}
