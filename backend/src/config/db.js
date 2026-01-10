const mysql = require('mysql2/promise');
require('dotenv').config();

const pool = mysql.createPool({
  host: process.env.DB_HOST || 'localhost',
  user: process.env.DB_USER || 'root',
  password: process.env.DB_PASS || '',
  database: process.env.DB_NAME || 'gamevault',
  port: parseInt(process.env.DB_PORT) || 3308,
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0,
  enableKeepAlive: true,
  keepAliveInitialDelay: 0
});

// Test connection on startup
pool.getConnection()
  .then(connection => {
    console.log('✅ Database connected successfully');
    console.log(`   Host: ${process.env.DB_HOST || 'localhost'}`);
    console.log(`   Database: ${process.env.DB_NAME || 'gamevault'}`);
    console.log(`   Port: ${process.env.DB_PORT || 3306}`);
    connection.release();
  })
  .catch(err => {
    console.error('❌ Database connection failed:');
    console.error('Error Code:', err.code);
    console.error('Error Message:', err.message);
    console.error('Error Details:', err);
    console.error('\n📋 Current Configuration:');
    console.error(`   Host: ${process.env.DB_HOST || 'localhost'}`);
    console.error(`   User: ${process.env.DB_USER || 'root'}`);
    console.error(`   Database: ${process.env.DB_NAME || 'gamevault'}`);
    console.error(`   Port: ${process.env.DB_PORT || 3306}`);
    console.error('\n⚠️ Please check:');
    console.error('1. MySQL service is running (check in Services)');
    console.error('2. Port number is correct (check in MySQL Workbench)');
    console.error('3. Database "gamevault" exists');
    console.error('4. User "root" has no password or password is correct');
  });

module.exports = pool;
