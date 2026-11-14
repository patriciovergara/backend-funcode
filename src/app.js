import express from "express";
import cors from "cors";
import helmet from "helmet";
import rateLimit from "express-rate-limit";
import usersRoutes from "./routes/usersRoutes.js";
import authRoutes from "./routes/authRoutes.js";
import postsRoutes from "./routes/postsRoutes.js";
import serviceRequestsRoutes from "./routes/serviceRequestsRoutes.js";
import contactRoutes from "./routes/contactRoutes.js";
import projectsRoutes from "./routes/projectsRoutes.js";

const app = express();

const frontendOrigin = process.env.FRONTEND_ORIGIN;

if (!frontendOrigin) {
  throw new Error("Falta configurar FRONTEND_ORIGIN.");
}

const allowedOrigins = frontendOrigin
  .split(",")
  .map((origin) => origin.trim())
  .filter(Boolean);

app.set("trust proxy", 1);
app.disable("x-powered-by");

const apiLimiter = rateLimit({
  windowMs: 60 * 1000,
  max: 120,
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    message: "Has enviado demasiadas peticiones. Intenta nuevamente más tarde.",
  },
});

const loginLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 10,
  standardHeaders: true,
  legacyHeaders: false,
  skipSuccessfulRequests: true,
  message: {
    message: "Demasiados intentos de inicio de sesión. Inténtalo más tarde.",
  },
});

const serviceRequestLimiter = rateLimit({
  windowMs: 60 * 1000,
  max: 20,
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    message: "Se han enviado demasiadas solicitudes. Inténtalo más tarde.",
  },
});

const registrationLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 10,
  standardHeaders: true,
  legacyHeaders: false,
  message: { message: "Demasiados intentos de registro. Inténtalo más tarde." },
});

const verificationLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 30,
  standardHeaders: true,
  legacyHeaders: false,
  message: { message: "Demasiados intentos de verificación. Inténtalo más tarde." },
});

const isProduction = process.env.NODE_ENV === "production";

app.use(
  helmet({
    contentSecurityPolicy: false,
    crossOriginResourcePolicy: false,
    referrerPolicy: { policy: "no-referrer" },
    ...(isProduction
      ? {
          hsts: {
            maxAge: 31536000,
            includeSubDomains: true,
            preload: true,
          },
        }
      : {}),
  }),
);

app.use(
  cors({
    origin(origin, callback) {
      if (!origin) {
        return callback(null, true);
      }

      if (allowedOrigins.includes(origin)) {
        return callback(null, true);
      }

      return callback(new Error("Origen no autorizado por CORS."));
    },
    credentials: true,
    methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
    allowedHeaders: ["Content-Type", "Authorization"],
    optionsSuccessStatus: 204,
  }),
);

app.use(apiLimiter);
app.use("/api/v1/login", loginLimiter);
app.use("/api/v1/service-requests", serviceRequestLimiter);
app.use("/api/v1/users/verify", verificationLimiter);
app.post("/api/v1/users", registrationLimiter);
app.use(express.json({ limit: "100kb" }));
app.use("/api/v1/users", usersRoutes);
app.use("/api/v1", authRoutes);
app.use("/api/v1/posts", postsRoutes);
app.use("/api/v1/service-requests", serviceRequestsRoutes);
app.use("/api/v1/contact", contactRoutes);
app.use("/api/v1/projects", projectsRoutes);

app.get("/api/v1/health", (req, res) => {
  res.status(200).json({
    message: "API de Funcode funcionando",
  });
});

app.use((req, res) => {
  res.status(404).json({
    message: "Ruta no encontrada",
  });
});

app.use((err, req, res, next) => {
  if (res.headersSent) {
    return next(err);
  }

  if (err.type === "entity.parse.failed") {
    return res.status(400).json({
      message: "El cuerpo de la solicitud contiene JSON inválido",
    });
  }

  if (err.type === "entity.too.large") {
    return res.status(413).json({
      message: "El cuerpo de la solicitud supera el tamaño permitido",
    });
  }

  if (err.status === 429) {
    return res.status(429).json({
      message: "Has enviado demasiadas peticiones. Intenta nuevamente más tarde.",
    });
  }

  if (err.message === "Origen no autorizado por CORS.") {
    return res.status(403).json({
      message: "Origen no autorizado.",
    });
  }

  console.error(err);

  return res.status(500).json({
    message: "Error interno del servidor",
  });
});

export default app;