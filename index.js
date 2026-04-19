const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const createError = require("http-errors");

const { query } = require("../config/db");
const { getJwtExpiresIn, getJwtSecret } = require("../config/env");

function sanitizeUser(user) {
  return {
    id: user.id,
    name: user.name,
    email: user.email,
    role: user.role,
    deviceId: user.device_id,
    createdAt: user.created_at
  };
}

async function findUserByEmail(email) {
  const result = await query(
    `SELECT id, name, email, password_hash, role, device_id, created_at
     FROM users
     WHERE email = $1`,
    [email.toLowerCase()]
  );

  return result.rows[0] || null;
}

async function findUserById(id) {
  const result = await query(
    `SELECT id, name, email, password_hash, role, device_id, created_at
     FROM users
     WHERE id = $1`,
    [id]
  );

  return result.rows[0] || null;
}

async function createUser({ name, email, password, passwordHash, role = "user", deviceId = null }) {
  const resolvedPasswordHash = passwordHash || (await bcrypt.hash(password, 12));

  const result = await query(
    `INSERT INTO users (name, email, password_hash, role, device_id)
     VALUES ($1, $2, $3, $4, $5)
     RETURNING id, name, email, role, device_id, created_at`,
    [name.trim(), email.toLowerCase(), resolvedPasswordHash, role, deviceId]
  );

  return result.rows[0];
}

function signToken(user) {
  return jwt.sign(
    {
      sub: user.id,
      email: user.email,
      role: user.role,
      deviceId: user.device_id
    },
    getJwtSecret(),
    {
      expiresIn: getJwtExpiresIn()
    }
  );
}

async function createSession({ userId, deviceId, token }) {
  await query("DELETE FROM sessions WHERE user_id = $1", [userId]);

  const result = await query(
    `INSERT INTO sessions (user_id, device_id, token)
     VALUES ($1, $2, $3)
     RETURNING id, user_id, device_id, token, created_at`,
    [userId, deviceId, token]
  );

  return result.rows[0];
}

async function getSessionByToken(token) {
  const result = await query(
    `SELECT id, user_id, device_id, token, created_at
     FROM sessions
     WHERE token = $1`,
    [token]
  );

  return result.rows[0] || null;
}

async function deleteSessionsByUserId(userId) {
  await query("DELETE FROM sessions WHERE user_id = $1", [userId]);
}

async function deleteSessionByToken(token) {
  await query("DELETE FROM sessions WHERE token = $1", [token]);
}

async function updateUserDevice(userId, deviceId) {
  const result = await query(
    `UPDATE users
     SET device_id = $2
     WHERE id = $1
     RETURNING id, name, email, password_hash, role, device_id, created_at`,
    [userId, deviceId]
  );

  return result.rows[0] || null;
}

async function validateLogin({ email, password }) {
  const user = await findUserByEmail(email);

  if (!user) {
    throw createError(401, "Invalid email or password.");
  }

  const isPasswordValid = await bcrypt.compare(password, user.password_hash);

  if (!isPasswordValid) {
    throw createError(401, "Invalid email or password.");
  }

  return user;
}

module.exports = {
  sanitizeUser,
  findUserByEmail,
  findUserById,
  createUser,
  signToken,
  createSession,
  getSessionByToken,
  deleteSessionsByUserId,
  deleteSessionByToken,
  updateUserDevice,
  validateLogin
};
