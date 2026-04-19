const createError = require("http-errors");

const {
  getBucketName,
  getPublicFileUrl,
  getSupabaseClient,
} = require("../config/storage");
const {
  createFileRecord,
  deleteFileRecord,
  getAllFiles,
  getFileById,
  updateFileRecord,
} = require("../services/files.service");
const { getSalesAnalytics } = require("../services/purchases.service");
const { asyncHandler } = require("../utils/async-handler");
const {
  requireBoolean,
  requireOptionalInteger,
  requireString,
} = require("../utils/validators");
const { buildStoragePath } = require("../utils/storage");

function parseFileInput(body) {
  return {
    title:           requireString(body.title),
    description:     requireString(body.description),
    subject:         requireString(body.subject),
    course:          requireString(body.course),
    semester:        requireString(body.semester),
    unitLabel:       requireString(body.unitLabel),
    thumbnail:       requireString(body.thumbnail) || null,
    pageCount:       requireOptionalInteger(body.pageCount),
    isFeatured:      requireBoolean(body.isFeatured),
    price:           Number(body.price),
    // empty string → null (no password protection)
    downloadPassword: body.downloadPassword?.trim() || null,
  };
}

// ── Upload a brand-new file ─────────────────────────────────────────────────
exports.uploadFile = asyncHandler(async (req, res) => {
  const input = parseFileInput(req.body);

  if (!input.title || Number.isNaN(input.price) || input.price < 0) {
    throw createError(400, "Title and a valid non-negative price are required.");
  }
  if (!req.file) {
    throw createError(400, "A PDF file is required.");
  }

  const storagePath = buildStoragePath(req.file.originalname);
  const supabase    = getSupabaseClient();
  const bucketName  = getBucketName();

  const { error: uploadError } = await supabase.storage
    .from(bucketName)
    .upload(storagePath, req.file.buffer, {
      contentType: req.file.mimetype,
      upsert: false,
    });

  if (uploadError) {
    throw createError(500, `File upload failed: ${uploadError.message}`);
  }

  const fileUrl    = getPublicFileUrl(storagePath);
  const fileRecord = await createFileRecord({ ...input, fileUrl, storagePath });

  res.status(201).json({
    success: true,
    message: "File uploaded successfully.",
    data: { file: fileRecord },
  });
});

// ── Edit metadata + optional PDF replacement ───────────────────────────────
exports.updateFile = asyncHandler(async (req, res) => {
  const existingFile = await getFileById(req.params.id);
  if (!existingFile) throw createError(404, "File not found.");

  const input = parseFileInput(req.body);

  if (!input.title || Number.isNaN(input.price) || input.price < 0) {
    throw createError(400, "Title and a valid non-negative price are required.");
  }

  let newFileUrl     = undefined;
  let newStoragePath = undefined;

  // ── Optional PDF replacement ──────────────────────────────────────────────
  if (req.file) {
    const supabase   = getSupabaseClient();
    const bucketName = getBucketName();

    // Delete the old file from storage first
    if (existingFile.storage_path) {
      const { error: removeError } = await supabase.storage
        .from(bucketName)
        .remove([existingFile.storage_path]);

      if (removeError) {
        // Non-fatal — log and continue; orphaned files can be cleaned up manually
        console.warn(
          `[admin] Could not remove old storage file ${existingFile.storage_path}: ${removeError.message}`
        );
      }
    }

    // Upload the replacement
    newStoragePath = buildStoragePath(req.file.originalname);
    const { error: uploadError } = await supabase.storage
      .from(bucketName)
      .upload(newStoragePath, req.file.buffer, {
        contentType: req.file.mimetype,
        upsert: false,
      });

    if (uploadError) {
      throw createError(500, `PDF replacement failed: ${uploadError.message}`);
    }

    newFileUrl = getPublicFileUrl(newStoragePath);
  }

  const updatedFile = await updateFileRecord(req.params.id, {
    ...input,
    fileUrl:     newFileUrl,
    storagePath: newStoragePath,
  });

  res.status(200).json({
    success: true,
    message: "File updated successfully.",
    data: { file: updatedFile },
  });
});

// ── Delete ─────────────────────────────────────────────────────────────────
exports.deleteFile = asyncHandler(async (req, res) => {
  const file = await getFileById(req.params.id);
  if (!file) throw createError(404, "File not found.");

  const supabase   = getSupabaseClient();
  const bucketName = getBucketName();

  if (file.storage_path) {
    const { error: deleteError } = await supabase.storage
      .from(bucketName)
      .remove([file.storage_path]);

    if (deleteError) {
      throw createError(500, `File deletion failed: ${deleteError.message}`);
    }
  }

  await deleteFileRecord(req.params.id);

  res.status(200).json({ success: true, message: "File deleted successfully." });
});

/**
 * Returns all file records including download_password — admin only.
 * The public /api/files endpoint strips this field via toPublicFile.
 */
exports.getAdminFiles = asyncHandler(async (req, res) => {
  const files = await getAllFiles();
  res.status(200).json({ success: true, data: files });
});

exports.getUsers = asyncHandler(async (req, res) => {
  res.status(501).json({
    success: false,
    message: "User management will be implemented in a later admin step.",
  });
});

exports.getSales = asyncHandler(async (req, res) => {
  const files           = await getAllFiles();
  const featuredProducts = files.filter((f) => f.is_featured).length;
  const subjects        = new Set(files.map((f) => f.subject).filter(Boolean)).size;
  const analytics       = await getSalesAnalytics();

  res.status(200).json({
    success: true,
    data: {
      totalFiles:       files.length,
      featuredProducts,
      subjectCount:     subjects,
      totalPurchases:   Number(analytics.total_purchases  || 0),
      totalRevenue:     Number(analytics.total_revenue    || 0),
      uniqueBuyers:     Number(analytics.unique_buyers    || 0),
      topProducts:      analytics.topProducts      || [],
      recentPurchases:  analytics.recentPurchases  || [],
    },
  });
});
