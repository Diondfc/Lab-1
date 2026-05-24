const path = require('path')
const mysql = require('mysql2/promise')
const dotenv = require('dotenv')

dotenv.config({ path: path.join(__dirname, '..', '.env') })

const DB_HOST = process.env.DB_HOST || '127.0.0.1'
const DB_PORT = Number(process.env.DB_PORT) || 3306
const DB_USER = process.env.DB_USER || 'root'
const DB_PASSWORD = process.env.DB_PASSWORD ?? ''
const DB_NAME = process.env.DB_NAME || 'ubt_library'

const pool = mysql.createPool({
  host: DB_HOST,
  port: DB_PORT,
  user: DB_USER,
  password: DB_PASSWORD,
  database: DB_NAME,
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0,
})

async function verifyConnection() {
  try {
    const conn = await pool.getConnection()
    await conn.ping()
    console.log(`Database connected successfully (${DB_HOST}:${DB_PORT}/${DB_NAME}).`)

    // Auto-migration helper for Payments integration
    try {
      const [columns] = await conn.execute(`
        SELECT COLUMN_NAME 
        FROM INFORMATION_SCHEMA.COLUMNS 
        WHERE TABLE_SCHEMA = ? AND TABLE_NAME = 'Loans'
      `, [DB_NAME]);
      
      const columnNames = columns.map(c => c.COLUMN_NAME.toLowerCase());
      
      if (!columnNames.includes('paymentstatus')) {
        console.log('Adding PaymentStatus column to Loans table...');
        await conn.execute("ALTER TABLE Loans ADD COLUMN PaymentStatus VARCHAR(32) NOT NULL DEFAULT 'Pending'");
      }
      if (!columnNames.includes('paymentamount')) {
        console.log('Adding PaymentAmount column to Loans table...');
        await conn.execute("ALTER TABLE Loans ADD COLUMN PaymentAmount DECIMAL(10, 2) NOT NULL DEFAULT 0.00");
      }
      if (!columnNames.includes('paymentmethod')) {
        console.log('Adding PaymentMethod column to Loans table...');
        await conn.execute("ALTER TABLE Loans ADD COLUMN PaymentMethod VARCHAR(64) NULL");
      }
      if (!columnNames.includes('paymentdate')) {
        console.log('Adding PaymentDate column to Loans table...');
        await conn.execute("ALTER TABLE Loans ADD COLUMN PaymentDate TIMESTAMP NULL");
      }
    } catch (migErr) {
      console.error('Auto-migration warning: Failed to check/add payment columns:', migErr.message);
    }

    conn.release()
  } catch (err) {
    console.error('Database connection failed. Check DB_HOST/DB_PORT/DB_USER/DB_PASSWORD/DB_NAME in project/server/.env')
    console.error(err.message)
  }
}

verifyConnection()

module.exports = pool
