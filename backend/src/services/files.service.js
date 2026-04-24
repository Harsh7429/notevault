const { query } = require("../config/db");

const fileSelect = `SELECT id, title, description, subject, course, semester, unit_label,
       page_count, is_featured, price, file_url, storage_path, thumbnail,
       download_password, created_at
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
  thumbnail = null,
  downloadPassword = null,
}) {
  const result = await query(
    `INSERT INTO files
       (title, description, subject, course, semester, unit_label, page_count,
        is_featured, price, file_url, storage_path, thumbnail, download_password)
     VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13)
     RETURNING id, title, description, subject, course, semester, unit_label,
               page_count, is_featured, price, file_url, storage_path, thumbnail,
               download_password, created_at`,
    [
      title, description, subject, course, semester, unitLabel,
      pageCount, isFeatured, price, fileUrl, storagePath, thumbnail,
      downloadPassword || null,
    ]
  );
  return result.rows[0];
}

async function listFiles({ search = "", subject = "", page = 1, limit = 12 } = {}) {
  const filters = [];
  const values = [];

  if (search) {
    values.push(`%${search}%`);
    const ref = `$${values.length}`;
    filters.push(`(title ILIKE ${ref} OR description ILIKE ${ref} OR subject ILIKE ${ref}
      OR course ILIKE ${ref} OR semester ILIKE ${ref} OR unit_label ILIKE ${ref})`);
  }

  if (subject) {
    values.push(subject);
    filters.push(`subject = $${values.length}`);
  }

  const whereClause = filters.length ? `WHERE ${filters.join(" AND ")}` : "";
  const safePage  = Math.max(Number(page)  || 1,  1);
  const safeLimit = Math.min(Math.max(Number(limit) || 12, 1), 50);
  const offset    = (safePage - 1) * safeLimit;

  values.push(safeLimit, offset);

  const [itemsResult, countResult] = await Promise.all([
    query(
      `${fileSelect} ${whereClause} ORDER BY is_featured DESC, created_at DESC
       LIMIT $${values.length - 1} OFFSET $${values.length}`,
      values
    ),
    query(
      `SELECT COUNT(*)::int AS total FROM files ${whereClause}`,
      values.slice(0, values.length - 2)
    ),
  ]);

  const total = countResult.rows[0]?.total || 0;
  return {
    items: itemsResult.rows,
    total,
    page: safePage,
    limit: safeLimit,
    totalPages: Math.max(Math.ceil(total / safeLimit), 1),
  };
}

async function getAllFiles() {
  const result = await query(
    `${fileSelect} ORDER BY is_featured DESC, created_at DESC`
  );
  return result.rows;
}

async function getFileById(id) {
  const result = await query(`${fileSelect} WHERE id = $1`, [id]);
  return result.rows[0] || null;
}

/**
 * Update metadata (and optionally the stored file location + password).
 * fileUrl / storagePath are only passed when a replacement PDF was uploaded.
 */
async function updateFileRecord(
  id,
  {
    title, description, subject, course, semester, unitLabel,
    pageCount, isFeatured, price, thumbnail,
    downloadPassword,           // string | null | undefined
    fileUrl,                    // only set on PDF replacement
    storagePath,                // only set on PDF replacement
  }
) {
  // Build a dynamic SET clause so we only touch file_url / storage_path / thumbnail
  // when they were actually provided (avoids wiping existing values with NULL).
  const sets = [
    "title         = $2",
    "description   = $3",
    "subject       = $4",
    "course        = $5",
    "semester      = $6",
    "unit_label    = $7",
    "page_count    = $8",
    "is_featured   = $9",
    "price         = $10",
    "download_password = $11",
  ];
  const values = [
    id, title, description, subject, course, semester, unitLabel,
    pageCount, isFeatured, price,
    downloadPassword !== undefined ? (downloadPassword || null) : null,
  ];

  // Only overwrite thumbnail when a non-empty value is explicitly provided.
  // Leaving the field blank in the admin form should NOT wipe an existing thumbnail.
  if (thumbnail) {
    values.push(thumbnail);
    sets.push(`thumbnail = $${values.length}`);
  }

  if (fileUrl && storagePath) {
    values.push(fileUrl, storagePath);
    sets.push(`file_url      = $${values.length - 1}`);
    sets.push(`storage_path  = $${values.length}`);
  }

  const result = await query(
    `UPDATE files SET ${sets.join(", ")} WHERE id = $1
     RETURNING id, title, description, subject, course, semester, unit_label,
               page_count, is_featured, price, file_url, storage_path, thumbnail,
               download_password, created_at`,
    values
  );
  return result.rows[0] || null;
}

async function deleteFileRecord(id) {
  const result = await query(
    `DELETE FROM files WHERE id = $1
     RETURNING id, title, description, subject, course, semester, unit_label,
               page_count, is_featured, price, file_url, storage_path, thumbnail,
               download_password, created_at`,
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
  deleteFileRecord,
};
