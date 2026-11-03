import jwt from "jsonwebtoken";
import { jwtConfig } from "../config/jwt.js";

const now = Math.floor(Date.now() / 1000);

const token = jwt.sign(
  {
    iat: now - 120,
    exp: now - 60,
  },
  jwtConfig.secret,
  {
    algorithm: jwtConfig.algorithm,
    subject: "1",
    issuer: jwtConfig.issuer,
    audience: jwtConfig.audience,
  },
);

console.log(token);