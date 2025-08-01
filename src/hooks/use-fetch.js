import { useSession } from "@clerk/clerk-react";
import { useState } from "react";

/**
 * CUSTOM HOOK: useFetch
 * Provides async data fetching with loading states and error handling
 * Automatically handles Clerk authentication token injection
 * 
 * @param {Function} cb - API function to call
 * @param {Object} options - Default options for the API call
 * @returns {Object} { data, loading, error, fn } - State and function to trigger fetch
 */
const useFetch = (cb, options = {}) => {
  const [data, setData] = useState(undefined);
  const [loading, setLoading] = useState(null);
  const [error, setError] = useState(null);

  const { session } = useSession();

  // Main function to execute API calls with proper error handling
  const fn = async (...args) => {
    setLoading(true);
    setError(null);

    try {
      // Get Supabase token from Clerk session
      const supabaseAccessToken = await session.getToken({
        template: "supabase",
      });
      // Execute API function with token, options, and additional arguments
      const response = await cb(supabaseAccessToken, options, ...args);
      setData(response);
      setError(null);
    } catch (error) {
      setError(error);
    } finally {
      setLoading(false);
    }
  };

  return { data, loading, error, fn };
};

export default useFetch;