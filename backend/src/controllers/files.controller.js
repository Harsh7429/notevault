const createError = require("http-errors");
const fs          = require("fs");
const os          = require("os");
const path        = require("path");
const { execFile } = require("child_process");
const { promisify } = require("util");

const execFileAsync = promisify(execFile);

// @cantoo/pdf-lib supports AES-256 PDF encryption (unlike the vanilla pdf-lib).
// Required at the top so missing-module errors surface at startup, not at download time.
const { PDFDocument } = require("@cantoo/pdf-lib");

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
    file_url:    file.file_url,   // needed for PDF page-1 thumbnail rendering
    created_at:  file.created_at,
    // NOTE: download_password and storage_path are intentionally omitted
  };
}

// ── Public routes ─────────────────────────────────────────────────────────────

exports.getFiles = asyncHandler(async (req, res) => {
  const page    = Math.max(1, Number(req.query.page  || 1));
  // Default 20, max 100. The frontend fetchAllFiles sends limit=50 to paginate efficiently.
  const limit   = Math.min(100, Math.max(1, Number(req.query.limit || 20)));
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

// ─────────────────────────────────────────────────────────────────────────────
// encryptPdfLossless
// ─────────────────────────────────────────────────────────────────────────────
// ROOT CAUSE of the white-background bug:
//
// The old code used @cantoo/pdf-lib's PDFDocument.load() → .save().  Although
// pdf-lib is great at *building* PDFs, its save path fully re-serialises every
// object in the document.  In particular it defaults to:
//   • useObjectStreams: true  — repacks indirect objects into compressed object
//     streams, breaking references inside resource dictionaries (ColorSpace,
//     ExtGState, Pattern entries) that the original PDF assumed were at known
//     byte offsets.  Desktop readers (Adobe, Preview, Foxit) then cannot resolve
//     those references → they fall back to a white / default background.
//   • addDefaultPage: false  — fine, but the re-serialisation still corrupts
//     the XObject resource entries that store the green background pattern.
//
// Browser-based pdfjs is far more lenient and resolves broken xref chains by
// scanning forward through the file, so the viewer looks correct.  Adobe Reader
// and Chrome's native PDF engine are strict — the downloaded file goes white.
//
// STRATEGY (two-tier, most faithful first):
//
// 1. qpdf  — purpose-built for *lossless* PDF transformation.  It operates on
//    the raw token stream, never decodes/re-encodes content or resource streams,
//    and handles all four standard PDF encryption algorithms natively.  This is
//    the gold standard: the downloaded file is byte-for-byte identical to the
//    original everywhere except the encryption dictionary.
//    Installed on Render/Ubuntu with: apt-get install -y qpdf
//
// 2. @cantoo/pdf-lib fallback (useObjectStreams: false)  — if qpdf is not
//    available, we still use pdf-lib but force useObjectStreams: false.  This
//    writes every object on its own line with a conventional xref table,
//    preserving the reference layout and fixing the background in most cases.
//    It is NOT as faithful as qpdf for heavily structured PDFs (e.g. PDFs that
//    use Form XObjects or Patterns with nested resource dicts), but it fixes the
//    plain background-fill case reliably.
// ─────────────────────────────────────────────────────────────────────────────
async function encryptPdfLossless(inputBuffer, password) {
  // ── Tier 1: qpdf (lossless, preferred) ────────────────────────────────────
  const tmpDir = os.tmpdir();
  const inPath  = path.join(tmpDir, `nv_in_${Date.now()}_${Math.random().toString(36).slice(2)}.pdf`);
  const outPath = path.join(tmpDir, `nv_out_${Date.now()}_${Math.random().toString(36).slice(2)}.pdf`);

  try {
    await fs.promises.writeFile(inPath, inputBuffer);

    // qpdf --encrypt <user-pw> <owner-pw> 128 -- <in> <out>
    // 128-bit RC4 is the widest-compatible level (works in every reader since
    // Acrobat 5).  Use --encrypt ... 256 -- for AES-256 on newer deployments.
    await execFileAsync("qpdf", [
      "--encrypt", password, `${password}_owner`, "128",
      "--print=low",         // allow low-res printing
      "--modify=none",       // no modifications
      "--extract=n",         // no content extraction
      "--",
      inPath,
      outPath,
    ]);

    const encryptedBuffer = await fs.promises.readFile(outPath);
    return encryptedBuffer;
  } catch (qpdfErr) {
    // qpdf not installed, or unexpected error — fall through to Tier 2.
    if (qpdfErr.code !== "ENOENT") {
      // Log non-"not found" errors so they are visible in Render logs.
      console.warn("[download] qpdf error, falling back to pdf-lib:", qpdfErr.message);
    }
  } finally {
    // Clean up temp files regardless of outcome.
    for (const p of [inPath, outPath]) {
      fs.promises.unlink(p).catch(() => {});
    }
  }

  // ── Tier 2: @cantoo/pdf-lib (useObjectStreams: false) ─────────────────────
  // Disabling object streams preserves the conventional xref table and keeps
  // every resource dictionary at a stable indirect-object reference, which
  // prevents the white-background corruption seen with the default settings.
  try {
    const pdfDoc = await PDFDocument.load(inputBuffer, { ignoreEncryption: true });
    const encryptedBytes = await pdfDoc.save({
      useObjectStreams: false,   // ← the critical fix for background colour loss
      encryption: {
        userPassword:  password,
        ownerPassword: `${password}_owner`,
        permissions: {
          printing:             "lowResolution",
          modifying:            false,
          copying:              false,
          annotating:           false,
          fillingForms:         false,
          contentAccessibility: true,
          documentAssembly:     false,
        },
      },
    });
    return Buffer.from(encryptedBytes);
  } catch (libErr) {
    // Both methods failed. This can happen if the source PDF is already
    // encrypted with an unknown password. Send the original buffer rather
    // than returning a 500 — the user still gets their purchase.
    console.error("[download] pdf-lib encryption also failed, sending plain PDF:", libErr.message);
    return inputBuffer;
  }
}

/**
 * Password-protected download.
 *
 * - If the file has a download_password set by the admin → encrypt the PDF
 *   with that password before sending it.
 * - If no password is set → send the plain PDF as a regular download.
 */
exports.downloadProtectedNote = asyncHandler(async (req, res) => {
  const file = req.fileRecord;
  if (!file)              throw createError(404, "File not found.");
  if (!file.storage_path) throw createError(500, "File storage path is missing.");

  const fileBuffer = await downloadFileBuffer(file.storage_path);
  const safeTitle  = (file.title || "note").replace(/[^a-zA-Z0-9._-]/g, "-");
  const fileName   = `${safeTitle}-protected.pdf`;

  if (file.download_password) {
    const password = file.download_password;
    const encryptedBuffer = await encryptPdfLossless(fileBuffer, password);
    res.setHeader("Content-Type",        "application/pdf");
    res.setHeader("Content-Length",      encryptedBuffer.length);
    res.setHeader("Content-Disposition", `attachment; filename="${fileName}"`);
    res.setHeader("Cache-Control",       "private, no-store");
    return res.status(200).send(encryptedBuffer);
  }

  // No password — serve plain PDF
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
