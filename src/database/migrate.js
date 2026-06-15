const fs = require('fs');
const path = require('path');
const pool = require('./pool');

async function autoMigrate() {
  const client = await pool.connect();
  try {
    const migrationsDir = path.join(__dirname, 'migrations');
    const files = fs.readdirSync(migrationsDir)
      .filter(f => f.endsWith('.sql'))
      .sort();

    for (const file of files) {
      console.log(`Running migration: ${file}`);
      const sql = fs.readFileSync(path.join(migrationsDir, file), 'utf-8');
      await client.query(sql);
      console.log(`Migration completed: ${file}`);
    }

    console.log('All migrations completed successfully');
  } catch (err) {
    console.error('Migration failed:', err);
    throw err;
  } finally {
    client.release();
  }
}

if (require.main === module) {
  autoMigrate().then(() => {
    pool.end();
  }).catch(() => {
    process.exit(1);
  });
}

module.exports = { autoMigrate };