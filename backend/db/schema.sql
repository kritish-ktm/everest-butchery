-- Everest Butchery — database schema
-- Import this via phpMyAdmin (XAMPP) or:
--   mysql -u root -p < schema.sql

CREATE DATABASE IF NOT EXISTS everest_butchery
  CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

USE everest_butchery;

-- ---------------------------------------------------------------
-- Categories (e.g. Goat/Khasi, Buff, Chicken, Fish, Spices, Ready-to-cook)
-- ---------------------------------------------------------------
CREATE TABLE categories (
  id            INT AUTO_INCREMENT PRIMARY KEY,
  name_en       VARCHAR(100) NOT NULL,
  name_np       VARCHAR(100) DEFAULT NULL,   -- Nepali label, e.g. "खसी"
  sort_order    INT NOT NULL DEFAULT 0,
  created_at    TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- ---------------------------------------------------------------
-- Products
-- ---------------------------------------------------------------
CREATE TABLE products (
  id              INT AUTO_INCREMENT PRIMARY KEY,
  category_id     INT NOT NULL,
  name_en         VARCHAR(150) NOT NULL,
  name_np         VARCHAR(150) DEFAULT NULL,
  description     TEXT,
  unit            ENUM('kg','piece','pack') NOT NULL DEFAULT 'kg',
  price_per_unit  DECIMAL(10,2) NOT NULL,     -- DKK
  image_url       VARCHAR(255) DEFAULT NULL,
  is_halal        TINYINT(1) NOT NULL DEFAULT 1,
  in_stock        TINYINT(1) NOT NULL DEFAULT 1,
  is_visible      TINYINT(1) NOT NULL DEFAULT 1,  -- hide from customer menu without deleting
  is_featured     TINYINT(1) NOT NULL DEFAULT 0,
  created_at      TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at      TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (category_id) REFERENCES categories(id)
);

-- ---------------------------------------------------------------
-- Customers (simple — expand later with auth if needed)
-- ---------------------------------------------------------------
CREATE TABLE customers (
  id            INT AUTO_INCREMENT PRIMARY KEY,
  full_name     VARCHAR(150) NOT NULL,
  phone         VARCHAR(30) NOT NULL,
  email         VARCHAR(150) DEFAULT NULL,
  address       VARCHAR(255) DEFAULT NULL,
  postal_code   VARCHAR(10) DEFAULT NULL,
  city          VARCHAR(100) DEFAULT NULL,
  created_at    TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- ---------------------------------------------------------------
-- Orders (both online orders AND POS in-store sales use this table)
-- ---------------------------------------------------------------
CREATE TABLE orders (
  id              INT AUTO_INCREMENT PRIMARY KEY,
  order_number    VARCHAR(20) NOT NULL UNIQUE,   -- e.g. EB-20260822-0001
  source          ENUM('online','pos') NOT NULL DEFAULT 'online',
  customer_id     INT DEFAULT NULL,
  fulfillment     ENUM('pickup','delivery') NOT NULL DEFAULT 'pickup',
  status          ENUM('pending','confirmed','ready','completed','cancelled') NOT NULL DEFAULT 'pending',
  payment_method  ENUM('cash','card','mobilepay','online') DEFAULT NULL,
  payment_status  ENUM('unpaid','paid','refunded') NOT NULL DEFAULT 'unpaid',
  subtotal        DECIMAL(10,2) NOT NULL DEFAULT 0,
  delivery_fee    DECIMAL(10,2) NOT NULL DEFAULT 0,
  total           DECIMAL(10,2) NOT NULL DEFAULT 0,
  requested_time  DATETIME DEFAULT NULL,
  notes           TEXT,
  created_at      TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at      TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (customer_id) REFERENCES customers(id)
);

-- ---------------------------------------------------------------
-- Order line items
-- ---------------------------------------------------------------
CREATE TABLE order_items (
  id              INT AUTO_INCREMENT PRIMARY KEY,
  order_id        INT NOT NULL,
  product_id      INT NOT NULL,
  product_name    VARCHAR(150) NOT NULL,   -- snapshot at time of sale
  quantity        DECIMAL(10,3) NOT NULL,  -- supports 0.5 kg etc.
  unit            ENUM('kg','piece','pack') NOT NULL,
  unit_price      DECIMAL(10,2) NOT NULL,  -- snapshot at time of sale
  line_total      DECIMAL(10,2) NOT NULL,
  FOREIGN KEY (order_id) REFERENCES orders(id) ON DELETE CASCADE,
  FOREIGN KEY (product_id) REFERENCES products(id)
);

-- ---------------------------------------------------------------
-- Admin / POS users
-- ---------------------------------------------------------------
CREATE TABLE users (
  id            INT AUTO_INCREMENT PRIMARY KEY,
  full_name     VARCHAR(150) NOT NULL,
  email         VARCHAR(150) NOT NULL UNIQUE,
  password_hash VARCHAR(255) NOT NULL,
  role          ENUM('admin','staff') NOT NULL DEFAULT 'staff',
  created_at    TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- ---------------------------------------------------------------
-- Seed data
-- ---------------------------------------------------------------
INSERT INTO categories (name_en, name_np, sort_order) VALUES
  ('Goat', 'खसी', 1),
  ('Buffalo', 'भैंसी', 2),
  ('Chicken', 'कुखुरा', 3),
  ('Fish', 'माछा', 4),
  ('Spices & Pantry', 'मसला', 5),
  ('Ready to Cook', 'तयारी', 6);

INSERT INTO products (category_id, name_en, name_np, description, unit, price_per_unit, is_featured) VALUES
  (1, 'Goat Curry Cut (Bone-in)', 'खसीको मासु', 'Fresh bone-in goat, cut for curry.', 'kg', 149.00, 1),
  (1, 'Goat Boti (Boneless)', 'बोटी', 'Boneless goat cubes.', 'kg', 179.00, 0),
  (1, 'Goat Liver & Offal', 'खसीको भुँडी', 'Mixed goat offal, cleaned.', 'kg', 89.00, 0),
  (2, 'Buffalo Curry Cut', 'भैंसीको मासु', 'Fresh buffalo, bone-in, curry cut.', 'kg', 89.00, 1),
  (2, 'Buffalo Mince', 'किमा', 'Freshly minced buffalo.', 'kg', 95.00, 0),
  (3, 'Whole Chicken', 'कुखुराको मासु', 'Whole chicken, cleaned, skin-on.', 'kg', 45.00, 1),
  (3, 'Chicken Curry Cut', NULL, 'Cut into curry pieces, bone-in.', 'kg', 49.00, 0),
  (5, 'Timur (Sichuan Pepper)', 'टिमुर', 'Whole Nepali timur, 100g pack.', 'pack', 35.00, 0),
  (6, 'Marinated Sekuwa Skewers', 'सेकुवा', 'Ready-to-grill goat sekuwa, marinated in-house.', 'pack', 65.00, 1);
