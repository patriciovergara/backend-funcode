const secret = process.env.JWT_SECRET;

if (
  typeof secret !== "string" ||
  !/^[a-f0-9]{64}$/i.test(secret)
) {
  throw new Error(
    "JWT_SECRET debe contener los 64 caracteres hexadecimales generados.",
  );
}

export const jwtConfig = Object.freeze({
  secret,
  algorithm: "HS256",
  expiresIn: "1h",
  issuer: "funcode-api",
  audience: "funcode-frontend",
});