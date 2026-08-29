-- =====================================================================
-- Agaze / አጋዝ — MySQL schema for Plesk (phpMyAdmin import)
-- Engine: InnoDB, charset utf8mb4 (required for Amharic text)
-- Import order matters: this file is already ordered by dependency.
-- =====================================================================

SET NAMES utf8mb4;
SET FOREIGN_KEY_CHECKS = 0;

-- ---------------------------------------------------------------------
-- Users (replaces the hosted auth.users table)
-- ---------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS users (
  id             CHAR(36)     NOT NULL,
  email          VARCHAR(255) NOT NULL,
  password_hash  VARCHAR(255) NULL,           -- NULL for Google-only accounts
  google_sub     VARCHAR(255) NULL,           -- Google account subject id
  email_verified TINYINT(1)   NOT NULL DEFAULT 0,
  last_login_at  DATETIME     NULL,
  created_at     DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at     DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  UNIQUE KEY uq_users_email (email),
  UNIQUE KEY uq_users_google_sub (google_sub)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ---------------------------------------------------------------------
-- Profiles
-- ---------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS profiles (
  id                   CHAR(36) NOT NULL,
  full_name            VARCHAR(255) NULL,
  phone                VARCHAR(50)  NULL,
  city                 VARCHAR(120) NULL,
  avatar_url           TEXT NULL,
  role                 ENUM('employee','employer','broker','admin','kyc') NOT NULL DEFAULT 'employer',
  available            TINYINT(1) NOT NULL DEFAULT 1,
  must_change_password TINYINT(1) NOT NULL DEFAULT 0,
  registered_by        CHAR(36) NULL,
  registered_by_name   VARCHAR(255) NULL,
  registration_type    VARCHAR(50) NULL,
  verification_status  ENUM('pending','approved','declined') NOT NULL DEFAULT 'pending',
  verification_note    TEXT NULL,
  verified_at          DATETIME NULL,
  wallet_balance       DECIMAL(12,2) NOT NULL DEFAULT 0,
  created_at           DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at           DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  KEY idx_profiles_role (role),
  CONSTRAINT fk_profiles_user FOREIGN KEY (id) REFERENCES users(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ---------------------------------------------------------------------
-- Roles (kept in a dedicated table — never on profiles)
-- ---------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS user_roles (
  id         CHAR(36) NOT NULL,
  user_id    CHAR(36) NOT NULL,
  role       ENUM('employee','employer','broker','admin','kyc') NOT NULL,
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  UNIQUE KEY uq_user_role (user_id, role),
  CONSTRAINT fk_user_roles_user FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ---------------------------------------------------------------------
-- Applications (registration submissions)
-- ---------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS applications (
  id            CHAR(36) NOT NULL,
  user_id       CHAR(36) NOT NULL,
  full_name     VARCHAR(255) NOT NULL,
  email         VARCHAR(255) NOT NULL,
  phone         VARCHAR(50) NULL,
  role          ENUM('employee','employer','broker','admin','kyc') NOT NULL,
  city          VARCHAR(120) NULL,
  sub_city      VARCHAR(120) NULL,
  wereda        VARCHAR(120) NULL,
  kebele        VARCHAR(120) NULL,
  address       TEXT NULL,
  latitude      DECIMAL(10,7) NULL,
  longitude     DECIMAL(10,7) NULL,
  fayda_number  VARCHAR(64) NULL,
  fayda_front   TEXT NULL,
  fayda_back    TEXT NULL,
  personal_photo TEXT NULL,
  created_at    DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at    DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  KEY idx_applications_user (user_id),
  CONSTRAINT fk_applications_user FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ---------------------------------------------------------------------
-- Employee profiles
-- ---------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS employee_profiles (
  id                  CHAR(36) NOT NULL,
  user_id             CHAR(36) NOT NULL,
  application_id      CHAR(36) NOT NULL,
  fayda_number        VARCHAR(64) NOT NULL,
  sector              ENUM('house_maid','baby_sitter','cleaner','waiter','construction_worker','paint_man','plumber','electrician','barber','makeup_artist','driver','delivery_man','barista','beauty_salon_worker_men','beauty_salon_worker_women','other') NOT NULL,
  sector_other        VARCHAR(255) NULL,
  gender              ENUM('male','female','other') NULL,
  age                 INT NULL,
  experience          TEXT NULL,
  photo_url           TEXT NULL,
  id_photo_front      TEXT NULL,
  id_photo_back       TEXT NULL,
  contract_path       TEXT NULL,
  guarantor_name      VARCHAR(255) NULL,
  guarantor_phone     VARCHAR(50) NULL,
  guarantor_id_number VARCHAR(64) NULL,
  guarantor_id_photo  TEXT NULL,
  guarantor_photo     TEXT NULL,
  created_at          DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at          DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  KEY idx_employee_profiles_user (user_id),
  CONSTRAINT fk_employee_profiles_user FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
  CONSTRAINT fk_employee_profiles_application FOREIGN KEY (application_id) REFERENCES applications(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ---------------------------------------------------------------------
-- Workers (roster)
-- ---------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS workers (
  id                  CHAR(36) NOT NULL,
  owner_id            CHAR(36) NOT NULL,
  user_id             CHAR(36) NULL,
  full_name           VARCHAR(255) NOT NULL,
  email               VARCHAR(255) NULL,
  phone               VARCHAR(50) NULL,
  gender              ENUM('male','female','other') NULL,
  age                 INT NULL,
  sector              ENUM('house_maid','baby_sitter','cleaner','waiter','construction_worker','paint_man','plumber','electrician','barber','makeup_artist','driver','delivery_man','barista','beauty_salon_worker_men','beauty_salon_worker_women','other') NOT NULL,
  sector_other        VARCHAR(255) NULL,
  experience          TEXT NULL,
  price               DECIMAL(12,2) NULL,
  available           TINYINT(1) NOT NULL DEFAULT 1,
  is_public           TINYINT(1) NULL DEFAULT 1,
  global_status       VARCHAR(50) NOT NULL DEFAULT 'available',
  city                VARCHAR(120) NULL,
  sub_city            VARCHAR(120) NULL,
  wereda              VARCHAR(120) NULL,
  kebele              VARCHAR(120) NULL,
  area                VARCHAR(120) NULL,
  address             TEXT NULL,
  latitude            DECIMAL(10,7) NULL,
  longitude           DECIMAL(10,7) NULL,
  photo_url           TEXT NULL,
  contract_path       TEXT NULL,
  fayda_number        VARCHAR(64) NULL,
  fayda_front         TEXT NULL,
  fayda_back          TEXT NULL,
  fayda_verified      TINYINT(1) NULL DEFAULT 0,
  guarantor_name      VARCHAR(255) NULL,
  guarantor_phone     VARCHAR(50) NULL,
  guarantor_id_number VARCHAR(64) NULL,
  guarantor_id_photo  TEXT NULL,
  guarantor_photo     TEXT NULL,
  guarantor_verified  TINYINT(1) NULL DEFAULT 0,
  registered_by       CHAR(36) NULL,
  registered_by_name  VARCHAR(255) NULL,
  registration_type   VARCHAR(50) NULL,
  verification_status ENUM('pending','approved','declined') NOT NULL DEFAULT 'pending',
  verification_note   TEXT NULL,
  verified_at         DATETIME NULL,
  created_at          DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at          DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  KEY idx_workers_owner (owner_id),
  KEY idx_workers_sector (sector),
  KEY idx_workers_city (city),
  CONSTRAINT fk_workers_owner FOREIGN KEY (owner_id) REFERENCES users(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ---------------------------------------------------------------------
-- Broker-managed employers
-- ---------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS broker_employers (
  id                  CHAR(36) NOT NULL,
  broker_id           CHAR(36) NOT NULL,
  full_name           VARCHAR(255) NOT NULL,
  email               VARCHAR(255) NULL,
  phone               VARCHAR(50) NULL,
  city                VARCHAR(120) NULL,
  sub_city            VARCHAR(120) NULL,
  wereda              VARCHAR(120) NULL,
  kebele              VARCHAR(120) NULL,
  address             TEXT NULL,
  latitude            DECIMAL(10,7) NULL,
  longitude           DECIMAL(10,7) NULL,
  fayda_number        VARCHAR(64) NULL,
  fayda_front         TEXT NULL,
  fayda_back          TEXT NULL,
  personal_photo      TEXT NULL,
  verification_status ENUM('pending','approved','declined') NOT NULL DEFAULT 'pending',
  verification_note   TEXT NULL,
  verified_at         DATETIME NULL,
  created_at          DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at          DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  KEY idx_broker_employers_broker (broker_id),
  CONSTRAINT fk_broker_employers_broker FOREIGN KEY (broker_id) REFERENCES users(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ---------------------------------------------------------------------
-- Assignments
-- ---------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS assignments (
  id             CHAR(36) NOT NULL,
  broker_id      CHAR(36) NOT NULL,
  worker_ref     VARCHAR(64) NOT NULL,
  employer_ref   VARCHAR(64) NOT NULL,
  status         VARCHAR(50) NOT NULL DEFAULT 'pending',
  witness_name   VARCHAR(255) NOT NULL,
  witness_phone  VARCHAR(50) NOT NULL,
  witness_sex    ENUM('male','female','other') NULL,
  agreement_path TEXT NULL,
  admin_note     TEXT NULL,
  created_at     DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at     DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  KEY idx_assignments_broker (broker_id),
  CONSTRAINT fk_assignments_broker FOREIGN KEY (broker_id) REFERENCES users(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ---------------------------------------------------------------------
-- Bookings
-- ---------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS bookings (
  id             CHAR(36) NOT NULL,
  employer_id    CHAR(36) NOT NULL,
  worker_id      CHAR(36) NULL,
  worker_ref     VARCHAR(64) NULL,
  worker_name    VARCHAR(255) NULL,
  service        VARCHAR(255) NOT NULL,
  status         ENUM('pending','accepted','declined','completed','cancelled') NOT NULL DEFAULT 'pending',
  scheduled_date DATE NULL,
  hours          DECIMAL(6,2) NULL,
  price          DECIMAL(12,2) NULL,
  address        TEXT NULL,
  notes          TEXT NULL,
  admin_note     TEXT NULL,
  created_at     DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at     DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  KEY idx_bookings_employer (employer_id),
  CONSTRAINT fk_bookings_employer FOREIGN KEY (employer_id) REFERENCES users(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ---------------------------------------------------------------------
-- Employee requests
-- ---------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS employee_requests (
  id                   CHAR(36) NOT NULL,
  employer_id          CHAR(36) NOT NULL,
  employee_name        VARCHAR(255) NOT NULL,
  employee_ref         VARCHAR(64) NULL,
  sector               VARCHAR(120) NOT NULL,
  sector_answers       JSON NULL,
  status               VARCHAR(50) NOT NULL DEFAULT 'pending',
  message              TEXT NULL,
  location             VARCHAR(255) NULL,
  contact_phone        VARCHAR(50) NULL,
  duration             VARCHAR(120) NULL,
  budget               DECIMAL(12,2) NULL,
  salary               DECIMAL(12,2) NULL,
  allowances           DECIMAL(12,2) NULL,
  allowances_note      TEXT NULL,
  service_fee          DECIMAL(12,2) NULL,
  paid_at              DATETIME NULL,
  assigned_worker_id   CHAR(36) NULL,
  assigned_worker_name VARCHAR(255) NULL,
  admin_note           TEXT NULL,
  admin_response       TEXT NULL,
  created_at           DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at           DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  KEY idx_employee_requests_employer (employer_id),
  CONSTRAINT fk_employee_requests_employer FOREIGN KEY (employer_id) REFERENCES users(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ---------------------------------------------------------------------
-- Hired employees
-- ---------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS hired_employees (
  id          CHAR(36) NOT NULL,
  employer_id CHAR(36) NOT NULL,
  request_id  CHAR(36) NULL,
  worker_ref  VARCHAR(64) NULL,
  worker_name VARCHAR(255) NOT NULL,
  sector      VARCHAR(120) NULL,
  salary      DECIMAL(12,2) NULL,
  status      VARCHAR(50) NOT NULL DEFAULT 'active',
  created_at  DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at  DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  KEY idx_hired_employees_employer (employer_id),
  CONSTRAINT fk_hired_employees_employer FOREIGN KEY (employer_id) REFERENCES users(id) ON DELETE CASCADE,
  CONSTRAINT fk_hired_employees_request FOREIGN KEY (request_id) REFERENCES employee_requests(id) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ---------------------------------------------------------------------
-- Incident reports
-- ---------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS incident_reports (
  id             CHAR(36) NOT NULL,
  employer_id    CHAR(36) NOT NULL,
  hired_id       CHAR(36) NULL,
  worker_ref     VARCHAR(64) NULL,
  worker_name    VARCHAR(255) NOT NULL,
  category       VARCHAR(120) NOT NULL,
  details        JSON NULL,
  attachments    JSON NULL,
  status         VARCHAR(50) NOT NULL DEFAULT 'open',
  admin_response TEXT NULL,
  forwarded_at   DATETIME NULL,
  created_at     DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at     DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  KEY idx_incident_reports_employer (employer_id),
  CONSTRAINT fk_incident_reports_employer FOREIGN KEY (employer_id) REFERENCES users(id) ON DELETE CASCADE,
  CONSTRAINT fk_incident_reports_hired FOREIGN KEY (hired_id) REFERENCES hired_employees(id) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ---------------------------------------------------------------------
-- Termination requests
-- ---------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS termination_requests (
  id              CHAR(36) NOT NULL,
  employer_id     CHAR(36) NOT NULL,
  hired_id        CHAR(36) NULL,
  worker_ref      VARCHAR(64) NULL,
  worker_name     VARCHAR(255) NOT NULL,
  reason          VARCHAR(255) NOT NULL,
  details         TEXT NULL,
  make_available  TINYINT(1) NULL DEFAULT 1,
  status          VARCHAR(50) NOT NULL DEFAULT 'pending',
  admin_note      TEXT NULL,
  reviewed_by     CHAR(36) NULL,
  reviewed_at     DATETIME NULL,
  created_at      DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at      DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  KEY idx_termination_requests_employer (employer_id),
  CONSTRAINT fk_termination_requests_employer FOREIGN KEY (employer_id) REFERENCES users(id) ON DELETE CASCADE,
  CONSTRAINT fk_termination_requests_hired FOREIGN KEY (hired_id) REFERENCES hired_employees(id) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ---------------------------------------------------------------------
-- Worker ratings
-- ---------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS worker_ratings (
  id          CHAR(36) NOT NULL,
  employer_id CHAR(36) NOT NULL,
  hired_id    CHAR(36) NULL,
  worker_ref  VARCHAR(64) NULL,
  worker_name VARCHAR(255) NOT NULL,
  rating      TINYINT NOT NULL,
  review      TEXT NULL,
  created_at  DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at  DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  KEY idx_worker_ratings_employer (employer_id),
  CONSTRAINT fk_worker_ratings_employer FOREIGN KEY (employer_id) REFERENCES users(id) ON DELETE CASCADE,
  CONSTRAINT fk_worker_ratings_hired FOREIGN KEY (hired_id) REFERENCES hired_employees(id) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ---------------------------------------------------------------------
-- Messages / support inbox
-- ---------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS messages (
  id          CHAR(36) NOT NULL,
  sender_id   CHAR(36) NOT NULL,
  subject     VARCHAR(255) NULL,
  body        TEXT NOT NULL,
  status      VARCHAR(50) NOT NULL DEFAULT 'new',
  admin_reply TEXT NULL,
  created_at  DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at  DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  KEY idx_messages_sender (sender_id),
  CONSTRAINT fk_messages_sender FOREIGN KEY (sender_id) REFERENCES users(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ---------------------------------------------------------------------
-- Review chat (document / request review threads)
-- ---------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS review_messages (
  id                CHAR(36) NOT NULL,
  owner_id          CHAR(36) NOT NULL,
  sender_id         CHAR(36) NOT NULL,
  subject_id        VARCHAR(64) NOT NULL,
  subject_source    VARCHAR(64) NOT NULL,
  body              TEXT NOT NULL,
  from_staff        TINYINT(1) NOT NULL DEFAULT 0,
  attachment_bucket VARCHAR(120) NULL,
  attachment_path   TEXT NULL,
  attachment_name   VARCHAR(255) NULL,
  created_at        DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  KEY idx_review_messages_subject (subject_source, subject_id),
  CONSTRAINT fk_review_messages_owner FOREIGN KEY (owner_id) REFERENCES users(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ---------------------------------------------------------------------
-- Payments
-- ---------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS payments (
  id           CHAR(36) NOT NULL,
  user_id      CHAR(36) NOT NULL,
  payer_name   VARCHAR(255) NOT NULL,
  amount       DECIMAL(12,2) NOT NULL,
  purpose      VARCHAR(255) NULL,
  receipt_path TEXT NULL,
  status       VARCHAR(50) NOT NULL DEFAULT 'pending',
  reviewed_at  DATETIME NULL,
  created_at   DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at   DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  KEY idx_payments_user (user_id),
  CONSTRAINT fk_payments_user FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ---------------------------------------------------------------------
-- Wallet transactions
-- ---------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS wallet_transactions (
  id                  CHAR(36) NOT NULL,
  user_id             CHAR(36) NOT NULL,
  amount              DECIMAL(12,2) NOT NULL,
  reason              VARCHAR(255) NOT NULL,
  is_admin_adjustment TINYINT(1) NOT NULL DEFAULT 0,
  created_by          CHAR(36) NULL,
  created_at          DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  KEY idx_wallet_transactions_user (user_id),
  CONSTRAINT fk_wallet_transactions_user FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ---------------------------------------------------------------------
-- Pricing settings
-- ---------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS pricing_settings (
  `key`      VARCHAR(120) NOT NULL,
  label      VARCHAR(255) NOT NULL,
  category   VARCHAR(120) NOT NULL,
  amount     DECIMAL(12,2) NOT NULL DEFAULT 0,
  active     TINYINT(1) NOT NULL DEFAULT 1,
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`key`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ---------------------------------------------------------------------
-- Sub-admins (back-office staff)
-- ---------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS sub_admins (
  id           CHAR(36) NOT NULL,
  user_id      CHAR(36) NULL,
  full_name    VARCHAR(255) NOT NULL,
  email        VARCHAR(255) NOT NULL,
  phone        VARCHAR(50) NULL,
  sex          ENUM('male','female','other') NULL,
  age          INT NULL,
  city         VARCHAR(120) NULL,
  woreda       VARCHAR(120) NULL,
  fayda_number VARCHAR(64) NULL,
  photo_url    TEXT NULL,
  permissions  JSON NULL,
  active       TINYINT(1) NOT NULL DEFAULT 1,
  created_by   CHAR(36) NULL,
  created_at   DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at   DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  UNIQUE KEY uq_sub_admins_email (email),
  CONSTRAINT fk_sub_admins_user FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ---------------------------------------------------------------------
-- Public worker directory (view used by the browse pages)
-- ---------------------------------------------------------------------
CREATE OR REPLACE VIEW workers_public AS
SELECT id, full_name, sector, sector_other, gender, age, experience, price,
       city, sub_city, area, photo_url, available, global_status,
       verification_status, created_at
FROM workers
WHERE is_public = 1 AND verification_status = 'approved';

SET FOREIGN_KEY_CHECKS = 1;
