const { Pool } = require("pg");

let pool;

function getPool() {
  if (!pool) {
    pool = new Pool({
      connectionString: process.env.DATABASE_URL
    });
  }

  return pool;
}

async function query(text, params) {
  const activePool = getPool();
  return activePool.query(text, params);
}

module.exports = {
  getPool,
  query
};
