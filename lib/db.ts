import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_KEY!;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

// Server-side client (with service key for full access)
export const dbAdmin = createClient(supabaseUrl, supabaseServiceKey);

// Client-side / public client (with anon key, respects RLS)
export const dbPublic = createClient(supabaseUrl, supabaseAnonKey);

// Helper to run raw SQL via Supabase's rpc
export async function query(sql: string, params?: Record<string, unknown>) {
  const { data, error } = await dbAdmin.rpc('exec_sql', { query: sql, params });
  if (error) throw error;
  return data;
}
