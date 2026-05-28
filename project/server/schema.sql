-- =============================================================================
-- UBT Library — full database schema
-- Matches: auth, books, loans, returns, ratings, events, bookshelf, chat
-- Run: npm run db:init   (or: node scripts/apply-schema.js)
-- =============================================================================

SET NAMES utf8mb4;
SET FOREIGN_KEY_CHECKS = 0;

-- Legacy bootstrap table (superseded by Users); safe to remove on fresh install
DROP TABLE IF EXISTS users;

-- -----------------------------------------------------------------------------
-- Users & accounts
-- -----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS Users (
  UserID INT UNSIGNED NOT NULL AUTO_INCREMENT,
  Name VARCHAR(255) NOT NULL,
  FirstName VARCHAR(120) NULL,
  LastName VARCHAR(120) NULL,
  Email VARCHAR(255) NOT NULL,
  PhoneNumber VARCHAR(32) NULL,
  EmailConfirmed TINYINT(1) NOT NULL DEFAULT 0,
  LockoutEnabled TINYINT(1) NOT NULL DEFAULT 1,
  AccessFailedCount INT UNSIGNED NOT NULL DEFAULT 0,
  Password VARCHAR(255) NOT NULL,
  PasswordHash VARCHAR(255) NOT NULL,
  Role ENUM('Admin', 'Manager', 'User/Member') NOT NULL DEFAULT 'User/Member',
  Status ENUM('Active', 'Inactive') NOT NULL DEFAULT 'Active',
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (UserID),
  UNIQUE KEY uq_users_email (Email)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS useraccount (
  UserAccountID INT UNSIGNED NOT NULL AUTO_INCREMENT,
  UserID INT UNSIGNED NOT NULL,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (UserAccountID),
  UNIQUE KEY uq_useraccount_user (UserID),
  CONSTRAINT fk_useraccount_user
    FOREIGN KEY (UserID) REFERENCES Users (UserID) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS Roles (
  RoleID INT UNSIGNED NOT NULL AUTO_INCREMENT,
  Name VARCHAR(64) NOT NULL,
  Description VARCHAR(255) NULL,
  NormalizedName VARCHAR(64) NOT NULL,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (RoleID),
  UNIQUE KEY uq_roles_name (Name),
  UNIQUE KEY uq_roles_normalized_name (NormalizedName)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

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
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS UserRoles (
  UserRoleID BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  UserID INT UNSIGNED NOT NULL,
  RoleID INT UNSIGNED NOT NULL,
  AssignedAt DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  RemovedAt DATETIME NULL,
  AssignedByUserID INT UNSIGNED NULL,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (UserRoleID),
  KEY idx_user_roles_user (UserID),
  KEY idx_user_roles_role (RoleID),
  KEY idx_user_roles_active (UserID, RemovedAt),
  CONSTRAINT fk_user_roles_user
    FOREIGN KEY (UserID) REFERENCES Users (UserID) ON DELETE CASCADE,
  CONSTRAINT fk_user_roles_role
    FOREIGN KEY (RoleID) REFERENCES Roles (RoleID),
  CONSTRAINT fk_user_roles_assigned_by
    FOREIGN KEY (AssignedByUserID) REFERENCES Users (UserID) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

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
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS UserClaims (
  UserClaimID BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  UserID INT UNSIGNED NOT NULL,
  ClaimType VARCHAR(128) NOT NULL,
  ClaimValue VARCHAR(512) NOT NULL,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (UserClaimID),
  KEY idx_user_claims_user (UserID),
  CONSTRAINT fk_user_claims_user FOREIGN KEY (UserID) REFERENCES Users (UserID) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS UserTokens (
  UserTokenID BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  UserID INT UNSIGNED NOT NULL,
  LoginProvider VARCHAR(128) NOT NULL,
  Name VARCHAR(128) NOT NULL,
  Value TEXT NOT NULL,
  ExpiresAt DATETIME NULL,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (UserTokenID),
  KEY idx_user_tokens_user (UserID),
  UNIQUE KEY uq_user_tokens_provider_name (UserID, LoginProvider, Name),
  CONSTRAINT fk_user_tokens_user FOREIGN KEY (UserID) REFERENCES Users (UserID) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- -----------------------------------------------------------------------------
-- Catalog: categories, books
-- -----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS Categories (
  CategoryID INT UNSIGNED NOT NULL AUTO_INCREMENT,
  CategoryName VARCHAR(64) NOT NULL,
  PRIMARY KEY (CategoryID),
  UNIQUE KEY uq_category_name (CategoryName)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS SubCategories (
  SubCategoryID INT UNSIGNED NOT NULL AUTO_INCREMENT,
  CategoryID INT UNSIGNED NOT NULL,
  SubCategoryName VARCHAR(64) NOT NULL,
  PRIMARY KEY (SubCategoryID),
  UNIQUE KEY uq_subcategory (CategoryID, SubCategoryName),
  CONSTRAINT fk_subcategories_category
    FOREIGN KEY (CategoryID) REFERENCES Categories (CategoryID) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS Authors (
  AuthorID INT UNSIGNED NOT NULL AUTO_INCREMENT,
  Name VARCHAR(255) NOT NULL,
  Bio TEXT NULL,
  PRIMARY KEY (AuthorID),
  UNIQUE KEY uq_authors_name (Name)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS Publishers (
  PublisherID INT UNSIGNED NOT NULL AUTO_INCREMENT,
  Name VARCHAR(255) NOT NULL,
  PRIMARY KEY (PublisherID),
  UNIQUE KEY uq_publishers_name (Name)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS Members (
  MemberID INT UNSIGNED NOT NULL AUTO_INCREMENT,
  UserID INT UNSIGNED NOT NULL,
  MembershipCode VARCHAR(64) NOT NULL,
  IsActive TINYINT(1) NOT NULL DEFAULT 1,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (MemberID),
  UNIQUE KEY uq_members_user (UserID),
  UNIQUE KEY uq_members_code (MembershipCode),
  CONSTRAINT fk_members_user FOREIGN KEY (UserID) REFERENCES Users (UserID) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS Books (
  BookID INT UNSIGNED NOT NULL AUTO_INCREMENT,
  ISBN VARCHAR(32) NOT NULL,
  Title VARCHAR(512) NOT NULL,
  Author VARCHAR(255) NOT NULL,
  AuthorID INT UNSIGNED NULL,
  Publisher VARCHAR(255) NULL,
  PublisherID INT UNSIGNED NULL,
  YearOfPublishment SMALLINT UNSIGNED NULL,
  AvailabilityStatus VARCHAR(32) NOT NULL DEFAULT 'Available',
  CategoryID INT UNSIGNED NOT NULL,
  SubCategoryID INT UNSIGNED NULL,
  Rating DECIMAL(3, 2) NOT NULL DEFAULT 0.00,
  CoverImagePath VARCHAR(512) NULL,
  Description TEXT NULL,
  Quantity INT UNSIGNED NOT NULL DEFAULT 1,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (BookID),
  KEY idx_books_category (CategoryID),
  KEY idx_books_subcategory (SubCategoryID),
  KEY idx_books_isbn (ISBN),
  KEY idx_books_author (AuthorID),
  KEY idx_books_publisher (PublisherID),
  CONSTRAINT fk_books_category
    FOREIGN KEY (CategoryID) REFERENCES Categories (CategoryID),
  CONSTRAINT fk_books_subcategory
    FOREIGN KEY (SubCategoryID) REFERENCES SubCategories (SubCategoryID) ON DELETE SET NULL,
  CONSTRAINT fk_books_author FOREIGN KEY (AuthorID) REFERENCES Authors (AuthorID) ON DELETE SET NULL,
  CONSTRAINT fk_books_publisher FOREIGN KEY (PublisherID) REFERENCES Publishers (PublisherID) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Book ratings (used by /api/ratings and book average updates)
CREATE TABLE IF NOT EXISTS ratings (
  id INT UNSIGNED NOT NULL AUTO_INCREMENT,
  book_id INT UNSIGNED NOT NULL,
  user_id INT UNSIGNED NOT NULL,
  rating_value TINYINT UNSIGNED NOT NULL,
  comment TEXT NULL,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  KEY idx_ratings_book (book_id),
  KEY idx_ratings_user (user_id),
  CONSTRAINT fk_ratings_book
    FOREIGN KEY (book_id) REFERENCES Books (BookID) ON DELETE CASCADE,
  CONSTRAINT fk_ratings_user
    FOREIGN KEY (user_id) REFERENCES Users (UserID) ON DELETE CASCADE,
  CONSTRAINT chk_rating_value CHECK (rating_value BETWEEN 1 AND 5)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- -----------------------------------------------------------------------------
-- Loans & returns
-- -----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS Loans (
  LoanID INT UNSIGNED NOT NULL AUTO_INCREMENT,
  BookID INT UNSIGNED NOT NULL,
  BookTitle VARCHAR(512) NOT NULL,
  UserID INT UNSIGNED NOT NULL,
  MemberID INT UNSIGNED NOT NULL,
  UserName VARCHAR(255) NOT NULL,
  StartDate DATE NOT NULL,
  DueDate DATE NOT NULL,
  PaymentStatus VARCHAR(32) NOT NULL DEFAULT 'Pending',
  PaymentAmount DECIMAL(10, 2) NOT NULL DEFAULT 0.00,
  PaymentMethod VARCHAR(64) NULL,
  PaymentDate TIMESTAMP NULL,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (LoanID),
  KEY idx_loans_book (BookID),
  KEY idx_loans_user (UserID),
  KEY idx_loans_member (MemberID),
  KEY idx_loans_due (DueDate),
  CONSTRAINT fk_loans_book
    FOREIGN KEY (BookID) REFERENCES Books (BookID),
  CONSTRAINT fk_loans_user
    FOREIGN KEY (UserID) REFERENCES Users (UserID),
  CONSTRAINT fk_loans_member
    FOREIGN KEY (MemberID) REFERENCES Members (MemberID)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS ReturnLoans (
  ReturnID INT UNSIGNED NOT NULL AUTO_INCREMENT,
  LoanID INT UNSIGNED NOT NULL,
  BookID INT UNSIGNED NOT NULL,
  UserID INT UNSIGNED NOT NULL,
  ReturnDate DATE NOT NULL,
  Conditions VARCHAR(64) NOT NULL,
  Notes TEXT NULL,
  FineAmount DECIMAL(10, 2) NOT NULL DEFAULT 0.00,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (ReturnID),
  UNIQUE KEY uq_return_loan (LoanID),
  KEY idx_returns_user (UserID),
  CONSTRAINT fk_returns_loan
    FOREIGN KEY (LoanID) REFERENCES Loans (LoanID) ON DELETE CASCADE,
  CONSTRAINT fk_returns_book
    FOREIGN KEY (BookID) REFERENCES Books (BookID),
  CONSTRAINT fk_returns_user
    FOREIGN KEY (UserID) REFERENCES Users (UserID)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

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
  UNIQUE KEY uq_fines_loan (LoanID),
  KEY idx_fines_user_status (UserID, Status),
  CONSTRAINT fk_fines_return
    FOREIGN KEY (ReturnID) REFERENCES ReturnLoans (ReturnID) ON DELETE CASCADE,
  CONSTRAINT fk_fines_loan
    FOREIGN KEY (LoanID) REFERENCES Loans (LoanID) ON DELETE CASCADE,
  CONSTRAINT fk_fines_user
    FOREIGN KEY (UserID) REFERENCES Users (UserID)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- -----------------------------------------------------------------------------
-- Extended library entities
-- -----------------------------------------------------------------------------


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
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

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
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- -----------------------------------------------------------------------------
-- Events
-- -----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS EventLocations (
  LocationID INT UNSIGNED NOT NULL AUTO_INCREMENT,
  Name VARCHAR(255) NOT NULL,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (LocationID),
  UNIQUE KEY uq_event_location_name (Name)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS Events (
  EventID INT UNSIGNED NOT NULL AUTO_INCREMENT,
  Title VARCHAR(255) NOT NULL,
  Date DATE NOT NULL,
  Time TIME NOT NULL,
  LocationID INT UNSIGNED NOT NULL,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (EventID),
  KEY idx_events_date (Date),
  CONSTRAINT fk_events_location
    FOREIGN KEY (LocationID) REFERENCES EventLocations (LocationID)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- -----------------------------------------------------------------------------
-- Personal bookshelf (virtual shelf per user)
-- -----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS Bookshelf (
  BookshelfID INT UNSIGNED NOT NULL AUTO_INCREMENT,
  UserID INT UNSIGNED NOT NULL,
  Title VARCHAR(255) NOT NULL,
  SpineColor VARCHAR(32) NOT NULL DEFAULT '#2e7ad2',
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (BookshelfID),
  KEY idx_bookshelf_user (UserID),
  CONSTRAINT fk_bookshelf_user
    FOREIGN KEY (UserID) REFERENCES Users (UserID) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- -----------------------------------------------------------------------------
-- Bookclub chatrooms
-- -----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS Messages (
  id INT UNSIGNED NOT NULL AUTO_INCREMENT,
  room VARCHAR(64) NOT NULL,
  user_id INT UNSIGNED NOT NULL,
  username VARCHAR(255) NOT NULL,
  content TEXT NOT NULL,
  replyTo INT UNSIGNED NULL,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  KEY idx_messages_room (room),
  KEY idx_messages_user (user_id),
  CONSTRAINT fk_messages_user
    FOREIGN KEY (user_id) REFERENCES Users (UserID) ON DELETE CASCADE,
  CONSTRAINT fk_messages_reply
    FOREIGN KEY (replyTo) REFERENCES Messages (id) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS BookRequests (
  id INT UNSIGNED NOT NULL AUTO_INCREMENT,
  user_id INT UNSIGNED NOT NULL,
  username VARCHAR(255) NOT NULL,
  book_title VARCHAR(255) NOT NULL,
  book_author VARCHAR(255) NULL,
  room VARCHAR(64) NOT NULL,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  KEY idx_requests_room (room),
  KEY idx_requests_user (user_id),
  CONSTRAINT fk_requests_user
    FOREIGN KEY (user_id) REFERENCES Users (UserID) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

SET FOREIGN_KEY_CHECKS = 1;

-- =============================================================================
-- Seed data (reference data + sample locations)
-- =============================================================================


INSERT IGNORE INTO Roles (RoleID, Name, Description, NormalizedName) VALUES
  (1, 'Admin', 'Full system administrator', 'ADMIN'),
  (2, 'Manager', 'Library manager/staff user', 'MANAGER'),
  (3, 'User/Member', 'Regular library member', 'USER_MEMBER');

INSERT IGNORE INTO Categories (CategoryID, CategoryName) VALUES
  (1, 'Academic'),
  (2, 'Journal'),
  (3, 'Novel');

INSERT IGNORE INTO SubCategories (SubCategoryID, CategoryID, SubCategoryName) VALUES
  (1, 3, 'History'),
  (2, 3, 'Romance'),
  (3, 3, 'Mystery'),
  (4, 3, 'Fiction');

INSERT IGNORE INTO EventLocations (LocationID, Name) VALUES
  (1, 'Main Library Hall'),
  (2, 'Conference Room'),
  (3, 'Reading Lounge'),
  (4, 'Auditorium');

-- Default admin — email: admin@ubt.edu  password: Admin123!
INSERT IGNORE INTO Users (UserID, Name, FirstName, LastName, Email, Password, PasswordHash, Role) VALUES
  (
    1,
    'Library Admin',
    'Library',
    'Admin',
    'admin@ubt.edu',
    '$2b$10$Do9sT.sHC6EzfBF2f7XxM.fU2GA4HUA9h7Ha0o7brFRr2fyjGIBaS',
    '$2b$10$Do9sT.sHC6EzfBF2f7XxM.fU2GA4HUA9h7Ha0o7brFRr2fyjGIBaS',
    'Admin'
  );

INSERT IGNORE INTO useraccount (UserID) VALUES (1);
INSERT IGNORE INTO UserRoles (UserID, RoleID, AssignedAt)
SELECT 1, RoleID, NOW() FROM Roles WHERE Name = 'Admin';

INSERT INTO UserRoleHistory (UserID, Role, StartedAt)
SELECT u.UserID, u.Role, u.created_at
FROM Users u
WHERE NOT EXISTS (
  SELECT 1 FROM UserRoleHistory h WHERE h.UserID = u.UserID
);

INSERT INTO UserRoles (UserID, RoleID, AssignedAt)
SELECT u.UserID, r.RoleID, u.created_at
FROM Users u
JOIN Roles r ON r.Name = u.Role
WHERE NOT EXISTS (
  SELECT 1 FROM UserRoles ur WHERE ur.UserID = u.UserID AND ur.RoleID = r.RoleID AND ur.RemovedAt IS NULL
);

-- Sample catalog (IDs 1–8 align with the demo client catalog for easier testing)
INSERT IGNORE INTO Books (
  BookID, ISBN, Title, Author, Publisher, YearOfPublishment,
  AvailabilityStatus, CategoryID, SubCategoryID, Rating, Quantity, Description
) VALUES
  (1, '978-0000000001', 'The Computer Science Book', 'Thomas Johnson', 'UBT Press', 2020,
   'Available', 1, NULL, 4.60, 3,
   'A wide-angle introduction to computer science—how programs represent information, how algorithms solve problems, and how all the pieces fit together for newcomers.'),
  (2, '978-0000000002', 'The Nature of Code', 'Daniel Shiffman', 'Processing Foundation', 2012,
   'Available', 3, 4, 4.90, 2,
   'Builds simulations and visual sketches by borrowing ideas from physics and biology—excellent if you learn by coding motion, forces, and systems.'),
  (3, '978-0000000003', 'Structure and Interpretation of Computer Programs', 'Harold Abelson, Gerald Jay Sussman, and Julie Sussman', 'MIT Press', 1996,
   'Available', 2, NULL, 4.80, 2,
   'The influential SICP curriculum: programs as symbolic expressions, abstraction, recursion, and interpreters.'),
  (4, '978-0000000004', 'Introduction to Java Programming', 'K. Somasundaram', 'UBT Press', 2018,
   'Available', 1, NULL, 4.40, 4,
   'A practical path through Java syntax, object-oriented design, and core APIs, with exercises aimed at students.'),
  (5, '978-0000000005', 'The Code Book', 'Simon Singh', 'Anchor', 1999,
   'Available', 2, NULL, 4.70, 2,
   'A popular history of cryptography—from ancient ciphers to Enigma and public-key crypto.'),
  (6, '978-0000000006', 'Algorithms', 'Robert Sedgewick and Kevin Wayne', 'Addison-Wesley', 2011,
   'Available', 1, NULL, 4.80, 3,
   'Algorithms and data structures with clear explanations and code, aligned with the Princeton treatment.'),
  (7, '978-0000000007', 'Computer Science: An Interdisciplinary Approach', 'Robert Sedgewick and Kevin Wayne', 'Addison-Wesley', 2016,
   'Available', 1, NULL, 4.70, 2,
   'Programming, scientific computation, and data—connecting code to math, science, and real datasets.'),
  (8, '978-0000000008', 'Clean Code', 'Robert C. Martin', 'Prentice Hall', 2008,
   'Available', 3, 4, 4.50, 3,
   'Software craftsmanship through naming, small functions, error handling, and refactoring patterns.');

INSERT IGNORE INTO Events (EventID, Title, Date, Time, LocationID) VALUES
  (1, 'Author Meet & Greet', '2026-05-15', '14:00:00', 1),
  (2, 'Reading Workshop', '2026-05-22', '10:30:00', 2),
  (3, 'Book Fair', '2026-06-05', '16:00:00', 3);
