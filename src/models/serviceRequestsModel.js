import pool from "../config/db.js";

export async function postExists(postId) {
  const result = await pool.query(
    "SELECT 1 FROM posts WHERE id = $1 LIMIT 1",
    [postId]
  );

  return result.rowCount > 0;
}

export async function createServiceRequest({
  userId,
  postId,
  fullName,
  email,
  phone,
  message,
}) {
  const result = await pool.query(
    `INSERT INTO service_requests
      (user_id, post_id, full_name, email, phone, message, status)
     VALUES ($1, $2, $3, $4, $5, $6, 'new')
     RETURNING
       id,
       user_id,
       post_id,
       full_name,
       email,
       phone,
       message,
       status,
       created_at`,
    [userId, postId, fullName, email, phone, message]
  );

  return result.rows[0];
}