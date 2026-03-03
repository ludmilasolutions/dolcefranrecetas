-- SQL migrations for Dolcefran
CREATE TABLE products (
  id SERIAL PRIMARY KEY,
  name TEXT NOT NULL,
  description TEXT,
  price NUMERIC(10,2) NOT NULL,
  image_url TEXT
);

CREATE TABLE orders (
  id SERIAL PRIMARY KEY,
  name TEXT NOT NULL,
  phone TEXT,
  total NUMERIC(10,2) NOT NULL,
  created_at TIMESTAMP DEFAULT NOW()
);
