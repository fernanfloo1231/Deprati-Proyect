const { Pool } = require('pg');
require('dotenv').config();

const pool = new Pool({
    host: process.env.PG_HOST,
    port: process.env.PG_PORT,
    user: process.env.PG_USER,
    password: process.env.PG_PASSWORD,
    database: process.env.PG_DATABASE,
});

pool.connect()
  .then(client => {
    console.log(' Conexión exitosa a la base de datos PostgreSQL');
    client.release();
  })
  .catch(err => console.error('❌ Error al conectar a la base de datos:', err));

module.exports = pool;
