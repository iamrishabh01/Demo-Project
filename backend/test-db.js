const mysql = require('mysql2/promise');
require('dotenv').config();

async function testConnection() {
  try {
    const connection = await mysql.createConnection({
      host: process.env.DB_HOST,
      user: process.env.DB_USER,
      password: process.env.DB_PASSWORD,
      database: process.env.DB_NAME,
      port: process.env.DB_PORT,
    });

    console.log('✅ MySQL connected successfully!');
    
    const [rows] = await connection.query('SELECT NOW() as now');
    console.log('Current time from DB:', rows[0].now);
    
    await connection.end();
    process.exit(0);
  } catch (err) {
    console.error('❌ MySQL connection failed:', err.message);
    process.exit(1);
  }
}

testConnection();
