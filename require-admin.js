const express = require("express");

const { authRouter } = require("./auth.routes");
const { filesRouter } = require("./files.routes");
const { adminRouter } = require("./admin.routes");
const { purchasesRouter } = require("./purchases.routes");

const apiRouter = express.Router();

apiRouter.use(authRouter);
apiRouter.use(filesRouter);
apiRouter.use(adminRouter);
apiRouter.use(purchasesRouter);

module.exports = {
  apiRouter
};
