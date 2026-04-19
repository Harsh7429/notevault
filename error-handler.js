const express = require("express");

const filesController = require("../controllers/files.controller");
const { authenticate } = require("../middleware/authenticate");
const { requirePurchase } = require("../middleware/require-purchase");

const filesRouter = express.Router();

filesRouter.get("/files", filesController.getFiles);
filesRouter.get("/files/:id", filesController.getFileById);
filesRouter.get("/files/:id/access", authenticate, requirePurchase(), filesController.getSecureFileAccess);
filesRouter.get("/notes/:id/view", authenticate, requirePurchase(), filesController.streamProtectedNote);

// Protected download: returns password-encrypted PDF as attachment
filesRouter.get("/files/:id/download", authenticate, requirePurchase(), filesController.downloadProtectedNote);

// Password reveal: returns the derived password for a purchased file (no PDF involved)
filesRouter.get("/files/:id/download-password", authenticate, requirePurchase(), filesController.getDownloadPassword);

module.exports = {
  filesRouter,
};
