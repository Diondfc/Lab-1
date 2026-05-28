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
      const columnExists = async (tableName, columnName) => {
        const [rows] = await conn.execute(
          `SELECT COLUMN_NAME
           FROM INFORMATION_SCHEMA.COLUMNS
           WHERE TABLE_SCHEMA = ? AND TABLE_NAME = ? AND COLUMN_NAME = ?`,
          [DB_NAME, tableName, columnName],
        )
        return rows.length > 0
      }

      const tableExists = async (tableName) => {
        const [rows] = await conn.execute(
          `SELECT TABLE_NAME
           FROM INFORMATION_SCHEMA.TABLES
           WHERE TABLE_SCHEMA = ? AND TABLE_NAME = ?`,
          [DB_NAME, tableName],
        )
        return rows.length > 0
      }

      const tryExecute = async (sql, params = []) => {
        try {
          await conn.execute(sql, params)
        } catch (error) {
          if (
            !/Duplicate|already exists|Can't DROP|check that column\/key exists/i.test(error.message)
          ) {
            throw error
          }
        }
      }

      if (!(await columnExists('Users', 'PhoneNumber'))) {
        await conn.execute('ALTER TABLE Users ADD COLUMN PhoneNumber VARCHAR(32) NULL AFTER Password')
      }
      if (!(await columnExists('Users', 'EmailConfirmed'))) {
        await conn.execute('ALTER TABLE Users ADD COLUMN EmailConfirmed TINYINT(1) NOT NULL DEFAULT 0 AFTER PhoneNumber')
      }
      if (!(await columnExists('Users', 'LockoutEnabled'))) {
        await conn.execute('ALTER TABLE Users ADD COLUMN LockoutEnabled TINYINT(1) NOT NULL DEFAULT 0 AFTER EmailConfirmed')
      }
      if (!(await columnExists('Users', 'AccessFailedCount'))) {
        await conn.execute('ALTER TABLE Users ADD COLUMN AccessFailedCount INT UNSIGNED NOT NULL DEFAULT 0 AFTER LockoutEnabled')
      }

      await conn.execute(`
        CREATE TABLE IF NOT EXISTS Roles (
          RoleID INT UNSIGNED NOT NULL AUTO_INCREMENT,
          Name VARCHAR(64) NOT NULL,
          Description VARCHAR(255) NULL,
          NormalizedName VARCHAR(64) NOT NULL,
          created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
          PRIMARY KEY (RoleID),
          UNIQUE KEY uq_roles_name (Name),
          UNIQUE KEY uq_roles_normalized (NormalizedName)
        ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
      `)

      await conn.execute(`
        INSERT IGNORE INTO Roles (Name, Description, NormalizedName) VALUES
          ('Admin', 'Full system access', 'ADMIN'),
          ('Manager', 'Manages core library operations', 'MANAGER'),
          ('User/Member', 'Limited member access', 'USER/MEMBER')
      `)

      await conn.execute(`
        CREATE TABLE IF NOT EXISTS UserClaims (
          UserClaimID BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
          UserID INT UNSIGNED NOT NULL,
          ClaimType VARCHAR(128) NOT NULL,
          ClaimValue VARCHAR(255) NOT NULL,
          created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
          PRIMARY KEY (UserClaimID),
          KEY idx_user_claims_user (UserID),
          CONSTRAINT fk_user_claims_user
            FOREIGN KEY (UserID) REFERENCES Users (UserID) ON DELETE CASCADE
        ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
      `)

      await conn.execute(`
        CREATE TABLE IF NOT EXISTS UserTokens (
          UserTokenID BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
          UserID INT UNSIGNED NOT NULL,
          LoginProvider VARCHAR(128) NOT NULL,
          TokenName VARCHAR(128) NOT NULL,
          TokenValue TEXT NOT NULL,
          created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
          PRIMARY KEY (UserTokenID),
          UNIQUE KEY uq_user_tokens (UserID, LoginProvider, TokenName),
          CONSTRAINT fk_user_tokens_user
            FOREIGN KEY (UserID) REFERENCES Users (UserID) ON DELETE CASCADE
        ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
      `)

      if ((await tableExists('UserRoles')) && !(await columnExists('UserRoles', 'RoleID'))) {
        await conn.execute('ALTER TABLE UserRoles ADD COLUMN RoleID INT UNSIGNED NULL AFTER UserID')
      }

      if (await tableExists('UserRoles')) {
        await conn.execute(`
          UPDATE UserRoles ur
          JOIN Roles r ON r.Name = ur.Role
          SET ur.RoleID = r.RoleID
          WHERE ur.RoleID IS NULL
        `)
        await tryExecute('ALTER TABLE UserRoles ADD CONSTRAINT fk_user_roles_role FOREIGN KEY (RoleID) REFERENCES Roles (RoleID) ON DELETE SET NULL')
      }
    } catch (identityMigErr) {
      console.error('Auto-migration warning: Failed to create identity tables:', identityMigErr.message)
    }

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
      const columnExists = async (tableName, columnName) => {
        const [rows] = await conn.execute(
          `SELECT COLUMN_NAME
           FROM INFORMATION_SCHEMA.COLUMNS
           WHERE TABLE_SCHEMA = ? AND TABLE_NAME = ? AND COLUMN_NAME = ?`,
          [DB_NAME, tableName, columnName],
        )
        return rows.length > 0
      }

      const tryExecute = async (sql, params = []) => {
        try {
          await conn.execute(sql, params)
        } catch (error) {
          if (
            !/Duplicate|already exists|Can't DROP|check that column\/key exists/i.test(error.message)
          ) {
            throw error
          }
        }
      }

      await conn.execute(`
        CREATE TABLE IF NOT EXISTS Authors (
          AuthorID INT UNSIGNED NOT NULL AUTO_INCREMENT,
          Name VARCHAR(255) NOT NULL,
          Bio TEXT NULL,
          PRIMARY KEY (AuthorID),
          UNIQUE KEY uq_authors_name (Name)
        ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
      `)

      await conn.execute(`
        CREATE TABLE IF NOT EXISTS Publishers (
          PublisherID INT UNSIGNED NOT NULL AUTO_INCREMENT,
          Name VARCHAR(255) NOT NULL,
          PRIMARY KEY (PublisherID),
          UNIQUE KEY uq_publishers_name (Name)
        ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
      `)

      await conn.execute(`
        CREATE TABLE IF NOT EXISTS Members (
          MemberID INT UNSIGNED NOT NULL AUTO_INCREMENT,
          UserID INT UNSIGNED NOT NULL,
          MembershipCode VARCHAR(64) NOT NULL,
          IsActive TINYINT(1) NOT NULL DEFAULT 1,
          created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
          PRIMARY KEY (MemberID),
          UNIQUE KEY uq_members_user (UserID),
          UNIQUE KEY uq_members_code (MembershipCode),
          CONSTRAINT fk_members_user
            FOREIGN KEY (UserID) REFERENCES Users (UserID) ON DELETE CASCADE
        ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
      `)

      await conn.execute(`
        INSERT IGNORE INTO Authors (Name)
        SELECT DISTINCT Author FROM Books
        WHERE Author IS NOT NULL AND Author <> ''
      `)

      await conn.execute(`
        INSERT IGNORE INTO Publishers (Name)
        SELECT DISTINCT Publisher FROM Books
        WHERE Publisher IS NOT NULL AND Publisher <> ''
      `)

      await conn.execute(`
        INSERT IGNORE INTO Members (UserID, MembershipCode, IsActive)
        SELECT UserID, CONCAT('MEM-', UserID), 1
        FROM Users
      `)

      if (!(await columnExists('Books', 'AuthorID'))) {
        await conn.execute('ALTER TABLE Books ADD COLUMN AuthorID INT UNSIGNED NULL AFTER Author')
      }
      if (!(await columnExists('Books', 'PublisherID'))) {
        await conn.execute('ALTER TABLE Books ADD COLUMN PublisherID INT UNSIGNED NULL AFTER Publisher')
      }
      if (!(await columnExists('Loans', 'MemberID'))) {
        await conn.execute('ALTER TABLE Loans ADD COLUMN MemberID INT UNSIGNED NULL AFTER UserID')
      }
      if (!(await columnExists('ratings', 'MemberID'))) {
        await conn.execute('ALTER TABLE ratings ADD COLUMN MemberID INT UNSIGNED NULL AFTER user_id')
      }

      await conn.execute(`
        UPDATE Books b
        LEFT JOIN Authors a ON a.Name = b.Author
        SET b.AuthorID = a.AuthorID
        WHERE b.AuthorID IS NULL
      `)

      await conn.execute(`
        UPDATE Books b
        LEFT JOIN Publishers p ON p.Name = b.Publisher
        SET b.PublisherID = p.PublisherID
        WHERE b.PublisherID IS NULL
      `)

      await conn.execute(`
        UPDATE Loans l
        JOIN Members m ON m.UserID = l.UserID
        SET l.MemberID = m.MemberID
        WHERE l.MemberID IS NULL
      `)

      await conn.execute(`
        UPDATE ratings r
        JOIN Members m ON m.UserID = r.user_id
        SET r.MemberID = m.MemberID
        WHERE r.MemberID IS NULL
      `)

      await tryExecute('ALTER TABLE Books ADD CONSTRAINT fk_books_author FOREIGN KEY (AuthorID) REFERENCES Authors (AuthorID) ON DELETE SET NULL')
      await tryExecute('ALTER TABLE Books ADD CONSTRAINT fk_books_publisher FOREIGN KEY (PublisherID) REFERENCES Publishers (PublisherID) ON DELETE SET NULL')
      await tryExecute('ALTER TABLE Loans ADD CONSTRAINT fk_loans_member FOREIGN KEY (MemberID) REFERENCES Members (MemberID) ON DELETE SET NULL')
      await tryExecute('ALTER TABLE ratings ADD CONSTRAINT fk_ratings_member FOREIGN KEY (MemberID) REFERENCES Members (MemberID) ON DELETE SET NULL')
      await tryExecute('ALTER TABLE Fines ADD UNIQUE KEY uq_fines_loan (LoanID)')

      await conn.execute(`
        CREATE TABLE IF NOT EXISTS Reservations (
          ReservationID INT UNSIGNED NOT NULL AUTO_INCREMENT,
          BookID INT UNSIGNED NOT NULL,
          MemberID INT UNSIGNED NOT NULL,
          ReservedAt DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
          ExpiresAt DATETIME NULL,
          Status ENUM('Active','Fulfilled','Cancelled','Expired') NOT NULL DEFAULT 'Active',
          created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
          PRIMARY KEY (ReservationID),
          KEY idx_res_book (BookID),
          KEY idx_res_member (MemberID),
          CONSTRAINT fk_res_book FOREIGN KEY (BookID) REFERENCES Books (BookID) ON DELETE CASCADE,
          CONSTRAINT fk_res_member FOREIGN KEY (MemberID) REFERENCES Members (MemberID) ON DELETE CASCADE
        ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
      `)

      await conn.execute(`
        CREATE TABLE IF NOT EXISTS BookReviews (
          ReviewID INT UNSIGNED NOT NULL AUTO_INCREMENT,
          BookID INT UNSIGNED NOT NULL,
          MemberID INT UNSIGNED NOT NULL,
          Rating TINYINT UNSIGNED NOT NULL,
          ReviewText TEXT NULL,
          created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
          updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
          PRIMARY KEY (ReviewID),
          KEY idx_review_book (BookID),
          KEY idx_review_member (MemberID),
          CONSTRAINT fk_review_book FOREIGN KEY (BookID) REFERENCES Books (BookID) ON DELETE CASCADE,
          CONSTRAINT fk_review_member FOREIGN KEY (MemberID) REFERENCES Members (MemberID) ON DELETE CASCADE,
          CONSTRAINT chk_review_rating CHECK (Rating BETWEEN 1 AND 5)
        ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
      `)

      await conn.execute(`
        INSERT INTO BookReviews (BookID, MemberID, Rating, ReviewText, created_at)
        SELECT r.book_id, r.MemberID, r.rating_value, r.comment, r.created_at
        FROM ratings r
        WHERE r.MemberID IS NOT NULL
          AND NOT EXISTS (
            SELECT 1
            FROM BookReviews br
            WHERE br.BookID = r.book_id
              AND br.MemberID = r.MemberID
              AND br.created_at = r.created_at
          )
      `)
    } catch (relationshipMigErr) {
      console.error('Auto-migration warning: Failed to create/seed relationship entities:', relationshipMigErr.message)
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
          RoleID INT UNSIGNED NULL,
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
          CONSTRAINT fk_user_roles_role
            FOREIGN KEY (RoleID) REFERENCES Roles (RoleID) ON DELETE SET NULL,
          CONSTRAINT fk_user_roles_assigned_by
            FOREIGN KEY (AssignedByUserID) REFERENCES Users (UserID) ON DELETE SET NULL
        ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
      `)

      await conn.execute(`
        INSERT INTO UserRoles (UserID, RoleID, Role, AssignedAt)
        SELECT u.UserID, r.RoleID, u.Role, u.created_at
        FROM Users u
        LEFT JOIN Roles r ON r.Name = u.Role
        WHERE NOT EXISTS (
          SELECT 1
          FROM UserRoles ur
          WHERE ur.UserID = u.UserID AND ur.Role = u.Role AND ur.RemovedAt IS NULL
        )
      `)

      await conn.execute(`
        UPDATE UserRoles ur
        JOIN Roles r ON r.Name = ur.Role
        SET ur.RoleID = r.RoleID
        WHERE ur.RoleID IS NULL
      `)
    } catch (userRolesMigErr) {
      console.error('Auto-migration warning: Failed to create/seed user roles:', userRolesMigErr.message)
    }

    try {
      await conn.execute(`
        CREATE TABLE IF NOT EXISTS Notifications (
          NotificationID BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
          UserID INT UNSIGNED NOT NULL,
          Title VARCHAR(255) NOT NULL,
          Message TEXT NOT NULL,
          Type ENUM('loan_overdue', 'loan_due_soon', 'event_created', 'request_approved', 'manual') NOT NULL DEFAULT 'manual',
          ReferenceType VARCHAR(64) NULL,
          ReferenceID BIGINT UNSIGNED NULL,
          IsRead TINYINT(1) NOT NULL DEFAULT 0,
          CreatedAt TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
          PRIMARY KEY (NotificationID),
          UNIQUE KEY uq_notifications_reference (UserID, Type, ReferenceType, ReferenceID),
          KEY idx_notifications_user_read (UserID, IsRead, CreatedAt),
          CONSTRAINT fk_notifications_user
            FOREIGN KEY (UserID) REFERENCES Users (UserID) ON DELETE CASCADE
        ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
      `)
    } catch (notificationMigErr) {
      console.error('Auto-migration warning: Failed to create notifications:', notificationMigErr.message)
    }

    try {
      await conn.execute(`
        CREATE TABLE IF NOT EXISTS AuditLogs (
          AuditLogID BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
          ActorUserID INT UNSIGNED NULL,
          ActorEmail VARCHAR(255) NULL,
          ActorRole VARCHAR(64) NULL,
          Action VARCHAR(64) NOT NULL,
          EntityType VARCHAR(64) NOT NULL,
          EntityID BIGINT UNSIGNED NULL,
          Description VARCHAR(512) NOT NULL,
          Details JSON NULL,
          IpAddress VARCHAR(64) NULL,
          CreatedAt TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
          PRIMARY KEY (AuditLogID),
          KEY idx_audit_created (CreatedAt),
          KEY idx_audit_actor (ActorUserID),
          KEY idx_audit_entity (EntityType, EntityID),
          CONSTRAINT fk_audit_actor
            FOREIGN KEY (ActorUserID) REFERENCES Users (UserID) ON DELETE SET NULL
        ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
      `)
    } catch (auditLogMigErr) {
      console.error('Auto-migration warning: Failed to create audit logs:', auditLogMigErr.message)
    }

    try {
      const [requestColumns] = await conn.execute(`
        SELECT COLUMN_NAME
        FROM INFORMATION_SCHEMA.COLUMNS
        WHERE TABLE_SCHEMA = ? AND TABLE_NAME = 'BookRequests'
      `, [DB_NAME])
      const requestColumnNames = requestColumns.map(c => c.COLUMN_NAME.toLowerCase())

      if (!requestColumnNames.includes('status')) {
        console.log('Adding Status column to BookRequests table...')
        await conn.execute("ALTER TABLE BookRequests ADD COLUMN Status ENUM('Pending', 'Approved', 'Rejected') NOT NULL DEFAULT 'Pending' AFTER room")
      } else {
        await conn.execute("ALTER TABLE BookRequests MODIFY Status ENUM('Pending', 'Approved', 'Rejected') NOT NULL DEFAULT 'Pending'")
      }
    } catch (requestStatusMigErr) {
      console.error('Auto-migration warning: Failed to check/add request status:', requestStatusMigErr.message)
    }

    conn.release()
  } catch (err) {
    console.error('Database connection failed. Check DB_HOST/DB_PORT/DB_USER/DB_PASSWORD/DB_NAME in project/server/.env')
    console.error(err.message)
  }
}

verifyConnection()

module.exports = pool
