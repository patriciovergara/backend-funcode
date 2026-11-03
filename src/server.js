import app from "./app.js";

const port = Number(process.env.PORT);

if (!Number.isInteger(port) || port < 1 || port > 65535) {
  throw new Error("PORT debe ser un número entero entre 1 y 65535.");
}

const server = app.listen(port, () => {
  console.log(`API de Funcode disponible en http://localhost:${port}`);
});

server.on("error", (error) => {
  console.error("No fue posible iniciar el servidor:", error.message);
  process.exit(1);
});