import { createClient } from "@supabase/supabase-js"

// Get environment variables
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || ""
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || ""

// Validate environment variables
if (!supabaseUrl || !supabaseAnonKey) {
  console.error(
    "Missing Supabase environment variables. Please check your .env.local file or Vercel environment variables.",
  )
}

// Create a singleton instance of the Supabase client
export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    persistSession: true,
    autoRefreshToken: true,
    detectSessionInUrl: true,
    storageKey: "wtf-circles-auth-token", // Add a specific storage key
  },
})

// Helper function to check if a user is authenticated
export async function isAuthenticated() {
  const { data, error } = await supabase.auth.getSession()
  if (error) {
    console.error("Auth check error:", error)
    return false
  }
  return !!data.session
}

