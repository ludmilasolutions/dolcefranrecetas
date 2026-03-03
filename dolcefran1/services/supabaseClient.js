import { createClient } from '@supabase/supabase-js'

// Configure with your actual project values in a real setup
const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://xyzcompany.supabase.co'
const SUPABASE_ANON_KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 'public-anon-key'

export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY)
