-- Tabla de pedidos
CREATE TABLE IF NOT EXISTS orders (
  id UUID PRIMARY KEY,
  customer_name TEXT NOT NULL,
  phone TEXT,
  address TEXT,
  notes TEXT,
  total DECIMAL(10,2),
  status TEXT DEFAULT 'pendiente',
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Tabla de items del pedido
CREATE TABLE IF NOT EXISTS order_items (
  id UUID PRIMARY KEY,
  order_id UUID REFERENCES orders(id) ON DELETE CASCADE,
  product_name TEXT,
  quantity INTEGER,
  price DECIMAL(10,2)
);

-- Habilitar RLS
ALTER TABLE orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE order_items ENABLE ROW LEVEL SECURITY;

-- Política para permitir inserción pública (solo para pedidos desde el frontend)
CREATE POLICY "Allow public insert orders" ON orders
FOR INSERT TO anon, authenticated
WITH CHECK (true);

CREATE POLICY "Allow public insert order_items" ON order_items
FOR INSERT TO anon, authenticated
WITH CHECK (true);

-- Política para permitir lectura solo a admins
CREATE POLICY "Allow read orders to admins" ON orders
FOR SELECT TO anon, authenticated
USING (
  EXISTS (SELECT 1 FROM admins WHERE admins.id = auth.uid())
);

CREATE POLICY "Allow read order_items to admins" ON order_items
FOR SELECT TO anon, authenticated
USING (
  EXISTS (SELECT 1 FROM admins WHERE admins.id = auth.uid())
);
