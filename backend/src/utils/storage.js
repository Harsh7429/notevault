function buildStoragePath(originalName) {
  const safeName = originalName.replace(/[^a-zA-Z0-9._-]/g, "-").toLowerCase();
  return `files/${Date.now()}-${safeName}`;
}

module.exports = {
  buildStoragePath
};
