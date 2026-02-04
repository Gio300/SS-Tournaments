import { createClient, SupabaseClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL ?? '';
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ?? '';

export const isSupabaseConfigured = Boolean(supabaseUrl && supabaseAnonKey);

// Create client with placeholder if not configured (for static export build)
// Component checks isSupabaseConfigured before using it
export const supabase: SupabaseClient = createClient(
  supabaseUrl || 'https://placeholder.supabase.co',
  supabaseAnonKey || 'placeholder-key'
);

export interface CommunityPost {
  id: string;
  display_name: string;
  body: string;
  created_at: string;
  parent_id: string | null;
  locked?: boolean;
}
