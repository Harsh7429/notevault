const bcrypt = require("bcryptjs");
const crypto = require("crypto");

const { query } = require("../config/db");
const { getOtpExpiryMinutes, getOtpMaxAttempts } = require("../config/env");

function generateOtpCode() {
  return String(crypto.randomInt(100000, 1000000));
}

function generateChallengeId() {
  return crypto.randomUUID();
}

async function cleanupExpiredLoginOtps() {
  await query(
    `DELETE FROM login_otps
     WHERE expires_at < NOW()
        OR consumed_at IS NOT NULL`
  );
}

async function createLoginOtpChallenge({ userId, email, deviceId, otpCode }) {
  await cleanupExpiredLoginOtps();
  await query("DELETE FROM login_otps WHERE user_id = $1", [userId]);

  const challengeId = generateChallengeId();
  const codeHash = await bcrypt.hash(otpCode, 10);
  const expiresInMinutes = getOtpExpiryMinutes();
  const attemptsRemaining = getOtpMaxAttempts();
  const result = await query(
    `INSERT INTO login_otps (challenge_id, user_id, email, device_id, code_hash, expires_at, attempts_remaining)
     VALUES ($1, $2, $3, $4, $5, NOW() + ($6 || ' minutes')::interval, $7)
     RETURNING id, challenge_id, user_id, email, device_id, expires_at, attempts_remaining, consumed_at, created_at`,
    [challengeId, userId, email, deviceId, codeHash, String(expiresInMinutes), attemptsRemaining]
  );

  return result.rows[0] || null;
}

async function getLoginOtpChallenge(challengeId) {
  const result = await query(
    `SELECT id, challenge_id, user_id, email, device_id, code_hash, expires_at, attempts_remaining, consumed_at, created_at
     FROM login_otps
     WHERE challenge_id = $1`,
    [challengeId]
  );

  return result.rows[0] || null;
}

async function decrementOtpAttempts(challengeId) {
  const result = await query(
    `UPDATE login_otps
     SET attempts_remaining = GREATEST(attempts_remaining - 1, 0)
     WHERE challenge_id = $1
     RETURNING id, challenge_id, user_id, email, device_id, code_hash, expires_at, attempts_remaining, consumed_at, created_at`,
    [challengeId]
  );

  return result.rows[0] || null;
}

async function consumeOtpChallenge(challengeId) {
  const result = await query(
    `UPDATE login_otps
     SET consumed_at = NOW()
     WHERE challenge_id = $1
     RETURNING id, challenge_id, user_id, email, device_id, code_hash, expires_at, attempts_remaining, consumed_at, created_at`,
    [challengeId]
  );

  return result.rows[0] || null;
}

async function verifyLoginOtpChallenge({ challengeId, otpCode, deviceId }) {
  const challenge = await getLoginOtpChallenge(challengeId);

  if (!challenge) {
    return {
      valid: false,
      reason: "challenge_missing"
    };
  }

  if (challenge.consumed_at) {
    return {
      valid: false,
      reason: "challenge_consumed"
    };
  }

  if (new Date(challenge.expires_at).getTime() < Date.now()) {
    return {
      valid: false,
      reason: "challenge_expired"
    };
  }

  if (challenge.device_id !== deviceId) {
    return {
      valid: false,
      reason: "device_mismatch"
    };
  }

  if (challenge.attempts_remaining <= 0) {
    return {
      valid: false,
      reason: "attempts_exhausted"
    };
  }

  const isValid = await bcrypt.compare(otpCode, challenge.code_hash);

  if (!isValid) {
    const updatedChallenge = await decrementOtpAttempts(challengeId);

    return {
      valid: false,
      reason: "invalid_code",
      attemptsRemaining: updatedChallenge?.attempts_remaining ?? 0
    };
  }

  await consumeOtpChallenge(challengeId);

  return {
    valid: true,
    challenge
  };
}

module.exports = {
  generateOtpCode,
  createLoginOtpChallenge,
  verifyLoginOtpChallenge
};
