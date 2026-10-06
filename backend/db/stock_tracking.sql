-- Apply once to an existing MySQL installation before using stock tracking.
ALTER TABLE products
  ADD COLUMN stock_quantity DECIMAL(10,3) NULL,
  ADD COLUMN stock_reference DECIMAL(10,3) NULL,
  ADD CONSTRAINT products_stock_valid CHECK (
    (stock_quantity IS NULL AND stock_reference IS NULL)
    OR (stock_quantity IS NOT NULL AND stock_reference IS NOT NULL AND stock_quantity >= 0 AND stock_reference > 0)
  );
ALTER TABLE order_items ADD COLUMN stock_reserved DECIMAL(10,3) NOT NULL DEFAULT 0;
