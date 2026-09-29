-- Everest Butchery - menu visibility
-- Lets admin hide a product from the customer-facing menu without deleting
-- it or marking it out of stock (e.g. a seasonal item that's not ready yet).
-- Run this via phpMyAdmin > Import (after schema.sql).

USE everest_butchery;

ALTER TABLE products
  ADD COLUMN IF NOT EXISTS is_visible TINYINT(1) NOT NULL DEFAULT 1 AFTER in_stock;
