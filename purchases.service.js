const crypto = require("crypto");

/**
 * Derives a deterministic 12-character alphanumeric password for a given
 * user+file combination. The same inputs always produce the same password,
 * so it never needs to be stored — just re-derived on demand.
 *
 * Format: XXXX-XXXX-XXXX  (12 uppercase chars split into groups of 4)
 */
function deriveDownloadPassword(userId, fileId) {
  const secret = process.env.JWT_SECRET || "development-secret";
  const raw = crypto
    .createHmac("sha256", secret)
    .update(`dl:${userId}:${fileId}`)
    .digest("base64")
    .replace(/[^A-Z0-9]/gi, "")
    .toUpperCase()
    .slice(0, 12)
    .padEnd(12, "X"); // safety: ensure always 12 chars

  // Format as XXXX-XXXX-XXXX for readability
  return `${raw.slice(0, 4)}-${raw.slice(4, 8)}-${raw.slice(8, 12)}`;
}

module.exports = { deriveDownloadPassword };
