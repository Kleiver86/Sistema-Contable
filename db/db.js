const { Pool } = require('pg');
const pool = new Pool({
    user: 'postgres',
    host: 'localhost',
    database: 'contabilidad_db',
    password: '5z36x0cz',
    port: 5432,
});

module.exports = pool;