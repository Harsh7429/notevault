const createError = require("http-errors");

const { asyncHandler } = require("../utils/async-handler");
const { requireString, validateEmail } = require("../utils/validators");
const {
  createSession,
  createUser,
  deleteSessionByToken,
  findUserByEmail,
  findUserById,
  sanitizeUser,
  signToken,
  updateUserDevice,
  validateLogin
} = require("../services/auth.service");

exports.register = asyncHandler(async (req, res) => {
  const name = requireString(req.body.name);
  const email = requireString(req.body.email).toLowerCase();
  const password = requireString(req.body.password);
  const deviceId = requireString(req.body.deviceId);

  if (!name || !email || !password || !deviceId) {
    throw createError(400, "Name, email, password, and deviceId are required.");
  }

  if (!validateEmail(email)) {
    throw createError(400, "Please provide a valid email address.");
  }

  if (password.length < 8) {
    throw createError(400, "Password must be at least 8 characters long.");
  }

  const existingUser = await findUserByEmail(email);

  if (existingUser) {
    throw createError(409, "An account with this email already exists.");
  }

  const createdUser = await createUser({
    name,
    email,
    password,
    deviceId
  });
  const token = signToken(createdUser);

  await createSession({
    userId: createdUser.id,
    deviceId,
    token
  });

  res.status(201).json({
    success: true,
    message: "Registration successful.",
    data: {
      token,
      user: sanitizeUser(createdUser)
    }
  });
});

exports.login = asyncHandler(async (req, res) => {
  const email = requireString(req.body.email).toLowerCase();
  const password = requireString(req.body.password);
  const deviceId = requireString(req.body.deviceId);

  if (!email || !password || !deviceId) {
    throw createError(400, "Email, password, and deviceId are required.");
  }

  const user = await validateLogin({ email, password });
  const updatedUser = await updateUserDevice(user.id, deviceId);
  const token = signToken(updatedUser);

  await createSession({
    userId: updatedUser.id,
    deviceId,
    token
  });

  res.status(200).json({
    success: true,
    message: "Login successful.",
    data: {
      token,
      user: sanitizeUser(updatedUser)
    }
  });
});

exports.logout = asyncHandler(async (req, res) => {
  const authHeader = req.headers.authorization || "";
  const token = authHeader.startsWith("Bearer ") ? authHeader.slice(7) : null;

  if (!token) {
    throw createError(400, "Authentication token is required to logout.");
  }

  await deleteSessionByToken(token);

  res.status(200).json({
    success: true,
    message: "Logout successful."
  });
});

exports.getCurrentUser = asyncHandler(async (req, res) => {
  const user = await findUserById(req.user.id);

  if (!user) {
    throw createError(404, "User not found.");
  }

  res.status(200).json({
    success: true,
    data: {
      user: sanitizeUser(user)
    }
  });
});
