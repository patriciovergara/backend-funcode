import pool from "../config/db.js";

try {
  const connectionResult = await pool.query(`
    SELECT
      current_database() AS database,
      current_user AS username,
      NOW() AS server_time
  `);

  console.log("Conexión con PostgreSQL correcta:");
  console.table(connectionResult.rows);

  const categoriesResult = await pool.query(`
    SELECT id, name
    FROM categories
    ORDER BY id
  `);

  console.log("Categorías registradas:");
  console.table(categoriesResult.rows);
} catch (error) {
  console.error("No fue posible comprobar la base de datos:", error.message);
  process.exitCode = 1;
} finally {
  await pool.end();
}