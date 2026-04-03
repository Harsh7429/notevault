exports.errorHandler = (error, req, res, next) => {
  if (process.env.NODE_ENV !== "production") {
    console.error(error);
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

  const statusCode = error.statusCode || 500;
  const message = error.message || "Internal server error";

  return res.status(statusCode).json({
    success: false,
    message
  });
};
