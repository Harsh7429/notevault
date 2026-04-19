const jwt = require("jsonwebtoken");

const { getJwtSecret } = require("../config/env");
const { getSessionByToken } = require("../services/auth.service");

exports.authenticate = async (req, res, next) => {
  const authHeader = req.headers.authorization || "";
  const token = authHeader.startsWith("Bearer ") ? authHeader.slice(7) : null;

  if (!token) {
    return res.status(401).json({
      success: false,
      message: "Authentication token is required."
    });
  }

  let decoded;

  try {
    decoded = jwt.verify(token, getJwtSecret());
  } catch (error) {
    return res.status(401).json({
      success: false,
      message: "Invalid or expired token."
    });
  }

  try {
    const session = await getSessionByToken(token);

    if (!session) {
      return res.status(401).json({
        success: false,
        message: "Session is no longer active. Please log in again."
      });
    }

    if (!decoded || Number(decoded.sub) !== Number(session.user_id) || decoded.deviceId !== session.device_id) {
      return res.status(401).json({
        success: false,
        message: "Session verification failed."
      });
    }

    req.user = {
      id: Number(decoded.sub),
      email: decoded.email,
      role: decoded.role,
      deviceId: decoded.deviceId
    };

    return next();
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: "Unable to validate session."
    });
  }
};
