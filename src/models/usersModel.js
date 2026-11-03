import pool from "../config/db.js";

export async function createUser({ name, email, passwordHash }) {
  const query = `
    INSERT INTO users (name, email, password_hash)
    VALUES ($1, $2, $3)
    RETURNING id, name, email, created_at
  `;

  const values = [name, email, passwordHash];

  const result = await pool.query(query, values);

  return result.rows[0];
}
export async function findUserByEmail(email) {
  const query = `
    SELECT id, name, email, password_hash
    FROM users
    WHERE email = $1
  `;

  const result = await pool.query(query, [email]);

  return result.rows[0] ?? null;
}
export async function findUserById(id) {
  const query = `
    SELECT id, name, email, created_at
    FROM users
    WHERE id = $1
  `;

  const result = await pool.query(query, [id]);

  return result.rows[0] ?? null;
}