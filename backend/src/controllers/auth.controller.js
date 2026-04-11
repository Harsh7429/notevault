const createError = require("http-errors");

const { asyncHandler } = require("../utils/async-handler");
const { requireString, validateEmail } = require("../utils/validators");
const { getOtpExpiryMinutes, isEmailConfigured } = require("../config/env");
const {
  createLoginOtpChallenge,
  createRegistrationOtpChallenge,
  generateOtpCode,
  verifyLoginOtpChallenge,
  verifyRegistrationOtpChallenge
} = require("../services/login-otp.service");
const { sendLoginOtpEmail, sendRegistrationOtpEmail } = require("../services/mailer.service");
const {
  createSession,
  createUser,
  deleteSessionsByUserId,
  deleteSessionByToken,
  findUserByEmail,
  findUserById,
  sanitizeUser,
  signToken,
  updateUserDevice,
  validateLogin
} = require("../services/auth.service");

function maskEmail(email) {
  const [name, domain] = String(email || "").split("@");

  if (!name || !domain) {
    return email;
  }

  const visible = name.slice(0, 2);
  const hidden = "*".repeat(Math.max(name.length - visible.length, 1));

  return `${visible}${hidden}@${domain}`;
}

function validateRegistrationInput({ name, email, password, deviceId }) {
  if (!name || !email || !password || !deviceId) {
    throw createError(400, "Name, email, password, and deviceId are required.");
  }

  if (!validateEmail(email)) {
    throw createError(400, "Please provide a valid email address.");
  }

  if (password.length < 8) {
    throw createError(400, "Password must be at least 8 characters long.");
  }

  if (!/[A-Z]/.test(password) || !/[a-z]/.test(password) || !/\d/.test(password)) {
    throw createError(400, "Password must include at least one uppercase letter, one lowercase letter, and one number.");
  }
}

exports.register = asyncHandler(async (req, res) => {
  const name = requireString(req.body.name);
  const email = requireString(req.body.email).toLowerCase();
  const password = requireString(req.body.password);
  const deviceId = requireString(req.body.deviceId);

  validateRegistrationInput({ name, email, password, deviceId });

  if (!isEmailConfigured()) {
    throw createError(503, "Registration OTP email delivery is not configured yet.");
  }

  const existingUser = await findUserByEmail(email);

  if (existingUser) {
    throw createError(409, "An account with this email already exists.");
  }

  const otpCode = generateOtpCode();
  const challenge = await createRegistrationOtpChallenge({
    name,
    email,
    password,
    deviceId,
    otpCode
  });

  await sendRegistrationOtpEmail({
    to: email,
    name,
    otpCode,
    expiresInMinutes: getOtpExpiryMinutes(),
    deviceId
  });

  res.status(200).json({
    success: true,
    message: "Registration OTP sent to your email.",
    data: {
      challengeId: challenge.challenge_id,
      maskedEmail: maskEmail(email),
      expiresInMinutes: getOtpExpiryMinutes()
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

  if (!isEmailConfigured()) {
    throw createError(503, "Login OTP email delivery is not configured yet.");
  }

  const user = await validateLogin({ email, password });
  const otpCode = generateOtpCode();
  const challenge = await createLoginOtpChallenge({
    userId: user.id,
    email: user.email,
    deviceId,
    otpCode
  });

  await sendLoginOtpEmail({
    to: user.email,
    name: user.name,
    otpCode,
    expiresInMinutes: getOtpExpiryMinutes(),
    deviceId
  });

  res.status(200).json({
    success: true,
    message: "OTP sent to your email.",
    data: {
      challengeId: challenge.challenge_id,
      maskedEmail: maskEmail(user.email),
      expiresInMinutes: getOtpExpiryMinutes()
    }
  });
});

exports.verifyLoginOtp = asyncHandler(async (req, res) => {
  const challengeId = requireString(req.body.challengeId);
  const otpCode = requireString(req.body.otpCode);
  const deviceId = requireString(req.body.deviceId);

  if (!challengeId || !otpCode || !deviceId) {
    throw createError(400, "challengeId, otpCode, and deviceId are required.");
  }

  if (!/^\d{6}$/.test(otpCode)) {
    throw createError(400, "OTP must be a 6-digit code.");
  }

  const result = await verifyLoginOtpChallenge({
    challengeId,
    otpCode,
    deviceId
  });

  if (!result.valid) {
    if (result.reason === "invalid_code") {
      throw createError(401, `Invalid OTP. ${result.attemptsRemaining} attempt(s) remaining.`);
    }

    if (result.reason === "device_mismatch") {
      throw createError(401, "This OTP was requested for a different device.");
    }

    if (result.reason === "challenge_expired") {
      throw createError(401, "This OTP has expired. Please log in again.");
    }

    if (result.reason === "attempts_exhausted") {
      throw createError(401, "Too many invalid OTP attempts. Please log in again.");
    }

    throw createError(401, "This login challenge is no longer valid. Please log in again.");
  }

  const user = await findUserById(result.challenge.user_id);

  if (!user) {
    throw createError(404, "User not found.");
  }

  await deleteSessionsByUserId(user.id);

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

exports.verifyRegistrationOtp = asyncHandler(async (req, res) => {
  const challengeId = requireString(req.body.challengeId);
  const otpCode = requireString(req.body.otpCode);
  const deviceId = requireString(req.body.deviceId);

  if (!challengeId || !otpCode || !deviceId) {
    throw createError(400, "challengeId, otpCode, and deviceId are required.");
  }

  if (!/^\d{6}$/.test(otpCode)) {
    throw createError(400, "OTP must be a 6-digit code.");
  }

  const result = await verifyRegistrationOtpChallenge({
    challengeId,
    otpCode,
    deviceId
  });

  if (!result.valid) {
    if (result.reason === "invalid_code") {
      throw createError(401, `Invalid OTP. ${result.attemptsRemaining} attempt(s) remaining.`);
    }

    if (result.reason === "device_mismatch") {
      throw createError(401, "This OTP was requested for a different device.");
    }

    if (result.reason === "challenge_expired") {
      throw createError(401, "This OTP has expired. Please register again.");
    }

    if (result.reason === "attempts_exhausted") {
      throw createError(401, "Too many invalid OTP attempts. Please register again.");
    }

    throw createError(401, "This registration challenge is no longer valid. Please register again.");
  }

  const existingUser = await findUserByEmail(result.challenge.email);

  if (existingUser) {
    throw createError(409, "An account with this email already exists. Please log in instead.");
  }

  const createdUser = await createUser({
    name: result.challenge.name,
    email: result.challenge.email,
    passwordHash: result.challenge.password_hash,
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
