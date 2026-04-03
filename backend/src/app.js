const express = require("express");
const cors = require("cors");
const helmet = require("helmet");
const morgan = require("morgan");

const { apiRouter } = require("./routes");
const { notFound } = require("./middleware/not-found");
const { errorHandler } = require("./middleware/error-handler");
const { generalApiLimiter } = require("./middleware/rate-limit");

function createApp() {
  const app = express();

  app.disable("x-powered-by");

  app.use(
    cors({
      origin: process.env.FRONTEND_URL || "http://localhost:3000",
      credentials: true
    })
  );
  app.use(
    helmet({
      crossOriginResourcePolicy: false
    })
  );
  app.use(morgan(process.env.NODE_ENV === "production" ? "combined" : "dev"));
  app.use("/api/razorpay/webhook", express.raw({ type: "application/json" }));
  app.use(express.json({ limit: "10mb" }));
  app.use(express.urlencoded({ extended: true }));

  app.get("/health", (req, res) => {
    res.status(200).json({
      success: true,
      message: "NoteVault backend is healthy",
      timestamp: new Date().toISOString()
    });
  });

  app.use("/api", generalApiLimiter, apiRouter);
  app.use(notFound);
  app.use(errorHandler);

  return app;
}

module.exports = {
  createApp
};
