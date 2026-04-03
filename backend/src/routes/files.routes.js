const express = require("express");

const filesController = require("../controllers/files.controller");
const { authenticate } = require("../middleware/authenticate");
const { requirePurchase } = require("../middleware/require-purchase");

const filesRouter = express.Router();

filesRouter.get("/files", filesController.getFiles);
filesRouter.get("/files/:id", filesController.getFileById);
filesRouter.get("/files/:id/access", authenticate, requirePurchase(), filesController.getSecureFileAccess);
filesRouter.get("/notes/:id/view", authenticate, requirePurchase(), filesController.streamProtectedNote);

module.exports = {
  filesRouter
};
