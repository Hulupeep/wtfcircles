import { createClient } from '@supabase/supabase-js';

// Ensure environment variables are set
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl) {
  throw new Error("Missing environment variable: VITE_SUPABASE_URL");
}
if (!supabaseAnonKey) {
  throw new Error("Missing environment variable: VITE_SUPABASE_ANON_KEY");
}

// Create and export the Supabase client
export const supabase = createClient(supabaseUrl, supabaseAnonKey);

// Define types for board data based on the table structure
export interface Board {
  id: string; // uuid
  user_id: string; // uuid
  title?: string | null;
  content?: any | null; // jsonb - adjust 'any' if you have a specific content structure
  created_at: string; // timestamp with time zone
  updated_at: string; // timestamp with time zone
}