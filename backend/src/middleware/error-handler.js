exports.errorHandler = (error, req, res, next) => {
  const statusCode = error.statusCode || 500;
  const message = error.message || "Internal server error";

  if (statusCode >= 500) {
    console.error("[error]", req.method, req.path, "→", statusCode, message);
    console.error(error.stack);
  }

  if (error.type === "entity.too.large") {
    return res.status(413).json({
      success: false,
      message: "Request body is too large."
    });
  }

  if (error.name === "MulterError") {
    return res.status(400).json({
      success: false,
      message: error.message
    });
  }

  return res.status(statusCode).json({
    success: false,
    message
  });
};