import express from "express";
import cors from "cors";
import usersRoutes from "./routes/usersRoutes.js";
import authRoutes from "./routes/authRoutes.js";
import postsRoutes from "./routes/postsRoutes.js";

const app = express();

const frontendOrigin = process.env.FRONTEND_ORIGIN;

if (!frontendOrigin) {
  throw new Error("Falta configurar FRONTEND_ORIGIN.");
}

app.disable("x-powered-by");

app.use(
  cors({
    origin: frontendOrigin,
    methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
    allowedHeaders: ["Content-Type", "Authorization"],
  }),
);

app.use(express.json({ limit: "100kb" }));
app.use("/api/v1/users", usersRoutes);
app.use("/api/v1", authRoutes);
app.use("/api/v1/posts", postsRoutes);

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

  console.error(err);

  return res.status(500).json({
    message: "Error interno del servidor",
  });
});

export default app;