const express = require("express");

const adminController = require("../controllers/admin.controller");
const { authenticate }  = require("../middleware/authenticate");
const { requireAdmin }  = require("../middleware/require-admin");
const { upload }        = require("../middleware/upload");

const adminRouter = express.Router();

// upload.single("file") is applied to BOTH create and update so that the
// PATCH route can optionally receive a replacement PDF as multipart/form-data.
adminRouter.post(
  "/admin/upload",
  authenticate, requireAdmin,
  upload.single("file"),
  adminController.uploadFile
);

adminRouter.patch(
  "/admin/file/:id",
  authenticate, requireAdmin,
  upload.single("file"),   // file is optional on PATCH
  adminController.updateFile
);

adminRouter.delete(
  "/admin/file/:id",
  authenticate, requireAdmin,
  adminController.deleteFile
);

adminRouter.get(
  "/admin/users",
  authenticate, requireAdmin,
  adminController.getUsers
);

adminRouter.get(
  "/admin/sales",
  authenticate, requireAdmin,
  adminController.getSales
);

module.exports = { adminRouter };
