-- Migration: add optional per-file download password
-- Run this once against your production database.
-- The column is nullable; existing rows get NULL which means "no password protection".

ALTER TABLE files
  ADD COLUMN IF NOT EXISTS download_password TEXT;

COMMENT ON COLUMN files.download_password IS
  'Optional plaintext password set by admin. When present, downloaded PDFs are
   encrypted with this password and buyers see it in the download modal.
   NULL means the download is served as a plain (unencrypted) PDF.';
