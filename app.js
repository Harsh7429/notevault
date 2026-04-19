const createError = require("http-errors");

const { getFileById } = require("../services/files.service");
const { findPurchaseByUserAndFile } = require("../services/purchases.service");

function requirePurchase({ allowAdmin = true } = {}) {
  return async function purchaseGuard(req, res, next) {
    const fileId = Number(req.params.id || req.params.noteId || req.body.fileId || req.query.fileId);

    if (Number.isNaN(fileId) || fileId <= 0) {
      return next(createError(400, "A valid note id is required."));
    }

    const file = await getFileById(fileId);

    if (!file) {
      return next(createError(404, "File not found."));
    }

    if (allowAdmin && req.user?.role === "admin") {
      req.fileRecord = file;
      return next();
    }

    const purchase = await findPurchaseByUserAndFile(req.user.id, fileId);

    if (!purchase) {
      return next(createError(403, "You must purchase this file before viewing it."));
    }

    req.fileRecord = file;
    req.purchaseRecord = purchase;
    return next();
  };
}

module.exports = {
  requirePurchase
};
