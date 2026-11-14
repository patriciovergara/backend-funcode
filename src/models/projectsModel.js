import pool from "../config/db.js";

function mapProject(row) {
  return {
    id: Number(row.id),
    title: row.title,
    description: row.description,
    project_url: row.project_url,
    image_url: row.image_url,
    technologies: row.technologies,
    featured: row.featured,
    is_published: row.is_published,
    display_order: row.display_order,
    created_at: row.created_at,
    updated_at: row.updated_at,
  };
}

const projectColumns = `
  id,
  title,
  description,
  project_url,
  image_url,
  technologies,
  featured,
  is_published,
  display_order,
  created_at,
  updated_at
`;

export async function listProjects({ includeUnpublished = false } = {}) {
  const result = await pool.query(
    `
      SELECT ${projectColumns}
      FROM projects
      WHERE $1::boolean OR is_published = TRUE
      ORDER BY featured DESC, display_order ASC, created_at DESC, id DESC
    `,
    [includeUnpublished],
  );

  return result.rows.map(mapProject);
}

export async function createProject(project) {
  const result = await pool.query(
    `
      INSERT INTO projects (
        title,
        description,
        project_url,
        image_url,
        technologies,
        featured,
        is_published,
        display_order
      )
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
      RETURNING ${projectColumns}
    `,
    [
      project.title,
      project.description,
      project.project_url,
      project.image_url,
      project.technologies,
      project.featured,
      project.is_published,
      project.display_order,
    ],
  );

  return mapProject(result.rows[0]);
}

export async function updateProject(id, project) {
  const result = await pool.query(
    `
      UPDATE projects
      SET
        title = $1,
        description = $2,
        project_url = $3,
        image_url = $4,
        technologies = $5,
        featured = $6,
        is_published = $7,
        display_order = $8,
        updated_at = NOW()
      WHERE id = $9
      RETURNING ${projectColumns}
    `,
    [
      project.title,
      project.description,
      project.project_url,
      project.image_url,
      project.technologies,
      project.featured,
      project.is_published,
      project.display_order,
      id,
    ],
  );

  return result.rows[0] ? mapProject(result.rows[0]) : null;
}

export async function deleteProject(id) {
  const result = await pool.query(
    "DELETE FROM projects WHERE id = $1 RETURNING id",
    [id],
  );

  return result.rowCount > 0;
}
