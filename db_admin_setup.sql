-- Tabla de administradores
CREATE TABLE IF NOT EXISTS admins (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email TEXT UNIQUE NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Insertar usuario admin
INSERT INTO admins (id, email) VALUES 
  ('b923a30f-9282-4460-8196-f372374330eb', 'ludmila@gmail.com')
ON CONFLICT (email) DO NOTHING;

-- Función para verificar si es admin
CREATE OR REPLACE FUNCTION is_admin(user_id UUID)
RETURNS BOOLEAN AS $$
  SELECT EXISTS(SELECT 1 FROM admins WHERE id = user_id);
$$ LANGUAGE sql SECURITY DEFINER;
