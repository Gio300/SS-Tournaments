import { createClient, SupabaseClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL ?? '';
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ?? '';

export const supabase: SupabaseClient = createClient(supabaseUrl, supabaseAnonKey);
export const isSupabaseConfigured = Boolean(supabaseUrl && supabaseAnonKey);

export interface CommunityPost {
  id: string;
  display_name: string;
  body: string;
  created_at: string;
  parent_id: string | null;
  locked?: boolean;
}
