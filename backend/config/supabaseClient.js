// ==========================================
// Supabase SDK client initialization
// ==========================================
const { createClient } = require("@supabase/supabase-js");

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseAnonKey = process.env.SUPABASE_ANON_KEY;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  console.warn(
    "[supabase] Warning: SUPABASE_URL and SUPABASE_ANON_KEY are not set in the environment variables. " +
    "Please update your .env file with your Supabase credentials."
  );
}

// Client for general public/authenticated user context operations
const supabase = createClient(supabaseUrl || "https://placeholder.supabase.co", supabaseAnonKey || "placeholder-anon-key");

// Admin client using service role key (bypasses RLS, to be used securely inside controllers/services)
const supabaseAdmin = supabaseServiceKey
  ? createClient(supabaseUrl || "https://placeholder.supabase.co", supabaseServiceKey)
  : supabase; // Fallback to anonymous client if not specified (will respect RLS)

module.exports = { supabase, supabaseAdmin };
