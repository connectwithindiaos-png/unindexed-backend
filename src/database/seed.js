const bcrypt = require('bcrypt');
const pool = require('./pool');

async function autoSeed() {
  const client = await pool.connect();
  try {
    const passwordHash = await bcrypt.hash('admin123', 12);
    await client.query(
      `INSERT INTO admins (email, password_hash) VALUES ($1, $2)
       ON CONFLICT (email) DO UPDATE SET password_hash = $2`,
      ['admin@example.com', passwordHash]
    );
    console.log('Seed completed: admin@example.com / admin123');
  } catch (err) {
    console.error('Seed failed:', err);
    throw err;
  } finally {
    client.release();
  }
}

if (require.main === module) {
  autoSeed().then(() => {
    pool.end();
  }).catch(() => {
    process.exit(1);
  });
}

module.exports = { autoSeed };