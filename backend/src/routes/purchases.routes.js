const express = require("express");

const purchasesController = require("../controllers/purchases.controller");

const { authenticate } = require("../middleware/authenticate");
const { paymentLimiter } = require("../middleware/rate-limit");

const purchasesRouter = express.Router();

purchasesRouter.post("/create-order/:fileId", paymentLimiter, authenticate, purchasesController.createOrder);
purchasesRouter.post("/verify-payment", paymentLimiter, authenticate, purchasesController.verifyPayment);
purchasesRouter.post("/razorpay/webhook", purchasesController.handleWebhook);
purchasesRouter.get("/my-purchases", authenticate, purchasesController.getMyPurchases);

module.exports = {
  purchasesRouter
};
