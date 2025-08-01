import { createClient } from "@supabase/supabase-js";

/**
 * SUPABASE CLIENT CONFIGURATION
 * Creates authenticated Supabase client with Clerk JWT token
 * This enables Row Level Security (RLS) based on user authentication
 */

export const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

// Create Supabase client with Clerk authentication token
// The token is passed from Clerk session for authenticated requests
const supabaseClient = async (supabaseAccessToken) => {
  const supabase = createClient(supabaseUrl, supabaseKey, {
    global: { headers: { Authorization: `Bearer ${supabaseAccessToken}` } },
  });
  // Set Supabase JWT on the client object for all subsequent requests
  // This enables RLS policies to identify the authenticated user
  return supabase;
};

export default supabaseClient;