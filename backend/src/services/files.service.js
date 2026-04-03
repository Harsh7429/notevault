const { query } = require("../config/db");

const fileSelect = `SELECT id, title, description, subject, course, semester, unit_label, page_count, is_featured, price, file_url, storage_path, thumbnail, created_at
     FROM files`;

async function createFileRecord({
  title,
  description,
  subject = "",
  course = "",
  semester = "",
  unitLabel = "",
  pageCount = null,
  isFeatured = false,
  price,
  fileUrl,
  storagePath,
  thumbnail = null
}) {
  const result = await query(
    `INSERT INTO files (title, description, subject, course, semester, unit_label, page_count, is_featured, price, file_url, storage_path, thumbnail)
     VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12)
     RETURNING id, title, description, subject, course, semester, unit_label, page_count, is_featured, price, file_url, storage_path, thumbnail, created_at`,
    [title, description, subject, course, semester, unitLabel, pageCount, isFeatured, price, fileUrl, storagePath, thumbnail]
  );

  return result.rows[0];
}

async function listFiles({ search = "", subject = "", page = 1, limit = 12 } = {}) {
  const filters = [];
  const values = [];

  if (search) {
    values.push(`%${search}%`);
    const searchRef = `$${values.length}`;
    filters.push(`(
      title ILIKE ${searchRef}
      OR description ILIKE ${searchRef}
      OR subject ILIKE ${searchRef}
      OR course ILIKE ${searchRef}
      OR semester ILIKE ${searchRef}
      OR unit_label ILIKE ${searchRef}
    )`);
  }

  if (subject) {
    values.push(subject);
    filters.push(`subject = $${values.length}`);
  }

  const whereClause = filters.length ? `WHERE ${filters.join(" AND ")}` : "";
  const safePage = Math.max(Number(page) || 1, 1);
  const safeLimit = Math.min(Math.max(Number(limit) || 12, 1), 50);
  const offset = (safePage - 1) * safeLimit;

  values.push(safeLimit);
  values.push(offset);

  const itemsPromise = query(
    `${fileSelect}
     ${whereClause}
     ORDER BY is_featured DESC, created_at DESC
     LIMIT $${values.length - 1} OFFSET $${values.length}`,
    values
  );

  const countValues = values.slice(0, values.length - 2);
  const countPromise = query(
    `SELECT COUNT(*)::int AS total
     FROM files
     ${whereClause}`,
    countValues
  );

  const [itemsResult, countResult] = await Promise.all([itemsPromise, countPromise]);
  const total = countResult.rows[0]?.total || 0;

  return {
    items: itemsResult.rows,
    total,
    page: safePage,
    limit: safeLimit,
    totalPages: Math.max(Math.ceil(total / safeLimit), 1)
  };
}

async function getAllFiles() {
  const result = await query(
    `${fileSelect}
     ORDER BY is_featured DESC, created_at DESC`
  );

  return result.rows;
}

async function getFileById(id) {
  const result = await query(
    `${fileSelect}
     WHERE id = $1`,
    [id]
  );

  return result.rows[0] || null;
}

async function updateFileRecord(id, { title, description, subject, course, semester, unitLabel, pageCount, isFeatured, price, thumbnail }) {
  const result = await query(
    `UPDATE files
     SET title = $2,
         description = $3,
         subject = $4,
         course = $5,
         semester = $6,
         unit_label = $7,
         page_count = $8,
         is_featured = $9,
         price = $10,
         thumbnail = $11
     WHERE id = $1
     RETURNING id, title, description, subject, course, semester, unit_label, page_count, is_featured, price, file_url, storage_path, thumbnail, created_at`,
    [id, title, description, subject, course, semester, unitLabel, pageCount, isFeatured, price, thumbnail]
  );

  return result.rows[0] || null;
}

async function deleteFileRecord(id) {
  const result = await query(
    `DELETE FROM files
     WHERE id = $1
     RETURNING id, title, description, subject, course, semester, unit_label, page_count, is_featured, price, file_url, storage_path, thumbnail, created_at`,
    [id]
  );

  return result.rows[0] || null;
}

module.exports = {
  createFileRecord,
  listFiles,
  getAllFiles,
  getFileById,
  updateFileRecord,
  deleteFileRecord
};
