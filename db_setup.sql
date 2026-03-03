-- =====================================================
-- DOLCEFRAN - ESQUEMA COMPLETO DE BASE DE DATOS
-- Para Supabase (PostgreSQL + Auth + Storage)
-- =====================================================
-- Este script crea todas las tablas necesarias para la
-- tienda online de pastelería Dolcefran con políticas
-- de seguridad, índices y datos de ejemplo.
-- =====================================================

-- 1. Asegurar extensión pgcrypto para UUIDs
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- 2. Tabla de productos (catálogo)
CREATE TABLE IF NOT EXISTS products (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  description TEXT,
  price NUMERIC(10,2) NOT NULL CHECK (price >= 0),
  image_url TEXT,
  active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

COMMENT ON TABLE products IS 'Catálogo de productos de la pastelería';
COMMENT ON COLUMN products.name IS 'Nombre del producto (pastel, cupcake, etc.)';
COMMENT ON COLUMN products.price IS 'Precio en euros (máximo 10 dígitos, 2 decimales)';
COMMENT ON COLUMN products.image_url IS 'URL pública de la imagen en Supabase Storage';
COMMENT ON COLUMN products.active IS 'Si el producto está visible en el catálogo';

-- 3. Tabla de pedidos (orders) CORREGIDA
CREATE TABLE IF NOT EXISTS orders (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  customer_name TEXT NOT NULL,
  phone TEXT,
  total NUMERIC(10,2) NOT NULL CHECK (total >= 0),
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'confirmed', 'preparing', 'ready', 'delivered', 'cancelled')),
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

COMMENT ON TABLE orders IS 'Pedidos realizados por clientes';
COMMENT ON COLUMN orders.customer_name IS 'Nombre completo del cliente';
COMMENT ON COLUMN orders.phone IS 'Teléfono de contacto (con código de país)';
COMMENT ON COLUMN orders.total IS 'Total del pedido en euros';
COMMENT ON COLUMN orders.status IS 'Estado del pedido: pending, confirmed, preparing, ready, delivered, cancelled';

-- 4. Tabla de items de pedido (order_items)
CREATE TABLE IF NOT EXISTS order_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id UUID NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
  product_id UUID NOT NULL REFERENCES products(id) ON DELETE RESTRICT,
  quantity INTEGER NOT NULL CHECK (quantity > 0),
  price NUMERIC(10,2) NOT NULL CHECK (price >= 0),
  CONSTRAINT unique_order_product UNIQUE (order_id, product_id)
);

COMMENT ON TABLE order_items IS 'Productos incluidos en cada pedido';
COMMENT ON COLUMN order_items.order_id IS 'ID del pedido al que pertenece este item';
COMMENT ON COLUMN order_items.product_id IS 'ID del producto ( referencia a products )';
COMMENT ON COLUMN order_items.quantity IS 'Cantidad ordenada';
COMMENT ON COLUMN order_items.price IS 'Precio unitario al momento de la compra ( preservar historial )';

-- 5. Funciones y triggers para updated_at automático
CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger para products
CREATE TRIGGER products_updated_at BEFORE UPDATE ON products
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

-- 6. Índices para mejorar rendimiento en consultas frecuentes
CREATE INDEX IF NOT EXISTS idx_products_active ON products(active);
CREATE INDEX IF NOT EXISTS idx_products_created_at ON products(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_orders_created_at ON orders(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_orders_status ON orders(status);
CREATE INDEX IF NOT EXISTS idx_order_items_order_id ON order_items(order_id);
CREATE INDEX IF NOT EXISTS idx_order_items_product_id ON order_items(product_id);

-- 7. Políticas de Row Level Security (RLS) (desactivado por defecto)
-- Para habilitarlas, descomente las líneas correspondientes

-- ALTER TABLE products ENABLE ROW LEVEL SECURITY;
-- ALTER TABLE orders ENABLE ROW LEVEL SECURITY;
-- ALTER TABLE order_items ENABLE ROW LEVEL SECURITY;

-- Policy pública para ver productos activos
-- CREATE POLICY "Public can view active products" ON products
--   FOR SELECT USING (active = true);

-- Policy para inserción de pedidos (requiere autenticación)
-- CREATE POLICY "Authenticated users can insert orders" ON orders
--   FOR INSERT WITH CHECK (auth.role() = 'authenticated');

-- Policy para inserción de order_items
-- CREATE POLICY "Authenticated users can insert order items" ON order_items
--   FOR INSERT WITH CHECK (auth.role() = 'authenticated');

-- 8. Vista para reportes rápidos (opcional)
CREATE OR REPLACE VIEW recent_orders AS
SELECT 
  o.id,
  o.customer_name,
  o.phone,
  o.total,
  o.status,
  o.created_at,
  json_agg(
    json_build_object(
      'product_name', p.name,
      'quantity', oi.quantity,
      'price', oi.price
    )
  ) AS items
FROM orders o
LEFT JOIN order_items oi ON o.id = oi.order_id
LEFT JOIN products p ON oi.product_id = p.id
GROUP BY o.id
ORDER BY o.created_at DESC
LIMIT 100;

-- 9. Datos de ejemplo para productos (opcional)
-- Descomente esta sección si desea productos de muestra.
-- Asegúrese de tener un bucket llamado 'images' en Supabase Storage
-- y subir imágenes. Actualice image_url con URLs públicas válidas.
/*
INSERT INTO products (name, description, price, image_url, active) VALUES
  ('Tarta Chocolate Supremo', 'Tarta de chocolate negro con cobertura brillante y frutos rojos', 28.50, 'https://TU_PROYECTO.supabase.co/storage/v1/object/public/images/chocolate-cake.jpg', true),
  ('Cupcake Vainilla Clásico', 'Cupcake esponjoso de vainilla con buttercream rosado', 2.80, 'https://TU_PROYECTO.supabase.co/storage/v1/object/public/images/vanilla-cupcake.jpg', true),
  ('Cheesecake Frutos del Bosque', 'Cheesecake cremoso con coulis de frutos del bosque', 5.20, 'https://TU_PROYECTO.supabase.co/storage/v1/object/public/images/cheesecake.jpg', true),
  ('Macarons sur Mer', 'Caja de 6 macarons surtidos (limón, frambuesa, violeta)', 12.00, 'https://TU_PROYECTO.supabase.co/storage/v1/object/public/images/macarons.jpg', true),
  ('Brownie Fundido', 'Brownie de chocolate con centro derretido y helado de vainilla', 4.50, 'https://TU_PROYECTO.supabase.co/storage/v1/object/public/images/brownie.jpg', true),
  ('Palmeras de Chocolate', 'Crujientes palmeras de hojaldre con chocolate belga', 1.50, 'https://TU_PROYECTO.supabase.co/storage/v1/object/public/images/palmiers.jpg', true);
*/

-- 10. Configuraciones recomendadas
-- 1. Crear bucket llamado "images" en Supabase Storage.
-- 2. Configurar políticas del bucket:
--    - SELECT: Permitir a anyone (anon, authenticated)
--    - INSERT/UPDATE/DELETE: Solo autenticados (necesario para admin)
-- 3. Si usa RLS en tablas, crear políticas específicas.
-- 4. Configurar Auth > Providers > Email (y crear usuarios admin para el panel).
-- 5. Configurar WHATSAPP_NUMBER en index.html si desea notificaciones por WhatsApp.

-- =====================================================
-- FIN DEL SCRIPT
-- =====================================================
