const VERIFY_URL = "https://www.google.com/recaptcha/api/siteverify";
const MINIMUM_SCORE = 0.5;

export function createRecaptchaVerifier({
  secret,
  hostnames,
  enabled = true,
  fetchImpl = fetch,
}) {
  if (enabled && (typeof secret !== "string" || !secret.trim())) {
    throw new Error("Falta configurar RECAPTCHA_SECRET.");
  }

  return (action) => async (req, res, next) => {
    if (!enabled) return next();

    const token = req.body?.recaptchaToken;
    if (typeof token !== "string" || !token.trim() || token.length > 4096) {
      return res.status(400).json({ message: "No se pudo verificar la seguridad del formulario. Inténtalo nuevamente." });
    }

    let result;
    try {
      const response = await fetchImpl(VERIFY_URL, {
        method: "POST",
        headers: { "Content-Type": "application/x-www-form-urlencoded" },
        body: new URLSearchParams({ secret, response: token }),
        signal: AbortSignal.timeout(10000),
      });
      if (!response.ok) throw new Error(`HTTP ${response.status}`);
      result = await response.json();
    } catch (error) {
      console.error("No se pudo contactar al servicio de verificación:", error.message);
      return res.status(503).json({ message: "La verificación de seguridad no está disponible. Inténtalo más tarde." });
    }

    if (
      !result ||
      typeof result !== "object" ||
      result.success !== true ||
      result.action !== action ||
      !hostnames.includes(result.hostname) ||
      typeof result.score !== "number" ||
      !Number.isFinite(result.score) ||
      result.score < MINIMUM_SCORE ||
      result.score > 1
    ) {
      return res.status(403).json({ message: "No se pudo verificar la seguridad del formulario. Inténtalo nuevamente." });
    }

    return next();
  };
}

const isProduction = process.env.NODE_ENV === "production";
const secret = process.env.RECAPTCHA_SECRET?.trim();
const hostnames = (process.env.FRONTEND_ORIGIN || "")
  .split(",")
  .filter(Boolean)
  .map((origin) => new URL(origin.trim()).hostname);

if (!isProduction && !secret) {
  console.warn("reCAPTCHA está desactivado en desarrollo: RECAPTCHA_SECRET no está configurado.");
}

export const verifyRecaptcha = createRecaptchaVerifier({
  secret,
  hostnames,
  enabled: isProduction || Boolean(secret),
});
