const createError = require("http-errors");

const { downloadFileBuffer, createSignedFileUrl } = require("../config/storage");
const { getFileById: getFileByIdRecord, listFiles } = require("../services/files.service");
const { asyncHandler } = require("../utils/async-handler");

function toPublicFile(file) {
  return {
    id: file.id,
    title: file.title,
    description: file.description,
    subject: file.subject,
    course: file.course,
    semester: file.semester,
    unit_label: file.unit_label,
    page_count: file.page_count,
    is_featured: file.is_featured,
    price: file.price,
    thumbnail: file.thumbnail,
    created_at: file.created_at
  };
}

exports.getFiles = asyncHandler(async (req, res) => {
  const page = Number(req.query.page || 1);
  const limit = Number(req.query.limit || 12);
  const search = String(req.query.search || "").trim();
  const subject = String(req.query.subject || "").trim();
  const result = await listFiles({ page, limit, search, subject });

  res.status(200).json({
    success: true,
    data: result.items.map(toPublicFile),
    pagination: {
      page: result.page,
      limit: result.limit,
      total: result.total,
      totalPages: result.totalPages
    }
  });
});

exports.getFileById = asyncHandler(async (req, res) => {
  const file = await getFileByIdRecord(req.params.id);

  if (!file) {
    throw createError(404, "File not found.");
  }

  res.status(200).json({
    success: true,
    data: toPublicFile(file)
  });
});

exports.getSecureFileAccess = asyncHandler(async (req, res) => {
  const file = req.fileRecord;

  if (!file) {
    throw createError(404, "File not found.");
  }

  if (!file.storage_path) {
    throw createError(500, "File storage path is missing.");
  }

  // Generate a short-lived signed URL (2 minutes). The PDF loads client-side
  // directly from Supabase — no backend memory usage, no CORS issues.
  const signedUrl = await createSignedFileUrl(file.storage_path, 120);

  res.status(200).json({
    success: true,
    data: {
      file: {
        id: file.id,
        title: file.title,
        description: file.description,
        subject: file.subject,
        course: file.course,
        semester: file.semester,
        unitLabel: file.unit_label,
        pageCount: file.page_count,
        isFeatured: file.is_featured,
        price: file.price,
        thumbnail: file.thumbnail,
        createdAt: file.created_at
      },
      viewerUrl: signedUrl,
      deliveryMode: "signed-url"
    }
  });
});

exports.streamProtectedNote = asyncHandler(async (req, res) => {
  const file = req.fileRecord;

  if (!file) {
    throw createError(404, "File not found.");
  }

  const fileBuffer = await downloadFileBuffer(file.storage_path);
  const fileName = `${file.title.replace(/[^a-zA-Z0-9._-]/g, "-") || "note"}.pdf`;

  res.setHeader("Content-Type", "application/pdf");
  res.setHeader("Content-Length", fileBuffer.length);
  res.setHeader("Content-Disposition", `inline; filename="${fileName}"`);
  res.setHeader("Cache-Control", "private, no-store, no-cache, must-revalidate");

  res.status(200).send(fileBuffer);
});
