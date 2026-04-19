const express = require("express");

const authController = require("../controllers/auth.controller");
const { authenticate } = require("../middleware/authenticate");
const { authLimiter } = require("../middleware/rate-limit");

const authRouter = express.Router();

authRouter.post("/register", authLimiter, authController.register);
authRouter.post("/login", authLimiter, authController.login);
authRouter.post("/logout", authenticate, authController.logout);
authRouter.get("/me", authenticate, authController.getCurrentUser);

module.exports = {
  authRouter
};