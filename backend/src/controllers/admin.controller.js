const createError = require("http-errors");

const { getBucketName, getPublicFileUrl, getSupabaseClient } = require("../config/storage");
const { createFileRecord, deleteFileRecord, getAllFiles, getFileById, updateFileRecord } = require("../services/files.service");
const { getSalesAnalytics } = require("../services/purchases.service");
const { asyncHandler } = require("../utils/async-handler");
const { requireBoolean, requireOptionalInteger, requireString } = require("../utils/validators");
const { buildStoragePath } = require("../utils/storage");

function parseFileInput(body) {
  return {
    title: requireString(body.title),
    description: requireString(body.description),
    subject: requireString(body.subject),
    course: requireString(body.course),
    semester: requireString(body.semester),
    unitLabel: requireString(body.unitLabel),
    thumbnail: requireString(body.thumbnail) || null,
    pageCount: requireOptionalInteger(body.pageCount),
    isFeatured: requireBoolean(body.isFeatured),
    price: Number(body.price)
  };
}

exports.uploadFile = asyncHandler(async (req, res) => {
  const input = parseFileInput(req.body);

  if (!input.title || Number.isNaN(input.price) || input.price < 0) {
    throw createError(400, "Title and a valid non-negative price are required.");
  }

  if (!req.file) {
    throw createError(400, "A PDF file is required.");
  }

  const storagePath = buildStoragePath(req.file.originalname);
  const supabase = getSupabaseClient();
  const bucketName = getBucketName();

  const { error: uploadError } = await supabase.storage.from(bucketName).upload(storagePath, req.file.buffer, {
    contentType: req.file.mimetype,
    upsert: false
  });

  if (uploadError) {
    throw createError(500, `File upload failed: ${uploadError.message}`);
  }

  const fileUrl = getPublicFileUrl(storagePath);
  const fileRecord = await createFileRecord({
    ...input,
    fileUrl,
    storagePath
  });

  res.status(201).json({
    success: true,
    message: "File uploaded successfully.",
    data: {
      file: fileRecord
    }
  });
});

exports.updateFile = asyncHandler(async (req, res) => {
  const existingFile = await getFileById(req.params.id);

  if (!existingFile) {
    throw createError(404, "File not found.");
  }

  const input = parseFileInput(req.body);

  if (!input.title || Number.isNaN(input.price) || input.price < 0) {
    throw createError(400, "Title and a valid non-negative price are required.");
  }

  const updatedFile = await updateFileRecord(req.params.id, input);

  res.status(200).json({
    success: true,
    message: "File updated successfully.",
    data: {
      file: updatedFile
    }
  });
});

exports.deleteFile = asyncHandler(async (req, res) => {
  const file = await getFileById(req.params.id);

  if (!file) {
    throw createError(404, "File not found.");
  }

  const supabase = getSupabaseClient();
  const bucketName = getBucketName();

  if (file.storage_path) {
    const { error: deleteError } = await supabase.storage.from(bucketName).remove([file.storage_path]);

    if (deleteError) {
      throw createError(500, `File deletion failed: ${deleteError.message}`);
    }
  }

  await deleteFileRecord(req.params.id);

  res.status(200).json({
    success: true,
    message: "File deleted successfully."
  });
});

exports.getUsers = asyncHandler(async (req, res) => {
  res.status(501).json({
    success: false,
    message: "User management will be implemented in a later admin step."
  });
});

exports.getSales = asyncHandler(async (req, res) => {
  const files = await getAllFiles();
  const featuredProducts = files.filter((file) => file.is_featured).length;
  const subjects = new Set(files.map((file) => file.subject).filter(Boolean)).size;
  const analytics = await getSalesAnalytics();

  res.status(200).json({
    success: true,
    data: {
      totalFiles: files.length,
      featuredProducts,
      subjectCount: subjects,
      totalPurchases: Number(analytics.total_purchases || 0),
      totalRevenue: Number(analytics.total_revenue || 0),
      uniqueBuyers: Number(analytics.unique_buyers || 0),
      topProducts: analytics.topProducts || [],
      recentPurchases: analytics.recentPurchases || []
    }
  });
});
