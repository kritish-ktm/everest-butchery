-- Everest Butchery - admin auth
-- Run this AFTER schema.sql (via phpMyAdmin > Import, or mysql CLI):
--   mysql -u root -p everest_butchery < admin_auth.sql

USE everest_butchery;

-- ---------------------------------------------------------------
-- Login tokens. A row here = one active admin session.
-- ---------------------------------------------------------------
CREATE TABLE IF NOT EXISTS admin_tokens (
  id          INT AUTO_INCREMENT PRIMARY KEY,
  user_id     INT NOT NULL,
  token       VARCHAR(64) NOT NULL UNIQUE,
  expires_at  DATETIME NOT NULL,
  created_at  TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

-- ---------------------------------------------------------------
-- Default admin login. CHANGE THIS PASSWORD AFTER FIRST LOGIN.
--   email:    admin@everestbutchery.dk
--   password: ChangeMe123!
-- ---------------------------------------------------------------
INSERT INTO users (full_name, email, password_hash, role)
VALUES (
  'Admin',
  'admin@everestbutchery.dk',
  '$2y$12$nvJ4j.Nl2GC5OqkcGPY7Qu9ZQFP63EnI9PaNxU.lcKlzO6LP6TxqW',
  'admin'
)
ON DUPLICATE KEY UPDATE email = email;
