import pg from "pg";

const { Pool } = pg;

const requiredVariables = [
  "PGHOST",
  "PGPORT",
  "PGDATABASE",
  "PGUSER",
  "PGPASSWORD",
];

for (const variable of requiredVariables) {
  if (!process.env[variable]) {
    throw new Error(`Falta configurar ${variable}.`);
  }
}

const databasePort = Number(process.env.PGPORT);

if (
  !Number.isInteger(databasePort) ||
  databasePort < 1 ||
  databasePort > 65535
) {
  throw new Error("PGPORT debe ser un entero entre 1 y 65535.");
}

const pool = new Pool({
  max: 10,
  connectionTimeoutMillis: 5000,
  idleTimeoutMillis: 30000,
});

pool.on("error", (error) => {
  console.error(
    "Error inesperado en una conexión inactiva de PostgreSQL:",
    error.message,
  );
});

export default pool;