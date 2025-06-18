import { createClient } from "@supabase/supabase-js"

// Get environment variables
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || ""
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || ""

// Check if we're in a build environment
const isBuildTime = process.env.NODE_ENV === 'production' && !process.env.VERCEL

// Validate environment variables (only warn during build time)
if (!supabaseUrl || !supabaseAnonKey) {
  const message = "Missing Supabase environment variables. Please check your .env.local file or Vercel environment variables."
  if (isBuildTime) {
    console.warn(message)
  } else if (typeof window !== 'undefined') {
    // Only error in the browser when actually needed
    console.error(message)
  }
}

// Create a singleton instance of the Supabase client
// Use placeholder values during build time to prevent build failures
export const supabase = createClient(
  supabaseUrl || "https://placeholder.supabase.co", 
  supabaseAnonKey || "placeholder-anon-key",
  {
    auth: {
      persistSession: true,
      autoRefreshToken: true,
      detectSessionInUrl: true,
      storageKey: "wtf-circles-auth-token", // Add a specific storage key
    },
  }
)

// Helper function to check if a user is authenticated
export async function isAuthenticated() {
  // Check if we have valid environment variables
  if (!process.env.NEXT_PUBLIC_SUPABASE_URL || !process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY) {
    console.warn("Supabase not configured, running in demo mode")
    return false
  }
  
  const { data, error } = await supabase.auth.getSession()
  if (error) {
    console.error("Auth check error:", error)
    return false
  }
  return !!data.session
}

