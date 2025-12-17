const { Pool } = require('pg');
require('dotenv').config();

const pool = process.env.NODE_ENV === 'production'
  ? new Pool({
      connectionString: process.env.DATABASE_URL,
      ssl: { rejectUnauthorized: false }
    })
  : new Pool({
      host: process.env.PG_HOST,
      port: process.env.PG_PORT,
      user: process.env.PG_USER,
      password: process.env.PG_PASSWORD,
      database: process.env.PG_DATABASE,
    });

pool.connect()
  .then(client => {
    console.log('✅ Conectado a PostgreSQL');
    client.release();
  })
  .catch(err => console.error('❌ Error DB:', err));

module.exports = pool;
