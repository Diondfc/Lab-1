const path = require('path')
const mysql = require('mysql2/promise')
const dotenv = require('dotenv')
const { ROLES } = require('../lib/roles')

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
      await conn.execute(`
        CREATE TABLE IF NOT EXISTS RefreshTokens (
          RefreshTokenID BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
          UserID INT UNSIGNED NOT NULL,
          TokenHash CHAR(64) NOT NULL,
          ExpiresAt DATETIME NOT NULL,
          RevokedAt DATETIME NULL,
          ReplacedByTokenID BIGINT UNSIGNED NULL,
          created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
          PRIMARY KEY (RefreshTokenID),
          UNIQUE KEY uq_refresh_tokens_hash (TokenHash),
          KEY idx_refresh_tokens_user (UserID),
          KEY idx_refresh_tokens_expiry (ExpiresAt),
          CONSTRAINT fk_refresh_tokens_user
            FOREIGN KEY (UserID) REFERENCES Users (UserID) ON DELETE CASCADE,
          CONSTRAINT fk_refresh_tokens_replaced_by
            FOREIGN KEY (ReplacedByTokenID) REFERENCES RefreshTokens (RefreshTokenID) ON DELETE SET NULL
        ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
      `);

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

    try {
      await conn.execute(`
        CREATE TABLE IF NOT EXISTS Fines (
          FineID INT UNSIGNED NOT NULL AUTO_INCREMENT,
          ReturnID INT UNSIGNED NOT NULL,
          LoanID INT UNSIGNED NOT NULL,
          UserID INT UNSIGNED NOT NULL,
          Amount DECIMAL(10, 2) NOT NULL,
          Status ENUM('Unpaid', 'Paid', 'Waived') NOT NULL DEFAULT 'Unpaid',
          PaymentMethod VARCHAR(64) NULL,
          PaymentReference VARCHAR(128) NULL,
          PaidAt TIMESTAMP NULL,
          WaivedAt TIMESTAMP NULL,
          Notes TEXT NULL,
          created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
          updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
          PRIMARY KEY (FineID),
          UNIQUE KEY uq_fines_return (ReturnID),
          KEY idx_fines_user_status (UserID, Status),
          KEY idx_fines_loan (LoanID),
          CONSTRAINT fk_fines_return
            FOREIGN KEY (ReturnID) REFERENCES ReturnLoans (ReturnID) ON DELETE CASCADE,
          CONSTRAINT fk_fines_loan
            FOREIGN KEY (LoanID) REFERENCES Loans (LoanID) ON DELETE CASCADE,
          CONSTRAINT fk_fines_user
            FOREIGN KEY (UserID) REFERENCES Users (UserID)
        ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
      `)

      await conn.execute(`
        INSERT INTO Fines (ReturnID, LoanID, UserID, Amount, Status)
        SELECT r.ReturnID, r.LoanID, r.UserID, r.FineAmount, 'Unpaid'
        FROM ReturnLoans r
        WHERE r.FineAmount > 0
          AND NOT EXISTS (
            SELECT 1 FROM Fines f WHERE f.ReturnID = r.ReturnID
          )
      `)
    } catch (fineMigErr) {
      console.error('Auto-migration warning: Failed to create/seed fines:', fineMigErr.message)
    }

    try {
      await conn.execute("UPDATE Books SET AvailabilityStatus = 'Unavailable' WHERE AvailabilityStatus = 'Checked Out'")
    } catch (bookAvailabilityMigErr) {
      console.error('Auto-migration warning: Failed to normalize book availability:', bookAvailabilityMigErr.message)
    }

    try {
      const [userColumns] = await conn.execute(`
        SELECT COLUMN_NAME 
        FROM INFORMATION_SCHEMA.COLUMNS 
        WHERE TABLE_SCHEMA = ? AND TABLE_NAME = 'Users'
      `, [DB_NAME])
      const userColumnNames = userColumns.map(c => c.COLUMN_NAME.toLowerCase())

      if (!userColumnNames.includes('status')) {
        console.log('Adding Status column to Users table...')
        await conn.execute("ALTER TABLE Users ADD COLUMN Status ENUM('Active', 'Inactive') NOT NULL DEFAULT 'Active' AFTER Role")
      } else {
        await conn.execute("ALTER TABLE Users MODIFY Status ENUM('Active', 'Inactive') NOT NULL DEFAULT 'Active'")
      }
    } catch (statusMigErr) {
      console.error('Auto-migration warning: Failed to check/add user status:', statusMigErr.message)
    }

    try {
      await conn.execute(
        "ALTER TABLE Users MODIFY Role ENUM('Student', 'Admin', 'Librarian', 'Manager', 'User/Member') NOT NULL DEFAULT 'User/Member'"
      )
      await conn.execute('UPDATE Users SET Role = ? WHERE Role = ?', [ROLES.USER_MEMBER, 'Student'])
      await conn.execute('UPDATE Users SET Role = ? WHERE Role = ?', [ROLES.MANAGER, 'Librarian'])
      await conn.execute(
        "ALTER TABLE Users MODIFY Role ENUM('Admin', 'Manager', 'User/Member') NOT NULL DEFAULT 'User/Member'"
      )
    } catch (roleMigErr) {
      console.error('Auto-migration warning: Failed to update user roles:', roleMigErr.message)
    }

    try {
      await conn.execute(`
        CREATE TABLE IF NOT EXISTS UserRoleHistory (
          RoleHistoryID BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
          UserID INT UNSIGNED NOT NULL,
          Role ENUM('Admin', 'Manager', 'User/Member') NOT NULL,
          StartedAt DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
          EndedAt DATETIME NULL,
          ChangedByUserID INT UNSIGNED NULL,
          created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
          PRIMARY KEY (RoleHistoryID),
          KEY idx_role_history_user (UserID),
          KEY idx_role_history_active (UserID, EndedAt),
          CONSTRAINT fk_role_history_user
            FOREIGN KEY (UserID) REFERENCES Users (UserID) ON DELETE CASCADE,
          CONSTRAINT fk_role_history_changed_by
            FOREIGN KEY (ChangedByUserID) REFERENCES Users (UserID) ON DELETE SET NULL
        ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
      `)

      await conn.execute(`
        INSERT INTO UserRoleHistory (UserID, Role, StartedAt)
        SELECT u.UserID, u.Role, u.created_at
        FROM Users u
        WHERE NOT EXISTS (
          SELECT 1 FROM UserRoleHistory h WHERE h.UserID = u.UserID
        )
      `)
    } catch (roleHistoryMigErr) {
      console.error('Auto-migration warning: Failed to create/seed role history:', roleHistoryMigErr.message)
    }

    try {
      await conn.execute(`
        CREATE TABLE IF NOT EXISTS UserRoles (
          UserRoleID BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
          UserID INT UNSIGNED NOT NULL,
          Role ENUM('Admin', 'Manager', 'User/Member') NOT NULL,
          AssignedAt DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
          RemovedAt DATETIME NULL,
          AssignedByUserID INT UNSIGNED NULL,
          created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
          PRIMARY KEY (UserRoleID),
          KEY idx_user_roles_user (UserID),
          KEY idx_user_roles_active (UserID, RemovedAt),
          CONSTRAINT fk_user_roles_user
            FOREIGN KEY (UserID) REFERENCES Users (UserID) ON DELETE CASCADE,
          CONSTRAINT fk_user_roles_assigned_by
            FOREIGN KEY (AssignedByUserID) REFERENCES Users (UserID) ON DELETE SET NULL
        ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
      `)

      await conn.execute(`
        INSERT INTO UserRoles (UserID, Role, AssignedAt)
        SELECT u.UserID, u.Role, u.created_at
        FROM Users u
        WHERE NOT EXISTS (
          SELECT 1
          FROM UserRoles ur
          WHERE ur.UserID = u.UserID AND ur.Role = u.Role AND ur.RemovedAt IS NULL
        )
      `)
    } catch (userRolesMigErr) {
      console.error('Auto-migration warning: Failed to create/seed user roles:', userRolesMigErr.message)
    }

    conn.release()
  } catch (err) {
    console.error('Database connection failed. Check DB_HOST/DB_PORT/DB_USER/DB_PASSWORD/DB_NAME in project/server/.env')
    console.error(err.message)
  }
}

verifyConnection()

module.exports = pool
