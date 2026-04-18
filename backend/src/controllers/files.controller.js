const createError = require("http-errors");

const {
  downloadFileBuffer,
  createSignedFileUrl,
} = require("../config/storage");
const {
  getFileById: getFileByIdRecord,
  listFiles,
} = require("../services/files.service");
const { asyncHandler } = require("../utils/async-handler");

// ── Helpers ──────────────────────────────────────────────────────────────────

function toPublicFile(file) {
  return {
    id:          file.id,
    title:       file.title,
    description: file.description,
    subject:     file.subject,
    course:      file.course,
    semester:    file.semester,
    unit_label:  file.unit_label,
    page_count:  file.page_count,
    is_featured: file.is_featured,
    price:       file.price,
    thumbnail:   file.thumbnail,
    created_at:  file.created_at,
    // NOTE: download_password is intentionally omitted from public listing
  };
}

// ── Public routes ─────────────────────────────────────────────────────────────

exports.getFiles = asyncHandler(async (req, res) => {
  const page    = Number(req.query.page    || 1);
  const limit   = Number(req.query.limit   || 12);
  const search  = String(req.query.search  || "").trim();
  const subject = String(req.query.subject || "").trim();
  const result  = await listFiles({ page, limit, search, subject });

  res.status(200).json({
    success: true,
    data: result.items.map(toPublicFile),
    pagination: {
      page:       result.page,
      limit:      result.limit,
      total:      result.total,
      totalPages: result.totalPages,
    },
  });
});

exports.getFileById = asyncHandler(async (req, res) => {
  const file = await getFileByIdRecord(req.params.id);
  if (!file) throw createError(404, "File not found.");

  res.status(200).json({ success: true, data: toPublicFile(file) });
});

// ── Protected routes (auth + purchase required) ───────────────────────────────

/**
 * Returns a short-lived Supabase signed URL.
 * The PDF served here is always the ORIGINAL (un-encrypted) file —
 * password protection only applies to the downloadable copy.
 */
exports.getSecureFileAccess = asyncHandler(async (req, res) => {
  const file = req.fileRecord;
  if (!file)              throw createError(404, "File not found.");
  if (!file.storage_path) throw createError(500, "File storage path is missing.");

  // 2-minute signed URL — enough time for react-pdf to fetch it
  const viewerUrl = await createSignedFileUrl(file.storage_path, 120);

  res.status(200).json({
    success: true,
    data: {
      viewerUrl,
      deliveryMode: "signed-url",
      file: {
        id:         file.id,
        title:      file.title,
        description: file.description,
        subject:    file.subject,
        course:     file.course,
        semester:   file.semester,
        unitLabel:  file.unit_label,
        pageCount:  file.page_count,
        isFeatured: file.is_featured,
        price:      file.price,
        thumbnail:  file.thumbnail,
        createdAt:  file.created_at,
      },
    },
  });
});

exports.streamProtectedNote = asyncHandler(async (req, res) => {
  const file = req.fileRecord;
  if (!file) throw createError(404, "File not found.");

  const fileBuffer = await downloadFileBuffer(file.storage_path);
  const fileName   = `${(file.title || "note").replace(/[^a-zA-Z0-9._-]/g, "-")}.pdf`;

  res.setHeader("Content-Type",        "application/pdf");
  res.setHeader("Content-Length",      fileBuffer.length);
  res.setHeader("Content-Disposition", `inline; filename="${fileName}"`);
  res.setHeader("Cache-Control",       "private, no-store, no-cache, must-revalidate");
  res.status(200).send(fileBuffer);
});

/**
 * Password-protected download.
 *
 * - If the file has a download_password set by the admin → encrypt the PDF
 *   with that password before sending it.
 * - If no password is set → send the plain PDF as a regular download.
 *   Buyers still get the file; it's just not encrypted.
 */
exports.downloadProtectedNote = asyncHandler(async (req, res) => {
  const file = req.fileRecord;
  if (!file)              throw createError(404, "File not found.");
  if (!file.storage_path) throw createError(500, "File storage path is missing.");

  const fileBuffer = await downloadFileBuffer(file.storage_path);
  const safeTitle  = (file.title || "note").replace(/[^a-zA-Z0-9._-]/g, "-");
  const fileName   = `${safeTitle}-protected.pdf`;

  // If admin set a download password, encrypt before sending
  if (file.download_password) {
    const { PDFDocument } = require("@cantoo/pdf-lib");
    const password        = file.download_password;

    const pdfDoc       = await PDFDocument.load(fileBuffer);
    const encryptedBytes = await pdfDoc.save({
      userPassword:  password,
      ownerPassword: `${password}_nv`,
    });

    res.setHeader("Content-Type",        "application/pdf");
    res.setHeader("Content-Length",      encryptedBytes.length);
    res.setHeader("Content-Disposition", `attachment; filename="${fileName}"`);
    res.setHeader("Cache-Control",       "private, no-store");
    return res.status(200).send(Buffer.from(encryptedBytes));
  }

  // No password — serve as plain download
  res.setHeader("Content-Type",        "application/pdf");
  res.setHeader("Content-Length",      fileBuffer.length);
  res.setHeader("Content-Disposition", `attachment; filename="${fileName}"`);
  res.setHeader("Cache-Control",       "private, no-store");
  res.status(200).send(fileBuffer);
});

/**
 * Returns the admin-set download password for a purchased file.
 * Returns { hasPassword: false } when no password is configured —
 * the frontend will skip showing the password step in the modal.
 */
exports.getDownloadPassword = asyncHandler(async (req, res) => {
  const file = req.fileRecord;
  if (!file) throw createError(404, "File not found.");

  if (!file.download_password) {
    return res.status(200).json({
      success: true,
      data: {
        fileId:      file.id,
        title:       file.title,
        hasPassword: false,
        password:    null,
      },
    });
  }

  res.status(200).json({
    success: true,
    data: {
      fileId:      file.id,
      title:       file.title,
      hasPassword: true,
      password:    file.download_password,
    },
  });
});
