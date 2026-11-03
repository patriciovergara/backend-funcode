import pool from "../config/db.js";

export async function listPosts({
  page,
  limit,
  offset,
  categoryId,
  search,
}) {
  const filterValues = [categoryId, search];

  const countQuery = `
    SELECT COUNT(*) AS total
    FROM posts p
    WHERE
      ($1::integer IS NULL OR p.category_id = $1::integer)
      AND (
        $2::text = ''
        OR STRPOS(LOWER(p.title), LOWER($2::text)) > 0
      )
  `;

  const countResult = await pool.query(countQuery, filterValues);

  const postsQuery = `
    SELECT
      p.id,
      p.title,
      p.description,
      p.price,
      p.image_url,
      p.created_at,
      c.id AS category_id,
      c.name AS category_name,
      u.id AS user_id,
      u.name AS user_name
    FROM posts p
    JOIN categories c ON c.id = p.category_id
    JOIN users u ON u.id = p.user_id
    WHERE
      ($1::integer IS NULL OR p.category_id = $1::integer)
      AND (
        $2::text = ''
        OR STRPOS(LOWER(p.title), LOWER($2::text)) > 0
      )
    ORDER BY p.created_at DESC, p.id DESC
    LIMIT $3
    OFFSET $4
  `;

  const postsResult = await pool.query(postsQuery, [
    ...filterValues,
    limit,
    offset,
  ]);

  const posts = postsResult.rows.map((row) => ({
    id: row.id,
    title: row.title,
    description: row.description,
    price: Number(row.price),
    image_url: row.image_url,
    category: {
      id: row.category_id,
      name: row.category_name,
    },
    user: {
      id: row.user_id,
      name: row.user_name,
    },
    created_at: row.created_at,
  }));

  return {
    posts,
    pagination: {
      page,
      limit,
      total: Number(countResult.rows[0].total),
    },
  };
}
export async function createPost({
  userId,
  title,
  description,
  price,
  image_url,
  category_id,
}) {
  const query = `
    WITH inserted_post AS (
      INSERT INTO posts (
        user_id,
        category_id,
        title,
        description,
        price,
        image_url
      )
      VALUES ($1, $2, $3, $4, $5, $6)
      RETURNING *
    )
    SELECT
      p.id,
      p.title,
      p.description,
      p.price,
      p.image_url,
      p.created_at,
      c.id AS category_id,
      c.name AS category_name,
      u.id AS user_id,
      u.name AS user_name
    FROM inserted_post p
    JOIN categories c ON c.id = p.category_id
    JOIN users u ON u.id = p.user_id
  `;

  const values = [
    userId,
    category_id,
    title,
    description,
    price,
    image_url,
  ];

  const result = await pool.query(query, values);
  const row = result.rows[0];

  return {
    id: row.id,
    title: row.title,
    description: row.description,
    price: Number(row.price),
    image_url: row.image_url,
    category: {
      id: row.category_id,
      name: row.category_name,
    },
    user: {
      id: row.user_id,
      name: row.user_name,
    },
    created_at: row.created_at,
  };
}
export async function findPostById(id) {
  const query = `
    SELECT
      p.id,
      p.title,
      p.description,
      p.price,
      p.image_url,
      p.created_at,
      p.updated_at,
      c.id AS category_id,
      c.name AS category_name,
      u.id AS user_id,
      u.name AS user_name
    FROM posts p
    JOIN categories c ON c.id = p.category_id
    JOIN users u ON u.id = p.user_id
    WHERE p.id = $1
  `;

  const result = await pool.query(query, [id]);
  const row = result.rows[0];

  if (!row) {
    return null;
  }

  return {
    id: row.id,
    title: row.title,
    description: row.description,
    price: Number(row.price),
    image_url: row.image_url,
    category: {
      id: row.category_id,
      name: row.category_name,
    },
    user: {
      id: row.user_id,
      name: row.user_name,
    },
    created_at: row.created_at,
    updated_at: row.updated_at,
  };
}
export async function updatePost({
  postId,
  userId,
  title,
  description,
  price,
  imageUrl,
  categoryId,
}) {
  const categoryResult = await pool.query(
    "SELECT id FROM categories WHERE id = $1",
    [categoryId],
  );

  if (categoryResult.rowCount === 0) {
    const error = new Error("La categoría seleccionada no existe");
    error.code = "CATEGORY_NOT_FOUND";
    throw error;
  }

  const query = `
    UPDATE posts
    SET
      title = $1,
      description = $2,
      price = $3,
      image_url = $4,
      category_id = $5,
      updated_at = NOW()
    WHERE id = $6
      AND user_id = $7
    RETURNING id
  `;

  const result = await pool.query(query, [
    title,
    description,
    price,
    imageUrl,
    categoryId,
    postId,
    userId,
  ]);

  if (result.rowCount === 0) {
    return null;
  }

  return findPostById(result.rows[0].id);
}
export async function deletePost({ postId, userId }) {
  const query = `
    DELETE FROM posts
    WHERE id = $1
      AND user_id = $2
    RETURNING id
  `;

  const result = await pool.query(query, [postId, userId]);

  return result.rowCount > 0;
}
export async function listOwnPosts({ userId, page, limit }) {
  const offset = (page - 1) * limit;

  const query = `
    WITH own_posts AS (
      SELECT
        p.id,
        p.title,
        p.description,
        p.price,
        p.image_url,
        p.created_at,
        p.updated_at,
        c.id AS category_id,
        c.name AS category_name,
        u.id AS user_id,
        u.name AS user_name
      FROM posts p
      JOIN categories c ON c.id = p.category_id
      JOIN users u ON u.id = p.user_id
      WHERE p.user_id = $1
    ),
    page_posts AS (
      SELECT *
      FROM own_posts
      ORDER BY created_at DESC, id DESC
      LIMIT $2 OFFSET $3
    )
    SELECT
      (SELECT COUNT(*) FROM own_posts) AS total,
      COALESCE(
        (
          SELECT json_agg(
            json_build_object(
              'id', pp.id,
              'title', pp.title,
              'description', pp.description,
              'price', pp.price,
              'image_url', pp.image_url,
              'category', json_build_object(
                'id', pp.category_id,
                'name', pp.category_name
              ),
              'user', json_build_object(
                'id', pp.user_id,
                'name', pp.user_name
              ),
              'created_at', pp.created_at,
              'updated_at', pp.updated_at
            )
            ORDER BY pp.created_at DESC, pp.id DESC
          )
          FROM page_posts pp
        ),
        '[]'::json
      ) AS posts
  `;

  const result = await pool.query(query, [userId, limit, offset]);
  const row = result.rows[0];

  return {
    posts: row.posts,
    pagination: {
      page,
      limit,
      total: Number(row.total),
    },
  };
}