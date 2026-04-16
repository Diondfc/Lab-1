const fs = require('fs')
const path = require('path')
const mysql = require('mysql2/promise')

require('dotenv').config({ path: path.join(__dirname, '..', '.env') })

async function main() {
  const host = process.env.DB_HOST || 'localhost'
  const port = Number(process.env.DB_PORT) || 3306
  const user = process.env.DB_USER || 'root'
  const password = process.env.DB_PASSWORD ?? ''
  const database = process.env.DB_NAME || 'ubt_library'

  const conn = await mysql.createConnection({ host, port, user, password, multipleStatements: true })
  await conn.query(`CREATE DATABASE IF NOT EXISTS \`${database}\``)
  await conn.query(`USE \`${database}\``)
  const sqlPath = path.join(__dirname, '..', 'schema.sql')
  const sql = fs.readFileSync(sqlPath, 'utf8')
  await conn.query(sql)
  await conn.end()
  console.log(`Schema applied to database "${database}" (${sqlPath}).`)
}

main().catch((err) => {
  console.error(err)
  process.exit(1)
})
